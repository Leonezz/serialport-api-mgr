import React from "react";
import { Search, FileCode } from "lucide-react";
import { Input } from "../ui/Input";
import { Label } from "../ui/Label";
import { SelectDropdown } from "../ui/Select";
import { CardContent } from "../ui/Card";
import { Checkbox } from "../ui/Checkbox";
import CodeEditor from "../ui/CodeEditor";
import { cn } from "../../lib/utils";
import type { DropdownOption } from "../ui/Dropdown";
import type { MatchType } from "../../types";

interface ProcessingTabProps {
  preRequestEnabled: boolean;
  onPreRequestEnabledChange: (enabled: boolean) => void;
  preRequestScript: string;
  onPreRequestScriptChange: (script: string) => void;
  postResponseEnabled: boolean;
  onPostResponseEnabledChange: (enabled: boolean) => void;
  responseMode: "PATTERN" | "SCRIPT";
  onResponseModeChange: (mode: "PATTERN" | "SCRIPT") => void;
  matchType: MatchType;
  onMatchTypeChange: (type: MatchType) => void;
  pattern: string;
  onPatternChange: (pattern: string) => void;
  timeout: number;
  onTimeoutChange: (timeout: number) => void;
  postResponseScript: string;
  onPostResponseScriptChange: (script: string) => void;
}

const ProcessingTab: React.FC<ProcessingTabProps> = ({
  preRequestEnabled,
  onPreRequestEnabledChange,
  preRequestScript,
  onPreRequestScriptChange,
  postResponseEnabled,
  onPostResponseEnabledChange,
  responseMode,
  onResponseModeChange,
  matchType,
  onMatchTypeChange,
  pattern,
  onPatternChange,
  timeout,
  onTimeoutChange,
  postResponseScript,
  onPostResponseScriptChange,
}) => {
  return (
    <CardContent className="pt-6 space-y-8 h-full flex flex-col">
      <div className="space-y-3">
        <Checkbox
          checked={preRequestEnabled}
          onChange={(e) => onPreRequestEnabledChange(e.target.checked)}
          label="Enable Pre-Request Handling"
          labelClassName="font-bold text-sm"
        />
        {preRequestEnabled && (
          <div className="pl-6 space-y-2 animate-in slide-in-from-top-1">
            <CodeEditor
              value={preRequestScript}
              onChange={onPreRequestScriptChange}
              height="120px"
              className="border-l-4 border-l-blue-500/30"
            />
            <p className="text-[10px] text-muted-foreground italic">
              Modify payload before transmission. Variables available:{" "}
              <code>payload</code>, <code>params</code>.
            </p>
          </div>
        )}
      </div>

      <div className="space-y-4">
        <Checkbox
          checked={postResponseEnabled}
          onChange={(e) => onPostResponseEnabledChange(e.target.checked)}
          label="Enable Post-Response Handling"
          labelClassName="font-bold text-sm"
        />

        {postResponseEnabled && (
          <div className="pl-6 space-y-4 animate-in slide-in-from-top-1">
            <div className="grid grid-cols-2 gap-3">
              <div
                onClick={() => onResponseModeChange("PATTERN")}
                className={cn(
                  "p-4 border rounded-xl flex flex-col items-center gap-2 cursor-pointer transition-all hover:bg-muted/30",
                  responseMode === "PATTERN"
                    ? "bg-primary/5 border-primary shadow-sm ring-1 ring-primary/20"
                    : "bg-card",
                )}
              >
                <Search
                  className={cn(
                    "w-5 h-5",
                    responseMode === "PATTERN"
                      ? "text-primary"
                      : "text-muted-foreground",
                  )}
                />
                <div className="text-center">
                  <div className="font-bold text-xs">Simple Pattern</div>
                  <div className="text-[9px] text-muted-foreground mt-0.5">
                    Success on string match
                  </div>
                </div>
              </div>
              <div
                onClick={() => onResponseModeChange("SCRIPT")}
                className={cn(
                  "p-4 border rounded-xl flex flex-col items-center gap-2 cursor-pointer transition-all hover:bg-muted/30",
                  responseMode === "SCRIPT"
                    ? "bg-primary/5 border-primary shadow-sm ring-1 ring-primary/20"
                    : "bg-card",
                )}
              >
                <FileCode
                  className={cn(
                    "w-5 h-5",
                    responseMode === "SCRIPT"
                      ? "text-primary"
                      : "text-muted-foreground",
                  )}
                />
                <div className="text-center">
                  <div className="font-bold text-xs">Advanced Script</div>
                  <div className="text-[9px] text-muted-foreground mt-0.5">
                    JS logic & extraction
                  </div>
                </div>
              </div>
            </div>

            {responseMode === "PATTERN" ? (
              <div className="p-4 bg-muted/20 border border-border rounded-lg grid grid-cols-3 gap-4 animate-in fade-in">
                <div className="space-y-1">
                  <Label className="text-[10px]">Type</Label>
                  <SelectDropdown
                    options={
                      [
                        { value: "CONTAINS", label: "Contains" },
                        { value: "REGEX", label: "Regex" },
                      ] as DropdownOption<MatchType>[]
                    }
                    value={matchType}
                    onChange={(value) => onMatchTypeChange(value)}
                    size="sm"
                  />
                </div>
                <div className="col-span-2 space-y-1">
                  <Label className="text-[10px]">Pattern</Label>
                  <Input
                    className="h-8 text-xs font-mono"
                    value={pattern}
                    onChange={(e) => onPatternChange(e.target.value)}
                    placeholder="OK"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-[10px]">Timeout (ms)</Label>
                  <Input
                    type="number"
                    className="h-8 text-xs"
                    value={timeout}
                    onChange={(e) => onTimeoutChange(parseInt(e.target.value))}
                  />
                </div>
              </div>
            ) : (
              <div className="space-y-2 animate-in fade-in">
                <CodeEditor
                  value={postResponseScript}
                  onChange={onPostResponseScriptChange}
                  height="150px"
                  className="border-l-4 border-l-emerald-500/30"
                />
                <p className="text-[10px] text-muted-foreground italic">
                  Validate and extract data. Variables: <code>data</code>,{" "}
                  <code>raw</code>, <code>setVar</code>, <code>log</code>.
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </CardContent>
  );
};

export default ProcessingTab;
