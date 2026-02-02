/**
 * ELM327 OBD-II Command Definitions
 */

import type { SavedCommand } from "../../../types";

const now = Date.now();

export const CMD_OBD_GET_RPM: SavedCommand = {
  id: "cmd-obd-get-rpm",
  name: "Get Engine RPM",
  description: "Read engine RPM (PID 0C)",
  createdAt: now,
  updatedAt: now,

  source: "PROTOCOL",

  protocolLayer: {
    protocolId: "proto-elm327",
    protocolCommandId: "tmpl-obd-mode01",
    protocolVersion: "1.0",
    protocolCommandUpdatedAt: now,

    payload: "01{pid}",
    mode: "TEXT",
    encoding: "UTF-8",

    parameters: [
      {
        name: "pid",
        type: "STRING",
        description:
          "PID code in hex (e.g., 0C for RPM, 0D for speed, 05 for coolant temp)",
        required: true,
      },
    ],

    validation: {
      enabled: true,
      successPattern: "41 0C",
      successPatternType: "CONTAINS",
      timeout: 2000,
    },
  },

  commandLayer: {
    group: "OBD-II/Engine",
    parameterEnhancements: {
      pid: {
        customDefault: "0C",
      },
    },
  },
};

export const CMD_OBD_GET_SPEED: SavedCommand = {
  id: "cmd-obd-get-speed",
  name: "Get Vehicle Speed",
  description: "Read vehicle speed (PID 0D)",
  createdAt: now,
  updatedAt: now,

  source: "PROTOCOL",

  protocolLayer: {
    protocolId: "proto-elm327",
    protocolCommandId: "tmpl-obd-mode01",
    protocolVersion: "1.0",
    protocolCommandUpdatedAt: now,

    payload: "01{pid}",
    mode: "TEXT",
    encoding: "UTF-8",

    parameters: [
      {
        name: "pid",
        type: "STRING",
        description:
          "PID code in hex (e.g., 0C for RPM, 0D for speed, 05 for coolant temp)",
        required: true,
      },
    ],

    validation: {
      enabled: true,
      successPattern: "41 0D",
      successPatternType: "CONTAINS",
      timeout: 2000,
    },
  },

  commandLayer: {
    group: "OBD-II/Vehicle",
    parameterEnhancements: {
      pid: {
        customDefault: "0D",
      },
    },
  },
};

export const CMD_OBD_GET_COOLANT_TEMP: SavedCommand = {
  id: "cmd-obd-get-coolant-temp",
  name: "Get Coolant Temperature",
  description: "Read engine coolant temperature (PID 05)",
  createdAt: now,
  updatedAt: now,

  source: "PROTOCOL",

  protocolLayer: {
    protocolId: "proto-elm327",
    protocolCommandId: "tmpl-obd-mode01",
    protocolVersion: "1.0",
    protocolCommandUpdatedAt: now,

    payload: "01{pid}",
    mode: "TEXT",
    encoding: "UTF-8",

    parameters: [
      {
        name: "pid",
        type: "STRING",
        description:
          "PID code in hex (e.g., 0C for RPM, 0D for speed, 05 for coolant temp)",
        required: true,
      },
    ],

    validation: {
      enabled: true,
      successPattern: "41 05",
      successPatternType: "CONTAINS",
      timeout: 2000,
    },
  },

  commandLayer: {
    group: "OBD-II/Engine",
    parameterEnhancements: {
      pid: {
        customDefault: "05",
      },
    },
  },
};

export const CMD_OBD_GET_FUEL_LEVEL: SavedCommand = {
  id: "cmd-obd-get-fuel-level",
  name: "Get Fuel Level",
  description: "Read fuel tank level (PID 2F)",
  createdAt: now,
  updatedAt: now,

  source: "PROTOCOL",

  protocolLayer: {
    protocolId: "proto-elm327",
    protocolCommandId: "tmpl-obd-mode01",
    protocolVersion: "1.0",
    protocolCommandUpdatedAt: now,

    payload: "01{pid}",
    mode: "TEXT",
    encoding: "UTF-8",

    parameters: [
      {
        name: "pid",
        type: "STRING",
        description:
          "PID code in hex (e.g., 0C for RPM, 0D for speed, 05 for coolant temp)",
        required: true,
      },
    ],

    validation: {
      enabled: true,
      successPattern: "41 2F",
      successPatternType: "CONTAINS",
      timeout: 2000,
    },
  },

  commandLayer: {
    group: "OBD-II/Vehicle",
    parameterEnhancements: {
      pid: {
        customDefault: "2F",
      },
    },
  },
};

export const CMD_OBD_GET_THROTTLE: SavedCommand = {
  id: "cmd-obd-get-throttle",
  name: "Get Throttle Position",
  description: "Read throttle position (PID 11)",
  createdAt: now,
  updatedAt: now,

  source: "PROTOCOL",

  protocolLayer: {
    protocolId: "proto-elm327",
    protocolCommandId: "tmpl-obd-mode01",
    protocolVersion: "1.0",
    protocolCommandUpdatedAt: now,

    payload: "01{pid}",
    mode: "TEXT",
    encoding: "UTF-8",

    parameters: [
      {
        name: "pid",
        type: "STRING",
        description:
          "PID code in hex (e.g., 0C for RPM, 0D for speed, 05 for coolant temp)",
        required: true,
      },
    ],

    validation: {
      enabled: true,
      successPattern: "41 11",
      successPatternType: "CONTAINS",
      timeout: 2000,
    },
  },

  commandLayer: {
    group: "OBD-II/Engine",
    parameterEnhancements: {
      pid: {
        customDefault: "11",
      },
    },
  },
};

export const CMD_OBD_READ_DTCS: SavedCommand = {
  id: "cmd-obd-read-dtcs",
  name: "Read DTCs",
  description: "Read stored diagnostic trouble codes",
  createdAt: now,
  updatedAt: now,

  source: "PROTOCOL",

  protocolLayer: {
    protocolId: "proto-elm327",
    protocolCommandId: "tmpl-obd-mode03",
    protocolVersion: "1.0",
    protocolCommandUpdatedAt: now,

    payload: "03",
    mode: "TEXT",
    encoding: "UTF-8",

    parameters: [],

    validation: {
      enabled: true,
      successPattern: "43",
      successPatternType: "CONTAINS",
      timeout: 3000,
    },
  },

  commandLayer: {
    group: "OBD-II/Diagnostics",
  },
};

export const CMD_OBD_CLEAR_DTCS: SavedCommand = {
  id: "cmd-obd-clear-dtcs",
  name: "Clear DTCs",
  description: "Clear diagnostic trouble codes",
  createdAt: now,
  updatedAt: now,

  source: "PROTOCOL",

  protocolLayer: {
    protocolId: "proto-elm327",
    protocolCommandId: "tmpl-obd-mode04",
    protocolVersion: "1.0",
    protocolCommandUpdatedAt: now,

    payload: "04",
    mode: "TEXT",
    encoding: "UTF-8",

    parameters: [],

    validation: {
      enabled: true,
      successPattern: "44",
      successPatternType: "CONTAINS",
      timeout: 2000,
    },
  },

  commandLayer: {
    group: "OBD-II/Diagnostics",
  },
};

export const CMD_OBD_GET_VIN: SavedCommand = {
  id: "cmd-obd-get-vin",
  name: "Get VIN",
  description: "Read vehicle identification number (Mode 09, PID 02)",
  createdAt: now,
  updatedAt: now,

  source: "PROTOCOL",

  protocolLayer: {
    protocolId: "proto-elm327",
    protocolCommandId: "tmpl-obd-mode09",
    protocolVersion: "1.0",
    protocolCommandUpdatedAt: now,

    payload: "09{pid}",
    mode: "TEXT",
    encoding: "UTF-8",

    parameters: [
      {
        name: "pid",
        type: "STRING",
        description: "PID code in hex (e.g., 02 for VIN, 0A for ECU name)",
        required: true,
      },
    ],

    validation: {
      enabled: true,
      successPattern: "49 02",
      successPatternType: "CONTAINS",
      timeout: 3000,
    },
  },

  commandLayer: {
    group: "OBD-II/Vehicle",
    parameterEnhancements: {
      pid: {
        customDefault: "02",
      },
    },
  },
};

export const OBD2_COMMANDS: SavedCommand[] = [
  CMD_OBD_GET_RPM,
  CMD_OBD_GET_SPEED,
  CMD_OBD_GET_COOLANT_TEMP,
  CMD_OBD_GET_FUEL_LEVEL,
  CMD_OBD_GET_THROTTLE,
  CMD_OBD_READ_DTCS,
  CMD_OBD_CLEAR_DTCS,
  CMD_OBD_GET_VIN,
];
