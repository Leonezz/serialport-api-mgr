import React from "react";
import { FramingConfig, FramingStrategy } from "../../types";
import { Input } from "../ui/Input";
import { Select } from "../ui/Select";
import CodeEditor from "../ui/CodeEditor";
import { FRAMING } from "../../lib/constants";

interface FramingConfigEditorProps {
  /** Current framing configuration */
  config: FramingConfig;

  /** Callback when configuration changes */
  onChange: (updates: Partial<FramingConfig>) => void;

  /** Show persistence indicator (for command-specific framing) */
  showPersistence?: boolean;

  /** Compact mode (reduced spacing) */
  compact?: boolean;

  /** Custom label */
  label?: string;
}

const DEFAULT_FRAMER_SCRIPT = `// Custom Framer Script
// Args: chunks (Array<{data: Uint8Array, timestamp: number}>), forceFlush (boolean)
// Return: { frames: [], remaining: [] }

// Example: Merge everything into one frame on timeout/flush
if (forceFlush) {
    const totalLen = chunks.reduce((acc, c) => acc + c.data.length, 0);
    const merged = new Uint8Array(totalLen);
    let offset = 0;
    for(const c of chunks) {
        merged.set(c.data, offset);
        offset += c.data.length;
    }
    // Return single combined frame
    return {
        frames: [{ data: merged, timestamp: Date.now() }],
        remaining: []
    };
}

// Keep accumulating if not flushed
return { frames: [], remaining: chunks };`;

/**
 * Shared Framing Configuration Editor
 * Used in: ControlPanel, CommandFormModal, CommandEditor
 */
export const FramingConfigEditor: React.FC<FramingConfigEditorProps> = ({
  config,
  onChange,
  showPersistence = false,
  compact = false,
  label,
}) => {
  const strategy = config.strategy;
  const spacingClass = compact ? "space-y-2" : "space-y-4";

  const handleStrategyChange = (newStrategy: FramingStrategy) => {
    let newScript = config.script;
    // Auto-fill script if missing or using old default when switching to SCRIPT
    if (
      newStrategy === "SCRIPT" &&
      (!newScript || newScript.trim() === "" || newScript.includes("return 5;"))
    ) {
      newScript = DEFAULT_FRAMER_SCRIPT;
    }
    onChange({ strategy: newStrategy, script: newScript });
  };

  return (
    <div className={spacingClass}>
      {/* Strategy Selector */}
      <div className="space-y-1">
        <div className="text-xs font-bold text-muted-foreground">
          {label || "Strategy"}
          {showPersistence && (
            <span className="text-[9px] ml-2 opacity-60">
              (Command-specific)
            </span>
          )}
        </div>
        <Select
          value={strategy}
          onChange={(e) =>
            handleStrategyChange(e.target.value as FramingStrategy)
          }
          className="h-9 text-sm w-full"
        >
          <option value="NONE">None (Raw Stream)</option>
          <option value="DELIMITER">Delimiter (Char/Hex)</option>
          <option value="TIMEOUT">Timeout (Silence)</option>
          <option value="PREFIX_LENGTH">Prefix Length (Header)</option>
          <option value="SCRIPT">Custom Script (JS)</option>
        </Select>
        <p className="text-[10px] text-muted-foreground opacity-70 px-1 pt-1 h-8">
          {strategy === "NONE" &&
            "Data is displayed exactly as received from the buffer."}
          {strategy === "DELIMITER" &&
            "Split data into frames when a specific character sequence is found."}
          {strategy === "TIMEOUT" &&
            "Group data into frames when a silence period is detected."}
          {strategy === "PREFIX_LENGTH" &&
            "First N bytes define the length of the following frame payload."}
          {strategy === "SCRIPT" &&
            "Use JavaScript to find and extract frames from the buffer."}
        </p>
      </div>

      {/* DELIMITER Strategy */}
      {strategy === "DELIMITER" && (
        <div className="space-y-1 animate-in slide-in-from-top-2">
          <div className="text-xs font-bold text-muted-foreground">
            Delimiter (Hex/Text)
          </div>
          <Input
            value={config.delimiter || ""}
            onChange={(e) => onChange({ delimiter: e.target.value })}
            placeholder="e.g. \n or 0D 0A"
            className="h-9 text-sm font-mono"
          />
          <div className="text-[9px] text-muted-foreground opacity-70">
            Use text (\n, \r) or Hex bytes separated by space (AA BB).
          </div>
        </div>
      )}

      {/* TIMEOUT Strategy */}
      {strategy === "TIMEOUT" && (
        <div className="space-y-1 animate-in slide-in-from-top-2">
          <div className="text-xs font-bold text-muted-foreground">
            Timeout (ms)
          </div>
          <Input
            type="number"
            value={config.timeout || FRAMING.DEFAULT_TIMEOUT_MS}
            onChange={(e) => onChange({ timeout: parseInt(e.target.value) })}
            min={1}
            className="h-9 text-sm"
          />
          <div className="text-[9px] text-muted-foreground opacity-70">
            Wait time after last byte to consider frame complete.
          </div>
        </div>
      )}

      {/* PREFIX_LENGTH Strategy */}
      {strategy === "PREFIX_LENGTH" && (
        <div className="space-y-3 animate-in slide-in-from-top-2">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <div className="text-xs font-bold text-muted-foreground">
                Length Bytes
              </div>
              <Input
                type="number"
                min={1}
                max={8}
                value={
                  config.prefixLengthSize || FRAMING.DEFAULT_PREFIX_LENGTH_SIZE
                }
                onChange={(e) =>
                  onChange({ prefixLengthSize: parseInt(e.target.value) })
                }
                className="h-9 text-sm"
              />
            </div>
            <div className="space-y-1">
              <div className="text-xs font-bold text-muted-foreground">
                Byte Order
              </div>
              <Select
                value={config.byteOrder || "LE"}
                onChange={(e) =>
                  onChange({ byteOrder: e.target.value as "LE" | "BE" })
                }
                className="h-9 text-sm"
                disabled={config.prefixLengthSize === 1}
              >
                <option value="LE">Little Endian</option>
                <option value="BE">Big Endian</option>
              </Select>
            </div>
          </div>
          <div className="text-[9px] text-muted-foreground opacity-70">
            Expects{" "}
            {config.prefixLengthSize || FRAMING.DEFAULT_PREFIX_LENGTH_SIZE}{" "}
            byte(s) at start, followed by that many bytes of data.
          </div>
        </div>
      )}

      {/* SCRIPT Strategy */}
      {strategy === "SCRIPT" && (
        <div className="space-y-2 animate-in slide-in-from-top-2">
          <div className="text-xs font-bold text-muted-foreground flex justify-between">
            <span>Framer Script</span>
            <span className="font-mono text-[9px]">
              args: chunks, forceFlush
            </span>
          </div>
          <CodeEditor
            value={config.script || ""}
            onChange={(val) => onChange({ script: val })}
            placeholder="// return { frames: [], remaining: [] }"
            height="200px"
            className="border-l-4 border-l-purple-500/30"
          />
          <div className="text-[9px] text-muted-foreground opacity-70 bg-muted/20 p-2 rounded border border-border/50">
            <strong>Return:</strong>{" "}
            <code>{`{ frames: TimedChunk[], remaining: TimedChunk[] }`}</code>
            <br />
            Combine chunks manually using Uint8Array. Use forceFlush to output
            incomplete buffers.
          </div>
        </div>
      )}
    </div>
  );
};

export default FramingConfigEditor;
