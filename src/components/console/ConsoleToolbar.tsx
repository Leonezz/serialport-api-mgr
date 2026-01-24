import * as React from "react";
import { Trash2 } from "lucide-react";
import { cn } from "../../lib/utils";
import { Button } from "../ui/Button";
import { SegmentedControl } from "../ui/SegmentedControl";
import { Toggle } from "../ui/Toggle";
import { Tooltip } from "../ui/Tooltip";

/**
 * ConsoleToolbar Component
 *
 * Design System Specifications (FIGMA-DESIGN.md 9.1):
 * - Height: 40px
 * - Background: bg.surface
 * - Border Bottom: 1px border.default
 * - Padding: 8px 12px
 * - Gap: 8px between groups
 * - View Switcher: Segmented Control (List|Hex|Stream|Logic|Plotter|Dashboard)
 * - Display Mode: Segmented Control (Text|Hex|Binary)
 * - ANSI Toggle
 * - Clear Button
 */

export type ConsoleView =
  | "list"
  | "hex"
  | "stream"
  | "logic"
  | "plotter"
  | "dashboard";
export type DisplayMode = "text" | "hex" | "binary";

export interface ConsoleToolbarProps {
  /** Current view */
  view: ConsoleView;
  /** Called when view changes */
  onViewChange: (view: ConsoleView) => void;
  /** Current display mode */
  displayMode: DisplayMode;
  /** Called when display mode changes */
  onDisplayModeChange: (mode: DisplayMode) => void;
  /** ANSI rendering enabled */
  ansiEnabled?: boolean;
  /** Called when ANSI toggle changes */
  onAnsiToggle?: (enabled: boolean) => void;
  /** Called when clear button clicked */
  onClear?: () => void;
  /** Hide ANSI toggle (e.g., for non-text views) */
  hideAnsiToggle?: boolean;
  /** Hide display mode (e.g., for Dashboard view) */
  hideDisplayMode?: boolean;
  /** Additional className */
  className?: string;
}

const viewOptions: { value: ConsoleView; label: string }[] = [
  { value: "list", label: "List" },
  { value: "hex", label: "Hex" },
  { value: "stream", label: "Stream" },
  { value: "logic", label: "Logic" },
  { value: "plotter", label: "Plotter" },
  { value: "dashboard", label: "Dashboard" },
];

const displayModeOptions: { value: DisplayMode; label: string }[] = [
  { value: "text", label: "Text" },
  { value: "hex", label: "Hex" },
  { value: "binary", label: "Binary" },
];

const ConsoleToolbar: React.FC<ConsoleToolbarProps> = ({
  view,
  onViewChange,
  displayMode,
  onDisplayModeChange,
  ansiEnabled = false,
  onAnsiToggle,
  onClear,
  hideAnsiToggle = false,
  hideDisplayMode = false,
  className,
}) => {
  return (
    <div
      className={cn(
        "h-10 px-3 py-2 flex items-center gap-2",
        "bg-bg-surface border-b border-border-default",
        "shrink-0",
        className,
      )}
    >
      {/* View Switcher */}
      <SegmentedControl
        value={view}
        onChange={(v) => onViewChange(v as ConsoleView)}
        options={viewOptions}
        size="sm"
      />

      {/* Separator */}
      <div className="w-px h-5 bg-border-default" />

      {/* Display Mode Switcher */}
      {!hideDisplayMode && (
        <>
          <SegmentedControl
            value={displayMode}
            onChange={(v) => onDisplayModeChange(v as DisplayMode)}
            options={displayModeOptions}
            size="sm"
          />

          {/* Separator */}
          <div className="w-px h-5 bg-border-default" />
        </>
      )}

      {/* ANSI Toggle */}
      {!hideAnsiToggle && onAnsiToggle && (
        <>
          <div className="flex items-center gap-2">
            <span className="text-xs text-text-secondary">ANSI</span>
            <Toggle
              checked={ansiEnabled}
              onChange={(e) => onAnsiToggle(e.target.checked)}
              size="sm"
              aria-label="Toggle ANSI rendering"
            />
          </div>

          {/* Separator */}
          <div className="w-px h-5 bg-border-default" />
        </>
      )}

      {/* Spacer */}
      <div className="flex-1" />

      {/* Clear Button */}
      {onClear && (
        <Tooltip content="Clear all messages">
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={onClear}
            aria-label="Clear all messages"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </Tooltip>
      )}
    </div>
  );
};

ConsoleToolbar.displayName = "ConsoleToolbar";

export { ConsoleToolbar };
