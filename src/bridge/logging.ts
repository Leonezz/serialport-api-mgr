import {
  warn,
  debug,
  trace,
  info,
  error,
  attachConsole,
  attachLogger,
} from "@tauri-apps/plugin-log";

type LogLevels = "log" | "debug" | "info" | "warn" | "error";

const detachConsole = await attachConsole();

export const INFO = (target: string, msg: string) => {
  const logMsg = `$[${target}] ${msg}`;
  console.info(logMsg);
  info(logMsg);
};

export const WARN = (target: string, msg: string) => {
  const logMsg = `$[${target}] ${msg}`;
  console.info(logMsg);
  warn(logMsg);
};

export const DEBUG = (target: string, msg: string) => {
  const logMsg = `$[${target}] ${msg}`;
  console.debug(logMsg);
  debug(logMsg);
};

export const ERROR = (target: string, msg: string) => {
  const logMsg = `$[${target}] ${msg}`;
  console.error(logMsg);
  error(logMsg);
};

export const TRACE = (target: string, msg: string) => {
  const logMsg = `[${target}] ${msg}`;
  console.log(logMsg);
  trace(logMsg);
};
