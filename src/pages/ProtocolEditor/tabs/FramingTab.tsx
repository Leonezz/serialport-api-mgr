/**
 * Protocol Editor - Framing Tab
 *
 * Configures message framing strategies for the protocol
 */

import { useState } from "react";
import { Code, Eye, Info, Plus, Trash2 } from "lucide-react";
import {
  Badge,
  Button,
  Card,
  Checkbox,
  DragHandle,
  HexInput,
  Input,
  Label,
  NumberInput,
  Select,
  SortableList,
  Textarea,
  type DragHandleProps,
} from "../../../components/ui";
import { cn } from "../../../lib/utils";
import type {
  FramingConfig,
  FramingStep,
  Protocol,
} from "../../../lib/protocolTypes";
import { stringToHexDisplay } from "../helpers";

// ============================================================================
// DELIMITER CONFIG COMPONENT
// ============================================================================

interface DelimiterConfigProps {
  framing: FramingConfig;
  onChange: (updates: Partial<FramingConfig>) => void;
}

const DelimiterConfig: React.FC<DelimiterConfigProps> = ({
  framing,
  onChange,
}) => {
  const delimiter = framing.delimiter;
  // Track editing state separately to allow empty input during editing
  const [editingValue, setEditingValue] = useState<string | null>(null);

  // Get current delimiter as display string
  const getDelimiterDisplay = (): string => {
    if (!delimiter?.sequence) return "";
    if (typeof delimiter.sequence === "string") {
      // Convert special chars to escape sequences for display
      return delimiter.sequence
        .replace(/\r/g, "\\r")
        .replace(/\n/g, "\\n")
        .replace(/\t/g, "\\t")
        .replace(/\0/g, "\\0");
    }
    // Number array - convert to escape sequence string
    return delimiter.sequence
      .map((b) => {
        if (b === 0x0d) return "\\r";
        if (b === 0x0a) return "\\n";
        if (b === 0x09) return "\\t";
        if (b === 0x00) return "\\0";
        if (b >= 32 && b < 127) return String.fromCharCode(b);
        return `\\x${b.toString(16).padStart(2, "0")}`;
      })
      .join("");
  };

  // Display value: editing string when focused, formatted value when not
  const displayValue =
    editingValue !== null ? editingValue : getDelimiterDisplay();

  // Get hex preview of delimiter
  const getHexPreview = (): string => {
    if (!delimiter?.sequence) return "0x0D 0x0A";
    if (typeof delimiter.sequence === "string") {
      return stringToHexDisplay(delimiter.sequence);
    }
    return delimiter.sequence
      .map((b) => "0x" + b.toString(16).toUpperCase().padStart(2, "0"))
      .join(" ");
  };

  const handleDelimiterChange = (value: string) => {
    // Parse escape sequences
    const parsed = value
      .replace(/\\r/g, "\r")
      .replace(/\\n/g, "\n")
      .replace(/\\t/g, "\t")
      .replace(/\\0/g, "\0")
      .replace(/\\x([0-9a-fA-F]{2})/g, (_, hex) =>
        String.fromCharCode(parseInt(hex, 16)),
      );
    onChange({
      delimiter: {
        ...delimiter,
        sequence: parsed,
        position: delimiter?.position || "SUFFIX",
        includeInFrame: delimiter?.includeInFrame ?? false,
      },
    });
  };

  const handlePositionChange = (position: "SUFFIX" | "PREFIX") => {
    onChange({
      delimiter: {
        ...delimiter,
        sequence: delimiter?.sequence || "\r\n",
        position,
        includeInFrame: delimiter?.includeInFrame ?? false,
      },
    });
  };

  const handleIncludeChange = (includeInFrame: boolean) => {
    onChange({
      delimiter: {
        ...delimiter,
        sequence: delimiter?.sequence || "\r\n",
        position: delimiter?.position || "SUFFIX",
        includeInFrame,
      },
    });
  };

  return (
    <div className="p-4 border border-border rounded-lg space-y-4">
      <h3 className="font-medium">Delimiter Options</h3>

      {/* Delimiter Value with Hex Preview */}
      <div className="space-y-2">
        <Label>Delimiter Value</Label>
        <div className="grid grid-cols-2 gap-3">
          <Input
            value={displayValue}
            onChange={(e) => setEditingValue(e.target.value)}
            onFocus={() => setEditingValue(getDelimiterDisplay())}
            onBlur={() => {
              // Apply default if empty, otherwise commit the value
              if (editingValue === "") {
                handleDelimiterChange("\\r\\n");
              } else if (editingValue !== null) {
                handleDelimiterChange(editingValue);
              }
              setEditingValue(null);
            }}
            placeholder="\r\n"
          />
          <div className="flex items-center px-3 bg-muted rounded-md border border-border font-mono text-sm text-muted-foreground">
            {getHexPreview()}
          </div>
        </div>
        <p className="text-xs text-muted-foreground">
          Use escape sequences: \r (CR), \n (LF), \t (Tab), \x00 (hex byte)
        </p>
      </div>

      {/* Delimiter Position - Radio Buttons */}
      <div className="space-y-2">
        <Label>Delimiter Position</Label>
        <div className="flex gap-4 p-2 bg-muted/30 rounded-lg border border-border/50">
          <label className="flex items-center gap-2 cursor-pointer flex-1 p-2 rounded-md hover:bg-background/50 transition-colors">
            <input
              type="radio"
              name="delimiter-position"
              checked={delimiter?.position === "PREFIX"}
              onChange={() => handlePositionChange("PREFIX")}
              className="w-4 h-4 accent-primary"
            />
            <div className="flex flex-col">
              <span className="text-sm font-medium">Before frame</span>
              <span className="text-xs text-muted-foreground">
                Delimiter → Data
              </span>
            </div>
          </label>
          <label className="flex items-center gap-2 cursor-pointer flex-1 p-2 rounded-md hover:bg-background/50 transition-colors">
            <input
              type="radio"
              name="delimiter-position"
              checked={delimiter?.position === "SUFFIX" || !delimiter?.position}
              onChange={() => handlePositionChange("SUFFIX")}
              className="w-4 h-4 accent-primary"
            />
            <div className="flex flex-col">
              <span className="text-sm font-medium">After frame</span>
              <span className="text-xs text-muted-foreground">
                Data → Delimiter
              </span>
            </div>
          </label>
        </div>
      </div>

      {/* Include in Frame Checkbox */}
      <div className="flex items-center gap-2">
        <Checkbox
          id="include-delimiter"
          checked={delimiter?.includeInFrame ?? false}
          onChange={(e) => handleIncludeChange(e.target.checked)}
        />
        <Label
          htmlFor="include-delimiter"
          className="font-normal cursor-pointer"
        >
          Include delimiter in frame data
        </Label>
      </div>

      {/* Max Frame Length */}
      <div className="space-y-2">
        <Label>Max Frame Length</Label>
        <div className="flex items-center gap-2">
          <NumberInput
            value={framing.maxFrameLength}
            defaultValue={0}
            min={0}
            onChange={(val) => onChange({ maxFrameLength: val ?? 0 })}
            className="w-32"
          />
          <span className="text-sm text-muted-foreground whitespace-nowrap">
            bytes (0 = unlimited)
          </span>
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// FRAMING TAB COMPONENT
// ============================================================================

export interface FramingTabProps {
  editState: Protocol;
  onChange: <K extends keyof Protocol>(key: K, value: Protocol[K]) => void;
}

export const FramingTab: React.FC<FramingTabProps> = ({
  editState,
  onChange,
}) => {
  const framing = editState.framing;
  const [showPreview, setShowPreview] = useState(false);
  const [previewInput, setPreviewInput] = useState(
    "48 65 6C 6C 6F 0D 0A 57 6F 72 6C 64 0D 0A",
  );

  const handleFramingChange = (updates: Partial<FramingConfig>) => {
    onChange("framing", { ...framing, ...updates });
  };

  // Parse hex input for preview
  const parseHexInput = (hex: string): number[] => {
    return hex
      .split(/[\s,]+/)
      .filter((s) => s.length > 0)
      .map((s) => parseInt(s, 16))
      .filter((n) => !isNaN(n));
  };

  // Generate framing preview
  const generatePreview = () => {
    const bytes = parseHexInput(previewInput);
    if (bytes.length === 0) return [];

    const frames: {
      start: number;
      end: number;
      bytes: number[];
      delimStart?: number;
      delimEnd?: number;
      isTimeoutFrame?: boolean;
    }[] = [];

    switch (framing.strategy) {
      case "NONE":
        frames.push({ start: 0, end: bytes.length, bytes });
        break;
      case "DELIMITER": {
        const delim =
          typeof framing.delimiter?.sequence === "string"
            ? framing.delimiter.sequence.split("").map((c) => c.charCodeAt(0))
            : framing.delimiter?.sequence || [0x0d, 0x0a];
        const position = framing.delimiter?.position || "SUFFIX";
        const includeInFrame = framing.delimiter?.includeInFrame ?? false;

        if (position === "SUFFIX") {
          // Delimiter comes after frame data
          let start = 0;
          for (let i = 0; i <= bytes.length - delim.length; i++) {
            let match = true;
            for (let j = 0; j < delim.length; j++) {
              if (bytes[i + j] !== delim[j]) {
                match = false;
                break;
              }
            }
            if (match) {
              // Frame ends at delimiter position (or includes delimiter)
              const frameEnd = includeInFrame ? i + delim.length : i;
              const delimEnd = i + delim.length;
              if (frameEnd > start) {
                frames.push({
                  start,
                  end: delimEnd,
                  bytes: bytes.slice(start, frameEnd),
                  delimStart: i,
                  delimEnd: delimEnd,
                });
              }
              start = delimEnd;
              i += delim.length - 1;
            }
          }
          // Remaining bytes (incomplete frame)
          if (start < bytes.length) {
            frames.push({
              start,
              end: bytes.length,
              bytes: bytes.slice(start),
            });
          }
        } else {
          // PREFIX mode: Delimiter comes before frame data
          let lastDelimEnd = 0;
          for (let i = 0; i <= bytes.length - delim.length; i++) {
            let match = true;
            for (let j = 0; j < delim.length; j++) {
              if (bytes[i + j] !== delim[j]) {
                match = false;
                break;
              }
            }
            if (match) {
              // If we have data before this delimiter, it's an incomplete frame
              if (lastDelimEnd < i && lastDelimEnd > 0) {
                frames.push({
                  start: lastDelimEnd,
                  end: i,
                  bytes: bytes.slice(lastDelimEnd, i),
                });
              }
              // Mark delimiter position
              lastDelimEnd = i + delim.length;
              // For prefix, frame starts at delimiter (or after delimiter)
              const frameStart = includeInFrame ? i : i + delim.length;
              // Find next delimiter or end of data
              let nextDelimPos = bytes.length;
              for (
                let k = lastDelimEnd;
                k <= bytes.length - delim.length;
                k++
              ) {
                let nextMatch = true;
                for (let j = 0; j < delim.length; j++) {
                  if (bytes[k + j] !== delim[j]) {
                    nextMatch = false;
                    break;
                  }
                }
                if (nextMatch) {
                  nextDelimPos = k;
                  break;
                }
              }
              if (nextDelimPos > lastDelimEnd || includeInFrame) {
                frames.push({
                  start: i,
                  end: nextDelimPos,
                  bytes: bytes.slice(frameStart, nextDelimPos),
                  delimStart: i,
                  delimEnd: i + delim.length,
                });
              }
              i += delim.length - 1;
            }
          }
        }
        break;
      }
      case "TIMEOUT":
        // For preview, show as single frame with note about timing
        // Timeout framing requires actual timing data which we can't simulate
        frames.push({
          start: 0,
          end: bytes.length,
          bytes,
          isTimeoutFrame: true,
        });
        break;
      case "LENGTH_FIELD": {
        const offset = framing.lengthField?.offset || 0;
        const size = framing.lengthField?.size || 1;
        const adjustment = framing.lengthField?.adjustment || 0;
        const byteOrder = framing.lengthField?.byteOrder || "BE";
        const includesHeader = framing.lengthField?.includesHeader ?? false;
        let pos = 0;
        while (pos < bytes.length) {
          if (pos + offset + size > bytes.length) break;
          let lengthValue = 0;
          for (let i = 0; i < size; i++) {
            const idx = byteOrder === "BE" ? i : size - 1 - i;
            lengthValue = (lengthValue << 8) | bytes[pos + offset + idx];
          }
          lengthValue += adjustment;
          // Calculate frame end based on whether length includes header
          // If includesHeader: length value is total frame size from pos
          // If not: length value is body size, add header (offset + size)
          const frameEnd = includesHeader
            ? Math.min(pos + lengthValue, bytes.length)
            : Math.min(pos + offset + size + lengthValue, bytes.length);
          frames.push({
            start: pos,
            end: frameEnd,
            bytes: bytes.slice(pos, frameEnd),
          });
          pos = frameEnd;
        }
        break;
      }
      case "SYNC_PATTERN": {
        const pattern = framing.syncPattern?.pattern || [0x55, 0xaa];
        let start = -1;
        for (let i = 0; i <= bytes.length - pattern.length; i++) {
          let match = true;
          for (let j = 0; j < pattern.length; j++) {
            if (bytes[i + j] !== pattern[j]) {
              match = false;
              break;
            }
          }
          if (match) {
            if (start >= 0 && start < i) {
              frames.push({
                start,
                end: i,
                bytes: bytes.slice(start, i),
              });
            }
            start = i;
          }
        }
        if (start >= 0) {
          frames.push({
            start,
            end: bytes.length,
            bytes: bytes.slice(start),
          });
        }
        break;
      }
      default:
        frames.push({ start: 0, end: bytes.length, bytes });
    }

    return frames;
  };

  const previewFrames = showPreview ? generatePreview() : [];

  // Handler for composite step changes
  const handleCompositeStepChange = (
    index: number,
    updates: Partial<FramingStep>,
  ) => {
    const steps = [...(framing.composite?.steps || [])];
    steps[index] = { ...steps[index], ...updates };
    handleFramingChange({ composite: { steps } });
  };

  const handleAddCompositeStep = () => {
    const steps = [...(framing.composite?.steps || [])];
    steps.push({ type: "FIND_SYNC", syncBytes: [0x55, 0xaa] });
    handleFramingChange({ composite: { steps } });
  };

  const handleRemoveCompositeStep = (index: number) => {
    const steps = [...(framing.composite?.steps || [])];
    steps.splice(index, 1);
    handleFramingChange({ composite: { steps } });
  };

  const handleReorderCompositeSteps = (
    reorderedSteps: (FramingStep & { _id: string })[],
  ) => {
    // Remove temporary _id when saving
    const steps = reorderedSteps.map(({ _id, ...step }) => step);
    handleFramingChange({ composite: { steps } });
  };

  return (
    <div className="space-y-6">
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold">Framing Strategy</h2>
            <p className="text-sm text-muted-foreground">
              Configure how message boundaries are detected in the data stream.
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="gap-2"
            onClick={() => setShowPreview(!showPreview)}
          >
            <Eye className="w-4 h-4" />
            {showPreview ? "Hide Preview" : "Show Preview"}
          </Button>
        </div>

        <div className="space-y-2">
          <Label>Strategy</Label>
          <Select
            value={framing.strategy}
            onChange={(e) =>
              handleFramingChange({
                strategy: e.target.value as FramingConfig["strategy"],
              })
            }
          >
            <option value="NONE">None (Pass-through)</option>
            <option value="DELIMITER">Delimiter</option>
            <option value="TIMEOUT">Timeout (Silence-based)</option>
            <option value="LENGTH_FIELD">Length Field</option>
            <option value="SYNC_PATTERN">Sync Pattern</option>
            <option value="COMPOSITE">Composite (Multi-step)</option>
            <option value="SCRIPT">Custom Script</option>
          </Select>
        </div>

        {/* Strategy-specific configuration */}
        {framing.strategy === "DELIMITER" && (
          <DelimiterConfig framing={framing} onChange={handleFramingChange} />
        )}

        {framing.strategy === "TIMEOUT" && (
          <div className="p-4 border border-border rounded-lg space-y-4">
            <h3 className="font-medium">Timeout Configuration</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Silence Duration (ms)</Label>
                <NumberInput
                  value={framing.timeout?.silenceMs}
                  defaultValue={4}
                  min={1}
                  onChange={(val) =>
                    handleFramingChange({
                      timeout: {
                        ...framing.timeout,
                        silenceMs: val ?? 4,
                      },
                    })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Minimum Bytes</Label>
                <NumberInput
                  value={framing.timeout?.minBytes}
                  defaultValue={1}
                  min={1}
                  onChange={(val) =>
                    handleFramingChange({
                      timeout: {
                        ...framing.timeout,
                        silenceMs: framing.timeout?.silenceMs || 4,
                        minBytes: val,
                      },
                    })
                  }
                />
              </div>
            </div>
            <div className="flex items-start gap-2 p-3 bg-muted/50 rounded-md">
              <Info className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
              <p className="text-sm text-muted-foreground">
                Modbus RTU uses silence-based framing. A message ends when the
                bus is silent for 3.5 character transmission times. At 9600
                baud, this is approximately 4ms.
              </p>
            </div>
          </div>
        )}

        {framing.strategy === "LENGTH_FIELD" && (
          <div className="p-4 border border-border rounded-lg space-y-4">
            <h3 className="font-medium">Length Field Configuration</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Offset (bytes from start)</Label>
                <NumberInput
                  value={framing.lengthField?.offset}
                  defaultValue={0}
                  min={0}
                  onChange={(val) =>
                    handleFramingChange({
                      lengthField: {
                        ...framing.lengthField,
                        offset: val ?? 0,
                        size: framing.lengthField?.size || 1,
                      },
                    })
                  }
                />
                <p className="text-xs text-muted-foreground">
                  Position of length field from frame start
                </p>
              </div>
              <div className="space-y-2">
                <Label>Size (bytes)</Label>
                <Select
                  value={framing.lengthField?.size || 1}
                  onChange={(e) =>
                    handleFramingChange({
                      lengthField: {
                        ...framing.lengthField,
                        offset: framing.lengthField?.offset || 0,
                        size: parseInt(e.target.value) as 1 | 2 | 4,
                      },
                    })
                  }
                >
                  <option value={1}>1 byte (0-255)</option>
                  <option value={2}>2 bytes (0-65535)</option>
                  <option value={4}>4 bytes</option>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Byte Order</Label>
                <Select
                  value={framing.lengthField?.byteOrder || "BE"}
                  onChange={(e) =>
                    handleFramingChange({
                      lengthField: {
                        ...framing.lengthField,
                        offset: framing.lengthField?.offset || 0,
                        size: framing.lengthField?.size || 1,
                        byteOrder: e.target.value as "LE" | "BE",
                      },
                    })
                  }
                >
                  <option value="BE">Big Endian (MSB first)</option>
                  <option value="LE">Little Endian (LSB first)</option>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Adjustment</Label>
                <NumberInput
                  value={framing.lengthField?.adjustment}
                  defaultValue={0}
                  onChange={(val) =>
                    handleFramingChange({
                      lengthField: {
                        ...framing.lengthField,
                        offset: framing.lengthField?.offset || 0,
                        size: framing.lengthField?.size || 1,
                        adjustment: val ?? 0,
                      },
                    })
                  }
                />
                <p className="text-xs text-muted-foreground">
                  Add to length value (use negative to exclude header)
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 mt-2">
              <Checkbox
                id="includes-header"
                checked={framing.lengthField?.includesHeader ?? false}
                onChange={(e) =>
                  handleFramingChange({
                    lengthField: {
                      ...framing.lengthField,
                      offset: framing.lengthField?.offset || 0,
                      size: framing.lengthField?.size || 1,
                      includesHeader: e.target.checked,
                    },
                  })
                }
              />
              <Label
                htmlFor="includes-header"
                className="font-normal cursor-pointer"
              >
                Length includes header bytes
              </Label>
            </div>
            <div className="flex items-start gap-2 p-3 bg-muted/50 rounded-md">
              <Info className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
              <div className="text-sm text-muted-foreground space-y-1">
                <p>
                  <strong>Frame size</strong> = Length value + Adjustment
                </p>
                <p>
                  If &quot;includes header&quot; is checked, the length value
                  already accounts for header bytes. Otherwise, add header size
                  via adjustment.
                </p>
              </div>
            </div>
          </div>
        )}

        {framing.strategy === "SYNC_PATTERN" && (
          <div className="p-4 border border-border rounded-lg space-y-4">
            <h3 className="font-medium">Sync Pattern Configuration</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Sync Bytes</Label>
                <HexInput
                  value={(framing.syncPattern?.pattern || [0x55, 0xaa])
                    .map((b) => b.toString(16).padStart(2, "0").toUpperCase())
                    .join(" ")}
                  onChange={(val) => {
                    const trimmed = val.trim();
                    // Allow empty input - don't force default during editing
                    if (trimmed === "") {
                      handleFramingChange({
                        syncPattern: {
                          pattern: [],
                          maxScan: framing.syncPattern?.maxScan || 1024,
                        },
                      });
                      return;
                    }
                    const pattern = trimmed
                      .split(/[\s,]+/)
                      .filter((s) => s.length > 0)
                      .map((s) => parseInt(s, 16))
                      .filter((n) => !isNaN(n) && n >= 0 && n <= 255);
                    handleFramingChange({
                      syncPattern: {
                        pattern,
                        maxScan: framing.syncPattern?.maxScan || 1024,
                      },
                    });
                  }}
                  placeholder="55 AA"
                  showByteCount
                />
              </div>
              <div className="space-y-2">
                <Label>Max Scan (bytes)</Label>
                <NumberInput
                  value={framing.syncPattern?.maxScan}
                  defaultValue={1024}
                  min={1}
                  onChange={(val) =>
                    handleFramingChange({
                      syncPattern: {
                        pattern: framing.syncPattern?.pattern || [0x55, 0xaa],
                        maxScan: val ?? 1024,
                      },
                    })
                  }
                />
                <p className="text-xs text-muted-foreground">
                  Max bytes to scan for pattern
                </p>
              </div>
            </div>
            <div className="flex items-start gap-2 p-3 bg-muted/50 rounded-md">
              <Info className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
              <p className="text-sm text-muted-foreground">
                The sync pattern marks the start of each message frame. Common
                patterns include 0x55 0xAA for many industrial protocols.
              </p>
            </div>
          </div>
        )}

        {framing.strategy === "COMPOSITE" && (
          <div className="p-4 border border-border rounded-lg space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-medium">Composite Framing Steps</h3>
              <Button
                variant="outline"
                size="sm"
                className="gap-2"
                onClick={handleAddCompositeStep}
              >
                <Plus className="w-4 h-4" />
                Add Step
              </Button>
            </div>

            {(framing.composite?.steps || []).length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <p>
                  No steps defined. Add steps to build a multi-stage framer.
                </p>
              </div>
            ) : (
              <SortableList
                items={(framing.composite?.steps || []).map((step, i) => ({
                  ...step,
                  _id: `step-${i}`,
                }))}
                getItemId={(step) => step._id}
                onReorder={handleReorderCompositeSteps}
                className="space-y-3"
                renderItem={(
                  step: FramingStep & { _id: string },
                  index: number,
                  dragHandleProps: DragHandleProps,
                ) => (
                  <Card
                    className={cn(
                      "overflow-hidden transition-all",
                      dragHandleProps.isDragging && "border-primary shadow-lg",
                    )}
                  >
                    <div className="flex">
                      {/* Drag Handle */}
                      <div className="px-2 bg-muted/50 border-r border-border flex items-center">
                        <DragHandle {...dragHandleProps} />
                      </div>
                      {/* Content */}
                      <div className="flex-1 p-3">
                        <div className="flex items-center justify-between mb-3">
                          <Badge variant="outline" className="font-medium">
                            Step {index + 1}: {step.type.replace(/_/g, " ")}
                          </Badge>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 hover:bg-destructive/10"
                            onClick={() => handleRemoveCompositeStep(index)}
                          >
                            <Trash2 className="w-4 h-4 text-destructive" />
                          </Button>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-1">
                            <Label className="text-xs">Step Type</Label>
                            <Select
                              value={step.type}
                              onChange={(e) =>
                                handleCompositeStepChange(index, {
                                  type: e.target.value as FramingStep["type"],
                                })
                              }
                            >
                              <option value="FIND_SYNC">Find Sync</option>
                              <option value="READ_LENGTH">Read Length</option>
                              <option value="READ_FIXED">
                                Read Fixed Bytes
                              </option>
                              <option value="FIND_DELIMITER">
                                Find Delimiter
                              </option>
                            </Select>
                          </div>
                          {step.type === "FIND_SYNC" && (
                            <div className="space-y-1">
                              <Label className="text-xs">
                                Sync Bytes (hex)
                              </Label>
                              <Input
                                value={(step.syncBytes || [])
                                  .map((b) =>
                                    b
                                      .toString(16)
                                      .padStart(2, "0")
                                      .toUpperCase(),
                                  )
                                  .join(", ")}
                                onChange={(e) => {
                                  const syncBytes = e.target.value
                                    .split(/[\s,]+/)
                                    .filter((s) => s.length > 0)
                                    .map((s) => parseInt(s, 16))
                                    .filter(
                                      (n) => !isNaN(n) && n >= 0 && n <= 255,
                                    );
                                  handleCompositeStepChange(index, {
                                    syncBytes,
                                  });
                                }}
                                placeholder="55, AA"
                              />
                            </div>
                          )}
                          {step.type === "READ_LENGTH" && (
                            <>
                              <div className="space-y-1">
                                <Label className="text-xs">Length Size</Label>
                                <Select
                                  value={step.lengthSize || 1}
                                  onChange={(e) =>
                                    handleCompositeStepChange(index, {
                                      lengthSize: parseInt(e.target.value) as
                                        | 1
                                        | 2
                                        | 4,
                                    })
                                  }
                                >
                                  <option value={1}>1 byte</option>
                                  <option value={2}>2 bytes</option>
                                  <option value={4}>4 bytes</option>
                                </Select>
                              </div>
                              <div className="space-y-1">
                                <Label className="text-xs">Byte Order</Label>
                                <Select
                                  value={step.lengthByteOrder || "BE"}
                                  onChange={(e) =>
                                    handleCompositeStepChange(index, {
                                      lengthByteOrder: e.target.value as
                                        | "LE"
                                        | "BE",
                                    })
                                  }
                                >
                                  <option value="BE">Big Endian</option>
                                  <option value="LE">Little Endian</option>
                                </Select>
                              </div>
                            </>
                          )}
                          {step.type === "READ_FIXED" && (
                            <div className="space-y-1">
                              <Label className="text-xs">Fixed Bytes</Label>
                              <NumberInput
                                value={step.fixedBytes}
                                defaultValue={0}
                                min={0}
                                onChange={(val) =>
                                  handleCompositeStepChange(index, {
                                    fixedBytes: val ?? 0,
                                  })
                                }
                              />
                            </div>
                          )}
                          {step.type === "FIND_DELIMITER" && (
                            <div className="space-y-1">
                              <Label className="text-xs">Delimiter (hex)</Label>
                              <Input
                                value={(step.delimiter || [])
                                  .map((b) =>
                                    b
                                      .toString(16)
                                      .padStart(2, "0")
                                      .toUpperCase(),
                                  )
                                  .join(", ")}
                                onChange={(e) => {
                                  const delimiter = e.target.value
                                    .split(/[\s,]+/)
                                    .filter((s) => s.length > 0)
                                    .map((s) => parseInt(s, 16))
                                    .filter(
                                      (n) => !isNaN(n) && n >= 0 && n <= 255,
                                    );
                                  handleCompositeStepChange(index, {
                                    delimiter,
                                  });
                                }}
                                placeholder="0D, 0A"
                              />
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </Card>
                )}
              />
            )}

            <div className="flex items-start gap-2 p-3 bg-muted/50 rounded-md">
              <Info className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
              <p className="text-sm text-muted-foreground">
                Composite framing allows building complex framers by chaining
                multiple steps. Each step processes the data stream in sequence.
              </p>
            </div>
          </div>
        )}

        {framing.strategy === "SCRIPT" && (
          <div className="p-4 border border-border rounded-lg space-y-4">
            <h3 className="font-medium flex items-center gap-2">
              <Code className="w-4 h-4" />
              Custom Framing Script
            </h3>
            <Textarea
              value={framing.script?.code || ""}
              onChange={(e) =>
                handleFramingChange({
                  script: { code: e.target.value },
                })
              }
              placeholder={`// Custom framing script
// Available: buffer (Uint8Array), emit(frame), flush()
// Return: number of bytes consumed

const DELIMITER = [0x0D, 0x0A];
let pos = 0;
while (pos < buffer.length - 1) {
  if (buffer[pos] === DELIMITER[0] && buffer[pos + 1] === DELIMITER[1]) {
    emit(buffer.slice(0, pos + 2));
    return pos + 2;
  }
  pos++;
}
return 0; // Need more data`}
              rows={12}
              className="font-mono text-sm"
            />
            <div className="flex items-start gap-2 p-3 bg-muted/50 rounded-md">
              <Info className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
              <p className="text-sm text-muted-foreground">
                Write JavaScript to implement custom framing logic. The script
                receives a <code className="text-xs bg-muted px-1">buffer</code>{" "}
                and should call{" "}
                <code className="text-xs bg-muted px-1">emit(frame)</code> for
                each complete frame, returning the number of bytes consumed.
              </p>
            </div>
          </div>
        )}
      </section>

      {/* Framing Preview */}
      {showPreview && (
        <section className="space-y-4 p-4 border border-border rounded-lg bg-muted/20">
          <div className="flex items-center gap-2">
            <Eye className="w-4 h-4" />
            <h3 className="font-medium">Framing Preview</h3>
          </div>
          <div className="space-y-2">
            <Label>Test Data (hex bytes)</Label>
            <Input
              value={previewInput}
              onChange={(e) => setPreviewInput(e.target.value)}
              placeholder="48 65 6C 6C 6F 0D 0A"
              className="font-mono"
            />
          </div>

          {/* Color-Coded Byte Grid */}
          {(() => {
            const allBytes = parseHexInput(previewInput);
            if (allBytes.length === 0) {
              return (
                <p className="text-sm text-muted-foreground">
                  Enter hex bytes above to see framing preview.
                </p>
              );
            }

            // Frame colors (cycle through for multiple frames)
            const frameColors = [
              "bg-blue-100 dark:bg-blue-900/40 border-blue-300 dark:border-blue-700",
              "bg-green-100 dark:bg-green-900/40 border-green-300 dark:border-green-700",
              "bg-amber-100 dark:bg-amber-900/40 border-amber-300 dark:border-amber-700",
              "bg-purple-100 dark:bg-purple-900/40 border-purple-300 dark:border-purple-700",
              "bg-cyan-100 dark:bg-cyan-900/40 border-cyan-300 dark:border-cyan-700",
            ];
            const delimiterColor =
              "bg-rose-200 dark:bg-rose-800/60 border-rose-400 dark:border-rose-600";

            // Check if a byte at position is a delimiter byte
            const isDelimiterByte = (byteIndex: number): boolean => {
              if (framing.strategy !== "DELIMITER") return false;
              for (const frame of previewFrames) {
                // Use delimStart/delimEnd from frame if available
                const f = frame as {
                  delimStart?: number;
                  delimEnd?: number;
                };
                if (
                  f.delimStart !== undefined &&
                  f.delimEnd !== undefined &&
                  byteIndex >= f.delimStart &&
                  byteIndex < f.delimEnd
                ) {
                  return true;
                }
              }
              return false;
            };

            // Get frame index for a byte position
            const getFrameIndex = (byteIndex: number): number => {
              for (let i = 0; i < previewFrames.length; i++) {
                if (
                  byteIndex >= previewFrames[i].start &&
                  byteIndex < previewFrames[i].end
                ) {
                  return i;
                }
              }
              return -1;
            };

            return (
              <div className="space-y-4">
                {/* Timeout Strategy Note */}
                {framing.strategy === "TIMEOUT" && (
                  <div className="flex items-start gap-2 p-3 bg-blue-500/10 border border-blue-500/30 rounded-md text-xs text-blue-600 dark:text-blue-400">
                    <Info className="w-4 h-4 mt-0.5 shrink-0" />
                    <div>
                      <strong>Note:</strong> Timeout-based framing cannot be
                      visualized in this static preview. In actual operation,
                      frames are detected by silence periods (gaps of{" "}
                      {framing.timeout?.silenceMs || 4}ms or more between
                      bytes). The preview shows all test bytes as a single frame
                      for reference.
                    </div>
                  </div>
                )}

                {/* Byte Grid */}
                <div className="space-y-2">
                  <Label>
                    Byte Grid ({allBytes.length} bytes, {previewFrames.length}{" "}
                    frame{previewFrames.length !== 1 ? "s" : ""})
                  </Label>
                  <div className="p-3 bg-background border border-border rounded-md overflow-x-auto">
                    {/* Hex Row */}
                    <div className="flex flex-wrap gap-0.5 font-mono text-xs">
                      {allBytes.map((byte, idx) => {
                        const frameIdx = getFrameIndex(idx);
                        const isDelim = isDelimiterByte(idx);
                        const colorClass = isDelim
                          ? delimiterColor
                          : frameIdx >= 0
                            ? frameColors[frameIdx % frameColors.length]
                            : "bg-muted";
                        return (
                          <div
                            key={idx}
                            className={cn(
                              "w-7 h-7 flex items-center justify-center rounded border text-[10px] font-medium",
                              colorClass,
                            )}
                            title={`Offset ${idx}: 0x${byte.toString(16).padStart(2, "0").toUpperCase()}${
                              isDelim ? " (delimiter)" : ""
                            }`}
                          >
                            {byte.toString(16).padStart(2, "0").toUpperCase()}
                          </div>
                        );
                      })}
                    </div>
                    {/* ASCII Row */}
                    <div className="flex flex-wrap gap-0.5 font-mono text-xs mt-1">
                      {allBytes.map((byte, idx) => {
                        const frameIdx = getFrameIndex(idx);
                        const isDelim = isDelimiterByte(idx);
                        const colorClass = isDelim
                          ? delimiterColor
                          : frameIdx >= 0
                            ? frameColors[frameIdx % frameColors.length]
                            : "bg-muted";
                        const char =
                          byte >= 32 && byte < 127
                            ? String.fromCharCode(byte)
                            : ".";
                        return (
                          <div
                            key={idx}
                            className={cn(
                              "w-7 h-5 flex items-center justify-center rounded text-[10px] text-muted-foreground",
                              colorClass,
                              "opacity-70",
                            )}
                          >
                            {char}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Legend */}
                <div className="flex flex-wrap gap-3 text-xs">
                  {previewFrames.map((frame, i) => (
                    <div key={i} className="flex items-center gap-1.5">
                      <div
                        className={cn(
                          "w-3 h-3 rounded border",
                          frameColors[i % frameColors.length],
                        )}
                      />
                      <span className="text-muted-foreground">
                        Frame {i + 1} ({frame.bytes.length}B)
                      </span>
                    </div>
                  ))}
                  {framing.strategy === "DELIMITER" && (
                    <div className="flex items-center gap-1.5">
                      <div
                        className={cn("w-3 h-3 rounded border", delimiterColor)}
                      />
                      <span className="text-muted-foreground">Delimiter</span>
                    </div>
                  )}
                </div>

                {/* Frame Details */}
                <div className="space-y-2">
                  <Label>Frame Details</Label>
                  <div className="grid gap-2">
                    {previewFrames.map((frame, i) => (
                      <div
                        key={i}
                        className={cn(
                          "p-2 rounded-md border text-xs",
                          frameColors[i % frameColors.length],
                        )}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-medium">Frame {i + 1}</span>
                          <span className="text-muted-foreground">
                            {frame.bytes.length} bytes (offset {frame.start}-
                            {frame.end - 1})
                          </span>
                        </div>
                        <div className="mt-1 font-mono text-[10px] break-all">
                          {frame.bytes
                            .map((b) =>
                              b.toString(16).padStart(2, "0").toUpperCase(),
                            )
                            .join(" ")}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            );
          })()}
        </section>
      )}
    </div>
  );
};
