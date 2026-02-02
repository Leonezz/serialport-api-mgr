import { FramingConfig, FramingStrategy } from "../types";
import { executeSandboxedScript } from "./sandboxedScripting";

export interface TimedChunk {
  data: Uint8Array;
  timestamp: number;
  payloadStart?: number;
  payloadLength?: number;
}

export type FrameHandler = (frames: TimedChunk[]) => void;

interface CompositionResult {
  frames: TimedChunk[];
  remaining: TimedChunk[];
}

/**
 * Pure function to extract frames from a list of timed chunks based on strategy.
 * Note: This function is async to support sandboxed script execution.
 */
export const composeFrames = async (
  chunks: TimedChunk[],
  config: FramingConfig,
  forceFlush: boolean = false,
): Promise<CompositionResult> => {
  if (chunks.length === 0) {
    return { frames: [], remaining: [] };
  }

  const strategy = config.strategy as FramingStrategy;

  // --- Strategy: SCRIPT (Custom Full Control) ---
  if (strategy === "SCRIPT" && config.script) {
    try {
      // Execute script in sandboxed environment
      // Script receives context.chunks and context.forceFlush
      // Script must return { frames: [], remaining: [] }
      const result = await executeSandboxedScript(
        config.script,
        { chunks, forceFlush },
        { timeout: 2000 }, // Shorter timeout for framing
      );

      // Validate return structure
      if (
        result &&
        typeof result === "object" &&
        "frames" in result &&
        "remaining" in result &&
        Array.isArray((result as CompositionResult).frames) &&
        Array.isArray((result as CompositionResult).remaining)
      ) {
        // Convert arrays back to Uint8Array if needed (QuickJS converts to number arrays)
        const typedResult = result as {
          frames: Array<{
            data: number[] | Uint8Array;
            timestamp: number;
            payloadStart?: number;
            payloadLength?: number;
          }>;
          remaining: Array<{
            data: number[] | Uint8Array;
            timestamp: number;
            payloadStart?: number;
            payloadLength?: number;
          }>;
        };

        return {
          frames: typedResult.frames.map((f) => ({
            ...f,
            data:
              f.data instanceof Uint8Array ? f.data : new Uint8Array(f.data),
          })),
          remaining: typedResult.remaining.map((r) => ({
            ...r,
            data:
              r.data instanceof Uint8Array ? r.data : new Uint8Array(r.data),
          })),
        };
      } else {
        console.warn(
          "Script framing returned invalid structure. Expected { frames: [], remaining: [] }",
        );
        // Fallback to NONE behavior to avoid data loss
        return { frames: [], remaining: chunks };
      }
    } catch (e) {
      console.error("Framing Script Error:", e);
      // Fallback
      return { frames: [], remaining: chunks };
    }
  }

  // --- Strategy: NONE or TIMEOUT (Flush) ---
  if (strategy === "NONE" || (strategy === "TIMEOUT" && forceFlush)) {
    const totalLen = chunks.reduce((acc, c) => acc + c.data.length, 0);
    const merged = new Uint8Array(totalLen);
    let offset = 0;
    for (const c of chunks) {
      merged.set(c.data, offset);
      offset += c.data.length;
    }

    return {
      frames: [
        {
          data: merged,
          timestamp: chunks[0].timestamp,
          payloadStart: 0,
          payloadLength: totalLen,
        },
      ],
      remaining: [],
    };
  }

  // --- Strategy: TIMEOUT (No Flush) ---
  if (strategy === "TIMEOUT" && !forceFlush) {
    return { frames: [], remaining: chunks };
  }

  // --- Strategy: DELIMITER / PREFIX_LENGTH ---
  const totalLen = chunks.reduce((acc, c) => acc + c.data.length, 0);
  const buffer = new Uint8Array(totalLen);
  let offset = 0;
  for (const c of chunks) {
    buffer.set(c.data, offset);
    offset += c.data.length;
  }

  const frames: TimedChunk[] = [];
  let consumedBytes = 0;
  let scanIndex = 0;
  const MAX_LOOPS = 1000;
  let loops = 0;

  while (scanIndex < buffer.length && loops < MAX_LOOPS) {
    loops++;
    const searchBuffer = buffer.subarray(scanIndex);
    const { frameLength, headerLength } = findFrameInView(searchBuffer, config);

    if (frameLength > 0) {
      // Keep the full frame raw bytes (including delimiter/prefix)
      const frameData = searchBuffer.slice(0, frameLength);

      // Find timestamp of the start byte
      let currentGlobalIndex = 0;
      let frameTimestamp = Date.now();

      for (const c of chunks) {
        if (
          scanIndex >= currentGlobalIndex &&
          scanIndex < currentGlobalIndex + c.data.length
        ) {
          frameTimestamp = c.timestamp;
          break;
        }
        currentGlobalIndex += c.data.length;
      }

      // Calculate payload metadata relative to the frameData
      let relativePayloadStart = 0;
      let relativePayloadLength = frameLength;

      if (strategy === "PREFIX_LENGTH") {
        relativePayloadStart = headerLength;
        relativePayloadLength = frameLength - headerLength;
      } else if (strategy === "DELIMITER") {
        relativePayloadLength = frameLength - headerLength;
      }

      frames.push({
        data: frameData,
        timestamp: frameTimestamp,
        payloadStart: relativePayloadStart,
        payloadLength: relativePayloadLength,
      });

      scanIndex += frameLength;
      consumedBytes += frameLength;
    } else {
      break;
    }
  }

  // Reconstruct Remaining
  const remaining: TimedChunk[] = [];
  let bytesToRemove = consumedBytes;

  for (const c of chunks) {
    if (bytesToRemove >= c.data.length) {
      bytesToRemove -= c.data.length;
    } else if (bytesToRemove > 0) {
      remaining.push({
        data: c.data.slice(bytesToRemove),
        timestamp: c.timestamp,
      });
      bytesToRemove = 0;
    } else {
      remaining.push(c);
    }
  }

  return { frames, remaining };
};

function readUInt(view: DataView, size: number, isLE: boolean): number {
  let value = 0;
  if (isLE) {
    for (let i = 0; i < size; i++) value += view.getUint8(i) * Math.pow(256, i);
  } else {
    for (let i = 0; i < size; i++) value = value * 256 + view.getUint8(i);
  }
  return value;
}

function findFrameInView(
  buf: Uint8Array,
  config: FramingConfig,
): { frameLength: number; headerLength: number } {
  const strategy = config.strategy as FramingStrategy;

  if (strategy === "PREFIX_LENGTH") {
    const prefixSize = config.prefixLengthSize || 1;
    if (buf.length < prefixSize) return { frameLength: 0, headerLength: 0 };

    const view = new DataView(buf.buffer, buf.byteOffset, buf.byteLength);
    const isLE = config.byteOrder === "LE";
    let payloadLen = 0;

    try {
      payloadLen = readUInt(view, prefixSize, isLE);
    } catch {
      return { frameLength: 0, headerLength: 0 };
    }

    const total = prefixSize + payloadLen;
    if (buf.length >= total) {
      return { frameLength: total, headerLength: prefixSize };
    }
  } else if (strategy === "DELIMITER") {
    const dStr = config.delimiter || "\n";
    let delimiterBytes: Uint8Array;

    const isHex = /^[0-9A-Fa-f\s]+$/.test(dStr) && dStr.includes(" ");
    if (isHex) {
      const clean = dStr.replace(/[^0-9A-Fa-f]/g, "");
      delimiterBytes = new Uint8Array(clean.length / 2);
      for (let i = 0; i < clean.length; i += 2)
        delimiterBytes[i / 2] = parseInt(clean.substring(i, i + 2), 16);
    } else {
      const unescaped = dStr
        .replace(/\\n/g, "\n")
        .replace(/\\r/g, "\r")
        .replace(/\\t/g, "\t");
      delimiterBytes = new TextEncoder().encode(unescaped);
    }

    if (delimiterBytes.length === 0) return { frameLength: 0, headerLength: 0 };

    for (let i = 0; i <= buf.length - delimiterBytes.length; i++) {
      let match = true;
      for (let j = 0; j < delimiterBytes.length; j++) {
        if (buf[i + j] !== delimiterBytes[j]) {
          match = false;
          break;
        }
      }
      if (match)
        return {
          frameLength: i + delimiterBytes.length,
          headerLength: delimiterBytes.length,
        };
    }
  }

  return { frameLength: 0, headerLength: 0 };
}

export class SerialFramer {
  private chunks: TimedChunk[] = [];
  // Fix: Using any instead of NodeJS.Timeout to avoid namespace errors in browser environment
  private timer: ReturnType<typeof setTimeout> | null = null;

  constructor(
    private config: FramingConfig,
    private onFrames: FrameHandler,
  ) {}

  public setConfig(newConfig: FramingConfig) {
    const oldStrategy = this.config.strategy;
    this.config = newConfig;

    if (oldStrategy === "TIMEOUT" && newConfig.strategy !== "TIMEOUT") {
      if (this.timer) {
        clearTimeout(this.timer);
        this.timer = null;
      }
    }

    if (newConfig.strategy !== "TIMEOUT" && this.chunks.length > 0) {
      this.runCompose(false);
    }
  }

  public push({ data, timestamp }: { data: Uint8Array; timestamp: number }) {
    if (data.length === 0) return;
    this.chunks.push({ data, timestamp });
    this.runCompose(false);
  }

  public reset() {
    this.chunks = [];
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
  }

  public flush() {
    this.runCompose(true);
  }

  private runCompose(forceFlush: boolean) {
    if (this.config.strategy === "TIMEOUT") {
      if (this.timer) clearTimeout(this.timer);
      if (!forceFlush) {
        const timeoutMs = this.config.timeout || 50;
        this.timer = setTimeout(() => {
          this.runCompose(true);
        }, timeoutMs);
      }
    }

    // composeFrames is now async, handle the promise
    composeFrames(this.chunks, this.config, forceFlush)
      .then((result) => {
        if (result.frames.length > 0) {
          this.onFrames(result.frames);
        }
        this.chunks = result.remaining;
      })
      .catch((error) => {
        console.error("Error in composeFrames:", error);
        // Keep chunks intact on error to avoid data loss
      });
  }
}
