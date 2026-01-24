import React, { useState, useEffect } from "react";
import {
  Sliders,
  ChevronsRight,
  ChevronsLeft,
  MessageSquare,
  Settings,
  Check,
  FileCode,
  CheckCircle2,
  Cpu,
  ArrowLeft,
  X,
  Trash2,
  type LucideIcon,
} from "lucide-react";
import { cn } from "../lib/utils";
import { useStore } from "../lib/store";
import { useTranslation } from "react-i18next";
import { Button } from "./ui/Button";
import { IconButton } from "./ui/IconButton";
import { TabRailButton } from "./ui/TabRailButton";
import { Badge } from "./ui/Badge";
import type { RightSidebarTab } from "../types";
import AIAssistantContent from "./RightSidebar/AIAssistantContent";
import CommandEditor from "./RightSidebar/CommandEditor";
import { DevicePanel } from "./RightSidebar/DevicePanel";

const RightSidebar: React.FC = () => {
  const { t } = useTranslation();
  const {
    selectedCommandId,
    selectedDeviceId,
    commands,
    updateCommand,
    rightSidebarTab,
    setRightSidebarTab,
    editingCommand,
    setEditingCommand,
    addToast,
    rightSidebarCollapsed,
    setRightSidebarCollapsed,
  } = useStore();

  const [width, setWidth] = useState(400);
  const [isResizing, setIsResizing] = useState(false);

  const selectedCommand = commands.find((c) => c.id === selectedCommandId);

  // Sync: When selected ID changes, load it into editing draft
  useEffect(() => {
    if (selectedCommandId) {
      const cmd = commands.find((c) => c.id === selectedCommandId);
      if (cmd) {
        // If we are switching commands, verify if we should save previous?
        // For now, just overwrite the draft with the new selection to keep it simple "Select -> Edit" model.
        setEditingCommand({ ...cmd });
      }
    } else {
      setEditingCommand(null);
    }
  }, [selectedCommandId, commands, setEditingCommand]);

  // Sync: When selectedDeviceId changes, switch to device tab if not collapsed
  useEffect(() => {
    if (selectedDeviceId) {
      setRightSidebarTab("device");
      if (rightSidebarCollapsed) setRightSidebarCollapsed(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDeviceId]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing) return;
      const newWidth = window.innerWidth - e.clientX;
      if (newWidth >= 320 && newWidth <= 600) setWidth(newWidth);
    };
    const handleMouseUp = () => setIsResizing(false);
    if (isResizing) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
    }
    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isResizing]);

  const handleSave = () => {
    if (selectedCommandId && editingCommand) {
      // Ensure ID matches
      if (editingCommand.id !== selectedCommandId) {
        // This shouldn't happen in normal flow, but safety check
        return;
      }
      updateCommand(selectedCommandId, editingCommand);
      addToast(
        "success",
        t("toast.saved"),
        `Command "${editingCommand.name}" updated.`,
      );
    }
  };

  // Group tabs: main tabs (AI, Device) and command editor tabs
  const mainTabs: { id: RightSidebarTab; icon: LucideIcon; label: string }[] = [
    { id: "ai", icon: MessageSquare, label: "AI Assistant" },
    { id: "device", icon: Cpu, label: "Device Info" },
  ];

  // Command Editor tabs matching FIGMA-DESIGN.md spec
  const editorTabs: { id: RightSidebarTab; icon: LucideIcon; label: string }[] =
    [
      { id: "basic", icon: Settings, label: t("cmd.tab.basic") },
      { id: "params", icon: Sliders, label: t("cmd.tab.params") },
      { id: "validation", icon: CheckCircle2, label: t("cmd.tab.validation") },
      { id: "scripting", icon: FileCode, label: t("cmd.tab.scripting") },
    ];

  const isEditorTab = rightSidebarTab !== "ai" && rightSidebarTab !== "device";

  // Auto-switch to AI tab if no command is selected and currently on editor tab
  useEffect(() => {
    if (!selectedCommandId && isEditorTab) {
      setRightSidebarTab("ai");
    }
  }, [selectedCommandId, isEditorTab, setRightSidebarTab]);

  return (
    <div
      style={{ width: rightSidebarCollapsed ? 48 : width }}
      className="bg-bg-surface border-l border-border-default flex flex-row shadow-xl h-full relative shrink-0 transition-[width] duration-200 ease-in-out z-40 overflow-hidden"
    >
      {/* Resize Handle */}
      {!rightSidebarCollapsed && (
        <div
          onMouseDown={(e) => {
            e.preventDefault();
            setIsResizing(true);
          }}
          className="absolute left-0 top-0 bottom-0 w-2 cursor-col-resize hover:bg-primary/20 transition-colors z-50 flex items-center justify-center group/handle"
        >
          <div className="h-10 w-0.5 bg-border rounded-full group-hover/handle:bg-primary/50 transition-colors" />
        </div>
      )}

      {/* Vertical Tab Rail */}
      <div className="w-12 flex flex-col items-center py-3 gap-3 bg-bg-muted/20 border-r border-border-default shrink-0 z-10">
        <IconButton
          variant="ghost"
          size="md"
          onClick={() => setRightSidebarCollapsed(!rightSidebarCollapsed)}
          aria-label={
            rightSidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"
          }
          title={rightSidebarCollapsed ? "Expand" : "Collapse"}
          className="mb-2"
        >
          {rightSidebarCollapsed ? (
            <ChevronsLeft className="w-4 h-4" />
          ) : (
            <ChevronsRight className="w-4 h-4" />
          )}
        </IconButton>

        {/* Main Tabs: AI & Device */}
        {mainTabs.map((tab) => (
          <TabRailButton
            key={tab.id}
            icon={tab.icon}
            label={tab.label}
            isActive={rightSidebarTab === tab.id && !rightSidebarCollapsed}
            onClick={() => {
              setRightSidebarTab(tab.id);
              if (rightSidebarCollapsed) setRightSidebarCollapsed(false);
            }}
          />
        ))}
      </div>

      {/* Content Area */}
      <div
        className={cn(
          "flex-1 overflow-hidden flex flex-col bg-background/50 transition-opacity duration-200 relative",
          rightSidebarCollapsed
            ? "opacity-0 pointer-events-none"
            : "opacity-100",
        )}
      >
        {/* 48px Header - Section 8.4 */}
        {isEditorTab && selectedCommand && (
          <div className="shrink-0">
            {/* 48px Header Row */}
            <div className="h-12 flex items-center justify-between px-3 border-b border-border-default bg-bg-surface">
              <div className="flex items-center gap-2 overflow-hidden">
                <IconButton
                  variant="ghost"
                  size="sm"
                  onClick={() => setRightSidebarTab("ai")}
                  aria-label="Back to main panel"
                  title="Back"
                >
                  <ArrowLeft className="w-4 h-4" />
                </IconButton>
                <Badge
                  variant="secondary"
                  className="uppercase text-[10px] font-semibold px-2 py-0.5"
                >
                  Command
                </Badge>
                <span className="font-semibold text-body-sm text-text-primary truncate">
                  {editingCommand?.name || selectedCommand.name}
                </span>
              </div>
              <IconButton
                variant="ghost"
                size="sm"
                onClick={() => {
                  // Clear selection and go back to AI tab
                  useStore.getState().setSelectedCommandId(null);
                  setRightSidebarTab("ai");
                }}
                aria-label="Close editor"
                title="Close"
              >
                <X className="w-4 h-4" />
              </IconButton>
            </div>
            {/* 24px Metadata Row */}
            <div className="h-6 flex items-center px-3 text-text-muted text-label-sm border-b border-border-default bg-bg-muted/30">
              <span>
                Version: 1.0.0 • Modified:{" "}
                {editingCommand?.updatedAt
                  ? new Date(editingCommand.updatedAt).toLocaleString()
                  : "Never"}
              </span>
            </div>
            {/* 44px Horizontal Tab Bar - Section 8.4 (Icons only for narrow sidebar) */}
            <div className="h-11 flex items-center justify-start px-3 gap-1 border-b border-border-default bg-bg-surface">
              {editorTabs.map((tab) => {
                const isActive = rightSidebarTab === tab.id;
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setRightSidebarTab(tab.id)}
                    title={tab.label}
                    className={cn(
                      "flex items-center justify-center w-9 h-9 rounded-radius-sm transition-colors relative",
                      isActive
                        ? "text-accent-primary bg-accent-primary/10"
                        : "text-text-muted hover:text-text-primary hover:bg-bg-hover",
                    )}
                  >
                    <Icon className="w-4 h-4" />
                    {/* Active indicator dot */}
                    {isActive && (
                      <div className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-accent-primary rounded-full" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        <div className="flex-1 overflow-hidden relative flex flex-col">
          {rightSidebarTab === "ai" ? (
            <AIAssistantContent />
          ) : rightSidebarTab === "device" ? (
            <DevicePanel />
          ) : // Render shared Editor but tell it which tab is active
          // If no command selected, show placeholder
          selectedCommand ? (
            <CommandEditor activeTab={rightSidebarTab} />
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-muted-foreground opacity-50 space-y-4 text-center p-8">
              <Settings className="w-12 h-12 opacity-10" />
              <p className="text-sm">Select a command to configure.</p>
            </div>
          )}
        </div>

        {/* 64px Action Bar - Section 8.4 */}
        {isEditorTab && selectedCommand && (
          <div className="h-16 px-4 border-t border-border-default bg-bg-surface flex items-center justify-between shrink-0 z-10">
            {/* Delete button on left */}
            <Button
              variant="ghost"
              onClick={() => {
                // TODO: Add confirmation dialog for delete
                useStore.getState().deleteCommand(selectedCommandId!);
                setRightSidebarTab("ai");
              }}
              className="gap-2 text-status-error hover:bg-status-error/10"
              title="Delete command"
            >
              <Trash2 className="w-4 h-4" /> {t("modal.delete")}
            </Button>
            {/* Cancel and Save buttons on right */}
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  // Cancel: revert to original and close
                  if (selectedCommandId) {
                    const original = commands.find(
                      (c) => c.id === selectedCommandId,
                    );
                    if (original) setEditingCommand({ ...original });
                  }
                }}
                title="Discard changes"
              >
                {t("modal.cancel")}
              </Button>
              <Button
                variant="default"
                onClick={handleSave}
                className="gap-2"
                title="Save changes to library"
              >
                <Check className="w-4 h-4" /> {t("modal.save")}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default RightSidebar;
