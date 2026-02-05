import React from "react";
import { Plus, Trash2 } from "lucide-react";
import {
  Button,
  CardContent,
  Input,
  Label,
  SelectDropdown,
  type DropdownOption,
} from "../ui";
import type { CommandParameter, ParameterType } from "../../types";

interface ParametersTabProps {
  parameters: CommandParameter[];
  onAdd: () => void;
  onUpdate: (idx: number, updates: Partial<CommandParameter>) => void;
  onRemove: (idx: number) => void;
}

const ParametersTab: React.FC<ParametersTabProps> = ({
  parameters,
  onAdd,
  onUpdate,
  onRemove,
}) => {
  return (
    <CardContent className="pt-6 space-y-4">
      <div className="flex justify-between items-center">
        <div className="text-sm text-muted-foreground">
          Define variables to be used in scripting.
        </div>
        <Button
          type="button"
          size="sm"
          onClick={onAdd}
          variant="outline"
          className="h-8 gap-1"
        >
          <Plus className="w-3.5 h-3.5" /> Add Parameter
        </Button>
      </div>

      <div className="space-y-3">
        {parameters.length === 0 && (
          <div className="text-center py-10 text-muted-foreground italic bg-muted/20 rounded-lg">
            No parameters defined.
          </div>
        )}
        {parameters.map((param, idx) => (
          <div
            key={param.id}
            className="p-3 border rounded-lg bg-card grid grid-cols-12 gap-3 items-end animate-in fade-in slide-in-from-bottom-2"
          >
            <div className="col-span-3 space-y-1">
              <Label className="text-[10px]">Var Name</Label>
              <Input
                value={param.name}
                onChange={(e) => onUpdate(idx, { name: e.target.value })}
                className="h-8 text-xs font-mono"
                placeholder="varName"
              />
            </div>
            <div className="col-span-3 space-y-1">
              <Label className="text-[10px]">Label</Label>
              <Input
                value={param.label || ""}
                onChange={(e) => onUpdate(idx, { label: e.target.value })}
                className="h-8 text-xs"
                placeholder="Display Label"
              />
            </div>
            <div className="col-span-2 space-y-1">
              <Label className="text-[10px]">Type</Label>
              <SelectDropdown
                options={
                  [
                    { value: "STRING", label: "String" },
                    { value: "INTEGER", label: "Integer" },
                    { value: "FLOAT", label: "Float" },
                    { value: "BOOLEAN", label: "Boolean" },
                  ] as DropdownOption<ParameterType>[]
                }
                value={param.type}
                onChange={(value) => onUpdate(idx, { type: value })}
                size="sm"
              />
            </div>
            <div className="col-span-3 space-y-1">
              <Label className="text-[10px]">Default</Label>
              <Input
                value={String(param.defaultValue ?? "")}
                onChange={(e) =>
                  onUpdate(idx, { defaultValue: e.target.value })
                }
                className="h-8 text-xs"
                placeholder="Optional"
              />
            </div>
            <div className="col-span-1">
              <Button
                type="button"
                size="icon"
                variant="ghost"
                onClick={() => onRemove(idx)}
                className="h-8 w-8 text-destructive hover:bg-destructive/10"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </Button>
            </div>
          </div>
        ))}
      </div>
    </CardContent>
  );
};

export default ParametersTab;
