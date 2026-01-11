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
