import React, { useState, useMemo } from "react";
import { createPortal } from "react-dom";
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
import type { ModbusParams } from "../services/protocolUtils";
import { useTranslation } from "react-i18next";
import BasicTab from "./CommandForm/BasicTab";
import ParametersTab from "./CommandForm/ParametersTab";
import ProcessingTab from "./CommandForm/ProcessingTab";
import FramingTab from "./CommandForm/FramingTab";
import ContextTab from "./CommandForm/ContextTab";
import ProtocolTab from "./CommandForm/ProtocolTab";

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

  const [name, setName] = useState(initialData?.name || "");
  const [description, setDescription] = useState(
    initialData?.description || "",
  );
  const [payload, setPayload] = useState(initialData?.payload || "");
  const [group, setGroup] = useState(initialData?.group || "");
  const [mode, setMode] = useState<DataMode>(initialData?.mode || "TEXT");
  const [encoding, setEncoding] = useState<TextEncoding>(
    initialData?.encoding || "UTF-8",
  );
  const [parameters, setParameters] = useState<CommandParameter[]>(
    initialData?.parameters || [],
  );

  // Device and Protocol selection
  const [deviceId, setDeviceId] = useState<string>(initialData?.deviceId || "");
  const [protocolId, setProtocolId] = useState<string>(
    initialData?.protocolLayer?.protocolId || "",
  );

  // Command source: CUSTOM (user-created) or PROTOCOL (from template)
  const [source, setSource] = useState<"CUSTOM" | "PROTOCOL">(
    initialData?.source || "CUSTOM",
  );
  const [templateId, setTemplateId] = useState<string>(
    initialData?.protocolLayer?.protocolCommandId || "",
  );
  const [parameterValues, setParameterValues] = useState<
    Record<string, unknown>
  >(
    initialData?.commandLayer?.parameterEnhancements
      ? Object.entries(initialData.commandLayer.parameterEnhancements).reduce(
          (acc, [paramName, enhancement]) => ({
            ...acc,
            [paramName]: enhancement.customDefault,
          }),
          {},
        )
      : {},
  );

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

  const [contextIds, setContextIds] = useState<string[]>(
    initialData?.contextIds || [],
  );
  const activeContexts = contexts.filter((c) => contextIds.includes(c.id));
  const [contextContent, setContextContent] = useState(
    activeContexts.length > 0
      ? activeContexts.map((c) => c.content).join("\n\n---\n\n")
      : "",
  );
  const [contextTitle, setContextTitle] = useState(
    activeContexts.length > 0
      ? activeContexts.map((c) => c.title).join(", ")
      : "",
  );

  // Unified Processing State
  const [preRequestEnabled, setPreRequestEnabled] = useState(
    !!initialData?.scripting?.preRequestScript,
  );
  const [preRequestScript, setPreRequestScript] = useState(
    initialData?.scripting?.preRequestScript || '// return payload + "\\r\\n";',
  );

  const [postResponseEnabled, setPostResponseEnabled] = useState(
    !!(
      initialData?.scripting?.postResponseScript ||
      initialData?.validation?.enabled
    ),
  );
  const [responseMode, setResponseMode] = useState<"PATTERN" | "SCRIPT">(
    initialData?.scripting?.postResponseScript ? "SCRIPT" : "PATTERN",
  );

  const [matchType, setMatchType] = useState<MatchType>(
    initialData?.validation?.matchType || "CONTAINS",
  );
  const [pattern, setPattern] = useState(
    initialData?.validation?.pattern || "",
  );
  const [timeout, setTimeoutVal] = useState(
    initialData?.validation?.timeout || 1000,
  );
  const [postResponseScript, setPostResponseScript] = useState(
    initialData?.scripting?.postResponseScript ||
      '// if (data.includes("OK")) return true;',
  );

  const [framingEnabled, setFramingEnabled] = useState(
    !!initialData?.responseFraming,
  );
  const [framingConfig, setFramingConfig] = useState<FramingConfig>(
    initialData?.responseFraming || {
      strategy: "NONE",
      delimiter: "",
      timeout: 50,
      prefixLengthSize: 1,
      byteOrder: "LE",
      script: "",
    },
  );
  const [framingPersistence, setFramingPersistence] = useState<
    "TRANSIENT" | "PERSISTENT"
  >(initialData?.framingPersistence || "TRANSIENT");

  const [protoType, setProtoType] = useState<"MODBUS" | "AT">("MODBUS");
  const [mbParams, setMbParams] = useState<ModbusParams>({
    slaveId: 1,
    functionCode: 3,
    startAddress: 0,
    quantityOrValue: 1,
  });

  // ---- Handlers ----

  const handleSubmit = (e: React.FormEvent) => {
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
        group: group.trim() || undefined,
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
          group: group.trim() || undefined,
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
        group: group.trim() || undefined,
        mode,
        encoding: mode === "TEXT" ? encoding : undefined,
        parameters,
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
    setParameters([
      ...parameters,
      {
        id: generateId(),
        name: `param${parameters.length + 1}`,
        type: "STRING",
        label: "",
        defaultValue: "",
      },
    ]);
  };

  const updateParameter = (idx: number, updates: Partial<CommandParameter>) => {
    const newParams = [...parameters];
    newParams[idx] = { ...newParams[idx], ...updates };
    setParameters(newParams);
  };

  const removeParameter = (idx: number) => {
    const newParams = [...parameters];
    newParams.splice(idx, 1);
    setParameters(newParams);
  };

  const handleUsePayload = (
    newMode: DataMode,
    newPayload: string,
    newDescription?: string,
  ) => {
    setMode(newMode);
    setPayload(newPayload);
    if (newDescription) setDescription(newDescription);
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
          onSubmit={handleSubmit}
          className="flex-1 flex flex-col min-h-0 overflow-hidden"
        >
          <div className="flex-1 flex flex-col min-h-0 overflow-y-auto">
            {activeTab === "basic" && (
              <BasicTab
                name={name}
                onNameChange={setName}
                group={group}
                onGroupChange={setGroup}
                deviceId={deviceId}
                onDeviceIdChange={setDeviceId}
                protocolId={protocolId}
                onProtocolIdChange={setProtocolId}
                devices={devices}
                availableProtocols={availableProtocols}
                source={source}
                onSourceChange={setSource}
                templateId={templateId}
                onTemplateIdChange={setTemplateId}
                availableTemplates={availableTemplates}
                selectedTemplate={selectedTemplate}
                parameterValues={parameterValues}
                onParameterValuesChange={setParameterValues}
                protocols={protocols}
                mode={mode}
                onModeChange={setMode}
                encoding={encoding}
                onEncodingChange={setEncoding}
                payload={payload}
                onPayloadChange={setPayload}
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
                onPreRequestEnabledChange={setPreRequestEnabled}
                preRequestScript={preRequestScript}
                onPreRequestScriptChange={setPreRequestScript}
                postResponseEnabled={postResponseEnabled}
                onPostResponseEnabledChange={setPostResponseEnabled}
                responseMode={responseMode}
                onResponseModeChange={setResponseMode}
                matchType={matchType}
                onMatchTypeChange={setMatchType}
                pattern={pattern}
                onPatternChange={setPattern}
                timeout={timeout}
                onTimeoutChange={setTimeoutVal}
                postResponseScript={postResponseScript}
                onPostResponseScriptChange={setPostResponseScript}
              />
            )}

            {activeTab === "framing" && (
              <FramingTab
                framingEnabled={framingEnabled}
                onFramingEnabledChange={setFramingEnabled}
                framingConfig={framingConfig}
                onFramingConfigChange={setFramingConfig}
                framingPersistence={framingPersistence}
                onFramingPersistenceChange={setFramingPersistence}
              />
            )}

            {activeTab === "context" && (
              <ContextTab
                contexts={contexts}
                contextIds={contextIds}
                onContextIdsChange={setContextIds}
                contextTitle={contextTitle}
                onContextTitleChange={setContextTitle}
                contextContent={contextContent}
                onContextContentChange={setContextContent}
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
