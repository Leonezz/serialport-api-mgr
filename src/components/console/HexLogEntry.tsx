import React, { useState, memo } from "react";
import { X, MoreHorizontal } from "lucide-react";
import { cn, getBytes } from "../../lib/utils";
import HexDataView from "./HexDataView";
import { LogEntry } from "@/types";

interface HexLogEntryProps {
  log: LogEntry;
}

/**
 * HexLogEntry Component
 *
 * Design System Specifications (FIGMA-DESIGN.md 9.3):
 * - Padding: 16px
 * - Border Radius: radius.lg (8px)
 * - Background: bg.surface
 * - Border: 1px border.default
 * - Margin Bottom: 12px
 * - 16 bytes per row
 */

const HexLogEntry: React.FC<HexLogEntryProps> = ({ log }) => {
  const bytes = getBytes(log.data);
  const isTx = log.direction === "TX";
  const [selection, setSelection] = useState<{
    start: number;
    end: number;
  } | null>(null);

  const time = new Date(log.timestamp).toLocaleTimeString([], {
    hour12: false,
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    fractionalSecondDigits: 3,
  } as Intl.DateTimeFormatOptions);

  // Tag based on direction
  const tag = isTx ? "CMD" : "DATA";

  return (
    <div
      className={cn(
        "mb-3 border rounded-radius-lg overflow-hidden shadow-sm transition-all w-fit max-w-full",
        "bg-bg-surface border-border-default",
      )}
    >
      {/* Card Header - Section 9.3 */}
      <div
        className={cn(
          "flex items-center justify-between px-4 py-2 border-b select-none min-w-0",
          isTx
            ? "bg-blue-50 dark:bg-blue-500/10 border-blue-200 dark:border-blue-500/20"
            : "bg-green-50 dark:bg-green-500/10 border-green-200 dark:border-green-500/20",
        )}
      >
        <div className="flex items-center gap-3 shrink-0">
          {/* Timestamp */}
          <span className="text-[11px] flex items-center gap-1.5 font-mono text-text-muted">
            {time}
          </span>

          {/* Direction Badge */}
          <span
            className={cn(
              "font-bold text-[11px] font-mono",
              isTx
                ? "text-blue-600 dark:text-blue-400"
                : "text-green-600 dark:text-green-400",
            )}
          >
            {log.direction}
          </span>

          {/* Tag */}
          <span
            className={cn(
              "text-[11px] font-mono font-medium",
              isTx
                ? "text-amber-600 dark:text-amber-400"
                : "text-purple-600 dark:text-purple-400",
            )}
          >
            [{tag}]
          </span>

          {/* Byte count */}
          <span className="text-[11px] font-mono text-text-muted">
            {bytes.length} bytes
          </span>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          {selection && (
            <div className="flex items-center gap-2 animate-in fade-in slide-in-from-right-2">
              <span className="font-mono text-[10px] bg-bg-surface px-2 py-0.5 rounded border border-border-default shadow-sm">
                Sel: {Math.abs(selection.end - selection.start) + 1} B
              </span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setSelection(null);
                }}
                className="text-text-muted hover:text-text-primary transition-colors p-0.5 rounded-sm hover:bg-bg-hover"
                title="Clear Selection"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* More Options Button */}
          <button className="p-1 rounded-sm text-text-muted hover:text-text-primary hover:bg-bg-hover transition-colors">
            <MoreHorizontal className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Hex Content - 16 bytes per row (Section 9.3) */}
      <div className="p-4 overflow-x-auto bg-bg-surface custom-scrollbar">
        <div className="min-w-fit">
          <HexDataView
            data={bytes}
            selection={selection}
            setSelection={setSelection}
            bytesPerRow={16}
            hideBinary={true}
            stickyHeader={false}
            showInspector={true}
          />
        </div>
      </div>
    </div>
  );
};

/**
 * Custom comparison function for React.memo
 * Only re-render if log identity or data changes
 */
const arePropsEqual = (
  prevProps: HexLogEntryProps,
  nextProps: HexLogEntryProps,
): boolean => {
  // Compare log identity and timestamp
  if (prevProps.log.id !== nextProps.log.id) return false;
  if (prevProps.log.timestamp !== nextProps.log.timestamp) return false;
  return true;
};

const MemoizedHexLogEntry = memo(HexLogEntry, arePropsEqual);
MemoizedHexLogEntry.displayName = "HexLogEntry";

export default MemoizedHexLogEntry;
