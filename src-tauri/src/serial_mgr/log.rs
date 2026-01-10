#[tauri::command(rename_all = "camelCase")]
#[inline]
pub fn log(prefix: String, content: String) {
    tracing::trace!("{}: {}", prefix, content);
}

#[tauri::command(rename_all = "camelCase")]
#[inline]
pub fn info(prefix: String, content: String) {
    tracing::info!("{}: {}", prefix, content);
}

#[tauri::command(rename_all = "camelCase")]
#[inline]
pub fn warn(prefix: String, content: String) {
    tracing::warn!("{}: {}", prefix, content);
}

#[tauri::command(rename_all = "camelCase")]
#[inline]
pub fn error(prefix: String, content: String) {
    tracing::error!("{}: {}", prefix, content);
}

#[tauri::command(rename_all = "camelCase")]
#[inline]
pub fn debug(prefix: String, content: String) {
    tracing::debug!("{}: {}", prefix, content);
}
