import * as React from "react";
import {
  PlugZap,
  FileCode2,
  TerminalSquare,
  Workflow,
  Monitor,
  Search,
  LucideIcon,
} from "lucide-react";
import { cn } from "../../lib/utils";
import { Button } from "./Button";

/**
 * EmptyState Component
 *
 * Design System Specifications (FIGMA-DESIGN.md Chapter 11):
 * - Icon: 48px, gray.300
 * - Title: heading.lg, text.secondary
 * - Description: body.md, text.muted, max 280px
 * - Primary Action Button
 */

export type EmptyStateVariant =
  | "devices"
  | "protocols"
  | "commands"
  | "sequences"
  | "console"
  | "search"
  | "custom";

interface EmptyStateConfig {
  icon: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
}

const variantConfig: Record<
  Exclude<EmptyStateVariant, "custom">,
  EmptyStateConfig
> = {
  devices: {
    icon: PlugZap,
    title: "No devices yet",
    description: "Add a device to start managing your serial connections",
    actionLabel: "+ Add Device",
  },
  protocols: {
    icon: FileCode2,
    title: "No protocols defined",
    description: "Create a protocol to define message formats and commands",
    actionLabel: "+ Create Protocol",
  },
  commands: {
    icon: TerminalSquare,
    title: "No commands saved",
    description: "Save frequently used commands for quick access",
    actionLabel: "+ Add Command",
  },
  sequences: {
    icon: Workflow,
    title: "No sequences created",
    description: "Create sequences to automate command workflows",
    actionLabel: "+ Create Sequence",
  },
  console: {
    icon: Monitor,
    title: "No messages yet",
    description: "Connect to a device to start capturing serial data",
    actionLabel: "Connect Device",
  },
  search: {
    icon: Search,
    title: "No results found",
    description: "Try a different search term",
    actionLabel: undefined,
  },
};

export interface EmptyStateProps {
  /** Variant determines icon, title, description, and action */
  variant?: EmptyStateVariant;
  /** Custom icon (for variant="custom") */
  icon?: LucideIcon;
  /** Custom title (overrides variant default) */
  title?: string;
  /** Custom description (overrides variant default) */
  description?: string;
  /** Custom action label (overrides variant default) */
  actionLabel?: string;
  /** Called when action button is clicked */
  onAction?: () => void;
  /** Hide the action button */
  hideAction?: boolean;
  /** Additional className */
  className?: string;
}

const EmptyState: React.FC<EmptyStateProps> = ({
  variant = "custom",
  icon: customIcon,
  title: customTitle,
  description: customDescription,
  actionLabel: customActionLabel,
  onAction,
  hideAction = false,
  className,
}) => {
  const config = variant !== "custom" ? variantConfig[variant] : null;

  const Icon = customIcon ?? config?.icon ?? Monitor;
  const title = customTitle ?? config?.title ?? "Nothing here";
  const description = customDescription ?? config?.description ?? "";
  const actionLabel = customActionLabel ?? config?.actionLabel;

  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center py-12 px-4",
        "text-center",
        className,
      )}
    >
      {/* Icon */}
      <div className="mb-4">
        <Icon className="w-12 h-12 text-gray-300" strokeWidth={1.5} />
      </div>

      {/* Title */}
      <h3 className="text-lg font-semibold text-text-secondary mb-2">
        {title}
      </h3>

      {/* Description */}
      <p className="text-sm text-text-muted max-w-[280px] mb-6">
        {description}
      </p>

      {/* Action Button */}
      {!hideAction && actionLabel && onAction && (
        <Button variant="primary" size="md" onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </div>
  );
};

EmptyState.displayName = "EmptyState";

export { EmptyState };
