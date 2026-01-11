import React, { useState, useEffect, useMemo } from "react";
import { LogEntry, DataMode, GlobalFormat, ProjectContext } from "../../types";
import {
  Clock,
  Binary,
  Code,
  Type,
  Check,
  Copy,
  BookOpen,
  List,
  Sliders,
  Palette,
} from "lucide-react";
import { cn, formatContent, getBytes } from "../../lib/utils";
import Ansi from "ansi-to-react";

interface Props {
  log: LogEntry;
  globalFormat: GlobalFormat;
  context?: ProjectContext;
  enableAnsi?: boolean;
  isDark?: boolean;
}

const ChatBubble: React.FC<Props> = ({
  log,
  globalFormat,
  context,
  enableAnsi = true,
  isDark = false,
}) => {
  const [localViewMode, setLocalViewMode] = useState<DataMode | "PARAMS">(
    () => {
      // Initial State Logic
      const hasParams =
        log.commandParams && Object.keys(log.commandParams).length > 0;
      const hasExtractedVars =
        log.extractedVars && Object.keys(log.extractedVars).length > 0;
      const canShowParams = hasParams || hasExtractedVars;

      if (globalFormat !== "AUTO") return globalFormat;
      if (canShowParams) return "PARAMS";
      return log.format;
    },
  );
  const [copied, setCopied] = useState(false);

  const hasParams =
    log.commandParams && Object.keys(log.commandParams).length > 0;
  const hasExtractedVars =
    log.extractedVars && Object.keys(log.extractedVars).length > 0;
  const canShowParams = hasParams || hasExtractedVars;

  // Derived State (Global overrides local if not AUTO)
  const viewMode = globalFormat !== "AUTO" ? globalFormat : localViewMode;

  // Extract payload if defined, otherwise use full data
  const content = useMemo(() => {
    let dataToFormat = log.data;
    if (
      typeof log.data !== "string" &&
      log.payloadStart !== undefined &&
      log.payloadLength !== undefined
    ) {
      // If framed binary, extract the semantic payload for display
      dataToFormat = (log.data as Uint8Array).subarray(
        log.payloadStart,
        log.payloadStart + log.payloadLength,
      );
    }
    return formatContent(dataToFormat, viewMode as DataMode);
  }, [log.data, log.payloadStart, log.payloadLength, viewMode]);

  const isTx = log.direction === "TX";

  const time = new Date(log.timestamp).toLocaleTimeString([], {
    hour12: false,
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    fractionalSecondDigits: 3,
  } as any);

  const handleCopy = () => {
    let textToCopy = content;
    if (viewMode === "PARAMS") {
      const dataObj = isTx ? log.commandParams : log.extractedVars;
      textToCopy = JSON.stringify(dataObj || {}, null, 2);
    }
    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const renderParamsContent = () => {
    const dataObj = isTx ? log.commandParams : log.extractedVars;

    if (!dataObj || Object.keys(dataObj).length === 0) {
      // Fallback to raw bytes if no params found despite mode being PARAMS
      return content;
    }

    return (
      <div className="flex flex-col gap-1.5 mt-1">
        {Object.entries(dataObj).map(([key, value]) => (
          <div
            key={key}
            className="flex items-start text-xs border-b border-white/10 last:border-0 pb-1 last:pb-0"
          >
            <span className="font-bold opacity-70 w-1/3 truncate text-right pr-3 shrink-0">
              {key}
            </span>
            <span className="font-mono opacity-90 break-all select-all">
              {typeof value === "object"
                ? JSON.stringify(value)
                : String(value)}
            </span>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div
      className={cn(
        "flex w-full mb-4 animate-in fade-in slide-in-from-bottom-2 duration-300",
        isTx ? "justify-end" : "justify-start",
      )}
    >
      <div
        className={cn(
          "max-w-[95%] md:max-w-[90%] flex flex-col shadow-sm border relative group transition-all",
          "rounded-2xl px-4 py-3",
          isTx
            ? "bg-primary text-primary-foreground border-primary/20 rounded-tr-sm"
            : "bg-card text-card-foreground border-border rounded-tl-sm",
        )}
      >
        <div
          className={cn(
            "flex items-center justify-between gap-4 mb-2 pb-2 border-b border-dashed",
            isTx ? "border-primary-foreground/20" : "border-border",
          )}
        >
          <div className="flex items-center gap-2 opacity-70">
            <Clock className="w-3 h-3" />
            <span className="text-[10px] font-mono tracking-tight">{time}</span>
            <span className="text-[9px] font-bold opacity-60 uppercase tracking-widest">
              {log.direction}
            </span>

            {/* Context Indicator */}
            {context && (
              <div className="ml-2 flex items-center gap-1 group/ctx relative">
                <BookOpen className="w-3 h-3" />
                <span className="text-[9px] font-bold border-b border-dotted cursor-help max-w-[100px] truncate">
                  {context.title}
                </span>
                {/* Tooltip */}
                <div className="absolute left-0 bottom-full mb-2 w-64 p-2 bg-popover border border-border rounded-md shadow-lg text-[10px] text-popover-foreground invisible group-hover/ctx:visible z-50 text-left">
                  <p className="font-bold mb-1 border-b pb-1 opacity-70 truncate">
                    {context.title}
                  </p>
                  <p className="opacity-80 line-clamp-6 whitespace-pre-wrap">
                    {context.content}
                  </p>
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center gap-1">
            {/* Params Toggle */}
            {canShowParams && (
              <button
                onClick={() => setLocalViewMode("PARAMS")}
                className={cn(
                  "p-1 rounded text-[10px] font-bold transition-all flex items-center gap-1",
                  viewMode === "PARAMS"
                    ? isTx
                      ? "bg-background/20 shadow-sm"
                      : "bg-muted text-foreground shadow-sm"
                    : isTx
                      ? "hover:bg-background/10 opacity-50 hover:opacity-100"
                      : "hover:bg-muted text-muted-foreground",
                )}
                title="View Parameters"
              >
                {isTx ? (
                  <Sliders className="w-3 h-3" />
                ) : (
                  <List className="w-3 h-3" />
                )}
              </button>
            )}

            {(["TEXT", "HEX", "BINARY"] as DataMode[]).map((m) => (
              <button
                key={m}
                onClick={() => setLocalViewMode(m)}
                className={cn(
                  "p-1 rounded text-[10px] font-bold transition-all",
                  viewMode === m
                    ? isTx
                      ? "bg-background/20 shadow-sm"
                      : "bg-muted text-foreground shadow-sm"
                    : isTx
                      ? "hover:bg-background/10 opacity-50 hover:opacity-100"
                      : "hover:bg-muted text-muted-foreground",
                )}
                title={`View payload as ${m}`}
              >
                {m === "TEXT" && <Type className="w-3 h-3" />}
                {m === "HEX" && <Code className="w-3 h-3" />}
                {m === "BINARY" && <Binary className="w-3 h-3" />}
              </button>
            ))}

            <div
              className={cn(
                "w-px h-3 mx-1",
                isTx ? "bg-primary-foreground/20" : "bg-border",
              )}
            ></div>

            <button
              onClick={handleCopy}
              className={cn(
                "p-1 rounded transition-colors",
                isTx
                  ? "hover:bg-background/10"
                  : "hover:bg-muted text-muted-foreground hover:text-foreground",
              )}
            >
              {copied ? (
                <Check className="w-3 h-3" />
              ) : (
                <Copy className="w-3 h-3" />
              )}
            </button>
          </div>
        </div>

        {viewMode === "PARAMS" ? (
          <div
            className={cn(
              "text-sm leading-relaxed",
              isTx ? "text-primary-foreground" : "text-foreground",
            )}
          >
            {renderParamsContent()}
          </div>
        ) : viewMode === "TEXT" && enableAnsi ? (
          <div
            className={cn(
              "font-mono text-xs whitespace-pre-wrap break-all leading-relaxed",
              isTx ? "text-primary-foreground" : "text-foreground",
            )}
          >
            <Ansi>{content}</Ansi>
          </div>
        ) : (
          <pre
            className={cn(
              "font-mono text-xs whitespace-pre-wrap break-all leading-relaxed selection:bg-black/20 dark:selection:bg-white/20",
              isTx ? "text-primary-foreground" : "text-foreground",
            )}
          >
            {content}
          </pre>
        )}
      </div>
    </div>
  );
};

export default ChatBubble;
