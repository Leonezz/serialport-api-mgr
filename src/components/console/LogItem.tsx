import * as React from "react";
import { cn, formatContent } from "../../lib/utils";
import Ansi from "ansi-to-react";
import { LogEntry, DataMode } from "../../types";
import { ChevronDown, ChevronRight, Copy, Check } from "lucide-react";
import { useCopyFeedback } from "../../hooks/useCopyFeedback";

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
 * Enhanced Features:
 * - Expandable content with text wrapping for long data
 * - Per-item format switcher (Text/Hex/Binary)
 * - Copy to clipboard functionality
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
  /** Display mode for content (default, can be overridden per-item) */
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

const formatOptions: { value: DataMode; label: string }[] = [
  { value: "TEXT", label: "Text" },
  { value: "HEX", label: "Hex" },
  { value: "BINARY", label: "Bin" },
];

const LogItem: React.FC<LogItemProps> = ({
  log,
  displayMode = "TEXT",
  enableAnsi = true,
  highlighted = false,
  tag: tagOverride,
  className,
  onClick,
}) => {
  const [isExpanded, setIsExpanded] = React.useState(false);
  const [localDisplayMode, setLocalDisplayMode] =
    React.useState<DataMode | null>(null);
  const { copied, copy } = useCopyFeedback(2000);

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

  // Use local display mode if set, otherwise use prop
  const effectiveDisplayMode = localDisplayMode ?? displayMode;

  // Format timestamp
  const time = new Date(log.timestamp).toLocaleTimeString([], {
    hour12: false,
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    fractionalSecondDigits: 3,
  } as Intl.DateTimeFormatOptions);

  // Get raw data for formatting
  const rawData = React.useMemo(() => {
    if (
      typeof log.data !== "string" &&
      log.payloadStart !== undefined &&
      log.payloadLength !== undefined
    ) {
      return log.data.subarray(
        log.payloadStart,
        log.payloadStart + log.payloadLength,
      );
    }
    return log.data;
  }, [log.data, log.payloadStart, log.payloadLength]);

  // Format content based on effective display mode
  const content = React.useMemo(() => {
    return formatContent(rawData, effectiveDisplayMode);
  }, [rawData, effectiveDisplayMode]);

  // Check if content is long (needs expansion)
  const isLongContent = content.length > 80;

  // Handle copy to clipboard
  const handleCopy = async (e: React.MouseEvent) => {
    e.stopPropagation();
    await copy(content);
  };

  // Handle expand toggle
  const handleExpandToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsExpanded(!isExpanded);
  };

  // Handle format change
  const handleFormatChange = (mode: DataMode) => (e: React.MouseEvent) => {
    e.stopPropagation();
    setLocalDisplayMode(mode);
  };

  return (
    <div
      className={cn(
        "min-h-8 px-4 py-2 flex flex-col gap-1 rounded",
        "hover:bg-bg-hover transition-colors",
        "cursor-pointer group",
        highlighted && dirConfig.bgHighlight,
        highlighted && "border-l-[3px]",
        highlighted && dirConfig.border,
        isExpanded && "bg-bg-subtle",
        className,
      )}
      onClick={onClick}
    >
      {/* Main Row */}
      <div className="flex items-center gap-3">
        {/* Expand Toggle */}
        {isLongContent && (
          <button
            onClick={handleExpandToggle}
            className="shrink-0 w-4 h-4 flex items-center justify-center text-text-muted hover:text-text-primary transition-colors"
            aria-label={isExpanded ? "Collapse" : "Expand"}
          >
            {isExpanded ? (
              <ChevronDown className="w-3.5 h-3.5" />
            ) : (
              <ChevronRight className="w-3.5 h-3.5" />
            )}
          </button>
        )}
        {!isLongContent && <div className="w-4 shrink-0" />}

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

        {/* Content (collapsed view) */}
        {!isExpanded && (
          <div className="flex-1 min-w-0 font-mono text-[13px] text-text-primary truncate">
            {effectiveDisplayMode === "TEXT" && enableAnsi ? (
              <span className="truncate block">
                <Ansi>{content}</Ansi>
              </span>
            ) : (
              <span className="truncate block">{content}</span>
            )}
          </div>
        )}

        {/* Inline Actions (visible on hover or when expanded) */}
        <div
          className={cn(
            "shrink-0 flex items-center gap-1",
            "opacity-0 group-hover:opacity-100 transition-opacity",
            isExpanded && "opacity-100",
          )}
        >
          {/* Format Switcher */}
          <div className="flex items-center bg-bg-surface border border-border-default rounded-md overflow-hidden">
            {formatOptions.map((opt) => (
              <button
                key={opt.value}
                onClick={handleFormatChange(opt.value)}
                className={cn(
                  "px-2 py-0.5 text-[10px] font-medium transition-colors",
                  effectiveDisplayMode === opt.value
                    ? "bg-primary text-primary-foreground"
                    : "text-text-muted hover:text-text-primary hover:bg-bg-hover",
                )}
              >
                {opt.label}
              </button>
            ))}
          </div>

          {/* Copy Button */}
          <button
            onClick={handleCopy}
            className={cn(
              "p-1 rounded text-text-muted hover:text-text-primary hover:bg-bg-hover transition-colors",
              copied && "text-green-500",
            )}
            aria-label="Copy content"
          >
            {copied ? (
              <Check className="w-3.5 h-3.5" />
            ) : (
              <Copy className="w-3.5 h-3.5" />
            )}
          </button>
        </div>

        {/* Context indicator (if available) */}
        {log.contextIds && log.contextIds.length > 0 && !isExpanded && (
          <span className="shrink-0 text-[10px] text-text-muted opacity-0 group-hover:opacity-100 transition-opacity">
            +{log.contextIds.length} ctx
          </span>
        )}
      </div>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="ml-4 mt-2 p-3 bg-bg-app rounded border border-border-default">
          <pre className="font-mono text-[12px] text-text-primary whitespace-pre-wrap break-all overflow-x-auto">
            {effectiveDisplayMode === "TEXT" && enableAnsi ? (
              <Ansi>{content}</Ansi>
            ) : (
              content
            )}
          </pre>

          {/* Parsed Fields (extracted variables) */}
          {log.extractedVars && Object.keys(log.extractedVars).length > 0 && (
            <div className="mt-2 pt-2 border-t border-border-default">
              <div className="text-[10px] font-medium text-text-muted uppercase tracking-wider mb-2">
                Parsed Fields
              </div>
              <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                {Object.entries(log.extractedVars).map(([key, value]) => (
                  <div
                    key={key}
                    className="flex items-baseline gap-2 text-[11px]"
                  >
                    <span className="font-mono text-primary">{key}:</span>
                    <span className="font-mono text-text-primary">
                      {typeof value === "object"
                        ? JSON.stringify(value)
                        : String(value)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Command Params (for TX entries) */}
          {log.commandParams && Object.keys(log.commandParams).length > 0 && (
            <div className="mt-2 pt-2 border-t border-border-default">
              <div className="text-[10px] font-medium text-text-muted uppercase tracking-wider mb-2">
                Command Parameters
              </div>
              <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                {Object.entries(log.commandParams).map(([key, value]) => (
                  <div
                    key={key}
                    className="flex items-baseline gap-2 text-[11px]"
                  >
                    <span className="font-mono text-amber-500">{key}:</span>
                    <span className="font-mono text-text-primary">
                      {typeof value === "object"
                        ? JSON.stringify(value)
                        : String(value)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Data Stats */}
          <div className="mt-2 pt-2 border-t border-border-default flex items-center gap-4 text-[10px] text-text-muted">
            <span>
              Length:{" "}
              {typeof rawData === "string"
                ? rawData.length
                : rawData.byteLength}{" "}
              bytes
            </span>
            {log.contextIds && log.contextIds.length > 0 && (
              <span>Contexts: {log.contextIds.length}</span>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

LogItem.displayName = "LogItem";

/**
 * Custom comparison function for React.memo
 * Compare all log fields and props used in rendering to prevent stale data
 */
const arePropsEqual = (
  prevProps: LogItemProps,
  nextProps: LogItemProps,
): boolean => {
  // Compare log identity and timestamp
  if (prevProps.log.id !== nextProps.log.id) return false;
  if (prevProps.log.timestamp !== nextProps.log.timestamp) return false;

  // Compare log fields used in rendering (fixes stale data bug when updateLog is called)
  if (prevProps.log.direction !== nextProps.log.direction) return false;
  if (prevProps.log.data !== nextProps.log.data) return false;
  if (prevProps.log.commandParams !== nextProps.log.commandParams) return false;
  if (prevProps.log.extractedVars !== nextProps.log.extractedVars) return false;
  if (prevProps.log.contextIds !== nextProps.log.contextIds) return false;
  if (prevProps.log.payloadStart !== nextProps.log.payloadStart) return false;
  if (prevProps.log.payloadLength !== nextProps.log.payloadLength) return false;

  // Compare display settings
  if (prevProps.displayMode !== nextProps.displayMode) return false;
  if (prevProps.enableAnsi !== nextProps.enableAnsi) return false;
  if (prevProps.highlighted !== nextProps.highlighted) return false;
  if (prevProps.tag !== nextProps.tag) return false;
  if (prevProps.className !== nextProps.className) return false;

  // Compare callback identity (if onClick changes, we need to re-render)
  if (prevProps.onClick !== nextProps.onClick) return false;

  return true;
};

const MemoizedLogItem = React.memo(LogItem, arePropsEqual);
MemoizedLogItem.displayName = "LogItem";

export { MemoizedLogItem as LogItem };
