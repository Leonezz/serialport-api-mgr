/**
 * Device Editor Page
 *
 * Full-page editor for Device definitions.
 * Contains tabs for:
 * - General: Name, manufacturer, model, description
 * - Attachments: Datasheets, manuals, images
 * - Bindings: Associated commands, sequences, presets
 */

import React, { useState, useMemo, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Settings,
  Paperclip,
  Link2,
  Save,
  Trash2,
  Plus,
  X,
  FileText,
  Image,
  File,
  Download,
  Upload,
  RefreshCw,
} from "lucide-react";
import { useStore } from "../lib/store";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { Label } from "../components/ui/Label";
import { Textarea } from "../components/ui/Textarea";
import { SelectDropdown } from "../components/ui/Select";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/Card";
import { Badge } from "../components/ui/Badge";
import { PageHeader } from "../routes";
import ConfirmationModal from "../components/ConfirmationModal";
import CommandFormModal from "../components/CommandFormModal";
import SequenceFormModal from "../components/SequenceFormModal";
import { cn, generateId } from "../lib/utils";
import { instantiateFromProtocol } from "../lib/protocolIntegration";
import { useProtocolSync } from "../hooks/useProtocolSync";
import type { Device, DeviceAttachment } from "../types";
import type { Protocol, CommandTemplate } from "../lib/protocolTypes";

// Tab definitions
type EditorTab = "general" | "attachments" | "bindings";

const TABS: { id: EditorTab; label: string; icon: React.ElementType }[] = [
  { id: "general", label: "General", icon: Settings },
  { id: "attachments", label: "Attachments", icon: Paperclip },
  { id: "bindings", label: "Bindings", icon: Link2 },
];

const ICON_OPTIONS = [
  { label: "Default (Cpu)", value: "" },
  { label: "Chip", value: "chip" },
  { label: "Radio", value: "radio" },
  { label: "Sensor", value: "sensor" },
  { label: "Motor", value: "motor" },
  { label: "Display", value: "display" },
];

interface DeviceEditorContentProps {
  device: Device;
}

const DeviceEditorContent: React.FC<DeviceEditorContentProps> = ({
  device,
}) => {
  const navigate = useNavigate();
  const {
    updateDevice,
    deleteDevice,
    addDeviceAttachment,
    removeDeviceAttachment,
    commands,
    sequences,
    presets,
    contexts,
    protocols,
    setContexts,
    assignToDevice,
    addToast,
    addCommand,
    addSequence,
  } = useStore();
  const id = device.id;

  const [activeTab, setActiveTab] = useState<EditorTab>("general");
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Bindings tab state - expandable sections
  const [showAllCommands, setShowAllCommands] = useState(false);
  const [showAllSequences, setShowAllSequences] = useState(false);
  const [showAllPresets, setShowAllPresets] = useState(false);

  // Modals for creating new items
  const [showCommandModal, setShowCommandModal] = useState(false);
  const [showSequenceModal, setShowSequenceModal] = useState(false);

  // Protocol commands expansion
  const [showAllProtocolCommands, setShowAllProtocolCommands] = useState(false);

  // Protocol sync
  const { syncNow, lastSyncTimestamp } = useProtocolSync();

  // Format relative time for last sync
  const formatLastSync = (timestamp: number | null): string => {
    if (!timestamp) return "Never synced";
    // eslint-disable-next-line react-hooks/purity -- Date.now() is intentionally called for time display
    const now = Date.now();
    const diff = now - timestamp;
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (seconds < 60) return "Just now";
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  };

  // Local edit state
  const [editState, setEditState] = useState<Device>(() => ({ ...device }));

  const updateField = <K extends keyof Device>(field: K, value: Device[K]) => {
    setEditState((prev) => ({ ...prev, [field]: value }));
    setHasUnsavedChanges(true);
  };

  const handleSave = () => {
    updateDevice(id, editState);
    setHasUnsavedChanges(false);
    addToast(
      "success",
      "Saved",
      `Device "${editState.name}" saved successfully.`,
    );
  };

  const handleDelete = () => {
    deleteDevice(id);
    addToast("success", "Deleted", `Device "${editState.name}" deleted.`);
    navigate("/devices");
  };

  // File upload handler
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    for (const file of Array.from(files)) {
      const reader = new FileReader();
      reader.onload = () => {
        const base64 = (reader.result as string).split(",")[1];
        const attachment: DeviceAttachment = {
          id: generateId(),
          name: file.name.replace(/\.[^/.]+$/, ""),
          filename: file.name,
          mimeType: file.type,
          size: file.size,
          data: base64,
          category: guessCategory(file.name, file.type),
        };
        addDeviceAttachment(id, attachment);
        setEditState((prev) => ({
          ...prev,
          attachments: [...(prev.attachments || []), attachment],
        }));
      };
      reader.readAsDataURL(file);
    }

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const guessCategory = (
    filename: string,
    mimeType: string,
  ): DeviceAttachment["category"] => {
    const lower = filename.toLowerCase();
    if (lower.includes("datasheet")) return "DATASHEET";
    if (lower.includes("manual") || lower.includes("guide")) return "MANUAL";
    if (lower.includes("schematic") || lower.includes("circuit"))
      return "SCHEMATIC";
    if (lower.includes("protocol") || lower.includes("spec")) return "PROTOCOL";
    if (mimeType.startsWith("image/")) return "IMAGE";
    return "OTHER";
  };

  const handleRemoveAttachment = (attachmentId: string) => {
    removeDeviceAttachment(id, attachmentId);
    setEditState((prev) => ({
      ...prev,
      attachments: (prev.attachments || []).filter(
        (a) => a.id !== attachmentId,
      ),
    }));
  };

  const handleDownloadAttachment = (attachment: DeviceAttachment) => {
    const link = document.createElement("a");
    link.href = `data:${attachment.mimeType};base64,${attachment.data}`;
    link.download = attachment.filename;
    link.click();
  };

  // Binding helpers
  const deviceCommands = commands.filter((c) => c.deviceId === id);
  const deviceSequences = sequences.filter((s) => s.deviceId === id);
  const devicePresets = presets.filter((p) =>
    (device.presetIds || []).includes(p.id),
  );

  const unassignedCommands = commands.filter((c) => !c.deviceId);
  const unassignedSequences = sequences.filter((s) => !s.deviceId);
  const unlinkedPresets = presets.filter(
    (p) => !(device.presetIds || []).includes(p.id),
  );

  // Protocol commands available from linked protocols
  const linkedProtocols = useMemo(() => {
    const bindings = device.protocols || [];
    return bindings
      .map((binding) => protocols.find((p) => p.id === binding.protocolId))
      .filter((p): p is Protocol => p !== undefined);
  }, [device.protocols, protocols]);

  // Get all commands from linked protocols that aren't already instantiated
  const availableProtocolCommands = useMemo(() => {
    const existingProtocolCommandIds = new Set(
      deviceCommands
        .filter((c) => c.source === "PROTOCOL" && c.protocolLayer)
        .map((c) => c.protocolLayer!.protocolCommandId),
    );

    const result: { protocol: Protocol; command: CommandTemplate }[] = [];
    for (const protocol of linkedProtocols) {
      for (const cmd of protocol.commands) {
        if (!existingProtocolCommandIds.has(cmd.id)) {
          result.push({ protocol, command: cmd });
        }
      }
    }
    return result;
  }, [linkedProtocols, deviceCommands]);

  // Visible items based on expanded state
  const VISIBLE_LIMIT = 5;

  const visibleProtocolCommands = showAllProtocolCommands
    ? availableProtocolCommands
    : availableProtocolCommands.slice(0, VISIBLE_LIMIT);
  const visibleUnassignedCommands = showAllCommands
    ? unassignedCommands
    : unassignedCommands.slice(0, VISIBLE_LIMIT);
  const visibleUnassignedSequences = showAllSequences
    ? unassignedSequences
    : unassignedSequences.slice(0, VISIBLE_LIMIT);
  const visibleUnlinkedPresets = showAllPresets
    ? unlinkedPresets
    : unlinkedPresets.slice(0, VISIBLE_LIMIT);

  // Add protocol command to device
  const handleAddProtocolCommand = (
    template: CommandTemplate,
    protocol: Protocol,
  ) => {
    const cmdData = instantiateFromProtocol(template, protocol, id);
    addCommand(cmdData);
    addToast(
      "success",
      "Command Added",
      `"${template.name}" added from ${protocol.name}.`,
    );
  };

  // Link/unlink preset handlers
  const handleLinkPreset = (presetId: string) => {
    const currentPresetIds = editState.presetIds || [];
    if (!currentPresetIds.includes(presetId)) {
      const newPresetIds = [...currentPresetIds, presetId];
      updateField("presetIds", newPresetIds);
      updateDevice(id, { presetIds: newPresetIds });
    }
  };

  const handleUnlinkPreset = (presetId: string) => {
    const currentPresetIds = editState.presetIds || [];
    const newPresetIds = currentPresetIds.filter((pid) => pid !== presetId);
    updateField("presetIds", newPresetIds);
    updateDevice(id, { presetIds: newPresetIds });
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const getAttachmentIcon = (category: DeviceAttachment["category"]) => {
    switch (category) {
      case "IMAGE":
        return Image;
      case "DATASHEET":
      case "MANUAL":
      case "PROTOCOL":
        return FileText;
      default:
        return File;
    }
  };

  return (
    <div className="flex flex-col h-full bg-background">
      <PageHeader
        title={`Edit: ${editState.name}`}
        backTo="/devices"
        backLabel="Devices"
        actions={
          <div className="flex items-center gap-2">
            {hasUnsavedChanges && (
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
          {activeTab === "general" && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Device Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Name</Label>
                  <Input
                    value={editState.name}
                    onChange={(e) => updateField("name", e.target.value)}
                    placeholder="Device name"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Manufacturer (Optional)</Label>
                    <Input
                      value={editState.manufacturer || ""}
                      onChange={(e) =>
                        updateField("manufacturer", e.target.value || undefined)
                      }
                      placeholder="e.g., Arduino, Espressif"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Model (Optional)</Label>
                    <Input
                      value={editState.model || ""}
                      onChange={(e) =>
                        updateField("model", e.target.value || undefined)
                      }
                      placeholder="e.g., ESP32-WROOM-32"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Icon</Label>
                  <SelectDropdown
                    value={editState.icon || ""}
                    onChange={(v) => updateField("icon", v || undefined)}
                    options={ICON_OPTIONS}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Description (Optional)</Label>
                  <Textarea
                    value={editState.description || ""}
                    onChange={(e) =>
                      updateField("description", e.target.value || undefined)
                    }
                    placeholder="Device description, notes, etc."
                    rows={4}
                  />
                </div>
              </CardContent>
            </Card>
          )}

          {activeTab === "attachments" && (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-base">Attachments</CardTitle>
                <div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    onChange={handleFileUpload}
                    className="hidden"
                    accept=".pdf,.doc,.docx,.txt,.png,.jpg,.jpeg,.gif,.svg"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-2"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Upload className="w-4 h-4" />
                    Upload Files
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {(editState.attachments || []).length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Paperclip className="w-12 h-12 mx-auto mb-4 opacity-30" />
                    <p className="mb-4">No attachments yet.</p>
                    <Button
                      variant="outline"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      Upload First File
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {(editState.attachments || []).map((attachment) => {
                      const Icon = getAttachmentIcon(attachment.category);
                      return (
                        <div
                          key={attachment.id}
                          className="flex items-center gap-3 p-3 border border-border rounded-lg group hover:bg-muted/50 transition-colors"
                        >
                          <div className="w-10 h-10 rounded bg-muted flex items-center justify-center">
                            <Icon className="w-5 h-5 text-muted-foreground" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium truncate">
                              {attachment.name}
                            </p>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <Badge variant="outline" className="text-[10px]">
                                {attachment.category}
                              </Badge>
                              <span>{formatFileSize(attachment.size)}</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() =>
                                handleDownloadAttachment(attachment)
                              }
                            >
                              <Download className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-destructive hover:text-destructive"
                              onClick={() =>
                                handleRemoveAttachment(attachment.id)
                              }
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {activeTab === "bindings" && (
            <div className="space-y-6">
              {/* Protocol Commands (from linked protocols) */}
              {linkedProtocols.length > 0 && (
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                      <CardTitle className="text-base">
                        Protocol Commands
                      </CardTitle>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Last sync: {formatLastSync(lastSyncTimestamp)}
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-1.5"
                      onClick={() => {
                        const result = syncNow();
                        if (result.synced === 0 && result.outdated === 0) {
                          addToast(
                            "info",
                            "All Synced",
                            "All protocol commands are up to date.",
                          );
                        }
                      }}
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      Sync All
                    </Button>
                  </CardHeader>
                  <CardContent>
                    {linkedProtocols.map((protocol) => (
                      <div key={protocol.id} className="mb-4 last:mb-0">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge variant="outline" className="text-xs">
                            {protocol.name}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            v{protocol.version}
                          </span>
                        </div>
                        {protocol.commands.length === 0 ? (
                          <p className="text-sm text-muted-foreground pl-2">
                            No commands defined in this protocol.
                          </p>
                        ) : null}
                      </div>
                    ))}

                    {availableProtocolCommands.length > 0 ? (
                      <div className="mt-4 pt-4 border-t border-border">
                        <div className="flex items-center justify-between mb-2">
                          <p className="text-sm text-muted-foreground">
                            Available to add ({availableProtocolCommands.length}
                            ):
                          </p>
                          {availableProtocolCommands.length > VISIBLE_LIMIT && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-auto py-1 px-2 text-xs"
                              onClick={() =>
                                setShowAllProtocolCommands(
                                  !showAllProtocolCommands,
                                )
                              }
                            >
                              {showAllProtocolCommands
                                ? "Show less"
                                : `Show all (${availableProtocolCommands.length})`}
                            </Button>
                          )}
                        </div>
                        <div className="space-y-2">
                          {visibleProtocolCommands.map(
                            ({ protocol, command }) => (
                              <div
                                key={`${protocol.id}-${command.id}`}
                                className="flex items-center justify-between p-3 border border-border rounded-lg hover:bg-muted/50 transition-colors"
                              >
                                <div className="flex-1 min-w-0">
                                  <p className="font-medium truncate">
                                    {command.name}
                                  </p>
                                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                    <span className="truncate">
                                      {protocol.name}
                                    </span>
                                    <span>•</span>
                                    <Badge
                                      variant="outline"
                                      className="text-[10px]"
                                    >
                                      {command.type}
                                    </Badge>
                                  </div>
                                </div>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="gap-1 ml-2"
                                  onClick={() =>
                                    handleAddProtocolCommand(command, protocol)
                                  }
                                >
                                  <Plus className="w-3 h-3" />
                                  Add
                                </Button>
                              </div>
                            ),
                          )}
                        </div>
                      </div>
                    ) : linkedProtocols.some((p) => p.commands.length > 0) ? (
                      <p className="text-sm text-muted-foreground text-center py-4">
                        All protocol commands have been added to this device.
                      </p>
                    ) : null}
                  </CardContent>
                </Card>
              )}

              {/* Assigned Commands */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="text-base">
                    Assigned Commands ({deviceCommands.length})
                  </CardTitle>
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-1"
                    onClick={() => setShowCommandModal(true)}
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Add New
                  </Button>
                </CardHeader>
                <CardContent>
                  {deviceCommands.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      No commands assigned to this device.
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {deviceCommands.map((cmd) => {
                        // Find protocol name for protocol-sourced commands
                        const protocolName =
                          cmd.source === "PROTOCOL" && cmd.protocolLayer
                            ? protocols.find(
                                (p) => p.id === cmd.protocolLayer?.protocolId,
                              )?.name
                            : null;

                        return (
                          <div
                            key={cmd.id}
                            className="flex items-center justify-between p-3 border border-border rounded-lg"
                          >
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <p className="font-medium truncate">
                                  {cmd.name}
                                </p>
                                {protocolName && (
                                  <Badge
                                    variant="secondary"
                                    className="text-[10px] shrink-0"
                                  >
                                    {protocolName}
                                  </Badge>
                                )}
                              </div>
                              {cmd.group && (
                                <p className="text-xs text-muted-foreground">
                                  {cmd.group}
                                </p>
                              )}
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() =>
                                assignToDevice("command", cmd.id, null)
                              }
                            >
                              Unassign
                            </Button>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {unassignedCommands.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-border">
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-sm text-muted-foreground">
                          Available to assign:
                        </p>
                        {unassignedCommands.length > VISIBLE_LIMIT && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-auto py-1 px-2 text-xs"
                            onClick={() => setShowAllCommands(!showAllCommands)}
                          >
                            {showAllCommands
                              ? "Show less"
                              : `Show all (${unassignedCommands.length})`}
                          </Button>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {visibleUnassignedCommands.map((cmd) => (
                          <Button
                            key={cmd.id}
                            variant="outline"
                            size="sm"
                            className="gap-1"
                            onClick={() =>
                              assignToDevice("command", cmd.id, id)
                            }
                          >
                            <Plus className="w-3 h-3" />
                            {cmd.name}
                          </Button>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Assigned Sequences */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="text-base">
                    Assigned Sequences ({deviceSequences.length})
                  </CardTitle>
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-1"
                    onClick={() => setShowSequenceModal(true)}
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Add New
                  </Button>
                </CardHeader>
                <CardContent>
                  {deviceSequences.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      No sequences assigned to this device.
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {deviceSequences.map((seq) => (
                        <div
                          key={seq.id}
                          className="flex items-center justify-between p-3 border border-border rounded-lg"
                        >
                          <div>
                            <p className="font-medium">{seq.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {seq.steps.length} steps
                            </p>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              assignToDevice("sequence", seq.id, null)
                            }
                          >
                            Unassign
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}

                  {unassignedSequences.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-border">
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-sm text-muted-foreground">
                          Available to assign:
                        </p>
                        {unassignedSequences.length > VISIBLE_LIMIT && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-auto py-1 px-2 text-xs"
                            onClick={() =>
                              setShowAllSequences(!showAllSequences)
                            }
                          >
                            {showAllSequences
                              ? "Show less"
                              : `Show all (${unassignedSequences.length})`}
                          </Button>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {visibleUnassignedSequences.map((seq) => (
                          <Button
                            key={seq.id}
                            variant="outline"
                            size="sm"
                            className="gap-1"
                            onClick={() =>
                              assignToDevice("sequence", seq.id, id)
                            }
                          >
                            <Plus className="w-3 h-3" />
                            {seq.name}
                          </Button>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Linked Presets */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="text-base">
                    Linked Presets ({devicePresets.length})
                  </CardTitle>
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-1"
                    onClick={() => navigate("/")}
                    title="Create presets by saving your serial configuration from the main workspace"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Create in Workspace
                  </Button>
                </CardHeader>
                <CardContent>
                  {devicePresets.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      No presets linked to this device.
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {devicePresets.map((preset) => (
                        <div
                          key={preset.id}
                          className="flex items-center justify-between p-3 border border-border rounded-lg"
                        >
                          <div>
                            <p className="font-medium">{preset.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {preset.type} •{" "}
                              {preset.config.baudRate?.toLocaleString()} baud
                            </p>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleUnlinkPreset(preset.id)}
                          >
                            Unlink
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}

                  {unlinkedPresets.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-border">
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-sm text-muted-foreground">
                          Available to link:
                        </p>
                        {unlinkedPresets.length > VISIBLE_LIMIT && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-auto py-1 px-2 text-xs"
                            onClick={() => setShowAllPresets(!showAllPresets)}
                          >
                            {showAllPresets
                              ? "Show less"
                              : `Show all (${unlinkedPresets.length})`}
                          </Button>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {visibleUnlinkedPresets.map((preset) => (
                          <Button
                            key={preset.id}
                            variant="outline"
                            size="sm"
                            className="gap-1"
                            onClick={() => handleLinkPreset(preset.id)}
                          >
                            <Plus className="w-3 h-3" />
                            {preset.name}
                          </Button>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>

      {deleteConfirm && (
        <ConfirmationModal
          title="Delete Device"
          message={`Are you sure you want to delete "${editState.name}"? This will not delete associated commands or sequences, but will unlink them from this device.`}
          confirmLabel="Delete"
          isDestructive
          onConfirm={handleDelete}
          onCancel={() => setDeleteConfirm(false)}
        />
      )}

      {/* Command Form Modal */}
      {showCommandModal && (
        <CommandFormModal
          initialData={{ deviceId: id }}
          sequences={sequences}
          contexts={contexts}
          onSave={(cmdData) => {
            addCommand({ ...cmdData, deviceId: id });
            setShowCommandModal(false);
            addToast(
              "success",
              "Created",
              "Command created and assigned to device.",
            );
          }}
          onClose={() => setShowCommandModal(false)}
          onCreateContext={(ctx) => setContexts((prev) => [...prev, ctx])}
          onUpdateContext={(ctx) =>
            setContexts((prev) => prev.map((c) => (c.id === ctx.id ? ctx : c)))
          }
        />
      )}

      {/* Sequence Form Modal */}
      {showSequenceModal && (
        <SequenceFormModal
          initialData={{ deviceId: id }}
          availableCommands={commands}
          onSave={(seqData) => {
            addSequence({ ...seqData, deviceId: id });
            setShowSequenceModal(false);
            addToast(
              "success",
              "Created",
              "Sequence created and assigned to device.",
            );
          }}
          onClose={() => setShowSequenceModal(false)}
        />
      )}
    </div>
  );
};

const DeviceEditorPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { devices } = useStore();

  const device = useMemo(() => devices.find((d) => d.id === id), [devices, id]);

  if (!device) {
    return (
      <div className="flex flex-col h-full bg-background">
        <PageHeader
          title="Device Not Found"
          backTo="/devices"
          backLabel="Devices"
        />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-xl font-semibold mb-2">Device Not Found</h2>
            <p className="text-muted-foreground mb-4">
              The device you&apos;re looking for doesn&apos;t exist or has been
              deleted.
            </p>
            <Button onClick={() => navigate("/devices")}>
              Back to Devices
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return <DeviceEditorContent key={device.id} device={device} />;
};

export default DeviceEditorPage;
