/**
 * Modbus RTU Command Definitions
 *
 * Binary protocol commands - payload is hex string that gets converted to bytes
 */

import type { SavedCommand } from "../../../types";

const now = Date.now();

export const CMD_MODBUS_READ_HOLDING: SavedCommand = {
  id: "cmd-modbus-read-holding",
  name: "Read Holding Registers",
  description: "Read holding registers (FC03) - returns register values",
  createdAt: now,
  updatedAt: now,

  source: "PROTOCOL",

  protocolLayer: {
    protocolId: "proto-modbus-rtu",
    protocolCommandId: "tmpl-modbus-fc03",
    protocolVersion: "1.0",
    protocolCommandUpdatedAt: now,

    // Modbus RTU frame: [addr][fc][start_hi][start_lo][count_hi][count_lo]
    // CRC is added by the framing layer
    payload: "{slaveAddr}03{startAddr}{count}",
    mode: "HEX",

    parameters: [
      {
        name: "slaveAddr",
        type: "STRING",
        description: "Slave address (hex, e.g., 01)",
        required: true,
      },
      {
        name: "startAddr",
        type: "STRING",
        description: "Starting register address (hex, 4 digits, e.g., 0000)",
        required: true,
      },
      {
        name: "count",
        type: "STRING",
        description: "Number of registers to read (hex, 4 digits, e.g., 0004)",
        required: true,
      },
    ],

    validation: {
      enabled: true,
      successPattern: "^.{2}03",
      successPatternType: "REGEX",
      timeout: 2000,
    },
  },

  commandLayer: {
    group: "Modbus/Read",
    parameterEnhancements: {
      slaveAddr: { customDefault: "01" },
      startAddr: { customDefault: "0000" },
      count: { customDefault: "0004" },
    },
  },
};

export const CMD_MODBUS_READ_INPUT: SavedCommand = {
  id: "cmd-modbus-read-input",
  name: "Read Input Registers",
  description: "Read input registers (FC04) - read-only sensor data",
  createdAt: now,
  updatedAt: now,

  source: "PROTOCOL",

  protocolLayer: {
    protocolId: "proto-modbus-rtu",
    protocolCommandId: "tmpl-modbus-fc04",
    protocolVersion: "1.0",
    protocolCommandUpdatedAt: now,

    payload: "{slaveAddr}04{startAddr}{count}",
    mode: "HEX",

    parameters: [
      {
        name: "slaveAddr",
        type: "STRING",
        description: "Slave address (hex, e.g., 01)",
        required: true,
      },
      {
        name: "startAddr",
        type: "STRING",
        description: "Starting register address (hex, 4 digits)",
        required: true,
      },
      {
        name: "count",
        type: "STRING",
        description: "Number of registers to read (hex, 4 digits)",
        required: true,
      },
    ],

    validation: {
      enabled: true,
      successPattern: "^.{2}04",
      successPatternType: "REGEX",
      timeout: 2000,
    },
  },

  commandLayer: {
    group: "Modbus/Read",
    parameterEnhancements: {
      slaveAddr: { customDefault: "01" },
      startAddr: { customDefault: "0000" },
      count: { customDefault: "0008" },
    },
  },
};

export const CMD_MODBUS_WRITE_SINGLE: SavedCommand = {
  id: "cmd-modbus-write-single",
  name: "Write Single Register",
  description: "Write single holding register (FC06)",
  createdAt: now,
  updatedAt: now,

  source: "PROTOCOL",

  protocolLayer: {
    protocolId: "proto-modbus-rtu",
    protocolCommandId: "tmpl-modbus-fc06",
    protocolVersion: "1.0",
    protocolCommandUpdatedAt: now,

    payload: "{slaveAddr}06{regAddr}{value}",
    mode: "HEX",

    parameters: [
      {
        name: "slaveAddr",
        type: "STRING",
        description: "Slave address (hex)",
        required: true,
      },
      {
        name: "regAddr",
        type: "STRING",
        description: "Register address (hex, 4 digits)",
        required: true,
      },
      {
        name: "value",
        type: "STRING",
        description: "Value to write (hex, 4 digits)",
        required: true,
      },
    ],

    validation: {
      enabled: true,
      successPattern: "^.{2}06",
      successPatternType: "REGEX",
      timeout: 2000,
    },
  },

  commandLayer: {
    group: "Modbus/Write",
    parameterEnhancements: {
      slaveAddr: { customDefault: "01" },
      regAddr: { customDefault: "0000" },
      value: { customDefault: "00FF" },
    },
  },
};

export const CMD_MODBUS_READ_COILS: SavedCommand = {
  id: "cmd-modbus-read-coils",
  name: "Read Coils",
  description: "Read coil status (FC01) - digital outputs",
  createdAt: now,
  updatedAt: now,

  source: "PROTOCOL",

  protocolLayer: {
    protocolId: "proto-modbus-rtu",
    protocolCommandId: "tmpl-modbus-fc01",
    protocolVersion: "1.0",
    protocolCommandUpdatedAt: now,

    payload: "{slaveAddr}01{startAddr}{count}",
    mode: "HEX",

    parameters: [
      {
        name: "slaveAddr",
        type: "STRING",
        description: "Slave address (hex)",
        required: true,
      },
      {
        name: "startAddr",
        type: "STRING",
        description: "Starting coil address (hex, 4 digits)",
        required: true,
      },
      {
        name: "count",
        type: "STRING",
        description: "Number of coils to read (hex, 4 digits)",
        required: true,
      },
    ],

    validation: {
      enabled: true,
      successPattern: "^.{2}01",
      successPatternType: "REGEX",
      timeout: 2000,
    },
  },

  commandLayer: {
    group: "Modbus/Read",
    parameterEnhancements: {
      slaveAddr: { customDefault: "01" },
      startAddr: { customDefault: "0000" },
      count: { customDefault: "0003" },
    },
  },
};

export const MODBUS_COMMANDS: SavedCommand[] = [
  CMD_MODBUS_READ_HOLDING,
  CMD_MODBUS_READ_INPUT,
  CMD_MODBUS_WRITE_SINGLE,
  CMD_MODBUS_READ_COILS,
];
