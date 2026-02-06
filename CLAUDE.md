# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**serialport-api-mgr** is a Tauri desktop application for serial port management and communication testing. It provides a comprehensive UI for interacting with serial devices, executing commands, managing sequences, and analyzing protocol data.

**Tech Stack:**
- **Frontend:** React 19 + TypeScript + Vite + TailwindCSS 4.x
- **Backend:** Tauri 2.x + Rust (tokio-serial for serial port handling)
- **State Management:** Zustand with slice pattern + persistence
- **Database:** SQLite via SeaORM (Rust-side log storage)
- **UI Components:** Custom components with lucide-react icons
- **AI Integration:** Google Gemini API for command generation
- **Type Safety:** Zod schemas with TypeScript type inference

## Common Development Commands

### Development
```bash
# Start development server (both frontend and Tauri)
pnpm tauri dev

# Frontend only (Vite dev server on port 14200)
pnpm dev

# Build production
pnpm tauri build

# Build frontend only
pnpm build

# Quality Assurance
pnpm run lint          # ESLint errors
pnpm run type-check    # TypeScript type checking
pnpm run format        # Prettier formatting
```

### Package Manager
This project uses **pnpm** (v10.27.0). Always use `pnpm` instead of npm or yarn.

---

## Architecture Deep Dive

### Frontend Architecture

#### State Management (Zustand with 4 Slices)

Store located at `src/lib/store.ts` combines **four slices**:

| Slice | File | Purpose |
|-------|------|---------|
| `UISlice` | `src/lib/slices/uiSlice.ts` | Modals, toasts, theme, sidebar visibility, system logs |
| `ProjectSlice` | `src/lib/slices/projectSlice.ts` | Presets, commands, sequences, contexts |
| `SessionSlice` | `src/lib/slices/sessionSlice.ts` | Multi-session state, logs, connection, config, plotter, AI chat |
| `DeviceSlice` | `src/lib/slices/deviceSlice.ts` | Device management, attachments, entity assignments |

**Key Design Patterns:**
```typescript
// Slice uses StateCreator pattern
export const createProjectSlice: StateCreator<ProjectSlice> = (set) => ({
  commands: DEFAULT_COMMANDS,
  addCommand: (cmdData) => set((state) => ({ commands: [...state.commands, newCmd] })),
});

// Combined store with persistence
export const useStore = create<AppState>()(
  devtools(
    persist(
      (...a) => ({
        ...createUISlice(...a),
        ...createProjectSlice(...a),
        ...createSessionSlice(...a),
        ...createDeviceSlice(...a),
      }),
      { name: "serialport-store", storage: createJSONStorage(() => tauriStorage) }
    )
  )
);
```

**Persistence via Tauri Store Plugin:**
- Uses `@tauri-apps/plugin-store` with `LazyStore("settings.json")`
- Schema-aware storage with Zod validation (`PersistedStoreStateSchema`)
- Automatic partial recovery on validation failure
- Version tracking for migrations (`STORE_VERSION`)
- Selective persistence: excludes runtime data (logs, connection state)

#### Session Management Architecture

Multi-session support with independent state per session:

```typescript
interface Session {
  id: string;
  name: string;
  connectionType: "SERIAL" | "NETWORK";
  config: SerialConfig;           // Per-session serial config
  networkConfig: NetworkConfig;
  isConnected: boolean;
  portName?: string;              // Connected port name
  logs: LogEntry[];               // Per-session console logs
  variables: Record<string, TelemetryVariable>;  // Dashboard variables
  widgets: DashboardWidget[];     // Dashboard widgets
  plotter: PlotterState;          // Plotter data & config
  framingOverride?: FramingConfig;  // Temporary framing override
  aiMessages: ChatMessage[];      // AI assistant conversation
  aiTokenUsage: { prompt: number; response: number; total: number };
}
```

**Session Lifecycle:**
1. `addSession()` - Creates new session with defaults
2. `setActiveSessionId()` - Switches active session
3. `removeSession()` - Cleans up, ensures at least one session exists
4. Sessions are keyed by UUID in `sessions: Record<string, Session>`

#### Key Custom Hooks

| Hook | File | Purpose |
|------|------|---------|
| `useSerialConnection` | `src/hooks/useSerialConnection.ts` | Serial port lifecycle, read loop, signal control |
| `useFraming` | `src/hooks/useFraming.ts` | Data framing, override management, plotter parsing |
| `useValidation` | `src/hooks/useValidation.ts` | Response validation, pattern matching, script execution |
| `useCommandExecution` | `src/hooks/useCommandExecution.ts` | Command sending, scripting, encoding, sequences |
| `useChartZoomPan` | `src/hooks/useChartZoomPan.ts` | Chart interaction |
| `useTheme` | `src/hooks/useTheme.ts` | Theme switching |

#### Data Flow Diagram

```
User Interaction
       │
       ▼
  ┌─────────────┐
  │  Component  │◄────────────────────────────┐
  └─────────────┘                              │
       │                                       │
       ▼                                       │
  ┌─────────────┐                              │
  │ useStore()  │ ◄─── Zustand Store           │
  │  Actions    │                              │
  └─────────────┘                              │
       │                                       │
       ├──► UI State Changes ────► Re-render ──┘
       │
       ▼
  ┌─────────────────────────────┐
  │   useSerialConnection()     │
  │   - connect()               │
  │   - write()                 │
  │   - disconnect()            │
  └─────────────────────────────┘
       │
       ▼
  ┌─────────────────────────────┐
  │   serialService             │
  │   (TauriProvider or         │
  │    WebSerialProvider)       │
  └─────────────────────────────┘
       │
       ▼
  ┌─────────────────────────────┐
  │   Tauri Commands            │
  │   (invoke via IPC)          │
  └─────────────────────────────┘
       │
       ▼
  ┌─────────────────────────────┐
  │   Rust Backend              │
  │   (tokio-serial)            │
  └─────────────────────────────┘
       │
       ▼
  ┌─────────────────────────────┐
  │   Physical Serial Port      │
  └─────────────────────────────┘
       │
       ▼ (Data Read)
  ┌─────────────────────────────┐
  │   Tauri Event (PORT_READ)   │
  └─────────────────────────────┘
       │
       ▼
  ┌─────────────────────────────┐
  │   useFraming()              │
  │   - SerialFramer            │
  │   - composeFrames()         │
  └─────────────────────────────┘
       │
       ▼
  ┌─────────────────────────────┐
  │   useValidation()           │
  │   - checkValidation()       │
  │   - Transform Scripts       │
  └─────────────────────────────┘
       │
       ▼
  ┌─────────────────────────────┐
  │   Store Update              │
  │   - addLog()                │
  │   - setVariable()           │
  └─────────────────────────────┘
```

---

### Backend Architecture (Rust/Tauri)

#### Module Structure (`src-tauri/src/`)

```
src-tauri/src/
├── lib.rs              # Entry point, registers all Tauri commands
├── state.rs            # AppState: ports, port_handles, storage
├── constants.rs        # Buffer sizes, timing constants
├── util.rs             # AckSender/AckReceiver for async command handling
│
├── serial/             # Serial port type definitions
│   ├── mod.rs
│   ├── data_bits.rs    # DataBits enum (Five/Six/Seven/Eight)
│   ├── stop_bits.rs    # StopBits enum (One/Two)
│   ├── parity.rs       # Parity enum (None/Even/Odd)
│   ├── flow_control.rs # FlowControl enum (None/Hardware/Software)
│   └── port_type.rs    # PortType enum (UsbPort/BluetoothPort/PciPort/Unknown)
│
├── serial_mgr/         # Serial port management
│   ├── mod.rs          # Module exports
│   ├── open_port.rs    # open_port command, setup_port_task
│   ├── close_port.rs   # close_port command
│   ├── write_port.rs   # write_port, write_request_to_send, write_data_terminal_ready
│   ├── port_task.rs    # spawn_serial_task, read/write loop
│   ├── update_ports.rs # get_all_port_info command
│   ├── execute_saved_command.rs  # execute_saved_command command
│   ├── log.rs          # log/info/warn/error/debug commands, get_logs
│   ├── helpers.rs      # Helper functions for port access
│   └── storage/        # Log persistence
│       ├── mod.rs      # Storage struct using SeaORM + SQLite
│       └── entity.rs   # ORM entity definition
│
└── events/             # Tauri event definitions
    ├── mod.rs          # Event name constants
    ├── port_opened.rs  # PortOpenedEvent struct
    ├── port_closed.rs  # PortClosedEvent struct
    └── message_read.rs # PortReadEvent struct
```

#### AppState Structure

```rust
pub struct AppState {
    pub ports: tokio::sync::RwLock<HashMap<String, PortInfo>>,
    pub port_handles: tokio::sync::RwLock<HashMap<String, PortHandles>>,
    pub storage: Storage,  // SQLite log storage
}

pub struct PortInfo {
    pub port_name: String,
    pub port_type: PortType,
    pub port_status: PortStatus,  // Opened(profile) | Closed
    pub bytes_read: u128,
    pub bytes_write: u128,
}

pub struct PortHandles {
    pub write_port_tx: WritePortSender,  // Channel to write task
}
```

#### Tauri Commands (Frontend-callable)

| Command | Arguments | Returns | Purpose |
|---------|-----------|---------|---------|
| `get_all_port_info` | - | `SerialPortInfo[]` | List available ports |
| `open_port` | portName, baudRate, dataBits, flowControl, parity, stopBits, dataTerminalReady, timeoutMs | `OpenPortResult` | Open port, start read task |
| `close_port` | portName | void | Close port |
| `write_port` | portName, data, messageId | void | Send data |
| `write_request_to_send` | portName, rts | void | Set RTS signal |
| `write_data_terminal_ready` | portName, dtr | void | Set DTR signal |
| `log/info/warn/error/debug` | prefix, content | void | Backend logging |
| `get_logs` | sessionId, limit, offset | `LogEntry[]` | Retrieve persisted logs |
| `execute_saved_command` | command, portName | void | Execute command directly |

#### Serial Task Architecture (port_task.rs)

Each opened port spawns a dedicated tokio task with:

```rust
pub fn spawn_serial_task(port_name: String, port: SerialStream) -> (
    WritePortSender,                          // Write commands channel
    Receiver<SerialEvent>,                    // Read events channel
    watch::Receiver<ModemStatus>,             // Modem status (CTS/DSR/CD/Ring)
    Receiver<usize>,                          // Write completion notifications
) {
    tokio::spawn(async move {
        loop {
            tokio::select! {
                // Reading from serial port
                res = port.read(&mut read_buf) => { ... }

                // Writing/control commands
                cmd = write_rx.recv() => {
                    match cmd {
                        WriteCmd::Message(data) => { port.write_all(&data).await }
                        WriteCmd::Dtr(v) => { port.write_data_terminal_ready(v.dtr) }
                        WriteCmd::Rts(v) => { port.write_request_to_send(v.rts) }
                        WriteCmd::Close => { break }
                    }
                }

                // Modem status polling (every 100ms)
                _ = poll_timer.tick() => { ... }
            }
        }
    });
}
```

#### Event System

```rust
// Event names (events/mod.rs)
pub const PORT_OPENED: &str = "port-opened";
pub const PORT_CLOSED: &str = "port-closed";
pub const PORT_READ: &str = "port-read";
pub const PORT_ERROR: &str = "port-error";
pub const PORT_STATUS: &str = "port-status";

// Emitting events to frontend
app_handle.emit(event_names::PORT_READ, PortReadEvent::new(port_name, data));
```

#### Log Storage (SeaORM + SQLite)

```rust
// Schema
CREATE TABLE logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    device_fingerprint TEXT NOT NULL,
    session_id TEXT NOT NULL,
    vid TEXT,
    pid TEXT,
    serial_number TEXT,
    port_name TEXT NOT NULL,
    direction TEXT NOT NULL,  -- "TX" or "RX"
    timestamp INTEGER NOT NULL,
    data BLOB NOT NULL
);

// Device fingerprint generation
// USB: "usb:{VID}:{PID}:{serial}"
// Other: "port:{port_name}"
```

---

### Type System & Schemas

#### Schema Organization

All types are derived from Zod schemas:

| File | Purpose |
|------|---------|
| `src/lib/schemas.ts` | Core domain schemas (SerialConfig, SavedCommand, etc.) |
| `src/lib/storeSchemas.ts` | Store/runtime schemas (Session, LogEntry, etc.) |
| `src/lib/tauri/schemas.ts` | Tauri-specific schemas (PortType, SerialPortInfo) |
| `src/lib/tauri/events.ts` | Event payload schemas |
| `src/types.ts` | Type inference + re-exports all schemas |

#### Type Inference Pattern

```typescript
// Define schema in schemas.ts
export const SavedCommandSchema = BaseEntitySchema.extend({
  payload: z.string().default(""),
  mode: DataModeSchema,
  parameters: z.array(CommandParameterSchema).optional(),
  validation: CommandValidationSchema.optional(),
  scripting: CommandScriptingSchema.optional(),
  // ...
});

// Infer type in types.ts
export type SavedCommand = z.infer<typeof SavedCommandSchema>;
```

#### Key Type Definitions

```typescript
// Serial Configuration
interface SerialConfig {
  baudRate: number;
  dataBits: "Five" | "Six" | "Seven" | "Eight";
  stopBits: "One" | "Two";
  parity: "None" | "Even" | "Odd";
  flowControl: "None" | "Hardware" | "Software";
  bufferSize: number;
  lineEnding: "NONE" | "LF" | "CR" | "CRLF";
  framing: FramingConfig;
}

// Saved Command
interface SavedCommand {
  id: string;
  name: string;
  payload: string;
  mode: "TEXT" | "HEX" | "BINARY";
  encoding?: "UTF-8" | "ASCII" | "ISO-8859-1";
  parameters?: CommandParameter[];
  validation?: CommandValidation;
  scripting?: CommandScripting;
  responseFraming?: FramingConfig;
  framingPersistence?: "TRANSIENT" | "PERSISTENT";
  deviceId?: string;
  contextIds?: string[];
  // ... base entity fields
}

// Command Parameter
interface CommandParameter {
  name: string;  // Variable name (e.g., "freq")
  label?: string;  // Display label
  type: "STRING" | "INTEGER" | "FLOAT" | "ENUM" | "BOOLEAN";
  defaultValue?: string | number | boolean;
  min?: number;
  max?: number;
  options?: { label: string; value: string | number }[];  // For ENUM
}
```

---

### Framing System Deep Dive

#### Framing Strategies

| Strategy | Description | Config Fields |
|----------|-------------|---------------|
| `NONE` | Pass-through, no framing | - |
| `DELIMITER` | Split on delimiter bytes | `delimiter` (string or hex) |
| `TIMEOUT` | Time-based frame boundaries | `timeout` (ms) |
| `PREFIX_LENGTH` | Length-prefixed frames | `prefixLengthSize`, `byteOrder` |
| `SCRIPT` | Custom JavaScript framing | `script` (JS code) |

#### SerialFramer Class (`src/lib/framing.ts`)

```typescript
export class SerialFramer {
  private chunks: TimedChunk[] = [];
  private timer: ReturnType<typeof setTimeout> | null = null;

  constructor(config: FramingConfig, onFrames: FrameHandler) {}

  setConfig(newConfig: FramingConfig): void;  // Update config dynamically
  push({ data, timestamp }): void;             // Add incoming data
  flush(): void;                               // Force process all buffered data
  reset(): void;                               // Clear buffer
}

// Frame composition (pure function)
export const composeFrames = (
  chunks: TimedChunk[],
  config: FramingConfig,
  forceFlush: boolean
): CompositionResult => {
  // Strategy-specific parsing logic
  // Returns { frames: TimedChunk[], remaining: TimedChunk[] }
};
```

#### Framing Override Mechanism

Commands can temporarily override session framing:

```typescript
// Command with transient framing override
{
  name: "Custom Framer Test",
  responseFraming: {
    strategy: "SCRIPT",
    script: `/* Custom JS framing logic */`
  },
  framingPersistence: "TRANSIENT"  // Reverts after first frame
}

// In useFraming hook
if (currentSessionState.framingOverride) {
  setFramingOverride(undefined);  // Clear after frame processed
  // Reset framer to global config
}
```

---

### Command Execution Pipeline

#### useCommandExecution Hook Flow

```typescript
async sendData(data: string, cmdInfo?: SavedCommand, params?: Record<string, unknown>) {
  // 1. Connection check
  if (!sessionIsConnected) throw new Error("Port not connected");

  // 2. Pre-request scripting
  if (cmdInfo?.scripting?.enabled && cmdInfo.scripting.preRequestScript) {
    payloadToProcess = executeUserScript(cmdInfo.scripting.preRequestScript, {
      payload: data,
      params,
      log: (msg) => addSystemLog("INFO", "SCRIPT", msg)
    });
  }

  // 3. Framing override setup
  if (cmdInfo?.responseFraming) {
    if (cmdInfo.framingPersistence === "PERSISTENT") {
      setConfig((prev) => ({ ...prev, framing: cmdInfo.responseFraming }));
    } else {
      setFramingOverride(cmdInfo.responseFraming);
      // Safety timeout to clear override
      overrideTimerRef.current = setTimeout(() => setFramingOverride(undefined), 5000);
    }
  }

  // 4. Validation/response promise setup
  if (isValidationEnabled || isPostScriptEnabled) {
    validationPromise = new Promise((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error("Timeout")), timeout);
      activeValidationsRef.current.set(validationKey, {
        mode, pattern, matchType, valScript, transformScript,
        timer, resolve, reject
      });
    });
  }

  // 5. Encoding
  if (sendMode === "HEX") {
    dataBytes = hexToBytes(textPayload);
  } else if (sendMode === "BINARY") {
    dataBytes = binaryToBytes(textPayload);
  } else {
    dataBytes = encodeText(textPayload, encoding);  // UTF-8/ASCII/ISO-8859-1
  }

  // 6. Checksum
  if (checksum !== "NONE") {
    const chk = calculateChecksum(dataBytes, checksum);  // MOD256/XOR/CRC16
    dataBytes = concat(dataBytes, chk);
  }

  // 7. Write to port
  await write(activeSessionId, dataBytes);

  // 8. Wait for validation
  return validationPromise;
}
```

#### Validation Hook Flow (useValidation)

```typescript
checkValidation(data: Uint8Array, sessionId: string, logId?: string) {
  activeValidationsRef.current.forEach((val, key) => {
    if (val.sessionId !== sessionId) return;

    let passed = false;

    // Check validation mode
    if (val.mode === "ALWAYS_PASS") passed = true;
    else if (val.mode === "PATTERN") {
      if (val.matchType === "CONTAINS" && textData.includes(val.pattern)) passed = true;
      if (val.matchType === "REGEX" && new RegExp(val.pattern).test(textData)) passed = true;
    }
    else if (val.mode === "SCRIPT") {
      passed = executeUserScript(val.valScript, { data: textData, raw: data }) === true;
    }

    if (passed) {
      clearTimeout(val.timer);
      activeValidationsRef.current.delete(key);

      // Execute transform script
      if (val.transformScript) {
        const setVar = (name, value) => setVariable(name, value, sessionId);
        executeUserScript(val.transformScript, { data: textData, raw: data, setVar, params });
      }

      val.resolve?.();
    }
  });
}
```

#### Scripting Environment (`src/lib/scripting.ts`)

```typescript
export const executeUserScript = (code: string, context: Record<string, unknown>) => {
  const keys = Object.keys(context);      // e.g., ["params", "payload", "log"]
  const values = Object.values(context);
  const func = new Function(...keys, code);  // Creates function with named args
  return func(...values);
};

// Pre-request script example:
// Context: { params: { freq: 500 }, payload: "", log: fn }
// Code: return "SETF " + params.freq;
// Result: "SETF 500"

// Post-response script example:
// Context: { data: '{"temp":25.5}', raw: Uint8Array, setVar: fn, params: {} }
// Code: const json = JSON.parse(data); setVar("Temp", json.temp); return true;
```

---

### Serial Provider Abstraction

#### Provider Architecture (`src/lib/serialService.ts`)

```typescript
interface ISerialProvider {
  isSupported(): boolean;
  getPorts(): Promise<ISerialPort[]>;
  requestPort(): Promise<ISerialPort | null>;
  addEventListener(type: string, listener: (e: Event) => void): void;
  removeEventListener(type: string, listener: (e: Event) => void): void;
}

// Auto-detection priority: Tauri > WebSerial
function createSerialProvider(): ISerialProvider {
  if (__TAURI_ENV_TARGET_TRIPLE__) return new TauriProvider();
  if ("serial" in navigator) return new WebSerialProvider();
  return new WebSerialProvider();  // Fallback
}
```

#### TauriPort Implementation

Bridges Tauri commands to stream-based interface:

```typescript
class TauriPort implements ISerialPort {
  portName: string;
  readable: ReadableStream<Uint8Array> | null = null;
  writable: WritableStream<Uint8Array> | null = null;

  async open(options: SerialOptions): Promise<void> {
    // 1. Call Tauri open_port command
    await TauriSerialAPI.openPort({ portName, baudRate, ... });

    // 2. Create readable stream from Tauri events
    this.readable = new ReadableStream({
      start: async (controller) => {
        this.unlistenRead = await listenToTauriEvent(
          TauriEventNames.PORT_READ,
          (event) => {
            if (event.payload.portName === this.portName) {
              controller.enqueue(new Uint8Array(event.payload.data));
            }
          }
        );
      }
    });

    // 3. Create writable stream to Tauri command
    this.writable = new WritableStream({
      write: (chunk) => TauriSerialAPI.writePort(this.portName, chunk)
    });
  }
}
```

---

### AI Integration (Gemini Service)

#### Service Architecture (`src/services/geminiService.ts`)

```typescript
// Function call tools available to Gemini
const TOOLS: Tool[] = [{
  functionDeclarations: [
    updateConfigTool,        // Update serial configuration
    sendCommandTool,         // Send raw data
    executeSavedCommandTool, // Execute saved command by ID
    runSequenceTool,         // Run sequence by ID
    loadPresetTool,          // Load preset by ID
    readLogsTool,            // Read recent logs
    configureDeviceTool,     // Setup complete device profile
    manageDashboardTool,     // Create/delete dashboard widgets
  ]
}];

// Chat session with project context
export const createChatSession = (projectState?: ProjectSummary) => {
  return ai.chats.create({
    model: "gemini-3-flash-preview",
    config: {
      tools: TOOLS,
      systemInstruction: `
        You are "SerialMan AI"...
        EXISTING PROJECT RESOURCES: ${resourceContext}
        ...
      `
    }
  });
};

// Project generation from description/manual
export const generateProjectFromDescription = async (
  text: string,
  attachment?: { name: string; mimeType: string; data: string }
): Promise<AIProjectResult> => {
  // Returns structured project with commands, sequences, config
};
```

#### AIProjectResult Structure

```typescript
interface AIProjectResult {
  deviceName?: string;
  config?: Partial<SerialConfig>;
  sourceText?: string;
  commands: Omit<SavedCommand, "id" | "createdAt" | "updatedAt" | "creator">[];
  sequences: {
    name: string;
    steps: { commandName: string; delay: number; stopOnError: boolean }[];
  }[];
  usage?: { prompt: number; response: number; total: number };
}
```

---

### Device Management System

#### Device Slice (`src/lib/slices/deviceSlice.ts`)

```typescript
interface DeviceSlice {
  devices: Device[];
  addDevice: (device: Device) => void;
  updateDevice: (id: string, updates: Partial<Device>) => void;
  deleteDevice: (id: string) => void;
  addDeviceAttachment: (deviceId: string, attachment: DeviceAttachment) => void;
  removeDeviceAttachment: (deviceId: string, attachmentId: string) => void;
  assignToDevice: (
    entityType: "command" | "sequence" | "preset",
    entityId: string,
    deviceId: string | null
  ) => void;
}

interface Device {
  id: string;
  name: string;
  icon?: string;
  manufacturer?: string;
  model?: string;
  presetIds: string[];     // Linked presets
  commandIds: string[];    // Linked commands
  sequenceIds: string[];   // Linked sequences
  contextIds: string[];    // Linked contexts
  attachments: DeviceAttachment[];  // Files (datasheets, manuals)
  // ... base entity fields
}

interface DeviceAttachment {
  id: string;
  name: string;
  filename: string;
  mimeType: string;
  size: number;
  data: string;  // Base64 encoded
  category: "DATASHEET" | "MANUAL" | "SCHEMATIC" | "PROTOCOL" | "IMAGE" | "OTHER";
}
```

---

### Dashboard & Telemetry

#### Widget Types

| Type | Component | Use Case |
|------|-----------|----------|
| `CARD` | `ValueCardWidget` | Single value display |
| `LINE` | `LineChartWidget` | Time-series chart |
| `GAUGE` | `GaugeWidget` | Dial/meter display |

#### Telemetry Variable Flow

```typescript
// 1. Script extracts variable from response
// In post-response script:
setVar("Temperature", json.temp);

// 2. sessionSlice.setVariable updates state
setVariable(name, value, sessionId) => {
  // Auto-create widget if not exists
  if (!widgetExists) {
    newWidgets = [...session.widgets, {
      id: generateId(),
      title: name,
      variableName: name,
      config: { type: "CARD", width: 1 }
    }];
  }

  // Track history for charting (last 200 points)
  history = [...existing.history, { time: timestamp, val: value }].slice(-200);
}

// 3. Widget renders from variables
const variable = session.variables[widget.variableName];
```

#### Plotter System

```typescript
interface PlotterState {
  config: PlotterConfig;
  data: PlotterDataPoint[];    // Time-series data
  series: string[];            // Discovered series names
  aliases: Record<string, string>;  // Series name aliases
}

interface PlotterConfig {
  enabled: boolean;
  parser: "CSV" | "JSON" | "CUSTOM";
  bufferSize: number;  // Max data points
  autoDiscover: boolean;  // Auto-detect series
}

// Data parsing (src/lib/plotterParser.ts)
export const parsePlotterData = (
  data: Uint8Array,
  config: PlotterConfig
): PlotterDataPoint | null => {
  // Parses incoming frame into { time, val1, val2, ... }
};
```

---

## Important Patterns & Conventions

### Component Organization

```
src/components/
├── ui/                 # Primitives (Button, Input, Modal, etc.)
├── console/            # Console-related (StreamPanel, HexDataView, etc.)
│   └── widgets/        # Dashboard widgets (GaugeWidget, LineChartWidget)
├── shared/             # Shared between features (FramingConfigEditor)
├── RightSidebar/       # Right sidebar panels (AIAssistantContent, CommandEditor)
└── *.tsx               # Feature components (Sidebar, ControlPanel, etc.)
```

### Modal Pattern

```typescript
// Controlled by UI slice state
const { editingPreset, setEditingPreset } = useStore();

{editingPreset && (
  <PresetFormModal
    initialData={editingPreset}
    onSave={(data) => { ... }}
    onClose={() => setEditingPreset(null)}
  />
)}
```

### Selector Pattern

```typescript
// src/lib/selectors.ts - Memoized selectors
export const selectActiveSession = (state: AppState) =>
  state.sessions[state.activeSessionId];

// Usage with hook
const activeSession = useStore(selectActiveSession);
```

### Data Encoding Utilities (`src/lib/dataUtils.ts`)

```typescript
// Text encoding
encodeText(text: string, encoding: TextEncoding): Uint8Array;

// Checksum calculation
calculateChecksum(data: Uint8Array, algo: ChecksumAlgorithm): Uint8Array;
// Algorithms: MOD256, XOR, CRC16 (Modbus)

// Hex conversion
hexToBytes(hexStr: string): Uint8Array;
bytesToHex(bytes: Uint8Array, uppercase?: boolean, separator?: string): string;
```

### Constants (`src/lib/constants.ts`)

```typescript
export const TIMING = {
  FRAMING_OVERRIDE_TIMEOUT_MS: 5000,
  DEFAULT_VALIDATION_TIMEOUT_MS: 2000,
  SEQUENCE_STEP_DELAY_MS: 500,
};

export const BUFFER_SIZES = {
  DEFAULT_LOG_BUFFER: 1000,
  MAX_PREVIEW_LENGTH: 50,
};
```

---

## Development Guidelines

### Adding New Tauri Commands

1. **Define function** in `src-tauri/src/serial_mgr/*.rs`:
```rust
#[tauri::command(rename_all = "camelCase")]
pub async fn my_command(
    state: tauri::State<'_, AppState>,
    arg1: String,
) -> Result<ReturnType, String> { ... }
```

2. **Register in** `src-tauri/src/lib.rs`:
```rust
.invoke_handler(tauri::generate_handler![
    // ...existing commands
    my_command,
])
```

3. **Define TypeScript types** in `src/lib/tauri/commands.ts`:
```typescript
export interface MyCommand {
  name: "my_command";
  args: { arg1: string };
  returns: ReturnType;
}
```

4. **Add to API wrapper** in `src/lib/tauri/api.ts`

### Adding New State

1. **Determine slice**: UI, Project, Session, or Device
2. **Add to slice** in `src/lib/slices/*.ts`:
```typescript
// In interface
myField: MyType;
setMyField: (value: MyType) => void;

// In createSlice
myField: defaultValue,
setMyField: (value) => set({ myField: value }),
```
3. **Add to persistence** if needed in `store.ts` partialize function

### Working with Serial Ports

- All I/O goes through Rust backend via Tauri commands
- Frontend receives data via `PORT_READ` events → `useFraming` → `useValidation`
- Use `MockPort` for testing: `connect(sessionId, config, networkConfig, "mock:echo")`

### Styling

- TailwindCSS 4.x with custom theme colors
- `cn()` utility for conditional classes
- Theme colors: zinc, blue, green, orange, rose, yellow
- Theme modes: light, dark, system

---

## Plans & Progresses

- Write intermediate files in `./.claude/` folder
- Always update docs after code changes

### Quality Assurance

After code changes:
```bash
pnpm run lint        # ESLint
pnpm run type-check  # TypeScript
pnpm run format      # Prettier
```

### Testing

- Update mock implementations (`src/lib/mockPort.ts`) for hardware features
- Tests in `src/tests/` using Vitest

---

## Documents & Resources

- shadcn: https://ui.shadcn.com/llms.txt
- Tauri v2: https://v2.tauri.app/
- tokio-serial: https://crates.io/crates/tokio-serial
- SeaORM: https://www.sea-ql.org/SeaORM/
