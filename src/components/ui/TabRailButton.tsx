import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../../lib/utils";
import type { LucideIcon } from "lucide-react";

/**
 * TabRailButton Component
 *
 * Design System Specifications (FIGMA-DESIGN.md 5.1):
 * A specialized button for vertical tab rails with icon, tooltip, and active indicator.
 * Used in sidebars for navigation between panels/tabs.
 *
 * Features:
 * - Icon-only display with hover tooltip
 * - Active state indicator (left bar)
 * - Smooth transitions
 */

const tabRailButtonVariants = cva(
  // Base styles
  "p-2.5 rounded-lg transition-all relative group inline-flex items-center justify-center",
  {
    variants: {
      isActive: {
        true: "bg-primary text-primary-foreground shadow-md",
        false: "text-muted-foreground hover:bg-muted hover:text-foreground",
      },
    },
    defaultVariants: {
      isActive: false,
    },
  },
);

export interface TabRailButtonProps
  extends
    Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "children">,
    VariantProps<typeof tabRailButtonVariants> {
  /** The icon to display */
  icon: LucideIcon;
  /** Label for tooltip and accessibility */
  label: string;
  /** Whether this tab is currently active */
  isActive?: boolean;
  /** Icon size class (default: w-5 h-5) */
  iconClassName?: string;
}

const TabRailButton = React.forwardRef<HTMLButtonElement, TabRailButtonProps>(
  (
    {
      className,
      icon: Icon,
      label,
      isActive = false,
      iconClassName = "w-5 h-5",
      ...props
    },
    ref,
  ) => {
    return (
      <button
        ref={ref}
        className={cn(tabRailButtonVariants({ isActive, className }))}
        title={label}
        aria-label={label}
        aria-pressed={isActive}
        {...props}
      >
        <Icon className={iconClassName} />
        {isActive && (
          <div className="absolute -left-px top-1/2 -translate-y-1/2 w-0.5 h-4 bg-primary-foreground rounded-full" />
        )}
        {/* Tooltip */}
        <div className="absolute right-full mr-2 px-2 py-1 bg-popover border border-border text-[10px] font-bold rounded shadow-lg opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity whitespace-nowrap z-[100] translate-x-1 group-hover:translate-x-0">
          {label}
        </div>
      </button>
    );
  },
);
TabRailButton.displayName = "TabRailButton";

export { TabRailButton, tabRailButtonVariants };
