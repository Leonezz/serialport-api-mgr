use std::{default, time::Duration};

use serde::{de::value::Error, Serialize};
use serialport5::{ DataBits, FlowControl, Parity, SerialPort, SerialPortInfo, SerialPortType, StopBits, UsbPortInfo };



#[derive(serde::Serialize, Debug, Clone)]
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

#[derive(serde::Serialize, Debug, Clone)]
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

#[derive(Debug, Serialize, Clone, Copy, Default)]
pub enum FlowControlForSerialize {
    #[default]
    None,
    Software,
    Hardware,
}

impl From<FlowControl> for FlowControlForSerialize {
    fn from(value: FlowControl) -> Self {
        match value{
            FlowControl::None => FlowControlForSerialize::None,
            FlowControl::Software => FlowControlForSerialize::Software,
            FlowControl::Hardware => FlowControlForSerialize::Hardware
        }
    }
}

#[derive(Debug, Serialize, Clone, Copy, Default)]
pub enum DataBitsForSerialize {
    Five,
    Six,
    Seven,
    #[default]
    Eight
}

impl From<DataBits> for DataBitsForSerialize {
    fn from(value: DataBits) -> Self {
        match value {
            DataBits::Five => DataBitsForSerialize::Five,
            DataBits::Six => DataBitsForSerialize::Six,
            DataBits::Seven => DataBitsForSerialize::Seven,
            DataBits::Eight => DataBitsForSerialize::Eight
        }
    }
}

#[derive(Debug, Serialize, Clone, Copy, Default)]
pub enum ParityForSerialize {
    #[default]
    None,
    Even,
    Odd
}

impl From<Parity> for ParityForSerialize {
    fn from(value: Parity) -> Self {
        match value {
            Parity::None => ParityForSerialize::None,
            Parity::Even => ParityForSerialize::Even,
            Parity::Odd => ParityForSerialize::Odd
        }
    }
}

#[derive(Debug, Serialize, Clone, Copy, Default)]
pub enum StopBitsForSerialize {
    #[default]
    One,
    Two
}

impl From<StopBits> for StopBitsForSerialize {
    fn from(value: StopBits) -> Self {
        match value {
            StopBits::One => StopBitsForSerialize::One,
            StopBits::Two => StopBitsForSerialize::Two
        }
    }
}

#[derive(Debug, Serialize, Clone, Copy, Default)]
pub struct OpenedPortProfile {
    baud_rate: u32,
    flow_control: FlowControlForSerialize,
    data_bits: DataBitsForSerialize,
    parity: ParityForSerialize,
    stop_bits: StopBitsForSerialize,
    carrier_detect: bool,
    clear_to_send: bool,
    data_set_ready: bool,
    ring_indicator: bool,
    read_timeout: u128,
    write_timeout: u128,
}

impl OpenedPortProfile {
    pub fn update_from_port(&mut self, port: &mut SerialPort) -> Result<(), serialport5::Error> {
        self.baud_rate = port.baud_rate()?;
        self.flow_control = port.flow_control()?.into();
        self.data_bits = port.data_bits()?.into();
        self.parity = port.parity()?.into();
        self.stop_bits = port.stop_bits()?.into();
        self.carrier_detect = port.read_carrier_detect()?;
        self.data_set_ready = port.read_data_set_ready()?;
        self.ring_indicator = port.read_ring_indicator()?;
        self.read_timeout = port.read_timeout().unwrap_or_default().as_nanos();
        self.write_timeout = port.write_timeout().unwrap_or_default().as_nanos();
        Ok(())
    }
}

#[derive(Serialize, Debug, Clone, Copy)]
pub enum PortStatusType {
    Opened(OpenedPortProfile),
    Closed
}

#[derive(Serialize, Debug, Clone)]
pub struct PortInfo {
    pub port_name: String,
    pub port_type: SerialPortTypeForSerilize,
    pub port_status: PortStatusType,
    pub bytes_read: u128,
    pub bytes_write: u128,
}