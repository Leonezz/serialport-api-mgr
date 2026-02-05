import * as React from "react";
import * as TooltipPrimitive from "@radix-ui/react-tooltip";
import { cn } from "../../lib/utils";

/**
 * Tooltip Component
 *
 * Built on @radix-ui/react-tooltip for accessible, auto-positioned tooltips.
 *
 * Design System Specifications (FIGMA-DESIGN.md 5.8):
 * - Max Width: 280px
 * - Padding: 8px 12px
 * - Background: gray.900 (light mode), gray.100 (dark mode)
 * - Text: body.sm, text.inverse
 * - Border Radius: radius.sm
 * - Shadow: shadow.md
 * - Arrow: 6px triangle
 */

export interface TooltipProps {
  /** Content to show in tooltip */
  content: React.ReactNode;
  /** Element that triggers the tooltip */
  children: React.ReactElement;
  /** Placement of tooltip relative to trigger */
  placement?: "top" | "bottom" | "left" | "right";
  /** Delay before showing tooltip (ms) */
  delayShow?: number;
  /** Delay before hiding tooltip (ms) */
  delayHide?: number;
  /** Additional class for tooltip */
  className?: string;
  /** Whether tooltip is disabled */
  disabled?: boolean;
}

const Tooltip: React.FC<TooltipProps> = ({
  content,
  children,
  placement = "top",
  delayShow = 200,
  delayHide = 0,
  className,
  disabled = false,
}) => {
  if (disabled || !content) {
    return children;
  }

  return (
    <TooltipPrimitive.Provider
      delayDuration={delayShow}
      skipDelayDuration={delayHide}
    >
      <TooltipPrimitive.Root>
        <TooltipPrimitive.Trigger asChild>{children}</TooltipPrimitive.Trigger>
        <TooltipPrimitive.Portal>
          <TooltipPrimitive.Content
            side={placement}
            sideOffset={8}
            className={cn(
              "z-50 max-w-[280px] px-3 py-2",
              "bg-gray-900 dark:bg-gray-100",
              "text-sm text-white dark:text-gray-900",
              "rounded-radius-sm shadow-md",
              "animate-in fade-in-0 zoom-in-95 duration-150",
              className,
            )}
          >
            {content}
            <TooltipPrimitive.Arrow className="fill-gray-900 dark:fill-gray-100" />
          </TooltipPrimitive.Content>
        </TooltipPrimitive.Portal>
      </TooltipPrimitive.Root>
    </TooltipPrimitive.Provider>
  );
};

Tooltip.displayName = "Tooltip";

export { Tooltip };
