/**
 * WebSerial API configuration converters
 *
 * The app uses string enums for serial config (e.g., "Eight" for dataBits)
 * but WebSerial API expects numeric/lowercase values.
 *
 * This module provides conversion utilities for WebSerial compatibility.
 */

import type {
  DataBits,
  StopBits,
  Parity,
  FlowControl,
  SerialConfig,
} from "../types";

/**
 * WebSerial-compatible serial options
 * @see https://developer.mozilla.org/en-US/docs/Web/API/SerialPort/open
 */
export interface WebSerialOptions {
  baudRate: number;
  dataBits?: 7 | 8;
  stopBits?: 1 | 2;
  parity?: "none" | "even" | "odd";
  flowControl?: "none" | "hardware";
  bufferSize?: number;
}

/**
 * Convert app DataBits enum to WebSerial numeric value
 */
export function dataBitsToWebSerial(dataBits: DataBits): 7 | 8 {
  const mapping: Record<DataBits, 7 | 8> = {
    Five: 8, // WebSerial doesn't support 5, fallback to 8
    Six: 8, // WebSerial doesn't support 6, fallback to 8
    Seven: 7,
    Eight: 8,
  };
  return mapping[dataBits];
}

/**
 * Convert app StopBits enum to WebSerial numeric value
 */
export function stopBitsToWebSerial(stopBits: StopBits): 1 | 2 {
  const mapping: Record<StopBits, 1 | 2> = {
    One: 1,
    Two: 2,
  };
  return mapping[stopBits];
}

/**
 * Convert app Parity enum to WebSerial string value
 */
export function parityToWebSerial(parity: Parity): "none" | "even" | "odd" {
  const mapping: Record<Parity, "none" | "even" | "odd"> = {
    None: "none",
    Even: "even",
    Odd: "odd",
  };
  return mapping[parity];
}

/**
 * Convert app FlowControl enum to WebSerial string value
 * Note: WebSerial only supports "none" and "hardware", not "software"
 */
export function flowControlToWebSerial(
  flowControl: FlowControl,
): "none" | "hardware" {
  const mapping: Record<FlowControl, "none" | "hardware"> = {
    None: "none",
    Hardware: "hardware",
    Software: "none", // WebSerial doesn't support software flow control
  };
  return mapping[flowControl];
}

/**
 * Convert app SerialConfig to WebSerial-compatible options
 *
 * @param config - App serial configuration
 * @returns WebSerial-compatible options object
 *
 * @example
 * ```ts
 * const webSerialOptions = toWebSerialOptions(config);
 * await serialPort.open(webSerialOptions);
 * ```
 */
export function toWebSerialOptions(config: SerialConfig): WebSerialOptions {
  return {
    baudRate: config.baudRate,
    dataBits: dataBitsToWebSerial(config.dataBits),
    stopBits: stopBitsToWebSerial(config.stopBits),
    parity: parityToWebSerial(config.parity),
    flowControl: flowControlToWebSerial(config.flowControl),
  };
}
