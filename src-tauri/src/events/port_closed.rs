#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
pub struct PortClosedEvent {
    pub port_name: String,
    pub reason: String,
}
