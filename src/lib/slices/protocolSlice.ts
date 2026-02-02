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
import { DEFAULT_PROTOCOLS, DEFAULT_DEVICES } from "../defaults/index";

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

  // Note: addCommandToDevice and removeCommandFromDevice moved to deviceSlice
  setDeviceDefaultProtocol: (
    deviceId: string,
    protocolId: string | null,
  ) => void;

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
// SLICE CREATOR
// ============================================================================

export const createProtocolSlice: StateCreator<ProtocolSlice> = (set, get) => ({
  // Initial state - uses imported defaults from src/lib/defaults/
  protocols: DEFAULT_PROTOCOLS,
  devices: DEFAULT_DEVICES,
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

  // Note: addCommandToDevice and removeCommandFromDevice moved to deviceSlice

  setDeviceDefaultProtocol: (deviceId, protocolId) =>
    set((state) => ({
      devices: state.devices.map((d) =>
        d.id === deviceId
          ? {
              ...d,
              defaultProtocolId: protocolId || undefined,
              updatedAt: Date.now(),
            }
          : d,
      ),
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
