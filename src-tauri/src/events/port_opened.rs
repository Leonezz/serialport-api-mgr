//! Event emitted when a serial port is opened.

use crate::serial_mgr::helpers::timestamp_now_ms;

/// Payload for port opened events.
#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
pub struct PortOpenedEvent {
    /// Name of the port that was opened
    pub port_name: String,
    /// Timestamp when port was opened (milliseconds since Unix epoch)
    pub timestamp_ms: u128,
}

impl PortOpenedEvent {
    /// Create a new PortOpenedEvent with current timestamp.
    pub fn new(port_name: String) -> Self {
        Self {
            port_name,
            timestamp_ms: timestamp_now_ms(),
        }
    }
}

// Keep backward compatibility with existing code that uses PortOpenEvent
pub type PortOpenEvent = PortOpenedEvent;
