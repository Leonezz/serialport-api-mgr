//! ELM327 OBD-II adapter emulator

use crate::types::SimulatedData;

/// Process an ELM327 OBD-II command and return the response
pub fn process_elm327_command(line: &str, sim_data: &SimulatedData) -> String {
    let cmd = line.trim().to_uppercase();

    if cmd == "ATZ" {
        // Reset
        "\r\n\r\nELM327 v1.5\r\n\r\n>".to_string()
    } else if cmd == "ATE0" {
        // Echo off
        "OK\r\n\r\n>".to_string()
    } else if cmd == "ATL1" {
        // Linefeeds on
        "OK\r\n\r\n>".to_string()
    } else if cmd == "ATSP0" {
        // Set protocol auto
        "OK\r\n\r\n>".to_string()
    } else if cmd == "0100" {
        // Supported PIDs 01-20
        "41 00 BE 3F A8 13\r\n\r\n>".to_string()
    } else if cmd == "010C" {
        // Engine RPM (PID 0C)
        let rpm_value = sim_data.rpm * 4;
        format!(
            "41 0C {:02X} {:02X}\r\n\r\n>",
            (rpm_value >> 8) as u8,
            (rpm_value & 0xFF) as u8
        )
    } else if cmd == "010D" {
        // Vehicle speed (PID 0D)
        format!("41 0D {:02X}\r\n\r\n>", sim_data.speed as u8)
    } else if cmd == "0105" {
        // Coolant temperature (PID 05)
        format!("41 05 {:02X}\r\n\r\n>", (sim_data.temperature + 40.0) as u8)
    } else if cmd.starts_with("AT") {
        // Other AT commands
        "OK\r\n\r\n>".to_string()
    } else if cmd.starts_with("01") {
        // Unsupported mode 01 PIDs
        "NO DATA\r\n\r\n>".to_string()
    } else {
        // Unknown command
        "?\r\n\r\n>".to_string()
    }
}
