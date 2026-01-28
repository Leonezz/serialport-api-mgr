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
  DeviceSchema,
} from "./schemas";
import { ProtocolSchema } from "./protocolSchemas";

// ============================================================================
// SLICE-SPECIFIC SCHEMAS
// ============================================================================

export const RightSidebarTabSchema = z.enum([
  "ai",
  "basic",
  "params",
  "validation",
  "scripting",
  "device-info",
  "device-connections",
  "device-attachments",
  "device-contexts",
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
  details: z.unknown().optional(),
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
export const TelemetryVariableBasicValueSchema = z.union([
  z.number(),
  z.string(),
  z.boolean(),
  // z.instanceof(Uint8Array),
]);
export const TelemetryVariableValueSchema = z.union([
  TelemetryVariableBasicValueSchema,
  // z.array(TelemetryVariableBasicValueSchema),
  z.map(z.string(), TelemetryVariableBasicValueSchema),
]);

export const TelemetryVariableSchema = z.object({
  name: z.string(),
  type: z.enum(["number", "string", "boolean", "object"]),
  value: TelemetryVariableValueSchema,
  lastUpdate: z.number(),
  history: z.array(z.record(z.string(), z.any())),
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
  aliases: z.record(z.string(), z.string()).optional(),
});

// ============================================================================
// LOG ENTRY SCHEMA
// ============================================================================

// Unified LogEntrySchema - supports both Tauri events and store state
export const LogEntrySchema = z.object({
  id: z.union([z.string(), z.number()]), // string for store, number for Tauri
  timestamp: z.number(),
  direction: z.enum(["TX", "RX"]),
  data: z.union([z.string(), z.instanceof(Uint8Array)]),
  format: DataModeSchema,
  portName: z.string().optional(), // Only for Tauri events
  contextId: z.string().optional(), // Singular (store)
  contextIds: z.array(z.string()).optional(), // Plural (Tauri)
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
  // Protocol integration fields
  protocolFramingEnabled: z.boolean().optional(),
  activeProtocolId: z.string().optional(),
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
  devices: z.array(DeviceSchema),
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

    // Legacy project data (for backward compatibility)
    devices: z.array(DeviceSchema).optional(),
    presets: z.array(SerialPresetSchema).optional(),
    commands: z.array(SavedCommandSchema).optional(),
    sequences: z.array(SerialSequenceSchema).optional(),
    contexts: z.array(ProjectContextSchema).optional(),
    loadedPresetId: z.string().nullable().optional(),

    // New protocol system data
    protocols: z.array(ProtocolSchema).optional(),

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
export const DEFAULT_PERSISTED_STATE: z.infer<
  typeof PersistedStoreStateSchema
> = {
  themeMode: "system" as const,
  themeColor: "zinc" as const,
  devices: [
    {
      id: "dev-arduino-uno",
      name: "Arduino Uno",
      description: "Main development Arduino for sensor projects",
      icon: "cpu",
      manufacturer: "Arduino",
      model: "Uno Rev3",
      createdAt: Date.now(),
      updatedAt: Date.now(),
      presetIds: ["preset-arduino-default"],
      commandIds: ["cmd-hello-world", "cmd-sensor-read", "cmd-set-led"],
      sequenceIds: ["seq-led-test"],
      contextIds: ["ctx-api-docs", "ctx-led-api"],
      attachments: [
        {
          id: "att-arduino-pinout",
          name: "Arduino Uno Pinout",
          filename: "arduino-uno-pinout.png",
          mimeType: "image/png",
          size: 45000,
          data: "",
          description: "Pin configuration diagram",
          category: "SCHEMATIC" as const,
          createdAt: Date.now(),
        },
      ],
    },
    {
      id: "dev-modbus-sensor",
      name: "Modbus Temperature Sensor",
      description: "Industrial temperature sensor with Modbus RTU",
      icon: "thermometer",
      manufacturer: "Schneider",
      model: "TM3TI4",
      createdAt: Date.now(),
      updatedAt: Date.now(),
      presetIds: ["preset-modbus-rtu"],
      commandIds: ["cmd-modbus-read"],
      sequenceIds: [],
      contextIds: ["ctx-modbus-spec"],
      attachments: [
        {
          id: "att-modbus-manual",
          name: "Modbus Register Map",
          filename: "register-map.pdf",
          mimeType: "application/pdf",
          size: 125000,
          data: "",
          description: "Register addresses and data types",
          category: "DATASHEET" as const,
          createdAt: Date.now(),
        },
      ],
    },
    {
      id: "dev-esp32",
      name: "ESP32 DevKit",
      description: "WiFi-enabled microcontroller for IoT projects",
      icon: "wifi",
      manufacturer: "Espressif",
      model: "ESP32-WROOM-32",
      createdAt: Date.now(),
      updatedAt: Date.now(),
      presetIds: ["preset-high-speed"],
      commandIds: ["cmd-config-device"],
      sequenceIds: ["seq-device-setup"],
      contextIds: ["ctx-protocol-spec", "ctx-error-handling"],
      attachments: [],
    },
  ],
  presets: [
    {
      id: "preset-arduino-default",
      deviceId: "dev-arduino-uno",
      name: "Arduino Default",
      type: "SERIAL" as const,
      config: {
        baudRate: 9600,
        dataBits: "Eight" as const,
        stopBits: "One" as const,
        parity: "None" as const,
        flowControl: "None" as const,
        bufferSize: 1024,
        lineEnding: "LF" as const,
        framing: {
          strategy: "DELIMITER" as const,
          delimiter: "\\n",
          timeout: 50,
          prefixLengthSize: 1,
          byteOrder: "LE" as const,
        },
      },
      widgets: [],
    },
    {
      id: "preset-modbus-rtu",
      deviceId: "dev-modbus-sensor",
      name: "Modbus RTU",
      type: "SERIAL" as const,
      config: {
        baudRate: 19200,
        dataBits: "Eight" as const,
        stopBits: "One" as const,
        parity: "Even" as const,
        flowControl: "None" as const,
        bufferSize: 2048,
        lineEnding: "NONE" as const,
        framing: {
          strategy: "TIMEOUT" as const,
          timeout: 35,
          prefixLengthSize: 1,
          byteOrder: "BE" as const,
        },
      },
      widgets: [],
    },
    {
      id: "preset-high-speed",
      deviceId: "dev-esp32",
      name: "High Speed Debug",
      type: "SERIAL" as const,
      config: {
        baudRate: 115200,
        dataBits: "Eight" as const,
        stopBits: "One" as const,
        parity: "None" as const,
        flowControl: "Hardware" as const,
        bufferSize: 4096,
        lineEnding: "CRLF" as const,
        framing: {
          strategy: "NONE" as const,
          timeout: 50,
          prefixLengthSize: 1,
          byteOrder: "LE" as const,
        },
      },
      widgets: [],
    },
  ],
  commands: [
    {
      id: "cmd-hello-world",
      deviceId: "dev-arduino-uno",
      name: "Hello World",
      description: "Send a basic hello message with context",
      creator: "system",
      createdAt: Date.now(),
      updatedAt: Date.now(),
      payload: "Hello, World!",
      mode: "TEXT" as const,
      parameters: [],
      validation: null,
      scripting: null,
      responseFraming: null,
      framingPersistence: null,
      contextIds: ["ctx-api-docs", "ctx-protocol-spec"],
      usedBy: [],
    },
    {
      id: "cmd-sensor-read",
      deviceId: "dev-arduino-uno",
      name: "Read Sensor Data",
      description: "Read temperature and humidity sensor data",
      creator: "system",
      createdAt: Date.now(),
      updatedAt: Date.now(),
      payload: "READ_SENSOR\\n",
      mode: "TEXT" as const,
      parameters: [],
      validation: {
        enabled: true,
        mode: "PATTERN" as const,
        matchType: "REGEX" as const,
        pattern: "TEMP:[\\d.]+°C HUM:[\\d.]+%",
        timeout: 5000,
      },
      scripting: null,
      responseFraming: null,
      framingPersistence: null,
      contextIds: ["ctx-sensor-api", "ctx-error-handling"],
      usedBy: ["seq-monitor-environment"],
    },
    {
      id: "cmd-status-check",
      deviceId: null,
      name: "Device Status Check",
      description: "Check device operational status",
      creator: "system",
      createdAt: Date.now(),
      updatedAt: Date.now(),
      payload: "STATUS\\n",
      mode: "TEXT" as const,
      parameters: [],
      validation: {
        enabled: true,
        mode: "PATTERN" as const,
        matchType: "CONTAINS" as const,
        pattern: "OK",
        timeout: 3000,
      },
      scripting: null,
      responseFraming: null,
      framingPersistence: null,
      contextIds: ["ctx-protocol-spec"],
      usedBy: ["seq-monitor-environment"],
    },
    {
      id: "cmd-set-led",
      deviceId: "dev-arduino-uno",
      name: "Set LED State",
      description: "Control LED brightness and color with parameters",
      creator: "system",
      createdAt: Date.now(),
      updatedAt: Date.now(),
      payload: "LED {{ledId}} {{color}} {{brightness}}\\n",
      mode: "TEXT" as const,
      parameters: [
        {
          id: "param-led-id",
          name: "ledId",
          label: "LED Number",
          description: "LED identifier (0-7)",
          type: "INTEGER" as const,
          defaultValue: 0,
          required: true,
          min: 0,
          max: 7,
        },
        {
          id: "param-color",
          name: "color",
          label: "Color",
          description: "LED color selection",
          type: "ENUM" as const,
          defaultValue: "RED",
          required: true,
          options: [
            { label: "Red", value: "RED" },
            { label: "Green", value: "GREEN" },
            { label: "Blue", value: "BLUE" },
            { label: "White", value: "WHITE" },
          ],
        },
        {
          id: "param-brightness",
          name: "brightness",
          label: "Brightness",
          description: "LED brightness (0.0-1.0)",
          type: "FLOAT" as const,
          defaultValue: 0.5,
          required: false,
          min: 0.0,
          max: 1.0,
        },
      ],
      validation: {
        enabled: true,
        mode: "PATTERN" as const,
        matchType: "CONTAINS" as const,
        pattern: "LED_SET",
        timeout: 2000,
      },
      scripting: null,
      responseFraming: null,
      framingPersistence: null,
      contextIds: ["ctx-led-api"],
      usedBy: ["seq-led-test"],
    },
    {
      id: "cmd-modbus-read",
      deviceId: "dev-modbus-sensor",
      name: "Modbus Read Registers",
      description: "Read holding registers via Modbus RTU (HEX mode)",
      creator: "system",
      createdAt: Date.now(),
      updatedAt: Date.now(),
      payload: "01 03 00 00 00 0A C5 CD",
      mode: "HEX" as const,
      parameters: [],
      validation: null,
      scripting: {
        enabled: true,
        preRequestScript:
          "// Calculate CRC16 before sending\\nconst crc = calculateCRC16(payload);\\nreturn payload + crc;",
        postResponseScript:
          "// Parse Modbus response\\nconst data = parseModbusResponse(response);\\nreturn { registers: data };",
      },
      responseFraming: {
        strategy: "TIMEOUT" as const,
        timeout: 35,
        prefixLengthSize: 1,
        byteOrder: "BE" as const,
      },
      framingPersistence: "TRANSIENT" as const,
      contextIds: ["ctx-modbus-spec"],
      usedBy: [],
    },
    {
      id: "cmd-binary-frame",
      deviceId: null,
      name: "Binary Frame Test",
      description: "Send binary frame with length prefix",
      creator: "system",
      createdAt: Date.now(),
      updatedAt: Date.now(),
      payload: "00001010 00001111 11110000",
      mode: "BINARY" as const,
      parameters: [],
      validation: null,
      scripting: null,
      responseFraming: {
        strategy: "PREFIX_LENGTH" as const,
        prefixLengthSize: 2,
        byteOrder: "BE" as const,
        timeout: 100,
      },
      framingPersistence: "PERSISTENT" as const,
      contextIds: [],
      usedBy: [],
    },
    {
      id: "cmd-config-device",
      deviceId: "dev-esp32",
      name: "Configure Device",
      description: "Configure device settings with multiple parameter types",
      creator: "system",
      createdAt: Date.now(),
      updatedAt: Date.now(),
      payload: "CONFIG {{deviceName}} {{enabled}} {{sampleRate}} {{mode}}\\n",
      mode: "TEXT" as const,
      parameters: [
        {
          id: "param-device-name",
          name: "deviceName",
          label: "Device Name",
          description: "Device identifier string",
          type: "STRING" as const,
          defaultValue: "DEVICE_01",
          required: true,
          maxLength: 20,
        },
        {
          id: "param-enabled",
          name: "enabled",
          label: "Enabled",
          description: "Enable or disable the device",
          type: "BOOLEAN" as const,
          defaultValue: true,
          required: true,
        },
        {
          id: "param-sample-rate",
          name: "sampleRate",
          label: "Sample Rate (Hz)",
          description: "Sampling frequency",
          type: "INTEGER" as const,
          defaultValue: 100,
          required: true,
          min: 1,
          max: 10000,
        },
        {
          id: "param-mode",
          name: "mode",
          label: "Operating Mode",
          description: "Device operating mode",
          type: "ENUM" as const,
          defaultValue: "NORMAL",
          required: true,
          options: [
            { label: "Normal Mode", value: "NORMAL" },
            { label: "Debug Mode", value: "DEBUG" },
            { label: "Low Power", value: "LOW_POWER" },
            { label: "High Performance", value: "HIGH_PERF" },
          ],
        },
      ],
      validation: {
        enabled: true,
        mode: "PATTERN" as const,
        matchType: "REGEX" as const,
        pattern: "CONFIG_(OK|ERROR:\\w+)",
        timeout: 5000,
      },
      scripting: {
        enabled: true,
        preRequestScript:
          "// Log configuration attempt\\nconsole.log('Configuring device:', params.deviceName);\\nreturn payload;",
        postResponseScript:
          "// Extract configuration result\\nif (response.includes('OK')) {\\n  return { success: true, device: params.deviceName };\\n}\\nreturn { success: false, error: response };",
      },
      responseFraming: null,
      framingPersistence: null,
      contextIds: ["ctx-api-docs", "ctx-error-handling"],
      usedBy: ["seq-device-setup"],
    },
  ],
  sequences: [
    {
      id: "seq-monitor-environment",
      deviceId: null,
      name: "Monitor Environment",
      description: "Monitor temperature, humidity, and device status",
      creator: "system",
      createdAt: Date.now(),
      updatedAt: Date.now(),
      steps: [
        {
          id: "step-sensor-read",
          commandId: "cmd-sensor-read",
          delay: 0,
          stopOnError: true,
        },
        {
          id: "step-status-check",
          commandId: "cmd-status-check",
          delay: 1000,
          stopOnError: false,
        },
      ],
      contextIds: ["ctx-sensor-api", "ctx-error-handling", "ctx-protocol-spec"],
    },
    {
      id: "seq-led-test",
      deviceId: "dev-arduino-uno",
      name: "LED Test Sequence",
      description: "Test all LED colors in sequence",
      creator: "system",
      createdAt: Date.now(),
      updatedAt: Date.now(),
      steps: [
        {
          id: "step-led-red",
          commandId: "cmd-set-led",
          delay: 0,
          stopOnError: true,
        },
        {
          id: "step-led-green",
          commandId: "cmd-set-led",
          delay: 500,
          stopOnError: true,
        },
        {
          id: "step-led-blue",
          commandId: "cmd-set-led",
          delay: 500,
          stopOnError: true,
        },
      ],
      contextIds: ["ctx-led-api"],
    },
    {
      id: "seq-device-setup",
      deviceId: "dev-esp32",
      name: "Device Setup",
      description: "Initialize and configure device on startup",
      creator: "system",
      createdAt: Date.now(),
      updatedAt: Date.now(),
      steps: [
        {
          id: "step-hello",
          commandId: "cmd-hello-world",
          delay: 0,
          stopOnError: true,
        },
        {
          id: "step-config",
          commandId: "cmd-config-device",
          delay: 500,
          stopOnError: true,
        },
        {
          id: "step-verify",
          commandId: "cmd-status-check",
          delay: 1000,
          stopOnError: false,
        },
      ],
      contextIds: ["ctx-api-docs", "ctx-protocol-spec"],
    },
  ],
  contexts: [
    {
      id: "ctx-api-docs",
      title: "API Documentation",
      content: `# SerialPort API Documentation

## Basic Commands
- Hello World: Send "Hello, World!" to establish connection
- Response: Device echoes the message back

## Error Handling
- All commands should end with \\n
- Invalid commands return "ERROR: INVALID_COMMAND"`,
      source: "USER" as const,
      createdAt: Date.now(),
    },
    {
      id: "ctx-protocol-spec",
      title: "Protocol Specification",
      content: `# Communication Protocol v1.0

## Message Format
- Commands: ASCII text followed by \\n
- Responses: ASCII text followed by \\n
- Timeout: 5 seconds for responses

## Command Structure
COMMAND_NAME [PARAMETERS]\\n

## Response Codes
- OK: Command successful
- ERROR: Command failed
- TIMEOUT: No response received`,
      source: "USER" as const,
      createdAt: Date.now(),
    },
    {
      id: "ctx-sensor-api",
      title: "Sensor API Reference",
      content: `# Sensor Device API

## READ_SENSOR Command
Reads current temperature and humidity values.

**Request:** READ_SENSOR\\n
**Response:** TEMP:25.5°C HUM:60.2%\\n

## Data Format
- Temperature: XX.X°C (0.0-50.0)
- Humidity: XX.X% (0.0-100.0)

## Error Conditions
- Sensor offline: ERROR:SENSOR_OFFLINE
- Invalid reading: ERROR:INVALID_READING`,
      source: "USER" as const,
      createdAt: Date.now(),
    },
    {
      id: "ctx-error-handling",
      title: "Error Handling Patterns",
      content: `# Error Handling Guide

## Common Error Patterns
- TIMEOUT: No response within 5 seconds
- INVALID_COMMAND: Unknown command sent
- SENSOR_OFFLINE: Hardware sensor not available

## Recovery Strategies
1. Retry command after 1 second
2. Check device connection
3. Reset device if persistent errors

## Logging
All errors should be logged with timestamp and context.`,
      source: "USER" as const,
      createdAt: Date.now(),
    },
    {
      id: "ctx-led-api",
      title: "LED Control API",
      content: `# LED Control API

## LED Command Format
LED <id> <color> <brightness>\\n

## Parameters
- id: LED number (0-7)
- color: RED, GREEN, BLUE, WHITE
- brightness: 0.0-1.0 (float)

## Response
- Success: LED_SET <id> <color> <brightness>
- Error: LED_ERROR:<reason>

## Example
Request: LED 0 RED 0.5\\n
Response: LED_SET 0 RED 0.5`,
      source: "USER" as const,
      createdAt: Date.now(),
    },
    {
      id: "ctx-modbus-spec",
      title: "Modbus RTU Specification",
      content: `# Modbus RTU Protocol

## Frame Format
[Address][Function][Data][CRC]

## Read Holding Registers (0x03)
Request: [Addr][03][Start Hi][Start Lo][Qty Hi][Qty Lo][CRC]
Response: [Addr][03][Byte Count][Data...][CRC]

## CRC Calculation
- CRC-16 (Modbus)
- Polynomial: 0x8005
- Initial: 0xFFFF

## Timing
- Character timeout: 1.5 char times
- Frame timeout: 3.5 char times`,
      source: "USER" as const,
      createdAt: Date.now(),
    },
  ],
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
