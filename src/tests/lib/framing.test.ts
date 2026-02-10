import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { composeFrames, SerialFramer, TimedChunk } from "@/lib/parsers/framing";
import { FramingConfig } from "@/types";

describe("Framing", () => {
  describe("composeFrames - NONE strategy", () => {
    const config: FramingConfig = {
      strategy: "NONE",
    };

    it("should merge all chunks into single frame", async () => {
      const chunks: TimedChunk[] = [
        { data: new Uint8Array([1, 2]), timestamp: 100 },
        { data: new Uint8Array([3, 4]), timestamp: 200 },
      ];

      const result = await composeFrames(chunks, config, false);

      expect(result.frames.length).toBe(1);
      expect(result.frames[0].data).toEqual(new Uint8Array([1, 2, 3, 4]));
      expect(result.frames[0].timestamp).toBe(100);
      expect(result.remaining.length).toBe(0);
    });

    it("should handle empty chunks", async () => {
      const result = await composeFrames([], config, false);
      expect(result.frames.length).toBe(0);
      expect(result.remaining.length).toBe(0);
    });

    it("should handle single chunk", async () => {
      const chunks: TimedChunk[] = [
        { data: new Uint8Array([1, 2, 3]), timestamp: 100 },
      ];

      const result = await composeFrames(chunks, config, false);

      expect(result.frames.length).toBe(1);
      expect(result.frames[0].data).toEqual(new Uint8Array([1, 2, 3]));
      expect(result.remaining.length).toBe(0);
    });
  });

  describe("composeFrames - DELIMITER strategy", () => {
    it("should split on newline delimiter", async () => {
      const config: FramingConfig = {
        strategy: "DELIMITER",
        delimiter: "\\n",
      };

      const chunks: TimedChunk[] = [
        { data: new Uint8Array([65, 66, 10, 67, 68]), timestamp: 100 },
      ];

      const result = await composeFrames(chunks, config, false);

      expect(result.frames.length).toBe(1);
      expect(result.frames[0].data).toEqual(new Uint8Array([65, 66, 10]));
      expect(result.remaining.length).toBe(1);
      expect(result.remaining[0].data).toEqual(new Uint8Array([67, 68]));
    });

    it("should handle multiple delimiters", async () => {
      const config: FramingConfig = {
        strategy: "DELIMITER",
        delimiter: "\\n",
      };

      const chunks: TimedChunk[] = [
        { data: new Uint8Array([65, 10, 66, 10, 67]), timestamp: 100 },
      ];

      const result = await composeFrames(chunks, config, false);

      expect(result.frames.length).toBe(2);
      expect(result.frames[0].data).toEqual(new Uint8Array([65, 10]));
      expect(result.frames[1].data).toEqual(new Uint8Array([66, 10]));
      expect(result.remaining[0].data).toEqual(new Uint8Array([67]));
    });

    it("should buffer incomplete frames across chunks", async () => {
      const config: FramingConfig = {
        strategy: "DELIMITER",
        delimiter: "\\n",
      };

      const chunks: TimedChunk[] = [
        { data: new Uint8Array([65, 66]), timestamp: 100 },
        { data: new Uint8Array([67, 10]), timestamp: 200 },
      ];

      const result = await composeFrames(chunks, config, false);

      expect(result.frames.length).toBe(1);
      expect(result.frames[0].data).toEqual(new Uint8Array([65, 66, 67, 10]));
      expect(result.remaining.length).toBe(0);
    });

    it("should handle hex delimiter", async () => {
      const config: FramingConfig = {
        strategy: "DELIMITER",
        delimiter: "0D 0A", // CRLF in hex
      };

      const chunks: TimedChunk[] = [
        { data: new Uint8Array([65, 66, 13, 10, 67]), timestamp: 100 },
      ];

      const result = await composeFrames(chunks, config, false);

      expect(result.frames.length).toBe(1);
      expect(result.frames[0].data).toEqual(new Uint8Array([65, 66, 13, 10]));
      expect(result.remaining[0].data).toEqual(new Uint8Array([67]));
    });

    it("should handle no delimiter found", async () => {
      const config: FramingConfig = {
        strategy: "DELIMITER",
        delimiter: "\\n",
      };

      const chunks: TimedChunk[] = [
        { data: new Uint8Array([65, 66, 67]), timestamp: 100 },
      ];

      const result = await composeFrames(chunks, config, false);

      expect(result.frames.length).toBe(0);
      expect(result.remaining.length).toBe(1);
      expect(result.remaining[0].data).toEqual(new Uint8Array([65, 66, 67]));
    });
  });

  describe("composeFrames - PREFIX_LENGTH strategy", () => {
    it("should extract frame with 1-byte length prefix (big-endian)", async () => {
      const config: FramingConfig = {
        strategy: "PREFIX_LENGTH",
        prefixLengthSize: 1,
        byteOrder: "BE",
      };

      // Length = 3, Data = [65, 66, 67] "ABC"
      const chunks: TimedChunk[] = [
        { data: new Uint8Array([3, 65, 66, 67]), timestamp: 100 },
      ];

      const result = await composeFrames(chunks, config, false);

      expect(result.frames.length).toBe(1);
      expect(result.frames[0].data).toEqual(new Uint8Array([3, 65, 66, 67]));
      expect(result.frames[0].payloadStart).toBe(1);
      expect(result.frames[0].payloadLength).toBe(3);
      expect(result.remaining.length).toBe(0);
    });

    it("should extract frame with 2-byte length prefix (big-endian)", async () => {
      const config: FramingConfig = {
        strategy: "PREFIX_LENGTH",
        prefixLengthSize: 2,
        byteOrder: "BE",
      };

      // Length = 256 (0x0100), followed by 256 bytes
      const payload = new Uint8Array(256).fill(0xaa);
      const frame = new Uint8Array(258);
      frame[0] = 0x01; // High byte
      frame[1] = 0x00; // Low byte
      frame.set(payload, 2);

      const chunks: TimedChunk[] = [{ data: frame, timestamp: 100 }];

      const result = await composeFrames(chunks, config, false);

      expect(result.frames.length).toBe(1);
      expect(result.frames[0].data.length).toBe(258);
      expect(result.frames[0].payloadStart).toBe(2);
      expect(result.frames[0].payloadLength).toBe(256);
      expect(result.remaining.length).toBe(0);
    });

    it("should handle incomplete frame (not enough data)", async () => {
      const config: FramingConfig = {
        strategy: "PREFIX_LENGTH",
        prefixLengthSize: 1,
        byteOrder: "BE",
      };

      // Length says 5, but only 3 bytes follow
      const chunks: TimedChunk[] = [
        { data: new Uint8Array([5, 65, 66, 67]), timestamp: 100 },
      ];

      const result = await composeFrames(chunks, config, false);

      expect(result.frames.length).toBe(0);
      expect(result.remaining.length).toBe(1);
      expect(result.remaining[0].data).toEqual(new Uint8Array([5, 65, 66, 67]));
    });

    it("should handle little-endian byte order", async () => {
      const config: FramingConfig = {
        strategy: "PREFIX_LENGTH",
        prefixLengthSize: 2,
        byteOrder: "LE",
      };

      // Length = 256 in LE (0x00, 0x01), followed by 256 bytes
      const payload = new Uint8Array(256).fill(0xbb);
      const frame = new Uint8Array(258);
      frame[0] = 0x00; // Low byte
      frame[1] = 0x01; // High byte
      frame.set(payload, 2);

      const chunks: TimedChunk[] = [{ data: frame, timestamp: 100 }];

      const result = await composeFrames(chunks, config, false);

      expect(result.frames.length).toBe(1);
      expect(result.frames[0].data.length).toBe(258);
      expect(result.frames[0].payloadLength).toBe(256);
    });
  });

  describe("composeFrames - TIMEOUT strategy", () => {
    it("should buffer chunks without forceFlush", async () => {
      const config: FramingConfig = {
        strategy: "TIMEOUT",
        timeout: 50,
      };

      const chunks: TimedChunk[] = [
        { data: new Uint8Array([1, 2, 3]), timestamp: 100 },
      ];

      const result = await composeFrames(chunks, config, false);

      expect(result.frames.length).toBe(0);
      expect(result.remaining.length).toBe(1);
    });

    it("should emit frame on forceFlush", async () => {
      const config: FramingConfig = {
        strategy: "TIMEOUT",
        timeout: 50,
      };

      const chunks: TimedChunk[] = [
        { data: new Uint8Array([1, 2]), timestamp: 100 },
        { data: new Uint8Array([3, 4]), timestamp: 200 },
      ];

      const result = await composeFrames(chunks, config, true);

      expect(result.frames.length).toBe(1);
      expect(result.frames[0].data).toEqual(new Uint8Array([1, 2, 3, 4]));
      expect(result.remaining.length).toBe(0);
    });
  });

  describe("SerialFramer class", () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.restoreAllMocks();
    });

    it("should emit frames immediately for DELIMITER strategy", async () => {
      const config: FramingConfig = {
        strategy: "DELIMITER",
        delimiter: "\\n",
      };

      const onFrames = vi.fn();
      const framer = new SerialFramer(config, onFrames);

      framer.push({ data: new Uint8Array([65, 10]), timestamp: 100 });

      // Wait for async composeFrames to complete
      await vi.runOnlyPendingTimersAsync();

      expect(onFrames).toHaveBeenCalledTimes(1);
      expect(onFrames).toHaveBeenCalledWith([
        expect.objectContaining({
          data: new Uint8Array([65, 10]),
        }),
      ]);
    });

    it("should buffer incomplete frames", async () => {
      const config: FramingConfig = {
        strategy: "DELIMITER",
        delimiter: "\\n",
      };

      const onFrames = vi.fn();
      const framer = new SerialFramer(config, onFrames);

      framer.push({ data: new Uint8Array([65, 66]), timestamp: 100 });

      await vi.runOnlyPendingTimersAsync();
      expect(onFrames).not.toHaveBeenCalled();

      framer.push({ data: new Uint8Array([67, 10]), timestamp: 200 });

      await vi.runOnlyPendingTimersAsync();
      expect(onFrames).toHaveBeenCalledTimes(1);
      expect(onFrames).toHaveBeenCalledWith([
        expect.objectContaining({
          data: new Uint8Array([65, 66, 67, 10]),
        }),
      ]);
    });

    it("should emit frame after timeout for TIMEOUT strategy", async () => {
      const config: FramingConfig = {
        strategy: "TIMEOUT",
        timeout: 50,
      };

      const onFrames = vi.fn();
      const framer = new SerialFramer(config, onFrames);

      framer.push({ data: new Uint8Array([65, 66, 67]), timestamp: 100 });

      // The initial push schedules a timeout but doesn't emit frames yet
      // We need to let the initial promise resolve but not trigger the timeout
      await Promise.resolve();
      await Promise.resolve();
      expect(onFrames).not.toHaveBeenCalled();

      // Now advance time to trigger the timeout callback and let it complete
      await vi.advanceTimersByTimeAsync(50);

      expect(onFrames).toHaveBeenCalledTimes(1);
      expect(onFrames).toHaveBeenCalledWith([
        expect.objectContaining({
          data: new Uint8Array([65, 66, 67]),
        }),
      ]);
    });

    it("should reset timer on new data for TIMEOUT strategy", async () => {
      const config: FramingConfig = {
        strategy: "TIMEOUT",
        timeout: 50,
      };

      const onFrames = vi.fn();
      const framer = new SerialFramer(config, onFrames);

      framer.push({ data: new Uint8Array([1]), timestamp: 100 });
      await vi.advanceTimersByTimeAsync(25);

      framer.push({ data: new Uint8Array([2]), timestamp: 125 });
      await vi.advanceTimersByTimeAsync(25);

      expect(onFrames).not.toHaveBeenCalled();

      await vi.advanceTimersByTimeAsync(25);

      expect(onFrames).toHaveBeenCalledTimes(1);
      expect(onFrames).toHaveBeenCalledWith([
        expect.objectContaining({
          data: new Uint8Array([1, 2]),
        }),
      ]);
    });

    it("should reset buffer", async () => {
      const config: FramingConfig = {
        strategy: "DELIMITER",
        delimiter: "\\n",
      };

      const onFrames = vi.fn();
      const framer = new SerialFramer(config, onFrames);

      framer.push({ data: new Uint8Array([65, 66]), timestamp: 100 });
      await vi.runOnlyPendingTimersAsync();

      framer.reset();
      framer.push({ data: new Uint8Array([67, 10]), timestamp: 200 });

      await vi.runOnlyPendingTimersAsync();
      expect(onFrames).toHaveBeenCalledTimes(1);
      expect(onFrames).toHaveBeenCalledWith([
        expect.objectContaining({
          data: new Uint8Array([67, 10]),
        }),
      ]);
    });

    it("should flush buffered data", async () => {
      const config: FramingConfig = {
        strategy: "TIMEOUT",
        timeout: 50,
      };

      const onFrames = vi.fn();
      const framer = new SerialFramer(config, onFrames);

      framer.push({ data: new Uint8Array([1, 2, 3]), timestamp: 100 });
      await Promise.resolve();
      await Promise.resolve();
      expect(onFrames).not.toHaveBeenCalled();

      framer.flush();

      await vi.runOnlyPendingTimersAsync();
      expect(onFrames).toHaveBeenCalledTimes(1);
      expect(onFrames).toHaveBeenCalledWith([
        expect.objectContaining({
          data: new Uint8Array([1, 2, 3]),
        }),
      ]);
    });

    it("should handle strategy change", async () => {
      const config: FramingConfig = {
        strategy: "TIMEOUT",
        timeout: 50,
      };

      const onFrames = vi.fn();
      const framer = new SerialFramer(config, onFrames);

      framer.push({ data: new Uint8Array([65, 10]), timestamp: 100 });
      await Promise.resolve();
      await Promise.resolve();
      expect(onFrames).not.toHaveBeenCalled();

      // Change to DELIMITER strategy
      framer.setConfig({
        strategy: "DELIMITER",
        delimiter: "\\n",
      });

      // Should process buffered data with new strategy
      await vi.runOnlyPendingTimersAsync();
      expect(onFrames).toHaveBeenCalledTimes(1);
      expect(onFrames).toHaveBeenCalledWith([
        expect.objectContaining({
          data: new Uint8Array([65, 10]),
        }),
      ]);
    });
  });
});
