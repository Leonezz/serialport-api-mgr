//! Event definitions for the serial port manager.

pub mod message_read;
pub mod port_closed;
pub mod port_opened;

/// Type-safe event name constants.
///
/// Use these constants instead of string literals when emitting events.
pub mod event_names {
    /// Emitted when a serial port is successfully opened.
    pub const PORT_OPENED: &str = "port_opened";

    /// Emitted when a serial port is closed.
    pub const PORT_CLOSED: &str = "port_closed";

    /// Emitted when data is read from a serial port.
    pub const PORT_READ: &str = "port_read";

    /// Emitted when an error occurs on a serial port.
    pub const PORT_ERROR: &str = "port_error";
}

// Re-export event types for convenience
pub use message_read::PortReadEvent;
pub use port_closed::PortClosedEvent;
pub use port_opened::PortOpenedEvent;
