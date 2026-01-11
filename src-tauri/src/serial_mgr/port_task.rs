
use crate::constants::{channels, serial};
use crate::util::{AckReceiver, AckSender};
use tokio::{
    io::{AsyncReadExt, AsyncWriteExt},
};
use tokio_serial::SerialPort;

pub enum WriteCmd {
    Message(WritePortMessage),
    Rts(WritePortRequestToSend),
    Dtr(WritePortDataTerminalReady),
    Close,
}

#[derive(Debug, serde::Serialize, serde::Deserialize, Clone)]
pub struct WritePortMessage {
    pub message_id: String,
    pub data: Vec<u8>,
}

#[derive(Debug, serde::Serialize, serde::Deserialize, Clone)]
pub struct WritePortRequestToSend {
    pub rts: bool,
}

#[derive(Debug, serde::Serialize, serde::Deserialize, Clone)]
pub struct WritePortDataTerminalReady {
    pub dtr: bool,
}

pub type WritePortSender = AckSender<WriteCmd>;
pub type WritePortReceiver = AckReceiver<WriteCmd>;

use crate::events::PortReadEvent;

#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
pub struct ReadPortMessage {
    pub timestamp_ms: u128,
    pub data: Vec<u8>,
}

pub enum SerialEvent {
    Message(PortReadEvent),
    Error(std::io::Error),
}

#[derive(Debug, Clone, Copy, serde::Serialize, serde::Deserialize)]
pub struct ModemStatus {
    pub cts: bool,
    pub dsr: bool,
    pub cd: bool,
    pub ring: bool,
}

pub fn spawn_serial_task(
    port_name: String,
    mut port: tokio_serial::SerialStream,
) -> (
    WritePortSender,
    tokio::sync::mpsc::Receiver<SerialEvent>,
    tokio::sync::watch::Receiver<ModemStatus>,
    tokio::sync::mpsc::Receiver<usize>,
) {
    let (write_tx, mut write_rx) =
        tokio::sync::mpsc::channel::<(WriteCmd, Option<tokio::sync::oneshot::Sender<()>>)>(channels::WRITE_CMD_CAPACITY);
    let (event_tx, event_rx) = tokio::sync::mpsc::channel(channels::EVENT_CAPACITY);
    let (status_tx, status_rx) = tokio::sync::watch::channel(ModemStatus {
        cts: false,
        dsr: false,
        cd: false,
        ring: false,
    });
    let (write_notifier_tx, write_notifier_rx) = tokio::sync::mpsc::channel(channels::WRITE_NOTIFY_CAPACITY);

    tokio::spawn(async move {
        let mut read_buf = [0u8; serial::READ_BUFFER_SIZE];
        let mut poll_timer = tokio::time::interval(std::time::Duration::from_millis(serial::STATUS_POLL_INTERVAL_MS));

        loop {
            tokio::select! {
                // ── Reading ───────────────────────
                res = port.read(&mut read_buf) => {
                    match res {
                        Ok(0) => break,
                        Ok(n) => {
                            let _ = event_tx
                                .send(SerialEvent::Message(PortReadEvent::new(
                                    port_name.clone(),
                                    read_buf[..n].to_vec()
                                ))).await;
                        }
                        Err(e) => {
                            let _ = event_tx.send(SerialEvent::Error(e)).await;
                            break;
                        }
                    }
                }

                // ── Writing / control ─────────────
                cmd = write_rx.recv() => {
                    match cmd {
                        Some((WriteCmd::Message(data), ack_tx)) => {
                            let len = data.data.len();
                            let res = port.write_all(&data.data).await;
                            if let Some(tx) = ack_tx {
                                let _ = tx.send(());
                            }
                            let _ = write_notifier_tx.send(len).await;
                            if res.is_err() {
                                break;
                            }
                        }
                        Some((WriteCmd::Dtr(v), ack_tx)) => {
                            if let Err(e) = port.write_data_terminal_ready(v.dtr) {
                                tracing::warn!("Failed to set DTR to {}: {}", v.dtr, e);
                            }
                            if let Some(tx) = ack_tx {
                                let _ = tx.send(());
                            }
                        }
                        Some((WriteCmd::Rts(v), ack_tx)) => {
                            if let Err(e) = port.write_request_to_send(v.rts) {
                                tracing::warn!("Failed to set RTS to {}: {}", v.rts, e);
                            }
                            if let Some(tx) = ack_tx {
                                let _ = tx.send(());
                            }
                        }
                        Some((WriteCmd::Close, ack_tx)) => {
                            if let Some(tx) = ack_tx {
                                let _ = tx.send(());
                            }
                            break;
                        }
                        None => {
                            break;
                        }
                    }
                }

                // ── Modem status polling ──────────
                _ = poll_timer.tick() => {
                    let status = ModemStatus {
                        cts: port.read_clear_to_send().unwrap_or(false),
                        dsr: port.read_data_set_ready().unwrap_or(false),
                        cd:  port.read_carrier_detect().unwrap_or(false),
                        ring: port.read_ring_indicator().unwrap_or(false),
                    };
                    let _ = status_tx.send(status);
                }
            }
        }
        let _ = port.shutdown().await;
    });

    (write_tx, event_rx, status_rx, write_notifier_rx)
}
