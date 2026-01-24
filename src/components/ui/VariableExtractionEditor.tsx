import React from "react";
import { Plus, Trash2, ChevronDown, ChevronRight } from "lucide-react";
import { Button } from "./Button";
import { Input } from "./Input";
import { Label } from "./Label";
import { cn, generateId } from "../../lib/utils";
import type { VariableExtractionRule } from "../../types";

interface VariableExtractionEditorProps {
  rules: VariableExtractionRule[];
  onChange: (rules: VariableExtractionRule[]) => void;
  className?: string;
}

interface ExtractionRuleCardProps {
  rule: VariableExtractionRule;
  onChange: (rule: VariableExtractionRule) => void;
  onDelete: () => void;
}

const ExtractionRuleCard: React.FC<ExtractionRuleCardProps> = ({
  rule,
  onChange,
  onDelete,
}) => {
  const [expanded, setExpanded] = React.useState(true);

  return (
    <div className="border rounded-md bg-card overflow-hidden">
      {/* Header */}
      <div
        className={cn(
          "flex items-center gap-2 px-3 py-2 bg-muted/30 cursor-pointer hover:bg-muted/50 transition-colors",
          !expanded && "border-b-0",
        )}
        onClick={() => setExpanded(!expanded)}
      >
        <button
          type="button"
          className="text-muted-foreground hover:text-foreground"
        >
          {expanded ? (
            <ChevronDown className="w-3.5 h-3.5" />
          ) : (
            <ChevronRight className="w-3.5 h-3.5" />
          )}
        </button>
        <span className="font-mono text-xs font-medium text-primary">
          ${rule.variableName || "unnamed"}
        </span>
        <span className="text-[9px] text-muted-foreground flex-1 truncate">
          {rule.pattern ? `Pattern: ${rule.pattern}` : "No pattern defined"}
        </span>
        <Button
          type="button"
          size="icon"
          variant="ghost"
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          className="h-5 w-5 text-muted-foreground hover:text-destructive"
        >
          <Trash2 className="w-3 h-3" />
        </Button>
      </div>

      {/* Expanded Content */}
      {expanded && (
        <div className="p-3 space-y-3 animate-in slide-in-from-top-1">
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <Label className="text-[9px]">Variable Name</Label>
              <Input
                value={rule.variableName}
                onChange={(e) =>
                  onChange({ ...rule, variableName: e.target.value })
                }
                className="h-7 text-xs font-mono"
                placeholder="temp"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-[9px]">Capture Group</Label>
              <Input
                type="number"
                min={0}
                value={rule.captureGroup}
                onChange={(e) =>
                  onChange({
                    ...rule,
                    captureGroup: parseInt(e.target.value) || 0,
                  })
                }
                className="h-7 text-xs"
              />
            </div>
          </div>

          <div className="space-y-1">
            <Label className="text-[9px]">Regex Pattern</Label>
            <Input
              value={rule.pattern}
              onChange={(e) => onChange({ ...rule, pattern: e.target.value })}
              className="h-7 text-xs font-mono"
              placeholder="temp=(\d+\.?\d*)"
            />
            <p className="text-[9px] text-muted-foreground">
              Use capture groups () to extract values
            </p>
          </div>

          <div className="space-y-1">
            <Label className="text-[9px]">Transform (optional)</Label>
            <Input
              value={rule.transform || ""}
              onChange={(e) =>
                onChange({ ...rule, transform: e.target.value || undefined })
              }
              className="h-7 text-xs font-mono"
              placeholder="parseFloat(match[1])"
            />
            <p className="text-[9px] text-muted-foreground">
              JS expression. Available: match (regex result), data (full
              response)
            </p>
          </div>

          <div className="space-y-1">
            <Label className="text-[9px]">Store to Dashboard Variable</Label>
            <Input
              value={rule.storeTo || ""}
              onChange={(e) =>
                onChange({ ...rule, storeTo: e.target.value || undefined })
              }
              className="h-7 text-xs"
              placeholder="Temperature"
            />
            <p className="text-[9px] text-muted-foreground">
              Dashboard variable name for telemetry display
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export const VariableExtractionEditor: React.FC<
  VariableExtractionEditorProps
> = ({ rules, onChange, className }) => {
  const handleAddRule = () => {
    const newRule: VariableExtractionRule = {
      id: generateId(),
      variableName: `var${rules.length + 1}`,
      pattern: "",
      captureGroup: 1,
    };
    onChange([...rules, newRule]);
  };

  const handleUpdateRule = (
    index: number,
    updatedRule: VariableExtractionRule,
  ) => {
    const newRules = [...rules];
    newRules[index] = updatedRule;
    onChange(newRules);
  };

  const handleDeleteRule = (index: number) => {
    const newRules = rules.filter((_, i) => i !== index);
    onChange(newRules);
  };

  return (
    <div className={cn("space-y-3", className)}>
      <div className="flex items-center justify-between">
        <Label className="text-xs font-medium">Extraction Rules</Label>
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={handleAddRule}
          className="h-6 text-[10px] gap-1"
        >
          <Plus className="w-3 h-3" /> Add Rule
        </Button>
      </div>

      {rules.length === 0 ? (
        <div className="text-center py-6 text-muted-foreground text-xs italic border border-dashed rounded-md">
          No extraction rules defined.
          <br />
          <span className="text-[10px]">
            Click &quot;Add Rule&quot; to extract variables from responses.
          </span>
        </div>
      ) : (
        <div className="space-y-2">
          {rules.map((rule, index) => (
            <ExtractionRuleCard
              key={rule.id}
              rule={rule}
              onChange={(updated) => handleUpdateRule(index, updated)}
              onDelete={() => handleDeleteRule(index)}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default VariableExtractionEditor;
