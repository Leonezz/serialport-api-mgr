import React from "react";
import { Zap, AlertCircle } from "lucide-react";
import { AreaChart, Area, ResponsiveContainer, Tooltip } from "recharts";
import { cn } from "../../../lib/utils";
import { TelemetryVariable } from "@/types";
import { WidgetConfig } from "@/types";

interface Props {
  variable: TelemetryVariable;
  config: WidgetConfig;
  processedData: Record<string, unknown>[];
  isMaximized: boolean;
  syncId: string;
}

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
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={processedData} syncId={syncId}>
              <defs>
                <linearGradient
                  id={`grad-${variable.name}`}
                  x1="0"
                  y1="0"
                  x2="0"
                  y2="1"
                >
                  <stop
                    offset="5%"
                    stopColor="hsl(var(--primary))"
                    stopOpacity={0.3}
                  />
                  <stop
                    offset="95%"
                    stopColor="hsl(var(--primary))"
                    stopOpacity={0}
                  />
                </linearGradient>
              </defs>
              <Tooltip
                content={<></>}
                cursor={{
                  stroke: "hsl(var(--primary))",
                  strokeWidth: 1,
                  strokeOpacity: 0.5,
                }}
              />
              <Area
                type="monotone"
                dataKey="val"
                stroke="hsl(var(--primary))"
                fill={`url(#grad-${variable.name})`}
                strokeWidth={2}
                isAnimationActive={false}
                connectNulls={false}
              />
            </AreaChart>
          </ResponsiveContainer>
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
