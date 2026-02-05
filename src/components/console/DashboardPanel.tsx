import React, { useState, useMemo, useCallback } from "react";
import {
  LayoutDashboard,
  Trash2,
  Move,
  ArrowLeftRight,
  Settings,
  Download,
  Gauge,
  X,
  Check,
  Maximize2,
  Minimize2,
  Activity,
  Plus,
  Link as LinkIcon,
  Edit3,
} from "lucide-react";
import { useStore } from "../../lib/store";
import { cn } from "../../lib/utils";
import {
  Button,
  Card,
  DropdownOption,
  Input,
  Label,
  SelectDropdown,
} from "../ui";
import ConfirmationModal from "../ConfirmationModal";

// Import Widget Sub-components
import GaugeWidget from "./widgets/GaugeWidget";
import LineChartWidget from "./widgets/LineChartWidget";
import ValueCardWidget from "./widgets/ValueCardWidget";
import { DashboardWidget, WidgetConfig, WidgetType } from "@/types";
import { TelemetryVariable } from "@/types";

const DashboardPanel: React.FC = () => {
  const {
    sessions,
    activeSessionId,
    clearVariables,
    reorderWidgets,
    addWidget,
    removeWidget,
  } = useStore();
  const session = sessions[activeSessionId];
  const widgets = useMemo(() => session?.widgets || [], [session?.widgets]);
  const variables = useMemo(
    () => session?.variables || {},
    [session?.variables],
  );

  const [editingWidget, setEditingWidget] = useState<DashboardWidget | null>(
    null,
  );
  const [maximizedWidgetId, setMaximizedWidgetId] = useState<string | null>(
    null,
  );
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Deletion State
  const [widgetToDelete, setWidgetToDelete] = useState<DashboardWidget | null>(
    null,
  );

  // Sort widgets by order
  const sortedWidgets = useMemo(() => {
    return [...widgets].sort((a, b) => a.order - b.order);
  }, [widgets]);

  // Calculate Global Time Range across ALL variables used in widgets
  const { globalMinTime, globalMaxTime } = useMemo(() => {
    let min = Infinity;
    let max = -Infinity;
    let hasData = false;

    sortedWidgets.forEach((w) => {
      const v = variables[w.variableName];
      if (v && v.history && v.history.length > 0) {
        const vMin = v.history[0].time;
        const vMax = v.history[v.history.length - 1].time;
        if (vMin < min) min = vMin;
        if (vMax > max) max = vMax;
        hasData = true;
      }
    });

    return {
      globalMinTime: hasData ? min : undefined,
      globalMaxTime: hasData ? max : undefined,
    };
  }, [sortedWidgets, variables]);

  // Drag & Drop State
  const [draggedItem, setDraggedItem] = useState<string | null>(null); // Widget ID

  // Shared Brush State for Synchronization (Time-based)
  const [brushTimeRange, setBrushTimeRange] = useState<{
    startTime?: number;
    endTime?: number;
  }>({});

  const handleDragStart = (e: React.DragEvent, id: string) => {
    setDraggedItem(id);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent, _targetId: string) => {
    e.preventDefault(); // Necessary to allow dropping
  };

  const handleDrop = (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    if (!draggedItem || draggedItem === targetId) {
      setDraggedItem(null);
      return;
    }

    // Reorder Logic
    const currentIndex = sortedWidgets.findIndex((w) => w.id === draggedItem);
    const targetIndex = sortedWidgets.findIndex((w) => w.id === targetId);

    if (currentIndex === -1 || targetIndex === -1) return;

    const newOrderList = [...sortedWidgets];
    const [movedItem] = newOrderList.splice(currentIndex, 1);
    newOrderList.splice(targetIndex, 0, movedItem);

    // Extract IDs in new order
    reorderWidgets(newOrderList.map((w) => w.id));
    setDraggedItem(null);
  };

  const confirmRemoveWidget = (widget: DashboardWidget) => {
    setWidgetToDelete(widget);
  };

  return (
    <div className="flex flex-col h-full bg-muted/10 overflow-hidden relative">
      {/* ===== SECTION 9.7: Header ===== */}
      <div className="h-10 flex justify-between items-center px-4 bg-bg-surface border-b border-border-default shrink-0">
        <h3 className="text-label-sm font-bold uppercase tracking-wider text-text-muted flex items-center gap-2">
          <LayoutDashboard className="w-4 h-4" /> Dashboard
        </h3>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsAddModalOpen(true)}
            className="h-7 gap-1.5 text-xs"
          >
            <Plus className="w-3.5 h-3.5" /> Widget
          </Button>

          {widgets.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearVariables}
              className="h-7 w-7 p-0 text-text-muted hover:text-destructive"
              title="Clear All Widgets"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </Button>
          )}
        </div>
      </div>

      {/* ===== SECTION 9.7: Grid Layout ===== */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden custom-scrollbar p-4">
        {widgets.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center bg-bg-surface/30 text-text-muted select-none rounded-xl border-2 border-dashed border-border-default">
            <div className="w-16 h-16 bg-bg-muted/50 rounded-full flex items-center justify-center mb-4">
              <LayoutDashboard className="w-8 h-8 opacity-50" />
            </div>
            <h3 className="font-semibold text-lg mb-1">Telemetry Dashboard</h3>
            <p className="text-sm opacity-70 max-w-sm text-center">
              No widgets defined. <br />
              Variables from scripts will auto-create widgets, or you can add
              them manually.
            </p>
            <div className="mt-4">
              <Button size="sm" onClick={() => setIsAddModalOpen(true)}>
                <Plus className="w-4 h-4 mr-2" /> Add Widget
              </Button>
            </div>
          </div>
        ) : (
          /* CSS Grid: 12 columns, 80px row height, 16px gap (Section 9.7) */
          <div
            className="grid gap-4"
            style={{
              gridTemplateColumns: "repeat(12, 1fr)",
              gridAutoRows: "80px",
            }}
          >
            {sortedWidgets.map((widget) => (
              <WidgetCard
                key={widget.id}
                widget={widget}
                variable={variables[widget.variableName]}
                globalMinTime={globalMinTime}
                globalMaxTime={globalMaxTime}
                onDragStart={(e) => handleDragStart(e, widget.id)}
                onDragOver={(e) => handleDragOver(e, widget.id)}
                onDrop={(e) => handleDrop(e, widget.id)}
                isDragging={draggedItem === widget.id}
                brushTimeRange={brushTimeRange}
                setBrushTimeRange={setBrushTimeRange}
                onEdit={() => setEditingWidget(widget)}
                onDelete={() => confirmRemoveWidget(widget)}
                onMaximize={() => setMaximizedWidgetId(widget.id)}
                isMaximized={false}
              />
            ))}

            {/* Section 9.7: Add Widget Placeholder (Dashed) */}
            <button
              onClick={() => setIsAddModalOpen(true)}
              className={cn(
                "col-span-3 row-span-2 rounded-lg border-2 border-dashed border-border-default",
                "flex flex-col items-center justify-center gap-2",
                "text-text-muted hover:text-text-secondary",
                "hover:border-accent-primary hover:bg-blue-50 dark:hover:bg-blue-500/10",
                "transition-all duration-150 cursor-pointer",
              )}
            >
              <Plus className="w-6 h-6" />
              <span className="text-xs font-medium">Add Widget</span>
            </button>
          </div>
        )}
      </div>

      {/* Maximized Overlay */}
      {maximizedWidgetId && (
        <div className="fixed inset-0 z-60 bg-background/80 backdrop-blur-sm p-4 md:p-8 flex items-center justify-center animate-in fade-in duration-200">
          <div className="w-full h-full bg-background border border-border rounded-xl shadow-2xl overflow-hidden relative flex flex-col">
            {(() => {
              const w = widgets.find((w) => w.id === maximizedWidgetId);
              if (!w) return null;
              return (
                <WidgetCard
                  widget={w}
                  variable={variables[w.variableName]}
                  globalMinTime={globalMinTime}
                  globalMaxTime={globalMaxTime}
                  onDragStart={() => {}}
                  onDragOver={() => {}}
                  onDrop={() => {}}
                  isDragging={false}
                  brushTimeRange={brushTimeRange}
                  setBrushTimeRange={setBrushTimeRange}
                  onEdit={() => setEditingWidget(w)}
                  onDelete={() => confirmRemoveWidget(w)}
                  onMaximize={() => setMaximizedWidgetId(null)}
                  isMaximized={true}
                />
              );
            })()}
          </div>
        </div>
      )}

      {editingWidget && (
        <WidgetSettingsModal
          widget={editingWidget}
          availableVariables={Object.keys(variables)}
          onClose={() => setEditingWidget(null)}
        />
      )}

      {isAddModalOpen && (
        <AddWidgetModal
          availableVariables={Object.keys(variables)}
          onAdd={(data) => {
            addWidget({
              title: data.title || data.variableName,
              variableName: data.variableName,
              config: data.config!,
            });
            setIsAddModalOpen(false);
          }}
          onClose={() => setIsAddModalOpen(false)}
        />
      )}

      {widgetToDelete && (
        <ConfirmationModal
          title="Remove Widget"
          message={`Are you sure you want to remove the widget "${widgetToDelete.title}"? The underlying data variable "${widgetToDelete.variableName}" will NOT be deleted.`}
          confirmLabel="Remove"
          isDestructive
          onConfirm={() => {
            removeWidget(widgetToDelete.id);
            if (maximizedWidgetId === widgetToDelete.id) {
              setMaximizedWidgetId(null);
            }
            setWidgetToDelete(null);
          }}
          onCancel={() => setWidgetToDelete(null)}
        />
      )}
    </div>
  );
};

const WidgetCard: React.FC<{
  widget: DashboardWidget;
  variable?: TelemetryVariable; // Can be undefined if data hasn't arrived yet
  globalMinTime?: number;
  globalMaxTime?: number;
  onDragStart: (e: React.DragEvent) => void;
  onDragOver: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent) => void;
  isDragging: boolean;
  brushTimeRange: { startTime?: number; endTime?: number };
  setBrushTimeRange: (range: { startTime?: number; endTime?: number }) => void;
  onEdit: () => void;
  onDelete: () => void;
  onMaximize: () => void;
  isMaximized: boolean;
}> = ({
  widget,
  variable,
  globalMinTime,
  globalMaxTime,
  onDragStart,
  onDragOver,
  onDrop,
  isDragging,
  brushTimeRange,
  setBrushTimeRange,
  onEdit,
  onDelete,
  onMaximize,
  isMaximized,
}) => {
  const { updateWidget } = useStore();
  const config = widget.config;

  // Section 9.7: Grid-based sizing (cols × rows)
  // Default sizes: CARD: 3×2, LINE: 6×3, GAUGE: 3×3
  const getGridSpan = () => {
    if (isMaximized) return "";
    const sizeMap: Record<string, { cols: number; rows: number }> = {
      CARD: {
        cols: config.width === 1 ? 3 : config.width === 2 ? 4 : 6,
        rows: 2,
      },
      LINE: {
        cols: config.width === 1 ? 4 : config.width === 2 ? 6 : 12,
        rows: 3,
      },
      GAUGE: { cols: 3, rows: 3 },
    };
    const size = sizeMap[config.type] || sizeMap.CARD;
    return { cols: size.cols, rows: size.rows };
  };
  const gridSpan = getGridSpan();

  // Fallback dummy variable if real one missing to prevent crash, but show empty state
  const safeVar = variable || {
    name: widget.variableName,
    type: "string",
    value: "No Data",
    lastUpdate: 0,
    history: [],
  };
  const isBool = safeVar.type === "boolean";
  const isObj = safeVar.type === "object";
  const isNum = safeVar.type === "number";
  const timeStr = variable
    ? new Date(variable.lastUpdate).toLocaleTimeString()
    : "--:--:--";

  const toggleWidth = (e: React.MouseEvent) => {
    e.stopPropagation();
    const nextWidth = (config.width % 3) + 1;
    updateWidget(widget.id, {
      config: { ...config, width: nextWidth as 1 | 2 | 3 },
    });
  };

  const nextType = (e: React.MouseEvent) => {
    e.stopPropagation();
    // Cycle: CARD -> LINE -> GAUGE (if number) -> CARD
    if (config.type === "CARD") {
      updateWidget(widget.id, { config: { ...config, type: "LINE" } });
    } else if (config.type === "LINE") {
      if (isNum)
        updateWidget(widget.id, { config: { ...config, type: "GAUGE" } });
      else updateWidget(widget.id, { config: { ...config, type: "CARD" } });
    } else {
      updateWidget(widget.id, { config: { ...config, type: "CARD" } });
    }
  };

  const handleExport = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!variable) return;
    const start = brushTimeRange.startTime ?? -Infinity;
    const end = brushTimeRange.endTime ?? Infinity;

    // Filter actual history
    const dataToExport = variable.history.filter(
      (h) => h.time >= start && h.time <= end,
    );

    if (dataToExport.length === 0) return;

    // Determine CSV Headers
    const sample = dataToExport[0];
    const valueKeys = Object.keys(sample).filter((k) => k !== "time");
    const headers = ["ISO Timestamp", "Unix Timestamp", ...valueKeys];

    const csvRows = [headers.join(",")];

    dataToExport.forEach((row) => {
      const iso = new Date(row.time).toISOString();
      const values = valueKeys.map((k) => {
        const val = row[k];
        if (typeof val === "object")
          return `"${JSON.stringify(val).replace(/"/g, '""')}"`;
        return String(val);
      });
      csvRows.push([iso, row.time, ...values].join(","));
    });

    const blob = new Blob([csvRows.join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${widget.title}_export_${Date.now()}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Shared syncId allows all charts to link their tooltips
  const SYNC_ID = "dashboard-sync";

  // --- Data Normalization ---
  const processedData = useMemo(() => {
    if (!safeVar.history || safeVar.history.length === 0) return [];
    if (globalMinTime === undefined || globalMaxTime === undefined)
      return safeVar.history;

    const data = [...safeVar.history];
    const localMin = data[0].time;
    const localMax = data[data.length - 1].time;

    if (localMin > globalMinTime) {
      data.unshift({ time: globalMinTime } as Record<string, unknown>);
    }
    if (localMax < globalMaxTime) {
      data.push({ time: globalMaxTime } as Record<string, unknown>);
    }
    return data;
  }, [safeVar.history, globalMinTime, globalMaxTime]);

  // --- Calculate Indices based on Time Range ---
  const brushIndices = useMemo(() => {
    if (!processedData.length) return {};
    if (
      brushTimeRange.startTime === undefined &&
      brushTimeRange.endTime === undefined
    )
      return {};

    let startIndex = 0;
    let endIndex = processedData.length - 1;

    if (brushTimeRange.startTime !== undefined) {
      const idx = processedData.findIndex(
        (h) => h.time >= brushTimeRange.startTime!,
      );
      if (idx !== -1) startIndex = idx;
    }

    if (brushTimeRange.endTime !== undefined) {
      const idx = processedData.findIndex(
        (h) => h.time > brushTimeRange.endTime!,
      );
      if (idx !== -1) endIndex = Math.max(0, idx - 1);
      else endIndex = processedData.length - 1;
    }

    if (startIndex > endIndex) startIndex = endIndex;
    return { startIndex, endIndex };
  }, [processedData, brushTimeRange]);

  interface BrushEvent {
    startIndex?: number;
    endIndex?: number;
  }

  const handleBrushChange = useCallback(
    (e: BrushEvent) => {
      if (!processedData.length) return;
      if (e.startIndex !== undefined && e.endIndex !== undefined) {
        const startItem = processedData[e.startIndex];
        const endItem = processedData[e.endIndex];
        if (startItem && endItem) {
          setBrushTimeRange({
            startTime: startItem.time,
            endTime: endItem.time,
          });
        }
      }
    },
    [processedData, setBrushTimeRange],
  );

  // --- Render Content Variants ---
  const renderContent = () => {
    if (!variable) {
      return (
        <div className="flex flex-col items-center justify-center h-full text-muted-foreground opacity-50">
          <span className="text-xs italic">Waiting for data...</span>
          <span className="text-[10px] font-mono">({widget.variableName})</span>
        </div>
      );
    }

    if (config.type === "GAUGE") {
      return (
        <GaugeWidget
          value={Number(safeVar.value)}
          min={config.min}
          max={config.max}
          unit={config.unit}
          isMaximized={isMaximized}
        />
      );
    }

    if (config.type === "LINE") {
      const keys =
        isObj && safeVar.history.length > 0
          ? Object.keys(safeVar.history[0]).filter((k) => k !== "time")
          : ["val"];

      if (safeVar.type === "string") {
        return (
          <div className="flex items-center justify-center h-full text-amber-500 text-xs">
            String data cannot be plotted on Line Chart.
          </div>
        );
      }

      return (
        <LineChartWidget
          data={processedData}
          dataKeys={keys}
          syncId={SYNC_ID}
          brushIndices={brushIndices}
          onBrushChange={handleBrushChange}
          isMaximized={isMaximized}
        />
      );
    }

    // Default CARD View
    return (
      <ValueCardWidget
        variable={safeVar}
        config={config}
        processedData={processedData}
        isMaximized={isMaximized}
        syncId={SYNC_ID}
      />
    );
  };

  const handleDragHandleStart = (e: React.DragEvent) => {
    if (isMaximized) return;
    const card = (e.currentTarget as HTMLElement).closest(".bg-card");
    if (card) {
      e.dataTransfer.setDragImage(card, 20, 20);
    }
    onDragStart(e);
  };

  return (
    <div
      onDragOver={isMaximized ? undefined : onDragOver}
      onDrop={isMaximized ? undefined : onDrop}
      className={cn(
        "bg-bg-surface border border-border-default rounded-lg shadow-sm flex flex-col relative transition-all duration-200 group",
        isMaximized && "h-full w-full border-0 shadow-none",
        isDragging && "opacity-50 border-dashed border-accent-primary",
        !isMaximized &&
          isBool &&
          safeVar.value &&
          "border-emerald-500/50 bg-emerald-500/5",
      )}
      style={
        !isMaximized && gridSpan
          ? {
              gridColumn: `span ${gridSpan.cols} / span ${gridSpan.cols}`,
              gridRow: `span ${gridSpan.rows} / span ${gridSpan.rows}`,
            }
          : undefined
      }
    >
      {/* Header / Controls */}
      <div className="flex justify-between items-start p-3 pb-0 relative z-10">
        <div className="flex items-center gap-2 overflow-hidden">
          {!isMaximized && (
            <div
              draggable
              onDragStart={handleDragHandleStart}
              className="cursor-grab active:cursor-grabbing text-muted-foreground/50 hover:text-foreground p-1 hover:bg-muted rounded transition-colors"
              title="Drag to reorder"
            >
              <Move className="w-5 h-5" />
            </div>
          )}
          <div>
            <h4
              className={cn(
                "font-bold text-muted-foreground uppercase tracking-wide truncate flex items-center gap-1.5",
                isMaximized ? "text-xl max-w-full" : "text-xs max-w-30",
              )}
              title={widget.title}
            >
              {widget.title}
              {widget.title !== widget.variableName && (
                <span className="text-[9px] font-normal opacity-50 font-mono">
                  ({widget.variableName})
                </span>
              )}
            </h4>
            <span className="text-[9px] text-muted-foreground opacity-50 block">
              {timeStr}
            </span>
          </div>
        </div>

        <div
          className={cn(
            "flex items-center gap-1 transition-opacity bg-background/80 backdrop-blur rounded-md border border-border shadow-sm p-0.5",
            !isMaximized && "opacity-0 group-hover:opacity-100",
          )}
        >
          <button
            onClick={handleExport}
            className="p-1 hover:bg-muted rounded text-muted-foreground hover:text-foreground"
            title="Export CSV"
          >
            <Download className="w-3 h-3" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onEdit();
            }}
            className="p-1 hover:bg-muted rounded text-muted-foreground hover:text-foreground"
            title="Widget Settings"
          >
            <Settings className="w-3 h-3" />
          </button>
          <button
            onClick={nextType}
            className="p-1 hover:bg-muted rounded text-muted-foreground hover:text-foreground"
            title="Switch View"
          >
            {config.type === "CARD" ? (
              <Activity className="w-3 h-3" />
            ) : config.type === "LINE" ? (
              <Gauge className="w-3 h-3" />
            ) : (
              <LayoutDashboard className="w-3 h-3" />
            )}
          </button>
          {!isMaximized && (
            <button
              onClick={toggleWidth}
              className="p-1 hover:bg-muted rounded text-muted-foreground hover:text-foreground"
              title="Resize"
            >
              <ArrowLeftRight className="w-3 h-3" />
            </button>
          )}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onMaximize();
            }}
            className="p-1 hover:bg-muted rounded text-muted-foreground hover:text-foreground"
            title={isMaximized ? "Minimize" : "Maximize"}
          >
            {isMaximized ? (
              <Minimize2 className="w-3 h-3" />
            ) : (
              <Maximize2 className="w-3 h-3" />
            )}
          </button>
          <div className="w-px h-3 bg-border/50 mx-0.5"></div>
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onDelete();
            }}
            className="p-1 hover:bg-destructive/10 rounded text-muted-foreground hover:text-destructive cursor-pointer pointer-events-auto"
            title="Remove Widget"
          >
            <Trash2 className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 p-3 pt-1 flex flex-col overflow-hidden relative">
        {renderContent()}
      </div>
    </div>
  );
};

const WidgetSettingsModal: React.FC<{
  widget: DashboardWidget;
  availableVariables: string[];
  onClose: () => void;
}> = ({ widget, availableVariables, onClose }) => {
  const { updateWidget } = useStore();
  const config = widget.config;

  // Local State
  const [title, setTitle] = useState(widget.title);
  const [varName, setVarName] = useState(widget.variableName);
  const [type, setType] = useState<WidgetType>(config.type);
  const [min, setMin] = useState(config.min?.toString() || "0");
  const [max, setMax] = useState(config.max?.toString() || "100");
  const [unit, setUnit] = useState(config.unit || "");

  const handleSave = () => {
    updateWidget(widget.id, {
      title,
      variableName: varName,
      config: {
        ...config,
        type,
        min: type !== "CARD" ? parseFloat(min) : undefined,
        max: type !== "CARD" ? parseFloat(max) : undefined,
        unit: unit.trim(),
      },
    });
    onClose();
  };

  return (
    <div className="absolute inset-0 bg-background/50 backdrop-blur-sm z-70 flex items-center justify-center p-4">
      <Card className="w-[320px] shadow-xl border-border animate-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between p-3 border-b border-border bg-muted/20">
          <span className="font-bold text-xs flex items-center gap-2">
            <Edit3 className="w-3 h-3" /> Edit Widget
          </span>
          <button onClick={onClose}>
            <X className="w-4 h-4 text-muted-foreground hover:text-foreground" />
          </button>
        </div>
        <div className="p-4 space-y-3">
          <div className="space-y-1">
            <Label className="text-[10px]">Widget Title</Label>
            <Input
              className="h-8 text-xs"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          <div className="space-y-1">
            <Label className="text-[10px]">Linked Variable</Label>
            <div className="relative">
              <Input
                list="vars"
                className="h-8 text-xs font-mono"
                value={varName}
                onChange={(e) => setVarName(e.target.value)}
                placeholder="Variable Key"
              />
              <datalist id="vars">
                {availableVariables.map((v) => (
                  <option key={v} value={v} />
                ))}
              </datalist>
              <LinkIcon className="w-3 h-3 absolute right-2 top-2.5 text-muted-foreground opacity-50" />
            </div>
          </div>

          <div className="space-y-1">
            <Label className="text-[10px]">Widget Type</Label>
            <SelectDropdown
              options={
                [
                  { value: "CARD", label: "Value Card" },
                  { value: "LINE", label: "Line Chart" },
                  { value: "GAUGE", label: "Gauge" },
                ] as DropdownOption<WidgetType>[]
              }
              value={type}
              onChange={(value) => setType(value)}
              size="sm"
            />
          </div>

          <div className="space-y-1">
            <Label className="text-[10px]">Unit Label</Label>
            <Input
              className="h-8 text-xs"
              value={unit}
              onChange={(e) => setUnit(e.target.value)}
              placeholder="e.g. Volts, RPM"
            />
          </div>

          {type !== "CARD" && (
            <div className="grid grid-cols-2 gap-3 pt-1 animate-in fade-in zoom-in-95">
              <div className="space-y-1">
                <Label className="text-[10px]">Min Value</Label>
                <Input
                  className="h-8 text-xs"
                  type="number"
                  value={min}
                  onChange={(e) => setMin(e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <Label className="text-[10px]">Max Value</Label>
                <Input
                  className="h-8 text-xs"
                  type="number"
                  value={max}
                  onChange={(e) => setMax(e.target.value)}
                />
              </div>
            </div>
          )}

          <Button
            size="sm"
            className="w-full h-8 text-xs gap-2 mt-2"
            onClick={handleSave}
          >
            <Check className="w-3 h-3" /> Save Changes
          </Button>
        </div>
      </Card>
    </div>
  );
};

interface AddWidgetData {
  title: string;
  variableName: string;
  config?: WidgetConfig;
}

const AddWidgetModal: React.FC<{
  onAdd: (data: AddWidgetData) => void;
  onClose: () => void;
  availableVariables: string[];
}> = ({ onAdd, onClose, availableVariables }) => {
  const [title, setTitle] = useState("");
  const [variableName, setVariableName] = useState("");
  const [type, setType] = useState<WidgetType>("CARD");
  const [unit, setUnit] = useState("");
  const [min, setMin] = useState("0");
  const [max, setMax] = useState("100");

  // Auto-fill title when variable name changes if empty
  const handleVarChange = (val: string) => {
    setVariableName(val);
    if (!title) setTitle(val);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!variableName.trim()) return;

    onAdd({
      title: title || variableName,
      variableName: variableName.trim(),
      config: {
        type,
        unit: unit.trim(),
        min: type !== "CARD" ? parseFloat(min) : undefined,
        max: type !== "CARD" ? parseFloat(max) : undefined,
        width: 1,
      },
    });
  };

  return (
    <div className="absolute inset-0 bg-background/50 backdrop-blur-sm z-70 flex items-center justify-center p-4">
      <Card className="w-[320px] shadow-xl border-border animate-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between p-3 border-b border-border bg-muted/20">
          <span className="font-bold text-xs">Add New Widget</span>
          <button onClick={onClose}>
            <X className="w-4 h-4 text-muted-foreground hover:text-foreground" />
          </button>
        </div>
        <form onSubmit={handleSave} className="p-4 space-y-3">
          <div className="space-y-1">
            <Label className="text-[10px]">Data Variable</Label>
            <Input
              list="add-vars"
              className="h-8 text-xs font-mono"
              value={variableName}
              onChange={(e) => handleVarChange(e.target.value)}
              placeholder="e.g. Temperature"
              autoFocus
              required
            />
            <datalist id="add-vars">
              {availableVariables.map((v) => (
                <option key={v} value={v} />
              ))}
            </datalist>
          </div>

          <div className="space-y-1">
            <Label className="text-[10px]">Widget Title</Label>
            <Input
              className="h-8 text-xs"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Display Name"
            />
          </div>

          <div className="space-y-1">
            <Label className="text-[10px]">Widget Type</Label>
            <SelectDropdown
              options={
                [
                  { value: "CARD", label: "Value Card" },
                  { value: "LINE", label: "Line Chart" },
                  { value: "GAUGE", label: "Gauge" },
                ] as DropdownOption<WidgetType>[]
              }
              value={type}
              onChange={(value) => setType(value)}
              size="sm"
            />
          </div>

          <div className="space-y-1">
            <Label className="text-[10px]">Unit Label</Label>
            <Input
              className="h-8 text-xs"
              value={unit}
              onChange={(e) => setUnit(e.target.value)}
              placeholder="e.g. V, A, °C"
            />
          </div>

          {type !== "CARD" && (
            <div className="grid grid-cols-2 gap-3 animate-in fade-in zoom-in-95">
              <div className="space-y-1">
                <Label className="text-[10px]">Min</Label>
                <Input
                  className="h-8 text-xs"
                  type="number"
                  value={min}
                  onChange={(e) => setMin(e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <Label className="text-[10px]">Max</Label>
                <Input
                  className="h-8 text-xs"
                  type="number"
                  value={max}
                  onChange={(e) => setMax(e.target.value)}
                />
              </div>
            </div>
          )}
          <Button
            type="submit"
            size="sm"
            className="w-full h-8 text-xs gap-2 mt-2"
          >
            <Plus className="w-3 h-3" /> Create Widget
          </Button>
        </form>
      </Card>
    </div>
  );
};

export default DashboardPanel;
