import * as React from "react";
import { cn } from "../../lib/utils";

/**
 * ActionBar Component (Sticky Footer)
 *
 * Design System Specifications (FIGMA-DESIGN.md 6.7):
 * - Height: 64px
 * - Padding: 12px 16px
 * - Background: bg.surface
 * - Border Top: 1px border.default
 * - Shadow: 0 -4px 6px rgba(0,0,0,0.05)
 * - Layout: Left aligned (delete), Right aligned (cancel, save)
 */

export interface ActionBarProps {
  /** Left-aligned actions (typically delete button) */
  leftActions?: React.ReactNode;
  /** Right-aligned actions (typically cancel/save buttons) */
  rightActions?: React.ReactNode;
  /** Additional className */
  className?: string;
  /** Whether the action bar is sticky */
  sticky?: boolean;
}

const ActionBar: React.FC<ActionBarProps> = ({
  leftActions,
  rightActions,
  className,
  sticky = true,
}) => {
  return (
    <div
      className={cn(
        "h-16 px-4 py-3 bg-bg-surface border-t border-border-default",
        "shadow-[0_-4px_6px_rgba(0,0,0,0.05)]",
        "flex items-center justify-between gap-4",
        sticky && "sticky bottom-0",
        className,
      )}
    >
      <div className="flex items-center gap-2">{leftActions}</div>
      <div className="flex items-center gap-2">{rightActions}</div>
    </div>
  );
};

ActionBar.displayName = "ActionBar";

export { ActionBar };
