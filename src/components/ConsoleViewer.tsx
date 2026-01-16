import React, { useEffect, useRef, useState, useMemo } from "react";
import { ErrorBoundary } from "react-error-boundary";
import { DataMode, GlobalFormat, LogEntry } from "../types";
import {
  ArrowDown,
  Binary,
  Code,
  Type,
  Layers,
  AlignLeft,
  FileDigit,
  Split,
  Activity,
  LineChart as ChartIcon,
  LayoutDashboard,
  Palette,
  History,
  Loader2,
} from "lucide-react";
import { cn } from "../lib/utils";
import { useStore } from "../lib/store";
import { TauriSerialAPI } from "../lib/tauri/api";

// Sub Components
import LogicAnalyzerPanel from "./console/LogicAnalyzerPanel";
import HexLogEntry from "./console/HexLogEntry";
import StreamPanel from "./console/StreamPanel";
import ChatBubble from "./console/ChatBubble";
import DashboardPanel from "./console/DashboardPanel";
import PlotterPanel from "./console/PlotterPanel";
import { ErrorFallback } from "./ErrorFallback";

type ViewLayout =
  | "LIST"
  | "HEX"
  | "STREAM"
  | "GRAPHIC"
  | "DASHBOARD"
  | "PLOTTER";

const ConsoleViewer: React.FC = () => {
  // Optimized Selectors: Only subscribe to activeSessionId and logs.
  // Input buffer changes trigger 'sessions' object updates, but 'logs' array reference remains consistent if only input changed.
  const activeSessionId = useStore((state) => state.activeSessionId);
  const activeSession = useStore((state) => state.sessions[activeSessionId]);
  const logs = activeSession.logs || [];
  const portName = activeSession.portName;
  const contexts = useStore((state) => state.contexts);
  const { themeMode, addToast } = useStore();

  const endRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [autoScroll, setAutoScroll] = useState(true);
  const [globalFormat, setGlobalFormat] = useState<GlobalFormat>("AUTO");
  const [viewLayout, setViewLayout] = useState<ViewLayout>("LIST");
  const [enableAnsi, setEnableAnsi] = useState(true);
  const [isDark, setIsDark] = useState(false);

  // History State
  const [historyLogs, setHistoryLogs] = useState<LogEntry[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [hasMoreHistory, setHasMoreHistory] = useState(true);

  // Clear history when session changes or port changes
  useEffect(() => {
    setHistoryLogs([]);
    setHasMoreHistory(true);
  }, [activeSessionId, portName]);

  // Combine history and live logs
  // Use useMemo to avoid re-calculating on every render if logs haven't changed
  const displayLogs = useMemo(() => {
    return [...historyLogs, ...logs];
  }, [historyLogs, logs]);

  const HISTORY_BATCH_SIZE = 100;

  const loadHistory = async () => {
    if (!activeSessionId || isLoadingHistory) return;

    setIsLoadingHistory(true);
    try {
      const offset = displayLogs.length;
      const limit = HISTORY_BATCH_SIZE;

      const newLogs = await TauriSerialAPI.getLogs(
        activeSessionId,
        limit,
        offset,
      );

      if (newLogs.length < limit) {
        setHasMoreHistory(false);
      }

      if (newLogs.length > 0) {
        const sortedNewLogs = [...newLogs].reverse();
        setHistoryLogs((prev) => [...sortedNewLogs, ...prev]);
        setAutoScroll(false);
      } else {
        addToast(
          "info",
          "No more history",
          "You have reached the beginning of the logs.",
        );
      }
    } catch (err) {
      console.error("Failed to load history:", err);
      addToast("error", "History Error", "Failed to load older logs.");
    } finally {
      setIsLoadingHistory(false);
    }
  };

  // Detect effective theme for ANSI contrast
  useEffect(() => {
    const checkTheme = () => {
      if (themeMode === "system") {
        setIsDark(window.matchMedia("(prefers-color-scheme: dark)").matches);
      } else {
        setIsDark(themeMode === "dark");
      }
    };
    checkTheme();
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = () => checkTheme();
    mediaQuery.addEventListener("change", handler);
    return () => mediaQuery.removeEventListener("change", handler);
  }, [themeMode]);

  useEffect(() => {
    // Only use main autoScroll in list/hex modes
    if (autoScroll && (viewLayout === "LIST" || viewLayout === "HEX")) {
      endRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [logs, autoScroll, viewLayout]);

  // Helper to find context for a log
  const getContexts = (ids?: string[]) =>
    ids ? contexts.filter((c) => ids.includes(c.id)) : [];

  return (
    <div className="flex-1 relative bg-background flex flex-col min-h-0 transition-colors duration-300">
      {/* Global View Controls - Floating Top Left */}
      <div className="absolute top-2 left-4 z-10 flex gap-2">
        {/* Layout Toggle */}
        <div className="flex gap-0.5 bg-background/80 backdrop-blur p-1 rounded-md border border-border/50 shadow-sm">
          <button
            onClick={() => setViewLayout("LIST")}
            className={cn(
              "p-1.5 rounded-sm transition-all",
              viewLayout === "LIST"
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:bg-muted hover:text-foreground",
            )}
            title="List View (Chat Bubbles)"
          >
            <AlignLeft className="w-4 h-4" />
          </button>
          <button
            onClick={() => setViewLayout("HEX")}
            className={cn(
              "p-1.5 rounded-sm transition-all",
              viewLayout === "HEX"
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:bg-muted hover:text-foreground",
            )}
            title="Hex Dump View"
          >
            <FileDigit className="w-4 h-4" />
          </button>
          <button
            onClick={() => setViewLayout("STREAM")}
            className={cn(
              "p-1.5 rounded-sm transition-all",
              viewLayout === "STREAM"
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:bg-muted hover:text-foreground",
            )}
            title="Split Stream View"
          >
            <Split className="w-4 h-4" />
          </button>
          <button
            onClick={() => setViewLayout("GRAPHIC")}
            className={cn(
              "p-1.5 rounded-sm transition-all",
              viewLayout === "GRAPHIC"
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:bg-muted hover:text-foreground",
            )}
            title="Logic Analyzer (Graphic) View"
          >
            <Activity className="w-4 h-4" />
          </button>
          <button
            onClick={() => setViewLayout("PLOTTER")}
            className={cn(
              "p-1.5 rounded-sm transition-all",
              viewLayout === "PLOTTER"
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:bg-muted hover:text-foreground",
            )}
            title="Real-time Plotter (Oscilloscope)"
          >
            <ChartIcon className="w-4 h-4" />
          </button>
          <div className="w-px bg-border/50 my-0.5 mx-0.5"></div>
          <button
            onClick={() => setViewLayout("DASHBOARD")}
            className={cn(
              "p-1.5 rounded-sm transition-all",
              viewLayout === "DASHBOARD"
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:bg-muted hover:text-foreground",
            )}
            title="Telemetry Dashboard (Variables)"
          >
            <LayoutDashboard className="w-4 h-4" />
          </button>
        </div>

        {/* Format Toggle (Only visible in List Mode) */}
        {viewLayout === "LIST" && (
          <div className="flex gap-1 bg-background/80 backdrop-blur p-1 rounded-md border border-border/50 shadow-sm animate-in fade-in slide-in-from-left-2">
            <button
              onClick={() => setGlobalFormat("AUTO")}
              className={cn(
                "px-2 py-1 text-[10px] font-bold rounded-sm transition-all flex items-center gap-1.5",
                globalFormat === "AUTO"
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground",
              )}
              title="Auto-detect format per message"
            >
              <Layers className="w-3 h-3" /> Auto
            </button>
            <div className="w-px bg-border/50 my-0.5"></div>
            {(["TEXT", "HEX", "BINARY"] as DataMode[]).map((m) => (
              <button
                key={m}
                onClick={() => setGlobalFormat(m)}
                className={cn(
                  "px-2 py-1 text-[10px] font-bold rounded-sm transition-all flex items-center gap-1.5",
                  globalFormat === m
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground",
                )}
                title={`Force all messages to ${m}`}
              >
                {m === "TEXT" && <Type className="w-3 h-3" />}
                {m === "HEX" && <Code className="w-3 h-3" />}
                {m === "BINARY" && <Binary className="w-3 h-3" />}
                {m === "TEXT" ? "Txt" : m === "HEX" ? "Hex" : "Bin"}
              </button>
            ))}

            <div className="w-px bg-border/50 my-0.5"></div>
            <button
              onClick={() => setEnableAnsi(!enableAnsi)}
              className={cn(
                "px-2 py-1 text-[10px] font-bold rounded-sm transition-all flex items-center gap-1.5",
                enableAnsi
                  ? "bg-purple-500/10 text-purple-600 border border-purple-500/20"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground",
              )}
              title="Toggle ANSI Color Codes visualization (for TEXT mode)"
            >
              <Palette className="w-3 h-3" /> ANSI
            </button>
          </div>
        )}
      </div>

      {viewLayout === "DASHBOARD" ? (
        <div className="flex-1 p-4 pt-14 min-h-0 overflow-hidden">
          <ErrorBoundary
            FallbackComponent={ErrorFallback}
            resetKeys={[activeSessionId]}
          >
            <DashboardPanel />
          </ErrorBoundary>
        </div>
      ) : viewLayout === "PLOTTER" ? (
        <div className="flex-1 p-4 pt-14 min-h-0 overflow-hidden">
          <ErrorBoundary
            FallbackComponent={ErrorFallback}
            resetKeys={[activeSessionId]}
          >
            <PlotterPanel />
          </ErrorBoundary>
        </div>
      ) : viewLayout === "GRAPHIC" ? (
        <div className="flex-1 p-4 pt-14 min-h-0 overflow-hidden">
          <ErrorBoundary
            FallbackComponent={ErrorFallback}
            resetKeys={[activeSessionId, logs.length]}
          >
            <LogicAnalyzerPanel logs={logs} />
          </ErrorBoundary>
        </div>
      ) : viewLayout === "STREAM" ? (
        <div className="flex-1 overflow-x-auto overflow-y-hidden p-4 pt-14 min-h-0">
          {/* Center Wrapper: Fits content width and centers it with mx-auto */}
          <div className="flex flex-col md:flex-row gap-4 h-full w-full md:w-fit mx-auto">
            <ErrorBoundary
              FallbackComponent={ErrorFallback}
              resetKeys={[activeSessionId, logs.length]}
            >
              <StreamPanel
                title="INCOMING (RX)"
                logs={logs}
                direction="RX"
                className="w-full md:w-fit shrink-0 border-emerald-500/20 shadow-sm min-w-[320px]"
              />
            </ErrorBoundary>
            <ErrorBoundary
              FallbackComponent={ErrorFallback}
              resetKeys={[activeSessionId, logs.length]}
            >
              <StreamPanel
                title="OUTGOING (TX)"
                logs={logs}
                direction="TX"
                className="w-full md:w-fit shrink-0 border-primary/20 shadow-sm min-w-[320px]"
                accentColorClass="bg-primary/10 text-primary"
              />
            </ErrorBoundary>
          </div>
        </div>
      ) : (
        <div
          ref={containerRef}
          className="flex-1 overflow-y-auto px-4 py-6 custom-scrollbar pt-14"
          onScroll={(e) => {
            const target = e.target as HTMLDivElement;
            const isNearBottom =
              target.scrollHeight - target.scrollTop - target.clientHeight <
              150;
            setAutoScroll(isNearBottom);
          }}
        >
          {logs.length === 0 && historyLogs.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-muted-foreground/30 select-none">
              <div className="w-16 h-16 bg-muted/50 rounded-full flex items-center justify-center mb-4">
                <Binary className="w-8 h-8" />
              </div>
              <p className="font-medium">No messages yet</p>
              <p className="text-sm opacity-70">
                Connect to a device to start capturing
              </p>
            </div>
          )}

          <div
            className={cn(
              "flex flex-col w-full mx-auto",
              viewLayout === "LIST"
                ? "max-w-5xl"
                : viewLayout === "HEX"
                  ? "w-full max-w-[98%] items-center"
                  : "max-w-4xl",
            )}
          >
            {/* History Loader */}
            {portName && (logs.length > 0 || historyLogs.length > 0) && (
              <div className="flex justify-center py-4">
                <button
                  onClick={loadHistory}
                  disabled={isLoadingHistory || !hasMoreHistory}
                  className="flex items-center gap-2 text-xs text-muted-foreground hover:text-primary disabled:opacity-50 transition-colors"
                >
                  {isLoadingHistory ? (
                    <Loader2 className="w-3 h-3 animate-spin" />
                  ) : (
                    <History className="w-3 h-3" />
                  )}
                  {isLoadingHistory
                    ? "Loading..."
                    : hasMoreHistory
                      ? "Load older logs"
                      : "No more history"}
                </button>
              </div>
            )}

            {displayLogs.map((log) =>
              viewLayout === "LIST" ? (
                <ChatBubble
                  key={log.id}
                  log={log}
                  globalFormat={globalFormat}
                  contexts={getContexts(log.contextIds)}
                  enableAnsi={enableAnsi}
                  isDark={isDark}
                />
              ) : (
                <HexLogEntry key={log.id} log={log} />
              ),
            )}
            <div ref={endRef} />
          </div>
        </div>
      )}

      {/* Global Auto Scroll Button */}
      {(viewLayout === "LIST" || viewLayout === "HEX") && !autoScroll && (
        <button
          onClick={() => setAutoScroll(true)}
          className="absolute bottom-6 right-6 bg-primary text-primary-foreground h-10 w-10 rounded-full shadow-xl flex items-center justify-center hover:bg-primary/90 transition-transform hover:scale-105 z-10 animate-in fade-in zoom-in duration-200"
        >
          <ArrowDown className="w-5 h-5" />
        </button>
      )}
    </div>
  );
};

export default ConsoleViewer;
