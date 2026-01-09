import { emitToRustBus } from "./call_rust";

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
  const content = `${msg} \n ${getStackTrace(_TRACE, "at INFO")}`;
  const logMsg = `$[${target}] ${content}`;
  console.info(logMsg);
  emitToRustBus("info", {
    prefix: target,
    content: content,
  });
};

export const WARN = (target: string, msg: string, _TRACE = new Error()) => {
  const content = `${msg} \n ${getStackTrace(_TRACE, "at WARN")}`;
  const logMsg = `$[${target}] ${content}`;
  console.info(logMsg);
  emitToRustBus("warn", {
    prefix: target,
    content: content,
  });
};

export const DEBUG = (target: string, msg: string, _TRACE = new Error()) => {
  const content = `${msg} \n ${getStackTrace(_TRACE, "at DEBUG")}`;
  const logMsg = `$[${target}] ${content}`;
  console.debug(logMsg);
  emitToRustBus("debug", {
    prefix: target,
    content: content,
  });
};

export const ERROR = (target: string, msg: string, _TRACE = new Error()) => {
  const content = `${msg} \n ${getStackTrace(_TRACE, "at ERROR")}`;
  const logMsg = `$[${target}] ${content}`;
  console.error(logMsg);
  emitToRustBus("error", {
    prefix: target,
    content: content
  });
};

export const TRACE = (target: string, msg: string, _TRACE = new Error()) => {
  const logMsg = `[${target}] ${msg} \n ${getStackTrace(_TRACE, "at TRACE")}`;
  console.log(logMsg);
};
