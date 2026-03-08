/**
 * ECharts theme bridge — reads CSS custom properties and returns ECharts theme options.
 * Since ECharts cannot dynamically switch themes on an existing instance,
 * we apply theme colors via setOption instead of registerTheme.
 */
import type { EChartsOption } from "echarts";

function getCSSVar(name: string): string {
  return getComputedStyle(document.documentElement)
    .getPropertyValue(name)
    .trim();
}

/** Build ECharts-compatible theme options from current CSS variables */
export function getChartThemeOptions(): Partial<EChartsOption> {
  const textSecondary = getCSSVar("--text-secondary") || "#a1a1aa";
  const textMuted = getCSSVar("--text-muted") || "#71717a";
  const borderDefault = getCSSVar("--border-default") || "#3f3f46";
  const borderMuted = getCSSVar("--border-muted") || "#27272a";

  return {
    backgroundColor: "transparent",
    textStyle: { color: textSecondary },
    grid: {
      borderColor: borderDefault,
    },
    xAxis: {
      axisLine: { lineStyle: { color: borderDefault } },
      splitLine: { lineStyle: { color: borderMuted } },
      axisLabel: { color: textMuted },
    },
    yAxis: {
      axisLine: { lineStyle: { color: borderDefault } },
      splitLine: { lineStyle: { color: borderMuted } },
      axisLabel: { color: textMuted },
    },
  };
}

/** Apply current CSS-variable theme to an existing chart instance */
export function applyTheme(
  chart: { setOption: (opt: Partial<EChartsOption>) => void } | null,
): void {
  if (!chart) return;
  chart.setOption(getChartThemeOptions());
}

/**
 * Observe dark/light mode class changes on <html> and invoke callback.
 * Returns a cleanup function.
 */
export function observeThemeChanges(onChange: () => void): () => void {
  const observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      if (
        mutation.type === "attributes" &&
        mutation.attributeName === "class"
      ) {
        onChange();
      }
    }
  });

  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["class"],
  });

  return () => observer.disconnect();
}
