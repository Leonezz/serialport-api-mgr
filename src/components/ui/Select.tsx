import * as React from "react";
import { cva } from "class-variance-authority";
import { ChevronDown } from "lucide-react";
import { cn } from "../../lib/utils";
import { Dropdown, DropdownOption } from "./Dropdown";

/**
 * Select Component (Native)
 *
 * Design System Specifications (FIGMA-DESIGN.md 5.3):
 * - Same dimensions as Input
 * - Sizes: sm (32px) | md (36px)
 * - States: default | focus | error | disabled
 * - Chevron icon on right (16px)
 *
 * This component uses native HTML select for maximum accessibility.
 * For custom-styled dropdowns, use SelectDropdown instead.
 */

const selectVariants = cva(
  // Base styles
  "flex w-full items-center justify-between bg-bg-input text-text-primary appearance-none cursor-pointer disabled:cursor-not-allowed disabled:opacity-60 disabled:bg-bg-muted transition-[border-color,box-shadow,background-color] duration-200",
  {
    variants: {
      size: {
        // sm: 32px height
        sm: "h-8 pl-3 pr-8 py-2 text-sm rounded-radius-sm",
        // md: 36px height
        md: "h-9 pl-3 pr-8 py-2 text-sm rounded-radius-sm",
        // Default (alias for md)
        default: "h-9 pl-3 pr-8 py-2 text-sm rounded-radius-sm",
      },
      state: {
        default:
          "border border-border-default/60 hover:border-border-hover focus:border-border-focus focus:shadow-focus focus:outline-none",
        error:
          "border border-border-error focus:border-border-error focus:shadow-error focus:outline-none",
      },
    },
    defaultVariants: {
      size: "md",
      state: "default",
    },
  },
);

export interface SelectProps extends Omit<
  React.SelectHTMLAttributes<HTMLSelectElement>,
  "size"
> {
  /** Size variant */
  selectSize?: "sm" | "md" | "default";
  /** Error state */
  error?: boolean;
  /** Helper text shown below select */
  helperText?: string;
  /** Error message shown below select (overrides helperText) */
  errorMessage?: string;
}

const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  (
    {
      className,
      children,
      selectSize = "md",
      error = false,
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
        <div className="relative">
          <select
            className={cn(
              selectVariants({ size: selectSize, state }),
              "truncate",
              className,
            )}
            ref={ref}
            {...props}
          >
            {children}
          </select>
          <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted pointer-events-none" />
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
  },
);
Select.displayName = "Select";

/**
 * SelectDropdown Component
 *
 * Custom styled dropdown following FIGMA-DESIGN.md 5.3 spec:
 * - Custom menu with bg.elevated, shadow.md, max-height 300px
 * - Menu items with hover (bg.hover), selected (bg.selected, checkmark)
 * - Full keyboard navigation support
 *
 * Use this when you need:
 * - Custom option rendering (icons, descriptions)
 * - Consistent cross-browser styling
 * - More control over dropdown appearance
 */
export interface SelectDropdownProps<T = string> {
  /** Options to display */
  options: DropdownOption<T>[];
  /** Currently selected value */
  value?: T;
  /** Callback when selection changes */
  onChange?: (value: T) => void;
  /** Placeholder when no value */
  placeholder?: string;
  /** Size variant */
  size?: "sm" | "md";
  /** Error state */
  error?: boolean;
  /** Disabled state */
  disabled?: boolean;
  /** Helper text shown below */
  helperText?: string;
  /** Error message (overrides helperText) */
  errorMessage?: string;
  /** Additional className */
  className?: string;
  /** Minimum width for dropdown menu in pixels */
  menuMinWidth?: number;
  /** ID for accessibility */
  id?: string;
  /** Name for form submission */
  name?: string;
  /** aria-label */
  "aria-label"?: string;
}

function SelectDropdownInner<T = string>(
  {
    options,
    value,
    onChange,
    placeholder = "Select...",
    size = "md",
    error = false,
    disabled = false,
    helperText,
    errorMessage,
    className,
    menuMinWidth,
    id,
    name,
    "aria-label": ariaLabel,
  }: SelectDropdownProps<T>,
  ref: React.ForwardedRef<HTMLButtonElement>,
) {
  const message = error && errorMessage ? errorMessage : helperText;

  return (
    <div className="w-full">
      <Dropdown
        ref={ref}
        options={options}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        size={size}
        error={error}
        disabled={disabled}
        className={className}
        menuMinWidth={menuMinWidth}
        id={id}
        name={name}
        aria-label={ariaLabel}
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
}

export const SelectDropdown = React.forwardRef(SelectDropdownInner) as <
  T = string,
>(
  props: SelectDropdownProps<T> & {
    ref?: React.ForwardedRef<HTMLButtonElement>;
  },
) => React.ReactElement;

(SelectDropdown as React.FC).displayName = "SelectDropdown";

export { Select, selectVariants };
