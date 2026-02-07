import React, { useState, useRef, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Cpu,
  Radio,
  Server,
  Smartphone,
  Tablet,
  Monitor,
  Trash2,
  Upload,
  FileText,
  Image as ImageIcon,
  File,
  Star,
  X,
  Plus,
  Pencil,
  Terminal,
  Layers,
} from "lucide-react";
import {
  Button,
  DropdownOption,
  FileInput,
  FileInputRef,
  Input,
  Label,
  Modal,
  SelectDropdown,
  Textarea,
} from "./ui";
import { useStore } from "../lib/store";
import { generateId } from "../lib/utils";
import { DeviceAttachmentSchema } from "../lib/schemas";
import type {
  DeviceAttachment,
  AttachmentCategory,
} from "../lib/protocolTypes";

const DeviceFormSchema = z.object({
  name: z.string().min(1, "Name is required"),
  manufacturer: z.string().default(""),
  model: z.string().default(""),
  serialNumber: z.string().default(""),
  firmwareVersion: z.string().default(""),
  description: z.string().default(""),
  icon: z.string().default("cpu"),
  baudRate: z.number().default(115200),
  dataBits: z.enum(["Five", "Six", "Seven", "Eight"]).default("Eight"),
  stopBits: z.enum(["One", "Two"]).default("One"),
  parity: z.enum(["None", "Even", "Odd"]).default("None"),
  flowControl: z.enum(["None", "Hardware", "Software"]).default("None"),
  selectedProtocols: z.array(z.string()).default([]),
  defaultProtocolId: z.string().optional(),
  attachments: z.array(DeviceAttachmentSchema).default([]),
  localCommandIds: z.array(z.string()).default([]),
});

type DeviceFormData = z.infer<typeof DeviceFormSchema>;

const DEVICE_ICONS = [
  { value: "cpu", label: "CPU", icon: Cpu },
  { value: "radio", label: "Radio", icon: Radio },
  { value: "server", label: "Server", icon: Server },
  { value: "smartphone", label: "Smartphone", icon: Smartphone },
  { value: "tablet", label: "Tablet", icon: Tablet },
  { value: "monitor", label: "Monitor", icon: Monitor },
];

const ATTACHMENT_CATEGORY_OPTIONS: DropdownOption<AttachmentCategory>[] = [
  { value: "DATASHEET", label: "Datasheet" },
  { value: "MANUAL", label: "Manual" },
  { value: "SCHEMATIC", label: "Schematic" },
  { value: "PROTOCOL", label: "Protocol Spec" },
  { value: "IMAGE", label: "Image" },
  { value: "OTHER", label: "Other" },
];

const BAUD_RATE_OPTIONS: DropdownOption<number>[] = [
  300, 1200, 2400, 4800, 9600, 19200, 38400, 57600, 115200, 230400, 460800,
  921600,
].map((rate) => ({ value: rate, label: rate.toLocaleString() }));

const DATA_BITS_OPTIONS: DropdownOption<"Five" | "Six" | "Seven" | "Eight">[] =
  [
    { value: "Five", label: "5" },
    { value: "Six", label: "6" },
    { value: "Seven", label: "7" },
    { value: "Eight", label: "8" },
  ];

const STOP_BITS_OPTIONS: DropdownOption<"One" | "Two">[] = [
  { value: "One", label: "1" },
  { value: "Two", label: "2" },
];

const PARITY_OPTIONS: DropdownOption<"None" | "Even" | "Odd">[] = [
  { value: "None", label: "None" },
  { value: "Even", label: "Even" },
  { value: "Odd", label: "Odd" },
];

const FLOW_CONTROL_OPTIONS: DropdownOption<"None" | "Hardware" | "Software">[] =
  [
    { value: "None", label: "None" },
    { value: "Hardware", label: "Hardware (RTS/CTS)" },
    { value: "Software", label: "Software (XON/XOFF)" },
  ];

const DeviceFormModal: React.FC = () => {
  const {
    showDeviceModal,
    editingDevice,
    protocols,
    commands,
    setShowDeviceModal,
    setEditingDevice,
    addDevice,
    updateDevice,
    addCommandToDevice,
    removeCommandFromDevice,
    addToast,
  } = useStore();

  const fileInputRef = useRef<FileInputRef>(null);

  // Tab state (UI-only)
  const [activeTab, setActiveTab] = useState<
    "basic" | "serial" | "protocols" | "commands" | "attachments"
  >("basic");

  const { register, watch, setValue } = useForm<DeviceFormData>({
    resolver: zodResolver(DeviceFormSchema),
    defaultValues: {
      name: editingDevice?.name || "",
      manufacturer: editingDevice?.manufacturer || "",
      model: editingDevice?.model || "",
      serialNumber: editingDevice?.serialNumber || "",
      firmwareVersion: editingDevice?.firmwareVersion || "",
      description: editingDevice?.description || "",
      icon: editingDevice?.icon || "cpu",
      baudRate: editingDevice?.defaultSerialOptions?.baudRate || 115200,
      dataBits: editingDevice?.defaultSerialOptions?.dataBits || "Eight",
      stopBits: editingDevice?.defaultSerialOptions?.stopBits || "One",
      parity: editingDevice?.defaultSerialOptions?.parity || "None",
      flowControl: editingDevice?.defaultSerialOptions?.flowControl || "None",
      selectedProtocols: (editingDevice?.protocols || []).map(
        (p) => p.protocolId,
      ),
      defaultProtocolId: editingDevice?.defaultProtocolId,
      attachments: editingDevice?.attachments || [],
      localCommandIds: editingDevice?.commandIds || [],
    },
  });

  const name = watch("name");
  const icon = watch("icon");
  const baudRate = watch("baudRate");
  const dataBits = watch("dataBits");
  const stopBits = watch("stopBits");
  const parity = watch("parity");
  const flowControl = watch("flowControl");
  const selectedProtocols = watch("selectedProtocols");
  const attachments = watch("attachments");
  const localCommandIds = watch("localCommandIds");
  const defaultProtocolId = watch("defaultProtocolId");

  const handleSave = () => {
    const formData = watch();
    if (!formData.name.trim()) {
      addToast("error", "Validation Error", "Device name is required");
      return;
    }

    const deviceData = {
      name: formData.name,
      manufacturer: formData.manufacturer || undefined,
      model: formData.model || undefined,
      serialNumber: formData.serialNumber || undefined,
      firmwareVersion: formData.firmwareVersion || undefined,
      description: formData.description || undefined,
      icon: formData.icon,
      defaultSerialOptions: {
        baudRate: formData.baudRate,
        dataBits: formData.dataBits,
        stopBits: formData.stopBits,
        parity: formData.parity,
        flowControl: formData.flowControl,
      },
      protocols: formData.selectedProtocols.map((protocolId) => ({
        protocolId,
        parameterDefaults: {},
      })),
      defaultProtocolId: formData.defaultProtocolId || undefined,
      // Only include commandIds for new devices; existing devices manage this via store actions
      commandIds: editingDevice?.id ? undefined : formData.localCommandIds,
      attachments: formData.attachments,
    };

    if (editingDevice && editingDevice.id) {
      updateDevice(editingDevice.id, deviceData);
      addToast(
        "success",
        "Device Updated",
        `Device "${formData.name}" updated successfully.`,
      );
    } else {
      addDevice(deviceData);
      addToast(
        "success",
        "Device Created",
        `Device "${formData.name}" created successfully.`,
      );
    }

    handleClose();
  };

  const handleClose = () => {
    setShowDeviceModal(false);
    setEditingDevice(null);
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const reader = new FileReader();

      reader.onload = () => {
        const base64 = (reader.result as string).split(",")[1];
        const category = detectCategory(file.type, file.name);

        const newAttachment: DeviceAttachment = {
          id: generateId(),
          name: file.name.replace(/\.[^/.]+$/, ""),
          filename: file.name,
          mimeType: file.type,
          size: file.size,
          data: base64,
          category,
          createdAt: Date.now(),
        };

        const current = watch("attachments");
        setValue("attachments", [...current, newAttachment], {
          shouldDirty: true,
        });
      };

      reader.readAsDataURL(file);
    }

    // Reset input
    fileInputRef.current?.reset();
  };

  const detectCategory = (
    mimeType: string,
    filename: string,
  ): AttachmentCategory => {
    if (mimeType.startsWith("image/")) return "IMAGE";
    if (
      filename.toLowerCase().includes("datasheet") ||
      filename.toLowerCase().includes("spec")
    )
      return "DATASHEET";
    if (
      filename.toLowerCase().includes("manual") ||
      filename.toLowerCase().includes("guide")
    )
      return "MANUAL";
    if (
      filename.toLowerCase().includes("schematic") ||
      filename.toLowerCase().includes("circuit")
    )
      return "SCHEMATIC";
    if (
      filename.toLowerCase().includes("protocol") ||
      filename.toLowerCase().includes("interface")
    )
      return "PROTOCOL";
    return "OTHER";
  };

  const removeAttachment = (id: string) => {
    const current = watch("attachments");
    setValue(
      "attachments",
      current.filter((a) => a.id !== id),
      { shouldDirty: true },
    );
  };

  const updateAttachmentCategory = (
    id: string,
    category: AttachmentCategory,
  ) => {
    const current = watch("attachments");
    setValue(
      "attachments",
      current.map((a) => (a.id === id ? { ...a, category } : a)),
      { shouldDirty: true },
    );
  };

  const getAttachmentIcon = (mimeType: string) => {
    if (mimeType.startsWith("image/")) return ImageIcon;
    if (mimeType === "application/pdf") return FileText;
    return File;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const IconComponent = DEVICE_ICONS.find((i) => i.value === icon)?.icon || Cpu;

  // Get commands for this device
  // Use device.commandIds as source of truth (many-to-many relationship)
  // For new devices: use localCommandIds (commands to assign on save)
  const editingDeviceCommandIds = editingDevice?.commandIds;
  const editingDeviceId = editingDevice?.id;
  const deviceCommands = useMemo(() => {
    if (editingDeviceId) {
      // Existing device: filter commands by device.commandIds
      const commandIds = editingDeviceCommandIds || [];
      return commands.filter((cmd) => commandIds.includes(cmd.id));
    } else {
      // New device: use local tracking
      return commands.filter((cmd) => localCommandIds.includes(cmd.id));
    }
  }, [commands, editingDeviceId, editingDeviceCommandIds, localCommandIds]);

  // Group commands by category/group
  const groupedDeviceCommands = useMemo(() => {
    const groups: Record<string, typeof deviceCommands> = {};
    deviceCommands.forEach((cmd) => {
      const key = cmd.group || "Ungrouped";
      if (!groups[key]) groups[key] = [];
      groups[key].push(cmd);
    });
    return Object.entries(groups).sort(([a], [b]) => {
      if (a === "Ungrouped") return 1;
      if (b === "Ungrouped") return -1;
      return a.localeCompare(b);
    });
  }, [deviceCommands]);

  const tabs = [
    { id: "basic" as const, label: "Basic Info" },
    { id: "serial" as const, label: "Serial Options" },
    { id: "protocols" as const, label: "Protocols" },
    {
      id: "commands" as const,
      label: `Commands (${deviceCommands.length})`,
    },
    {
      id: "attachments" as const,
      label: `Attachments (${attachments.length})`,
    },
  ];

  return (
    <Modal
      isOpen={showDeviceModal}
      onClose={handleClose}
      title={editingDevice ? "Edit Device" : "Add New Device"}
      footer={
        <>
          <Button variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button onClick={handleSave}>Save Device</Button>
        </>
      }
    >
      <div className="space-y-4">
        {/* Tabs */}
        <div
          className="flex border-b border-border"
          role="tablist"
          aria-label="Device configuration tabs"
        >
          {tabs.map((tab) => (
            <button
              key={tab.id}
              role="tab"
              id={`${tab.id}-tab`}
              aria-selected={activeTab === tab.id}
              aria-controls={`${tab.id}-panel`}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? "border-b-2 border-primary text-primary"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Basic Info Tab */}
        {activeTab === "basic" && (
          <div
            role="tabpanel"
            id="basic-panel"
            aria-labelledby="basic-tab"
            className="space-y-4"
          >
            <div className="flex items-start gap-4">
              {/* Icon Preview */}
              <div className="w-16 h-16 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                <IconComponent className="w-8 h-8 text-primary" />
              </div>

              <div className="flex-1 space-y-2">
                <Label>Name *</Label>
                <Input
                  {...register("name")}
                  placeholder="e.g. Arduino Uno"
                  autoFocus
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Icon</Label>
              <div className="flex gap-2 flex-wrap">
                {DEVICE_ICONS.map((iconOption) => {
                  const Icon = iconOption.icon;
                  return (
                    <button
                      key={iconOption.value}
                      onClick={() =>
                        setValue("icon", iconOption.value, {
                          shouldDirty: true,
                        })
                      }
                      className={`p-2 rounded-md border transition-colors ${
                        icon === iconOption.value
                          ? "border-primary bg-primary/10"
                          : "border-border hover:border-primary/50"
                      }`}
                      aria-label={`Select ${iconOption.label} icon`}
                    >
                      <Icon className="w-5 h-5" />
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Manufacturer</Label>
                <Input
                  {...register("manufacturer")}
                  placeholder="e.g. Arduino"
                />
              </div>
              <div className="space-y-2">
                <Label>Model</Label>
                <Input {...register("model")} placeholder="e.g. R3" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Serial Number</Label>
                <Input {...register("serialNumber")} placeholder="Optional" />
              </div>
              <div className="space-y-2">
                <Label>Firmware Version</Label>
                <Input
                  {...register("firmwareVersion")}
                  placeholder="e.g. 1.0.0"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                {...register("description")}
                placeholder="Optional notes about this device..."
                rows={3}
              />
            </div>
          </div>
        )}

        {/* Serial Options Tab */}
        {activeTab === "serial" && (
          <div
            role="tabpanel"
            id="serial-panel"
            aria-labelledby="serial-tab"
            className="space-y-4"
          >
            <p className="text-sm text-muted-foreground">
              Default serial port settings when connecting to this device.
            </p>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Baud Rate</Label>
                <SelectDropdown
                  options={BAUD_RATE_OPTIONS}
                  value={baudRate}
                  onChange={(v) =>
                    setValue("baudRate", v, { shouldDirty: true })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Data Bits</Label>
                <SelectDropdown
                  options={DATA_BITS_OPTIONS}
                  value={dataBits}
                  onChange={(v) =>
                    setValue("dataBits", v, { shouldDirty: true })
                  }
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Stop Bits</Label>
                <SelectDropdown
                  options={STOP_BITS_OPTIONS}
                  value={stopBits}
                  onChange={(v) =>
                    setValue("stopBits", v, { shouldDirty: true })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Parity</Label>
                <SelectDropdown
                  options={PARITY_OPTIONS}
                  value={parity}
                  onChange={(v) => setValue("parity", v, { shouldDirty: true })}
                />
              </div>
              <div className="space-y-2">
                <Label>Flow Control</Label>
                <SelectDropdown
                  options={FLOW_CONTROL_OPTIONS}
                  value={flowControl}
                  onChange={(v) =>
                    setValue("flowControl", v, { shouldDirty: true })
                  }
                />
              </div>
            </div>
          </div>
        )}

        {/* Protocols Tab */}
        {activeTab === "protocols" && (
          <div
            role="tabpanel"
            id="protocols-panel"
            aria-labelledby="protocols-tab"
            className="space-y-4"
          >
            <p className="text-sm text-muted-foreground">
              Link protocols that this device supports. The default protocol (★)
              is used for new command creation.
            </p>

            <div className="space-y-2 max-h-64 overflow-y-auto">
              {/* Linked Protocols */}
              {selectedProtocols.map((protocolId, _index) => {
                const protocol = protocols.find((p) => p.id === protocolId);
                if (!protocol) return null;
                const isDefault = protocolId === defaultProtocolId;
                const commandCount = protocol.commands?.length ?? 0;

                return (
                  <div
                    key={protocol.id}
                    className={`flex items-center gap-3 p-3 rounded-md border ${
                      isDefault
                        ? "border-primary/50 bg-primary/5"
                        : "border-border"
                    }`}
                  >
                    {/* Star button for default protocol */}
                    <button
                      type="button"
                      onClick={() => {
                        setValue("defaultProtocolId", protocolId, {
                          shouldDirty: true,
                        });
                      }}
                      className={`shrink-0 p-1 rounded transition-colors ${
                        isDefault
                          ? "text-yellow-500"
                          : "text-muted-foreground/40 hover:text-yellow-500"
                      }`}
                      aria-label={
                        isDefault
                          ? `${protocol.name} is the default protocol`
                          : `Set ${protocol.name} as default protocol`
                      }
                      title={
                        isDefault
                          ? "Default protocol for new commands"
                          : "Click to set as default protocol"
                      }
                    >
                      <Star
                        className={`w-4 h-4 ${isDefault ? "fill-current" : ""}`}
                      />
                    </button>

                    <div className="flex-1 min-w-0">
                      <div className="font-medium flex items-center gap-2">
                        {protocol.name}
                        {isDefault && (
                          <span className="text-[10px] uppercase tracking-wider text-primary font-semibold">
                            DEFAULT
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {commandCount} command{commandCount !== 1 ? "s" : ""} •
                        v{protocol.version}
                      </div>
                    </div>

                    {/* Remove button */}
                    <button
                      type="button"
                      onClick={() =>
                        setValue(
                          "selectedProtocols",
                          selectedProtocols.filter((id) => id !== protocolId),
                          { shouldDirty: true },
                        )
                      }
                      className="shrink-0 p-1 rounded text-muted-foreground hover:text-destructive transition-colors"
                      aria-label={`Unlink ${protocol.name} protocol`}
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                );
              })}

              {/* Link Protocol Placeholder */}
              {(() => {
                const unlinkedProtocols = protocols.filter(
                  (p) => !selectedProtocols.includes(p.id),
                );
                if (unlinkedProtocols.length === 0 && protocols.length > 0) {
                  return null; // All protocols linked
                }

                return (
                  <div className="relative">
                    <SelectDropdown
                      options={
                        unlinkedProtocols.length > 0
                          ? unlinkedProtocols.map((p) => ({
                              value: p.id,
                              label: `${p.name} (${p.commands?.length ?? 0} cmds)`,
                            }))
                          : [{ value: "", label: "No protocols available" }]
                      }
                      value=""
                      onChange={(protocolId) => {
                        if (protocolId) {
                          setValue(
                            "selectedProtocols",
                            [...selectedProtocols, protocolId],
                            { shouldDirty: true },
                          );
                        }
                      }}
                      placeholder="+ Link Protocol..."
                      disabled={unlinkedProtocols.length === 0}
                    />
                  </div>
                );
              })()}

              {/* Empty state */}
              {protocols.length === 0 && (
                <div className="text-center py-8 text-muted-foreground border border-dashed rounded-md">
                  <Plus className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p>No protocols available</p>
                  <p className="text-xs mt-1">
                    Create protocols in the Protocol Library first.
                  </p>
                </div>
              )}
            </div>

            {selectedProtocols.length > 0 && (
              <div className="text-sm text-muted-foreground">
                {selectedProtocols.length} protocol
                {selectedProtocols.length !== 1 ? "s" : ""} linked
              </div>
            )}
          </div>
        )}

        {/* Commands Tab */}
        {activeTab === "commands" && (
          <div
            role="tabpanel"
            id="commands-panel"
            aria-labelledby="commands-tab"
            className="space-y-4"
          >
            <p className="text-sm text-muted-foreground">
              Commands owned by this device. These commands are associated with
              the device and can use its linked protocols.
            </p>

            <div className="space-y-3 max-h-64 overflow-y-auto">
              {deviceCommands.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground border border-dashed rounded-md">
                  <Terminal className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p>No commands for this device</p>
                  <p className="text-xs mt-1">
                    Commands can be added from the Command Library or created
                    directly.
                  </p>
                </div>
              ) : (
                groupedDeviceCommands.map(([groupName, cmds]) => (
                  <div key={groupName} className="space-y-2">
                    {groupName !== "Ungrouped" && (
                      <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground uppercase">
                        <Layers className="w-3 h-3" />
                        {groupName}
                      </div>
                    )}
                    {cmds.map((cmd) => {
                      // Find which protocol this command uses
                      const cmdProtocol = cmd.protocolLayer?.protocolId
                        ? (protocols.find(
                            (p) => p.id === cmd.protocolLayer?.protocolId,
                          ) ?? null)
                        : null;
                      if (cmd.protocolLayer?.protocolId && !cmdProtocol) {
                        console.warn(
                          `Protocol "${cmd.protocolLayer.protocolId}" not found for command "${cmd.name}" (${cmd.id})`,
                        );
                      }

                      return (
                        <div
                          key={cmd.id}
                          className="flex items-center gap-3 p-3 rounded-md border border-border bg-muted/20 group"
                        >
                          <Terminal className="w-4 h-4 text-muted-foreground shrink-0" />
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-sm flex items-center gap-2">
                              {cmd.name}
                              {cmdProtocol && (
                                <span className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                                  via {cmdProtocol.name}
                                </span>
                              )}
                            </div>
                            <div className="text-xs text-muted-foreground truncate">
                              {cmd.payload || "(no payload)"}
                            </div>
                          </div>
                          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              type="button"
                              className="p-1.5 rounded hover:bg-primary/10 text-muted-foreground hover:text-primary transition-colors"
                              title="Edit command"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                if (editingDevice?.id) {
                                  removeCommandFromDevice(
                                    editingDevice.id,
                                    cmd.id,
                                  );
                                } else {
                                  setValue(
                                    "localCommandIds",
                                    localCommandIds.filter(
                                      (id) => id !== cmd.id,
                                    ),
                                    { shouldDirty: true },
                                  );
                                }
                              }}
                              className="p-1.5 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                              title="Remove from device"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ))
              )}
            </div>

            {/* Add command section */}
            <div className="pt-2 border-t border-border">
              <div className="text-xs font-medium text-muted-foreground mb-2">
                Add existing command to device
              </div>
              {(() => {
                // For existing devices: filter out commands already in this device's commandIds
                // For new devices: filter out commands in localCommandIds
                // Note: Commands can belong to multiple devices (many-to-many)
                const deviceCommandIds = editingDevice?.commandIds || [];
                const availableCommands = editingDevice?.id
                  ? commands.filter((cmd) => !deviceCommandIds.includes(cmd.id))
                  : commands.filter((cmd) => !localCommandIds.includes(cmd.id));
                if (availableCommands.length === 0) {
                  return (
                    <p className="text-xs text-muted-foreground italic">
                      All commands are already linked to this device.
                    </p>
                  );
                }
                return (
                  <SelectDropdown
                    options={availableCommands.map((cmd) => ({
                      value: cmd.id,
                      label: `${cmd.name}${cmd.group ? ` (${cmd.group})` : ""}`,
                    }))}
                    value=""
                    onChange={(commandId) => {
                      if (commandId) {
                        if (editingDevice?.id) {
                          addCommandToDevice(editingDevice.id, commandId);
                        } else {
                          setValue(
                            "localCommandIds",
                            [...localCommandIds, commandId],
                            { shouldDirty: true },
                          );
                        }
                      }
                    }}
                    placeholder="+ Add command..."
                  />
                );
              })()}
            </div>

            <div className="text-sm text-muted-foreground">
              {deviceCommands.length} command
              {deviceCommands.length !== 1 ? "s" : ""} linked
            </div>
          </div>
        )}

        {/* Attachments Tab */}
        {activeTab === "attachments" && (
          <div
            role="tabpanel"
            id="attachments-panel"
            aria-labelledby="attachments-tab"
            className="space-y-4"
          >
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Attach datasheets, manuals, or other documentation.
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.open()}
                className="gap-2"
              >
                <Upload className="w-4 h-4" />
                Add File
              </Button>
              <FileInput
                ref={fileInputRef}
                multiple
                onChange={handleFileSelect}
                accept=".pdf,.doc,.docx,.txt,.png,.jpg,.jpeg,.gif,.svg"
              />
            </div>

            <div className="space-y-2 max-h-64 overflow-y-auto">
              {attachments.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground border border-dashed rounded-md">
                  <Upload className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p>No attachments yet</p>
                  <p className="text-xs mt-1">
                    Click &quot;Add File&quot; to upload documents
                  </p>
                </div>
              ) : (
                attachments.map((attachment) => {
                  const FileIcon = getAttachmentIcon(attachment.mimeType);
                  return (
                    <div
                      key={attachment.id}
                      className="flex items-center gap-3 p-3 rounded-md border border-border bg-muted/20"
                    >
                      <FileIcon className="w-8 h-8 text-muted-foreground shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="font-medium truncate">
                          {attachment.name}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {attachment.filename} •{" "}
                          {formatFileSize(attachment.size)}
                        </div>
                      </div>
                      <div className="w-28">
                        <SelectDropdown
                          options={ATTACHMENT_CATEGORY_OPTIONS}
                          value={attachment.category}
                          onChange={(value) =>
                            updateAttachmentCategory(attachment.id, value)
                          }
                          size="sm"
                        />
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeAttachment(attachment.id)}
                        className="h-8 w-8 text-muted-foreground hover:text-destructive"
                        aria-label={`Remove ${attachment.name} attachment`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};

export default DeviceFormModal;
