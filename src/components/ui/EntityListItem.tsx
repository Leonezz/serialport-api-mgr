import * as React from "react";
import {
  PlugZap,
  FileCode2,
  TerminalSquare,
  Workflow,
  Play,
  MoreVertical,
  type LucideIcon,
} from "lucide-react";
import { cn } from "../../lib/utils";
import { Button } from "./Button";

/**
 * EntityListItem Component
 *
 * Design System Specifications (FIGMA-DESIGN.md 7.1):
 * - Height: 48px (single line) | 60px (with subtitle)
 * - Padding: 12px 16px
 * - Border Radius: radius.md (inside list)
 * - 3px left border when selected
 * - Entity type specific colors and icons
 *
 * Uses unified design tokens:
 * - Entity selected states: .entity-{type}-selected (defined in index.css)
 * - Entity colors: text-entity-{type}, bg-entity-{type}-bg
 */

export type EntityType = "device" | "protocol" | "command" | "sequence";

export interface EntityListItemProps {
  /** Entity type determines icon and colors */
  type: EntityType;
  /** Entity name */
  name: string;
  /** Optional subtitle (increases height to 60px) */
  subtitle?: string;
  /** Whether this item is selected */
  selected?: boolean;
  /** Whether this item is active/running */
  active?: boolean;
  /** Show run button (for commands and sequences) */
  showRunButton?: boolean;
  /** Show more button */
  showMoreButton?: boolean;
  /** Called when item is clicked */
  onClick?: () => void;
  /** Called when run button is clicked */
  onRun?: () => void;
  /** Called when more button is clicked */
  onMore?: () => void;
  /** Additional className */
  className?: string;
}

const entityConfig: Record<
  EntityType,
  {
    icon: LucideIcon;
    iconColor: string;
    selectedClass: string;
  }
> = {
  device: {
    icon: PlugZap,
    iconColor: "text-entity-device",
    selectedClass: "entity-device-selected",
  },
  protocol: {
    icon: FileCode2,
    iconColor: "text-entity-protocol",
    selectedClass: "entity-protocol-selected",
  },
  command: {
    icon: TerminalSquare,
    iconColor: "text-entity-command",
    selectedClass: "entity-command-selected",
  },
  sequence: {
    icon: Workflow,
    iconColor: "text-entity-sequence",
    selectedClass: "entity-sequence-selected",
  },
};

const EntityListItem: React.FC<EntityListItemProps> = ({
  type,
  name,
  subtitle,
  selected = false,
  active = false,
  showRunButton = false,
  showMoreButton = true,
  onClick,
  onRun,
  onMore,
  className,
}) => {
  const [isHovered, setIsHovered] = React.useState(false);
  const config = entityConfig[type];
  const Icon = config.icon;
  const hasSubtitle = !!subtitle;

  return (
    <div
      className={cn(
        "group relative flex items-center gap-3 px-4 py-3 cursor-pointer transition-micro",
        "rounded-radius-md",
        hasSubtitle ? "min-h-[60px]" : "min-h-[48px]",
        // Default state
        !selected && !active && "bg-transparent hover:bg-bg-hover",
        // Selected state - uses CSS utility from index.css
        selected && config.selectedClass,
        // Active/Running state
        active && !selected && "bg-entity-sequence-bg",
        className,
      )}
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Active indicator (pulsing dot) */}
      {active && (
        <span className="absolute left-2 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-status-success animate-status-pulse" />
      )}

      {/* Icon */}
      <Icon className={cn("w-5 h-5 flex-shrink-0", config.iconColor)} />

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p className="text-body-sm font-medium text-text-primary truncate">
          {name}
        </p>
        {subtitle && (
          <p className="text-label-sm text-text-muted truncate">{subtitle}</p>
        )}
      </div>

      {/* Action buttons (shown on hover) */}
      <div
        className={cn(
          "flex items-center gap-1 transition-opacity",
          isHovered || selected ? "opacity-100" : "opacity-0",
        )}
      >
        {showRunButton && (
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={(e) => {
              e.stopPropagation();
              onRun?.();
            }}
            aria-label={`Run ${name}`}
          >
            <Play className="w-4 h-4" />
          </Button>
        )}
        {showMoreButton && (
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={(e) => {
              e.stopPropagation();
              onMore?.();
            }}
            aria-label={`More options for ${name}`}
          >
            <MoreVertical className="w-4 h-4" />
          </Button>
        )}
      </div>
    </div>
  );
};

EntityListItem.displayName = "EntityListItem";

export { EntityListItem };
