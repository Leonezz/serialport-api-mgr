/**
 * Protocol Types
 *
 * TypeScript type definitions inferred from Zod schemas.
 * All types are derived from protocolSchemas.ts using z.infer<>.
 */

import { z } from "zod";

import {
  // Base
  BaseEntitySchema,

  // Data types
  DataTypeSchema,
  ByteOrderSchema,
  ElementEncodingSchema,
  ChecksumAlgorithmSchema,

  // Framing
  FramingStrategySchema,
  DelimiterConfigSchema,
  TimeoutConfigSchema,
  LengthFieldConfigSchema,
  SyncPatternConfigSchema,
  FramingStepSchema,
  CompositeFramingConfigSchema,
  ScriptFramingConfigSchema,
  FramingConfigSchema,

  // Message elements
  StaticElementConfigSchema,
  AddressElementConfigSchema,
  FieldElementConfigSchema,
  LengthElementConfigSchema,
  ChecksumElementConfigSchema,
  PayloadElementConfigSchema,
  PaddingElementConfigSchema,
  ReservedElementConfigSchema,
  ElementConfigSchema,
  MessageElementSchema,
  MessageStructureSchema,

  // Parameters
  ParameterTypeSchema,
  SimpleParameterSchema,
  CommandParameterSchema,
  SimpleExtractionSchema,
  CommandValidationSchema,
  CommandHooksSchema,

  // Commands
  LineEndingSchema,
  DataModeSchema,
  TextEncodingSchema,
  SimpleCommandSchema,
  ElementBindingSchema,
  StaticBindingSchema,
  ComputedBindingSchema,
  ResponsePatternSchema,
  StructuredCommandSchema,
  CommandTemplateSchema,

  // Protocol
  ProtocolSchema,

  // Device
  DeviceProtocolBindingSchema,
  AttachmentCategorySchema,
  DeviceAttachmentSchema,
  SerialOptionsSchema,
  DeviceSchema,

  // Sequence
  StaticParameterSourceSchema,
  VariableParameterSourceSchema,
  PreviousStepParameterSourceSchema,
  ExpressionParameterSourceSchema,
  ParameterSourceSchema,
  StepConditionSchema,
  SequenceStepSchema,
  SequenceExecutionConfigSchema,
  SequenceSchema,

  // Shared package
  SharedPackageTypeSchema,
  ConflictResolutionSchema,
  SharedPackageSchema,

  // AI
  ConfidenceLevelSchema,
  GeneratedProtocolSchema,
} from "./schemas/protocolSchemas";

// ============================================================================
// BASE TYPES
// ============================================================================

export type BaseEntity = z.infer<typeof BaseEntitySchema>;

// ============================================================================
// DATA TYPES
// ============================================================================

export type DataType = z.infer<typeof DataTypeSchema>;
export type ByteOrder = z.infer<typeof ByteOrderSchema>;
export type ElementEncoding = z.infer<typeof ElementEncodingSchema>;
export type ChecksumAlgorithm = z.infer<typeof ChecksumAlgorithmSchema>;

// ============================================================================
// FRAMING TYPES
// ============================================================================

export type FramingStrategy = z.infer<typeof FramingStrategySchema>;
export type DelimiterConfig = z.infer<typeof DelimiterConfigSchema>;
export type TimeoutConfig = z.infer<typeof TimeoutConfigSchema>;
export type LengthFieldConfig = z.infer<typeof LengthFieldConfigSchema>;
export type SyncPatternConfig = z.infer<typeof SyncPatternConfigSchema>;
export type FramingStep = z.infer<typeof FramingStepSchema>;
export type CompositeFramingConfig = z.infer<
  typeof CompositeFramingConfigSchema
>;
export type ScriptFramingConfig = z.infer<typeof ScriptFramingConfigSchema>;
export type FramingConfig = z.infer<typeof FramingConfigSchema>;

// ============================================================================
// MESSAGE ELEMENT TYPES
// ============================================================================

export type StaticElementConfig = z.infer<typeof StaticElementConfigSchema>;
export type AddressElementConfig = z.infer<typeof AddressElementConfigSchema>;
export type FieldElementConfig = z.infer<typeof FieldElementConfigSchema>;
export type LengthElementConfig = z.infer<typeof LengthElementConfigSchema>;
export type ChecksumElementConfig = z.infer<typeof ChecksumElementConfigSchema>;
export type PayloadElementConfig = z.infer<typeof PayloadElementConfigSchema>;
export type PaddingElementConfig = z.infer<typeof PaddingElementConfigSchema>;
export type ReservedElementConfig = z.infer<typeof ReservedElementConfigSchema>;
export type ElementConfig = z.infer<typeof ElementConfigSchema>;
export type MessageElement = z.infer<typeof MessageElementSchema>;
export type MessageStructure = z.infer<typeof MessageStructureSchema>;

// ============================================================================
// PARAMETER TYPES
// ============================================================================

export type ParameterType = z.infer<typeof ParameterTypeSchema>;
export type SimpleParameter = z.infer<typeof SimpleParameterSchema>;
export type CommandParameter = z.infer<typeof CommandParameterSchema>;
export type SimpleExtraction = z.infer<typeof SimpleExtractionSchema>;
export type CommandValidation = z.infer<typeof CommandValidationSchema>;
export type CommandHooks = z.infer<typeof CommandHooksSchema>;

// ============================================================================
// COMMAND TYPES
// ============================================================================

export type LineEnding = z.infer<typeof LineEndingSchema>;
export type DataMode = z.infer<typeof DataModeSchema>;
export type TextEncoding = z.infer<typeof TextEncodingSchema>;
export type SimpleCommand = z.infer<typeof SimpleCommandSchema>;
export type ElementBinding = z.infer<typeof ElementBindingSchema>;
export type StaticBinding = z.infer<typeof StaticBindingSchema>;
export type ComputedBinding = z.infer<typeof ComputedBindingSchema>;
export type ResponsePattern = z.infer<typeof ResponsePatternSchema>;
export type StructuredCommand = z.infer<typeof StructuredCommandSchema>;
export type CommandTemplate = z.infer<typeof CommandTemplateSchema>;

// ============================================================================
// PROTOCOL TYPES
// ============================================================================

export type Protocol = z.infer<typeof ProtocolSchema>;

// ============================================================================
// DEVICE TYPES
// ============================================================================

export type DeviceProtocolBinding = z.infer<typeof DeviceProtocolBindingSchema>;
export type AttachmentCategory = z.infer<typeof AttachmentCategorySchema>;
export type DeviceAttachment = z.infer<typeof DeviceAttachmentSchema>;
export type SerialOptions = z.infer<typeof SerialOptionsSchema>;
export type Device = z.infer<typeof DeviceSchema>;

// ============================================================================
// SEQUENCE TYPES
// ============================================================================

export type StaticParameterSource = z.infer<typeof StaticParameterSourceSchema>;
export type VariableParameterSource = z.infer<
  typeof VariableParameterSourceSchema
>;
export type PreviousStepParameterSource = z.infer<
  typeof PreviousStepParameterSourceSchema
>;
export type ExpressionParameterSource = z.infer<
  typeof ExpressionParameterSourceSchema
>;
export type ParameterSource = z.infer<typeof ParameterSourceSchema>;
export type StepCondition = z.infer<typeof StepConditionSchema>;
export type SequenceStep = z.infer<typeof SequenceStepSchema>;
export type SequenceExecutionConfig = z.infer<
  typeof SequenceExecutionConfigSchema
>;
export type Sequence = z.infer<typeof SequenceSchema>;

// ============================================================================
// SHARED PACKAGE TYPES
// ============================================================================

export type SharedPackageType = z.infer<typeof SharedPackageTypeSchema>;
export type ConflictResolution = z.infer<typeof ConflictResolutionSchema>;
export type SharedPackage = z.infer<typeof SharedPackageSchema>;

// ============================================================================
// AI TYPES
// ============================================================================

export type ConfidenceLevel = z.infer<typeof ConfidenceLevelSchema>;
export type GeneratedProtocol = z.infer<typeof GeneratedProtocolSchema>;

// ============================================================================
// RE-EXPORT SCHEMAS (for runtime validation)
// ============================================================================

export {
  // Base
  BaseEntitySchema,

  // Data types
  DataTypeSchema,
  ByteOrderSchema,
  ElementEncodingSchema,
  ChecksumAlgorithmSchema,

  // Framing
  FramingStrategySchema,
  DelimiterConfigSchema,
  TimeoutConfigSchema,
  LengthFieldConfigSchema,
  SyncPatternConfigSchema,
  FramingStepSchema,
  CompositeFramingConfigSchema,
  ScriptFramingConfigSchema,
  FramingConfigSchema,

  // Message elements
  StaticElementConfigSchema,
  AddressElementConfigSchema,
  FieldElementConfigSchema,
  LengthElementConfigSchema,
  ChecksumElementConfigSchema,
  PayloadElementConfigSchema,
  PaddingElementConfigSchema,
  ReservedElementConfigSchema,
  ElementConfigSchema,
  MessageElementSchema,
  MessageStructureSchema,

  // Parameters
  ParameterTypeSchema,
  SimpleParameterSchema,
  CommandParameterSchema,
  SimpleExtractionSchema,
  CommandValidationSchema,
  CommandHooksSchema,

  // Commands
  LineEndingSchema,
  DataModeSchema,
  TextEncodingSchema,
  SimpleCommandSchema,
  ElementBindingSchema,
  StaticBindingSchema,
  ComputedBindingSchema,
  ResponsePatternSchema,
  StructuredCommandSchema,
  CommandTemplateSchema,

  // Protocol
  ProtocolSchema,

  // Device
  DeviceProtocolBindingSchema,
  AttachmentCategorySchema,
  DeviceAttachmentSchema,
  SerialOptionsSchema,
  DeviceSchema,

  // Sequence
  StaticParameterSourceSchema,
  VariableParameterSourceSchema,
  PreviousStepParameterSourceSchema,
  ExpressionParameterSourceSchema,
  ParameterSourceSchema,
  StepConditionSchema,
  SequenceStepSchema,
  SequenceExecutionConfigSchema,
  SequenceSchema,

  // Shared package
  SharedPackageTypeSchema,
  ConflictResolutionSchema,
  SharedPackageSchema,

  // AI
  ConfidenceLevelSchema,
  GeneratedProtocolSchema,
};

// ============================================================================
// UTILITY TYPES
// ============================================================================

/**
 * Type guard for SimpleCommand
 */
export function isSimpleCommand(cmd: CommandTemplate): cmd is SimpleCommand {
  return cmd.type === "SIMPLE";
}

/**
 * Type guard for StructuredCommand
 */
export function isStructuredCommand(
  cmd: CommandTemplate,
): cmd is StructuredCommand {
  return cmd.type === "STRUCTURED";
}

/**
 * Helper to get commands from a protocol by category
 */
export function getCommandsByCategory(
  protocol: Protocol,
  category?: string,
): CommandTemplate[] {
  if (!category) return protocol.commands;
  return protocol.commands.filter((cmd) => cmd.category === category);
}

/**
 * Helper to get all categories from a protocol
 */
export function getProtocolCategories(protocol: Protocol): string[] {
  const categories = new Set<string>();
  protocol.commands.forEach((cmd) => {
    if (cmd.category) categories.add(cmd.category);
  });
  return Array.from(categories).sort();
}

/**
 * Helper to find a command in a protocol by ID
 */
export function findCommand(
  protocol: Protocol,
  commandId: string,
): CommandTemplate | undefined {
  return protocol.commands.find((cmd) => cmd.id === commandId);
}

/**
 * Helper to find a message structure in a protocol by ID
 */
export function findMessageStructure(
  protocol: Protocol,
  structureId: string,
): MessageStructure | undefined {
  return protocol.messageStructures.find((s) => s.id === structureId);
}
