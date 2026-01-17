import { StateCreator } from "zustand";
import { Device, DeviceAttachment, ProjectStore } from "../../types";

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

  assignToDevice: (entityType, entityId, deviceId) =>
    set((state) => {
      // Helper to update the device's reference lists
      const updateDeviceRefs = (
        devices: Device[],
        id: string,
        refId: string,
        listKey: "commandIds" | "sequenceIds" | "presetIds",
        action: "add" | "remove",
      ) => {
        return devices.map((d) => {
          if (d.id !== id) return d;
          const set = new Set(d[listKey]);
          if (action === "add") set.add(refId);
          else set.delete(refId);
          return { ...d, [listKey]: Array.from(set), updatedAt: Date.now() };
        });
      };

      let newDevices = [...state.devices];

      // 1. Remove from old device if it was assigned
      const currentEntity =
        entityType === "command"
          ? state.commands.find((c) => c.id === entityId)
          : entityType === "sequence"
            ? state.sequences.find((s) => s.id === entityId)
            : state.presets.find((p) => p.id === entityId);

      const oldDeviceId = currentEntity?.deviceId;
      if (oldDeviceId) {
        newDevices = updateDeviceRefs(
          newDevices,
          oldDeviceId,
          entityId,
          entityType === "command"
            ? "commandIds"
            : entityType === "sequence"
              ? "sequenceIds"
              : "presetIds",
          "remove",
        );
      }

      // 2. Add to new device if assigned
      if (deviceId) {
        newDevices = updateDeviceRefs(
          newDevices,
          deviceId,
          entityId,
          entityType === "command"
            ? "commandIds"
            : entityType === "sequence"
              ? "sequenceIds"
              : "presetIds",
          "add",
        );
      }

      // 3. Update the entity itself
      const updateEntity = (items: any[]) =>
        items.map((item) =>
          item.id === entityId
            ? { ...item, deviceId: deviceId, updatedAt: Date.now() }
            : item,
        );

      return {
        devices: newDevices,
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
});
