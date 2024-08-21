use serialport5::{ SerialPortInfo, SerialPortType, UsbPortInfo };

#[derive(serde::Serialize, Debug)]
pub struct SerialPortInfoForSerilize {
    /// The short name of the serial port
    pub port_name: String,
    /// The hardware device type that exposes this port
    pub port_type: SerialPortTypeForSerilize,
}

impl From<SerialPortInfo> for SerialPortInfoForSerilize {
    fn from(value: SerialPortInfo) -> Self {
        SerialPortInfoForSerilize {
            port_name: value.port_name,
            port_type: value.port_type.into(),
        }
    }
}

#[derive(serde::Serialize, Debug)]
pub enum SerialPortTypeForSerilize {
    /// The serial port is connected via USB
    UsbPort(UsbPortInfoForSerilize),
    /// The serial port is connected via PCI (permanent port)
    PciPort,
    /// The serial port is connected via Bluetooth
    BluetoothPort,
    /// It can't be determined how the serial port is connected
    Unknown,
}

impl From<SerialPortType> for SerialPortTypeForSerilize {
    fn from(value: SerialPortType) -> Self {
        match value {
            SerialPortType::UsbPort(info) => SerialPortTypeForSerilize::UsbPort(info.into()),
            SerialPortType::PciPort => SerialPortTypeForSerilize::PciPort,
            SerialPortType::BluetoothPort => SerialPortTypeForSerilize::BluetoothPort,
            SerialPortType::Unknown => SerialPortTypeForSerilize::Unknown,
        }
    }
}

#[derive(serde::Serialize, Debug)]
pub struct UsbPortInfoForSerilize {
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
}

impl From<UsbPortInfo> for UsbPortInfoForSerilize {
    fn from(value: UsbPortInfo) -> Self {
        UsbPortInfoForSerilize {
            vid: value.vid,
            pid: value.pid,
            serial_number: value.serial_number,
            manufacturer: value.manufacturer,
            product: value.product,
        }
    }
}
