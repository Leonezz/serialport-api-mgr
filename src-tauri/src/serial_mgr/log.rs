#[tauri::command(rename_all = "snake_case")]
#[inline]
pub fn log(prefix: String, content: String) {
    tracing::trace!("{}: {}", prefix, content);
}

#[tauri::command(rename_all = "snake_case")]
#[inline]
pub fn info(prefix: String, content: String) {
    tracing::info!("{}: {}", prefix, content);
}

#[tauri::command(rename_all = "snake_case")]
#[inline]
pub fn warn(prefix: String, content: String) {
    tracing::warn!("{}: {}", prefix, content);
}

#[tauri::command(rename_all = "snake_case")]
#[inline]
pub fn error(prefix: String, content: String) {
    tracing::error!("{}: {}", prefix, content);
}

#[tauri::command(rename_all = "snake_case")]
#[inline]
pub fn debug(prefix: String, content: String) {
    tracing::debug!("{}: {}", prefix, content);
}
