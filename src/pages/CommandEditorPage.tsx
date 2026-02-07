/**
 * Command Editor Page
 *
 * Full-page editor for Command definitions.
 * Contains tabs for:
 * - Basic: Name, payload, mode, encoding
 * - Parameters: Command parameters
 * - Validation: Response validation settings
 * - Scripting: Pre/post scripts
 * - Framing: Response framing override
 * - Context: Associated contexts
 */

import React, { useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Settings,
  Code,
  CheckCircle,
  Layers,
  FileText,
  Save,
  Trash2,
  Plus,
  X,
  Variable,
} from "lucide-react";
import { useStore } from "../lib/store";
import {
  Breadcrumb,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Checkbox,
  CodeEditor,
  Input,
  Label,
  NumberInput,
  SelectDropdown,
  Textarea,
  workspaceItem,
} from "../components/ui";
import { PageHeader } from "../routes";
import ConfirmationModal from "../components/ConfirmationModal";
import { cn } from "../lib/utils";
import { getEffectiveMode, getEffectivePayload } from "../lib/commandBuilder";
import { SavedCommandSchema } from "../lib/schemas";
import type { SavedCommand, CommandParameter, DataMode } from "../types";
import { useTranslation } from "react-i18next";

// Tab definitions
type EditorTab =
  | "basic"
  | "params"
  | "validation"
  | "scripting"
  | "framing"
  | "context";

const TABS: { id: EditorTab; label: string; icon: React.ElementType }[] = [
  { id: "basic", label: "Basic", icon: Settings },
  { id: "params", label: "Parameters", icon: Variable },
  { id: "validation", label: "Validation", icon: CheckCircle },
  { id: "scripting", label: "Scripting", icon: Code },
  { id: "framing", label: "Framing", icon: Layers },
  { id: "context", label: "Context", icon: FileText },
];

const MODE_OPTIONS = [
  { label: "Text", value: "TEXT" },
  { label: "Hex", value: "HEX" },
  { label: "Binary", value: "BINARY" },
];

const ENCODING_OPTIONS = [
  { label: "UTF-8", value: "UTF-8" },
  { label: "ASCII", value: "ASCII" },
  { label: "ISO-8859-1", value: "ISO-8859-1" },
];

const VALIDATION_MODE_OPTIONS = [
  { label: "Always Pass", value: "ALWAYS_PASS" },
  { label: "Pattern Match", value: "PATTERN" },
  { label: "Custom Script", value: "SCRIPT" },
];

const MATCH_TYPE_OPTIONS = [
  { label: "Contains", value: "CONTAINS" },
  { label: "Regex", value: "REGEX" },
];

const PARAM_TYPE_OPTIONS = [
  { label: "String", value: "STRING" },
  { label: "Integer", value: "INTEGER" },
  { label: "Float", value: "FLOAT" },
  { label: "Boolean", value: "BOOLEAN" },
  { label: "Enum", value: "ENUM" },
];

const FRAMING_STRATEGY_OPTIONS = [
  { label: "None", value: "NONE" },
  { label: "Delimiter", value: "DELIMITER" },
  { label: "Timeout", value: "TIMEOUT" },
  { label: "Length Prefix", value: "PREFIX_LENGTH" },
  { label: "Custom Script", value: "SCRIPT" },
];

interface CommandEditorContentProps {
  command: SavedCommand;
}

const CommandEditorContent: React.FC<CommandEditorContentProps> = ({
  command,
}) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { updateCommand, deleteCommand, contexts, addToast } = useStore();
  const id = command.id;

  const [activeTab, setActiveTab] = useState<EditorTab>("basic");
  const [deleteConfirm, setDeleteConfirm] = useState(false);

  const {
    register,
    watch,
    setValue,
    getValues,
    reset,
    formState: { isDirty },
    control,
  } = useForm<SavedCommand>({
    resolver: zodResolver(SavedCommandSchema),
    defaultValues: { ...command },
  });

  const {
    fields: parameters,
    append: appendParameter,
    remove: removeParameterAt,
  } = useFieldArray({
    control,
    name: "parameters",
  });

  const editState = watch();

  // Check if this is a PROTOCOL source command
  const isProtocolCommand = editState.source === "PROTOCOL";

  // Get effective mode and payload (handles both CUSTOM and PROTOCOL commands)
  const effectiveMode = getEffectiveMode(editState);
  const effectivePayload = getEffectivePayload(editState);

  // Update mode - writes to correct location based on source
  const updateMode = (newMode: DataMode) => {
    if (isProtocolCommand && editState.protocolLayer) {
      setValue(
        "protocolLayer",
        { ...editState.protocolLayer, mode: newMode },
        { shouldDirty: true },
      );
    } else {
      setValue("mode", newMode, { shouldDirty: true });
    }
  };

  // Update payload - writes to correct location based on source
  const updatePayload = (newPayload: string) => {
    if (isProtocolCommand && editState.protocolLayer) {
      setValue(
        "protocolLayer",
        { ...editState.protocolLayer, payload: newPayload },
        { shouldDirty: true },
      );
    } else {
      setValue("payload", newPayload, { shouldDirty: true });
    }
  };

  const handleSave = () => {
    updateCommand(id, editState);
    reset(editState);
    addToast(
      "success",
      "Saved",
      `Command "${editState.name}" saved successfully.`,
    );
  };

  const handleDelete = () => {
    deleteCommand(id);
    addToast("success", "Deleted", `Command "${editState.name}" deleted.`);
    navigate("/");
  };

  // Parameters helpers
  const addParameter = () => {
    appendParameter({
      name: `param${parameters.length + 1}`,
      type: "STRING",
    });
  };

  const updateParameter = (idx: number, updates: Partial<CommandParameter>) => {
    const currentParams = getValues("parameters");
    setValue(
      `parameters.${idx}`,
      { ...currentParams[idx], ...updates },
      { shouldDirty: true },
    );
  };

  const removeParameter = (idx: number) => {
    removeParameterAt(idx);
  };

  // Validation helpers
  const validation = editState.validation || {
    enabled: false,
    mode: "ALWAYS_PASS" as const,
    pattern: "",
    matchType: "CONTAINS" as const,
    timeout: 2000,
  };

  const updateValidation = (
    updates: Partial<NonNullable<SavedCommand["validation"]>>,
  ) => {
    setValue(
      "validation",
      { ...validation, ...updates },
      { shouldDirty: true },
    );
  };

  // Scripting helpers
  const scripting = editState.scripting || { enabled: false };

  const updateScripting = (updates: Partial<typeof scripting>) => {
    setValue("scripting", { ...scripting, ...updates }, { shouldDirty: true });
  };

  // Framing helpers
  const responseFraming = editState.responseFraming || { strategy: "NONE" };

  const updateFraming = (updates: Partial<typeof responseFraming>) => {
    setValue(
      "responseFraming",
      { ...responseFraming, ...updates },
      { shouldDirty: true },
    );
  };

  // Context helpers
  const contextIds = editState.contextIds || [];

  return (
    <div className="flex flex-col h-full bg-background">
      <PageHeader
        title={`Edit: ${editState.name}`}
        actions={
          <div className="flex items-center gap-2">
            {isDirty && (
              <span className="text-sm text-amber-500">Unsaved changes</span>
            )}
            <Button
              variant="outline"
              size="sm"
              className="gap-2 text-destructive hover:text-destructive"
              onClick={() => setDeleteConfirm(true)}
            >
              <Trash2 className="w-4 h-4" />
              Delete
            </Button>
            <Button size="sm" className="gap-2" onClick={handleSave}>
              <Save className="w-4 h-4" />
              Save
            </Button>
          </div>
        }
      />

      {/* Breadcrumb */}
      <div className="px-6 py-3 border-b border-border/50">
        <Breadcrumb
          items={[
            workspaceItem,
            { label: "Commands", href: "/commands" },
            { label: editState.name },
          ]}
        />
      </div>

      {/* Tabs */}
      <div className="border-b border-border px-4">
        <div className="flex gap-1">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors",
                  activeTab === tab.id
                    ? "border-primary text-primary"
                    : "border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/50",
                )}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-auto p-6">
        <div className="max-w-4xl mx-auto space-y-6">
          {activeTab === "basic" && (
            <>
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Basic Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Name</Label>
                    <Input {...register("name")} placeholder="Command name" />
                  </div>

                  <div className="space-y-2">
                    <Label>Group (Optional)</Label>
                    <Input
                      {...register("group")}
                      placeholder="e.g., Configuration, Diagnostics"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Description (Optional)</Label>
                    <Textarea
                      {...register("description")}
                      placeholder="What does this command do?"
                      rows={2}
                    />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Payload</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Mode</Label>
                      <SelectDropdown
                        value={effectiveMode}
                        onChange={(v) => updateMode(v as DataMode)}
                        options={MODE_OPTIONS}
                      />
                    </div>

                    {effectiveMode === "TEXT" && (
                      <div className="space-y-2">
                        <Label>Encoding</Label>
                        <SelectDropdown
                          value={editState.encoding || "UTF-8"}
                          onChange={(v) =>
                            setValue(
                              "encoding",
                              v as "UTF-8" | "ASCII" | "ISO-8859-1",
                              { shouldDirty: true },
                            )
                          }
                          options={ENCODING_OPTIONS}
                        />
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label>Payload</Label>
                    <Textarea
                      value={effectivePayload}
                      onChange={(e) => updatePayload(e.target.value)}
                      placeholder={
                        effectiveMode === "HEX"
                          ? "e.g., 01 02 03 FF"
                          : effectiveMode === "BINARY"
                            ? "e.g., 00000001 00000010"
                            : "Enter command text..."
                      }
                      className="font-mono"
                      rows={3}
                    />
                    <p className="text-xs text-muted-foreground">
                      Use {"{paramName}"} for parameter placeholders
                    </p>
                  </div>
                </CardContent>
              </Card>
            </>
          )}

          {activeTab === "params" && (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-base">Parameters</CardTitle>
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-2"
                  onClick={addParameter}
                >
                  <Plus className="w-4 h-4" />
                  Add Parameter
                </Button>
              </CardHeader>
              <CardContent>
                {parameters.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <p className="mb-4">No parameters defined.</p>
                    <Button variant="outline" onClick={addParameter}>
                      Add First Parameter
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {parameters.map((param, idx) => (
                      <div
                        key={idx}
                        className="p-4 border border-border rounded-lg space-y-4"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">
                            Parameter {idx + 1}
                          </span>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive"
                            onClick={() => removeParameter(idx)}
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label>Name</Label>
                            <Input
                              value={param.name}
                              onChange={(e) =>
                                updateParameter(idx, { name: e.target.value })
                              }
                              placeholder="paramName"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Type</Label>
                            <SelectDropdown
                              value={param.type}
                              onChange={(v) =>
                                updateParameter(idx, {
                                  type: v as CommandParameter["type"],
                                })
                              }
                              options={PARAM_TYPE_OPTIONS}
                            />
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label>Label (Optional)</Label>
                          <Input
                            value={param.label || ""}
                            onChange={(e) =>
                              updateParameter(idx, {
                                label: e.target.value || undefined,
                              })
                            }
                            placeholder="Display label"
                          />
                        </div>

                        {(param.type === "INTEGER" ||
                          param.type === "FLOAT") && (
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label>Min</Label>
                              <NumberInput
                                value={param.min}
                                onChange={(v) =>
                                  updateParameter(idx, { min: v })
                                }
                                placeholder="Minimum"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label>Max</Label>
                              <NumberInput
                                value={param.max}
                                onChange={(v) =>
                                  updateParameter(idx, { max: v })
                                }
                                placeholder="Maximum"
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {activeTab === "validation" && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Response Validation</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="validation-enabled"
                    checked={validation.enabled}
                    onChange={(e) =>
                      updateValidation({ enabled: e.target.checked })
                    }
                  />
                  <Label htmlFor="validation-enabled">
                    Enable response validation
                  </Label>
                </div>

                {validation.enabled && (
                  <>
                    <div className="space-y-2">
                      <Label>Validation Mode</Label>
                      <SelectDropdown
                        value={validation.mode}
                        onChange={(v) =>
                          updateValidation({
                            mode: v as "ALWAYS_PASS" | "PATTERN" | "SCRIPT",
                          })
                        }
                        options={VALIDATION_MODE_OPTIONS}
                      />
                    </div>

                    {validation.mode === "PATTERN" && (
                      <>
                        <div className="space-y-2">
                          <Label>Match Type</Label>
                          <SelectDropdown
                            value={validation.matchType || "CONTAINS"}
                            onChange={(v) =>
                              updateValidation({
                                matchType: v as "CONTAINS" | "REGEX",
                              })
                            }
                            options={MATCH_TYPE_OPTIONS}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Pattern</Label>
                          <Input
                            value={validation.pattern || ""}
                            onChange={(e) =>
                              updateValidation({ pattern: e.target.value })
                            }
                            placeholder={
                              validation.matchType === "REGEX" ? "^OK.*$" : "OK"
                            }
                            className="font-mono"
                          />
                        </div>
                      </>
                    )}

                    {validation.mode === "SCRIPT" && (
                      <div className="space-y-2">
                        <Label>Validation Script</Label>
                        <CodeEditor
                          value={
                            validation.validationScript ||
                            '// Return true if response is valid\nreturn data.includes("OK");'
                          }
                          onChange={(val) =>
                            updateValidation({ validationScript: val })
                          }
                          height="150px"
                          className="border-l-4 border-l-amber-500/30"
                        />
                        <p className="text-xs text-muted-foreground">
                          Available: <code>data</code> (string),{" "}
                          <code>raw</code> (Uint8Array)
                        </p>
                      </div>
                    )}

                    <div className="space-y-2">
                      <Label>Timeout (ms)</Label>
                      <NumberInput
                        value={validation.timeout}
                        onChange={(v) =>
                          updateValidation({ timeout: v ?? 2000 })
                        }
                        min={100}
                        max={60000}
                      />
                    </div>

                    <p className="text-xs text-muted-foreground pt-2 border-t border-border">
                      Note: For post-response data extraction, use the Scripting
                      tab with a Post-Response Script.
                    </p>
                  </>
                )}
              </CardContent>
            </Card>
          )}

          {activeTab === "scripting" && (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">
                    Pre-Request Script
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Checkbox
                    checked={!!scripting.preRequestScript}
                    onChange={(e) => {
                      if (e.target.checked) {
                        updateScripting({
                          enabled: true,
                          preRequestScript:
                            "// Modify payload before sending\nreturn payload;",
                        });
                      } else {
                        updateScripting({ preRequestScript: undefined });
                      }
                    }}
                    label="Enable Pre-Request Script"
                  />

                  {scripting.preRequestScript && (
                    <div className="space-y-2">
                      <CodeEditor
                        value={scripting.preRequestScript}
                        onChange={(val) =>
                          updateScripting({ preRequestScript: val })
                        }
                        height="150px"
                        className="border-l-4 border-l-blue-500/30"
                      />
                      <p className="text-xs text-muted-foreground">
                        Available: <code>payload</code>, <code>params</code>,{" "}
                        <code>log(msg)</code>
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">
                    Post-Response Script
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Checkbox
                    checked={!!scripting.postResponseScript}
                    onChange={(e) => {
                      if (e.target.checked) {
                        updateScripting({
                          enabled: true,
                          postResponseScript:
                            "// Process response data\nreturn true;",
                        });
                      } else {
                        updateScripting({ postResponseScript: undefined });
                      }
                    }}
                    label="Enable Post-Response Script"
                  />

                  {scripting.postResponseScript && (
                    <div className="space-y-2">
                      <CodeEditor
                        value={scripting.postResponseScript}
                        onChange={(val) =>
                          updateScripting({ postResponseScript: val })
                        }
                        height="180px"
                        className="border-l-4 border-l-emerald-500/30"
                      />
                      <p className="text-xs text-muted-foreground">
                        Available: <code>data</code>, <code>raw</code>,{" "}
                        <code>setVar(name, value)</code>, <code>params</code>,{" "}
                        <code>log(msg)</code>
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}

          {activeTab === "framing" && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">
                  Response Framing Override
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Override the session&apos;s framing strategy for responses to
                  this command.
                </p>

                <div className="space-y-2">
                  <Label>Framing Strategy</Label>
                  <SelectDropdown
                    value={responseFraming.strategy}
                    onChange={(v) =>
                      updateFraming({
                        strategy: v as typeof responseFraming.strategy,
                      })
                    }
                    options={FRAMING_STRATEGY_OPTIONS}
                  />
                </div>

                {responseFraming.strategy === "DELIMITER" && (
                  <div className="space-y-2">
                    <Label>Delimiter</Label>
                    <Input
                      value={responseFraming.delimiter || ""}
                      onChange={(e) =>
                        updateFraming({ delimiter: e.target.value })
                      }
                      placeholder="e.g., \n or 0D0A (hex)"
                      className="font-mono"
                    />
                  </div>
                )}

                {responseFraming.strategy === "TIMEOUT" && (
                  <div className="space-y-2">
                    <Label>Timeout (ms)</Label>
                    <NumberInput
                      value={responseFraming.timeout}
                      onChange={(v) => updateFraming({ timeout: v ?? 100 })}
                      min={10}
                      max={5000}
                    />
                  </div>
                )}

                {responseFraming.strategy === "SCRIPT" && (
                  <div className="space-y-2">
                    <Label>Framing Script</Label>
                    <CodeEditor
                      value={responseFraming.script || ""}
                      onChange={(val) => updateFraming({ script: val })}
                      height="200px"
                      className="border-l-4 border-l-purple-500/30"
                    />
                  </div>
                )}

                {responseFraming.strategy !== "NONE" && (
                  <div className="space-y-2">
                    <Label>Persistence</Label>
                    <SelectDropdown
                      value={editState.framingPersistence || "TRANSIENT"}
                      onChange={(v) =>
                        setValue(
                          "framingPersistence",
                          v as "TRANSIENT" | "PERSISTENT",
                          { shouldDirty: true },
                        )
                      }
                      options={[
                        {
                          label: "Transient (revert after response)",
                          value: "TRANSIENT",
                        },
                        {
                          label: "Persistent (keep for session)",
                          value: "PERSISTENT",
                        },
                      ]}
                    />
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {activeTab === "context" && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Associated Contexts</CardTitle>
              </CardHeader>
              <CardContent>
                {contexts.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No contexts available. Create contexts in the main
                    workspace.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {contexts.map((ctx) => (
                      <label
                        key={ctx.id}
                        className="flex items-center gap-3 p-3 border border-border rounded-lg cursor-pointer hover:bg-muted/50 transition-colors"
                      >
                        <input
                          type="checkbox"
                          checked={contextIds.includes(ctx.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setValue("contextIds", [...contextIds, ctx.id], {
                                shouldDirty: true,
                              });
                            } else {
                              setValue(
                                "contextIds",
                                contextIds.filter((cid) => cid !== ctx.id),
                                { shouldDirty: true },
                              );
                            }
                          }}
                          className="w-4 h-4"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{ctx.title}</p>
                          {ctx.content && (
                            <p className="text-xs text-muted-foreground truncate">
                              {ctx.content}
                            </p>
                          )}
                        </div>
                      </label>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {deleteConfirm && (
        <ConfirmationModal
          title="Delete Command"
          message={`Are you sure you want to delete "${editState.name}"? This action cannot be undone.`}
          confirmLabel="Delete"
          isDestructive
          onConfirm={handleDelete}
          onCancel={() => setDeleteConfirm(false)}
        />
      )}
    </div>
  );
};

const CommandEditorPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { commands } = useStore();

  const command = useMemo(
    () => commands.find((c) => c.id === id),
    [commands, id],
  );

  if (!command) {
    return (
      <div className="flex flex-col h-full bg-background">
        <PageHeader title="Command Not Found" backTo="/" />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-xl font-semibold mb-2">Command Not Found</h2>
            <p className="text-muted-foreground mb-4">
              The command you&apos;re looking for doesn&apos;t exist or has been
              deleted.
            </p>
            <Button onClick={() => navigate("/")}>Back to Workspace</Button>
          </div>
        </div>
      </div>
    );
  }

  return <CommandEditorContent key={command.id} command={command} />;
};

export default CommandEditorPage;
