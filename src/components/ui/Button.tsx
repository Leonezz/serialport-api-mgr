import * as React from "react";
import { cva } from "class-variance-authority";
import { Loader2 } from "lucide-react";
import { cn } from "../../lib/utils";

/**
 * Button Component
 *
 * Design System Specifications (FIGMA-DESIGN.md 5.1):
 * - Variants: primary | secondary | ghost | destructive
 * - Sizes: sm (32px) | md (36px) | lg (44px)
 * - States: default | hover | active | disabled | loading
 * - Icon positions: none | left | right | only
 */

const buttonVariants = cva(
  // Base styles
  "inline-flex items-center justify-center whitespace-nowrap font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        // Primary: accent.primary bg, text.inverse
        primary:
          "bg-accent-primary text-text-inverse hover:bg-accent-primary-hover active:brightness-90",
        // Secondary: transparent bg, border.default, text.primary
        secondary:
          "border border-border-default bg-transparent text-text-primary hover:bg-bg-hover active:bg-bg-active",
        // Ghost: transparent bg, text.secondary, 12px padding per spec
        ghost:
          "bg-transparent text-text-secondary hover:bg-bg-hover hover:text-text-primary active:bg-bg-active",
        // Destructive: red.500 bg, text.inverse
        destructive:
          "bg-status-error text-text-inverse hover:bg-red-600 active:bg-red-700",
        // Link variant (kept for compatibility)
        link: "text-accent-primary underline-offset-4 hover:underline",
        // Outline variant (alias for secondary, kept for compatibility)
        outline:
          "border border-border-default bg-transparent text-text-primary hover:bg-bg-hover active:bg-bg-active",
        // Default variant (alias for primary)
        default:
          "bg-accent-primary text-text-inverse hover:bg-accent-primary-hover active:brightness-90",
      },
      size: {
        // sm: 32px height, 12px horizontal padding, body.sm (12px) font
        sm: "h-8 px-3 text-xs rounded-radius-sm gap-1.5",
        // md: 36px height, 16px horizontal padding, body.md (14px) font
        md: "h-9 px-4 text-sm rounded-radius-sm gap-2",
        // lg: 44px height, 20px horizontal padding, body.md (14px) + 600 font
        lg: "h-11 px-5 text-sm font-semibold rounded-radius-md gap-2",
        // Icon only: square buttons
        icon: "h-9 w-9 rounded-radius-sm",
        "icon-sm": "h-8 w-8 rounded-radius-sm",
        "icon-lg": "h-11 w-11 rounded-radius-md",
        // Default (alias for md)
        default: "h-9 px-4 text-sm rounded-radius-sm gap-2",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
    },
  },
);

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  asChild?: boolean;
  variant?:
    | "primary"
    | "secondary"
    | "ghost"
    | "destructive"
    | "link"
    | "outline"
    | "default"
    | null
    | undefined;
  size?:
    | "sm"
    | "md"
    | "lg"
    | "icon"
    | "icon-sm"
    | "icon-lg"
    | "default"
    | null
    | undefined;
  /** Show loading spinner and disable button */
  loading?: boolean;
  /** Icon to show on the left side */
  leftIcon?: React.ReactNode;
  /** Icon to show on the right side */
  rightIcon?: React.ReactNode;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant,
      size,
      loading = false,
      leftIcon,
      rightIcon,
      children,
      disabled,
      asChild: _asChild = false,
      ...props
    },
    ref,
  ) => {
    const isDisabled = disabled || loading;

    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        disabled={isDisabled}
        {...props}
      >
        {loading && <Loader2 className="h-4 w-4 animate-spin" />}
        {!loading && leftIcon}
        {children}
        {!loading && rightIcon}
      </button>
    );
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
