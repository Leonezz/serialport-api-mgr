use std::time::Duration;

use rootcause::Report;
use tauri::{AppHandle, Emitter, Manager};
use tokio_stream::{wrappers::WatchStream, StreamExt};
use tracing::Instrument;

use crate::{
    events::{event_names, PortOpenedEvent},
    serial::{data_bits::DataBits, flow_control::FlowControl, parity::Parity, stop_bits::StopBits},
    serial_mgr::{
        port_task::{spawn_serial_task, SerialEvent, WritePortSender},
        storage::generate_device_fingerprint,
        update_ports::update_available_ports,
    },
    state::{AppState, OpenedPortProfile, PortHandles, PortStatus},
};

fn generate_session_id() -> String {
    uuid::Uuid::new_v4().to_string()
}

/// Result of opening a port, containing the session ID for log queries
#[derive(serde::Serialize)]
pub struct OpenPortResult {
    pub session_id: String,
}

fn setup_port_task(
    port_name: String,
    port: tokio_serial::SerialStream,
    app: AppHandle,
    device_fingerprint: String,
) -> Result<(WritePortSender, String), Report> {
    let session_id = generate_session_id();
    let span = tracing::debug_span!("port name", port_name);
    let (write_tx, mut read_rx, status_rx, mut write_notifier_rx) =
        spawn_serial_task(port_name.clone(), port);
    let app_for_read = app.clone();
    let port_name_for_read = port_name.clone();
    let session_id_for_read = session_id.clone();
    let fingerprint_for_read = device_fingerprint.clone();
    tokio::spawn(
        async move {
            while let Some(message) = read_rx.recv().await {
                match message {
                    SerialEvent::Message(message) => {
                        let len = message.data.len();
                        if let Err(err) = app_for_read.emit(event_names::PORT_READ, message.clone())
                        {
                            tracing::error!("emit port read failed: {}", err);
                        }

                        let storage = app_for_read.state::<AppState>().storage.clone();
                        let _ = storage
                            .insert(
                                &fingerprint_for_read,
                                &session_id_for_read,
                                None,
                                None,
                                None,
                                &port_name_for_read,
                                "RX",
                                message.data.as_slice(),
                            )
                            .await
                            .map_err(|e| tracing::error!("Failed to log read: {}", e));

                        if let Some(mut entry) = app_for_read
                            .state::<AppState>()
                            .ports
                            .get_mut(&port_name_for_read)
                        {
                            entry.bytes_read += len as u128;
                            tracing::debug!(
                                "update bytes read: {}, total: {}",
                                len,
                                entry.bytes_read
                            );
                        }
                    }
                    SerialEvent::Error(err) => {
                        if let Err(emit_err) =
                            app_for_read.emit(event_names::PORT_ERROR, err.to_string())
                        {
                            tracing::error!("emit port error failed: {}", emit_err);
                        }
                        tracing::error!("serial port error: {}", err);
                    }
                }
            }
            tracing::info!("port read closed");
        }
        .instrument(span.clone()),
    );
    let app_for_status = app.clone();
    let port_name_for_read = port_name.clone();
    tokio::spawn(
        async move {
            let mut rx = WatchStream::new(status_rx);
            while let Some(status) = rx.next().await {
                if let Some(mut entry) = app_for_status
                    .state::<AppState>()
                    .ports
                    .get_mut(&port_name_for_read)
                {
                    match &mut entry.port_status {
                        PortStatus::Closed => {
                            tracing::error!(
                                "invalid port state, got status update while port is closed"
                            );
                        }
                        PortStatus::Opened(port_status) => {
                            let changed = port_status.carrier_detect != status.cd
                                || port_status.clear_to_send != status.cts
                                || port_status.data_set_ready != status.dsr
                                || port_status.ring_indicator != status.ring;
                            if changed {
                                port_status.carrier_detect = status.cd;
                                port_status.clear_to_send = status.cts;
                                port_status.data_set_ready = status.dsr;
                                port_status.ring_indicator = status.ring;
                                tracing::debug!(
                                    "update port status, cd: {}, cts: {}, dsr: {}, ring: {}",
                                    status.cd,
                                    status.cts,
                                    status.dsr,
                                    status.ring
                                );
                            }
                        }
                    }
                }
            }
            tracing::info!("status update closed");
        }
        .instrument(span.clone()),
    );
    let app_for_write = app.clone();
    let port_name_for_write = port_name.clone();
    let session_id_for_write = session_id.clone();
    let fingerprint_for_write = device_fingerprint.clone();
    tokio::spawn(
        async move {
            while let Some(len) = write_notifier_rx.recv().await {
                if let Some(mut entry) = app_for_write
                    .state::<AppState>()
                    .ports
                    .get_mut(&port_name_for_write)
                {
                    entry.bytes_write += len as u128;
                    tracing::debug!(
                        "update port bytes written: {}, total: {}",
                        len,
                        entry.bytes_write
                    );
                }

                let storage = app_for_write.state::<AppState>().storage.clone();
                let msg = format!("<{} bytes written>", len).into_bytes();
                let _ = storage
                    .insert(
                        &fingerprint_for_write,
                        &session_id_for_write,
                        None,
                        None,
                        None,
                        &port_name_for_write,
                        "TX",
                        &msg,
                    )
                    .await
                    .map_err(|e| tracing::error!("Failed to log write: {}", e));
            }
            // Port closed: update status and remove handle
            if let Some(mut entry) = app_for_write
                .state::<AppState>()
                .ports
                .get_mut(&port_name_for_write)
            {
                entry.port_status = PortStatus::Closed;
            }
            tracing::info!("reset port state to closed");
            app_for_write
                .state::<AppState>()
                .port_handles
                .remove(&port_name_for_write);
            tracing::info!("remove port handle, port write closed");
        }
        .instrument(span),
    );

    Ok((write_tx, session_id))
}

pub fn open_port_unchecked(
    port_name: String,
    baud_rate: u32,
    data_bits: DataBits,
    flow_control: FlowControl,
    parity: Parity,
    stop_bits: StopBits,
    data_terminal_ready: bool,
    timeout: Duration,
    app: AppHandle,
    device_fingerprint: String,
) -> Result<(WritePortSender, String), Report> {
    let span = tracing::debug_span!("port name", port_name);
    let _guard = span.enter();
    let builder = tokio_serial::new(port_name.clone(), baud_rate)
        .data_bits(data_bits.into())
        .flow_control(flow_control.into())
        .parity(parity.into())
        .stop_bits(stop_bits.into())
        .dtr_on_open(data_terminal_ready)
        .timeout(timeout);
    let port = tokio_serial::SerialStream::open(&builder)?;
    tracing::info!("serial port: {} opened with baud_rate: {}, flow_control: {}, parity: {}, stop_bits: {}, timeout_nanos: {}", port_name, baud_rate, flow_control, parity, stop_bits, timeout.as_nanos());
    let (write_tx, session_id) =
        setup_port_task(port_name.clone(), port, app.clone(), device_fingerprint)?;
    if let Err(err) = app.emit(
        event_names::PORT_OPENED,
        PortOpenedEvent::new(port_name.clone()),
    ) {
        tracing::error!("emit port opened event failed: {}", err);
        return Err(err.into());
    }

    Ok((write_tx, session_id))
}

// remember to call `.manage(MyState::default())`
#[tauri::command(rename_all = "camelCase")]
pub async fn open_port(
    state: tauri::State<'_, AppState>,
    app: AppHandle,
    port_name: String,
    baud_rate: u32,
    data_bits: String,
    flow_control: String,
    parity: String,
    stop_bits: String,
    data_terminal_ready: bool,
    timeout_ms: u64,
) -> Result<OpenPortResult, String> {
    let span = tracing::debug_span!("open port", port_name);
    let _guard = span.enter();
    tracing::info!(
        "open port request, baud rate: {}, data bits: {}, flow control: {}, parity: {}, stop_bits: {}, data treminal ready: {}, timeout: {}",
        baud_rate, data_bits, flow_control, parity, stop_bits, data_terminal_ready, timeout_ms);
    let data_bits: DataBits = data_bits.parse().map_err(|err: Report| {
        tracing::error!("invalid data bits: {}", err);
        err.to_string()
    })?;
    let flow_control: FlowControl = flow_control.parse().map_err(|err: Report| {
        tracing::error!("invalid flow control: {}", err);
        err.to_string()
    })?;
    let parity: Parity = parity.parse().map_err(|err: Report| {
        tracing::error!("invalid parity: {}", err);
        err.to_string()
    })?;
    let stop_bits: StopBits = stop_bits.parse().map_err(|err: Report| {
        tracing::error!("invalid stop bits: {}", err);
        err.to_string()
    })?;
    update_available_ports(&state).await.map_err(|err| {
        tracing::error!("update available ports failed: {}", err);
        err.to_string()
    })?;

    // Check port exists
    if !state.ports.contains_key(&port_name) {
        return Err(format!("no such port: {}", port_name));
    }

    // Check port not already open
    // Note: The underlying OS prevents opening the same serial port twice, so even in the
    // unlikely event of a race condition, the open_port_unchecked call would fail safely.
    if state.port_handles.contains_key(&port_name) {
        return Err(format!("{} already opened", port_name));
    }

    // Get device fingerprint
    let device_fingerprint = state
        .ports
        .get(&port_name)
        .map(|entry| generate_device_fingerprint(&port_name, &entry.port_type))
        .ok_or_else(|| format!("port {} not found", port_name))?;

    // Open port
    let (write_tx, session_id) = open_port_unchecked(
        port_name.clone(),
        baud_rate,
        data_bits,
        flow_control,
        parity,
        stop_bits,
        data_terminal_ready,
        std::time::Duration::from_millis(timeout_ms),
        app,
        device_fingerprint,
    )
    .map_err(|err| {
        tracing::error!("open port failed with err: {}", err);
        err.to_string()
    })?;
    tracing::info!("open port succeed");

    // Insert handle
    state.port_handles.insert(
        port_name.clone(),
        PortHandles {
            write_port_tx: write_tx,
        },
    );
    tracing::info!("insert new port handle");

    // Update port status
    if let Some(mut entry) = state.ports.get_mut(&port_name) {
        entry.port_status = PortStatus::Opened(OpenedPortProfile {
            baud_rate,
            data_bits,
            stop_bits,
            parity,
            flow_control,
            carrier_detect: false,
            clear_to_send: false,
            data_set_ready: false,
            ring_indicator: false,
            timeout_ms,
        });
    }
    tracing::info!("set port state to opened");
    Ok(OpenPortResult { session_id })
}
