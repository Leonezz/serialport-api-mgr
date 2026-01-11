import React, { useState, useEffect, useCallback, useMemo } from "react";
import { cn } from "../../lib/utils";
import { Settings2, ScanLine } from "lucide-react";

interface HexDataViewProps {
  data: Uint8Array;
  selection: { start: number; end: number } | null;
  setSelection: React.Dispatch<
    React.SetStateAction<{ start: number; end: number } | null>
  >;
  onInteractionStart?: () => void;
  bytesPerRow?: number;
  hideBinary?: boolean;
  showInspector?: boolean;
  stickyHeader?: boolean;
  disableXScroll?: boolean;
}

const HexDataView: React.FC<HexDataViewProps> = React.memo(
  ({
    data,
    selection,
    setSelection,
    onInteractionStart,
    bytesPerRow = 16,
    hideBinary = true,
    showInspector = true,
    stickyHeader = false,
    disableXScroll = false,
  }) => {
    const [isSelecting, setIsSelecting] = useState(false);
    const [littleEndian, setLittleEndian] = useState(true);

    // Global Mouse Up to stop selecting
    useEffect(() => {
      if (isSelecting) {
        const handleMouseUp = () => setIsSelecting(false);
        window.addEventListener("mouseup", handleMouseUp);
        return () => window.removeEventListener("mouseup", handleMouseUp);
      }
    }, [isSelecting]);

    const handleInteraction = useCallback(
      (e: React.MouseEvent, type: "down" | "over") => {
        // Only handle left click
        if (type === "down" && e.button !== 0) return;

        const target = e.target as HTMLElement;
        const indexStr = target.getAttribute("data-index");

        if (indexStr) {
          const index = parseInt(indexStr, 10);
          if (type === "down") {
            setIsSelecting(true);
            setSelection({ start: index, end: index });
            onInteractionStart?.();
            // Prevent native text selection
            e.preventDefault();
          } else if (type === "over" && isSelecting) {
            setSelection((prev) => (prev ? { ...prev, end: index } : null));
          }
        }
      },
      [isSelecting, setSelection, onInteractionStart],
    );

    const isSelected = useCallback(
      (idx: number) => {
        if (!selection) return false;
        const min = Math.min(selection.start, selection.end);
        const max = Math.max(selection.start, selection.end);
        return idx >= min && idx <= max;
      },
      [selection],
    );

    // Inspector Data Calculation
    const inspectorData = useMemo(() => {
      if (!selection || !showInspector) return null;
      const min = Math.min(selection.start, selection.end);
      const max = Math.max(selection.start, selection.end);
      const selectedBytes = data.subarray(min, max + 1);

      if (selectedBytes.length === 0) return null;

      const view = new DataView(
        selectedBytes.buffer,
        selectedBytes.byteOffset,
        selectedBytes.byteLength,
      );
      const res: any = {
        binary: Array.from(selectedBytes)
          .map((b) => (b as number).toString(2).padStart(8, "0"))
          .join(" "),
        size: selectedBytes.length,
      };

      if (selectedBytes.length >= 1) {
        res.int8 = view.getInt8(0);
        res.uint8 = view.getUint8(0);
      }
      if (selectedBytes.length >= 2) {
        res.int16 = view.getInt16(0, littleEndian);
        res.uint16 = view.getUint16(0, littleEndian);
      }
      if (selectedBytes.length >= 4) {
        res.int32 = view.getInt32(0, littleEndian);
        res.uint32 = view.getUint32(0, littleEndian);
        res.float32 = view.getFloat32(0, littleEndian);
      }
      if (selectedBytes.length >= 8) {
        res.int64 = view.getBigInt64(0, littleEndian);
        res.uint64 = view.getBigUint64(0, littleEndian);
        res.float64 = view.getFloat64(0, littleEndian);
      }
      return res;
    }, [selection, data, littleEndian, showInspector]);

    // Render Rows
    const rowCount = Math.ceil(data.length / bytesPerRow);

    // Fixed Column Widths for Alignment
    const OFFSET_WIDTH = 60;

    // Exact Width Calculation for HEX Column
    // Byte: 20px
    // Gaps: 4px usually, 8px every 4th byte
    const calculateHexWidth = (count: number) => {
      if (count <= 0) return 0;
      const byteWidth = 20;
      const totalBytes = count * byteWidth;

      let totalGaps = 0;
      for (let i = 1; i < count; i++) {
        totalGaps += i % 4 === 0 ? 8 : 4;
      }

      return totalBytes + totalGaps + 24; // + padding (px-3 = 12*2)
    };

    const hexColWidth = calculateHexWidth(bytesPerRow);
    const BIN_BYTE_WIDTH = 65;
    const binColWidth = bytesPerRow * BIN_BYTE_WIDTH + 24;
    const ASCII_BYTE_WIDTH = 8;
    const asciiColWidth = bytesPerRow * ASCII_BYTE_WIDTH + 24;

    const renderRow = (rowIndex: number) => {
      const startOffset = rowIndex * bytesPerRow;
      const endOffset = Math.min(startOffset + bytesPerRow, data.length);
      const rowBytes = data.subarray(startOffset, endOffset);

      return (
        <tr
          key={rowIndex}
          className="group hover:bg-muted/10 transition-colors"
        >
          {/* Offset - Sticky Left */}
          <td
            className={cn(
              "align-top py-0.5 pr-3 text-muted-foreground/50 border-r border-border/10 select-none text-right font-mono text-[10px]",
              stickyHeader &&
                "sticky left-0 z-10 bg-background/95 backdrop-blur-[1px]", // Sticky Left + BG
            )}
            style={{ width: OFFSET_WIDTH, minWidth: OFFSET_WIDTH }}
          >
            {startOffset.toString(16).padStart(4, "0").toUpperCase()}
          </td>

          {/* Hex */}
          <td
            className="align-top px-3 whitespace-nowrap select-none"
            style={{ width: hexColWidth, minWidth: hexColWidth }}
          >
            <div className="flex font-mono text-[11px]">
              {[...rowBytes].map((byte, i) => {
                const globalIndex = startOffset + i;
                const sel = isSelected(globalIndex);
                return (
                  <span
                    key={i}
                    data-index={globalIndex}
                    className={cn(
                      "inline-block text-center cursor-pointer rounded-sm transition-colors",
                      sel
                        ? "bg-primary text-primary-foreground font-bold"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted/50",
                      i > 0 && i % 4 === 0 ? "ml-2" : "ml-1",
                      i === 0 && "ml-0",
                    )}
                    style={{ width: "20px" }}
                  >
                    {byte.toString(16).padStart(2, "0").toUpperCase()}
                  </span>
                );
              })}
            </div>
          </td>

          {/* Binary */}
          {!hideBinary && (
            <td
              className="align-top px-3 border-l border-border/10 whitespace-nowrap select-none"
              style={{ width: binColWidth, minWidth: binColWidth }}
            >
              <div className="flex font-mono text-[10px] tracking-tighter">
                {[...rowBytes].map((byte, i) => {
                  const globalIndex = startOffset + i;
                  const sel = isSelected(globalIndex);
                  return (
                    <span
                      key={i}
                      data-index={globalIndex}
                      className={cn(
                        "inline-block cursor-pointer px-0.5 rounded-sm transition-colors",
                        sel
                          ? "bg-primary text-primary-foreground font-bold"
                          : "text-muted-foreground/70 hover:text-foreground hover:bg-muted/50",
                        i > 0 && i % 4 === 0 ? "ml-2" : "ml-1",
                        i === 0 && "ml-0",
                      )}
                    >
                      {byte.toString(2).padStart(8, "0")}
                    </span>
                  );
                })}
              </div>
            </td>
          )}

          {/* ASCII */}
          <td
            className="align-top px-3 border-l border-border/10 whitespace-nowrap select-none"
            style={{ width: asciiColWidth, minWidth: asciiColWidth }}
          >
            <div className="flex font-mono text-[11px] tracking-widest">
              {[...rowBytes].map((byte, i) => {
                const globalIndex = startOffset + i;
                const sel = isSelected(globalIndex);
                const char =
                  byte >= 32 && byte <= 126 ? String.fromCharCode(byte) : ".";
                return (
                  <span
                    key={i}
                    data-index={globalIndex}
                    className={cn(
                      "inline-block text-center cursor-pointer rounded-sm transition-colors",
                      sel
                        ? "bg-primary text-primary-foreground font-bold"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted/50",
                    )}
                    style={{ width: "8px" }} // Reduced width for tighter packing
                  >
                    {char}
                  </span>
                );
              })}
            </div>
          </td>
        </tr>
      );
    };

    // Shared Header Height for perfect alignment
    const HEADER_HEIGHT_CLASS = "h-[26px]";

    return (
      <div className="flex min-h-full w-fit gap-0 bg-background/50 text-[11px]">
        {/* Table Area */}
        <div
          className={cn(
            "flex-none custom-scrollbar",
            !disableXScroll && "overflow-x-auto overflow-y-hidden",
          )}
          onMouseDown={(e) => handleInteraction(e, "down")}
          onMouseOver={(e) => handleInteraction(e, "over")}
        >
          <table className="w-max table-fixed border-collapse">
            <thead
              className={cn(
                "bg-card text-[10px] text-muted-foreground font-medium text-left shadow-sm",
                stickyHeader && "sticky top-0 z-30",
              )}
            >
              <tr className={HEADER_HEIGHT_CLASS}>
                <th
                  className={cn(
                    "px-0 pr-3 border-r border-border/10 font-normal text-right select-none align-middle",
                    stickyHeader && "sticky left-0 z-40 bg-card", // Higher Z for intersection of sticky top/left
                  )}
                  style={{ width: OFFSET_WIDTH }}
                >
                  OFFSET
                </th>
                <th
                  className="px-3 font-normal select-none align-middle"
                  style={{ width: hexColWidth }}
                >
                  <div className="flex font-mono text-[9px] text-muted-foreground/60 leading-none pt-0.5">
                    {Array.from({ length: bytesPerRow }).map((_, i) => (
                      <span
                        key={i}
                        className={cn(
                          "inline-block text-center",
                          i > 0 && i % 4 === 0 ? "ml-2" : "ml-1",
                          i === 0 && "ml-0",
                        )}
                        style={{ width: "20px" }}
                      >
                        {i.toString(16).toUpperCase().padStart(2, "0")}
                      </span>
                    ))}
                  </div>
                </th>
                {!hideBinary && (
                  <th
                    className="px-3 border-l border-border/10 font-normal select-none align-middle"
                    style={{ width: binColWidth }}
                  >
                    BINARY
                  </th>
                )}
                <th
                  className="px-3 border-l border-border/10 font-normal select-none align-middle"
                  style={{ width: asciiColWidth }}
                >
                  ASCII
                </th>
              </tr>
            </thead>
            <tbody>
              {(Array.from as any)({ length: rowCount }).map(
                (_: any, i: number) => renderRow(i),
              )}
            </tbody>
          </table>
        </div>

        {/* Inspector Panel */}
        {showInspector && (
          <div
            className={cn(
              "w-64 border-l border-border bg-card shrink-0 animate-in slide-in-from-right-5 transition-all duration-300 min-h-full",
              stickyHeader &&
                "sticky right-0 z-20 shadow-[linear-gradient(to_right,rgba(0,0,0,0),rgba(0,0,0,0.1))]", // Sticky Right
            )}
          >
            {/* Sticky Wrapper for Inspector Content */}
            <div
              className={cn(
                "flex flex-col w-full",
                stickyHeader && "sticky top-0 max-h-screen",
              )}
            >
              <div
                className={cn(
                  "flex items-center justify-between px-3 bg-card border-b border-border/10 shadow-sm text-[10px] text-muted-foreground font-medium z-10",
                  HEADER_HEIGHT_CLASS,
                )}
              >
                <span className="uppercase tracking-normal">INSPECTOR</span>
                <div className="flex items-center gap-1.5">
                  <input
                    type="checkbox"
                    id="le-chk"
                    checked={littleEndian}
                    onChange={(e) => setLittleEndian(e.target.checked)}
                    className="h-3 w-3 rounded border-input"
                  />
                  <label
                    htmlFor="le-chk"
                    className="cursor-pointer select-none"
                  >
                    Little Endian
                  </label>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-3 space-y-3 font-mono text-[10px]">
                {inspectorData ? (
                  <>
                    <div className="space-y-1">
                      <div className="text-muted-foreground text-[9px] uppercase tracking-wider">
                        Selection
                      </div>
                      <div className="bg-background border border-border p-1.5 rounded truncate">
                        {selection
                          ? `${selection.start} - ${selection.end} (${inspectorData.size} bytes)`
                          : "-"}
                      </div>
                    </div>

                    <div className="space-y-1">
                      <div className="text-muted-foreground text-[9px] uppercase tracking-wider">
                        Binary
                      </div>
                      <div className="bg-background border border-border p-1.5 rounded break-all leading-tight max-h-[100px] overflow-y-auto">
                        {inspectorData.binary}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      {inspectorData.int8 !== undefined && (
                        <div>
                          <div className="text-muted-foreground opacity-70">
                            Int8
                          </div>
                          <div className="font-semibold">
                            {inspectorData.int8}
                          </div>
                        </div>
                      )}
                      {inspectorData.uint8 !== undefined && (
                        <div>
                          <div className="text-muted-foreground opacity-70">
                            Uint8
                          </div>
                          <div className="font-semibold">
                            {inspectorData.uint8}
                          </div>
                        </div>
                      )}
                      {inspectorData.int16 !== undefined && (
                        <div>
                          <div className="text-muted-foreground opacity-70">
                            Int16
                          </div>
                          <div className="font-semibold">
                            {inspectorData.int16}
                          </div>
                        </div>
                      )}
                      {inspectorData.uint16 !== undefined && (
                        <div>
                          <div className="text-muted-foreground opacity-70">
                            Uint16
                          </div>
                          <div className="font-semibold">
                            {inspectorData.uint16}
                          </div>
                        </div>
                      )}
                      {inspectorData.int32 !== undefined && (
                        <div>
                          <div className="text-muted-foreground opacity-70">
                            Int32
                          </div>
                          <div className="font-semibold">
                            {inspectorData.int32}
                          </div>
                        </div>
                      )}
                      {inspectorData.uint32 !== undefined && (
                        <div>
                          <div className="text-muted-foreground opacity-70">
                            Uint32
                          </div>
                          <div className="font-semibold">
                            {inspectorData.uint32}
                          </div>
                        </div>
                      )}
                      {inspectorData.float32 !== undefined && (
                        <div className="col-span-2">
                          <div className="text-muted-foreground opacity-70">
                            Float32
                          </div>
                          <div className="font-semibold">
                            {inspectorData.float32}
                          </div>
                        </div>
                      )}
                      {inspectorData.int64 !== undefined && (
                        <div className="col-span-2">
                          <div className="text-muted-foreground opacity-70">
                            Int64
                          </div>
                          <div className="font-semibold truncate">
                            {inspectorData.int64.toString()}
                          </div>
                        </div>
                      )}
                      {inspectorData.float64 !== undefined && (
                        <div className="col-span-2">
                          <div className="text-muted-foreground opacity-70">
                            Float64
                          </div>
                          <div className="font-semibold truncate">
                            {inspectorData.float64}
                          </div>
                        </div>
                      )}
                    </div>
                  </>
                ) : (
                  <div className="flex flex-col items-center justify-center text-muted-foreground/40 space-y-2 select-none py-6">
                    <ScanLine className="w-8 h-8 opacity-50" />
                    <p className="text-center font-sans text-xs">
                      Select bytes
                      <br />
                      to inspect
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    );
  },
);

HexDataView.displayName = "HexDataView";

export default HexDataView;
