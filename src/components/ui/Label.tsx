import * as React from "react";
import { cva } from "class-variance-authority";
import { cn } from "../../lib/utils";

/**
 * Label Component
 *
 * Design System Specifications:
 * - Uses label.md typography (11px, 500 weight, tracking-wide)
 * - Supports required indicator
 * - Supports description text
 */

const labelVariants = cva(
  "text-sm font-medium leading-none select-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70",
  {
    variants: {
      size: {
        sm: "text-xs",
        md: "text-sm",
        default: "text-sm",
      },
    },
    defaultVariants: {
      size: "md",
    },
  },
);

export interface LabelProps extends React.LabelHTMLAttributes<HTMLLabelElement> {
  /** Size variant */
  size?: "sm" | "md" | "default";
  /** Show required indicator (*) */
  required?: boolean;
  /** Description text shown below label */
  description?: string;
}

const Label = React.forwardRef<HTMLLabelElement, LabelProps>(
  ({ className, size, required, description, children, ...props }, ref) => (
    <div className="flex flex-col gap-1">
      <label
        ref={ref}
        className={cn(labelVariants({ size }), "text-text-primary", className)}
        {...props}
      >
        {children}
        {required && (
          <span className="text-status-error ml-0.5" aria-hidden="true">
            *
          </span>
        )}
      </label>
      {description && (
        <span className="text-xs text-text-muted">{description}</span>
      )}
    </div>
  ),
);
Label.displayName = "Label";

export { Label, labelVariants };
