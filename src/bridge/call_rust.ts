import { invoke } from "@tauri-apps/api/core";

export type RustBusError = {
  code: string;
  msg: string;
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
    DataBits: ["Five", "Six", "Seven", "Eight"] as const,
    FlowControl: ["None", "Software", "Hardware"] as const,
    Parity: ["None", "Odd", "Even"] as const,
    StopBits: ["One", "Two"] as const,
  };
  export type ConfigTypes = {
    DataBits: (typeof ConfigOptions)["DataBits"][number];
    FlowControl: (typeof ConfigOptions)["FlowControl"][number];
    StopBits: (typeof ConfigOptions)["StopBits"][number];
    Parity: (typeof ConfigOptions)["Parity"][number];
  };
  export const CommonlyUsedBaudRates = [
    4800, 9600, 19200, 38400, 57600, 115200, 230400, 460800, 921600,
  ] as const;
}

export type OpenSerialPortReq = {
  portName: string;
  baudRate: number;
  dataBits: SERIALPORT.ConfigTypes["DataBits"];
  flowControl: SERIALPORT.ConfigTypes["FlowControl"];
  parity: SERIALPORT.ConfigTypes["Parity"];
  stopBits: SERIALPORT.ConfigTypes["StopBits"];
};

export type RustBus = {
  hello: {
    args: { param: string };
    returns: string;
  };
  get_all_port_info: {
    args: undefined;
    returns: SerialPortInfo[];
  };
  open_port: {
    args: OpenSerialPortReq;
    returns: void;
  };
  close_port: {
    args: { portName: string };
    returns: void;
  };
  test_async: {
    args: undefined;
    returns: any;
  };
  write_port: {
    args: { portName: string; data: number[] };
    returns: void;
  };
  write_dtr: {
    args: { portName: string; dtr: boolean };
    returns: void;
  };
  write_rts: {
    args: { portName: string; rts: boolean };
    returns: void;
  };
};
// type TupleToObject<T extends readonly any[]> = { [K in T[number]]: K };
// type ParameterType<T extends keyof interfaces> = Parameters<interfaces[T]>;
type Types<K, Key extends "args" | "returns"> = K extends keyof RustBus
  ? RustBus[K][Key]
  : never;
type ArgType<K> = K extends keyof RustBus ? Types<K, "args"> : never;
type ReturnType<K> = K extends keyof RustBus ? Types<K, "returns"> : never;

// type Guard<T> = (x: any) => x is T;
export const emitToRustBus = <Name extends keyof RustBus>(
  name: Name,
  ...args: [ArgType<Name>]
): Promise<ReturnType<Name>> => {
  return invoke<ReturnType<Name>>(name, ...args);
};
// invokeRustInterface("hello", { param: "" });
