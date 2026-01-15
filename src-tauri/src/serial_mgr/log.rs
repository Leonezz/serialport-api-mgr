#[tauri::command(rename_all = "camelCase")]
#[inline]
pub fn log(prefix: String, content: String) {
    tracing::trace!("[WEB] {}: {}", prefix, content);
}

#[tauri::command(rename_all = "camelCase")]
#[inline]
pub fn info(prefix: String, content: String) {
    tracing::info!("[WEB] {}: {}", prefix, content);
}

#[tauri::command(rename_all = "camelCase")]
#[inline]
pub fn warn(prefix: String, content: String) {
    tracing::warn!("[WEB] {}: {}", prefix, content);
}

#[tauri::command(rename_all = "camelCase")]
#[inline]
pub fn error(prefix: String, content: String) {
    tracing::error!("[WEB] {}: {}", prefix, content);
}

#[tauri::command(rename_all = "camelCase")]
#[inline]
pub fn debug(prefix: String, content: String) {
    tracing::debug!("[WEB] {}: {}", prefix, content);
}

#[derive(serde::Serialize)]
pub struct LogEntryDto {
    pub id: i64,
    pub session_id: String,
    pub device_fingerprint: String,
    pub port_name: String,
    pub direction: String,
    pub timestamp: i64,
    pub data: Vec<u8>,
}

#[tauri::command(rename_all = "camelCase")]
pub async fn get_logs(
    state: tauri::State<'_, crate::state::AppState>,
    session_id: String,
    limit: usize,
    offset: usize,
) -> Result<Vec<LogEntryDto>, String> {
    let logs = state
        .storage
        .get_by_session(&session_id, limit, offset)
        .await
        .map_err(|e| e.to_string())?;

    Ok(logs
        .into_iter()
        .map(|log| LogEntryDto {
            id: log.id,
            session_id: log.session_id,
            device_fingerprint: log.device_fingerprint,
            port_name: log.port_name,
            direction: log.direction,
            timestamp: log.timestamp,
            data: log.data,
        })
        .collect())
}
