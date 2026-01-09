use crate::{
    serial::{
        data_bits::DataBits, flow_control::FlowControl, parity::Parity, port_type::PortType,
        stop_bits::StopBits,
    },
    serial_mgr::port_task::WritePortSender,
};
use std::collections::HashMap;

#[derive(Debug, Clone, Copy, serde::Serialize, serde::Deserialize)]
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

#[derive(Debug, Clone, Copy, serde::Serialize, serde::Deserialize)]
pub enum PortStatus {
    Opened(OpenedPortProfile),
    Closed,
}

impl PortStatus {
    pub fn is_open(&self) -> bool {
        matches!(self, Self::Opened(..))
    }
}

#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
pub struct PortInfo {
    pub port_name: String,
    pub port_type: PortType,
    pub port_status: PortStatus,
    pub bytes_read: u128,
    pub bytes_write: u128,
}

impl PortInfo {
    pub fn is_open(&self) -> bool {
        self.port_status.is_open()
    }
}

#[derive(Debug)]
pub struct PortHandles {
    pub write_port_tx: WritePortSender,
}

#[derive(Default)]
pub struct AppState {
    pub ports: tokio::sync::RwLock<HashMap<String, PortInfo>>,
    pub port_handles: tokio::sync::RwLock<HashMap<String, PortHandles>>,
}
