use serde::Serialize;

#[derive(Debug, Clone, Serialize)]
pub enum SerialEventType {
    ReadFinished(Vec<u8>),
    WriteFinished(Vec<u8>),
    PortOpenSuccess,
    PortCloseSuccess,
}

#[derive(Debug, Clone, Serialize)]
pub struct SerialEventPayload {
    pub event: SerialEventType,
    pub port_name: String,
}
