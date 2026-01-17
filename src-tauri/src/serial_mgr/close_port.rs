//! Close port operations.

use rootcause::prelude::ResultExt;
use tauri::{AppHandle, Emitter};

use crate::events::{event_names, PortClosedEvent};
use crate::serial_mgr::helpers::{get_port_sender, send_command_with_ack};
use crate::serial_mgr::port_task::WriteCmd;
use crate::state::AppState;

/// Close an open serial port.
#[tauri::command(rename_all = "camelCase")]
pub async fn close_port(
    app: AppHandle,
    state: tauri::State<'_, AppState>,
    port_name: String,
) -> Result<(), String> {
    let span = tracing::debug_span!("close_port", %port_name);
    let _guard = span.enter();

    let sender = get_port_sender(&state, &port_name).await?;

    send_command_with_ack(&sender, WriteCmd::Close, "close port", &port_name).await?;

    tracing::info!("port closed successfully");
    app.emit(
        event_names::PORT_CLOSED,
        PortClosedEvent::user_requested(port_name.clone()),
    )
    .context("emit port closed event")
    .attach(port_name)
    .map_err(|err| {
        tracing::error!("emit port closed event failed: {}", err);
        err.to_string()
    })?;

    Ok(())
}
