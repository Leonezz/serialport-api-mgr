//! Shared helper functions for serial port management operations.

use crate::serial_mgr::port_task::{WriteCmd, WritePortSender};
use crate::state::AppState;
use rootcause::prelude::ResultExt;

/// Retrieves the write channel sender for an open port.
///
/// # Arguments
/// * `state` - The application state containing port handles
/// * `port_name` - Name of the port to get the handle for
///
/// # Returns
/// * `Ok(WritePortSender)` - Clone of the sender channel
/// * `Err(String)` - Error message if port is not open
pub async fn get_port_sender(
    state: &AppState,
    port_name: &str,
) -> Result<WritePortSender, String> {
    let guard = state.port_handles.read().await;
    guard
        .get(port_name)
        .map(|handles| handles.write_port_tx.clone())
        .ok_or_else(|| format!("port {} not opened", port_name))
}

/// Sends a command to a port and waits for acknowledgment.
///
/// # Arguments
/// * `sender` - The channel sender for the port
/// * `cmd` - The command to send
/// * `operation` - Description of the operation (for error messages)
/// * `port_name` - Name of the port (for error context)
///
/// # Returns
/// * `Ok(())` - Command was sent and acknowledged
/// * `Err(String)` - Error message if send or ack failed
pub async fn send_command_with_ack(
    sender: &WritePortSender,
    cmd: WriteCmd,
    operation: &str,
    port_name: &str,
) -> Result<(), String> {
    let (ack_tx, ack_rx) = tokio::sync::oneshot::channel();
    let operation = operation.to_string();
    let port_name = port_name.to_string();

    sender
        .send((cmd, Some(ack_tx)))
        .await
        .context(operation.clone())
        .attach(port_name.clone())
        .map_err(|err| {
            tracing::error!("{} failed: {}", operation, err);
            err.to_string()
        })?;

    ack_rx
        .await
        .context(format!("wait {} ack", operation))
        .attach(port_name)
        .map_err(|err| {
            tracing::error!("wait {} ack failed: {}", operation, err);
            err.to_string()
        })?;

    Ok(())
}

/// Get current timestamp in milliseconds since Unix epoch.
pub fn timestamp_now_ms() -> u128 {
    std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .unwrap_or_default()
        .as_millis()
}
