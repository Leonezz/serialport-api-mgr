import * as React from "react";
import { cn } from "../../lib/utils";
import { Input, InputProps } from "./Input";

/**
 * NumberInput Component
 *
 * Solves the "can't delete value" bug by storing value as string during editing.
 * Validates and converts to number on blur, shows error state if invalid,
 * and applies default value when appropriate.
 */

export interface NumberInputProps extends Omit<
  InputProps,
  "value" | "onChange" | "type"
> {
  /** Current numeric value */
  value: number | undefined;
  /** Callback when value changes (fires on blur with valid number) */
  onChange: (value: number | undefined) => void;
  /** Default value to use when input is empty on blur */
  defaultValue?: number;
  /** Minimum allowed value */
  min?: number;
  /** Maximum allowed value */
  max?: number;
  /** Whether to allow decimal values (default: false for integers) */
  allowDecimal?: boolean;
  /** Step value for increment/decrement */
  step?: number;
}

const NumberInput = React.forwardRef<HTMLInputElement, NumberInputProps>(
  (
    {
      value,
      onChange,
      defaultValue,
      min,
      max,
      allowDecimal = false,
      step: _step,
      className,
      helperText,
      errorMessage,
      error,
      onBlur,
      onFocus,
      ...props
    },
    ref,
  ) => {
    // Store string value during editing for natural input behavior
    const [editingValue, setEditingValue] = React.useState<string | null>(null);
    const [localError, setLocalError] = React.useState<string | undefined>();

    // Determine display value: editing string when focused, formatted number when not
    const displayValue =
      editingValue !== null
        ? editingValue
        : value !== undefined
          ? String(value)
          : "";

    // Validate a string value and return error message if invalid
    const validate = (strValue: string): string | undefined => {
      if (strValue === "" || strValue === "-") {
        return undefined; // Empty is valid (will use default on blur)
      }

      const num = allowDecimal ? parseFloat(strValue) : parseInt(strValue, 10);

      if (isNaN(num)) {
        return "Invalid number";
      }

      if (min !== undefined && num < min) {
        return `Minimum value is ${min}`;
      }

      if (max !== undefined && num > max) {
        return `Maximum value is ${max}`;
      }

      return undefined;
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = e.target.value;
      setEditingValue(newValue);

      // Live validation for immediate feedback
      const validationError = validate(newValue);
      setLocalError(validationError);
    };

    const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
      // Enter editing mode with current value as string
      setEditingValue(value !== undefined ? String(value) : "");
      setLocalError(undefined);
      onFocus?.(e);
    };

    const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
      const strValue = editingValue ?? "";

      if (strValue === "" || strValue === "-") {
        // Empty input - use default if provided, otherwise undefined
        onChange(defaultValue);
        setLocalError(undefined);
      } else {
        const num = allowDecimal
          ? parseFloat(strValue)
          : parseInt(strValue, 10);

        if (isNaN(num)) {
          // Invalid number - revert to previous value or default
          onChange(value ?? defaultValue);
          setLocalError(undefined);
        } else {
          // Valid number - clamp to min/max if specified
          let clampedNum = num;
          if (min !== undefined && clampedNum < min) clampedNum = min;
          if (max !== undefined && clampedNum > max) clampedNum = max;
          onChange(clampedNum);
          setLocalError(undefined);
        }
      }

      // Exit editing mode
      setEditingValue(null);
      onBlur?.(e);
    };

    const isError = error || !!localError;
    const displayError = errorMessage || localError;

    return (
      <Input
        ref={ref}
        type="text"
        inputMode={allowDecimal ? "decimal" : "numeric"}
        value={displayValue}
        onChange={handleChange}
        onFocus={handleFocus}
        onBlur={handleBlur}
        error={isError}
        errorMessage={displayError}
        helperText={helperText}
        className={cn("font-mono", className)}
        {...props}
      />
    );
  },
);

NumberInput.displayName = "NumberInput";

export { NumberInput };
