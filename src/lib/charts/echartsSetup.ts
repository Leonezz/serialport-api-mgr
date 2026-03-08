/**
 * Tree-shaken ECharts setup — register only the components we need.
 * Import `echarts` from this module instead of from "echarts" directly.
 */
import * as echarts from "echarts/core";
import { LineChart, CustomChart } from "echarts/charts";
import {
  GridComponent,
  TooltipComponent,
  DataZoomComponent,
  DataZoomInsideComponent,
  DataZoomSliderComponent,
  LegendComponent,
  MarkLineComponent,
  MarkAreaComponent,
  GraphicComponent,
} from "echarts/components";
import { CanvasRenderer } from "echarts/renderers";

echarts.use([
  LineChart,
  CustomChart,
  GridComponent,
  TooltipComponent,
  DataZoomComponent,
  DataZoomInsideComponent,
  DataZoomSliderComponent,
  LegendComponent,
  MarkLineComponent,
  MarkAreaComponent,
  GraphicComponent,
  CanvasRenderer,
]);

export { echarts };
export type { ECharts } from "echarts/core";
export type { EChartsOption } from "echarts";
