//! Event emitted when data is read from a serial port.

use crate::serial_mgr::helpers::timestamp_now_ms;

/// Payload for port read events.
#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
pub struct PortReadEvent {
    /// Name of the port that received data
    pub port_name: String,
    /// Timestamp when data was received (milliseconds since Unix epoch)
    pub timestamp_ms: u128,
    /// The raw data bytes received
    pub data: Vec<u8>,
}

impl PortReadEvent {
    /// Create a new PortReadEvent with current timestamp.
    pub fn new(port_name: String, data: Vec<u8>) -> Self {
        Self {
            port_name,
            timestamp_ms: timestamp_now_ms(),
            data,
        }
    }

    /// Create a new PortReadEvent with a specific timestamp.
    pub fn with_timestamp(port_name: String, data: Vec<u8>, timestamp_ms: u128) -> Self {
        Self {
            port_name,
            timestamp_ms,
            data,
        }
    }
}
