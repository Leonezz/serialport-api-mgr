import { describe, it, expect, beforeEach } from "vitest";
import { useStore } from "@/lib/store";
import { act, renderHook } from "@testing-library/react";
import {
  DataMode,
  TextEncoding,
  ChecksumAlgorithm,
  SerialPreset,
} from "@/types";

describe("Zustand Store", () => {
  beforeEach(() => {
    // Reset store state between tests
    const store = useStore.getState();
    useStore.setState(store);
  });

  describe("Session Management", () => {
    it("should have initial session on store creation", () => {
      const { result } = renderHook(() => useStore());

      expect(Object.keys(result.current.sessions).length).toBeGreaterThan(0);
      expect(result.current.activeSessionId).toBeTruthy();
    });

    it("should add new session", () => {
      const { result } = renderHook(() => useStore());

      const initialCount = Object.keys(result.current.sessions).length;

      act(() => {
        result.current.addSession();
      });

      expect(Object.keys(result.current.sessions).length).toBe(
        initialCount + 1,
      );
    });

    it("should remove session", () => {
      const { result } = renderHook(() => useStore());

      // Add a new session first
      act(() => {
        result.current.addSession();
      });

      const sessionIds = Object.keys(result.current.sessions);
      const sessionToRemove = sessionIds[sessionIds.length - 1];

      act(() => {
        result.current.removeSession(sessionToRemove);
      });

      expect(result.current.sessions[sessionToRemove]).toBeUndefined();
    });

    it("should switch active session", () => {
      const { result } = renderHook(() => useStore());

      // Add a new session
      act(() => {
        result.current.addSession();
      });

      const sessionIds = Object.keys(result.current.sessions);
      const newSessionId = sessionIds[sessionIds.length - 1];

      act(() => {
        result.current.setActiveSessionId(newSessionId);
      });

      expect(result.current.activeSessionId).toBe(newSessionId);
    });

    it("should rename session", () => {
      const { result } = renderHook(() => useStore());

      const activeId = result.current.activeSessionId;
      const newName = "My Custom Session";

      act(() => {
        result.current.renameSession(activeId, newName);
      });

      expect(result.current.sessions[activeId].name).toBe(newName);
    });
  });

  describe("Theme Management (UI Slice)", () => {
    it("should update theme mode", () => {
      const { result } = renderHook(() => useStore());

      act(() => {
        result.current.setThemeMode("dark");
      });

      expect(result.current.themeMode).toBe("dark");
    });

    it("should update theme color", () => {
      const { result } = renderHook(() => useStore());

      act(() => {
        result.current.setThemeColor("blue");
      });

      expect(result.current.themeColor).toBe("blue");
    });

    it("should update right sidebar tab", () => {
      const { result } = renderHook(() => useStore());

      act(() => {
        result.current.setRightSidebarTab("basic");
      });

      expect(result.current.rightSidebarTab).toBe("basic");
    });
  });

  describe("Commands Management (Project Slice)", () => {
    it("should add command", () => {
      const { result } = renderHook(() => useStore());

      const newCommand = {
        name: "Test Command",
        payload: "TEST",
        mode: "TEXT" as DataMode,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      act(() => {
        result.current.addCommand(newCommand);
      });

      const addedCommand = result.current.commands.find(
        (c) => c.name === "Test Command",
      );

      expect(addedCommand).toBeDefined();
      expect(addedCommand?.payload).toBe("TEST");
      expect(addedCommand?.id).toBeTruthy();
    });

    it("should update command", () => {
      const { result } = renderHook(() => useStore());

      // Add a command first
      const newCommand = {
        name: "Original",
        payload: "OLD",
        mode: "TEXT" as DataMode,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      let commandId: string;

      act(() => {
        result.current.addCommand(newCommand);
        commandId =
          result.current.commands[result.current.commands.length - 1].id;
      });

      // Update the command
      act(() => {
        result.current.updateCommand(commandId!, { payload: "NEW" });
      });

      const updated = result.current.commands.find((c) => c.id === commandId);
      expect(updated?.payload).toBe("NEW");
    });

    it("should delete command", () => {
      const { result } = renderHook(() => useStore());

      // Add a command first
      const newCommand = {
        name: "To Delete",
        payload: "DELETE_ME",
        mode: "TEXT" as DataMode,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      let commandId: string;

      act(() => {
        result.current.addCommand(newCommand);
        commandId =
          result.current.commands[result.current.commands.length - 1].id;
      });

      const countBefore = result.current.commands.length;

      act(() => {
        result.current.deleteCommand(commandId!);
      });

      expect(result.current.commands.length).toBe(countBefore - 1);
      expect(
        result.current.commands.find((c) => c.id === commandId),
      ).toBeUndefined();
    });
  });

  describe("Serial Config Updates", () => {
    it("should update baud rate", () => {
      const { result } = renderHook(() => useStore());

      const activeId = result.current.activeSessionId;

      act(() => {
        result.current.setConfig((prev) => ({
          ...prev,
          baudRate: 115200,
        }));
      });

      expect(result.current.sessions[activeId].config.baudRate).toBe(115200);
    });

    it("should update connection type", () => {
      const { result } = renderHook(() => useStore());

      const activeId = result.current.activeSessionId;

      act(() => {
        result.current.setConnectionType("NETWORK");
      });

      expect(result.current.sessions[activeId].connectionType).toBe("NETWORK");
    });

    it("should update network config", () => {
      const { result } = renderHook(() => useStore());

      const activeId = result.current.activeSessionId;

      act(() => {
        result.current.setNetworkConfig({
          host: "192.168.1.100",
          port: 8080,
        });
      });

      expect(result.current.sessions[activeId].networkConfig.host).toBe(
        "192.168.1.100",
      );
      expect(result.current.sessions[activeId].networkConfig.port).toBe(8080);
    });

    it("should update connection state", () => {
      const { result } = renderHook(() => useStore());

      const activeId = result.current.activeSessionId;

      act(() => {
        result.current.setIsConnected(true);
      });

      expect(result.current.sessions[activeId].isConnected).toBe(true);

      act(() => {
        result.current.setIsConnected(false);
      });

      expect(result.current.sessions[activeId].isConnected).toBe(false);
    });
  });

  describe("Input State Management", () => {
    it("should update input buffer", () => {
      const { result } = renderHook(() => useStore());

      const activeId = result.current.activeSessionId;

      act(() => {
        result.current.setInputBuffer("Hello World");
      });

      expect(result.current.sessions[activeId].inputBuffer).toBe("Hello World");
    });

    it("should update send mode", () => {
      const { result } = renderHook(() => useStore());

      const activeId = result.current.activeSessionId;

      act(() => {
        result.current.setSendMode("HEX");
      });

      expect(result.current.sessions[activeId].sendMode).toBe("HEX");
    });

    it("should update encoding", () => {
      const { result } = renderHook(() => useStore());

      const activeId = result.current.activeSessionId;

      act(() => {
        result.current.setEncoding("ASCII");
      });

      expect(result.current.sessions[activeId].encoding).toBe("ASCII");
    });

    it("should update checksum algorithm", () => {
      const { result } = renderHook(() => useStore());

      const activeId = result.current.activeSessionId;

      act(() => {
        result.current.setChecksum("CRC16");
      });

      expect(result.current.sessions[activeId].checksum).toBe("CRC16");
    });
  });

  describe("Logs Management", () => {
    it("should add log entry", () => {
      const { result } = renderHook(() => useStore());

      const activeId = result.current.activeSessionId;
      const initialCount = result.current.sessions[activeId].logs.length;

      let logId: string;

      act(() => {
        logId = result.current.addLog("Test data", "TX");
      });

      expect(result.current.sessions[activeId].logs.length).toBe(
        initialCount + 1,
      );
      const addedLog = result.current.sessions[activeId].logs.find(
        (l) => l.id === logId!,
      );
      expect(addedLog).toBeDefined();
      expect(addedLog?.data).toBe("Test data");
      expect(addedLog?.direction).toBe("TX");
    });

    it("should add log with binary data", () => {
      const { result } = renderHook(() => useStore());

      const activeId = result.current.activeSessionId;
      const binaryData = new Uint8Array([0x01, 0x02, 0x03]);

      let logId: string;

      act(() => {
        logId = result.current.addLog(binaryData, "RX");
      });

      const addedLog = result.current.sessions[activeId].logs.find(
        (l) => l.id === logId!,
      );
      expect(addedLog?.data).toBeInstanceOf(Uint8Array);
      expect(Array.from(addedLog?.data as Uint8Array)).toEqual([1, 2, 3]);
    });

    it("should update log entry", () => {
      const { result } = renderHook(() => useStore());

      const activeId = result.current.activeSessionId;

      let logId: string;

      act(() => {
        logId = result.current.addLog("Original", "TX");
      });

      act(() => {
        result.current.updateLog(logId!, { data: "Updated" });
      });

      const updated = result.current.sessions[activeId].logs.find(
        (l) => l.id === logId!,
      );
      expect(updated?.data).toBe("Updated");
    });

    it("should clear all logs", () => {
      const { result } = renderHook(() => useStore());

      const activeId = result.current.activeSessionId;

      act(() => {
        result.current.addLog("Log 1", "TX");
        result.current.addLog("Log 2", "RX");
        result.current.addLog("Log 3", "TX");
      });

      expect(result.current.sessions[activeId].logs.length).toBeGreaterThan(0);

      act(() => {
        result.current.clearLogs();
      });

      expect(result.current.sessions[activeId].logs.length).toBe(0);
    });
  });

  describe("Variables and Widgets", () => {
    it("should set variable", () => {
      const { result } = renderHook(() => useStore());

      const activeId = result.current.activeSessionId;

      act(() => {
        result.current.setVariable("temperature", 25.5);
      });

      expect(
        result.current.sessions[activeId].variables["temperature"],
      ).toBeDefined();
      expect(
        result.current.sessions[activeId].variables["temperature"].value,
      ).toBe(25.5);
    });

    it("should add widget", () => {
      const { result } = renderHook(() => useStore());

      const activeId = result.current.activeSessionId;
      const initialCount = result.current.sessions[activeId].widgets.length;

      act(() => {
        result.current.addWidget({
          title: "Temperature",
          variableName: "temp",
          config: { type: "CARD", width: 1 },
        });
      });

      expect(result.current.sessions[activeId].widgets.length).toBe(
        initialCount + 1,
      );
      const added = result.current.sessions[activeId].widgets.find(
        (w) => w.title === "Temperature",
      );
      expect(added).toBeDefined();
      expect(added?.id).toBeTruthy();
    });

    it("should remove widget", () => {
      const { result } = renderHook(() => useStore());

      const activeId = result.current.activeSessionId;

      let widgetId: string;

      act(() => {
        result.current.addWidget({
          title: "To Remove",
          variableName: "test",
          config: { type: "CARD", width: 1 },
        });
        widgetId =
          result.current.sessions[activeId].widgets[
            result.current.sessions[activeId].widgets.length - 1
          ].id;
      });

      const countBefore = result.current.sessions[activeId].widgets.length;

      act(() => {
        result.current.removeWidget(widgetId!);
      });

      expect(result.current.sessions[activeId].widgets.length).toBe(
        countBefore - 1,
      );
      expect(
        result.current.sessions[activeId].widgets.find(
          (w) => w.id === widgetId,
        ),
      ).toBeUndefined();
    });

    it("should update widget", () => {
      const { result } = renderHook(() => useStore());

      const activeId = result.current.activeSessionId;

      let widgetId: string;

      act(() => {
        result.current.addWidget({
          title: "Original",
          variableName: "test",
          config: { type: "CARD", width: 1 },
        });
        widgetId =
          result.current.sessions[activeId].widgets[
            result.current.sessions[activeId].widgets.length - 1
          ].id;
      });

      act(() => {
        result.current.updateWidget(widgetId!, { title: "Updated" });
      });

      const updated = result.current.sessions[activeId].widgets.find(
        (w) => w.id === widgetId!,
      );
      expect(updated?.title).toBe("Updated");
    });
  });

  describe("Presets Management", () => {
    it("should add preset via setPresets", () => {
      const { result } = renderHook(() => useStore());

      const initialCount = result.current.presets.length;

      const newPreset: SerialPreset = {
        id: "test-preset-1",
        name: "Test Preset",
        type: "SERIAL" as const,
        config: result.current.sessions[result.current.activeSessionId].config,
      };

      act(() => {
        result.current.setPresets((prev) => [...prev, newPreset]);
      });

      expect(result.current.presets.length).toBe(initialCount + 1);
      const added = result.current.presets.find(
        (p) => p.name === "Test Preset",
      );
      expect(added).toBeDefined();
      expect(added?.id).toBe("test-preset-1");
    });

    it("should update preset via setPresets", () => {
      const { result } = renderHook(() => useStore());

      const newPreset: SerialPreset = {
        id: "test-preset-2",
        name: "Original Preset",
        type: "SERIAL" as const,
        config: result.current.sessions[result.current.activeSessionId].config,
      };

      act(() => {
        result.current.setPresets((prev) => [...prev, newPreset]);
      });

      // Update the preset
      act(() => {
        result.current.setPresets((prev) =>
          prev.map((p) =>
            p.id === "test-preset-2" ? { ...p, name: "Updated Preset" } : p,
          ),
        );
      });

      const updated = result.current.presets.find(
        (p) => p.id === "test-preset-2",
      );
      expect(updated?.name).toBe("Updated Preset");
    });

    it("should delete preset via setPresets", () => {
      const { result } = renderHook(() => useStore());

      const newPreset: SerialPreset = {
        id: "test-preset-3",
        name: "To Delete",
        type: "SERIAL" as const,
        config: result.current.sessions[result.current.activeSessionId].config,
      };

      act(() => {
        result.current.setPresets((prev) => [...prev, newPreset]);
      });

      const countBefore = result.current.presets.length;

      act(() => {
        result.current.setPresets((prev) =>
          prev.filter((p) => p.id !== "test-preset-3"),
        );
      });

      expect(result.current.presets.length).toBe(countBefore - 1);
      expect(
        result.current.presets.find((p) => p.id === "test-preset-3"),
      ).toBeUndefined();
    });
  });

  describe("Sequences Management", () => {
    it("should add sequence", () => {
      const { result } = renderHook(() => useStore());

      const initialCount = result.current.sequences.length;

      const newSequence = {
        name: "Test Sequence",
        steps: [],
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      act(() => {
        result.current.addSequence(newSequence);
      });

      expect(result.current.sequences.length).toBe(initialCount + 1);
      const added = result.current.sequences.find(
        (s) => s.name === "Test Sequence",
      );
      expect(added).toBeDefined();
      expect(added?.id).toBeTruthy();
    });

    it("should delete sequence", () => {
      const { result } = renderHook(() => useStore());

      const newSequence = {
        name: "To Delete",
        steps: [],
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      let sequenceId: string;

      act(() => {
        result.current.addSequence(newSequence);
        sequenceId =
          result.current.sequences[result.current.sequences.length - 1].id;
      });

      const countBefore = result.current.sequences.length;

      act(() => {
        result.current.deleteSequence(sequenceId!);
      });

      expect(result.current.sequences.length).toBe(countBefore - 1);
      expect(
        result.current.sequences.find((s) => s.id === sequenceId),
      ).toBeUndefined();
    });
  });
});
