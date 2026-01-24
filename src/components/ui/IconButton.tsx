import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../../lib/utils";

/**
 * IconButton Component
 *
 * Design System Specifications (FIGMA-DESIGN.md 5.1):
 * A compact button for icon-only interactions.
 * Used for micro-actions like edit, delete, collapse, etc.
 *
 * Sizes:
 * - xs: 24x24px (p-1) - Inline actions in lists
 * - sm: 28x28px (p-1.5) - Small toolbar buttons
 * - md: 32x32px (p-2) - Standard icon buttons
 * - lg: 36x36px (p-2.5) - Emphasized actions
 */

const iconButtonVariants = cva(
  // Base styles
  "inline-flex items-center justify-center rounded-radius-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        // Default: transparent, hover shows background
        default:
          "text-text-secondary hover:bg-bg-hover hover:text-text-primary active:bg-bg-active",
        // Ghost: More subtle, minimal hover effect
        ghost: "text-muted-foreground hover:bg-muted hover:text-foreground",
        // Primary: Accent colored
        primary:
          "text-accent-primary hover:bg-accent-primary/10 active:bg-accent-primary/20",
        // Destructive: Red tinted
        destructive:
          "text-status-error hover:bg-status-error/10 active:bg-status-error/20",
        // Solid: Filled background
        solid:
          "bg-accent-primary text-text-inverse hover:bg-accent-primary-hover active:brightness-90",
        // Outline: Border with transparent background
        outline:
          "border border-border-default text-text-secondary hover:bg-bg-hover hover:text-text-primary",
      },
      size: {
        // xs: 24x24px - Inline actions (reduced padding for larger icon)
        xs: "h-6 w-6 p-0.5 [&>svg]:w-4 [&>svg]:h-4",
        // sm: 28x28px - Small toolbar
        sm: "h-7 w-7 p-1 [&>svg]:w-4.5 [&>svg]:h-4.5",
        // md: 32x32px - Standard
        md: "h-8 w-8 p-1.5 [&>svg]:w-5 [&>svg]:h-5",
        // lg: 36x36px - Emphasized
        lg: "h-9 w-9 p-2 [&>svg]:w-5 [&>svg]:h-5",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "md",
    },
  },
);

export interface IconButtonProps
  extends
    React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof iconButtonVariants> {
  /** Accessible label for screen readers (required for icon-only buttons) */
  "aria-label": string;
}

const IconButton = React.forwardRef<HTMLButtonElement, IconButtonProps>(
  ({ className, variant, size, children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(iconButtonVariants({ variant, size, className }))}
        {...props}
      >
        {children}
      </button>
    );
  },
);
IconButton.displayName = "IconButton";

export { IconButton, iconButtonVariants };
