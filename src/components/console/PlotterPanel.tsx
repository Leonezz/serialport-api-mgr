import React, { useCallback, useEffect, useRef, useState } from "react";
import { useStore } from "../../lib/store";
import { useEChart } from "../../hooks/useEChart";
import { CHART_COLORS } from "../../lib/charts/constants";
import { DEFAULT_TARGET_FPS } from "../../lib/charts/constants";
import type { EChartsOption } from "../../lib/charts/echartsSetup";
import {
  Button,
  Card,
  Checkbox,
  DropdownOption,
  Input,
  Label,
  SegmentedControl,
  SegmentOption,
  SelectDropdown,
} from "../ui";
import {
  Pause,
  Play,
  Trash2,
  Download,
  Settings,
  X,
  LineChart as ChartIcon,
  ArrowRight,
  Pencil,
} from "lucide-react";
import { cn } from "../../lib/utils";
import { PlotterParserType, PlotterDataPoint } from "@/types";

// Time window options (Section 9.6)
type TimeWindowValue = "30s" | "1m" | "5m" | "15m" | "ALL";
const TIME_WINDOW_OPTIONS: SegmentOption[] = [
  { value: "30s", label: "30s" },
  { value: "1m", label: "1m" },
  { value: "5m", label: "5m" },
  { value: "15m", label: "15m" },
  { value: "ALL", label: "All" },
];

const TIME_WINDOW_MS: Record<TimeWindowValue, number | null> = {
  "30s": 30 * 1000,
  "1m": 60 * 1000,
  "5m": 5 * 60 * 1000,
  "15m": 15 * 60 * 1000,
  ALL: null,
};

// Interpolation options (Section 9.6)
type InterpolationType = "linear" | "step" | "smooth";
const INTERPOLATION_OPTIONS: SegmentOption[] = [
  { value: "linear", label: "Linear" },
  { value: "step", label: "Step" },
  { value: "smooth", label: "Smooth" },
];

interface LegendItemProps {
  seriesKey: string;
  colorIndex: number;
  isHidden: boolean;
  lastValue: number | undefined;
  displayName: string;
  onToggle: (key: string) => void;
}

const LegendItem = React.memo<LegendItemProps>(
  ({ seriesKey, colorIndex, isHidden, lastValue, displayName, onToggle }) => (
    <button
      onClick={() => onToggle(seriesKey)}
      className={cn(
        "flex items-center gap-2 text-label-sm transition-opacity",
        isHidden && "opacity-40",
      )}
    >
      <div
        className="w-3 h-3 rounded-full"
        style={{
          backgroundColor: CHART_COLORS[colorIndex % CHART_COLORS.length],
          opacity: isHidden ? 0.4 : 1,
        }}
      />
      <span className={cn("font-medium", isHidden && "line-through")}>
        {displayName}
      </span>
      {!isHidden && typeof lastValue === "number" && (
        <span className="font-mono text-text-muted text-[10px]">
          {lastValue.toFixed(2)}
        </span>
      )}
    </button>
  ),
);
LegendItem.displayName = "LegendItem";

/** Build initial ECharts option (grid, axes, dataZoom — no series data yet).
 *  Theme colors are applied via useEChart's applyTheme on init and on dark/light toggle. */
function buildBaseOption(): EChartsOption {
  return {
    backgroundColor: "transparent",
    animation: false,
    grid: { top: 10, right: 10, bottom: 60, left: 50 },
    xAxis: {
      type: "time",
      splitLine: { show: false },
      axisLabel: { fontSize: 10, formatter: "{HH}:{mm}:{ss}" },
    },
    yAxis: {
      type: "value",
      splitLine: { lineStyle: { type: "dashed", opacity: 0.3 } },
      axisLabel: { fontSize: 10 },
    },
    tooltip: {
      trigger: "axis",
      axisPointer: { type: "cross" },
      backgroundColor: "rgba(24,24,27,0.95)",
      borderColor: "#3f3f46",
      textStyle: { color: "#e4e4e7", fontSize: 11 },
    },
    dataZoom: [
      {
        type: "inside",
        xAxisIndex: 0,
        filterMode: "weakFilter",
        zoomOnMouseWheel: "ctrl",
        moveOnMouseWheel: true,
        moveOnMouseMove: false,
      },
      {
        type: "slider",
        xAxisIndex: 0,
        height: 30,
        bottom: 5,
        filterMode: "weakFilter",
        borderColor: "#3f3f46",
        backgroundColor: "rgba(39,39,42,0.3)",
        fillerColor: "rgba(59,130,246,0.15)",
        handleStyle: { color: "#3b82f6" },
        textStyle: { color: "#a1a1aa", fontSize: 10 },
        dataBackground: {
          lineStyle: { color: "#3f3f46" },
          areaStyle: { color: "rgba(59,130,246,0.05)" },
        },
      },
    ],
    series: [],
  };
}

const PlotterPanel: React.FC = () => {
  const activeSessionId = useStore((state) => state.activeSessionId);
  const session = useStore((state) => state.sessions[activeSessionId]);
  const { setPlotterConfig, clearPlotterData, setPlotterSeriesAlias } =
    useStore();

  const [isPaused, setIsPaused] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [hiddenSeries, setHiddenSeries] = useState<Set<string>>(new Set());
  const [timeWindow, setTimeWindow] = useState<TimeWindowValue>("1m");
  const [interpolation, setInterpolation] =
    useState<InterpolationType>("linear");
  const [isAutoScroll, setIsAutoScroll] = useState(true);

  // Refs for throttled render pattern
  const dataRef = useRef<PlotterDataPoint[]>([]);
  const frozenDataRef = useRef<PlotterDataPoint[]>([]);
  const seriesRef = useRef<string[]>([]);
  const [displayPointCount, setDisplayPointCount] = useState(0);

  // ECharts lifecycle
  const { containerRef, chartRef, setOption } = useEChart(buildBaseOption());

  // Track user zoom interaction to disable auto-scroll
  const userInteractedRef = useRef(false);
  const programmaticZoomRef = useRef(false);
  useEffect(() => {
    const chart = chartRef.current;
    if (!chart) return;
    const handler = () => {
      // Skip events fired by our own dispatchAction (auto-scroll)
      if (programmaticZoomRef.current) return;
      userInteractedRef.current = true;
      setIsAutoScroll(false);
    };
    chart.on("dataZoom", handler);
    return () => {
      chart.off("dataZoom", handler);
    };
  }, [chartRef]);

  // Subscribe to store plotter data updates (no React re-renders)
  useEffect(() => {
    // Seed refs from current state so data is available on first rAF tick after remount
    const currentState = useStore.getState();
    const currentSession = currentState.sessions[activeSessionId];
    if (currentSession?.plotter) {
      dataRef.current = currentSession.plotter.data;
      seriesRef.current = currentSession.plotter.series;
    }

    const unsub = useStore.subscribe((state) => {
      const s = state.sessions[activeSessionId];
      if (!s?.plotter) return;
      dataRef.current = s.plotter.data;
      seriesRef.current = s.plotter.series;
    });
    return unsub;
  }, [activeSessionId]);

  // rAF loop: push data to chart at target FPS
  useEffect(() => {
    let rafId: number;
    let lastFrame = 0;
    const frameInterval = 1000 / DEFAULT_TARGET_FPS;

    const tick = (now: number) => {
      rafId = requestAnimationFrame(tick);
      if (now - lastFrame < frameInterval) return;
      lastFrame = now;

      const chart = chartRef.current;
      if (!chart) return;

      const rawData = isPaused ? frozenDataRef.current : dataRef.current;
      const currentSeries = seriesRef.current;

      // Apply time window filter
      const windowMs = TIME_WINDOW_MS[timeWindow];
      let filtered = rawData;
      if (windowMs !== null && rawData.length > 0) {
        const latestTime = rawData[rawData.length - 1]?.time;
        if (latestTime !== undefined) {
          const cutoff = latestTime - windowMs;
          filtered = rawData.filter((p) => (p.time ?? 0) >= cutoff);
        }
      }

      // Build series configs
      const seriesOption = currentSeries.map((key, i) => {
        const color = CHART_COLORS[i % CHART_COLORS.length];
        const isHidden = hiddenSeries.has(key);
        const seriesData = filtered.map((p) => [p.time, p[key] ?? null]);

        return {
          name: key,
          type: "line" as const,
          showSymbol: false,
          sampling: "lttb" as const,
          animation: false,
          large: true,
          largeThreshold: 1000,
          lineStyle: {
            width: 2,
            color,
            opacity: isHidden ? 0 : 1,
          },
          itemStyle: { color, opacity: isHidden ? 0 : 1 },
          // Interpolation modes
          step: interpolation === "step" ? ("end" as const) : (false as const),
          smooth: interpolation === "smooth" ? true : false,
          data: seriesData,
        };
      });

      setOption(
        { series: seriesOption },
        { notMerge: false, lazyUpdate: true },
      );

      // Auto-scroll: move dataZoom to show latest data
      if (isAutoScroll && !userInteractedRef.current && filtered.length > 0) {
        const latestTime = filtered[filtered.length - 1]?.time ?? Date.now();
        const windowDuration = windowMs ?? 60000;
        programmaticZoomRef.current = true;
        chart.dispatchAction({
          type: "dataZoom",
          startValue: latestTime - windowDuration,
          endValue: latestTime,
        });
        programmaticZoomRef.current = false;
      }
      userInteractedRef.current = false;

      // Update point count for UI display
      setDisplayPointCount(filtered.length);
    };

    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [
    chartRef,
    setOption,
    isPaused,
    timeWindow,
    interpolation,
    hiddenSeries,
    isAutoScroll,
  ]);

  const plotter = session?.plotter;
  const config = plotter?.config || {
    enabled: false,
    parser: "CSV" as PlotterParserType,
    bufferSize: 1000,
    autoDiscover: true,
  };
  const data = plotter?.data || [];
  const series = plotter?.series || [];
  const aliases = plotter?.aliases || {};

  const handleTogglePause = () => {
    if (!isPaused) {
      frozenDataRef.current = [...data];
    }
    setIsPaused(!isPaused);
  };

  const handleExport = () => {
    if (data.length === 0) return;
    const headers = ["Timestamp", ...series];
    const csvRows = [headers.join(",")];
    data.forEach((row) => {
      const line = [
        new Date(row.time).toISOString(),
        ...series.map((s) => row[s] ?? ""),
      ];
      csvRows.push(line.join(","));
    });
    const blob = new Blob([csvRows.join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `plotter_export_${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const togglePlotter = () => {
    setPlotterConfig({ enabled: !config.enabled });
  };

  const getSeriesName = (key: string) => aliases[key] || key;

  const toggleSeriesVisibility = useCallback((seriesKey: string) => {
    setHiddenSeries((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(seriesKey)) {
        newSet.delete(seriesKey);
      } else {
        newSet.add(seriesKey);
      }
      return newSet;
    });
  }, []);

  const lastDataPoint = data[data.length - 1];

  return (
    <div className="flex flex-col h-full bg-muted/10 overflow-hidden relative">
      {/* ===== SECTION 9.6: Legend Row (36px) ===== */}
      <div className="h-9 flex items-center justify-between px-4 bg-bg-surface border-b border-border-default shrink-0">
        <div className="flex items-center gap-4">
          {series.map((s, i) => (
            <LegendItem
              key={s}
              seriesKey={s}
              colorIndex={i}
              isHidden={hiddenSeries.has(s)}
              lastValue={lastDataPoint?.[s] as number | undefined}
              displayName={getSeriesName(s)}
              onToggle={toggleSeriesVisibility}
            />
          ))}
          {series.length === 0 && (
            <span className="text-text-muted text-label-sm italic">
              No series detected
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {!isAutoScroll && (
            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                setIsAutoScroll(true);
                userInteractedRef.current = false;
              }}
              className="h-7 gap-1.5 text-xs bg-blue-500/10 text-blue-600 hover:bg-blue-500/20 border border-blue-500/20"
            >
              <ArrowRight className="w-3.5 h-3.5" /> Follow
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={handleTogglePause}
            className={cn(
              "h-7 w-7 p-0",
              isPaused && "bg-amber-500/10 text-amber-600",
            )}
            title={isPaused ? "Resume" : "Pause"}
          >
            {isPaused ? (
              <Play className="w-3.5 h-3.5" />
            ) : (
              <Pause className="w-3.5 h-3.5" />
            )}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={clearPlotterData}
            className="h-7 w-7 p-0 text-text-muted hover:text-destructive"
            title="Clear Data"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleExport}
            disabled={data.length === 0}
            className="h-7 w-7 p-0"
            title="Export CSV"
          >
            <Download className="w-3.5 h-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowSettings(true)}
            className="h-7 w-7 p-0"
            title="Settings"
          >
            <Settings className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>

      {/* ===== SECTION 9.6: Main Content (Variable Selector + Chart) ===== */}
      <div className="flex-1 min-h-0 flex">
        {/* Variable Selector Panel (200px left) */}
        {config.enabled && series.length > 0 && (
          <div className="w-50 border-r border-border-default bg-bg-surface/50 flex flex-col shrink-0">
            <div className="h-8 flex items-center px-3 border-b border-border-default bg-bg-muted/50">
              <span className="text-[10px] uppercase font-bold text-text-muted tracking-wider">
                Variables
              </span>
            </div>
            <div className="flex-1 overflow-y-auto custom-scrollbar py-1">
              {series.map((s, i) => {
                const isVisible = !hiddenSeries.has(s);
                const color = CHART_COLORS[i % CHART_COLORS.length];
                const lastVal = lastDataPoint?.[s];

                return (
                  <div
                    key={s}
                    className={cn(
                      "h-8 flex items-center gap-2 px-3 hover:bg-bg-hover transition-colors cursor-pointer",
                      !isVisible && "opacity-50",
                    )}
                    onClick={() => toggleSeriesVisibility(s)}
                  >
                    <Checkbox
                      checked={isVisible}
                      onChange={() => toggleSeriesVisibility(s)}
                    />
                    <div
                      className="w-3 h-3 rounded-full shrink-0"
                      style={{ backgroundColor: color }}
                    />
                    <span className="flex-1 text-xs font-medium truncate">
                      {getSeriesName(s)}
                    </span>
                    <span className="text-[10px] font-mono text-text-muted tabular-nums">
                      {typeof lastVal === "number" ? lastVal.toFixed(1) : "--"}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Chart Area — container always mounted so useEChart initializes on first render */}
        <div className="flex-1 min-h-0 relative p-4">
          <div className="h-full bg-bg-surface border border-border-default rounded-xl shadow-sm relative overflow-hidden">
            <div ref={containerRef} className="w-full h-full" />

            {/* Overlay: Plotter disabled */}
            {!config.enabled && (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-text-muted opacity-50 bg-bg-surface/95 rounded-xl border-2 border-dashed border-border-default z-10">
                <ChartIcon className="w-12 h-12 mb-4" />
                <p className="font-semibold">Plotter is Disabled</p>
                <p className="text-sm mb-4">
                  Enable to start visualizing incoming data
                </p>
                <Button onClick={togglePlotter}>Enable Plotter</Button>
              </div>
            )}

            {/* Overlay: Waiting for data */}
            {config.enabled && data.length === 0 && (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-text-muted opacity-50 bg-bg-surface/95 rounded-xl z-10">
                <div className="animate-pulse flex flex-col items-center">
                  <ChartIcon className="w-8 h-8 mb-2" />
                  <p className="text-xs">Waiting for data stream...</p>
                  <p className="text-[10px] mt-1 font-mono uppercase">
                    Format:{" "}
                    {config.autoDiscover ? "Auto-Detect" : config.parser}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ===== SECTION 9.6: Bottom Controls Bar ===== */}
      {config.enabled && (
        <div className="h-10 flex items-center justify-between px-4 bg-bg-surface border-t border-border-default shrink-0 relative">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Button
                variant={config.enabled ? "default" : "outline"}
                size="sm"
                className="h-7 px-3 text-xs"
                onClick={togglePlotter}
              >
                {config.enabled ? "Enabled" : "Disabled"}
              </Button>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-[10px] uppercase font-bold text-text-muted">
                Time Window
              </span>
              <SegmentedControl
                options={TIME_WINDOW_OPTIONS}
                value={timeWindow}
                onChange={(v) => setTimeWindow(v as TimeWindowValue)}
                size="sm"
              />
            </div>

            <div className="text-[10px] font-mono text-text-muted tabular-nums">
              {displayPointCount} pts
              {data.length !== displayPointCount && (
                <span className="ml-1 text-text-muted/60">
                  / {data.length} total
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[10px] uppercase font-bold text-text-muted">
              Interpolation
            </span>
            <SegmentedControl
              options={INTERPOLATION_OPTIONS}
              value={interpolation}
              onChange={(v) => setInterpolation(v as InterpolationType)}
              size="sm"
            />
          </div>
        </div>
      )}

      {/* Settings Modal */}
      {showSettings && (
        <div className="absolute inset-0 z-[60] bg-background/60 backdrop-blur-sm flex items-center justify-center p-4">
          <Card className="w-112.5 shadow-2xl border-border animate-in zoom-in-95 duration-200 flex flex-col max-h-[85vh]">
            <div className="flex items-center justify-between p-4 border-b border-border bg-muted/20 shrink-0">
              <span className="font-bold text-sm flex items-center gap-2">
                <Settings className="w-4 h-4" /> Plotter Configuration
              </span>
              <button onClick={() => setShowSettings(false)}>
                <X className="w-4 h-4 text-muted-foreground hover:text-foreground" />
              </button>
            </div>
            <div className="p-4 space-y-6 overflow-y-auto custom-scrollbar">
              <div className="space-y-4">
                <div className="flex items-center gap-2 border-b pb-2 mb-2">
                  <div className="h-6 w-6 bg-blue-500/10 rounded flex items-center justify-center text-blue-600">
                    <ChartIcon className="w-3.5 h-3.5" />
                  </div>
                  <span className="text-xs font-bold uppercase text-muted-foreground">
                    Data Parsing
                  </span>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs">Parser Strategy</Label>
                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      variant={config.autoDiscover ? "default" : "outline"}
                      size="sm"
                      className="h-8 text-xs"
                      onClick={() => setPlotterConfig({ autoDiscover: true })}
                    >
                      Auto-Discover
                    </Button>
                    <Button
                      variant={!config.autoDiscover ? "default" : "outline"}
                      size="sm"
                      className="h-8 text-xs"
                      onClick={() => setPlotterConfig({ autoDiscover: false })}
                    >
                      Manual Mode
                    </Button>
                  </div>
                </div>

                {!config.autoDiscover && (
                  <div className="space-y-2 animate-in fade-in slide-in-from-top-1">
                    <Label className="text-xs">Manual Parser</Label>
                    <SelectDropdown
                      options={
                        [
                          { value: "CSV", label: "Comma Separated (CSV)" },
                          { value: "JSON", label: "Structured JSON" },
                          { value: "REGEX", label: "Custom Regex" },
                        ] as DropdownOption<PlotterParserType>[]
                      }
                      value={config.parser}
                      onChange={(value) => setPlotterConfig({ parser: value })}
                      size="sm"
                    />
                  </div>
                )}

                {config.parser === "REGEX" && (
                  <div className="space-y-2 animate-in fade-in slide-in-from-top-1">
                    <Label className="text-xs">
                      Regular Expression (Capture Groups)
                    </Label>
                    <Input
                      className="h-8 text-xs font-mono"
                      placeholder="e.g. temp=(\\d+\\.\\d+)"
                      value={config.regexString || ""}
                      onChange={(e) =>
                        setPlotterConfig({ regexString: e.target.value })
                      }
                    />
                    <p className="text-[10px] text-muted-foreground italic">
                      Each capture group will create a new data series.
                    </p>
                  </div>
                )}

                <div className="space-y-2">
                  <Label className="text-xs">Buffer Size (History)</Label>
                  <SelectDropdown
                    options={
                      [
                        { value: 100, label: "100 points" },
                        { value: 500, label: "500 points" },
                        { value: 1000, label: "1000 points" },
                        { value: 5000, label: "5000 points" },
                        { value: 50000, label: "50,000 points" },
                        { value: 0, label: "Unlimited" },
                      ] as DropdownOption<number>[]
                    }
                    value={config.bufferSize}
                    onChange={(value) =>
                      setPlotterConfig({ bufferSize: value })
                    }
                    size="sm"
                  />
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center gap-2 border-b pb-2 mb-2">
                  <div className="h-6 w-6 bg-emerald-500/10 rounded flex items-center justify-center text-emerald-600">
                    <Pencil className="w-3.5 h-3.5" />
                  </div>
                  <span className="text-xs font-bold uppercase text-muted-foreground">
                    Series Configuration
                  </span>
                </div>

                {series.length === 0 ? (
                  <div className="text-center py-4 text-muted-foreground text-xs italic bg-muted/20 rounded">
                    No series detected yet.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {series.map((s, i) => (
                      <div key={s} className="flex items-center gap-2">
                        <div
                          className="w-3 h-3 rounded-full shrink-0"
                          style={{
                            backgroundColor:
                              CHART_COLORS[i % CHART_COLORS.length],
                          }}
                        />
                        <div
                          className="text-xs font-mono shrink-0 w-24 truncate text-muted-foreground"
                          title={s}
                        >
                          {s}
                        </div>
                        <Input
                          className="h-7 text-xs flex-1"
                          placeholder="Display Name"
                          value={aliases[s] || ""}
                          onChange={(e) =>
                            setPlotterSeriesAlias(s, e.target.value)
                          }
                        />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="p-4 border-t border-border shrink-0">
              <Button
                className="w-full h-9 gap-2"
                onClick={() => setShowSettings(false)}
              >
                Close Settings
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};

export default PlotterPanel;
