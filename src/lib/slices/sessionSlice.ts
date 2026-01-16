import { StateCreator } from "zustand";
import { generateId } from "../utils";
import { DEFAULT_CONFIG, DEFAULT_NETWORK_CONFIG } from "../defaults";
import { ProjectSlice } from "./projectSlice"; // Used for types or cross-slice logic if needed
import type {
  Session,
  SerialConfig,
  NetworkConfig,
  DataMode,
  TextEncoding,
  ChecksumAlgorithm,
  LogEntry,
  TelemetryVariable,
  ChatMessage,
  WidgetConfig,
  DashboardWidget,
  FramingConfig,
  PlotterConfig,
  PlotterDataPoint,
  PlotterState,
} from "../../types";

// Re-export types for convenience
export type {
  Session,
  SerialConfig,
  NetworkConfig,
  DataMode,
  TextEncoding,
  ChecksumAlgorithm,
  LogEntry,
  TelemetryVariable,
  ChatMessage,
  WidgetConfig,
  DashboardWidget,
  FramingConfig,
  PlotterConfig,
  PlotterDataPoint,
  PlotterState,
};

const HISTORY_BUFFER_SIZE = 200;
const MAX_PLOTTER_SERIES = 20;

const DEFAULT_PLOTTER_STATE: PlotterState = {
  config: {
    enabled: false,
    parser: "CSV",
    bufferSize: 1000,
    autoDiscover: true,
  },
  data: [],
  series: [],
  aliases: {},
};

// Helper to create a new session
const createSession = (name: string): Session => ({
  id: generateId(),
  name,
  connectionType: "SERIAL",
  config: { ...DEFAULT_CONFIG },
  networkConfig: { ...DEFAULT_NETWORK_CONFIG },
  isConnected: false,
  logs: [],
  variables: {},
  widgets: [], // Decoupled Widgets
  plotter: { ...DEFAULT_PLOTTER_STATE },
  inputBuffer: "",
  sendMode: "TEXT",
  encoding: "UTF-8",
  checksum: "NONE",
  aiMessages: [],
  aiTokenUsage: { prompt: 0, response: 0, total: 0 },
});

/**
 * Helper function to update active session with partial updates
 * Reduces verbose nested spread operators throughout the slice
 */
const updateActiveSession = <T extends Record<string, Session>>(
  state: { sessions: T; activeSessionId: string },
  updates: Partial<Session>,
): { sessions: T } => {
  const sessionId = state.activeSessionId;
  const session = state.sessions[sessionId];
  return {
    sessions: {
      ...state.sessions,
      [sessionId]: { ...session, ...updates },
    } as T,
  };
};

const initialSession = createSession("Session 1");

// State interface (all data fields)
export interface SessionSliceState {
  sessions: Record<string, Session>;
  activeSessionId: string;
}

// Actions interface (all methods)
export interface SessionSliceActions {
  addSession: () => void;
  removeSession: (id: string) => void;
  setActiveSessionId: (id: string) => void;
  renameSession: (id: string, name: string) => void;

  // Active Session Proxies
  setConfig: (
    updater: SerialConfig | ((prev: SerialConfig) => SerialConfig),
  ) => void;
  setNetworkConfig: (
    updater: NetworkConfig | ((prev: NetworkConfig) => NetworkConfig),
  ) => void;
  setConnectionType: (type: "SERIAL" | "NETWORK") => void;
  setIsConnected: (connected: boolean) => void;
  setPortName: (name: string) => void;

  setInputBuffer: (buffer: string) => void;
  setSendMode: (mode: DataMode) => void;
  setEncoding: (enc: TextEncoding) => void;
  setChecksum: (algo: ChecksumAlgorithm) => void;
  setFramingOverride: (framing?: FramingConfig) => void;

  addLog: (
    data: string | Uint8Array,
    direction: "TX" | "RX",
    contextIds?: string[],
    sessionId?: string,
    commandParams?: Record<string, any>,
    payloadStart?: number,
    payloadLength?: number,
  ) => string;
  updateLog: (
    id: string,
    updates: Partial<LogEntry>,
    sessionId?: string,
  ) => void;
  clearLogs: () => void;

  // Telemetry (Variables & Widgets)
  setVariable: (name: string, value: any, sessionId?: string) => void;
  // Widget Actions
  addWidget: (widget: Omit<DashboardWidget, "id" | "order">) => void;
  removeWidget: (widgetId: string) => void;
  updateWidget: (widgetId: string, updates: Partial<DashboardWidget>) => void;
  reorderWidgets: (widgetIds: string[]) => void;

  clearVariables: () => void; // Clears both variables and widgets
  applyPresetLayout: (sessionId: string, presetId: string) => void;

  // Plotter Actions
  setPlotterConfig: (updates: Partial<PlotterConfig>) => void;
  addPlotterData: (point: PlotterDataPoint) => void;
  clearPlotterData: () => void;
  setPlotterSeriesAlias: (seriesKey: string, alias: string) => void;

  // AI Chat State
  setAiMessages: (messages: ChatMessage[]) => void;
  addTokenUsage: (usage: { prompt: number; response: number }) => void;
}

// Complete slice: State & Actions
export type SessionSlice = SessionSliceState & SessionSliceActions;

// We need a combined type to access other slices via get()
type StoreState = SessionSlice & ProjectSlice;

export const createSessionSlice: StateCreator<
  StoreState,
  [],
  [],
  SessionSlice
> = (set, _get) => ({
  sessions: { [initialSession.id]: initialSession },
  activeSessionId: initialSession.id,

  addSession: () =>
    set((state) => {
      const count = Object.keys(state.sessions).length + 1;
      const newSession = createSession(`Session ${count}`);
      return {
        sessions: { ...state.sessions, [newSession.id]: newSession },
        activeSessionId: newSession.id,
      };
    }),

  removeSession: (id) =>
    set((state) => {
      const { [id]: removed, ...remaining } = state.sessions;
      const keys = Object.keys(remaining);
      if (keys.length === 0) {
        const newDefault = createSession("Session 1");
        return {
          sessions: { [newDefault.id]: newDefault },
          activeSessionId: newDefault.id,
        };
      }
      let nextActive = state.activeSessionId;
      if (state.activeSessionId === id) {
        nextActive = keys[keys.length - 1];
      }
      return { sessions: remaining, activeSessionId: nextActive };
    }),

  setActiveSessionId: (id) => set({ activeSessionId: id }),
  renameSession: (id, name) =>
    set((state) => ({
      sessions: { ...state.sessions, [id]: { ...state.sessions[id], name } },
    })),

  setConfig: (updater) =>
    set((state) => {
      const session = state.sessions[state.activeSessionId];
      const newConfig =
        typeof updater === "function" ? updater(session.config) : updater;
      return {
        sessions: {
          ...state.sessions,
          [session.id]: { ...session, config: newConfig },
        },
      };
    }),

  setNetworkConfig: (updater) =>
    set((state) => {
      const session = state.sessions[state.activeSessionId];
      const newConfig =
        typeof updater === "function"
          ? updater(session.networkConfig)
          : updater;
      return {
        sessions: {
          ...state.sessions,
          [session.id]: { ...session, networkConfig: newConfig },
        },
      };
    }),

  setConnectionType: (type) =>
    set((state) => updateActiveSession(state, { connectionType: type })),

  setIsConnected: (connected) =>
    set((state) => updateActiveSession(state, { isConnected: connected })),

  setPortName: (name) =>
    set((state) => updateActiveSession(state, { portName: name })),

  setInputBuffer: (buffer) =>
    set((state) => updateActiveSession(state, { inputBuffer: buffer })),

  setSendMode: (mode) =>
    set((state) => updateActiveSession(state, { sendMode: mode })),

  setEncoding: (enc) =>
    set((state) => updateActiveSession(state, { encoding: enc })),

  setChecksum: (algo) =>
    set((state) => updateActiveSession(state, { checksum: algo })),

  setFramingOverride: (framing) =>
    set((state) => updateActiveSession(state, { framingOverride: framing })),

  addLog: (
    data,
    direction,
    contextIds,
    sessionId,
    commandParams,
    payloadStart,
    payloadLength,
  ) => {
    const id = generateId();
    set((state) => {
      const targetId = sessionId || state.activeSessionId;
      const session = state.sessions[targetId];
      if (!session) return {};

      const entry: LogEntry = {
        id,
        timestamp: Date.now(),
        direction,
        data,
        format: typeof data === "string" ? "TEXT" : "HEX",
        contextIds,
        commandParams,
        payloadStart,
        payloadLength,
      };
      const newLogs = [...session.logs, entry].slice(
        -session.config.bufferSize,
      );
      return {
        sessions: {
          ...state.sessions,
          [targetId]: { ...session, logs: newLogs },
        },
      };
    });
    return id;
  },

  updateLog: (id, updates, sessionId) =>
    set((state) => {
      const targetId = sessionId || state.activeSessionId;
      const session = state.sessions[targetId];
      if (!session) return {};

      const newLogs = session.logs.map((l) =>
        l.id === id ? { ...l, ...updates } : l,
      );
      return {
        sessions: {
          ...state.sessions,
          [targetId]: { ...session, logs: newLogs },
        },
      };
    }),

  clearLogs: () =>
    set((state) => ({
      sessions: {
        ...state.sessions,
        [state.activeSessionId]: {
          ...state.sessions[state.activeSessionId],
          logs: [],
        },
      },
    })),

  setVariable: (name, value, sessionId) =>
    set((state) => {
      const targetId = sessionId || state.activeSessionId;
      const session = state.sessions[targetId];
      if (!session) return {};

      const timestamp = Date.now();
      const type =
        typeof value === "number"
          ? "number"
          : typeof value === "boolean"
            ? "boolean"
            : typeof value === "object"
              ? "object"
              : "string";
      const existing = session.variables[name];

      let history = existing?.history || [];

      if (type === "number") {
        history = [...history, { time: timestamp, val: value as number }].slice(
          -HISTORY_BUFFER_SIZE,
        );
      } else if (type === "boolean") {
        history = [...history, { time: timestamp, val: value ? 1 : 0 }].slice(
          -HISTORY_BUFFER_SIZE,
        );
      } else if (type === "object" && value !== null) {
        const numericKeys: any = { time: timestamp };
        let hasNumbers = false;
        Object.keys(value).forEach((k) => {
          if (typeof value[k] === "number") {
            numericKeys[k] = value[k];
            hasNumbers = true;
          }
        });
        if (hasNumbers) {
          history = [...history, numericKeys].slice(-HISTORY_BUFFER_SIZE);
        }
      }

      const newVar: TelemetryVariable = {
        name,
        value,
        type,
        lastUpdate: timestamp,
        history,
      };

      const newVariables = { ...session.variables, [name]: newVar };
      let newWidgets = session.widgets;

      const widgetExists = session.widgets.some((w) => w.variableName === name);
      if (!widgetExists) {
        const defaultWidget: DashboardWidget = {
          id: generateId(),
          title: name,
          variableName: name,
          config: { type: "CARD", width: 1 },
          order: session.widgets.length,
        };
        newWidgets = [...session.widgets, defaultWidget];
      }

      return {
        sessions: {
          ...state.sessions,
          [targetId]: {
            ...session,
            variables: newVariables,
            widgets: newWidgets,
          },
        },
      };
    }),

  addWidget: (widgetData) =>
    set((state) => {
      const session = state.sessions[state.activeSessionId];
      const newWidget: DashboardWidget = {
        id: generateId(),
        ...widgetData,
        order: session.widgets.length,
      };
      return {
        sessions: {
          ...state.sessions,
          [session.id]: {
            ...session,
            widgets: [...session.widgets, newWidget],
          },
        },
      };
    }),

  removeWidget: (widgetId) =>
    set((state) => {
      const session = state.sessions[state.activeSessionId];
      return {
        sessions: {
          ...state.sessions,
          [session.id]: {
            ...session,
            widgets: session.widgets.filter((w) => w.id !== widgetId),
          },
        },
      };
    }),

  updateWidget: (widgetId, updates) =>
    set((state) => {
      const session = state.sessions[state.activeSessionId];
      return {
        sessions: {
          ...state.sessions,
          [session.id]: {
            ...session,
            widgets: session.widgets.map((w) =>
              w.id === widgetId ? { ...w, ...updates } : w,
            ),
          },
        },
      };
    }),

  reorderWidgets: (ids) =>
    set((state) => {
      const session = state.sessions[state.activeSessionId];
      const newWidgets = [...session.widgets];

      const idMap = new Map(ids.map((id, index) => [id, index]));

      newWidgets.forEach((w) => {
        if (idMap.has(w.id)) {
          w.order = idMap.get(w.id)!;
        }
      });

      newWidgets.sort((a, b) => a.order - b.order);

      return {
        sessions: {
          ...state.sessions,
          [session.id]: {
            ...session,
            widgets: newWidgets,
          },
        },
      };
    }),

  clearVariables: () =>
    set((state) => ({
      sessions: {
        ...state.sessions,
        [state.activeSessionId]: {
          ...state.sessions[state.activeSessionId],
          variables: {},
          widgets: [], // Also clear widgets
        },
      },
    })),

  applyPresetLayout: (sessionId, presetId) =>
    set((state) => {
      const session = state.sessions[sessionId];
      const preset = state.presets.find((p) => p.id === presetId);

      if (!session || !preset || !preset.widgets) return {};

      const newVariables = { ...session.variables };
      preset.widgets.forEach((w) => {
        if (!newVariables[w.variableName]) {
          newVariables[w.variableName] = {
            name: w.variableName,
            type: "number", // Default assumption
            value: 0,
            lastUpdate: Date.now(),
            history: [],
          };
        }
      });

      const newWidgets = preset.widgets.map((w) => ({ ...w }));

      return {
        sessions: {
          ...state.sessions,
          [sessionId]: {
            ...session,
            widgets: newWidgets,
            variables: newVariables,
          },
        },
      };
    }),

  // Plotter Actions
  setPlotterConfig: (updates) =>
    set((state) => {
      const session = state.sessions[state.activeSessionId];
      const currentPlotter = session.plotter || { ...DEFAULT_PLOTTER_STATE };
      return {
        sessions: {
          ...state.sessions,
          [session.id]: {
            ...session,
            plotter: {
              ...currentPlotter,
              config: { ...currentPlotter.config, ...updates },
            },
          },
        },
      };
    }),

  addPlotterData: (point) =>
    set((state) => {
      const session = state.sessions[state.activeSessionId];
      // If plotter is undefined, we can't really add data if enabled is checked on undefined (which it isn't).
      // But if we want to be safe:
      const currentPlotter = session.plotter || { ...DEFAULT_PLOTTER_STATE };

      if (!currentPlotter.config.enabled) return {};

      // Update detected series with Limit Check
      const newSeries = new Set(currentPlotter.series);
      const filteredPoint: PlotterDataPoint = { time: point.time };

      Object.keys(point).forEach((key) => {
        if (key === "time") return;

        if (newSeries.has(key)) {
          filteredPoint[key] = point[key];
        } else if (newSeries.size < MAX_PLOTTER_SERIES) {
          newSeries.add(key);
          filteredPoint[key] = point[key];
        }
        // Else: Ignore new key if limit reached
      });

      const newData = [...currentPlotter.data, filteredPoint].slice(
        -currentPlotter.config.bufferSize,
      );

      return {
        sessions: {
          ...state.sessions,
          [session.id]: {
            ...session,
            plotter: {
              ...currentPlotter,
              data: newData,
              series: Array.from(newSeries),
            },
          },
        },
      };
    }),

  clearPlotterData: () =>
    set((state) => {
      const session = state.sessions[state.activeSessionId];
      const currentPlotter = session.plotter || { ...DEFAULT_PLOTTER_STATE };
      return {
        sessions: {
          ...state.sessions,
          [session.id]: {
            ...session,
            plotter: {
              ...currentPlotter,
              data: [],
              series: [],
            },
          },
        },
      };
    }),

  setPlotterSeriesAlias: (seriesKey, alias) =>
    set((state) => {
      const session = state.sessions[state.activeSessionId];
      const currentPlotter = session.plotter || { ...DEFAULT_PLOTTER_STATE };
      return {
        sessions: {
          ...state.sessions,
          [session.id]: {
            ...session,
            plotter: {
              ...currentPlotter,
              aliases: {
                ...currentPlotter.aliases,
                [seriesKey]: alias,
              },
            },
          },
        },
      };
    }),

  setAiMessages: (messages) =>
    set((state) => ({
      sessions: {
        ...state.sessions,
        [state.activeSessionId]: {
          ...state.sessions[state.activeSessionId],
          aiMessages: messages,
        },
      },
    })),

  addTokenUsage: (usage) =>
    set((state) => {
      const session = state.sessions[state.activeSessionId];
      const current = session.aiTokenUsage;
      return {
        sessions: {
          ...state.sessions,
          [session.id]: {
            ...session,
            aiTokenUsage: {
              prompt: current.prompt + usage.prompt,
              response: current.response + usage.response,
              total: current.total + usage.prompt + usage.response,
            },
          },
        },
      };
    }),
});
