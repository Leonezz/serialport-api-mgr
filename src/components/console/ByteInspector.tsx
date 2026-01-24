import * as React from "react";
import { cn } from "../../lib/utils";

/**
 * ByteInspector Component
 *
 * Design System Specifications (FIGMA-DESIGN.md 9.3):
 * - Height: 160px (collapsible)
 * - Background: bg.muted
 * - Border Top: 1px border.default
 * - Padding: 16px
 * - Grid: 4 columns
 * - Field label: label.sm, text.secondary
 * - Field value: mono.md, text.primary
 */

export interface ByteInspectorProps {
  /** Selected byte data */
  data: Uint8Array | null;
  /** Offset of selected byte(s) */
  offset?: number;
  /** Stream source (TX/RX) for stream view */
  stream?: "TX" | "RX";
  /** Use little-endian byte order */
  littleEndian?: boolean;
  /** Toggle endianness */
  onToggleEndian?: (littleEndian: boolean) => void;
  /** Collapsed state */
  collapsed?: boolean;
  /** Additional className */
  className?: string;
}

interface InspectorValue {
  label: string;
  value: string | number | bigint;
}

const ByteInspector: React.FC<ByteInspectorProps> = ({
  data,
  offset = 0,
  stream,
  littleEndian = true,
  onToggleEndian,
  collapsed = false,
  className,
}) => {
  const values = React.useMemo((): InspectorValue[] => {
    if (!data || data.length === 0) return [];

    const view = new DataView(data.buffer, data.byteOffset, data.byteLength);
    const results: InspectorValue[] = [];

    // Offset
    results.push({
      label: "Offset",
      value: `0x${offset.toString(16).padStart(2, "0").toUpperCase()}`,
    });

    // Hex value of first byte
    if (data.length >= 1) {
      results.push({
        label: "Hex",
        value: `0x${data[0].toString(16).padStart(2, "0").toUpperCase()}`,
      });
      results.push({
        label: "Decimal",
        value: data[0],
      });
      results.push({
        label: "Binary",
        value: data[0].toString(2).padStart(8, "0"),
      });

      // ASCII
      const ascii =
        data[0] >= 32 && data[0] <= 126
          ? `'${String.fromCharCode(data[0])}'`
          : data[0] === 0
            ? "NUL"
            : `0x${data[0].toString(16).padStart(2, "0")}`;
      results.push({
        label: "ASCII",
        value: ascii,
      });

      // Int8
      results.push({
        label: "Int8",
        value: view.getInt8(0),
      });
    }

    // 16-bit values
    if (data.length >= 2) {
      results.push({
        label: `UInt16 ${littleEndian ? "LE" : "BE"}`,
        value: view.getUint16(0, littleEndian),
      });
      results.push({
        label: `Int16 ${littleEndian ? "LE" : "BE"}`,
        value: view.getInt16(0, littleEndian),
      });
    }

    // 32-bit values
    if (data.length >= 4) {
      results.push({
        label: `Float32 ${littleEndian ? "LE" : "BE"}`,
        value: view.getFloat32(0, littleEndian).toExponential(3),
      });
    }

    return results;
  }, [data, offset, littleEndian]);

  if (collapsed) return null;

  return (
    <div
      className={cn(
        "h-40 p-4 bg-bg-muted border-t border-border-default",
        "overflow-hidden",
        className,
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-xs font-semibold text-text-secondary uppercase tracking-wide">
          Byte Inspector
          {stream && (
            <span
              className={cn(
                "ml-2 px-1.5 py-0.5 rounded text-[10px]",
                stream === "TX"
                  ? "bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400"
                  : "bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400",
              )}
            >
              {stream}
            </span>
          )}
        </h4>
        {onToggleEndian && (
          <button
            onClick={() => onToggleEndian(!littleEndian)}
            className={cn(
              "text-[10px] px-2 py-0.5 rounded",
              "bg-bg-surface border border-border-default",
              "text-text-secondary hover:text-text-primary",
              "transition-colors",
            )}
          >
            {littleEndian ? "Little Endian" : "Big Endian"}
          </button>
        )}
      </div>

      {/* No Selection State */}
      {(!data || data.length === 0) && (
        <p className="text-xs text-text-muted text-center py-4">
          Select byte(s) to inspect
        </p>
      )}

      {/* Values Grid */}
      {data && data.length > 0 && (
        <div className="grid grid-cols-4 gap-3">
          {values.map((item, idx) => (
            <div key={idx} className="min-w-0">
              <span className="text-[10px] text-text-secondary block truncate">
                {item.label}
              </span>
              <span className="font-mono text-sm text-text-primary block truncate">
                {String(item.value)}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

ByteInspector.displayName = "ByteInspector";

export { ByteInspector };
