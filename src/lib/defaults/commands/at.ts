/**
 * AT Command Definitions
 */

import type { SavedCommand } from "../../../types";

const now = Date.now();

export const CMD_AT_CHECK: SavedCommand = {
  id: "cmd-at-check",
  name: "AT",
  description: "Basic AT command - check if device responds",
  createdAt: now,
  updatedAt: now,

  source: "PROTOCOL",

  protocolLayer: {
    protocolId: "proto-at-commands",
    protocolCommandId: "tmpl-at-basic",
    protocolVersion: "1.0",
    protocolCommandUpdatedAt: now,

    payload: "AT{command}",
    mode: "TEXT",
    encoding: "UTF-8",

    parameters: [
      {
        name: "command",
        type: "STRING",
        description: "AT command (e.g., +GMR for version, +RST for reset)",
        required: false,
      },
    ],

    validation: {
      enabled: true,
      successPattern: "OK",
      successPatternType: "CONTAINS",
      timeout: 1000,
    },
  },

  commandLayer: {
    group: "AT/Basic",
    parameterEnhancements: {
      command: {
        customDefault: "",
      },
    },
  },
};

export const CMD_AT_VERSION: SavedCommand = {
  id: "cmd-at-version",
  name: "Get Version",
  description: "Get firmware version",
  createdAt: now,
  updatedAt: now,

  source: "PROTOCOL",

  protocolLayer: {
    protocolId: "proto-at-commands",
    protocolCommandId: "tmpl-at-simple",
    protocolVersion: "1.0",
    protocolCommandUpdatedAt: now,

    payload: "AT+{command}",
    mode: "TEXT",
    encoding: "UTF-8",

    parameters: [
      {
        name: "command",
        type: "STRING",
        description: "AT command (e.g., GMR, RST, CWLAP)",
        required: true,
      },
    ],

    validation: {
      enabled: true,
      successPattern: "OK",
      successPatternType: "CONTAINS",
      timeout: 2000,
    },
  },

  commandLayer: {
    group: "AT/Info",
    parameterEnhancements: {
      command: {
        customDefault: "GMR",
      },
    },
  },
};

export const CMD_AT_RESET: SavedCommand = {
  id: "cmd-at-reset",
  name: "Reset Device",
  description: "Software reset",
  createdAt: now,
  updatedAt: now,

  source: "PROTOCOL",

  protocolLayer: {
    protocolId: "proto-at-commands",
    protocolCommandId: "tmpl-at-simple",
    protocolVersion: "1.0",
    protocolCommandUpdatedAt: now,

    payload: "AT+{command}",
    mode: "TEXT",
    encoding: "UTF-8",

    parameters: [
      {
        name: "command",
        type: "STRING",
        description: "AT command (e.g., GMR, RST, CWLAP)",
        required: true,
      },
    ],

    validation: {
      enabled: true,
      successPattern: "OK",
      successPatternType: "CONTAINS",
      timeout: 2000,
    },
  },

  commandLayer: {
    group: "AT/Control",
    parameterEnhancements: {
      command: {
        customDefault: "RST",
      },
    },
  },
};

export const CMD_AT_WIFI_SCAN: SavedCommand = {
  id: "cmd-at-wifi-scan",
  name: "Scan WiFi",
  description: "List available WiFi networks",
  createdAt: now,
  updatedAt: now,

  source: "PROTOCOL",

  protocolLayer: {
    protocolId: "proto-at-commands",
    protocolCommandId: "tmpl-at-simple",
    protocolVersion: "1.0",
    protocolCommandUpdatedAt: now,

    payload: "AT+{command}",
    mode: "TEXT",
    encoding: "UTF-8",

    parameters: [
      {
        name: "command",
        type: "STRING",
        description: "AT command (e.g., GMR, RST, CWLAP)",
        required: true,
      },
    ],

    validation: {
      enabled: true,
      successPattern: "OK",
      successPatternType: "CONTAINS",
      timeout: 5000,
    },
  },

  commandLayer: {
    group: "AT/WiFi",
    parameterEnhancements: {
      command: {
        customDefault: "CWLAP",
      },
    },
  },
};

export const AT_COMMANDS: SavedCommand[] = [
  CMD_AT_CHECK,
  CMD_AT_VERSION,
  CMD_AT_RESET,
  CMD_AT_WIFI_SCAN,
];
