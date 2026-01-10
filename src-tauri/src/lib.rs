// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod constants;
mod events;
mod serial;
mod serial_mgr;
mod state;
mod util;

use serial_mgr::{
    close_port::close_port,
    log::{debug, error, info, log, warn},
    open_port::open_port,
    update_ports::get_all_port_info,
    write_port::{write_data_terminal_ready, write_port, write_request_to_send},
};
use tauri::{self, Manager};
use tauri_plugin_fs::FsExt;
use time::macros::{format_description, offset};
use tracing_subscriber::fmt::time::OffsetTime;

use crate::state::AppState;

pub fn setup_logging() {
    let fmt = if cfg!(debug_assertions) {
        format_description!("[hour]:[minute]:[second].[subsecond digits:3]")
    } else {
        format_description!("[year]-[month]-[day] [hour]:[minute]:[second].[subsecond digits:3]")
    };

    #[cfg(all(desktop, not(debug_assertions)))]
    let writer = {
        use crate::global::APP_CONFIG_DIR;
        use std::{fs::File, sync::Mutex};
        let log_file =
            File::create(APP_CONFIG_DIR.join("app.log")).expect("Failed to create the log file");
        Mutex::new(log_file)
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
    setup_logging();
    let builder = tauri::Builder::default();
    builder
        .invoke_handler(tauri::generate_handler![
            get_all_port_info,
            open_port,
            close_port,
            write_data_terminal_ready,
            write_request_to_send,
            write_port,
            debug,
            info,
            log,
            warn,
            error
        ])
        .plugin(tauri_plugin_fs::init())
        .manage(AppState::default())
        .setup(|app| {
            let scope = app.fs_scope();
            let app_local_data_dir = app.path().app_local_data_dir().unwrap();
            tracing::trace!(
                "app local data dir: {}",
                app_local_data_dir.to_string_lossy()
            );
            if !app_local_data_dir.exists() {
                std::fs::create_dir_all(app_local_data_dir)
                    .expect("error create app local data dir");
            }
            let _ = scope.allow_directory(app.path().app_local_data_dir().unwrap(), true);
            Ok(())
        })
        .build(tauri::generate_context!())
        .expect("error whiling running tauri application")
        .run(|app, event| match event {
            tauri::RunEvent::Ready => {
                tracing::info!("App is running!");
            }
            _ => {}
        });
}
