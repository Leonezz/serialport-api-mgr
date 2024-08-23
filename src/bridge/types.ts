import { capitalize } from "es-toolkit";

export type OpenedPortStatus = {
    Opened: {
      baud_rate: number;
      flow_control: SERIALPORT.ConfigTypes<"flow_control">;
      data_bits: SERIALPORT.ConfigTypes<"data_bits">;
      parity: SERIALPORT.ConfigTypes<"parity">;
      stop_bits: SERIALPORT.ConfigTypes<"stop_bits">;
      carrire_detect: boolean;
      clear_to_send: boolean;
      data_set_ready: boolean;
      ring_indicator: boolean;
      read_timeout: number;
      write_timeout: number;
    };
  };
  
  export type SerialPortInfo = {
    port_name: string;
    port_type:
      | "Unknown"
      | "PciPort"
      | "BluetoothPort"
      | {
          UsbPort: {
            vid: number;
            pid: number;
            serial_number: string | null;
            manufacturer: string | null;
            product: string | null;
          };
        };
    port_status: "Closed" | OpenedPortStatus;
    bytes_read: number;
    bytes_write: number;
  };
  
  export const isUsbPort = (info: SerialPortInfo): boolean => {
    return !(
      info.port_type === "Unknown" ||
      info.port_type === "BluetoothPort" ||
      info.port_type === "PciPort"
    );
  };
  
  export const convertPortTypeToString = (type: SerialPortInfo["port_type"]) => {
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
  
  export namespace SERIALPORT {
    export const ConfigOptions = {
      data_bits: ["Five", "Six", "Seven", "Eight"] as const,
      flow_control: ["None", "Software", "Hardware"] as const,
      parity: ["None", "Odd", "Even"] as const,
      stop_bits: ["One", "Two"] as const,
    };
    export type ConfigTypes<
      T extends keyof typeof ConfigOptions
    > = (typeof ConfigOptions)[T][number];
    export const CommonlyUsedBaudRates = [
      4800, 9600, 19200, 38400, 57600, 115200, 230400, 460800, 921600,
    ] as const;
  }