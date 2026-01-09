
#[derive(Debug, Clone, PartialEq, Eq, serde::Serialize, serde::Deserialize)]
pub struct UsbPortInfo {
    /// Vendor ID
    pub vid: u16,
    /// Product ID
    pub pid: u16,
    /// Serial number (arbitrary string)
    pub serial_number: Option<String>,
    /// Manufacturer (arbitrary string)
    pub manufacturer: Option<String>,
    /// Product name (arbitrary string)
    pub product: Option<String>,
    /// The interface index of the USB serial port. This can be either the interface number of
    /// the communication interface (as is the case on Windows and Linux) or the data
    /// interface (as is the case on macOS), so you should recognize both interface numbers.
    pub interface: Option<u8>,
}