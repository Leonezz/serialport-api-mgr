/**
 * ESP32 Test Device Setup Commands
 */

import type { SavedCommand } from "../../../types";

const now = Date.now();

export const CMD_ESP32_HELP: SavedCommand = {
  id: "cmd-esp32-help",
  name: "Help",
  description: "Show all available commands",
  createdAt: now,
  updatedAt: now,

  source: "PROTOCOL",

  protocolLayer: {
    protocolId: "proto-esp32-test-device",
    protocolCommandId: "tmpl-esp32-setup",
    protocolVersion: "1.0",
    protocolCommandUpdatedAt: now,

    payload: "HELP",
    mode: "TEXT",
    encoding: "UTF-8",

    parameters: [],

    validation: {
      enabled: true,
      successPattern: "===",
      successPatternType: "CONTAINS",
      timeout: 2000,
    },
  },

  commandLayer: {
    group: "ESP32/System",
  },
};

export const CMD_ESP32_STATUS: SavedCommand = {
  id: "cmd-esp32-status",
  name: "Status",
  description: "Show device status (mode, WiFi, sensor values)",
  createdAt: now,
  updatedAt: now,

  source: "PROTOCOL",

  protocolLayer: {
    protocolId: "proto-esp32-test-device",
    protocolCommandId: "tmpl-esp32-setup",
    protocolVersion: "1.0",
    protocolCommandUpdatedAt: now,

    payload: "STATUS",
    mode: "TEXT",
    encoding: "UTF-8",

    parameters: [],

    validation: {
      enabled: true,
      successPattern: "Mode:",
      successPatternType: "CONTAINS",
      timeout: 2000,
    },
  },

  commandLayer: {
    group: "ESP32/System",
  },
};

export const CMD_ESP32_SET_MODE: SavedCommand = {
  id: "cmd-esp32-set-mode",
  name: "Set Mode",
  description:
    "Switch protocol mode (SETUP, ECHO, AT, MODBUS, GPS, SCPI, MARLIN, ELM327)",
  createdAt: now,
  updatedAt: now,

  source: "PROTOCOL",

  protocolLayer: {
    protocolId: "proto-esp32-test-device",
    protocolCommandId: "tmpl-esp32-set",
    protocolVersion: "1.0",
    protocolCommandUpdatedAt: now,

    payload: "MODE={mode}",
    mode: "TEXT",
    encoding: "UTF-8",

    parameters: [
      {
        name: "mode",
        type: "ENUM",
        description: "Protocol mode to switch to",
        required: true,
        options: [
          { label: "Setup", value: "SETUP" },
          { label: "Echo", value: "ECHO" },
          { label: "AT Commands", value: "AT" },
          { label: "Modbus RTU", value: "MODBUS" },
          { label: "GPS NMEA", value: "GPS" },
          { label: "SCPI", value: "SCPI" },
          { label: "Marlin G-code", value: "MARLIN" },
          { label: "ELM327 OBD-II", value: "ELM327" },
          { label: "ESC/POS", value: "ESCPOS" },
        ],
      },
    ],

    validation: {
      enabled: true,
      successPattern: "OK - Mode set to:",
      successPatternType: "CONTAINS",
      timeout: 2000,
    },
  },

  commandLayer: {
    group: "ESP32/Mode",
    parameterEnhancements: {
      mode: {
        customDefault: "AT",
      },
    },
  },
};

export const CMD_ESP32_SET_TEMP: SavedCommand = {
  id: "cmd-esp32-set-temp",
  name: "Set Temperature",
  description: "Set simulated temperature value (°C)",
  createdAt: now,
  updatedAt: now,

  source: "PROTOCOL",

  protocolLayer: {
    protocolId: "proto-esp32-test-device",
    protocolCommandId: "tmpl-esp32-set",
    protocolVersion: "1.0",
    protocolCommandUpdatedAt: now,

    payload: "SET_TEMP={value}",
    mode: "TEXT",
    encoding: "UTF-8",

    parameters: [
      {
        name: "value",
        type: "FLOAT",
        description: "Temperature in degrees Celsius",
        required: true,
      },
    ],

    validation: {
      enabled: true,
      successPattern: "OK - Temperature set to:",
      successPatternType: "CONTAINS",
      timeout: 2000,
    },
  },

  commandLayer: {
    group: "ESP32/Simulation",
    parameterEnhancements: {
      value: {
        customDefault: 25.0,
      },
    },
  },
};

export const CMD_ESP32_SET_HUMID: SavedCommand = {
  id: "cmd-esp32-set-humid",
  name: "Set Humidity",
  description: "Set simulated humidity value (%)",
  createdAt: now,
  updatedAt: now,

  source: "PROTOCOL",

  protocolLayer: {
    protocolId: "proto-esp32-test-device",
    protocolCommandId: "tmpl-esp32-set",
    protocolVersion: "1.0",
    protocolCommandUpdatedAt: now,

    payload: "SET_HUMID={value}",
    mode: "TEXT",
    encoding: "UTF-8",

    parameters: [
      {
        name: "value",
        type: "FLOAT",
        description: "Humidity percentage (0-100)",
        required: true,
      },
    ],

    validation: {
      enabled: true,
      successPattern: "OK - Humidity set to:",
      successPatternType: "CONTAINS",
      timeout: 2000,
    },
  },

  commandLayer: {
    group: "ESP32/Simulation",
    parameterEnhancements: {
      value: {
        customDefault: 50.0,
      },
    },
  },
};

export const CMD_ESP32_SET_RPM: SavedCommand = {
  id: "cmd-esp32-set-rpm",
  name: "Set RPM",
  description: "Set simulated engine RPM",
  createdAt: now,
  updatedAt: now,

  source: "PROTOCOL",

  protocolLayer: {
    protocolId: "proto-esp32-test-device",
    protocolCommandId: "tmpl-esp32-set",
    protocolVersion: "1.0",
    protocolCommandUpdatedAt: now,

    payload: "SET_RPM={value}",
    mode: "TEXT",
    encoding: "UTF-8",

    parameters: [
      {
        name: "value",
        type: "INTEGER",
        description: "Engine RPM (0-65535)",
        required: true,
      },
    ],

    validation: {
      enabled: true,
      successPattern: "OK - RPM set to:",
      successPatternType: "CONTAINS",
      timeout: 2000,
    },
  },

  commandLayer: {
    group: "ESP32/Simulation",
    parameterEnhancements: {
      value: {
        customDefault: 3000,
      },
    },
  },
};

export const CMD_ESP32_SET_SPEED: SavedCommand = {
  id: "cmd-esp32-set-speed",
  name: "Set Speed",
  description: "Set simulated vehicle speed (km/h)",
  createdAt: now,
  updatedAt: now,

  source: "PROTOCOL",

  protocolLayer: {
    protocolId: "proto-esp32-test-device",
    protocolCommandId: "tmpl-esp32-set",
    protocolVersion: "1.0",
    protocolCommandUpdatedAt: now,

    payload: "SET_SPEED={value}",
    mode: "TEXT",
    encoding: "UTF-8",

    parameters: [
      {
        name: "value",
        type: "FLOAT",
        description: "Speed in km/h",
        required: true,
      },
    ],

    validation: {
      enabled: true,
      successPattern: "OK - Speed set to:",
      successPatternType: "CONTAINS",
      timeout: 2000,
    },
  },

  commandLayer: {
    group: "ESP32/Simulation",
    parameterEnhancements: {
      value: {
        customDefault: 60.0,
      },
    },
  },
};

export const CMD_ESP32_WIFI_STATUS: SavedCommand = {
  id: "cmd-esp32-wifi-status",
  name: "WiFi Status",
  description: "Show WiFi connection status",
  createdAt: now,
  updatedAt: now,

  source: "PROTOCOL",

  protocolLayer: {
    protocolId: "proto-esp32-test-device",
    protocolCommandId: "tmpl-esp32-setup",
    protocolVersion: "1.0",
    protocolCommandUpdatedAt: now,

    payload: "WIFI_STATUS",
    mode: "TEXT",
    encoding: "UTF-8",

    parameters: [],

    validation: {
      enabled: true,
      successPattern: "WiFi:",
      successPatternType: "CONTAINS",
      timeout: 2000,
    },
  },

  commandLayer: {
    group: "ESP32/WiFi",
  },
};

export const CMD_ESP32_WIFI_SCAN: SavedCommand = {
  id: "cmd-esp32-wifi-scan",
  name: "WiFi Scan",
  description: "Scan for available WiFi networks",
  createdAt: now,
  updatedAt: now,

  source: "PROTOCOL",

  protocolLayer: {
    protocolId: "proto-esp32-test-device",
    protocolCommandId: "tmpl-esp32-setup",
    protocolVersion: "1.0",
    protocolCommandUpdatedAt: now,

    payload: "WIFI_SCAN",
    mode: "TEXT",
    encoding: "UTF-8",

    parameters: [],

    validation: {
      enabled: true,
      successPattern: "Scanning",
      successPatternType: "CONTAINS",
      timeout: 5000,
    },
  },

  commandLayer: {
    group: "ESP32/WiFi",
  },
};

export const ESP32_COMMANDS: SavedCommand[] = [
  CMD_ESP32_HELP,
  CMD_ESP32_STATUS,
  CMD_ESP32_SET_MODE,
  CMD_ESP32_SET_TEMP,
  CMD_ESP32_SET_HUMID,
  CMD_ESP32_SET_RPM,
  CMD_ESP32_SET_SPEED,
  CMD_ESP32_WIFI_STATUS,
  CMD_ESP32_WIFI_SCAN,
];
