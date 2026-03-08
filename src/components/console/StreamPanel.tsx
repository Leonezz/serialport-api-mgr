import React, { useRef, useState, useEffect } from "react";
import { ArrowDown, ArrowUp, X, Binary } from "lucide-react";
import { cn, getBytes } from "../../lib/utils";
import HexDataView from "./HexDataView";
import { useStore } from "../../lib/store";
import type { LogEntry } from "@/types";

/**
 * StreamPanel Component
 *
 * Design System Specifications (FIGMA-DESIGN.md 9.4):
 * - Pane Header: 36px height
 * - TX: blue.50 bg, blue.700 text (light) / rgba(59,130,246,0.15) bg, blue.300 text (dark)
 * - RX: green.50 bg, green.700 text (light) / rgba(16,185,129,0.15) bg, green.300 text (dark)
 * - Pane Footer: 28px height, shows Total Bytes and Rate (B/s)
 */

const TARGET_FPS = 10; // Lower than chart panels since DOM updates are heavier

// Growing byte buffer — avoids full O(n) reconstruction on every log
interface GrowingBuffer {
  data: Uint8Array;
  length: number;
}

function createGrowingBuffer(initialSize = 4096): GrowingBuffer {
  return { data: new Uint8Array(initialSize), length: 0 };
}

function appendToBuffer(buf: GrowingBuffer, bytes: Uint8Array): void {
  const needed = buf.length + bytes.length;
  if (needed > buf.data.length) {
    const newSize = Math.max(needed, buf.data.length * 2);
    const newData = new Uint8Array(newSize);
    newData.set(buf.data.subarray(0, buf.length));
    buf.data = newData;
  }
  buf.data.set(bytes, buf.length);
  buf.length += bytes.length;
}

interface StreamPanelProps {
  title: string;
  direction: "TX" | "RX";
  className?: string;
}

const StreamPanel: React.FC<StreamPanelProps> = ({
  title,
  direction,
  className,
}) => {
  const activeSessionId = useStore((s) => s.activeSessionId);

  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [autoScroll, setAutoScroll] = useState(true);
  // Guard to distinguish programmatic scrollTop changes from user scrolls
  const lastProgrammaticScrollRef = useRef(0);

  // Selection State
  const [selection, setSelection] = useState<{
    start: number;
    end: number;
  } | null>(null);

  // Rate calculation using interval-based sampling
  const [rate, setRate] = useState(0);
  const prevBytesRef = useRef(0);

  // Incremental byte buffer (mutated in place, no re-renders)
  const bufferRef = useRef<GrowingBuffer>(createGrowingBuffer());
  const dirtyRef = useRef(false);

  // Queue-based log tracking — immune to buffer rollover (push+splice keeps length constant)
  const pendingLogsRef = useRef<LogEntry[]>([]);
  const lastSeenIdRef = useRef<string | number | null>(null);
  const clearSignalRef = useRef(false);

  // Data snapshot for rendering — updated by interval, avoids reading refs during render
  const [combinedData, setCombinedData] = useState<Uint8Array>(
    new Uint8Array(0),
  );

  // Subscribe to store + seed buffer on session change
  useEffect(() => {
    bufferRef.current = createGrowingBuffer();
    pendingLogsRef.current = [];
    lastSeenIdRef.current = null;
    clearSignalRef.current = false;
    dirtyRef.current = true;

    // Seed from current state — process all existing logs directly into buffer
    const state = useStore.getState();
    const logs = state.sessions[activeSessionId]?.logs ?? [];
    for (const log of logs) {
      if (log.direction === direction) {
        appendToBuffer(bufferRef.current, getBytes(log.data));
      }
    }
    if (logs.length > 0) {
      lastSeenIdRef.current = logs[logs.length - 1].id;
    }

    // Subscription detects new logs by ID and queues them (unaffected by buffer trim)
    const unsub = useStore.subscribe((s) => {
      const currentLogs = s.sessions[s.activeSessionId]?.logs ?? [];
      if (currentLogs.length === 0) {
        if (lastSeenIdRef.current !== null) {
          clearSignalRef.current = true;
          lastSeenIdRef.current = null;
        }
        return;
      }
      const lastId = currentLogs[currentLogs.length - 1].id;
      if (lastId === lastSeenIdRef.current) return;

      if (lastSeenIdRef.current === null) {
        pendingLogsRef.current.push(...currentLogs);
      } else {
        // Scan backwards — last seen is typically 1-5 positions from end
        let foundIdx = -1;
        for (
          let i = currentLogs.length - 2;
          i >= Math.max(0, currentLogs.length - 50);
          i--
        ) {
          if (currentLogs[i].id === lastSeenIdRef.current) {
            foundIdx = i;
            break;
          }
        }
        if (foundIdx >= 0) {
          for (let j = foundIdx + 1; j < currentLogs.length; j++) {
            pendingLogsRef.current.push(currentLogs[j]);
          }
        } else {
          // Last seen was trimmed out of buffer — just add the latest entry
          pendingLogsRef.current.push(currentLogs[currentLogs.length - 1]);
        }
      }
      lastSeenIdRef.current = lastId;
    });
    return unsub;
  }, [activeSessionId, direction]);

  // Consume pending logs + throttled render at TARGET_FPS
  useEffect(() => {
    const interval = setInterval(() => {
      if (clearSignalRef.current) {
        clearSignalRef.current = false;
        bufferRef.current = createGrowingBuffer();
        dirtyRef.current = true;
      }

      const pending = pendingLogsRef.current;
      if (pending.length === 0 && !dirtyRef.current) return;

      if (pending.length > 0) {
        const batch = pending.splice(0);
        for (const log of batch) {
          if (log.direction === direction) {
            appendToBuffer(bufferRef.current, getBytes(log.data));
          }
        }
        dirtyRef.current = true;
      }

      if (dirtyRef.current) {
        dirtyRef.current = false;
        const buf = bufferRef.current;
        setCombinedData(buf.data.subarray(0, buf.length));
      }
    }, 1000 / TARGET_FPS);

    return () => clearInterval(interval);
  }, [direction]);

  // Calculate data rate (every 1 second)
  useEffect(() => {
    const intervalId = setInterval(() => {
      const currentBytes = bufferRef.current.length;
      const bytesDiff = currentBytes - prevBytesRef.current;
      prevBytesRef.current = currentBytes;
      setRate(bytesDiff > 0 ? bytesDiff : 0);
    }, 1000);
    return () => clearInterval(intervalId);
  }, []);

  const formatRate = (bytesPerSecond: number): string => {
    if (bytesPerSecond < 1) return "0 B/s";
    if (bytesPerSecond >= 1024 * 1024)
      return `${(bytesPerSecond / (1024 * 1024)).toFixed(1)} MB/s`;
    if (bytesPerSecond >= 1024)
      return `${(bytesPerSecond / 1024).toFixed(1)} KB/s`;
    return `${Math.round(bytesPerSecond)} B/s`;
  };

  const formatBytes = (bytes: number): string => {
    if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
    if (bytes >= 1024) return `${(bytes / 1024).toFixed(2)} KB`;
    return `${bytes} B`;
  };

  const headerStyles =
    direction === "TX"
      ? "bg-blue-50 dark:bg-blue-500/15 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-500/30"
      : "bg-green-50 dark:bg-green-500/15 text-green-700 dark:text-green-300 border-green-200 dark:border-green-500/30";

  // Auto scroll on new data — use instant scroll to keep up with high-frequency updates
  useEffect(() => {
    if (autoScroll && scrollContainerRef.current) {
      lastProgrammaticScrollRef.current = performance.now();
      scrollContainerRef.current.scrollTop =
        scrollContainerRef.current.scrollHeight;
    }
  }, [combinedData, autoScroll]);

  return (
    <div
      className={cn(
        "flex flex-col h-full border rounded-lg overflow-hidden bg-bg-surface shadow-sm relative",
        direction === "TX"
          ? "border-blue-200 dark:border-blue-500/30"
          : "border-green-200 dark:border-green-500/30",
        className,
      )}
    >
      {/* Pane Header - 36px (Section 9.4) */}
      <div
        className={cn(
          "h-9 flex items-center justify-between px-3 border-b text-label-md font-semibold shrink-0",
          headerStyles,
        )}
      >
        <div className="flex items-center gap-2">
          {direction === "TX" ? (
            <ArrowUp className="w-4 h-4" />
          ) : (
            <ArrowDown className="w-4 h-4" />
          )}
          <span>{title}</span>
        </div>
        <div className="flex items-center gap-3">
          {selection && (
            <div className="flex items-center gap-2 animate-in fade-in slide-in-from-right-2">
              <span className="font-mono text-[10px] bg-bg-surface/50 px-2 py-0.5 rounded border border-border-default/50 shadow-sm">
                Sel: {Math.abs(selection.end - selection.start) + 1} B
              </span>
              <button
                onClick={() => setSelection(null)}
                className="text-text-muted hover:text-text-primary transition-colors p-0.5 rounded-sm hover:bg-bg-hover"
                title="Clear Selection"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <div
        ref={scrollContainerRef}
        className="flex-1 overflow-auto custom-scrollbar relative bg-bg-surface/50"
        onScroll={() => {
          // Skip scroll events caused by programmatic scrollTop changes
          if (performance.now() - lastProgrammaticScrollRef.current < 150)
            return;
          const el = scrollContainerRef.current;
          if (!el) return;
          const isNearBottom =
            el.scrollHeight - el.scrollTop - el.clientHeight < 100;
          setAutoScroll(isNearBottom);
        }}
      >
        {combinedData.length > 0 ? (
          <HexDataView
            data={combinedData}
            selection={selection}
            setSelection={setSelection}
            onInteractionStart={() => setAutoScroll(false)}
            bytesPerRow={16}
            hideBinary={true}
            stickyHeader={true}
            showInspector={true}
            disableXScroll={true}
            scrollContainerRef={scrollContainerRef}
          />
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-text-muted/30 select-none">
            <Binary className="w-8 h-8 mb-2 opacity-50" />
            <span className="text-xs">No Data</span>
          </div>
        )}
      </div>

      {/* Pane Footer - 28px Stats (Section 9.4) */}
      <div
        className={cn(
          "h-7 flex items-center justify-between px-3 border-t text-mono-sm font-mono shrink-0",
          direction === "TX"
            ? "bg-blue-50/50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-500/30"
            : "bg-green-50/50 dark:bg-green-500/10 text-green-600 dark:text-green-400 border-green-200 dark:border-green-500/30",
        )}
      >
        <span>Total: {formatBytes(combinedData.length)}</span>
        <span>Rate: {formatRate(rate)}</span>
      </div>

      {/* Local Scroll Button */}
      {!autoScroll && (
        <button
          onClick={() => setAutoScroll(true)}
          className={cn(
            "absolute bottom-12 right-4 h-7 w-7 rounded-full shadow-lg flex items-center justify-center hover:scale-105 transition-transform z-20",
            direction === "TX"
              ? "bg-blue-500 text-white hover:bg-blue-600"
              : "bg-green-500 text-white hover:bg-green-600",
          )}
        >
          <ArrowDown className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );
};

export default StreamPanel;
