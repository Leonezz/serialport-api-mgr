import React, { useEffect, useRef, useState, useMemo } from "react";
import { ErrorBoundary } from "react-error-boundary";
import { LogEntry, DataMode } from "../types";
import { ArrowDown, History, Loader2 } from "lucide-react";
import { cn } from "../lib/utils";
import { useStore } from "../lib/store";
import { IconButton } from "./ui/IconButton";
import { Button } from "./ui/Button";
import { TauriSerialAPI } from "../lib/tauri/api";
import {
  ConsoleToolbar,
  type ConsoleView,
  type DisplayMode,
} from "./console/ConsoleToolbar";

// Sub Components
import LogicAnalyzerPanel from "./console/LogicAnalyzerPanel";
import HexLogEntry from "./console/HexLogEntry";
import StreamPanel from "./console/StreamPanel";
import { LogItem } from "./console/LogItem";
import DashboardPanel from "./console/DashboardPanel";
import PlotterPanel from "./console/PlotterPanel";
import { ErrorFallback } from "./ErrorFallback";
import { EmptyState } from "./ui/EmptyState";

const ConsoleViewer: React.FC = () => {
  // Optimized Selectors: Only subscribe to activeSessionId and logs.
  const activeSessionId = useStore((state) => state.activeSessionId);
  const activeSession = useStore((state) => state.sessions[activeSessionId]);
  const logs = useMemo(() => activeSession.logs || [], [activeSession.logs]);
  const portName = activeSession.portName;
  const clearLogs = useStore((state) => state.clearLogs);
  const addToast = useStore((state) => state.addToast);

  const endRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [autoScroll, setAutoScroll] = useState(true);
  const [view, setView] = useState<ConsoleView>("list");
  const [displayMode, setDisplayMode] = useState<DisplayMode>("text");
  const [enableAnsi, setEnableAnsi] = useState(true);

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

  useEffect(() => {
    // Only use main autoScroll in list/hex modes
    if (autoScroll && (view === "list" || view === "hex")) {
      endRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [logs, autoScroll, view]);

  // Map display mode to DataMode
  const dataMode: DataMode = useMemo(() => {
    switch (displayMode) {
      case "hex":
        return "HEX";
      case "binary":
        return "BINARY";
      default:
        return "TEXT";
    }
  }, [displayMode]);

  // Handle clear logs
  const handleClear = () => {
    clearLogs();
    setHistoryLogs([]);
    setHasMoreHistory(true);
    addToast("info", "Cleared", "Console logs cleared");
  };

  // Determine if we should hide display mode and ANSI toggles
  const hideDisplayMode = view === "dashboard" || view === "plotter";
  const hideAnsiToggle = displayMode !== "text" || hideDisplayMode;

  return (
    <div className="flex-1 relative bg-bg-app flex flex-col min-h-0 transition-colors duration-300">
      {/* Console Toolbar - Section 9.1 */}
      <ConsoleToolbar
        view={view}
        onViewChange={setView}
        displayMode={displayMode}
        onDisplayModeChange={setDisplayMode}
        ansiEnabled={enableAnsi}
        onAnsiToggle={setEnableAnsi}
        onClear={handleClear}
        hideDisplayMode={hideDisplayMode}
        hideAnsiToggle={hideAnsiToggle}
      />

      {view === "dashboard" ? (
        <div className="flex-1 p-4 min-h-0 overflow-hidden">
          <ErrorBoundary
            FallbackComponent={ErrorFallback}
            resetKeys={[activeSessionId]}
          >
            <DashboardPanel />
          </ErrorBoundary>
        </div>
      ) : view === "plotter" ? (
        <div className="flex-1 p-4 min-h-0 overflow-hidden">
          <ErrorBoundary
            FallbackComponent={ErrorFallback}
            resetKeys={[activeSessionId]}
          >
            <PlotterPanel />
          </ErrorBoundary>
        </div>
      ) : view === "logic" ? (
        <div className="flex-1 p-4 min-h-0 overflow-hidden">
          <ErrorBoundary
            FallbackComponent={ErrorFallback}
            resetKeys={[activeSessionId, logs.length]}
          >
            <LogicAnalyzerPanel logs={logs} />
          </ErrorBoundary>
        </div>
      ) : view === "stream" ? (
        <div className="flex-1 overflow-x-auto overflow-y-hidden p-4 min-h-0">
          {/* Stream View - Section 9.4: Split TX/RX streams */}
          <div className="flex flex-col md:flex-row gap-4 h-full w-full md:w-fit mx-auto">
            <ErrorBoundary
              FallbackComponent={ErrorFallback}
              resetKeys={[activeSessionId, logs.length]}
            >
              <StreamPanel
                title="TX STREAM (Transmitted)"
                logs={logs}
                direction="TX"
                className="w-full md:w-fit shrink-0 min-w-[320px]"
              />
            </ErrorBoundary>
            <ErrorBoundary
              FallbackComponent={ErrorFallback}
              resetKeys={[activeSessionId, logs.length]}
            >
              <StreamPanel
                title="RX STREAM (Received)"
                logs={logs}
                direction="RX"
                className="w-full md:w-fit shrink-0 min-w-[320px]"
              />
            </ErrorBoundary>
          </div>
        </div>
      ) : (
        <div
          ref={containerRef}
          className="flex-1 overflow-y-auto custom-scrollbar"
          onScroll={(e) => {
            const target = e.target as HTMLDivElement;
            const isNearBottom =
              target.scrollHeight - target.scrollTop - target.clientHeight <
              150;
            setAutoScroll(isNearBottom);
          }}
        >
          {logs.length === 0 && historyLogs.length === 0 && (
            <EmptyState variant="console" className="h-full" hideAction />
          )}

          <div
            className={cn(
              "flex flex-col w-full mx-auto",
              view === "list" ? "max-w-5xl" : "w-full max-w-[98%] items-center",
            )}
          >
            {/* History Loader */}
            {portName && (logs.length > 0 || historyLogs.length > 0) && (
              <div className="flex justify-center py-4">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={loadHistory}
                  disabled={isLoadingHistory || !hasMoreHistory}
                  leftIcon={
                    isLoadingHistory ? (
                      <Loader2 className="w-3 h-3 animate-spin" />
                    ) : (
                      <History className="w-3 h-3" />
                    )
                  }
                >
                  {isLoadingHistory
                    ? "Loading..."
                    : hasMoreHistory
                      ? "Load older logs"
                      : "No more history"}
                </Button>
              </div>
            )}

            {/* List View - Section 9.2 */}
            {view === "list" &&
              displayLogs.map((log) => (
                <LogItem
                  key={log.id}
                  log={log}
                  displayMode={dataMode}
                  enableAnsi={enableAnsi}
                  highlighted={true}
                />
              ))}

            {/* Hex View - Section 9.3 */}
            {view === "hex" &&
              displayLogs.map((log) => <HexLogEntry key={log.id} log={log} />)}

            <div ref={endRef} />
          </div>
        </div>
      )}

      {/* Global Auto Scroll Button */}
      {(view === "list" || view === "hex") && !autoScroll && (
        <IconButton
          variant="solid"
          size="lg"
          onClick={() => setAutoScroll(true)}
          aria-label="Scroll to bottom"
          className="absolute bottom-6 right-6 rounded-full shadow-xl hover:scale-105 z-10 animate-in fade-in zoom-in duration-200"
        >
          <ArrowDown className="w-5 h-5" />
        </IconButton>
      )}
    </div>
  );
};

export default ConsoleViewer;
