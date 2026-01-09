#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
pub struct PortOpenEvent {
    pub port_name: String,
}
