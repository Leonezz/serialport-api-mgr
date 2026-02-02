/**
 * Default Protocol Definitions
 *
 * Protocol entities define communication standards with framing,
 * message structures, and command templates.
 */

import type { Protocol } from "../protocolTypes";

const now = Date.now();

// ============================================================================
// AT COMMANDS PROTOCOL
// ============================================================================

export const PROTOCOL_AT_COMMANDS: Protocol = {
  id: "proto-at-commands",
  name: "AT Commands",
  description:
    "Standard AT command protocol for modems and ESP devices - defines HOW to structure AT commands",
  version: "1.0",
  icon: "terminal",
  tags: ["modem", "esp32", "wifi", "bluetooth"],
  createdAt: now,
  updatedAt: now,
  framing: {
    strategy: "DELIMITER",
    delimiter: {
      sequence: "\r\n",
      position: "SUFFIX",
      includeInFrame: false,
    },
  },
  messageStructures: [],
  commands: [
    // Template 1: Basic AT Command (just "AT")
    {
      id: "tmpl-at-basic",
      type: "SIMPLE",
      name: "Basic AT Command",
      description: "Template for simple AT command without parameters (AT)",
      tags: ["template", "basic"],
      createdAt: now,
      updatedAt: now,
      payload: "AT",
      mode: "TEXT",
      lineEnding: "CRLF",
      parameters: [],
      validation: {
        enabled: true,
        timeout: 2000,
        successPattern: "OK",
        successPatternType: "CONTAINS",
      },
      extractVariables: [],
    },
    // Template 2: Simple AT+ Command (AT+{command})
    {
      id: "tmpl-at-simple",
      type: "SIMPLE",
      name: "Simple AT+ Command",
      description: "Template for AT command with command name: AT+{command}",
      tags: ["template", "query"],
      createdAt: now,
      updatedAt: now,
      payload: "AT+{command}",
      mode: "TEXT",
      lineEnding: "CRLF",
      parameters: [
        {
          name: "command",
          type: "STRING",
          description: "AT command name (e.g., GMR, RST, CWLAP)",
          required: true,
        },
      ],
      validation: {
        enabled: true,
        timeout: 3000,
        successPattern: "OK",
        successPatternType: "CONTAINS",
      },
      extractVariables: [],
    },
    // Template 3: AT+ Command with Single Value (AT+{command}={value})
    {
      id: "tmpl-at-set-value",
      type: "SIMPLE",
      name: "AT+ Set Value Command",
      description:
        "Template for AT command with single value: AT+{command}={value}",
      tags: ["template", "set"],
      createdAt: now,
      updatedAt: now,
      payload: "AT+{command}={value}",
      mode: "TEXT",
      lineEnding: "CRLF",
      parameters: [
        {
          name: "command",
          type: "STRING",
          description: "AT command name",
          required: true,
        },
        {
          name: "value",
          type: "STRING",
          description: "Parameter value",
          required: true,
        },
      ],
      validation: {
        enabled: true,
        timeout: 3000,
        successPattern: "OK",
        successPatternType: "CONTAINS",
      },
      extractVariables: [],
    },
    // Template 4: AT+ Command with Multiple Parameters (AT+{command}={p1},{p2},{p3})
    {
      id: "tmpl-at-multi-param",
      type: "SIMPLE",
      name: "AT+ Multi-Parameter Command",
      description:
        "Template for AT command with comma-separated parameters: AT+{command}={p1},{p2},{p3}",
      tags: ["template", "config"],
      createdAt: now,
      updatedAt: now,
      payload: "AT+{command}={param1},{param2},{param3}",
      mode: "TEXT",
      lineEnding: "CRLF",
      parameters: [
        {
          name: "command",
          type: "STRING",
          description: "AT command name",
          required: true,
        },
        {
          name: "param1",
          type: "STRING",
          description: "First parameter",
          required: true,
        },
        {
          name: "param2",
          type: "STRING",
          description: "Second parameter",
          required: false,
        },
        {
          name: "param3",
          type: "STRING",
          description: "Third parameter",
          required: false,
        },
      ],
      validation: {
        enabled: true,
        timeout: 5000,
        successPattern: "OK",
        successPatternType: "CONTAINS",
      },
      extractVariables: [],
    },
    // Template 5: AT+ Query Command (AT+{command}?)
    {
      id: "tmpl-at-query",
      type: "SIMPLE",
      name: "AT+ Query Command",
      description: "Template for querying AT command status: AT+{command}?",
      tags: ["template", "query"],
      createdAt: now,
      updatedAt: now,
      payload: "AT+{command}?",
      mode: "TEXT",
      lineEnding: "CRLF",
      parameters: [
        {
          name: "command",
          type: "STRING",
          description: "AT command name to query",
          required: true,
        },
      ],
      validation: {
        enabled: true,
        timeout: 3000,
        successPattern: "OK",
        successPatternType: "CONTAINS",
      },
      extractVariables: [],
    },
    // Template 6: AT+ Test Command (AT+{command}=?)
    {
      id: "tmpl-at-test",
      type: "SIMPLE",
      name: "AT+ Test Command",
      description:
        "Template for testing AT command availability: AT+{command}=?",
      tags: ["template", "test"],
      createdAt: now,
      updatedAt: now,
      payload: "AT+{command}=?",
      mode: "TEXT",
      lineEnding: "CRLF",
      parameters: [
        {
          name: "command",
          type: "STRING",
          description: "AT command name to test",
          required: true,
        },
      ],
      validation: {
        enabled: true,
        timeout: 3000,
        successPattern: "OK",
        successPatternType: "CONTAINS",
      },
      extractVariables: [],
    },
  ],
};

// ============================================================================
// MODBUS RTU PROTOCOL
// ============================================================================

export const PROTOCOL_MODBUS_RTU: Protocol = {
  id: "proto-modbus-rtu",
  name: "Modbus RTU",
  description: "Industrial protocol for PLCs, sensors, and automation devices",
  version: "1.0",
  icon: "cpu",
  author: "Modbus Organization",
  sourceUrl: "https://modbus.org/specs.php",
  tags: ["industrial", "plc", "sensor", "automation"],
  createdAt: now,
  updatedAt: now,
  framing: {
    strategy: "TIMEOUT",
    timeout: {
      silenceMs: 4,
      minBytes: 4,
    },
  },
  messageStructures: [
    {
      id: "struct-read-holding-req",
      name: "Read Holding Registers Request",
      description: "Function code 0x03 request",
      encoding: "BINARY",
      byteOrder: "BE",
      elements: [
        {
          id: "el-address",
          name: "address",
          description: "Slave address",
          size: 1,
          config: {
            type: "ADDRESS",
            range: { min: 1, max: 247 },
            broadcastValue: 0,
          },
        },
        {
          id: "el-function",
          name: "function",
          description: "Function code",
          size: 1,
          config: {
            type: "STATIC",
            value: [3],
          },
        },
        {
          id: "el-start-addr",
          name: "startAddress",
          description: "Starting register address",
          size: 2,
          config: {
            type: "FIELD",
            dataType: "UINT16",
          },
        },
        {
          id: "el-quantity",
          name: "quantity",
          description: "Number of registers to read",
          size: 2,
          config: {
            type: "FIELD",
            dataType: "UINT16",
          },
        },
        {
          id: "el-crc",
          name: "crc",
          description: "CRC-16 checksum",
          size: 2,
          config: {
            type: "CHECKSUM",
            algorithm: "CRC16_MODBUS",
            includeElements: [
              "el-address",
              "el-function",
              "el-start-addr",
              "el-quantity",
            ],
          },
        },
      ],
    },
  ],
  commands: [
    {
      id: "cmd-modbus-read-holding",
      type: "STRUCTURED",
      name: "Read Holding Registers",
      description: "Read holding registers (FC 0x03)",
      tags: ["read"],
      createdAt: now,
      updatedAt: now,
      messageStructureId: "struct-read-holding-req",
      parameters: [
        {
          name: "address",
          label: "Slave Address",
          type: "INTEGER",
          defaultValue: 1,
          min: 1,
          max: 247,
        },
        {
          name: "startAddress",
          label: "Start Address",
          type: "INTEGER",
          defaultValue: 0,
          min: 0,
          max: 65535,
        },
        {
          name: "quantity",
          label: "Quantity",
          type: "INTEGER",
          defaultValue: 2,
          min: 1,
          max: 125,
        },
      ],
      bindings: [
        { elementId: "el-address", parameterName: "address" },
        { elementId: "el-start-addr", parameterName: "startAddress" },
        { elementId: "el-quantity", parameterName: "quantity" },
      ],
      validation: {
        enabled: true,
        timeout: 1000,
      },
    },
  ],
};

// ============================================================================
// SCPI INSTRUMENT PROTOCOL
// ============================================================================

export const PROTOCOL_SCPI: Protocol = {
  id: "proto-scpi",
  name: "SCPI Commands",
  description:
    "Standard Commands for Programmable Instruments - defines HOW to structure SCPI commands",
  version: "1.0",
  icon: "activity",
  tags: ["instrument", "lab", "measurement", "scpi"],
  createdAt: now,
  updatedAt: now,
  framing: {
    strategy: "DELIMITER",
    delimiter: {
      sequence: "\n",
      position: "SUFFIX",
      includeInFrame: false,
    },
  },
  messageStructures: [],
  commands: [
    // Template 1: IEEE 488.2 Common Command (*CMD)
    {
      id: "tmpl-scpi-common",
      type: "SIMPLE",
      name: "IEEE 488.2 Common Command",
      description: "Template for IEEE 488.2 common commands: *{command}",
      tags: ["template", "common"],
      createdAt: now,
      updatedAt: now,
      payload: "*{command}",
      mode: "TEXT",
      lineEnding: "LF",
      parameters: [
        {
          name: "command",
          type: "STRING",
          description: "Common command name (IDN, RST, OPC, CLS, etc.)",
          required: true,
        },
      ],
      validation: {
        enabled: true,
        timeout: 3000,
      },
      extractVariables: [],
    },
    // Template 2: IEEE 488.2 Common Query (*CMD?)
    {
      id: "tmpl-scpi-common-query",
      type: "SIMPLE",
      name: "IEEE 488.2 Common Query",
      description: "Template for IEEE 488.2 common queries: *{command}?",
      tags: ["template", "query"],
      createdAt: now,
      updatedAt: now,
      payload: "*{command}?",
      mode: "TEXT",
      lineEnding: "LF",
      parameters: [
        {
          name: "command",
          type: "STRING",
          description: "Common command name to query (IDN, OPC, etc.)",
          required: true,
        },
      ],
      validation: {
        enabled: true,
        timeout: 3000,
      },
      extractVariables: [],
    },
    // Template 3: SCPI Subsystem Query (:{subsystem}:{command}?)
    {
      id: "tmpl-scpi-subsystem-query",
      type: "SIMPLE",
      name: "SCPI Subsystem Query",
      description:
        "Template for SCPI subsystem queries: :{subsystem}:{command}?",
      tags: ["template", "query"],
      createdAt: now,
      updatedAt: now,
      payload: ":{subsystem}:{command}?",
      mode: "TEXT",
      lineEnding: "LF",
      parameters: [
        {
          name: "subsystem",
          type: "STRING",
          description: "SCPI subsystem (SYST, MEAS, CONF, etc.)",
          required: true,
        },
        {
          name: "command",
          type: "STRING",
          description: "Command within subsystem (ERR, VOLT, CURR, etc.)",
          required: true,
        },
      ],
      validation: {
        enabled: true,
        timeout: 3000,
      },
      extractVariables: [],
    },
    // Template 4: SCPI Subsystem Set (:{subsystem}:{command} {value})
    {
      id: "tmpl-scpi-subsystem-set",
      type: "SIMPLE",
      name: "SCPI Subsystem Set",
      description:
        "Template for SCPI subsystem set commands: :{subsystem}:{command} {value}",
      tags: ["template", "set"],
      createdAt: now,
      updatedAt: now,
      payload: ":{subsystem}:{command} {value}",
      mode: "TEXT",
      lineEnding: "LF",
      parameters: [
        {
          name: "subsystem",
          type: "STRING",
          description: "SCPI subsystem",
          required: true,
        },
        {
          name: "command",
          type: "STRING",
          description: "Command within subsystem",
          required: true,
        },
        {
          name: "value",
          type: "STRING",
          description: "Value to set",
          required: true,
        },
      ],
      validation: {
        enabled: true,
        timeout: 3000,
      },
      extractVariables: [],
    },
    // Template 5: SCPI Hierarchical Query (:{sub1}:{sub2}:{command}?)
    {
      id: "tmpl-scpi-hierarchical-query",
      type: "SIMPLE",
      name: "SCPI Hierarchical Query",
      description:
        "Template for multi-level SCPI queries: :{sub1}:{sub2}:{command}?",
      tags: ["template", "query", "hierarchical"],
      createdAt: now,
      updatedAt: now,
      payload: ":{subsystem1}:{subsystem2}:{command}?",
      mode: "TEXT",
      lineEnding: "LF",
      parameters: [
        {
          name: "subsystem1",
          type: "STRING",
          description: "Top-level subsystem (MEAS, CONF, etc.)",
          required: true,
        },
        {
          name: "subsystem2",
          type: "STRING",
          description: "Second-level subsystem (VOLT, CURR, etc.)",
          required: true,
        },
        {
          name: "command",
          type: "STRING",
          description: "Command (DC, AC, RANG, etc.)",
          required: true,
        },
      ],
      validation: {
        enabled: true,
        timeout: 5000,
      },
      extractVariables: [],
    },
  ],
};

// ============================================================================
// MARLIN G-CODE PROTOCOL (3D Printers)
// ============================================================================

export const PROTOCOL_MARLIN: Protocol = {
  id: "proto-marlin",
  name: "Marlin G-code",
  description:
    "G-code protocol for 3D printers - defines HOW to structure G-code and M-code commands",
  version: "1.0",
  icon: "printer",
  tags: ["3d-printer", "gcode", "marlin", "cnc"],
  createdAt: now,
  updatedAt: now,
  framing: {
    strategy: "DELIMITER",
    delimiter: {
      sequence: "\n",
      position: "SUFFIX",
      includeInFrame: false,
    },
  },
  messageStructures: [],
  commands: [
    // Template 1: Simple G-code Command (G{code})
    {
      id: "tmpl-gcode-simple",
      type: "SIMPLE",
      name: "Simple G-code Command",
      description: "Template for simple G-code commands: G{code}",
      tags: ["template", "gcode"],
      createdAt: now,
      updatedAt: now,
      payload: "G{code}",
      mode: "TEXT",
      lineEnding: "LF",
      parameters: [
        {
          name: "code",
          type: "INTEGER",
          description: "G-code number (0, 1, 28, 90, 91, etc.)",
          required: true,
        },
      ],
      validation: {
        enabled: true,
        timeout: 60000,
        successPattern: "ok",
        successPatternType: "CONTAINS",
      },
      extractVariables: [],
    },
    // Template 2: Simple M-code Command (M{code})
    {
      id: "tmpl-mcode-simple",
      type: "SIMPLE",
      name: "Simple M-code Command",
      description: "Template for simple M-code commands: M{code}",
      tags: ["template", "mcode"],
      createdAt: now,
      updatedAt: now,
      payload: "M{code}",
      mode: "TEXT",
      lineEnding: "LF",
      parameters: [
        {
          name: "code",
          type: "INTEGER",
          description: "M-code number (0, 84, 105, 114, etc.)",
          required: true,
        },
      ],
      validation: {
        enabled: true,
        timeout: 5000,
        successPattern: "ok",
        successPatternType: "CONTAINS",
      },
      extractVariables: [],
    },
    // Template 3: G-code with XYZ Parameters (G{code} X{x} Y{y} Z{z})
    {
      id: "tmpl-gcode-xyz",
      type: "SIMPLE",
      name: "G-code with XYZ Position",
      description:
        "Template for G-code movement with coordinates: G{code} X{x} Y{y} Z{z}",
      tags: ["template", "gcode", "motion"],
      createdAt: now,
      updatedAt: now,
      payload: "G{code} X{x} Y{y} Z{z}",
      mode: "TEXT",
      lineEnding: "LF",
      parameters: [
        {
          name: "code",
          type: "INTEGER",
          description: "G-code number (0, 1, etc.)",
          required: true,
        },
        {
          name: "x",
          type: "FLOAT",
          description: "X coordinate",
          required: false,
        },
        {
          name: "y",
          type: "FLOAT",
          description: "Y coordinate",
          required: false,
        },
        {
          name: "z",
          type: "FLOAT",
          description: "Z coordinate",
          required: false,
        },
      ],
      validation: {
        enabled: true,
        timeout: 60000,
        successPattern: "ok",
        successPatternType: "CONTAINS",
      },
      extractVariables: [],
    },
    // Template 4: G-code with Feed Rate (G{code} F{feedrate})
    {
      id: "tmpl-gcode-feedrate",
      type: "SIMPLE",
      name: "G-code with Feed Rate",
      description: "Template for G-code with feed rate: G{code} F{feedrate}",
      tags: ["template", "gcode", "speed"],
      createdAt: now,
      updatedAt: now,
      payload: "G{code} F{feedrate}",
      mode: "TEXT",
      lineEnding: "LF",
      parameters: [
        {
          name: "code",
          type: "INTEGER",
          description: "G-code number",
          required: true,
        },
        {
          name: "feedrate",
          type: "FLOAT",
          description: "Feed rate in mm/min",
          required: true,
        },
      ],
      validation: {
        enabled: true,
        timeout: 5000,
        successPattern: "ok",
        successPatternType: "CONTAINS",
      },
      extractVariables: [],
    },
    // Template 5: M-code with S Parameter (M{code} S{value})
    {
      id: "tmpl-mcode-s-param",
      type: "SIMPLE",
      name: "M-code with S Parameter",
      description: "Template for M-code with S parameter: M{code} S{value}",
      tags: ["template", "mcode", "parameter"],
      createdAt: now,
      updatedAt: now,
      payload: "M{code} S{value}",
      mode: "TEXT",
      lineEnding: "LF",
      parameters: [
        {
          name: "code",
          type: "INTEGER",
          description: "M-code number (104, 106, 140, etc.)",
          required: true,
        },
        {
          name: "value",
          type: "FLOAT",
          description: "S parameter value (temperature, speed, etc.)",
          required: true,
        },
      ],
      validation: {
        enabled: true,
        timeout: 5000,
        successPattern: "ok",
        successPatternType: "CONTAINS",
      },
      extractVariables: [],
    },
    // Template 6: M-code with P Parameter (M{code} P{value})
    {
      id: "tmpl-mcode-p-param",
      type: "SIMPLE",
      name: "M-code with P Parameter",
      description: "Template for M-code with P parameter: M{code} P{value}",
      tags: ["template", "mcode", "parameter"],
      createdAt: now,
      updatedAt: now,
      payload: "M{code} P{value}",
      mode: "TEXT",
      lineEnding: "LF",
      parameters: [
        {
          name: "code",
          type: "INTEGER",
          description: "M-code number",
          required: true,
        },
        {
          name: "value",
          type: "FLOAT",
          description: "P parameter value",
          required: true,
        },
      ],
      validation: {
        enabled: true,
        timeout: 5000,
        successPattern: "ok",
        successPatternType: "CONTAINS",
      },
      extractVariables: [],
    },
  ],
};

// ============================================================================
// ELM327 OBD-II PROTOCOL
// ============================================================================

export const PROTOCOL_ELM327: Protocol = {
  id: "proto-elm327",
  name: "ELM327 OBD-II",
  description: "OBD-II diagnostics via ELM327 adapter",
  version: "1.0",
  icon: "car",
  tags: ["automotive", "obd", "diagnostics", "elm327"],
  createdAt: now,
  updatedAt: now,
  framing: {
    strategy: "DELIMITER",
    delimiter: {
      sequence: ">",
      position: "SUFFIX",
      includeInFrame: false,
    },
  },
  messageStructures: [],
  commands: [
    // ELM327 AT Command Templates
    {
      id: "tmpl-elm-at",
      type: "SIMPLE",
      name: "ELM327 AT Command",
      description: "Template for ELM327 AT commands: AT{command}",
      tags: ["template", "at-command"],
      createdAt: now,
      updatedAt: now,
      payload: "AT{command}",
      mode: "TEXT",
      lineEnding: "CR",
      parameters: [
        {
          name: "command",
          type: "STRING",
          description:
            "AT command (e.g., Z for reset, E0 for echo off, SP0 for auto protocol)",
          required: true,
        },
      ],
      extractVariables: [],
    },
    {
      id: "tmpl-elm-at-param",
      type: "SIMPLE",
      name: "ELM327 AT Command with Parameter",
      description:
        "Template for ELM327 AT commands with parameter: AT{command}{value}",
      tags: ["template", "at-command"],
      createdAt: now,
      updatedAt: now,
      payload: "AT{command}{value}",
      mode: "TEXT",
      lineEnding: "CR",
      parameters: [
        {
          name: "command",
          type: "STRING",
          description: "AT command (e.g., SP, H, L, etc.)",
          required: true,
        },
        {
          name: "value",
          type: "STRING",
          description: "Command parameter value",
          required: true,
        },
      ],
      extractVariables: [],
    },

    // OBD-II PID Query Templates
    {
      id: "tmpl-obd-mode01",
      type: "SIMPLE",
      name: "OBD-II Mode 01 Query",
      description: "Template for Mode 01 (current data) PID query: 01{pid}",
      tags: ["template", "obd", "pid"],
      createdAt: now,
      updatedAt: now,
      payload: "01{pid}",
      mode: "TEXT",
      lineEnding: "CR",
      parameters: [
        {
          name: "pid",
          type: "STRING",
          description:
            "PID code in hex (e.g., 0C for RPM, 0D for speed, 05 for coolant temp)",
          required: true,
        },
      ],
      extractVariables: [],
    },
    {
      id: "tmpl-obd-mode02",
      type: "SIMPLE",
      name: "OBD-II Mode 02 Query",
      description:
        "Template for Mode 02 (freeze frame data) PID query: 02{pid}",
      tags: ["template", "obd", "pid"],
      createdAt: now,
      updatedAt: now,
      payload: "02{pid}",
      mode: "TEXT",
      lineEnding: "CR",
      parameters: [
        {
          name: "pid",
          type: "STRING",
          description: "PID code in hex",
          required: true,
        },
      ],
      extractVariables: [],
    },
    {
      id: "tmpl-obd-mode03",
      type: "SIMPLE",
      name: "OBD-II Mode 03 Query",
      description: "Template for Mode 03 (stored DTCs): 03",
      tags: ["template", "obd", "dtc"],
      createdAt: now,
      updatedAt: now,
      payload: "03",
      mode: "TEXT",
      lineEnding: "CR",
      parameters: [],
      extractVariables: [],
    },
    {
      id: "tmpl-obd-mode04",
      type: "SIMPLE",
      name: "OBD-II Mode 04 Clear DTCs",
      description: "Template for Mode 04 (clear DTCs): 04",
      tags: ["template", "obd", "dtc"],
      createdAt: now,
      updatedAt: now,
      payload: "04",
      mode: "TEXT",
      lineEnding: "CR",
      parameters: [],
      extractVariables: [],
    },
    {
      id: "tmpl-obd-mode09",
      type: "SIMPLE",
      name: "OBD-II Mode 09 Query",
      description: "Template for Mode 09 (vehicle info) PID query: 09{pid}",
      tags: ["template", "obd", "vehicle-info"],
      createdAt: now,
      updatedAt: now,
      payload: "09{pid}",
      mode: "TEXT",
      lineEnding: "CR",
      parameters: [
        {
          name: "pid",
          type: "STRING",
          description: "PID code in hex (e.g., 02 for VIN, 0A for ECU name)",
          required: true,
        },
      ],
      extractVariables: [],
    },
  ],
};

// ============================================================================
// GPS NMEA PROTOCOL
// ============================================================================

export const PROTOCOL_GPS_NMEA: Protocol = {
  id: "proto-gps-nmea",
  name: "GPS NMEA",
  description: "NMEA 0183 protocol for GPS receivers",
  version: "1.0",
  icon: "map-pin",
  tags: ["gps", "navigation", "nmea", "location"],
  createdAt: now,
  updatedAt: now,
  framing: {
    strategy: "DELIMITER",
    delimiter: {
      sequence: "\r\n",
      position: "SUFFIX",
      includeInFrame: false,
    },
  },
  messageStructures: [],
  commands: [
    {
      id: "tmpl-nmea-sentence",
      type: "SIMPLE",
      name: "NMEA Sentence Query",
      description:
        "Template for NMEA sentence query/filter: ${talker}{sentence}",
      tags: ["template", "sentence"],
      createdAt: now,
      updatedAt: now,
      payload: "${talker}{sentence}",
      mode: "TEXT",
      lineEnding: "CRLF",
      parameters: [
        {
          name: "talker",
          type: "STRING",
          description:
            "Talker ID (e.g., GP for GPS, GL for GLONASS, GN for combined)",
          required: true,
        },
        {
          name: "sentence",
          type: "STRING",
          description:
            "Sentence type (e.g., GGA for fix data, RMC for recommended minimum, GSA for DOP)",
          required: true,
        },
      ],
      extractVariables: [],
    },
    {
      id: "tmpl-nmea-proprietary",
      type: "SIMPLE",
      name: "Proprietary NMEA Command",
      description:
        "Template for vendor-specific NMEA commands: ${vendor}{command}",
      tags: ["template", "proprietary"],
      createdAt: now,
      updatedAt: now,
      payload: "${vendor}{command}",
      mode: "TEXT",
      lineEnding: "CRLF",
      parameters: [
        {
          name: "vendor",
          type: "STRING",
          description:
            "Vendor prefix (e.g., PMTK for MediaTek, PUBX for u-blox)",
          required: true,
        },
        {
          name: "command",
          type: "STRING",
          description: "Vendor-specific command",
          required: true,
        },
      ],
      extractVariables: [],
    },
  ],
};

// ============================================================================
// ESP32 TEST DEVICE PROTOCOL (Multi-mode emulator)
// ============================================================================

export const PROTOCOL_ESP32_TEST_DEVICE: Protocol = {
  id: "proto-esp32-test-device",
  name: "ESP32 Test Device",
  description:
    "Setup and mode switching commands for the ESP32 Serial Protocol Tester",
  version: "1.0",
  icon: "cpu",
  tags: ["esp32", "test", "emulator", "multi-mode"],
  createdAt: now,
  updatedAt: now,
  framing: {
    strategy: "DELIMITER",
    delimiter: {
      sequence: "\r\n",
      position: "SUFFIX",
      includeInFrame: false,
    },
  },
  messageStructures: [],
  commands: [
    // Command Templates
    {
      id: "tmpl-esp32-simple-cmd",
      type: "SIMPLE",
      name: "Simple Command",
      description: "Template for simple ESP32 commands: {command}",
      tags: ["template", "command"],
      createdAt: now,
      updatedAt: now,
      payload: "{command}",
      mode: "TEXT",
      lineEnding: "CRLF",
      parameters: [
        {
          name: "command",
          type: "STRING",
          description: "Command name (e.g., HELP, STATUS, RESET)",
          required: true,
        },
      ],
      extractVariables: [],
    },
    {
      id: "tmpl-esp32-mode-switch",
      type: "SIMPLE",
      name: "Mode Switch",
      description: "Template for mode switching: MODE={mode}",
      tags: ["template", "mode"],
      createdAt: now,
      updatedAt: now,
      payload: "MODE={mode}",
      mode: "TEXT",
      lineEnding: "CRLF",
      parameters: [
        {
          name: "mode",
          type: "STRING",
          description:
            "Mode name (ECHO, AT, SCPI, MARLIN, ELM327, GPS, MODBUS)",
          required: true,
        },
      ],
      extractVariables: [],
    },
    {
      id: "tmpl-esp32-set-param",
      type: "SIMPLE",
      name: "Set Parameter",
      description: "Template for setting parameters: SET_{parameter}={value}",
      tags: ["template", "parameter"],
      createdAt: now,
      updatedAt: now,
      payload: "SET_{parameter}={value}",
      mode: "TEXT",
      lineEnding: "CRLF",
      parameters: [
        {
          name: "parameter",
          type: "STRING",
          description: "Parameter name (TEMP, RPM, VOLTAGE, etc.)",
          required: true,
        },
        {
          name: "value",
          type: "STRING",
          description: "Parameter value",
          required: true,
        },
      ],
      extractVariables: [],
    },
  ],
};

// ============================================================================
// ESC/POS THERMAL PRINTER PROTOCOL
// ============================================================================

export const PROTOCOL_ESCPOS: Protocol = {
  id: "proto-escpos",
  name: "ESC/POS",
  version: "1.0",
  description:
    "Epson Standard Code for Point of Sale - binary protocol for thermal receipt printers",
  author: "Epson",
  sourceUrl: "https://reference.epson-biz.com/modules/ref_escpos/index.php",
  tags: ["escpos", "thermal", "printer", "pos", "receipt", "binary"],
  createdAt: Date.now(),
  updatedAt: Date.now(),

  // Binary protocol - uses hex mode
  framing: {
    strategy: "NONE",
  },

  // ESC/POS uses simple binary commands, no complex structures needed
  messageStructures: [],

  // Protocol command templates
  commands: [
    {
      id: "tmpl-escpos-init",
      type: "SIMPLE",
      name: "Initialize Printer",
      description: "Reset printer to default state (ESC @)",
      payload: "1B40",
      mode: "HEX",
      parameters: [],
      extractVariables: [],
    },
    {
      id: "tmpl-escpos-status",
      type: "SIMPLE",
      name: "Query Status",
      description: "Real-time status request (DLE EOT)",
      payload: "1004",
      mode: "HEX",
      parameters: [],
      extractVariables: [],
    },
    {
      id: "tmpl-escpos-cut",
      type: "SIMPLE",
      name: "Cut Paper",
      description: "Full paper cut (GS V 0)",
      payload: "1D5600",
      mode: "HEX",
      parameters: [],
      extractVariables: [],
    },
    {
      id: "tmpl-escpos-feed",
      type: "SIMPLE",
      name: "Feed Lines",
      description: "Print and feed n lines (ESC d n)",
      payload: "1B64{lines}",
      mode: "HEX",
      parameters: [
        {
          name: "lines",
          type: "STRING",
          description: "Number of lines (hex byte)",
          required: true,
        },
      ],
      extractVariables: [],
    },
    {
      id: "tmpl-escpos-style",
      type: "SIMPLE",
      name: "Set Style",
      description: "Set text style (ESC E n for bold)",
      payload: "1B45{n}",
      mode: "HEX",
      parameters: [
        {
          name: "n",
          type: "STRING",
          description: "Style parameter (00=off, 01=on)",
          required: true,
        },
      ],
      extractVariables: [],
    },
    {
      id: "tmpl-escpos-align",
      type: "SIMPLE",
      name: "Set Alignment",
      description: "Set text alignment (ESC a n)",
      payload: "1B61{n}",
      mode: "HEX",
      parameters: [
        {
          name: "n",
          type: "STRING",
          description: "Alignment (00=left, 01=center, 02=right)",
          required: true,
        },
      ],
      extractVariables: [],
    },
    {
      id: "tmpl-escpos-drawer",
      type: "SIMPLE",
      name: "Open Cash Drawer",
      description: "Generate pulse to open drawer (DLE DC4)",
      payload: "1014",
      mode: "HEX",
      parameters: [],
      extractVariables: [],
    },
  ],
};

// ============================================================================
// EXPORT ALL DEFAULT PROTOCOLS
// ============================================================================

export const DEFAULT_PROTOCOLS: Protocol[] = [
  PROTOCOL_ESP32_TEST_DEVICE,
  PROTOCOL_AT_COMMANDS,
  PROTOCOL_SCPI,
  PROTOCOL_MARLIN,
  PROTOCOL_ELM327,
  PROTOCOL_GPS_NMEA,
  PROTOCOL_MODBUS_RTU,
  PROTOCOL_ESCPOS,
];
