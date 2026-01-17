import { create } from "zustand";
import { createJSONStorage, devtools, persist } from "zustand/middleware";
import { z, ZodError } from "zod";
import { createUISlice, UISlice } from "./slices/uiSlice";
import { createProjectSlice, ProjectSlice } from "./slices/projectSlice";
import { createSessionSlice, SessionSlice } from "./slices/sessionSlice";
import { createDeviceSlice, DeviceSlice } from "./slices/deviceSlice";
import { LazyStore } from "@tauri-apps/plugin-store";
import {
  PersistedStoreStateSchema,
  STORE_VERSION,
  DEFAULT_PERSISTED_STATE,
} from "./storeSchemas";
import { DeviceSchema } from "./schemas";

const store = new LazyStore("settings.json");

type Device = z.infer<typeof DeviceSchema>;

/**
 * Schema-aware Tauri storage with validation and error recovery
 */
const createSchemaAwareTauriStorage = () => {
  return {
    getItem: async (name: string): Promise<string | null> => {
      try {
        const rawData = await store.get<string>(name);
        if (!rawData) return null;

        // Parse the stored JSON
        const parsedData =
          typeof rawData === "string" ? JSON.parse(rawData) : rawData;

        // Validate against schema
        const validationResult =
          PersistedStoreStateSchema.safeParse(parsedData);

        if (validationResult.success === false) {
          console.error(
            "Store validation failed:",
            validationResult.error.errors,
          );
          console.warn("Attempting partial recovery...");

          // Attempt partial recovery - extract valid fields
          const recovered = recoverPartialState(
            parsedData,
            validationResult.error,
          );

          // Save the recovered state
          const recoveredJson = JSON.stringify(recovered);
          await store.set(name, recoveredJson);

          console.info("Partial state recovered and saved");
          return recoveredJson;
        }

        // Add version if missing
        if (!validationResult.data.__version) {
          validationResult.data.__version = STORE_VERSION;
        }

        return typeof rawData === "string"
          ? rawData
          : JSON.stringify(validationResult.data);
      } catch (error) {
        console.error("Error loading store:", error);
        // Return null to trigger default state initialization
        return null;
      }
    },

    setItem: async (name: string, value: string): Promise<void> => {
      try {
        const parsedValue = JSON.parse(value);

        // Add version tracking
        const versionedValue = {
          ...parsedValue,
          __version: STORE_VERSION,
        };

        // Validate before saving
        const validationResult =
          PersistedStoreStateSchema.safeParse(versionedValue);

        if (validationResult.success === false) {
          console.error(
            "Validation failed before save:",
            validationResult.error.errors,
          );
          // Still save but log the issue
          await store.set(name, JSON.stringify(versionedValue));
          return;
        }

        await store.set(name, JSON.stringify(validationResult.data));
      } catch (error) {
        console.error("Error saving store:", error);
        throw error;
      }
    },

    removeItem: async (name: string): Promise<void> => {
      await store.delete(name);
    },
  };
};

/**
 * Attempts to recover a partial state from invalid data
 * Extracts fields that pass validation and uses defaults for failed fields
 */
function recoverPartialState(
  data: unknown,
  _error: ZodError,
): typeof DEFAULT_PERSISTED_STATE & { devices: Device[] } {
  const recovered = { ...DEFAULT_PERSISTED_STATE, devices: [] as Device[] };

  if (!data || typeof data !== "object") {
    return recovered;
  }

  // Cast to any for recovery purposes - we're validating each field manually
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const dataObj = data as any;

  // Try to recover UI preferences
  if (
    dataObj.themeMode &&
    ["light", "dark", "system"].includes(dataObj.themeMode)
  ) {
    recovered.themeMode = dataObj.themeMode;
  }
  if (
    dataObj.themeColor &&
    ["zinc", "blue", "green", "orange", "rose", "yellow"].includes(
      dataObj.themeColor,
    )
  ) {
    recovered.themeColor = dataObj.themeColor;
  }

  // Try to recover project data with best-effort validation
  try {
    if (Array.isArray(dataObj.presets)) {
      recovered.presets = dataObj.presets.filter(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (p: any) =>
          p &&
          typeof p === "object" &&
          typeof p.id === "string" &&
          typeof p.name === "string",
      );
    }
  } catch (e) {
    console.warn("Failed to recover presets:", e);
  }

  try {
    if (Array.isArray(dataObj.commands)) {
      recovered.commands = dataObj.commands.filter(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (c: any) =>
          c &&
          typeof c === "object" &&
          typeof c.id === "string" &&
          typeof c.name === "string",
      );
    }
  } catch (e) {
    console.warn("Failed to recover commands:", e);
  }

  try {
    if (Array.isArray(dataObj.sequences)) {
      recovered.sequences = dataObj.sequences.filter(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (s: any) =>
          s &&
          typeof s === "object" &&
          typeof s.id === "string" &&
          typeof s.name === "string",
      );
    }
  } catch (e) {
    console.warn("Failed to recover sequences:", e);
  }

  try {
    if (Array.isArray(dataObj.contexts)) {
      recovered.contexts = dataObj.contexts.filter(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (ctx: any) =>
          ctx &&
          typeof ctx === "object" &&
          typeof ctx.id === "string" &&
          typeof ctx.title === "string",
      );
    }
  } catch (e) {
    console.warn("Failed to recover contexts:", e);
  }

  // Try to recover devices
  try {
    if (Array.isArray(dataObj.devices)) {
      recovered.devices = dataObj.devices.filter(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (d: any) =>
          d &&
          typeof d === "object" &&
          typeof d.id === "string" &&
          typeof d.name === "string",
      );
    }
  } catch (e) {
    console.warn("Failed to recover devices:", e);
  }

  // Try to recover session data
  try {
    if (dataObj.sessions && typeof dataObj.sessions === "object") {
      recovered.sessions = dataObj.sessions;
    }
    if (typeof dataObj.activeSessionId === "string") {
      recovered.activeSessionId = dataObj.activeSessionId;
    }
  } catch (e) {
    console.warn("Failed to recover session data:", e);
  }

  // Recover loadedPresetId
  if (
    typeof dataObj.loadedPresetId === "string" ||
    dataObj.loadedPresetId === null
  ) {
    recovered.loadedPresetId = dataObj.loadedPresetId;
  }

  return recovered;
}

const tauriStorage = createSchemaAwareTauriStorage();

type AppState = UISlice & ProjectSlice & SessionSlice & DeviceSlice;

export const useStore = create<AppState>()(
  devtools(
    persist(
      (...a) => ({
        ...createUISlice(...a),
        ...createProjectSlice(...a),
        ...createSessionSlice(...a),
        ...createDeviceSlice(...a),
      }),
      {
        name: "serialport-store",
        storage: createJSONStorage(() => tauriStorage),
        merge: (persistedState, currentState) => {
          if (!persistedState || typeof persistedState !== "object") {
            return currentState;
          }

          try {
            // Validate the persisted state structure
            const validated =
              PersistedStoreStateSchema.safeParse(persistedState);

            if (validated.success === false) {
              console.error(
                "Invalid persisted state structure:",
                validated.error.errors,
              );
              return currentState;
            }

            const data = validated.data;

            // Check version and migrate if needed
            const persistedVersion = data.__version || "0.0.0";
            if (persistedVersion !== STORE_VERSION) {
              console.info(
                `Migrating store from ${persistedVersion} to ${STORE_VERSION}`,
              );
              // Future migration logic can go here
            }

            // Merge with care - only override with valid persisted data
            // Use type assertion to help TypeScript understand the merge
            const merged: AppState = { ...currentState };

            // UI preferences
            if (data.themeMode) merged.themeMode = data.themeMode;
            if (data.themeColor) merged.themeColor = data.themeColor;

            // Project data - cast to proper types since validation passed
            if (data.presets)
              merged.presets = data.presets as AppState["presets"];
            if (data.commands)
              merged.commands = data.commands as AppState["commands"];
            if (data.sequences)
              merged.sequences = data.sequences as AppState["sequences"];
            if (data.contexts)
              merged.contexts = data.contexts as AppState["contexts"];
            if (data.loadedPresetId !== undefined)
              merged.loadedPresetId = data.loadedPresetId;

            // Devices (Manually handled since not in main schema yet)
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const anyData = data as any;
            if (anyData.devices && Array.isArray(anyData.devices)) {
              merged.devices = anyData.devices as AppState["devices"];
            }

            // Session data - cast to proper types since validation passed
            if (data.sessions)
              merged.sessions = data.sessions as AppState["sessions"];
            if (data.activeSessionId)
              merged.activeSessionId = data.activeSessionId;

            return merged;
          } catch (error) {
            console.error("Error merging persisted state:", error);
            return currentState;
          }
        },
        // Only persist specific slices - avoid persisting runtime data like logs, toasts
        partialize: (state) => ({
          // UI preferences
          themeMode: state.themeMode,
          themeColor: state.themeColor,

          // Project data
          presets: state.presets,
          commands: state.commands,
          sequences: state.sequences,
          contexts: state.contexts,
          loadedPresetId: state.loadedPresetId,
          devices: state.devices,

          // Session configs only (not runtime state like isConnected, logs)
          sessions: Object.fromEntries(
            Object.entries(state.sessions).map(([id, session]) => [
              id,
              {
                ...session,
                isConnected: false, // Never persist connection state
              },
            ]),
          ),
          activeSessionId: state.activeSessionId,
        }),
      },
    ),
    {
      name: "SerialPort Manager",
      enabled: process.env.NODE_ENV === "development", // Only enable devtools in development
    },
  ),
);
