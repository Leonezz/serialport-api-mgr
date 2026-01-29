//! SCPI instrument emulator

use crate::types::SimulatedData;

/// Process a SCPI command and return the response
pub fn process_scpi_command(line: &str, sim_data: &SimulatedData) -> String {
    let cmd = line.trim().to_uppercase();

    match cmd.as_str() {
        "*IDN?" => "ESP32-SCPI-SIM,SerialTester,001,1.0.0".to_string(),
        "*RST" => String::new(),
        "*OPC?" => "1".to_string(),
        ":SYST:ERR?" | "SYST:ERR?" => "0,\"No error\"".to_string(),
        ":MEAS:VOLT:DC?" | "MEAS:VOLT:DC?" => format!("{:.6}", sim_data.voltage),
        ":MEAS:CURR:DC?" | "MEAS:CURR:DC?" => format!("{:.6}", sim_data.current),
        ":MEAS:TEMP?" | "MEAS:TEMP?" => format!("{:.2}", sim_data.temperature),
        _ => "ERROR".to_string(),
    }
}
