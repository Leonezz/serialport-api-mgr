use rootcause::Report;

use crate::state::{AppState, PortInfo, PortStatus};

pub async fn update_available_ports<'a>(
    state: &tauri::State<'a, AppState>,
) -> Result<Vec<PortInfo>, Report> {
    let system_ports_res = tokio_serial::available_ports()?;
    tracing::trace!(
        "get all available ports from system success, cnt: {}",
        system_ports_res.len()
    );
    let mut current_ports = state.ports.write().await;
    let current_port_names: Vec<String> = current_ports.keys().map(|k| k.clone()).collect();
    for port in system_ports_res.iter() {
        if current_port_names.contains(&port.port_name) {
            continue;
        }

        tracing::trace!("found new port: {}", port.port_name);
        current_ports.insert(
            port.port_name.clone(),
            PortInfo {
                port_name: port.port_name.clone(),
                port_type: port.port_type.clone().into(),
                port_status: PortStatus::Closed,
                bytes_read: 0,
                bytes_write: 0,
            },
        );
    }
    Ok(current_ports.values().map(|v| v.clone()).collect())
}

#[tauri::command(rename_all = "camelCase")]
#[specta::specta]
pub async fn get_all_port_info(state: tauri::State<'_, AppState>) -> Result<Vec<PortInfo>, String> {
    tracing::info!("get all port info");
    let res = update_available_ports(&state).await;
    res.map_err(|err| err.to_string())
}
