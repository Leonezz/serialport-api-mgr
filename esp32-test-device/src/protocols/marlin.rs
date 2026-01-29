//! Marlin 3D printer G-code emulator

use crate::types::SimulatedData;

/// Process Marlin G-code and return the response
pub fn process_marlin_gcode(line: &str, sim_data: &SimulatedData) -> String {
    let cmd = line.trim().to_uppercase();

    if cmd.starts_with("G28") {
        "echo:busy: processing\r\nX:0.00 Y:0.00 Z:0.00 E:0.00 Count X:0 Y:0 Z:0\r\nok".to_string()
    } else if cmd.starts_with("M105") {
        // Report temperatures
        format!(
            "ok T:{:.1} /0.0 B:{:.1} /0.0 @:0 B@:0",
            sim_data.temperature + 175.0,  // Hotend temp
            sim_data.temperature + 35.0    // Bed temp
        )
    } else if cmd.starts_with("M114") {
        // Report position
        "X:100.00 Y:100.00 Z:10.00 E:0.00 Count X:8000 Y:8000 Z:4000\r\nok".to_string()
    } else if cmd.starts_with("M503") {
        // Report settings
        "echo:; EEPROM Settings\r\n\
         echo:  M92 X80.00 Y80.00 Z400.00 E93.00\r\n\
         echo:  M203 X300.00 Y300.00 Z5.00 E25.00\r\nok"
            .to_string()
    } else if cmd.starts_with('M') || cmd.starts_with('G') {
        "ok".to_string()
    } else {
        "echo:Unknown command\r\nok".to_string()
    }
}
