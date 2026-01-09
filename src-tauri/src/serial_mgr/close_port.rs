use rootcause::prelude::ResultExt;
use tauri::{AppHandle, Emitter};

use crate::{
    events::port_closed::PortClosedEvent, serial_mgr::port_task::WriteCmd, state::AppState,
};

#[tauri::command(rename_all = "snake_case")]
pub async fn close_port(
    app: AppHandle,
    state: tauri::State<'_, AppState>,
    port_name: String,
) -> Result<(), String> {
    let span = tracing::debug_span!("close port", port_name);
    let _guard = span.enter();
    let command_tx = {
        let guard = state.port_handles.write().await;
        let entry = guard.get(&port_name);
        if let Some(entry) = entry {
            entry.write_port_tx.clone()
        } else {
            return Err(format!("port {} not opened", port_name));
        }
    };
    let (tx, rx) = tokio::sync::oneshot::channel();
    command_tx
        .send((WriteCmd::Close, Some(tx)))
        .await
        .context("send close command")
        .attach(port_name.clone())
        .map_err(|err| {
            tracing::error!("close port failed with err: {}", err);
            err.to_string()
        })?;
    rx.await
        .context("wait close command ack")
        .attach(port_name.clone())
        .map_err(|err| {
            tracing::error!("wait close command ack failed with err: {}", err);
            err.to_string()
        })?;
    app.emit(
        "port_closed",
        PortClosedEvent {
            port_name: port_name.clone(),
            reason: "Active Close".to_string(),
        },
    )
    .context("emit port closed event")
    .attach(port_name)
    .map_err(|err| {
        tracing::error!("emit port closed event failed with err: {}", err);
        err.to_string()
    })?;

    Ok(())
}
