import React, { useState } from "react";
import {
  SavedCommand,
  SavedCommandSchema,
  DataMode,
  TextEncoding,
  MatchType,
  SerialSequence,
  ProjectContext,
  CommandParameter,
  ParameterType,
  FramingStrategy,
  FramingConfig,
} from "../types";
import {
  X,
  Check,
  AlertTriangle,
  Calculator,
  Plus,
  Trash2,
  FileCode,
  Search,
  Terminal,
} from "lucide-react";
import { useForm, useFieldArray, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "./ui/Button";
import { Input } from "./ui/Input";
import { Textarea } from "./ui/Textarea";
import { SelectDropdown } from "./ui/Select";
import { DropdownOption } from "./ui/Dropdown";
import { Label } from "./ui/Label";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter,
} from "./ui/Card";
import { Badge } from "./ui/Badge";
import { TabBar, type TabItem } from "./ui/TabBar";
import { cn, generateId } from "../lib/utils";
import {
  generateModbusFrame,
  MODBUS_FUNCTIONS,
  AT_COMMAND_LIBRARY,
  ModbusParams,
} from "../services/protocolUtils";
import { useTranslation } from "react-i18next";
import CodeEditor from "./ui/CodeEditor";
import { Checkbox } from "./ui/Checkbox";

interface Props {
  initialData?: Partial<SavedCommand>;
  sequences: SerialSequence[];
  contexts: ProjectContext[];
  onSave: (command: Omit<SavedCommand, "id">) => void;
  onUpdateContext?: (context: ProjectContext) => void;
  onCreateContext: (context: ProjectContext) => void;
  onClose: () => void;
}

// We need a schema that makes 'id' optional for the form, or we generate it.
// Since onSave expects Omit<SavedCommand, 'id'>, we can just use SavedCommandSchema
// and strip ID, or ensure ID is present if editing.
// For simplicity, we'll let the form handle the full SavedCommand structure.

const CommandFormModal: React.FC<Props> = ({
  initialData,
  contexts,
  onSave,
  onUpdateContext,
  onCreateContext,
  onClose,
}) => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<
    "basic" | "params" | "protocol" | "processing" | "framing" | "context"
  >("basic");

  // Local state for Context editing (not part of SavedCommand)
  const [contextTitle, setContextTitle] = useState("");
  const [contextContent, setContextContent] = useState("");

  // Local state for Protocol Wizard
  const [protoType, setProtoType] = useState<"MODBUS" | "AT">("MODBUS");
  const [mbParams, setMbParams] = useState<ModbusParams>({
    slaveId: 1,
    functionCode: 3,
    startAddress: 0,
    quantityOrValue: 1,
  });

  // Local state for UI toggles that affect form structure
  const [responseMode, setResponseMode] = useState<"PATTERN" | "SCRIPT">(
    initialData?.scripting?.postResponseScript ? "SCRIPT" : "PATTERN",
  );

  const {
    control,
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<SavedCommand>({
    resolver: zodResolver(SavedCommandSchema),
    defaultValues: {
      id: initialData?.id || generateId(),
      name: initialData?.name || "",
      description: initialData?.description || "",
      payload: initialData?.payload || "",
      group: initialData?.group || "",
      mode: initialData?.mode || "TEXT",
      encoding: initialData?.encoding || "UTF-8",
      parameters: initialData?.parameters || [],
      contextIds: initialData?.contextIds || [],
      scripting: {
        enabled: initialData?.scripting?.enabled || false,
        preRequestScript:
          initialData?.scripting?.preRequestScript ||
          '// return payload + "\\r\\n";',
        postResponseScript:
          initialData?.scripting?.postResponseScript ||
          '// if (data.includes("OK")) return true;',
      },
      validation: initialData?.validation || {
        enabled: false,
        matchType: "CONTAINS",
        pattern: "",
        timeout: 1000,
        mode: "PATTERN",
      },
      responseFraming: initialData?.responseFraming || {
        strategy: "NONE",
        delimiter: "",
        timeout: 50,
        prefixLengthSize: 1,
        byteOrder: "LE",
        script: "",
      },
      framingPersistence: initialData?.framingPersistence || "TRANSIENT",
      createdAt: initialData?.createdAt || Date.now(),
      updatedAt: Date.now(),
    },
  });

  const {
    fields: parameterFields,
    append: appendParam,
    remove: removeParam,
  } = useFieldArray({
    control,
    name: "parameters",
  });

  // Watchers for conditional rendering
  const mode = watch("mode");
  const contextIds = watch("contextIds") || [];
  const scriptingEnabled = watch("scripting.enabled"); // Note: In original, separate booleans for pre/post.
  // The original had "preRequestEnabled" and "postResponseEnabled".
  // SavedCommand schema has a single `scripting` object with `enabled` (boolean) ?
  // Let's check Schema.
  // Actually SavedCommand has `scripting: { enabled: boolean, preRequestScript?: string, postResponseScript?: string }`.
  // But we need to toggle them independently in UI.
  // The schema might need to be adjusted or we manage "enabled" derived from scripts existence?
  // Let's assume we map the UI state to the schema structure on submit.

  // Wait, RHF maps 1:1 to schema.
  // If the UI has separate checkboxes for Pre and Post, we should probably watch them and update the single `scripting` object?
  // Or maybe we treat them as part of the form state even if they aren't in the schema directly?
  // No, best to stick to schema.
  // Let's look at original Logic:
  // "scripting: { enabled: preRequestEnabled || (postResponseEnabled && responseMode === 'SCRIPT'), ... }"
  // So `enabled` is true if EITHER is active.

  // We can use local state for the checkboxes and update the form on submit, OR use watch/setValue.
  // Let's use local state for the UI toggles "preRequestEnabled" and "postResponseEnabled" to match original UX.
  const [preRequestEnabled, setPreRequestEnabled] = useState(
    !!initialData?.scripting?.preRequestScript,
  );
  const [postResponseEnabled, setPostResponseEnabled] = useState(
    !!(
      initialData?.scripting?.postResponseScript ||
      initialData?.validation?.enabled
    ),
  );
  // Also framingEnabled
  const [framingEnabled, setFramingEnabled] = useState(
    !!initialData?.responseFraming,
  );

  const activeContexts = contexts.filter((c) => contextIds.includes(c.id));

  // Initialize context content from selection if empty
  React.useEffect(() => {
    if (activeContexts.length > 0 && !contextTitle && !contextContent) {
      setContextContent(
        activeContexts.map((c) => c.content).join("\n\n---\n\n"),
      );
      setContextTitle(activeContexts.map((c) => c.title).join(", "));
    }
  }, [activeContexts.length]); // dependency on length change

  const onSubmit = (data: SavedCommand) => {
    // Construct the final object based on UI toggles
    const finalData: SavedCommand = {
      ...data,
      scripting: {
        enabled:
          preRequestEnabled ||
          (postResponseEnabled && responseMode === "SCRIPT"),
        preRequestScript: preRequestEnabled
          ? data.scripting?.preRequestScript
          : undefined,
        postResponseScript:
          postResponseEnabled && responseMode === "SCRIPT"
            ? data.scripting?.postResponseScript
            : undefined,
      },
      validation:
        postResponseEnabled && responseMode === "PATTERN"
          ? {
              enabled: true,
              mode: "PATTERN",
              matchType: data.validation?.matchType || "CONTAINS",
              pattern: data.validation?.pattern || "",
              timeout: data.validation?.timeout || 1000,
            }
          : undefined,
      responseFraming: framingEnabled ? data.responseFraming : undefined,
      framingPersistence: framingEnabled
        ? data.framingPersistence
        : undefined,
      updatedAt: Date.now(),
    };

    // Handle Context Side Effect
    if (activeContexts.length === 1 && onUpdateContext) {
      onUpdateContext({
        ...activeContexts[0],
        content: contextContent,
        title: contextTitle,
      });
    }

    onSave(finalData);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-4xl shadow-2xl border-border flex flex-col max-h-[90vh]">
        <CardHeader className="flex flex-row items-center justify-between pb-2 border-b border-border bg-muted/20">
          <CardTitle className="text-lg flex items-center gap-2">
            {initialData?.id ? t("cmd.edit") : t("cmd.new")}
          </CardTitle>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="h-8 w-8 -mr-2"
          >
            <X className="w-4 h-4" />
          </Button>
        </CardHeader>

        <div className="flex items-center px-6 pt-4 gap-4 border-b border-border overflow-x-auto no-scrollbar bg-card/50">
          <TabBar
            tabs={
              [
                { id: "basic", label: t("cmd.tab.basic") },
                {
                  id: "params",
                  label: t("cmd.tab.params"),
                  icon: (
                    <Badge variant="secondary" className="px-1 h-4 text-[9px]">
                      {parameterFields.length}
                    </Badge>
                  ),
                },
                { id: "processing", label: t("cmd.tab.processing") },
                { id: "framing", label: t("cmd.tab.framing") },
                { id: "context", label: t("cmd.tab.context") },
              ] as TabItem[]
            }
            activeTab={activeTab}
            onTabChange={(tabId) => setActiveTab(tabId as typeof activeTab)}
            className="border-b-0"
          />
          <div className="flex-1" />
          <button
            onClick={() => setActiveTab("protocol")}
            type="button"
            className={cn(
              "pb-2 text-sm font-medium transition-colors border-b-2 whitespace-nowrap opacity-70",
              activeTab === "protocol"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground",
            )}
          >
            {t("cmd.tab.wizard")}
          </button>
        </div>

        <form
          onSubmit={handleSubmit(onSubmit)}
          className="flex-1 flex flex-col min-h-0 overflow-hidden"
        >
          <div className="flex-1 flex flex-col min-h-0 overflow-y-auto">
            {activeTab === "basic" && (
              <CardContent className="pt-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>{t("cmd.name")}</Label>
                    <Input
                      {...register("name")}
                      error={!!errors.name}
                      errorMessage={errors.name?.message}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>{t("cmd.group")}</Label>
                    <Input
                      {...register("group")}
                      placeholder="Device Name"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>{t("cmd.format")}</Label>
                    <Controller
                      control={control}
                      name="mode"
                      render={({ field }) => (
                        <SelectDropdown
                          options={
                            [
                              { value: "TEXT", label: "TEXT" },
                              { value: "HEX", label: "HEX" },
                            ] as DropdownOption<DataMode>[]
                          }
                          value={field.value}
                          onChange={field.onChange}
                        />
                      )}
                    />
                  </div>
                  {mode === "TEXT" && (
                    <div className="space-y-2">
                      <Label>Encoding</Label>
                      <Controller
                        control={control}
                        name="encoding"
                        render={({ field }) => (
                          <SelectDropdown
                            options={
                              [
                                { value: "UTF-8", label: "UTF-8" },
                                { value: "ASCII", label: "ASCII" },
                              ] as DropdownOption<TextEncoding>[]
                            }
                            value={field.value}
                            onChange={field.onChange}
                          />
                        )}
                      />
                    </div>
                  )}
                </div>
                <div className="space-y-2">
                  <Label>{t("cmd.payload")}</Label>
                  <Textarea
                    {...register("payload")}
                    className="font-mono text-xs"
                  />
                </div>
              </CardContent>
            )}

            {activeTab === "params" && (
              <CardContent className="pt-6 space-y-4">
                <div className="flex justify-between items-center">
                  <div className="text-sm text-muted-foreground">
                    Define variables to be used in scripting.
                  </div>
                  <Button
                    type="button"
                    size="sm"
                    onClick={() =>
                      appendParam({
                        id: generateId(),
                        name: `param${parameterFields.length + 1}`,
                        type: "STRING",
                        label: "",
                        defaultValue: "",
                        // required default fields based on schema
                        description: "",
                      })
                    }
                    variant="outline"
                    className="h-8 gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add Parameter
                  </Button>
                </div>

                <div className="space-y-3">
                  {parameterFields.length === 0 && (
                    <div className="text-center py-10 text-muted-foreground italic bg-muted/20 rounded-lg">
                      No parameters defined.
                    </div>
                  )}
                  {parameterFields.map((field, idx) => (
                    <div
                      key={field.id}
                      className="p-3 border rounded-lg bg-card grid grid-cols-12 gap-3 items-end animate-in fade-in slide-in-from-bottom-2"
                    >
                      <div className="col-span-3 space-y-1">
                        <Label className="text-[10px]">Var Name</Label>
                        <Input
                          {...register(`parameters.${idx}.name` as const)}
                          className="h-8 text-xs font-mono"
                          placeholder="varName"
                          error={!!errors.parameters?.[idx]?.name}
                        />
                      </div>
                      <div className="col-span-3 space-y-1">
                        <Label className="text-[10px]">Label</Label>
                        <Input
                          {...register(`parameters.${idx}.label` as const)}
                          className="h-8 text-xs"
                          placeholder="Display Label"
                        />
                      </div>
                      <div className="col-span-2 space-y-1">
                        <Label className="text-[10px]">Type</Label>
                        <Controller
                          control={control}
                          name={`parameters.${idx}.type` as const}
                          render={({ field }) => (
                            <SelectDropdown
                              options={
                                [
                                  { value: "STRING", label: "String" },
                                  { value: "INTEGER", label: "Integer" },
                                  { value: "FLOAT", label: "Float" },
                                  { value: "BOOLEAN", label: "Boolean" },
                                ] as DropdownOption<ParameterType>[]
                              }
                              value={field.value}
                              onChange={field.onChange}
                              size="sm"
                            />
                          )}
                        />
                      </div>
                      <div className="col-span-3 space-y-1">
                        <Label className="text-[10px]">Default</Label>
                        <Input
                          {...register(`parameters.${idx}.defaultValue` as const)}
                          className="h-8 text-xs"
                          placeholder="Optional"
                        />
                      </div>
                      <div className="col-span-1">
                        <Button
                          type="button"
                          size="icon"
                          variant="ghost"
                          onClick={() => removeParam(idx)}
                          className="h-8 w-8 text-destructive hover:bg-destructive/10"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            )}

            {activeTab === "processing" && (
              <CardContent className="pt-6 space-y-8 h-full flex flex-col">
                <div className="space-y-3">
                  <Checkbox
                    checked={preRequestEnabled}
                    onChange={(e) => setPreRequestEnabled(e.target.checked)}
                    label="Enable Pre-Request Handling"
                    labelClassName="font-bold text-sm"
                  />
                  {preRequestEnabled && (
                    <div className="pl-6 space-y-2 animate-in slide-in-from-top-1">
                      <Controller
                        control={control}
                        name="scripting.preRequestScript"
                        render={({ field }) => (
                          <CodeEditor
                            value={field.value || ""}
                            onChange={field.onChange}
                            height="120px"
                            className="border-l-4 border-l-blue-500/30"
                          />
                        )}
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
                    onChange={(e) => setPostResponseEnabled(e.target.checked)}
                    label="Enable Post-Response Handling"
                    labelClassName="font-bold text-sm"
                  />

                  {postResponseEnabled && (
                    <div className="pl-6 space-y-4 animate-in slide-in-from-top-1">
                      <div className="grid grid-cols-2 gap-3">
                        <div
                          onClick={() => setResponseMode("PATTERN")}
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
                            <div className="font-bold text-xs">
                              Simple Pattern
                            </div>
                            <div className="text-[9px] text-muted-foreground mt-0.5">
                              Success on string match
                            </div>
                          </div>
                        </div>
                        <div
                          onClick={() => setResponseMode("SCRIPT")}
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
                            <div className="font-bold text-xs">
                              Advanced Script
                            </div>
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
                            <Controller
                              control={control}
                              name="validation.matchType"
                              render={({ field }) => (
                                <SelectDropdown
                                  options={
                                    [
                                      { value: "CONTAINS", label: "Contains" },
                                      { value: "REGEX", label: "Regex" },
                                    ] as DropdownOption<MatchType>[]
                                  }
                                  value={field.value}
                                  onChange={field.onChange}
                                  size="sm"
                                />
                              )}
                            />
                          </div>
                          <div className="col-span-2 space-y-1">
                            <Label className="text-[10px]">Pattern</Label>
                            <Input
                              className="h-8 text-xs font-mono"
                              {...register("validation.pattern")}
                              placeholder="OK"
                            />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-[10px]">Timeout (ms)</Label>
                            <Input
                              type="number"
                              className="h-8 text-xs"
                              {...register("validation.timeout", {
                                valueAsNumber: true,
                              })}
                            />
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-2 animate-in fade-in">
                          <Controller
                            control={control}
                            name="scripting.postResponseScript"
                            render={({ field }) => (
                              <CodeEditor
                                value={field.value || ""}
                                onChange={field.onChange}
                                height="150px"
                                className="border-l-4 border-l-emerald-500/30"
                              />
                            )}
                          />
                          <p className="text-[10px] text-muted-foreground italic">
                            Validate and extract data. Variables:{" "}
                            <code>data</code>, <code>raw</code>,{" "}
                            <code>setVar</code>, <code>log</code>.
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </CardContent>
            )}

            {activeTab === "framing" && (
              <CardContent className="pt-6 space-y-6">
                <div className="p-3 bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800 rounded-md flex gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-500 shrink-0 mt-0.5" />
                  <div className="text-xs text-amber-800 dark:text-amber-300">
                    <strong>Note:</strong> Framing overrides allow this specific
                    command to parse incoming data differently (e.g., waiting
                    for a specific delimiter).
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <Checkbox
                    checked={framingEnabled}
                    onChange={(e) => setFramingEnabled(e.target.checked)}
                    label="Override Global Framing"
                    labelClassName="font-bold"
                  />
                  {framingEnabled && (
                    <Controller
                      control={control}
                      name="framingPersistence"
                      render={({ field }) => (
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
                          value={field.value}
                          onChange={field.onChange}
                          size="sm"
                          className="w-45"
                        />
                      )}
                    />
                  )}
                </div>

                {framingEnabled && (
                  <div className="pl-6 space-y-4 animate-in slide-in-from-top-2 border-l-2 border-border ml-2">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <Label className="text-xs">Strategy</Label>
                        <Controller
                          control={control}
                          name="responseFraming.strategy"
                          render={({ field }) => (
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
                              value={field.value}
                              onChange={(newStrategy) => {
                                field.onChange(newStrategy);
                                // Default script insertion logic if needed
                                // We can do this via setValue if current script is empty
                                // But keeping it simple for now or using a useEffect
                              }}
                            />
                          )}
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Timeout (ms)</Label>
                        <Input
                          type="number"
                          {...register("responseFraming.timeout", {
                            valueAsNumber: true,
                          })}
                          className="h-9 text-sm"
                        />
                      </div>
                    </div>

                    {watch("responseFraming.strategy") === "DELIMITER" && (
                      <div className="space-y-1">
                        <Label className="text-xs">Delimiter (Hex/Text)</Label>
                        <Input
                          {...register("responseFraming.delimiter")}
                          placeholder="e.g. \n or 0D 0A"
                          className="h-9 text-sm font-mono"
                        />
                      </div>
                    )}

                    {watch("responseFraming.strategy") === "PREFIX_LENGTH" && (
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <Label className="text-xs">Header Size (Bytes)</Label>
                          <Input
                            type="number"
                            min={1}
                            max={8}
                            {...register("responseFraming.prefixLengthSize", {
                              valueAsNumber: true,
                            })}
                            className="h-9 text-sm"
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">Byte Order</Label>
                          <Controller
                            control={control}
                            name="responseFraming.byteOrder"
                            render={({ field }) => (
                              <SelectDropdown
                                options={
                                  [
                                    { value: "LE", label: "Little Endian" },
                                    { value: "BE", label: "Big Endian" },
                                  ] as DropdownOption<"LE" | "BE">[]
                                }
                                value={field.value}
                                onChange={field.onChange}
                              />
                            )}
                          />
                        </div>
                      </div>
                    )}

                    {watch("responseFraming.strategy") === "SCRIPT" && (
                      <div className="space-y-1">
                        <Label className="text-xs">Framer Script</Label>
                        <Controller
                          control={control}
                          name="responseFraming.script"
                          render={({ field }) => (
                            <CodeEditor
                              value={field.value || ""}
                              onChange={field.onChange}
                              height="150px"
                              className="border-l-4 border-l-purple-500/30"
                            />
                          )}
                        />
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            )}

            {activeTab === "context" && (
              <CardContent className="pt-6 space-y-4 h-full flex flex-col">
                <div className="flex items-end gap-2">
                  <div className="space-y-1 flex-1">
                    <Label>Context ID / Link</Label>
                    <div className="space-y-2">
                      {contexts.map((context) => (
                        <Checkbox
                          key={context.id}
                          checked={contextIds.includes(context.id)}
                          onChange={(e) => {
                            const current = (watch("contextIds") || []) as string[];
                            if (e.target.checked) {
                              setValue("contextIds", [...current, context.id]);
                            } else {
                              setValue(
                                "contextIds",
                                current.filter((id) => id !== context.id),
                              );
                            }
                          }}
                          label={context.title}
                        />
                      ))}
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => {
                      if (contextTitle && contextContent) {
                        if (
                          contextIds.length === 1 &&
                          activeContexts.length === 1
                        ) {
                          if (onUpdateContext)
                            onUpdateContext({
                              ...activeContexts[0],
                              title: contextTitle,
                              content: contextContent,
                            });
                        } else {
                          const newCtx = {
                            id: generateId(),
                            title: contextTitle,
                            content: contextContent,
                            source: "USER" as const,
                            createdAt: Date.now(),
                          };
                          onCreateContext(newCtx);
                          setValue("contextIds", [...contextIds, newCtx.id]);
                        }
                      }
                    }}
                  >
                    Save Context
                  </Button>
                </div>

                <div className="space-y-1">
                  <Label>Context Title</Label>
                  <Input
                    value={contextTitle}
                    onChange={(e) => setContextTitle(e.target.value)}
                    placeholder="Protocol Manual Section 1..."
                  />
                </div>

                <div className="space-y-1 flex-1 flex flex-col">
                  <Label>Content (Markdown/Text)</Label>
                  <Textarea
                    value={contextContent}
                    onChange={(e) => setContextContent(e.target.value)}
                    className="flex-1 resize-none font-mono text-xs"
                    placeholder="Paste documentation or protocol details here..."
                  />
                </div>
              </CardContent>
            )}

            {activeTab === "protocol" && (
              <CardContent className="pt-6 space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div
                    onClick={() => setProtoType("MODBUS")}
                    className={cn(
                      "p-4 border rounded-xl flex flex-col items-center gap-2 cursor-pointer transition-all hover:bg-muted/30",
                      protoType === "MODBUS"
                        ? "bg-primary/5 border-primary shadow-sm"
                        : "bg-card",
                    )}
                  >
                    <Calculator className="w-6 h-6 text-blue-500" />
                    <span className="font-bold text-sm">
                      Modbus RTU Generator
                    </span>
                  </div>
                  <div
                    onClick={() => setProtoType("AT")}
                    className={cn(
                      "p-4 border rounded-xl flex flex-col items-center gap-2 cursor-pointer transition-all hover:bg-muted/30",
                      protoType === "AT"
                        ? "bg-primary/5 border-primary shadow-sm"
                        : "bg-card",
                    )}
                  >
                    <Terminal className="w-6 h-6 text-emerald-500" />
                    <span className="font-bold text-sm">
                      AT Command Library
                    </span>
                  </div>
                </div>

                {protoType === "MODBUS" && (
                  <div className="space-y-4 p-4 border rounded-lg bg-muted/10 animate-in fade-in">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <Label className="text-xs">Slave ID</Label>
                        <Input
                          type="number"
                          value={mbParams.slaveId}
                          onChange={(e) =>
                            setMbParams({
                              ...mbParams,
                              slaveId: parseInt(e.target.value),
                            })
                          }
                          className="h-8"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Function</Label>
                        <SelectDropdown
                          options={MODBUS_FUNCTIONS.map(
                            (f): DropdownOption<number> => ({
                              value: f.code,
                              label: f.name,
                            }),
                          )}
                          value={mbParams.functionCode}
                          onChange={(value) =>
                            setMbParams({
                              ...mbParams,
                              functionCode: value,
                            })
                          }
                          size="sm"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Start Address</Label>
                        <Input
                          type="number"
                          value={mbParams.startAddress}
                          onChange={(e) =>
                            setMbParams({
                              ...mbParams,
                              startAddress: parseInt(e.target.value),
                            })
                          }
                          className="h-8"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Quantity/Value</Label>
                        <Input
                          type="number"
                          value={mbParams.quantityOrValue}
                          onChange={(e) =>
                            setMbParams({
                              ...mbParams,
                              quantityOrValue: parseInt(e.target.value),
                            })
                          }
                          className="h-8"
                        />
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <code className="flex-1 bg-background border p-2 rounded text-xs font-mono">
                        {generateModbusFrame(mbParams)}
                      </code>
                      <Button
                        size="sm"
                        type="button"
                        onClick={() => {
                          setValue("mode", "HEX");
                          setValue("payload", generateModbusFrame(mbParams));
                          setActiveTab("basic");
                        }}
                      >
                        Use Payload
                      </Button>
                    </div>
                  </div>
                )}

                {protoType === "AT" && (
                  <div className="space-y-4 p-4 border rounded-lg bg-muted/10 animate-in fade-in">
                    <div className="space-y-2">
                      <Label>Common AT Commands</Label>
                      <div className="h-50 overflow-y-auto border rounded bg-background p-2 space-y-1">
                        {Object.entries(AT_COMMAND_LIBRARY).map(
                          ([cat, cmds]) => (
                            <div key={cat} className="mb-2">
                              <div className="text-[10px] font-bold text-muted-foreground uppercase mb-1 sticky top-0 bg-background">
                                {cat}
                              </div>
                              {cmds.map((c) => (
                                <div
                                  key={c.cmd}
                                  className="flex justify-between items-center p-1.5 hover:bg-muted rounded cursor-pointer group"
                                  onClick={() => {
                                    setValue("mode", "TEXT");
                                    setValue("payload", c.cmd);
                                    setValue("description", c.desc);
                                    setActiveTab("basic");
                                  }}
                                >
                                  <code className="text-xs font-bold text-primary">
                                    {c.cmd}
                                  </code>
                                  <span className="text-[10px] text-muted-foreground">
                                    {c.desc}
                                  </span>
                                </div>
                              ))}
                            </div>
                          ),
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            )}
          </div>
          <CardFooter className="flex justify-end bg-muted/20 border-t border-border p-4 gap-2">
            <Button type="button" variant="ghost" onClick={onClose}>
              {t("modal.cancel")}
            </Button>
            <Button type="submit">
              <Check className="w-4 h-4 mr-2" /> {t("modal.save")}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
};

export default CommandFormModal;
