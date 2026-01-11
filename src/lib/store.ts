import { create } from "zustand";
import { devtools, persist } from "zustand/middleware";
import { createUISlice, UISlice } from "./slices/uiSlice";
import { createProjectSlice, ProjectSlice } from "./slices/projectSlice";
import { createSessionSlice, SessionSlice } from "./slices/sessionSlice";

type AppState = UISlice & ProjectSlice & SessionSlice;

export const useStore = create<AppState>()(
  devtools(
    persist(
      (...a) => ({
        ...createUISlice(...a),
        ...createProjectSlice(...a),
        ...createSessionSlice(...a),
      }),
      {
        name: "serialport-store",
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

          // Session configs only (not runtime state like isConnected, logs)
          sessions: Object.fromEntries(
            Object.entries(state.sessions).map(([id, session]) => [
              id,
              {
                ...session,
                isConnected: false, // Never persist connection state
                logs: [], // Don't persist logs
                systemLogs: [], // Don't persist system logs
                aiMessages: [], // Don't persist AI chat history
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
