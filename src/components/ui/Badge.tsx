import * as React from "react";
import { cva } from "class-variance-authority";
import { cn } from "../../lib/utils";

/**
 * Badge Component
 *
 * Design System Specifications (FIGMA-DESIGN.md 5.7):
 * - Variants: default | success | warning | error | info | entity-type
 * - Sizes: sm (20px) | md (24px)
 * - Entity Type Badges: device | protocol | command | sequence
 */

const badgeVariants = cva(
  // Base styles
  "inline-flex items-center font-medium transition-colors",
  {
    variants: {
      variant: {
        // Default: neutral colors
        default: "bg-bg-muted text-text-secondary border border-border-default",
        // Success: green
        success:
          "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
        // Warning: amber
        warning:
          "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
        // Error: red
        error: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
        // Info: blue
        info: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
        // Entity: Device (purple)
        device:
          "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
        // Entity: Protocol (blue)
        protocol:
          "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
        // Entity: Command (amber)
        command:
          "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
        // Entity: Sequence (green)
        sequence:
          "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
        // Secondary (kept for compatibility)
        secondary: "bg-bg-muted text-text-secondary",
        // Destructive (kept for compatibility)
        destructive:
          "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
        // Outline (kept for compatibility)
        outline: "text-text-primary border border-border-default",
        // Primary (kept for compatibility)
        primary: "bg-accent-primary text-text-inverse",
      },
      size: {
        // sm: 20px height, 4px 6px padding, label.sm font
        sm: "h-5 px-1.5 text-xs rounded-radius-xs",
        // md: 24px height, 4px 8px padding, label.md font
        md: "h-6 px-2 text-xs rounded-radius-sm",
        // Default (alias for md)
        default: "h-6 px-2 text-xs rounded-radius-sm",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "md",
    },
  },
);

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?:
    | "default"
    | "success"
    | "warning"
    | "error"
    | "info"
    | "device"
    | "protocol"
    | "command"
    | "sequence"
    | "secondary"
    | "destructive"
    | "outline"
    | "primary"
    | null
    | undefined;
  size?: "sm" | "md" | "default" | null | undefined;
}

function Badge({ className, variant, size, ...props }: BadgeProps) {
  return (
    <div
      className={cn(badgeVariants({ variant, size }), className)}
      {...props}
    />
  );
}

export { Badge, badgeVariants };
