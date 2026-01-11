import React from "react";
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

interface Props {
  data: any[];
  dataKeys: string[];
  syncId: string;
  brushIndices: { startIndex?: number; endIndex?: number };
  onBrushChange: (e: any) => void;
  isMaximized: boolean;
}

const LineChartWidget: React.FC<Props> = ({
  data,
  dataKeys,
  syncId,
  brushIndices,
  onBrushChange,
  isMaximized,
}) => {
  if (data.length < 2)
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground text-xs opacity-50">
        Waiting for more data...
      </div>
    );

  return (
    <div className="w-full h-full text-xs">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={data}
          syncId={syncId}
          margin={{ top: 5, right: 10, left: -10, bottom: 0 }}
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
            hide={!isMaximized}
            height={isMaximized ? 30 : 0}
            tick={{ fontSize: 10 }}
          />
          <YAxis width={40} tick={{ fontSize: 10 }} domain={["auto", "auto"]} />
          <Tooltip
            labelFormatter={(t) => new Date(t).toLocaleTimeString()}
            contentStyle={{
              borderRadius: "0.5rem",
              border: "1px solid hsl(var(--border))",
              fontSize: "12px",
              backgroundColor: "hsl(var(--popover))",
              color: "hsl(var(--popover-foreground))",
            }}
            cursor={{
              stroke: "hsl(var(--primary))",
              strokeWidth: 1,
              strokeDasharray: "4 4",
            }}
          />
          {dataKeys.map((key, i) => (
            <Line
              key={key}
              type="monotone"
              dataKey={key}
              stroke={`hsl(var(--primary) / ${1 - i * 0.2})`}
              strokeWidth={isMaximized ? 3 : 2}
              dot={false}
              isAnimationActive={false}
              connectNulls={false}
            />
          ))}
          <Brush
            dataKey="time"
            height={isMaximized ? 40 : 20}
            stroke="hsl(var(--border))"
            fill="hsl(var(--muted)/0.3)"
            tickFormatter={() => ""}
            travellerWidth={10}
            startIndex={brushIndices.startIndex}
            endIndex={brushIndices.endIndex}
            onChange={onBrushChange}
          />
          {dataKeys.length > 1 && (
            <Legend
              iconType="plainline"
              iconSize={10}
              wrapperStyle={{ fontSize: "10px", paddingTop: "5px" }}
            />
          )}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default LineChartWidget;
