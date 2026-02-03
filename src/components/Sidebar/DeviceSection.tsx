import React from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Plus,
  Layers,
  Pencil,
  ExternalLink,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import { Device } from "../../types";
import { IconButton } from "../ui/IconButton";
import { Badge } from "../ui/Badge";
import { EmptyState } from "../ui/EmptyState";
import { cn } from "../../lib/utils";
import { useStore } from "../../lib/store";

interface DeviceSectionProps {
  devices: Device[];
  selectedDeviceId: string | null;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}

const DeviceSection: React.FC<DeviceSectionProps> = ({
  devices,
  selectedDeviceId,
  isCollapsed,
  onToggleCollapse,
}) => {
  const navigate = useNavigate();

  return (
    <>
      <div
        className="h-8 flex items-center justify-between px-3 cursor-pointer hover:bg-bg-hover transition-colors border-b border-border-default"
        onClick={onToggleCollapse}
      >
        <div className="flex items-center gap-2">
          {isCollapsed ? (
            <ChevronRight className="w-4 h-4 text-text-muted" />
          ) : (
            <ChevronDown className="w-4 h-4 text-text-muted" />
          )}
          <span className="text-label-sm font-semibold text-text-secondary uppercase tracking-wider">
            Devices
          </span>
          <Badge variant="secondary" className="text-[10px] h-4 px-1.5 py-0">
            {devices.length}
          </Badge>
        </div>
        <div
          className="flex items-center gap-1"
          onClick={(e) => e.stopPropagation()}
        >
          <Link
            to="/devices"
            className="inline-flex items-center justify-center rounded-radius-sm transition-colors h-6 w-6 p-0.5 text-muted-foreground hover:bg-muted hover:text-foreground"
            aria-label="Open Device Library"
            title="Open Device Library"
          >
            <ExternalLink className="w-4 h-4" />
          </Link>
          <IconButton
            variant="ghost"
            size="xs"
            onClick={() => {
              useStore.getState().setEditingDevice(null);
              useStore.getState().setShowDeviceModal(true);
            }}
            aria-label="Add Device"
            title="Add Device"
          >
            <Plus className="w-3.5 h-3.5" />
          </IconButton>
        </div>
      </div>
      {!isCollapsed && (
        <div className="px-3 py-2 flex flex-col gap-1">
          <button
            onClick={() => useStore.getState().setSelectedDeviceId(null)}
            className={cn(
              "flex items-center gap-2 px-2 py-1.5 rounded-radius-sm text-body-sm transition-colors text-left",
              selectedDeviceId === null
                ? "bg-accent-primary/10 text-accent-primary font-medium"
                : "hover:bg-bg-hover text-text-muted",
            )}
            title="Show commands and sequences from all devices"
          >
            <Layers className="w-4 h-4" />
            <span>All Devices</span>
          </button>

          {devices.map((device) => (
            <div
              key={device.id}
              role="button"
              tabIndex={0}
              onClick={() => useStore.getState().setSelectedDeviceId(device.id)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  useStore.getState().setSelectedDeviceId(device.id);
                }
              }}
              className={cn(
                "group flex items-center justify-between px-2 py-1.5 rounded-radius-sm text-body-sm transition-colors cursor-pointer",
                selectedDeviceId === device.id
                  ? "bg-accent-primary/10 text-accent-primary border-l-2 border-accent-primary"
                  : "hover:bg-bg-hover",
              )}
            >
              <span className="truncate">{device.name}</span>
              <IconButton
                variant="ghost"
                size="xs"
                onClick={(e) => {
                  e.stopPropagation();
                  navigate(`/devices/${device.id}/edit`);
                }}
                className="opacity-0 group-hover:opacity-100 transition-opacity"
                aria-label="Edit Device"
                title="Edit Device"
              >
                <Pencil className="w-3 h-3" />
              </IconButton>
            </div>
          ))}

          {devices.length === 0 && (
            <EmptyState
              variant="devices"
              className="py-4"
              onAction={() => useStore.getState().setShowDeviceModal(true)}
            />
          )}
        </div>
      )}
    </>
  );
};

export default DeviceSection;
