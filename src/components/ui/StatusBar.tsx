import * as React from "react";
import { cn } from "../../lib/utils";
import { ConnectionStatus, ConnectionState } from "./ConnectionStatus";
import { useStore } from "../../lib/store";

/**
 * StatusBar Component
 *
 * Reads connection state and byte counters directly from the store
 * to avoid re-rendering MainWorkspace on every incoming frame.
 *
 * Design System Specifications (FIGMA-DESIGN.md 8.7):
 * - Height: 24px
 * - Background: bg.muted
 * - Padding: 0 16px
 * - Font: body.sm
 * - Content: Connection status, port info, RX/TX stats, timestamp
 */

export interface StatusBarProps {
  /** Show timestamp */
  showTimestamp?: boolean;
  /** Additional status items */
  additionalItems?: React.ReactNode;
  /** Additional className */
  className?: string;
}

const formatBytes = (bytes: number): string => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const StatusBar: React.FC<StatusBarProps> = ({
  showTimestamp = true,
  additionalItems,
  className,
}) => {
  // Read directly from store — only StatusBar re-renders on byte counter changes,
  // not MainWorkspace and its entire subtree.
  const bytesReceived = useStore(
    (state) => state.sessions[state.activeSessionId]?.bytesReceived || 0,
  );
  const bytesTransmitted = useStore(
    (state) => state.sessions[state.activeSessionId]?.bytesTransmitted || 0,
  );
  const isConnected = useStore(
    (state) => state.sessions[state.activeSessionId]?.isConnected || false,
  );
  const portName = useStore(
    (state) => state.sessions[state.activeSessionId]?.portName,
  );
  const connectionType = useStore(
    (state) =>
      state.sessions[state.activeSessionId]?.connectionType || "SERIAL",
  );
  const config = useStore(
    (state) => state.sessions[state.activeSessionId]?.config,
  );

  const connectionState: ConnectionState = isConnected
    ? "connected"
    : "disconnected";
  const serialConfig =
    connectionType === "SERIAL" && config
      ? `${config.baudRate} ${config.dataBits}${config.parity.charAt(0).toUpperCase()}${config.stopBits}`
      : undefined;

  const [currentTime, setCurrentTime] = React.useState<string>("");

  React.useEffect(() => {
    if (!showTimestamp) return;

    const updateTime = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString("en-US", {
          hour12: false,
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        }),
      );
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, [showTimestamp]);

  return (
    <footer
      className={cn(
        "h-6 px-4 flex items-center gap-4",
        "bg-bg-muted border-t border-border-default",
        "text-xs text-text-secondary",
        "shrink-0",
        className,
      )}
    >
      {/* Connection Status */}
      <ConnectionStatus state={connectionState} size="sm" />

      {/* Separator */}
      <div className="w-px h-3 bg-border-default" />

      {/* Port & Config */}
      {connectionState === "connected" && portName && (
        <>
          <span className="font-mono">
            {portName}
            {serialConfig && ` @ ${serialConfig}`}
          </span>
          <div className="w-px h-3 bg-border-default" />
        </>
      )}

      {/* RX/TX Stats */}
      <div className="flex items-center gap-3">
        <span className="font-mono">
          <span className="text-green-500">RX:</span>{" "}
          {formatBytes(bytesReceived)}
        </span>
        <span className="font-mono">
          <span className="text-blue-500">TX:</span>{" "}
          {formatBytes(bytesTransmitted)}
        </span>
      </div>

      {/* Additional items */}
      {additionalItems}

      {/* Spacer */}
      <div className="flex-1" />

      {/* Timestamp */}
      {showTimestamp && currentTime && (
        <span className="font-mono tabular-nums">{currentTime}</span>
      )}
    </footer>
  );
};

StatusBar.displayName = "StatusBar";

export { StatusBar };
