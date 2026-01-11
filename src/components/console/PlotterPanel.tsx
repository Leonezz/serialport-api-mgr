import React, { useMemo, useState, useEffect } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Tooltip,
  CartesianGrid,
  Legend,
  Brush,
} from "recharts";
import { useStore } from "../../lib/store";
import { Button } from "../ui/Button";
import {
  Pause,
  Play,
  Trash2,
  Download,
  Settings,
  X,
  LineChart as ChartIcon,
  ArrowRight,
} from "lucide-react";
import { cn } from "../../lib/utils";
import { Card } from "../ui/Card";
import { Label } from "../ui/Label";
import { Select } from "../ui/Select";
import { Input } from "../ui/Input";
import { PlotterParserType } from "../../types";
import { handleChartWheel } from "../../hooks/useChartZoomPan";

const CHART_COLORS = [
  "#ef4444", // Red
  "#22c55e", // Green
  "#3b82f6", // Blue
  "#f59e0b", // Amber
  "#8b5cf6", // Violet
  "#ec4899", // Pink
  "#06b6d4", // Cyan
  "#14b8a6", // Teal
  "#f97316", // Orange
  "#6366f1", // Indigo
];

const WINDOW_SIZE = 200; // Visible points in auto-scroll mode

const PlotterPanel: React.FC = () => {
  const activeSessionId = useStore((state) => state.activeSessionId);
  const session = useStore((state) => state.sessions[activeSessionId]);
  const { setPlotterConfig, clearPlotterData } = useStore();

  const [isPaused, setIsPaused] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [hiddenSeries, setHiddenSeries] = useState<Set<string>>(new Set());

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

  // Data to display (handle pause)
  const [frozenData, setFrozenData] = useState<any[]>([]);
  const displayData = isPaused ? frozenData : data;

  // Derived View Range
  const viewRange = useMemo(() => {
    if (isAutoScroll && displayData.length > 0) {
      const end = displayData.length - 1;
      const start = Math.max(0, displayData.length - WINDOW_SIZE);
      return { start, end };
    }
    return manualViewRange;
  }, [isAutoScroll, displayData.length, manualViewRange]);

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

  const handleLegendClick = (e: any) => {
    const dataKey = e.dataKey;
    setHiddenSeries((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(dataKey)) {
        newSet.delete(dataKey);
      } else {
        newSet.add(dataKey);
      }
      return newSet;
    });
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

  return (
    <div className="flex flex-col h-full bg-muted/10 overflow-hidden relative">
      {/* Header Controls */}
      <div className="flex justify-between items-center p-4 bg-background/50 border-b border-border shrink-0 z-20">
        <div className="flex items-center gap-4">
          <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
            <ChartIcon className="w-4 h-4" /> Real-time Plotter
          </h3>
          <div className="flex items-center gap-1 bg-muted/50 p-0.5 rounded-md border border-border">
            <Button
              variant={config.enabled ? "default" : "ghost"}
              size="sm"
              className="h-7 px-3 text-xs"
              onClick={togglePlotter}
            >
              {config.enabled ? "Enabled" : "Disabled"}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 px-2"
              onClick={() => setShowSettings(true)}
              title="Plotter Settings"
            >
              <Settings className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {!isAutoScroll && (
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setIsAutoScroll(true)}
              className="h-8 gap-1.5 text-xs bg-blue-500/10 text-blue-600 hover:bg-blue-500/20 border border-blue-500/20"
            >
              <ArrowRight className="w-3.5 h-3.5" /> Follow
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={handleTogglePause}
            className={cn(
              "h-8 gap-1.5 text-xs",
              isPaused && "bg-amber-500/10 border-amber-500/50 text-amber-600",
            )}
          >
            {isPaused ? (
              <Play className="w-3.5 h-3.5" />
            ) : (
              <Pause className="w-3.5 h-3.5" />
            )}
            {isPaused ? "Resume" : "Pause"}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={clearPlotterData}
            className="h-8 gap-1.5 text-xs text-muted-foreground hover:text-destructive"
          >
            <Trash2 className="w-3.5 h-3.5" /> Clear
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleExport}
            disabled={data.length === 0}
            className="h-8 gap-1.5 text-xs"
          >
            <Download className="w-3.5 h-3.5" /> Export
          </Button>
        </div>
      </div>

      {/* Main Plot Area */}
      <div className="flex-1 min-h-0 relative p-4 flex flex-col gap-4">
        {!config.enabled ? (
          <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground opacity-50 bg-card/30 rounded-xl border-2 border-dashed border-border">
            <ChartIcon className="w-12 h-12 mb-4" />
            <p className="font-semibold">Plotter is Disabled</p>
            <p className="text-sm mb-4">
              Enable to start visualizing incoming data
            </p>
            <Button onClick={togglePlotter}>Enable Plotter</Button>
          </div>
        ) : displayData.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground opacity-50 bg-card/30 rounded-xl border border-border">
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
            className="flex-1 bg-card border border-border rounded-xl shadow-sm p-4 min-h-0"
            onWheel={(e) => {
              const currentStart = viewRange?.start ?? 0;
              const currentEnd =
                viewRange?.end ?? Math.max(0, displayData.length - 1);

              handleChartWheel(
                e,
                { start: currentStart, end: currentEnd },
                displayData.length,
                (newRange) => setManualViewRange(newRange),
                () => setIsAutoScroll(false),
              );
            }}
          >
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={displayData}
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
                  contentStyle={{
                    borderRadius: "0.5rem",
                    border: "1px solid hsl(var(--border))",
                    fontSize: "12px",
                    backgroundColor: "hsl(var(--popover))",
                    color: "hsl(var(--popover-foreground))",
                  }}
                />
                <Legend
                  iconType="circle"
                  wrapperStyle={{
                    fontSize: "12px",
                    paddingTop: "10px",
                    cursor: "pointer",
                  }}
                  onClick={handleLegendClick}
                />
                {series.map((key, i) => (
                  <Line
                    key={key}
                    type="monotone"
                    dataKey={key}
                    stroke={CHART_COLORS[i % CHART_COLORS.length]}
                    strokeWidth={2}
                    dot={false}
                    isAnimationActive={false}
                    hide={hiddenSeries.has(key)}
                  />
                ))}
                <Brush
                  dataKey="time"
                  height={30}
                  stroke="hsl(var(--border))"
                  fill="hsl(var(--muted)/0.3)"
                  tickFormatter={() => ""}
                  startIndex={viewRange?.start}
                  endIndex={viewRange?.end}
                  onChange={handleBrushChange}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Quick Config / Status Bar (Bottom) */}
        {config.enabled && series.length > 0 && (
          <div className="bg-card border border-border rounded-lg p-3 flex flex-wrap gap-4 items-center shrink-0 shadow-sm">
            <div className="flex items-center gap-2 pr-4 border-r border-border">
              <span className="text-[10px] uppercase font-bold text-muted-foreground">
                Active Series
              </span>
              <span className="bg-primary/10 text-primary text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                {series.length}
              </span>
            </div>
            {series.slice(0, 8).map((s, i) => {
              const lastVal = displayData[displayData.length - 1]?.[s];
              const isHidden = hiddenSeries.has(s);
              return (
                <div
                  key={s}
                  className={cn(
                    "flex items-center gap-2 cursor-pointer transition-opacity",
                    isHidden && "opacity-40 grayscale",
                  )}
                  onClick={() => handleLegendClick({ dataKey: s })}
                >
                  <div
                    className="w-2 h-2 rounded-full"
                    style={{
                      backgroundColor: CHART_COLORS[i % CHART_COLORS.length],
                    }}
                  />
                  <span className="text-xs font-medium truncate max-w-[100px]">
                    {s}:
                  </span>
                  <span className="text-xs font-mono font-bold text-primary">
                    {typeof lastVal === "number" ? lastVal.toFixed(2) : "--"}
                  </span>
                </div>
              );
            })}
            {series.length > 8 && (
              <span className="text-xs text-muted-foreground">
                +{series.length - 8} more
              </span>
            )}
          </div>
        )}
      </div>

      {/* Settings Modal */}
      {showSettings && (
        <div className="absolute inset-0 z-50 bg-background/60 backdrop-blur-sm flex items-center justify-center p-4">
          <Card className="w-[400px] shadow-2xl border-border animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between p-4 border-b border-border bg-muted/20">
              <span className="font-bold text-sm flex items-center gap-2">
                <Settings className="w-4 h-4" /> Plotter Configuration
              </span>
              <button onClick={() => setShowSettings(false)}>
                <X className="w-4 h-4 text-muted-foreground hover:text-foreground" />
              </button>
            </div>
            <div className="p-4 space-y-4">
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
                  <Select
                    className="h-8 text-xs"
                    value={config.parser}
                    onChange={(e) =>
                      setPlotterConfig({
                        parser: e.target.value as PlotterParserType,
                      })
                    }
                  >
                    <option value="CSV">Comma Separated (CSV)</option>
                    <option value="JSON">Structured JSON</option>
                    <option value="REGEX">Custom Regex</option>
                  </Select>
                </div>
              )}

              {config.parser === "REGEX" && (
                <div className="space-y-2 animate-in fade-in slide-in-from-top-1">
                  <Label className="text-xs">
                    Regular Expression (Capture Groups)
                  </Label>
                  <Input
                    className="h-8 text-xs font-mono"
                    placeholder="e.g. temp=(\d+\.\d+)"
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
                <Select
                  className="h-8 text-xs"
                  value={config.bufferSize.toString()}
                  onChange={(e) =>
                    setPlotterConfig({ bufferSize: parseInt(e.target.value) })
                  }
                >
                  <option value="100">100 points</option>
                  <option value="500">500 points</option>
                  <option value="1000">1000 points</option>
                  <option value="5000">5000 points</option>
                </Select>
              </div>

              <div className="pt-2">
                <Button
                  className="w-full h-9 gap-2"
                  onClick={() => setShowSettings(false)}
                >
                  Close Settings
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};

export default PlotterPanel;
