import * as React from "react";
import { ChevronDown, Plus } from "lucide-react";
import { cn } from "../../lib/utils";
import { Button } from "./Button";

/**
 * SectionHeader Component
 *
 * Design System Specifications (FIGMA-DESIGN.md 7.2):
 * - Height: 32px
 * - Padding: 0 16px
 * - Chevron rotates 90deg when collapsed
 * - Add button appears on hover
 * - Title: label.md, text.muted, UPPERCASE
 */

export interface SectionHeaderProps {
  /** Section title (will be uppercased) */
  title: string;
  /** Whether the section is collapsed */
  collapsed?: boolean;
  /** Toggle collapse state */
  onToggle?: () => void;
  /** Show add button */
  showAddButton?: boolean;
  /** Called when add button is clicked */
  onAdd?: () => void;
  /** Item count badge */
  count?: number;
  /** Additional className */
  className?: string;
}

const SectionHeader: React.FC<SectionHeaderProps> = ({
  title,
  collapsed = false,
  onToggle,
  showAddButton = true,
  onAdd,
  count,
  className,
}) => {
  const [isHovered, setIsHovered] = React.useState(false);

  return (
    <div
      className={cn(
        "group flex items-center h-8 px-4 cursor-pointer select-none",
        "hover:bg-bg-hover/50 transition-colors",
        className,
      )}
      onClick={onToggle}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Chevron */}
      <ChevronDown
        className={cn(
          "w-4 h-4 text-text-muted transition-transform mr-2",
          collapsed && "-rotate-90",
        )}
      />

      {/* Title */}
      <span className="text-xs font-medium text-text-muted uppercase tracking-wide flex-1">
        {title}
      </span>

      {/* Count badge */}
      {typeof count === "number" && (
        <span className="text-xs text-text-muted mr-2">{count}</span>
      )}

      {/* Add button (shown on hover) */}
      {showAddButton && (
        <Button
          variant="ghost"
          size="icon-sm"
          className={cn(
            "transition-opacity",
            isHovered ? "opacity-100" : "opacity-0",
          )}
          onClick={(e) => {
            e.stopPropagation();
            onAdd?.();
          }}
          aria-label={`Add ${title.toLowerCase()}`}
        >
          <Plus className="w-4 h-4" />
        </Button>
      )}
    </div>
  );
};

SectionHeader.displayName = "SectionHeader";

export { SectionHeader };
