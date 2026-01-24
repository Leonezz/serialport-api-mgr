import * as React from "react";
import { createPortal } from "react-dom";
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
        open: "border-border-focus shadow-focus outline-none",
      },
    },
    defaultVariants: {
      size: "md",
      state: "default",
    },
  },
);

const menuStyles = cn(
  "absolute z-[100]",
  "bg-bg-elevated border border-border-default",
  "shadow-md rounded-radius-md",
  "max-h-[300px] overflow-y-auto",
  "py-1",
  "animate-in fade-in-0 zoom-in-95 duration-150",
);

const itemStyles = cn(
  "flex items-center gap-2 w-full",
  "h-9 px-3 text-sm text-left",
  "cursor-pointer select-none",
  "transition-colors duration-100",
);

// ============================================================================
// Component
// ============================================================================

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
  const [isOpen, setIsOpen] = React.useState(false);
  const [highlightedIndex, setHighlightedIndex] = React.useState(-1);
  const triggerRef = React.useRef<HTMLButtonElement>(null);
  const menuRef = React.useRef<HTMLDivElement>(null);
  const [menuPosition, setMenuPosition] = React.useState({
    top: 0,
    left: 0,
    width: 0,
  });

  // Merge refs
  React.useImperativeHandle(ref, () => triggerRef.current!);

  const selectedOption = options.find((opt) => opt.value === value);
  const enabledOptions = options.filter((opt) => !opt.disabled);

  // Calculate menu position
  const updateMenuPosition = React.useCallback(() => {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    const menuWidth = menuMinWidth
      ? Math.max(rect.width, menuMinWidth)
      : rect.width;

    let left = rect.left;
    if (align === "center") {
      left = rect.left + (rect.width - menuWidth) / 2;
    } else if (align === "end") {
      left = rect.right - menuWidth;
    }

    setMenuPosition({
      top: rect.bottom + 4,
      left,
      width: menuWidth,
    });
  }, [align, menuMinWidth]);

  // Open/close handlers
  const open = React.useCallback(() => {
    if (disabled) return;
    updateMenuPosition();
    setIsOpen(true);
    setHighlightedIndex(
      selectedOption ? options.findIndex((opt) => opt.value === value) : 0,
    );
  }, [disabled, updateMenuPosition, selectedOption, options, value]);

  const close = React.useCallback(() => {
    setIsOpen(false);
    setHighlightedIndex(-1);
    triggerRef.current?.focus();
  }, []);

  const toggle = React.useCallback(() => {
    if (isOpen) close();
    else open();
  }, [isOpen, close, open]);

  // Selection handler
  const selectOption = React.useCallback(
    (option: DropdownOption<T>) => {
      if (option.disabled) return;
      onChange?.(option.value);
      close();
    },
    [onChange, close],
  );

  // Click outside handler
  React.useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      if (
        triggerRef.current?.contains(target) ||
        menuRef.current?.contains(target)
      ) {
        return;
      }
      close();
    };

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen, close]);

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (disabled) return;

    switch (e.key) {
      case "Enter":
      case " ":
        e.preventDefault();
        if (isOpen && highlightedIndex >= 0) {
          selectOption(options[highlightedIndex]);
        } else {
          toggle();
        }
        break;
      case "ArrowDown":
        e.preventDefault();
        if (!isOpen) {
          open();
        } else {
          const nextIndex = enabledOptions.findIndex(
            (opt, idx) =>
              options.indexOf(opt) > highlightedIndex ||
              (highlightedIndex === -1 && idx === 0),
          );
          if (nextIndex >= 0) {
            setHighlightedIndex(options.indexOf(enabledOptions[nextIndex]));
          }
        }
        break;
      case "ArrowUp":
        e.preventDefault();
        if (isOpen) {
          const prevOptions = enabledOptions.filter(
            (opt) => options.indexOf(opt) < highlightedIndex,
          );
          if (prevOptions.length > 0) {
            setHighlightedIndex(
              options.indexOf(prevOptions[prevOptions.length - 1]),
            );
          }
        }
        break;
      case "Home":
        e.preventDefault();
        if (isOpen && enabledOptions.length > 0) {
          setHighlightedIndex(options.indexOf(enabledOptions[0]));
        }
        break;
      case "End":
        e.preventDefault();
        if (isOpen && enabledOptions.length > 0) {
          setHighlightedIndex(
            options.indexOf(enabledOptions[enabledOptions.length - 1]),
          );
        }
        break;
      case "Tab":
        if (isOpen) close();
        break;
    }
  };

  // Scroll highlighted item into view
  React.useEffect(() => {
    if (!isOpen || highlightedIndex < 0 || !menuRef.current) return;
    const item = menuRef.current.children[highlightedIndex] as HTMLElement;
    if (item) {
      item.scrollIntoView({ block: "nearest" });
    }
  }, [isOpen, highlightedIndex]);

  // Update position on scroll/resize
  React.useEffect(() => {
    if (!isOpen) return;

    const handleUpdate = () => updateMenuPosition();
    window.addEventListener("scroll", handleUpdate, true);
    window.addEventListener("resize", handleUpdate);

    return () => {
      window.removeEventListener("scroll", handleUpdate, true);
      window.removeEventListener("resize", handleUpdate);
    };
  }, [isOpen, updateMenuPosition]);

  const state = error ? "error" : isOpen ? "open" : "default";

  return (
    <>
      {/* Hidden input for form submission */}
      {name && (
        <input
          type="hidden"
          name={name}
          value={value !== undefined ? String(value) : ""}
        />
      )}

      {/* Trigger Button */}
      <button
        ref={triggerRef}
        type="button"
        id={id}
        role="combobox"
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        aria-label={ariaLabel}
        aria-controls={isOpen ? `${id}-menu` : undefined}
        disabled={disabled}
        className={cn(
          triggerVariants({ size, state }),
          fullWidth && "w-full",
          className,
        )}
        onClick={toggle}
        onKeyDown={handleKeyDown}
      >
        <span
          className={cn(
            "truncate flex-1 text-left",
            !selectedOption && "text-text-muted",
          )}
        >
          {selectedOption ? (
            <span className="flex items-center gap-2">
              {selectedOption.icon}
              {selectedOption.label}
            </span>
          ) : (
            placeholder
          )}
        </span>
        <ChevronDown
          className={cn(
            "h-4 w-4 text-text-muted shrink-0 transition-transform duration-200",
            isOpen && "rotate-180",
          )}
        />
      </button>

      {/* Menu Portal */}
      {isOpen &&
        createPortal(
          <div
            ref={menuRef}
            id={`${id}-menu`}
            role="listbox"
            aria-labelledby={id}
            className={cn(menuStyles, menuClassName)}
            style={{
              top: menuPosition.top,
              left: menuPosition.left,
              width: menuPosition.width,
            }}
          >
            {options.map((option, index) => {
              const isSelected = option.value === value;
              const isHighlighted = index === highlightedIndex;
              const isDisabled = option.disabled;

              return (
                <div
                  key={String(option.value)}
                  role="option"
                  aria-selected={isSelected}
                  aria-disabled={isDisabled}
                  className={cn(
                    itemStyles,
                    isHighlighted && "bg-bg-hover",
                    isSelected &&
                      "bg-bg-selected text-accent-primary font-medium",
                    isDisabled && "opacity-50 cursor-not-allowed",
                  )}
                  onClick={() => !isDisabled && selectOption(option)}
                  onMouseEnter={() => !isDisabled && setHighlightedIndex(index)}
                >
                  {option.icon && (
                    <span className="shrink-0 w-4 h-4">{option.icon}</span>
                  )}
                  <span className="flex-1 truncate">{option.label}</span>
                  {option.description && (
                    <span className="text-xs text-text-muted truncate">
                      {option.description}
                    </span>
                  )}
                  {isSelected && (
                    <Check className="h-4 w-4 shrink-0 text-accent-primary" />
                  )}
                </div>
              );
            })}
          </div>,
          document.body,
        )}
    </>
  );
}

// Forward ref with generic support
export const Dropdown = React.forwardRef(DropdownInner) as <T = string>(
  props: DropdownProps<T> & { ref?: React.ForwardedRef<HTMLButtonElement> },
) => React.ReactElement;

(Dropdown as React.FC).displayName = "Dropdown";

export { triggerVariants as dropdownTriggerVariants };
