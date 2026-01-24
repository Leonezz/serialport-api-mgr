import * as React from "react";
import { cn } from "../../lib/utils";

/**
 * Tooltip Component
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
  children: React.ReactElement<{
    onMouseEnter?: React.MouseEventHandler;
    onMouseLeave?: React.MouseEventHandler;
    onFocus?: React.FocusEventHandler;
    onBlur?: React.FocusEventHandler;
  }>;
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
  const [isVisible, setIsVisible] = React.useState(false);
  const [position, setPosition] = React.useState({ top: 0, left: 0 });
  const triggerRef = React.useRef<HTMLElement>(null);
  const tooltipRef = React.useRef<HTMLDivElement>(null);
  const showTimeoutRef = React.useRef<number | null>(null);
  const hideTimeoutRef = React.useRef<number | null>(null);

  const calculatePosition = React.useCallback(() => {
    if (!triggerRef.current || !tooltipRef.current) return;

    const triggerRect = triggerRef.current.getBoundingClientRect();
    const tooltipRect = tooltipRef.current.getBoundingClientRect();
    const gap = 8; // Gap between trigger and tooltip

    let top = 0;
    let left = 0;

    switch (placement) {
      case "top":
        top = triggerRect.top - tooltipRect.height - gap;
        left = triggerRect.left + triggerRect.width / 2 - tooltipRect.width / 2;
        break;
      case "bottom":
        top = triggerRect.bottom + gap;
        left = triggerRect.left + triggerRect.width / 2 - tooltipRect.width / 2;
        break;
      case "left":
        top = triggerRect.top + triggerRect.height / 2 - tooltipRect.height / 2;
        left = triggerRect.left - tooltipRect.width - gap;
        break;
      case "right":
        top = triggerRect.top + triggerRect.height / 2 - tooltipRect.height / 2;
        left = triggerRect.right + gap;
        break;
    }

    // Keep tooltip within viewport
    const padding = 8;
    left = Math.max(
      padding,
      Math.min(left, window.innerWidth - tooltipRect.width - padding),
    );
    top = Math.max(
      padding,
      Math.min(top, window.innerHeight - tooltipRect.height - padding),
    );

    setPosition({ top, left });
  }, [placement]);

  const handleShow = React.useCallback(() => {
    if (disabled) return;

    if (hideTimeoutRef.current) {
      window.clearTimeout(hideTimeoutRef.current);
      hideTimeoutRef.current = null;
    }

    showTimeoutRef.current = window.setTimeout(() => {
      setIsVisible(true);
    }, delayShow);
  }, [delayShow, disabled]);

  const handleHide = React.useCallback(() => {
    if (showTimeoutRef.current) {
      window.clearTimeout(showTimeoutRef.current);
      showTimeoutRef.current = null;
    }

    hideTimeoutRef.current = window.setTimeout(() => {
      setIsVisible(false);
    }, delayHide);
  }, [delayHide]);

  // Calculate position when visible
  React.useEffect(() => {
    if (isVisible) {
      // Use requestAnimationFrame to ensure tooltip is rendered before measuring
      requestAnimationFrame(calculatePosition);
    }
  }, [isVisible, calculatePosition]);

  // Cleanup timeouts
  React.useEffect(() => {
    return () => {
      if (showTimeoutRef.current) window.clearTimeout(showTimeoutRef.current);
      if (hideTimeoutRef.current) window.clearTimeout(hideTimeoutRef.current);
    };
  }, []);

  const arrowClasses = {
    top: "bottom-0 left-1/2 -translate-x-1/2 translate-y-full border-t-gray-900 dark:border-t-gray-100 border-l-transparent border-r-transparent border-b-transparent",
    bottom:
      "top-0 left-1/2 -translate-x-1/2 -translate-y-full border-b-gray-900 dark:border-b-gray-100 border-l-transparent border-r-transparent border-t-transparent",
    left: "right-0 top-1/2 translate-x-full -translate-y-1/2 border-l-gray-900 dark:border-l-gray-100 border-t-transparent border-b-transparent border-r-transparent",
    right:
      "left-0 top-1/2 -translate-x-full -translate-y-1/2 border-r-gray-900 dark:border-r-gray-100 border-t-transparent border-b-transparent border-l-transparent",
  };

  return (
    <>
      <span
        ref={triggerRef as React.RefObject<HTMLSpanElement>}
        onMouseEnter={(e) => {
          handleShow();
          children.props.onMouseEnter?.(e as unknown as React.MouseEvent);
        }}
        onMouseLeave={(e) => {
          handleHide();
          children.props.onMouseLeave?.(e as unknown as React.MouseEvent);
        }}
        onFocus={(e) => {
          handleShow();
          children.props.onFocus?.(e as unknown as React.FocusEvent);
        }}
        onBlur={(e) => {
          handleHide();
          children.props.onBlur?.(e as unknown as React.FocusEvent);
        }}
        className="inline-flex"
      >
        {children}
      </span>
      {isVisible && (
        <div
          ref={tooltipRef}
          role="tooltip"
          className={cn(
            "fixed z-50 max-w-[280px] px-3 py-2",
            "bg-gray-900 dark:bg-gray-100",
            "text-sm text-white dark:text-gray-900",
            "rounded-radius-sm shadow-md",
            "animate-in fade-in-0 zoom-in-95 duration-150",
            className,
          )}
          style={{ top: position.top, left: position.left }}
        >
          {content}
          {/* Arrow */}
          <div
            className={cn(
              "absolute w-0 h-0 border-[6px]",
              arrowClasses[placement],
            )}
          />
        </div>
      )}
    </>
  );
};

Tooltip.displayName = "Tooltip";

export { Tooltip };
