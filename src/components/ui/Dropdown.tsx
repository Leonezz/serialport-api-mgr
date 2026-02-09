import * as React from "react";
import * as SelectPrimitive from "@radix-ui/react-select";
import { cva } from "class-variance-authority";
import { ChevronDown, Check } from "lucide-react";
import { cn } from "../../lib/utils";

/**
 * Dropdown Component
 *
 * Design System Specifications (FIGMA-DESIGN.md 5.3):
 *
 * Trigger:
 * - Chevron icon on right (16px)
 * - Selected value displayed
 * - Same dimensions as Input (sm: 32px, md: 36px)
 *
 * Menu:
 * - Background: bg.elevated
 * - Border: 1px border.default
 * - Shadow: shadow.md
 * - Border radius: radius.md (8px)
 * - Max height: 300px (scrollable)
 *
 * Menu Item:
 * - Height: 36px
 * - Padding: 8px 12px
 * - States: default | hover (bg.hover) | selected (bg.selected, checkmark)
 *
 * Built on @radix-ui/react-select for keyboard navigation,
 * click-outside, escape, portal rendering, and accessibility.
 */

// ============================================================================
// Types
// ============================================================================

export interface DropdownOption<T = string> {
  value: T;
  label: string;
  disabled?: boolean;
  icon?: React.ReactNode;
  description?: string;
}

export interface DropdownProps<T = string> {
  /** Options to display in the dropdown */
  options: DropdownOption<T>[];
  /** Currently selected value */
  value?: T;
  /** Callback when selection changes */
  onChange?: (value: T) => void;
  /** Placeholder text when no value selected */
  placeholder?: string;
  /** Size variant */
  size?: "sm" | "md";
  /** Error state */
  error?: boolean;
  /** Disabled state */
  disabled?: boolean;
  /** Additional className for trigger */
  className?: string;
  /** Additional className for menu */
  menuClassName?: string;
  /** Full width */
  fullWidth?: boolean;
  /** Minimum width for menu (defaults to trigger width) */
  menuMinWidth?: number;
  /** Align menu to trigger */
  align?: "start" | "center" | "end";
  /** ID for accessibility */
  id?: string;
  /** Name for form submission */
  name?: string;
  /** aria-label for accessibility */
  "aria-label"?: string;
}

// ============================================================================
// Styles
// ============================================================================

const triggerVariants = cva(
  [
    "flex w-full items-center justify-between gap-2",
    "bg-bg-input text-text-primary",
    "border transition-all duration-200",
    "cursor-pointer select-none",
    "disabled:cursor-not-allowed disabled:opacity-60 disabled:bg-bg-muted",
  ].join(" "),
  {
    variants: {
      size: {
        sm: "h-8 px-3 text-sm rounded-radius-sm",
        md: "h-9 px-3 text-sm rounded-radius-sm",
      },
      state: {
        default:
          "border-border-default hover:border-border-hover focus:border-border-focus focus:shadow-focus focus:outline-none",
        error:
          "border-border-error focus:border-border-error focus:shadow-error focus:outline-none",
      },
    },
    defaultVariants: {
      size: "md",
      state: "default",
    },
  },
);

// ============================================================================
// Component
// ============================================================================

// Radix Select treats empty string as "no selection", so we map empty-string
// option values to/from a sentinel. These two functions handle the conversion.
const EMPTY_SENTINEL = "__dropdown_empty__";

function toRadixValue(val: unknown): string {
  const s = String(val);
  return s === "" ? EMPTY_SENTINEL : s;
}

function fromRadixValue<T>(
  radixVal: string,
  options: DropdownOption<T>[],
): T | undefined {
  const matchVal = radixVal === EMPTY_SENTINEL ? "" : radixVal;
  return options.find((opt) => String(opt.value) === matchVal)?.value;
}

function DropdownInner<T = string>(
  {
    options,
    value,
    onChange,
    placeholder = "Select...",
    size = "md",
    error = false,
    disabled = false,
    className,
    menuClassName,
    fullWidth = true,
    menuMinWidth,
    align = "start",
    id,
    name,
    "aria-label": ariaLabel,
  }: DropdownProps<T>,
  ref: React.ForwardedRef<HTMLButtonElement>,
) {
  const stringValue = value !== undefined ? toRadixValue(value) : undefined;

  const handleValueChange = (newValue: string) => {
    const resolved = fromRadixValue(newValue, options);
    if (resolved !== undefined) {
      onChange?.(resolved);
    }
  };

  const selectedOption = options.find((opt) => opt.value === value);

  return (
    <SelectPrimitive.Root
      value={stringValue}
      onValueChange={handleValueChange}
      disabled={disabled}
      name={name}
    >
      <SelectPrimitive.Trigger
        ref={ref}
        id={id}
        aria-label={ariaLabel}
        className={cn(
          triggerVariants({ size, state: error ? "error" : "default" }),
          "data-[state=open]:border-border-focus data-[state=open]:shadow-focus data-[state=open]:outline-none",
          fullWidth && "w-full",
          className,
        )}
      >
        <span
          className={cn(
            "truncate flex-1 text-left",
            !selectedOption && "text-text-muted",
          )}
        >
          <span className="flex items-center gap-2">
            {selectedOption?.icon}
            <SelectPrimitive.Value placeholder={placeholder} />
          </span>
        </span>
        <SelectPrimitive.Icon asChild>
          <ChevronDown className="h-4 w-4 text-text-muted shrink-0 transition-transform duration-200 in-data-[state=open]:rotate-180" />
        </SelectPrimitive.Icon>
      </SelectPrimitive.Trigger>

      <SelectPrimitive.Portal>
        <SelectPrimitive.Content
          position="popper"
          sideOffset={4}
          align={align}
          className={cn(
            "z-[100]",
            "bg-bg-elevated border border-border-default",
            "shadow-md rounded-radius-md",
            "max-h-[300px] overflow-y-auto",
            "py-1",
            "animate-in fade-in-0 zoom-in-95 duration-150",
            menuClassName,
          )}
          style={{
            minWidth: menuMinWidth ?? "var(--radix-select-trigger-width)",
          }}
        >
          <SelectPrimitive.Viewport>
            {options.map((option) => (
              <SelectPrimitive.Item
                key={toRadixValue(option.value)}
                value={toRadixValue(option.value)}
                disabled={option.disabled}
                className={cn(
                  "flex items-center gap-2 w-full",
                  "h-9 px-3 text-sm text-left",
                  "cursor-pointer select-none",
                  "transition-colors duration-100",
                  "data-[highlighted]:bg-bg-hover",
                  "data-[state=checked]:bg-bg-selected data-[state=checked]:text-accent-primary data-[state=checked]:font-medium",
                  "data-[disabled]:opacity-50 data-[disabled]:cursor-not-allowed",
                  "outline-none",
                )}
              >
                {option.icon && (
                  <span className="shrink-0 w-4 h-4">{option.icon}</span>
                )}
                <SelectPrimitive.ItemText className="flex-1 truncate">
                  {option.label}
                </SelectPrimitive.ItemText>
                {option.description && (
                  <span className="text-xs text-text-muted truncate">
                    {option.description}
                  </span>
                )}
                <SelectPrimitive.ItemIndicator>
                  <Check className="h-4 w-4 shrink-0 text-accent-primary" />
                </SelectPrimitive.ItemIndicator>
              </SelectPrimitive.Item>
            ))}
          </SelectPrimitive.Viewport>
        </SelectPrimitive.Content>
      </SelectPrimitive.Portal>
    </SelectPrimitive.Root>
  );
}

// Forward ref with generic support
export const Dropdown = React.forwardRef(DropdownInner) as <T = string>(
  props: DropdownProps<T> & { ref?: React.ForwardedRef<HTMLButtonElement> },
) => React.ReactElement;

(Dropdown as React.FC).displayName = "Dropdown";

export { triggerVariants as dropdownTriggerVariants };
