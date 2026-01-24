import * as React from "react";
import { Check, Minus } from "lucide-react";
import { cn } from "../../lib/utils";

/**
 * Checkbox Component
 *
 * Design System Specifications (FIGMA-DESIGN.md 5.4):
 * - Size: 18x18px
 * - Border Radius: radius.xs (2px)
 * - States: unchecked | checked | indeterminate | disabled
 * - Label: body.md, 8px left of checkbox
 */

export interface CheckboxProps extends Omit<
  React.InputHTMLAttributes<HTMLInputElement>,
  "type"
> {
  /** Label text for the checkbox */
  label?: string;
  /** Indeterminate state (shows dash instead of checkmark) */
  indeterminate?: boolean;
  /** Additional class for the label */
  labelClassName?: string;
}

const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  (
    {
      className,
      label,
      indeterminate = false,
      disabled,
      labelClassName,
      ...props
    },
    ref,
  ) => {
    const inputRef = React.useRef<HTMLInputElement>(null);

    // Handle indeterminate state via ref
    React.useEffect(() => {
      if (inputRef.current) {
        inputRef.current.indeterminate = indeterminate;
      }
    }, [indeterminate]);

    // Merge refs
    React.useImperativeHandle(ref, () => inputRef.current as HTMLInputElement);

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
            type="checkbox"
            ref={inputRef}
            disabled={disabled}
            className="peer sr-only"
            {...props}
          />
          {/* Custom checkbox visual */}
          <div
            className={cn(
              "w-[18px] h-[18px] rounded-radius-xs border transition-all duration-150",
              "border-border-default bg-transparent",
              "peer-checked:bg-accent-primary peer-checked:border-accent-primary",
              "peer-indeterminate:bg-accent-primary peer-indeterminate:border-accent-primary",
              "peer-focus-visible:ring-2 peer-focus-visible:ring-ring peer-focus-visible:ring-offset-2",
              "peer-disabled:opacity-50 peer-disabled:cursor-not-allowed",
            )}
          />
          {/* Check icon */}
          <Check
            className={cn(
              "absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3 h-3 text-text-inverse",
              "opacity-0 peer-checked:opacity-100 transition-opacity duration-150",
              indeterminate && "opacity-0",
            )}
          />
          {/* Indeterminate icon (dash) */}
          <Minus
            className={cn(
              "absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3 h-3 text-text-inverse",
              "opacity-0 transition-opacity duration-150",
              indeterminate && "opacity-100",
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
Checkbox.displayName = "Checkbox";

export { Checkbox };
