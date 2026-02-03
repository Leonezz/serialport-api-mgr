/**
 * Strongly-typed command definitions for all Tauri commands
 * Uses discriminated union pattern for type-safe command invocation
 */

import { DataBits, FlowControl, Parity, StopBits } from "@/types";
import type { SerialPortInfo } from "./tauriTypes";

// ============================================================================
// Individual Command Definitions
// ============================================================================

export interface GetAllPortInfoCommand {
  name: "get_all_port_info";
  args: Record<string, never>; // No arguments
  returns: SerialPortInfo[];
}

export interface OpenPortCommand {
  name: "open_port";
  args: {
    portName: string;
    baudRate: number;
    dataBits: DataBits;
    flowControl: FlowControl;
    parity: Parity;
    stopBits: StopBits;
    dataTerminalReady: boolean;
    timeoutMs: number;
  };
  returns: void;
}

export interface ClosePortCommand {
  name: "close_port";
  args: {
    portName: string;
  };
  returns: void;
}

export interface WritePortCommand {
  name: "write_port";
  args: {
    portName: string;
    data: number[]; // Vec<u8> in Rust
    messageId: string;
  };
  returns: void;
}

export interface WriteRequestToSendCommand {
  name: "write_request_to_send";
  args: {
    portName: string;
    rts: boolean;
  };
  returns: void;
}

export interface WriteDataTerminalReadyCommand {
  name: "write_data_terminal_ready";
  args: {
    portName: string;
    dtr: boolean;
  };
  returns: void;
}

// ============================================================================
// Logging Commands
// ============================================================================

export interface LogCommand {
  name: "log";
  args: {
    prefix: string;
    content: string;
  };
  returns: void;
}

export interface InfoCommand {
  name: "info";
  args: {
    prefix: string;
    content: string;
  };
  returns: void;
}

export interface WarnCommand {
  name: "warn";
  args: {
    prefix: string;
    content: string;
  };
  returns: void;
}

export interface ErrorCommand {
  name: "error";
  args: {
    prefix: string;
    content: string;
  };
  returns: void;
}

export interface DebugCommand {
  name: "debug";
  args: {
    prefix: string;
    content: string;
  };
  returns: void;
}

export interface GetLogsCommand {
  name: "get_logs";
  args: {
    sessionId: string;
    limit: number;
    offset: number;
  };
  returns: {
    id: number;
    sessionId: string;
    deviceFingerprint: string;
    portName: string;
    direction: string;
    timestamp: number;
    data: number[];
  }[];
}

// ============================================================================
// Discriminated Union of All Commands
// ============================================================================

export type TauriCommand =
  | GetAllPortInfoCommand
  | OpenPortCommand
  | ClosePortCommand
  | WritePortCommand
  | WriteRequestToSendCommand
  | WriteDataTerminalReadyCommand
  | LogCommand
  | InfoCommand
  | WarnCommand
  | ErrorCommand
  | DebugCommand
  | GetLogsCommand;

// ============================================================================
// Helper Types for Type Extraction
// ============================================================================

/**
 * Extract a specific command by its name
 */
export type CommandByName<T extends TauriCommand["name"]> = Extract<
  TauriCommand,
  { name: T }
>;

/**
 * Get the arguments type for a specific command
 */
export type CommandArgs<T extends TauriCommand["name"]> =
  CommandByName<T>["args"];

/**
 * Get the return type for a specific command
 */
export type CommandReturn<T extends TauriCommand["name"]> =
  CommandByName<T>["returns"];
