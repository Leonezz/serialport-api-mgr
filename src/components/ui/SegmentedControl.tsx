import * as React from "react";
import { cn } from "../../lib/utils";

/**
 * SegmentedControl Component
 *
 * Design System Specifications (FIGMA-DESIGN.md 6.2):
 * - Height: 28px
 * - Border Radius: radius.md (6px)
 * - Background: bg.muted
 * - Border: 1px border.default
 * - Item: padding 8px 10px, label.md font
 * - Active: bg.surface, text.primary, shadow.xs
 * - Inactive: transparent, text.secondary
 */

export interface SegmentOption {
  value: string;
  label: string;
  icon?: React.ReactNode;
  disabled?: boolean;
}

export interface SegmentedControlProps {
  options: SegmentOption[];
  value: string;
  onChange: (value: string) => void;
  className?: string;
  /** Size variant */
  size?: "sm" | "md";
  /** Full width */
  fullWidth?: boolean;
}

const SegmentedControl: React.FC<SegmentedControlProps> = ({
  options,
  value,
  onChange,
  className,
  size = "md",
  fullWidth = false,
}) => {
  const heights = {
    sm: "h-6",
    md: "h-7",
  };

  const paddings = {
    sm: "px-2 py-1",
    md: "px-2.5 py-1",
  };

  return (
    <div
      className={cn(
        "inline-flex p-0.5 bg-bg-muted border border-border-default rounded-radius-md",
        fullWidth && "w-full",
        className,
      )}
      role="radiogroup"
    >
      {options.map((option) => {
        const isActive = option.value === value;
        return (
          <button
            key={option.value}
            role="radio"
            aria-checked={isActive}
            disabled={option.disabled}
            onClick={() => !option.disabled && onChange(option.value)}
            className={cn(
              heights[size],
              paddings[size],
              "text-xs font-medium rounded-radius-sm transition-all duration-150",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1",
              fullWidth && "flex-1",
              isActive
                ? "bg-bg-surface text-text-primary shadow-xs"
                : "bg-transparent text-text-secondary hover:text-text-primary",
              option.disabled && "opacity-50 cursor-not-allowed",
            )}
          >
            <span className="flex items-center justify-center gap-1.5">
              {option.icon}
              {option.label}
            </span>
          </button>
        );
      })}
    </div>
  );
};

SegmentedControl.displayName = "SegmentedControl";

export { SegmentedControl };
