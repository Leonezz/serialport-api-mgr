//! Event emitted when a serial port is closed.

use crate::serial_mgr::helpers::timestamp_now_ms;

/// Reason why a port was closed.
#[derive(Debug, Clone, PartialEq, Eq, serde::Serialize, serde::Deserialize)]
pub enum PortCloseReason {
    /// User explicitly requested close
    UserRequested,
    /// Connection was lost unexpectedly
    ConnectionLost,
    /// An error occurred
    Error,
    /// Operation timed out
    Timeout,
}

impl std::fmt::Display for PortCloseReason {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        let s = match self {
            Self::UserRequested => "User Requested",
            Self::ConnectionLost => "Connection Lost",
            Self::Error => "Error",
            Self::Timeout => "Timeout",
        };
        f.write_str(s)
    }
}

/// Payload for port closed events.
#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct PortClosedEvent {
    /// Name of the port that was closed
    pub port_name: String,
    /// Reason for closure (string for backward compatibility)
    pub reason: String,
    /// Timestamp when port was closed (milliseconds since Unix epoch)
    pub timestamp_ms: u128,
}

impl PortClosedEvent {
    /// Create a new user-requested close event.
    pub fn user_requested(port_name: String) -> Self {
        Self {
            port_name,
            reason: PortCloseReason::UserRequested.to_string(),
            timestamp_ms: timestamp_now_ms(),
        }
    }

    /// Create a new error close event.
    pub fn error(port_name: String, message: &str) -> Self {
        Self {
            port_name,
            reason: format!("{}: {}", PortCloseReason::Error, message),
            timestamp_ms: timestamp_now_ms(),
        }
    }

    /// Create a new connection lost event.
    pub fn connection_lost(port_name: String) -> Self {
        Self {
            port_name,
            reason: PortCloseReason::ConnectionLost.to_string(),
            timestamp_ms: timestamp_now_ms(),
        }
    }
}
