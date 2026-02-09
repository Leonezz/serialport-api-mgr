import React, { useCallback, useMemo, useState, useDeferredValue } from "react";
import { useThrottle } from "../../hooks/useThrottle";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Tooltip,
  CartesianGrid,
  Brush,
} from "recharts";
import { useStore } from "../../lib/store";
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
import { handleChartWheel } from "../../hooks/useChartZoomPan";
import { PlotterParserType, PlotterDataPoint } from "@/types";

// Series colors per FIGMA-DESIGN.md 9.6
const CHART_COLORS = [
  "#3b82f6", // blue.500
  "#22c55e", // green.500
  "#f59e0b", // amber.500
  "#8b5cf6", // purple.500
  "#ef4444", // red.500
  "#06b6d4", // cyan
  "#ec4899", // pink
  "#84cc16", // lime
];

const WINDOW_SIZE = 200; // Visible points in auto-scroll mode

// Maximum points to render at once to prevent browser crash (#12)
const MAX_RENDER_POINTS = 500;

// Minimum interval between chart re-renders during heavy streaming (ms)
const RENDER_THROTTLE_MS = 50;

// Time window options (Section 9.6)
type TimeWindowValue = "30s" | "1m" | "5m" | "15m" | "ALL";
const TIME_WINDOW_OPTIONS: SegmentOption[] = [
  { value: "30s", label: "30s" },
  { value: "1m", label: "1m" },
  { value: "5m", label: "5m" },
  { value: "15m", label: "15m" },
  { value: "ALL", label: "All" },
];

// Time window in milliseconds
const TIME_WINDOW_MS: Record<TimeWindowValue, number | null> = {
  "30s": 30 * 1000,
  "1m": 60 * 1000,
  "5m": 5 * 60 * 1000,
  "15m": 15 * 60 * 1000,
  ALL: null, // null = show all data
};

// Interpolation options (Section 9.6)
type InterpolationType = "linear" | "step" | "smooth";
const INTERPOLATION_OPTIONS: SegmentOption[] = [
  { value: "linear", label: "Linear" },
  { value: "step", label: "Step" },
  { value: "smooth", label: "Smooth" },
];

// Map to Recharts curve types
const INTERPOLATION_MAP: Record<InterpolationType, string> = {
  linear: "linear",
  step: "stepAfter",
  smooth: "monotone",
};

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

const PlotterPanel: React.FC = () => {
  const activeSessionId = useStore((state) => state.activeSessionId);
  const session = useStore((state) => state.sessions[activeSessionId]);
  const { setPlotterConfig, clearPlotterData, setPlotterSeriesAlias } =
    useStore();

  const [isPaused, setIsPaused] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [hiddenSeries, setHiddenSeries] = useState<Set<string>>(new Set());

  // Section 9.6: Time Window & Interpolation state
  const [timeWindow, setTimeWindow] = useState<TimeWindowValue>("1m");
  const [interpolation, setInterpolation] =
    useState<InterpolationType>("linear");

  // Auto-Scroll & Zoom State
  const [isAutoScroll, setIsAutoScroll] = useState(true);
  const [manualViewRange, setManualViewRange] = useState<{
    start: number;
    end: number;
  } | null>(null);

  const plotter = session?.plotter;
  const config = plotter?.config || {
    enabled: false,
    parser: "CSV",
    bufferSize: 1000,
    autoDiscover: true,
  };
  const data = plotter?.data || [];
  const series = plotter?.series || [];
  const aliases = plotter?.aliases || {};

  // Data to display (handle pause)
  const [frozenData, setFrozenData] = useState<PlotterDataPoint[]>([]);
  const rawDisplayData = isPaused ? frozenData : data;

  // Section 9.6: Apply time window filter with additional pruning (#12)
  // Use the latest data point's timestamp as reference (more stable than Date.now())
  const displayData = useMemo(() => {
    const windowMs = TIME_WINDOW_MS[timeWindow];
    let filtered = rawDisplayData;

    // Apply time window filter
    if (windowMs !== null && rawDisplayData.length > 0) {
      const latestTime = rawDisplayData[rawDisplayData.length - 1]?.time;
      if (latestTime !== undefined) {
        const cutoff = latestTime - windowMs;
        filtered = rawDisplayData.filter(
          (point) => (point.time ?? 0) >= cutoff,
        );
      }
    }

    // Additional pruning: if too many points, downsample to prevent browser crash (#12)
    // Keep every Nth point to stay under MAX_RENDER_POINTS
    if (filtered.length > MAX_RENDER_POINTS) {
      const step = Math.ceil(filtered.length / MAX_RENDER_POINTS);
      const downsampled: PlotterDataPoint[] = [];
      for (let i = 0; i < filtered.length; i += step) {
        downsampled.push(filtered[i]);
      }
      // Always include the last point for accurate "current" display
      if (
        downsampled.length > 0 &&
        downsampled[downsampled.length - 1] !== filtered[filtered.length - 1]
      ) {
        downsampled.push(filtered[filtered.length - 1]);
      }
      return downsampled;
    }

    return filtered;
  }, [rawDisplayData, timeWindow]);

  // Throttle chart updates during heavy streaming (#12)
  // useThrottle fires at the interval while data streams (unlike debounce which waits for silence)
  const throttledDisplayData = useThrottle(displayData, RENDER_THROTTLE_MS);

  // Defer throttledDisplayData to keep UI responsive during high-frequency updates
  const deferredDisplayData = useDeferredValue(throttledDisplayData);
  const isDataStale =
    throttledDisplayData !== deferredDisplayData ||
    displayData !== throttledDisplayData;

  // Derived View Range - use deferred data for calculations
  const viewRange = useMemo(() => {
    if (isAutoScroll && deferredDisplayData.length > 0) {
      const end = deferredDisplayData.length - 1;
      const start = Math.max(0, deferredDisplayData.length - WINDOW_SIZE);
      return { start, end };
    }
    return manualViewRange;
  }, [isAutoScroll, deferredDisplayData.length, manualViewRange]);

  // --- Handlers ---

  const handleTogglePause = () => {
    if (!isPaused) {
      setFrozenData([...data]);
    }
    setIsPaused(!isPaused);
  };

  const handleBrushChange = (range: {
    startIndex?: number;
    endIndex?: number;
  }) => {
    if (range.startIndex !== undefined && range.endIndex !== undefined) {
      setManualViewRange({ start: range.startIndex, end: range.endIndex });

      // Check if user dragged to the end -> Re-enable auto-scroll?
      // For now, simpler: User interaction disables auto-scroll.
      // We can add a "stick to end" logic if needed, but explicit is better.
      if (isAutoScroll) setIsAutoScroll(false);
    }
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

  // Toggle series visibility (stable ref for LegendItem React.memo)
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

  const lastDataPoint = deferredDisplayData[deferredDisplayData.length - 1];

  return (
    <div className="flex flex-col h-full bg-muted/10 overflow-hidden relative">
      {/* ===== SECTION 9.6: Legend Row (36px) ===== */}
      <div className="h-9 flex items-center justify-between px-4 bg-bg-surface border-b border-border-default shrink-0">
        <div className="flex items-center gap-4">
          {/* Series Legend Items */}
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

        {/* Legend Action Buttons */}
        <div className="flex items-center gap-2">
          {!isAutoScroll && (
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setIsAutoScroll(true)}
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

        {/* Chart Area */}
        <div className="flex-1 min-h-0 relative p-4">
          {!config.enabled ? (
            <div className="h-full flex flex-col items-center justify-center text-text-muted opacity-50 bg-bg-surface/30 rounded-xl border-2 border-dashed border-border-default">
              <ChartIcon className="w-12 h-12 mb-4" />
              <p className="font-semibold">Plotter is Disabled</p>
              <p className="text-sm mb-4">
                Enable to start visualizing incoming data
              </p>
              <Button onClick={togglePlotter}>Enable Plotter</Button>
            </div>
          ) : displayData.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-text-muted opacity-50 bg-bg-surface/30 rounded-xl border border-border-default">
              <div className="animate-pulse flex flex-col items-center">
                <ChartIcon className="w-8 h-8 mb-2" />
                <p className="text-xs">Waiting for data stream...</p>
                <p className="text-[10px] mt-1 font-mono uppercase">
                  Format: {config.autoDiscover ? "Auto-Detect" : config.parser}
                </p>
              </div>
            </div>
          ) : (
            <div
              className="h-full bg-bg-surface border border-border-default rounded-xl shadow-sm p-4 relative"
              onWheel={(e) => {
                const currentStart = viewRange?.start ?? 0;
                const currentEnd =
                  viewRange?.end ?? Math.max(0, deferredDisplayData.length - 1);

                handleChartWheel(
                  e,
                  { start: currentStart, end: currentEnd },
                  deferredDisplayData.length,
                  (newRange) => setManualViewRange(newRange),
                  () => setIsAutoScroll(false),
                );
              }}
            >
              {/* Data Loading Indicator */}
              {isDataStale && (
                <div className="absolute top-2 right-2 z-10 bg-amber-500/10 border border-amber-500/30 rounded-full px-3 py-1 text-[10px] font-medium text-amber-600 animate-pulse">
                  Updating...
                </div>
              )}
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={deferredDisplayData}
                  margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    strokeOpacity={0.1}
                    vertical={false}
                  />
                  <XAxis
                    dataKey="time"
                    type="number"
                    domain={["dataMin", "dataMax"]}
                    tickFormatter={(t) => new Date(t).toLocaleTimeString()}
                    tick={{ fontSize: 10 }}
                    height={30}
                  />
                  <YAxis
                    width={40}
                    tick={{ fontSize: 10 }}
                    domain={["auto", "auto"]}
                  />
                  <Tooltip
                    labelFormatter={(t) => new Date(t).toLocaleTimeString()}
                    formatter={(value: number, name: string) => [
                      value,
                      getSeriesName(name),
                    ]}
                    contentStyle={{
                      borderRadius: "0.5rem",
                      border: "1px solid hsl(var(--border))",
                      fontSize: "12px",
                      backgroundColor: "hsl(var(--popover))",
                      color: "hsl(var(--popover-foreground))",
                    }}
                  />
                  {series.map((key, i) => (
                    <Line
                      key={key}
                      type={
                        INTERPOLATION_MAP[interpolation] as
                          | "linear"
                          | "stepAfter"
                          | "monotone"
                      }
                      dataKey={key}
                      name={key}
                      stroke={CHART_COLORS[i % CHART_COLORS.length]}
                      strokeWidth={2}
                      dot={false}
                      activeDot={{ r: 4 }}
                      isAnimationActive={false}
                      hide={hiddenSeries.has(key)}
                    />
                  ))}
                  <Brush
                    dataKey="time"
                    height={30}
                    stroke="var(--color-border-default)"
                    fill="var(--color-bg-muted)"
                    tickFormatter={() => ""}
                    startIndex={viewRange?.start}
                    endIndex={viewRange?.end}
                    onChange={handleBrushChange}
                    travellerWidth={10}
                    className="recharts-brush-themed"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>

      {/* ===== SECTION 9.6: Bottom Controls Bar ===== */}
      {config.enabled && (
        <div className="h-10 flex items-center justify-between px-4 bg-bg-surface border-t border-border-default shrink-0 relative">
          <div className="flex items-center gap-4">
            {/* Enable/Disable Toggle */}
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

            {/* Time Window */}
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

            {/* Data Stats - Positioned here to not affect Interpolation layout */}
            <div className="text-[10px] font-mono text-text-muted tabular-nums">
              {deferredDisplayData.length} pts
              {data.length !== deferredDisplayData.length && (
                <span className="ml-1 text-text-muted/60">
                  / {data.length} total
                </span>
              )}
            </div>
          </div>

          {/* Interpolation - Isolated on the right */}
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
              {/* Parser Config */}
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

              {/* Series Config */}
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
