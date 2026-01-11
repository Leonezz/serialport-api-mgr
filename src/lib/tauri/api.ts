/**
 * High-level type-safe API for Tauri serial port commands
 * Handles automatic enum conversion and provides user-friendly interface
 */

import { invokeCommand } from "./invoke";
import { EnumConverter } from "./enums";
import type {
  TsDataBits,
  TsFlowControl,
  TsParity,
  TsStopBits,
  RustPortInfo,
} from "./types";

/**
 * High-level API for Tauri serial port operations
 * All methods handle automatic conversion between TypeScript and Rust types
 */
export class TauriSerialAPI {
  // ==========================================================================
  // Port Management
  // ==========================================================================

  /**
   * Get information about all available serial ports
   * @returns Array of port information objects
   */
  static async getAllPortInfo(): Promise<RustPortInfo[]> {
    return await invokeCommand("get_all_port_info", {});
  }

  /**
   * Open a serial port with the specified configuration
   * Automatically converts TypeScript types to Rust format
   *
   * @param config - Port configuration
   * @param config.portName - Serial port name (e.g., 'COM1', '/dev/ttyUSB0')
   * @param config.baudRate - Baud rate (e.g., 9600, 115200)
   * @param config.dataBits - Data bits (5, 6, 7, or 8)
   * @param config.flowControl - Flow control ('none', 'hardware', or 'software')
   * @param config.parity - Parity ('none', 'even', or 'odd')
   * @param config.stopBits - Stop bits (1 or 2)
   * @param config.dataTerminalReady - Initial DTR state (default: true)
   * @param config.timeoutMs - Read timeout in milliseconds (default: 1000)
   */
  static async openPort(config: {
    portName: string;
    baudRate: number;
    dataBits: TsDataBits;
    flowControl: TsFlowControl;
    parity: TsParity;
    stopBits: TsStopBits;
    dataTerminalReady?: boolean;
    timeoutMs?: number;
  }): Promise<void> {
    return await invokeCommand("open_port", {
      portName: config.portName,
      baudRate: config.baudRate,
      dataBits: EnumConverter.dataBitsToRust(config.dataBits),
      flowControl: EnumConverter.flowControlToRust(config.flowControl),
      parity: EnumConverter.parityToRust(config.parity),
      stopBits: EnumConverter.stopBitsToRust(config.stopBits),
      dataTerminalReady: config.dataTerminalReady ?? true,
      timeoutMs: config.timeoutMs ?? 1000,
    });
  }

  /**
   * Close a serial port
   * @param portName - Name of the port to close
   */
  static async closePort(portName: string): Promise<void> {
    return await invokeCommand("close_port", { portName });
  }

  // ==========================================================================
  // Data Transmission
  // ==========================================================================

  /**
   * Write data to a serial port
   * Accepts both Uint8Array and number array formats
   *
   * @param portName - Target port name
   * @param data - Data to send (Uint8Array or number array)
   * @param messageId - Optional message ID for tracking (auto-generated if not provided)
   */
  static async writePort(
    portName: string,
    data: Uint8Array | number[],
    messageId?: string,
  ): Promise<void> {
    const dataArray = data instanceof Uint8Array ? Array.from(data) : data;
    return await invokeCommand("write_port", {
      portName,
      data: dataArray,
      messageId: messageId ?? `msg_${Date.now()}`,
    });
  }

  // ==========================================================================
  // Control Signals
  // ==========================================================================

  /**
   * Set the RTS (Request to Send) signal
   * @param portName - Target port name
   * @param rts - Signal level (true = high, false = low)
   */
  static async setRTS(portName: string, rts: boolean): Promise<void> {
    return await invokeCommand("write_request_to_send", { portName, rts });
  }

  /**
   * Set the DTR (Data Terminal Ready) signal
   * @param portName - Target port name
   * @param dtr - Signal level (true = high, false = low)
   */
  static async setDTR(portName: string, dtr: boolean): Promise<void> {
    return await invokeCommand("write_data_terminal_ready", { portName, dtr });
  }

  /**
   * Set multiple control signals at once
   * @param portName - Target port name
   * @param signals - Object with optional rts and dtr properties
   */
  static async setSignals(
    portName: string,
    signals: { rts?: boolean; dtr?: boolean },
  ): Promise<void> {
    const promises: Promise<void>[] = [];

    if (signals.rts !== undefined) {
      promises.push(this.setRTS(portName, signals.rts));
    }

    if (signals.dtr !== undefined) {
      promises.push(this.setDTR(portName, signals.dtr));
    }

    await Promise.all(promises);
  }

  // ==========================================================================
  // Logging
  // ==========================================================================

  /**
   * Logging utilities for sending messages to Rust backend
   */
  static log = {
    /**
     * Log a trace message
     */
    trace: (prefix: string, content: string) =>
      invokeCommand("log", { prefix, content }),

    /**
     * Log an info message
     */
    info: (prefix: string, content: string) =>
      invokeCommand("info", { prefix, content }),

    /**
     * Log a warning message
     */
    warn: (prefix: string, content: string) =>
      invokeCommand("warn", { prefix, content }),

    /**
     * Log an error message
     */
    error: (prefix: string, content: string) =>
      invokeCommand("error", { prefix, content }),

    /**
     * Log a debug message
     */
    debug: (prefix: string, content: string) =>
      invokeCommand("debug", { prefix, content }),
  };
}
