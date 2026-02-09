/**
 * Protocol Schemas
 *
 * Comprehensive type definitions for the protocol system including:
 * - Protocol (top-level shareable entity)
 * - MessageStructure (defines wire format)
 * - MessageElement (individual fields in a message)
 * - CommandTemplate (SimpleCommand | StructuredCommand)
 * - Device (with protocol bindings)
 * - Sequence (with parameter binding support)
 * - SharedPackage (for import/export)
 */

import { z } from "zod";

// ============================================================================
// BASE SCHEMAS
// ============================================================================

export const BaseEntitySchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  description: z.string().optional(),
  tags: z.array(z.string()).default([]),
  createdAt: z.number(),
  updatedAt: z.number(),
});

// ============================================================================
// DATA TYPE SCHEMAS
// ============================================================================

export const DataTypeSchema = z.enum([
  "UINT8",
  "UINT16",
  "UINT32",
  "INT8",
  "INT16",
  "INT32",
  "FLOAT32",
  "FLOAT64",
  "STRING",
  "BYTES",
]);

export const ByteOrderSchema = z.enum(["LE", "BE"]);

export const ElementEncodingSchema = z.enum([
  "BINARY",
  "ASCII",
  "BCD",
  "HEX_STRING",
]);

export const ChecksumAlgorithmSchema = z.enum([
  "NONE",
  "XOR",
  "MOD256",
  "CRC16",
  "CRC16_MODBUS",
  "CRC16_CCITT",
  "LRC",
]);

// ============================================================================
// FRAMING CONFIGURATION (Enhanced)
// ============================================================================

export const FramingStrategySchema = z.enum([
  "NONE",
  "DELIMITER",
  "TIMEOUT",
  "LENGTH_FIELD",
  "SYNC_PATTERN",
  "COMPOSITE",
  "SCRIPT",
]);

export const DelimiterConfigSchema = z.object({
  sequence: z.union([z.string(), z.array(z.number())]),
  position: z.enum(["SUFFIX", "PREFIX"]).default("SUFFIX"),
  includeInFrame: z.boolean().default(false),
  escape: z
    .object({
      enabled: z.boolean(),
      escapeChar: z.number(),
      xorMask: z.number().optional(),
    })
    .optional(),
});

export const TimeoutConfigSchema = z.object({
  silenceMs: z.number().min(1),
  minBytes: z.number().min(1).optional(),
});

export const LengthFieldConfigSchema = z.object({
  offset: z.number().min(0),
  size: z.union([z.literal(1), z.literal(2), z.literal(4)]),
  byteOrder: ByteOrderSchema.default("BE"),
  adjustment: z.number().default(0),
  includesHeader: z.boolean().default(false),
});

export const SyncPatternConfigSchema = z.object({
  pattern: z.array(z.number()),
  maxScan: z.number().min(1).default(1024),
});

export const FramingStepSchema = z.object({
  type: z.enum(["FIND_SYNC", "READ_LENGTH", "READ_FIXED", "FIND_DELIMITER"]),
  syncBytes: z.array(z.number()).optional(),
  lengthSize: z.union([z.literal(1), z.literal(2), z.literal(4)]).optional(),
  lengthByteOrder: ByteOrderSchema.optional(),
  lengthAdjustment: z.number().optional(),
  fixedBytes: z.number().optional(),
  delimiter: z.array(z.number()).optional(),
});

export const CompositeFramingConfigSchema = z.object({
  steps: z.array(FramingStepSchema),
});

export const ScriptFramingConfigSchema = z.object({
  code: z.string(),
});

export const FramingConfigSchema = z.object({
  strategy: FramingStrategySchema,
  delimiter: DelimiterConfigSchema.optional(),
  timeout: TimeoutConfigSchema.optional(),
  lengthField: LengthFieldConfigSchema.optional(),
  syncPattern: SyncPatternConfigSchema.optional(),
  composite: CompositeFramingConfigSchema.optional(),
  script: ScriptFramingConfigSchema.optional(),
  maxFrameLength: z.number().min(0).optional(), // 0 = unlimited
});

// ============================================================================
// MESSAGE ELEMENT SCHEMAS
// ============================================================================

export const StaticElementConfigSchema = z.object({
  type: z.literal("STATIC"),
  value: z.array(z.number()),
});

export const AddressElementConfigSchema = z.object({
  type: z.literal("ADDRESS"),
  range: z.object({
    min: z.number(),
    max: z.number(),
  }),
  broadcastValue: z.number().optional(),
});

export const FieldElementConfigSchema = z.object({
  type: z.literal("FIELD"),
  dataType: DataTypeSchema,
  enumValues: z
    .array(
      z.object({
        label: z.string(),
        value: z.union([z.string(), z.number()]),
        description: z.string().optional(),
      }),
    )
    .optional(),
});

export const LengthElementConfigSchema = z.object({
  type: z.literal("LENGTH"),
  includeElements: z.array(z.string()),
  adjustment: z.number().default(0),
});

export const ChecksumElementConfigSchema = z.object({
  type: z.literal("CHECKSUM"),
  algorithm: ChecksumAlgorithmSchema,
  includeElements: z.array(z.string()),
});

export const PayloadElementConfigSchema = z.object({
  type: z.literal("PAYLOAD"),
  minSize: z.number().min(0).optional(),
  maxSize: z.number().min(1).optional(),
});

export const PaddingElementConfigSchema = z.object({
  type: z.literal("PADDING"),
  fillByte: z.number().min(0).max(255),
});

export const ReservedElementConfigSchema = z.object({
  type: z.literal("RESERVED"),
  fillByte: z.number().min(0).max(255).default(0),
});

export const ElementConfigSchema = z.discriminatedUnion("type", [
  StaticElementConfigSchema,
  AddressElementConfigSchema,
  FieldElementConfigSchema,
  LengthElementConfigSchema,
  ChecksumElementConfigSchema,
  PayloadElementConfigSchema,
  PaddingElementConfigSchema,
  ReservedElementConfigSchema,
]);

export const MessageElementSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().optional(),
  size: z.union([z.number(), z.literal("VARIABLE"), z.literal("COMPUTED")]),
  encoding: ElementEncodingSchema.optional(),
  byteOrder: ByteOrderSchema.optional(),
  config: ElementConfigSchema,
});

// ============================================================================
// MESSAGE STRUCTURE SCHEMA
// ============================================================================

export const MessageStructureSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().optional(),
  encoding: ElementEncodingSchema.default("BINARY"),
  byteOrder: ByteOrderSchema.default("BE"),
  elements: z.array(MessageElementSchema),
});

// ============================================================================
// COMMAND PARAMETER SCHEMAS
// ============================================================================

export const ParameterTypeSchema = z.enum([
  "STRING",
  "INTEGER",
  "FLOAT",
  "BOOLEAN",
  "ENUM",
]);

export const SimpleParameterSchema = z.object({
  name: z
    .string()
    .min(1)
    .regex(/^[a-zA-Z_][a-zA-Z0-9_]*$/, "Must be valid variable name"),
  label: z.string().optional(),
  description: z.string().optional(),
  type: ParameterTypeSchema,
  defaultValue: z.union([z.string(), z.number(), z.boolean()]).optional(),
  placeholder: z.string().optional(),
  required: z.boolean().default(false),
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

export const CommandParameterSchema = SimpleParameterSchema.extend({
  id: z.string().optional(),
});

// ============================================================================
// SIMPLE EXTRACTION SCHEMA (for parsing response)
// ============================================================================

export const SimpleExtractionSchema = z.object({
  pattern: z.string(),
  variableName: z.string(),
  transform: z.string().optional(),
});

// ============================================================================
// COMMAND VALIDATION SCHEMA
// ============================================================================

export const CommandValidationSchema = z.object({
  enabled: z.boolean(),
  timeout: z.number().int().positive().default(2000),
  successPattern: z.string().optional(),
  successPatternType: z.enum(["CONTAINS", "REGEX"]).optional(),
});

// ============================================================================
// COMMAND HOOKS SCHEMA
// ============================================================================

export const CommandHooksSchema = z.object({
  preRequest: z.string().optional(),
  postResponse: z.string().optional(),
});

// ============================================================================
// SIMPLE COMMAND SCHEMA (for text-based protocols)
// ============================================================================

export const LineEndingSchema = z.enum(["NONE", "LF", "CR", "CRLF"]);
export const DataModeSchema = z.enum(["TEXT", "HEX"]);
export const TextEncodingSchema = z.enum(["UTF-8", "ASCII", "ISO-8859-1"]);

export const SimpleCommandSchema = BaseEntitySchema.extend({
  type: z.literal("SIMPLE"),
  category: z.string().optional(),
  icon: z.string().optional(),

  // Payload
  payload: z.string().default(""),
  mode: DataModeSchema.default("TEXT"),
  encoding: TextEncodingSchema.optional(),
  lineEnding: LineEndingSchema.optional(),
  checksum: ChecksumAlgorithmSchema.optional(),

  // Parameters (template substitution)
  parameters: z.array(SimpleParameterSchema).default([]),

  // Response handling
  validation: CommandValidationSchema.optional(),

  // Variable extraction
  extractVariables: z.array(SimpleExtractionSchema).default([]),

  // Hooks
  hooks: CommandHooksSchema.optional(),
});

// ============================================================================
// STRUCTURED COMMAND SCHEMAS (for binary protocols)
// ============================================================================

export const ElementBindingSchema = z.object({
  elementId: z.string(),
  parameterName: z.string(),
  transform: z.string().optional(),
});

export const StaticBindingSchema = z.object({
  elementId: z.string(),
  value: z.union([z.number(), z.array(z.number()), z.string()]),
});

export const ComputedBindingSchema = z.object({
  elementId: z.string(),
  expression: z.string(),
});

export const ResponsePatternSchema = z.object({
  type: z.enum(["SUCCESS", "ERROR", "ACK", "NAK", "DATA"]),
  condition: z.string(),
  extractElements: z
    .array(
      z.object({
        elementId: z.string(),
        variableName: z.string(),
        transform: z.string().optional(),
      }),
    )
    .optional(),
});

export const StructuredCommandSchema = BaseEntitySchema.extend({
  type: z.literal("STRUCTURED"),
  category: z.string().optional(),
  icon: z.string().optional(),

  // Reference to message structure
  messageStructureId: z.string(),

  // User parameters
  parameters: z.array(CommandParameterSchema).default([]),

  // Bindings
  bindings: z.array(ElementBindingSchema).default([]),
  staticValues: z.array(StaticBindingSchema).default([]),
  computedValues: z.array(ComputedBindingSchema).default([]),

  // Response handling
  response: z
    .object({
      structureId: z.string().optional(),
      patterns: z.array(ResponsePatternSchema),
    })
    .optional(),

  validation: CommandValidationSchema.optional(),

  // Hooks
  hooks: CommandHooksSchema.optional(),
});

// ============================================================================
// COMMAND TEMPLATE (Union of Simple and Structured)
// ============================================================================

export const CommandTemplateSchema = z.discriminatedUnion("type", [
  SimpleCommandSchema,
  StructuredCommandSchema,
]);

// ============================================================================
// PROTOCOL SCHEMA (Top-Level, Shareable)
// ============================================================================

export const ProtocolSchema = BaseEntitySchema.extend({
  version: z.string().default("1.0"),
  icon: z.string().optional(),
  author: z.string().optional(),
  sourceUrl: z.string().url().optional(),

  // Framing configuration
  framing: FramingConfigSchema,

  // Message format definitions
  messageStructures: z.array(MessageStructureSchema).default([]),
  defaultMessageStructureId: z.string().optional(),

  // Command templates
  commands: z.array(CommandTemplateSchema).default([]),
});

// ============================================================================
// DEVICE PROTOCOL BINDING SCHEMA
// ============================================================================

export const DeviceProtocolBindingSchema = z.object({
  protocolId: z.string(),
  defaultAddress: z.number().optional(),
  parameterDefaults: z.record(z.string(), z.unknown()).optional(),
  enabledCommands: z.array(z.string()).optional(),
  commandAliases: z.record(z.string(), z.string()).optional(),
});

// ============================================================================
// DEVICE ATTACHMENT SCHEMA
// ============================================================================

export const AttachmentCategorySchema = z.enum([
  "DATASHEET",
  "MANUAL",
  "SCHEMATIC",
  "PROTOCOL",
  "IMAGE",
  "OTHER",
]);

export const DeviceAttachmentSchema = z.object({
  id: z.string(),
  name: z.string(),
  filename: z.string(),
  mimeType: z.string(),
  size: z.number(),
  data: z.string(), // Base64 encoded
  category: AttachmentCategorySchema,
  description: z.string().optional(),
  createdAt: z.number(),
});

// ============================================================================
// SERIAL OPTIONS SCHEMA
// ============================================================================

export const SerialOptionsSchema = z.object({
  baudRate: z.number().int().positive(),
  dataBits: z.enum(["Five", "Six", "Seven", "Eight"]).default("Eight"),
  stopBits: z.enum(["One", "Two"]).default("One"),
  parity: z.enum(["None", "Even", "Odd"]).default("None"),
  flowControl: z.enum(["None", "Hardware", "Software"]).default("None"),
});

// ============================================================================
// DEVICE SCHEMA (Top-Level)
// ============================================================================

export const DeviceSchema = BaseEntitySchema.extend({
  icon: z.string().optional(),
  manufacturer: z.string().optional(),
  model: z.string().optional(),
  serialNumber: z.string().optional(),
  firmwareVersion: z.string().optional(),

  // Protocol support
  protocols: z.array(DeviceProtocolBindingSchema).default([]),

  // Default protocol for new commands created for this device
  defaultProtocolId: z.string().optional(),

  // Direct command references (device owns these)
  commandIds: z.array(z.string()).default([]),

  // Default communication settings
  defaultSerialOptions: SerialOptionsSchema.optional(),

  // Documentation
  attachments: z.array(DeviceAttachmentSchema).default([]),
});

// ============================================================================
// SEQUENCE STEP PARAMETER SOURCE SCHEMAS
// ============================================================================

export const StaticParameterSourceSchema = z.object({
  type: z.literal("STATIC"),
  value: z.unknown(),
});

export const VariableParameterSourceSchema = z.object({
  type: z.literal("VARIABLE"),
  variableName: z.string(),
  transform: z.string().optional(),
});

export const PreviousStepParameterSourceSchema = z.object({
  type: z.literal("PREVIOUS_STEP"),
  stepId: z.string(),
  elementId: z.string(),
  transform: z.string().optional(),
});

export const ExpressionParameterSourceSchema = z.object({
  type: z.literal("EXPRESSION"),
  expression: z.string(),
});

export const ParameterSourceSchema = z.discriminatedUnion("type", [
  StaticParameterSourceSchema,
  VariableParameterSourceSchema,
  PreviousStepParameterSourceSchema,
  ExpressionParameterSourceSchema,
]);

// ============================================================================
// SEQUENCE STEP SCHEMA
// ============================================================================

export const StepConditionSchema = z.object({
  type: z.enum(["VARIABLE", "EXPRESSION"]),
  expression: z.string(),
});

export const SequenceStepSchema = z.object({
  id: z.string(),
  commandId: z.string(),

  // Static parameter values
  parameterOverrides: z.record(z.string(), z.unknown()).optional(),

  // Dynamic parameter sources
  parameterBindings: z.record(z.string(), ParameterSourceSchema).optional(),

  // Timing
  delayBefore: z.number().min(0).default(0),
  delayAfter: z.number().min(0).default(0),

  // Error handling
  onError: z.enum(["STOP", "CONTINUE", "RETRY"]).default("STOP"),
  retryCount: z.number().min(0).optional(),
  retryDelay: z.number().min(0).optional(),

  // Conditional execution
  condition: StepConditionSchema.optional(),
});

// ============================================================================
// SEQUENCE EXECUTION CONFIG SCHEMA
// ============================================================================

export const SequenceExecutionConfigSchema = z.object({
  mode: z.literal("SEQUENTIAL").default("SEQUENTIAL"),
  repeatCount: z.number().min(1).default(1),
  repeatDelay: z.number().min(0).default(0),
  stopOnFirstError: z.boolean().default(true),
});

// ============================================================================
// SEQUENCE SCHEMA (Top-Level)
// ============================================================================

export const SequenceSchema = BaseEntitySchema.extend({
  // Context references
  deviceId: z.string().optional(),
  protocolId: z.string().optional(),

  // Steps
  steps: z.array(SequenceStepSchema).default([]),

  // Execution config
  execution: SequenceExecutionConfigSchema.default({
    mode: "SEQUENTIAL",
    repeatCount: 1,
    repeatDelay: 0,
    stopOnFirstError: true,
  }),
});

// ============================================================================
// SHARED PACKAGE SCHEMA (for Import/Export)
// ============================================================================

export const SharedPackageTypeSchema = z.enum([
  "PROTOCOL",
  "DEVICE",
  "PROTOCOL_BUNDLE",
]);

export const ConflictResolutionSchema = z.enum(["SKIP", "REPLACE", "RENAME"]);

export const SharedPackageSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().optional(),
  version: z.string(),
  author: z.string().optional(),
  tags: z.array(z.string()).default([]),
  createdAt: z.number(),

  type: SharedPackageTypeSchema,

  content: z.object({
    protocols: z.array(ProtocolSchema).default([]),
    devices: z.array(DeviceSchema).default([]),
    sequences: z.array(SequenceSchema).default([]),
  }),

  importConfig: z
    .object({
      conflictResolution: ConflictResolutionSchema.default("SKIP"),
    })
    .optional(),
});

// ============================================================================
// AI GENERATION SCHEMAS
// ============================================================================

export const ConfidenceLevelSchema = z.enum(["HIGH", "MEDIUM", "LOW"]);

export const GeneratedProtocolSchema = z.object({
  protocol: ProtocolSchema,
  confidence: z.object({
    framing: ConfidenceLevelSchema,
    structures: z.record(z.string(), ConfidenceLevelSchema),
    commands: z.record(z.string(), ConfidenceLevelSchema),
  }),
  warnings: z.array(z.string()).default([]),
  assumptions: z.array(z.string()).default([]),
});
