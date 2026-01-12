import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { composeFrames, SerialFramer, TimedChunk } from "@/lib/framing";
import { FramingConfig } from "@/types";

describe("Framing", () => {
  describe("composeFrames - NONE strategy", () => {
    const config: FramingConfig = {
      strategy: "NONE",
    };

    it("should merge all chunks into single frame", () => {
      const chunks: TimedChunk[] = [
        { data: new Uint8Array([1, 2]), timestamp: 100 },
        { data: new Uint8Array([3, 4]), timestamp: 200 },
      ];

      const result = composeFrames(chunks, config, false);

      expect(result.frames.length).toBe(1);
      expect(result.frames[0].data).toEqual(new Uint8Array([1, 2, 3, 4]));
      expect(result.frames[0].timestamp).toBe(100);
      expect(result.remaining.length).toBe(0);
    });

    it("should handle empty chunks", () => {
      const result = composeFrames([], config, false);
      expect(result.frames.length).toBe(0);
      expect(result.remaining.length).toBe(0);
    });

    it("should handle single chunk", () => {
      const chunks: TimedChunk[] = [
        { data: new Uint8Array([1, 2, 3]), timestamp: 100 },
      ];

      const result = composeFrames(chunks, config, false);

      expect(result.frames.length).toBe(1);
      expect(result.frames[0].data).toEqual(new Uint8Array([1, 2, 3]));
      expect(result.remaining.length).toBe(0);
    });
  });

  describe("composeFrames - DELIMITER strategy", () => {
    it("should split on newline delimiter", () => {
      const config: FramingConfig = {
        strategy: "DELIMITER",
        delimiter: "\\n",
      };

      const chunks: TimedChunk[] = [
        { data: new Uint8Array([65, 66, 10, 67, 68]), timestamp: 100 },
      ];

      const result = composeFrames(chunks, config, false);

      expect(result.frames.length).toBe(1);
      expect(result.frames[0].data).toEqual(new Uint8Array([65, 66, 10]));
      expect(result.remaining.length).toBe(1);
      expect(result.remaining[0].data).toEqual(new Uint8Array([67, 68]));
    });

    it("should handle multiple delimiters", () => {
      const config: FramingConfig = {
        strategy: "DELIMITER",
        delimiter: "\\n",
      };

      const chunks: TimedChunk[] = [
        { data: new Uint8Array([65, 10, 66, 10, 67]), timestamp: 100 },
      ];

      const result = composeFrames(chunks, config, false);

      expect(result.frames.length).toBe(2);
      expect(result.frames[0].data).toEqual(new Uint8Array([65, 10]));
      expect(result.frames[1].data).toEqual(new Uint8Array([66, 10]));
      expect(result.remaining[0].data).toEqual(new Uint8Array([67]));
    });

    it("should buffer incomplete frames across chunks", () => {
      const config: FramingConfig = {
        strategy: "DELIMITER",
        delimiter: "\\n",
      };

      const chunks: TimedChunk[] = [
        { data: new Uint8Array([65, 66]), timestamp: 100 },
        { data: new Uint8Array([67, 10]), timestamp: 200 },
      ];

      const result = composeFrames(chunks, config, false);

      expect(result.frames.length).toBe(1);
      expect(result.frames[0].data).toEqual(new Uint8Array([65, 66, 67, 10]));
      expect(result.remaining.length).toBe(0);
    });

    it("should handle hex delimiter", () => {
      const config: FramingConfig = {
        strategy: "DELIMITER",
        delimiter: "0D 0A", // CRLF in hex
      };

      const chunks: TimedChunk[] = [
        { data: new Uint8Array([65, 66, 13, 10, 67]), timestamp: 100 },
      ];

      const result = composeFrames(chunks, config, false);

      expect(result.frames.length).toBe(1);
      expect(result.frames[0].data).toEqual(new Uint8Array([65, 66, 13, 10]));
      expect(result.remaining[0].data).toEqual(new Uint8Array([67]));
    });

    it("should handle no delimiter found", () => {
      const config: FramingConfig = {
        strategy: "DELIMITER",
        delimiter: "\\n",
      };

      const chunks: TimedChunk[] = [
        { data: new Uint8Array([65, 66, 67]), timestamp: 100 },
      ];

      const result = composeFrames(chunks, config, false);

      expect(result.frames.length).toBe(0);
      expect(result.remaining.length).toBe(1);
      expect(result.remaining[0].data).toEqual(new Uint8Array([65, 66, 67]));
    });
  });

  describe("composeFrames - PREFIX_LENGTH strategy", () => {
    it("should extract frame with 1-byte length prefix (big-endian)", () => {
      const config: FramingConfig = {
        strategy: "PREFIX_LENGTH",
        prefixLengthSize: 1,
        byteOrder: "BE",
      };

      // Length = 3, Data = [65, 66, 67] "ABC"
      const chunks: TimedChunk[] = [
        { data: new Uint8Array([3, 65, 66, 67]), timestamp: 100 },
      ];

      const result = composeFrames(chunks, config, false);

      expect(result.frames.length).toBe(1);
      expect(result.frames[0].data).toEqual(new Uint8Array([3, 65, 66, 67]));
      expect(result.frames[0].payloadStart).toBe(1);
      expect(result.frames[0].payloadLength).toBe(3);
      expect(result.remaining.length).toBe(0);
    });

    it("should extract frame with 2-byte length prefix (big-endian)", () => {
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

      const result = composeFrames(chunks, config, false);

      expect(result.frames.length).toBe(1);
      expect(result.frames[0].data.length).toBe(258);
      expect(result.frames[0].payloadStart).toBe(2);
      expect(result.frames[0].payloadLength).toBe(256);
      expect(result.remaining.length).toBe(0);
    });

    it("should handle incomplete frame (not enough data)", () => {
      const config: FramingConfig = {
        strategy: "PREFIX_LENGTH",
        prefixLengthSize: 1,
        byteOrder: "BE",
      };

      // Length says 5, but only 3 bytes follow
      const chunks: TimedChunk[] = [
        { data: new Uint8Array([5, 65, 66, 67]), timestamp: 100 },
      ];

      const result = composeFrames(chunks, config, false);

      expect(result.frames.length).toBe(0);
      expect(result.remaining.length).toBe(1);
      expect(result.remaining[0].data).toEqual(new Uint8Array([5, 65, 66, 67]));
    });

    it("should handle little-endian byte order", () => {
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

      const result = composeFrames(chunks, config, false);

      expect(result.frames.length).toBe(1);
      expect(result.frames[0].data.length).toBe(258);
      expect(result.frames[0].payloadLength).toBe(256);
    });
  });

  describe("composeFrames - TIMEOUT strategy", () => {
    it("should buffer chunks without forceFlush", () => {
      const config: FramingConfig = {
        strategy: "TIMEOUT",
        timeout: 50,
      };

      const chunks: TimedChunk[] = [
        { data: new Uint8Array([1, 2, 3]), timestamp: 100 },
      ];

      const result = composeFrames(chunks, config, false);

      expect(result.frames.length).toBe(0);
      expect(result.remaining.length).toBe(1);
    });

    it("should emit frame on forceFlush", () => {
      const config: FramingConfig = {
        strategy: "TIMEOUT",
        timeout: 50,
      };

      const chunks: TimedChunk[] = [
        { data: new Uint8Array([1, 2]), timestamp: 100 },
        { data: new Uint8Array([3, 4]), timestamp: 200 },
      ];

      const result = composeFrames(chunks, config, true);

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

    it("should emit frames immediately for DELIMITER strategy", () => {
      const config: FramingConfig = {
        strategy: "DELIMITER",
        delimiter: "\\n",
      };

      const onFrames = vi.fn();
      const framer = new SerialFramer(config, onFrames);

      framer.push({ data: new Uint8Array([65, 10]), timestamp: 100 });

      expect(onFrames).toHaveBeenCalledTimes(1);
      expect(onFrames).toHaveBeenCalledWith([
        expect.objectContaining({
          data: new Uint8Array([65, 10]),
        }),
      ]);
    });

    it("should buffer incomplete frames", () => {
      const config: FramingConfig = {
        strategy: "DELIMITER",
        delimiter: "\\n",
      };

      const onFrames = vi.fn();
      const framer = new SerialFramer(config, onFrames);

      framer.push({ data: new Uint8Array([65, 66]), timestamp: 100 });

      expect(onFrames).not.toHaveBeenCalled();

      framer.push({ data: new Uint8Array([67, 10]), timestamp: 200 });

      expect(onFrames).toHaveBeenCalledTimes(1);
      expect(onFrames).toHaveBeenCalledWith([
        expect.objectContaining({
          data: new Uint8Array([65, 66, 67, 10]),
        }),
      ]);
    });

    it("should emit frame after timeout for TIMEOUT strategy", () => {
      const config: FramingConfig = {
        strategy: "TIMEOUT",
        timeout: 50,
      };

      const onFrames = vi.fn();
      const framer = new SerialFramer(config, onFrames);

      framer.push({ data: new Uint8Array([65, 66, 67]), timestamp: 100 });

      expect(onFrames).not.toHaveBeenCalled();

      vi.advanceTimersByTime(50);

      expect(onFrames).toHaveBeenCalledTimes(1);
      expect(onFrames).toHaveBeenCalledWith([
        expect.objectContaining({
          data: new Uint8Array([65, 66, 67]),
        }),
      ]);
    });

    it("should reset timer on new data for TIMEOUT strategy", () => {
      const config: FramingConfig = {
        strategy: "TIMEOUT",
        timeout: 50,
      };

      const onFrames = vi.fn();
      const framer = new SerialFramer(config, onFrames);

      framer.push({ data: new Uint8Array([1]), timestamp: 100 });
      vi.advanceTimersByTime(25);

      framer.push({ data: new Uint8Array([2]), timestamp: 125 });
      vi.advanceTimersByTime(25);

      expect(onFrames).not.toHaveBeenCalled();

      vi.advanceTimersByTime(25);

      expect(onFrames).toHaveBeenCalledTimes(1);
      expect(onFrames).toHaveBeenCalledWith([
        expect.objectContaining({
          data: new Uint8Array([1, 2]),
        }),
      ]);
    });

    it("should reset buffer", () => {
      const config: FramingConfig = {
        strategy: "DELIMITER",
        delimiter: "\\n",
      };

      const onFrames = vi.fn();
      const framer = new SerialFramer(config, onFrames);

      framer.push({ data: new Uint8Array([65, 66]), timestamp: 100 });
      framer.reset();
      framer.push({ data: new Uint8Array([67, 10]), timestamp: 200 });

      expect(onFrames).toHaveBeenCalledTimes(1);
      expect(onFrames).toHaveBeenCalledWith([
        expect.objectContaining({
          data: new Uint8Array([67, 10]),
        }),
      ]);
    });

    it("should flush buffered data", () => {
      const config: FramingConfig = {
        strategy: "TIMEOUT",
        timeout: 50,
      };

      const onFrames = vi.fn();
      const framer = new SerialFramer(config, onFrames);

      framer.push({ data: new Uint8Array([1, 2, 3]), timestamp: 100 });
      expect(onFrames).not.toHaveBeenCalled();

      framer.flush();

      expect(onFrames).toHaveBeenCalledTimes(1);
      expect(onFrames).toHaveBeenCalledWith([
        expect.objectContaining({
          data: new Uint8Array([1, 2, 3]),
        }),
      ]);
    });

    it("should handle strategy change", () => {
      const config: FramingConfig = {
        strategy: "TIMEOUT",
        timeout: 50,
      };

      const onFrames = vi.fn();
      const framer = new SerialFramer(config, onFrames);

      framer.push({ data: new Uint8Array([65, 10]), timestamp: 100 });
      expect(onFrames).not.toHaveBeenCalled();

      // Change to DELIMITER strategy
      framer.setConfig({
        strategy: "DELIMITER",
        delimiter: "\\n",
      });

      // Should process buffered data with new strategy
      expect(onFrames).toHaveBeenCalledTimes(1);
      expect(onFrames).toHaveBeenCalledWith([
        expect.objectContaining({
          data: new Uint8Array([65, 10]),
        }),
      ]);
    });
  });
});
