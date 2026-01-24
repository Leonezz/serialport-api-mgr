import * as React from "react";
import { cn } from "../../lib/utils";

/**
 * Toggle/Switch Component
 *
 * Design System Specifications (FIGMA-DESIGN.md 5.6):
 * - Size: 44x24px (track), 20x20px (thumb)
 * - Border Radius: radius.full
 * - States: off (gray.200 track) | on (accent.primary track)
 * - Animation: thumb slides 20px, 150ms ease-out
 */

export interface ToggleProps extends Omit<
  React.InputHTMLAttributes<HTMLInputElement>,
  "type" | "size"
> {
  /** Label text for the toggle */
  label?: string;
  /** Label position */
  labelPosition?: "left" | "right";
  /** Additional class for the label */
  labelClassName?: string;
  /** Size variant */
  size?: "sm" | "md";
}

const Toggle = React.forwardRef<HTMLInputElement, ToggleProps>(
  (
    {
      className,
      label,
      labelPosition = "right",
      disabled,
      labelClassName,
      size = "md",
      ...props
    },
    ref,
  ) => {
    const isSmall = size === "sm";
    const trackWidth = isSmall ? "w-9" : "w-11"; // 36px or 44px
    const trackHeight = isSmall ? "h-5" : "h-6"; // 20px or 24px
    const thumbSize = isSmall ? "w-4 h-4" : "w-5 h-5"; // 16px or 20px
    const thumbTranslate = isSmall
      ? "peer-checked:translate-x-4"
      : "peer-checked:translate-x-5"; // 16px or 20px

    const toggle = (
      <div className="relative">
        <input
          type="checkbox"
          ref={ref}
          disabled={disabled}
          className="peer sr-only"
          {...props}
        />
        {/* Track */}
        <div
          className={cn(
            trackWidth,
            trackHeight,
            "rounded-full transition-colors duration-150 ease-out",
            "bg-gray-200 dark:bg-gray-700",
            "peer-checked:bg-accent-primary",
            "peer-focus-visible:ring-2 peer-focus-visible:ring-ring peer-focus-visible:ring-offset-2",
            "peer-disabled:opacity-50 peer-disabled:cursor-not-allowed",
          )}
        />
        {/* Thumb */}
        <div
          className={cn(
            "absolute top-1/2 left-0.5 -translate-y-1/2",
            thumbSize,
            "rounded-full bg-white shadow-sm",
            "transition-transform duration-150 ease-out",
            thumbTranslate,
            "peer-disabled:opacity-50",
          )}
        />
      </div>
    );

    if (!label) {
      return (
        <label
          className={cn(
            "inline-flex cursor-pointer",
            disabled && "cursor-not-allowed",
            className,
          )}
        >
          {toggle}
        </label>
      );
    }

    return (
      <label
        className={cn(
          "inline-flex items-center gap-2 cursor-pointer",
          disabled && "cursor-not-allowed opacity-50",
          className,
        )}
      >
        {labelPosition === "left" && (
          <span
            className={cn(
              "text-sm text-text-primary select-none",
              labelClassName,
            )}
          >
            {label}
          </span>
        )}
        {toggle}
        {labelPosition === "right" && (
          <span
            className={cn(
              "text-sm text-text-primary select-none",
              labelClassName,
            )}
          >
            {label}
          </span>
        )}
      </label>
    );
  },
);
Toggle.displayName = "Toggle";

export { Toggle };
