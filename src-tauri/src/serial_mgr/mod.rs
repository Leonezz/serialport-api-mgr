pub mod types;
mod serial_events;
use std::io::{ Read, Write };
use std::ops::AddAssign;
use std::thread::sleep;
use std::sync::OnceLock;
use std::thread::{ self, sleep_ms };
use std::time::Duration;
use std::{ collections::hash_map::HashMap, sync::RwLock };

use log::{error, trace};
use serialport5::{
    self,
    DataBits,
    ErrorKind,
    FlowControl,
    Parity,
    SerialPort,
    SerialPortInfo,
    StopBits,
};
use tauri::async_runtime::block_on;
use tauri::{ AppHandle, Emitter };
use types::{OpenedPortProfile, PortInfo, PortStatusType};
use crate::error::{ InnerError, InnerResult, ErrorType, RustErrorType };

enum InterThreadSignals {
    Term,
    Start,
}

// struct ReadPortHandle {
//     thread_handle: JoinHandle<AppResult<()>>,
//     terminate_sender: Sender<InterThreadSignals>,
//     port: SerialPort,
// }

// struct WritePortHandle {
//     thread_handle: JoinHandle<AppResult<()>>,
//     terminate_sender: Sender<InterThreadSignals>,
//     write_bytes_sender: Sender<Vec<u8>>,
//     port: SerialPort,
// }

pub struct PortHandles {
    thread_handle: async_std::task::JoinHandle<InnerResult<()>>,
    terminate_sender: async_std::channel::Sender<InterThreadSignals>,
    write_bytes_sender: async_std::channel::Sender<Vec<u8>>,
    port: SerialPort,
}

#[derive(Default)]
pub struct SerialMgr {
    pub port_profiles: RwLock<HashMap<String, PortInfo>>,
    // open_ports: RwLock<Box<Vec<dyn SerialPort>>>,
    pub open_ports: RwLock<HashMap<String, PortHandles>>,
    // read_handles: HashMap<String, RwLock<ReadPortHandle>>,
    // write_handles: HashMap<String, RwLock<WritePortHandle>>,
}

impl Drop for SerialMgr {
    fn drop(&mut self) {
        let mut handles = self.open_ports.write().unwrap();
        let keys: Vec<_> = handles.keys().cloned().collect();
        keys.iter().for_each(|key| {
            let port_handles = handles.remove(key);
            if let Some(port_handles) = port_handles {
                let _ = port_handles.terminate_sender.send_blocking(InterThreadSignals::Term);
                block_on(async {
                    let _ = port_handles.thread_handle.cancel().await.unwrap();
                });
            }
        });
        self.port_profiles.write().unwrap().clear();
    }
}

impl SerialMgr {
    pub fn global() -> &'static SerialMgr {
        static SERIAL_MGR: OnceLock<SerialMgr> = OnceLock::new();
        SERIAL_MGR.get_or_init(|| SerialMgr {
            port_profiles: RwLock::new(HashMap::new()),
            open_ports: RwLock::new(HashMap::new()),
        })
    }
    pub fn update_avaliable_ports() -> InnerResult<Vec<PortInfo>> {
        let system_ports_res = serialport5::available_ports();

        match system_ports_res {
            Ok(ports) => {
                trace!("get all avaliable ports from system success, cnt: {}", ports.len());
                let mut current_ports = SerialMgr::global().port_profiles.write().or_else(|_| Err(InnerError{
                    code: ErrorType::Rust(RustErrorType::HashMapError),
                    msg: "error acquire write lock for new ports checking and appending".to_string()
                }))?;
                let current_port_names: Vec<String> = current_ports.keys().map(|k| k.clone()).collect();
                for port in ports.iter() {
                    if current_port_names.contains(&port.port_name) {
                        continue;
                    }

                    trace!("found new port: {}", port.port_name);
                    current_ports.insert(port.port_name.clone(), PortInfo {
                        port_name: port.port_name.clone(),
                        port_type: port.port_type.clone().into(),
                        port_status: PortStatusType::Closed,
                        bytes_read: 0,
                        bytes_write: 0,
                    });
                }
                Ok(current_ports.values().map(|v| v.clone()).collect())
            }
            Err(err) => Err(err.into()),
        }
    }
    pub fn close_port(app: AppHandle, port_name: String) -> InnerResult<()> {
        log::info!(target: port_name.as_str(), "closing port");
        let port_handle = SerialMgr::global()
            .open_ports.write()
            .or_else(|_|
                Err(InnerError {
                    code: ErrorType::Rust(RustErrorType::ErrorAcquireRwLock),
                    msg: "error acquire write lock for openports".to_string(),
                })
            )?
            .remove(&port_name);
        log::debug!(target: port_name.as_str(), "got SerialMgr write lock");
        if port_handle.is_none() {
            return Err(InnerError {
                code: ErrorType::Rust(RustErrorType::HashMapError),
                msg: "no such port opened".to_string(),
            });
        }

        let port_handle = port_handle.unwrap();
        let mut port = &port_handle.port;
        let _ = port.flush();
        let terminate_handle = &port_handle.terminate_sender;
        log::trace!(target: port_name.as_str(), "sending term signal to async task");
        if let Err(err) = terminate_handle.send_blocking(InterThreadSignals::Term) {
            log::error!(target: port_name.as_str(), "send term signal to async task failed: {err:?}");
        }

        SerialMgr::global().port_profiles.write().and_then(|mut port_profiles| {
            port_profiles.get_mut(&port_name).unwrap().port_status = PortStatusType::Closed;
            Ok(())
        }).or_else(|_| {
            let err = InnerError {
                code: ErrorType::Rust(RustErrorType::ErrorAcquireRwLock),
                msg: "error acquire write lock of port_profiles for status update".to_string()
            };
            error!(target: port_name.as_str(), "{}", err.msg);
            Err(err)
        })?;
        let _ = app.emit("port_closed", serial_events::SerialEventPayload {
            event: serial_events::SerialEventType::PortCloseSuccess,
            port_name: port_name,
        });
        Ok(())
    }

    pub fn open_port(
        app: AppHandle,
        port_name: String,
        baud_rate: u32,
        data_bits: DataBits,
        flow_control: FlowControl,
        parity: Parity,
        stop_bits: StopBits
    ) -> InnerResult<()> {
        let mut result = serialport5::SerialPortBuilder
            ::new()
            .baud_rate(baud_rate)
            .data_bits(data_bits)
            .flow_control(flow_control)
            .parity(parity)
            .stop_bits(stop_bits)
            .open(&port_name)?;
        log::info!(target: port_name.as_str(), "serial port {result:?} opened");

        let (terminate_tx, terminate_rx) = async_std::channel::unbounded::<InterThreadSignals>();

        let (write_bytes_tx, write_bytes_rx) = async_std::channel::unbounded::<Vec<u8>>();
        let port_name_clone = port_name.clone();
        let app_clone = app.clone();
        let handle = async_std::task::spawn(async {
            SerialMgr::serial_rw_thread(
                app_clone,
                port_name_clone,
                terminate_rx,
                write_bytes_rx
            ).await
        });
        log::info!(target: port_name.as_str(), "async task for port created");

        let open_res = SerialMgr::global()
            .open_ports.write()
            .or_else(|_|
                Err(InnerError {
                    code: ErrorType::Rust(RustErrorType::ErrorAcquireRwLock),
                    msg: "error acquire write lock for open ports".to_string(),
                })
            )
            .and_then(|mut open_ports| {
                open_ports.insert(port_name.clone(), PortHandles {
                    port: result.try_clone().unwrap(),
                    thread_handle: handle,
                    terminate_sender: terminate_tx.clone(),
                    write_bytes_sender: write_bytes_tx,
                });

                log::info!(target: port_name.as_str(), "emit port open event to web");
                let _ = app.emit("port_opened", serial_events::SerialEventPayload {
                    event: serial_events::SerialEventType::PortOpenSuccess,
                    port_name: port_name.clone(),
                });

                log::info!(target: port_name.as_str(), "notify the async task to start");
                if let Err(err) = terminate_tx.send_blocking(InterThreadSignals::Start) {
                    log::error!(target: port_name.as_str(), "failed to notify the async task to start, err: {err}");
                }
                Ok(())
            });

            if open_res.is_err() {
                return open_res;
            }

            SerialMgr::global().port_profiles.write().or_else(|_| Err(InnerError{
                code: ErrorType::Rust(RustErrorType::ErrorAcquireRwLock),
                msg: "error acquire write lock for profile update".to_string(),
            })).and_then(|mut profiles| {
                let mut default_profile = OpenedPortProfile::default();
                default_profile.update_from_port(&mut result);
                profiles.get_mut(&port_name).unwrap().port_status = PortStatusType::Opened(default_profile);
                Ok(())
            })

    }

    pub fn write_dtr(port_name: String, dtr: bool) -> InnerResult<()> {
        let mut mgr = SerialMgr::global()
            .open_ports.write()
            .or_else(|_|
                Err(InnerError {
                    code: ErrorType::Rust(RustErrorType::ErrorAcquireRwLock),
                    msg: "error acquire read lock for open ports".to_string(),
                })
            )?;
        match mgr.get_mut(&port_name) {
            None =>
                Err(InnerError {
                    code: ErrorType::Rust(RustErrorType::HashMapError),
                    msg: "no such port opened".to_string(),
                }),
            Some(port_handles) => {
                if let Err(err) = port_handles.port.write_data_terminal_ready(dtr) {
                    return Err(InnerError {
                        code: ErrorType::Serial(err.kind),
                        msg: format!("error occurd when writing dtr: {}", err.description),
                    });
                }
                return Ok(());
            }
        }
    }

    pub fn write_rts(port_name: String, rts: bool) -> InnerResult<()> {
        let mut mgr = SerialMgr::global()
            .open_ports.write()
            .or_else(|_|
                Err(InnerError {
                    code: ErrorType::Rust(RustErrorType::ErrorAcquireRwLock),
                    msg: "error acquire read lock for open ports".to_string(),
                })
            )?;
        match mgr.get_mut(&port_name) {
            None =>
                Err(InnerError {
                    code: ErrorType::Rust(RustErrorType::HashMapError),
                    msg: "no such port opened".to_string(),
                }),
            Some(port_handles) => {
                if let Err(err) = port_handles.port.write_request_to_send(rts) {
                    return Err(InnerError {
                        code: ErrorType::Serial(err.kind),
                        msg: format!("error occurd when writing rts: {}", err.description),
                    });
                }
                return Ok(());
            }
        }
    }

    pub fn write_port(port_name: String, data: Vec<u8>) -> InnerResult<()> {
        let mgr = SerialMgr::global()
            .open_ports.read()
            .or_else(|_| {
                Err(InnerError {
                    code: ErrorType::Rust(RustErrorType::ErrorAcquireRwLock),
                    msg: "error acquire read lock for open ports".to_string(),
                })
            })?;

        match mgr.get(&port_name) {
            None =>
                Err(InnerError {
                    code: ErrorType::Rust(RustErrorType::HashMapError),
                    msg: "no such port opened".to_string(),
                }),
            Some(port_handles) =>
                port_handles.write_bytes_sender
                    .send_blocking(data)
                    .and_then(|_| Ok(()))
                    .or_else(|_|
                        Err(InnerError {
                            code: ErrorType::Rust(RustErrorType::ChannelDisconnected),
                            msg: "send to serialport thread failed, channel closed".to_string(),
                        })
                    ),
        }
    }

    async fn serial_rw_thread(
        app: AppHandle,
        port_name: String,
        terminate_rx: async_std::channel::Receiver<InterThreadSignals>,
        write_bytes_rx: async_std::channel::Receiver<Vec<u8>>
    ) -> InnerResult<()> {
        log::info!(target: port_name.as_str(), "port async task running, waiting to start");
        match terminate_rx.recv_blocking() {
            Ok(InterThreadSignals::Start) => {}
            _ => {
                return Err(InnerError {
                    code: ErrorType::Rust(RustErrorType::ChannelDisconnected),
                    msg: "error recv start signal in port, exit thread".to_string(),
                });
            }
        }
        log::info!(target: port_name.as_str(), "port async task started");
        loop {
            match terminate_rx.try_recv() {
                Ok(InterThreadSignals::Term) => {
                    log::info!(target: port_name.as_str(), "term signal received, break the thread loop");
                    break;
                }
                Ok(_) => {}
                Err(_) => {}
            }

            let mut port = match
                SerialMgr::global()
                    .open_ports.read()
                    .or_else(|err| {
                        let err = InnerError {
                            code: ErrorType::Rust(RustErrorType::ErrorAcquireRwLock),
                            msg: format!(
                                "error acquire read lock for serial {port_name} rw thread: err: {err:?}"
                            ),
                        };
                        log::error!(target: port_name.as_str(), "{}", err.msg);
                        Err(err)
                    })?
            {
                handles => {
                    if let Some(port_handles) = handles.get(&port_name) {
                        port_handles.port.try_clone().or_else(|err| {
                            let err = InnerError {
                                code: ErrorType::Serial(ErrorKind::Unknown),
                                msg: format!(
                                    "error occured while trying to clone port handle: {}",
                                    err.description
                                ),
                            };
                            log::error!(target: port_name.as_str(), "{}", err.msg);
                            Err(err)
                        })?
                    } else {
                        let err = InnerError {
                            code: ErrorType::Rust(RustErrorType::HashMapError),
                            msg: format!("no such port found: {}, maybe it got unpluged", port_name),
                        };
                        log::error!(target: port_name.as_str(), "{}", err.msg);
                        return Err(err);
                    }
                }
            };

            if let Ok(mut profiles) = SerialMgr::global().port_profiles.write() {
                if let Some(mut profile) = profiles.get_mut(&port_name) {
                    let mut new_profile = OpenedPortProfile::default();
                    new_profile.update_from_port(&mut port);
                    profile.port_status = PortStatusType::Opened(new_profile);
                } else {
                    error!(target: port_name.as_str(), "error query profiles of port");
                }
            } else {
                error!(target: port_name.as_str(), "error acquire write lock of port_profiles for status update");
            }

            use async_std::channel;
            match write_bytes_rx.try_recv() {
                Ok(buf) => {
                    let _ = port.write_all(&buf);
                    log::debug!(target: port_name.as_str(), "{} bytes data wrote", buf.len());

                    if let Ok(mut port_profiles) = SerialMgr::global().port_profiles.write() {
                        if let Some(mut profile) = port_profiles.get_mut(&port_name) {
                            profile.bytes_write += buf.len() as u128;
                        } else {
                            error!(target: port_name.as_str(), "error query port_profiles for byte_write accumulate");
                        }
                    } else {
                        error!(target: port_name.as_str(), "error acquire write lock of port_profiles for byte_write accumulate");
                    }

                    let paylod = serial_events::SerialEventPayload {
                        event: serial_events::SerialEventType::WriteFinished(buf),
                        port_name: port_name.clone(),
                    };
                    let _ = app.emit("port_wrote", paylod);
                    log::trace!(target: port_name.as_str(), "port wrote finished signal send to web");
                }
                Err(channel::TryRecvError::Closed) => {
                    let err = InnerError {
                        code: ErrorType::Rust(RustErrorType::ChannelDisconnected),
                        msg: "the channel rx of which the writing thread is waiting on disconnected".to_string(),
                    };
                    log::error!(target: port_name.as_str(), "{}", err.msg);
                    return Err(err);
                }
                Err(_) => {}
            }

            let len = port.bytes_to_read().or_else(|err|
                Err(InnerError {
                    code: ErrorType::Serial(err.kind),
                    msg: err.description,
                })
            )?;
            match len {
                len if len > 0 => {
                    let mut buf: Vec<u8> = Vec::new();
                    buf.resize(len as usize, 0);
                    let read_res = port.read(&mut buf);
                    let actual_len = read_res.or_else(|_| {
                        let err = InnerError {
                            code: ErrorType::Serial(ErrorKind::Unknown),
                            msg: format!("unknown error when reading data from port: {}", port_name),
                        };
                        log::error!(target: port_name.as_str(), "{}", err.msg);
                        Err(err)
                    })?;
                    if actual_len == (len as usize) {
                        log::trace!(
                            target: port_name.as_str(), 
                            "successfully read {} bytes of data from port: {}",
                            actual_len,
                            port_name
                        );
                    } else {
                        log::warn!(target: port_name.as_str(), "expect {len} bytes from port, but {actual_len} bytes received");
                    }

                    if let Ok(mut port_profiles) = SerialMgr::global().port_profiles.write() {
                        if let Some(mut profile) = port_profiles.get_mut(&port_name) {
                            profile.bytes_read += actual_len as u128;
                        } else {
                            error!(target: port_name.as_str(), "error query port_profiles for byte_read accumulate");
                        }
                    } else {
                        error!(target: port_name.as_str(), "error acquire write lock of port_profiles for byte_read accumulate");
                    }

                    let _ = app.emit("port_read", serial_events::SerialEventPayload {
                        event: serial_events::SerialEventType::ReadFinished(buf),
                        port_name: port_name.clone(),
                    });
                    log::trace!(target: port_name.as_str(), "serial read finished signal emitted to web");
                }
                _ => {}
            }
            sleep(Duration::from_millis(10));
        }
        log::info!(target: port_name.as_str(), "task stopped normally");
        Ok(())
    }
}
