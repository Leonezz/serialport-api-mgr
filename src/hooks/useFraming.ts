import { useRef } from "react";
import { SerialFramer } from "../lib/parsers/framing";
import { useStore } from "../lib/store";
import { BUFFER_SIZES } from "../lib/constants";
import { parsePlotterData } from "../lib/parsers/plotterParser";

/**
 * Custom hook for managing serial data framing
 * Handles frame processing, framing strategy, and override management
 */
export function useFraming() {
  // Store a SerialFramer instance per session
  const framersRef = useRef<Map<string, SerialFramer>>(new Map());

  // Timer for framing override expiration safety
  const overrideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  /**
   * Process a single frame of data
   * Uses batched processSerialFrame to combine addLog + addPlotterData + addSystemLog
   * into a single store update (1 React re-render instead of 3).
   */
  const processFrame = (
    data: Uint8Array,
    timestamp: number,
    sessionId: string,
    onValidate?: (data: Uint8Array, sessionId: string, logId: string) => void,
  ) => {
    // Prepare plotter point (if plotter is enabled)
    const state = useStore.getState();
    const session = state.sessions[sessionId];
    const plotterConfig = session?.plotter?.config;
    const plotterPoint = plotterConfig?.enabled
      ? parsePlotterData(data, plotterConfig)
      : null;

    // Prepare system log details
    let preview = "";
    try {
      const text = new TextDecoder().decode(data);
      preview = text.replace(/[^\x20-\x7E]/g, ".");
    } catch {
      preview = "...";
    }
    const displayPreview =
      preview.length > BUFFER_SIZES.MAX_PREVIEW_LENGTH
        ? preview.substring(0, BUFFER_SIZES.MAX_PREVIEW_LENGTH) + "..."
        : preview;
    const hexPreview =
      Array.from(data)
        .slice(0, 10)
        .map((b) => b.toString(16).padStart(2, "0").toUpperCase())
        .join(" ") + (data.length > 10 ? "..." : "");

    // Single batched store update: addLog + addPlotterData + addSystemLog
    const logId = state.processSerialFrame(
      data,
      sessionId,
      `RX Frame ${data.length}B: ${displayPreview}`,
      { sessionId, hex: hexPreview, data: Array.from(data), timestamp },
      plotterPoint,
    );

    // Validate (if callback provided)
    if (onValidate) {
      onValidate(data, sessionId, logId);
    }

    // --- Override Auto-Revert Logic ---
    const currentSessionState = useStore.getState().sessions[sessionId];
    if (currentSessionState && currentSessionState.framingOverride) {
      // Clear override in Store
      useStore.getState().setFramingOverride(undefined);

      // Clear safety timer
      if (overrideTimerRef.current) {
        clearTimeout(overrideTimerRef.current);
        overrideTimerRef.current = null;
      }

      // Update Framer immediately to Global Config
      const framer = framersRef.current.get(sessionId);
      if (framer) {
        const globalConfig = currentSessionState.config.framing || {
          strategy: "NONE",
          delimiter: "",
          timeout: 50,
          prefixLengthSize: 1,
          byteOrder: "LE",
        };
        framer.setConfig(globalConfig);
      }
    }
  };

  /**
   * Handle incoming data chunk and process through framer
   */
  const handleDataReceived = (
    sessionId: string,
    onValidate?: (data: Uint8Array, sessionId: string, logId: string) => void,
  ) => {
    return (chunk: Uint8Array) => {
      let framer = framersRef.current.get(sessionId);

      const session = useStore.getState().sessions[sessionId];
      if (!session) {
        console.warn(`[${sessionId}] No session found for framing`);
        return;
      }

      const effectiveConfig = session.framingOverride ||
        session.config.framing || {
          strategy: "NONE",
          delimiter: "",
          timeout: 50,
          prefixLengthSize: 1,
          byteOrder: "LE",
        };

      if (!framer) {
        // Initialize Framer
        framer = new SerialFramer(
          effectiveConfig,
          // Fix: Callback receives frames array, iterate to process individual frames
          (frames) =>
            frames.forEach((f) =>
              processFrame(f.data, f.timestamp, sessionId, onValidate),
            ),
        );
        framersRef.current.set(sessionId, framer);
      } else {
        // Always ensure config is up to date
        framer.setConfig(effectiveConfig);
      }

      // Push with current timestamp
      framer.push({ data: chunk, timestamp: Date.now() });
    };
  };

  /**
   * Clean up framer for a session
   */
  const cleanupFramer = (sessionId: string) => {
    const framer = framersRef.current.get(sessionId);
    if (framer) {
      framer.flush(); // Process any remaining data
      framersRef.current.delete(sessionId);
    }
    if (overrideTimerRef.current) {
      clearTimeout(overrideTimerRef.current);
      overrideTimerRef.current = null;
    }
  };

  return {
    handleDataReceived,
    cleanupFramer,
    overrideTimerRef,
  };
}
