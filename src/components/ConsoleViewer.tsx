import React, {
  useEffect,
  useRef,
  useState,
  useMemo,
  useCallback,
} from "react";
import { ErrorBoundary } from "react-error-boundary";
import { Virtuoso, VirtuosoHandle } from "react-virtuoso";
import { LogEntry, DataMode } from "../types";
import { ArrowDown, History, Loader2 } from "lucide-react";
import { cn } from "../lib/utils";
import { useStore } from "../lib/store";
import { Button, EmptyState, IconButton } from "./ui";
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

// Starting index for virtuoso to handle prepended history logs
const INITIAL_INDEX = 1_000_000;

// Module-level constant to avoid creating new reference on every render
const EMPTY_LOGS: LogEntry[] = [];

const ConsoleViewer: React.FC = () => {
  const activeSessionId = useStore((state) => state.activeSessionId);
  const clearLogs = useStore((state) => state.clearLogs);
  const addToast = useStore((state) => state.addToast);

  // Virtuoso ref for programmatic scrolling
  const virtuosoRef = useRef<VirtuosoHandle>(null);
  const [atBottom, setAtBottom] = useState(true);
  const [view, setView] = useState<ConsoleView>("list");

  // View-aware logs subscription: when plotter/dashboard is active, these panels
  // read their own data from the store — ConsoleViewer doesn't need logs at all.
  // Returning EMPTY_LOGS (constant reference) means zustand won't trigger
  // re-renders on log changes, preventing the entire ConsoleViewer subtree
  // from re-rendering ~100x/sec during streaming.
  const needsLogs =
    view !== "plotter" &&
    view !== "dashboard" &&
    view !== "logic" &&
    view !== "stream";
  const logs = useStore((state) =>
    needsLogs
      ? (state.sessions[activeSessionId]?.logs ?? EMPTY_LOGS)
      : EMPTY_LOGS,
  );
  const portName = useStore(
    (state) => state.sessions[activeSessionId]?.portName,
  );
  const [displayMode, setDisplayMode] = useState<DisplayMode>("text");
  const [enableAnsi, setEnableAnsi] = useState(true);

  // History State
  const [historyLogs, setHistoryLogs] = useState<LogEntry[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [hasMoreHistory, setHasMoreHistory] = useState(true);

  // Track first item index for prepending history (virtuoso reverse infinite scroll)
  const [firstItemIndex, setFirstItemIndex] = useState(INITIAL_INDEX);

  // Clear history when session changes or port changes
  useEffect(() => {
    setHistoryLogs([]);
    setHasMoreHistory(true);
    setFirstItemIndex(INITIAL_INDEX);
  }, [activeSessionId, portName]);

  // Combine history and live logs
  // Use useMemo to avoid re-calculating on every render if logs haven't changed
  const displayLogs = useMemo(() => {
    return [...historyLogs, ...logs];
  }, [historyLogs, logs]);

  const HISTORY_BATCH_SIZE = 100;

  const loadHistory = useCallback(async () => {
    if (!activeSessionId || isLoadingHistory || !hasMoreHistory) return;

    setIsLoadingHistory(true);
    try {
      const offset = historyLogs.length;
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
        // Prepend history logs and adjust firstItemIndex
        setFirstItemIndex((prev) => prev - sortedNewLogs.length);
        setHistoryLogs((prev) => [...sortedNewLogs, ...prev]);
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
  }, [
    activeSessionId,
    isLoadingHistory,
    hasMoreHistory,
    historyLogs.length,
    addToast,
  ]);

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
    setFirstItemIndex(INITIAL_INDEX);
    addToast("info", "Cleared", "Console logs cleared");
  };

  // Scroll to bottom handler
  const scrollToBottom = useCallback(() => {
    virtuosoRef.current?.scrollToIndex({
      index: displayLogs.length - 1,
      behavior: "smooth",
    });
  }, [displayLogs.length]);

  // Determine if we should hide display mode and ANSI toggles
  const hideDisplayMode = view === "dashboard" || view === "plotter";
  const hideAnsiToggle = displayMode !== "text" || hideDisplayMode;

  // Render item for list view
  const renderListItem = useCallback(
    (index: number, log: LogEntry) => (
      <LogItem
        key={log.id}
        log={log}
        displayMode={dataMode}
        enableAnsi={enableAnsi}
        highlighted={true}
      />
    ),
    [dataMode, enableAnsi],
  );

  // Render item for hex view
  const renderHexItem = useCallback(
    (index: number, log: LogEntry) => <HexLogEntry key={log.id} log={log} />,
    [],
  );

  // Header component for loading history
  const HistoryHeader = useMemo(() => {
    if (!portName || displayLogs.length === 0) return null;
    return (
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
    );
  }, [
    portName,
    displayLogs.length,
    loadHistory,
    isLoadingHistory,
    hasMoreHistory,
  ]);

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
            resetKeys={[activeSessionId]}
          >
            <LogicAnalyzerPanel />
          </ErrorBoundary>
        </div>
      ) : view === "stream" ? (
        <div className="flex-1 overflow-x-auto overflow-y-hidden p-4 min-h-0">
          {/* Stream View - Section 9.4: Split TX/RX streams */}
          <div className="flex flex-col md:flex-row gap-4 h-full w-full md:w-fit mx-auto">
            <ErrorBoundary
              FallbackComponent={ErrorFallback}
              resetKeys={[activeSessionId]}
            >
              <StreamPanel
                title="TX STREAM (Transmitted)"
                direction="TX"
                className="w-full md:w-fit shrink-0 min-w-[320px]"
              />
            </ErrorBoundary>
            <ErrorBoundary
              FallbackComponent={ErrorFallback}
              resetKeys={[activeSessionId]}
            >
              <StreamPanel
                title="RX STREAM (Received)"
                direction="RX"
                className="w-full md:w-fit shrink-0 min-w-[320px]"
              />
            </ErrorBoundary>
          </div>
        </div>
      ) : displayLogs.length === 0 ? (
        <EmptyState variant="console" className="flex-1" hideAction />
      ) : (
        <Virtuoso
          ref={virtuosoRef}
          className={cn(
            "flex-1 custom-scrollbar",
            "[&>div>div]:max-w-5xl [&>div>div]:mx-auto",
          )}
          data={displayLogs}
          firstItemIndex={firstItemIndex}
          initialTopMostItemIndex={displayLogs.length - 1}
          itemContent={view === "list" ? renderListItem : renderHexItem}
          components={{
            Header: () => HistoryHeader,
          }}
          followOutput="smooth"
          atBottomStateChange={setAtBottom}
          atBottomThreshold={150}
        />
      )}

      {/* Global Auto Scroll Button */}
      {(view === "list" || view === "hex") &&
        !atBottom &&
        displayLogs.length > 0 && (
          <IconButton
            variant="solid"
            size="lg"
            onClick={scrollToBottom}
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
