import { SerialportConfig } from "@/types/serialport/serialport_config";
import { SerialPortStatus } from "@/types/serialport/serialport_status";
import { invoke } from "@tauri-apps/api/core";
import { INFO } from "./logging";

export class AppError {
  code: string;
  msg: string;
  /**
   *
   */
  constructor(err: { code: string; msg: string }) {
    (this.code = err.code), (this.msg = err.msg);
  }
}

type CommandArgBase = { port_name: string };
type LogArgs = { prefix: string; content: string };
export type RustBus = {
  get_all_port_info: {
    args: {};
    returns: SerialPortStatus[];
  };
  open_port: {
    args: SerialportConfig;
    returns: void;
  };
  close_port: {
    args: CommandArgBase;
    returns: void;
  };
  write_port: {
    args: CommandArgBase & { data: number[]; message_id: string };
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
  log: {
    args: LogArgs,
    returns: void;
  };
  info: {
    args: LogArgs,
    returns: void;
  };
  warn: {
    args: LogArgs,
    returns: void;
  };
  error: {
    args: LogArgs,
    returns: void;
  };
  debug: {
    args: LogArgs,
    returns: void;
  }
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
