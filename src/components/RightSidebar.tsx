import React, { useState, useRef, useEffect } from "react";
import {
  Bot,
  Sliders,
  FileText,
  ChevronsRight,
  ChevronsLeft,
  MessageSquare,
  BookOpen,
  Terminal,
  MousePointer2,
  Play,
  Settings,
  Save,
  Zap,
  Settings2,
  FileCode,
  Scissors,
  Database,
  Wand2,
} from "lucide-react";
import { cn } from "../lib/utils";
import { useStore } from "../lib/store";
import { useTranslation } from "react-i18next";
import { Button } from "./ui/Button";
import { RightSidebarTab } from "../lib/slices/uiSlice";
import AIAssistantContent from "./RightSidebar/AIAssistantContent";
import CommandEditor from "./RightSidebar/CommandEditor";

const RightSidebar: React.FC = () => {
  const { t } = useTranslation();
  const {
    selectedCommandId,
    commands,
    updateCommand,
    rightSidebarTab,
    setRightSidebarTab,
    editingCommand,
    setEditingCommand,
    setPendingParamCommand,
    addToast,
  } = useStore();

  const [width, setWidth] = useState(450);
  const [isResizing, setIsResizing] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

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
  }, [selectedCommandId, commands]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing) return;
      const newWidth = window.innerWidth - e.clientX;
      if (newWidth > 300 && newWidth < 900) setWidth(newWidth);
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

  const handleSend = () => {
    if (selectedCommandId && editingCommand) {
      // If the command has parameters, open the input modal
      // We use the draft command (editingCommand) so user can test changes without saving
      const cmdToRun = { ...editingCommand } as any;
      setPendingParamCommand(cmdToRun);
    }
  };

  const tabs: { id: RightSidebarTab; icon: any; label: string }[] = [
    { id: "ai", icon: MessageSquare, label: "AI Assistant" },
    { id: "basic", icon: Settings, label: t("cmd.tab.basic") },
    { id: "params", icon: Sliders, label: t("cmd.tab.params") },
    { id: "processing", icon: FileCode, label: t("cmd.tab.processing") },
    { id: "framing", icon: Scissors, label: t("cmd.tab.framing") },
    { id: "context", icon: BookOpen, label: t("cmd.tab.context") },
    { id: "wizard", icon: Wand2, label: t("cmd.tab.wizard") },
  ];

  const isEditorTab = rightSidebarTab !== "ai";

  return (
    <div
      style={{ width: isCollapsed ? 48 : width }}
      className="bg-card border-l border-border flex flex-row shadow-xl h-full relative shrink-0 transition-[width] duration-200 ease-in-out z-40 overflow-hidden"
    >
      {/* Resize Handle */}
      {!isCollapsed && (
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
      <div className="w-12 flex flex-col items-center py-3 gap-3 bg-muted/20 border-r border-border shrink-0 z-10">
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="p-2 rounded-md text-muted-foreground hover:bg-muted hover:text-foreground transition-colors mb-2"
          title={isCollapsed ? "Expand" : "Collapse"}
        >
          {isCollapsed ? (
            <ChevronsLeft className="w-4 h-4" />
          ) : (
            <ChevronsRight className="w-4 h-4" />
          )}
        </button>

        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = rightSidebarTab === tab.id && !isCollapsed;
          return (
            <button
              key={tab.id}
              onClick={() => {
                setRightSidebarTab(tab.id);
                if (isCollapsed) setIsCollapsed(false);
              }}
              className={cn(
                "p-2.5 rounded-lg transition-all relative group",
                isActive
                  ? "bg-primary text-primary-foreground shadow-md"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground",
              )}
              title={tab.label}
            >
              <Icon className="w-5 h-5" />
              {isActive && (
                <div className="absolute -left-px top-1/2 -translate-y-1/2 w-0.5 h-4 bg-primary-foreground rounded-full" />
              )}
              <div className="absolute right-full mr-2 px-2 py-1 bg-popover border border-border text-[10px] font-bold rounded shadow-lg opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity whitespace-nowrap z-100 translate-x-1 group-hover:translate-x-0">
                {tab.label}
              </div>
            </button>
          );
        })}
      </div>

      {/* Content Area */}
      <div
        className={cn(
          "flex-1 overflow-hidden flex flex-col bg-background/50 transition-opacity duration-200 relative",
          isCollapsed ? "opacity-0 pointer-events-none" : "opacity-100",
        )}
      >
        {/* Header for Editor Tabs */}
        {isEditorTab && selectedCommand && (
          <div className="flex items-center justify-between p-3 border-b border-border bg-background shrink-0">
            <div className="flex items-center gap-2 overflow-hidden">
              <Terminal className="w-4 h-4 text-muted-foreground" />
              <span className="font-bold text-sm truncate">
                {editingCommand?.name || selectedCommand.name}
              </span>
              <span className="text-[10px] font-mono text-muted-foreground opacity-50 uppercase">
                {rightSidebarTab}
              </span>
            </div>
          </div>
        )}

        <div className="flex-1 overflow-hidden relative flex flex-col">
          {rightSidebarTab === "ai" ? (
            <AIAssistantContent />
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

        {/* Footer Actions for Editor Tabs */}
        {isEditorTab && selectedCommand && (
          <div className="p-3 border-t border-border bg-background flex justify-between gap-3 shrink-0 z-10 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
            <Button
              variant="outline"
              onClick={handleSave}
              className="flex-1 gap-2"
              title="Save changes to library"
            >
              <Save className="w-4 h-4" /> {t("modal.save")}
            </Button>
            <Button
              onClick={handleSend}
              className="flex-1 gap-2 bg-emerald-600 hover:bg-emerald-700 text-white shadow-md"
              title="Run with current settings (Saved or Unsaved)"
            >
              <Play className="w-4 h-4 fill-current" /> Run
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default RightSidebar;
