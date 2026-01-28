import React from "react";
import { Input } from "./Input";
import { SelectDropdown } from "./Select";
import { DropdownOption } from "./Dropdown";
import { Label } from "./Label";
import { Checkbox } from "./Checkbox";
import { Radio } from "./Radio";
import { cn } from "../../lib/utils";
import type {
  ParameterApplication,
  ParameterApplicationMode,
  SubstituteType,
  QuoteStyle,
  TransformPreset,
  FormatType,
  NumberRadix,
  PaddingType,
  Alignment,
  ByteSize,
  ByteOutput,
  DateFormat,
} from "../../types";

interface ParameterModeEditorProps {
  application: ParameterApplication;
  onChange: (application: ParameterApplication) => void;
  className?: string;
}

const MODE_OPTIONS: { value: ParameterApplicationMode; label: string }[] = [
  { value: "SUBSTITUTE", label: "Substitute" },
  { value: "TRANSFORM", label: "Transform" },
  { value: "FORMAT", label: "Format" },
  { value: "POSITION", label: "Position" },
];

const SUBSTITUTE_TYPE_OPTIONS: DropdownOption<SubstituteType>[] = [
  { value: "DIRECT", label: "Direct (raw value)" },
  { value: "QUOTED", label: "Quoted (wrap in quotes)" },
  { value: "ESCAPED", label: "Escaped (special chars)" },
  { value: "URL_ENCODED", label: "URL Encoded" },
  { value: "BASE64", label: "Base64" },
];

const QUOTE_STYLE_OPTIONS: DropdownOption<QuoteStyle>[] = [
  { value: "DOUBLE", label: 'Double quotes (")' },
  { value: "SINGLE", label: "Single quotes (')" },
  { value: "BACKTICK", label: "Backtick (`)" },
];

const TRANSFORM_PRESET_OPTIONS: DropdownOption<TransformPreset>[] = [
  { value: "CUSTOM", label: "Custom Expression" },
  { value: "UPPERCASE", label: "Uppercase" },
  { value: "LOWERCASE", label: "Lowercase" },
  { value: "TO_HEX", label: "To Hex (number → hex)" },
  { value: "FROM_HEX", label: "From Hex (hex → number)" },
  { value: "CHECKSUM_MOD256", label: "Checksum (MOD256)" },
  { value: "CHECKSUM_XOR", label: "Checksum (XOR)" },
  { value: "CHECKSUM_CRC16", label: "Checksum (CRC16)" },
  { value: "JSON_STRINGIFY", label: "JSON Stringify" },
  { value: "JSON_PARSE", label: "JSON Parse" },
  { value: "LENGTH", label: "Length" },
  { value: "TRIM", label: "Trim" },
];

const FORMAT_TYPE_OPTIONS: DropdownOption<FormatType>[] = [
  { value: "NUMBER", label: "Number" },
  { value: "STRING", label: "String" },
  { value: "DATE", label: "Date" },
  { value: "BYTES", label: "Bytes" },
];

const NUMBER_RADIX_OPTIONS: DropdownOption<NumberRadix>[] = [
  { value: "2", label: "Binary (2)" },
  { value: "8", label: "Octal (8)" },
  { value: "10", label: "Decimal (10)" },
  { value: "16", label: "Hex (16)" },
];

const PADDING_OPTIONS: DropdownOption<PaddingType>[] = [
  { value: "NONE", label: "None" },
  { value: "SPACE", label: "Space" },
  { value: "ZERO", label: "Zero" },
];

const ALIGNMENT_OPTIONS: DropdownOption<Alignment>[] = [
  { value: "LEFT", label: "Left" },
  { value: "CENTER", label: "Center" },
  { value: "RIGHT", label: "Right" },
];

const DATE_FORMAT_OPTIONS: DropdownOption<DateFormat>[] = [
  { value: "ISO", label: "ISO 8601" },
  { value: "UNIX", label: "Unix Timestamp" },
  { value: "UNIX_MS", label: "Unix (ms)" },
  { value: "CUSTOM", label: "Custom Pattern" },
];

const BYTE_SIZE_OPTIONS: DropdownOption<ByteSize>[] = [
  { value: "1", label: "1 byte" },
  { value: "2", label: "2 bytes" },
  { value: "4", label: "4 bytes" },
  { value: "8", label: "8 bytes" },
];

const BYTE_OUTPUT_OPTIONS: DropdownOption<ByteOutput>[] = [
  { value: "RAW", label: "Raw bytes" },
  { value: "ARRAY", label: "Array" },
  { value: "HEX_STRING", label: "Hex string" },
];

// Segmented Control for Mode Selection
const ModeSegmentedControl: React.FC<{
  value: ParameterApplicationMode;
  onChange: (mode: ParameterApplicationMode) => void;
}> = ({ value, onChange }) => (
  <div className="flex flex-wrap bg-muted p-0.5 rounded-md border border-border gap-0.5">
    {MODE_OPTIONS.map((opt) => (
      <button
        key={opt.value}
        type="button"
        onClick={() => onChange(opt.value)}
        className={cn(
          "flex-1 min-w-[70px] text-[10px] font-medium px-2 py-1.5 rounded-sm transition-all",
          value === opt.value
            ? "bg-background text-foreground shadow-sm"
            : "text-muted-foreground hover:text-foreground hover:bg-background/50",
        )}
      >
        {opt.label}
      </button>
    ))}
  </div>
);

// Substitute Mode Editor
const SubstituteModeEditor: React.FC<{
  config: ParameterApplication["substitute"];
  onChange: (config: ParameterApplication["substitute"]) => void;
}> = ({ config, onChange }) => {
  const current = config || { type: "DIRECT" as SubstituteType };

  return (
    <div className="space-y-3">
      <div className="space-y-1">
        <Label className="text-[10px]">Replace Type</Label>
        <SelectDropdown
          options={SUBSTITUTE_TYPE_OPTIONS}
          value={current.type}
          onChange={(value) => onChange({ ...current, type: value })}
          size="sm"
        />
      </div>

      {current.type === "QUOTED" && (
        <div className="space-y-1 animate-in slide-in-from-top-1">
          <Label className="text-[10px]">Quote Style</Label>
          <SelectDropdown
            options={QUOTE_STYLE_OPTIONS}
            value={current.quoteStyle || "DOUBLE"}
            onChange={(value) => onChange({ ...current, quoteStyle: value })}
            size="sm"
          />
        </div>
      )}

      {current.type === "ESCAPED" && (
        <div className="space-y-1 animate-in slide-in-from-top-1">
          <Label className="text-[10px]">Characters to Escape</Label>
          <Input
            value={current.escapeChars || '"\\'}
            onChange={(e) =>
              onChange({ ...current, escapeChars: e.target.value })
            }
            className="h-7 text-xs font-mono"
            placeholder='"\'
          />
        </div>
      )}
    </div>
  );
};

// Transform Mode Editor
const TransformModeEditor: React.FC<{
  config: ParameterApplication["transform"];
  onChange: (config: ParameterApplication["transform"]) => void;
}> = ({ config, onChange }) => {
  const current = config || { preset: "CUSTOM" as TransformPreset };

  return (
    <div className="space-y-3">
      <div className="space-y-1">
        <Label className="text-[10px]">Preset Transform</Label>
        <SelectDropdown
          options={TRANSFORM_PRESET_OPTIONS}
          value={current.preset}
          onChange={(value) => onChange({ ...current, preset: value })}
          size="sm"
        />
      </div>

      {current.preset === "CUSTOM" && (
        <div className="space-y-1 animate-in slide-in-from-top-1">
          <Label className="text-[10px]">Expression</Label>
          <Input
            value={current.expression || ""}
            onChange={(e) =>
              onChange({ ...current, expression: e.target.value })
            }
            className="h-7 text-xs font-mono"
            placeholder="value.toUpperCase()"
          />
          <p className="text-[9px] text-muted-foreground">
            Available: value, params, Math, parseInt, String
          </p>
        </div>
      )}
    </div>
  );
};

// Format Mode Editor
const FormatModeEditor: React.FC<{
  config: ParameterApplication["format"];
  onChange: (config: ParameterApplication["format"]) => void;
}> = ({ config, onChange }) => {
  const current = config || { type: "NUMBER" as FormatType };

  return (
    <div className="space-y-3">
      <div className="space-y-1">
        <Label className="text-[10px]">Format Type</Label>
        <SelectDropdown
          options={FORMAT_TYPE_OPTIONS}
          value={current.type}
          onChange={(value) => onChange({ ...current, type: value })}
          size="sm"
        />
      </div>

      {/* Number Format Options */}
      {current.type === "NUMBER" && (
        <div className="space-y-2 animate-in slide-in-from-top-1 p-2 bg-muted/30 rounded-md">
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <Label className="text-[9px]">Radix</Label>
              <SelectDropdown
                options={NUMBER_RADIX_OPTIONS}
                value={current.number?.radix || "10"}
                onChange={(value) =>
                  onChange({
                    ...current,
                    number: {
                      ...current.number,
                      radix: value,
                    },
                  })
                }
                size="sm"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-[9px]">Width</Label>
              <Input
                type="number"
                min={0}
                max={32}
                value={current.number?.width || ""}
                onChange={(e) =>
                  onChange({
                    ...current,
                    number: {
                      ...current.number,
                      width: parseInt(e.target.value) || undefined,
                    },
                  })
                }
                className="h-6 text-[10px]"
                placeholder="Auto"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <Label className="text-[9px]">Padding</Label>
              <SelectDropdown
                options={PADDING_OPTIONS}
                value={current.number?.padding || "NONE"}
                onChange={(value) =>
                  onChange({
                    ...current,
                    number: {
                      ...current.number,
                      padding: value,
                    },
                  })
                }
                size="sm"
              />
            </div>
            <div className="flex items-end gap-2 pb-0.5">
              <Checkbox
                checked={current.number?.uppercase || false}
                onChange={(e) =>
                  onChange({
                    ...current,
                    number: {
                      ...current.number,
                      uppercase: e.target.checked,
                    },
                  })
                }
                label="Uppercase"
                labelClassName="text-[9px]"
                className="scale-75"
              />
              <Checkbox
                checked={current.number?.signed || false}
                onChange={(e) =>
                  onChange({
                    ...current,
                    number: { ...current.number, signed: e.target.checked },
                  })
                }
                label="Signed"
                labelClassName="text-[9px]"
                className="scale-75"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <Label className="text-[9px]">Prefix</Label>
              <Input
                value={current.number?.prefix || ""}
                onChange={(e) =>
                  onChange({
                    ...current,
                    number: { ...current.number, prefix: e.target.value },
                  })
                }
                className="h-6 text-[10px] font-mono"
                placeholder="0x"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-[9px]">Suffix</Label>
              <Input
                value={current.number?.suffix || ""}
                onChange={(e) =>
                  onChange({
                    ...current,
                    number: { ...current.number, suffix: e.target.value },
                  })
                }
                className="h-6 text-[10px] font-mono"
                placeholder="h"
              />
            </div>
          </div>
        </div>
      )}

      {/* String Format Options */}
      {current.type === "STRING" && (
        <div className="space-y-2 animate-in slide-in-from-top-1 p-2 bg-muted/30 rounded-md">
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <Label className="text-[9px]">Width</Label>
              <Input
                type="number"
                min={0}
                max={255}
                value={current.string?.width || ""}
                onChange={(e) =>
                  onChange({
                    ...current,
                    string: {
                      ...current.string,
                      width: parseInt(e.target.value) || undefined,
                    },
                  })
                }
                className="h-6 text-[10px]"
                placeholder="Auto"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-[9px]">Alignment</Label>
              <SelectDropdown
                options={ALIGNMENT_OPTIONS}
                value={current.string?.alignment || "LEFT"}
                onChange={(value) =>
                  onChange({
                    ...current,
                    string: {
                      ...current.string,
                      alignment: value,
                    },
                  })
                }
                size="sm"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <Label className="text-[9px]">Padding Char</Label>
              <Input
                maxLength={1}
                value={current.string?.paddingChar || " "}
                onChange={(e) =>
                  onChange({
                    ...current,
                    string: { ...current.string, paddingChar: e.target.value },
                  })
                }
                className="h-6 text-[10px] font-mono w-12"
              />
            </div>
            <div className="flex items-end gap-2 pb-0.5">
              <Checkbox
                checked={current.string?.truncate || false}
                onChange={(e) =>
                  onChange({
                    ...current,
                    string: { ...current.string, truncate: e.target.checked },
                  })
                }
                label="Truncate"
                labelClassName="text-[9px]"
                className="scale-75"
              />
              <Checkbox
                checked={current.string?.nullTerminate || false}
                onChange={(e) =>
                  onChange({
                    ...current,
                    string: {
                      ...current.string,
                      nullTerminate: e.target.checked,
                    },
                  })
                }
                label="Null term"
                labelClassName="text-[9px]"
                className="scale-75"
              />
            </div>
          </div>
        </div>
      )}

      {/* Date Format Options */}
      {current.type === "DATE" && (
        <div className="space-y-2 animate-in slide-in-from-top-1 p-2 bg-muted/30 rounded-md">
          <div className="space-y-1">
            <Label className="text-[9px]">Format</Label>
            <SelectDropdown
              options={DATE_FORMAT_OPTIONS}
              value={current.date?.format || "ISO"}
              onChange={(value) =>
                onChange({
                  ...current,
                  date: {
                    ...current.date,
                    format: value,
                  },
                })
              }
              size="sm"
            />
          </div>
          {current.date?.format === "CUSTOM" && (
            <div className="space-y-1">
              <Label className="text-[9px]">Custom Pattern</Label>
              <Input
                value={current.date?.customPattern || ""}
                onChange={(e) =>
                  onChange({
                    ...current,
                    date: { ...current.date, customPattern: e.target.value },
                  })
                }
                className="h-6 text-[10px] font-mono"
                placeholder="YYYY-MM-DD HH:mm:ss"
              />
            </div>
          )}
          <div className="space-y-1">
            <Label className="text-[9px]">Timezone</Label>
            <Input
              value={current.date?.timezone || ""}
              onChange={(e) =>
                onChange({
                  ...current,
                  date: { ...current.date, timezone: e.target.value },
                })
              }
              className="h-6 text-[10px]"
              placeholder="UTC"
            />
          </div>
        </div>
      )}

      {/* Bytes Format Options */}
      {current.type === "BYTES" && (
        <div className="space-y-2 animate-in slide-in-from-top-1 p-2 bg-muted/30 rounded-md">
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <Label className="text-[9px]">Byte Size</Label>
              <SelectDropdown
                options={BYTE_SIZE_OPTIONS}
                value={current.bytes?.byteSize || "1"}
                onChange={(value) =>
                  onChange({
                    ...current,
                    bytes: {
                      ...current.bytes,
                      byteSize: value,
                    },
                  })
                }
                size="sm"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-[9px]">Endianness</Label>
              <SelectDropdown
                options={
                  [
                    { value: "LE", label: "Little Endian" },
                    { value: "BE", label: "Big Endian" },
                  ] as DropdownOption<"LE" | "BE">[]
                }
                value={current.bytes?.endianness || "LE"}
                onChange={(value) =>
                  onChange({
                    ...current,
                    bytes: {
                      ...current.bytes,
                      endianness: value,
                    },
                  })
                }
                size="sm"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <Label className="text-[9px]">Output</Label>
              <SelectDropdown
                options={BYTE_OUTPUT_OPTIONS}
                value={current.bytes?.output || "RAW"}
                onChange={(value) =>
                  onChange({
                    ...current,
                    bytes: {
                      ...current.bytes,
                      output: value,
                    },
                  })
                }
                size="sm"
              />
            </div>
            <div className="flex items-end pb-0.5">
              <Checkbox
                checked={current.bytes?.signed || false}
                onChange={(e) =>
                  onChange({
                    ...current,
                    bytes: { ...current.bytes, signed: e.target.checked },
                  })
                }
                label="Signed"
                labelClassName="text-[9px]"
                className="scale-75"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Position Mode Editor
const PositionModeEditor: React.FC<{
  config: ParameterApplication["position"];
  onChange: (config: ParameterApplication["position"]) => void;
}> = ({ config, onChange }) => {
  const current = config || { byteOffset: 0, byteSize: "1" as ByteSize };

  return (
    <div className="space-y-3">
      <p className="text-[9px] text-muted-foreground bg-muted/50 p-2 rounded">
        For binary protocols. The value is inserted at a specific byte offset.
      </p>

      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-1">
          <Label className="text-[9px]">Byte Offset</Label>
          <Input
            type="number"
            min={0}
            value={current.byteOffset}
            onChange={(e) =>
              onChange({
                ...current,
                byteOffset: parseInt(e.target.value) || 0,
              })
            }
            className="h-7 text-xs"
          />
        </div>
        <div className="space-y-1">
          <Label className="text-[9px]">Byte Size</Label>
          <SelectDropdown
            options={BYTE_SIZE_OPTIONS}
            value={current.byteSize}
            onChange={(value) => onChange({ ...current, byteSize: value })}
            size="sm"
          />
        </div>
      </div>

      <div className="space-y-1">
        <Label className="text-[9px]">Endianness</Label>
        <div className="flex gap-3">
          <Radio
            name="endianness"
            checked={current.endianness === "LE"}
            onChange={() => onChange({ ...current, endianness: "LE" })}
            label="Little Endian (LE)"
            labelClassName="text-xs"
            className="scale-75"
          />
          <Radio
            name="endianness"
            checked={current.endianness === "BE"}
            onChange={() => onChange({ ...current, endianness: "BE" })}
            label="Big Endian (BE)"
            labelClassName="text-xs"
            className="scale-75"
          />
        </div>
      </div>

      <div className="space-y-1">
        <Label className="text-[9px]">Value Transform (optional)</Label>
        <Input
          value={current.valueTransform || ""}
          onChange={(e) =>
            onChange({
              ...current,
              valueTransform: e.target.value || undefined,
            })
          }
          className="h-7 text-xs font-mono"
          placeholder="value * 10"
        />
      </div>

      <div className="space-y-1">
        <Checkbox
          checked={!!current.bitField}
          onChange={(e) =>
            onChange({
              ...current,
              bitField: e.target.checked
                ? { startBit: 0, bitCount: 8 }
                : undefined,
            })
          }
          label="Enable Bit Field"
          labelClassName="text-xs"
          className="scale-75"
        />
      </div>

      {current.bitField && (
        <div className="grid grid-cols-2 gap-2 animate-in slide-in-from-top-1 p-2 bg-muted/30 rounded-md">
          <div className="space-y-1">
            <Label className="text-[9px]">Start Bit</Label>
            <Input
              type="number"
              min={0}
              max={63}
              value={current.bitField.startBit}
              onChange={(e) =>
                onChange({
                  ...current,
                  bitField: {
                    ...current.bitField!,
                    startBit: parseInt(e.target.value) || 0,
                  },
                })
              }
              className="h-6 text-[10px]"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-[9px]">Bit Count</Label>
            <Input
              type="number"
              min={1}
              max={64}
              value={current.bitField.bitCount}
              onChange={(e) =>
                onChange({
                  ...current,
                  bitField: {
                    ...current.bitField!,
                    bitCount: parseInt(e.target.value) || 1,
                  },
                })
              }
              className="h-6 text-[10px]"
            />
          </div>
        </div>
      )}
    </div>
  );
};

// Main Component
export const ParameterModeEditor: React.FC<ParameterModeEditorProps> = ({
  application,
  onChange,
  className,
}) => {
  const mode = application.mode || "SUBSTITUTE";

  const handleModeChange = (newMode: ParameterApplicationMode) => {
    onChange({ ...application, mode: newMode });
  };

  return (
    <div className={cn("space-y-3", className)}>
      <div className="space-y-1">
        <Label className="text-[10px] text-muted-foreground">
          Application Mode
        </Label>
        <ModeSegmentedControl value={mode} onChange={handleModeChange} />
      </div>

      <div className="border-t border-border/50 pt-3">
        {mode === "SUBSTITUTE" && (
          <SubstituteModeEditor
            config={application.substitute}
            onChange={(substitute) => onChange({ ...application, substitute })}
          />
        )}
        {mode === "TRANSFORM" && (
          <TransformModeEditor
            config={application.transform}
            onChange={(transform) => onChange({ ...application, transform })}
          />
        )}
        {mode === "FORMAT" && (
          <FormatModeEditor
            config={application.format}
            onChange={(format) => onChange({ ...application, format })}
          />
        )}
        {mode === "POSITION" && (
          <PositionModeEditor
            config={application.position}
            onChange={(position) => onChange({ ...application, position })}
          />
        )}
      </div>
    </div>
  );
};

export default ParameterModeEditor;
