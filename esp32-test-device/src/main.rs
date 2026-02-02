//! Serial Protocol Tester for ESP32-S3
//!
//! A configurable serial device emulator that can simulate various protocols
//! for testing the serialport-api-mgr application.
//!
//! Features:
//! - Multiple protocol modes (AT, Modbus RTU, NMEA GPS, SCPI, etc.)
//! - Web dashboard for configuration and monitoring
//! - WiFi configuration over serial port (stored in NVS)
//! - Real-time message logging
//!
//! WiFi Setup Commands (sent over serial):
//! - WIFI_SSID=<network_name>  - Set WiFi SSID
//! - WIFI_PASS=<password>      - Set WiFi password
//! - WIFI_CONNECT              - Connect to WiFi
//! - WIFI_STATUS               - Show connection status
//! - WIFI_CLEAR                - Clear stored credentials
//! - WIFI_SCAN                 - Scan for networks
//! - MODE=<mode>               - Set protocol mode
//! - HELP                      - Show available commands

mod commands;
mod http;
mod protocols;
mod serial;
mod types;
mod wifi;

use esp_idf_svc::{
    eventloop::EspSystemEventLoop,
    hal::{delay::FreeRtos, gpio::PinDriver, prelude::*},
    http::server::EspHttpServer,
    nvs::{EspNvs, EspNvsPartition, NvsDefault},
    wifi::{BlockingWifi, EspWifi},
};
use log::*;
use std::sync::{Arc, Mutex};

use commands::{is_binary_mode, process_binary_data, process_line, show_welcome_message, BinaryProtocolState};
use http::start_http_server;
use serial::{init_usb_serial, read_bytes, send_bytes, send_line};
use types::{DeviceState, ProtocolMode};
use wifi::{load_wifi_config, try_connect_wifi, WifiManager, NVS_NAMESPACE};

fn main() -> anyhow::Result<()> {
    // Initialize ESP-IDF
    esp_idf_svc::sys::link_patches();
    esp_idf_svc::log::EspLogger::initialize_default();

    info!("===========================================");
    info!("  Serial Protocol Tester - ESP32-S3");
    info!("===========================================");
    info!("Send 'HELP' over serial for commands");

    let peripherals = Peripherals::take()?;
    let sys_loop = EspSystemEventLoop::take()?;
    let nvs_default = EspNvsPartition::<NvsDefault>::take()?;

    // Initialize shared state
    let state = Arc::new(Mutex::new(DeviceState::default()));

    // Initialize USB Serial JTAG for ESP32-S3
    if let Err(e) = init_usb_serial() {
        warn!("USB Serial init error: {}", e);
    }

    // Setup LED for status indication
    let mut led = PinDriver::output(peripherals.pins.gpio2)?;

    // Initialize NVS for WiFi credentials
    let nvs = EspNvs::new(nvs_default.clone(), NVS_NAMESPACE, true)?;

    // Try to load stored WiFi credentials
    let stored_config = load_wifi_config(&nvs);

    // Initialize WiFi
    let wifi = BlockingWifi::wrap(
        EspWifi::new(peripherals.modem, sys_loop.clone(), Some(nvs_default))?,
        sys_loop,
    )?;

    let mut wifi_mgr = WifiManager {
        wifi,
        nvs,
        pending_ssid: String::new(),
        pending_pass: String::new(),
    };

    // Try to connect with stored credentials
    let mut http_server: Option<EspHttpServer<'static>> = None;

    if !stored_config.ssid.is_empty() {
        info!("Found stored WiFi credentials for: {}", stored_config.ssid);
        if let Ok(ip) =
            try_connect_wifi(&mut wifi_mgr, &stored_config.ssid, &stored_config.password)
        {
            let mut s = state.lock().unwrap();
            s.wifi_connected = true;
            s.wifi_ssid = stored_config.ssid.clone();
            s.wifi_ip = ip.clone();
            s.mode = ProtocolMode::AtCommand;
            drop(s);

            // Start HTTP server
            match start_http_server(state.clone()) {
                Ok(server) => {
                    info!("Web dashboard: http://{}", ip);
                    http_server = Some(server);
                }
                Err(e) => warn!("Failed to start HTTP server: {:?}", e),
            }
        } else {
            info!("Stored credentials failed, entering setup mode");
            send_line("WiFi connection failed. Use WIFI_SSID/WIFI_PASS/WIFI_CONNECT to configure.");
        }
    } else {
        info!("No stored WiFi credentials, entering setup mode");
        show_welcome_message();
    }

    // Main loop
    let mut line_buf = String::new();
    let mut binary_buf: Vec<u8> = Vec::with_capacity(512);
    let mut stdin_buf = [0u8; 256];
    let mut binary_state = BinaryProtocolState::new();
    let mut binary_idle_count = 0u32;
    const BINARY_FRAME_TIMEOUT: u32 = 5; // Number of idle cycles before processing binary frame

    loop {
        // Blink LED based on WiFi status
        let is_connected = state.lock().unwrap().wifi_connected;
        if is_connected {
            led.set_high()?;
            FreeRtos::delay_ms(100);
            led.set_low()?;
            FreeRtos::delay_ms(100);
        } else {
            led.toggle()?;
            FreeRtos::delay_ms(200);
        }

        // Read from USB Serial JTAG
        let bytes_read = read_bytes(&mut stdin_buf);
        let current_mode = state.lock().unwrap().mode;

        if bytes_read > 0 {
            binary_idle_count = 0;

            if is_binary_mode(current_mode) {
                // Binary protocol mode - accumulate bytes
                binary_buf.extend_from_slice(&stdin_buf[..bytes_read as usize]);

                // Update state
                {
                    let mut s = state.lock().unwrap();
                    s.message_count += 1;
                }
            } else {
                // Text-based protocol mode - process lines
                for &byte in &stdin_buf[..bytes_read as usize] {
                    if byte == b'\n' || byte == b'\r' {
                        if !line_buf.is_empty() {
                            let line = line_buf.trim().to_string();
                            line_buf.clear();

                            // Update state
                            {
                                let mut s = state.lock().unwrap();
                                s.message_count += 1;
                                s.last_received = line.clone();
                            }

                            // Process the line based on mode
                            let response =
                                process_line(&line, current_mode, &state, &mut wifi_mgr, &mut http_server);

                            if !response.is_empty() {
                                send_line(&response);
                                state.lock().unwrap().last_sent = response;
                            }
                        }
                    } else {
                        line_buf.push(byte as char);
                    }
                }
            }
        } else if is_binary_mode(current_mode) && !binary_buf.is_empty() {
            // No new data in binary mode - check if frame is complete (timeout-based framing)
            binary_idle_count += 1;

            if binary_idle_count >= BINARY_FRAME_TIMEOUT {
                // Process the accumulated binary frame
                if let Some(response) = process_binary_data(&binary_buf, current_mode, &state, &mut binary_state) {
                    send_bytes(&response);
                }
                binary_buf.clear();
                binary_idle_count = 0;
            }
        }
    }
}
