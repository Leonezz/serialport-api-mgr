pub mod data_bits;
pub mod flow_control;
pub mod parity;
pub mod port_type;
pub mod stop_bits;
pub mod usb_port_info;

impl From<data_bits::DataBits> for tokio_serial::DataBits {
    fn from(value: data_bits::DataBits) -> Self {
        match value {
            data_bits::DataBits::Five => Self::Five,
            data_bits::DataBits::Six => Self::Six,
            data_bits::DataBits::Seven => Self::Seven,
            data_bits::DataBits::Eight => Self::Eight,
        }
    }
}

impl From<tokio_serial::DataBits> for data_bits::DataBits {
    fn from(value: tokio_serial::DataBits) -> Self {
        match value {
            tokio_serial::DataBits::Five => Self::Five,
            tokio_serial::DataBits::Six => Self::Six,
            tokio_serial::DataBits::Seven => Self::Seven,
            tokio_serial::DataBits::Eight => Self::Eight,
        }
    }
}

impl From<flow_control::FlowControl> for tokio_serial::FlowControl {
    fn from(value: flow_control::FlowControl) -> Self {
        match value {
            flow_control::FlowControl::Hardware => Self::Hardware,
            flow_control::FlowControl::Software => Self::Software,
            flow_control::FlowControl::None => Self::None,
        }
    }
}

impl From<tokio_serial::FlowControl> for flow_control::FlowControl {
    fn from(value: tokio_serial::FlowControl) -> Self {
        match value {
            tokio_serial::FlowControl::Hardware => Self::Hardware,
            tokio_serial::FlowControl::Software => Self::Software,
            tokio_serial::FlowControl::None => Self::None,
        }
    }
}

impl From<parity::Parity> for tokio_serial::Parity {
    fn from(value: parity::Parity) -> Self {
        match value {
            parity::Parity::Odd => Self::Odd,
            parity::Parity::Even => Self::Even,
            parity::Parity::None => Self::None,
        }
    }
}

impl From<tokio_serial::Parity> for parity::Parity {
    fn from(value: tokio_serial::Parity) -> Self {
        match value {
            tokio_serial::Parity::Odd => Self::Odd,
            tokio_serial::Parity::Even => Self::Even,
            tokio_serial::Parity::None => Self::None,
        }
    }
}

impl From<stop_bits::StopBits> for tokio_serial::StopBits {
    fn from(value: stop_bits::StopBits) -> Self {
        match value {
            stop_bits::StopBits::One => Self::One,
            stop_bits::StopBits::Two => Self::Two,
        }
    }
}

impl From<tokio_serial::StopBits> for stop_bits::StopBits {
    fn from(value: tokio_serial::StopBits) -> Self {
        match value {
            tokio_serial::StopBits::One => Self::One,
            tokio_serial::StopBits::Two => Self::Two,
        }
    }
}

impl From<usb_port_info::UsbPortInfo> for tokio_serial::UsbPortInfo {
    fn from(value: usb_port_info::UsbPortInfo) -> Self {
        Self {
            vid: value.vid,
            pid: value.pid,
            serial_number: value.serial_number,
            manufacturer: value.manufacturer,
            product: value.product,
            #[cfg(feature = "usbportinfo-interface")]
            interface: value.interface,
        }
    }
}

impl From<tokio_serial::UsbPortInfo> for usb_port_info::UsbPortInfo {
    fn from(value: tokio_serial::UsbPortInfo) -> Self {
        Self {
            vid: value.vid,
            pid: value.pid,
            serial_number: value.serial_number,
            manufacturer: value.manufacturer,
            product: value.product,
            #[cfg(feature = "usbportinfo-interface")]
            interface: value.interface,
            #[cfg(not(feature = "usbportinfo-interface"))]
            interface: None,
        }
    }
}

impl From<tokio_serial::SerialPortType> for port_type::PortType {
    fn from(value: tokio_serial::SerialPortType) -> Self {
        match value {
            tokio_serial::SerialPortType::UsbPort(info) => {
                port_type::PortType::UsbPort(info.into())
            }
            tokio_serial::SerialPortType::PciPort => port_type::PortType::PciPort,
            tokio_serial::SerialPortType::BluetoothPort => port_type::PortType::BluetoothPort,
            tokio_serial::SerialPortType::Unknown => port_type::PortType::Unknown,
        }
    }
}
