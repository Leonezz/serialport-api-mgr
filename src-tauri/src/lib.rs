// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod constants;
pub mod error;
mod events;
mod serial;
mod serial_mgr;
mod state;
mod util;

use serial_mgr::{
    close_port::close_port,
    execute_saved_command::execute_saved_command,
    log::{debug, error, get_logs, info, log, warn},
    open_port::open_port,
    storage::Storage,
    update_ports::get_all_port_info,
    write_port::{write_data_terminal_ready, write_port, write_request_to_send},
};
use std::collections::HashMap;
use tauri::{self, Manager, WebviewUrl, WebviewWindowBuilder};
use tauri_plugin_fs::FsExt;
use time::macros::{format_description, offset};
#[cfg(all(desktop, not(debug_assertions)))]
use tracing_appender::rolling::Rotation;
use tracing_subscriber::fmt::time::OffsetTime;

use crate::state::AppState;

#[allow(unused_variables)]
pub fn setup_logging(app: &tauri::App) {
    let fmt = if cfg!(debug_assertions) {
        format_description!("[hour]:[minute]:[second].[subsecond digits:3]")
    } else {
        format_description!("[year]-[month]-[day] [hour]:[minute]:[second].[subsecond digits:3]")
    };

    #[cfg(all(desktop, not(debug_assertions)))]
    let (writer, _guard) = {
        let log_path = app.path().app_log_dir().unwrap_or("./logs".into());
        if !log_path.exists() {
            std::fs::create_dir_all(&log_path).expect("Failed to create log directory");
        }
        tracing_appender::non_blocking(tracing_appender::rolling::RollingFileAppender::new(
            Rotation::DAILY,
            log_path,
            "app",
        ))
    };

    #[cfg(any(debug_assertions, mobile))]
    let writer = std::io::stderr;

    let timer = OffsetTime::new(offset!(+8), fmt);
    let builder = tracing_subscriber::fmt()
        .with_max_level(tracing::Level::TRACE)
        .with_file(true)
        .with_line_number(true)
        .with_target(false)
        .with_env_filter("serialport_api_lib")
        .with_timer(timer)
        .with_writer(writer);

    if cfg!(debug_assertions) {
        builder.init();
    } else {
        builder.json().init();
    }
}

pub fn run() {
    let builder = tauri::Builder::default();
    builder
        .invoke_handler(tauri::generate_handler![
            get_all_port_info,
            open_port,
            close_port,
            execute_saved_command,
            write_data_terminal_ready,
            write_request_to_send,
            write_port,
            debug,
            info,
            log,
            warn,
            error,
            get_logs
        ])
        .plugin(tauri_plugin_store::Builder::default().build())
        .plugin(tauri_plugin_fs::init())
        .setup(|app| {
            setup_logging(app);
            let scope = app.fs_scope();
            let app_local_data_dir = app.path().app_local_data_dir().unwrap();
            tracing::trace!(
                "app local data dir: {}",
                app_local_data_dir.to_string_lossy()
            );
            if !app_local_data_dir.exists() {
                std::fs::create_dir_all(&app_local_data_dir)
                    .expect("error create app local data dir");
            }
            let _ = scope.allow_directory(app.path().app_local_data_dir().unwrap(), true);

            let db_path = app_local_data_dir.join("serial_logs.db");
            let (tx, rx) = std::sync::mpsc::channel();
            tauri::async_runtime::spawn(async move {
                let storage = match Storage::new(&db_path).await {
                    Ok(s) => s,
                    Err(e) => {
                        tracing::error!("Failed to initialize storage: {}", e);
                        Storage::new_in_memory().await
                    }
                };
                let _ = tx.send(storage);
            });
            let storage = rx.recv().expect("failed to connect local database");
            let app_state = AppState {
                ports: tokio::sync::RwLock::new(HashMap::new()),
                port_handles: tokio::sync::RwLock::new(HashMap::new()),
                storage,
            };
            app.manage(app_state);

            // Create main window with initialization script for text selection styling
            // This injects CSS before the page loads to work around WKWebView ::selection limitations
            let init_script = r#"
                (function() {
                    // Inject selection CSS as early as possible
                    const style = document.createElement('style');
                    style.id = 'tauri-selection-fix';
                    style.textContent = `
                        /* Text selection highlighting for WKWebView */
                        ::selection {
                            background-color: rgba(59, 130, 246, 0.3) !important;
                            color: inherit !important;
                        }
                        ::-webkit-selection {
                            background-color: rgba(59, 130, 246, 0.3) !important;
                            color: inherit !important;
                        }
                        *::selection {
                            background-color: rgba(59, 130, 246, 0.3) !important;
                            color: inherit !important;
                        }
                        *::-webkit-selection {
                            background-color: rgba(59, 130, 246, 0.3) !important;
                            color: inherit !important;
                        }
                        input::selection, textarea::selection, [contenteditable]::selection {
                            background-color: rgba(59, 130, 246, 0.3) !important;
                            color: inherit !important;
                        }
                        input::-webkit-selection, textarea::-webkit-selection, [contenteditable]::-webkit-selection {
                            background-color: rgba(59, 130, 246, 0.3) !important;
                            color: inherit !important;
                        }
                    `;

                    // Try to inject immediately
                    if (document.head) {
                        document.head.insertBefore(style, document.head.firstChild);
                    } else if (document.documentElement) {
                        document.documentElement.insertBefore(style, document.documentElement.firstChild);
                    } else {
                        // Wait for DOM
                        document.addEventListener('DOMContentLoaded', function() {
                            document.head.insertBefore(style, document.head.firstChild);
                        });
                    }
                })();
            "#;

            WebviewWindowBuilder::new(app, "main", WebviewUrl::App("index.html".into()))
                .title("SerialMan AI")
                .min_inner_size(1720.0, 800.0)
                .initialization_script(init_script)
                .build()?;

            Ok(())
        })
        .build(tauri::generate_context!())
        .expect("error whiling running tauri application")
        .run(|_app, event| match event {
            tauri::RunEvent::Ready => {
                tracing::info!("App is running!");
            }
            _ => {}
        });
}
