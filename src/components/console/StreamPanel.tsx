import React, {
  useRef,
  useState,
  useMemo,
  useEffect,
  useDeferredValue,
} from "react";
import { ArrowDown, X, Binary } from "lucide-react";
import { cn, getBytes } from "../../lib/utils";
import HexDataView from "./HexDataView";
import { LogEntry } from "@/types";

interface StreamPanelProps {
  title: string;
  logs: LogEntry[];
  direction: "TX" | "RX";
  className?: string;
  accentColorClass?: string;
}

const StreamPanel: React.FC<StreamPanelProps> = ({
  title,
  logs,
  direction,
  className,
  accentColorClass,
}) => {
  const endRef = useRef<HTMLDivElement>(null);
  const [autoScroll, setAutoScroll] = useState(true);

  // Selection State
  const [selection, setSelection] = useState<{
    start: number;
    end: number;
  } | null>(null);

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

  // 2. Auto Scroll Logic
  useEffect(() => {
    if (autoScroll) {
      endRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [combinedData, autoScroll]);

  return (
    <div
      className={cn(
        "flex flex-col h-full border rounded-lg overflow-hidden bg-card shadow-sm relative",
        className,
      )}
    >
      {/* Header */}
      <div
        className={cn(
          "flex items-center justify-between px-3 py-2 border-b text-xs font-bold tracking-wider shrink-0",
          accentColorClass || "bg-muted/30",
        )}
      >
        <div className="flex items-center gap-2">
          {direction === "RX" ? (
            <ArrowDown className="w-3.5 h-3.5" />
          ) : (
            <ArrowDown className="w-3.5 h-3.5 rotate-180" />
          )}
          {title}
        </div>
        <div className="flex items-center gap-4">
          {selection && (
            <div className="flex items-center gap-2 animate-in fade-in slide-in-from-right-2">
              <span className="font-mono text-[10px] bg-background/50 px-2 py-0.5 rounded border border-border/50 shadow-sm">
                Sel: {Math.abs(selection.end - selection.start) + 1} B
              </span>
              <button
                onClick={() => setSelection(null)}
                className="text-muted-foreground hover:text-foreground transition-colors p-0.5 rounded-sm hover:bg-black/5 dark:hover:bg-white/10"
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
          <span className="font-mono opacity-70 text-[10px]">
            {combinedData.length} B
          </span>
        </div>
      </div>

      {/* Content */}
      <div
        className="flex-1 overflow-auto custom-scrollbar relative bg-background/50"
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
          <div className="h-full flex flex-col items-center justify-center text-muted-foreground/30 select-none">
            <Binary className="w-8 h-8 mb-2 opacity-50" />
            <span className="text-xs">No Data</span>
          </div>
        )}

        {/* Scroll Anchor */}
        <div ref={endRef} />
      </div>

      {/* Local Scroll Button */}
      {!autoScroll && (
        <button
          onClick={() => setAutoScroll(true)}
          className="absolute bottom-4 right-4 bg-primary text-primary-foreground h-7 w-7 rounded-full shadow-lg flex items-center justify-center hover:scale-105 transition-transform z-20"
        >
          <ArrowDown className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );
};

export default StreamPanel;
