/**
 * Marlin 3D Printer G-code Command Definitions
 */

import type { SavedCommand } from "../../../types";

const now = Date.now();

export const CMD_MARLIN_HOME_ALL: SavedCommand = {
  id: "cmd-marlin-home-all",
  name: "Home All Axes",
  description: "Home all axes (G28)",
  createdAt: now,
  updatedAt: now,

  source: "PROTOCOL",

  protocolLayer: {
    protocolId: "proto-marlin",
    protocolCommandId: "tmpl-marlin-simple",
    protocolVersion: "1.0",
    protocolCommandUpdatedAt: now,

    payload: "{gcode}",
    mode: "TEXT",
    encoding: "UTF-8",

    parameters: [
      {
        name: "gcode",
        type: "STRING",
        description: "G-code command",
        required: true,
      },
    ],

    validation: {
      enabled: true,
      successPattern: "ok",
      successPatternType: "CONTAINS",
      timeout: 2000,
    },
  },

  commandLayer: {
    group: "3D Printer/Motion",
    parameterEnhancements: {
      gcode: {
        customDefault: "G28",
      },
    },
  },
};

export const CMD_MARLIN_GET_POSITION: SavedCommand = {
  id: "cmd-marlin-get-position",
  name: "Get Position",
  description: "Report current position (M114)",
  createdAt: now,
  updatedAt: now,

  source: "PROTOCOL",

  protocolLayer: {
    protocolId: "proto-marlin",
    protocolCommandId: "tmpl-marlin-simple",
    protocolVersion: "1.0",
    protocolCommandUpdatedAt: now,

    payload: "{gcode}",
    mode: "TEXT",
    encoding: "UTF-8",

    parameters: [
      {
        name: "gcode",
        type: "STRING",
        description: "G-code command",
        required: true,
      },
    ],

    validation: {
      enabled: true,
      successPattern: "ok",
      successPatternType: "CONTAINS",
      timeout: 2000,
    },
  },

  commandLayer: {
    group: "3D Printer/Status",
    parameterEnhancements: {
      gcode: {
        customDefault: "M114",
      },
    },
  },
};

export const CMD_MARLIN_GET_TEMPERATURE: SavedCommand = {
  id: "cmd-marlin-get-temperature",
  name: "Get Temperature",
  description: "Report temperatures (M105)",
  createdAt: now,
  updatedAt: now,

  source: "PROTOCOL",

  protocolLayer: {
    protocolId: "proto-marlin",
    protocolCommandId: "tmpl-marlin-simple",
    protocolVersion: "1.0",
    protocolCommandUpdatedAt: now,

    payload: "{gcode}",
    mode: "TEXT",
    encoding: "UTF-8",

    parameters: [
      {
        name: "gcode",
        type: "STRING",
        description: "G-code command",
        required: true,
      },
    ],

    validation: {
      enabled: true,
      successPattern: "ok",
      successPatternType: "CONTAINS",
      timeout: 2000,
    },
  },

  commandLayer: {
    group: "3D Printer/Status",
    parameterEnhancements: {
      gcode: {
        customDefault: "M105",
      },
    },
  },
};

export const CMD_MARLIN_DISABLE_STEPPERS: SavedCommand = {
  id: "cmd-marlin-disable-steppers",
  name: "Disable Steppers",
  description: "Disable stepper motors (M18)",
  createdAt: now,
  updatedAt: now,

  source: "PROTOCOL",

  protocolLayer: {
    protocolId: "proto-marlin",
    protocolCommandId: "tmpl-marlin-simple",
    protocolVersion: "1.0",
    protocolCommandUpdatedAt: now,

    payload: "{gcode}",
    mode: "TEXT",
    encoding: "UTF-8",

    parameters: [
      {
        name: "gcode",
        type: "STRING",
        description: "G-code command",
        required: true,
      },
    ],

    validation: {
      enabled: true,
      successPattern: "ok",
      successPatternType: "CONTAINS",
      timeout: 2000,
    },
  },

  commandLayer: {
    group: "3D Printer/Motion",
    parameterEnhancements: {
      gcode: {
        customDefault: "M18",
      },
    },
  },
};

export const CMD_MARLIN_SET_HOTEND_TEMP: SavedCommand = {
  id: "cmd-marlin-set-hotend-temp",
  name: "Set Hotend Temperature",
  description: "Set hotend target temperature (M104)",
  createdAt: now,
  updatedAt: now,

  source: "PROTOCOL",

  protocolLayer: {
    protocolId: "proto-marlin",
    protocolCommandId: "tmpl-marlin-set-value",
    protocolVersion: "1.0",
    protocolCommandUpdatedAt: now,

    payload: "{gcode} S{value}",
    mode: "TEXT",
    encoding: "UTF-8",

    parameters: [
      {
        name: "gcode",
        type: "STRING",
        description: "G-code command",
        required: true,
      },
      {
        name: "value",
        type: "INTEGER",
        description: "Parameter value",
        required: true,
      },
    ],

    validation: {
      enabled: true,
      successPattern: "ok",
      successPatternType: "CONTAINS",
      timeout: 2000,
    },
  },

  commandLayer: {
    group: "3D Printer/Temperature",
    parameterEnhancements: {
      gcode: {
        customDefault: "M104",
      },
      value: {
        customDefault: 200,
      },
    },
  },
};

export const CMD_MARLIN_SET_BED_TEMP: SavedCommand = {
  id: "cmd-marlin-set-bed-temp",
  name: "Set Bed Temperature",
  description: "Set bed target temperature (M140)",
  createdAt: now,
  updatedAt: now,

  source: "PROTOCOL",

  protocolLayer: {
    protocolId: "proto-marlin",
    protocolCommandId: "tmpl-marlin-set-value",
    protocolVersion: "1.0",
    protocolCommandUpdatedAt: now,

    payload: "{gcode} S{value}",
    mode: "TEXT",
    encoding: "UTF-8",

    parameters: [
      {
        name: "gcode",
        type: "STRING",
        description: "G-code command",
        required: true,
      },
      {
        name: "value",
        type: "INTEGER",
        description: "Parameter value",
        required: true,
      },
    ],

    validation: {
      enabled: true,
      successPattern: "ok",
      successPatternType: "CONTAINS",
      timeout: 2000,
    },
  },

  commandLayer: {
    group: "3D Printer/Temperature",
    parameterEnhancements: {
      gcode: {
        customDefault: "M140",
      },
      value: {
        customDefault: 60,
      },
    },
  },
};

export const CMD_MARLIN_SET_FAN_SPEED: SavedCommand = {
  id: "cmd-marlin-set-fan-speed",
  name: "Set Fan Speed",
  description: "Set fan speed (M106)",
  createdAt: now,
  updatedAt: now,

  source: "PROTOCOL",

  protocolLayer: {
    protocolId: "proto-marlin",
    protocolCommandId: "tmpl-marlin-set-value",
    protocolVersion: "1.0",
    protocolCommandUpdatedAt: now,

    payload: "{gcode} S{value}",
    mode: "TEXT",
    encoding: "UTF-8",

    parameters: [
      {
        name: "gcode",
        type: "STRING",
        description: "G-code command",
        required: true,
      },
      {
        name: "value",
        type: "INTEGER",
        description: "Parameter value",
        required: true,
      },
    ],

    validation: {
      enabled: true,
      successPattern: "ok",
      successPatternType: "CONTAINS",
      timeout: 2000,
    },
  },

  commandLayer: {
    group: "3D Printer/Control",
    parameterEnhancements: {
      gcode: {
        customDefault: "M106",
      },
      value: {
        customDefault: 255,
      },
    },
  },
};

export const CMD_MARLIN_SET_FEEDRATE: SavedCommand = {
  id: "cmd-marlin-set-feedrate",
  name: "Set Feed Rate",
  description: "Set feedrate percentage (M220)",
  createdAt: now,
  updatedAt: now,

  source: "PROTOCOL",

  protocolLayer: {
    protocolId: "proto-marlin",
    protocolCommandId: "tmpl-marlin-set-value",
    protocolVersion: "1.0",
    protocolCommandUpdatedAt: now,

    payload: "{gcode} S{value}",
    mode: "TEXT",
    encoding: "UTF-8",

    parameters: [
      {
        name: "gcode",
        type: "STRING",
        description: "G-code command",
        required: true,
      },
      {
        name: "value",
        type: "INTEGER",
        description: "Parameter value",
        required: true,
      },
    ],

    validation: {
      enabled: true,
      successPattern: "ok",
      successPatternType: "CONTAINS",
      timeout: 2000,
    },
  },

  commandLayer: {
    group: "3D Printer/Motion",
    parameterEnhancements: {
      gcode: {
        customDefault: "M220",
      },
      value: {
        customDefault: 100,
      },
    },
  },
};

export const MARLIN_COMMANDS: SavedCommand[] = [
  CMD_MARLIN_HOME_ALL,
  CMD_MARLIN_GET_POSITION,
  CMD_MARLIN_GET_TEMPERATURE,
  CMD_MARLIN_DISABLE_STEPPERS,
  CMD_MARLIN_SET_HOTEND_TEMP,
  CMD_MARLIN_SET_BED_TEMP,
  CMD_MARLIN_SET_FAN_SPEED,
  CMD_MARLIN_SET_FEEDRATE,
];
