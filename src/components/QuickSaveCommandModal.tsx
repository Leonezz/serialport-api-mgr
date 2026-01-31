import React, { useState, useMemo } from "react";
import { createPortal } from "react-dom";
import { X, Save, Pencil, Cpu, Layers } from "lucide-react";
import { Button } from "./ui/Button";
import { Input } from "./ui/Input";
import { Label } from "./ui/Label";
import { SelectDropdown } from "./ui/Select";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter,
} from "./ui/Card";
import { Badge } from "./ui/Badge";
import { useStore } from "../lib/store";
import type { DataMode } from "../types";

interface Props {
  payload: string;
  mode: DataMode;
  onClose: () => void;
  onSaveAndEdit?: (commandId: string) => void;
}

const QuickSaveCommandModal: React.FC<Props> = ({
  payload,
  mode,
  onClose,
  onSaveAndEdit,
}) => {
  const {
    devices,
    selectedDeviceId,
    addCommand,
    addCommandToDevice,
    addToast,
  } = useStore();

  const [name, setName] = useState("");
  const [deviceId, setDeviceId] = useState<string>(selectedDeviceId || "");

  // Get the selected device for display
  const selectedDevice = useMemo(() => {
    return devices.find((d) => d.id === deviceId);
  }, [devices, deviceId]);

  const handleSave = (openEditor: boolean = false) => {
    if (!name.trim()) {
      addToast("error", "Validation Error", "Command name is required");
      return;
    }

    const timestamp = Date.now();
    const newId = addCommand({
      name: name.trim(),
      payload,
      mode,
      deviceId: deviceId || undefined,
      createdAt: timestamp,
      updatedAt: timestamp,
    });

    // If linked to a device, add to device's commandIds
    if (deviceId) {
      addCommandToDevice(deviceId, newId);
    }

    addToast(
      "success",
      "Command Saved",
      `"${name.trim()}" saved${selectedDevice ? ` to ${selectedDevice.name}` : ""}.`,
    );

    if (openEditor && onSaveAndEdit) {
      onSaveAndEdit(newId);
    }

    onClose();
  };

  return createPortal(
    <div
      className="fixed inset-0 bg-background/80 backdrop-blur-sm z-60 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <Card
        className="w-full max-w-md shadow-2xl border-border"
        onClick={(e) => e.stopPropagation()}
      >
        <CardHeader className="flex flex-row items-center justify-between pb-2 border-b border-border bg-muted/20">
          <CardTitle className="text-lg flex items-center gap-2">
            <Save className="w-5 h-5 text-primary" />
            Save as Command
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

        <CardContent className="pt-6 space-y-4">
          {/* Payload Preview */}
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Payload</Label>
            <div className="p-3 bg-muted/30 rounded-md border border-border">
              <code className="text-sm font-mono break-all">
                {payload || "(empty)"}
              </code>
            </div>
            <Badge variant="outline" className="text-[10px]">
              {mode}
            </Badge>
          </div>

          {/* Command Name */}
          <div className="space-y-2">
            <Label>Command Name *</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Read Sensor Data"
              autoFocus
            />
          </div>

          {/* Device Selection */}
          <div className="space-y-2">
            <Label className="flex items-center gap-1.5">
              <Cpu className="w-3.5 h-3.5 text-muted-foreground" />
              Device (Optional)
            </Label>
            <SelectDropdown
              options={[
                { value: "", label: "Personal Command" },
                ...devices.map((d) => ({
                  value: d.id,
                  label: d.name,
                })),
              ]}
              value={deviceId}
              onChange={setDeviceId}
              placeholder="Select device..."
            />
            {deviceId && (
              <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                <Layers className="w-3 h-3" />
                Will be added to {selectedDevice?.name}&apos;s command list
              </p>
            )}
          </div>
        </CardContent>

        <CardFooter className="flex justify-end gap-2 bg-muted/20 border-t border-border p-4">
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          {onSaveAndEdit && (
            <Button variant="outline" onClick={() => handleSave(true)}>
              <Pencil className="w-4 h-4 mr-2" />
              Save & Edit
            </Button>
          )}
          <Button onClick={() => handleSave(false)}>
            <Save className="w-4 h-4 mr-2" />
            Save
          </Button>
        </CardFooter>
      </Card>
    </div>,
    document.body,
  );
};

export default QuickSaveCommandModal;
