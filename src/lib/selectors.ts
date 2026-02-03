import { useStore } from "./store";

/**
 * Zustand Selectors for Optimized Re-renders
 *
 * These selectors allow components to subscribe to only the specific state slices they need,
 * preventing unnecessary re-renders when unrelated state changes.
 */

// --- Active Session Selectors ---

/**
 * Get only the active session's data (config, connection state, logs, etc.)
 * Use this when you need session-specific data but don't need actions
 */
export const useActiveSession = () =>
  useStore((state) => {
    const session = state.sessions[state.activeSessionId];
    return {
      config: session?.config,
      networkConfig: session?.networkConfig,
      sendMode: session?.sendMode,
      encoding: session?.encoding,
      checksum: session?.checksum,
      isConnected: session?.isConnected,
      connectionType: session?.connectionType,
      logs: session?.logs,
      widgets: session?.widgets,
      framingOverride: session?.framingOverride,
    };
  });

/**
 * Get only session metadata (id, name, connection status)
 * Useful for session tabs/switcher UI
 */
export const useSessionMetadata = () =>
  useStore((state) => ({
    sessions: Object.entries(state.sessions).map(([id, session]) => ({
      id,
      name: session.name,
      isConnected: session.isConnected,
      connectionType: session.connectionType,
    })),
    activeSessionId: state.activeSessionId,
  }));

/**
 * Get only the active session's connection state
 * Use when you only need to know if connected/disconnected
 */
export const useConnectionState = () =>
  useStore((state) => ({
    isConnected: state.sessions[state.activeSessionId]?.isConnected || false,
    connectionType:
      state.sessions[state.activeSessionId]?.connectionType || "SERIAL",
  }));

// --- Store Actions (Stable - Never Cause Re-renders) ---

/**
 * Get only store actions (no state)
 * These are stable references that don't change, so components using this won't re-render
 */
export const useStoreActions = () =>
  useStore((state) => ({
    // Config
    setConfig: state.setConfig,
    setNetworkConfig: state.setNetworkConfig,
    setConnectionType: state.setConnectionType,
    setSendMode: state.setSendMode,
    setEncoding: state.setEncoding,
    setChecksum: state.setChecksum,

    // Logs
    addLog: state.addLog,
    updateLog: state.updateLog,
    clearLogs: state.clearLogs,
    addSystemLog: state.addSystemLog,

    // Commands & Sequences
    addCommand: state.addCommand,
    updateCommand: state.updateCommand,
    deleteCommand: state.deleteCommand,
    setCommands: state.setCommands,
    addSequence: state.addSequence,
    updateSequence: state.updateSequence,
    deleteSequence: state.deleteSequence,
    setSequences: state.setSequences,

    // Sessions
    addSession: state.addSession,
    removeSession: state.removeSession,
    setActiveSessionId: state.setActiveSessionId,
    renameSession: state.renameSession,
    setIsConnected: state.setIsConnected,

    // UI State
    setEditingCommand: state.setEditingCommand,
    setEditingPreset: state.setEditingPreset,
    setPendingParamCommand: state.setPendingParamCommand,
    setShowGeneratorModal: state.setShowGeneratorModal,
    setActiveSequenceId: state.setActiveSequenceId,

    // Toasts
    addToast: state.addToast,
    removeToast: state.removeToast,

    // Other
    setPresets: state.setPresets,
    setLoadedPresetId: state.setLoadedPresetId,
    setVariable: state.setVariable,
    setFramingOverride: state.setFramingOverride,
    setContexts: state.setContexts,
    applyPresetLayout: state.applyPresetLayout,
  }));

// --- UI State Selectors ---

/**
 * Get theme settings
 */
export const useTheme = () =>
  useStore((state) => ({
    themeMode: state.themeMode,
    themeColor: state.themeColor,
  }));

/**
 * Get theme actions
 */
export const useThemeActions = () =>
  useStore((state) => ({
    setThemeMode: state.setThemeMode,
    setThemeColor: state.setThemeColor,
  }));

/**
 * Get modal states
 */
export const useModals = () =>
  useStore((state) => ({
    editingCommand: state.editingCommand,
    editingPreset: state.editingPreset,
    pendingParamCommand: state.pendingParamCommand,
    showGeneratorModal: state.showGeneratorModal,
    showSystemLogs: state.showSystemLogs,
    showAppSettings: state.showAppSettings,
  }));

/**
 * Get toasts
 */
export const useToasts = () => useStore((state) => state.toasts);

// --- Project Data Selectors ---

/**
 * Get commands (optionally filtered by context)
 */
export const useCommands = (contextId?: string) =>
  useStore((state) => {
    if (contextId) {
      return state.commands.filter((cmd) =>
        cmd.contextIds?.includes(contextId),
      );
    }
    return state.commands;
  });

/**
 * Get sequences
 */
export const useSequences = () => useStore((state) => state.sequences);

/**
 * Get presets
 */
export const usePresets = () =>
  useStore((state) => ({
    presets: state.presets,
    loadedPresetId: state.loadedPresetId,
  }));

/**
 * Get contexts
 */
export const useContexts = () => useStore((state) => state.contexts);

/**
 * Get active sequence ID
 */
export const useActiveSequenceId = () =>
  useStore((state) => state.activeSequenceId);

/**
 * Get system logs
 */
export const useSystemLogs = () => useStore((state) => state.systemLogs || []);

/**
 * Get variables for a session
 */
export const useVariables = () =>
  useStore((state) => state.sessions[state.activeSessionId]?.variables || {});

// --- Sidebar-Specific Selectors ---

/**
 * Get sidebar UI state (collapsed state, sections)
 */
export const useSidebarUIState = () =>
  useStore((state) => ({
    leftSidebarCollapsed: state.leftSidebarCollapsed,
    setLeftSidebarCollapsed: state.setLeftSidebarCollapsed,
    sidebarSectionsCollapsed: state.sidebarSectionsCollapsed,
    toggleSidebarSection: state.toggleSidebarSection,
  }));

/**
 * Get sidebar data (commands, sequences, devices, protocols)
 */
export const useSidebarData = () =>
  useStore((state) => ({
    commands: state.commands,
    sequences: state.sequences,
    devices: state.devices,
    protocols: state.protocols,
    selectedDeviceId: state.selectedDeviceId,
    selectedCommandId: state.selectedCommandId,
  }));

/**
 * Get sidebar actions for commands
 */
export const useSidebarCommandActions = () =>
  useStore((state) => ({
    addCommand: state.addCommand,
    deleteCommand: state.deleteCommand,
    deleteCommands: state.deleteCommands,
    setSelectedCommandId: state.setSelectedCommandId,
    setEditingCommand: state.setEditingCommand,
  }));

/**
 * Get sidebar actions for sequences
 */
export const useSidebarSequenceActions = () =>
  useStore((state) => ({
    addSequence: state.addSequence,
    updateSequence: state.updateSequence,
  }));

/**
 * Get sidebar actions for protocols
 */
export const useSidebarProtocolActions = () =>
  useStore((state) => ({
    protocols: state.protocols,
    addProtocol: state.addProtocol,
  }));

/**
 * Get sidebar actions for presets
 */
export const useSidebarPresetActions = () =>
  useStore((state) => ({
    presets: state.presets,
    loadedPresetId: state.loadedPresetId,
    setPresets: state.setPresets,
    setLoadedPresetId: state.setLoadedPresetId,
  }));

/**
 * Get sidebar actions for UI modals and tabs
 */
export const useSidebarUIActions = () =>
  useStore((state) => ({
    setRightSidebarTab: state.setRightSidebarTab,
    setShowSystemLogs: state.setShowSystemLogs,
    setShowAppSettings: state.setShowAppSettings,
    setShowAI: state.setShowAI,
    addToast: state.addToast,
  }));

/**
 * Get sidebar context data and actions
 */
export const useSidebarContexts = () =>
  useStore((state) => ({
    contexts: state.contexts,
    setContexts: state.setContexts,
  }));

/**
 * Get active session token usage (for AI token display in sidebar)
 */
export const useAITokenUsage = () =>
  useStore(
    (state) =>
      state.sessions[state.activeSessionId]?.aiTokenUsage || { total: 0 },
  );

/**
 * Get active session basic info (for sidebar preset handling)
 */
export const useActiveSessionBasicInfo = () =>
  useStore((state) => {
    const session = state.sessions[state.activeSessionId];
    return {
      connectionType: session?.connectionType || "SERIAL",
      config: session?.config,
      networkConfig: session?.networkConfig,
      widgets: session?.widgets || [],
    };
  });

// --- Right Sidebar-Specific Selectors ---

/**
 * Get right sidebar UI state
 */
export const useRightSidebarUIState = () =>
  useStore((state) => ({
    rightSidebarTab: state.rightSidebarTab,
    setRightSidebarTab: state.setRightSidebarTab,
    rightSidebarCollapsed: state.rightSidebarCollapsed,
    setRightSidebarCollapsed: state.setRightSidebarCollapsed,
    selectedCommandId: state.selectedCommandId,
    selectedDeviceId: state.selectedDeviceId,
    editingCommand: state.editingCommand,
    setEditingCommand: state.setEditingCommand,
  }));

/**
 * Get command by ID (for right sidebar command lookup)
 * Returns undefined if not found - avoids subscribing to entire commands array
 */
export const useCommandById = (commandId: string | null) =>
  useStore((state) => {
    if (!commandId) return undefined;
    return state.commands.find((c) => c.id === commandId);
  });

/**
 * Get right sidebar command actions
 */
export const useRightSidebarCommandActions = () =>
  useStore((state) => ({
    updateCommand: state.updateCommand,
    deleteCommand: state.deleteCommand,
    setSelectedCommandId: state.setSelectedCommandId,
    addToast: state.addToast,
  }));
