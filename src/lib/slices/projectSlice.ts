import { StateCreator } from "zustand";
import { generateId } from "../utils";
import { DEFAULT_COMMANDS, DEFAULT_PRESETS } from "../defaults";
import type {
  SerialPreset,
  SavedCommand,
  SerialSequence,
  ProjectContext,
} from "../../types";

// Re-export types for convenience
export type { SerialPreset, SavedCommand, SerialSequence, ProjectContext };

// State interface (all data fields)
export interface ProjectSliceState {
  presets: SerialPreset[];
  commands: SavedCommand[];
  sequences: SerialSequence[];
  contexts: ProjectContext[];
}

// Actions interface (all methods)
export interface ProjectSliceActions {
  setPresets: (
    presets: SerialPreset[] | ((prev: SerialPreset[]) => SerialPreset[]),
  ) => void;
  setCommands: (
    commands: SavedCommand[] | ((prev: SavedCommand[]) => SavedCommand[]),
  ) => void;
  setSequences: (
    sequences:
      | SerialSequence[]
      | ((prev: SerialSequence[]) => SerialSequence[]),
  ) => void;
  setContexts: (
    contexts: ProjectContext[] | ((prev: ProjectContext[]) => ProjectContext[]),
  ) => void;

  // CRUD
  addCommand: (cmdData: Omit<SavedCommand, "id">) => string;
  updateCommand: (id: string, updates: Partial<SavedCommand>) => void;
  deleteCommand: (id: string) => void;
  deleteCommands: (ids: string[]) => void;

  addSequence: (seqData: Omit<SerialSequence, "id">) => void;
  updateSequence: (id: string, updates: Partial<SerialSequence>) => void;
  deleteSequence: (id: string) => void;
}

// Complete slice: State & Actions
export type ProjectSlice = ProjectSliceState & ProjectSliceActions;

export const createProjectSlice: StateCreator<ProjectSlice> = (set) => ({
  presets: DEFAULT_PRESETS,
  commands: DEFAULT_COMMANDS,
  sequences: [],
  contexts: [],

  setPresets: (updater) =>
    set((state) => ({
      presets: typeof updater === "function" ? updater(state.presets) : updater,
    })),
  setCommands: (updater) =>
    set((state) => ({
      commands:
        typeof updater === "function" ? updater(state.commands) : updater,
    })),
  setSequences: (updater) =>
    set((state) => ({
      sequences:
        typeof updater === "function" ? updater(state.sequences) : updater,
    })),
  setContexts: (updater) =>
    set((state) => ({
      contexts:
        typeof updater === "function" ? updater(state.contexts) : updater,
    })),

  addCommand: (cmdData) => {
    const timestamp = Date.now();
    const id = generateId();
    const newCmd: SavedCommand = {
      id,
      ...cmdData,
      creator: "User",
      createdAt: timestamp,
      updatedAt: timestamp,
      usedBy: [],
    };
    set((state) => ({ commands: [...state.commands, newCmd] }));
    return id;
  },
  updateCommand: (id, updates) =>
    set((state) => ({
      commands: state.commands.map((c) =>
        c.id === id ? { ...c, ...updates, updatedAt: Date.now() } : c,
      ),
    })),
  deleteCommand: (id) =>
    set((state) => ({
      commands: state.commands.filter((c) => c.id !== id),
    })),
  deleteCommands: (ids) =>
    set((state) => ({
      commands: state.commands.filter((c) => !ids.includes(c.id)),
    })),

  addSequence: (seqData) => {
    const timestamp = Date.now();
    const newSeq: SerialSequence = {
      id: generateId(),
      ...seqData,
      creator: "User",
      createdAt: timestamp,
      updatedAt: timestamp,
    };
    set((state) => ({ sequences: [...state.sequences, newSeq] }));
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
});
