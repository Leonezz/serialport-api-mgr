import { SerialPortConfig } from "@/types/serialport/serialport_config";
import { SerialPortStatus } from "@/types/serialport/serialport_status";
import { invoke } from "@tauri-apps/api/core";

export type RustBusError = {
  code: string;
  msg: string;
};

type CommandArgBase = { port_name: string };

export type RustBus = {
  hello: {
    args: { param: string };
    returns: string;
  };
  get_all_port_info: {
    args: undefined;
    returns: SerialPortStatus[];
  };
  open_port: {
    args: SerialPortConfig;
    returns: void;
  };
  close_port: {
    args: CommandArgBase;
    returns: void;
  };
  test_async: {
    args: undefined;
    returns: any;
  };
  write_port: {
    args: CommandArgBase & { data: number[] };
    returns: void;
  };
  write_dtr: {
    args: CommandArgBase & { dtr: boolean };
    returns: void;
  };
  write_rts: {
    args: CommandArgBase & { rts: boolean };
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
