//! Error types for the serial port application.
//!
//! This module provides structured error types using `thiserror` for library-level
//! errors and integrates with `anyhow` for rich error context in commands.

use thiserror::Error;

/// Serial port related errors
#[derive(Debug, Error)]
pub enum SerialError {
    /// Port was not found in the system
    #[error("Port '{0}' not found")]
    PortNotFound(String),

    /// Failed to open the serial port
    #[error("Failed to open port '{port}': {source}")]
    OpenFailed {
        port: String,
        #[source]
        source: tokio_serial::Error,
    },

    /// Port is not currently open
    #[error("Port '{0}' is not open")]
    PortNotOpen(String),

    /// Failed to write to the port
    #[error("Failed to write to port '{port}': {message}")]
    WriteFailed { port: String, message: String },

    /// Failed to read from the port
    #[error("Failed to read from port '{port}': {message}")]
    ReadFailed { port: String, message: String },

    /// Invalid configuration provided
    #[error("Invalid configuration: {0}")]
    InvalidConfig(String),

    /// Port is already open
    #[error("Port '{0}' is already open")]
    PortAlreadyOpen(String),

    /// Operation timed out
    #[error("Operation timed out for port '{0}'")]
    Timeout(String),
}

/// Application-level errors that can be returned from Tauri commands
#[derive(Debug, Error)]
pub enum AppError {
    /// Serial port error
    #[error(transparent)]
    Serial(#[from] SerialError),

    /// State access error
    #[error("Failed to access application state: {0}")]
    StateError(String),

    /// IO error
    #[error("IO error: {0}")]
    Io(#[from] std::io::Error),

    /// Serialization error
    #[error("Serialization error: {0}")]
    Serialization(#[from] serde_json::Error),

    /// Generic error with context
    #[error("{0}")]
    Other(String),
}

// Implement conversion to string for Tauri command results
impl From<AppError> for String {
    fn from(err: AppError) -> Self {
        err.to_string()
    }
}

// Allow anyhow errors to be converted to AppError
impl From<anyhow::Error> for AppError {
    fn from(err: anyhow::Error) -> Self {
        AppError::Other(format!("{:#}", err))
    }
}

/// Type alias for command results
pub type CommandResult<T> = Result<T, String>;

/// Extension trait for converting errors to command results
pub trait IntoCommandResult<T> {
    /// Convert to a command result with error as string
    fn into_cmd_result(self) -> CommandResult<T>;
}

impl<T, E: std::fmt::Display> IntoCommandResult<T> for Result<T, E> {
    fn into_cmd_result(self) -> CommandResult<T> {
        self.map_err(|e| e.to_string())
    }
}
