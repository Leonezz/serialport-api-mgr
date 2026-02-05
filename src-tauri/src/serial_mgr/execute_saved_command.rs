//! Execute saved commands with context support.

use crate::serial_mgr::helpers::{get_port_sender, send_command_with_ack};
use crate::serial_mgr::port_task::{WriteCmd, WritePortMessage};
use crate::state::AppState;

/// Execute a saved command with optional context IDs for logging.
/// The command data is processed and sent to the serial port.
///
/// Note: The `context_ids` parameter is accepted for API consistency but context
/// association is handled on the frontend side. The context IDs are logged in
/// the tracing span for debugging purposes but are not stored in the backend.
/// Frontend manages the mapping between commands, logs, and their contexts.
#[tauri::command(rename_all = "camelCase")]
#[specta::specta]
pub async fn execute_saved_command(
    state: tauri::State<'_, AppState>,
    port_name: String,
    command_data: Vec<u8>,
    message_id: String,
    #[allow(unused_variables)] context_ids: Option<Vec<String>>,
) -> Result<(), String> {
    let span = tracing::debug_span!(
        "execute_saved_command",
        %port_name,
        %message_id,
        context_count = context_ids.as_ref().map(|c| c.len()).unwrap_or(0)
    );
    let _guard = span.enter();

    tracing::debug!(
        "Executing saved command with {} bytes of data",
        command_data.len()
    );

    let sender = get_port_sender(&state, &port_name).await?;
    let cmd = WriteCmd::Message(WritePortMessage {
        data: command_data,
        message_id,
    });

    send_command_with_ack(&sender, cmd, "execute saved command", &port_name).await?;

    tracing::debug!("Saved command executed successfully");
    Ok(())
}
