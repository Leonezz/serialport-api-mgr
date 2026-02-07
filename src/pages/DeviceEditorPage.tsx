/**
 * Device Editor Page
 *
 * Full-page editor for Device definitions.
 * Contains tabs for:
 * - General: Name, manufacturer, model, description
 * - Attachments: Datasheets, manuals, images
 * - Presets: Serial configuration presets
 * - Commands: Device commands with protocol indicators
 */

import React, { useState, useMemo, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Settings,
  Paperclip,
  Save,
  Trash2,
  Plus,
  X,
  FileText,
  Image,
  File,
  Download,
  Upload,
  Terminal,
  Zap,
  LayoutGrid,
  List,
} from "lucide-react";
import { useStore } from "../lib/store";
import {
  Badge,
  Breadcrumb,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Input,
  Label,
  SelectDropdown,
  Textarea,
  workspaceItem,
} from "../components/ui";
import { PageHeader } from "../routes";
import ConfirmationModal from "../components/ConfirmationModal";
import CommandFormModal from "../components/CommandFormModal";
import { CommandCard, CommandListItem } from "../components/CommandViews";
import { cn, generateId } from "../lib/utils";
import { DeviceSchema } from "../lib/schemas";
import type { Device, DeviceAttachment, SavedCommand } from "../types";

// Tab definitions
type EditorTab = "general" | "attachments" | "presets" | "commands";

const TABS: { id: EditorTab; label: string; icon: React.ElementType }[] = [
  { id: "general", label: "General", icon: Settings },
  { id: "attachments", label: "Attachments", icon: Paperclip },
  { id: "presets", label: "Presets", icon: Zap },
  { id: "commands", label: "Commands", icon: Terminal },
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
    updateCommand,
    addSequence,
  } = useStore();
  const id = device.id;

  const [activeTab, setActiveTab] = useState<EditorTab>("general");
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Commands tab state
  const [commandsViewMode, setCommandsViewMode] = useState<"list" | "card">(
    "list",
  );
  const [showAllGlobalCommands, setShowAllGlobalCommands] = useState(false);
  const [showAllPresets, setShowAllPresets] = useState(false);

  // Modals for creating new items
  const [showCommandModal, setShowCommandModal] = useState(false);
  const [editingCommand, setEditingCommand] = useState<SavedCommand | null>(
    null,
  );

  const {
    register,
    watch,
    setValue,
    reset,
    formState: { isDirty },
  } = useForm<Device>({
    resolver: zodResolver(DeviceSchema),
    defaultValues: { ...device },
  });

  const editState = watch();

  const handleSave = () => {
    updateDevice(id, editState);
    reset(editState);
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
        setValue(
          "attachments",
          [...(editState.attachments || []), attachment],
          { shouldDirty: true },
        );
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
    setValue(
      "attachments",
      (editState.attachments || []).filter((a) => a.id !== attachmentId),
      { shouldDirty: true },
    );
  };

  const handleDownloadAttachment = (attachment: DeviceAttachment) => {
    const link = document.createElement("a");
    link.href = `data:${attachment.mimeType};base64,${attachment.data}`;
    link.download = attachment.filename;
    link.click();
  };

  // Data helpers
  // Get commands by commandIds (device stores references) OR by deviceId (direct assignment)
  const deviceCommandIds = new Set(editState.commandIds || []);
  const deviceCommands = commands.filter(
    (c) => deviceCommandIds.has(c.id) || c.deviceId === id,
  );
  const devicePresets = presets.filter((p) =>
    (device.presetIds || []).includes(p.id),
  );

  // Global commands are those not assigned to any device
  const assignedCommandIds = new Set(deviceCommands.map((c) => c.id));
  const globalCommands = commands.filter(
    (c) => !c.deviceId && !assignedCommandIds.has(c.id),
  );
  const unlinkedPresets = presets.filter(
    (p) => !(device.presetIds || []).includes(p.id),
  );

  // Visible items based on expanded state
  const VISIBLE_LIMIT = 5;

  const visibleGlobalCommands = showAllGlobalCommands
    ? globalCommands
    : globalCommands.slice(0, VISIBLE_LIMIT);
  const visibleUnlinkedPresets = showAllPresets
    ? unlinkedPresets
    : unlinkedPresets.slice(0, VISIBLE_LIMIT);

  // Link/unlink preset handlers
  const handleLinkPreset = (presetId: string) => {
    const currentPresetIds = editState.presetIds || [];
    if (!currentPresetIds.includes(presetId)) {
      const newPresetIds = [...currentPresetIds, presetId];
      setValue("presetIds", newPresetIds, { shouldDirty: true });
      updateDevice(id, { presetIds: newPresetIds });
    }
  };

  const handleUnlinkPreset = (presetId: string) => {
    const currentPresetIds = editState.presetIds || [];
    const newPresetIds = currentPresetIds.filter((pid) => pid !== presetId);
    setValue("presetIds", newPresetIds, { shouldDirty: true });
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
            { label: "Devices", href: "/devices" },
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
          {activeTab === "general" && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Device Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Name</Label>
                  <Input {...register("name")} placeholder="Device name" />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Manufacturer (Optional)</Label>
                    <Input
                      {...register("manufacturer")}
                      placeholder="e.g., Arduino, Espressif"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Model (Optional)</Label>
                    <Input
                      {...register("model")}
                      placeholder="e.g., ESP32-WROOM-32"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Icon</Label>
                  <SelectDropdown
                    value={editState.icon || ""}
                    onChange={(v) =>
                      setValue("icon", v || undefined, { shouldDirty: true })
                    }
                    options={ICON_OPTIONS}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Description (Optional)</Label>
                  <Textarea
                    {...register("description")}
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

          {activeTab === "presets" && (
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
                  Link Preset
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
          )}

          {activeTab === "commands" && (
            <div className="space-y-6">
              {/* Device Commands Section */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <div className="flex items-center gap-3">
                    <CardTitle className="text-base">
                      Device Commands ({deviceCommands.length})
                    </CardTitle>
                    {/* View Toggle: List / Card */}
                    <div className="flex gap-1 border border-border rounded-lg p-1">
                      <Button
                        variant={
                          commandsViewMode === "list" ? "default" : "ghost"
                        }
                        size="sm"
                        onClick={() => setCommandsViewMode("list")}
                      >
                        <List className="w-4 h-4" />
                      </Button>
                      <Button
                        variant={
                          commandsViewMode === "card" ? "default" : "ghost"
                        }
                        size="sm"
                        onClick={() => setCommandsViewMode("card")}
                      >
                        <LayoutGrid className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowCommandModal(true)}
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Add Command
                  </Button>
                </CardHeader>
                <CardContent>
                  {deviceCommands.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      No commands assigned to this device.
                    </p>
                  ) : (
                    <>
                      {/* LIST VIEW */}
                      {commandsViewMode === "list" && (
                        <div className="space-y-2">
                          {deviceCommands.map((cmd) => (
                            <CommandListItem
                              key={cmd.id}
                              command={cmd}
                              protocols={protocols}
                              onEdit={(command) => {
                                setEditingCommand(command);
                                setShowCommandModal(true);
                              }}
                            />
                          ))}
                        </div>
                      )}

                      {/* CARD VIEW */}
                      {commandsViewMode === "card" && (
                        <div className="grid grid-cols-2 gap-4">
                          {deviceCommands.map((cmd) => (
                            <CommandCard
                              key={cmd.id}
                              command={cmd}
                              protocols={protocols}
                              onEdit={(command) => {
                                setEditingCommand(command);
                                setShowCommandModal(true);
                              }}
                              editOnly
                            />
                          ))}
                        </div>
                      )}
                    </>
                  )}
                </CardContent>
              </Card>

              {/* Available Global Commands Section */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">
                    Available Global Commands ({globalCommands.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {globalCommands.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      No global commands available. All commands are assigned to
                      devices.
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {visibleGlobalCommands.map((cmd) => (
                        <div
                          key={cmd.id}
                          className="flex items-center justify-between p-3 border rounded-lg"
                        >
                          <div className="flex-1 min-w-0">
                            <p className="font-medium truncate">{cmd.name}</p>
                            <p className="text-xs text-muted-foreground truncate">
                              {cmd.description}
                            </p>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              assignToDevice("command", cmd.id, id);
                              addToast(
                                "success",
                                "Assigned",
                                `${cmd.name} assigned to ${editState.name}`,
                              );
                            }}
                          >
                            Assign
                          </Button>
                        </div>
                      ))}
                      {globalCommands.length > VISIBLE_LIMIT && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            setShowAllGlobalCommands(!showAllGlobalCommands)
                          }
                        >
                          {showAllGlobalCommands
                            ? "Show less"
                            : `Show all (${globalCommands.length})`}
                        </Button>
                      )}
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
          initialData={editingCommand || { deviceId: id }}
          sequences={sequences}
          contexts={contexts}
          onSave={(cmdData) => {
            if (editingCommand) {
              // Update existing command
              updateCommand(editingCommand.id, { ...cmdData, deviceId: id });
              addToast(
                "success",
                "Updated",
                `${cmdData.name} updated successfully.`,
              );
            } else {
              // Create new command
              addCommand({ ...cmdData, deviceId: id });
              addToast(
                "success",
                "Created",
                "Command created and assigned to device.",
              );
            }
            setShowCommandModal(false);
            setEditingCommand(null);
          }}
          onClose={() => {
            setShowCommandModal(false);
            setEditingCommand(null);
          }}
          onCreateContext={(ctx) => setContexts((prev) => [...prev, ctx])}
          onUpdateContext={(ctx) =>
            setContexts((prev) => prev.map((c) => (c.id === ctx.id ? ctx : c)))
          }
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
