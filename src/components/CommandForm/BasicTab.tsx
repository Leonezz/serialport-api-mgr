import React from "react";
import { Link } from "react-router-dom";
import {
  Check,
  AlertTriangle,
  Layers,
  FileCode,
  Cpu,
  ExternalLink,
  Info,
} from "lucide-react";
import {
  Badge,
  Button,
  CardContent,
  Checkbox,
  Input,
  Label,
  SelectDropdown,
  Textarea,
  type DropdownOption,
} from "../ui";
import { cn } from "../../lib/utils";
import { substituteParameters } from "../../lib/builders/commandBuilder";
import type { DataMode, TextEncoding } from "../../types";
import type {
  Protocol,
  SimpleCommand,
  SimpleParameter,
} from "../../lib/protocolTypes";
import type { Device } from "../../types";

interface BasicTabProps {
  // Name & Group
  name: string;
  onNameChange: (name: string) => void;
  group: string;
  onGroupChange: (group: string) => void;
  // Device & Protocol
  deviceId: string;
  onDeviceIdChange: (id: string) => void;
  protocolId: string;
  onProtocolIdChange: (id: string) => void;
  devices: Device[];
  availableProtocols: Protocol[];

  // Command source
  source: "CUSTOM" | "PROTOCOL";
  onSourceChange: (source: "CUSTOM" | "PROTOCOL") => void;
  templateId: string;
  onTemplateIdChange: (id: string) => void;
  availableTemplates: SimpleCommand[];
  selectedTemplate: SimpleCommand | undefined;
  parameterValues: Record<string, unknown>;
  onParameterValuesChange: React.Dispatch<
    React.SetStateAction<Record<string, unknown>>
  >;
  protocols: Protocol[];

  // Custom command fields
  mode: DataMode;
  onModeChange: (mode: DataMode) => void;
  encoding: TextEncoding;
  onEncodingChange: (encoding: TextEncoding) => void;
  payload: string;
  onPayloadChange: (payload: string) => void;

  // i18n
  t: (key: string) => string;
}

const BasicTab: React.FC<BasicTabProps> = ({
  name,
  onNameChange,
  group,
  onGroupChange,
  deviceId,
  onDeviceIdChange,
  protocolId,
  onProtocolIdChange,
  devices,
  availableProtocols,
  source,
  onSourceChange,
  templateId,
  onTemplateIdChange,
  availableTemplates,
  selectedTemplate,
  parameterValues,
  onParameterValuesChange,
  protocols,
  mode,
  onModeChange,
  encoding,
  onEncodingChange,
  payload,
  onPayloadChange,
  t,
}) => {
  return (
    <CardContent className="pt-6 space-y-4">
      {/* Device & Protocol Selection */}
      <div className="p-4 bg-muted/20 rounded-lg border border-border/50 space-y-4">
        <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground uppercase">
          <Layers className="w-3.5 h-3.5" />
          Device & Protocol
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className="flex items-center gap-1.5">
              <Cpu className="w-3.5 h-3.5 text-muted-foreground" />
              Device (Optional)
            </Label>
            <div className="flex items-center gap-2">
              <SelectDropdown
                options={[
                  { value: "", label: "Personal Command" },
                  ...devices.map((d) => ({
                    value: d.id,
                    label: d.name,
                  })),
                ]}
                value={deviceId}
                onChange={(value) => {
                  onDeviceIdChange(value);
                  if (value) {
                    const device = devices.find((d) => d.id === value);
                    const linkedProtocolIds =
                      device?.protocols?.map((p) => p.protocolId) || [];
                    if (protocolId && !linkedProtocolIds.includes(protocolId)) {
                      onProtocolIdChange(device?.defaultProtocolId || "");
                    }
                  }
                }}
                placeholder="Select device..."
              />
              {deviceId && (
                <Link
                  to={`/devices/${deviceId}/edit`}
                  className="shrink-0"
                  title="Edit device"
                >
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-9 w-9"
                  >
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                </Link>
              )}
            </div>
          </div>
          <div className="space-y-2">
            <Label className="flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-muted-foreground" />
              Protocol
            </Label>
            <div className="flex items-center gap-2">
              <SelectDropdown
                options={[
                  { value: "", label: "None" },
                  ...availableProtocols.map((p) => ({
                    value: p.id,
                    label: `${p.name} (v${p.version})`,
                  })),
                ]}
                value={protocolId}
                onChange={onProtocolIdChange}
                placeholder="Select protocol..."
              />
              {protocolId && (
                <Link
                  to={`/protocols/${protocolId}/edit`}
                  className="shrink-0"
                  title="Edit protocol"
                >
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-9 w-9"
                  >
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                </Link>
              )}
            </div>
          </div>
        </div>
        {deviceId && (
          <p className="text-[10px] text-muted-foreground">
            Commands linked to a device appear in that device&apos;s command
            list.
          </p>
        )}
      </div>

      {/* Command Source Selection */}
      <div className="p-4 bg-muted/20 rounded-lg border border-border/50 space-y-4">
        <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground uppercase">
          <FileCode className="w-3.5 h-3.5" />
          Command Source
        </div>
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => {
              onSourceChange("CUSTOM");
              onTemplateIdChange("");
            }}
            className={cn(
              "p-4 border rounded-xl flex flex-col items-center gap-2 cursor-pointer transition-all hover:bg-muted/30",
              source === "CUSTOM"
                ? "bg-primary/5 border-primary shadow-sm"
                : "bg-card border-border/50",
            )}
          >
            <FileCode className="w-5 h-5 text-orange-500" />
            <span className="font-semibold text-sm">Custom Command</span>
            <span className="text-[10px] text-muted-foreground text-center">
              Manually define payload
            </span>
          </button>
          <button
            type="button"
            onClick={() => onSourceChange("PROTOCOL")}
            className={cn(
              "p-4 border rounded-xl flex flex-col items-center gap-2 cursor-pointer transition-all hover:bg-muted/30",
              source === "PROTOCOL"
                ? "bg-primary/5 border-primary shadow-sm"
                : "bg-card border-border/50",
            )}
          >
            <Layers className="w-5 h-5 text-blue-500" />
            <span className="font-semibold text-sm">From Template</span>
            <span className="text-[10px] text-muted-foreground text-center">
              Use protocol template
            </span>
          </button>
        </div>

        {/* Template Picker - shown when PROTOCOL source is selected */}
        {source === "PROTOCOL" && (
          <div className="space-y-3 pt-2 border-t border-border/50">
            {!protocolId ? (
              <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg text-xs text-blue-600 dark:text-blue-400 flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>
                  Please select a protocol first to see available templates
                </span>
              </div>
            ) : availableTemplates.length === 0 ? (
              <div className="p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg text-xs text-yellow-600 dark:text-yellow-400 flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>
                  No command templates available for{" "}
                  {protocols.find((p) => p.id === protocolId)?.name ??
                    "unknown protocol"}
                </span>
              </div>
            ) : (
              <>
                <div className="space-y-2">
                  <Label className="text-xs">
                    Command Template <span className="text-destructive">*</span>
                  </Label>
                  <SelectDropdown
                    options={availableTemplates.map((tmpl) => ({
                      value: tmpl.id,
                      label: `${tmpl.name} - ${tmpl.description || ""}`,
                    }))}
                    value={templateId}
                    onChange={(value) => {
                      onTemplateIdChange(value);
                      const template = availableTemplates.find(
                        (tmpl) => tmpl.id === value,
                      );
                      if (template?.parameters) {
                        const defaultValues: Record<string, unknown> = {};
                        template.parameters.forEach((param) => {
                          if (param.defaultValue !== undefined) {
                            defaultValues[param.name] = param.defaultValue;
                          }
                        });
                        onParameterValuesChange(defaultValues);
                      }
                    }}
                    placeholder="Select a template..."
                  />
                </div>

                {/* Template Preview */}
                {selectedTemplate && (
                  <div className="space-y-2">
                    <Label className="text-xs text-muted-foreground">
                      Template Payload
                    </Label>
                    <div className="p-3 bg-muted/30 rounded-lg border border-border/50">
                      <code className="text-xs font-mono text-blue-600 dark:text-blue-400">
                        {selectedTemplate.payload}
                      </code>
                    </div>
                    {selectedTemplate.description && (
                      <p className="text-[10px] text-muted-foreground">
                        {selectedTemplate.description}
                      </p>
                    )}
                  </div>
                )}

                {/* Computed Payload Preview */}
                {selectedTemplate &&
                  Object.keys(parameterValues).length > 0 && (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Label className="text-xs text-muted-foreground">
                          Computed Payload
                        </Label>
                        <Info className="w-3 h-3 text-muted-foreground" />
                      </div>
                      <div className="p-3 bg-green-500/10 rounded-lg border border-green-500/20">
                        <code className="text-xs font-mono text-green-600 dark:text-green-400">
                          {(() => {
                            try {
                              return substituteParameters(
                                selectedTemplate.payload,
                                parameterValues,
                                selectedTemplate.parameters || [],
                              );
                            } catch {
                              return "Error computing payload";
                            }
                          })()}
                        </code>
                      </div>
                      <p className="text-[10px] text-muted-foreground">
                        This is the final payload that will be sent with your
                        current parameter values
                      </p>
                    </div>
                  )}

                {/* Dynamic Parameter Inputs */}
                {selectedTemplate?.parameters &&
                  selectedTemplate.parameters.length > 0 && (
                    <TemplateParameterInputs
                      parameters={selectedTemplate.parameters}
                      parameterValues={parameterValues}
                      onParameterValuesChange={onParameterValuesChange}
                    />
                  )}
              </>
            )}
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>{t("cmd.name")}</Label>
          <Input
            value={name}
            onChange={(e) => onNameChange(e.target.value)}
            required
          />
        </div>
        <div className="space-y-2">
          <Label>{t("cmd.group")}</Label>
          <Input
            value={group}
            onChange={(e) => onGroupChange(e.target.value)}
            placeholder="Device Name"
          />
        </div>
      </div>

      {/* Format and Encoding - only for CUSTOM commands */}
      {source === "CUSTOM" && (
        <>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>{t("cmd.format")}</Label>
              <SelectDropdown
                options={
                  [
                    { value: "TEXT", label: "TEXT" },
                    { value: "HEX", label: "HEX" },
                  ] as DropdownOption<DataMode>[]
                }
                value={mode}
                onChange={(value) => onModeChange(value)}
              />
            </div>
            {mode === "TEXT" && (
              <div className="space-y-2">
                <Label>Encoding</Label>
                <SelectDropdown
                  options={
                    [
                      { value: "UTF-8", label: "UTF-8" },
                      { value: "ASCII", label: "ASCII" },
                    ] as DropdownOption<TextEncoding>[]
                  }
                  value={encoding}
                  onChange={(value) => onEncodingChange(value)}
                />
              </div>
            )}
          </div>
          <div className="space-y-2">
            <Label>{t("cmd.payload")}</Label>
            <Textarea
              value={payload}
              onChange={(e) => onPayloadChange(e.target.value)}
              className="font-mono text-xs"
            />
          </div>
        </>
      )}
    </CardContent>
  );
};

// -- Sub-component for template parameter inputs --

interface TemplateParameterInputsProps {
  parameters: SimpleParameter[];
  parameterValues: Record<string, unknown>;
  onParameterValuesChange: React.Dispatch<
    React.SetStateAction<Record<string, unknown>>
  >;
}

const TemplateParameterInputs: React.FC<TemplateParameterInputsProps> = ({
  parameters,
  parameterValues,
  onParameterValuesChange,
}) => {
  return (
    <div className="space-y-3 pt-2 border-t border-border/50">
      <div className="flex items-center justify-between">
        <Label className="text-xs font-semibold">Template Parameters</Label>
        <Badge variant="outline" className="text-[10px]">
          {parameters.length} parameter
          {parameters.length !== 1 ? "s" : ""}
        </Badge>
      </div>

      {parameters.map((param) => (
        <div key={param.name} className="space-y-2">
          <Label className="text-xs">
            {param.label || param.name}
            {param.required && <span className="text-destructive"> *</span>}
          </Label>

          {/* STRING input */}
          {param.type === "STRING" && (
            <div className="relative">
              <Input
                value={
                  (parameterValues[param.name] as string) ??
                  (param.defaultValue as string) ??
                  ""
                }
                onChange={(e) =>
                  onParameterValuesChange((prev) => ({
                    ...prev,
                    [param.name]: e.target.value,
                  }))
                }
                placeholder={param.placeholder}
                maxLength={param.maxLength}
                className={cn(
                  "h-8 text-xs font-mono pr-8",
                  param.required &&
                    !parameterValues[param.name] &&
                    "border-destructive",
                )}
              />
              {param.required && parameterValues[param.name] && (
                <Check className="absolute right-2 top-2 w-4 h-4 text-green-500" />
              )}
            </div>
          )}

          {/* INTEGER input */}
          {param.type === "INTEGER" && (
            <div className="relative">
              <Input
                type="number"
                value={
                  (parameterValues[param.name] as number) ??
                  (param.defaultValue as number) ??
                  ""
                }
                onChange={(e) =>
                  onParameterValuesChange((prev) => ({
                    ...prev,
                    [param.name]: parseInt(e.target.value),
                  }))
                }
                min={param.min}
                max={param.max}
                className={cn(
                  "h-8 text-xs font-mono pr-8",
                  param.required &&
                    parameterValues[param.name] === undefined &&
                    "border-destructive",
                )}
              />
              {param.required && parameterValues[param.name] !== undefined && (
                <Check className="absolute right-2 top-2 w-4 h-4 text-green-500" />
              )}
            </div>
          )}

          {/* FLOAT input */}
          {param.type === "FLOAT" && (
            <div className="relative">
              <Input
                type="number"
                step="any"
                value={
                  (parameterValues[param.name] as number) ??
                  (param.defaultValue as number) ??
                  ""
                }
                onChange={(e) =>
                  onParameterValuesChange((prev) => ({
                    ...prev,
                    [param.name]: parseFloat(e.target.value),
                  }))
                }
                min={param.min}
                max={param.max}
                className={cn(
                  "h-8 text-xs font-mono pr-8",
                  param.required &&
                    parameterValues[param.name] === undefined &&
                    "border-destructive",
                )}
              />
              {param.required && parameterValues[param.name] !== undefined && (
                <Check className="absolute right-2 top-2 w-4 h-4 text-green-500" />
              )}
            </div>
          )}

          {/* ENUM dropdown */}
          {param.type === "ENUM" && param.options && (
            <SelectDropdown
              options={param.options.map((opt) => ({
                label: opt.label || String(opt.value),
                value: opt.value || "",
              }))}
              value={
                (parameterValues[param.name] as string) ??
                param.defaultValue ??
                ""
              }
              onChange={(value) =>
                onParameterValuesChange((prev) => ({
                  ...prev,
                  [param.name]: value,
                }))
              }
            />
          )}

          {/* BOOLEAN checkbox */}
          {param.type === "BOOLEAN" && (
            <div className="flex items-center gap-2">
              <Checkbox
                checked={
                  (parameterValues[param.name] as boolean) ??
                  (param.defaultValue as boolean) ??
                  false
                }
                onChange={(e) =>
                  onParameterValuesChange((prev) => ({
                    ...prev,
                    [param.name]: e.target.checked,
                  }))
                }
              />
              <span className="text-xs text-muted-foreground">
                {param.description}
              </span>
            </div>
          )}

          {/* Enhanced Parameter Help */}
          {param.type !== "BOOLEAN" && (
            <div className="space-y-1">
              {param.description && (
                <p className="text-[10px] text-muted-foreground">
                  {param.description}
                </p>
              )}
              <div className="flex flex-wrap gap-2 text-[9px] text-muted-foreground">
                {param.defaultValue !== undefined && (
                  <span className="inline-flex items-center gap-1">
                    <span className="font-semibold">Default:</span>
                    <code className="px-1 py-0.5 bg-muted rounded">
                      {String(param.defaultValue)}
                    </code>
                  </span>
                )}
                {param.type === "INTEGER" &&
                  (param.min !== undefined || param.max !== undefined) && (
                    <span className="inline-flex items-center gap-1">
                      <span className="font-semibold">Range:</span>
                      <code className="px-1 py-0.5 bg-muted rounded">
                        {param.min ?? "-\u221E"} to {param.max ?? "\u221E"}
                      </code>
                    </span>
                  )}
                {param.type === "FLOAT" &&
                  (param.min !== undefined || param.max !== undefined) && (
                    <span className="inline-flex items-center gap-1">
                      <span className="font-semibold">Range:</span>
                      <code className="px-1 py-0.5 bg-muted rounded">
                        {param.min ?? "-\u221E"} to {param.max ?? "\u221E"}
                      </code>
                    </span>
                  )}
                {param.type === "STRING" && param.maxLength && (
                  <span className="inline-flex items-center gap-1">
                    <span className="font-semibold">Max length:</span>
                    <code className="px-1 py-0.5 bg-muted rounded">
                      {param.maxLength}
                    </code>
                  </span>
                )}
                {param.required && (
                  <Badge
                    variant="destructive"
                    className="text-[8px] h-4 px-1.5"
                  >
                    Required
                  </Badge>
                )}
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default BasicTab;
