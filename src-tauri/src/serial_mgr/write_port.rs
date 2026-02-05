//! Write operations for serial ports.

use crate::serial_mgr::helpers::{get_port_sender, send_command_with_ack};
use crate::serial_mgr::port_task::{
    WriteCmd, WritePortDataTerminalReady, WritePortMessage, WritePortRequestToSend,
};
use crate::state::AppState;

/// Write data to a serial port.
#[tauri::command(rename_all = "camelCase")]
#[specta::specta]
pub async fn write_port(
    state: tauri::State<'_, AppState>,
    port_name: String,
    data: Vec<u8>,
    message_id: String,
) -> Result<(), String> {
    let span = tracing::debug_span!("write_port", %port_name, %message_id);
    let _guard = span.enter();

    let sender = get_port_sender(&state, &port_name).await?;
    let cmd = WriteCmd::Message(WritePortMessage { data, message_id });

    send_command_with_ack(&sender, cmd, "write port data", &port_name).await
}

/// Set the Request to Send (RTS) signal.
#[tauri::command(rename_all = "camelCase")]
#[specta::specta]
pub async fn write_request_to_send(
    state: tauri::State<'_, AppState>,
    port_name: String,
    rts: bool,
) -> Result<(), String> {
    let span = tracing::debug_span!("write_rts", %port_name, rts);
    let _guard = span.enter();

    let sender = get_port_sender(&state, &port_name).await?;
    let cmd = WriteCmd::Rts(WritePortRequestToSend { rts });

    send_command_with_ack(&sender, cmd, "write RTS", &port_name).await
}

/// Set the Data Terminal Ready (DTR) signal.
#[tauri::command(rename_all = "camelCase")]
#[specta::specta]
pub async fn write_data_terminal_ready(
    state: tauri::State<'_, AppState>,
    port_name: String,
    dtr: bool,
) -> Result<(), String> {
    let span = tracing::debug_span!("write_dtr", %port_name, dtr);
    let _guard = span.enter();

    let sender = get_port_sender(&state, &port_name).await?;
    let cmd = WriteCmd::Dtr(WritePortDataTerminalReady { dtr });

    send_command_with_ack(&sender, cmd, "write DTR", &port_name).await
}
