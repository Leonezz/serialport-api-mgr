import * as React from "react";
import { Trash2, Palette } from "lucide-react";
import { cn } from "../../lib/utils";
import { Button } from "../ui/Button";
import { SegmentedControl } from "../ui/SegmentedControl";
import { Tooltip } from "../ui/Tooltip";

// Debounce delay for view changes during heavy streaming (fixes #18)
const VIEW_CHANGE_DEBOUNCE_MS = 100;

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
  // Track pending view change for debouncing (#18)
  const pendingViewRef = React.useRef<ConsoleView | null>(null);
  const debounceTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );

  // Debounced view change handler to prevent UI unresponsiveness during heavy streaming
  const handleViewChange = React.useCallback(
    (newView: ConsoleView) => {
      // Clear any pending debounce
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }

      // Store the pending view
      pendingViewRef.current = newView;

      // Use startTransition if available (React 18+) for non-urgent updates
      if (typeof React.startTransition === "function") {
        React.startTransition(() => {
          debounceTimerRef.current = setTimeout(() => {
            if (pendingViewRef.current) {
              onViewChange(pendingViewRef.current);
              pendingViewRef.current = null;
            }
          }, VIEW_CHANGE_DEBOUNCE_MS);
        });
      } else {
        // Fallback for older React versions
        debounceTimerRef.current = setTimeout(() => {
          if (pendingViewRef.current) {
            onViewChange(pendingViewRef.current);
            pendingViewRef.current = null;
          }
        }, VIEW_CHANGE_DEBOUNCE_MS);
      }
    },
    [onViewChange],
  );

  // Cleanup on unmount
  React.useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  return (
    <div
      className={cn(
        "h-10 px-3 py-2 flex items-center gap-2",
        "bg-bg-surface border-b border-border-default",
        "shrink-0",
        className,
      )}
    >
      {/* View Switcher - uses debounced handler to prevent unresponsiveness (#18) */}
      <SegmentedControl
        value={view}
        onChange={(v) => handleViewChange(v as ConsoleView)}
        options={viewOptions}
        size="sm"
      />

      {/* Separator */}
      <div className="w-px h-5 bg-border-default" />

      {/* Display Mode Switcher - only shown in List view */}
      {!hideDisplayMode && view === "list" && (
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

      {/* ANSI Color Toggle - only shown in List view */}
      {!hideAnsiToggle && onAnsiToggle && view === "list" && (
        <Tooltip
          content={ansiEnabled ? "Disable ANSI colors" : "Enable ANSI colors"}
        >
          <button
            onClick={() => onAnsiToggle(!ansiEnabled)}
            aria-label="Toggle ANSI color rendering"
            className={cn(
              "w-7 h-7 flex items-center justify-center rounded-lg transition-all",
              ansiEnabled
                ? "bg-gradient-to-br from-rose-500 via-purple-500 to-cyan-500 text-white shadow-md"
                : "text-text-secondary hover:text-text-primary hover:bg-bg-hover",
            )}
          >
            <Palette className="w-4 h-4" />
          </button>
        </Tooltip>
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
