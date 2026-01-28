import React from "react";
import { useStore } from "../../lib/store";
import { Plus, ArrowRight, Cpu, Pencil, BookOpen } from "lucide-react";
import { Button } from "../ui/Button";
import { AttachmentManager } from "../AttachmentManager";
import type { RightSidebarTab } from "../../types";

interface DevicePanelProps {
  activeTab: RightSidebarTab;
}

export const DevicePanel: React.FC<DevicePanelProps> = ({ activeTab }) => {
  const selectedDeviceId = useStore((state) => state.selectedDeviceId);
  const devices = useStore((state) => state.devices);
  const presets = useStore((state) => state.presets);
  const contexts = useStore((state) => state.contexts);
  const setLoadedPresetId = useStore((state) => state.setLoadedPresetId);
  const addToast = useStore((state) => state.addToast);

  const device = devices.find((d) => d.id === selectedDeviceId);

  if (!device) {
    return (
      <div className="h-full flex items-center justify-center text-muted-foreground opacity-50 p-8 text-center">
        <div className="space-y-2">
          <Cpu className="w-12 h-12 mx-auto opacity-10" />
          <p>Select a device to view its details.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Device Header */}
      <div className="p-4 border-b border-border bg-muted/20">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-lg text-primary">
            <Cpu className="w-5 h-5" />
          </div>
          <div className="flex-1 overflow-hidden">
            <h2 className="font-bold text-lg truncate">{device.name}</h2>
            {device.manufacturer && (
              <p className="text-xs text-muted-foreground truncate">
                {device.manufacturer} {device.model}
              </p>
            )}
          </div>
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <Pencil className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
        {activeTab === "device-info" && (
          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">
                Description
              </label>
              <p className="text-sm text-foreground/80 leading-relaxed italic bg-muted/30 p-3 rounded-md border border-border/50">
                {device.description || "No description provided."}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">
                  Manufacturer
                </label>
                <div className="text-sm font-medium">
                  {device.manufacturer || "N/A"}
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">
                  Model
                </label>
                <div className="text-sm font-medium">
                  {device.model || "N/A"}
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-border">
              <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                <span>
                  Created: {new Date(device.createdAt).toLocaleDateString()}
                </span>
                <span>
                  Updated: {new Date(device.updatedAt).toLocaleDateString()}
                </span>
              </div>
            </div>
          </div>
        )}

        {activeTab === "device-connections" && (
          <div className="space-y-3">
            <div className="flex items-center justify-between mb-2">
              <label className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">
                Associated Presets
              </label>
              <Button variant="ghost" size="icon" className="h-6 w-6">
                <Plus className="w-3.5 h-3.5" />
              </Button>
            </div>

            {device.presetIds.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground text-xs italic border border-dashed rounded-lg">
                No presets linked to this device
              </div>
            ) : (
              device.presetIds.map((pid) => {
                const preset = presets.find((p) => p.id === pid);
                if (!preset) return null;
                return (
                  <div
                    key={pid}
                    className="flex items-center justify-between p-3 rounded-lg border border-border bg-muted/20 hover:bg-muted/40 transition-colors group"
                  >
                    <div className="flex-1 overflow-hidden">
                      <div className="font-medium text-sm truncate">
                        {preset.name}
                      </div>
                      <div className="text-[10px] text-muted-foreground uppercase">
                        {preset.type}
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="default"
                      className="h-8 gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => {
                        setLoadedPresetId(preset.id);
                        addToast(
                          "info",
                          "Preset Loaded",
                          `Loaded connection settings for ${device.name}`,
                        );
                      }}
                    >
                      Connect <ArrowRight className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                );
              })
            )}
          </div>
        )}

        {activeTab === "device-attachments" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">
                Reference Material
              </label>
            </div>
            <AttachmentManager deviceId={device.id} />
          </div>
        )}

        {activeTab === "device-contexts" && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">
                Linked Documentation
              </label>
              <Button variant="ghost" size="icon" className="h-6 w-6">
                <Plus className="w-3.5 h-3.5" />
              </Button>
            </div>

            {device.contextIds.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground text-xs italic border border-dashed rounded-lg">
                No documentation linked
              </div>
            ) : (
              device.contextIds.map((cid) => {
                const ctx = contexts.find((c) => c.id === cid);
                if (!ctx) return null;
                return (
                  <div
                    key={cid}
                    className="p-3 rounded-lg border border-border bg-muted/20 hover:border-primary/30 transition-all cursor-pointer"
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <BookOpen className="w-3.5 h-3.5 text-primary" />
                      <span className="font-medium text-sm">{ctx.title}</span>
                    </div>
                    <p className="text-[10px] text-muted-foreground line-clamp-2 leading-relaxed">
                      {ctx.content}
                    </p>
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>
    </div>
  );
};
