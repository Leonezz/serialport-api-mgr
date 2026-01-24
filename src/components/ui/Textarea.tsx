import * as React from "react";
import { cva } from "class-variance-authority";
import { cn } from "../../lib/utils";

/**
 * Textarea Component
 *
 * Design System Specifications:
 * - Follows same styling as Input
 * - States: default | focus | error | disabled
 * - Supports resize control
 */

const textareaVariants = cva(
  // Base styles
  "flex w-full bg-bg-input text-text-primary placeholder:text-text-muted transition-all duration-200 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-60 disabled:bg-bg-muted",
  {
    variants: {
      state: {
        default:
          "border border-border-default hover:border-border-hover focus:border-border-focus focus:shadow-focus",
        error:
          "border border-border-error focus:border-border-error focus:shadow-error",
      },
      resize: {
        none: "resize-none",
        vertical: "resize-y",
        horizontal: "resize-x",
        both: "resize",
      },
    },
    defaultVariants: {
      state: "default",
      resize: "vertical",
    },
  },
);

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  /** Error state */
  error?: boolean;
  /** Resize behavior */
  resize?: "none" | "vertical" | "horizontal" | "both";
  /** Helper text shown below textarea */
  helperText?: string;
  /** Error message shown below textarea (overrides helperText) */
  errorMessage?: string;
}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  (
    {
      className,
      error = false,
      resize = "vertical",
      helperText,
      errorMessage,
      ...props
    },
    ref,
  ) => {
    const state = error ? "error" : "default";
    const message = error && errorMessage ? errorMessage : helperText;

    return (
      <div className="w-full">
        <textarea
          className={cn(
            textareaVariants({ state, resize }),
            "min-h-[80px] px-3 py-2 text-sm rounded-radius-sm",
            className,
          )}
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
Textarea.displayName = "Textarea";

export { Textarea, textareaVariants };
