import * as React from "react";
import { cva } from "class-variance-authority";
import { cn } from "../../lib/utils";

/**
 * Input Component
 *
 * Design System Specifications (FIGMA-DESIGN.md 5.2):
 * - Sizes: sm (32px) | md (36px)
 * - States: default | focus | error | disabled
 * - Supports prefix/suffix icons or elements
 */

const inputVariants = cva(
  // Base styles
  "flex w-full bg-bg-input text-text-primary placeholder:text-text-muted file:border-0 file:bg-transparent file:text-sm file:font-medium focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-60 disabled:bg-bg-muted transition-[border-color,box-shadow,background-color] duration-200",
  {
    variants: {
      size: {
        // sm: 32px height, 8px 12px padding, body.sm font
        sm: "h-8 px-3 py-2 text-sm rounded-radius-sm",
        // md: 36px height, 8px 12px padding, body.md font
        md: "h-9 px-3 py-2 text-sm rounded-radius-sm",
        // Default (alias for md)
        default: "h-9 px-3 py-2 text-sm rounded-radius-sm",
      },
      state: {
        default:
          "border border-border-default/60 hover:border-border-hover focus:border-border-focus focus:shadow-focus",
        error:
          "border border-border-error focus:border-border-error focus:shadow-error",
      },
    },
    defaultVariants: {
      size: "md",
      state: "default",
    },
  },
);

export interface InputProps extends Omit<
  React.InputHTMLAttributes<HTMLInputElement>,
  "size" | "prefix"
> {
  /** Size variant */
  inputSize?: "sm" | "md" | "default";
  /** Error state */
  error?: boolean;
  /** Element to show before input (icon or text) */
  startAdornment?: React.ReactNode;
  /** Element to show after input (icon or button) */
  endAdornment?: React.ReactNode;
  /** Helper text shown below input */
  helperText?: string;
  /** Error message shown below input (overrides helperText) */
  errorMessage?: string;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    {
      className,
      type,
      inputSize = "md",
      error = false,
      startAdornment,
      endAdornment,
      helperText,
      errorMessage,
      ...props
    },
    ref,
  ) => {
    const hasAdornments = startAdornment || endAdornment;
    const state = error ? "error" : "default";
    const message = error && errorMessage ? errorMessage : helperText;

    if (hasAdornments) {
      return (
        <div className="w-full">
          <div
            className={cn(
              "flex items-center gap-2",
              inputVariants({ size: inputSize, state }),
              "focus-within:border-border-focus focus-within:shadow-focus",
              error &&
                "focus-within:border-border-error focus-within:shadow-error",
              className,
            )}
          >
            {startAdornment && (
              <span className="flex-shrink-0 text-text-muted">
                {startAdornment}
              </span>
            )}
            <input
              type={type}
              className="flex-1 bg-transparent outline-none placeholder:text-text-muted min-w-0"
              ref={ref}
              {...props}
            />
            {endAdornment && (
              <span className="flex-shrink-0 text-text-muted">
                {endAdornment}
              </span>
            )}
          </div>
          {message && (
            <p
              className={cn(
                "mt-1.5 text-xs",
                error ? "text-status-error" : "text-text-muted",
              )}
            >
              {message}
            </p>
          )}
        </div>
      );
    }

    return (
      <div className="w-full">
        <input
          type={type}
          className={cn(inputVariants({ size: inputSize, state }), className)}
          ref={ref}
          {...props}
        />
        {message && (
          <p
            className={cn(
              "mt-1.5 text-xs",
              error ? "text-status-error" : "text-text-muted",
            )}
          >
            {message}
          </p>
        )}
      </div>
    );
  },
);
Input.displayName = "Input";

export { Input, inputVariants };
