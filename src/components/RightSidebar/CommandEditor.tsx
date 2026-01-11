import React, { useState, useEffect } from "react";
import {
  SavedCommand,
  DataMode,
  TextEncoding,
  MatchType,
  CommandParameter,
  ParameterType,
  FramingStrategy,
  FramingConfig,
  ValidationMode,
} from "../../types";
import {
  Plus,
  Trash2,
  Search,
  FileCode,
  Calculator,
  Terminal,
  AlertTriangle,
  BookOpen,
  Copy,
  RotateCcw,
  Hash,
  Settings,
  Check,
} from "lucide-react";
import { Button } from "../ui/Button";
import { Input } from "../ui/Input";
import { Textarea } from "../ui/Textarea";
import { Select } from "../ui/Select";
import { Label } from "../ui/Label";
import { cn, generateId } from "../../lib/utils";
import {
  generateModbusFrame,
  MODBUS_FUNCTIONS,
  AT_COMMAND_LIBRARY,
  ModbusParams,
} from "../../services/protocolUtils";
import { calculateChecksum, encodeText } from "../../lib/dataUtils";
import { useStore } from "../../lib/store";
import { RightSidebarTab } from "../../lib/slices/uiSlice";
import CodeEditor from "../ui/CodeEditor";
import { useTranslation } from "react-i18next";

const DEFAULT_FRAMER_SCRIPT = `// Custom Framer Script
// Args: chunks, forceFlush
if (forceFlush) {
    const totalLen = chunks.reduce((acc, c) => acc + c.data.length, 0);
    const merged = new Uint8Array(totalLen);
    let offset = 0;
    for(const c of chunks) {
        merged.set(c.data, offset);
        offset += c.data.length;
    }
    return { frames: [{ data: merged, timestamp: Date.now() }], remaining: [] };
}
return { frames: [], remaining: chunks };`;

interface Props {
  activeTab: RightSidebarTab;
}

// Utility: Card Style Selector
const ToggleGroup = <T extends string>({
  options,
  value,
  onChange,
  className,
}: {
  options: { value: T; label: React.ReactNode }[];
  value: T;
  onChange: (val: T) => void;
  className?: string;
}) => (
  <div
    className={cn(
      "flex bg-muted p-1 rounded-md border border-border h-8 items-center",
      className,
    )}
  >
    {options.map((opt) => (
      <button
        key={opt.value}
        onClick={() => onChange(opt.value)}
        className={cn(
          "flex-1 text-[10px] font-bold h-full px-2 rounded-sm transition-all flex items-center justify-center gap-1.5",
          value === opt.value
            ? "bg-background text-foreground shadow-sm"
            : "text-muted-foreground hover:text-foreground hover:bg-background/50",
        )}
      >
        {opt.label}
      </button>
    ))}
  </div>
);

const CommandEditor: React.FC<Props> = ({ activeTab }) => {
  const { t } = useTranslation();
  const { editingCommand, setEditingCommand, contexts } = useStore();

  // Local state for Protocol Wizard
  const [protoType, setProtoType] = useState<"MODBUS" | "AT">("MODBUS");
  const [mbParams, setMbParams] = useState<ModbusParams>({
    slaveId: 1,
    functionCode: 3,
    startAddress: 0,
    quantityOrValue: 1,
  });

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
    });
    updateCmd({ parameters: newParams });
  };

  const removeParam = (idx: number) => {
    const newParams = [...(editingCommand.parameters || [])];
    newParams.splice(idx, 1);
    updateCmd({ parameters: newParams });
  };

  // --- Render Tabs ---

  if (activeTab === "basic") {
    return (
      <div className="p-4 space-y-4 overflow-y-auto custom-scrollbar h-full">
        <div className="space-y-1.5">
          <Label className="text-xs">{t("cmd.name")}</Label>
          <Input
            value={editingCommand.name || ""}
            onChange={(e) => updateCmd({ name: e.target.value })}
            className="h-8 text-sm"
          />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">{t("cmd.group")}</Label>
          <Input
            value={editingCommand.group || ""}
            onChange={(e) => updateCmd({ group: e.target.value })}
            className="h-8 text-sm"
            placeholder="e.g. Motors"
          />
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs">{t("cmd.format")}</Label>
          <ToggleGroup
            value={editingCommand.mode || "TEXT"}
            onChange={(m) => updateCmd({ mode: m as DataMode })}
            options={[
              { value: "TEXT", label: "TEXT" },
              { value: "HEX", label: "HEX" },
              { value: "BINARY", label: "BIN" },
            ]}
          />
        </div>

        {editingCommand.mode === "TEXT" && (
          <div className="space-y-1.5 animate-in fade-in">
            <Label className="text-xs">{t("cmd.encoding")}</Label>
            <Select
              value={editingCommand.encoding || "UTF-8"}
              onChange={(e) =>
                updateCmd({ encoding: e.target.value as TextEncoding })
              }
              className="h-8 text-xs"
            >
              <option value="UTF-8">UTF-8</option>
              <option value="ASCII">ASCII</option>
              <option value="ISO-8859-1">ISO-8859-1</option>
            </Select>
          </div>
        )}

        <div className="space-y-1.5 flex-1 flex flex-col">
          <Label className="text-xs">{t("cmd.payload")}</Label>
          <Textarea
            value={editingCommand.payload || ""}
            onChange={(e) => updateCmd({ payload: e.target.value })}
            className="font-mono text-xs flex-1 min-h-[100px] resize-none p-2 bg-muted/20"
            placeholder="Command content..."
          />
        </div>
      </div>
    );
  }

  if (activeTab === "params") {
    const params = editingCommand.parameters || [];
    return (
      <div className="flex flex-col h-full">
        <div className="p-3 border-b border-border flex justify-between items-center bg-muted/10 shrink-0">
          <div className="text-xs text-muted-foreground">
            {params.length} Parameters
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
            <div className="text-center py-8 text-muted-foreground text-xs italic">
              No parameters defined.
            </div>
          )}
          {params.map((param, idx) => (
            <div
              key={param.id || idx}
              className="p-3 border rounded-lg bg-card space-y-3 relative group"
            >
              <Button
                size="icon"
                variant="ghost"
                onClick={() => removeParam(idx)}
                className="absolute top-2 right-2 h-6 w-6 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </Button>

              <div className="grid grid-cols-2 gap-2 pr-6">
                <div className="space-y-1">
                  <Label className="text-[10px] text-muted-foreground">
                    Var Name
                  </Label>
                  <Input
                    value={param.name}
                    onChange={(e) => updateParam(idx, { name: e.target.value })}
                    className="h-7 text-xs font-mono"
                    placeholder="varName"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-[10px] text-muted-foreground">
                    Type
                  </Label>
                  <Select
                    value={param.type}
                    onChange={(e) =>
                      updateParam(idx, {
                        type: e.target.value as ParameterType,
                      })
                    }
                    className="h-7 text-xs"
                  >
                    <option value="STRING">String</option>
                    <option value="INTEGER">Integer</option>
                    <option value="FLOAT">Float</option>
                    <option value="BOOLEAN">Boolean</option>
                  </Select>
                </div>
              </div>
              <div className="space-y-1">
                <Label className="text-[10px] text-muted-foreground">
                  Label
                </Label>
                <Input
                  value={param.label || ""}
                  onChange={(e) => updateParam(idx, { label: e.target.value })}
                  className="h-7 text-xs"
                  placeholder="Human Readable Label"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-[10px] text-muted-foreground">
                  Default Value
                </Label>
                <Input
                  value={String(param.defaultValue ?? "")}
                  onChange={(e) =>
                    updateParam(idx, { defaultValue: e.target.value })
                  }
                  className="h-7 text-xs"
                  placeholder="Optional"
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (activeTab === "processing") {
    const scripting = editingCommand.scripting || { enabled: false };
    const validation = editingCommand.validation || {
      enabled: false,
      mode: "PATTERN",
      timeout: 1000,
    };

    const preEnabled = !!scripting.preRequestScript;
    // Determine Response Mode: Pattern or Script
    const responseMode = scripting.postResponseScript
      ? "SCRIPT"
      : validation.enabled
        ? "PATTERN"
        : "NONE";

    return (
      <div className="p-4 space-y-6 overflow-y-auto custom-scrollbar h-full">
        {/* Pre-Request Section */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="pre-req"
              checked={preEnabled}
              onChange={(e) =>
                updateCmd({
                  scripting: {
                    ...scripting,
                    enabled: true,
                    preRequestScript: e.target.checked
                      ? '// return payload + "\\r\\n";'
                      : undefined,
                  },
                })
              }
              className="h-4 w-4 rounded border-input"
            />
            <Label htmlFor="pre-req" className="font-bold text-xs">
              {t("proc.pre_req")}
            </Label>
          </div>
          {preEnabled && (
            <div className="pl-6 space-y-2 animate-in slide-in-from-top-1">
              <CodeEditor
                value={scripting.preRequestScript || ""}
                onChange={(val) =>
                  updateCmd({
                    scripting: { ...scripting, preRequestScript: val },
                  })
                }
                height="120px"
                className="border-l-4 border-l-blue-500/30"
              />
              <p className="text-[10px] text-muted-foreground italic">
                {t("proc.pre_req_desc")}
              </p>
            </div>
          )}
        </div>

        <hr className="border-border/50" />

        {/* Post-Response Section */}
        <div className="space-y-4">
          <Label className="font-bold text-xs">{t("proc.response")}</Label>

          <ToggleGroup
            value={responseMode}
            onChange={(m) => {
              const newScripting = { ...scripting };
              const newValidation = { ...validation };

              if (m === "NONE") {
                newValidation.enabled = false;
                newScripting.postResponseScript = undefined;
              } else if (m === "PATTERN") {
                newValidation.enabled = true;
                newScripting.postResponseScript = undefined;
              } else if (m === "SCRIPT") {
                newValidation.enabled = false; // Implicitly handled by script or separated? Logic in App.tsx suggests SCRIPT mode uses script for validation too.
                newScripting.postResponseScript =
                  '// if (data.includes("OK")) return true;';
                newScripting.enabled = true;
              }
              updateCmd({ scripting: newScripting, validation: newValidation });
            }}
            options={[
              { value: "NONE", label: "None" },
              { value: "PATTERN", label: t("proc.pattern") },
              { value: "SCRIPT", label: t("proc.script") },
            ]}
          />

          {responseMode === "PATTERN" && (
            <div className="p-3 bg-muted/20 border border-border rounded-lg space-y-3 animate-in fade-in">
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1">
                  <Label className="text-[10px]">Type</Label>
                  <Select
                    className="h-8 text-xs"
                    value={validation.matchType || "CONTAINS"}
                    onChange={(e) =>
                      updateCmd({
                        validation: {
                          ...validation,
                          matchType: e.target.value as MatchType,
                        },
                      })
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
                    value={validation.pattern || ""}
                    onChange={(e) =>
                      updateCmd({
                        validation: { ...validation, pattern: e.target.value },
                      })
                    }
                    placeholder="OK"
                  />
                </div>
              </div>
              <div className="space-y-1">
                <Label className="text-[10px]">{t("proc.timeout")}</Label>
                <Input
                  type="number"
                  className="h-8 text-xs"
                  value={validation.timeout}
                  onChange={(e) =>
                    updateCmd({
                      validation: {
                        ...validation,
                        timeout: parseInt(e.target.value),
                      },
                    })
                  }
                />
              </div>
            </div>
          )}

          {responseMode === "SCRIPT" && (
            <div className="space-y-2 animate-in fade-in">
              <CodeEditor
                value={scripting.postResponseScript || ""}
                onChange={(val) =>
                  updateCmd({
                    scripting: { ...scripting, postResponseScript: val },
                  })
                }
                height="150px"
                className="border-l-4 border-l-emerald-500/30"
              />
              <p className="text-[10px] text-muted-foreground italic">
                {t("proc.response_desc")}
              </p>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (activeTab === "framing") {
    const framing = editingCommand.responseFraming;
    const enabled = !!framing;
    const config = framing || {
      strategy: "NONE",
      delimiter: "",
      timeout: 50,
      prefixLengthSize: 1,
      byteOrder: "LE",
      script: "",
    };
    const persistence = editingCommand.framingPersistence || "TRANSIENT";

    return (
      <div className="p-4 space-y-6 overflow-y-auto custom-scrollbar h-full">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="chk-frm"
              checked={enabled}
              onChange={(e) =>
                updateCmd({
                  responseFraming: e.target.checked ? config : undefined,
                })
              }
              className="h-4 w-4 rounded border-input"
            />
            <Label htmlFor="chk-frm" className="font-bold text-xs">
              Override Framing
            </Label>
          </div>
          {enabled && (
            <Select
              value={persistence}
              onChange={(e) =>
                updateCmd({ framingPersistence: e.target.value as any })
              }
              className="h-7 text-[10px] w-[120px]"
            >
              <option value="TRANSIENT">Transient (One-Shot)</option>
              <option value="PERSISTENT">Persistent</option>
            </Select>
          )}
        </div>

        {enabled && (
          <div className="pl-4 border-l-2 border-border space-y-4 animate-in slide-in-from-top-2">
            <div className="space-y-1">
              <Label className="text-[10px]">Strategy</Label>
              <Select
                value={config.strategy}
                onChange={(e) => {
                  const strat = e.target.value as FramingStrategy;
                  let script = config.script;
                  if (strat === "SCRIPT" && !script)
                    script = DEFAULT_FRAMER_SCRIPT;
                  updateCmd({
                    responseFraming: { ...config, strategy: strat, script },
                  });
                }}
                className="h-8 text-xs"
              >
                <option value="NONE">None (Raw)</option>
                <option value="DELIMITER">Delimiter</option>
                <option value="TIMEOUT">Timeout</option>
                <option value="PREFIX_LENGTH">Prefix Length</option>
                <option value="SCRIPT">Script</option>
              </Select>
            </div>

            {/* Strategy Specific Configs */}
            {config.strategy === "DELIMITER" && (
              <div className="space-y-1">
                <Label className="text-[10px]">Delimiter</Label>
                <Input
                  value={config.delimiter}
                  onChange={(e) =>
                    updateCmd({
                      responseFraming: { ...config, delimiter: e.target.value },
                    })
                  }
                  className="h-8 text-xs font-mono"
                  placeholder="\\n or AA BB"
                />
              </div>
            )}

            {config.strategy === "TIMEOUT" && (
              <div className="space-y-1">
                <Label className="text-[10px]">Timeout (ms)</Label>
                <Input
                  type="number"
                  value={config.timeout}
                  onChange={(e) =>
                    updateCmd({
                      responseFraming: {
                        ...config,
                        timeout: parseInt(e.target.value),
                      },
                    })
                  }
                  className="h-8 text-xs"
                />
              </div>
            )}

            {config.strategy === "PREFIX_LENGTH" && (
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-[10px]">Length Bytes</Label>
                  <Input
                    type="number"
                    min={1}
                    max={8}
                    value={config.prefixLengthSize}
                    onChange={(e) =>
                      updateCmd({
                        responseFraming: {
                          ...config,
                          prefixLengthSize: parseInt(e.target.value),
                        },
                      })
                    }
                    className="h-8 text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-[10px]">Byte Order</Label>
                  <Select
                    value={config.byteOrder}
                    onChange={(e) =>
                      updateCmd({
                        responseFraming: {
                          ...config,
                          byteOrder: e.target.value as any,
                        },
                      })
                    }
                    className="h-8 text-xs"
                  >
                    <option value="LE">LE</option>
                    <option value="BE">BE</option>
                  </Select>
                </div>
              </div>
            )}

            {config.strategy === "SCRIPT" && (
              <div className="space-y-1">
                <Label className="text-[10px]">Script</Label>
                <CodeEditor
                  value={config.script || ""}
                  onChange={(val) =>
                    updateCmd({ responseFraming: { ...config, script: val } })
                  }
                  height="150px"
                  className="border-l-4 border-l-purple-500/30"
                />
              </div>
            )}
          </div>
        )}
      </div>
    );
  }

  if (activeTab === "context") {
    const activeCtx = contexts.find((c) => c.id === editingCommand.contextId);

    return (
      <div className="p-4 space-y-4 h-full flex flex-col">
        <div className="space-y-1">
          <Label className="text-xs">Linked Context</Label>
          <Select
            value={editingCommand.contextId || ""}
            onChange={(e) =>
              updateCmd({ contextId: e.target.value || undefined })
            }
            className="h-8 text-xs"
          >
            <option value="">-- None --</option>
            {contexts.map((c) => (
              <option key={c.id} value={c.id}>
                {c.title}
              </option>
            ))}
          </Select>
        </div>

        {activeCtx ? (
          <div className="flex-1 bg-muted/20 border border-border rounded-md p-3 overflow-y-auto text-xs font-mono whitespace-pre-wrap">
            <div className="font-bold border-b border-border/50 mb-2 pb-1">
              {activeCtx.title}
            </div>
            {activeCtx.content}
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center text-muted-foreground text-xs italic border border-dashed rounded-md">
            Select a context to view documentation overlay.
          </div>
        )}
      </div>
    );
  }

  if (activeTab === "wizard") {
    return (
      <div className="p-4 space-y-6 overflow-y-auto custom-scrollbar h-full">
        <div className="flex bg-muted p-1 rounded-md">
          <button
            onClick={() => setProtoType("MODBUS")}
            className={cn(
              "flex-1 py-1 text-xs font-bold rounded-sm transition-all",
              protoType === "MODBUS"
                ? "bg-background shadow-sm"
                : "hover:text-foreground text-muted-foreground",
            )}
          >
            MODBUS
          </button>
          <button
            onClick={() => setProtoType("AT")}
            className={cn(
              "flex-1 py-1 text-xs font-bold rounded-sm transition-all",
              protoType === "AT"
                ? "bg-background shadow-sm"
                : "hover:text-foreground text-muted-foreground",
            )}
          >
            AT CMDS
          </button>
        </div>

        {protoType === "MODBUS" && (
          <div className="space-y-4 animate-in fade-in">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-[10px]">Slave ID</Label>
                <Input
                  type="number"
                  value={mbParams.slaveId}
                  onChange={(e) =>
                    setMbParams({
                      ...mbParams,
                      slaveId: parseInt(e.target.value),
                    })
                  }
                  className="h-7 text-xs"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-[10px]">Function</Label>
                <Select
                  value={mbParams.functionCode}
                  onChange={(e) =>
                    setMbParams({
                      ...mbParams,
                      functionCode: parseInt(e.target.value),
                    })
                  }
                  className="h-7 text-xs"
                >
                  {MODBUS_FUNCTIONS.map((f) => (
                    <option key={f.code} value={f.code}>
                      {f.name}
                    </option>
                  ))}
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-[10px]">Addr (Dec)</Label>
                <Input
                  type="number"
                  value={mbParams.startAddress}
                  onChange={(e) =>
                    setMbParams({
                      ...mbParams,
                      startAddress: parseInt(e.target.value),
                    })
                  }
                  className="h-7 text-xs"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-[10px]">Value/Qty</Label>
                <Input
                  type="number"
                  value={mbParams.quantityOrValue}
                  onChange={(e) =>
                    setMbParams({
                      ...mbParams,
                      quantityOrValue: parseInt(e.target.value),
                    })
                  }
                  className="h-7 text-xs"
                />
              </div>
            </div>
            <Button
              size="sm"
              className="w-full text-xs gap-2"
              onClick={() =>
                updateCmd({
                  mode: "HEX",
                  payload: generateModbusFrame(mbParams),
                })
              }
            >
              <Check className="w-3 h-3" /> Apply to Payload
            </Button>
          </div>
        )}

        {protoType === "AT" && (
          <div className="space-y-4 animate-in fade-in">
            <div className="h-[300px] overflow-y-auto border rounded bg-background p-2 space-y-1">
              {Object.entries(AT_COMMAND_LIBRARY).map(([cat, cmds]) => (
                <div key={cat} className="mb-2">
                  <div className="text-[9px] font-bold text-muted-foreground uppercase mb-1 sticky top-0 bg-background/95 backdrop-blur">
                    {cat}
                  </div>
                  {cmds.map((c) => (
                    <div
                      key={c.cmd}
                      className="flex justify-between items-center p-1.5 hover:bg-muted rounded cursor-pointer group border border-transparent hover:border-border/50"
                      onClick={() =>
                        updateCmd({
                          mode: "TEXT",
                          payload: c.cmd,
                          description: c.desc,
                        })
                      }
                    >
                      <code className="text-[10px] font-bold text-primary">
                        {c.cmd}
                      </code>
                      <span className="text-[9px] text-muted-foreground">
                        {c.desc}
                      </span>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  return null;
};

export default CommandEditor;
