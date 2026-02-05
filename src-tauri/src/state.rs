use crate::{
    serial::{
        data_bits::DataBits, flow_control::FlowControl, parity::Parity, port_type::PortType,
        stop_bits::StopBits,
    },
    serial_mgr::port_task::WritePortSender,
    serial_mgr::storage::Storage,
};
use std::collections::HashMap;

#[derive(Debug, Clone, Copy, serde::Serialize, serde::Deserialize, specta::Type)]
pub struct OpenedPortProfile {
    pub baud_rate: u32,
    pub flow_control: FlowControl,
    pub data_bits: DataBits,
    pub parity: Parity,
    pub stop_bits: StopBits,
    pub carrier_detect: bool,
    pub clear_to_send: bool,
    pub data_set_ready: bool,
    pub ring_indicator: bool,
    pub timeout_ms: u64,
}

#[derive(Debug, Clone, Copy, serde::Serialize, serde::Deserialize, specta::Type)]
pub enum PortStatus {
    Opened(OpenedPortProfile),
    Closed,
}

#[derive(Debug, Clone, serde::Serialize, serde::Deserialize, specta::Type)]
pub struct PortInfo {
    pub port_name: String,
    pub port_type: PortType,
    pub port_status: PortStatus,
    pub bytes_read: u128,
    pub bytes_write: u128,
}

#[derive(Debug)]
pub struct PortHandles {
    pub write_port_tx: WritePortSender,
}

#[derive(Default)]
pub struct AppState {
    pub ports: tokio::sync::RwLock<HashMap<String, PortInfo>>,
    pub port_handles: tokio::sync::RwLock<HashMap<String, PortHandles>>,
    pub storage: Storage,
}
