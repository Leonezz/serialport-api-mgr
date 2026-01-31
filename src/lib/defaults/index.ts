/**
 * Default Data Exports
 *
 * Central export point for all default data including:
 * - Serial and network configuration
 * - Protocol definitions
 * - Device definitions
 */

// Configuration defaults
export { DEFAULT_CONFIG, DEFAULT_NETWORK_CONFIG } from "./config";

// Protocol defaults
export {
  DEFAULT_PROTOCOLS,
  PROTOCOL_AT_COMMANDS,
  PROTOCOL_ELM327,
  PROTOCOL_ESP32_TEST_DEVICE,
  PROTOCOL_GPS_NMEA,
  PROTOCOL_MARLIN,
  PROTOCOL_MODBUS_RTU,
  PROTOCOL_SCPI,
} from "./protocols";

// Device defaults
export {
  DEFAULT_DEVICES,
  DEVICE_3D_PRINTER_MARLIN,
  DEVICE_AT_GENERIC,
  DEVICE_ESP32_TEST,
  DEVICE_GPS_RECEIVER,
  DEVICE_MODBUS_GENERIC,
  DEVICE_OBD2_ELM327,
  DEVICE_SCPI_INSTRUMENT,
} from "./devices";

// Command defaults
export { DEFAULT_COMMANDS } from "./commands";
