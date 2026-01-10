/**
 * Type definitions for Tauri command system
 * Maps between TypeScript types (app-friendly) and Rust types (backend expects)
 */

// ============================================================================
// Rust Enum Types (what Rust backend expects)
// ============================================================================

export type RustDataBits = 'Five' | 'Six' | 'Seven' | 'Eight';
export type RustFlowControl = 'None' | 'Hardware' | 'Software';
export type RustParity = 'None' | 'Even' | 'Odd';
export type RustStopBits = 'One' | 'Two';

// ============================================================================
// TypeScript Enum Types (what our app uses)
// ============================================================================

export type TsDataBits = 5 | 6 | 7 | 8;
export type TsFlowControl = 'none' | 'hardware' | 'software';
export type TsParity = 'none' | 'even' | 'odd';
export type TsStopBits = 1 | 2;

// ============================================================================
// Port Information Types (from Rust backend)
// ============================================================================

/**
 * USB port information (when port is connected via USB)
 */
export interface UsbPortInfo {
  vid: number;
  pid: number;
  serial_number: string | null;
  manufacturer: string | null;
  product: string | null;
  interface: number | null;
}

/**
 * Port type enum - how the serial port is connected
 * Serde serializes Rust enums as tagged unions
 */
export type PortType =
  | { UsbPort: UsbPortInfo }  // USB connected
  | 'PciPort'                 // PCI/permanent port
  | 'BluetoothPort'           // Bluetooth connected
  | 'Unknown';                // Unknown connection type

/**
 * Profile of an opened port with current configuration
 */
export interface OpenedPortProfile {
  baud_rate: number;
  flow_control: RustFlowControl;
  data_bits: RustDataBits;
  parity: RustParity;
  stop_bits: RustStopBits;
  carrier_detect: boolean;
  clear_to_send: boolean;
  data_set_ready: boolean;
  ring_indicator: boolean;
  timeout_ms: number;
}

/**
 * Port status enum - whether port is open or closed
 * Serde serializes Rust enums as tagged unions
 */
export type PortStatus =
  | { Opened: OpenedPortProfile }  // Port is open with config
  | 'Closed';                      // Port is closed

/**
 * Port information returned by get_all_port_info command
 * Note: bytes_read and bytes_write are u128 in Rust, serialized as numbers
 */
export interface RustPortInfo {
  port_name: string;
  port_type: PortType;
  port_status: PortStatus;
  bytes_read: number;  // u128 from Rust, may lose precision for very large values
  bytes_write: number; // u128 from Rust, may lose precision for very large values
}
