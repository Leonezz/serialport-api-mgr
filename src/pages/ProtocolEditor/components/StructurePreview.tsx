/**
 * Protocol Editor - Structure Preview
 *
 * Displays a visual preview of message structure with test mode
 */

import { useState, useMemo } from "react";
import { Eye, Play } from "lucide-react";
import { cn } from "../../../lib/utils";
import { Button, Input, Label } from "../../../components/ui";
import type { MessageStructure } from "../../../lib/protocolTypes";
import { getElementDefaultBytes } from "../helpers";

interface StructurePreviewProps {
  structure: MessageStructure;
}

export const StructurePreview: React.FC<StructurePreviewProps> = ({
  structure,
}) => {
  const [showTest, setShowTest] = useState(false);
  const [testValues, setTestValues] = useState<Record<string, number[]>>({});

  // Compute composed bytes (default or test values)
  const composedResult = useMemo(() => {
    const segments: {
      elementId: string;
      name: string;
      bytes: number[];
      isComputed: boolean;
    }[] = [];

    for (const element of structure.elements) {
      const defaults = getElementDefaultBytes(element);
      const override = testValues[element.id];
      segments.push({
        elementId: element.id,
        name: element.name,
        bytes: override ?? defaults.bytes,
        isComputed: defaults.isComputed,
      });
    }

    return segments;
  }, [structure.elements, testValues]);

  const totalBytes = composedResult.reduce(
    (sum, seg) => sum + seg.bytes.length,
    0,
  );

  // Generate distinct colors for each element
  const colors = [
    "bg-blue-500/20 border-blue-500/40 text-blue-700 dark:text-blue-300",
    "bg-green-500/20 border-green-500/40 text-green-700 dark:text-green-300",
    "bg-purple-500/20 border-purple-500/40 text-purple-700 dark:text-purple-300",
    "bg-orange-500/20 border-orange-500/40 text-orange-700 dark:text-orange-300",
    "bg-pink-500/20 border-pink-500/40 text-pink-700 dark:text-pink-300",
    "bg-cyan-500/20 border-cyan-500/40 text-cyan-700 dark:text-cyan-300",
  ];

  return (
    <div className="mt-4 pt-4 border-t border-border">
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-medium flex items-center gap-2">
          <Eye className="w-4 h-4" />
          Preview & Test
        </span>
        <Button
          variant={showTest ? "primary" : "outline"}
          size="sm"
          className="gap-1 h-7"
          onClick={() => setShowTest(!showTest)}
        >
          <Play className="w-3.5 h-3.5" />
          {showTest ? "Hide Test" : "Test Mode"}
        </Button>
      </div>

      {/* Default Values Table */}
      <div className="mb-4 overflow-x-auto">
        <table className="w-full text-xs border-collapse">
          <thead>
            <tr className="bg-muted/50">
              <th className="text-left p-2 border border-border font-medium">
                Element
              </th>
              <th className="text-left p-2 border border-border font-medium">
                Type
              </th>
              <th className="text-left p-2 border border-border font-medium">
                Size
              </th>
              <th className="text-left p-2 border border-border font-medium">
                Default
              </th>
            </tr>
          </thead>
          <tbody>
            {structure.elements.map((element, idx) => {
              const defaults = getElementDefaultBytes(element);
              return (
                <tr key={element.id} className={colors[idx % colors.length]}>
                  <td className="p-2 border border-border font-mono">
                    {element.name}
                  </td>
                  <td className="p-2 border border-border">
                    {element.config.type}
                  </td>
                  <td className="p-2 border border-border">
                    {typeof element.size === "number"
                      ? `${element.size} byte${element.size !== 1 ? "s" : ""}`
                      : element.size}
                  </td>
                  <td className="p-2 border border-border font-mono">
                    {defaults.label}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Test Mode - Editable Values */}
      {showTest && (
        <div className="mb-4 p-3 bg-muted/30 rounded-lg border border-border">
          <p className="text-xs text-muted-foreground mb-3">
            Override values for testing. Enter hex bytes separated by spaces.
          </p>
          <div className="space-y-2">
            {structure.elements.map((element) => {
              const defaults = getElementDefaultBytes(element);
              if (defaults.isComputed) {
                return (
                  <div key={element.id} className="flex items-center gap-2">
                    <Label className="w-24 text-xs">{element.name}:</Label>
                    <span className="text-xs text-muted-foreground italic">
                      {defaults.label}
                    </span>
                  </div>
                );
              }

              return (
                <div key={element.id} className="flex items-center gap-2">
                  <Label className="w-24 text-xs">{element.name}:</Label>
                  <Input
                    className="flex-1 h-7 text-xs font-mono"
                    placeholder={defaults.bytes
                      .map((b) => b.toString(16).padStart(2, "0").toUpperCase())
                      .join(" ")}
                    defaultValue={
                      testValues[element.id]
                        ?.map((b) =>
                          b.toString(16).padStart(2, "0").toUpperCase(),
                        )
                        .join(" ") || ""
                    }
                    onBlur={(e) => {
                      const val = e.target.value.trim();
                      if (!val) {
                        setTestValues((prev) => {
                          const next = { ...prev };
                          delete next[element.id];
                          return next;
                        });
                        return;
                      }
                      // Parse hex bytes
                      const parts = val.split(/[\s,]+/).filter(Boolean);
                      const bytes = parts.map((p) =>
                        parseInt(p.replace(/^0x/i, ""), 16),
                      );
                      if (bytes.every((b) => !isNaN(b) && b >= 0 && b <= 255)) {
                        setTestValues((prev) => ({
                          ...prev,
                          [element.id]: bytes,
                        }));
                      }
                    }}
                  />
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Composed Output */}
      <div className="p-3 bg-muted/50 rounded-lg border border-border">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-medium">
            Composed Message ({totalBytes} bytes)
          </span>
        </div>

        {/* Byte Grid with Color Coding */}
        <div className="flex flex-wrap gap-1 mb-3">
          {composedResult.map((segment, segIdx) =>
            segment.bytes.map((byte, byteIdx) => (
              <div
                key={`${segment.elementId}-${byteIdx}`}
                className={cn(
                  "w-7 h-7 flex items-center justify-center rounded border text-[10px] font-mono font-medium",
                  colors[segIdx % colors.length],
                  segment.isComputed && "opacity-60 border-dashed",
                )}
                title={`${segment.name}[${byteIdx}]`}
              >
                {byte.toString(16).padStart(2, "0").toUpperCase()}
              </div>
            )),
          )}
        </div>

        {/* Legend */}
        <div className="flex flex-wrap gap-2 text-[10px]">
          {composedResult
            .filter((seg) => seg.bytes.length > 0)
            .map((segment, idx) => (
              <div key={segment.elementId} className="flex items-center gap-1">
                <div
                  className={cn(
                    "w-3 h-3 rounded border",
                    colors[idx % colors.length],
                  )}
                />
                <span>{segment.name}</span>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
};
