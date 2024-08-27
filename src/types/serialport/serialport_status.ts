import { SerialportConfig } from "./serialport_config";

export type OpenedPortStatus = {
  Opened: {
    carrire_detect: boolean;
    clear_to_send: boolean;
    data_set_ready: boolean;
    ring_indicator: boolean;
  } & Omit<SerialportConfig, "port_name">;
};

export type USBPortInfo = {
  vid: number;
  pid: number;
  serial_number: string | null;
  manufacturer: string | null;
  product: string | null;
};

export type SerialPortStatus = {
  port_name: string;
  port_type:
    | "Unknown"
    | "PciPort"
    | "BluetoothPort"
    | {
        UsbPort: USBPortInfo;
      };
  port_status: "Closed" | OpenedPortStatus;
  bytes_read: number;
  bytes_write: number;
};

export const isUsbPort = (info: SerialPortStatus["port_type"]): boolean => {
  return !(
    info === "Unknown" ||
    info === "BluetoothPort" ||
    info === "PciPort"
  );
};

export const convertPortTypeToString = (type: SerialPortStatus["port_type"]) => {
  if (type === "Unknown") {
    return "Unknown";
  }
  if (type === "PciPort") {
    return "PCI";
  }
  if (type === "BluetoothPort") {
    return "Bluetooth";
  }
  return "USB";
};
