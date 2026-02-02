/**
 * ESC/POS Thermal Printer Command Definitions
 *
 * Binary protocol commands - payload is hex string that gets converted to bytes
 */

import type { SavedCommand } from "../../../types";

const now = Date.now();

export const CMD_ESCPOS_INIT: SavedCommand = {
  id: "cmd-escpos-init",
  name: "Initialize Printer",
  description: "Reset printer to default state (ESC @)",
  createdAt: now,
  updatedAt: now,

  source: "PROTOCOL",

  protocolLayer: {
    protocolId: "proto-escpos",
    protocolCommandId: "tmpl-escpos-init",
    protocolVersion: "1.0",
    protocolCommandUpdatedAt: now,

    payload: "1B40",
    mode: "HEX",

    parameters: [],

    validation: {
      enabled: false,
      timeout: 1000,
    },
  },

  commandLayer: {
    group: "ESC-POS/System",
  },
};

export const CMD_ESCPOS_STATUS: SavedCommand = {
  id: "cmd-escpos-status",
  name: "Query Printer Status",
  description: "Real-time status request (DLE EOT 1)",
  createdAt: now,
  updatedAt: now,

  source: "PROTOCOL",

  protocolLayer: {
    protocolId: "proto-escpos",
    protocolCommandId: "tmpl-escpos-status",
    protocolVersion: "1.0",
    protocolCommandUpdatedAt: now,

    payload: "1004",
    mode: "HEX",

    parameters: [],

    validation: {
      enabled: true,
      successPattern: ".",
      successPatternType: "REGEX",
      timeout: 1000,
    },
  },

  commandLayer: {
    group: "ESC-POS/Status",
  },
};

export const CMD_ESCPOS_PAPER_STATUS: SavedCommand = {
  id: "cmd-escpos-paper-status",
  name: "Query Paper Status",
  description: "Query paper sensor status (GS r 4)",
  createdAt: now,
  updatedAt: now,

  source: "PROTOCOL",

  protocolLayer: {
    protocolId: "proto-escpos",
    protocolCommandId: "tmpl-escpos-gs-status",
    protocolVersion: "1.0",
    protocolCommandUpdatedAt: now,

    payload: "1D7204",
    mode: "HEX",

    parameters: [],

    validation: {
      enabled: true,
      successPattern: ".",
      successPatternType: "REGEX",
      timeout: 1000,
    },
  },

  commandLayer: {
    group: "ESC-POS/Status",
  },
};

export const CMD_ESCPOS_CUT: SavedCommand = {
  id: "cmd-escpos-cut",
  name: "Cut Paper",
  description: "Full paper cut (GS V 0)",
  createdAt: now,
  updatedAt: now,

  source: "PROTOCOL",

  protocolLayer: {
    protocolId: "proto-escpos",
    protocolCommandId: "tmpl-escpos-cut",
    protocolVersion: "1.0",
    protocolCommandUpdatedAt: now,

    payload: "1D5600",
    mode: "HEX",

    parameters: [],

    validation: {
      enabled: false,
      timeout: 1000,
    },
  },

  commandLayer: {
    group: "ESC-POS/Paper",
  },
};

export const CMD_ESCPOS_FEED: SavedCommand = {
  id: "cmd-escpos-feed",
  name: "Feed Lines",
  description: "Print and feed n lines (ESC d n)",
  createdAt: now,
  updatedAt: now,

  source: "PROTOCOL",

  protocolLayer: {
    protocolId: "proto-escpos",
    protocolCommandId: "tmpl-escpos-feed",
    protocolVersion: "1.0",
    protocolCommandUpdatedAt: now,

    payload: "1B64{lines}",
    mode: "HEX",

    parameters: [
      {
        name: "lines",
        type: "STRING",
        description: "Number of lines to feed (hex, e.g., 03 for 3 lines)",
        required: true,
      },
    ],

    validation: {
      enabled: false,
      timeout: 1000,
    },
  },

  commandLayer: {
    group: "ESC-POS/Paper",
    parameterEnhancements: {
      lines: { customDefault: "03" },
    },
  },
};

export const CMD_ESCPOS_BOLD_ON: SavedCommand = {
  id: "cmd-escpos-bold-on",
  name: "Bold On",
  description: "Enable bold printing (ESC E 1)",
  createdAt: now,
  updatedAt: now,

  source: "PROTOCOL",

  protocolLayer: {
    protocolId: "proto-escpos",
    protocolCommandId: "tmpl-escpos-style",
    protocolVersion: "1.0",
    protocolCommandUpdatedAt: now,

    payload: "1B4501",
    mode: "HEX",

    parameters: [],

    validation: {
      enabled: false,
      timeout: 1000,
    },
  },

  commandLayer: {
    group: "ESC-POS/Style",
  },
};

export const CMD_ESCPOS_BOLD_OFF: SavedCommand = {
  id: "cmd-escpos-bold-off",
  name: "Bold Off",
  description: "Disable bold printing (ESC E 0)",
  createdAt: now,
  updatedAt: now,

  source: "PROTOCOL",

  protocolLayer: {
    protocolId: "proto-escpos",
    protocolCommandId: "tmpl-escpos-style",
    protocolVersion: "1.0",
    protocolCommandUpdatedAt: now,

    payload: "1B4500",
    mode: "HEX",

    parameters: [],

    validation: {
      enabled: false,
      timeout: 1000,
    },
  },

  commandLayer: {
    group: "ESC-POS/Style",
  },
};

export const CMD_ESCPOS_CENTER: SavedCommand = {
  id: "cmd-escpos-center",
  name: "Center Align",
  description: "Center text alignment (ESC a 1)",
  createdAt: now,
  updatedAt: now,

  source: "PROTOCOL",

  protocolLayer: {
    protocolId: "proto-escpos",
    protocolCommandId: "tmpl-escpos-align",
    protocolVersion: "1.0",
    protocolCommandUpdatedAt: now,

    payload: "1B6101",
    mode: "HEX",

    parameters: [],

    validation: {
      enabled: false,
      timeout: 1000,
    },
  },

  commandLayer: {
    group: "ESC-POS/Style",
  },
};

export const CMD_ESCPOS_LEFT: SavedCommand = {
  id: "cmd-escpos-left",
  name: "Left Align",
  description: "Left text alignment (ESC a 0)",
  createdAt: now,
  updatedAt: now,

  source: "PROTOCOL",

  protocolLayer: {
    protocolId: "proto-escpos",
    protocolCommandId: "tmpl-escpos-align",
    protocolVersion: "1.0",
    protocolCommandUpdatedAt: now,

    payload: "1B6100",
    mode: "HEX",

    parameters: [],

    validation: {
      enabled: false,
      timeout: 1000,
    },
  },

  commandLayer: {
    group: "ESC-POS/Style",
  },
};

export const CMD_ESCPOS_DRAWER_KICK: SavedCommand = {
  id: "cmd-escpos-drawer-kick",
  name: "Open Cash Drawer",
  description: "Generate pulse to open cash drawer (DLE DC4)",
  createdAt: now,
  updatedAt: now,

  source: "PROTOCOL",

  protocolLayer: {
    protocolId: "proto-escpos",
    protocolCommandId: "tmpl-escpos-drawer",
    protocolVersion: "1.0",
    protocolCommandUpdatedAt: now,

    payload: "1014",
    mode: "HEX",

    parameters: [],

    validation: {
      enabled: false,
      timeout: 1000,
    },
  },

  commandLayer: {
    group: "ESC-POS/Control",
  },
};

export const ESCPOS_COMMANDS: SavedCommand[] = [
  CMD_ESCPOS_INIT,
  CMD_ESCPOS_STATUS,
  CMD_ESCPOS_PAPER_STATUS,
  CMD_ESCPOS_CUT,
  CMD_ESCPOS_FEED,
  CMD_ESCPOS_BOLD_ON,
  CMD_ESCPOS_BOLD_OFF,
  CMD_ESCPOS_CENTER,
  CMD_ESCPOS_LEFT,
  CMD_ESCPOS_DRAWER_KICK,
];
