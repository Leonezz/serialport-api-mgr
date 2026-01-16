import { TsFlowControl, TsParity } from "./lib/tauri";
import { z } from "zod";

// Import schemas for reference (validation) but use manual type definitions for runtime
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
} from "./lib/schemas";

import { LogLevelSchema, LogCategorySchema } from "./lib/storeSchemas";

// Infer simple enum types from schemas (these work well with z.infer)
export type LineEnding = z.infer<typeof LineEndingSchema>;
export type DataMode = z.infer<typeof DataModeSchema>;
export type TextEncoding = z.infer<typeof TextEncodingSchema>;
export type ChecksumAlgorithm = z.infer<typeof ChecksumAlgorithmSchema>;
export type MatchType = z.infer<typeof MatchTypeSchema>;
export type ValidationMode = z.infer<typeof ValidationModeSchema>;
export type ThemeColor = z.infer<typeof ThemeColorSchema>;
export type ThemeMode = z.infer<typeof ThemeModeSchema>;
export type ConnectionType = z.infer<typeof ConnectionTypeSchema>;
export type ParameterType = z.infer<typeof ParameterTypeSchema>;
export type FramingStrategy = z.infer<typeof FramingStrategySchema>;
export type LogLevel = z.infer<typeof LogLevelSchema>;
export type LogCategory = z.infer<typeof LogCategorySchema>;

// Type not defined by schema (extends DataMode)
export type GlobalFormat = DataMode | "AUTO";

// Complex types defined manually (schemas used for validation only)
// This avoids issues with optional fields and defaults in Zod schemas

export interface FramingConfig {
  strategy: FramingStrategy;
  delimiter?: string; // e.g., "\n", "03", "0D 0A"
  timeout?: number; // ms, for TIMEOUT strategy
  prefixLengthSize?: number; // 1 to 8 bytes
  byteOrder?: "LE" | "BE"; // Little Endian or Big Endian
  script?: string; // Custom JS parser
}

export interface CommandParameter {
  id: string;
  name: string;
  label?: string; // User friendly label
  description?: string;
  type: ParameterType;
  defaultValue?: string | number | boolean;
  required?: boolean;
  // Constraints
  min?: number;
  max?: number;
  maxLength?: number;
  // For ENUM
  options?: { label: string; value: string | number }[];
}

export interface ChatMessage {
  id: string;
  role: "user" | "model" | "system";
  text?: string;
  isToolCall?: boolean;
  toolName?: string;
  toolArgs?: any;
  toolResult?: string;
  timestamp: number;
  attachment?: {
    name: string;
    mimeType: string;
    data: string; // base64
  };
}

export interface NetworkConfig {
  host: string;
  port: number;
}

export interface CommandValidation {
  enabled: boolean;
  mode: ValidationMode;
  matchType?: MatchType; // Used when mode === 'PATTERN'
  pattern?: string; // Used when mode === 'PATTERN'
  timeout: number; // in ms
}

export interface CommandScripting {
  enabled: boolean;
  preRequestScript?: string; // JavaScript code to execute before sending (Generates payload)
  postResponseScript?: string; // JavaScript code to execute on incoming data. Return true to complete command.
}

export interface SerialConfig {
  baudRate: number;
  dataBits: 7 | 8;
  stopBits: 1 | 2;
  parity: TsParity;
  flowControl: TsFlowControl;
  bufferSize: number;
  lineEnding: LineEnding;
  framing: FramingConfig;
}

export interface WidgetConfig {
  type: "CARD" | "LINE" | "GAUGE";
  width: 1 | 2 | 3; // 1=1col (33%), 2=2cols (66%), 3=full width (100%)
  min?: number;
  max?: number;
  unit?: string;
}

export interface DashboardWidget {
  id: string;
  title: string;
  variableName: string; // The binding key to the data variable
  config: WidgetConfig;
  order: number;
}

export interface TelemetryVariable {
  name: string;
  type: "number" | "string" | "boolean" | "object";
  value: any;
  lastUpdate: number;
  history: any[]; // Flexible history: { time: number, [key: string]: number }
}

export interface SerialPreset {
  id: string;
  name: string;
  type: ConnectionType;
  config: SerialConfig;
  network?: NetworkConfig;
  widgets?: DashboardWidget[]; // Saved dashboard layout
}

export interface ProjectContext {
  id: string;
  title: string;
  content: string; // The raw text, manual snippet, or description
  source: "USER" | "AI_GENERATED";
  createdAt: number;
}

export interface LogEntry {
  id: string;
  timestamp: number;
  direction: "TX" | "RX";
  data: string | Uint8Array; // String for TEXT, Uint8Array for HEX/Binary
  format: DataMode;
  contextIds?: string[]; // Links to protocol/manual contexts (multiple supported)
  commandParams?: Record<string, any>; // For TX: Parameters used to generate this command
  extractedVars?: Record<string, any>; // For RX: Variables extracted via script from this response
  payloadStart?: number; // Start index of actual payload in raw data (if framed)
  payloadLength?: number; // Length of payload
}

export interface SystemLogEntry {
  id: string;
  timestamp: number;
  level: LogLevel;
  category: LogCategory;
  message: string;
  details?: any; // JSON object for configs, raw bytes, error stacks
}

export interface BaseEntity {
  id: string;
  name: string;
  description?: string;
  creator?: string;
  createdAt: number;
  updatedAt: number;
}

export interface SavedCommand extends BaseEntity {
  group?: string;
  payload: string;
  mode: DataMode;
  encoding?: TextEncoding;
  parameters?: CommandParameter[]; // Dynamic parameters
  validation?: CommandValidation;
  scripting?: CommandScripting;
  responseFraming?: FramingConfig; // Override framing for the response of this command
  framingPersistence?: "TRANSIENT" | "PERSISTENT"; // How to apply the framing
  usedBy?: string[]; // IDs of sequences using this command
  contextIds?: string[]; // Links to ProjectContexts (multiple supported)
}

export interface SequenceStep {
  id: string;
  commandId: string;
  delay: number; // ms to wait AFTER command validation/sending before next step
  stopOnError: boolean;
}

export interface SerialSequence extends BaseEntity {
  steps: SequenceStep[];
}

// --- Plotter ---

export type PlotterParserType = "CSV" | "JSON" | "REGEX";

export interface PlotterDataPoint {
  time: number;
  [seriesId: string]: number;
}

export interface PlotterConfig {
  enabled: boolean;
  parser: PlotterParserType;
  regexString?: string;
  bufferSize: number; // Max points in buffer
  autoDiscover: boolean; // Auto-detect CSV vs JSON
}

export interface PlotterState {
  config: PlotterConfig;
  data: PlotterDataPoint[];
  series: string[]; // List of detected series IDs/names
  aliases: Record<string, string>; // Map series ID -> User Display Name
}

// --- Multi-Session ---
export interface Session {
  id: string;
  name: string;
  // Connection Configuration
  connectionType: ConnectionType;
  config: SerialConfig;
  networkConfig: NetworkConfig;
  isConnected: boolean; // Logical connection state (synced with actual port)
  portName?: string; // The physical port name (e.g. COM3, /dev/ttyUSB0)

  // Data State
  logs: LogEntry[];
  variables: Record<string, TelemetryVariable>; // Session-specific variables (Data)
  widgets: DashboardWidget[]; // Dashboard Layout (View)
  plotter: PlotterState; // New: Real-time Plotter state

  // Input State
  inputBuffer: string;
  sendMode: DataMode;
  encoding: TextEncoding;
  checksum: ChecksumAlgorithm;

  // Dynamic State
  framingOverride?: FramingConfig; // Temporary override active after a command is sent

  // AI State
  aiMessages: ChatMessage[];
  aiTokenUsage: { prompt: number; response: number; total: number };
}

// --- Web Serial API Type Definitions (Exported for usage in services) ---
export interface SerialOptions {
  baudRate: number;
  dataBits?: number;
  stopBits?: number;
  parity?: TsParity;
  bufferSize?: number;
  flowControl?: TsFlowControl;
}

export interface SerialPortInfo {
  usbVendorId?: number;
  usbProductId?: number;
}

declare global {
  interface Navigator {
    serial: Serial;
  }

  interface Serial {
    onconnect: ((this: Serial, ev: Event) => any) | null;
    ondisconnect: ((this: Serial, ev: Event) => any) | null;
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
    onconnect: ((this: SerialPort, ev: Event) => any) | null;
    ondisconnect: ((this: SerialPort, ev: Event) => any) | null;
    readonly readable: ReadableStream<Uint8Array> | null;
    readonly writable: WritableStream<Uint8Array> | null;
    open(options: SerialOptions): Promise<void>;
    close(): Promise<void>;
    forget(): Promise<void>;
    getInfo(): SerialPortInfo;
    setSignals(signals: SerialOutputSignals): Promise<void>;
    getSignals(): Promise<SerialInputSignals>;
  }

  interface SerialOutputSignals {
    dataTerminalReady?: boolean;
    requestToSend?: boolean;
    break?: boolean;
  }

  interface SerialInputSignals {
    dataCarrierDetect: boolean;
    clearToSend: boolean;
    ringIndicator: boolean;
    dataSetReady: boolean;
  }

  interface SerialPortRequestOptions {
    filters?: SerialPortFilter[];
  }

  interface SerialPortFilter {
    usbVendorId?: number;
    usbProductId?: number;
  }
}
