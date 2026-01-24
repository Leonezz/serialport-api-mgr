import * as React from "react";
import { cn } from "../../lib/utils";

/**
 * FormGroup Component
 *
 * Design System Specifications (FIGMA-DESIGN.md 6.6):
 * - Structure: Label -> Input -> Helper/Error
 * - Spacing: 4px between label and input, 4px between input and helper
 * - Label: label.md with optional required indicator and hint
 */

export interface FormGroupProps {
  /** Label text */
  label?: string;
  /** Show required indicator */
  required?: boolean;
  /** Optional hint text next to label */
  hint?: string;
  /** Helper text below input */
  helperText?: string;
  /** Error message (shown instead of helper when present) */
  error?: string;
  /** The form control (input, select, etc.) */
  children: React.ReactNode;
  /** Additional className for the wrapper */
  className?: string;
  /** htmlFor attribute for label */
  htmlFor?: string;
  /** Orientation */
  orientation?: "vertical" | "horizontal";
}

const FormGroup: React.FC<FormGroupProps> = ({
  label,
  required,
  hint,
  helperText,
  error,
  children,
  className,
  htmlFor,
  orientation = "vertical",
}) => {
  const hasError = !!error;
  const message = hasError ? error : helperText;

  if (orientation === "horizontal") {
    return (
      <div className={cn("flex items-center gap-4", className)}>
        {label && (
          <label
            htmlFor={htmlFor}
            className="text-sm font-medium text-text-primary min-w-[120px] flex-shrink-0"
          >
            {label}
            {required && (
              <span className="text-status-error ml-0.5" aria-hidden="true">
                *
              </span>
            )}
            {hint && (
              <span className="text-text-muted font-normal ml-2">({hint})</span>
            )}
          </label>
        )}
        <div className="flex-1 min-w-0">
          {children}
          {message && (
            <p
              className={cn(
                "mt-1 text-xs",
                hasError ? "text-status-error" : "text-text-muted",
              )}
            >
              {message}
            </p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={cn("flex flex-col gap-1", className)}>
      {label && (
        <div className="flex items-baseline justify-between">
          <label
            htmlFor={htmlFor}
            className="text-sm font-medium text-text-primary"
          >
            {label}
            {required && (
              <span className="text-status-error ml-0.5" aria-hidden="true">
                *
              </span>
            )}
          </label>
          {hint && <span className="text-xs text-text-muted">({hint})</span>}
        </div>
      )}
      {children}
      {message && (
        <p
          className={cn(
            "text-xs",
            hasError ? "text-status-error" : "text-text-muted",
          )}
        >
          {message}
        </p>
      )}
    </div>
  );
};

FormGroup.displayName = "FormGroup";

export { FormGroup };
