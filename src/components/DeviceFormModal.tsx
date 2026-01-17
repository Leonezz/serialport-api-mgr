import React, { useState, useEffect } from "react";
import { Modal } from "./ui/Modal";
import { Button } from "./ui/Button";
import { Input } from "./ui/Input";
import { Label } from "./ui/Label";
import { Textarea } from "./ui/Textarea";
import { useStore } from "../lib/store";
import { generateId } from "../lib/utils";

const DeviceFormModal: React.FC = () => {
  const {
    showDeviceModal,
    editingDevice,
    setShowDeviceModal,
    setEditingDevice,
    addDevice,
    updateDevice,
    addToast,
  } = useStore();

  const [name, setName] = useState("");
  const [manufacturer, setManufacturer] = useState("");
  const [model, setModel] = useState("");
  const [description, setDescription] = useState("");
  const [icon, setIcon] = useState("cpu");

  useEffect(() => {
    if (editingDevice) {
      setName(editingDevice.name || "");
      setManufacturer(editingDevice.manufacturer || "");
      setModel(editingDevice.model || "");
      setDescription(editingDevice.description || "");
      setIcon(editingDevice.icon || "cpu");
    } else {
      setName("");
      setManufacturer("");
      setModel("");
      setDescription("");
      setIcon("cpu");
    }
  }, [editingDevice, showDeviceModal]);

  const handleSave = () => {
    if (!name.trim()) {
      addToast("error", "Validation Error", "Device name is required");
      return;
    }

    const deviceData = {
      name,
      manufacturer,
      model,
      description,
      icon,
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
        // eslint-disable-next-line react-hooks/purity
        createdAt: Date.now(),
        // eslint-disable-next-line react-hooks/purity
        updatedAt: Date.now(),
        presetIds: [],
        commandIds: [],
        sequenceIds: [],
        contextIds: [],
        attachments: [],
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
        <div className="space-y-2">
          <Label>Name</Label>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Arduino Uno"
            autoFocus
          />
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
        <div className="space-y-2">
          <Label>Description</Label>
          <Textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Optional notes about this device..."
          />
        </div>
      </div>
    </Modal>
  );
};

export default DeviceFormModal;
