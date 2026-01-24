import React, { useState, useEffect, useRef } from "react";
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
} from "lucide-react";
import { Modal } from "./ui/Modal";
import { Button } from "./ui/Button";
import { Input } from "./ui/Input";
import { Label } from "./ui/Label";
import { Textarea } from "./ui/Textarea";
import { SelectDropdown } from "./ui/Select";
import { DropdownOption } from "./ui/Dropdown";
import { FileInput, FileInputRef } from "./ui/FileInput";
import { useStore } from "../lib/store";
import { generateId } from "../lib/utils";
import type {
  DeviceAttachment,
  AttachmentCategory,
} from "../lib/protocolTypes";

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
    setShowDeviceModal,
    setEditingDevice,
    addDevice,
    updateDevice,
    addToast,
  } = useStore();

  const fileInputRef = useRef<FileInputRef>(null);

  // Tab state
  const [activeTab, setActiveTab] = useState<
    "basic" | "serial" | "protocols" | "attachments"
  >("basic");

  // Basic info state
  const [name, setName] = useState("");
  const [manufacturer, setManufacturer] = useState("");
  const [model, setModel] = useState("");
  const [serialNumber, setSerialNumber] = useState("");
  const [firmwareVersion, setFirmwareVersion] = useState("");
  const [description, setDescription] = useState("");
  const [icon, setIcon] = useState("cpu");

  // Serial options state
  const [baudRate, setBaudRate] = useState(115200);
  const [dataBits, setDataBits] = useState<"Five" | "Six" | "Seven" | "Eight">(
    "Eight",
  );
  const [stopBits, setStopBits] = useState<"One" | "Two">("One");
  const [parity, setParity] = useState<"None" | "Even" | "Odd">("None");
  const [flowControl, setFlowControl] = useState<
    "None" | "Hardware" | "Software"
  >("None");

  // Protocol bindings state
  const [selectedProtocols, setSelectedProtocols] = useState<string[]>([]);

  // Attachments state
  const [attachments, setAttachments] = useState<DeviceAttachment[]>([]);

  useEffect(() => {
    if (editingDevice) {
      setName(editingDevice.name || "");
      setManufacturer(editingDevice.manufacturer || "");
      setModel(editingDevice.model || "");
      setSerialNumber(editingDevice.serialNumber || "");
      setFirmwareVersion(editingDevice.firmwareVersion || "");
      setDescription(editingDevice.description || "");
      setIcon(editingDevice.icon || "cpu");

      // Serial options
      if (editingDevice.defaultSerialOptions) {
        setBaudRate(editingDevice.defaultSerialOptions.baudRate || 115200);
        setDataBits(editingDevice.defaultSerialOptions.dataBits || "Eight");
        setStopBits(editingDevice.defaultSerialOptions.stopBits || "One");
        setParity(editingDevice.defaultSerialOptions.parity || "None");
        setFlowControl(
          editingDevice.defaultSerialOptions.flowControl || "None",
        );
      }

      // Protocol bindings
      setSelectedProtocols(
        (editingDevice.protocols || []).map((p) => p.protocolId),
      );

      // Attachments
      setAttachments(editingDevice.attachments || []);
    } else {
      // Reset all fields
      setName("");
      setManufacturer("");
      setModel("");
      setSerialNumber("");
      setFirmwareVersion("");
      setDescription("");
      setIcon("cpu");
      setBaudRate(115200);
      setDataBits("Eight");
      setStopBits("One");
      setParity("None");
      setFlowControl("None");
      setSelectedProtocols([]);
      setAttachments([]);
    }
    setActiveTab("basic");
  }, [editingDevice, showDeviceModal]);

  const handleSave = () => {
    if (!name.trim()) {
      addToast("error", "Validation Error", "Device name is required");
      return;
    }

    // eslint-disable-next-line react-hooks/purity -- Event handler, not render
    const timestamp = Date.now();
    const deviceData = {
      name,
      manufacturer: manufacturer || undefined,
      model: model || undefined,
      serialNumber: serialNumber || undefined,
      firmwareVersion: firmwareVersion || undefined,
      description: description || undefined,
      icon,
      defaultSerialOptions: {
        baudRate,
        dataBits,
        stopBits,
        parity,
        flowControl,
      },
      protocols: selectedProtocols.map((protocolId) => ({
        protocolId,
        parameterDefaults: {},
      })),
      attachments,
    };

    if (editingDevice && editingDevice.id) {
      updateDevice(editingDevice.id, deviceData);
      addToast(
        "success",
        "Device Updated",
        `Device "${name}" updated successfully.`,
      );
    } else {
      addDevice({
        id: generateId(),
        ...deviceData,
        createdAt: timestamp,
        updatedAt: timestamp,
      });
      addToast(
        "success",
        "Device Created",
        `Device "${name}" created successfully.`,
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

        setAttachments((prev) => [...prev, newAttachment]);
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
    setAttachments((prev) => prev.filter((a) => a.id !== id));
  };

  const updateAttachmentCategory = (
    id: string,
    category: AttachmentCategory,
  ) => {
    setAttachments((prev) =>
      prev.map((a) => (a.id === id ? { ...a, category } : a)),
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

  const tabs = [
    { id: "basic" as const, label: "Basic Info" },
    { id: "serial" as const, label: "Serial Options" },
    { id: "protocols" as const, label: "Protocols" },
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
                  value={name}
                  onChange={(e) => setName(e.target.value)}
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
                      onClick={() => setIcon(iconOption.value)}
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
                  value={manufacturer}
                  onChange={(e) => setManufacturer(e.target.value)}
                  placeholder="e.g. Arduino"
                />
              </div>
              <div className="space-y-2">
                <Label>Model</Label>
                <Input
                  value={model}
                  onChange={(e) => setModel(e.target.value)}
                  placeholder="e.g. R3"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Serial Number</Label>
                <Input
                  value={serialNumber}
                  onChange={(e) => setSerialNumber(e.target.value)}
                  placeholder="Optional"
                />
              </div>
              <div className="space-y-2">
                <Label>Firmware Version</Label>
                <Input
                  value={firmwareVersion}
                  onChange={(e) => setFirmwareVersion(e.target.value)}
                  placeholder="e.g. 1.0.0"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
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
                  onChange={setBaudRate}
                />
              </div>
              <div className="space-y-2">
                <Label>Data Bits</Label>
                <SelectDropdown
                  options={DATA_BITS_OPTIONS}
                  value={dataBits}
                  onChange={setDataBits}
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Stop Bits</Label>
                <SelectDropdown
                  options={STOP_BITS_OPTIONS}
                  value={stopBits}
                  onChange={setStopBits}
                />
              </div>
              <div className="space-y-2">
                <Label>Parity</Label>
                <SelectDropdown
                  options={PARITY_OPTIONS}
                  value={parity}
                  onChange={setParity}
                />
              </div>
              <div className="space-y-2">
                <Label>Flow Control</Label>
                <SelectDropdown
                  options={FLOW_CONTROL_OPTIONS}
                  value={flowControl}
                  onChange={setFlowControl}
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
              Link protocols that this device supports. The first protocol (★)
              is used as the primary for command resolution.
            </p>

            <div className="space-y-2 max-h-64 overflow-y-auto">
              {/* Linked Protocols */}
              {selectedProtocols.map((protocolId, index) => {
                const protocol = protocols.find((p) => p.id === protocolId);
                if (!protocol) return null;
                const isPrimary = index === 0;
                const commandCount = protocol.commands?.length ?? 0;

                return (
                  <div
                    key={protocol.id}
                    className={`flex items-center gap-3 p-3 rounded-md border ${
                      isPrimary
                        ? "border-primary/50 bg-primary/5"
                        : "border-border"
                    }`}
                  >
                    {/* Star button for primary */}
                    <button
                      type="button"
                      onClick={() => {
                        if (!isPrimary) {
                          // Move to front
                          setSelectedProtocols((prev) => [
                            protocolId,
                            ...prev.filter((id) => id !== protocolId),
                          ]);
                        }
                      }}
                      className={`shrink-0 p-1 rounded transition-colors ${
                        isPrimary
                          ? "text-yellow-500"
                          : "text-muted-foreground/40 hover:text-yellow-500"
                      }`}
                      aria-label={
                        isPrimary
                          ? `${protocol.name} is primary protocol`
                          : `Set ${protocol.name} as primary protocol`
                      }
                    >
                      <Star
                        className={`w-4 h-4 ${isPrimary ? "fill-current" : ""}`}
                      />
                    </button>

                    <div className="flex-1 min-w-0">
                      <div className="font-medium flex items-center gap-2">
                        {protocol.name}
                        {isPrimary && (
                          <span className="text-[10px] uppercase tracking-wider text-primary font-semibold">
                            Primary
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
                        setSelectedProtocols((prev) =>
                          prev.filter((id) => id !== protocolId),
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
                          setSelectedProtocols((prev) => [...prev, protocolId]);
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
