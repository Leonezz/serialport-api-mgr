import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useFraming } from "@/hooks/useFraming";
import { useStore } from "@/lib/store";

// Mock the plotter parser
vi.mock("@/lib/plotterParser", () => ({
  parsePlotterData: vi.fn(() => null),
}));

describe("useFraming", () => {
  beforeEach(() => {
    // Reset store state
    const store = useStore.getState();
    const activeSessionId = store.activeSessionId;

    // Ensure session exists with proper config
    act(() => {
      useStore.setState({
        sessions: {
          [activeSessionId]: {
            ...store.sessions[activeSessionId],
            config: {
              ...store.sessions[activeSessionId].config,
              framing: {
                strategy: "NONE",
                delimiter: "",
                timeout: 50,
                prefixLengthSize: 1,
                byteOrder: "LE",
              },
            },
            framingOverride: undefined,
            logs: [],
          },
        },
      });
    });

    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("handleDataReceived", () => {
    it("should return a data handler function", () => {
      const { result } = renderHook(() => useFraming());

      const sessionId = useStore.getState().activeSessionId;
      const handler = result.current.handleDataReceived(sessionId);

      expect(typeof handler).toBe("function");
    });

    it("should process incoming data chunks", () => {
      const { result } = renderHook(() => useFraming());

      const sessionId = useStore.getState().activeSessionId;
      const handler = result.current.handleDataReceived(sessionId);

      const testData = new Uint8Array([65, 66, 67]); // "ABC"

      act(() => {
        handler(testData);
      });

      // Check that data was logged
      const logs = useStore.getState().sessions[sessionId].logs;
      expect(logs.length).toBeGreaterThanOrEqual(1);
    });

    it("should call onValidate callback when provided", () => {
      const { result } = renderHook(() => useFraming());

      const sessionId = useStore.getState().activeSessionId;
      const onValidate = vi.fn();
      const handler = result.current.handleDataReceived(sessionId, onValidate);

      const testData = new Uint8Array([65, 66, 67]); // "ABC"

      act(() => {
        handler(testData);
      });

      expect(onValidate).toHaveBeenCalled();
      expect(onValidate).toHaveBeenCalledWith(
        expect.any(Uint8Array),
        sessionId,
        expect.any(String),
      );
    });

    it("should handle empty data", () => {
      const { result } = renderHook(() => useFraming());

      const sessionId = useStore.getState().activeSessionId;
      const handler = result.current.handleDataReceived(sessionId);

      const emptyData = new Uint8Array([]);

      // Should not throw
      expect(() => {
        act(() => {
          handler(emptyData);
        });
      }).not.toThrow();
    });

    it("should handle binary data with non-printable characters", () => {
      const { result } = renderHook(() => useFraming());

      const sessionId = useStore.getState().activeSessionId;
      const handler = result.current.handleDataReceived(sessionId);

      // Binary data with non-printable characters
      const binaryData = new Uint8Array([0x00, 0x01, 0x02, 0xff, 0xfe]);

      expect(() => {
        act(() => {
          handler(binaryData);
        });
      }).not.toThrow();

      const logs = useStore.getState().sessions[sessionId].logs;
      expect(logs.length).toBeGreaterThanOrEqual(1);
    });

    it("should warn when session does not exist", () => {
      const consoleSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

      const { result } = renderHook(() => useFraming());

      const handler = result.current.handleDataReceived("non-existent-session");
      const testData = new Uint8Array([65]);

      act(() => {
        handler(testData);
      });

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining("No session found"),
      );

      consoleSpy.mockRestore();
    });
  });

  describe("cleanupFramer", () => {
    it("should cleanup framer for a session", () => {
      const { result } = renderHook(() => useFraming());

      const sessionId = useStore.getState().activeSessionId;

      // Create framer by handling data
      const handler = result.current.handleDataReceived(sessionId);
      act(() => {
        handler(new Uint8Array([65, 66, 67]));
      });

      // Cleanup should not throw
      expect(() => {
        result.current.cleanupFramer(sessionId);
      }).not.toThrow();
    });

    it("should handle cleanup for non-existent session", () => {
      const { result } = renderHook(() => useFraming());

      // Should not throw
      expect(() => {
        result.current.cleanupFramer("non-existent-session");
      }).not.toThrow();
    });
  });

  describe("framing override behavior", () => {
    it("should use framing override when set", () => {
      const sessionId = useStore.getState().activeSessionId;

      // Set framing override to DELIMITER
      act(() => {
        useStore.setState((state) => ({
          sessions: {
            ...state.sessions,
            [sessionId]: {
              ...state.sessions[sessionId],
              framingOverride: {
                strategy: "DELIMITER",
                delimiter: "\\n",
              },
            },
          },
        }));
      });

      const { result } = renderHook(() => useFraming());
      const handler = result.current.handleDataReceived(sessionId);

      // Send data with delimiter
      const testData = new Uint8Array([65, 66, 10]); // "AB\n"

      act(() => {
        handler(testData);
      });

      // Frame should be processed
      const logs = useStore.getState().sessions[sessionId].logs;
      expect(logs.length).toBeGreaterThanOrEqual(1);
    });

    it("should clear framing override after processing frame", () => {
      const sessionId = useStore.getState().activeSessionId;

      // Set framing override
      act(() => {
        useStore.setState((state) => ({
          sessions: {
            ...state.sessions,
            [sessionId]: {
              ...state.sessions[sessionId],
              framingOverride: {
                strategy: "NONE",
              },
            },
          },
        }));
      });

      const { result } = renderHook(() => useFraming());
      const handler = result.current.handleDataReceived(sessionId);

      act(() => {
        handler(new Uint8Array([65, 66, 67]));
      });

      // Override should be cleared
      const session = useStore.getState().sessions[sessionId];
      expect(session.framingOverride).toBeUndefined();
    });
  });

  describe("overrideTimerRef", () => {
    it("should expose overrideTimerRef", () => {
      const { result } = renderHook(() => useFraming());

      expect(result.current.overrideTimerRef).toBeDefined();
      expect(result.current.overrideTimerRef.current).toBeNull();
    });
  });

  describe("multiple sessions", () => {
    it("should handle data for different sessions independently", () => {
      const { result } = renderHook(() => useFraming());

      // Add a second session
      act(() => {
        useStore.getState().addSession();
      });

      const sessions = Object.keys(useStore.getState().sessions);
      expect(sessions.length).toBe(2);

      const session1 = sessions[0];
      const session2 = sessions[1];

      const handler1 = result.current.handleDataReceived(session1);
      const handler2 = result.current.handleDataReceived(session2);

      act(() => {
        handler1(new Uint8Array([65])); // A
        handler2(new Uint8Array([66])); // B
      });

      // Both sessions should have logs
      const logs1 = useStore.getState().sessions[session1].logs;
      const logs2 = useStore.getState().sessions[session2].logs;

      expect(logs1.length).toBeGreaterThanOrEqual(1);
      expect(logs2.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe("system logging", () => {
    it("should add system log with frame info", () => {
      const { result } = renderHook(() => useFraming());

      const sessionId = useStore.getState().activeSessionId;
      const handler = result.current.handleDataReceived(sessionId);

      const testData = new Uint8Array([72, 101, 108, 108, 111]); // "Hello"

      act(() => {
        handler(testData);
      });

      const systemLogs = useStore.getState().systemLogs;
      const frameLog = systemLogs.find(
        (log) => log.message.includes("RX Frame") && log.message.includes("5B"),
      );

      expect(frameLog).toBeDefined();
    });

    it("should truncate long preview in system log", () => {
      const { result } = renderHook(() => useFraming());

      const sessionId = useStore.getState().activeSessionId;
      const handler = result.current.handleDataReceived(sessionId);

      // Create long data
      const longData = new Uint8Array(100).fill(65); // 100 'A' characters

      act(() => {
        handler(longData);
      });

      const systemLogs = useStore.getState().systemLogs;
      const frameLog = systemLogs.find((log) => log.message.includes("..."));

      expect(frameLog).toBeDefined();
    });
  });
});
