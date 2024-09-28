mod serial_events;
pub mod types;
use std::io::{ Read, Write };
use std::sync::OnceLock;
use std::thread::sleep;
use std::time::{ self, Duration };
use std::{ collections::hash_map::HashMap, sync::RwLock };

use crate::error::{ ErrorType, InnerError, InnerResult, RustErrorType };
use log::{ error, trace };
use serial_events::{ WriteFailedEventPayload, WriteFinishEventPayload, WritingEventPayload };
use serialport5::{ self, DataBits, ErrorKind, FlowControl, Parity, SerialPort, StopBits };
use tauri::async_runtime::block_on;
use tauri::{ AppHandle, Emitter };
use types::{ OpenedPortProfile, PortInfo, PortStatusType };

const DEFAULT_SERIAL_TIMEOUT_S: u64 = 10;
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
    write_message_sender: async_std::channel::Sender<types::SerialportMessage>,
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
                let mut current_ports = SerialMgr::global()
                    .port_profiles.write()
                    .or_else(|_| {
                        Err(InnerError {
                            code: ErrorType::Rust(RustErrorType::HashMapError),
                            msg: "error acquire write lock for new ports checking and appending".to_string(),
                        })
                    })?;
                let current_port_names: Vec<String> = current_ports
                    .keys()
                    .map(|k| k.clone())
                    .collect();
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
                Ok(
                    current_ports
                        .values()
                        .map(|v| v.clone())
                        .collect()
                )
            }
            Err(err) => Err(err.into()),
        }
    }
    pub fn close_port(app: AppHandle, port_name: String) -> InnerResult<()> {
        log::info!(target: port_name.as_str(), "closing port");
        let port_handle = SerialMgr::global()
            .open_ports.write()
            .or_else(|_| {
                Err(InnerError {
                    code: ErrorType::Rust(RustErrorType::ErrorAcquireRwLock),
                    msg: "error acquire write lock for openports".to_string(),
                })
            })?
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

        SerialMgr::global()
            .port_profiles.write()
            .and_then(|mut port_profiles| {
                port_profiles.get_mut(&port_name).unwrap().port_status = PortStatusType::Closed;
                Ok(())
            })
            .or_else(|_| {
                let err = InnerError {
                    code: ErrorType::Rust(RustErrorType::ErrorAcquireRwLock),
                    msg: "error acquire write lock of port_profiles for status update".to_string(),
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
        stop_bits: StopBits,
        read_timeout: u64,
        write_timeout: u64
    ) -> InnerResult<()> {
        let result = serialport5::SerialPortBuilder
            ::new()
            .baud_rate(baud_rate)
            .data_bits(data_bits)
            .flow_control(flow_control)
            .parity(parity)
            .stop_bits(stop_bits)
            .read_timeout(match read_timeout {
                0 => Some(Duration::from_nanos(DEFAULT_SERIAL_TIMEOUT_S * 1000 * 1000 * 1000)),
                _ => Some(Duration::from_nanos(read_timeout)),
            })
            .write_timeout(match write_timeout {
                0 => Some(Duration::from_nanos(DEFAULT_SERIAL_TIMEOUT_S * 1000 * 1000 * 1000)),
                _ => Some(Duration::from_nanos(write_timeout)),
            })
            .open(&port_name)?;
        log::info!(target: port_name.as_str(), "serial port {result:?} opened");

        let (terminate_tx, terminate_rx) = async_std::channel::unbounded::<InterThreadSignals>();

        let (write_message_tx, write_message_rx) =
            async_std::channel::unbounded::<types::SerialportMessage>();
        let port_name_clone = port_name.clone();
        let app_clone = app.clone();
        let handle = async_std::task::spawn(async {
            SerialMgr::serial_rw_thread(
                app_clone,
                port_name_clone,
                terminate_rx,
                write_message_rx
            ).await
        });
        log::info!(target: port_name.as_str(), "async task for port created");

        SerialMgr::global()
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
                    write_message_sender: write_message_tx,
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
            })

        // SerialMgr::global()
        //     .port_profiles.write()
        //     .or_else(|_| {
        //         Err(InnerError {
        //             code: ErrorType::Rust(RustErrorType::ErrorAcquireRwLock),
        //             msg: "error acquire write lock for profile update".to_string(),
        //         })
        //     })
        //     .and_then(|mut profiles| {
        //         let mut default_profile = OpenedPortProfile::default();
        //         default_profile.update_from_port(&mut result);
        //         profiles.get_mut(&port_name).unwrap().port_status =
        //             PortStatusType::Opened(default_profile);
        //         Ok(())
        //     })
    }

    pub fn write_dtr(port_name: String, dtr: bool) -> InnerResult<()> {
        let mut mgr = SerialMgr::global()
            .open_ports.write()
            .or_else(|_| {
                Err(InnerError {
                    code: ErrorType::Rust(RustErrorType::ErrorAcquireRwLock),
                    msg: "error acquire read lock for open ports".to_string(),
                })
            })?;
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
            .or_else(|_| {
                Err(InnerError {
                    code: ErrorType::Rust(RustErrorType::ErrorAcquireRwLock),
                    msg: "error acquire read lock for open ports".to_string(),
                })
            })?;
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

    pub fn write_port(port_name: String, data: Vec<u8>, message_id: String) -> InnerResult<()> {
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
                port_handles.write_message_sender
                    .send_blocking(types::SerialportMessage {
                        message_id,
                        data,
                    })
                    .and_then(|_| Ok(()))
                    .or_else(|_| {
                        Err(InnerError {
                            code: ErrorType::Rust(RustErrorType::ChannelDisconnected),
                            msg: "send to serialport thread failed, channel closed".to_string(),
                        })
                    }),
        }
    }

    fn try_read(
        port: &mut serialport5::SerialPort,
        port_name: &str
    ) -> InnerResult<Option<Vec<u8>>> {
        let len = port.bytes_to_read().or_else(|err| {
            Err(InnerError {
                code: ErrorType::Serial(err.kind),
                msg: err.description,
            })
        })?;

        match len {
            0 => Ok(None),
            len => {
                let mut buf: Vec<u8> = Vec::new();
                buf.resize(len as usize, 0);
                let read_res = port.read(&mut buf);
                let actual_len = read_res.or_else(|_| {
                    let err = InnerError {
                        code: ErrorType::Serial(ErrorKind::Unknown),
                        msg: format!("unknown error when reading data from port: {}", port_name),
                    };
                    log::error!(target: port_name, "{}", err.msg);
                    Err(err)
                })?;
                if actual_len == (len as usize) {
                    log::trace!(
                        target: port_name,
                        "successfully read {} bytes of data from port: {}",
                        actual_len,
                        port_name
                    );
                } else {
                    log::warn!(target: port_name, "expect {len} bytes from port, but {actual_len} bytes received");
                }

                Ok(Some(buf))
            }
        }
    }

    fn try_write(
        app: &AppHandle,
        write_bytes_rx: &async_std::channel::Receiver<types::SerialportMessage>,
        port: &mut serialport5::SerialPort,
        port_name: &str
    ) -> InnerResult<()> {
        match write_bytes_rx.try_recv() {
            Ok(message) => {
                //NOTE - write serialport might block, we need a timeout for this
                //NOTE - the following code is problematic, the serialport write always success, but it should not
                let _ = app.emit("port_write_sending", serial_events::SerialEventPayload {
                    event: serial_events::SerialEventType::Writing(WritingEventPayload {
                        data: message.data.clone(),
                        message_id: message.message_id.clone(),
                    }),
                    port_name: port_name.to_string(),
                });
                let before_send_timestamp = time::SystemTime::now();
                let _ = port
                    .write_all(&message.data)
                    //TODO - Process other errors
                    .or_else(|_| {
                        app.emit("port_write_failed", serial_events::SerialEventPayload {
                            event: serial_events::SerialEventType::WriteError(
                                WriteFailedEventPayload {
                                    data: message.data.clone(),
                                    error: serial_events::SerialportWriteError::WriteTimeout,
                                    message_id: message.message_id.clone(),
                                }
                            ),
                            port_name: port_name.to_string(),
                        })
                    })
                    .and_then(|_| {
                        log::debug!(target: port_name, "{} bytes data wrote", message.data.len());
                        Ok(())
                    });
                let elapsed = before_send_timestamp.elapsed().or_else(|err| {
                    Err(InnerError {
                        code: ErrorType::Rust(RustErrorType::UnknownError),
                        msg: format!("get system time elapsed failed: {}", err.to_string()),
                    })
                })?;
                if elapsed.as_secs() > DEFAULT_SERIAL_TIMEOUT_S - 1 {
                    let _ = app.emit("port_write_failed", serial_events::SerialEventPayload {
                        event: serial_events::SerialEventType::WriteError(WriteFailedEventPayload {
                            data: message.data.clone(),
                            error: serial_events::SerialportWriteError::WriteTimeout,
                            message_id: message.message_id.clone(),
                        }),
                        port_name: port_name.to_string(),
                    });
                    Ok(())
                } else {
                    let mut port_profiles = SerialMgr::global()
                        .port_profiles.write()
                        .or_else(|_| {
                            let err = InnerError {
                                code: ErrorType::Rust(RustErrorType::ErrorAcquireRwLock),
                                msg: "error acquire write lock of port_profiles for byte_write accumulate".to_string(),
                            };
                            error!(target: port_name, "{}", err.msg);
                            Err(err)
                        })?;
                    let profile = port_profiles.get_mut(port_name);
                    if profile.is_none() {
                        let err = InnerError {
                            code: ErrorType::Rust(RustErrorType::HashMapError),
                            msg: "error query port_profiles for byte_write accumulate".to_string(),
                        };
                        error!(target: port_name, "{}", err.msg);
                        return Err(err);
                    }
                    let profile = profile.unwrap();
                    profile.bytes_write += message.data.len() as u128;

                    let paylod = serial_events::SerialEventPayload {
                        event: serial_events::SerialEventType::WriteFinished(
                            WriteFinishEventPayload {
                                data: message.data,
                                message_id: message.message_id,
                            }
                        ),
                        port_name: port_name.to_string(),
                    };
                    let _ = app.emit("port_wrote", paylod);
                    log::trace!(target: port_name, "port wrote finished signal send to web");
                    Ok(())
                }
            }
            Err(async_std::channel::TryRecvError::Closed) => {
                let err = InnerError {
                    code: ErrorType::Rust(RustErrorType::ChannelDisconnected),
                    msg: "the channel rx of which the writing thread is waiting on disconnected".to_string(),
                };
                log::error!(target: port_name, "{}", err.msg);
                return Err(err);
            }
            Err(_) => { Ok(()) }
        }
    }

    fn update_port_profile(port: &mut serialport5::SerialPort, port_name: &str) -> InnerResult<()> {
        let mut profiles = SerialMgr::global()
            .port_profiles.write()
            .or_else(|_| {
                let err = InnerError {
                    code: ErrorType::Rust(RustErrorType::ErrorAcquireRwLock),
                    msg: "error acquire write lock of port_profiles for status update".to_string(),
                };
                error!(target: port_name, "{}", err.msg);
                Err(err)
            })?;
        let profile = profiles.get_mut(port_name);
        if profile.is_none() {
            let err = InnerError {
                code: ErrorType::Rust(RustErrorType::HashMapError),
                msg: "error query profiles of port".to_string(),
            };
            log::error!(target: port_name, "{}", err.msg);
            return Err(err);
        }
        let profile = profile.unwrap();
        let mut new_profile = OpenedPortProfile::default();
        new_profile.update_from_port(port).or_else(|err| {
            let err = InnerError {
                code: ErrorType::Serial(err.kind),
                msg: "error update port profiles".to_string(),
            };
            log::error!(target: port_name, "{}", err.msg);
            Err(err)
        })?;
        profile.port_status = PortStatusType::Opened(new_profile);
        Ok(())
    }

    fn get_port_handle_by_name(port_name: &str) -> InnerResult<SerialPort> {
        match
            SerialMgr::global()
                .open_ports.read()
                .or_else(|err| {
                    let err = InnerError {
                        code: ErrorType::Rust(RustErrorType::ErrorAcquireRwLock),
                        msg: format!(
                            "error acquire read lock for serial {port_name} rw thread: err: {err:?}"
                        ),
                    };
                    log::error!(target: port_name, "{}", err.msg);
                    Err(err)
                })?
        {
            handles => {
                if let Some(port_handles) = handles.get(port_name) {
                    return port_handles.port
                        .try_clone()
                        .or_else(|err| {
                            let err = InnerError {
                                code: ErrorType::Serial(ErrorKind::Unknown),
                                msg: format!(
                                    "error occured while trying to clone port handle: {}",
                                    err.description
                                ),
                            };
                            log::error!(target: port_name, "{}", err.msg);
                            Err(err)
                        })
                        .and_then(|res| Ok(res));
                } else {
                    let err = InnerError {
                        code: ErrorType::Rust(RustErrorType::HashMapError),
                        msg: format!("no such port found: {}, maybe it got unpluged", port_name),
                    };
                    log::error!(target: port_name, "{}", err.msg);
                    return Err(err);
                }
            }
        };
    }

    async fn serial_rw_thread(
        app: AppHandle,
        port_name: String,
        terminate_rx: async_std::channel::Receiver<InterThreadSignals>,
        write_bytes_rx: async_std::channel::Receiver<types::SerialportMessage>
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

        const HEARTBEAT_INTERVAL_MS: u32 = 100000;
        const LOOP_SLEEP_MS: u32 = 10;
        let mut loop_cnt = 0;
        loop {
            loop_cnt += 1;
            if loop_cnt == HEARTBEAT_INTERVAL_MS / LOOP_SLEEP_MS {
                log::debug!(target: port_name.as_str(), "port rw_thread heartbeat");
                loop_cnt = 0;
            }

            match terminate_rx.try_recv() {
                Ok(InterThreadSignals::Term) => {
                    log::info!(target: port_name.as_str(), "term signal received, break the thread loop");
                    break;
                }
                Ok(_) => {}
                Err(_) => {}
            }

            let mut port = SerialMgr::get_port_handle_by_name(port_name.as_str())?;

            SerialMgr::update_port_profile(&mut port, port_name.as_str())?;

            SerialMgr::try_write(&app, &write_bytes_rx, &mut port, port_name.as_str())?;

            let read_res = SerialMgr::try_read(&mut port, port_name.as_str())?;
            if let Some(buf) = read_res {
                let mut port_profiles = SerialMgr::global()
                    .port_profiles.write()
                    .or_else(|_| {
                        let err = InnerError {
                            code: ErrorType::Rust(RustErrorType::ErrorAcquireRwLock),
                            msg: "error acquire write lock of port_profiles for byte_read accumulate".to_string(),
                        };
                        error!(target: port_name.as_str(), "{}", err.msg);
                        Err(err)
                    })?;
                let profile = port_profiles.get_mut(&port_name);
                if profile.is_none() {
                    let err = InnerError {
                        code: ErrorType::Rust(RustErrorType::HashMapError),
                        msg: "error query port_profiles for byte_read accumulate".to_string(),
                    };
                    error!(target: port_name.as_str(), "{}", err.msg);
                    return Err(err);
                }
                let profile = profile.unwrap();
                profile.bytes_read += buf.len() as u128;
                let _ = app.emit("port_read", serial_events::SerialEventPayload {
                    event: serial_events::SerialEventType::ReadFinished(buf),
                    port_name: port_name.clone(),
                });
                log::trace!(target: port_name.as_str(), "serial read finished signal emitted to web");
            }

            sleep(Duration::from_millis(LOOP_SLEEP_MS as u64));
        }
        log::info!(target: port_name.as_str(), "task stopped normally");
        Ok(())
    }
}
