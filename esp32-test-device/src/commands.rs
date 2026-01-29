//! Command processing for setup and simulation commands

use esp_idf_svc::http::server::EspHttpServer;
use log::*;

use crate::http::start_http_server;
use crate::protocols;
use crate::serial::send_line;
use crate::types::{ProtocolMode, SharedState};
use crate::wifi::{clear_wifi_config, save_wifi_config, try_connect_wifi, WifiManager};

/// Process a line of input based on current protocol mode
pub fn process_line(
    line: &str,
    mode: ProtocolMode,
    state: &SharedState,
    wifi_mgr: &mut WifiManager,
    http_server: &mut Option<EspHttpServer<'static>>,
) -> String {
    let line_upper = line.to_uppercase();

    // Always process setup commands regardless of mode
    if line_upper.starts_with("WIFI_")
        || line_upper == "HELP"
        || line_upper.starts_with("MODE=")
        || line_upper.starts_with("SET_")
        || line_upper == "STATUS"
    {
        return process_setup_command(line, state, wifi_mgr, http_server);
    }

    // Process based on current mode
    match mode {
        ProtocolMode::Setup => process_setup_command(line, state, wifi_mgr, http_server),
        ProtocolMode::Echo => line.to_string(),
        ProtocolMode::AtCommand => protocols::process_at_command(line),
        ProtocolMode::ModbusRtu => {
            // Modbus is binary, this is for debugging
            "Modbus RTU mode - send binary data".to_string()
        }
        ProtocolMode::NmeaGps => {
            let sim_data = &state.lock().unwrap().simulated_data;
            String::from_utf8_lossy(&protocols::generate_nmea_sentence(sim_data)).to_string()
        }
        ProtocolMode::Scpi => {
            protocols::process_scpi_command(line, &state.lock().unwrap().simulated_data)
        }
        ProtocolMode::Marlin => {
            protocols::process_marlin_gcode(line, &state.lock().unwrap().simulated_data)
        }
        ProtocolMode::Elm327 => {
            protocols::process_elm327_command(line, &state.lock().unwrap().simulated_data)
        }
        ProtocolMode::EscPos => "ESC/POS mode - send binary commands".to_string(),
    }
}

/// Process setup, configuration, and simulation commands
pub fn process_setup_command(
    line: &str,
    state: &SharedState,
    wifi_mgr: &mut WifiManager,
    http_server: &mut Option<EspHttpServer<'static>>,
) -> String {
    let line_upper = line.to_uppercase();

    if line_upper == "HELP" {
        return HELP_TEXT.to_string();
    }

    if line_upper.starts_with("WIFI_SSID=") {
        let ssid = line[10..].trim().to_string();
        wifi_mgr.pending_ssid = ssid.clone();
        return format!("OK - SSID set to: {}", ssid);
    }

    if line_upper.starts_with("WIFI_PASS=") {
        let pass = line[10..].trim().to_string();
        wifi_mgr.pending_pass = pass;
        return "OK - Password set (hidden)".to_string();
    }

    if line_upper == "WIFI_CONNECT" {
        return handle_wifi_connect(state, wifi_mgr, http_server);
    }

    if line_upper == "WIFI_STATUS" {
        return handle_wifi_status(state, wifi_mgr);
    }

    if line_upper == "WIFI_SCAN" {
        return "Scanning... (check serial monitor for results)".to_string();
    }

    if line_upper == "WIFI_CLEAR" {
        if let Err(e) = clear_wifi_config(&mut wifi_mgr.nvs) {
            return format!("ERROR - Failed to clear: {:?}", e);
        }
        wifi_mgr.pending_ssid.clear();
        wifi_mgr.pending_pass.clear();
        return "OK - WiFi credentials cleared".to_string();
    }

    if line_upper.starts_with("MODE=") {
        let mode_str = line[5..].trim();
        if let Some(new_mode) = ProtocolMode::from_str(mode_str) {
            state.lock().unwrap().mode = new_mode;
            return format!("OK - Mode set to: {:?}", new_mode);
        } else {
            return "ERROR - Unknown mode. Use HELP to see available modes".to_string();
        }
    }

    // Simulation data setters
    if line_upper.starts_with("SET_TEMP=") {
        if let Ok(val) = line[9..].trim().parse::<f32>() {
            state.lock().unwrap().simulated_data.temperature = val;
            return format!("OK - Temperature set to: {}°C", val);
        } else {
            return "ERROR - Invalid temperature value".to_string();
        }
    }

    if line_upper.starts_with("SET_HUMID=") {
        if let Ok(val) = line[10..].trim().parse::<f32>() {
            state.lock().unwrap().simulated_data.humidity = val;
            return format!("OK - Humidity set to: {}%", val);
        } else {
            return "ERROR - Invalid humidity value".to_string();
        }
    }

    if line_upper.starts_with("SET_RPM=") {
        if let Ok(val) = line[8..].trim().parse::<u16>() {
            state.lock().unwrap().simulated_data.rpm = val;
            return format!("OK - RPM set to: {}", val);
        } else {
            return "ERROR - Invalid RPM value".to_string();
        }
    }

    if line_upper.starts_with("SET_SPEED=") {
        if let Ok(val) = line[10..].trim().parse::<f32>() {
            state.lock().unwrap().simulated_data.speed = val;
            return format!("OK - Speed set to: {} km/h", val);
        } else {
            return "ERROR - Invalid speed value".to_string();
        }
    }

    if line_upper == "STATUS" {
        let s = state.lock().unwrap();
        return format!(
            "Mode: {:?}\r\nWiFi: {}\r\nMessages: {}\r\nTemp: {}°C\r\nRPM: {}",
            s.mode,
            if s.wifi_connected {
                format!("{} ({})", s.wifi_ssid, s.wifi_ip)
            } else {
                "Not connected".to_string()
            },
            s.message_count,
            s.simulated_data.temperature,
            s.simulated_data.rpm
        );
    }

    format!(
        "Unknown command: {}. Type HELP for available commands.",
        line
    )
}

fn handle_wifi_connect(
    state: &SharedState,
    wifi_mgr: &mut WifiManager,
    http_server: &mut Option<EspHttpServer<'static>>,
) -> String {
    if wifi_mgr.pending_ssid.is_empty() {
        return "ERROR - No SSID set. Use WIFI_SSID=<name> first".to_string();
    }

    let ssid = wifi_mgr.pending_ssid.clone();
    let pass = wifi_mgr.pending_pass.clone();

    match try_connect_wifi(wifi_mgr, &ssid, &pass) {
        Ok(ip) => {
            // Save credentials to NVS
            if let Err(e) = save_wifi_config(&mut wifi_mgr.nvs, &ssid, &pass) {
                warn!("Failed to save WiFi config: {:?}", e);
            }

            // Update state
            {
                let mut s = state.lock().unwrap();
                s.wifi_connected = true;
                s.wifi_ssid = ssid.clone();
                s.wifi_ip = ip.clone();
                s.mode = ProtocolMode::AtCommand;
            }

            // Start HTTP server if not already running
            if http_server.is_none() {
                match start_http_server(state.clone()) {
                    Ok(server) => {
                        *http_server = Some(server);
                    }
                    Err(e) => warn!("Failed to start HTTP server: {:?}", e),
                }
            }

            format!(
                "OK - Connected! IP: {}\r\nWeb dashboard: http://{}\r\nSwitched to AT command mode",
                ip, ip
            )
        }
        Err(e) => format!("ERROR - Connection failed: {}", e),
    }
}

fn handle_wifi_status(state: &SharedState, wifi_mgr: &WifiManager) -> String {
    let s = state.lock().unwrap();
    if s.wifi_connected {
        format!(
            "WiFi: Connected\r\nSSID: {}\r\nIP: {}\r\nMode: {:?}",
            s.wifi_ssid, s.wifi_ip, s.mode
        )
    } else {
        format!(
            "WiFi: Not connected\r\nPending SSID: {}\r\nMode: {:?}",
            if wifi_mgr.pending_ssid.is_empty() {
                "(none)"
            } else {
                &wifi_mgr.pending_ssid
            },
            s.mode
        )
    }
}

/// Display help message for first boot
pub fn show_welcome_message() {
    send_line("");
    send_line("=== Serial Protocol Tester ===");
    send_line("No WiFi configured. Commands:");
    send_line("  WIFI_SSID=<name>   - Set network name");
    send_line("  WIFI_PASS=<pass>   - Set password");
    send_line("  WIFI_CONNECT       - Connect");
    send_line("  WIFI_SCAN          - Scan networks");
    send_line("  HELP               - All commands");
    send_line("");
}

const HELP_TEXT: &str = r#"
=== Serial Protocol Tester Commands ===

WiFi Configuration:
  WIFI_SSID=<name>     Set WiFi network name
  WIFI_PASS=<password> Set WiFi password
  WIFI_CONNECT         Connect to WiFi
  WIFI_STATUS          Show connection status
  WIFI_SCAN            Scan for networks
  WIFI_CLEAR           Clear stored credentials

Protocol Mode:
  MODE=SETUP           WiFi setup mode
  MODE=ECHO            Echo/loopback mode
  MODE=AT              AT command mode (ESP32)
  MODE=MODBUS          Modbus RTU slave
  MODE=GPS             NMEA GPS simulator
  MODE=SCPI            SCPI instrument
  MODE=MARLIN          3D printer (Marlin)
  MODE=ELM327          OBD-II adapter

Simulation:
  SET_TEMP=<value>     Set temperature (°C)
  SET_HUMID=<value>    Set humidity (%)
  SET_RPM=<value>      Set RPM
  SET_SPEED=<value>    Set speed (km/h)

Other:
  HELP                 Show this help
  STATUS               Show device status
"#;
