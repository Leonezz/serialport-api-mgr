use rootcause::prelude::ResultExt;

use crate::{
    serial_mgr::port_task::{
        WriteCmd, WritePortDataTerminalReady, WritePortMessage, WritePortRequestToSend,
    },
    state::AppState,
};

#[tauri::command(rename_all = "snake_case")]
pub async fn write_port(
    state: tauri::State<'_, AppState>,
    port_name: String,
    data: Vec<u8>,
    message_id: String,
) -> Result<(), String> {
    let span = tracing::debug_span!("write port", port_name);
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
    let message_id_clone = message_id.clone();
    let attachment = || format!("message id: {}, port name: {}", message_id_clone, port_name);
    command_tx
        .send((
            WriteCmd::Message(WritePortMessage { data, message_id }),
            Some(tx),
        ))
        .await
        .context("write port data")
        .attach_with(attachment)
        .map_err(|err| {
            tracing::error!("write port failed with err: {}", err);
            err.to_string()
        })?;
    rx.await
        .context("wait write port ack")
        .attach_with(attachment)
        .map_err(|err| {
            tracing::error!("wait write port ack failed with err: {}", err);
            err.to_string()
        })?;
    Ok(())
}

#[tauri::command(rename_all = "snake_case")]
pub async fn write_request_to_send(
    state: tauri::State<'_, AppState>,
    port_name: String,
    rts: bool,
) -> Result<(), String> {
    let span = tracing::debug_span!("write rts", port_name, rts);
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
    let attachment = || format!("port name: {}, rts: {}", port_name, rts);
    command_tx
        .send((WriteCmd::Rts(WritePortRequestToSend { rts }), Some(tx)))
        .await
        .context("write rts")
        .attach_with(attachment)
        .map_err(|err| {
            tracing::error!("write rts failed with err: {}", err);
            err.to_string()
        })?;
    rx.await
        .context("wait write rts ack")
        .attach_with(attachment)
        .map_err(|err| {
            tracing::error!("wait write rts ack failed with err: {}", err);
            err.to_string()
        })?;
    Ok(())
}

#[tauri::command(rename_all = "snake_case")]
pub async fn write_data_terminal_ready(
    state: tauri::State<'_, AppState>,
    port_name: String,
    dtr: bool,
) -> Result<(), String> {
    let span = tracing::debug_span!("write dtr", port_name, dtr);
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
    let attachment = || format!("port name: {}, dtr: {}", port_name, dtr);
    command_tx
        .send((WriteCmd::Dtr(WritePortDataTerminalReady { dtr }), Some(tx)))
        .await
        .context("write dtr")
        .attach_with(attachment)
        .map_err(|err| {
            tracing::error!("write dtr failed with err: {}", err);
            err.to_string()
        })?;
    rx.await
        .context("wait write dtr ack")
        .attach_with(attachment)
        .map_err(|err| {
            tracing::error!("wait write dtr ack failed with err: {}", err);
            err.to_string()
        })?;
    Ok(())
}
