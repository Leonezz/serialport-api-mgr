/**
 * Protocol Editor - Command Edit Modal
 *
 * Modal for editing command templates (both simple and structured)
 */

import { useState } from "react";
import { Plus, Trash2, X } from "lucide-react";
import {
  Button,
  Checkbox,
  Input,
  Label,
  Radio,
  Select,
  Textarea,
} from "../../../components/ui";
import { cn } from "../../../lib/utils";
import type {
  SimpleCommand,
  StructuredCommand,
  MessageStructure,
  CommandTemplate,
  CommandParameter,
} from "../../../lib/protocolTypes";

export interface CommandEditModalProps {
  command: CommandTemplate;
  messageStructures: MessageStructure[];
  onSave: (command: CommandTemplate) => void;
  onClose: () => void;
}

export const CommandEditModal: React.FC<CommandEditModalProps> = ({
  command,
  messageStructures,
  onSave,
  onClose,
}) => {
  const [editState, setEditState] = useState<CommandTemplate>({ ...command });
  const [activeSection, setActiveSection] = useState<
    "basic" | "parameters" | "response" | "hooks"
  >("basic");

  const isSimple = editState.type === "SIMPLE";
  const isStructured = editState.type === "STRUCTURED";

  // Get the selected message structure for structured commands
  const selectedStructure =
    isStructured && (editState as StructuredCommand).messageStructureId
      ? messageStructures.find(
          (s) => s.id === (editState as StructuredCommand).messageStructureId,
        )
      : null;

  // Switch command type
  const handleTypeChange = (newType: "SIMPLE" | "STRUCTURED") => {
    if (newType === editState.type) return;

    if (newType === "SIMPLE") {
      setEditState({
        id: editState.id,
        name: editState.name,
        description: editState.description,
        createdAt: editState.createdAt,
        updatedAt: editState.updatedAt,
        tags: editState.tags,
        category: editState.category,
        type: "SIMPLE",
        payload: "",
        mode: "TEXT",
        parameters: [],
        extractVariables: [],
      } as SimpleCommand);
    } else {
      setEditState({
        id: editState.id,
        name: editState.name,
        description: editState.description,
        createdAt: editState.createdAt,
        updatedAt: editState.updatedAt,
        tags: editState.tags,
        category: editState.category,
        type: "STRUCTURED",
        messageStructureId: messageStructures[0]?.id || "",
        parameters: [],
        bindings: [],
        staticValues: [],
        computedValues: [],
      } as StructuredCommand);
    }
  };

  // Parameter management for structured commands
  const addParameter = () => {
    if (!isStructured) return;
    const structured = editState as StructuredCommand;
    const newParam: CommandParameter = {
      id: `param_${Date.now()}`,
      name: `param${structured.parameters.length + 1}`,
      type: "STRING",
      required: false,
    };
    setEditState({
      ...structured,
      parameters: [...structured.parameters, newParam],
    } as CommandTemplate);
  };

  const updateParameter = (
    index: number,
    updates: Partial<CommandParameter>,
  ) => {
    if (!isStructured) return;
    const structured = editState as StructuredCommand;
    const newParams = [...structured.parameters];
    newParams[index] = { ...newParams[index], ...updates };
    setEditState({ ...structured, parameters: newParams } as CommandTemplate);
  };

  const removeParameter = (index: number) => {
    if (!isStructured) return;
    const structured = editState as StructuredCommand;
    const newParams = structured.parameters.filter((_, i) => i !== index);
    // Also remove any bindings that reference this parameter
    const paramName = structured.parameters[index].name;
    const newBindings = structured.bindings.filter(
      (b) => b.parameterName !== paramName,
    );
    setEditState({
      ...structured,
      parameters: newParams,
      bindings: newBindings,
    } as CommandTemplate);
  };

  // Binding management for structured commands
  const updateBinding = (paramName: string, elementId: string) => {
    if (!isStructured) return;
    const structured = editState as StructuredCommand;
    const existingIdx = structured.bindings.findIndex(
      (b) => b.parameterName === paramName,
    );
    let newBindings = [...structured.bindings];
    if (elementId) {
      if (existingIdx >= 0) {
        newBindings[existingIdx] = { ...newBindings[existingIdx], elementId };
      } else {
        newBindings.push({ elementId, parameterName: paramName });
      }
    } else {
      newBindings = newBindings.filter((b) => b.parameterName !== paramName);
    }
    setEditState({ ...structured, bindings: newBindings } as CommandTemplate);
  };

  // Static values management
  const addStaticValue = () => {
    if (!isStructured || !selectedStructure) return;
    const structured = editState as StructuredCommand;
    const usedElementIds = new Set(
      structured.staticValues.map((s) => s.elementId),
    );
    const availableElement = selectedStructure.elements.find(
      (e) => !usedElementIds.has(e.id),
    );
    if (!availableElement) return;
    setEditState({
      ...structured,
      staticValues: [
        ...structured.staticValues,
        { elementId: availableElement.id, value: 0 },
      ],
    } as CommandTemplate);
  };

  const updateStaticValue = (
    index: number,
    updates: Partial<{ elementId: string; value: number | number[] | string }>,
  ) => {
    if (!isStructured) return;
    const structured = editState as StructuredCommand;
    const newStatics = [...structured.staticValues];
    newStatics[index] = { ...newStatics[index], ...updates };
    setEditState({
      ...structured,
      staticValues: newStatics,
    } as CommandTemplate);
  };

  const removeStaticValue = (index: number) => {
    if (!isStructured) return;
    const structured = editState as StructuredCommand;
    setEditState({
      ...structured,
      staticValues: structured.staticValues.filter((_, i) => i !== index),
    } as CommandTemplate);
  };

  // Validation management
  const getValidation = () => editState.validation;
  const setValidation = (
    updates: Partial<{
      enabled: boolean;
      timeout: number;
      successPattern: string;
      successPatternType: "CONTAINS" | "REGEX";
    }>,
  ) => {
    const current = editState.validation || {
      enabled: false,
      timeout: 2000,
    };
    setEditState({
      ...editState,
      validation: { ...current, ...updates },
    } as CommandTemplate);
  };

  // Hooks management
  const getHooks = () => editState.hooks;
  const setHooks = (
    updates: Partial<{ preRequest?: string; postResponse?: string }>,
  ) => {
    const current = editState.hooks || {};
    setEditState({
      ...editState,
      hooks: { ...current, ...updates },
    } as CommandTemplate);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-background rounded-lg shadow-xl w-full max-w-4xl mx-4 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border shrink-0">
          <h3 className="font-semibold">Edit Command</h3>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* Section Tabs */}
        <div className="flex items-center gap-1 px-4 pt-3 border-b border-border shrink-0">
          {(["basic", "parameters", "response", "hooks"] as const).map(
            (tab) => (
              <button
                key={tab}
                onClick={() => setActiveSection(tab)}
                className={cn(
                  "px-3 py-2 text-sm font-medium rounded-t-md transition-colors",
                  activeSection === tab
                    ? "bg-muted text-foreground border-b-2 border-primary"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50",
                )}
              >
                {tab === "basic"
                  ? "Basic Info"
                  : tab === "parameters"
                    ? "Parameters"
                    : tab === "response"
                      ? "Response"
                      : "Hooks"}
              </button>
            ),
          )}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Basic Info Section */}
          {activeSection === "basic" && (
            <>
              {/* Command Type Toggle */}
              <div className="space-y-2">
                <Label>Command Type</Label>
                <div className="flex items-center gap-4 p-3 border border-border rounded-lg">
                  <div
                    onClick={() => handleTypeChange("SIMPLE")}
                    className="flex items-center gap-2 cursor-pointer"
                  >
                    <Radio
                      name="commandType"
                      checked={isSimple}
                      onChange={() => {}}
                      onClick={(e) => e.stopPropagation()}
                    />
                    <span className={cn(isSimple && "font-medium")}>
                      Simple
                    </span>
                    <span className="text-xs text-muted-foreground">
                      (Text-based)
                    </span>
                  </div>
                  <div
                    onClick={() => handleTypeChange("STRUCTURED")}
                    className="flex items-center gap-2 cursor-pointer"
                  >
                    <Radio
                      name="commandType"
                      checked={isStructured}
                      onChange={() => {}}
                      onClick={(e) => e.stopPropagation()}
                    />
                    <span className={cn(isStructured && "font-medium")}>
                      Structured
                    </span>
                    <span className="text-xs text-muted-foreground">
                      (Binary/Protocol)
                    </span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Name</Label>
                  <Input
                    value={editState.name}
                    onChange={(e) =>
                      setEditState((s) => ({ ...s, name: e.target.value }))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>Category</Label>
                  <Input
                    value={editState.category || ""}
                    onChange={(e) =>
                      setEditState((s) => ({ ...s, category: e.target.value }))
                    }
                    placeholder="e.g., Configuration, Query"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea
                  value={editState.description || ""}
                  onChange={(e) =>
                    setEditState((s) => ({ ...s, description: e.target.value }))
                  }
                  rows={2}
                />
              </div>

              {/* Simple Command Fields */}
              {isSimple && (
                <>
                  <div className="space-y-2">
                    <Label>Payload</Label>
                    <Textarea
                      value={(editState as SimpleCommand).payload}
                      onChange={(e) =>
                        setEditState(
                          (s) =>
                            ({
                              ...s,
                              payload: e.target.value,
                            }) as CommandTemplate,
                        )
                      }
                      placeholder="Enter command payload... Use {paramName} for parameters"
                      rows={3}
                      className="font-mono"
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label>Mode</Label>
                      <Select
                        value={(editState as SimpleCommand).mode}
                        onChange={(e) =>
                          setEditState(
                            (s) =>
                              ({
                                ...s,
                                mode: e.target.value,
                              }) as CommandTemplate,
                          )
                        }
                      >
                        <option value="TEXT">Text</option>
                        <option value="HEX">Hex</option>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Encoding</Label>
                      <Select
                        value={(editState as SimpleCommand).encoding || "UTF-8"}
                        onChange={(e) =>
                          setEditState(
                            (s) =>
                              ({
                                ...s,
                                encoding: e.target.value,
                              }) as CommandTemplate,
                          )
                        }
                      >
                        <option value="UTF-8">UTF-8</option>
                        <option value="ASCII">ASCII</option>
                        <option value="ISO-8859-1">ISO-8859-1</option>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Line Ending</Label>
                      <Select
                        value={
                          (editState as SimpleCommand).lineEnding || "NONE"
                        }
                        onChange={(e) =>
                          setEditState(
                            (s) =>
                              ({
                                ...s,
                                lineEnding: e.target.value,
                              }) as CommandTemplate,
                          )
                        }
                      >
                        <option value="NONE">None</option>
                        <option value="LF">LF (\n)</option>
                        <option value="CR">CR (\r)</option>
                        <option value="CRLF">CRLF (\r\n)</option>
                      </Select>
                    </div>
                  </div>
                </>
              )}

              {/* Structured Command Fields */}
              {isStructured && (
                <>
                  <div className="space-y-2">
                    <Label>Message Structure</Label>
                    <Select
                      value={
                        (editState as StructuredCommand).messageStructureId
                      }
                      onChange={(e) =>
                        setEditState(
                          (s) =>
                            ({
                              ...s,
                              messageStructureId: e.target.value,
                            }) as CommandTemplate,
                        )
                      }
                    >
                      {messageStructures.length === 0 ? (
                        <option value="">No structures available</option>
                      ) : (
                        messageStructures.map((structure) => (
                          <option key={structure.id} value={structure.id}>
                            {structure.name}
                          </option>
                        ))
                      )}
                    </Select>
                    {messageStructures.length === 0 && (
                      <p className="text-xs text-amber-600">
                        Create message structures first in the Structures tab.
                      </p>
                    )}
                  </div>

                  {/* Static Values Section */}
                  {selectedStructure && (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <Label>Static Values</Label>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={addStaticValue}
                          className="gap-1"
                        >
                          <Plus className="w-3 h-3" />
                          Add
                        </Button>
                      </div>
                      {(editState as StructuredCommand).staticValues.length ===
                      0 ? (
                        <p className="text-sm text-muted-foreground italic">
                          No static values defined. Static values set fixed
                          bytes for elements.
                        </p>
                      ) : (
                        <div className="space-y-2">
                          {(editState as StructuredCommand).staticValues.map(
                            (sv, idx) => (
                              <div
                                key={idx}
                                className="flex items-center gap-2 p-2 bg-muted/50 rounded"
                              >
                                <Select
                                  value={sv.elementId}
                                  onChange={(e) =>
                                    updateStaticValue(idx, {
                                      elementId: e.target.value,
                                    })
                                  }
                                  className="flex-1"
                                >
                                  {selectedStructure.elements.map((el) => (
                                    <option key={el.id} value={el.id}>
                                      {el.name}
                                    </option>
                                  ))}
                                </Select>
                                <span className="text-muted-foreground">→</span>
                                <Input
                                  value={
                                    typeof sv.value === "number"
                                      ? `0x${sv.value.toString(16).toUpperCase()}`
                                      : String(sv.value)
                                  }
                                  onChange={(e) => {
                                    const val = e.target.value;
                                    const parsed = val.startsWith("0x")
                                      ? parseInt(val, 16)
                                      : parseInt(val, 10);
                                    updateStaticValue(idx, {
                                      value: isNaN(parsed) ? val : parsed,
                                    });
                                  }}
                                  className="w-24 font-mono"
                                  placeholder="0x00"
                                />
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => removeStaticValue(idx)}
                                  className="text-destructive hover:text-destructive"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </Button>
                              </div>
                            ),
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </>
              )}

              <div className="space-y-2">
                <Label>Tags</Label>
                <Input
                  value={editState.tags.join(", ")}
                  onChange={(e) =>
                    setEditState((s) => ({
                      ...s,
                      tags: e.target.value
                        .split(",")
                        .map((t) => t.trim())
                        .filter((t) => t),
                    }))
                  }
                  placeholder="tag1, tag2, tag3"
                />
              </div>
            </>
          )}

          {/* Parameters Section */}
          {activeSection === "parameters" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium">Parameters</h4>
                  <p className="text-sm text-muted-foreground">
                    {isSimple
                      ? "Define parameters that can be substituted in the payload using {paramName}."
                      : "Define parameters and bind them to message structure elements."}
                  </p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addParameter}
                  className="gap-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Add Parameter
                </Button>
              </div>

              {isStructured &&
              (editState as StructuredCommand).parameters.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 border border-dashed border-border rounded-lg">
                  <p className="text-muted-foreground mb-2">
                    No parameters defined
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Add parameters to make the command configurable
                  </p>
                </div>
              ) : isStructured ? (
                <div className="border border-border rounded-lg overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-muted/50">
                      <tr>
                        <th className="px-3 py-2 text-left font-medium">
                          Name
                        </th>
                        <th className="px-3 py-2 text-left font-medium">
                          Type
                        </th>
                        <th className="px-3 py-2 text-left font-medium">
                          Default
                        </th>
                        <th className="px-3 py-2 text-left font-medium">
                          Bind to Element
                        </th>
                        <th className="px-3 py-2 w-10"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {(editState as StructuredCommand).parameters.map(
                        (param, idx) => {
                          const binding = (
                            editState as StructuredCommand
                          ).bindings.find(
                            (b) => b.parameterName === param.name,
                          );
                          return (
                            <tr key={param.id || idx}>
                              <td className="px-3 py-2">
                                <Input
                                  value={param.name}
                                  onChange={(e) =>
                                    updateParameter(idx, {
                                      name: e.target.value,
                                    })
                                  }
                                  className="h-8 text-sm font-mono"
                                />
                              </td>
                              <td className="px-3 py-2">
                                <Select
                                  value={param.type}
                                  onChange={(e) =>
                                    updateParameter(idx, {
                                      type: e.target.value as
                                        | "STRING"
                                        | "INTEGER"
                                        | "FLOAT"
                                        | "BOOLEAN"
                                        | "ENUM",
                                    })
                                  }
                                  className="h-8 text-sm"
                                >
                                  <option value="STRING">String</option>
                                  <option value="INTEGER">Integer</option>
                                  <option value="FLOAT">Float</option>
                                  <option value="BOOLEAN">Boolean</option>
                                  <option value="ENUM">Enum</option>
                                </Select>
                              </td>
                              <td className="px-3 py-2">
                                <Input
                                  value={String(param.defaultValue || "")}
                                  onChange={(e) =>
                                    updateParameter(idx, {
                                      defaultValue:
                                        param.type === "INTEGER"
                                          ? parseInt(e.target.value) || 0
                                          : param.type === "FLOAT"
                                            ? parseFloat(e.target.value) || 0
                                            : param.type === "BOOLEAN"
                                              ? e.target.value === "true"
                                              : e.target.value,
                                    })
                                  }
                                  className="h-8 text-sm"
                                  placeholder="-"
                                />
                              </td>
                              <td className="px-3 py-2">
                                <Select
                                  value={binding?.elementId || ""}
                                  onChange={(e) =>
                                    updateBinding(param.name, e.target.value)
                                  }
                                  className="h-8 text-sm"
                                >
                                  <option value="">-- Not bound --</option>
                                  {selectedStructure?.elements.map((el) => (
                                    <option key={el.id} value={el.id}>
                                      {el.name}
                                    </option>
                                  ))}
                                </Select>
                              </td>
                              <td className="px-3 py-2">
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => removeParameter(idx)}
                                  className="h-8 w-8 text-destructive hover:text-destructive"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </Button>
                              </td>
                            </tr>
                          );
                        },
                      )}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-sm text-muted-foreground italic">
                  Simple commands use template substitution. Add parameters
                  using the &quot;Add Parameter&quot; button and reference them
                  in the payload as {"{paramName}"}.
                </div>
              )}
            </div>
          )}

          {/* Response Section */}
          {activeSection === "response" && (
            <div className="space-y-4">
              <div>
                <h4 className="font-medium">Response Validation</h4>
                <p className="text-sm text-muted-foreground">
                  Configure how to validate the response from this command.
                </p>
              </div>

              <div className="space-y-3 p-4 border border-border rounded-lg">
                <Checkbox
                  checked={getValidation()?.enabled || false}
                  onChange={(e) => setValidation({ enabled: e.target.checked })}
                  label="Enable Validation"
                />

                {getValidation()?.enabled && (
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Timeout (ms)</Label>
                        <Input
                          type="number"
                          value={getValidation()?.timeout || 2000}
                          onChange={(e) =>
                            setValidation({
                              timeout: parseInt(e.target.value) || 2000,
                            })
                          }
                          min={100}
                          max={30000}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Match Type</Label>
                        <Select
                          value={
                            getValidation()?.successPatternType || "CONTAINS"
                          }
                          onChange={(e) =>
                            setValidation({
                              successPatternType: e.target.value as
                                | "CONTAINS"
                                | "REGEX",
                            })
                          }
                        >
                          <option value="CONTAINS">Contains</option>
                          <option value="REGEX">Regex</option>
                        </Select>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Success Pattern</Label>
                      <Input
                        value={getValidation()?.successPattern || ""}
                        onChange={(e) =>
                          setValidation({ successPattern: e.target.value })
                        }
                        placeholder={
                          getValidation()?.successPatternType === "REGEX"
                            ? "e.g., OK|SUCCESS"
                            : "e.g., OK"
                        }
                        className="font-mono"
                      />
                    </div>
                  </>
                )}
              </div>

              {/* Response Patterns for Structured Commands */}
              {isStructured && (
                <div className="space-y-3">
                  <div>
                    <h4 className="font-medium">Response Patterns</h4>
                    <p className="text-sm text-muted-foreground">
                      Define patterns for success, error, and data responses.
                    </p>
                  </div>
                  <div className="p-4 border border-dashed border-border rounded-lg text-center text-muted-foreground text-sm">
                    Response pattern configuration coming soon. Currently only
                    basic validation is supported.
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Hooks Section */}
          {activeSection === "hooks" && (
            <div className="space-y-4">
              <div>
                <h4 className="font-medium">Scripting Hooks</h4>
                <p className="text-sm text-muted-foreground">
                  JavaScript code that runs before sending and after receiving.
                </p>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Pre-Request Script</Label>
                  <Textarea
                    value={getHooks()?.preRequest || ""}
                    onChange={(e) => setHooks({ preRequest: e.target.value })}
                    placeholder="// Runs before sending command. Available: params, payload, log()&#10;// Return modified payload or nothing&#10;// Example: return payload + params.suffix;"
                    rows={5}
                    className="font-mono text-sm"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Post-Response Script</Label>
                  <Textarea
                    value={getHooks()?.postResponse || ""}
                    onChange={(e) => setHooks({ postResponse: e.target.value })}
                    placeholder="// Runs after receiving response. Available: data, raw, setVar(), params&#10;// Return true if validation passed&#10;// Example: const json = JSON.parse(data); setVar('temp', json.temp); return true;"
                    rows={5}
                    className="font-mono text-sm"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-2 p-4 border-t border-border shrink-0">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={() => onSave(editState)}>Save</Button>
        </div>
      </div>
    </div>
  );
};
