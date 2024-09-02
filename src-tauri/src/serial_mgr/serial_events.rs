use serde::Serialize;

#[derive(Debug, Clone, Serialize)]
pub enum SerialportWriteError {
    WriteTimeout,
}

#[derive(Debug, Clone, Serialize)]
pub struct WriteFinishEventPayload {
    pub data: Vec<u8>,
    pub message_id: String,
}

#[derive(Debug, Clone, Serialize)]
pub struct WriteFailedEventPayload {
    pub data: Vec<u8>,
    pub error: SerialportWriteError,
    pub message_id: String,
}

#[derive(Debug, Clone, Serialize)]
pub struct WritingEventPayload {
    pub data: Vec<u8>,
    pub message_id: String,
}

#[derive(Debug, Clone, Serialize)]
pub enum SerialEventType {
    ReadFinished(Vec<u8>),
    Writing(WritingEventPayload),
    WriteFinished(WriteFinishEventPayload),
    WriteError(WriteFailedEventPayload),
    PortOpenSuccess,
    PortCloseSuccess,
}

#[derive(Debug, Clone, Serialize)]
pub struct SerialEventPayload {
    pub event: SerialEventType,
    pub port_name: String,
}
