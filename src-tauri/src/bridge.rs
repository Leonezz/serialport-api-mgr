use std::time::Duration;

use async_std::task::sleep;
use tauri::AppHandle;

use crate::error::{ CmdError, CmdErrorCode, CmdResult };
use crate::serial_mgr::types::PortInfo;
use crate::serial_mgr::{ self, SerialMgr };
use crate::util::{ parse_data_bits, parse_flow_control, parse_parity, parse_stop_bits };

use logcall::logcall;

#[tauri::command(rename_all = "snake_case")]
pub fn hello(param: &str) -> String {
    println!("got param: {param}");
    format!("hello {param}")
}

#[tauri::command(async, rename_all = "snake_case")]
#[logcall(ok = "trace", err = "error")]
pub async fn get_all_port_info() -> CmdResult<Vec<PortInfo>> {
    SerialMgr::update_avaliable_ports()
        .and_then(|res| Ok(res))
        .or_else(|err| Err(err.into()))
}

#[tauri::command(async, rename_all = "snake_case")]
#[logcall(
    ok = "trace",
    err = "error",
    input = "port_name: {port_name}, baud_rate: {baud_rate}, data_bits: {data_bits}, flow_control: {flow_control}, parity: {parity}, stop_bits: {stop_bits}"
)]
pub async fn open_port(
    app: AppHandle,
    port_name: String,
    baud_rate: u32,
    data_bits: String,
    flow_control: String,
    parity: String,
    stop_bits: String,
    read_timeout: u64,
    write_timeout: u64
) -> CmdResult<()> {
    let data_bits = parse_data_bits(&data_bits)?;
    let flow_control = parse_flow_control(&flow_control)?;
    let parity = parse_parity(&parity)?;
    let stop_bits = parse_stop_bits(&stop_bits)?;

    async_std::future
        ::timeout(Duration::from_secs(5), async {
            serial_mgr::SerialMgr::open_port(
                app,
                port_name,
                baud_rate,
                data_bits,
                flow_control,
                parity,
                stop_bits,
                read_timeout,
                write_timeout
            )
        }).await
        .or_else(|_| {
            Err(CmdError {
                code: CmdErrorCode::RustAsyncTimeout,
                msg: "error open port timeout".to_string(),
            })
        })
        .and_then(|res| res.or_else(|err| Err(err.into())))
}

#[tauri::command(async, rename_all = "snake_case")]
#[logcall(ok = "trace", err = "error", input = "port_name: {port_name}")]
pub async fn close_port(app: AppHandle, port_name: String) -> CmdResult<()> {
    async_std::future
        ::timeout(Duration::from_secs(5), async {
            serial_mgr::SerialMgr::close_port(app, port_name)
        }).await
        .or_else(|_| {
            Err(CmdError {
                code: CmdErrorCode::RustAsyncTimeout,
                msg: "error close port timeout".to_string(),
            })
        })
        .and_then(|res| res.or_else(|err| Err(err.into())))
}

#[tauri::command(async, rename_all = "snake_case")]
#[logcall(ok = "trace", err = "error")]
pub async fn write_dtr(port_name: String, dtr: bool) -> CmdResult<()> {
    async_std::future
        ::timeout(Duration::from_secs(3), async {
            serial_mgr::SerialMgr::write_dtr(port_name, dtr)
        }).await
        .or_else(|_|
            Err(CmdError {
                code: CmdErrorCode::RustAsyncTimeout,
                msg: "write dtr timeout".to_string(),
            })
        )
        .and_then(|res| res.or_else(|err| Err(err.into())))
}

#[tauri::command(async, rename_all = "snake_case")]
#[logcall(ok = "trace", err = "error")]
pub async fn write_rts(port_name: String, rts: bool) -> CmdResult<()> {
    async_std::future
        ::timeout(Duration::from_secs(3), async {
            serial_mgr::SerialMgr::write_rts(port_name, rts)
        }).await
        .or_else(|_|
            Err(CmdError {
                code: CmdErrorCode::RustAsyncTimeout,
                msg: "write rts timeout".to_string(),
            })
        )
        .and_then(|res| res.or_else(|err| Err(err.into())))
}

#[tauri::command(async, rename_all = "snake_case")]
#[logcall(ok = "trace", err = "error")]
pub async fn write_port(port_name: String, data: Vec<u8>, message_id: String) -> CmdResult<()> {
    async_std::future
        ::timeout(Duration::from_secs(10), async {
            serial_mgr::SerialMgr::write_port(port_name, data, message_id)
        }).await
        .or_else(|_| {
            Err(CmdError {
                code: CmdErrorCode::RustAsyncTimeout,
                msg: "write data timeout".to_string(),
            })
        })
        .and_then(|res| res.or_else(|err| Err(err.into())))
}

#[tauri::command(async, rename_all = "snake_case")]
#[logcall(ok = "trace", err = "error")]
pub async fn test_async() -> CmdResult<()> {
    async_std::future
        ::timeout(Duration::from_secs(5), async {
            loop {
                sleep(Duration::from_millis(100)).await;
            }
        }).await
        .or_else(|_|
            Err(CmdError {
                code: CmdErrorCode::RustAsyncTimeout,
                msg: "async timeout".to_string(),
            })
        )
}
