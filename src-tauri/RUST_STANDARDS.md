# Rust Coding Standards

This document establishes coding standards and conventions for the Tauri backend Rust codebase of the Serial Port API Manager.

---

## 1. Error Handling

### 1.1 Error Types

Use `rootcause::Report` as the primary error type for internal operations:

```rust
use rootcause::{Report, report};
use rootcause::prelude::ResultExt;

// Creating errors
Err(report!("descriptive error message: {}", context))

// Chaining context
result.context("operation description").attach(additional_context)?;
```

### 1.2 Tauri Command Returns

All Tauri commands MUST return `Result<T, String>`:

```rust
#[tauri::command(rename_all = "snake_case")]
pub async fn my_command(...) -> Result<(), String> {
    internal_operation().await.map_err(|err| {
        tracing::error!("operation failed: {}", err);
        err.to_string()
    })?;
    Ok(())
}
```

### 1.3 Error Logging

- **Always log errors** before returning them to the frontend
- Use `tracing::error!` for failures, `tracing::warn!` for recoverable issues

### 1.4 No Silent Failures

Never silently ignore errors:

```rust
// BAD
let _ = port.write_data_terminal_ready(v.dtr);

// GOOD
if let Err(e) = port.write_data_terminal_ready(v.dtr) {
    tracing::warn!("Failed to set DTR: {}", e);
}
```

---

## 2. Type Definitions

### 2.1 Standard Derive Traits

All enums and structs MUST derive a consistent set of traits:

```rust
// For simple enums (configuration values)
#[derive(Debug, Clone, Copy, PartialEq, Eq, serde::Serialize, serde::Deserialize)]
pub enum MyEnum { ... }

// For structs with owned data
#[derive(Debug, Clone, PartialEq, Eq, serde::Serialize, serde::Deserialize)]
pub struct MyStruct { ... }

// For event payloads
#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
pub struct MyEvent { ... }
```

### 2.2 Display Implementations

Display implementations MUST NOT include type prefixes:

```rust
// GOOD
impl fmt::Display for Parity {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        let s = match self {
            Self::Odd => "odd",
            Self::Even => "even",
            Self::None => "none",
        };
        f.write_str(s)
    }
}
```

### 2.3 FromStr Implementations

Use case-insensitive matching:

```rust
impl FromStr for MyEnum {
    type Err = Report;

    fn from_str(s: &str) -> Result<Self, Self::Err> {
        match s.to_lowercase().as_str() {
            "value" => Ok(Self::Value),
            _ => Err(report!("unknown value: {}", s)),
        }
    }
}
```

---

## 3. Event System

### 3.1 Event Name Constants

Define all event names in `events::event_names`:

```rust
pub mod event_names {
    pub const PORT_OPENED: &str = "port_opened";
    pub const PORT_CLOSED: &str = "port_closed";
    pub const PORT_READ: &str = "port_read";
    pub const PORT_ERROR: &str = "port_error";
}
```

### 3.2 Event Payload Structure

All events MUST include a timestamp:

```rust
#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
pub struct PortOpenedEvent {
    pub port_name: String,
    pub timestamp_ms: u128,
}
```

### 3.3 Structured Enums

Use enums for close reasons and error types:

```rust
#[derive(Debug, Clone, Copy, serde::Serialize, serde::Deserialize)]
pub enum PortCloseReason {
    UserRequested,
    ConnectionLost,
    Error,
    Timeout,
}
```

### 3.4 Event Location

All event structs MUST be defined in `src/events/`.

---

## 4. Naming Conventions

| Category | Convention | Example |
|----------|------------|---------|
| Functions | `snake_case` | `open_port`, `get_all_port_info` |
| Types | `PascalCase` | `PortOpenedEvent`, `SerialConfig` |
| Constants | `SCREAMING_SNAKE_CASE` | `READ_BUFFER_SIZE` |
| Event structs | Suffix with `Event` | `PortClosedEvent` |
| Config structs | Suffix with `Config` | `SerialTaskConfig` |

---

## 5. Code Organization

### 5.1 Module Structure

```
src/
├── lib.rs           # Entry point, command registration
├── state.rs         # AppState and related types
├── util.rs          # Shared utilities
├── constants.rs     # Centralized constants
├── events/          # Event definitions
├── serial/          # Type definitions
└── serial_mgr/      # Port management (with helpers.rs)
```

### 5.2 Helper Functions

Extract repeated patterns into helper functions in `serial_mgr/helpers.rs`.

### 5.3 Import Organization

```rust
// Standard library
use std::{collections::HashMap, time::Duration};

// External crates (alphabetical)
use rootcause::{Report, report};
use serde::{Deserialize, Serialize};
use tauri::{AppHandle, Emitter, Manager};

// Internal crates (by module hierarchy)
use crate::events::event_names;
use crate::state::AppState;
```

---

## 6. Constants

### 6.1 Location

Define all magic numbers in `src/constants.rs`:

```rust
pub mod serial {
    pub const READ_BUFFER_SIZE: usize = 1024;
    pub const STATUS_POLL_INTERVAL_MS: u64 = 1000;
}

pub mod channels {
    pub const WRITE_CMD_CAPACITY: usize = 32;
    pub const EVENT_CAPACITY: usize = 32;
}
```

### 6.2 Usage

```rust
use crate::constants::{serial, channels};

let mut buf = [0u8; serial::READ_BUFFER_SIZE];
```

---

## 7. Async Patterns

### 7.1 Task Spawning

Always use tracing spans:

```rust
let span = tracing::debug_span!("task_name", port_name);
tokio::spawn(async move {
    // task body
}.instrument(span));
```

### 7.2 Channel Selection

| Use Case | Channel Type |
|----------|--------------|
| Command queue | `mpsc::channel` |
| Single response | `oneshot::channel` |
| Status broadcast | `watch::channel` |

---

## 8. Logging

### 8.1 Log Levels

| Level | Use Case |
|-------|----------|
| `error!` | Unrecoverable errors, failures |
| `warn!` | Recoverable issues |
| `info!` | Important lifecycle events |
| `debug!` | Detailed operational info |
| `trace!` | Very detailed debugging |

### 8.2 Structured Logging

```rust
tracing::info!(
    port_name = %port_name,
    baud_rate = baud_rate,
    "Port opened successfully"
);
```

---

## 9. Code Review Checklist

- [ ] All derive traits are consistent
- [ ] No Display implementations with type prefixes
- [ ] All Tauri commands return `Result<T, String>`
- [ ] All errors are logged before returning
- [ ] No silent failures (`let _ = ...`)
- [ ] Event names use constants from `event_names` module
- [ ] Magic numbers are externalized to `constants.rs`
- [ ] Helper functions used for repeated patterns
- [ ] Correct spelling (especially `available`)
