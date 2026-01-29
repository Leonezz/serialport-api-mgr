//! Serial I/O functions for USB-JTAG-Serial on ESP32-S3

use log::*;

/// Initialize the USB Serial JTAG driver
pub fn init_usb_serial() -> Result<(), i32> {
    unsafe {
        let mut config = esp_idf_svc::sys::usb_serial_jtag_driver_config_t {
            tx_buffer_size: 1024,
            rx_buffer_size: 1024,
        };
        let ret = esp_idf_svc::sys::usb_serial_jtag_driver_install(&mut config as *mut _);
        if ret != esp_idf_svc::sys::ESP_OK {
            warn!("Failed to install USB Serial JTAG driver: {}", ret);
            return Err(ret);
        }
        info!("USB Serial JTAG driver installed");
        Ok(())
    }
}

/// Send a line over USB Serial JTAG with CRLF termination
pub fn send_line(line: &str) {
    unsafe {
        let msg = format!("{}\r\n", line);
        esp_idf_svc::sys::usb_serial_jtag_write_bytes(
            msg.as_ptr() as *const _,
            msg.len(),
            100, // timeout ticks
        );
    }
}

/// Read bytes from USB Serial JTAG (non-blocking with short timeout)
/// Returns the number of bytes read, or 0 if no data available
pub fn read_bytes(buf: &mut [u8]) -> i32 {
    unsafe {
        esp_idf_svc::sys::usb_serial_jtag_read_bytes(
            buf.as_mut_ptr() as *mut _,
            buf.len() as u32,
            10, // short timeout in ticks
        )
    }
}
