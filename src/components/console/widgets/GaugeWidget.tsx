import React from "react";
import { cn } from "../../../lib/utils";

interface Props {
  value: number;
  min?: number;
  max?: number;
  unit?: string;
  isMaximized: boolean;
}

const GaugeWidget: React.FC<Props> = ({
  value,
  min = 0,
  max = 100,
  unit,
  isMaximized,
}) => {
  const val = Number(value);
  const safeMin = min ?? 0;
  const safeMax = max ?? 100;
  const range = safeMax - safeMin;

  // Calculate percentage for needle
  const percent = Math.min(1, Math.max(0, (val - safeMin) / range));

  // Needle Angle: -180 (min) to 0 (max)
  const angle = 180 - percent * 180;
  const cx = 100; // SVG center
  const cy = 100; // SVG bottom center
  const r = 80; // Needle length

  // Convert angle to coords
  const rad = (angle * Math.PI) / 180;
  const x = cx + r * Math.cos(rad);
  const y = cy - r * Math.sin(rad);

  // Responsive text sizing for maximized view
  const valueTextSize = isMaximized ? "text-6xl" : "text-2xl";
  const unitTextSize = isMaximized ? "text-xl" : "text-[10px]";
  const tickTextSize = isMaximized ? "text-sm" : "text-[10px]";
  const strokeWidth = isMaximized ? "15" : "20";

  return (
    <div className="flex flex-col items-center justify-center h-full relative p-4">
      <div
        className={cn(
          "w-full h-full relative flex items-end justify-center pb-2",
          isMaximized ? "max-h-[80vh] max-w-[80vw]" : "max-h-40 max-w-60",
        )}
      >
        <svg viewBox="0 0 200 110" className="w-full h-full overflow-visible">
          {/* Gauge Arc Background */}
          <path
            d="M 20 100 A 80 80 0 0 1 180 100"
            fill="none"
            stroke="hsl(var(--muted))"
            strokeWidth={strokeWidth}
            strokeLinecap="butt"
          />
          {/* Gauge Arc Active Value */}
          <path
            d={`M 20 100 A 80 80 0 0 1 ${x} ${y}`}
            fill="none"
            stroke="hsl(var(--primary))"
            strokeWidth={strokeWidth}
            strokeLinecap="butt"
            className="transition-all duration-300 ease-out"
          />
          {/* Ticks */}
          <text
            x="20"
            y="115"
            textAnchor="middle"
            className={cn("fill-muted-foreground", tickTextSize)}
          >
            {safeMin}
          </text>
          <text
            x="180"
            y="115"
            textAnchor="middle"
            className={cn("fill-muted-foreground", tickTextSize)}
          >
            {safeMax}
          </text>
          {/* Value Text */}
          <text
            x="100"
            y="90"
            textAnchor="middle"
            className={cn(
              "font-bold fill-foreground tracking-tighter",
              valueTextSize,
            )}
          >
            {val.toFixed(2).replace(/[.,]00$/, "")}
          </text>
          <text
            x="100"
            y={isMaximized ? 110 : 105}
            textAnchor="middle"
            className={cn("fill-muted-foreground uppercase", unitTextSize)}
          >
            {unit || ""}
          </text>
        </svg>
      </div>
    </div>
  );
};

export default GaugeWidget;
