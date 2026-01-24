import * as React from "react";
import { cn, formatContent } from "../../lib/utils";
import Ansi from "ansi-to-react";
import { LogEntry, DataMode } from "../../types";

/**
 * LogItem Component
 *
 * Design System Specifications (FIGMA-DESIGN.md 9.2):
 * - Min Height: 32px
 * - Padding: 8px 16px
 * - Gap: 12px between elements
 * - Border Radius: radius.sm (4px) → `rounded`
 * - Left Border: 3px when highlighted
 *
 * Element Widths:
 * - Timestamp: 88px, mono.sm (11px), text-text-muted
 * - Direction: 24px, mono.sm bold, semantic colors (blue=TX, green=RX)
 * - Tag: auto, mono.sm medium, semantic colors (purple=DATA, amber=CMD, etc.)
 * - Content: flex, mono.md (13px), text-text-primary
 *
 * Design Tokens Used:
 * - text-text-muted: Timestamp
 * - text-text-primary: Content
 * - bg-bg-hover: Hover state
 * - Semantic colors (blue/green/purple/amber): Direction & Tag indicators
 */

export type LogTag = "DATA" | "CMD" | "RESP" | "INFO";

export interface LogItemProps {
  /** Log entry data */
  log: LogEntry;
  /** Display mode for content */
  displayMode?: DataMode;
  /** Enable ANSI rendering for TEXT mode */
  enableAnsi?: boolean;
  /** Whether the item is highlighted (TX/RX) */
  highlighted?: boolean;
  /** Tag override */
  tag?: LogTag;
  /** Additional className */
  className?: string;
  /** Called when item is clicked */
  onClick?: () => void;
}

const directionConfig = {
  TX: {
    color: "text-blue-500 dark:text-blue-400",
    bgHighlight: "bg-blue-50 dark:bg-blue-500/10",
    border: "border-l-blue-400",
  },
  RX: {
    color: "text-green-500 dark:text-green-400",
    bgHighlight: "bg-green-50 dark:bg-green-500/10",
    border: "border-l-green-400",
  },
};

const tagConfig: Record<LogTag, { color: string }> = {
  DATA: { color: "text-purple-600 dark:text-purple-400" },
  CMD: { color: "text-amber-600 dark:text-amber-400" },
  RESP: { color: "text-green-600 dark:text-green-400" },
  INFO: { color: "text-blue-600 dark:text-blue-400" },
};

const LogItem: React.FC<LogItemProps> = ({
  log,
  displayMode = "TEXT",
  enableAnsi = true,
  highlighted = false,
  tag: tagOverride,
  className,
  onClick,
}) => {
  const isTx = log.direction === "TX";
  const dirConfig = directionConfig[log.direction] || directionConfig.RX;

  // Determine tag based on log properties - use commandParams presence as indicator
  const hasCommand =
    log.commandParams && Object.keys(log.commandParams).length > 0;
  const hasResponse =
    log.extractedVars && Object.keys(log.extractedVars).length > 0;

  const tag: LogTag =
    tagOverride ??
    (isTx ? (hasCommand ? "CMD" : "DATA") : hasResponse ? "RESP" : "DATA");

  const tagConf = tagConfig[tag];

  // Format timestamp
  const time = new Date(log.timestamp).toLocaleTimeString([], {
    hour12: false,
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    fractionalSecondDigits: 3,
  } as Intl.DateTimeFormatOptions);

  // Format content
  const content = React.useMemo(() => {
    if (
      typeof log.data !== "string" &&
      log.payloadStart !== undefined &&
      log.payloadLength !== undefined
    ) {
      return formatContent(
        log.data.subarray(
          log.payloadStart,
          log.payloadStart + log.payloadLength,
        ),
        displayMode,
      );
    }
    return formatContent(log.data, displayMode);
  }, [log.data, log.payloadStart, log.payloadLength, displayMode]);

  return (
    <div
      className={cn(
        "min-h-8 px-4 py-2 flex items-center gap-3 rounded",
        "hover:bg-bg-hover transition-colors",
        "cursor-pointer group",
        highlighted && dirConfig.bgHighlight,
        highlighted && "border-l-[3px]",
        highlighted && dirConfig.border,
        className,
      )}
      onClick={onClick}
    >
      {/* Timestamp */}
      <span className="w-[88px] shrink-0 font-mono text-[11px] text-text-muted tabular-nums">
        {time}
      </span>

      {/* Direction */}
      <span
        className={cn(
          "w-6 shrink-0 font-mono text-[11px] font-bold",
          dirConfig.color,
        )}
      >
        {log.direction}
      </span>

      {/* Tag */}
      <span
        className={cn(
          "shrink-0 font-mono text-[11px] font-medium",
          tagConf.color,
        )}
      >
        [{tag}]
      </span>

      {/* Content */}
      <div className="flex-1 min-w-0 font-mono text-[13px] text-text-primary truncate">
        {displayMode === "TEXT" && enableAnsi ? (
          <span className="truncate block">
            <Ansi>{content}</Ansi>
          </span>
        ) : (
          <span className="truncate block">{content}</span>
        )}
      </div>

      {/* Context indicator (if available) */}
      {log.contextIds && log.contextIds.length > 0 && (
        <span className="shrink-0 text-[10px] text-text-muted opacity-0 group-hover:opacity-100 transition-opacity">
          +{log.contextIds.length} ctx
        </span>
      )}
    </div>
  );
};

LogItem.displayName = "LogItem";

export { LogItem };
