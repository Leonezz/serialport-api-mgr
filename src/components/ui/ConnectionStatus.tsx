import * as React from "react";
import { cn } from "../../lib/utils";

/**
 * ConnectionStatus Component
 *
 * Design System Specifications (FIGMA-DESIGN.md 7.3):
 * - Indicator Size: 8px circle
 * - Layout: [dot] Status Text
 * - States: Connected (green), Disconnected (gray), Connecting (amber, pulse), Error (red)
 *
 * Uses unified design tokens:
 * - Status colors: bg-status-success, bg-status-warning, bg-status-error
 * - Animation: animate-status-pulse (defined in index.css)
 */

export type ConnectionState =
  | "connected"
  | "disconnected"
  | "connecting"
  | "error";

export interface ConnectionStatusProps {
  /** Connection state */
  state: ConnectionState;
  /** Optional custom text (overrides default) */
  text?: string;
  /** Error message (shown when state is "error") */
  errorMessage?: string;
  /** Size variant */
  size?: "sm" | "md";
  /** Additional className */
  className?: string;
}

const stateConfig: Record<
  ConnectionState,
  {
    color: string;
    text: string;
    animate?: boolean;
    outlined?: boolean;
  }
> = {
  connected: {
    color: "bg-status-success",
    text: "Connected",
    animate: false,
    outlined: false,
  },
  disconnected: {
    color: "border-text-muted",
    text: "Disconnected",
    animate: false,
    outlined: true,
  },
  connecting: {
    color: "bg-status-warning",
    text: "Connecting...",
    animate: true,
    outlined: false,
  },
  error: {
    color: "bg-status-error",
    text: "Error",
    animate: false,
    outlined: false,
  },
};

const ConnectionStatus: React.FC<ConnectionStatusProps> = ({
  state,
  text,
  errorMessage,
  size = "md",
  className,
}) => {
  const config = stateConfig[state];
  const displayText =
    text ??
    (state === "error" && errorMessage
      ? `Error: ${errorMessage}`
      : config.text);

  return (
    <div
      className={cn(
        "inline-flex items-center gap-2",
        size === "sm" ? "text-xs" : "text-sm",
        className,
      )}
    >
      {/* Indicator dot */}
      <span
        className={cn(
          "rounded-full flex-shrink-0",
          size === "sm" ? "w-1.5 h-1.5" : "w-2 h-2",
          config.outlined ? "border-2 bg-transparent" : "",
          config.color,
          config.animate && "animate-status-pulse",
        )}
      />

      {/* Status text */}
      <span
        className={cn(
          "text-text-secondary",
          state === "error" && "text-status-error",
        )}
      >
        {displayText}
      </span>
    </div>
  );
};

ConnectionStatus.displayName = "ConnectionStatus";

export { ConnectionStatus };
