/**
 * SCPI Instrument Command Definitions
 */

import type { SavedCommand } from "../../../types";

const now = Date.now();

export const CMD_SCPI_IDN: SavedCommand = {
  id: "cmd-scpi-idn",
  name: "Identify",
  description: "Query instrument identification (*IDN?)",
  createdAt: now,
  updatedAt: now,

  source: "PROTOCOL",

  protocolLayer: {
    protocolId: "proto-scpi",
    protocolCommandId: "tmpl-scpi-query",
    protocolVersion: "1.0",
    protocolCommandUpdatedAt: now,

    payload: "*IDN?",
    mode: "TEXT",
    encoding: "UTF-8",

    parameters: [],

    validation: {
      enabled: true,
      successPattern: ",",
      successPatternType: "CONTAINS",
      timeout: 2000,
    },
  },

  commandLayer: {
    group: "SCPI/System",
  },
};

export const CMD_SCPI_RST: SavedCommand = {
  id: "cmd-scpi-rst",
  name: "Reset",
  description: "Reset instrument (*RST)",
  createdAt: now,
  updatedAt: now,

  source: "PROTOCOL",

  protocolLayer: {
    protocolId: "proto-scpi",
    protocolCommandId: "tmpl-scpi-command",
    protocolVersion: "1.0",
    protocolCommandUpdatedAt: now,

    payload: "*RST",
    mode: "TEXT",
    encoding: "UTF-8",

    parameters: [],

    validation: {
      enabled: false,
      timeout: 2000,
    },
  },

  commandLayer: {
    group: "SCPI/System",
  },
};

export const CMD_SCPI_OPC: SavedCommand = {
  id: "cmd-scpi-opc",
  name: "Operation Complete",
  description: "Query operation complete status (*OPC?)",
  createdAt: now,
  updatedAt: now,

  source: "PROTOCOL",

  protocolLayer: {
    protocolId: "proto-scpi",
    protocolCommandId: "tmpl-scpi-query",
    protocolVersion: "1.0",
    protocolCommandUpdatedAt: now,

    payload: "*OPC?",
    mode: "TEXT",
    encoding: "UTF-8",

    parameters: [],

    validation: {
      enabled: true,
      successPattern: "1",
      successPatternType: "CONTAINS",
      timeout: 2000,
    },
  },

  commandLayer: {
    group: "SCPI/System",
  },
};

export const CMD_SCPI_ERR: SavedCommand = {
  id: "cmd-scpi-err",
  name: "Query Error",
  description: "Query system error (:SYST:ERR?)",
  createdAt: now,
  updatedAt: now,

  source: "PROTOCOL",

  protocolLayer: {
    protocolId: "proto-scpi",
    protocolCommandId: "tmpl-scpi-query",
    protocolVersion: "1.0",
    protocolCommandUpdatedAt: now,

    payload: ":SYST:ERR?",
    mode: "TEXT",
    encoding: "UTF-8",

    parameters: [],

    validation: {
      enabled: true,
      successPattern: "0",
      successPatternType: "CONTAINS",
      timeout: 2000,
    },
  },

  commandLayer: {
    group: "SCPI/System",
  },
};

export const CMD_SCPI_MEAS_VOLT: SavedCommand = {
  id: "cmd-scpi-meas-volt",
  name: "Measure Voltage",
  description: "Measure DC voltage (:MEAS:VOLT:DC?)",
  createdAt: now,
  updatedAt: now,

  source: "PROTOCOL",

  protocolLayer: {
    protocolId: "proto-scpi",
    protocolCommandId: "tmpl-scpi-query",
    protocolVersion: "1.0",
    protocolCommandUpdatedAt: now,

    payload: ":MEAS:VOLT:DC?",
    mode: "TEXT",
    encoding: "UTF-8",

    parameters: [],

    validation: {
      enabled: true,
      successPattern: "^-?\\d+\\.\\d+",
      successPatternType: "REGEX",
      timeout: 2000,
    },
  },

  commandLayer: {
    group: "SCPI/Measurement",
  },
};

export const CMD_SCPI_MEAS_CURR: SavedCommand = {
  id: "cmd-scpi-meas-curr",
  name: "Measure Current",
  description: "Measure DC current (:MEAS:CURR:DC?)",
  createdAt: now,
  updatedAt: now,

  source: "PROTOCOL",

  protocolLayer: {
    protocolId: "proto-scpi",
    protocolCommandId: "tmpl-scpi-query",
    protocolVersion: "1.0",
    protocolCommandUpdatedAt: now,

    payload: ":MEAS:CURR:DC?",
    mode: "TEXT",
    encoding: "UTF-8",

    parameters: [],

    validation: {
      enabled: true,
      successPattern: "^-?\\d+\\.\\d+",
      successPatternType: "REGEX",
      timeout: 2000,
    },
  },

  commandLayer: {
    group: "SCPI/Measurement",
  },
};

export const CMD_SCPI_MEAS_TEMP: SavedCommand = {
  id: "cmd-scpi-meas-temp",
  name: "Measure Temperature",
  description: "Measure temperature (:MEAS:TEMP?)",
  createdAt: now,
  updatedAt: now,

  source: "PROTOCOL",

  protocolLayer: {
    protocolId: "proto-scpi",
    protocolCommandId: "tmpl-scpi-query",
    protocolVersion: "1.0",
    protocolCommandUpdatedAt: now,

    payload: ":MEAS:TEMP?",
    mode: "TEXT",
    encoding: "UTF-8",

    parameters: [],

    validation: {
      enabled: true,
      successPattern: "^-?\\d+\\.\\d+",
      successPatternType: "REGEX",
      timeout: 2000,
    },
  },

  commandLayer: {
    group: "SCPI/Measurement",
  },
};

export const SCPI_COMMANDS: SavedCommand[] = [
  CMD_SCPI_IDN,
  CMD_SCPI_RST,
  CMD_SCPI_OPC,
  CMD_SCPI_ERR,
  CMD_SCPI_MEAS_VOLT,
  CMD_SCPI_MEAS_CURR,
  CMD_SCPI_MEAS_TEMP,
];
