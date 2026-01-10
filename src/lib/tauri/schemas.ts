/**
 * Zod schemas for runtime validation of Tauri command responses
 */

import { z } from 'zod';

// ============================================================================
// Rust Enum Schemas
// ============================================================================

export const RustDataBitsSchema = z.enum(['Five', 'Six', 'Seven', 'Eight']);
export const RustFlowControlSchema = z.enum(['None', 'Hardware', 'Software']);
export const RustParitySchema = z.enum(['None', 'Even', 'Odd']);
export const RustStopBitsSchema = z.enum(['One', 'Two']);

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
  z.object({ UsbPort: UsbPortInfoSchema }),  // USB connected
  z.literal('PciPort'),                      // PCI/permanent port
  z.literal('BluetoothPort'),                // Bluetooth connected
  z.literal('Unknown'),                      // Unknown connection type
]);

/**
 * Opened port profile schema
 */
export const OpenedPortProfileSchema = z.object({
  baud_rate: z.number(),
  flow_control: RustFlowControlSchema,
  data_bits: RustDataBitsSchema,
  parity: RustParitySchema,
  stop_bits: RustStopBitsSchema,
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
  z.object({ Opened: OpenedPortProfileSchema }),  // Port is open
  z.literal('Closed'),                            // Port is closed
]);

/**
 * Port info schema
 */
export const RustPortInfoSchema = z.object({
  port_name: z.string(),
  port_type: PortTypeSchema,
  port_status: PortStatusSchema,
  bytes_read: z.number(),  // u128 from Rust
  bytes_write: z.number(), // u128 from Rust
});

export const RustPortInfoArraySchema = z.array(RustPortInfoSchema);
