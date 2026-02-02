//! Modbus RTU slave emulator using rmodbus crate
//!
//! Implements a Modbus RTU slave that responds to common function codes
//! with simulated sensor data.

use crate::types::SimulatedData;
use rmodbus::{
    server::{context::ModbusContext, storage::ModbusStorageSmall},
    ModbusFrameBuf, ModbusProto,
};
use std::sync::{Arc, Mutex};

/// Default slave address
pub const SLAVE_ADDRESS: u8 = 1;

/// Modbus context with simulated data
pub struct ModbusServer {
    context: Arc<Mutex<ModbusStorageSmall>>,
}

impl ModbusServer {
    pub fn new() -> Self {
        Self {
            context: Arc::new(Mutex::new(ModbusStorageSmall::new())),
        }
    }

    /// Update registers with simulated data
    pub fn update_from_sim_data(&self, sim_data: &SimulatedData) {
        let mut ctx = self.context.lock().unwrap();

        // Helper macro to log errors from register operations
        macro_rules! set_register {
            ($method:ident, $addr:expr, $value:expr, $name:expr) => {
                if let Err(e) = ctx.$method($addr, $value) {
                    log::warn!("Modbus: Failed to set {} register {}: {:?}", $name, $addr, e);
                }
            };
        }

        macro_rules! set_bit {
            ($method:ident, $addr:expr, $value:expr, $name:expr) => {
                if let Err(e) = ctx.$method($addr, $value) {
                    log::warn!("Modbus: Failed to set {} {}: {:?}", $name, $addr, e);
                }
            };
        }

        // Input registers (read-only sensor data) - addresses 0-7
        // Register 0: Temperature ×10 (e.g., 250 = 25.0°C)
        set_register!(set_input, 0, (sim_data.temperature * 10.0) as u16, "input");
        // Register 1: Humidity ×10 (e.g., 500 = 50.0%)
        set_register!(set_input, 1, (sim_data.humidity * 10.0) as u16, "input");
        // Register 2: RPM
        set_register!(set_input, 2, sim_data.rpm, "input");
        // Register 3: Speed ×10 (e.g., 600 = 60.0 km/h)
        set_register!(set_input, 3, (sim_data.speed * 10.0) as u16, "input");
        // Register 4: Voltage ×100 (e.g., 330 = 3.30V)
        set_register!(set_input, 4, (sim_data.voltage * 100.0) as u16, "input");
        // Register 5: Current ×1000 (e.g., 100 = 0.100A)
        set_register!(set_input, 5, (sim_data.current * 1000.0) as u16, "input");
        // Register 6: Pressure ×10 (e.g., 10132 = 1013.2 hPa)
        set_register!(set_input, 6, (sim_data.pressure * 10.0) as u16, "input");
        // Register 7: Altitude ×10 (e.g., 100 = 10.0m)
        set_register!(set_input, 7, (sim_data.altitude * 10.0) as u16, "input");

        // Also mirror to holding registers for read/write access
        set_register!(set_holding, 0, (sim_data.temperature * 10.0) as u16, "holding");
        set_register!(set_holding, 1, (sim_data.humidity * 10.0) as u16, "holding");
        set_register!(set_holding, 2, sim_data.rpm, "holding");
        set_register!(set_holding, 3, (sim_data.speed * 10.0) as u16, "holding");
        set_register!(set_holding, 4, (sim_data.voltage * 100.0) as u16, "holding");
        set_register!(set_holding, 5, (sim_data.current * 1000.0) as u16, "holding");
        set_register!(set_holding, 6, (sim_data.pressure * 10.0) as u16, "holding");
        set_register!(set_holding, 7, (sim_data.altitude * 10.0) as u16, "holding");

        // Coils (digital outputs) - some example states
        set_bit!(set_coil, 0, true, "coil"); // Device online
        set_bit!(set_coil, 1, false, "coil"); // Alarm status
        set_bit!(set_coil, 2, true, "coil"); // Sensor ready

        // Discrete inputs (digital inputs)
        set_bit!(set_discrete, 0, true, "discrete"); // Input 1 state
        set_bit!(set_discrete, 1, false, "discrete"); // Input 2 state
    }

    /// Process a Modbus RTU frame and return the response
    pub fn process_frame(&self, request: &[u8], sim_data: &SimulatedData) -> Option<Vec<u8>> {
        // Update context with latest simulated data
        self.update_from_sim_data(sim_data);

        // Check minimum frame length
        if request.len() < 4 {
            log::warn!("Modbus: Frame too short ({} bytes)", request.len());
            return None;
        }

        // Check if addressed to us
        let unit_id = request[0];
        if unit_id != SLAVE_ADDRESS && unit_id != 0 {
            log::debug!("Modbus: Not for us (address {})", unit_id);
            return None;
        }

        // Prepare response buffer
        let mut response = ModbusFrameBuf::new();

        // Process the frame
        let ctx = self.context.lock().unwrap();
        match rmodbus::server::process_frame(
            unit_id,
            request,
            &*ctx,
            ModbusProto::Rtu,
            &mut response,
        ) {
            Ok(_) => {
                log::debug!(
                    "Modbus: Processed FC{:02X}, response {} bytes",
                    request[1],
                    response.len()
                );
                Some(response.to_vec())
            }
            Err(e) => {
                log::warn!("Modbus: Error processing frame: {:?}", e);
                None
            }
        }
    }
}

impl Default for ModbusServer {
    fn default() -> Self {
        Self::new()
    }
}

/// Simple wrapper for stateless processing (creates server per call)
/// For better performance, use ModbusServer instance directly
pub fn process_modbus_rtu(data: &[u8], sim_data: &SimulatedData) -> Option<Vec<u8>> {
    let server = ModbusServer::new();
    server.process_frame(data, sim_data)
}

/// Calculate Modbus CRC-16 (for manual frame building if needed)
pub fn calculate_crc16(data: &[u8]) -> u16 {
    let mut crc: u16 = 0xFFFF;

    for byte in data {
        crc ^= *byte as u16;
        for _ in 0..8 {
            if crc & 0x0001 != 0 {
                crc = (crc >> 1) ^ 0xA001;
            } else {
                crc >>= 1;
            }
        }
    }

    crc
}

/// Build a read holding registers request (for testing)
pub fn build_read_holding_request(unit_id: u8, start: u16, count: u16) -> Vec<u8> {
    let mut frame = vec![
        unit_id,
        0x03, // FC03: Read Holding Registers
        (start >> 8) as u8,
        (start & 0xFF) as u8,
        (count >> 8) as u8,
        (count & 0xFF) as u8,
    ];
    let crc = calculate_crc16(&frame);
    frame.push((crc & 0xFF) as u8);
    frame.push((crc >> 8) as u8);
    frame
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_crc16() {
        // Test vector: Read holding registers from address 0, count 2
        let data = [0x01, 0x03, 0x00, 0x00, 0x00, 0x02];
        let crc = calculate_crc16(&data);
        assert_eq!(crc, 0x0BC4); // Little-endian: C4 0B
    }

    #[test]
    fn test_modbus_server() {
        let server = ModbusServer::new();
        let sim_data = SimulatedData {
            temperature: 25.5,
            humidity: 60.0,
            rpm: 3000,
            speed: 55.5,
            voltage: 3.3,
            current: 0.15,
            pressure: 1013.25,
            altitude: 100.0,
            ..Default::default()
        };

        // Build a read request
        let request = build_read_holding_request(SLAVE_ADDRESS, 0, 4);

        let response = server.process_frame(&request, &sim_data);
        assert!(response.is_some());

        let resp = response.unwrap();
        assert_eq!(resp[0], SLAVE_ADDRESS); // Unit ID
        assert_eq!(resp[1], 0x03); // Function code
        assert_eq!(resp[2], 8); // Byte count (4 registers × 2 bytes)
    }
}
