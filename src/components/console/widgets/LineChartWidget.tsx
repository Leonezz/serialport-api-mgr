import React, { useEffect, useRef } from "react";
import { useEChart } from "../../../hooks/useEChart";
import { echarts } from "../../../lib/charts/echartsSetup";
import type { EChartsOption } from "../../../lib/charts/echartsSetup";
import { CHART_COLORS } from "../../../lib/charts/constants";

interface Props {
  data: Record<string, unknown>[];
  dataKeys: string[];
  syncId: string;
  isMaximized: boolean;
}

const LineChartWidget: React.FC<Props> = ({
  data,
  dataKeys,
  syncId,
  isMaximized,
}) => {
  const { containerRef, chartRef, setOption } = useEChart();
  const groupRef = useRef(false);

  // Register chart in tooltip sync group
  useEffect(() => {
    const chart = chartRef.current;
    if (!chart) return;
    chart.group = syncId;
    if (!groupRef.current) {
      echarts.connect(syncId);
      groupRef.current = true;
    }
  }, [syncId, chartRef]);

  // Update chart option when data/keys change
  useEffect(() => {
    if (data.length < 2) return;

    const option: EChartsOption = {
      grid: {
        top: 10,
        right: 10,
        bottom: isMaximized ? 60 : 40,
        left: 45,
      },
      xAxis: {
        type: "time",
        show: isMaximized,
        axisLabel: { fontSize: 10 },
      },
      yAxis: {
        type: "value",
        axisLabel: { fontSize: 10 },
        splitLine: { lineStyle: { opacity: 0.1 } },
      },
      tooltip: {
        trigger: "axis",
        axisPointer: { type: "cross", label: { fontSize: 10 } },
        textStyle: { fontSize: 12 },
      },
      dataZoom: [
        { type: "inside", xAxisIndex: 0 },
        {
          type: "slider",
          xAxisIndex: 0,
          height: isMaximized ? 30 : 15,
          bottom: 0,
        },
      ],
      legend:
        dataKeys.length > 1
          ? {
              show: true,
              bottom: isMaximized ? 35 : 20,
              textStyle: { fontSize: 10 },
            }
          : undefined,
      series: dataKeys.map((key, i) => ({
        type: "line" as const,
        name: key,
        data: data
          .filter((d) => d[key] != null)
          .map((d) => [d.time as number, d[key] as number]),
        color: CHART_COLORS[i % CHART_COLORS.length],
        lineStyle: { width: isMaximized ? 3 : 2 },
        showSymbol: false,
        animation: false,
        sampling: "lttb" as const,
        connectNulls: false,
      })),
    };

    setOption(option, { notMerge: true });
  }, [data, dataKeys, isMaximized, setOption]);

  if (data.length < 2) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground text-xs opacity-50">
        Waiting for more data...
      </div>
    );
  }

  return (
    <div className="w-full h-full text-xs">
      <div ref={containerRef} className="w-full h-full" />
    </div>
  );
};

export default LineChartWidget;
