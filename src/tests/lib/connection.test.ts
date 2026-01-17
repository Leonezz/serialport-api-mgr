import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { NetworkPort } from "@/lib/connection";

describe("NetworkPort", () => {
  let mockWebSocket;
  let originalWebSocket: typeof WebSocket;

  beforeEach(() => {
    // Save original WebSocket
    originalWebSocket = globalThis.WebSocket;

    // Create mock WebSocket instance
    mockWebSocket = {
      readyState: 0, // CONNECTING
      binaryType: "",
      onopen: null as ((event: Event) => void) | null,
      onmessage: null as ((event: MessageEvent) => void) | null,
      onclose: null as ((event: CloseEvent) => void) | null,
      onerror: null as ((event: Event) => void) | null,
      send: vi.fn(),
      close: vi.fn(),
      CONNECTING: 0,
      OPEN: 1,
      CLOSING: 2,
      CLOSED: 3,
    };

    // Mock WebSocket constructor using a proper function
    globalThis.WebSocket = function (_url: string) {
      return mockWebSocket;
    } as unknown as typeof WebSocket;
    (globalThis.WebSocket as any).CONNECTING = 0;
    (globalThis.WebSocket as any).OPEN = 1;
    (globalThis.WebSocket as any).CLOSING = 2;
    (globalThis.WebSocket as any).CLOSED = 3;
  });

  afterEach(() => {
    // Restore original WebSocket
    globalThis.WebSocket = originalWebSocket;
    vi.clearAllMocks();
  });

  describe("constructor", () => {
    it("should create NetworkPort and initialize WebSocket", () => {
      const onDisconnect = vi.fn();
      const port = new NetworkPort("ws://localhost:8080", onDisconnect);

      expect(port.ws).toBe(mockWebSocket);
      expect(mockWebSocket.binaryType).toBe("arraybuffer");
    });

    it("should set up readable stream", () => {
      const onDisconnect = vi.fn();
      const port = new NetworkPort("ws://localhost:8080", onDisconnect);

      expect(port.readable).toBeDefined();
      expect(port.readable).toBeInstanceOf(ReadableStream);
    });

    it("should set up writable stream", () => {
      const onDisconnect = vi.fn();
      const port = new NetworkPort("ws://localhost:8080", onDisconnect);

      expect(port.writable).toBeDefined();
      expect(port.writable).toBeInstanceOf(WritableStream);
    });

    it("should create closed promise", () => {
      const onDisconnect = vi.fn();
      const port = new NetworkPort("ws://localhost:8080", onDisconnect);

      expect(port.closed).toBeDefined();
      expect(port.closed).toBeInstanceOf(Promise);
    });
  });

  describe("readable stream", () => {
    it("should enqueue ArrayBuffer data", async () => {
      const onDisconnect = vi.fn();
      const port = new NetworkPort("ws://localhost:8080", onDisconnect);

      const reader = port.readable.getReader();
      const testData = new Uint8Array([1, 2, 3, 4, 5]);

      // Trigger onmessage with ArrayBuffer
      if (mockWebSocket.onmessage) {
        mockWebSocket.onmessage({
          data: testData.buffer,
        } as MessageEvent);
      }

      const result = await reader.read();
      expect(result.done).toBe(false);
      expect(Array.from(result.value as Uint8Array)).toEqual([1, 2, 3, 4, 5]);

      reader.releaseLock();
    });

    it("should enqueue string data as UTF-8", async () => {
      const onDisconnect = vi.fn();
      const port = new NetworkPort("ws://localhost:8080", onDisconnect);

      const reader = port.readable.getReader();

      // Trigger onmessage with string
      if (mockWebSocket.onmessage) {
        mockWebSocket.onmessage({
          data: "Hello",
        } as MessageEvent);
      }

      const result = await reader.read();
      expect(result.done).toBe(false);
      expect(Array.from(result.value as Uint8Array)).toEqual([
        72, 101, 108, 108, 111,
      ]); // "Hello"

      reader.releaseLock();
    });

    it("should call onDisconnect and close stream on WebSocket close", async () => {
      const onDisconnect = vi.fn();
      const port = new NetworkPort("ws://localhost:8080", onDisconnect);

      const reader = port.readable.getReader();

      // Trigger onclose
      if (mockWebSocket.onclose) {
        mockWebSocket.onclose({} as CloseEvent);
      }

      expect(onDisconnect).toHaveBeenCalled();

      const result = await reader.read();
      expect(result.done).toBe(true);

      reader.releaseLock();
    });

    it("should handle WebSocket error", async () => {
      const onDisconnect = vi.fn();
      const port = new NetworkPort("ws://localhost:8080", onDisconnect);

      const reader = port.readable.getReader();

      // Trigger onerror
      const error = new Error("WebSocket error");
      if (mockWebSocket.onerror) {
        mockWebSocket.onerror(error);
      }

      await expect(reader.read()).rejects.toThrow();

      reader.releaseLock();
    });
  });

  describe("writable stream", () => {
    it("should send data when WebSocket is open", async () => {
      const onDisconnect = vi.fn();
      const port = new NetworkPort("ws://localhost:8080", onDisconnect);

      mockWebSocket.readyState = 1; // OPEN

      const writer = port.writable.getWriter();
      const testData = new Uint8Array([1, 2, 3]);

      await writer.write(testData);

      expect(mockWebSocket.send).toHaveBeenCalledWith(testData);

      writer.releaseLock();
    });

    it("should not send data when WebSocket is not open", async () => {
      const onDisconnect = vi.fn();
      const port = new NetworkPort("ws://localhost:8080", onDisconnect);

      mockWebSocket.readyState = 0; // CONNECTING

      const writer = port.writable.getWriter();
      const testData = new Uint8Array([1, 2, 3]);

      await writer.write(testData);

      expect(mockWebSocket.send).not.toHaveBeenCalled();

      writer.releaseLock();
    });

    it("should close WebSocket when stream is closed", async () => {
      const onDisconnect = vi.fn();
      const port = new NetworkPort("ws://localhost:8080", onDisconnect);

      const writer = port.writable.getWriter();

      await writer.close();

      expect(mockWebSocket.close).toHaveBeenCalled();
    });
  });

  describe("waitForOpen", () => {
    it("should resolve immediately if WebSocket is already open", async () => {
      const onDisconnect = vi.fn();
      const port = new NetworkPort("ws://localhost:8080", onDisconnect);

      mockWebSocket.readyState = 1; // OPEN

      await expect(port.waitForOpen()).resolves.toBeUndefined();
    });

    it("should wait for WebSocket to open", async () => {
      const onDisconnect = vi.fn();
      const port = new NetworkPort("ws://localhost:8080", onDisconnect);

      mockWebSocket.readyState = 0; // CONNECTING

      const waitPromise = port.waitForOpen();

      // Simulate WebSocket opening
      setTimeout(() => {
        if (mockWebSocket.onopen) {
          mockWebSocket.onopen(new Event("open"));
        }
      }, 10);

      await expect(waitPromise).resolves.toBeUndefined();
    });

    it("should reject if WebSocket errors", async () => {
      const onDisconnect = vi.fn();
      const port = new NetworkPort("ws://localhost:8080", onDisconnect);

      mockWebSocket.readyState = 0; // CONNECTING

      const waitPromise = port.waitForOpen();

      // Simulate WebSocket error
      setTimeout(() => {
        const error = new Error("Connection failed");
        if (mockWebSocket.onerror) {
          mockWebSocket.onerror(error);
        }
      }, 10);

      await expect(waitPromise).rejects.toThrow();
    });
  });

  describe("close", () => {
    it("should close WebSocket and wait for closed promise", async () => {
      const onDisconnect = vi.fn();
      const port = new NetworkPort("ws://localhost:8080", onDisconnect);

      // Set up promise to resolve when onclose is called
      const closePromise = port.close();

      // Trigger onclose to resolve the closed promise
      setTimeout(() => {
        if (mockWebSocket.onclose) {
          mockWebSocket.onclose({} as CloseEvent);
        }
      }, 10);

      await expect(closePromise).resolves.toBeUndefined();
      expect(mockWebSocket.close).toHaveBeenCalled();
    });
  });

  describe("integration", () => {
    it("should handle full data flow: connect -> send -> receive -> close", async () => {
      const onDisconnect = vi.fn();
      const port = new NetworkPort("ws://localhost:8080", onDisconnect);

      // Set to OPEN state
      mockWebSocket.readyState = 1;

      // Get reader and writer
      const reader = port.readable.getReader();
      const writer = port.writable.getWriter();

      // Send data
      const sendData = new Uint8Array([1, 2, 3]);
      await writer.write(sendData);
      expect(mockWebSocket.send).toHaveBeenCalledWith(sendData);

      // Receive data
      if (mockWebSocket.onmessage) {
        mockWebSocket.onmessage({
          data: new Uint8Array([4, 5, 6]).buffer,
        } as MessageEvent);
      }

      const result = await reader.read();
      expect(Array.from(result.value as Uint8Array)).toEqual([4, 5, 6]);

      // Clean up
      reader.releaseLock();
      writer.releaseLock();

      // Close
      const closePromise = port.close();
      if (mockWebSocket.onclose) {
        mockWebSocket.onclose({} as CloseEvent);
      }
      await closePromise;

      expect(onDisconnect).toHaveBeenCalled();
    });
  });
});
