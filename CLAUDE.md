# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**serialport-api-mgr** is a Tauri desktop application for serial port management and communication testing. It provides a comprehensive UI for interacting with serial devices, executing commands, managing sequences, and analyzing protocol data.

**Tech Stack:**
- **Frontend:** React 19 + TypeScript + Vite + TailwindCSS
- **Backend:** Tauri 2.x + Rust (tokio-serial for serial port handling)
- **State Management:** Zustand with slice pattern
- **UI Components:** Custom components with lucide-react icons
- **AI Integration:** Google Gemini API for command generation

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
```

### Package Manager
This project uses **pnpm** (v10.27.0). Always use `pnpm` instead of npm or yarn.

## Architecture Overview

### Frontend Architecture

**State Management (Zustand with Slices):**
- Store located at `src/lib/store.ts` combines three slices:
  - `uiSlice.ts` - UI state (modals, toasts, theme, sidebar visibility)
  - `projectSlice.ts` - Project data (presets, commands, sequences, contexts)
  - `sessionSlice.ts` - Session state (connections, logs, config per session)
- Each slice uses `StateCreator<>` pattern from zustand
- Access via `useStore()` hook throughout components

**Session Management:**
- Multi-session support with tabs (like terminal tabs)
- Each session has independent: config, logs, connection state, framing state
- Active session determined by `activeSessionId`
- Sessions stored in `sessions` map keyed by session ID

**Key Hooks:**
- `useProjectState.ts` - Legacy hook for project state (being migrated to zustand)
- `useSerialConnection.ts` - Serial port connection lifecycle

**Data Flow:**
1. User interaction → Component
2. Component → Zustand store action
3. Store updates → Component re-renders
4. For serial I/O → Tauri commands → Rust backend

### Backend Architecture (Rust/Tauri)

**Module Structure (`src-tauri/src/`):**
- `lib.rs` - Entry point, registers Tauri commands
- `state.rs` - Global app state (ports map, port handles)
- `serial/` - Serial port type definitions (DataBits, Parity, StopBits, etc.)
- `serial_mgr/` - Serial port management logic:
  - `open_port.rs` - Opens serial ports, spawns read task
  - `close_port.rs` - Closes ports, cleans up tasks
  - `write_port.rs` - Write data, control DTR/RTS signals
  - `port_task.rs` - Async task for reading serial data
  - `update_ports.rs` - Enumerate available ports
  - `log.rs` - Logging commands (debug, info, warn, error)
- `events/` - Tauri event definitions (port_opened, port_closed, message_read)

**Tauri Commands** (callable from frontend):
- `get_all_port_info()` - List available serial ports
- `open_port(port_name, config)` - Open port with config
- `close_port(port_name)` - Close port
- `write_port(port_name, data)` - Send data to port
- `write_data_terminal_ready(port_name, level)` - Control DTR
- `write_request_to_send(port_name, level)` - Control RTS
- `log(prefix, content)`, `info()`, `warn()`, `error()`, `debug()` - Logging

**Event System:**
- Backend emits events to frontend via `app_handle.emit_to()`
- Events: `port-opened`, `port-closed`, `message-read`
- Frontend listens via `@tauri-apps/api` event listeners

**Concurrency:**
- Uses tokio async runtime
- Each open port spawns dedicated read task (`spawn_serial_task`)
- State shared via `tokio::sync::RwLock` in `AppState`

### Type System & Schemas

**Zod Schemas (`src/lib/schemas.ts`):**
- All data structures defined with Zod for runtime validation
- Key schemas: `SerialConfigSchema`, `SavedCommandSchema`, `SerialSequenceSchema`, `ProjectContextSchema`
- Enums defined with Zod: `DataModeSchema`, `LineEndingSchema`, `FramingStrategySchema`

**Type Inference:**
```typescript
// Types inferred from Zod schemas in src/types.ts
export type SerialConfig = z.infer<typeof SerialConfigSchema>;
```

### Framing & Protocol Handling

**Framing Strategies (`src/lib/framing.ts`):**
- NONE - Pass-through (no framing)
- DELIMITER - Split on delimiter bytes
- TIMEOUT - Time-based frame boundaries
- PREFIX_LENGTH - Length-prefixed frames
- SCRIPT - Custom JavaScript framing logic

**Framing State:**
- Per-session framing instance stored in `framersRef`
- Supports temporary framing override with expiration
- Processes incoming serial data into logical frames

### Command & Sequence System

**Commands (`SavedCommand`):**
- Stored in zustand project slice
- Support parameters (STRING, INTEGER, FLOAT, ENUM, BOOLEAN)
- Validation: pattern matching (CONTAINS/REGEX), timeout
- Scripting: pre/post-transform, custom validation
- Checksum: MOD256, XOR, CRC16
- Track usage in sequences (`usedBy` field)

**Sequences (`SerialSequence`):**
- Ordered list of commands with delays
- Loop support (repeatCount)
- Execute via ControlPanel component
- Updates command usage tracking on modification

### AI Integration

**Gemini Service (`src/services/geminiService.ts`):**
- Generates commands/sequences from natural language
- Returns structured `AIProjectResult` with commands, sequences, contexts
- Used by `AICommandGeneratorModal` component

## Important Patterns & Conventions

### Component Organization
- UI primitives in `src/components/ui/`
- Feature components in `src/components/`
- Console-specific in `src/components/console/`
- Right sidebar features in `src/components/RightSidebar/`

### Modal Pattern
All modals follow similar pattern:
```typescript
{showModal && <ModalComponent onClose={() => setShowModal(false)} ... />}
```
Controlled by zustand UI slice state

### Data Encoding
- Text modes: UTF-8, ASCII, ISO-8859-1
- Data modes: TEXT, HEX, BINARY
- Utilities in `src/lib/dataUtils.ts` (encodeText, calculateChecksum, hexToBytes)

### Logging System
- **Console Logs** - User-facing serial data display (stored per session)
- **System Logs** - Operation history (commands sent, errors, events)
- Both use zustand session slice

### Environment Variables
- `GEMINI_API_KEY` - Required for AI features
- Defined in Vite config as `process.env.API_KEY` and `process.env.GEMINI_API_KEY`

## Development Notes

### Adding New Tauri Commands
1. Define function in appropriate `src-tauri/src/serial_mgr/*.rs` file
2. Add to `invoke_handler!` macro in `src-tauri/src/lib.rs`
3. Call from frontend using `invoke('command_name', { args })`

### Adding New State
1. Determine if UI, Project, or Session state
2. Add to appropriate slice in `src/lib/slices/`
3. Export from `src/lib/store.ts`
4. Use via `useStore()` hook

### Working with Serial Ports
- All serial I/O goes through Rust backend
- Frontend receives data via `message-read` events
- Data arrives as `Uint8Array`, processed by framing logic
- Never mock serial operations in production code (use `mockPort.ts` only for testing)

### Styling
- TailwindCSS 4.x for styling
- Custom utility `cn()` for conditional classes
- Theme colors: zinc, blue, green, orange, rose, yellow
- Theme modes: light, dark, system

### Project Persistence
- No auto-save mentioned in codebase
- Project export/import via `ExportProfileSchema`
- Stores commands, sequences, presets, contexts

## Plans & Progresses & Other Intermediate Files

- Write plans, progresses and other intermediate files in the `./.claude/` folder under the project folder, instead of the global `~/.claude/` folder.
- Always update documents after making code changes.

- **Quality Assurance:** After making code changes and fixing errors:
    *   Run `pnpm run lint` to detect ESLint errors.
    *   Run `pnpm run type-check` (or `tsc`) to detect type errors.
    *   Run `pnpm run format` to ensure code style consistency.
-  **Mocking:** When implementing features that interact with hardware or external systems (like serial ports), **always** write or update mock implementations (e.g., `src/lib/mockPort.ts`) to allow testing without physical devices.

## Documents
- shadcn: https://ui.shadcn.com/llms.txt
