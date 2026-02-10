import { z } from "zod";

// Import shared schemas from protocolSchemas.ts for use in two-layer architecture
import {
  SimpleParameterSchema as ProtocolSimpleParameterSchema,
  SimpleExtractionSchema as ProtocolSimpleExtractionSchema,
  ElementBindingSchema as ProtocolElementBindingSchema,
} from "./protocolSchemas";

// ============================================================================
// RUNTIME/SESSION SCHEMAS
//
// These schemas are used for runtime state management:
// - Serial port configuration (sessions, presets)
// - Saved commands and sequences (project-level entities)
// - Device organization (grouping commands/sequences/presets)
//
// Note: For protocol-based data modeling (Protocol, MessageStructure,
// CommandTemplate, Device with protocol bindings), see protocolSchemas.ts
// ============================================================================

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

export const ValidationModeSchema = z.enum([
  "ALWAYS_PASS",
  "PATTERN",
  "SCRIPT",
]);

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

// ============================================================================
// VARIABLE PARSING & PARAMETER APPLICATION SCHEMAS
// ============================================================================

// Variable syntax patterns for detecting variables in payloads
export const VariableSyntaxSchema = z.enum([
  "SHELL", // ${name} - default
  "MUSTACHE", // {{name}}
  "BATCH", // %name%
  "COLON", // :name
  "BRACES", // {name}
  "CUSTOM", // user-defined regex
]);

// Parameter application modes
export const ParameterApplicationModeSchema = z.enum([
  "SUBSTITUTE", // Direct text replacement
  "TRANSFORM", // JavaScript expression transformation
  "FORMAT", // Structured formatting (number, string, date, bytes)
  "POSITION", // Binary byte-position insertion
]);

// Substitute mode options
export const SubstituteTypeSchema = z.enum([
  "DIRECT", // Raw value
  "QUOTED", // Wrap in quotes
  "ESCAPED", // Escape special characters
  "URL_ENCODED", // Percent-encode
  "BASE64", // Base64 encode
]);

export const QuoteStyleSchema = z.enum([
  "DOUBLE", // "value"
  "SINGLE", // 'value'
  "BACKTICK", // `value`
]);

export const SubstituteConfigSchema = z.object({
  type: SubstituteTypeSchema.default("DIRECT"),
  quoteStyle: QuoteStyleSchema.optional(),
  escapeChars: z.string().optional(), // Characters to escape
});

// Transform mode options
export const TransformPresetSchema = z.enum([
  "CUSTOM", // Custom expression
  "UPPERCASE", // value.toUpperCase()
  "LOWERCASE", // value.toLowerCase()
  "TO_HEX", // Number to hex string
  "FROM_HEX", // Hex string to number
  "CHECKSUM_MOD256",
  "CHECKSUM_XOR",
  "CHECKSUM_CRC16",
  "JSON_STRINGIFY",
  "JSON_PARSE",
  "LENGTH", // Get string/array length
  "TRIM", // Trim whitespace
]);

export const TransformConfigSchema = z.object({
  preset: TransformPresetSchema.default("CUSTOM"),
  expression: z.string().optional(), // Custom JS expression
});

// Format mode options
export const FormatTypeSchema = z.enum(["NUMBER", "STRING", "DATE", "BYTES"]);

export const NumberRadixSchema = z.enum(["2", "8", "10", "16"]);

export const PaddingTypeSchema = z.enum(["NONE", "SPACE", "ZERO"]);

export const AlignmentSchema = z.enum(["LEFT", "CENTER", "RIGHT"]);

export const NumberFormatConfigSchema = z.object({
  radix: NumberRadixSchema.default("10"),
  width: z.number().int().min(0).max(32).optional(),
  padding: PaddingTypeSchema.default("NONE"),
  prefix: z.string().optional(), // e.g., "0x", "0b"
  suffix: z.string().optional(), // e.g., "h", "b"
  uppercase: z.boolean().default(false),
  signed: z.boolean().default(false),
});

export const StringFormatConfigSchema = z.object({
  width: z.number().int().min(0).max(255).optional(),
  alignment: AlignmentSchema.default("LEFT"),
  paddingChar: z.string().max(1).default(" "),
  truncate: z.boolean().default(false),
  nullTerminate: z.boolean().default(false),
});

export const DateFormatSchema = z.enum(["ISO", "UNIX", "UNIX_MS", "CUSTOM"]);

export const DateFormatConfigSchema = z.object({
  format: DateFormatSchema.default("ISO"),
  customPattern: z.string().optional(), // For CUSTOM format
  timezone: z.string().optional(), // e.g., "UTC", "America/New_York"
});

export const ByteSizeSchema = z.enum(["1", "2", "4", "8"]);

export const ByteOutputSchema = z.enum(["ARRAY", "HEX_STRING", "RAW"]);

export const BytesFormatConfigSchema = z.object({
  byteSize: ByteSizeSchema.default("1"),
  endianness: z.enum(["LE", "BE"]).default("LE"),
  signed: z.boolean().default(false),
  output: ByteOutputSchema.default("RAW"),
});

export const FormatConfigSchema = z.object({
  type: FormatTypeSchema.default("NUMBER"),
  number: NumberFormatConfigSchema.optional(),
  string: StringFormatConfigSchema.optional(),
  date: DateFormatConfigSchema.optional(),
  bytes: BytesFormatConfigSchema.optional(),
});

// Position mode options (for binary protocols)
export const PositionConfigSchema = z.object({
  byteOffset: z.number().int().min(0).default(0),
  byteSize: ByteSizeSchema.default("1"),
  endianness: z.enum(["LE", "BE"]).default("LE"),
  valueTransform: z.string().optional(), // Optional JS expression before insertion
  bitField: z
    .object({
      startBit: z.number().int().min(0).max(63),
      bitCount: z.number().int().min(1).max(64),
    })
    .optional(),
});

// Parameter application config - union of all modes
export const ParameterApplicationSchema = z.object({
  mode: ParameterApplicationModeSchema.default("SUBSTITUTE"),
  substitute: SubstituteConfigSchema.optional(),
  transform: TransformConfigSchema.optional(),
  format: FormatConfigSchema.optional(),
  position: PositionConfigSchema.optional(),
});

// Variable extraction rule for response parsing
export const VariableExtractionRuleSchema = z.object({
  id: z.string(),
  variableName: z.string().min(1),
  pattern: z.string().min(1), // Regex pattern with capture group
  captureGroup: z.number().int().min(0).default(1),
  transform: z.string().optional(), // Optional JS expression to transform match
  storeTo: z.string().optional(), // Dashboard variable name to store value
});

// Session-level framing strategies (simpler set for runtime use)
// For protocol-level framing with extended strategies (LENGTH_FIELD, SYNC_PATTERN,
// COMPOSITE), see FramingConfigSchema in protocolSchemas.ts
export const FramingStrategySchema = z.enum([
  "NONE",
  "DELIMITER",
  "TIMEOUT",
  "PREFIX_LENGTH",
  "SCRIPT",
]);

// --- Configs ---
// Session-level framing config for runtime data parsing
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
  // Parameter application settings
  application: ParameterApplicationSchema.optional(),
});

export const CommandValidationSchema = z.object({
  enabled: z.boolean(),
  mode: ValidationModeSchema,
  matchType: MatchTypeSchema.optional(),
  pattern: z.string().optional(),
  validationScript: z.string().optional(), // For SCRIPT mode
  timeout: z.number().int().positive(),
  // Variable extraction from response
  extractionEnabled: z.boolean().optional(),
  extractionRules: z.array(VariableExtractionRuleSchema).optional(),
});

export const CommandScriptingSchema = z.object({
  enabled: z.boolean(),
  preRequestScript: z.string().optional(),
  postResponseScript: z.string().optional(),
});

// ============================================================================
// TWO-LAYER ARCHITECTURE: PROTOCOL INTEGRATION SCHEMAS
//
// Layer 1 (Protocol Layer): Data synced from protocol templates - always updated
// Layer 2 (Command Layer): User customizations - never overwritten by sync
// ============================================================================

/**
 * Widget binding for dashboard integration (used in CommandLayerSchema)
 */
export const WidgetBindingSchema = z.object({
  variableName: z.string(),
  widgetType: z.enum(["CARD", "GAUGE", "LINE"]),
  config: z.record(z.string(), z.unknown()).optional(),
});

// Re-export schemas from protocolSchemas.ts for use in two-layer architecture
// These schemas are shared between the protocol system and the execution system
export {
  ProtocolSimpleParameterSchema as SimpleParameterSchema,
  ProtocolSimpleExtractionSchema as SimpleExtractionSchema,
  ProtocolElementBindingSchema as ElementBindingSchema,
};

/**
 * Protocol Layer Schema - Data synced from protocol templates
 *
 * This layer always stays in sync with the source protocol.
 * Contains: payload template, parameters (definitions only), validation,
 * extraction rules, and protocol-defined hooks.
 */
export const ProtocolLayerSchema = z.object({
  // Reference to source protocol/command
  protocolId: z.string(),
  protocolCommandId: z.string(),
  protocolVersion: z.string(),
  protocolCommandUpdatedAt: z.number(),

  // Core command data from protocol
  payload: z.string(),
  mode: DataModeSchema,
  encoding: TextEncodingSchema.optional(),

  // Parameters (without application modes - that's L2)
  parameters: z.array(ProtocolSimpleParameterSchema).default([]),

  // For STRUCTURED commands
  messageStructureId: z.string().optional(),
  elementBindings: z.array(ProtocolElementBindingSchema).optional(),

  // Validation from protocol
  validation: z
    .object({
      enabled: z.boolean(),
      successPattern: z.string().optional(),
      successPatternType: z.enum(["CONTAINS", "REGEX"]).optional(),
      timeout: z.number().optional(),
    })
    .optional(),

  // Variable extraction from protocol
  extractVariables: z.array(ProtocolSimpleExtractionSchema).optional(),

  // Protocol hooks
  protocolPreRequestScript: z.string().optional(),
  protocolPostResponseScript: z.string().optional(),

  // Default framing from protocol
  defaultFraming: FramingConfigSchema.optional(),
});

/**
 * Parameter Enhancement Schema - User customizations per parameter
 */
export const ParameterEnhancementSchema = z.object({
  // Application mode for text substitution
  application: ParameterApplicationSchema.optional(),
  // Override default value
  customDefault: z.unknown().optional(),
  // Custom label
  customLabel: z.string().optional(),
});

/**
 * Command Layer Schema - User customizations
 *
 * This layer is never overwritten by protocol sync.
 * Contains: custom naming, parameter enhancements, additional scripts,
 * overrides, and dashboard bindings.
 */
export const CommandLayerSchema = z.object({
  // Naming overrides
  customName: z.string().optional(),
  customDescription: z.string().optional(),
  group: z.string().optional(),
  tags: z.array(z.string()).optional(),

  // Parameter enhancements (keyed by parameter name)
  parameterEnhancements: z
    .record(z.string(), ParameterEnhancementSchema)
    .optional(),

  // Variable syntax for parameter substitution
  variableSyntax: VariableSyntaxSchema.optional(),

  // Additional extraction rules (extends protocol extractions)
  additionalExtractions: z.array(VariableExtractionRuleSchema).optional(),

  // User scripts (run AFTER protocol scripts)
  userPreRequestScript: z.string().optional(),
  userPostResponseScript: z.string().optional(),

  // Overrides
  timeoutOverride: z.number().optional(),
  framingOverride: FramingConfigSchema.optional(),
  checksumOverride: ChecksumAlgorithmSchema.optional(),

  // Dashboard integration
  widgetBindings: z.array(WidgetBindingSchema).optional(),
});

/**
 * Command Source - indicates whether command comes from protocol or is custom
 */
export const CommandSourceSchema = z.enum(["CUSTOM", "PROTOCOL"]);

export const BaseEntitySchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  description: z.string().optional(),
  creator: z.string().optional(),
  createdAt: z.number(),
  updatedAt: z.number(),
});

/**
 * SavedCommand Schema - Two-Layer Architecture
 *
 * Commands can come from two sources:
 * - CUSTOM: User-created commands with all data in "custom*" fields
 * - PROTOCOL: Commands derived from protocol templates with L1/L2 layers
 *
 * For PROTOCOL commands:
 * - protocolLayer (L1): Synced from protocol, updated automatically
 * - commandLayer (L2): User customizations, never overwritten
 *
 * The existing fields (payload, mode, parameters, etc.) are preserved
 * for backward compatibility and serve as the "custom" fields for
 * CUSTOM source commands.
 */
export const SavedCommandSchema = BaseEntitySchema.extend({
  // === TWO-LAYER ARCHITECTURE FIELDS ===

  // Source type: CUSTOM (user-created) or PROTOCOL (from protocol template)
  // Defaults to CUSTOM for backward compatibility with existing commands
  source: CommandSourceSchema.optional().default("CUSTOM"),

  // Protocol Layer (L1) - present for PROTOCOL source commands
  // Contains data synced from protocol templates
  protocolLayer: ProtocolLayerSchema.optional(),

  // Command Layer (L2) - user customizations
  // Present for all commands, contains user overrides and enhancements
  commandLayer: CommandLayerSchema.optional(),

  // === LEGACY/CUSTOM COMMAND FIELDS ===
  // These fields are used for CUSTOM source commands
  // For PROTOCOL commands, use protocolLayer + commandLayer instead

  group: z.string().optional(),
  payload: z.string().default(""), // Default to empty string if missing
  mode: DataModeSchema.optional(),
  encoding: TextEncodingSchema.optional(),
  // Variable parsing settings
  variableSyntax: VariableSyntaxSchema.optional().default("SHELL"),
  customVariablePattern: z.string().optional(), // Regex for CUSTOM syntax
  caseSensitiveVariables: z.boolean().optional().default(true),
  // Parameters with application modes
  parameters: z.array(CommandParameterSchema).optional(),
  validation: CommandValidationSchema.optional(),
  scripting: CommandScriptingSchema.optional(),
  responseFraming: FramingConfigSchema.optional(),
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

// Serial options for device defaults
export const DeviceSerialOptionsSchema = z.object({
  baudRate: z.number().int().positive().optional(),
  dataBits: z.enum(["Five", "Six", "Seven", "Eight"]).optional(),
  stopBits: z.enum(["One", "Two"]).optional(),
  parity: z.enum(["None", "Even", "Odd"]).optional(),
  flowControl: z.enum(["None", "Hardware", "Software"]).optional(),
});

// Protocol binding for a device
export const DeviceProtocolBindingSchema = z.object({
  protocolId: z.string(),
  parameterDefaults: z.record(z.string(), z.unknown()).optional(),
});

// Device schema - combines organizational grouping with hardware details
export const DeviceSchema = BaseEntitySchema.extend({
  icon: z.string().optional(),
  manufacturer: z.string().optional(),
  model: z.string().optional(),
  serialNumber: z.string().optional(),
  firmwareVersion: z.string().optional(),
  presetIds: z.array(z.string()).default([]),
  commandIds: z.array(z.string()).default([]),
  sequenceIds: z.array(z.string()).default([]),
  contextIds: z.array(z.string()).default([]),
  attachments: z.array(DeviceAttachmentSchema).default([]),
  defaultSerialOptions: DeviceSerialOptionsSchema.optional(),
  protocols: z.array(DeviceProtocolBindingSchema).default([]),
  // Default protocol for new commands created for this device
  defaultProtocolId: z.string().optional(),
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
