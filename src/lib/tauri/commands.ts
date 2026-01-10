/**
 * Strongly-typed command definitions for all Tauri commands
 * Uses discriminated union pattern for type-safe command invocation
 */

import type { RustDataBits, RustFlowControl, RustParity, RustStopBits, RustPortInfo } from './types';

// ============================================================================
// Individual Command Definitions
// ============================================================================

export interface GetAllPortInfoCommand {
  name: 'get_all_port_info';
  args: Record<string, never>; // No arguments
  returns: RustPortInfo[];
}

export interface OpenPortCommand {
  name: 'open_port';
  args: {
    portName: string;
    baudRate: number;
    dataBits: RustDataBits;
    flowControl: RustFlowControl;
    parity: RustParity;
    stopBits: RustStopBits;
    dataTerminalReady: boolean;
    timeoutMs: number;
  };
  returns: void;
}

export interface ClosePortCommand {
  name: 'close_port';
  args: {
    portName: string;
  };
  returns: void;
}

export interface WritePortCommand {
  name: 'write_port';
  args: {
    portName: string;
    data: number[]; // Vec<u8> in Rust
    messageId: string;
  };
  returns: void;
}

export interface WriteRequestToSendCommand {
  name: 'write_request_to_send';
  args: {
    portName: string;
    rts: boolean;
  };
  returns: void;
}

export interface WriteDataTerminalReadyCommand {
  name: 'write_data_terminal_ready';
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
  name: 'log';
  args: {
    prefix: string;
    content: string;
  };
  returns: void;
}

export interface InfoCommand {
  name: 'info';
  args: {
    prefix: string;
    content: string;
  };
  returns: void;
}

export interface WarnCommand {
  name: 'warn';
  args: {
    prefix: string;
    content: string;
  };
  returns: void;
}

export interface ErrorCommand {
  name: 'error';
  args: {
    prefix: string;
    content: string;
  };
  returns: void;
}

export interface DebugCommand {
  name: 'debug';
  args: {
    prefix: string;
    content: string;
  };
  returns: void;
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
  | DebugCommand;

// ============================================================================
// Helper Types for Type Extraction
// ============================================================================

/**
 * Extract a specific command by its name
 */
export type CommandByName<T extends TauriCommand['name']> = Extract<TauriCommand, { name: T }>;

/**
 * Get the arguments type for a specific command
 */
export type CommandArgs<T extends TauriCommand['name']> = CommandByName<T>['args'];

/**
 * Get the return type for a specific command
 */
export type CommandReturn<T extends TauriCommand['name']> = CommandByName<T>['returns'];
