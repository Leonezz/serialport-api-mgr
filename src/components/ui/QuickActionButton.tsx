import * as React from "react";
import { cn } from "../../lib/utils";

/**
 * QuickActionButton Component
 *
 * Design System Specifications (FIGMA-DESIGN.md 7.4):
 * - Size: 40x40px (icon only) or flexible width with label
 * - Border Radius: radius.sm
 * - Background: bg.muted
 * - Border: 1px border.default
 * - States: Default, Hover (bg.hover), Active (accent.primary border, pulsing)
 */

export interface QuickActionButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /** Icon to display */
  icon: React.ReactNode;
  /** Optional label (makes button flexible width) */
  label?: string;
  /** Whether the action is currently active/running */
  active?: boolean;
  /** Size variant */
  size?: "sm" | "md";
}

const QuickActionButton = React.forwardRef<
  HTMLButtonElement,
  QuickActionButtonProps
>(({ icon, label, active = false, size = "md", className, ...props }, ref) => {
  const isIconOnly = !label;
  const sizeClasses = {
    sm: isIconOnly ? "w-8 h-8" : "h-8 px-3",
    md: isIconOnly ? "w-10 h-10" : "h-10 px-4",
  };

  return (
    <button
      ref={ref}
      className={cn(
        // Base styles
        "inline-flex items-center justify-center gap-2",
        "rounded-radius-sm border transition-standard",
        // Default state
        "bg-bg-muted border-border-default",
        "text-text-primary",
        // Hover state
        "hover:bg-bg-hover",
        // Focus state
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        // Disabled state
        "disabled:opacity-disabled disabled:cursor-not-allowed",
        // Active/running state
        active && ["border-accent-primary", "animate-status-pulse"],
        // Size
        sizeClasses[size],
        className,
      )}
      {...props}
    >
      {/* Icon */}
      <span
        className={cn("flex-shrink-0", size === "sm" ? "w-4 h-4" : "w-5 h-5")}
      >
        {icon}
      </span>

      {/* Label */}
      {label && (
        <span className="text-body-sm font-medium whitespace-nowrap">
          {label}
        </span>
      )}
    </button>
  );
});

QuickActionButton.displayName = "QuickActionButton";

export { QuickActionButton };
