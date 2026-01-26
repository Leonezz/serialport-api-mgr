import { create } from "zustand";
import { createJSONStorage, devtools, persist } from "zustand/middleware";
import { z, ZodError } from "zod";
import { createUISlice, UISlice } from "./slices/uiSlice";
import { createProjectSlice, ProjectSlice } from "./slices/projectSlice";
import { createSessionSlice, SessionSlice } from "./slices/sessionSlice";
import { createDeviceSlice, DeviceSlice } from "./slices/deviceSlice";
import { createProtocolSlice, ProtocolSlice } from "./slices/protocolSlice";
import { LazyStore } from "@tauri-apps/plugin-store";
import {
  PersistedStoreStateSchema,
  STORE_VERSION,
  DEFAULT_PERSISTED_STATE,
} from "./storeSchemas";
import { DeviceSchema } from "./schemas";
import {
  SerialPreset,
  SavedCommand,
  SerialSequence,
  ProjectContext,
  ThemeColor,
} from "../types";
import type { Protocol } from "./protocolTypes";
import { IS_TAURI } from "./tauriEnv";

// Only create LazyStore if running in Tauri (uses official isTauri() API)
const store = IS_TAURI ? new LazyStore("settings.json") : null;

type Device = z.infer<typeof DeviceSchema>;

/**
 * localStorage fallback for browser mode (when Tauri is not available)
 */
const createLocalStorageFallback = () => {
  const STORAGE_KEY = "serialport-store-fallback";
  return {
    getItem: async (name: string): Promise<string | null> => {
      try {
        const key = `${STORAGE_KEY}-${name}`;
        const rawData = localStorage.getItem(key);
        if (!rawData) return null;

        const parsedData = JSON.parse(rawData);
        const validationResult =
          PersistedStoreStateSchema.safeParse(parsedData);

        if (validationResult.success === false) {
          console.warn(
            "[LocalStorage] Validation failed, attempting recovery...",
          );
          const recovered = recoverPartialState(
            parsedData,
            validationResult.error,
          );
          const recoveredJson = JSON.stringify(recovered);
          localStorage.setItem(key, recoveredJson);
          return recoveredJson;
        }

        if (!validationResult.data.__version) {
          validationResult.data.__version = STORE_VERSION;
        }

        return rawData;
      } catch (error) {
        console.error("[LocalStorage] Error loading:", error);
        return null;
      }
    },

    setItem: async (name: string, value: string): Promise<void> => {
      try {
        const key = `${STORAGE_KEY}-${name}`;
        const parsedValue = JSON.parse(value);
        const versionedValue = { ...parsedValue, __version: STORE_VERSION };
        localStorage.setItem(key, JSON.stringify(versionedValue));
      } catch (error) {
        console.error("[LocalStorage] Error saving:", error);
      }
    },

    removeItem: async (name: string): Promise<void> => {
      const key = `${STORAGE_KEY}-${name}`;
      localStorage.removeItem(key);
    },
  };
};

/**
 * Schema-aware Tauri storage with validation and error recovery
 */
const createSchemaAwareTauriStorage = () => {
  // Use localStorage fallback if not running in Tauri build
  if (!store) {
    console.info(
      "[Store] Running in browser mode (non-Tauri build), using localStorage fallback for persistence",
    );
    return createLocalStorageFallback();
  }

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
): typeof DEFAULT_PERSISTED_STATE & {
  devices: Device[];
  protocols: Protocol[];
} {
  const recovered = {
    ...DEFAULT_PERSISTED_STATE,
    devices: [] as Device[],
    protocols: [] as Protocol[],
  };

  if (!data || typeof data !== "object") {
    return recovered;
  }

  // Cast to any for recovery purposes - we're validating each field manually
  // Cast to specific record type for recovery
  const dataObj = data as Record<string, unknown>;

  // Try to recover UI preferences
  if (
    typeof dataObj.themeMode === "string" &&
    ["light", "dark", "system"].includes(dataObj.themeMode)
  ) {
    recovered.themeMode = dataObj.themeMode as "light" | "dark" | "system";
  }
  if (
    typeof dataObj.themeColor === "string" &&
    ["zinc", "blue", "green", "orange", "rose", "yellow"].includes(
      dataObj.themeColor,
    )
  ) {
    recovered.themeColor = dataObj.themeColor as ThemeColor;
  }

  // Try to recover project data with best-effort validation
  try {
    if (Array.isArray(dataObj.presets)) {
      recovered.presets = dataObj.presets.filter(
        (p: unknown) =>
          p &&
          typeof p === "object" &&
          typeof (p as Record<string, unknown>).id === "string" &&
          typeof (p as Record<string, unknown>).name === "string",
      ) as SerialPreset[];
    }
  } catch (e) {
    console.warn("Failed to recover presets:", e);
  }

  try {
    if (Array.isArray(dataObj.commands)) {
      recovered.commands = dataObj.commands.filter(
        (c: unknown) =>
          c &&
          typeof c === "object" &&
          typeof (c as Record<string, unknown>).id === "string" &&
          typeof (c as Record<string, unknown>).name === "string",
      ) as SavedCommand[];
    }
  } catch (e) {
    console.warn("Failed to recover commands:", e);
  }

  try {
    if (Array.isArray(dataObj.sequences)) {
      recovered.sequences = dataObj.sequences.filter(
        (s: unknown) =>
          s &&
          typeof s === "object" &&
          typeof (s as Record<string, unknown>).id === "string" &&
          typeof (s as Record<string, unknown>).name === "string",
      ) as SerialSequence[];
    }
  } catch (e) {
    console.warn("Failed to recover sequences:", e);
  }

  try {
    if (Array.isArray(dataObj.contexts)) {
      recovered.contexts = dataObj.contexts.filter(
        (ctx: unknown) =>
          ctx &&
          typeof ctx === "object" &&
          typeof (ctx as Record<string, unknown>).id === "string" &&
          typeof (ctx as Record<string, unknown>).title === "string",
      ) as ProjectContext[];
    }
  } catch (e) {
    console.warn("Failed to recover contexts:", e);
  }

  // Try to recover devices
  try {
    if (Array.isArray(dataObj.devices)) {
      recovered.devices = dataObj.devices.filter(
        (d: unknown) =>
          d &&
          typeof d === "object" &&
          typeof (d as Record<string, unknown>).id === "string" &&
          typeof (d as Record<string, unknown>).name === "string",
      ) as Device[];
    }
  } catch (e) {
    console.warn("Failed to recover devices:", e);
  }

  // Try to recover protocols
  try {
    if (Array.isArray(dataObj.protocols)) {
      recovered.protocols = dataObj.protocols.filter(
        (p: unknown) =>
          p &&
          typeof p === "object" &&
          typeof (p as Record<string, unknown>).id === "string" &&
          typeof (p as Record<string, unknown>).name === "string",
      ) as Protocol[];
    }
  } catch (e) {
    console.warn("Failed to recover protocols:", e);
  }

  // Try to recover session data
  try {
    if (dataObj.sessions && typeof dataObj.sessions === "object") {
      // We can't easily validate the entire session record here, so we cast it
      // This is a recovery mechanism, so partial validity is better than nothing
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      recovered.sessions = dataObj.sessions as any;
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
    recovered.loadedPresetId = dataObj.loadedPresetId as string | null;
  }

  return recovered;
}

const tauriStorage = createSchemaAwareTauriStorage();

type AppState = UISlice &
  ProjectSlice &
  SessionSlice &
  DeviceSlice &
  ProtocolSlice;

export const useStore = create<AppState>()(
  devtools(
    persist(
      (...a) => ({
        ...createUISlice(...a),
        ...createProjectSlice(...a),
        ...createSessionSlice(...a),
        ...createDeviceSlice(...a),
        ...createProtocolSlice(...a),
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
            if (data.sidebarSectionsCollapsed)
              merged.sidebarSectionsCollapsed =
                data.sidebarSectionsCollapsed as Record<string, boolean>;

            // Project data - cast to proper types since validation passed
            // Only override defaults if persisted data has items (prevent empty arrays from clearing defaults)
            if (data.presets && data.presets.length > 0)
              merged.presets = data.presets as AppState["presets"];
            if (data.commands && data.commands.length > 0)
              merged.commands = data.commands as AppState["commands"];
            if (data.sequences && data.sequences.length > 0)
              merged.sequences = data.sequences as AppState["sequences"];
            if (data.contexts && data.contexts.length > 0)
              merged.contexts = data.contexts as AppState["contexts"];
            if (data.loadedPresetId !== undefined)
              merged.loadedPresetId = data.loadedPresetId;

            // Devices (Manually handled since not in main schema yet)
            const anyData = data as Record<string, unknown>;
            if (anyData.devices && Array.isArray(anyData.devices)) {
              merged.devices = anyData.devices as AppState["devices"];
            }

            // Protocol system data (new)
            if (anyData.protocols && Array.isArray(anyData.protocols)) {
              merged.protocols = anyData.protocols as AppState["protocols"];
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
          sidebarSectionsCollapsed: state.sidebarSectionsCollapsed,

          // Legacy project data (keeping for backward compatibility during migration)
          presets: state.presets,
          commands: state.commands,
          sequences: state.sequences,
          contexts: state.contexts,
          loadedPresetId: state.loadedPresetId,
          devices: state.devices,

          // New protocol system data
          protocols: state.protocols,

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
