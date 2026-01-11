import React, { useState, useEffect } from "react";
import {
  SavedCommand,
  DataMode,
  TextEncoding,
  MatchType,
  ValidationMode,
  SerialSequence,
  ProjectContext,
  CommandParameter,
  ParameterType,
  FramingStrategy,
  FramingConfig,
} from "../types";
import {
  X,
  Save,
  Code,
  Settings2,
  ArrowRightLeft,
  AlertTriangle,
  Calculator,
  Wand2,
  BookOpen,
  FileText,
  Plus,
  Trash2,
  Sliders,
  Scissors,
  Infinity,
  Zap,
  CheckCircle2,
  FileCode,
  Search,
  Terminal,
} from "lucide-react";
import { Button } from "./ui/Button";
import { Input } from "./ui/Input";
import { Textarea } from "./ui/Textarea";
import { Select } from "./ui/Select";
import { Label } from "./ui/Label";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter,
} from "./ui/Card";
import { Badge } from "./ui/Badge";
import { cn, generateId } from "../lib/utils";
import {
  generateModbusFrame,
  MODBUS_FUNCTIONS,
  AT_COMMAND_LIBRARY,
  ModbusParams,
} from "../services/protocolUtils";
import { useTranslation } from "react-i18next";
import CodeEditor from "./ui/CodeEditor";

interface Props {
  initialData?: Partial<SavedCommand>;
  existingGroups: string[];
  sequences: SerialSequence[];
  contexts: ProjectContext[];
  onSave: (command: Omit<SavedCommand, "id">) => void;
  onUpdateContext?: (context: ProjectContext) => void;
  onCreateContext: (context: ProjectContext) => void;
  onClose: () => void;
}

const CommandFormModal: React.FC<Props> = ({
  initialData,
  existingGroups,
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

  const [contextId, setContextId] = useState<string | undefined>(
    initialData?.contextId,
  );
  const activeContext = contexts.find((c) => c.id === contextId);
  const [contextContent, setContextContent] = useState("");
  const [contextTitle, setContextTitle] = useState("");

  useEffect(() => {
    const ctx = contexts.find((c) => c.id === contextId);
    if (ctx) {
      setContextContent(ctx.content);
      setContextTitle(ctx.title);
    }
  }, [contextId, contexts]);

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (activeContext && onUpdateContext)
      onUpdateContext({
        ...activeContext,
        content: contextContent,
        title: contextTitle,
      });

    onSave({
      name,
      description,
      payload,
      group: group.trim() || undefined,
      mode,
      encoding: mode === "TEXT" ? encoding : undefined,
      parameters,
      validation:
        postResponseEnabled && responseMode === "PATTERN"
          ? { enabled: true, mode: "PATTERN", matchType, pattern, timeout }
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
      createdAt: initialData?.createdAt || Date.now(),
      updatedAt: Date.now(),
      contextId,
    });
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
          <button
            onClick={() => setActiveTab("basic")}
            className={cn(
              "pb-2 text-sm font-medium transition-colors border-b-2 whitespace-nowrap",
              activeTab === "basic"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground",
            )}
          >
            {t("cmd.tab.basic")}
          </button>
          <button
            onClick={() => setActiveTab("params")}
            className={cn(
              "pb-2 text-sm font-medium transition-colors border-b-2 whitespace-nowrap",
              activeTab === "params"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground",
            )}
          >
            {t("cmd.tab.params")}{" "}
            <Badge variant="secondary" className="px-1 h-4 text-[9px]">
              {parameters.length}
            </Badge>
          </button>
          <button
            onClick={() => setActiveTab("processing")}
            className={cn(
              "pb-2 text-sm font-medium transition-colors border-b-2 whitespace-nowrap",
              activeTab === "processing"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground",
            )}
          >
            {t("cmd.tab.processing")}
          </button>
          <button
            onClick={() => setActiveTab("framing")}
            className={cn(
              "pb-2 text-sm font-medium transition-colors border-b-2 whitespace-nowrap",
              activeTab === "framing"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground",
            )}
          >
            {t("cmd.tab.framing")}
          </button>
          <button
            onClick={() => setActiveTab("context")}
            className={cn(
              "pb-2 text-sm font-medium transition-colors border-b-2 whitespace-nowrap",
              activeTab === "context"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground",
            )}
          >
            {t("cmd.tab.context")}
          </button>
          <div className="flex-1"></div>
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
              <CardContent className="pt-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>{t("cmd.name")}</Label>
                    <Input
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>{t("cmd.group")}</Label>
                    <Input
                      value={group}
                      onChange={(e) => setGroup(e.target.value)}
                      placeholder="Device Name"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>{t("cmd.format")}</Label>
                    <Select
                      value={mode}
                      onChange={(e) => setMode(e.target.value as any)}
                    >
                      <option value="TEXT">TEXT</option>
                      <option value="HEX">HEX</option>
                    </Select>
                  </div>
                  {mode === "TEXT" && (
                    <div className="space-y-2">
                      <Label>Encoding</Label>
                      <Select
                        value={encoding}
                        onChange={(e) => setEncoding(e.target.value as any)}
                      >
                        <option value="UTF-8">UTF-8</option>
                        <option value="ASCII">ASCII</option>
                      </Select>
                    </div>
                  )}
                </div>
                <div className="space-y-2">
                  <Label>{t("cmd.payload")}</Label>
                  <Textarea
                    value={payload}
                    onChange={(e) => setPayload(e.target.value)}
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
                    onClick={addParameter}
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
                          onChange={(e) =>
                            updateParameter(idx, { name: e.target.value })
                          }
                          className="h-8 text-xs font-mono"
                          placeholder="varName"
                        />
                      </div>
                      <div className="col-span-3 space-y-1">
                        <Label className="text-[10px]">Label</Label>
                        <Input
                          value={param.label || ""}
                          onChange={(e) =>
                            updateParameter(idx, { label: e.target.value })
                          }
                          className="h-8 text-xs"
                          placeholder="Display Label"
                        />
                      </div>
                      <div className="col-span-2 space-y-1">
                        <Label className="text-[10px]">Type</Label>
                        <Select
                          value={param.type}
                          onChange={(e) =>
                            updateParameter(idx, {
                              type: e.target.value as ParameterType,
                            })
                          }
                          className="h-8 text-xs"
                        >
                          <option value="STRING">String</option>
                          <option value="INTEGER">Integer</option>
                          <option value="FLOAT">Float</option>
                          <option value="BOOLEAN">Boolean</option>
                        </Select>
                      </div>
                      <div className="col-span-3 space-y-1">
                        <Label className="text-[10px]">Default</Label>
                        <Input
                          value={String(param.defaultValue ?? "")}
                          onChange={(e) =>
                            updateParameter(idx, {
                              defaultValue: e.target.value,
                            })
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
                          onClick={() => removeParameter(idx)}
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
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="chk-pre"
                      checked={preRequestEnabled}
                      onChange={(e) => setPreRequestEnabled(e.target.checked)}
                      className="h-4 w-4 rounded border-input"
                    />
                    <Label
                      htmlFor="chk-pre"
                      className="cursor-pointer font-bold text-sm"
                    >
                      Enable Pre-Request Handling
                    </Label>
                  </div>
                  {preRequestEnabled && (
                    <div className="pl-6 space-y-2 animate-in slide-in-from-top-1">
                      <CodeEditor
                        value={preRequestScript}
                        onChange={setPreRequestScript}
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
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="chk-post"
                      checked={postResponseEnabled}
                      onChange={(e) => setPostResponseEnabled(e.target.checked)}
                      className="h-4 w-4 rounded border-input"
                    />
                    <Label
                      htmlFor="chk-post"
                      className="cursor-pointer font-bold text-sm"
                    >
                      Enable Post-Response Handling
                    </Label>
                  </div>

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
                            <Select
                              className="h-8 text-xs"
                              value={matchType}
                              onChange={(e) =>
                                setMatchType(e.target.value as any)
                              }
                            >
                              <option value="CONTAINS">Contains</option>
                              <option value="REGEX">Regex</option>
                            </Select>
                          </div>
                          <div className="col-span-2 space-y-1">
                            <Label className="text-[10px]">Pattern</Label>
                            <Input
                              className="h-8 text-xs font-mono"
                              value={pattern}
                              onChange={(e) => setPattern(e.target.value)}
                              placeholder="OK"
                            />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-[10px]">Timeout (ms)</Label>
                            <Input
                              type="number"
                              className="h-8 text-xs"
                              value={timeout}
                              onChange={(e) =>
                                setTimeoutVal(parseInt(e.target.value))
                              }
                            />
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-2 animate-in fade-in">
                          <CodeEditor
                            value={postResponseScript}
                            onChange={setPostResponseScript}
                            height="150px"
                            className="border-l-4 border-l-emerald-500/30"
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
                  <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-500 flex-shrink-0 mt-0.5" />
                  <div className="text-xs text-amber-800 dark:text-amber-300">
                    <strong>Note:</strong> Framing overrides allow this specific
                    command to parse incoming data differently (e.g., waiting
                    for a specific delimiter).
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="chk-frm"
                      checked={framingEnabled}
                      onChange={(e) => setFramingEnabled(e.target.checked)}
                      className="h-4 w-4 rounded border-input"
                    />
                    <Label htmlFor="chk-frm" className="font-bold">
                      Override Global Framing
                    </Label>
                  </div>
                  {framingEnabled && (
                    <Select
                      value={framingPersistence}
                      onChange={(e) =>
                        setFramingPersistence(e.target.value as any)
                      }
                      className="h-8 text-xs w-[180px]"
                    >
                      <option value="TRANSIENT">Transient (One-Shot)</option>
                      <option value="PERSISTENT">
                        Persistent (Change Global)
                      </option>
                    </Select>
                  )}
                </div>

                {framingEnabled && (
                  <div className="pl-6 space-y-4 animate-in slide-in-from-top-2 border-l-2 border-border ml-2">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <Label className="text-xs">Strategy</Label>
                        <Select
                          value={framingConfig.strategy}
                          onChange={(e) => {
                            const newStrategy = e.target
                              .value as FramingStrategy;
                            let newScript = framingConfig.script;

                            // Add default script example if switching to SCRIPT mode and it's empty
                            if (
                              newStrategy === "SCRIPT" &&
                              (!newScript || newScript.trim() === "")
                            ) {
                              newScript = `// Custom Framer Script
// Args: chunks (Array<{data: Uint8Array, timestamp: number}>), forceFlush (boolean)
// Return: { frames: [], remaining: [] }

// Example: Merge everything into one frame on timeout/flush
if (forceFlush) {
    const totalLen = chunks.reduce((acc, c) => acc + c.data.length, 0);
    const merged = new Uint8Array(totalLen);
    let offset = 0;
    for(const c of chunks) {
        merged.set(c.data, offset);
        offset += c.data.length;
    }
    // Return single combined frame
    return { 
        frames: [{ data: merged, timestamp: Date.now() }], 
        remaining: [] 
    };
}

// Keep accumulating if not flushed
return { frames: [], remaining: chunks };`;
                            }

                            setFramingConfig({
                              ...framingConfig,
                              strategy: newStrategy,
                              script: newScript,
                            });
                          }}
                          className="h-9 text-sm"
                        >
                          <option value="NONE">None (Raw Stream)</option>
                          <option value="DELIMITER">Delimiter</option>
                          <option value="TIMEOUT">Timeout</option>
                          <option value="PREFIX_LENGTH">Prefix Length</option>
                          <option value="SCRIPT">Custom Script</option>
                        </Select>
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Timeout (ms)</Label>
                        <Input
                          type="number"
                          value={framingConfig.timeout}
                          onChange={(e) =>
                            setFramingConfig({
                              ...framingConfig,
                              timeout: parseInt(e.target.value),
                            })
                          }
                          className="h-9 text-sm"
                        />
                      </div>
                    </div>

                    {framingConfig.strategy === "DELIMITER" && (
                      <div className="space-y-1">
                        <Label className="text-xs">Delimiter (Hex/Text)</Label>
                        <Input
                          value={framingConfig.delimiter}
                          onChange={(e) =>
                            setFramingConfig({
                              ...framingConfig,
                              delimiter: e.target.value,
                            })
                          }
                          placeholder="e.g. \n or 0D 0A"
                          className="h-9 text-sm font-mono"
                        />
                      </div>
                    )}

                    {framingConfig.strategy === "PREFIX_LENGTH" && (
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <Label className="text-xs">Header Size (Bytes)</Label>
                          <Input
                            type="number"
                            min={1}
                            max={8}
                            value={framingConfig.prefixLengthSize}
                            onChange={(e) =>
                              setFramingConfig({
                                ...framingConfig,
                                prefixLengthSize: parseInt(e.target.value),
                              })
                            }
                            className="h-9 text-sm"
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">Byte Order</Label>
                          <Select
                            value={framingConfig.byteOrder}
                            onChange={(e) =>
                              setFramingConfig({
                                ...framingConfig,
                                byteOrder: e.target.value as any,
                              })
                            }
                            className="h-9 text-sm"
                          >
                            <option value="LE">Little Endian</option>
                            <option value="BE">Big Endian</option>
                          </Select>
                        </div>
                      </div>
                    )}

                    {framingConfig.strategy === "SCRIPT" && (
                      <div className="space-y-1">
                        <Label className="text-xs">Framer Script</Label>
                        <CodeEditor
                          value={framingConfig.script || ""}
                          onChange={(val) =>
                            setFramingConfig({ ...framingConfig, script: val })
                          }
                          height="150px"
                          className="border-l-4 border-l-purple-500/30"
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
                    <Select
                      value={contextId || ""}
                      onChange={(e) => {
                        const val = e.target.value;
                        if (val === "__new__") {
                          setContextId(undefined);
                          setContextTitle("");
                          setContextContent("");
                        } else {
                          setContextId(val);
                          const c = contexts.find((cx) => cx.id === val);
                          if (c) {
                            setContextTitle(c.title);
                            setContextContent(c.content);
                          }
                        }
                      }}
                      className="h-9"
                    >
                      <option value="">-- No Context --</option>
                      <option value="__new__">+ Create New Context</option>
                      {contexts.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.title}
                        </option>
                      ))}
                    </Select>
                  </div>
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => {
                      if (contextTitle && contextContent) {
                        if (contextId && activeContext) {
                          if (onUpdateContext)
                            onUpdateContext({
                              ...activeContext,
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
                          setContextId(newCtx.id);
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
                        <Select
                          value={mbParams.functionCode}
                          onChange={(e) =>
                            setMbParams({
                              ...mbParams,
                              functionCode: parseInt(e.target.value),
                            })
                          }
                          className="h-8 text-xs"
                        >
                          {MODBUS_FUNCTIONS.map((f) => (
                            <option key={f.code} value={f.code}>
                              {f.name}
                            </option>
                          ))}
                        </Select>
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
                          setMode("HEX");
                          setPayload(generateModbusFrame(mbParams));
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
                      <div className="h-[200px] overflow-y-auto border rounded bg-background p-2 space-y-1">
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
                                    setMode("TEXT");
                                    setPayload(c.cmd);
                                    setDescription(c.desc);
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
              <Save className="w-4 h-4 mr-2" /> {t("modal.save")}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
};

export default CommandFormModal;
