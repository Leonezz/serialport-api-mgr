import { StateCreator } from "zustand";
import { BaseEntity, Device, DeviceAttachment } from "../../types";
import { UISliceActions, UISliceState } from "./uiSlice";
import { SessionSliceActions, SessionSliceState } from "./sessionSlice";
import { ProjectSliceActions, ProjectSliceState } from "./projectSlice";

export interface ProjectStore
  extends
    ProjectSliceState,
    ProjectSliceActions,
    SessionSliceState,
    SessionSliceActions,
    UISliceState,
    UISliceActions,
    DeviceSlice {}

export interface DeviceSlice {
  devices: Device[];
  addDevice: (device: Device) => void;
  updateDevice: (id: string, updates: Partial<Device>) => void;
  deleteDevice: (id: string) => void;
  addDeviceAttachment: (deviceId: string, attachment: DeviceAttachment) => void;
  removeDeviceAttachment: (deviceId: string, attachmentId: string) => void;
  assignToDevice: (
    entityType: "command" | "sequence" | "preset",
    entityId: string,
    deviceId: string | null,
  ) => void;
  // Device-Command relationship management (single-direction linking)
  addCommandToDevice: (deviceId: string, commandId: string) => void;
  removeCommandFromDevice: (deviceId: string, commandId: string) => void;
}

export const createDeviceSlice: StateCreator<
  ProjectStore,
  [["zustand/persist", unknown]],
  [],
  DeviceSlice
> = (set) => ({
  devices: [],

  addDevice: (device) =>
    set((state) => ({
      devices: [...state.devices, device],
    })),

  updateDevice: (id, updates) =>
    set((state) => ({
      devices: state.devices.map((d) =>
        d.id === id ? { ...d, ...updates, updatedAt: Date.now() } : d,
      ),
    })),

  deleteDevice: (id) =>
    set((state) => ({
      devices: state.devices.filter((d) => d.id !== id),
      // Clean up references in other entities
      commands: state.commands.map((cmd) =>
        cmd.deviceId === id ? { ...cmd, deviceId: null } : cmd,
      ),
      sequences: state.sequences.map((seq) =>
        seq.deviceId === id ? { ...seq, deviceId: null } : seq,
      ),
      presets: state.presets.map((p) =>
        p.deviceId === id ? { ...p, deviceId: null } : p,
      ),
    })),

  addDeviceAttachment: (deviceId, attachment) =>
    set((state) => ({
      devices: state.devices.map((d) =>
        d.id === deviceId
          ? {
              ...d,
              attachments: [...d.attachments, attachment],
              updatedAt: Date.now(),
            }
          : d,
      ),
    })),

  removeDeviceAttachment: (deviceId, attachmentId) =>
    set((state) => ({
      devices: state.devices.map((d) =>
        d.id === deviceId
          ? {
              ...d,
              attachments: d.attachments.filter((a) => a.id !== attachmentId),
              updatedAt: Date.now(),
            }
          : d,
      ),
    })),

  // Single-direction linking: only update the entity's deviceId
  // Device -> Entity relationship is derived by filtering entities by deviceId
  assignToDevice: (entityType, entityId, deviceId) =>
    set((state) => {
      const updateEntity = (items: BaseEntity[]) =>
        items.map((item) =>
          item.id === entityId
            ? { ...item, deviceId: deviceId, updatedAt: Date.now() }
            : item,
        );

      return {
        commands:
          entityType === "command"
            ? updateEntity(state.commands)
            : state.commands,
        sequences:
          entityType === "sequence"
            ? updateEntity(state.sequences)
            : state.sequences,
        presets:
          entityType === "preset" ? updateEntity(state.presets) : state.presets,
      };
    }),

  // Device-Command relationship management (many-to-many via device.commandIds)
  addCommandToDevice: (deviceId, commandId) =>
    set((state) => ({
      devices: state.devices.map((d) =>
        d.id === deviceId
          ? {
              ...d,
              commandIds: d.commandIds?.includes(commandId)
                ? d.commandIds
                : [...(d.commandIds || []), commandId],
              updatedAt: Date.now(),
            }
          : d,
      ),
    })),

  removeCommandFromDevice: (deviceId, commandId) =>
    set((state) => ({
      devices: state.devices.map((d) =>
        d.id === deviceId
          ? {
              ...d,
              commandIds: (d.commandIds || []).filter((id) => id !== commandId),
              updatedAt: Date.now(),
            }
          : d,
      ),
    })),
});
