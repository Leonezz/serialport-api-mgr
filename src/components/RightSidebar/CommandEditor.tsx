import React, { useState } from "react";
import {
  Plus,
  Trash2,
  ChevronDown,
  ChevronRight,
  AlertCircle,
} from "lucide-react";
import { Button } from "../ui/Button";
import { IconButton } from "../ui/IconButton";
import { Input } from "../ui/Input";
import { Textarea } from "../ui/Textarea";
import { SelectDropdown } from "../ui/Select";
import { DropdownOption } from "../ui/Dropdown";
import { Label } from "../ui/Label";
import { SegmentedControl } from "../ui/SegmentedControl";
import { cn, generateId } from "../../lib/utils";
import { useStore } from "../../lib/store";
import type {
  RightSidebarTab,
  SavedCommand,
  CommandParameter,
  DataMode,
  TextEncoding,
  ParameterType,
  MatchType,
  VariableSyntax,
  VariableExtractionRule,
  ValidationMode,
} from "../../types";
import CodeEditor from "../ui/CodeEditor";
import ParameterModeEditor from "../ui/ParameterModeEditor";
import VariableExtractionEditor from "../ui/VariableExtractionEditor";
import { Checkbox } from "../ui/Checkbox";
import { Radio, RadioGroup } from "../ui/Radio";
import { NumberInput } from "../ui/NumberInput";
import { useTranslation } from "react-i18next";

interface Props {
  activeTab: RightSidebarTab;
}

// Variable Syntax Options
const VARIABLE_SYNTAX_OPTIONS: {
  value: VariableSyntax;
  label: string;
  example: string;
}[] = [
  { value: "SHELL", label: "${name} (Default)", example: "${ssid}" },
  { value: "MUSTACHE", label: "{{name}} (Mustache)", example: "{{ssid}}" },
  { value: "BATCH", label: "%name% (Batch)", example: "%ssid%" },
  { value: "COLON", label: ":name (SQL-like)", example: ":ssid" },
  { value: "BRACES", label: "{name} (Braces)", example: "{ssid}" },
  { value: "CUSTOM", label: "Custom Regex", example: "user-defined" },
];

// Parameter Card Component
interface ParameterCardProps {
  param: CommandParameter;
  index: number;
  onUpdate: (updates: Partial<CommandParameter>) => void;
  onDelete: () => void;
}

const ParameterCard: React.FC<ParameterCardProps> = ({
  param,
  index,
  onUpdate,
  onDelete,
}) => {
  const [expanded, setExpanded] = useState(true);

  // Get display info for collapsed state
  const modeLabel = param.application?.mode || "SUBSTITUTE";
  const typeLabel = param.type || "STRING";

  return (
    <div className="border rounded-lg bg-card overflow-hidden">
      {/* Card Header - Collapsed View */}
      <div
        className={cn(
          "flex items-center gap-2 px-3 py-2 bg-muted/30 cursor-pointer hover:bg-muted/50 transition-colors",
          !expanded && "border-b-0",
        )}
        onClick={() => setExpanded(!expanded)}
      >
        <IconButton
          variant="ghost"
          size="xs"
          aria-label={expanded ? "Collapse parameter" : "Expand parameter"}
          className="shrink-0"
        >
          {expanded ? (
            <ChevronDown className="w-3.5 h-3.5" />
          ) : (
            <ChevronRight className="w-3.5 h-3.5" />
          )}
        </IconButton>
        <span className="font-mono text-xs font-medium text-primary">
          ${param.name || `param${index + 1}`}
        </span>
        <span className="text-[9px] text-muted-foreground flex-1">
          {typeLabel} • {modeLabel}
          {param.required && " • Required"}
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
        <div className="p-3 space-y-4 animate-in slide-in-from-top-1">
          {/* Parameter Info Section */}
          <div className="space-y-3">
            <div className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider">
              Parameter Info
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label className="text-[9px]">Variable Name</Label>
                <Input
                  value={param.name}
                  onChange={(e) => onUpdate({ name: e.target.value })}
                  className="h-7 text-xs font-mono"
                  placeholder="varName"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-[9px]">Type</Label>
                <SelectDropdown
                  options={
                    [
                      { value: "STRING", label: "String" },
                      { value: "INTEGER", label: "Integer" },
                      { value: "FLOAT", label: "Float" },
                      { value: "BOOLEAN", label: "Boolean" },
                      { value: "ENUM", label: "Enum" },
                    ] as DropdownOption<ParameterType>[]
                  }
                  value={param.type}
                  onChange={(value) => onUpdate({ type: value })}
                  size="sm"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label className="text-[9px]">Display Label</Label>
                <Input
                  value={param.label || ""}
                  onChange={(e) => onUpdate({ label: e.target.value })}
                  className="h-7 text-xs"
                  placeholder="Human Readable Label"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-[9px]">Default Value</Label>
                <Input
                  value={String(param.defaultValue ?? "")}
                  onChange={(e) => onUpdate({ defaultValue: e.target.value })}
                  className="h-7 text-xs"
                  placeholder="Optional"
                />
              </div>
            </div>

            <div className="flex items-center gap-4">
              <Checkbox
                checked={param.required || false}
                onChange={(e) => onUpdate({ required: e.target.checked })}
                label="Required"
                labelClassName="text-xs"
              />

              {(param.type === "INTEGER" || param.type === "FLOAT") && (
                <div className="flex items-center gap-2">
                  <Label className="text-[9px]">Range:</Label>
                  <Input
                    type="number"
                    value={param.min ?? ""}
                    onChange={(e) =>
                      onUpdate({
                        min: e.target.value
                          ? Number(e.target.value)
                          : undefined,
                      })
                    }
                    className="h-6 text-[10px] w-16"
                    placeholder="Min"
                  />
                  <span className="text-muted-foreground">-</span>
                  <Input
                    type="number"
                    value={param.max ?? ""}
                    onChange={(e) =>
                      onUpdate({
                        max: e.target.value
                          ? Number(e.target.value)
                          : undefined,
                      })
                    }
                    className="h-6 text-[10px] w-16"
                    placeholder="Max"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Application Mode Section */}
          <div className="border-t border-border/50 pt-3">
            <div className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider mb-3">
              Application Mode
            </div>
            <ParameterModeEditor
              application={param.application || { mode: "SUBSTITUTE" }}
              onChange={(application) => onUpdate({ application })}
            />
          </div>
        </div>
      )}
    </div>
  );
};

const CommandEditor: React.FC<Props> = ({ activeTab }) => {
  const { t } = useTranslation();
  const { editingCommand, setEditingCommand, devices } = useStore();

  if (!editingCommand) return null;

  const updateCmd = (updates: Partial<SavedCommand>) => {
    setEditingCommand({ ...editingCommand, ...updates });
  };

  // Helper for parameters
  const updateParam = (idx: number, updates: Partial<CommandParameter>) => {
    const newParams = [...(editingCommand.parameters || [])];
    newParams[idx] = { ...newParams[idx], ...updates };
    updateCmd({ parameters: newParams });
  };

  const addParam = () => {
    const newParams = [...(editingCommand.parameters || [])];
    newParams.push({
      id: generateId(),
      name: `param${newParams.length + 1}`,
      type: "STRING",
      label: "",
      defaultValue: "",
      application: { mode: "SUBSTITUTE" },
    });
    updateCmd({ parameters: newParams });
  };

  const removeParam = (idx: number) => {
    const newParams = [...(editingCommand.parameters || [])];
    newParams.splice(idx, 1);
    updateCmd({ parameters: newParams });
  };

  // Detect variables in payload based on syntax
  const detectVariables = (
    payload: string,
    syntax: VariableSyntax,
  ): string[] => {
    if (!payload) return [];
    const patterns: Record<VariableSyntax, RegExp> = {
      SHELL: /\$\{(\w+)\}/g,
      MUSTACHE: /\{\{(\w+)\}\}/g,
      BATCH: /%(\w+)%/g,
      COLON: /:(\w+)/g,
      BRACES: /\{(\w+)\}/g,
      CUSTOM: editingCommand.customVariablePattern
        ? new RegExp(editingCommand.customVariablePattern, "g")
        : /(?!)/g, // Never matches if no custom pattern
    };
    const matches = [...payload.matchAll(patterns[syntax])];
    return [...new Set(matches.map((m) => m[1]))];
  };

  const detectedVars = detectVariables(
    editingCommand.payload || "",
    editingCommand.variableSyntax || "SHELL",
  );

  // --- Basic Tab ---
  if (activeTab === "basic") {
    return (
      <div className="p-4 space-y-5 overflow-y-auto custom-scrollbar h-full">
        {/* Command Definition Section */}
        <div className="space-y-4">
          <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
            Command Definition
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">
              {t("cmd.name")} <span className="text-destructive">*</span>
            </Label>
            <Input
              value={editingCommand.name || ""}
              onChange={(e) => updateCmd({ name: e.target.value })}
              className="h-8 text-sm"
              placeholder="Command name"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">Description</Label>
            <Input
              value={editingCommand.description || ""}
              onChange={(e) => updateCmd({ description: e.target.value })}
              className="h-8 text-sm"
              placeholder="Optional description"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">
              {t("cmd.payload")} <span className="text-destructive">*</span>
            </Label>
            <Textarea
              value={editingCommand.payload || ""}
              onChange={(e) => updateCmd({ payload: e.target.value })}
              className="font-mono text-xs min-h-20 resize-none p-2 bg-muted/20"
              placeholder='AT+CWJAP="${ssid}","${password}"'
            />
            {detectedVars.length > 0 && (
              <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                <AlertCircle className="w-3 h-3" />
                Variables detected:{" "}
                {detectedVars.map((v) => `\${${v}}`).join(", ")}
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs" title="Folder name for organizing">
                Folder
              </Label>
              <Input
                value={editingCommand.group || ""}
                onChange={(e) => updateCmd({ group: e.target.value })}
                className="h-8 text-sm"
                placeholder="e.g. Network"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs" title="Target device">
                Target Device
              </Label>
              <SelectDropdown
                options={[
                  { value: "", label: "-- No device --" },
                  ...devices.map(
                    (d): DropdownOption<string> => ({
                      value: d.id,
                      label: d.name,
                    }),
                  ),
                ]}
                value={editingCommand.deviceId || ""}
                onChange={(value) =>
                  updateCmd({ deviceId: value || undefined })
                }
                size="sm"
              />
            </div>
          </div>
        </div>

        {/* Format Section */}
        <div className="space-y-4 pt-4 border-t border-border/50">
          <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
            Format
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">Mode</Label>
            <SegmentedControl
              value={editingCommand.mode || "TEXT"}
              onChange={(v) => updateCmd({ mode: v as DataMode })}
              size="sm"
              options={[
                { value: "TEXT", label: "TEXT" },
                { value: "HEX", label: "HEX" },
                { value: "BINARY", label: "BINARY" },
              ]}
            />
          </div>

          {editingCommand.mode === "TEXT" && (
            <div className="space-y-1.5 animate-in fade-in">
              <Label className="text-xs">{t("cmd.encoding")}</Label>
              <SelectDropdown
                options={
                  [
                    { value: "UTF-8", label: "UTF-8" },
                    { value: "ASCII", label: "ASCII" },
                    { value: "ISO-8859-1", label: "ISO-8859-1" },
                  ] as DropdownOption<TextEncoding>[]
                }
                value={editingCommand.encoding || "UTF-8"}
                onChange={(value) => updateCmd({ encoding: value })}
                size="sm"
              />
            </div>
          )}
        </div>

        {/* Variable Parsing Section */}
        <div className="space-y-4 pt-4 border-t border-border/50">
          <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
            Variable Parsing
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">Variable Syntax</Label>
            <SelectDropdown
              options={VARIABLE_SYNTAX_OPTIONS.map(
                (opt): DropdownOption<VariableSyntax> => ({
                  value: opt.value,
                  label: opt.label,
                }),
              )}
              value={editingCommand.variableSyntax || "SHELL"}
              onChange={(value) => updateCmd({ variableSyntax: value })}
              size="sm"
            />
          </div>

          {editingCommand.variableSyntax === "CUSTOM" && (
            <div className="space-y-1.5 animate-in fade-in">
              <Label className="text-xs">Custom Pattern (Regex)</Label>
              <Input
                value={editingCommand.customVariablePattern || ""}
                onChange={(e) =>
                  updateCmd({ customVariablePattern: e.target.value })
                }
                className="h-8 text-xs font-mono"
                placeholder="\{\{(\w+)\}\}"
              />
              <p className="text-[9px] text-muted-foreground">
                Use capture group () to extract variable name
              </p>
            </div>
          )}

          <Checkbox
            checked={editingCommand.caseSensitiveVariables ?? true}
            onChange={(e) =>
              updateCmd({ caseSensitiveVariables: e.target.checked })
            }
            label="Case Sensitive Variables"
            labelClassName="text-xs"
          />
        </div>
      </div>
    );
  }

  // --- Parameters Tab ---
  if (activeTab === "params") {
    const params = editingCommand.parameters || [];
    return (
      <div className="flex flex-col h-full">
        <div className="p-3 border-b border-border flex justify-between items-center bg-muted/10 shrink-0">
          <div className="text-xs text-muted-foreground">
            {params.length} Parameter{params.length !== 1 ? "s" : ""}
          </div>
          <Button
            size="sm"
            onClick={addParam}
            variant="outline"
            className="h-7 text-xs gap-1"
          >
            <Plus className="w-3 h-3" /> Add
          </Button>
        </div>
        <div className="flex-1 overflow-y-auto p-3 space-y-3 custom-scrollbar">
          {params.length === 0 && (
            <div className="text-center py-8 text-muted-foreground space-y-2">
              <div className="text-xs italic">No parameters defined.</div>
              <p className="text-[10px]">
                Parameters can be applied via substitution, transformation, or
                direct byte insertion.
              </p>
            </div>
          )}
          {params.map((param, idx) => (
            <ParameterCard
              key={param.id || idx}
              param={param}
              index={idx}
              onUpdate={(updates) => updateParam(idx, updates)}
              onDelete={() => removeParam(idx)}
            />
          ))}
        </div>
      </div>
    );
  }

  // --- Validation Tab ---
  if (activeTab === "validation") {
    const validation = editingCommand.validation || {
      enabled: false,
      mode: "PATTERN" as ValidationMode,
      timeout: 2000,
    };

    return (
      <div className="p-4 space-y-6 overflow-y-auto custom-scrollbar h-full">
        {/* Response Validation Section */}
        <div className="space-y-4">
          <Checkbox
            checked={validation.enabled}
            onChange={(e) =>
              updateCmd({
                validation: { ...validation, enabled: e.target.checked },
              })
            }
            label="Enable Response Validation"
            labelClassName="font-bold text-xs"
          />

          {validation.enabled && (
            <div className="pl-6 space-y-4 animate-in slide-in-from-top-1">
              {/* Validation Mode Radio Group */}
              <div className="space-y-2">
                <Label className="text-xs">Validation Mode</Label>
                <RadioGroup
                  name="validationMode"
                  value={validation.mode || "PATTERN"}
                  onValueChange={(value) =>
                    updateCmd({
                      validation: {
                        ...validation,
                        mode: value as ValidationMode,
                      },
                    })
                  }
                  className="bg-muted/30 rounded-lg p-3 space-y-2"
                >
                  <Radio value="ALWAYS_PASS" label="Always Pass" />
                  <Radio value="PATTERN" label="Pattern Match" />
                  <Radio value="SCRIPT" label="Custom Script" />
                </RadioGroup>
              </div>

              {/* Mode-specific Options */}
              {validation.mode === "PATTERN" && (
                <div className="space-y-3 animate-in fade-in">
                  <div className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider">
                    Pattern Options
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1.5">
                      <Label className="text-xs">Match Type</Label>
                      <SelectDropdown
                        options={
                          [
                            { value: "CONTAINS", label: "Contains" },
                            { value: "REGEX", label: "Regex" },
                          ] as DropdownOption<MatchType>[]
                        }
                        value={validation.matchType || "CONTAINS"}
                        onChange={(value) =>
                          updateCmd({
                            validation: {
                              ...validation,
                              matchType: value,
                            },
                          })
                        }
                        size="sm"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs">Pattern</Label>
                      <Input
                        value={validation.pattern || ""}
                        onChange={(e) =>
                          updateCmd({
                            validation: {
                              ...validation,
                              pattern: e.target.value,
                            },
                          })
                        }
                        className="h-8 text-xs font-mono"
                        placeholder="OK"
                      />
                    </div>
                  </div>
                </div>
              )}

              {validation.mode === "SCRIPT" && (
                <div className="space-y-2 animate-in fade-in">
                  <div className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider">
                    Validation Script
                  </div>
                  <CodeEditor
                    value={
                      validation.validationScript ||
                      '// Return true if response is valid\n// Available: data (string), raw (Uint8Array)\nreturn data.includes("OK");'
                    }
                    onChange={(val) =>
                      updateCmd({
                        validation: { ...validation, validationScript: val },
                      })
                    }
                    height="120px"
                    className="border-l-4 border-l-amber-500/30"
                  />
                  <p className="text-[9px] text-muted-foreground">
                    Available: <code>data</code> (string), <code>raw</code>{" "}
                    (Uint8Array). Return <code>true</code> if valid.
                  </p>
                </div>
              )}

              {/* Timeout - shown for all modes */}
              <div className="space-y-1.5 pt-2 border-t border-border/30">
                <Label className="text-xs">Timeout (ms)</Label>
                <NumberInput
                  value={validation.timeout}
                  onChange={(val) =>
                    updateCmd({
                      validation: {
                        ...validation,
                        timeout: val ?? 2000,
                      },
                    })
                  }
                  min={100}
                  max={60000}
                  defaultValue={2000}
                  className="h-8 text-xs"
                />
                <p className="text-[9px] text-muted-foreground">
                  Wait time for response validation
                </p>
              </div>
            </div>
          )}
        </div>

        <hr className="border-border/50" />

        {/* Variable Extraction Section */}
        <div className="space-y-4">
          <Checkbox
            checked={validation.extractionEnabled || false}
            onChange={(e) =>
              updateCmd({
                validation: {
                  ...validation,
                  extractionEnabled: e.target.checked,
                },
              })
            }
            label="Extract Variables from Response"
            labelClassName="font-bold text-xs"
          />

          {validation.extractionEnabled && (
            <div className="pl-6 animate-in slide-in-from-top-1">
              <VariableExtractionEditor
                rules={validation.extractionRules || []}
                onChange={(rules: VariableExtractionRule[]) =>
                  updateCmd({
                    validation: { ...validation, extractionRules: rules },
                  })
                }
              />
            </div>
          )}
        </div>
      </div>
    );
  }

  // --- Scripting Tab ---
  if (activeTab === "scripting") {
    const scripting = editingCommand.scripting || { enabled: false };
    const preEnabled = !!scripting.preRequestScript;
    const postEnabled = !!scripting.postResponseScript;

    return (
      <div className="p-4 space-y-6 overflow-y-auto custom-scrollbar h-full">
        {/* Pre-Request Script Section */}
        <div className="space-y-3">
          <Checkbox
            checked={preEnabled}
            onChange={(e) =>
              updateCmd({
                scripting: {
                  ...scripting,
                  enabled: e.target.checked || postEnabled,
                  preRequestScript: e.target.checked
                    ? "// Transform payload before sending\n// Available: payload, params, log\nreturn payload;"
                    : undefined,
                },
              })
            }
            label="Pre-Request Script"
            labelClassName="font-bold text-xs"
          />

          {preEnabled && (
            <div className="pl-6 space-y-2 animate-in slide-in-from-top-1">
              <CodeEditor
                value={scripting.preRequestScript || ""}
                onChange={(val) =>
                  updateCmd({
                    scripting: { ...scripting, preRequestScript: val },
                  })
                }
                height="140px"
                className="border-l-4 border-l-blue-500/30"
              />
              <p className="text-[9px] text-muted-foreground">
                Transform the payload before sending. Available:{" "}
                <code>payload</code>, <code>params</code>, <code>log(msg)</code>
              </p>
            </div>
          )}
        </div>

        <hr className="border-border/50" />

        {/* Post-Response Script Section */}
        <div className="space-y-3">
          <Checkbox
            checked={postEnabled}
            onChange={(e) =>
              updateCmd({
                scripting: {
                  ...scripting,
                  enabled: preEnabled || e.target.checked,
                  postResponseScript: e.target.checked
                    ? '// Process response data\n// Available: data, raw, setVar, params, log\n// setVar("varName", value) to store to dashboard\nreturn true; // Return true if valid'
                    : undefined,
                },
              })
            }
            label="Post-Response Script"
            labelClassName="font-bold text-xs"
          />

          {postEnabled && (
            <div className="pl-6 space-y-2 animate-in slide-in-from-top-1">
              <CodeEditor
                value={scripting.postResponseScript || ""}
                onChange={(val) =>
                  updateCmd({
                    scripting: { ...scripting, postResponseScript: val },
                  })
                }
                height="180px"
                className="border-l-4 border-l-emerald-500/30"
              />
              <p className="text-[9px] text-muted-foreground">
                Process response data. Available: <code>data</code> (string),{" "}
                <code>raw</code> (Uint8Array), <code>setVar(name, value)</code>,{" "}
                <code>params</code>, <code>log(msg)</code>
              </p>
            </div>
          )}
        </div>

        {/* Script Examples */}
        {(preEnabled || postEnabled) && (
          <>
            <hr className="border-border/50" />
            <div className="space-y-2">
              <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                Quick Examples
              </div>
              <div className="grid grid-cols-2 gap-2">
                {preEnabled && (
                  <>
                    <button
                      type="button"
                      className="text-left p-2 text-[9px] bg-muted/30 hover:bg-muted/50 rounded border border-border/50 transition-colors"
                      onClick={() =>
                        updateCmd({
                          scripting: {
                            ...scripting,
                            preRequestScript:
                              '// Add line ending\nreturn payload + "\\r\\n";',
                          },
                        })
                      }
                    >
                      <div className="font-bold text-foreground">Add CRLF</div>
                      <div className="text-muted-foreground">Append \\r\\n</div>
                    </button>
                    <button
                      type="button"
                      className="text-left p-2 text-[9px] bg-muted/30 hover:bg-muted/50 rounded border border-border/50 transition-colors"
                      onClick={() =>
                        updateCmd({
                          scripting: {
                            ...scripting,
                            preRequestScript:
                              "// Uppercase payload\nreturn payload.toUpperCase();",
                          },
                        })
                      }
                    >
                      <div className="font-bold text-foreground">Uppercase</div>
                      <div className="text-muted-foreground">
                        Transform to upper
                      </div>
                    </button>
                  </>
                )}
                {postEnabled && (
                  <>
                    <button
                      type="button"
                      className="text-left p-2 text-[9px] bg-muted/30 hover:bg-muted/50 rounded border border-border/50 transition-colors"
                      onClick={() =>
                        updateCmd({
                          scripting: {
                            ...scripting,
                            postResponseScript:
                              '// Parse JSON response\nconst json = JSON.parse(data);\nsetVar("result", json.value);\nreturn true;',
                          },
                        })
                      }
                    >
                      <div className="font-bold text-foreground">
                        Parse JSON
                      </div>
                      <div className="text-muted-foreground">
                        Extract JSON value
                      </div>
                    </button>
                    <button
                      type="button"
                      className="text-left p-2 text-[9px] bg-muted/30 hover:bg-muted/50 rounded border border-border/50 transition-colors"
                      onClick={() =>
                        updateCmd({
                          scripting: {
                            ...scripting,
                            postResponseScript:
                              '// Extract with regex\nconst match = data.match(/temp=(\\d+)/);\nif (match) setVar("Temperature", parseInt(match[1]));\nreturn data.includes("OK");',
                          },
                        })
                      }
                    >
                      <div className="font-bold text-foreground">
                        Regex Extract
                      </div>
                      <div className="text-muted-foreground">Match pattern</div>
                    </button>
                  </>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    );
  }

  return null;
};

export default CommandEditor;
