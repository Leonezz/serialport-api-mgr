# Tauri Backend Rust Conventions

## Architecture Overview
- **Pattern**: Actor-like with Tokio tasks per port
- **IPC**: Channel-based (mpsc for commands, oneshot for acks, watch for status)
- **State**: AppState with `tokio::sync::RwLock<HashMap>` for ports and handles
- **Error Handling**: `rootcause` crate for context chaining

## Module Structure

```\nsrc-tauri/src/
├── lib.rs # Entry point, command registration
├── state.rs # AppState and port structures
├── util.rs # AckSender, InterruptSender types
├── constants.rs # Centralized constants
├── events/ # Event definitions with event_names constants
    ├── serial/ # Type definitions (DataBits, Parity, FlowControl, etc.)
    └── serial_mgr/ # Port management (open, close, write, helpers)
```

## Key Conventions

### Error Handling

- Internal: `rootcause::Report` with `.context()` and `.attach()`
- Tauri commands: Return `Result<T, String>`, convert with `.map_err(|e| e.to_string())`
- Always log errors before returning

### Type Definitions

- Standard derives: `Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize`
- Event structs include `timestamp_ms: u128`
- Use `FromStr` with case-insensitive matching

### Event System

- Constants in `events::event_names` module
- Structured enums for close reasons (PortCloseReason)
- All events serializable with serde

### Naming

- Functions: `snake_case`
- Types: `PascalCase`
- Constants: `SCREAMING_SNAKE_CASE`
- Event structs: suffix with `Event`

## Key Files Reference

- **Port task loop**: `serial_mgr/port_task.rs` (tokio::select! for read/write/status)
- **Helpers**: `serial_mgr/helpers.rs` (get_port_sender, send_command_with_ack)
- **Constants**: `constants.rs` (READ_BUFFER_SIZE, channel capacities)