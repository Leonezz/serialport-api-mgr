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
  DeviceSchema,
  AIProjectResultSchema,
  ExportProfileSchema,
  DataBitsSchema,
  StopBitsSchema,
  ParitySchema,
  FlowControlSchema,
  WidgetTypeSchema,
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
export type SavedCommand = z.infer<typeof SavedCommandSchema>;
export type SequenceStep = z.infer<typeof SequenceStepSchema>;
export type SerialSequence = z.infer<typeof SerialSequenceSchema>;
export type ProjectContext = z.infer<typeof ProjectContextSchema>;
export type DeviceAttachment = z.infer<typeof DeviceAttachmentSchema>;
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
  DeviceSchema,
  AIProjectResultSchema,
  ExportProfileSchema,
  // Unified serial configuration schemas
  DataBitsSchema,
  StopBitsSchema,
  ParitySchema,
  FlowControlSchema,

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

  interface SerialPort {
    onconnect: ((this: SerialPort, ev: Event) => void) | null;
    ondisconnect: ((this: SerialPort, ev: Event) => void) | null;
    readonly readable: ReadableStream<Uint8Array> | null;
    readonly writable: WritableStream<Uint8Array> | null;
    open(options: SerialOptions): Promise<void>;
    close(): Promise<void>;
    forget(): Promise<void>;
    getInfo(): SerialPortInfo;
    setSignals(signals: SerialOutputSignals): Promise<void>;
    getSignals(): Promise<SerialInputSignals>;
  }
}

export {};
