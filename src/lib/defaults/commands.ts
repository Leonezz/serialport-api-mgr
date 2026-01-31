/**
 * Default Commands
 *
 * Pre-configured commands for testing various protocols and devices.
 * Organized by device/protocol type.
 */

import type { SavedCommand } from "../../types";

const now = Date.now();

// ============================================================================
// GENERIC AT DEVICE COMMANDS (device-at-generic)
// ============================================================================

export const CMD_AT_CHECK: SavedCommand = {
  id: "cmd-at-check",
  name: "AT",
  description: "Basic AT command - check if device responds",
  deviceId: "device-at-generic",
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
  deviceId: "device-at-generic",
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
  deviceId: "device-at-generic",
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
  deviceId: "device-at-generic",
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

// SCPI section missing

// ELM327 OBD-II COMMANDS (device-obd2-elm327)
// ============================================================================

export const CMD_OBD_GET_RPM: SavedCommand = {
  id: "cmd-obd-get-rpm",
  name: "Get Engine RPM",
  description: "Read engine RPM (PID 0C)",
  deviceId: "device-obd2-elm327",
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
  deviceId: "device-obd2-elm327",
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
  deviceId: "device-obd2-elm327",
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
  deviceId: "device-obd2-elm327",
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
  deviceId: "device-obd2-elm327",
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
  deviceId: "device-obd2-elm327",
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
  deviceId: "device-obd2-elm327",
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
  deviceId: "device-obd2-elm327",
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

// MARLIN 3D PRINTER COMMANDS (device-marlin-printer)
// ============================================================================

export const CMD_MARLIN_HOME_ALL: SavedCommand = {
  id: "cmd-marlin-home-all",
  name: "Home All Axes",
  description: "Home all axes (G28)",
  deviceId: "device-marlin-printer",
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
  deviceId: "device-marlin-printer",
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
  deviceId: "device-marlin-printer",
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
  deviceId: "device-marlin-printer",
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
  deviceId: "device-marlin-printer",
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
  deviceId: "device-marlin-printer",
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
  deviceId: "device-marlin-printer",
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
  deviceId: "device-marlin-printer",
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

// ============================================================================
// EXPORTS
// ============================================================================

// GPS NMEA COMMANDS (device-gps-receiver)
// ============================================================================

export const CMD_GPS_GET_GGA: SavedCommand = {
  id: "cmd-gps-get-gga",
  name: "Get GGA Sentence",
  description: "Global Positioning System Fix Data",
  deviceId: "device-gps-receiver",
  createdAt: now,
  updatedAt: now,

  source: "PROTOCOL",

  protocolLayer: {
    protocolId: "proto-gps-nmea",
    protocolCommandId: "tmpl-nmea-sentence",
    protocolVersion: "1.0",
    protocolCommandUpdatedAt: now,

    payload: "${talker}{sentence}",
    mode: "TEXT",
    encoding: "UTF-8",

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
        description: "NMEA sentence type (e.g., GGA, RMC, GSA, GSV)",
        required: true,
      },
    ],

    validation: {
      enabled: true,
      successPattern: "$GPGGA",
      successPatternType: "CONTAINS",
      timeout: 2000,
    },
  },

  commandLayer: {
    group: "GPS/Position",
    parameterEnhancements: {
      talker: {
        customDefault: "GP",
      },
      sentence: {
        customDefault: "GGA",
      },
    },
  },
};

export const CMD_GPS_GET_RMC: SavedCommand = {
  id: "cmd-gps-get-rmc",
  name: "Get RMC Sentence",
  description: "Recommended Minimum Specific GPS/Transit Data",
  deviceId: "device-gps-receiver",
  createdAt: now,
  updatedAt: now,

  source: "PROTOCOL",

  protocolLayer: {
    protocolId: "proto-gps-nmea",
    protocolCommandId: "tmpl-nmea-sentence",
    protocolVersion: "1.0",
    protocolCommandUpdatedAt: now,

    payload: "${talker}{sentence}",
    mode: "TEXT",
    encoding: "UTF-8",

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
        description: "NMEA sentence type (e.g., GGA, RMC, GSA, GSV)",
        required: true,
      },
    ],

    validation: {
      enabled: true,
      successPattern: "$GPRMC",
      successPatternType: "CONTAINS",
      timeout: 2000,
    },
  },

  commandLayer: {
    group: "GPS/Navigation",
    parameterEnhancements: {
      talker: {
        customDefault: "GP",
      },
      sentence: {
        customDefault: "RMC",
      },
    },
  },
};

export const CMD_GPS_GET_GSA: SavedCommand = {
  id: "cmd-gps-get-gsa",
  name: "Get GSA Sentence",
  description: "GPS DOP and Active Satellites",
  deviceId: "device-gps-receiver",
  createdAt: now,
  updatedAt: now,

  source: "PROTOCOL",

  protocolLayer: {
    protocolId: "proto-gps-nmea",
    protocolCommandId: "tmpl-nmea-sentence",
    protocolVersion: "1.0",
    protocolCommandUpdatedAt: now,

    payload: "${talker}{sentence}",
    mode: "TEXT",
    encoding: "UTF-8",

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
        description: "NMEA sentence type (e.g., GGA, RMC, GSA, GSV)",
        required: true,
      },
    ],

    validation: {
      enabled: true,
      successPattern: "$GPGSA",
      successPatternType: "CONTAINS",
      timeout: 2000,
    },
  },

  commandLayer: {
    group: "GPS/Satellites",
    parameterEnhancements: {
      talker: {
        customDefault: "GP",
      },
      sentence: {
        customDefault: "GSA",
      },
    },
  },
};

export const CMD_GPS_GET_GSV: SavedCommand = {
  id: "cmd-gps-get-gsv",
  name: "Get GSV Sentence",
  description: "GPS Satellites in View",
  deviceId: "device-gps-receiver",
  createdAt: now,
  updatedAt: now,

  source: "PROTOCOL",

  protocolLayer: {
    protocolId: "proto-gps-nmea",
    protocolCommandId: "tmpl-nmea-sentence",
    protocolVersion: "1.0",
    protocolCommandUpdatedAt: now,

    payload: "${talker}{sentence}",
    mode: "TEXT",
    encoding: "UTF-8",

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
        description: "NMEA sentence type (e.g., GGA, RMC, GSA, GSV)",
        required: true,
      },
    ],

    validation: {
      enabled: true,
      successPattern: "$GPGSV",
      successPatternType: "CONTAINS",
      timeout: 2000,
    },
  },

  commandLayer: {
    group: "GPS/Satellites",
    parameterEnhancements: {
      talker: {
        customDefault: "GP",
      },
      sentence: {
        customDefault: "GSV",
      },
    },
  },
};

export const CMD_GPS_GET_VTG: SavedCommand = {
  id: "cmd-gps-get-vtg",
  name: "Get VTG Sentence",
  description: "Track Made Good and Ground Speed",
  deviceId: "device-gps-receiver",
  createdAt: now,
  updatedAt: now,

  source: "PROTOCOL",

  protocolLayer: {
    protocolId: "proto-gps-nmea",
    protocolCommandId: "tmpl-nmea-sentence",
    protocolVersion: "1.0",
    protocolCommandUpdatedAt: now,

    payload: "${talker}{sentence}",
    mode: "TEXT",
    encoding: "UTF-8",

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
        description: "NMEA sentence type (e.g., GGA, RMC, GSA, GSV)",
        required: true,
      },
    ],

    validation: {
      enabled: true,
      successPattern: "$GPVTG",
      successPatternType: "CONTAINS",
      timeout: 2000,
    },
  },

  commandLayer: {
    group: "GPS/Navigation",
    parameterEnhancements: {
      talker: {
        customDefault: "GP",
      },
      sentence: {
        customDefault: "VTG",
      },
    },
  },
};

export const CMD_GPS_GET_GLL: SavedCommand = {
  id: "cmd-gps-get-gll",
  name: "Get GLL Sentence",
  description: "Geographic Position - Latitude/Longitude",
  deviceId: "device-gps-receiver",
  createdAt: now,
  updatedAt: now,

  source: "PROTOCOL",

  protocolLayer: {
    protocolId: "proto-gps-nmea",
    protocolCommandId: "tmpl-nmea-sentence",
    protocolVersion: "1.0",
    protocolCommandUpdatedAt: now,

    payload: "${talker}{sentence}",
    mode: "TEXT",
    encoding: "UTF-8",

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
        description: "NMEA sentence type (e.g., GGA, RMC, GSA, GSV)",
        required: true,
      },
    ],

    validation: {
      enabled: true,
      successPattern: "$GPGLL",
      successPatternType: "CONTAINS",
      timeout: 2000,
    },
  },

  commandLayer: {
    group: "GPS/Position",
    parameterEnhancements: {
      talker: {
        customDefault: "GP",
      },
      sentence: {
        customDefault: "GLL",
      },
    },
  },
};

export const DEFAULT_COMMANDS: SavedCommand[] = [
  // AT Commands
  CMD_AT_CHECK,
  CMD_AT_VERSION,
  CMD_AT_RESET,
  CMD_AT_WIFI_SCAN,

  // SCPI Commands (if present)
  // Add SCPI command exports here when section is added

  // ELM327 Commands
  CMD_OBD_GET_RPM,
  CMD_OBD_GET_SPEED,
  CMD_OBD_GET_COOLANT_TEMP,
  CMD_OBD_GET_FUEL_LEVEL,
  CMD_OBD_GET_THROTTLE,
  CMD_OBD_READ_DTCS,
  CMD_OBD_CLEAR_DTCS,
  CMD_OBD_GET_VIN,

  // Marlin Commands
  CMD_MARLIN_HOME_ALL,
  CMD_MARLIN_GET_POSITION,
  CMD_MARLIN_GET_TEMPERATURE,
  CMD_MARLIN_DISABLE_STEPPERS,
  CMD_MARLIN_SET_HOTEND_TEMP,
  CMD_MARLIN_SET_BED_TEMP,
  CMD_MARLIN_SET_FAN_SPEED,
  CMD_MARLIN_SET_FEEDRATE,

  // GPS NMEA Commands
  CMD_GPS_GET_GGA,
  CMD_GPS_GET_RMC,
  CMD_GPS_GET_GSA,
  CMD_GPS_GET_GSV,
  CMD_GPS_GET_VTG,
  CMD_GPS_GET_GLL,
];
