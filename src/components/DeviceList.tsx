import React, { useState } from "react";
import { useStore } from "../lib/store";
import {
  Plus,
  Cpu,
  MoreVertical,
  Edit2,
  Trash2,
  Thermometer,
  Wifi,
  Box,
  Monitor,
  Server,
} from "lucide-react";
import { cn } from "../lib/utils";
import { Button } from "./ui/Button";

// Map icon strings to Lucide components
const ICON_MAP: Record<string, React.ElementType> = {
  cpu: Cpu,
  thermometer: Thermometer,
  wifi: Wifi,
  monitor: Monitor,
  server: Server,
  box: Box,
};

export const DeviceList: React.FC = () => {
  const devices = useStore((state) => state.devices);
  const selectedDeviceId = useStore((state) => state.selectedDeviceId);
  const setSelectedDeviceId = useStore((state) => state.setSelectedDeviceId);
  const deleteDevice = useStore((state) => state.deleteDevice);
  const setShowDeviceModal = useStore((state) => state.setShowDeviceModal);
  const setEditingDevice = useStore((state) => state.setEditingDevice);

  const handleDelete = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (confirm("Are you sure you want to delete this device?")) {
      deleteDevice(id);
      if (selectedDeviceId === id) {
        setSelectedDeviceId(null);
      }
    }
  };

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between px-2 py-1">
        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          Devices
        </h3>
        <Button
          variant="ghost"
          size="icon"
          className="h-5 w-5 hover:bg-muted/50"
          onClick={() => {
            setEditingDevice(null);
            setShowDeviceModal(true);
          }}
          title="Add Device"
        >
          <Plus className="w-3.5 h-3.5" />
        </Button>
      </div>

      <div className="space-y-0.5">
        {devices.length === 0 && (
          <div className="px-3 py-2 text-xs text-muted-foreground italic text-center border border-dashed rounded-md mx-2 bg-muted/20">
            No devices configured
          </div>
        )}

        {devices.map((device) => {
          const Icon =
            device.icon && ICON_MAP[device.icon] ? ICON_MAP[device.icon] : Box;
          const isSelected = selectedDeviceId === device.id;

          return (
            <div
              key={device.id}
              className={cn(
                "group flex items-center gap-2 px-2 py-1.5 mx-1 rounded-md text-sm transition-colors cursor-pointer relative",
                isSelected
                  ? "bg-primary/10 text-primary font-medium"
                  : "hover:bg-muted/50 text-foreground",
              )}
              onClick={() => setSelectedDeviceId(isSelected ? null : device.id)}
            >
              <Icon
                className={cn(
                  "w-4 h-4 shrink-0",
                  isSelected ? "text-primary" : "text-muted-foreground",
                )}
              />
              <span className="truncate flex-1">{device.name}</span>

              {/* Quick Actions (visible on hover) */}
              <div
                className={cn(
                  "absolute right-1 flex items-center gap-0.5 bg-background/80 backdrop-blur-sm rounded shadow-sm opacity-0 transition-opacity",
                  "group-hover:opacity-100",
                )}
              >
                <button
                  className="p-1 hover:bg-muted rounded text-muted-foreground"
                  onClick={(e) => {
                    e.stopPropagation();
                    setEditingDevice(device);
                    setShowDeviceModal(true);
                  }}
                  title="Edit Device"
                >
                  <Edit2 className="w-3 h-3" />
                </button>
                <button
                  className="p-1 hover:bg-destructive/10 hover:text-destructive rounded"
                  onClick={(e) => handleDelete(e, device.id)}
                  title="Delete Device"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
