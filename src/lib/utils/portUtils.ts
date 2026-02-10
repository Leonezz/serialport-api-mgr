/**
 * Utilities for generating semantic port names from port information
 */

import type { RustPortInfo } from "../../types";

/**
 * Generate a human-readable, semantic name for a serial port
 *
 * Priority:
 * 1. USB ports: "Manufacturer Product" or "Product" if available
 * 2. Fallback to VID:PID for USB ports without names
 * 3. Port type for non-USB (PCI, Bluetooth, Unknown)
 * 4. Port name as last resort
 *
 * @param portInfo - Port information from Rust backend
 * @returns Semantic port name
 *
 * @example
 * // USB port with full info
 * getSemanticPortName({
 *   port_name: '/dev/ttyUSB0',
 *   port_type: { UsbPort: { manufacturer: 'FTDI', product: 'FT232R USB UART', ... } }
 * })
 * // Returns: "FTDI FT232R USB UART"
 *
 * @example
 * // USB port with only product name
 * getSemanticPortName({
 *   port_name: 'COM3',
 *   port_type: { UsbPort: { product: 'Arduino Uno', ... } }
 * })
 * // Returns: "Arduino Uno"
 *
 * @example
 * // USB port without names
 * getSemanticPortName({
 *   port_name: '/dev/ttyACM0',
 *   port_type: { UsbPort: { vid: 0x2341, pid: 0x0043, ... } }
 * })
 * // Returns: "USB Device (2341:0043)"
 */
export function getSemanticPortName(portInfo: RustPortInfo): string {
  const { port_name, port_type } = portInfo;

  // Handle USB ports - most common case
  if (typeof port_type === "object" && "UsbPort" in port_type) {
    const usb = port_type.UsbPort;

    // Best case: manufacturer + product
    if (usb.manufacturer && usb.product) {
      return `${usb.manufacturer} ${usb.product}`;
    }

    // Good case: just product name
    if (usb.product) {
      return usb.product;
    }

    // Fallback: VID:PID (useful for identifying devices)
    if (usb.vid && usb.pid) {
      const vid = usb.vid.toString(16).padStart(4, "0").toUpperCase();
      const pid = usb.pid.toString(16).padStart(4, "0").toUpperCase();
      return `USB Device (${vid}:${pid})`;
    }

    // Last resort for USB
    return `USB Serial (${port_name})`;
  }

  // Handle other port types
  if (port_type === "PciPort") {
    return `PCI Serial (${port_name})`;
  }

  if (port_type === "BluetoothPort") {
    return `Bluetooth Serial (${port_name})`;
  }

  if (port_type === "Unknown") {
    return `Serial Port (${port_name})`;
  }

  // Absolute fallback (should never happen)
  return port_name;
}

/**
 * Generate a shorter version of semantic port name for compact displays
 *
 * @param portInfo - Port information from Rust backend
 * @returns Short semantic port name
 *
 * @example
 * getShortPortName({
 *   port_name: '/dev/ttyUSB0',
 *   port_type: { UsbPort: { product: 'FT232R USB UART', ... } }
 * })
 * // Returns: "FT232R USB UART"
 */
export function getShortPortName(portInfo: RustPortInfo): string {
  const { port_name, port_type } = portInfo;

  // For USB ports, prefer just the product name
  if (typeof port_type === "object" && "UsbPort" in port_type) {
    const usb = port_type.UsbPort;

    if (usb.product) {
      return usb.product;
    }

    if (usb.vid && usb.pid) {
      const vid = usb.vid.toString(16).padStart(4, "0").toUpperCase();
      const pid = usb.pid.toString(16).padStart(4, "0").toUpperCase();
      return `${vid}:${pid}`;
    }
  }

  // For other types, just use port name
  return port_name;
}

/**
 * Get a tooltip-friendly description with full port details
 *
 * @param portInfo - Port information from Rust backend
 * @returns Detailed port description for tooltips
 */
export function getPortTooltip(portInfo: RustPortInfo): string {
  const { port_name, port_type, port_status } = portInfo;

  const lines: string[] = [`Port: ${port_name}`];

  // Add USB details
  if (typeof port_type === "object" && "UsbPort" in port_type) {
    const usb = port_type.UsbPort;

    if (usb.manufacturer) lines.push(`Manufacturer: ${usb.manufacturer}`);
    if (usb.product) lines.push(`Product: ${usb.product}`);

    if (usb.vid && usb.pid) {
      const vid = usb.vid.toString(16).padStart(4, "0").toUpperCase();
      const pid = usb.pid.toString(16).padStart(4, "0").toUpperCase();
      lines.push(`VID:PID: ${vid}:${pid}`);
    }

    if (usb.serial_number) lines.push(`Serial: ${usb.serial_number}`);
  } else {
    // Non-USB port type
    if (typeof port_type === "string") {
      lines.push(`Type: ${port_type}`);
    }
  }

  // Add status
  if (typeof port_status === "object" && "Opened" in port_status) {
    lines.push("Status: Open");
  } else if (port_status === "Closed") {
    lines.push("Status: Closed");
  }

  return lines.join("\n");
}
