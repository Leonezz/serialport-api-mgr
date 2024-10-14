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

const getStackTrace = (err: Error, trimedStack: string) => {
  let stack = err.stack?.split("\n");
  if (stack !== undefined && stack?.length > 2) {
    if (stack[0].trim() === "Error" && stack[1].trim().startsWith("at TRACE")) {
      stack = stack.splice(2);
    }
  }
  return stack?.join("\n");
};

export const INFO = (target: string, msg: string, _TRACE = new Error()) => {
  const logMsg = `$[${target}] ${msg} \n ${getStackTrace(_TRACE, "at INFO")}`;
  console.info(logMsg);
  info(logMsg);
};

export const WARN = (target: string, msg: string, _TRACE = new Error()) => {
  const logMsg = `$[${target}] ${msg} \n ${getStackTrace(_TRACE, "at WARN")}`;
  console.info(logMsg);
  warn(logMsg);
};

export const DEBUG = (target: string, msg: string, _TRACE = new Error()) => {
  const logMsg = `$[${target}] ${msg} \n ${getStackTrace(_TRACE, "at DEBUG")}`;
  console.debug(logMsg);
  debug(logMsg);
};

export const ERROR = (target: string, msg: string, _TRACE = new Error()) => {
  const logMsg = `$[${target}] ${msg} \n ${getStackTrace(_TRACE, "at ERROR")}`;
  console.error(logMsg);
  error(logMsg);
};

export const TRACE = (target: string, msg: string, _TRACE = new Error()) => {
  const logMsg = `[${target}] ${msg} \n ${getStackTrace(_TRACE, "at TRACE")}`;
  console.log(logMsg);
  trace(logMsg);
};
