import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";

// Mock Tauri environment
Object.defineProperty(globalThis, "__TAURI_ENV_TARGET_TRIPLE__", {
  value: "",
  writable: true,
});
Object.defineProperty(globalThis, "__TAURI_ENV_PLATFORM_VERSION__", {
  value: "",
  writable: true,
});
Object.defineProperty(globalThis, "__TAURI_ENV_DEBUG__", {
  value: "false",
  writable: true,
});

describe("serialService", () => {
  describe("WebSerialProvider", () => {
    let originalNavigator: typeof navigator;
    let mockSerial: any;

    beforeEach(() => {
      // Save original navigator
      originalNavigator = globalThis.navigator;

      // Create mock serial API
      mockSerial = {
        getPorts: vi.fn().mockResolvedValue([]),
        requestPort: vi.fn().mockResolvedValue(null),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      };

      // Mock navigator with serial
      Object.defineProperty(globalThis, "navigator", {
        value: {
          ...originalNavigator,
          serial: mockSerial,
        },
        writable: true,
        configurable: true,
      });
    });

    afterEach(() => {
      // Restore original navigator
      Object.defineProperty(globalThis, "navigator", {
        value: originalNavigator,
        writable: true,
        configurable: true,
      });
      vi.clearAllMocks();
    });

    it("should detect WebSerial support", async () => {
      // Re-import to get new provider instance
      const { serialService } = await import("@/lib/serialService");

      expect(serialService.isSupported()).toBe(true);
    });

    it("should get ports from WebSerial", async () => {
      const mockPorts = [{ info: "port1" }, { info: "port2" }];
      mockSerial.getPorts.mockResolvedValue(mockPorts);

      const { serialService } = await import("@/lib/serialService");

      const ports = await serialService.getPorts();
      expect(mockSerial.getPorts).toHaveBeenCalled();
      expect(ports).toEqual(mockPorts);
    });

    it("should handle getPorts error gracefully", async () => {
      mockSerial.getPorts.mockRejectedValue(
        new Error("Feature Policy blocked"),
      );

      const { serialService } = await import("@/lib/serialService");

      const ports = await serialService.getPorts();
      expect(ports).toEqual([]);
    });

    it("should request port from WebSerial", async () => {
      const mockPort = { info: "selected-port" };
      mockSerial.requestPort.mockResolvedValue(mockPort);

      const { serialService } = await import("@/lib/serialService");

      const port = await serialService.requestPort();
      expect(mockSerial.requestPort).toHaveBeenCalled();
      expect(port).toEqual(mockPort);
    });

    it("should handle requestPort cancellation", async () => {
      mockSerial.requestPort.mockRejectedValue(new Error("User cancelled"));

      const { serialService } = await import("@/lib/serialService");

      const port = await serialService.requestPort();
      expect(port).toBeNull();
    });

    it("should add event listener", async () => {
      const { serialService } = await import("@/lib/serialService");

      const listener = vi.fn();
      serialService.addEventListener("connect", listener);

      expect(mockSerial.addEventListener).toHaveBeenCalledWith(
        "connect",
        listener,
      );
    });

    it("should remove event listener", async () => {
      const { serialService } = await import("@/lib/serialService");

      const listener = vi.fn();
      serialService.removeEventListener("disconnect", listener);

      expect(mockSerial.removeEventListener).toHaveBeenCalledWith(
        "disconnect",
        listener,
      );
    });
  });

  describe("WebSerialProvider - No Support", () => {
    let originalNavigator: typeof navigator;

    beforeEach(() => {
      originalNavigator = globalThis.navigator;

      // Mock navigator without serial
      Object.defineProperty(globalThis, "navigator", {
        value: {
          ...originalNavigator,
          // No serial property
        },
        writable: true,
        configurable: true,
      });

      // Clear module cache to force re-import
      vi.resetModules();
    });

    afterEach(() => {
      Object.defineProperty(globalThis, "navigator", {
        value: originalNavigator,
        writable: true,
        configurable: true,
      });
    });

    it("should detect lack of WebSerial support", async () => {
      const { serialService } = await import("@/lib/serialService");

      expect(serialService.isSupported()).toBe(false);
    });

    it("should return empty array for getPorts when not supported", async () => {
      const { serialService } = await import("@/lib/serialService");

      const ports = await serialService.getPorts();
      expect(ports).toEqual([]);
    });

    it("should return null for requestPort when not supported", async () => {
      const { serialService } = await import("@/lib/serialService");

      const port = await serialService.requestPort();
      expect(port).toBeNull();
    });

    it("should not throw when adding event listener without support", async () => {
      const { serialService } = await import("@/lib/serialService");

      const listener = vi.fn();
      expect(() => {
        serialService.addEventListener("connect", listener);
      }).not.toThrow();
    });

    it("should not throw when removing event listener without support", async () => {
      const { serialService } = await import("@/lib/serialService");

      const listener = vi.fn();
      expect(() => {
        serialService.removeEventListener("connect", listener);
      }).not.toThrow();
    });
  });
});
