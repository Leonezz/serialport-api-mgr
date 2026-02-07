import React, { useState, useMemo } from "react";
import { createPortal } from "react-dom";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  SavedCommand,
  DataMode,
  TextEncoding,
  MatchType,
  SerialSequence,
  ProjectContext,
  CommandParameter,
  FramingConfig,
} from "../types";
import { useStore } from "../lib/store";
import { X, Check, Layers } from "lucide-react";
import {
  Badge,
  Button,
  Card,
  CardFooter,
  CardHeader,
  CardTitle,
  TabBar,
  type TabItem,
} from "./ui";
import { cn, generateId } from "../lib/utils";
import {
  DataModeSchema,
  TextEncodingSchema,
  MatchTypeSchema,
  CommandParameterSchema,
  FramingConfigSchema,
} from "../lib/schemas";
import type { ModbusParams } from "../services/protocolUtils";
import { useTranslation } from "react-i18next";
import BasicTab from "./CommandForm/BasicTab";
import ParametersTab from "./CommandForm/ParametersTab";
import ProcessingTab from "./CommandForm/ProcessingTab";
import FramingTab from "./CommandForm/FramingTab";
import ContextTab from "./CommandForm/ContextTab";
import ProtocolTab from "./CommandForm/ProtocolTab";

const CommandFormSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  payload: z.string().default(""),
  group: z.string().optional(),
  mode: DataModeSchema.default("TEXT"),
  encoding: TextEncodingSchema.default("UTF-8"),
  parameters: z.array(CommandParameterSchema).default([]),
  deviceId: z.string().optional(),
  source: z.enum(["CUSTOM", "PROTOCOL"]).default("CUSTOM"),
  protocolId: z.string().optional(),
  templateId: z.string().optional(),
  parameterValues: z.record(z.string(), z.unknown()).default({}),
  contextIds: z.array(z.string()).default([]),
  contextContent: z.string().default(""),
  contextTitle: z.string().default(""),
  preRequestEnabled: z.boolean().default(false),
  preRequestScript: z.string().default('// return payload + "\\r\\n";'),
  postResponseEnabled: z.boolean().default(false),
  responseMode: z.enum(["PATTERN", "SCRIPT"]).default("PATTERN"),
  matchType: MatchTypeSchema.default("CONTAINS"),
  pattern: z.string().default(""),
  timeout: z.number().default(1000),
  postResponseScript: z
    .string()
    .default('// if (data.includes("OK")) return true;'),
  framingEnabled: z.boolean().default(false),
  framingConfig: FramingConfigSchema.default({
    strategy: "NONE",
    delimiter: "",
    timeout: 50,
    prefixLengthSize: 1,
    byteOrder: "LE",
    script: "",
  }),
  framingPersistence: z.enum(["TRANSIENT", "PERSISTENT"]).default("TRANSIENT"),
});

type CommandFormData = z.infer<typeof CommandFormSchema>;

interface Props {
  initialData?: Partial<SavedCommand>;
  sequences: SerialSequence[];
  contexts: ProjectContext[];
  onSave: (command: Omit<SavedCommand, "id">) => void;
  onUpdateContext?: (context: ProjectContext) => void;
  onCreateContext: (context: ProjectContext) => void;
  onClose: () => void;
}

const CommandFormModal: React.FC<Props> = ({
  initialData,
  contexts,
  onSave,
  onUpdateContext,
  onCreateContext,
  onClose,
}) => {
  const { t } = useTranslation();
  const { devices, protocols } = useStore();

  const [activeTab, setActiveTab] = useState<
    "basic" | "params" | "protocol" | "processing" | "framing" | "context"
  >("basic");

  // Compute initial context values
  const initialContextIds = initialData?.contextIds || [];
  const initialActiveContexts = contexts.filter((c) =>
    initialContextIds.includes(c.id),
  );

  const { watch, setValue, getValues, control } = useForm<CommandFormData>({
    resolver: zodResolver(CommandFormSchema),
    defaultValues: {
      name: initialData?.name || "",
      description: initialData?.description || "",
      payload: initialData?.payload || "",
      group: initialData?.group || "",
      mode: initialData?.mode || "TEXT",
      encoding: initialData?.encoding || "UTF-8",
      parameters: initialData?.parameters || [],
      deviceId: initialData?.deviceId || "",
      source: initialData?.source || "CUSTOM",
      protocolId: initialData?.protocolLayer?.protocolId || "",
      templateId: initialData?.protocolLayer?.protocolCommandId || "",
      parameterValues: initialData?.commandLayer?.parameterEnhancements
        ? Object.entries(initialData.commandLayer.parameterEnhancements).reduce(
            (acc, [paramName, enhancement]) => ({
              ...acc,
              [paramName]: enhancement.customDefault,
            }),
            {},
          )
        : {},
      contextIds: initialContextIds,
      contextContent:
        initialActiveContexts.length > 0
          ? initialActiveContexts.map((c) => c.content).join("\n\n---\n\n")
          : "",
      contextTitle:
        initialActiveContexts.length > 0
          ? initialActiveContexts.map((c) => c.title).join(", ")
          : "",
      preRequestEnabled: !!initialData?.scripting?.preRequestScript,
      preRequestScript:
        initialData?.scripting?.preRequestScript ||
        '// return payload + "\\r\\n";',
      postResponseEnabled: !!(
        initialData?.scripting?.postResponseScript ||
        initialData?.validation?.enabled
      ),
      responseMode: initialData?.scripting?.postResponseScript
        ? "SCRIPT"
        : "PATTERN",
      matchType: initialData?.validation?.matchType || "CONTAINS",
      pattern: initialData?.validation?.pattern || "",
      timeout: initialData?.validation?.timeout || 1000,
      postResponseScript:
        initialData?.scripting?.postResponseScript ||
        '// if (data.includes("OK")) return true;',
      framingEnabled: !!initialData?.responseFraming,
      framingConfig: initialData?.responseFraming || {
        strategy: "NONE",
        delimiter: "",
        timeout: 50,
        prefixLengthSize: 1,
        byteOrder: "LE",
        script: "",
      },
      framingPersistence: initialData?.framingPersistence || "TRANSIENT",
    },
  });

  const {
    fields: parameters,
    append: appendParameter,
    remove: removeParameterAt,
  } = useFieldArray({
    control,
    name: "parameters",
  });

  // Watch all form fields for rendering
  const name = watch("name");
  const description = watch("description");
  const payload = watch("payload");
  const group = watch("group");
  const mode = watch("mode");
  const encoding = watch("encoding");
  const deviceId = watch("deviceId");
  const protocolId = watch("protocolId");
  const source = watch("source");
  const templateId = watch("templateId");
  const parameterValues = watch("parameterValues");
  const contextIds = watch("contextIds");
  const contextContent = watch("contextContent");
  const contextTitle = watch("contextTitle");
  const preRequestEnabled = watch("preRequestEnabled");
  const preRequestScript = watch("preRequestScript");
  const postResponseEnabled = watch("postResponseEnabled");
  const responseMode = watch("responseMode");
  const matchType = watch("matchType");
  const pattern = watch("pattern");
  const timeout = watch("timeout");
  const postResponseScript = watch("postResponseScript");
  const framingEnabled = watch("framingEnabled");
  const framingConfig = watch("framingConfig");
  const framingPersistence = watch("framingPersistence");

  // Protocol wizard state (UI-only, not part of form data)
  const [protoType, setProtoType] = useState<"MODBUS" | "AT">("MODBUS");
  const [mbParams, setMbParams] = useState<ModbusParams>({
    slaveId: 1,
    functionCode: 3,
    startAddress: 0,
    quantityOrValue: 1,
  });

  // Get protocols available for the selected device
  const availableProtocols = useMemo(() => {
    if (!deviceId) return protocols;
    const device = devices.find((d) => d.id === deviceId);
    if (!device || !device.protocols?.length) return protocols;
    const linkedProtocolIds = device.protocols.map((p) => p.protocolId);
    return protocols.filter((p) => linkedProtocolIds.includes(p.id));
  }, [deviceId, devices, protocols]);

  // Get templates available for the selected protocol
  const availableTemplates = useMemo(() => {
    if (!protocolId) return [];
    const protocol = protocols.find((p) => p.id === protocolId);
    if (!protocol) {
      console.warn(
        `Protocol "${protocolId}" not found when loading command templates`,
      );
      return [];
    }
    return protocol.commands.filter((tmpl) => tmpl.type === "SIMPLE");
  }, [protocolId, protocols]);

  const selectedTemplate = availableTemplates.find(
    (tmpl) => tmpl.id === templateId,
  );

  const activeContexts = contexts.filter((c) => contextIds.includes(c.id));

  // ---- Handlers ----

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (activeContexts.length === 1 && onUpdateContext)
      onUpdateContext({
        ...activeContexts[0],
        content: contextContent,
        title: contextTitle,
      });

    const now = Date.now();

    let commandData: Omit<SavedCommand, "id">;

    if (source === "PROTOCOL") {
      if (!protocolId || !templateId) {
        alert("Please select both a protocol and a command template");
        return;
      }

      if (!selectedTemplate) {
        alert("Selected template not found");
        return;
      }

      const missingParams = selectedTemplate.parameters?.filter(
        (p) => p.required && !parameterValues[p.name],
      );
      if (missingParams && missingParams.length > 0) {
        alert(
          `Missing required parameters: ${missingParams.map((p) => p.name).join(", ")}`,
        );
        return;
      }

      commandData = {
        name,
        description,
        group: group?.trim() || undefined,
        deviceId: deviceId || undefined,
        source: "PROTOCOL",
        protocolLayer: {
          protocolId,
          protocolCommandId: templateId,
          protocolVersion: "1.0",
          protocolCommandUpdatedAt: now,
          payload: selectedTemplate.payload,
          mode: selectedTemplate.mode,
          encoding: selectedTemplate.encoding,
          parameters: selectedTemplate.parameters,
          validation: selectedTemplate.validation,
        },
        commandLayer: {
          group: group?.trim() || undefined,
          parameterEnhancements: Object.entries(parameterValues).reduce(
            (acc, [paramName, value]) => ({
              ...acc,
              [paramName]: { customDefault: value },
            }),
            {},
          ),
        },
        createdAt: initialData?.createdAt || now,
        updatedAt: now,
        contextIds,
      };
    } else {
      commandData = {
        name,
        description,
        payload,
        group: group?.trim() || undefined,
        mode,
        encoding: mode === "TEXT" ? encoding : undefined,
        parameters: getValues("parameters"),
        deviceId: deviceId || undefined,
        source: "CUSTOM",
        validation:
          postResponseEnabled && responseMode === "PATTERN"
            ? {
                enabled: true,
                mode: "PATTERN" as const,
                matchType,
                pattern,
                timeout,
              }
            : undefined,
        scripting: {
          enabled:
            preRequestEnabled ||
            (postResponseEnabled && responseMode === "SCRIPT"),
          preRequestScript: preRequestEnabled ? preRequestScript : undefined,
          postResponseScript:
            postResponseEnabled && responseMode === "SCRIPT"
              ? postResponseScript
              : undefined,
        },
        responseFraming: framingEnabled ? framingConfig : undefined,
        framingPersistence: framingEnabled ? framingPersistence : undefined,
        createdAt: initialData?.createdAt || now,
        updatedAt: now,
        contextIds,
      };
    }

    onSave(commandData);
    onClose();
  };

  const addParameter = () => {
    appendParameter({
      id: generateId(),
      name: `param${parameters.length + 1}`,
      type: "STRING",
      label: "",
      defaultValue: "",
    });
  };

  const updateParameter = (idx: number, updates: Partial<CommandParameter>) => {
    const currentParams = getValues("parameters");
    setValue(`parameters.${idx}`, { ...currentParams[idx], ...updates });
  };

  const removeParameter = (idx: number) => {
    removeParameterAt(idx);
  };

  const handleUsePayload = (
    newMode: DataMode,
    newPayload: string,
    newDescription?: string,
  ) => {
    setValue("mode", newMode);
    setValue("payload", newPayload);
    if (newDescription) setValue("description", newDescription);
    setActiveTab("basic");
  };

  // ---- Render ----

  return createPortal(
    <div
      className="fixed inset-0 bg-background/80 backdrop-blur-sm z-60 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <Card
        className="w-full max-w-4xl shadow-2xl border-border flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        <CardHeader className="flex flex-row items-center justify-between pb-2 border-b border-border bg-muted/20">
          <CardTitle className="text-lg flex items-center gap-2">
            {initialData?.id ? t("cmd.edit") : t("cmd.new")}
            {source === "PROTOCOL" && (
              <Badge variant="secondary" className="gap-1 text-[10px]">
                <Layers className="w-3 h-3" />
                Template
              </Badge>
            )}
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
                      {parameters.length}
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
          onSubmit={handleFormSubmit}
          className="flex-1 flex flex-col min-h-0 overflow-hidden"
        >
          <div className="flex-1 flex flex-col min-h-0 overflow-y-auto">
            {activeTab === "basic" && (
              <BasicTab
                name={name}
                onNameChange={(v) => setValue("name", v)}
                group={group}
                onGroupChange={(v) => setValue("group", v)}
                deviceId={deviceId}
                onDeviceIdChange={(v) => setValue("deviceId", v)}
                protocolId={protocolId}
                onProtocolIdChange={(v) => setValue("protocolId", v)}
                devices={devices}
                availableProtocols={availableProtocols}
                source={source}
                onSourceChange={(v) => setValue("source", v)}
                templateId={templateId}
                onTemplateIdChange={(v) => setValue("templateId", v)}
                availableTemplates={availableTemplates}
                selectedTemplate={selectedTemplate}
                parameterValues={parameterValues}
                onParameterValuesChange={(v) => {
                  const newValue =
                    typeof v === "function" ? v(parameterValues) : v;
                  setValue("parameterValues", newValue);
                }}
                protocols={protocols}
                mode={mode}
                onModeChange={(v) => setValue("mode", v)}
                encoding={encoding}
                onEncodingChange={(v) => setValue("encoding", v)}
                payload={payload}
                onPayloadChange={(v) => setValue("payload", v)}
                t={t}
              />
            )}

            {activeTab === "params" && (
              <ParametersTab
                parameters={parameters}
                onAdd={addParameter}
                onUpdate={updateParameter}
                onRemove={removeParameter}
              />
            )}

            {activeTab === "processing" && (
              <ProcessingTab
                preRequestEnabled={preRequestEnabled}
                onPreRequestEnabledChange={(v) =>
                  setValue("preRequestEnabled", v)
                }
                preRequestScript={preRequestScript}
                onPreRequestScriptChange={(v) =>
                  setValue("preRequestScript", v)
                }
                postResponseEnabled={postResponseEnabled}
                onPostResponseEnabledChange={(v) =>
                  setValue("postResponseEnabled", v)
                }
                responseMode={responseMode}
                onResponseModeChange={(v) => setValue("responseMode", v)}
                matchType={matchType}
                onMatchTypeChange={(v) => setValue("matchType", v)}
                pattern={pattern}
                onPatternChange={(v) => setValue("pattern", v)}
                timeout={timeout}
                onTimeoutChange={(v) => setValue("timeout", v)}
                postResponseScript={postResponseScript}
                onPostResponseScriptChange={(v) =>
                  setValue("postResponseScript", v)
                }
              />
            )}

            {activeTab === "framing" && (
              <FramingTab
                framingEnabled={framingEnabled}
                onFramingEnabledChange={(v) => setValue("framingEnabled", v)}
                framingConfig={framingConfig}
                onFramingConfigChange={(v) => setValue("framingConfig", v)}
                framingPersistence={framingPersistence}
                onFramingPersistenceChange={(v) =>
                  setValue("framingPersistence", v)
                }
              />
            )}

            {activeTab === "context" && (
              <ContextTab
                contexts={contexts}
                contextIds={contextIds}
                onContextIdsChange={(v) => setValue("contextIds", v)}
                contextTitle={contextTitle}
                onContextTitleChange={(v) => setValue("contextTitle", v)}
                contextContent={contextContent}
                onContextContentChange={(v) => setValue("contextContent", v)}
                onUpdateContext={onUpdateContext}
                onCreateContext={onCreateContext}
              />
            )}

            {activeTab === "protocol" && (
              <ProtocolTab
                protoType={protoType}
                onProtoTypeChange={setProtoType}
                mbParams={mbParams}
                onMbParamsChange={setMbParams}
                onUsePayload={handleUsePayload}
              />
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
    </div>,
    document.body,
  );
};

export default CommandFormModal;
