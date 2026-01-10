//! Centralized constants for the serial port manager.
//!
//! These values can be externalized to a config file in the future.

/// Serial port related constants.
pub mod serial {
    /// Size of the buffer for reading serial port data.
    pub const READ_BUFFER_SIZE: usize = 1024;

    /// Interval for polling modem status in milliseconds.
    pub const STATUS_POLL_INTERVAL_MS: u64 = 1000;

    /// Default timeout for serial operations in milliseconds.
    pub const DEFAULT_TIMEOUT_MS: u64 = 1000;
}

/// Channel capacity constants.
pub mod channels {
    /// Capacity of the write command channel.
    pub const WRITE_CMD_CAPACITY: usize = 32;

    /// Capacity of the event channel.
    pub const EVENT_CAPACITY: usize = 32;

    /// Capacity of the write notification channel.
    pub const WRITE_NOTIFY_CAPACITY: usize = 10;
}
