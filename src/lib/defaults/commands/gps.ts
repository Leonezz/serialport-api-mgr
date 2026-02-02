/**
 * GPS NMEA Command Definitions
 */

import type { SavedCommand } from "../../../types";

const now = Date.now();

export const CMD_GPS_GET_GGA: SavedCommand = {
  id: "cmd-gps-get-gga",
  name: "Get GGA Sentence",
  description: "Global Positioning System Fix Data",
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

export const GPS_COMMANDS: SavedCommand[] = [
  CMD_GPS_GET_GGA,
  CMD_GPS_GET_RMC,
  CMD_GPS_GET_GSA,
  CMD_GPS_GET_GSV,
  CMD_GPS_GET_VTG,
  CMD_GPS_GET_GLL,
];
