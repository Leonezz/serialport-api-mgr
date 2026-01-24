import * as React from "react";
import { cn } from "../../lib/utils";

/**
 * Radio Component
 *
 * Design System Specifications (FIGMA-DESIGN.md 5.5):
 * - Size: 18x18px (outer), 8px (inner dot)
 * - Border Radius: radius.full
 * - States: same as checkbox but with center dot
 */

export interface RadioProps extends Omit<
  React.InputHTMLAttributes<HTMLInputElement>,
  "type"
> {
  /** Label text for the radio */
  label?: string;
  /** Additional class for the label */
  labelClassName?: string;
}

const Radio = React.forwardRef<HTMLInputElement, RadioProps>(
  ({ className, label, disabled, labelClassName, ...props }, ref) => {
    return (
      <label
        className={cn(
          "inline-flex items-center gap-2 cursor-pointer",
          disabled && "cursor-not-allowed opacity-50",
          className,
        )}
      >
        <div className="relative">
          <input
            type="radio"
            ref={ref}
            disabled={disabled}
            className="peer sr-only"
            {...props}
          />
          {/* Custom radio visual */}
          <div
            className={cn(
              "w-[18px] h-[18px] rounded-full border transition-all duration-150",
              "border-border-default bg-transparent",
              "peer-checked:border-accent-primary",
              "peer-focus-visible:ring-2 peer-focus-visible:ring-ring peer-focus-visible:ring-offset-2",
              "peer-disabled:opacity-50 peer-disabled:cursor-not-allowed",
            )}
          />
          {/* Inner dot */}
          <div
            className={cn(
              "absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2",
              "w-2 h-2 rounded-full bg-accent-primary",
              "scale-0 peer-checked:scale-100 transition-transform duration-150",
            )}
          />
        </div>
        {label && (
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
Radio.displayName = "Radio";

/**
 * Radio Group Component
 * Container for grouping radio buttons
 */
export interface RadioGroupProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Name attribute for all radios in the group */
  name: string;
  /** Current selected value */
  value?: string;
  /** Callback when selection changes */
  onValueChange?: (value: string) => void;
  /** Layout direction */
  orientation?: "horizontal" | "vertical";
}

const RadioGroup = React.forwardRef<HTMLDivElement, RadioGroupProps>(
  (
    {
      className,
      name,
      value,
      onValueChange,
      orientation = "vertical",
      children,
      ...props
    },
    ref,
  ) => {
    return (
      <div
        ref={ref}
        role="radiogroup"
        className={cn(
          "flex",
          orientation === "vertical" ? "flex-col gap-2" : "flex-row gap-4",
          className,
        )}
        {...props}
      >
        {React.Children.map(children, (child) => {
          if (React.isValidElement<RadioProps>(child)) {
            return React.cloneElement(child, {
              name,
              checked: child.props.value === value,
              onChange: (e: React.ChangeEvent<HTMLInputElement>) => {
                if (e.target.checked && onValueChange) {
                  onValueChange(e.target.value);
                }
                child.props.onChange?.(e);
              },
            });
          }
          return child;
        })}
      </div>
    );
  },
);
RadioGroup.displayName = "RadioGroup";

export { Radio, RadioGroup };
