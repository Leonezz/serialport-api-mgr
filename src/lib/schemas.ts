import { z } from "zod";

// ============================================================================
// SERIAL PORT CONFIGURATION SCHEMAS
// These are the unified schemas for serial port configuration
// Use EnumConverter when sending values to Rust/Tauri
// ============================================================================

export const DataBitsSchema = z.enum(["Five", "Six", "Seven", "Eight"]);

export const StopBitsSchema = z.enum(["One", "Two"]);

export const ParitySchema = z.enum(["None", "Even", "Odd"]);

export const FlowControlSchema = z.enum(["None", "Hardware", "Software"]);

// --- Basic Types ---
export const LineEndingSchema = z.enum(["NONE", "LF", "CR", "CRLF"]);

export const DataModeSchema = z.enum(["TEXT", "HEX", "BINARY"]);

export const TextEncodingSchema = z.enum(["UTF-8", "ASCII", "ISO-8859-1"]);

export const ChecksumAlgorithmSchema = z.enum([
  "NONE",
  "MOD256",
  "XOR",
  "CRC16",
]);

export const MatchTypeSchema = z.enum(["CONTAINS", "REGEX"]);

export const ValidationModeSchema = z.enum(["PATTERN"]);

export const ThemeColorSchema = z.enum([
  "zinc",
  "blue",
  "green",
  "orange",
  "rose",
  "yellow",
]);

export const ThemeModeSchema = z.enum(["light", "dark", "system"]);

export const ConnectionTypeSchema = z.enum(["SERIAL", "NETWORK"]);

export const ParameterTypeSchema = z.enum([
  "STRING",
  "INTEGER",
  "FLOAT",
  "ENUM",
  "BOOLEAN",
]);

export const FramingStrategySchema = z.enum([
  "NONE",
  "DELIMITER",
  "TIMEOUT",
  "PREFIX_LENGTH",
  "SCRIPT",
]);

// --- Configs ---
export const FramingConfigSchema = z.object({
  strategy: FramingStrategySchema,
  delimiter: z.string().optional().default(""),
  timeout: z.number().optional().default(50),
  prefixLengthSize: z.number().min(1).max(8).optional().default(1),
  byteOrder: z.enum(["LE", "BE"]).optional().default("LE"),
  script: z.string().optional(),
});

export const SerialOptionsSchema = z.object({
  baudRate: z.number().int().positive(),
  dataBits: DataBitsSchema,
  stopBits: StopBitsSchema,
  parity: ParitySchema,
  flowControl: FlowControlSchema,
});

export const SerialConfigSchema = SerialOptionsSchema.extend({
  bufferSize: z.number().int().positive(),
  lineEnding: LineEndingSchema,
  framing: FramingConfigSchema,
});

export const NetworkConfigSchema = z.object({
  host: z.string().min(1),
  port: z.number().int().positive().max(65535),
});

export const WidgetTypeSchema = z.enum(["CARD", "LINE", "GAUGE"]);
// --- Widget Config ---
export const WidgetConfigSchema = z.object({
  type: WidgetTypeSchema,
  width: z.union([z.literal(1), z.literal(2), z.literal(3)]),
  min: z.number().optional(),
  max: z.number().optional(),
  unit: z.string().optional(),
});

export const DashboardWidgetSchema = z.object({
  id: z.string(),
  title: z.string(),
  variableName: z.string(),
  config: WidgetConfigSchema,
  order: z.number().int(),
});

// --- Presets ---
export const SerialPresetSchema = z.object({
  id: z.string(),
  name: z.string().min(1),
  type: ConnectionTypeSchema,
  config: SerialConfigSchema,
  network: NetworkConfigSchema.optional(),
  widgets: z.array(DashboardWidgetSchema).optional(),
  deviceId: z.string().optional(),
});

// --- Command Structure ---
export const CommandParameterSchema = z.object({
  id: z.string().optional(), // Optional on import, generated if missing
  name: z
    .string()
    .min(1)
    .regex(/^[a-zA-Z_][a-zA-Z0-9_]*$/, "Must be valid variable name"),
  label: z.string().optional(),
  description: z.string().optional(),
  type: ParameterTypeSchema,
  defaultValue: z.union([z.string(), z.number(), z.boolean()]).optional(),
  required: z.boolean().optional(),
  min: z.number().optional(),
  max: z.number().optional(),
  maxLength: z.number().optional(),
  options: z
    .array(
      z.object({
        label: z.string(),
        value: z.union([z.string(), z.number()]),
      }),
    )
    .optional(),
});

export const CommandValidationSchema = z.object({
  enabled: z.boolean(),
  mode: ValidationModeSchema,
  matchType: MatchTypeSchema.optional(),
  pattern: z.string().optional(),
  timeout: z.number().int().positive(),
});

export const CommandScriptingSchema = z.object({
  enabled: z.boolean(),
  preRequestScript: z.string().optional(),
  postResponseScript: z.string().optional(),
});

export const BaseEntitySchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  description: z.string().optional(),
  creator: z.string().optional(),
  createdAt: z.number(),
  updatedAt: z.number(),
});

export const SavedCommandSchema = BaseEntitySchema.extend({
  group: z.string().optional(),
  payload: z.string().default(""), // Default to empty string if missing
  mode: DataModeSchema,
  encoding: TextEncodingSchema.optional(),
  parameters: z.array(CommandParameterSchema).optional(),
  validation: CommandValidationSchema.optional(),
  scripting: CommandScriptingSchema.optional(),
  responseFraming: FramingConfigSchema.optional(), // New field
  framingPersistence: z
    .enum(["TRANSIENT", "PERSISTENT"])
    .optional()
    .default("TRANSIENT"),
  usedBy: z.array(z.string()).optional(),
  contextIds: z.array(z.string()).optional(),
  deviceId: z.string().optional(),
});

// --- Sequences ---
export const SequenceStepSchema = z.object({
  id: z.string(),
  commandId: z.string(),
  delay: z.number().int().nonnegative(),
  stopOnError: z.boolean(),
});

export const SerialSequenceSchema = BaseEntitySchema.extend({
  steps: z.array(SequenceStepSchema),
  contextIds: z.array(z.string()).optional(),
  deviceId: z.string().optional(),
});

export const ProjectContextSchema = z.object({
  id: z.string(),
  title: z.string(),
  content: z.string(),
  source: z.enum(["USER", "AI_GENERATED"]),
  createdAt: z.number(),
});

export const AttachmentCategorySchema = z.enum([
  "DATASHEET",
  "MANUAL",
  "SCHEMATIC",
  "PROTOCOL",
  "IMAGE",
  "OTHER",
]);

export const DeviceAttachmentSchema = BaseEntitySchema.extend({
  filename: z.string(),
  mimeType: z.string(),
  size: z.number(),
  data: z.string(), // Base64 encoded content
  category: AttachmentCategorySchema,
});

export const DeviceSchema = BaseEntitySchema.extend({
  icon: z.string().optional(),
  manufacturer: z.string().optional(),
  model: z.string().optional(),
  presetIds: z.array(z.string()).default([]),
  commandIds: z.array(z.string()).default([]),
  sequenceIds: z.array(z.string()).default([]),
  contextIds: z.array(z.string()).default([]),
  attachments: z.array(DeviceAttachmentSchema).default([]),
});

// --- Full Profile Export/Import Schema ---
export const ExportProfileSchema = z.object({
  version: z.string().optional(),
  timestamp: z.number().optional(),
  appearance: z
    .object({
      themeMode: ThemeModeSchema.optional(),
      themeColor: ThemeColorSchema.optional(),
    })
    .optional(),
  config: SerialConfigSchema.optional(),
  networkConfig: NetworkConfigSchema.optional(),
  presets: z.array(SerialPresetSchema).optional(),
  commands: z.array(SavedCommandSchema).optional(),
  sequences: z.array(SerialSequenceSchema).optional(),
  contexts: z.array(ProjectContextSchema).optional(),
  devices: z.array(DeviceSchema).optional(),
  logs: z.array(z.any()).optional(), // Logs are loose for now
});

// --- AI Service Specific Schema ---
// This validates the structure returned by the Gemini function call for "configure_device"
export const AIProjectResultSchema = z.object({
  deviceName: z.string().optional(),
  devices: z.array(DeviceSchema).optional(),
  config: SerialConfigSchema.partial().optional(), // Allow partial config updates
  commands: z.array(
    SavedCommandSchema.omit({
      id: true,
      createdAt: true,
      updatedAt: true,
      creator: true,
    }).extend({
      // AI might omit these, so we make them optional or provide transforms in the service
      mode: DataModeSchema.default("TEXT"),
      payload: z.string().default(""),
      parameters: z.array(CommandParameterSchema).optional(),
    }),
  ),
  sequences: z.array(
    SerialSequenceSchema.omit({
      id: true,
      createdAt: true,
      updatedAt: true,
      creator: true,
    }).extend({
      steps: z.array(
        z.object({
          commandName: z.string(), // AI references by name, we map to ID later
          delay: z.number().default(500),
          stopOnError: z.boolean().default(true),
        }),
      ),
    }),
  ),
  usage: z
    .object({
      prompt: z.number(),
      response: z.number(),
      total: z.number(),
    })
    .optional(),
});
