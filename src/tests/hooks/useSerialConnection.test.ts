import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import type { Mock } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import { useSerialConnection } from "@/hooks/useSerialConnection";
import { NetworkConfig, SerialConfig } from "@/types";

describe("useSerialConnection", () => {
  let onDataReceived: Mock<(data: Uint8Array, sessionId: string) => void>;
  let onDisconnect: Mock<(sessionId: string) => void>;
  let defaultConfig: SerialConfig;
  let defaultNetworkConfig: NetworkConfig;

  beforeEach(() => {
    onDataReceived = vi.fn();
    onDisconnect = vi.fn();

    defaultConfig = {
      baudRate: 115200,
      dataBits: "Eight",
      stopBits: "One",
      parity: "None",
      flowControl: "None",
      bufferSize: 4096,
      lineEnding: "LF",
      framing: {
        strategy: "NONE",
      },
    };

    defaultNetworkConfig = {
      host: "localhost",
      port: 8080,
    };
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe("Hook Initialization", () => {
    it("should initialize with correct default state", () => {
      const { result } = renderHook(() =>
        useSerialConnection(onDataReceived, onDisconnect),
      );

      expect(result.current.connect).toBeDefined();
      expect(result.current.disconnect).toBeDefined();
      expect(result.current.write).toBeDefined();
      expect(result.current.toggleSignal).toBeDefined();
      expect(typeof result.current.isWebSerialSupported).toBe("boolean");
      expect(result.current.isSessionConnected).toBeDefined();
    });

    it("should report no sessions connected initially", () => {
      const { result } = renderHook(() =>
        useSerialConnection(onDataReceived, onDisconnect),
      );

      expect(result.current.isSessionConnected("session-1")).toBe(false);
    });
  });

  describe("MockPort Connection", () => {
    it("should connect to mock-echo port", async () => {
      const { result } = renderHook(() =>
        useSerialConnection(onDataReceived, onDisconnect),
      );

      await act(async () => {
        await result.current.connect(
          "session-1",
          defaultConfig,
          defaultNetworkConfig,
          "mock-echo",
        );
      });

      expect(result.current.isSessionConnected("session-1")).toBe(true);
    });

    it("should disconnect from mock port", async () => {
      const { result } = renderHook(() =>
        useSerialConnection(onDataReceived, onDisconnect),
      );

      await act(async () => {
        await result.current.connect(
          "session-1",
          defaultConfig,
          defaultNetworkConfig,
          "mock-echo",
        );
      });

      expect(result.current.isSessionConnected("session-1")).toBe(true);

      await act(async () => {
        await result.current.disconnect("session-1");
      });

      expect(result.current.isSessionConnected("session-1")).toBe(false);
      expect(onDisconnect).toHaveBeenCalledWith("session-1");
    });

    it("should handle multiple sessions", async () => {
      const { result } = renderHook(() =>
        useSerialConnection(onDataReceived, onDisconnect),
      );

      await act(async () => {
        await result.current.connect(
          "session-1",
          defaultConfig,
          defaultNetworkConfig,
          "mock-echo",
        );
        await result.current.connect(
          "session-2",
          defaultConfig,
          defaultNetworkConfig,
          "mock-echo",
        );
      });

      expect(result.current.isSessionConnected("session-1")).toBe(true);
      expect(result.current.isSessionConnected("session-2")).toBe(true);

      await act(async () => {
        await result.current.disconnect("session-1");
      });

      expect(result.current.isSessionConnected("session-1")).toBe(false);
      expect(result.current.isSessionConnected("session-2")).toBe(true);
    });

    it("should replace existing connection when reconnecting same session", async () => {
      const { result } = renderHook(() =>
        useSerialConnection(onDataReceived, onDisconnect),
      );

      await act(async () => {
        await result.current.connect(
          "session-1",
          defaultConfig,
          defaultNetworkConfig,
          "mock-echo",
        );
      });

      expect(result.current.isSessionConnected("session-1")).toBe(true);

      // Reconnect same session
      await act(async () => {
        await result.current.connect(
          "session-1",
          defaultConfig,
          defaultNetworkConfig,
          "mock-echo",
        );
      });

      expect(result.current.isSessionConnected("session-1")).toBe(true);
      expect(onDisconnect).toHaveBeenCalledWith("session-1");
    });
  });

  describe("Write Operations", () => {
    it("should write data to connected mock port", async () => {
      const { result } = renderHook(() =>
        useSerialConnection(onDataReceived, onDisconnect),
      );

      await act(async () => {
        await result.current.connect(
          "session-1",
          defaultConfig,
          defaultNetworkConfig,
          "mock-echo",
        );
      });

      const testData = new Uint8Array([72, 101, 108, 108, 111]); // "Hello"

      await act(async () => {
        await result.current.write("session-1", testData);
      });

      // MockPort echo should trigger onDataReceived after a small delay
      await waitFor(
        () => {
          expect(onDataReceived).toHaveBeenCalled();
        },
        { timeout: 100 },
      );

      // Verify the echoed data
      const receivedData = onDataReceived.mock.calls[0][0];
      expect(Array.from(receivedData)).toEqual(Array.from(testData));
      expect(onDataReceived.mock.calls[0][1]).toBe("session-1");
    });

    it("should throw error when writing to disconnected session", async () => {
      const { result } = renderHook(() =>
        useSerialConnection(onDataReceived, onDisconnect),
      );

      const testData = new Uint8Array([72, 101, 108, 108, 111]);

      await expect(
        act(async () => {
          await result.current.write("session-1", testData);
        }),
      ).rejects.toThrow("Port not connected or not writable");
    });

    it("should write to correct session in multi-session scenario", async () => {
      const { result } = renderHook(() =>
        useSerialConnection(onDataReceived, onDisconnect),
      );

      await act(async () => {
        await result.current.connect(
          "session-1",
          defaultConfig,
          defaultNetworkConfig,
          "mock-echo",
        );
        await result.current.connect(
          "session-2",
          defaultConfig,
          defaultNetworkConfig,
          "mock-echo",
        );
      });

      const testData = new Uint8Array([65, 66, 67]); // "ABC"

      await act(async () => {
        await result.current.write("session-2", testData);
      });

      await waitFor(
        () => {
          expect(onDataReceived).toHaveBeenCalled();
        },
        { timeout: 100 },
      );

      // Verify session-2 received the data
      const lastCall =
        onDataReceived.mock.calls[onDataReceived.mock.calls.length - 1];
      expect(lastCall[1]).toBe("session-2");
    });
  });

  describe("Data Reception", () => {
    it("should receive data from mock port", async () => {
      const { result } = renderHook(() =>
        useSerialConnection(onDataReceived, onDisconnect),
      );

      await act(async () => {
        await result.current.connect(
          "session-1",
          defaultConfig,
          defaultNetworkConfig,
          "mock-echo",
        );
      });

      const testData = new Uint8Array([1, 2, 3, 4, 5]);

      await act(async () => {
        await result.current.write("session-1", testData);
      });

      await waitFor(
        () => {
          expect(onDataReceived).toHaveBeenCalledWith(
            expect.any(Uint8Array),
            "session-1",
          );
        },
        { timeout: 100 },
      );
    });

    it("should handle multiple data chunks", async () => {
      const { result } = renderHook(() =>
        useSerialConnection(onDataReceived, onDisconnect),
      );

      await act(async () => {
        await result.current.connect(
          "session-1",
          defaultConfig,
          defaultNetworkConfig,
          "mock-echo",
        );
      });

      const chunk1 = new Uint8Array([1, 2, 3]);
      const chunk2 = new Uint8Array([4, 5, 6]);
      const chunk3 = new Uint8Array([7, 8, 9]);

      await act(async () => {
        await result.current.write("session-1", chunk1);
        await result.current.write("session-1", chunk2);
        await result.current.write("session-1", chunk3);
      });

      await waitFor(
        () => {
          expect(onDataReceived.mock.calls.length).toBeGreaterThanOrEqual(3);
        },
        { timeout: 200 },
      );
    });
  });

  describe("Session State Management", () => {
    it("should maintain separate state for multiple sessions", async () => {
      const { result } = renderHook(() =>
        useSerialConnection(onDataReceived, onDisconnect),
      );

      await act(async () => {
        await result.current.connect(
          "session-A",
          defaultConfig,
          defaultNetworkConfig,
          "mock-echo",
        );
        await result.current.connect(
          "session-B",
          defaultConfig,
          defaultNetworkConfig,
          "mock-echo",
        );
        await result.current.connect(
          "session-C",
          defaultConfig,
          defaultNetworkConfig,
          "mock-echo",
        );
      });

      expect(result.current.isSessionConnected("session-A")).toBe(true);
      expect(result.current.isSessionConnected("session-B")).toBe(true);
      expect(result.current.isSessionConnected("session-C")).toBe(true);

      await act(async () => {
        await result.current.disconnect("session-B");
      });

      expect(result.current.isSessionConnected("session-A")).toBe(true);
      expect(result.current.isSessionConnected("session-B")).toBe(false);
      expect(result.current.isSessionConnected("session-C")).toBe(true);
    });

    it("should clean up all sessions on unmount", async () => {
      const { result, unmount } = renderHook(() =>
        useSerialConnection(onDataReceived, onDisconnect),
      );

      await act(async () => {
        await result.current.connect(
          "session-1",
          defaultConfig,
          defaultNetworkConfig,
          "mock-echo",
        );
        await result.current.connect(
          "session-2",
          defaultConfig,
          defaultNetworkConfig,
          "mock-echo",
        );
      });

      expect(result.current.isSessionConnected("session-1")).toBe(true);
      expect(result.current.isSessionConnected("session-2")).toBe(true);

      unmount();

      // After unmount, hook should be cleaned up
      // This test primarily verifies no errors during cleanup
    });
  });

  describe("Error Handling", () => {
    it("should handle disconnect of non-existent session gracefully", async () => {
      const { result } = renderHook(() =>
        useSerialConnection(onDataReceived, onDisconnect),
      );

      await act(async () => {
        await result.current.disconnect("non-existent-session");
      });

      expect(onDisconnect).toHaveBeenCalledWith("non-existent-session");
    });

    it("should handle write to non-existent session", async () => {
      const { result } = renderHook(() =>
        useSerialConnection(onDataReceived, onDisconnect),
      );

      const testData = new Uint8Array([1, 2, 3]);

      await expect(
        act(async () => {
          await result.current.write("non-existent", testData);
        }),
      ).rejects.toThrow();
    });
  });

  describe("Signal Control", () => {
    it("should call toggleSignal without errors on mock port", async () => {
      const { result } = renderHook(() =>
        useSerialConnection(onDataReceived, onDisconnect),
      );

      await act(async () => {
        await result.current.connect(
          "session-1",
          defaultConfig,
          defaultNetworkConfig,
          "mock-echo",
        );
      });

      // Mock ports don't support signals, but shouldn't throw
      await act(async () => {
        await result.current.toggleSignal("session-1", "dtr");
        await result.current.toggleSignal("session-1", "rts");
      });

      // Should complete without errors
      expect(result.current.isSessionConnected("session-1")).toBe(true);
    });

    it("should handle toggleSignal on disconnected session gracefully", async () => {
      const { result } = renderHook(() =>
        useSerialConnection(onDataReceived, onDisconnect),
      );

      await act(async () => {
        await result.current.toggleSignal("session-1", "dtr");
      });

      // Should not throw, just no-op
    });
  });
});
