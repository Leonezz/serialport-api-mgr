import { StateCreator } from "zustand";
import { generateId } from "../utils";
import { ToastMessage } from "../../components/ui/Toast";
import type {
  Device,
  LogCategory,
  LogLevel,
  RightSidebarTab,
  SavedCommand,
  SerialPreset,
  SystemLogEntry,
  ThemeColor,
  ThemeMode,
} from "../../types";

// Re-export types for convenience

// Infer slice-specific types from schemas

// State interface (all data fields),
export interface UISliceState {
  // Appearance
  themeMode: ThemeMode;
  themeColor: ThemeColor;

  // System Logs & Toasts
  systemLogs: SystemLogEntry[];
  toasts: ToastMessage[];

  // Modal & Visibility State
  editingCommand: Partial<SavedCommand> | null;
  isCommandModalOpen: boolean;
  editingPreset: SerialPreset | null;
  editingDevice: Partial<Device> | null;
  showDeviceModal: boolean;
  selectedDeviceId: string | null;
  pendingParamCommand: SavedCommand | null;
  showGeneratorModal: boolean;
  showSystemLogs: boolean;
  showAppSettings: boolean;
  showAI: boolean;
  activeSequenceId: string | null;
  loadedPresetId: string | null;
  selectedCommandId: string | null;
  rightSidebarTab: RightSidebarTab;
  leftSidebarCollapsed: boolean;
  rightSidebarCollapsed: boolean;
  sidebarSectionsCollapsed: Record<string, boolean>;
  lastProtocolSyncTimestamp: number | null;
}

// Actions interface (all methods)
export interface UISliceActions {
  // Appearance
  setThemeMode: (mode: ThemeMode) => void;
  setThemeColor: (color: ThemeColor) => void;

  // System Logs
  addSystemLog: (
    level: LogLevel,
    category: LogCategory,
    message: string,
    details?: unknown,
  ) => void;
  clearSystemLogs: () => void;

  // Toasts
  addToast: (
    type: ToastMessage["type"],
    title: string,
    message: string,
    options?: {
      action?: { label: string; onClick: () => void };
      duration?: number;
    },
  ) => void;
  removeToast: (id: string) => void;

  // Modals & Visibility State
  setEditingCommand: (cmd: Partial<SavedCommand> | null) => void;
  setIsCommandModalOpen: (open: boolean) => void;
  setEditingPreset: (preset: SerialPreset | null) => void;
  setEditingDevice: (device: Partial<Device> | null) => void;
  setShowDeviceModal: (show: boolean) => void;
  setSelectedDeviceId: (id: string | null) => void;
  setPendingParamCommand: (cmd: SavedCommand | null) => void;
  setShowGeneratorModal: (show: boolean) => void;
  setShowSystemLogs: (show: boolean) => void;
  setShowAppSettings: (show: boolean) => void;
  setShowAI: (show: boolean) => void;
  setActiveSequenceId: (id: string | null) => void;
  setLoadedPresetId: (id: string | null) => void;
  setSelectedCommandId: (id: string | null) => void;
  setRightSidebarTab: (tab: RightSidebarTab) => void;
  setLeftSidebarCollapsed: (collapsed: boolean) => void;
  setRightSidebarCollapsed: (collapsed: boolean) => void;
  toggleSidebarSection: (section: string) => void;
  setLastProtocolSyncTimestamp: (timestamp: number | null) => void;
}

// Complete slice: State & Actions
export type UISlice = UISliceState & UISliceActions;

export const createUISlice: StateCreator<UISlice> = (set) => ({
  themeMode: "system",
  themeColor: "zinc",
  setThemeMode: (mode) => set({ themeMode: mode }),
  setThemeColor: (color) => set({ themeColor: color }),

  systemLogs: [],
  addSystemLog: (level, category, message, details) =>
    set((state) => ({
      systemLogs: [
        {
          id: generateId(),
          timestamp: Date.now(),
          level,
          category,
          message,
          details,
        },
        ...state.systemLogs,
      ].slice(0, 1000),
    })),
  clearSystemLogs: () => set({ systemLogs: [] }),

  toasts: [],
  addToast: (type, title, message, options) => {
    const id = generateId();
    set((state) => ({
      toasts: [
        ...state.toasts,
        {
          id,
          type,
          title,
          message,
          action: options?.action,
          duration: options?.duration,
        },
      ],
    }));
  },
  removeToast: (id) =>
    set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) })),

  editingCommand: null,
  isCommandModalOpen: false,
  editingPreset: null,
  editingDevice: null,
  showDeviceModal: false,
  selectedDeviceId: null,
  pendingParamCommand: null,
  showGeneratorModal: false,
  showSystemLogs: false,
  showAppSettings: false,
  showAI: false,
  activeSequenceId: null,
  loadedPresetId: null,
  selectedCommandId: null,
  rightSidebarTab: "ai",
  leftSidebarCollapsed: false,
  rightSidebarCollapsed: false,
  sidebarSectionsCollapsed: {
    devices: false,
    protocols: false,
    commands: false,
    sequences: false,
  },
  lastProtocolSyncTimestamp: null,

  setEditingCommand: (cmd) => set({ editingCommand: cmd }),
  setIsCommandModalOpen: (open) => set({ isCommandModalOpen: open }),
  setEditingPreset: (preset) => set({ editingPreset: preset }),
  setEditingDevice: (device) => set({ editingDevice: device }),
  setShowDeviceModal: (show) => set({ showDeviceModal: show }),
  setSelectedDeviceId: (id) => set({ selectedDeviceId: id }),
  setPendingParamCommand: (cmd) => set({ pendingParamCommand: cmd }),
  setShowGeneratorModal: (show) => set({ showGeneratorModal: show }),
  setShowSystemLogs: (show) => set({ showSystemLogs: show }),
  setShowAppSettings: (show) => set({ showAppSettings: show }),
  setShowAI: (show) => set({ showAI: show }),
  setActiveSequenceId: (id) => set({ activeSequenceId: id }),
  setLoadedPresetId: (id) => set({ loadedPresetId: id }),
  setSelectedCommandId: (id) => set({ selectedCommandId: id }),
  setRightSidebarTab: (tab) => set({ rightSidebarTab: tab }),
  setLeftSidebarCollapsed: (collapsed) =>
    set({ leftSidebarCollapsed: collapsed }),
  setRightSidebarCollapsed: (collapsed) =>
    set({ rightSidebarCollapsed: collapsed }),
  toggleSidebarSection: (section) =>
    set((state) => ({
      sidebarSectionsCollapsed: {
        ...state.sidebarSectionsCollapsed,
        [section]: !state.sidebarSectionsCollapsed[section],
      },
    })),
  setLastProtocolSyncTimestamp: (timestamp) =>
    set({ lastProtocolSyncTimestamp: timestamp }),
});
