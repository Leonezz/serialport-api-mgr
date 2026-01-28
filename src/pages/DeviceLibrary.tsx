/**
 * Device Library Page
 *
 * Displays all devices with their protocol bindings.
 * Provides CRUD operations for devices.
 */

import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Cpu, Edit, Trash2 } from "lucide-react";
import { useStore } from "../lib/store";
import { Button } from "../components/ui/Button";
import { PageHeader } from "../routes";
import ConfirmationModal from "../components/ConfirmationModal";
import DeviceFormModal from "../components/DeviceFormModal";
import { EmptyState } from "../components/ui/EmptyState";

const DeviceLibrary: React.FC = () => {
  const navigate = useNavigate();
  const { devices, setShowDeviceModal, setEditingDevice, deleteDevice } =
    useStore();

  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const handleAddDevice = () => {
    setEditingDevice(null);
    setShowDeviceModal(true);
  };

  const handleEditDevice = (deviceId: string) => {
    navigate(`/devices/${deviceId}/edit`);
  };

  const handleDeleteDevice = (id: string) => {
    deleteDevice(id);
    setDeleteConfirm(null);
  };

  return (
    <div className="flex flex-col h-full bg-background">
      <PageHeader
        title="Device Library"
        actions={
          <Button size="sm" className="gap-2" onClick={handleAddDevice}>
            <Plus className="w-4 h-4" />
            Add Device
          </Button>
        }
      />

      <div className="flex-1 overflow-auto p-6">
        <div className="max-w-7xl mx-auto">
          {devices.length === 0 ? (
            <EmptyState variant="devices" onAction={handleAddDevice} />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {devices.map((device) => (
                <div
                  key={device.id}
                  className="group p-4 border border-border rounded-lg hover:border-primary/50 hover:shadow-md transition-all"
                >
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Cpu className="w-5 h-5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold truncate">{device.name}</h3>
                      {device.manufacturer && (
                        <p className="text-xs text-muted-foreground">
                          {device.manufacturer}
                          {device.model && ` • ${device.model}`}
                        </p>
                      )}
                    </div>
                  </div>
                  {device.description && (
                    <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                      {device.description}
                    </p>
                  )}
                  <div className="text-xs text-muted-foreground mb-3">
                    {device.commandIds?.length || 0} command
                    {(device.commandIds?.length || 0) !== 1 ? "s" : ""} •{" "}
                    {device.attachments?.length || 0} attachment
                    {(device.attachments?.length || 0) !== 1 ? "s" : ""}
                  </div>
                  {/* Actions */}
                  <div className="flex items-center gap-2 pt-3 border-t border-border">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 gap-2"
                      onClick={() => handleEditDevice(device.id)}
                    >
                      <Edit className="w-3.5 h-3.5" />
                      Edit
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive hover:text-destructive"
                      onClick={() => setDeleteConfirm(device.id)}
                      title="Delete"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <ConfirmationModal
          title="Delete Device?"
          message={`Are you sure you want to delete "${devices.find((d) => d.id === deleteConfirm)?.name}"? Commands and sequences assigned to this device will be unlinked.`}
          confirmLabel="Delete"
          isDestructive
          onConfirm={() => handleDeleteDevice(deleteConfirm)}
          onCancel={() => setDeleteConfirm(null)}
        />
      )}

      {/* Device Form Modal */}
      <DeviceFormModal />
    </div>
  );
};

export default DeviceLibrary;
