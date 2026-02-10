import * as React from "react";
import { X, ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "../../lib/utils";
import { Button } from "./Button";
import { Input } from "./Input";
import { SelectDropdown } from "./Select";
import { DropdownOption } from "./Dropdown";

/**
 * ParameterCard Component
 *
 * Design System Specifications (FIGMA-DESIGN.md 7.5):
 * - Padding: 12px 16px
 * - Background: bg.muted
 * - Border Radius: radius.md
 * - Expanded: Shows full form with label, type, default value
 * - Collapsed: Shows summary line "Type: X - Default: Y"
 */

export type ParameterType = "STRING" | "INTEGER" | "FLOAT" | "ENUM" | "BOOLEAN";

export interface ParameterCardProps {
  /** Parameter name (variable name) */
  name: string;
  /** Display label */
  label?: string;
  /** Parameter type */
  type: ParameterType;
  /** Default value */
  defaultValue?: string | number | boolean;
  /** Options for ENUM type */
  options?: { label: string; value: string | number }[];
  /** Min value for numeric types */
  min?: number;
  /** Max value for numeric types */
  max?: number;
  /** Whether the card is expanded */
  expanded?: boolean;
  /** Toggle expand/collapse */
  onToggle?: () => void;
  /** Called when parameter is removed */
  onRemove?: () => void;
  /** Called when parameter values change */
  onChange?: (updates: {
    name?: string;
    label?: string;
    type?: ParameterType;
    defaultValue?: string | number | boolean;
  }) => void;
  /** Additional className */
  className?: string;
  /** Read-only mode */
  readOnly?: boolean;
}

const typeOptions: DropdownOption<ParameterType>[] = [
  { label: "String", value: "STRING" },
  { label: "Integer", value: "INTEGER" },
  { label: "Float", value: "FLOAT" },
  { label: "Enum", value: "ENUM" },
  { label: "Boolean", value: "BOOLEAN" },
];

const ParameterCard: React.FC<ParameterCardProps> = ({
  name,
  label,
  type,
  defaultValue,
  expanded = true,
  onToggle,
  onRemove,
  onChange,
  className,
  readOnly = false,
}) => {
  const formatDefaultValue = (val?: string | number | boolean): string => {
    if (val === undefined || val === null) return "Not set";
    if (typeof val === "boolean") return val ? "true" : "false";
    return String(val);
  };

  return (
    <div
      className={cn(
        "bg-bg-muted rounded-radius-md p-3",
        "border border-border-default",
        className,
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          {/* Toggle button */}
          {onToggle && (
            <button
              type="button"
              onClick={onToggle}
              className="text-text-muted hover:text-text-primary transition-colors"
            >
              {expanded ? (
                <ChevronUp className="w-4 h-4" />
              ) : (
                <ChevronDown className="w-4 h-4" />
              )}
            </button>
          )}

          {/* Parameter name */}
          <span className="font-mono text-sm font-semibold text-text-primary truncate">
            ${name}
          </span>
        </div>

        {/* Remove button */}
        {!readOnly && onRemove && (
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={onRemove}
            aria-label={`Remove parameter ${name}`}
          >
            <X className="w-4 h-4" />
          </Button>
        )}
      </div>

      {/* Collapsed summary */}
      {!expanded && (
        <p className="text-xs text-text-muted mt-1 pl-6">
          Type: {type}{" "}
          {defaultValue !== undefined &&
            `\u2022 Default: ${formatDefaultValue(defaultValue)}`}
        </p>
      )}

      {/* Expanded form */}
      {expanded && (
        <div className="mt-3 space-y-3 pl-6">
          {/* Label and Type row */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-medium text-text-secondary">
                Label
              </label>
              <Input
                value={label ?? ""}
                onChange={(e) => onChange?.({ label: e.target.value })}
                placeholder="Display label"
                inputSize="sm"
                readOnly={readOnly}
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-text-secondary">
                Type
              </label>
              <SelectDropdown
                options={typeOptions}
                value={type}
                onChange={(value) => onChange?.({ type: value })}
                size="sm"
                disabled={readOnly}
                menuMinWidth={120}
              />
            </div>
          </div>

          {/* Default value */}
          <div className="space-y-1">
            <label className="text-xs font-medium text-text-secondary">
              Default Value
            </label>
            {type === "BOOLEAN" ? (
              <SelectDropdown
                options={
                  [
                    { value: "", label: "Not set" },
                    { value: "true", label: "True" },
                    { value: "false", label: "False" },
                  ] as DropdownOption<string>[]
                }
                value={
                  defaultValue === true
                    ? "true"
                    : defaultValue === false
                      ? "false"
                      : ""
                }
                onChange={(val) => {
                  onChange?.({
                    defaultValue:
                      val === "true"
                        ? true
                        : val === "false"
                          ? false
                          : undefined,
                  });
                }}
                size="sm"
                disabled={readOnly}
                menuMinWidth={100}
              />
            ) : (
              <Input
                value={
                  formatDefaultValue(defaultValue) === "Not set"
                    ? ""
                    : String(defaultValue ?? "")
                }
                onChange={(e) => {
                  let val: string | number = e.target.value;
                  if (type === "INTEGER") {
                    const parsed = parseInt(val, 10);
                    val = isNaN(parsed) ? val : parsed;
                  } else if (type === "FLOAT") {
                    const parsed = parseFloat(val);
                    val = isNaN(parsed) ? val : parsed;
                  }
                  onChange?.({ defaultValue: val });
                }}
                placeholder="Default value"
                inputSize="sm"
                type={
                  type === "INTEGER" || type === "FLOAT" ? "number" : "text"
                }
                readOnly={readOnly}
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
};

ParameterCard.displayName = "ParameterCard";

const MemoizedParameterCard = React.memo(ParameterCard);
MemoizedParameterCard.displayName = "ParameterCard";

export { MemoizedParameterCard as ParameterCard };
