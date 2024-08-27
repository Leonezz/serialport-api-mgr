// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod bridge;
mod error;
mod serial_mgr;
mod util;

use crate::bridge::{
    close_port, get_all_port_info, hello, open_port, test_async, write_dtr, write_port, write_rts,
};
use tauri::{self};
use tauri_plugin_devtools::{self};
use tauri_plugin_log::{self, Target, TargetKind, TimezoneStrategy};
pub fn run() {
    let mut builder = tauri::Builder::default();

    #[cfg(debug_assertions)]
    {
        let dev_tools = tauri_plugin_devtools::init();
        builder = builder.plugin(dev_tools);
    }
    #[cfg(not(debug_assertions))]
    {
        builder = builder.plugin(
            tauri_plugin_log::Builder::new()
                .clear_targets()
                .target(Target::new(TargetKind::Stdout))
                .target(Target::new(TargetKind::Webview))
                .target(Target::new(TargetKind::Folder {
                    path: "logs".into(),
                    file_name: Some("app.log".to_string()),
                }))
                .format(|out, message, record| {
                    out.finish(format_args!(
                        "[{}] [{}] [{}:{}] [{:?}] {}",
                        record.level(),
                        record.target(),
                        record.file().unwrap_or("unknown"),
                        record.line().unwrap_or(0),
                        std::thread::current().id(),
                        message
                    ))
                })
                .timezone_strategy(TimezoneStrategy::UseLocal)
                .build(),
        )
    }

    builder
        .invoke_handler(tauri::generate_handler![
            hello,
            get_all_port_info,
            open_port,
            close_port,
            write_port,
            test_async,
            write_dtr,
            write_rts
        ])
        .build(tauri::generate_context!())
        .expect("error whiling running tauri application")
        .run(|_app, event| match event {
            tauri::RunEvent::Ready => {
                log::info!("App is running!");
            }
            _ => {}
        });
}
