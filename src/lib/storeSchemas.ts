import { z } from "zod";
import {
  ThemeModeSchema,
  ThemeColorSchema,
  SerialPresetSchema,
  SavedCommandSchema,
  SerialSequenceSchema,
  ProjectContextSchema,
  SerialConfigSchema,
  NetworkConfigSchema,
  DataModeSchema,
  TextEncodingSchema,
  ChecksumAlgorithmSchema,
  ConnectionTypeSchema,
  DashboardWidgetSchema,
  FramingConfigSchema,
} from "./schemas";

// ============================================================================
// SLICE-SPECIFIC SCHEMAS
// ============================================================================

export const RightSidebarTabSchema = z.enum([
  "ai",
  "basic",
  "params",
  "processing",
  "framing",
  "context",
  "wizard",
]);

// ============================================================================
// RUNTIME-ONLY SCHEMAS (Not typically persisted)
// ============================================================================

export const LogLevelSchema = z.enum(["INFO", "WARN", "ERROR", "SUCCESS"]);

export const LogCategorySchema = z.enum([
  "CONNECTION",
  "COMMAND",
  "SYSTEM",
  "SCRIPT",
  "VALIDATION",
]);

export const SystemLogEntrySchema = z.object({
  id: z.string(),
  timestamp: z.number(),
  level: LogLevelSchema,
  category: LogCategorySchema,
  message: z.string(),
  details: z.any().optional(),
});

export const ToastMessageSchema = z.object({
  id: z.string(),
  type: z.enum(["success", "error", "warning", "info"]),
  title: z.string(),
  message: z.string(),
});

// ============================================================================
// TELEMETRY & PLOTTER SCHEMAS
// ============================================================================

export const TelemetryVariableSchema = z.object({
  name: z.string(),
  type: z.enum(["number", "string", "boolean", "object"]),
  value: z.any(),
  lastUpdate: z.number(),
  history: z.array(z.any()),
});

export const PlotterParserTypeSchema = z.enum(["CSV", "JSON", "REGEX"]);

export const PlotterDataPointSchema = z.record(z.string(), z.number());

export const PlotterConfigSchema = z.object({
  enabled: z.boolean(),
  parser: PlotterParserTypeSchema,
  regexString: z.string().optional(),
  bufferSize: z.number().int().positive(),
  autoDiscover: z.boolean(),
});

export const PlotterStateSchema = z.object({
  config: PlotterConfigSchema,
  data: z.array(PlotterDataPointSchema),
  series: z.array(z.string()),
});

// ============================================================================
// LOG ENTRY SCHEMA
// ============================================================================

export const LogEntrySchema = z.object({
  id: z.string(),
  timestamp: z.number(),
  direction: z.enum(["TX", "RX"]),
  data: z.union([z.string(), z.instanceof(Uint8Array)]),
  format: DataModeSchema,
  contextId: z.string().optional(),
  commandParams: z.record(z.string(), z.any()).optional(),
  extractedVars: z.record(z.string(), z.any()).optional(),
  payloadStart: z.number().optional(),
  payloadLength: z.number().optional(),
});

// ============================================================================
// CHAT MESSAGE SCHEMA
// ============================================================================

export const ChatMessageSchema = z.object({
  id: z.string(),
  role: z.enum(["user", "model", "system"]),
  text: z.string().optional(),
  isToolCall: z.boolean().optional(),
  toolName: z.string().optional(),
  toolArgs: z.any().optional(),
  toolResult: z.string().optional(),
  timestamp: z.number(),
  attachment: z
    .object({
      name: z.string(),
      mimeType: z.string(),
      data: z.string(),
    })
    .optional(),
});

// ============================================================================
// SESSION SCHEMA
// ============================================================================

export const SessionSchema = z.object({
  id: z.string(),
  name: z.string(),
  connectionType: ConnectionTypeSchema,
  config: SerialConfigSchema,
  networkConfig: NetworkConfigSchema,
  isConnected: z.boolean(),
  portName: z.string().optional(),
  logs: z.array(LogEntrySchema),
  variables: z.record(z.string(), TelemetryVariableSchema),
  widgets: z.array(DashboardWidgetSchema),
  plotter: PlotterStateSchema,
  inputBuffer: z.string(),
  sendMode: DataModeSchema,
  encoding: TextEncodingSchema,
  checksum: ChecksumAlgorithmSchema,
  framingOverride: FramingConfigSchema.optional(),
  aiMessages: z.array(ChatMessageSchema),
  aiTokenUsage: z.object({
    prompt: z.number(),
    response: z.number(),
    total: z.number(),
  }),
});

// ============================================================================
// PERSISTED STATE SCHEMAS (Only what we actually save)
// ============================================================================

/**
 * UI Slice - Only persist user preferences, not runtime state
 */
export const PersistedUIStateSchema = z.object({
  themeMode: ThemeModeSchema,
  themeColor: ThemeColorSchema,
});

/**
 * Project Slice - Persist all project data
 */
export const PersistedProjectStateSchema = z.object({
  presets: z.array(SerialPresetSchema),
  commands: z.array(SavedCommandSchema),
  sequences: z.array(SerialSequenceSchema),
  contexts: z.array(ProjectContextSchema),
  loadedPresetId: z.string().nullable().optional(),
});

/**
 * Session Slice - Persist session configs but NOT runtime state
 * We strip logs, reset isConnected, clear temporary data
 */
export const PersistedSessionStateSchema = z.object({
  sessions: z.record(z.string(), SessionSchema),
  activeSessionId: z.string(),
});

/**
 * Combined Persisted Store State
 * This is the complete shape of what gets saved to storage
 */
export const PersistedStoreStateSchema = z
  .object({
    // UI preferences
    themeMode: ThemeModeSchema.optional(),
    themeColor: ThemeColorSchema.optional(),

    // Project data
    presets: z.array(SerialPresetSchema).optional(),
    commands: z.array(SavedCommandSchema).optional(),
    sequences: z.array(SerialSequenceSchema).optional(),
    contexts: z.array(ProjectContextSchema).optional(),
    loadedPresetId: z.string().nullable().optional(),

    // Session data
    sessions: z.record(z.string(), SessionSchema).optional(),
    activeSessionId: z.string().optional(),

    // Version for migrations
    __version: z.string().optional(),
  })
  .passthrough(); // Allow extra fields for backward compatibility

/**
 * Current store version for migration tracking
 */
export const STORE_VERSION = "1.0.0";

/**
 * Default values for persisted state
 */
export const DEFAULT_PERSISTED_STATE = {
  themeMode: "system" as const,
  themeColor: "zinc" as const,
  presets: [],
  commands: [],
  sequences: [],
  contexts: [],
  loadedPresetId: null,
  sessions: {},
  activeSessionId: "",
  __version: STORE_VERSION,
};

// ============================================================================
// SLICE STATE SCHEMAS (State fields only, not actions)
// ============================================================================

/**
 * UI Slice State Schema - All state fields for UI slice
 * Defined here after component schemas for proper reference
 */
export const UISliceStateSchema = z.object({
  // Appearance
  themeMode: ThemeModeSchema,
  themeColor: ThemeColorSchema,

  // System Logs & Toasts
  systemLogs: z.array(SystemLogEntrySchema),
  toasts: z.array(ToastMessageSchema),

  // Modal & Visibility State
  editingCommand: SavedCommandSchema.partial().nullable(),
  isCommandModalOpen: z.boolean(),
  editingPreset: SerialPresetSchema.nullable(),
  pendingParamCommand: SavedCommandSchema.nullable(),
  showGeneratorModal: z.boolean(),
  showSystemLogs: z.boolean(),
  showAppSettings: z.boolean(),
  showAI: z.boolean(),
  activeSequenceId: z.string().nullable(),
  loadedPresetId: z.string().nullable(),
  selectedCommandId: z.string().nullable(),
  rightSidebarTab: RightSidebarTabSchema,
});

/**
 * Project Slice State Schema - All state fields for project slice
 */
export const ProjectSliceStateSchema = z.object({
  presets: z.array(SerialPresetSchema),
  commands: z.array(SavedCommandSchema),
  sequences: z.array(SerialSequenceSchema),
  contexts: z.array(ProjectContextSchema),
});

/**
 * Session Slice State Schema - All state fields for session slice
 */
export const SessionSliceStateSchema = z.object({
  sessions: z.record(z.string(), SessionSchema),
  activeSessionId: z.string(),
});
