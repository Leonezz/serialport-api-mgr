/**
 * Zod schemas for runtime validation of Tauri command responses
 *
 * These schemas match Rust enum serialization formats.
 * For application-level types, use the unified schemas from lib/schemas.ts
 */

import { z } from "zod";
import {
  DataBitsSchema,
  FlowControlSchema,
  ParitySchema,
  StopBitsSchema,
} from "../schemas";

// ============================================================================
// Port Information Schemas
// ============================================================================

/**
 * USB port info schema
 */
export const UsbPortInfoSchema = z.object({
  vid: z.number(),
  pid: z.number(),
  serial_number: z.string().nullable(),
  manufacturer: z.string().nullable(),
  product: z.string().nullable(),
  interface: z.number().nullable(),
});

/**
 * Port type schema - tagged union for Rust enum serialization
 */
export const PortTypeSchema = z.union([
  z.object({ UsbPort: UsbPortInfoSchema }), // USB connected
  z.literal("PciPort"), // PCI/permanent port
  z.literal("BluetoothPort"), // Bluetooth connected
  z.literal("Unknown"), // Unknown connection type
]);

/**
 * Opened port profile schema
 */
export const OpenedPortProfileSchema = z.object({
  baud_rate: z.number(),
  flow_control: FlowControlSchema,
  data_bits: DataBitsSchema,
  parity: ParitySchema,
  stop_bits: StopBitsSchema,
  carrier_detect: z.boolean(),
  clear_to_send: z.boolean(),
  data_set_ready: z.boolean(),
  ring_indicator: z.boolean(),
  timeout_ms: z.number(),
});

/**
 * Port status schema - tagged union for Rust enum serialization
 */
export const PortStatusSchema = z.union([
  z.object({ Opened: OpenedPortProfileSchema }), // Port is open
  z.literal("Closed"), // Port is closed
]);

/**
 * Port info schema
 */
export const SerialPortInfoSchema = z.object({
  port_name: z.string(),
  port_type: PortTypeSchema,
  port_status: PortStatusSchema,
  bytes_read: z.number(), // u128 from Rust
  bytes_write: z.number(), // u128 from Rust
});

export const SerialPortInfoArraySchema = z.array(SerialPortInfoSchema);

export const SerialOutputSignalsSchema = z.object({
  dataTerminalReady: z.boolean().optional(),
  requestToSend: z.boolean().optional(),
  breakSignal: z.boolean().optional(),
});

export const SerialInputSignalsSchema = z.object({
  dataCarrierDetect: z.boolean(),
  clearToSend: z.boolean(),
  ringIndicator: z.boolean(),
  dataSetReady: z.boolean(),
});

export const SerialPortFilterSchema = z.object({
  usbVendorId: z.number().optional(),
  usbProductId: z.number().optional(),
});

export const SerialPortRequestOptionsSchema = z.object({
  filters: z.array(SerialPortFilterSchema),
});
