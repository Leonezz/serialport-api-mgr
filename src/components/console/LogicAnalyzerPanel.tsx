import React, { useMemo, useState, useRef, useEffect } from "react";
import {
  Activity,
  ZoomIn,
  ZoomOut,
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
  Customized,
} from "recharts";
import { getBytes, cn } from "../../lib/utils";
import { Button } from "../ui/Button";
import { LogEntry } from "@/types";

/**
 * LogicAnalyzerPanel Component
 *
 * Design System Specifications (FIGMA-DESIGN.md 9.5):
 * - Stacked channels: RX (Y: 0-1), TX (Y: 2-3) with IDLE at 0.5/2.5
 * - TX waveform: Blue (#3b82f6)
 * - RX waveform: Green (#10b981)
 * - Byte annotations inline on waveform
 * - Floating controls on hover
 * - Brush navigator at bottom
 *
 * Design Tokens Used:
 * - `bg-bg-surface`: Container background
 * - `border-border-default-default`: Container border
 * - `text-text-muted`: Labels, axis text
 */

// Waveform colors (consistent with app: TX=blue, RX=green)
const TX_COLOR = "#3b82f6"; // blue-500
const RX_COLOR = "#10b981"; // emerald-500

// Logic Level Definitions
const RX_LOW = 0;
const RX_IDLE = 0.5;
const RX_HIGH = 1;

const TX_LOW = 2;
const TX_IDLE = 2.5;
const TX_HIGH = 3;

// Byte annotation data structure for rendering
interface ByteAnnotationData {
  index: number; // Midpoint index for label
  startIndex: number; // Byte start (START bit)
  endIndex: number; // Byte end (after STOP bit)
  label: string; // e.g., "41 'A'"
  channel: "TX" | "RX";
}

// Custom component for rendering byte annotations as a stable SVG layer
interface ByteAnnotationsProps {
  xAxisMap?: Record<string, { scale: (val: number) => number }>;
  yAxisMap?: Record<string, { scale: (val: number) => number }>;
  annotations: ByteAnnotationData[];
  domain: { min: number; max: number } | null;
}

const ByteAnnotations: React.FC<ByteAnnotationsProps> = ({
  xAxisMap,
  yAxisMap,
  annotations,
  domain,
}) => {
  if (!xAxisMap || !yAxisMap || !domain) return null;

  const xScale = xAxisMap["0"]?.scale;
  const yScale = yAxisMap["0"]?.scale;
  if (!xScale || !yScale) return null;

  // Only show annotations when zoomed in enough (avoid clutter)
  const visibleRange = domain.max - domain.min;
  if (visibleRange > 300) return null; // Hide when too zoomed out

  // Filter to annotations that overlap with visible domain
  const visibleAnnotations = annotations.filter(
    (a) => a.endIndex >= domain.min && a.startIndex <= domain.max,
  );

  // Calculate Y positions for each channel's annotation line
  const rxLineY = yScale(RX_HIGH) - 20;
  const txLineY = yScale(TX_HIGH) - 20;

  return (
    <g className="byte-annotations">
      {visibleAnnotations.map((anno, idx) => {
        const xStart = xScale(Math.max(anno.startIndex, domain.min));
        const xEnd = xScale(Math.min(anno.endIndex, domain.max));
        const xMid = xScale(anno.index);
        const lineY = anno.channel === "RX" ? rxLineY : txLineY;
        const color = anno.channel === "RX" ? RX_COLOR : TX_COLOR;
        const colorFaded = anno.channel === "RX" ? "#10b98140" : "#3b82f640";

        return (
          <g key={`anno-${anno.channel}-${idx}`}>
            {/* Vertical start boundary */}
            <line
              x1={xStart}
              y1={lineY + 8}
              x2={xStart}
              y2={lineY + 16}
              stroke={color}
              strokeWidth={1}
              opacity={0.6}
            />
            {/* Vertical end boundary */}
            <line
              x1={xEnd}
              y1={lineY + 8}
              x2={xEnd}
              y2={lineY + 16}
              stroke={color}
              strokeWidth={1}
              opacity={0.6}
            />
            {/* Horizontal line spanning the byte */}
            <line
              x1={xStart}
              y1={lineY + 12}
              x2={xEnd}
              y2={lineY + 12}
              stroke={color}
              strokeWidth={1.5}
              opacity={0.4}
            />
            {/* Background pill for text */}
            <rect
              x={xMid - 24}
              y={lineY - 6}
              width={48}
              height={14}
              rx={3}
              fill={colorFaded}
              className="dark:fill-opacity-30"
            />
            {/* Text label */}
            <text
              x={xMid}
              y={lineY + 5}
              textAnchor="middle"
              fontSize={9}
              fontFamily="monospace"
              fontWeight={600}
              fill={color}
              className="select-none pointer-events-none"
            >
              {anno.label}
            </text>
          </g>
        );
      })}
    </g>
  );
};

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
      // Byte annotation fields (only set at byte midpoint for labeling)
      byteAnnotation?: string;
      byteChannel?: "TX" | "RX";
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
      } as Intl.DateTimeFormatOptions);

      bytes.forEach((byte, _byteIdx) => {
        const char =
          byte >= 32 && byte <= 126 ? String.fromCharCode(byte) : ".";
        const hex = byte.toString(16).toUpperCase().padStart(2, "0");

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

          // RX: bit 0->0, 1->1. TX: bit 0->2, 1->3
          const rxVal = isRx ? (bitVal === 1 ? RX_HIGH : RX_LOW) : RX_IDLE;
          const txVal = !isRx ? (bitVal === 1 ? TX_HIGH : TX_LOW) : TX_IDLE;

          // Add byte annotation at bit 4 (middle of byte) for cleaner display
          const isMidpoint = b === 4;

          data.push({
            index: globalIndex++,
            rx: rxVal,
            tx: txVal,
            byteInfo: `Bit ${b}: ${bitVal} (${hex} '${char}')`,
            timestamp: timeStr,
            // Only add annotation at midpoint
            ...(isMidpoint && {
              byteAnnotation: `${hex} '${char}'`,
              byteChannel: isRx ? "RX" : "TX",
            }),
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

  // Extract byte annotations with boundary information
  const byteAnnotations = useMemo<ByteAnnotationData[]>(() => {
    const annotations: ByteAnnotationData[] = [];
    const sortedLogs = [...logs].sort((a, b) => a.timestamp - b.timestamp);

    let globalIndex = 1; // Start after initial IDLE

    sortedLogs.forEach((log) => {
      const bytes = getBytes(log.data);
      const isRx = log.direction === "RX";

      bytes.forEach((byte) => {
        const char =
          byte >= 32 && byte <= 126 ? String.fromCharCode(byte) : ".";
        const hex = byte.toString(16).toUpperCase().padStart(2, "0");

        // Each byte: START(1) + DATA(8) + STOP(1) = 10 indices
        const startIndex = globalIndex;
        const endIndex = globalIndex + 10;
        const midIndex = globalIndex + 5; // bit 4 position

        annotations.push({
          index: midIndex,
          startIndex,
          endIndex,
          label: `${hex} '${char}'`,
          channel: isRx ? "RX" : "TX",
        });

        globalIndex += 10; // Move past this byte
      });

      globalIndex += 4; // IDLE gap between packets
    });

    return annotations;
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

  const isAutoScrollRef = useRef(isAutoScroll);
  useEffect(() => {
    isAutoScrollRef.current = isAutoScroll;
  }, [isAutoScroll]);

  // Initialize domain or handle data updates (Windowing)
  useEffect(() => {
    if (chartData.length === 0) {
      setDomain(null);
      return;
    }

    // If initializing, default to the end (Live View)
    if (!domainRef.current) {
      const INITIAL_WINDOW = 100; // Even smaller initial window for better detail
      const newMax = chartData.length - 1;
      const newMin = Math.max(0, newMax - INITIAL_WINDOW);
      setDomain({ min: newMin, max: newMax });
      setIsAutoScroll(true);
      return;
    }

    // If we are in auto-scroll mode, maintain the window size but shift to the new end
    if (isAutoScrollRef.current) {
      setDomain((prev) => {
        if (!prev) return null;
        const windowSize = prev.max - prev.min;
        const newMax = chartData.length - 1;
        const newMin = Math.max(0, newMax - windowSize);
        return { min: newMin, max: newMax };
      });
    }
  }, [chartData.length]); // Intentionally only react to new data

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
        // Use deltaX for horizontal scrolling (primary for trackpad horizontal swipe)
        // Only use deltaY if there's no deltaX (for mouse wheel vertical scroll)
        const pixelDelta =
          Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY;
        const indicesPerPixel = range / chartWidth;
        const shift = pixelDelta * indicesPerPixel * 0.5; // Reduce sensitivity

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

  interface BrushEvent {
    startIndex?: number;
    endIndex?: number;
  }

  // Brush handler
  const handleBrushChange = (e: BrushEvent) => {
    if (e && e.startIndex !== undefined && e.endIndex !== undefined) {
      // Using updateDomain ensures autoScroll state is managed correctly
      updateDomain(e.startIndex, e.endIndex);
    }
  };

  interface TooltipProps {
    active?: boolean;
    payload?: Array<{
      dataKey: string;
      value: number;
      payload: {
        byteInfo?: string;
        timestamp?: string;
      };
    }>;
    label?: number;
  }

  // Custom Tooltip
  const CustomTooltip = ({ active, payload, label }: TooltipProps) => {
    if (active && payload && payload.length) {
      const rxVal = payload.find((p) => p.dataKey === "rx");
      const txVal = payload.find((p) => p.dataKey === "tx");
      const info = payload[0]?.payload.byteInfo;
      const time = payload[0]?.payload.timestamp;

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
        <div className="bg-bg-elevated border border-border-default p-2 rounded shadow-lg text-xs font-mono z-50 text-text-primary">
          {time && <p className="font-bold text-text-muted mb-1">{time}</p>}
          <p className="font-bold mb-1 opacity-70">
            Sequence: {Math.round(label)}
          </p>

          {rxVal && (
            <div
              className={
                rxVal.value === RX_IDLE
                  ? "text-text-muted opacity-50"
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
                  ? "text-text-muted opacity-50"
                  : "text-blue-500"
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
      <div className="flex flex-col items-center justify-center h-full bg-bg-surface rounded-lg border border-border-default text-text-muted">
        <Activity className="w-12 h-12 mb-2 opacity-20" />
        <p className="text-xs">No Data to Analyze</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-bg-surface rounded-lg border border-border-default overflow-hidden relative group">
      {/* Header / Legend / Controls */}
      <div className="absolute top-2 left-4 z-20 flex items-start justify-between w-[calc(100%-2rem)] pointer-events-none">
        <div className="text-[10px] text-text-muted font-mono bg-bg-surface/80 backdrop-blur px-2 py-1 rounded border border-border-default/30">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 bg-blue-500 rounded-full inline-block"></span>{" "}
            TX (Upper)
          </div>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="w-2 h-2 bg-emerald-500 rounded-full inline-block"></span>{" "}
            RX (Lower)
          </div>
        </div>

        <div className="flex items-center gap-1 bg-zinc-100/90 dark:bg-zinc-800/90 backdrop-blur p-1 rounded border border-zinc-300 dark:border-zinc-600 pointer-events-auto shadow-md opacity-0 group-hover:opacity-100 transition-opacity duration-200">
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
          <div className="flex items-center gap-1 px-1 text-[9px] text-text-muted">
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
              stroke={RX_COLOR}
              strokeWidth={2}
              dot={false}
              isAnimationActive={false}
            />

            {/* TX Line (Blue) */}
            <Line
              type="stepAfter"
              dataKey="tx"
              stroke={TX_COLOR}
              strokeWidth={2}
              dot={false}
              isAnimationActive={false}
            />

            {/* Byte Annotations Layer - rendered using Customized for stability */}
            <Customized
              component={(props: Record<string, unknown>) => (
                <ByteAnnotations
                  xAxisMap={props.xAxisMap as ByteAnnotationsProps["xAxisMap"]}
                  yAxisMap={props.yAxisMap as ByteAnnotationsProps["yAxisMap"]}
                  annotations={byteAnnotations}
                  domain={domain}
                />
              )}
            />

            {/* The Windowing Brush */}
            <Brush
              dataKey="index"
              height={30}
              stroke="#3b82f6"
              fill="transparent"
              tickFormatter={() => ""}
              startIndex={domain?.min}
              endIndex={domain?.max}
              onChange={handleBrushChange}
              alwaysShowText={false}
              className="text-[9px] [&_.recharts-brush-slide]:fill-zinc-200/50 dark:[&_.recharts-brush-slide]:fill-zinc-700/50 [&_.recharts-brush-traveller]:fill-zinc-400 dark:[&_.recharts-brush-traveller]:fill-zinc-500"
            >
              <LineChart data={chartData}>
                <Line
                  type="stepAfter"
                  dataKey="rx"
                  stroke={RX_COLOR}
                  dot={false}
                  strokeWidth={1}
                />
                <Line
                  type="stepAfter"
                  dataKey="tx"
                  stroke={TX_COLOR}
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
