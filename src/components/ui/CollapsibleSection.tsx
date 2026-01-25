import * as React from "react";
import { useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import { cn } from "../../lib/utils";

/**
 * CollapsibleSection Component
 *
 * A reusable collapsible/expandable section with header and content.
 * Used in Sidebar, RightSidebar panels, and various editor views.
 */

export interface CollapsibleSectionProps {
  /** Section title displayed in header */
  title: string;
  /** Optional icon displayed before title */
  icon?: React.ReactNode;
  /** Whether section is expanded by default */
  defaultExpanded?: boolean;
  /** Controlled expanded state */
  expanded?: boolean;
  /** Callback when expanded state changes */
  onExpandedChange?: (expanded: boolean) => void;
  /** Section content */
  children: React.ReactNode;
  /** Additional class for the container */
  className?: string;
  /** Additional class for the header */
  headerClassName?: string;
  /** Additional class for the content */
  contentClassName?: string;
  /** Optional right-side actions in header */
  actions?: React.ReactNode;
  /** Optional badge/count displayed in header */
  badge?: React.ReactNode;
  /** Disable the section (prevent collapse/expand) */
  disabled?: boolean;
  /** Variant styling */
  variant?: "default" | "compact" | "card";
}

const CollapsibleSection: React.FC<CollapsibleSectionProps> = ({
  title,
  icon,
  defaultExpanded = true,
  expanded: controlledExpanded,
  onExpandedChange,
  children,
  className,
  headerClassName,
  contentClassName,
  actions,
  badge,
  disabled = false,
  variant = "default",
}) => {
  // Uncontrolled state
  const [internalExpanded, setInternalExpanded] = useState(defaultExpanded);

  // Use controlled or uncontrolled
  const isControlled = controlledExpanded !== undefined;
  const expanded = isControlled ? controlledExpanded : internalExpanded;

  const handleToggle = () => {
    if (disabled) return;

    const newExpanded = !expanded;
    if (!isControlled) {
      setInternalExpanded(newExpanded);
    }
    onExpandedChange?.(newExpanded);
  };

  const variantStyles = {
    default: {
      container: "",
      header:
        "flex items-center gap-2 py-2 px-1 cursor-pointer select-none hover:bg-surface-hover rounded transition-colors",
      content: "pl-6",
    },
    compact: {
      container: "",
      header:
        "flex items-center gap-1.5 py-1 px-1 cursor-pointer select-none hover:bg-surface-hover rounded transition-colors text-sm",
      content: "pl-5",
    },
    card: {
      container: "border border-border rounded-lg overflow-hidden",
      header:
        "flex items-center gap-2 p-3 cursor-pointer select-none hover:bg-surface-hover bg-surface-secondary transition-colors",
      content: "p-3 pt-0",
    },
  };

  const styles = variantStyles[variant];

  return (
    <div className={cn(styles.container, className)}>
      <div
        role="button"
        tabIndex={disabled ? -1 : 0}
        aria-expanded={expanded}
        aria-disabled={disabled}
        onClick={handleToggle}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            handleToggle();
          }
        }}
        className={cn(
          styles.header,
          disabled && "opacity-50 cursor-not-allowed",
          headerClassName,
        )}
      >
        {/* Chevron indicator */}
        <span className="shrink-0 text-text-muted">
          {expanded ? (
            <ChevronDown className="w-4 h-4" />
          ) : (
            <ChevronRight className="w-4 h-4" />
          )}
        </span>

        {/* Icon */}
        {icon && <span className="shrink-0 text-text-muted">{icon}</span>}

        {/* Title */}
        <span className="flex-1 font-medium text-text-primary truncate">
          {title}
        </span>

        {/* Badge */}
        {badge && <span className="shrink-0">{badge}</span>}

        {/* Actions (stop propagation to prevent toggle) */}
        {actions && (
          <span
            className="shrink-0 flex items-center gap-1"
            onClick={(e) => e.stopPropagation()}
            onKeyDown={(e) => e.stopPropagation()}
          >
            {actions}
          </span>
        )}
      </div>

      {/* Content */}
      {expanded && (
        <div
          className={cn(
            "animate-in fade-in-0 slide-in-from-top-1 duration-200",
            styles.content,
            contentClassName,
          )}
        >
          {children}
        </div>
      )}
    </div>
  );
};

CollapsibleSection.displayName = "CollapsibleSection";

export { CollapsibleSection };
