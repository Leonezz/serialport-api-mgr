import React, { useMemo, useState, useRef, useEffect } from "react";
import { LogEntry } from "../../types";
import {
  Activity,
  Search,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  MoveHorizontal,
  ArrowRightToLine,
} from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  ReferenceLine,
  Brush,
} from "recharts";
import { getBytes, cn } from "../../lib/utils";
import { Button } from "../ui/Button";

// Logic Level Definitions
const RX_LOW = 0;
const RX_IDLE = 0.5;
const RX_HIGH = 1;

const TX_LOW = 2;
const TX_IDLE = 2.5;
const TX_HIGH = 3;

const LogicAnalyzerPanel: React.FC<{ logs: LogEntry[] }> = ({ logs }) => {
  // Transform logs into bit streams
  const chartData = useMemo(() => {
    // Sort logs chronologically to create a true timeline
    const sortedLogs = [...logs].sort((a, b) => a.timestamp - b.timestamp);

    const data: {
      index: number;
      rx?: number;
      tx?: number;
      byteInfo?: string;
      timestamp?: string;
    }[] = [];
    let globalIndex = 0;

    // Initial IDLE state (Both channels idle)
    data.push({
      index: globalIndex++,
      rx: RX_IDLE,
      tx: TX_IDLE,
      timestamp: "",
    });

    sortedLogs.forEach((log) => {
      const bytes = getBytes(log.data);
      const isRx = log.direction === "RX";
      const timeStr = new Date(log.timestamp).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        fractionalSecondDigits: 3,
      } as any);

      bytes.forEach((byte, byteIdx) => {
        // Start Bit (Logic 0)
        // If RX is active, RX=0, TX=IDLE. If TX is active, TX=0 (mapped to 2), RX=IDLE.
        data.push({
          index: globalIndex++,
          rx: isRx ? RX_LOW : RX_IDLE,
          tx: !isRx ? TX_LOW : TX_IDLE,
          byteInfo: "START",
          timestamp: timeStr,
        });

        // Data Bits (LSB First)
        for (let b = 0; b < 8; b++) {
          const bitVal = (byte >> b) & 1;
          const char =
            byte >= 32 && byte <= 126 ? String.fromCharCode(byte) : ".";
          const hex = byte.toString(16).toUpperCase().padStart(2, "0");

          // RX: bit 0->0, 1->1. TX: bit 0->2, 1->3
          const rxVal = isRx ? (bitVal === 1 ? RX_HIGH : RX_LOW) : RX_IDLE;
          const txVal = !isRx ? (bitVal === 1 ? TX_HIGH : TX_LOW) : TX_IDLE;

          data.push({
            index: globalIndex++,
            rx: rxVal,
            tx: txVal,
            byteInfo: `Bit ${b}: ${bitVal} (${hex} '${char}')`,
            timestamp: timeStr,
          });
        }

        // Stop Bit (Logic 1)
        data.push({
          index: globalIndex++,
          rx: isRx ? RX_HIGH : RX_IDLE,
          tx: !isRx ? TX_HIGH : TX_IDLE,
          byteInfo: "STOP",
          timestamp: timeStr,
        });
      });

      // Visual Gap (IDLE) between packets to distinguish them
      // Both channels go to IDLE state
      for (let i = 0; i < 4; i++) {
        data.push({
          index: globalIndex++,
          rx: RX_IDLE,
          tx: TX_IDLE,
          timestamp: "",
        });
      }
    });

    return data;
  }, [logs]);

  // --- Zoom & Pan State ---
  const [domain, setDomain] = useState<{ min: number; max: number } | null>(
    null,
  );
  const [isAutoScroll, setIsAutoScroll] = useState(true);
  const [isDragging, setIsDragging] = useState(false);

  const dragStartRef = useRef<{
    x: number;
    domainMin: number;
    domainMax: number;
  } | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Refs for Native Event Listeners to access latest state without re-binding
  const domainRef = useRef(domain);
  const chartDataLengthRef = useRef(chartData.length);

  useEffect(() => {
    domainRef.current = domain;
  }, [domain]);
  useEffect(() => {
    chartDataLengthRef.current = chartData.length;
  }, [chartData.length]);

  // Initialize domain or handle data updates (Windowing)
  useEffect(() => {
    if (chartData.length === 0) {
      setDomain(null);
      return;
    }

    // If initializing, default to the end (Live View)
    if (!domain) {
      const INITIAL_WINDOW = 100; // Even smaller initial window for better detail
      const newMax = chartData.length - 1;
      const newMin = Math.max(0, newMax - INITIAL_WINDOW);
      setDomain({ min: newMin, max: newMax });
      setIsAutoScroll(true);
      return;
    }

    // If we are in auto-scroll mode, maintain the window size but shift to the new end
    if (isAutoScroll) {
      setDomain((prev) => {
        if (!prev) return null;
        const windowSize = prev.max - prev.min;
        const newMax = chartData.length - 1;
        const newMin = Math.max(0, newMax - windowSize);
        return { min: newMin, max: newMax };
      });
    }
  }, [chartData.length]);

  // Internal helper to set domain safely
  const setSafeDomain = (newMin: number, newMax: number) => {
    const dataLength = chartDataLengthRef.current;
    let safeMin = Math.max(0, Math.floor(newMin));
    let safeMax = Math.min(dataLength - 1, Math.ceil(newMax));

    // Minimum zoom level (e.g. 10 data points)
    if (safeMax - safeMin < 10) {
      if (safeMin === 0) safeMax = 10;
      else safeMin = safeMax - 10;
    }

    setDomain({ min: safeMin, max: safeMax });

    // Auto-stick to the end if the user scrolls to the right edge
    if (safeMax >= dataLength - 2) {
      setIsAutoScroll(true);
    } else {
      setIsAutoScroll(false);
    }
  };

  const updateDomain = (newMin: number, newMax: number) => {
    setSafeDomain(newMin, newMax);
  };

  // Native Wheel Listener to prevent Browser Zoom
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleWheelNative = (e: WheelEvent) => {
      // CRITICAL: prevents browser page zoom when ctrl is held
      e.preventDefault();
      e.stopPropagation();

      const currentDomain = domainRef.current;
      const dataLength = chartDataLengthRef.current;

      if (!currentDomain) return;

      const { min, max } = currentDomain;
      const range = max - min;
      const rect = container.getBoundingClientRect();
      const CHART_LEFT_OFFSET = 35;
      const chartWidth = Math.max(1, rect.width - CHART_LEFT_OFFSET);

      if (e.ctrlKey) {
        // ZOOM (Ctrl + Wheel or Trackpad Pinch)
        const zoomSpeed = 0.01;
        const delta = e.deltaY * zoomSpeed; // Sign: +ZoomOut, -ZoomIn

        let mousePercent =
          (e.clientX - rect.left - CHART_LEFT_OFFSET) / chartWidth;
        mousePercent = Math.max(0, Math.min(1, mousePercent));

        let newRange = range * (1 + delta);
        const MAX_RANGE = dataLength;

        if (newRange > MAX_RANGE) newRange = MAX_RANGE;
        if (newRange < 10) newRange = 10;

        const pivotIndex = min + range * mousePercent;
        const newMin = pivotIndex - newRange * mousePercent;
        const newMax = newMin + newRange;

        setSafeDomain(newMin, newMax);
      } else {
        // PAN (Wheel or Trackpad Swipe)
        const pixelDelta = e.deltaX + e.deltaY;
        const indicesPerPixel = range / chartWidth;
        const shift = pixelDelta * indicesPerPixel;

        let newMin = min + shift;
        let newMax = max + shift;

        // Boundary checks for pan
        if (newMin < 0) {
          newMin = 0;
          newMax = range;
        }
        if (newMax > dataLength - 1) {
          newMax = dataLength - 1;
          newMin = newMax - range;
        }

        setSafeDomain(newMin, newMax);
      }
    };

    // Attach with passive: false to allow preventDefault
    container.addEventListener("wheel", handleWheelNative, { passive: false });

    return () => {
      container.removeEventListener("wheel", handleWheelNative);
    };
  }, []);

  const handleMouseDown = (e: React.MouseEvent) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (rect && e.clientY - rect.top > rect.height - 50) {
      return; // Let Brush handle clicks
    }

    if (!domain) return;
    setIsDragging(true);
    dragStartRef.current = {
      x: e.clientX,
      domainMin: domain.min,
      domainMax: domain.max,
    };
    document.body.style.cursor = "grabbing";
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (
      !isDragging ||
      !dragStartRef.current ||
      !domain ||
      !containerRef.current
    )
      return;

    const rect = containerRef.current.getBoundingClientRect();
    const chartWidth = rect.width;

    const deltaPixels = dragStartRef.current.x - e.clientX;

    const currentRange =
      dragStartRef.current.domainMax - dragStartRef.current.domainMin;
    const indicesPerPixel = currentRange / chartWidth;
    const deltaIndices = deltaPixels * indicesPerPixel;

    let newMin = dragStartRef.current.domainMin + deltaIndices;
    let newMax = dragStartRef.current.domainMax + deltaIndices;

    if (newMin < 0) {
      newMin = 0;
      newMax = currentRange;
    }
    if (newMax > chartData.length - 1) {
      newMax = chartData.length - 1;
      newMin = newMax - currentRange;
    }

    updateDomain(newMin, newMax);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    dragStartRef.current = null;
    document.body.style.cursor = "";
  };

  const handleReset = () => {
    // Jump to end (Live)
    const INITIAL_WINDOW = 100;
    const newMax = chartData.length - 1;
    const newMin = Math.max(0, newMax - INITIAL_WINDOW);
    setDomain({ min: newMin, max: newMax });
    setIsAutoScroll(true);
  };

  const zoomStep = (dir: "in" | "out") => {
    if (!domain) return;
    const { min, max } = domain;
    const range = max - min;
    const factor = 0.2;
    const delta = range * factor * (dir === "in" ? 1 : -1);

    updateDomain(min + delta / 2, max - delta / 2);
  };

  // Brush handler
  const handleBrushChange = (e: any) => {
    if (e && e.startIndex !== undefined && e.endIndex !== undefined) {
      // Using updateDomain ensures autoScroll state is managed correctly
      updateDomain(e.startIndex, e.endIndex);
    }
  };

  // Custom Tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const rxVal = payload.find((p: any) => p.dataKey === "rx");
      const txVal = payload.find((p: any) => p.dataKey === "tx");
      const info = payload[0]?.payload?.byteInfo;
      const time = payload[0]?.payload?.timestamp;

      const formatValue = (val: number, type: "RX" | "TX") => {
        if (type === "RX") {
          if (val === RX_IDLE) return "IDLE";
          return val === RX_HIGH ? "1 (High)" : "0 (Low)";
        } else {
          if (val === TX_IDLE) return "IDLE";
          return val === TX_HIGH ? "1 (High)" : "0 (Low)";
        }
      };

      return (
        <div className="bg-popover border border-border p-2 rounded shadow-lg text-xs font-mono z-50 text-popover-foreground">
          {time && (
            <p className="font-bold text-muted-foreground mb-1">{time}</p>
          )}
          <p className="font-bold mb-1 opacity-70">
            Sequence: {Math.round(label)}
          </p>

          {rxVal && (
            <div
              className={
                rxVal.value === RX_IDLE
                  ? "text-muted-foreground opacity-50"
                  : "text-emerald-500"
              }
            >
              RX: {formatValue(rxVal.value, "RX")}{" "}
              {rxVal.value !== RX_IDLE && info && `(${info})`}
            </div>
          )}
          {txVal && (
            <div
              className={
                txVal.value === TX_IDLE
                  ? "text-muted-foreground opacity-50"
                  : "text-violet-500"
              }
            >
              TX: {formatValue(txVal.value, "TX")}
            </div>
          )}
        </div>
      );
    }
    return null;
  };

  if (logs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full bg-card rounded-lg border border-border text-muted-foreground">
        <Activity className="w-12 h-12 mb-2 opacity-20" />
        <p className="text-xs">No Data to Analyze</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-card rounded-lg border border-border overflow-hidden relative group">
      {/* Header / Legend / Controls */}
      <div className="absolute top-2 left-4 z-20 flex items-start justify-between w-[calc(100%-2rem)] pointer-events-none">
        <div className="text-[10px] text-muted-foreground font-mono bg-background/80 backdrop-blur px-2 py-1 rounded border border-border/30">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 bg-violet-500 rounded-full inline-block"></span>{" "}
            TX (Upper)
          </div>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="w-2 h-2 bg-emerald-500 rounded-full inline-block"></span>{" "}
            RX (Lower)
          </div>
        </div>

        <div className="flex items-center gap-1 bg-background/80 backdrop-blur p-1 rounded border border-border/30 pointer-events-auto shadow-sm opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={() => zoomStep("in")}
            title="Zoom In (Ctrl+Scroll)"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={() => zoomStep("out")}
            title="Zoom Out (Ctrl+Scroll)"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className={cn(
              "h-6 w-6 transition-colors",
              isAutoScroll && "text-primary bg-primary/10",
            )}
            onClick={handleReset}
            title="Jump to Live Data"
          >
            <ArrowRightToLine className="w-3.5 h-3.5" />
          </Button>
          <div className="w-px h-3 bg-border mx-0.5"></div>
          <div className="flex items-center gap-1 px-1 text-[9px] text-muted-foreground">
            <MoveHorizontal className="w-3 h-3" /> Pan/Brush
          </div>
        </div>
      </div>

      <div
        ref={containerRef}
        className={cn(
          "flex-1 w-full mt-4 text-xs font-mono select-none",
          isDragging ? "cursor-grabbing" : "cursor-grab",
        )}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={chartData}
            margin={{ top: 20, right: 10, left: 0, bottom: 5 }}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              strokeOpacity={0.1}
              vertical={false}
            />

            {/* Reference lines for IDLE states */}
            <ReferenceLine
              y={RX_IDLE}
              stroke="hsl(var(--muted-foreground))"
              strokeDasharray="3 3"
              opacity={0.3}
              strokeWidth={1}
            />
            <ReferenceLine
              y={TX_IDLE}
              stroke="hsl(var(--muted-foreground))"
              strokeDasharray="3 3"
              opacity={0.3}
              strokeWidth={1}
            />

            <XAxis
              dataKey="index"
              type="number"
              domain={
                domain ? [domain.min, domain.max] : ["dataMin", "dataMax"]
              }
              allowDataOverflow={true}
              tickFormatter={(val) => {
                const entry = chartData[Math.round(val)];
                return entry?.timestamp || "";
              }}
              interval="preserveStartEnd"
              minTickGap={50}
              tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
              height={30}
            />
            <YAxis
              domain={[0, 4]}
              ticks={[RX_LOW, RX_IDLE, RX_HIGH, TX_LOW, TX_IDLE, TX_HIGH]}
              tickFormatter={(val) => {
                if (val === RX_IDLE || val === TX_IDLE) return "∅";
                if (val === RX_HIGH || val === TX_HIGH) return "H";
                if (val === RX_LOW || val === TX_LOW) return "L";
                return "";
              }}
              width={30}
              tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
            />
            {!isDragging && (
              <Tooltip
                content={<CustomTooltip />}
                cursor={{
                  stroke: "hsl(var(--foreground))",
                  strokeWidth: 1,
                  opacity: 0.2,
                }}
                animationDuration={100}
              />
            )}

            {/* RX Line (Green) */}
            <Line
              type="stepAfter"
              dataKey="rx"
              stroke="#10b981"
              strokeWidth={2}
              dot={false}
              isAnimationActive={false}
            />

            {/* TX Line (Violet) */}
            <Line
              type="stepAfter"
              dataKey="tx"
              stroke="#8b5cf6"
              strokeWidth={2}
              dot={false}
              isAnimationActive={false}
            />

            {/* The Windowing Brush */}
            <Brush
              dataKey="index"
              height={30}
              stroke="hsl(var(--primary))"
              fill="hsl(var(--background))"
              tickFormatter={() => ""}
              startIndex={domain?.min}
              endIndex={domain?.max}
              onChange={handleBrushChange}
              alwaysShowText={false}
              className="text-[9px] opacity-80"
            >
              <LineChart data={chartData}>
                <Line
                  type="stepAfter"
                  dataKey="rx"
                  stroke="#10b981"
                  dot={false}
                  strokeWidth={1}
                />
                <Line
                  type="stepAfter"
                  dataKey="tx"
                  stroke="#8b5cf6"
                  dot={false}
                  strokeWidth={1}
                />
              </LineChart>
            </Brush>
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default LogicAnalyzerPanel;
