import { invoke } from "@tauri-apps/api/core";
import { SERIALPORT, SerialPortInfo } from "./types";

export type RustBusError = {
  code: string;
  msg: string;
};

export type OpenSerialPortReq = {
  portName: string;
  baudRate: number;
  dataBits: SERIALPORT.ConfigTypes<"data_bits">;
  flowControl: SERIALPORT.ConfigTypes<"flow_control">;
  parity: SERIALPORT.ConfigTypes<"parity">;
  stopBits: SERIALPORT.ConfigTypes<"stop_bits">;
  readTimeout: number,
  writeTimeout: number
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
