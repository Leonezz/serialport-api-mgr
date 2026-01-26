/**
 * Protocol Command Customizer
 *
 * Two-section UI for editing protocol-sourced commands:
 * - Protocol Layer (L1): Read-only display of protocol data
 * - Command Layer (L2): Editable user customizations
 *
 * Per PRD UI-3: Two-Section Layout
 */

import React, { useState, useMemo, useCallback } from "react";
import {
  Lock,
  Pencil,
  ChevronDown,
  ChevronRight,
  RefreshCw,
  Unlink,
  Plus,
  Trash2,
  Binary,
  Copy,
  Check,
} from "lucide-react";
import { Button } from "../ui/Button";
import { IconButton } from "../ui/IconButton";
import { Input } from "../ui/Input";
import { Textarea } from "../ui/Textarea";
import { SelectDropdown } from "../ui/Select";
import { DropdownOption } from "../ui/Dropdown";
import { Label } from "../ui/Label";
import { Badge } from "../ui/Badge";
import { Checkbox } from "../ui/Checkbox";
import { NumberInput } from "../ui/NumberInput";
import CodeEditor from "../ui/CodeEditor";
import VariableExtractionEditor from "../ui/VariableExtractionEditor";
import { cn, generateId } from "../../lib/utils";
import { useStore } from "../../lib/store";
import {
  syncProtocolLayer,
  commandNeedsSync,
  detachFromProtocol,
  getProtocolLayerDiff,
  type ProtocolLayerChange,
} from "../../lib/protocolIntegration";
import { buildStructuredMessage } from "../../lib/messageBuilder";
import { bytesToHex } from "../../lib/dataUtils";
import type {
  SavedCommand,
  CommandLayer,
  VariableSyntax,
  VariableExtractionRule,
  FramingConfig,
  FramingStrategy,
  ChecksumAlgorithm,
} from "../../types";

interface Props {
  command: SavedCommand;
  onUpdate: (updates: Partial<SavedCommand>) => void;
}

// Variable Syntax Options
const VARIABLE_SYNTAX_OPTIONS: {
  value: VariableSyntax;
  label: string;
}[] = [
  { value: "SHELL", label: "${name} (Default)" },
  { value: "MUSTACHE", label: "{{name}} (Mustache)" },
  { value: "BATCH", label: "%name% (Batch)" },
  { value: "COLON", label: ":name (SQL-like)" },
  { value: "BRACES", label: "{name} (Braces)" },
  { value: "CUSTOM", label: "Custom Regex" },
];

const FRAMING_STRATEGY_OPTIONS: DropdownOption<FramingStrategy>[] = [
  { value: "NONE", label: "None" },
  { value: "DELIMITER", label: "Delimiter" },
  { value: "TIMEOUT", label: "Timeout" },
  { value: "PREFIX_LENGTH", label: "Length-prefixed" },
  { value: "SCRIPT", label: "Custom Script" },
];

const CHECKSUM_OPTIONS: DropdownOption<ChecksumAlgorithm>[] = [
  { value: "NONE", label: "None" },
  { value: "MOD256", label: "MOD256" },
  { value: "XOR", label: "XOR" },
  { value: "CRC16", label: "CRC16" },
];

const ProtocolCommandCustomizer: React.FC<Props> = ({ command, onUpdate }) => {
  const { protocols, updateCommand, addToast } = useStore();

  const [protocolLayerExpanded, setProtocolLayerExpanded] = useState(true);
  const [commandLayerExpanded, setCommandLayerExpanded] = useState(true);
  const [binaryPreviewExpanded, setBinaryPreviewExpanded] = useState(true);
  const [copied, setCopied] = useState(false);
  const [showDiff, setShowDiff] = useState(false);

  // Get protocol info
  const protocol = useMemo(() => {
    if (!command.protocolLayer?.protocolId) return null;
    return protocols.find((p) => p.id === command.protocolLayer!.protocolId);
  }, [command.protocolLayer, protocols]);

  // Check if sync is needed
  const needsSync = useMemo(() => {
    return commandNeedsSync(command, protocols);
  }, [command, protocols]);

  // Compute diff when sync is needed
  const protocolDiff = useMemo(() => {
    if (!needsSync) return null;
    return getProtocolLayerDiff(command, protocols);
  }, [needsSync, command, protocols]);

  // Build binary preview for STRUCTURED commands
  const binaryPreview = useMemo(() => {
    if (!protocol || !command.protocolLayer?.messageStructureId) {
      return null;
    }

    const structure = protocol.messageStructures?.find(
      (s) => s.id === command.protocolLayer!.messageStructureId,
    );
    if (!structure) {
      return null;
    }

    try {
      // Build with empty params (shows default/static values)
      const result = buildStructuredMessage(structure, {
        params: {},
        bindings: [],
        staticBindings: [],
      });
      return {
        data: result.data,
        hex: bytesToHex(result.data, true, " "),
        size: result.data.length,
        error: null,
      };
    } catch (err) {
      return {
        data: null,
        hex: null,
        size: 0,
        error: err instanceof Error ? err.message : "Build failed",
      };
    }
  }, [protocol, command.protocolLayer?.messageStructureId]);

  // Copy hex to clipboard
  const handleCopyHex = useCallback(() => {
    if (binaryPreview?.hex) {
      navigator.clipboard.writeText(binaryPreview.hex);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [binaryPreview?.hex]);

  // Get the command layer (create empty if not exists)
  const commandLayer = command.commandLayer || {};

  // Update command layer helper
  const updateCommandLayer = (updates: Partial<CommandLayer>) => {
    onUpdate({
      commandLayer: { ...commandLayer, ...updates },
    });
  };

  // Handle sync from protocol
  const handleSync = () => {
    if (!protocol) return;
    const synced = syncProtocolLayer(command, protocol);
    updateCommand(command.id, synced);
    addToast("success", "Synced", "Protocol layer updated from source.");
  };

  // Handle detach from protocol
  const handleDetach = () => {
    const detached = detachFromProtocol(command, protocols);
    updateCommand(command.id, detached);
    addToast(
      "info",
      "Detached",
      "Command detached from protocol. Now a custom command.",
    );
  };

  // Don't render if not a protocol command
  if (command.source !== "PROTOCOL" || !command.protocolLayer) {
    return null;
  }

  const L1 = command.protocolLayer;

  return (
    <div className="flex flex-col h-full">
      {/* Header with sync/detach actions */}
      <div className="p-3 border-b border-border flex items-center justify-between bg-muted/10 shrink-0">
        <div className="flex items-center gap-2">
          <Badge
            variant="outline"
            className="text-xs bg-primary/5 border-primary/20 text-primary"
          >
            Protocol Command
          </Badge>
          {needsSync && (
            <Badge
              variant="outline"
              className="text-xs bg-amber-500/10 border-amber-500/30 text-amber-600"
            >
              Update Available
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-1">
          {needsSync && protocolDiff && protocolDiff.length > 0 && (
            <Button
              size="sm"
              variant="ghost"
              className={cn(
                "h-7 text-xs gap-1",
                showDiff && "bg-amber-500/10 text-amber-600",
              )}
              onClick={() => setShowDiff(!showDiff)}
            >
              {showDiff ? (
                <ChevronDown className="w-3 h-3" />
              ) : (
                <ChevronRight className="w-3 h-3" />
              )}
              View Changes ({protocolDiff.length})
            </Button>
          )}
          {needsSync && (
            <Button
              size="sm"
              variant="ghost"
              className="h-7 text-xs gap-1"
              onClick={handleSync}
            >
              <RefreshCw className="w-3 h-3" />
              Sync
            </Button>
          )}
          <Button
            size="sm"
            variant="ghost"
            className="h-7 text-xs gap-1 text-muted-foreground hover:text-destructive"
            onClick={handleDetach}
            title="Convert to custom command (loses protocol sync)"
          >
            <Unlink className="w-3 h-3" />
            Detach
          </Button>
        </div>
      </div>

      {/* Diff Panel */}
      {showDiff && protocolDiff && protocolDiff.length > 0 && (
        <div className="border-b border-border bg-amber-500/5 p-3 animate-in slide-in-from-top-1">
          <div className="text-[10px] font-bold text-amber-600 uppercase tracking-wider mb-2">
            Protocol Changes
          </div>
          <div className="space-y-2">
            {protocolDiff.map((change, idx) => (
              <div
                key={idx}
                className="p-2 bg-bg-surface rounded border border-border/50 space-y-1"
              >
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium">{change.label}</span>
                  <Badge
                    variant="outline"
                    className={cn(
                      "text-[9px]",
                      change.type === "added" &&
                        "border-green-500/30 text-green-600",
                      change.type === "removed" &&
                        "border-red-500/30 text-red-600",
                      change.type === "modified" &&
                        "border-amber-500/30 text-amber-600",
                    )}
                  >
                    {change.type}
                  </Badge>
                </div>
                <div className="grid grid-cols-2 gap-2 text-[10px]">
                  {change.type !== "added" && (
                    <div className="p-1.5 bg-red-500/5 rounded border border-red-500/20">
                      <div className="text-red-600/70 text-[9px] mb-0.5">
                        Current
                      </div>
                      <div className="font-mono text-red-600 truncate">
                        {change.oldValue === undefined
                          ? "(none)"
                          : typeof change.oldValue === "object"
                            ? JSON.stringify(change.oldValue)
                            : String(change.oldValue) || "(empty)"}
                      </div>
                    </div>
                  )}
                  {change.type !== "removed" && (
                    <div className="p-1.5 bg-green-500/5 rounded border border-green-500/20">
                      <div className="text-green-600/70 text-[9px] mb-0.5">
                        New
                      </div>
                      <div className="font-mono text-green-600 truncate">
                        {change.newValue === undefined
                          ? "(none)"
                          : typeof change.newValue === "object"
                            ? JSON.stringify(change.newValue)
                            : String(change.newValue) || "(empty)"}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
          <div className="mt-3 flex items-center gap-2">
            <Button
              size="sm"
              variant="default"
              className="h-7 text-xs gap-1"
              onClick={() => {
                handleSync();
                setShowDiff(false);
              }}
            >
              <RefreshCw className="w-3 h-3" />
              Apply Changes
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="h-7 text-xs"
              onClick={() => setShowDiff(false)}
            >
              Dismiss
            </Button>
          </div>
        </div>
      )}

      <div className="flex-1 overflow-y-auto custom-scrollbar">
        {/* Protocol Layer (L1) - Read-only */}
        <div className="border-b border-border">
          <button
            type="button"
            className={cn(
              "w-full flex items-center gap-2 px-4 py-2.5 text-left bg-muted/30 hover:bg-muted/50 transition-colors",
            )}
            onClick={() => setProtocolLayerExpanded(!protocolLayerExpanded)}
          >
            <IconButton
              variant="ghost"
              size="xs"
              aria-label={
                protocolLayerExpanded
                  ? "Collapse protocol layer"
                  : "Expand protocol layer"
              }
              className="shrink-0"
            >
              {protocolLayerExpanded ? (
                <ChevronDown className="w-3.5 h-3.5" />
              ) : (
                <ChevronRight className="w-3.5 h-3.5" />
              )}
            </IconButton>
            <Lock className="w-3.5 h-3.5 text-muted-foreground" />
            <span className="text-xs font-semibold">Protocol Layer</span>
            <span className="text-[10px] text-muted-foreground">
              (read-only)
            </span>
          </button>

          {protocolLayerExpanded && (
            <div className="p-4 space-y-4 animate-in slide-in-from-top-1 bg-muted/10">
              {/* Protocol Info */}
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span>From:</span>
                <Badge variant="outline" className="text-[10px]">
                  {protocol?.name || "Unknown Protocol"}
                </Badge>
                <span>v{L1.protocolVersion}</span>
              </div>

              {/* Payload */}
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Payload</Label>
                <div className="font-mono text-xs p-2 bg-muted/30 rounded border border-border/50 text-foreground/80">
                  {L1.payload || "(empty)"}
                </div>
              </div>

              {/* Mode & Encoding */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Mode</Label>
                  <div className="text-xs p-2 bg-muted/30 rounded border border-border/50">
                    {L1.mode}
                  </div>
                </div>
                {L1.encoding && (
                  <div className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground">
                      Encoding
                    </Label>
                    <div className="text-xs p-2 bg-muted/30 rounded border border-border/50">
                      {L1.encoding}
                    </div>
                  </div>
                )}
              </div>

              {/* Parameters */}
              {L1.parameters && L1.parameters.length > 0 && (
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">
                    Parameters ({L1.parameters.length})
                  </Label>
                  <div className="space-y-1">
                    {L1.parameters.map((param, idx) => (
                      <div
                        key={idx}
                        className="flex items-center gap-2 text-xs p-2 bg-muted/30 rounded border border-border/50"
                      >
                        <span className="font-mono text-primary">
                          ${param.name}
                        </span>
                        <Badge variant="outline" className="text-[9px]">
                          {param.type}
                        </Badge>
                        {param.required && (
                          <Badge
                            variant="outline"
                            className="text-[9px] border-destructive/30 text-destructive"
                          >
                            Required
                          </Badge>
                        )}
                        {param.defaultValue !== undefined && (
                          <span className="text-muted-foreground">
                            = {String(param.defaultValue)}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Message Structure (for STRUCTURED commands) */}
              {L1.messageStructureId && (
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">
                    Message Structure
                  </Label>
                  <div className="text-xs p-2 bg-muted/30 rounded border border-border/50">
                    {protocol?.messageStructures?.find(
                      (s) => s.id === L1.messageStructureId,
                    )?.name || L1.messageStructureId}
                  </div>
                </div>
              )}

              {/* Binary Preview */}
              {binaryPreview && (
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs text-muted-foreground flex items-center gap-1.5">
                      <Binary className="w-3 h-3" />
                      Binary Preview
                    </Label>
                    {binaryPreview.hex && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-5 px-1.5 text-[9px] gap-1"
                        onClick={handleCopyHex}
                      >
                        {copied ? (
                          <Check className="w-2.5 h-2.5 text-green-500" />
                        ) : (
                          <Copy className="w-2.5 h-2.5" />
                        )}
                        {copied ? "Copied" : "Copy"}
                      </Button>
                    )}
                  </div>
                  {binaryPreview.error ? (
                    <div className="text-xs p-2 bg-destructive/10 text-destructive rounded border border-destructive/30">
                      {binaryPreview.error}
                    </div>
                  ) : (
                    <div className="space-y-1">
                      <div className="font-mono text-[10px] p-2 bg-muted/30 rounded border border-border/50 text-foreground/80 break-all leading-relaxed">
                        {binaryPreview.hex}
                      </div>
                      <div className="text-[9px] text-muted-foreground">
                        {binaryPreview.size} byte
                        {binaryPreview.size !== 1 ? "s" : ""} (with default
                        values)
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Validation */}
              {L1.validation?.enabled && (
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">
                    Validation
                  </Label>
                  <div className="text-xs p-2 bg-muted/30 rounded border border-border/50 space-y-1">
                    {L1.validation.successPattern && (
                      <div>
                        Pattern:{" "}
                        <code className="font-mono">
                          {L1.validation.successPattern}
                        </code>
                      </div>
                    )}
                    {L1.validation.timeout && (
                      <div>Timeout: {L1.validation.timeout}ms</div>
                    )}
                  </div>
                </div>
              )}

              {/* Protocol Scripts */}
              {L1.protocolPreRequestScript && (
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">
                    Protocol Pre-Request Script
                  </Label>
                  <div className="font-mono text-[10px] p-2 bg-muted/30 rounded border border-border/50 text-foreground/70 whitespace-pre-wrap max-h-20 overflow-y-auto">
                    {L1.protocolPreRequestScript}
                  </div>
                </div>
              )}
              {L1.protocolPostResponseScript && (
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">
                    Protocol Post-Response Script
                  </Label>
                  <div className="font-mono text-[10px] p-2 bg-muted/30 rounded border border-border/50 text-foreground/70 whitespace-pre-wrap max-h-20 overflow-y-auto">
                    {L1.protocolPostResponseScript}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Command Layer (L2) - Editable */}
        <div>
          <button
            type="button"
            className={cn(
              "w-full flex items-center gap-2 px-4 py-2.5 text-left bg-primary/5 hover:bg-primary/10 transition-colors",
            )}
            onClick={() => setCommandLayerExpanded(!commandLayerExpanded)}
          >
            <IconButton
              variant="ghost"
              size="xs"
              aria-label={
                commandLayerExpanded
                  ? "Collapse command layer"
                  : "Expand command layer"
              }
              className="shrink-0"
            >
              {commandLayerExpanded ? (
                <ChevronDown className="w-3.5 h-3.5" />
              ) : (
                <ChevronRight className="w-3.5 h-3.5" />
              )}
            </IconButton>
            <Pencil className="w-3.5 h-3.5 text-primary" />
            <span className="text-xs font-semibold">Your Customizations</span>
            <span className="text-[10px] text-muted-foreground">
              (editable)
            </span>
          </button>

          {commandLayerExpanded && (
            <div className="p-4 space-y-6 animate-in slide-in-from-top-1">
              {/* Naming Overrides */}
              <div className="space-y-4">
                <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                  Naming Overrides
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs">Custom Name</Label>
                  <Input
                    value={commandLayer.customName || ""}
                    onChange={(e) =>
                      updateCommandLayer({
                        customName: e.target.value || undefined,
                      })
                    }
                    className="h-8 text-sm"
                    placeholder={command.name}
                  />
                  <p className="text-[9px] text-muted-foreground">
                    Override the display name for this command
                  </p>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs">Custom Description</Label>
                  <Textarea
                    value={commandLayer.customDescription || ""}
                    onChange={(e) =>
                      updateCommandLayer({
                        customDescription: e.target.value || undefined,
                      })
                    }
                    className="text-sm min-h-16"
                    placeholder={command.description || "Add a description..."}
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs">Group/Folder</Label>
                    <Input
                      value={commandLayer.group || ""}
                      onChange={(e) =>
                        updateCommandLayer({
                          group: e.target.value || undefined,
                        })
                      }
                      className="h-8 text-sm"
                      placeholder="e.g., Network"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Variable Syntax</Label>
                    <SelectDropdown
                      options={VARIABLE_SYNTAX_OPTIONS}
                      value={commandLayer.variableSyntax || "SHELL"}
                      onChange={(value) =>
                        updateCommandLayer({ variableSyntax: value })
                      }
                      size="sm"
                    />
                  </div>
                </div>
              </div>

              {/* Parameter Enhancements */}
              {L1.parameters && L1.parameters.length > 0 && (
                <div className="space-y-4 pt-4 border-t border-border/50">
                  <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                    Parameter Customizations
                  </div>

                  {L1.parameters.map((param) => {
                    const enhancement =
                      commandLayer.parameterEnhancements?.[param.name];
                    return (
                      <div
                        key={param.name}
                        className="p-3 border border-border rounded-lg space-y-3"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-mono text-xs text-primary">
                            ${param.name}
                          </span>
                          <Badge variant="outline" className="text-[9px]">
                            {param.type}
                          </Badge>
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                          <div className="space-y-1">
                            <Label className="text-[9px]">Custom Label</Label>
                            <Input
                              value={enhancement?.customLabel || ""}
                              onChange={(e) =>
                                updateCommandLayer({
                                  parameterEnhancements: {
                                    ...commandLayer.parameterEnhancements,
                                    [param.name]: {
                                      ...enhancement,
                                      customLabel: e.target.value || undefined,
                                    },
                                  },
                                })
                              }
                              className="h-7 text-xs"
                              placeholder={param.label || param.name}
                            />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-[9px]">Custom Default</Label>
                            <Input
                              value={String(enhancement?.customDefault ?? "")}
                              onChange={(e) =>
                                updateCommandLayer({
                                  parameterEnhancements: {
                                    ...commandLayer.parameterEnhancements,
                                    [param.name]: {
                                      ...enhancement,
                                      customDefault:
                                        e.target.value || undefined,
                                    },
                                  },
                                })
                              }
                              className="h-7 text-xs"
                              placeholder={String(param.defaultValue ?? "")}
                            />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* User Scripts */}
              <div className="space-y-4 pt-4 border-t border-border/50">
                <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                  User Scripts
                </div>
                <p className="text-[9px] text-muted-foreground">
                  These scripts run AFTER protocol scripts
                </p>

                <div className="space-y-3">
                  <Checkbox
                    checked={!!commandLayer.userPreRequestScript}
                    onChange={(e) =>
                      updateCommandLayer({
                        userPreRequestScript: e.target.checked
                          ? "// Runs after protocol pre-request script\n// Available: payload, params, log\nreturn payload;"
                          : undefined,
                      })
                    }
                    label="Pre-Request Script"
                    labelClassName="text-xs font-medium"
                  />

                  {commandLayer.userPreRequestScript && (
                    <div className="pl-6 animate-in slide-in-from-top-1">
                      <CodeEditor
                        value={commandLayer.userPreRequestScript}
                        onChange={(val) =>
                          updateCommandLayer({ userPreRequestScript: val })
                        }
                        height="100px"
                        className="border-l-4 border-l-blue-500/30"
                      />
                    </div>
                  )}
                </div>

                <div className="space-y-3">
                  <Checkbox
                    checked={!!commandLayer.userPostResponseScript}
                    onChange={(e) =>
                      updateCommandLayer({
                        userPostResponseScript: e.target.checked
                          ? "// Runs after protocol post-response script\n// Available: data, raw, setVar, params, log\nreturn true;"
                          : undefined,
                      })
                    }
                    label="Post-Response Script"
                    labelClassName="text-xs font-medium"
                  />

                  {commandLayer.userPostResponseScript && (
                    <div className="pl-6 animate-in slide-in-from-top-1">
                      <CodeEditor
                        value={commandLayer.userPostResponseScript}
                        onChange={(val) =>
                          updateCommandLayer({ userPostResponseScript: val })
                        }
                        height="120px"
                        className="border-l-4 border-l-emerald-500/30"
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Additional Extractions */}
              <div className="space-y-4 pt-4 border-t border-border/50">
                <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                  Additional Variable Extractions
                </div>
                <p className="text-[9px] text-muted-foreground">
                  Add your own extraction rules (extends protocol extractions)
                </p>

                <VariableExtractionEditor
                  rules={commandLayer.additionalExtractions || []}
                  onChange={(rules) =>
                    updateCommandLayer({ additionalExtractions: rules })
                  }
                />
              </div>

              {/* Overrides */}
              <div className="space-y-4 pt-4 border-t border-border/50">
                <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                  Overrides
                </div>

                <div className="space-y-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs">Timeout Override (ms)</Label>
                    <NumberInput
                      value={commandLayer.timeoutOverride ?? undefined}
                      onChange={(val) =>
                        updateCommandLayer({
                          timeoutOverride: val ?? undefined,
                        })
                      }
                      min={100}
                      max={60000}
                      defaultValue={2000}
                      className="h-8 text-xs"
                      placeholder={
                        L1.validation?.timeout
                          ? `Protocol: ${L1.validation.timeout}ms`
                          : "2000"
                      }
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs">Checksum Override</Label>
                    <SelectDropdown
                      options={CHECKSUM_OPTIONS}
                      value={commandLayer.checksumOverride || "NONE"}
                      onChange={(value) =>
                        updateCommandLayer({
                          checksumOverride:
                            value === "NONE" ? undefined : value,
                        })
                      }
                      size="sm"
                    />
                  </div>

                  <div className="space-y-2">
                    <Checkbox
                      checked={!!commandLayer.framingOverride}
                      onChange={(e) =>
                        updateCommandLayer({
                          framingOverride: e.target.checked
                            ? { strategy: "NONE" }
                            : undefined,
                        })
                      }
                      label="Override Framing Config"
                      labelClassName="text-xs"
                    />

                    {commandLayer.framingOverride && (
                      <div className="pl-6 space-y-2 animate-in slide-in-from-top-1">
                        <SelectDropdown
                          options={FRAMING_STRATEGY_OPTIONS}
                          value={commandLayer.framingOverride.strategy}
                          onChange={(value) =>
                            updateCommandLayer({
                              framingOverride: {
                                ...commandLayer.framingOverride!,
                                strategy: value,
                              },
                            })
                          }
                          size="sm"
                        />
                        {/* Additional framing config based on strategy can be added here */}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProtocolCommandCustomizer;
