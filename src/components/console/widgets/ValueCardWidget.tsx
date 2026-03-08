import React, { useEffect, useRef } from "react";
import { Zap, AlertCircle } from "lucide-react";
import { cn } from "../../../lib/utils";
import { TelemetryVariable, WidgetConfig } from "@/types";
import { useEChart } from "../../../hooks/useEChart";
import { echarts } from "../../../lib/charts/echartsSetup";
import { CHART_COLORS } from "../../../lib/charts/constants";

interface Props {
  variable: TelemetryVariable;
  config: WidgetConfig;
  processedData: Record<string, unknown>[];
  isMaximized: boolean;
  syncId: string;
}

/** Minimal sparkline chart — separate component for proper hook lifecycle */
const SparklineChart: React.FC<{
  data: Record<string, unknown>[];
  syncId: string;
}> = ({ data, syncId }) => {
  const { containerRef, chartRef, setOption } = useEChart();
  const groupRef = useRef(false);

  useEffect(() => {
    const chart = chartRef.current;
    if (!chart) return;
    chart.group = syncId;
    if (!groupRef.current) {
      echarts.connect(syncId);
      groupRef.current = true;
    }
  }, [syncId, chartRef]);

  useEffect(() => {
    if (data.length <= 1) return;
    setOption(
      {
        grid: { top: 0, right: 0, bottom: 0, left: 0 },
        xAxis: { type: "time", show: false },
        yAxis: { type: "value", show: false },
        tooltip: {
          trigger: "axis",
          formatter: () => "",
          axisPointer: {
            type: "line",
            lineStyle: { width: 1, opacity: 0.5 },
          },
        },
        series: [
          {
            type: "line",
            data: data
              .filter((d) => d.val != null)
              .map((d) => [d.time as number, d.val as number]),
            color: CHART_COLORS[0],
            areaStyle: { opacity: 0.3 },
            lineStyle: { width: 2 },
            showSymbol: false,
            animation: false,
            smooth: true,
          },
        ],
      },
      { notMerge: true },
    );
  }, [data, setOption]);

  return <div ref={containerRef} className="w-full h-full" />;
};

const ValueCardWidget: React.FC<Props> = ({
  variable,
  config,
  processedData,
  isMaximized,
  syncId,
}) => {
  const isBool = variable.type === "boolean";
  const isObj = variable.type === "object";
  const isNum = variable.type === "number";

  return (
    <div className="flex flex-col h-full relative">
      <div className="mt-1 mb-2 relative z-10 pointer-events-none flex-1 flex flex-col justify-center">
        {isBool ? (
          <div
            className={cn(
              "font-bold flex items-center gap-2 justify-center",
              isMaximized ? "text-6xl" : "text-lg",
              variable.value
                ? "text-emerald-600 dark:text-emerald-400"
                : "text-muted-foreground",
            )}
          >
            <Zap
              className={cn(
                isMaximized ? "w-12 h-12" : "w-5 h-5",
                variable.value && "fill-current",
              )}
            />
            {variable.value ? "ON" : "OFF"}
          </div>
        ) : (
          <div
            className={cn(
              "font-mono font-bold tracking-tight text-foreground truncate flex items-baseline justify-center gap-2",
              isMaximized ? "text-8xl" : "text-2xl",
            )}
            title={String(variable.value)}
          >
            {isObj ? (
              <pre className="text-[10px] bg-muted/50 p-1 rounded overflow-hidden max-h-15 pointer-events-auto">
                {JSON.stringify(variable.value, null, 1).replace(/\s+/g, " ")}
              </pre>
            ) : (
              variable.value
            )}
            {config.unit && (
              <span
                className={cn(
                  "font-normal text-muted-foreground ml-1",
                  isMaximized ? "text-2xl" : "text-sm",
                )}
              >
                {config.unit}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Mini Chart for Numbers */}
      {(isNum || isBool) && processedData.length > 1 && (
        <div className="h-1/3 w-full mt-auto opacity-60 hover:opacity-100 transition-opacity">
          <SparklineChart data={processedData} syncId={syncId} />
        </div>
      )}

      {/* Background Icon Decoration */}
      {!isNum && !isMaximized && (
        <div className="absolute -bottom-2 -right-2 opacity-[0.03] text-foreground pointer-events-none">
          {isBool ? (
            <Zap className="w-24 h-24" />
          ) : (
            <AlertCircle className="w-24 h-24" />
          )}
        </div>
      )}
    </div>
  );
};

export default ValueCardWidget;
