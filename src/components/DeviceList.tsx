import React from "react";
import { Link } from "react-router-dom";
import { useStore } from "../lib/store";
import {
  Plus,
  Cpu,
  Pencil,
  Trash2,
  Thermometer,
  Wifi,
  Box,
  Monitor,
  Server,
  ExternalLink,
} from "lucide-react";
import { cn } from "../lib/utils";
import { Button } from "./ui/Button";
import { EmptyState } from "./ui/EmptyState";

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
      <div className="flex items-center justify-between pb-1 sticky top-0 bg-card z-10">
        <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider flex items-center gap-2">
          <Cpu className="w-3 h-3" /> Devices
          <Link
            to="/devices"
            className="p-0.5 text-muted-foreground hover:text-primary transition-colors"
            title="Open Device Library"
          >
            <ExternalLink className="w-3 h-3" />
          </Link>
        </span>
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
          <EmptyState
            variant="devices"
            className="py-6"
            onAction={() => {
              setEditingDevice(null);
              setShowDeviceModal(true);
            }}
          />
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
                  <Pencil className="w-3 h-3" />
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
