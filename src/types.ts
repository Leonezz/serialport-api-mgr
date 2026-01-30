/**
 * Central type definitions for the entire application
 * All types are derived from Zod schemas using z.infer<>
 * Schema files export ONLY schemas, this file exports types AND re-exports schemas
 */

import { z } from "zod";

// ============================================================================
// SCHEMA IMPORTS - From core domain schemas
// ============================================================================
import {
  LineEndingSchema,
  DataModeSchema,
  TextEncodingSchema,
  ChecksumAlgorithmSchema,
  MatchTypeSchema,
  ValidationModeSchema,
  ThemeColorSchema,
  ThemeModeSchema,
  ConnectionTypeSchema,
  ParameterTypeSchema,
  FramingStrategySchema,
  AttachmentCategorySchema,
  FramingConfigSchema,
  SerialOptionsSchema,
  SerialConfigSchema,
  NetworkConfigSchema,
  WidgetConfigSchema,
  DashboardWidgetSchema,
  SerialPresetSchema,
  CommandParameterSchema,
  CommandValidationSchema,
  CommandScriptingSchema,
  BaseEntitySchema,
  SavedCommandSchema,
  SequenceStepSchema,
  SerialSequenceSchema,
  ProjectContextSchema,
  DeviceAttachmentSchema,
  DeviceSerialOptionsSchema,
  DeviceProtocolBindingSchema,
  DeviceSchema,
  AIProjectResultSchema,
  ExportProfileSchema,
  DataBitsSchema,
  StopBitsSchema,
  ParitySchema,
  FlowControlSchema,
  WidgetTypeSchema,
  // Variable parsing schemas
  VariableSyntaxSchema,
  ParameterApplicationModeSchema,
  // Substitute mode schemas
  SubstituteTypeSchema,
  QuoteStyleSchema,
  SubstituteConfigSchema,
  // Transform mode schemas
  TransformPresetSchema,
  TransformConfigSchema,
  // Format mode schemas
  FormatTypeSchema,
  NumberRadixSchema,
  PaddingTypeSchema,
  AlignmentSchema,
  NumberFormatConfigSchema,
  StringFormatConfigSchema,
  DateFormatSchema,
  DateFormatConfigSchema,
  ByteSizeSchema,
  ByteOutputSchema,
  BytesFormatConfigSchema,
  FormatConfigSchema,
  // Position mode schemas
  PositionConfigSchema,
  // Combined application schema
  ParameterApplicationSchema,
  // Variable extraction
  VariableExtractionRuleSchema,
  // Two-layer architecture schemas
  WidgetBindingSchema,
  ProtocolLayerSchema,
  ParameterEnhancementSchema,
  CommandLayerSchema,
  CommandSourceSchema,
} from "./lib/schemas";

import {
  RightSidebarTabSchema,
  LogLevelSchema,
  LogCategorySchema,
  SystemLogEntrySchema,
  ToastMessageSchema,
  TelemetryVariableSchema,
  PlotterParserTypeSchema,
  PlotterDataPointSchema,
  PlotterConfigSchema,
  PlotterStateSchema,
  LogEntrySchema,
  ChatMessageSchema,
  SessionSchema,
  UISliceStateSchema,
  ProjectSliceStateSchema,
  SessionSliceStateSchema,
  PersistedUIStateSchema,
  PersistedProjectStateSchema,
  PersistedSessionStateSchema,
  PersistedStoreStateSchema,
} from "./lib/storeSchemas";

import {
  UsbPortInfoSchema,
  PortTypeSchema,
  OpenedPortProfileSchema,
  PortStatusSchema,
  SerialPortInfoSchema,
  SerialPortInfoArraySchema,
  SerialOutputSignalsSchema,
  SerialInputSignalsSchema,
  SerialPortFilterSchema,
  SerialPortRequestOptionsSchema,
} from "./lib/tauri/schemas";

import {
  PortOpenedEventSchema,
  PortClosedEventSchema,
  PortReadEventSchema,
  PortErrorEventSchema,
  PortStatusEventSchema,
  TauriEventNames,
  listenToTauriEvent,
  listenToMultipleEvents,
  listenOnce,
} from "./lib/tauri/events";

// ============================================================================
// CORE DOMAIN TYPES (from schemas.ts)
// ============================================================================

// Enums
export type LineEnding = z.infer<typeof LineEndingSchema>;
export type DataMode = z.infer<typeof DataModeSchema>;
export type GlobalFormat = DataMode | "AUTO";
export type TextEncoding = z.infer<typeof TextEncodingSchema>;
export type ChecksumAlgorithm = z.infer<typeof ChecksumAlgorithmSchema>;
export type MatchType = z.infer<typeof MatchTypeSchema>;
export type ValidationMode = z.infer<typeof ValidationModeSchema>;
export type ThemeColor = z.infer<typeof ThemeColorSchema>;
export type ThemeMode = z.infer<typeof ThemeModeSchema>;
export type ConnectionType = z.infer<typeof ConnectionTypeSchema>;
export type ParameterType = z.infer<typeof ParameterTypeSchema>;
export type FramingStrategy = z.infer<typeof FramingStrategySchema>;
export type AttachmentCategory = z.infer<typeof AttachmentCategorySchema>;

// Variable parsing types
export type VariableSyntax = z.infer<typeof VariableSyntaxSchema>;
export type ParameterApplicationMode = z.infer<
  typeof ParameterApplicationModeSchema
>;

// Substitute mode types
export type SubstituteType = z.infer<typeof SubstituteTypeSchema>;
export type QuoteStyle = z.infer<typeof QuoteStyleSchema>;
export type SubstituteConfig = z.infer<typeof SubstituteConfigSchema>;

// Transform mode types
export type TransformPreset = z.infer<typeof TransformPresetSchema>;
export type TransformConfig = z.infer<typeof TransformConfigSchema>;

// Format mode types
export type FormatType = z.infer<typeof FormatTypeSchema>;
export type NumberRadix = z.infer<typeof NumberRadixSchema>;
export type PaddingType = z.infer<typeof PaddingTypeSchema>;
export type Alignment = z.infer<typeof AlignmentSchema>;
export type NumberFormatConfig = z.infer<typeof NumberFormatConfigSchema>;
export type StringFormatConfig = z.infer<typeof StringFormatConfigSchema>;
export type DateFormat = z.infer<typeof DateFormatSchema>;
export type DateFormatConfig = z.infer<typeof DateFormatConfigSchema>;
export type ByteSize = z.infer<typeof ByteSizeSchema>;
export type ByteOutput = z.infer<typeof ByteOutputSchema>;
export type BytesFormatConfig = z.infer<typeof BytesFormatConfigSchema>;
export type FormatConfig = z.infer<typeof FormatConfigSchema>;

// Position mode types
export type PositionConfig = z.infer<typeof PositionConfigSchema>;

// Combined application type
export type ParameterApplication = z.infer<typeof ParameterApplicationSchema>;

// Variable extraction types
export type VariableExtractionRule = z.infer<
  typeof VariableExtractionRuleSchema
>;

// Unified serial types (use EnumConverter when communicating with Rust/Tauri)
export type DataBits = z.infer<typeof DataBitsSchema>;
export type StopBits = z.infer<typeof StopBitsSchema>;
export type Parity = z.infer<typeof ParitySchema>;
export type FlowControl = z.infer<typeof FlowControlSchema>;

// Configs
export type FramingConfig = z.infer<typeof FramingConfigSchema>;
export type SerialOptions = z.infer<typeof SerialOptionsSchema>;
export type SerialConfig = z.infer<typeof SerialConfigSchema>;
export type NetworkConfig = z.infer<typeof NetworkConfigSchema>;
export type WidgetConfig = z.infer<typeof WidgetConfigSchema>;
export type WidgetType = z.infer<typeof WidgetTypeSchema>;
export type DashboardWidget = z.infer<typeof DashboardWidgetSchema>;

// Domain entities
export type SerialPreset = z.infer<typeof SerialPresetSchema>;
export type CommandParameter = z.infer<typeof CommandParameterSchema>;
export type CommandValidation = z.infer<typeof CommandValidationSchema>;
export type CommandScripting = z.infer<typeof CommandScriptingSchema>;
export type BaseEntity = z.infer<typeof BaseEntitySchema>;

// Two-layer architecture types
export type WidgetBinding = z.infer<typeof WidgetBindingSchema>;
export type ProtocolLayer = z.infer<typeof ProtocolLayerSchema>;
export type ParameterEnhancement = z.infer<typeof ParameterEnhancementSchema>;
export type CommandLayer = z.infer<typeof CommandLayerSchema>;
export type CommandSource = z.infer<typeof CommandSourceSchema>;

export type SavedCommand = z.infer<typeof SavedCommandSchema>;
export type SequenceStep = z.infer<typeof SequenceStepSchema>;
export type SerialSequence = z.infer<typeof SerialSequenceSchema>;
export type ProjectContext = z.infer<typeof ProjectContextSchema>;
export type DeviceAttachment = z.infer<typeof DeviceAttachmentSchema>;
export type DeviceSerialOptions = z.infer<typeof DeviceSerialOptionsSchema>;
export type DeviceProtocolBinding = z.infer<typeof DeviceProtocolBindingSchema>;
export type Device = z.infer<typeof DeviceSchema>;

// Export/AI
export type ExportProfile = z.infer<typeof ExportProfileSchema>;
export type AIProjectResult = z.infer<typeof AIProjectResultSchema>;

// ============================================================================
// STORE/RUNTIME TYPES (from storeSchemas.ts)
// ============================================================================

// Slice-specific
export type RightSidebarTab = z.infer<typeof RightSidebarTabSchema>;

// Logging
export type LogLevel = z.infer<typeof LogLevelSchema>;
export type LogCategory = z.infer<typeof LogCategorySchema>;
export type SystemLogEntry = z.infer<typeof SystemLogEntrySchema>;
export type ToastMessage = z.infer<typeof ToastMessageSchema>;

// Telemetry & Plotter
export type TelemetryVariable = z.infer<typeof TelemetryVariableSchema>;
export type TelemetryVariableValue = z.infer<
  typeof TelemetryVariableSchema
>["value"];
export type PlotterParserType = z.infer<typeof PlotterParserTypeSchema>;
export type PlotterDataPoint = z.infer<typeof PlotterDataPointSchema>;
export type PlotterConfig = z.infer<typeof PlotterConfigSchema>;
export type PlotterState = z.infer<typeof PlotterStateSchema>;

// Log entries (unified schema)
export type LogEntry = z.infer<typeof LogEntrySchema>;

// Chat
export type ChatMessage = z.infer<typeof ChatMessageSchema>;

// Session
export type Session = z.infer<typeof SessionSchema>;

// Slice states
export type UISliceState = z.infer<typeof UISliceStateSchema>;
export type ProjectSliceState = z.infer<typeof ProjectSliceStateSchema>;
export type SessionSliceState = z.infer<typeof SessionSliceStateSchema>;

// Persisted states
export type PersistedUIState = z.infer<typeof PersistedUIStateSchema>;
export type PersistedProjectState = z.infer<typeof PersistedProjectStateSchema>;
export type PersistedSessionState = z.infer<typeof PersistedSessionStateSchema>;
export type PersistedStoreState = z.infer<typeof PersistedStoreStateSchema>;

// Port info
export type UsbPortInfo = z.infer<typeof UsbPortInfoSchema>;
export type PortType = z.infer<typeof PortTypeSchema>;
export type OpenedPortProfile = z.infer<typeof OpenedPortProfileSchema>;
export type PortStatus = z.infer<typeof PortStatusSchema>;
export type SerialPortInfo = z.infer<typeof SerialPortInfoSchema>;
export type SerialPortInfoArray = z.infer<typeof SerialPortInfoArraySchema>;

// Serial signals
export type SerialOutputSignals = z.infer<typeof SerialOutputSignalsSchema>;
export type SerialInputSignals = z.infer<typeof SerialInputSignalsSchema>;

// Filters
export type SerialPortFilter = z.infer<typeof SerialPortFilterSchema>;
export type SerialPortRequestOptions = z.infer<
  typeof SerialPortRequestOptionsSchema
>;

// ============================================================================
// TAURI EVENT TYPES (from tauri/events.ts)
// ============================================================================

export type PortOpenedEvent = z.infer<typeof PortOpenedEventSchema>;
export type PortClosedEvent = z.infer<typeof PortClosedEventSchema>;
export type PortReadEvent = z.infer<typeof PortReadEventSchema>;
export type PortErrorEvent = z.infer<typeof PortErrorEventSchema>;
export type PortStatusEvent = z.infer<typeof PortStatusEventSchema>;

export type TauriEventName =
  (typeof TauriEventNames)[keyof typeof TauriEventNames];

export interface TauriEventPayloadMap {
  [TauriEventNames.PORT_OPENED]: PortOpenedEvent;
  [TauriEventNames.PORT_CLOSED]: PortClosedEvent;
  [TauriEventNames.PORT_READ]: PortReadEvent;
  [TauriEventNames.PORT_ERROR]: PortErrorEvent;
  [TauriEventNames.PORT_STATUS]: PortStatusEvent;
}

// ============================================================================
// UTILITY TYPES
// ============================================================================

/**
 * Type alias for Rust port info (matches SerialPortInfo)
 * Used by portUtils.ts
 */
export type RustPortInfo = SerialPortInfo;

// ============================================================================
// RE-EXPORT SCHEMAS (for runtime validation)
// ============================================================================

export {
  // Core schemas
  LineEndingSchema,
  DataModeSchema,
  TextEncodingSchema,
  ChecksumAlgorithmSchema,
  MatchTypeSchema,
  ValidationModeSchema,
  ThemeColorSchema,
  ThemeModeSchema,
  ConnectionTypeSchema,
  ParameterTypeSchema,
  FramingStrategySchema,
  AttachmentCategorySchema,
  FramingConfigSchema,
  SerialOptionsSchema,
  SerialConfigSchema,
  NetworkConfigSchema,
  WidgetConfigSchema,
  DashboardWidgetSchema,
  SerialPresetSchema,
  CommandParameterSchema,
  CommandValidationSchema,
  CommandScriptingSchema,
  BaseEntitySchema,
  SavedCommandSchema,
  SequenceStepSchema,
  SerialSequenceSchema,
  ProjectContextSchema,
  DeviceAttachmentSchema,
  DeviceSerialOptionsSchema,
  DeviceProtocolBindingSchema,
  DeviceSchema,
  AIProjectResultSchema,
  ExportProfileSchema,
  // Unified serial configuration schemas
  DataBitsSchema,
  StopBitsSchema,
  ParitySchema,
  FlowControlSchema,
  // Variable parsing schemas
  VariableSyntaxSchema,
  ParameterApplicationModeSchema,
  SubstituteTypeSchema,
  QuoteStyleSchema,
  SubstituteConfigSchema,
  TransformPresetSchema,
  TransformConfigSchema,
  FormatTypeSchema,
  NumberRadixSchema,
  PaddingTypeSchema,
  AlignmentSchema,
  NumberFormatConfigSchema,
  StringFormatConfigSchema,
  DateFormatSchema,
  DateFormatConfigSchema,
  ByteSizeSchema,
  ByteOutputSchema,
  BytesFormatConfigSchema,
  FormatConfigSchema,
  PositionConfigSchema,
  ParameterApplicationSchema,
  VariableExtractionRuleSchema,
  // Two-layer architecture schemas
  WidgetBindingSchema,
  ProtocolLayerSchema,
  ParameterEnhancementSchema,
  CommandLayerSchema,
  CommandSourceSchema,

  // Store schemas
  RightSidebarTabSchema,
  LogLevelSchema,
  LogCategorySchema,
  SystemLogEntrySchema,
  ToastMessageSchema,
  TelemetryVariableSchema,
  PlotterParserTypeSchema,
  PlotterDataPointSchema,
  PlotterConfigSchema,
  PlotterStateSchema,
  LogEntrySchema,
  ChatMessageSchema,
  SessionSchema,
  UISliceStateSchema,
  ProjectSliceStateSchema,
  SessionSliceStateSchema,
  PersistedUIStateSchema,
  PersistedProjectStateSchema,
  PersistedSessionStateSchema,
  PersistedStoreStateSchema,
  UsbPortInfoSchema,
  PortTypeSchema,
  OpenedPortProfileSchema,
  PortStatusSchema,
  SerialPortInfoSchema,
  SerialPortInfoArraySchema,
  SerialOutputSignalsSchema,
  SerialInputSignalsSchema,
  SerialPortFilterSchema,
  SerialPortRequestOptionsSchema,

  // Event schemas
  PortOpenedEventSchema,
  PortClosedEventSchema,
  PortReadEventSchema,
  PortErrorEventSchema,
  PortStatusEventSchema,
  TauriEventNames,

  // Event helpers
  listenToTauriEvent,
  listenToMultipleEvents,
  listenOnce,
};

// ============================================================================
// PROTOCOL SYSTEM TYPES (from protocolTypes.ts)
// ============================================================================

export type {
  // Base
  BaseEntity as ProtocolBaseEntity,

  // Data types
  DataType,
  ByteOrder,
  ElementEncoding,
  ChecksumAlgorithm as ProtocolChecksumAlgorithm,

  // Framing
  FramingStrategy as ProtocolFramingStrategy,
  DelimiterConfig,
  TimeoutConfig,
  LengthFieldConfig,
  SyncPatternConfig,
  FramingStep,
  CompositeFramingConfig,
  ScriptFramingConfig,
  FramingConfig as ProtocolFramingConfig,

  // Message elements
  StaticElementConfig,
  AddressElementConfig,
  FieldElementConfig,
  LengthElementConfig,
  ChecksumElementConfig,
  PayloadElementConfig,
  PaddingElementConfig,
  ReservedElementConfig,
  ElementConfig,
  MessageElement,
  MessageStructure,

  // Parameters
  ParameterType as ProtocolParameterType,
  SimpleParameter,
  CommandParameter as ProtocolCommandParameter,
  SimpleExtraction,
  CommandValidation as ProtocolCommandValidation,
  CommandHooks,

  // Commands
  LineEnding as ProtocolLineEnding,
  DataMode as ProtocolDataMode,
  TextEncoding as ProtocolTextEncoding,
  SimpleCommand,
  ElementBinding,
  StaticBinding,
  ComputedBinding,
  ResponsePattern,
  StructuredCommand,
  CommandTemplate,

  // Protocol
  Protocol,

  // Device
  DeviceProtocolBinding as ProtocolDeviceProtocolBinding,
  AttachmentCategory as ProtocolAttachmentCategory,
  DeviceAttachment as ProtocolDeviceAttachment,
  SerialOptions as ProtocolSerialOptions,
  Device as ProtocolDevice,

  // Sequence
  StaticParameterSource,
  VariableParameterSource,
  PreviousStepParameterSource,
  ExpressionParameterSource,
  ParameterSource,
  StepCondition,
  SequenceStep as ProtocolSequenceStep,
  SequenceExecutionConfig,
  Sequence as ProtocolSequence,

  // Shared package
  SharedPackageType,
  ConflictResolution,
  SharedPackage,

  // AI
  ConfidenceLevel,
  GeneratedProtocol,
} from "./lib/protocolTypes";

export {
  // Type guards
  isSimpleCommand,
  isStructuredCommand,

  // Helper functions
  getCommandsByCategory,
  getProtocolCategories,
  findCommand,
  findMessageStructure,
} from "./lib/protocolTypes";

// ============================================================================
// WEB SERIAL API (browser types - keep as-is)
// ============================================================================

declare global {
  interface Navigator {
    serial: Serial;
  }

  interface Serial {
    onconnect: ((this: Serial, ev: Event) => void) | null;
    ondisconnect: ((this: Serial, ev: Event) => void) | null;
    getPorts(): Promise<SerialPort[]>;
    requestPort(options?: SerialPortRequestOptions): Promise<SerialPort>;
    addEventListener(
      type: string,
      listener: EventListenerOrEventListenerObject,
      options?: boolean | AddEventListenerOptions,
    ): void;
    removeEventListener(
      type: string,
      callback: EventListenerOrEventListenerObject,
      options?: boolean | EventListenerOptions,
    ): void;
  }

  interface SerialConnectionEvent extends Event {
    readonly port: SerialPort;
  }

  /**
   * Native WebSerial API options (uses numeric/lowercase values)
   * @see https://developer.mozilla.org/en-US/docs/Web/API/SerialPort/open
   */
  interface NativeSerialOptions {
    baudRate: number;
    dataBits?: 7 | 8;
    stopBits?: 1 | 2;
    parity?: "none" | "even" | "odd";
    flowControl?: "none" | "hardware";
    bufferSize?: number;
  }

  interface SerialPort {
    onconnect: ((this: SerialPort, ev: Event) => void) | null;
    ondisconnect: ((this: SerialPort, ev: Event) => void) | null;
    readonly readable: ReadableStream<Uint8Array> | null;
    readonly writable: WritableStream<Uint8Array> | null;
    // Accept both app's SerialOptions (for TauriPort) and native WebSerial options
    open(options: SerialOptions | NativeSerialOptions): Promise<void>;
    close(): Promise<void>;
    forget(): Promise<void>;
    getInfo(): SerialPortInfo;
    setSignals(signals: SerialOutputSignals): Promise<void>;
    getSignals(): Promise<SerialInputSignals>;
  }
}

export {};
