/**
 * Default Device Definitions
 *
 * Device entities represent physical or virtual serial devices.
 * Each device can reference multiple protocols and define default settings.
 */

import type { Device } from "../protocolTypes";

const now = Date.now();

// ============================================================================
// ESP32 TEST DEVICE (Multi-mode Protocol Tester)
// ============================================================================

export const DEVICE_ESP32_TEST: Device = {
  id: "device-esp32-test",
  name: "ESP32 Test Device",
  description:
    "ESP32-based serial protocol tester that emulates multiple device types for testing and development",
  icon: "cpu",
  manufacturer: "Custom",
  model: "ESP32 Serial Tester",
  tags: ["esp32", "test", "emulator", "multi-mode"],
  createdAt: now,
  updatedAt: now,

  // Protocol bindings - this device supports multiple protocols
  protocols: [
    {
      protocolId: "proto-esp32-test-device",
      parameterDefaults: {},
    },
    {
      protocolId: "proto-at-commands",
      parameterDefaults: {},
    },
    {
      protocolId: "proto-scpi",
      parameterDefaults: {},
    },
    {
      protocolId: "proto-marlin",
      parameterDefaults: {},
    },
    {
      protocolId: "proto-elm327",
      parameterDefaults: {},
    },
    {
      protocolId: "proto-gps-nmea",
      parameterDefaults: {},
    },
    {
      protocolId: "proto-modbus-rtu",
      defaultAddress: 1,
      parameterDefaults: {
        address: 1,
      },
    },
  ],

  // Default protocol for new commands
  defaultProtocolId: "proto-esp32-test-device",

  // Commands owned by this device
  commandIds: [
    "cmd-esp32-show-help",
    "cmd-esp32-device-status",
    "cmd-esp32-wifi-status",
    "cmd-esp32-set-wifi-ssid",
    "cmd-esp32-set-wifi-password",
    "cmd-esp32-connect-wifi",
    "cmd-esp32-scan-networks",
    "cmd-esp32-clear-wifi",
    "cmd-esp32-setup-mode",
    "cmd-esp32-echo-mode",
    "cmd-esp32-at-mode",
    "cmd-esp32-modbus-mode",
    "cmd-esp32-gps-mode",
    "cmd-esp32-scpi-mode",
    "cmd-esp32-marlin-mode",
    "cmd-esp32-elm327-mode",
    "cmd-esp32-set-temp",
    "cmd-esp32-set-humidity",
    "cmd-esp32-set-rpm",
    "cmd-esp32-set-speed",
  ],

  // Default serial options for this device
  defaultSerialOptions: {
    baudRate: 115200,
    dataBits: "Eight",
    stopBits: "One",
    parity: "None",
    flowControl: "None",
  },

  // No attachments by default
  attachments: [],
};

// ============================================================================
// GENERIC MODBUS DEVICE
// ============================================================================

export const DEVICE_MODBUS_GENERIC: Device = {
  id: "device-modbus-generic",
  name: "Generic Modbus Device",
  description: "Generic Modbus RTU device for industrial communication testing",
  icon: "activity",
  tags: ["modbus", "industrial", "plc"],
  createdAt: now,
  updatedAt: now,

  protocols: [
    {
      protocolId: "proto-modbus-rtu",
      defaultAddress: 1,
      parameterDefaults: {
        address: 1,
      },
    },
  ],

  defaultProtocolId: "proto-modbus-rtu",
  commandIds: [
    "cmd-modbus-read-coils",
    "cmd-modbus-read-discrete",
    "cmd-modbus-read-holding",
    "cmd-modbus-read-input",
    "cmd-modbus-write-coil",
    "cmd-modbus-write-register",
    "cmd-modbus-write-multiple-coils",
    "cmd-modbus-write-multiple-registers",
  ],

  defaultSerialOptions: {
    baudRate: 9600,
    dataBits: "Eight",
    stopBits: "One",
    parity: "None",
    flowControl: "None",
  },

  attachments: [],
};

// ============================================================================
// GENERIC AT DEVICE (ESP/WiFi Module)
// ============================================================================

export const DEVICE_AT_GENERIC: Device = {
  id: "device-at-generic",
  name: "Generic AT Device",
  description:
    "Generic AT command device (ESP8266/ESP32, modems, WiFi/Bluetooth modules)",
  icon: "wifi",
  tags: ["at", "esp", "wifi", "bluetooth", "modem"],
  createdAt: now,
  updatedAt: now,

  protocols: [
    {
      protocolId: "proto-at-commands",
      parameterDefaults: {},
    },
  ],

  defaultProtocolId: "proto-at-commands",
  commandIds: [
    "cmd-at-check",
    "cmd-at-version",
    "cmd-at-reset",
    "cmd-at-wifi-scan",
  ],

  defaultSerialOptions: {
    baudRate: 115200,
    dataBits: "Eight",
    stopBits: "One",
    parity: "None",
    flowControl: "None",
  },

  attachments: [],
};

// ============================================================================
// 3D PRINTER (Marlin)
// ============================================================================

export const DEVICE_3D_PRINTER_MARLIN: Device = {
  id: "device-3d-printer-marlin",
  name: "3D Printer (Marlin)",
  description: "3D printer running Marlin firmware with G-code support",
  icon: "printer",
  tags: ["3d-printer", "marlin", "gcode", "cnc"],
  createdAt: now,
  updatedAt: now,

  protocols: [
    {
      protocolId: "proto-marlin",
      parameterDefaults: {},
    },
  ],

  defaultProtocolId: "proto-marlin",
  commandIds: [
    "cmd-marlin-home",
    "cmd-marlin-level-bed",
    "cmd-marlin-set-hotend-temp",
    "cmd-marlin-set-bed-temp",
    "cmd-marlin-get-temp",
    "cmd-marlin-get-position",
    "cmd-marlin-move",
    "cmd-marlin-emergency-stop",
  ],

  defaultSerialOptions: {
    baudRate: 115200,
    dataBits: "Eight",
    stopBits: "One",
    parity: "None",
    flowControl: "None",
  },

  attachments: [],
};

// ============================================================================
// OBD-II ADAPTER (ELM327)
// ============================================================================

export const DEVICE_OBD2_ELM327: Device = {
  id: "device-obd2-elm327",
  name: "OBD-II Adapter (ELM327)",
  description: "ELM327-based OBD-II diagnostic adapter for automotive use",
  icon: "car",
  tags: ["obd", "elm327", "automotive", "diagnostics"],
  createdAt: now,
  updatedAt: now,

  protocols: [
    {
      protocolId: "proto-elm327",
      parameterDefaults: {},
    },
  ],

  defaultProtocolId: "proto-elm327",
  commandIds: [
    "cmd-obd-get-rpm",
    "cmd-obd-get-speed",
    "cmd-obd-get-coolant-temp",
    "cmd-obd-get-fuel-level",
    "cmd-obd-get-throttle",
    "cmd-obd-read-dtcs",
    "cmd-obd-clear-dtcs",
    "cmd-obd-get-vin",
  ],

  defaultSerialOptions: {
    baudRate: 38400,
    dataBits: "Eight",
    stopBits: "One",
    parity: "None",
    flowControl: "None",
  },

  attachments: [],
};

// ============================================================================
// GPS RECEIVER
// ============================================================================

export const DEVICE_GPS_RECEIVER: Device = {
  id: "device-gps-receiver",
  name: "GPS Receiver",
  description: "NMEA-compatible GPS receiver module",
  icon: "map-pin",
  tags: ["gps", "nmea", "navigation", "location"],
  createdAt: now,
  updatedAt: now,

  protocols: [
    {
      protocolId: "proto-gps-nmea",
      parameterDefaults: {},
    },
  ],

  defaultProtocolId: "proto-gps-nmea",
  commandIds: [
    "cmd-gps-query-position",
    "cmd-gps-query-rmc",
    "cmd-gps-query-satellites",
    "cmd-gps-set-update-rate",
    "cmd-gps-get-firmware",
    "cmd-gps-hot-start",
  ],

  defaultSerialOptions: {
    baudRate: 9600,
    dataBits: "Eight",
    stopBits: "One",
    parity: "None",
    flowControl: "None",
  },

  attachments: [],
};

// ============================================================================
// SCPI INSTRUMENT
// ============================================================================

export const DEVICE_SCPI_INSTRUMENT: Device = {
  id: "device-scpi-instrument",
  name: "SCPI Instrument",
  description:
    "Generic SCPI-compatible test and measurement instrument (multimeter, oscilloscope, etc.)",
  icon: "activity",
  tags: ["scpi", "instrument", "measurement", "lab"],
  createdAt: now,
  updatedAt: now,

  protocols: [
    {
      protocolId: "proto-scpi",
      parameterDefaults: {},
    },
  ],

  defaultProtocolId: "proto-scpi",
  commandIds: [
    "cmd-scpi-identify",
    "cmd-scpi-reset",
    "cmd-scpi-measure-voltage",
    "cmd-scpi-measure-current",
    "cmd-scpi-set-voltage",
    "cmd-scpi-set-current",
    "cmd-scpi-output-on",
    "cmd-scpi-output-off",
  ],

  defaultSerialOptions: {
    baudRate: 9600,
    dataBits: "Eight",
    stopBits: "One",
    parity: "None",
    flowControl: "None",
  },

  attachments: [],
};

// ============================================================================
// EXPORT ALL DEFAULT DEVICES
// ============================================================================

export const DEFAULT_DEVICES: Device[] = [
  DEVICE_ESP32_TEST,
  DEVICE_AT_GENERIC,
  DEVICE_MODBUS_GENERIC,
  DEVICE_3D_PRINTER_MARLIN,
  DEVICE_OBD2_ELM327,
  DEVICE_GPS_RECEIVER,
  DEVICE_SCPI_INSTRUMENT,
];
