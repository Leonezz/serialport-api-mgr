import { useRef } from "react";
import { SerialFramer } from "../lib/framing";
import { useStore } from "../lib/store";
import { BUFFER_SIZES } from "../lib/constants";
import { parsePlotterData } from "../lib/plotterParser";

/**
 * Custom hook for managing serial data framing
 * Handles frame processing, framing strategy, and override management
 */
export function useFraming() {
  // Store a SerialFramer instance per session
  const framersRef = useRef<Map<string, SerialFramer>>(new Map());

  // Timer for framing override expiration safety
  const overrideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const { addLog, addSystemLog, setFramingOverride, addPlotterData } =
    useStore();

  /**
   * Process a single frame of data
   */
  const processFrame = (
    data: Uint8Array,
    timestamp: number,
    sessionId: string,
    onValidate?: (data: Uint8Array, sessionId: string, logId: string) => void,
  ) => {
    // Add Log (Console) - Use the actual frame timestamp
    const logId = addLog(data, "RX", undefined, sessionId);

    // Plotter Support
    const session = useStore.getState().sessions[sessionId];
    const plotterConfig = session?.plotter?.config;
    if (plotterConfig?.enabled) {
      const point = parsePlotterData(data, plotterConfig);
      if (point) {
        addPlotterData(point);
      }
    }

    // Validate (if callback provided)
    if (onValidate) {
      onValidate(data, sessionId, logId);
    }

    // System Log (Operation History)
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

    addSystemLog(
      "INFO",
      "COMMAND",
      `RX Frame ${data.length}B: ${displayPreview}`,
      {
        sessionId,
        hex: hexPreview,
        data: Array.from(data),
        timestamp,
      },
    );

    // --- Override Auto-Revert Logic ---
    const currentSessionState = useStore.getState().sessions[sessionId];
    if (currentSessionState && currentSessionState.framingOverride) {
      // Clear override in Store
      setFramingOverride(undefined);

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
