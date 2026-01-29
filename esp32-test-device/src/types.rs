//! Type definitions for the Serial Protocol Tester

use serde::{Deserialize, Serialize};
use std::sync::{Arc, Mutex};

/// Protocol modes supported by the tester
#[derive(Clone, Copy, Debug, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "SCREAMING_SNAKE_CASE")]
pub enum ProtocolMode {
    Setup,      // WiFi setup mode (default on first boot)
    Echo,       // Simple echo back
    AtCommand,  // ESP32-style AT commands
    ModbusRtu,  // Modbus RTU slave
    NmeaGps,    // GPS NMEA sentence generator
    Scpi,       // SCPI instrument emulator
    Marlin,     // 3D printer Marlin emulator
    Elm327,     // OBD-II ELM327 emulator
    EscPos,     // ESC/POS printer emulator
}

impl Default for ProtocolMode {
    fn default() -> Self {
        Self::Setup
    }
}

impl ProtocolMode {
    pub fn from_str(s: &str) -> Option<Self> {
        match s.to_uppercase().as_str() {
            "SETUP" => Some(Self::Setup),
            "ECHO" => Some(Self::Echo),
            "AT" | "AT_COMMAND" => Some(Self::AtCommand),
            "MODBUS" | "MODBUS_RTU" => Some(Self::ModbusRtu),
            "GPS" | "NMEA" | "NMEA_GPS" => Some(Self::NmeaGps),
            "SCPI" => Some(Self::Scpi),
            "MARLIN" | "3DPRINTER" => Some(Self::Marlin),
            "ELM327" | "OBD" | "OBD2" => Some(Self::Elm327),
            "ESCPOS" | "PRINTER" => Some(Self::EscPos),
            _ => None,
        }
    }
}

/// Serial port configuration
#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct SerialConfig {
    pub baud_rate: u32,
    pub data_bits: u8,
    pub parity: String,
    pub stop_bits: u8,
}

impl Default for SerialConfig {
    fn default() -> Self {
        Self {
            baud_rate: 115200,
            data_bits: 8,
            parity: "None".to_string(),
            stop_bits: 1,
        }
    }
}

/// Simulated sensor data for protocols that need it
#[derive(Clone, Debug, Default, Serialize, Deserialize)]
pub struct SimulatedData {
    pub temperature: f32,
    pub humidity: f32,
    pub pressure: f32,
    pub latitude: f64,
    pub longitude: f64,
    pub altitude: f32,
    pub speed: f32,
    pub rpm: u16,
    pub voltage: f32,
    pub current: f32,
}

/// WiFi configuration stored in NVS
#[derive(Clone, Debug, Default)]
pub struct WifiConfig {
    pub ssid: String,
    pub password: String,
}

/// Device state shared between tasks
#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct DeviceState {
    pub mode: ProtocolMode,
    pub serial_config: SerialConfig,
    pub simulated_data: SimulatedData,
    pub message_count: u32,
    pub last_received: String,
    pub last_sent: String,
    pub wifi_ssid: String,
    pub wifi_connected: bool,
    pub wifi_ip: String,
}

impl Default for DeviceState {
    fn default() -> Self {
        Self {
            mode: ProtocolMode::Setup,
            serial_config: SerialConfig::default(),
            simulated_data: SimulatedData {
                temperature: 25.0,
                humidity: 50.0,
                pressure: 1013.25,
                latitude: 37.7749,
                longitude: -122.4194,
                altitude: 10.0,
                speed: 0.0,
                rpm: 0,
                voltage: 3.3,
                current: 0.1,
            },
            message_count: 0,
            last_received: String::new(),
            last_sent: String::new(),
            wifi_ssid: String::new(),
            wifi_connected: false,
            wifi_ip: String::new(),
        }
    }
}

/// Thread-safe shared state type
pub type SharedState = Arc<Mutex<DeviceState>>;
