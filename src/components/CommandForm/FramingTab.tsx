import React from "react";
import { AlertTriangle } from "lucide-react";
import { Input } from "../ui/Input";
import { Label } from "../ui/Label";
import { SelectDropdown } from "../ui/Select";
import { CardContent } from "../ui/Card";
import { Checkbox } from "../ui/Checkbox";
import CodeEditor from "../ui/CodeEditor";
import type { DropdownOption } from "../ui/Dropdown";
import type { FramingStrategy, FramingConfig } from "../../types";

interface FramingTabProps {
  framingEnabled: boolean;
  onFramingEnabledChange: (enabled: boolean) => void;
  framingConfig: FramingConfig;
  onFramingConfigChange: (config: FramingConfig) => void;
  framingPersistence: "TRANSIENT" | "PERSISTENT";
  onFramingPersistenceChange: (value: "TRANSIENT" | "PERSISTENT") => void;
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

const FramingTab: React.FC<FramingTabProps> = ({
  framingEnabled,
  onFramingEnabledChange,
  framingConfig,
  onFramingConfigChange,
  framingPersistence,
  onFramingPersistenceChange,
}) => {
  return (
    <CardContent className="pt-6 space-y-6">
      <div className="p-3 bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800 rounded-md flex gap-2">
        <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-500 shrink-0 mt-0.5" />
        <div className="text-xs text-amber-800 dark:text-amber-300">
          <strong>Note:</strong> Framing overrides allow this specific command
          to parse incoming data differently (e.g., waiting for a specific
          delimiter).
        </div>
      </div>

      <div className="flex items-center justify-between">
        <Checkbox
          checked={framingEnabled}
          onChange={(e) => onFramingEnabledChange(e.target.checked)}
          label="Override Global Framing"
          labelClassName="font-bold"
        />
        {framingEnabled && (
          <SelectDropdown
            options={
              [
                { value: "TRANSIENT", label: "Transient (One-Shot)" },
                {
                  value: "PERSISTENT",
                  label: "Persistent (Change Global)",
                },
              ] as DropdownOption<"TRANSIENT" | "PERSISTENT">[]
            }
            value={framingPersistence}
            onChange={(value) => onFramingPersistenceChange(value)}
            size="sm"
            className="w-45"
          />
        )}
      </div>

      {framingEnabled && (
        <div className="pl-6 space-y-4 animate-in slide-in-from-top-2 border-l-2 border-border ml-2">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label className="text-xs">Strategy</Label>
              <SelectDropdown
                options={
                  [
                    { value: "NONE", label: "None (Raw Stream)" },
                    { value: "DELIMITER", label: "Delimiter" },
                    { value: "TIMEOUT", label: "Timeout" },
                    {
                      value: "PREFIX_LENGTH",
                      label: "Prefix Length",
                    },
                    { value: "SCRIPT", label: "Custom Script" },
                  ] as DropdownOption<FramingStrategy>[]
                }
                value={framingConfig.strategy}
                onChange={(newStrategy) => {
                  let newScript = framingConfig.script;

                  if (
                    newStrategy === "SCRIPT" &&
                    (!newScript || newScript.trim() === "")
                  ) {
                    newScript = DEFAULT_FRAMER_SCRIPT;
                  }

                  onFramingConfigChange({
                    ...framingConfig,
                    strategy: newStrategy,
                    script: newScript,
                  });
                }}
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Timeout (ms)</Label>
              <Input
                type="number"
                value={framingConfig.timeout}
                onChange={(e) =>
                  onFramingConfigChange({
                    ...framingConfig,
                    timeout: parseInt(e.target.value),
                  })
                }
                className="h-9 text-sm"
              />
            </div>
          </div>

          {framingConfig.strategy === "DELIMITER" && (
            <div className="space-y-1">
              <Label className="text-xs">Delimiter (Hex/Text)</Label>
              <Input
                value={framingConfig.delimiter}
                onChange={(e) =>
                  onFramingConfigChange({
                    ...framingConfig,
                    delimiter: e.target.value,
                  })
                }
                placeholder="e.g. \n or 0D 0A"
                className="h-9 text-sm font-mono"
              />
            </div>
          )}

          {framingConfig.strategy === "PREFIX_LENGTH" && (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label className="text-xs">Header Size (Bytes)</Label>
                <Input
                  type="number"
                  min={1}
                  max={8}
                  value={framingConfig.prefixLengthSize}
                  onChange={(e) =>
                    onFramingConfigChange({
                      ...framingConfig,
                      prefixLengthSize: parseInt(e.target.value),
                    })
                  }
                  className="h-9 text-sm"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Byte Order</Label>
                <SelectDropdown
                  options={
                    [
                      { value: "LE", label: "Little Endian" },
                      { value: "BE", label: "Big Endian" },
                    ] as DropdownOption<"LE" | "BE">[]
                  }
                  value={framingConfig.byteOrder}
                  onChange={(value) =>
                    onFramingConfigChange({
                      ...framingConfig,
                      byteOrder: value,
                    })
                  }
                />
              </div>
            </div>
          )}

          {framingConfig.strategy === "SCRIPT" && (
            <div className="space-y-1">
              <Label className="text-xs">Framer Script</Label>
              <CodeEditor
                value={framingConfig.script || ""}
                onChange={(val) =>
                  onFramingConfigChange({ ...framingConfig, script: val })
                }
                height="150px"
                className="border-l-4 border-l-purple-500/30"
              />
            </div>
          )}
        </div>
      )}
    </CardContent>
  );
};

export default FramingTab;
