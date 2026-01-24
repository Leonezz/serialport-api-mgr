import React, {
  useRef,
  useState,
  useMemo,
  useEffect,
  useDeferredValue,
} from "react";
import { ArrowDown, ArrowUp, X, Binary } from "lucide-react";
import { cn, getBytes } from "../../lib/utils";
import HexDataView from "./HexDataView";
import { LogEntry } from "@/types";

/**
 * StreamPanel Component
 *
 * Design System Specifications (FIGMA-DESIGN.md 9.4):
 * - Pane Header: 36px height
 * - TX: blue.50 bg, blue.700 text (light) / rgba(59,130,246,0.15) bg, blue.300 text (dark)
 * - RX: green.50 bg, green.700 text (light) / rgba(16,185,129,0.15) bg, green.300 text (dark)
 * - Pane Footer: 28px height, shows Total Bytes and Rate (B/s)
 */

interface StreamPanelProps {
  title: string;
  logs: LogEntry[];
  direction: "TX" | "RX";
  className?: string;
}

const StreamPanel: React.FC<StreamPanelProps> = ({
  title,
  logs,
  direction,
  className,
}) => {
  const endRef = useRef<HTMLDivElement>(null);
  const [autoScroll, setAutoScroll] = useState(true);

  // Selection State
  const [selection, setSelection] = useState<{
    start: number;
    end: number;
  } | null>(null);

  // Rate calculation using interval-based sampling
  const [rate, setRate] = useState(0);
  const prevBytesRef = useRef(0);

  // 1. Combine Data - defer logs to keep UI responsive
  const deferredLogs = useDeferredValue(logs);
  const isLogsStale = logs !== deferredLogs;

  const combinedData = useMemo(() => {
    const relevantLogs = deferredLogs.filter((l) => l.direction === direction);
    if (relevantLogs.length === 0) return new Uint8Array(0);

    const arrays = relevantLogs.map((l) => getBytes(l.data));
    const totalSize = arrays.reduce((acc, arr) => acc + arr.length, 0);

    const result = new Uint8Array(totalSize);
    let offset = 0;
    for (const arr of arrays) {
      result.set(arr, offset);
      offset += arr.length;
    }
    return result;
  }, [deferredLogs, direction]);

  // Calculate data rate using interval sampling (every 1 second)
  useEffect(() => {
    const intervalId = setInterval(() => {
      const currentBytes = combinedData.length;
      const bytesDiff = currentBytes - prevBytesRef.current;
      prevBytesRef.current = currentBytes;
      // Rate is bytes per second (interval is 1000ms)
      setRate(bytesDiff > 0 ? bytesDiff : 0);
    }, 1000);

    return () => clearInterval(intervalId);
  }, [combinedData.length]);

  // Format rate for display
  const formatRate = (bytesPerSecond: number): string => {
    if (bytesPerSecond < 1) return "0 B/s";
    if (bytesPerSecond >= 1024 * 1024)
      return `${(bytesPerSecond / (1024 * 1024)).toFixed(1)} MB/s`;
    if (bytesPerSecond >= 1024)
      return `${(bytesPerSecond / 1024).toFixed(1)} KB/s`;
    return `${Math.round(bytesPerSecond)} B/s`;
  };

  // Format total bytes
  const formatBytes = (bytes: number): string => {
    if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
    if (bytes >= 1024) return `${(bytes / 1024).toFixed(2)} KB`;
    return `${bytes} B`;
  };

  // Header styling based on direction (Section 9.4)
  const headerStyles =
    direction === "TX"
      ? "bg-blue-50 dark:bg-blue-500/15 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-500/30"
      : "bg-green-50 dark:bg-green-500/15 text-green-700 dark:text-green-300 border-green-200 dark:border-green-500/30";

  // 2. Auto Scroll Logic
  useEffect(() => {
    if (autoScroll) {
      endRef.current?.scrollIntoView({ behavior: "smooth" });
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
          {isLogsStale && (
            <span className="font-mono text-[10px] bg-amber-500/10 text-amber-600 px-2 py-0.5 rounded border border-amber-500/30 animate-pulse">
              Updating...
            </span>
          )}
        </div>
      </div>

      {/* Content */}
      <div
        className="flex-1 overflow-auto custom-scrollbar relative bg-bg-surface/50"
        onScroll={(e) => {
          const target = e.target as HTMLDivElement;
          const isNearBottom =
            target.scrollHeight - target.scrollTop - target.clientHeight < 100;
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
          />
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-text-muted/30 select-none">
            <Binary className="w-8 h-8 mb-2 opacity-50" />
            <span className="text-xs">No Data</span>
          </div>
        )}

        {/* Scroll Anchor */}
        <div ref={endRef} />
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
