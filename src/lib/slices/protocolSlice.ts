/**
 * Protocol Slice
 *
 * Manages Protocol entities - top-level shareable protocol definitions.
 * Protocols contain framing configuration, message structures, and command templates.
 */

import { StateCreator } from "zustand";
import { generateId } from "../utils";
import type {
  Protocol,
  MessageStructure,
  CommandTemplate,
  Device,
  Sequence,
  DeviceProtocolBinding,
} from "../protocolTypes";

// ============================================================================
// STATE INTERFACE
// ============================================================================

export interface ProtocolSliceState {
  // Top-level entities
  protocols: Protocol[];
  devices: Device[];
  sequences: Sequence[];
}

// ============================================================================
// ACTIONS INTERFACE
// ============================================================================

export interface ProtocolSliceActions {
  // Protocol CRUD
  addProtocol: (
    protocol: Omit<Protocol, "id" | "createdAt" | "updatedAt">,
  ) => string;
  updateProtocol: (id: string, updates: Partial<Protocol>) => void;
  deleteProtocol: (id: string) => void;
  duplicateProtocol: (id: string) => string | null;

  // Message Structure CRUD (nested in Protocol)
  addMessageStructure: (
    protocolId: string,
    structure: Omit<MessageStructure, "id">,
  ) => string | null;
  updateMessageStructure: (
    protocolId: string,
    structureId: string,
    updates: Partial<MessageStructure>,
  ) => void;
  deleteMessageStructure: (protocolId: string, structureId: string) => void;

  // Command Template CRUD (nested in Protocol)
  addCommandTemplate: (
    protocolId: string,
    command: Omit<CommandTemplate, "id" | "createdAt" | "updatedAt">,
  ) => string | null;
  updateCommandTemplate: (
    protocolId: string,
    commandId: string,
    updates: Partial<CommandTemplate>,
  ) => void;
  deleteCommandTemplate: (protocolId: string, commandId: string) => void;

  // Device CRUD
  addDevice: (device: Omit<Device, "id" | "createdAt" | "updatedAt">) => string;
  updateDevice: (id: string, updates: Partial<Device>) => void;
  deleteDevice: (id: string) => void;

  // Device Protocol Binding
  addDeviceProtocolBinding: (
    deviceId: string,
    binding: DeviceProtocolBinding,
  ) => void;
  updateDeviceProtocolBinding: (
    deviceId: string,
    protocolId: string,
    updates: Partial<DeviceProtocolBinding>,
  ) => void;
  removeDeviceProtocolBinding: (deviceId: string, protocolId: string) => void;

  // Sequence CRUD
  addSequence: (
    sequence: Omit<Sequence, "id" | "createdAt" | "updatedAt">,
  ) => string;
  updateSequence: (id: string, updates: Partial<Sequence>) => void;
  deleteSequence: (id: string) => void;

  // Bulk setters for import/migration
  setProtocols: (
    protocols: Protocol[] | ((prev: Protocol[]) => Protocol[]),
  ) => void;
  setDevices: (devices: Device[] | ((prev: Device[]) => Device[])) => void;
  setSequences: (
    sequences: Sequence[] | ((prev: Sequence[]) => Sequence[]),
  ) => void;
}

// ============================================================================
// COMPLETE SLICE TYPE
// ============================================================================

export type ProtocolSlice = ProtocolSliceState & ProtocolSliceActions;

// ============================================================================
// DEFAULT DATA
// ============================================================================

const DEFAULT_AT_PROTOCOL: Protocol = {
  id: "proto-at-commands",
  name: "AT Commands",
  description: "Standard AT command protocol for modems and ESP devices",
  version: "1.0",
  icon: "terminal",
  tags: ["modem", "esp32", "wifi", "bluetooth"],
  createdAt: Date.now(),
  updatedAt: Date.now(),
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
      id: "cmd-at-check",
      type: "SIMPLE",
      name: "AT Check",
      description: "Basic AT check command",
      tags: ["basic"],
      createdAt: Date.now(),
      updatedAt: Date.now(),
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
    {
      id: "cmd-at-version",
      type: "SIMPLE",
      name: "Get Version",
      description: "Get firmware version",
      tags: ["info"],
      createdAt: Date.now(),
      updatedAt: Date.now(),
      payload: "AT+GMR",
      mode: "TEXT",
      lineEnding: "CRLF",
      parameters: [],
      validation: {
        enabled: true,
        timeout: 3000,
        successPattern: "OK",
        successPatternType: "CONTAINS",
      },
      extractVariables: [],
    },
    {
      id: "cmd-at-reset",
      type: "SIMPLE",
      name: "Reset Device",
      description: "Software reset the device",
      tags: ["control"],
      createdAt: Date.now(),
      updatedAt: Date.now(),
      payload: "AT+RST",
      mode: "TEXT",
      lineEnding: "CRLF",
      parameters: [],
      validation: {
        enabled: true,
        timeout: 5000,
        successPattern: "ready",
        successPatternType: "CONTAINS",
      },
      extractVariables: [],
    },
  ],
};

const DEFAULT_MODBUS_PROTOCOL: Protocol = {
  id: "proto-modbus-rtu",
  name: "Modbus RTU",
  description: "Industrial protocol for PLCs, sensors, and automation devices",
  version: "1.0",
  icon: "cpu",
  author: "Modbus Organization",
  sourceUrl: "https://modbus.org/specs.php",
  tags: ["industrial", "plc", "sensor", "automation"],
  createdAt: Date.now(),
  updatedAt: Date.now(),
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
          config: { type: "STATIC", value: [0x03] },
        },
        {
          id: "el-start-reg",
          name: "startRegister",
          description: "Starting register address",
          size: 2,
          byteOrder: "BE",
          config: { type: "FIELD", dataType: "UINT16" },
        },
        {
          id: "el-quantity",
          name: "quantity",
          description: "Number of registers to read",
          size: 2,
          byteOrder: "BE",
          config: { type: "FIELD", dataType: "UINT16" },
        },
        {
          id: "el-crc",
          name: "crc",
          description: "CRC-16 checksum",
          size: 2,
          byteOrder: "LE",
          config: {
            type: "CHECKSUM",
            algorithm: "CRC16_MODBUS",
            includeElements: [
              "el-address",
              "el-function",
              "el-start-reg",
              "el-quantity",
            ],
          },
        },
      ],
    },
    {
      id: "struct-read-holding-resp",
      name: "Read Holding Registers Response",
      description: "Function code 0x03 response",
      encoding: "BINARY",
      byteOrder: "BE",
      elements: [
        {
          id: "el-resp-address",
          name: "address",
          size: 1,
          config: { type: "ADDRESS", range: { min: 1, max: 247 } },
        },
        {
          id: "el-resp-function",
          name: "function",
          size: 1,
          config: { type: "STATIC", value: [0x03] },
        },
        {
          id: "el-byte-count",
          name: "byteCount",
          size: 1,
          config: { type: "FIELD", dataType: "UINT8" },
        },
        {
          id: "el-data",
          name: "data",
          size: "VARIABLE",
          config: { type: "PAYLOAD" },
        },
        {
          id: "el-resp-crc",
          name: "crc",
          size: 2,
          byteOrder: "LE",
          config: {
            type: "CHECKSUM",
            algorithm: "CRC16_MODBUS",
            includeElements: [
              "el-resp-address",
              "el-resp-function",
              "el-byte-count",
              "el-data",
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
      description: "Read one or more holding registers",
      category: "Read",
      tags: ["read", "registers"],
      createdAt: Date.now(),
      updatedAt: Date.now(),
      messageStructureId: "struct-read-holding-req",
      parameters: [
        {
          name: "slaveAddress",
          label: "Slave Address",
          type: "INTEGER",
          defaultValue: 1,
          min: 1,
          max: 247,
          required: true,
        },
        {
          name: "startRegister",
          label: "Start Register",
          type: "INTEGER",
          defaultValue: 0,
          min: 0,
          max: 65535,
          required: true,
        },
        {
          name: "quantity",
          label: "Quantity",
          type: "INTEGER",
          defaultValue: 1,
          min: 1,
          max: 125,
          required: true,
        },
      ],
      bindings: [
        { elementId: "el-address", parameterName: "slaveAddress" },
        { elementId: "el-start-reg", parameterName: "startRegister" },
        { elementId: "el-quantity", parameterName: "quantity" },
      ],
      staticValues: [],
      computedValues: [],
      response: {
        structureId: "struct-read-holding-resp",
        patterns: [
          {
            type: "SUCCESS",
            condition: "function === 0x03",
            extractElements: [
              { elementId: "el-data", variableName: "registerData" },
            ],
          },
          {
            type: "ERROR",
            condition: "function === 0x83",
          },
        ],
      },
      validation: {
        enabled: true,
        timeout: 1000,
      },
    },
  ],
};

// ============================================================================
// SLICE CREATOR
// ============================================================================

export const createProtocolSlice: StateCreator<ProtocolSlice> = (set, get) => ({
  // Initial state
  protocols: [DEFAULT_AT_PROTOCOL, DEFAULT_MODBUS_PROTOCOL],
  devices: [],
  sequences: [],

  // Protocol CRUD
  addProtocol: (protocolData) => {
    const timestamp = Date.now();
    const id = generateId();
    const newProtocol: Protocol = {
      ...protocolData,
      id,
      createdAt: timestamp,
      updatedAt: timestamp,
    };
    set((state) => ({ protocols: [...state.protocols, newProtocol] }));
    return id;
  },

  updateProtocol: (id, updates) =>
    set((state) => ({
      protocols: state.protocols.map((p) =>
        p.id === id ? { ...p, ...updates, updatedAt: Date.now() } : p,
      ),
    })),

  deleteProtocol: (id) =>
    set((state) => ({
      protocols: state.protocols.filter((p) => p.id !== id),
      // Also clean up device bindings (guard against undefined protocols array)
      devices: state.devices.map((d) => ({
        ...d,
        protocols: (d.protocols || []).filter((b) => b.protocolId !== id),
        updatedAt: Date.now(),
      })),
    })),

  duplicateProtocol: (id) => {
    const protocol = get().protocols.find((p) => p.id === id);
    if (!protocol) return null;

    const timestamp = Date.now();
    const newId = generateId();
    const newProtocol: Protocol = {
      ...protocol,
      id: newId,
      name: `${protocol.name} (Copy)`,
      createdAt: timestamp,
      updatedAt: timestamp,
      // Deep copy nested arrays with new IDs
      messageStructures: protocol.messageStructures.map((s) => ({
        ...s,
        id: generateId(),
        elements: s.elements.map((e) => ({ ...e, id: generateId() })),
      })),
      commands: protocol.commands.map((c) => ({
        ...c,
        id: generateId(),
        createdAt: timestamp,
        updatedAt: timestamp,
      })),
    };
    set((state) => ({ protocols: [...state.protocols, newProtocol] }));
    return newId;
  },

  // Message Structure CRUD
  addMessageStructure: (protocolId, structureData) => {
    const protocol = get().protocols.find((p) => p.id === protocolId);
    if (!protocol) return null;

    const id = generateId();
    const newStructure: MessageStructure = { ...structureData, id };

    set((state) => ({
      protocols: state.protocols.map((p) =>
        p.id === protocolId
          ? {
              ...p,
              messageStructures: [...p.messageStructures, newStructure],
              updatedAt: Date.now(),
            }
          : p,
      ),
    }));
    return id;
  },

  updateMessageStructure: (protocolId, structureId, updates) =>
    set((state) => ({
      protocols: state.protocols.map((p) =>
        p.id === protocolId
          ? {
              ...p,
              messageStructures: p.messageStructures.map((s) =>
                s.id === structureId ? { ...s, ...updates } : s,
              ),
              updatedAt: Date.now(),
            }
          : p,
      ),
    })),

  deleteMessageStructure: (protocolId, structureId) =>
    set((state) => ({
      protocols: state.protocols.map((p) =>
        p.id === protocolId
          ? {
              ...p,
              messageStructures: p.messageStructures.filter(
                (s) => s.id !== structureId,
              ),
              updatedAt: Date.now(),
            }
          : p,
      ),
    })),

  // Command Template CRUD
  addCommandTemplate: (protocolId, commandData) => {
    const protocol = get().protocols.find((p) => p.id === protocolId);
    if (!protocol) return null;

    const timestamp = Date.now();
    const id = generateId();
    const newCommand: CommandTemplate = {
      ...commandData,
      id,
      createdAt: timestamp,
      updatedAt: timestamp,
    } as CommandTemplate;

    set((state) => ({
      protocols: state.protocols.map((p) =>
        p.id === protocolId
          ? {
              ...p,
              commands: [...p.commands, newCommand],
              updatedAt: Date.now(),
            }
          : p,
      ),
    }));
    return id;
  },

  updateCommandTemplate: (protocolId, commandId, updates) =>
    set((state) => ({
      protocols: state.protocols.map((p) =>
        p.id === protocolId
          ? {
              ...p,
              commands: p.commands.map((c) =>
                c.id === commandId
                  ? { ...c, ...updates, updatedAt: Date.now() }
                  : c,
              ),
              updatedAt: Date.now(),
            }
          : p,
      ),
    })),

  deleteCommandTemplate: (protocolId, commandId) =>
    set((state) => ({
      protocols: state.protocols.map((p) =>
        p.id === protocolId
          ? {
              ...p,
              commands: p.commands.filter((c) => c.id !== commandId),
              updatedAt: Date.now(),
            }
          : p,
      ),
    })),

  // Device CRUD
  addDevice: (deviceData) => {
    const timestamp = Date.now();
    const id = generateId();
    const newDevice: Device = {
      ...deviceData,
      id,
      createdAt: timestamp,
      updatedAt: timestamp,
    };
    set((state) => ({ devices: [...state.devices, newDevice] }));
    return id;
  },

  updateDevice: (id, updates) =>
    set((state) => ({
      devices: state.devices.map((d) =>
        d.id === id ? { ...d, ...updates, updatedAt: Date.now() } : d,
      ),
    })),

  deleteDevice: (id) =>
    set((state) => ({
      devices: state.devices.filter((d) => d.id !== id),
    })),

  // Device Protocol Binding
  addDeviceProtocolBinding: (deviceId, binding) =>
    set((state) => ({
      devices: state.devices.map((d) =>
        d.id === deviceId
          ? {
              ...d,
              protocols: [...d.protocols, binding],
              updatedAt: Date.now(),
            }
          : d,
      ),
    })),

  updateDeviceProtocolBinding: (deviceId, protocolId, updates) =>
    set((state) => ({
      devices: state.devices.map((d) =>
        d.id === deviceId
          ? {
              ...d,
              protocols: d.protocols.map((b) =>
                b.protocolId === protocolId ? { ...b, ...updates } : b,
              ),
              updatedAt: Date.now(),
            }
          : d,
      ),
    })),

  removeDeviceProtocolBinding: (deviceId, protocolId) =>
    set((state) => ({
      devices: state.devices.map((d) =>
        d.id === deviceId
          ? {
              ...d,
              protocols: d.protocols.filter((b) => b.protocolId !== protocolId),
              updatedAt: Date.now(),
            }
          : d,
      ),
    })),

  // Sequence CRUD
  addSequence: (sequenceData) => {
    const timestamp = Date.now();
    const id = generateId();
    const newSequence: Sequence = {
      ...sequenceData,
      id,
      createdAt: timestamp,
      updatedAt: timestamp,
    };
    set((state) => ({ sequences: [...state.sequences, newSequence] }));
    return id;
  },

  updateSequence: (id, updates) =>
    set((state) => ({
      sequences: state.sequences.map((s) =>
        s.id === id ? { ...s, ...updates, updatedAt: Date.now() } : s,
      ),
    })),

  deleteSequence: (id) =>
    set((state) => ({
      sequences: state.sequences.filter((s) => s.id !== id),
    })),

  // Bulk setters
  setProtocols: (updater) =>
    set((state) => ({
      protocols:
        typeof updater === "function" ? updater(state.protocols) : updater,
    })),

  setDevices: (updater) =>
    set((state) => ({
      devices: typeof updater === "function" ? updater(state.devices) : updater,
    })),

  setSequences: (updater) =>
    set((state) => ({
      sequences:
        typeof updater === "function" ? updater(state.sequences) : updater,
    })),
});
