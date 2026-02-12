import { useRef, useEffect, useCallback } from "react";
import { echarts } from "../lib/charts/echartsSetup";
import type { ECharts, EChartsOption } from "../lib/charts/echartsSetup";
import { applyTheme, observeThemeChanges } from "../lib/charts/chartTheme";

interface UseEChartOptions {
  /** Whether to observe theme changes and re-apply. Default true. */
  theme?: boolean;
}

/**
 * Reusable hook for ECharts lifecycle management.
 * Creates a chart instance, handles resize via ResizeObserver,
 * listens for dark/light mode changes, and disposes on unmount.
 */
export function useEChart(
  initialOption?: EChartsOption,
  options?: UseEChartOptions,
) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<ECharts | null>(null);
  const { theme = true } = options ?? {};

  useEffect(() => {
    if (!containerRef.current) return;

    const chart = echarts.init(containerRef.current, undefined, {
      renderer: "canvas",
    });

    if (initialOption) {
      chart.setOption(initialOption);
    }
    applyTheme(chart);
    chartRef.current = chart;

    // ResizeObserver for responsive sizing
    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        if (width > 0 && height > 0) {
          chart.resize({ width, height, animation: { duration: 0 } });
        }
      }
    });
    ro.observe(containerRef.current);

    // Theme observer
    let cleanupTheme: (() => void) | undefined;
    if (theme) {
      cleanupTheme = observeThemeChanges(() => applyTheme(chart));
    }

    return () => {
      cleanupTheme?.();
      ro.disconnect();
      chart.dispose();
      chartRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Init once

  /** Imperative setOption — bypasses React rendering */
  const setOption = useCallback(
    (
      opt: EChartsOption,
      opts?: { notMerge?: boolean; lazyUpdate?: boolean },
    ) => {
      chartRef.current?.setOption(opt, {
        notMerge: opts?.notMerge ?? false,
        lazyUpdate: opts?.lazyUpdate ?? true,
      });
    },
    [],
  );

  return { containerRef, chartRef, setOption };
}
