import React, { useState, useRef, useEffect } from "react";
import { Activity, ZoomIn, ZoomOut, ArrowRightToLine } from "lucide-react";
import { getBytes, cn } from "../../lib/utils";
import { Button } from "../ui";
import { useStore } from "../../lib/store";
import { useEChart } from "../../hooks/useEChart";
import {
  TX_COLOR,
  RX_COLOR,
  DEFAULT_TARGET_FPS,
} from "../../lib/charts/constants";
import type { EChartsOption } from "../../lib/charts/echartsSetup";
import type {
  CustomSeriesRenderItemAPI,
  CustomSeriesRenderItemParams,
} from "echarts";
import type { LogEntry } from "@/types";

// Logic Level Definitions
const RX_LOW = 0;
const RX_IDLE = 0.5;
const RX_HIGH = 1;
const TX_LOW = 2;
const TX_IDLE = 2.5;
const TX_HIGH = 3;

/** Max logs processed per rAF tick — prevents long frames during initial catch-up */
const CHUNK_SIZE = 50;

// Waveform state that supports incremental appends (mutated in place)
interface WaveformState {
  rxData: [number, number][];
  txData: [number, number][];
  /** Pre-computed ECharts data: [startIdx, endIdx, midIdx, channelFlag, label] */
  annotationEChartsData: (number | string)[][];
  totalPoints: number;
  /** Current waveform index counter for incremental appends */
  idx: number;
}

function createEmptyWaveform(): WaveformState {
  return {
    rxData: [],
    txData: [],
    annotationEChartsData: [],
    totalPoints: 0,
    idx: 0,
  };
}

/** Incrementally append new logs to existing waveform data (in-place mutation).
 *  O(new_bytes) per call — no sort needed since logs arrive in chronological order. */
function appendWaveformData(
  waveform: WaveformState,
  newLogs: LogEntry[],
): void {
  const { rxData, txData, annotationEChartsData } = waveform;
  let { idx } = waveform;

  // Add initial IDLE if this is the first data
  if (idx === 0) {
    rxData.push([idx, RX_IDLE]);
    txData.push([idx, TX_IDLE]);
    idx++;
  }

  for (const log of newLogs) {
    const bytes = getBytes(log.data);
    const isRx = log.direction === "RX";

    for (const byte of bytes) {
      const char = byte >= 32 && byte <= 126 ? String.fromCharCode(byte) : ".";
      const hex = byte.toString(16).toUpperCase().padStart(2, "0");
      const startIdx = idx;

      // START bit (Logic 0)
      rxData.push([idx, isRx ? RX_LOW : RX_IDLE]);
      txData.push([idx, !isRx ? TX_LOW : TX_IDLE]);
      idx++;

      // DATA bits (LSB first)
      for (let b = 0; b < 8; b++) {
        const bitVal = (byte >> b) & 1;
        rxData.push([idx, isRx ? (bitVal ? RX_HIGH : RX_LOW) : RX_IDLE]);
        txData.push([idx, !isRx ? (bitVal ? TX_HIGH : TX_LOW) : TX_IDLE]);
        idx++;
      }

      // STOP bit (Logic 1)
      rxData.push([idx, isRx ? RX_HIGH : RX_IDLE]);
      txData.push([idx, !isRx ? TX_HIGH : TX_IDLE]);
      idx++;

      // Pre-compute ECharts annotation data during waveform building
      annotationEChartsData.push([
        startIdx,
        idx,
        startIdx + 5,
        isRx ? 0 : 1,
        `${hex} '${char}'`,
      ]);
    }

    // IDLE gap between packets
    for (let i = 0; i < 4; i++) {
      rxData.push([idx, RX_IDLE]);
      txData.push([idx, TX_IDLE]);
      idx++;
    }
  }

  waveform.idx = idx;
  waveform.totalPoints = idx;
}

function buildBaseOption(): EChartsOption {
  return {
    backgroundColor: "transparent",
    animation: false,
    grid: { top: 40, right: 10, bottom: 60, left: 35 },
    xAxis: {
      type: "value",
      min: 0,
      axisLabel: { show: false },
      splitLine: { show: false },
    },
    yAxis: {
      type: "value",
      min: -0.2,
      max: 3.5,
      axisLabel: {
        fontSize: 10,
        formatter: (val: number) => {
          if (val === RX_IDLE || val === TX_IDLE) return "\u2205";
          if (val === RX_HIGH || val === TX_HIGH) return "H";
          if (val === RX_LOW || val === TX_LOW) return "L";
          return "";
        },
        interval: 0,
      },
      axisTick: { show: false },
      splitLine: { show: false },
    },
    tooltip: {
      trigger: "axis",
      axisPointer: { type: "line" },
      backgroundColor: "rgba(24,24,27,0.95)",
      borderColor: "#3f3f46",
      textStyle: { color: "#e4e4e7", fontSize: 11 },
      formatter: (params: unknown) => {
        const items = params as Array<{
          seriesName: string;
          value: [number, number];
          color: string;
        }>;
        if (!Array.isArray(items) || items.length === 0) return "";
        const idx = items[0].value[0];
        let html = `<div style="font-family:monospace;font-size:10px">`;
        html += `<div style="margin-bottom:4px;opacity:0.6">Index: ${Math.round(idx)}</div>`;
        for (const item of items) {
          if (item.seriesName === "annotations") continue;
          const val = item.value[1];
          const name = item.seriesName;
          let label = "IDLE";
          if (name === "RX") {
            if (val === RX_HIGH) label = "1 (High)";
            else if (val === RX_LOW) label = "0 (Low)";
          } else if (name === "TX") {
            if (val === TX_HIGH) label = "1 (High)";
            else if (val === TX_LOW) label = "0 (Low)";
          }
          html += `<div style="color:${item.color}">${name}: ${label}</div>`;
        }
        html += `</div>`;
        return html;
      },
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
      },
    ],
    series: [],
  };
}

/** ECharts custom renderItem for byte annotation brackets */
function renderAnnotation(
  params: CustomSeriesRenderItemParams,
  api: CustomSeriesRenderItemAPI,
) {
  // data: [startIndex, endIndex, midIndex, channelFlag, label]
  const startIdx = api.value(0) as number;
  const endIdx = api.value(1) as number;
  const midIdx = api.value(2) as number;
  const channelFlag = api.value(3) as number; // 0=RX, 1=TX
  const label = api.value(4) as string;

  const isRx = channelFlag === 0;
  const color = isRx ? RX_COLOR : TX_COLOR;
  const yLevel = isRx ? RX_HIGH : TX_HIGH;

  const startPx = api.coord([startIdx, yLevel]);
  const endPx = api.coord([endIdx, yLevel]);
  const midPx = api.coord([midIdx, yLevel]);

  if (!startPx || !endPx || !midPx) return;
  // Guard against NaN propagating into canvas rendering (PR #33 regression)
  if (
    !Number.isFinite(startPx[0]) ||
    !Number.isFinite(startPx[1]) ||
    !Number.isFinite(endPx[0]) ||
    !Number.isFinite(endPx[1]) ||
    !Number.isFinite(midPx[0]) ||
    !Number.isFinite(midPx[1])
  ) {
    return;
  }

  // Check visible range — hide when too zoomed out
  const coordSys = params.coordSys as { width?: number };
  const chartWidth = coordSys?.width ?? 800;
  const pixelSpan = Math.abs(endPx[0] - startPx[0]);
  if (pixelSpan < 20) return; // Too small to render

  const bracketY = startPx[1] - 18;
  const labelY = bracketY - 8;
  const textWidth = Math.min(pixelSpan, chartWidth * 0.3);

  return {
    type: "group" as const,
    children: [
      // Left vertical
      {
        type: "line" as const,
        shape: {
          x1: startPx[0],
          y1: bracketY + 8,
          x2: startPx[0],
          y2: bracketY + 16,
        },
        style: { stroke: color, lineWidth: 1, opacity: 0.6 },
      },
      // Right vertical
      {
        type: "line" as const,
        shape: {
          x1: endPx[0],
          y1: bracketY + 8,
          x2: endPx[0],
          y2: bracketY + 16,
        },
        style: { stroke: color, lineWidth: 1, opacity: 0.6 },
      },
      // Horizontal span
      {
        type: "line" as const,
        shape: {
          x1: startPx[0],
          y1: bracketY + 12,
          x2: endPx[0],
          y2: bracketY + 12,
        },
        style: { stroke: color, lineWidth: 1.5, opacity: 0.4 },
      },
      // Background pill
      {
        type: "rect" as const,
        shape: {
          x: midPx[0] - textWidth / 2,
          y: labelY - 3,
          width: textWidth,
          height: 14,
          r: 3,
        },
        style: {
          fill: isRx ? "rgba(16,185,129,0.15)" : "rgba(59,130,246,0.15)",
        },
      },
      // Label text
      {
        type: "text" as const,
        x: midPx[0],
        y: labelY + 5,
        style: {
          text: label,
          textAlign: "center" as const,
          fill: color,
          fontSize: 9,
          fontFamily: "monospace",
          fontWeight: 600,
        },
      },
    ],
  };
}

const LogicAnalyzerPanel: React.FC = () => {
  // Lightweight selectors — hasLogs only transitions false→true (once), no per-log re-renders
  const activeSessionId = useStore((s) => s.activeSessionId);
  const hasLogs = useStore(
    (s) => (s.sessions[s.activeSessionId]?.logs?.length ?? 0) > 0,
  );

  const [isAutoScroll, setIsAutoScroll] = useState(true);
  // Ref mirror so rAF loop reads current value without being a dependency
  const isAutoScrollRef = useRef(true);
  useEffect(() => {
    isAutoScrollRef.current = isAutoScroll;
  }, [isAutoScroll]);

  // Queue-based log tracking — immune to buffer rollover (push+splice keeps length constant)
  const pendingLogsRef = useRef<LogEntry[]>([]);
  const lastSeenIdRef = useRef<string | number | null>(null);
  const clearSignalRef = useRef(false);
  const waveformRef = useRef<WaveformState>(createEmptyWaveform());

  // ECharts lifecycle
  const { containerRef, chartRef, setOption } = useEChart(buildBaseOption());

  // Track user zoom to disable auto-scroll
  const userInteractedRef = useRef(false);
  const programmaticZoomRef = useRef(false);
  useEffect(() => {
    const chart = chartRef.current;
    if (!chart) return;
    const handler = () => {
      if (programmaticZoomRef.current) return;
      userInteractedRef.current = true;
      setIsAutoScroll(false);
    };
    chart.on("dataZoom", handler);
    return () => {
      chart.off("dataZoom", handler);
    };
  }, [chartRef]);

  // Reset waveform state on session change + subscribe to log updates
  useEffect(() => {
    waveformRef.current = createEmptyWaveform();
    pendingLogsRef.current = [];
    lastSeenIdRef.current = null;
    clearSignalRef.current = false;

    // Seed waveform from current logs
    const state = useStore.getState();
    const logs = state.sessions[activeSessionId]?.logs ?? [];
    if (logs.length > 0) {
      appendWaveformData(waveformRef.current, logs);
      lastSeenIdRef.current = logs[logs.length - 1].id;
    }

    // Subscription detects new logs by ID and queues them (unaffected by buffer trim)
    const unsub = useStore.subscribe((s) => {
      const currentLogs = s.sessions[s.activeSessionId]?.logs ?? [];
      if (currentLogs.length === 0) {
        if (lastSeenIdRef.current !== null) {
          clearSignalRef.current = true;
          lastSeenIdRef.current = null;
        }
        return;
      }
      const lastId = currentLogs[currentLogs.length - 1].id;
      if (lastId === lastSeenIdRef.current) return;

      if (lastSeenIdRef.current === null) {
        pendingLogsRef.current.push(...currentLogs);
      } else {
        // Scan backwards — last seen is typically 1-5 positions from end
        let foundIdx = -1;
        for (
          let i = currentLogs.length - 2;
          i >= Math.max(0, currentLogs.length - 50);
          i--
        ) {
          if (currentLogs[i].id === lastSeenIdRef.current) {
            foundIdx = i;
            break;
          }
        }
        if (foundIdx >= 0) {
          for (let j = foundIdx + 1; j < currentLogs.length; j++) {
            pendingLogsRef.current.push(currentLogs[j]);
          }
        } else {
          // Last seen was trimmed out of buffer — just add the latest entry
          pendingLogsRef.current.push(currentLogs[currentLogs.length - 1]);
        }
      }
      lastSeenIdRef.current = lastId;
    });
    return unsub;
  }, [activeSessionId]);

  // rAF loop: incrementally process logs → waveform → chart at target FPS
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

      let needsUpdate = false;

      // Handle session clear
      if (clearSignalRef.current) {
        clearSignalRef.current = false;
        waveformRef.current = createEmptyWaveform();
        needsUpdate = true;
      }

      // Consume pending logs in chunks to prevent long frames
      const pending = pendingLogsRef.current;
      if (pending.length > 0) {
        const batch = pending.splice(0, CHUNK_SIZE);
        appendWaveformData(waveformRef.current, batch);
        needsUpdate = true;
      }

      if (!needsUpdate) return;

      const { rxData, txData, annotationEChartsData, totalPoints } =
        waveformRef.current;

      if (totalPoints === 0) return;

      setOption({
        xAxis: { max: totalPoints - 1 },
        series: [
          {
            name: "RX",
            type: "line",
            step: "end",
            showSymbol: false,
            animation: false,
            sampling: "lttb",
            lineStyle: { width: 2, color: RX_COLOR },
            itemStyle: { color: RX_COLOR },
            data: rxData,
            markLine: {
              silent: true,
              symbol: "none",
              lineStyle: { type: "dashed", opacity: 0.3, color: "#71717a" },
              data: [{ yAxis: RX_IDLE }, { yAxis: TX_IDLE }],
              label: { show: false },
            },
          },
          {
            name: "TX",
            type: "line",
            step: "end",
            showSymbol: false,
            animation: false,
            sampling: "lttb",
            lineStyle: { width: 2, color: TX_COLOR },
            itemStyle: { color: TX_COLOR },
            data: txData,
          },
          {
            name: "annotations",
            type: "custom",
            renderItem: renderAnnotation,
            dimensions: [
              { name: "start", type: "float" },
              { name: "end", type: "float" },
              { name: "mid", type: "float" },
              { name: "channel", type: "float" },
              { name: "label", type: "ordinal" },
            ],
            encode: { x: [0, 1] },
            data: annotationEChartsData,
            z: 10,
            silent: true,
          },
        ],
      });

      // Auto-scroll to latest data
      if (
        isAutoScrollRef.current &&
        !userInteractedRef.current &&
        totalPoints > 0
      ) {
        const windowSize = Math.min(100, totalPoints);
        programmaticZoomRef.current = true;
        chart.dispatchAction({
          type: "dataZoom",
          startValue: Math.max(0, totalPoints - windowSize),
          endValue: totalPoints - 1,
        });
        programmaticZoomRef.current = false;
      }
      userInteractedRef.current = false;
    };

    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [chartRef, setOption]);

  const handleJumpToLive = () => {
    setIsAutoScroll(true);
    userInteractedRef.current = false;
  };

  const handleZoom = (dir: "in" | "out") => {
    const chart = chartRef.current;
    if (!chart) return;
    const option = chart.getOption() as {
      dataZoom?: Array<{ startValue?: number; endValue?: number }>;
    };
    const dz = option.dataZoom?.[0];
    if (!dz || dz.startValue === undefined || dz.endValue === undefined) return;

    const range = dz.endValue - dz.startValue;
    const factor = 0.2;
    const delta = range * factor * (dir === "in" ? 1 : -1);

    chart.dispatchAction({
      type: "dataZoom",
      startValue: Math.max(0, dz.startValue + delta / 2),
      endValue: dz.endValue - delta / 2,
    });
    setIsAutoScroll(false);
  };

  return (
    <div className="flex flex-col h-full bg-bg-surface rounded-lg border border-border-default overflow-hidden relative group">
      {/* Header / Legend / Controls — visible only when data present */}
      {hasLogs && (
        <div className="absolute top-2 left-4 z-20 flex items-start justify-between w-[calc(100%-2rem)] pointer-events-none">
          <div className="text-[10px] text-text-muted font-mono bg-bg-surface/80 backdrop-blur px-2 py-1 rounded border border-border-default/30">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 bg-blue-500 rounded-full inline-block" />{" "}
              TX (Upper)
            </div>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="w-2 h-2 bg-emerald-500 rounded-full inline-block" />{" "}
              RX (Lower)
            </div>
          </div>

          <div className="flex items-center gap-1 bg-zinc-100/90 dark:bg-zinc-800/90 backdrop-blur p-1 rounded border border-zinc-300 dark:border-zinc-600 pointer-events-auto shadow-md opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={() => handleZoom("in")}
              title="Zoom In"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={() => handleZoom("out")}
              title="Zoom Out"
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
              onClick={handleJumpToLive}
              title="Jump to Live Data"
            >
              <ArrowRightToLine className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>
      )}

      {/* Chart container — always mounted so useEChart initializes on first render */}
      <div ref={containerRef} className="flex-1 w-full" />

      {/* Empty state overlay */}
      {!hasLogs && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-bg-surface text-text-muted z-10">
          <Activity className="w-12 h-12 mb-2 opacity-20" />
          <p className="text-xs">No Data to Analyze</p>
        </div>
      )}
    </div>
  );
};

export default LogicAnalyzerPanel;
