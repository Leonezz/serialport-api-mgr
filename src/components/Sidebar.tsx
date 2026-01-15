import React, { useState, useMemo, useEffect } from "react";
import { SavedCommand, SerialSequence, SerialPreset } from "../types";
import {
  Play,
  Trash2,
  Plus,
  Folder,
  Terminal,
  ListVideo,
  Sliders,
  Link2,
  FileClock,
  Settings,
  Coins,
  Edit2,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";
import { Button } from "./ui/Button";
import { Badge } from "./ui/Badge";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "./ui/Accordion";
import { cn, generateId } from "../lib/utils";
import SequenceFormModal from "./SequenceFormModal";
import SimpleInputModal from "./SimpleInputModal";
import ConfirmationModal from "./ConfirmationModal";
import { useStore } from "../lib/store";
import { useTranslation } from "react-i18next";

interface Props {
  onSendCommand: (cmd: SavedCommand) => void;
  onRunSequence: (seq: SerialSequence) => void;
}

interface ConfirmationState {
  title: string;
  message: string;
  action: () => void;
}

const Sidebar: React.FC<Props> = ({ onSendCommand, onRunSequence }) => {
  const { t } = useTranslation();
  const {
    sessions,
    activeSessionId,
    commands,
    sequences,
    presets,
    loadedPresetId,
    selectedCommandId,
    setSelectedCommandId,
    setRightSidebarTab,
    setEditingCommand,
    deleteCommand,
    deleteCommands,
    addCommand,
    addSequence,
    updateSequence,
    setLoadedPresetId,
    setPresets,
    addToast,
    setShowSystemLogs,
    setShowAppSettings,
    setShowAI,
    leftSidebarCollapsed,
    setLeftSidebarCollapsed,
  } = useStore();

  const activeSession = sessions[activeSessionId];
  const { aiTokenUsage } = activeSession;

  const [activeTab, setActiveTab] = useState<
    "commands" | "sequences" | "presets"
  >("commands");

  // Track collapsed groups (folders) - inverse logic: if in set, it is collapsed (closed)
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(
    new Set(),
  );

  // Resize State
  const [sidebarWidth, setSidebarWidth] = useState(280);
  const [isResizing, setIsResizing] = useState(false);

  // Modal States
  const [isSeqModalOpen, setIsSeqModalOpen] = useState(false);
  const [editingSequence, setEditingSequence] = useState<
    SerialSequence | undefined
  >(undefined);
  const [isSavePresetModalOpen, setIsSavePresetModalOpen] = useState(false);

  const [confirmation, setConfirmation] = useState<ConfirmationState | null>(
    null,
  );

  const handleOpenSeqModal = (seq?: SerialSequence) => {
    setEditingSequence(seq);
    setIsSeqModalOpen(true);
  };

  const handleSaveSeqWrapper = (data: Omit<SerialSequence, "id">) => {
    if (editingSequence?.id) {
      updateSequence(editingSequence.id, data);
      addToast(
        "success",
        t("toast.success"),
        `"${data.name}" ${t("toast.saved")}.`,
      );
    } else {
      addSequence(data);
      addToast(
        "success",
        t("toast.success"),
        `"${data.name}" added to library.`,
      );
    }
  };

  const handleSaveNewPreset = (name: string) => {
    const newPreset: SerialPreset = {
      id: generateId(),
      name,
      type: activeSession.connectionType,
      config: { ...activeSession.config },
      network:
        activeSession.connectionType === "NETWORK"
          ? { ...activeSession.networkConfig }
          : undefined,
      widgets: [...(activeSession.widgets || [])],
    };
    setPresets((prev) => {
      const currentPresets = Array.isArray(prev) ? prev : [];
      return [...currentPresets, newPreset];
    });
    setLoadedPresetId(newPreset.id);
    addToast("success", t("toast.saved"), `Preset "${name}" created.`);
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing) return;
      let newWidth = e.clientX;
      if (newWidth < 240) newWidth = 240;
      if (newWidth > 600) newWidth = 600;
      setSidebarWidth(newWidth);
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

  const groupedCommands = useMemo(() => {
    const groups: Record<string, SavedCommand[]> = { Ungrouped: [] };
    commands.forEach((cmd) => {
      const key = cmd.group || "Ungrouped";
      if (!groups[key]) groups[key] = [];
      groups[key].push(cmd);
    });
    const keys = Object.keys(groups)
      .filter((k) => k !== "Ungrouped")
      .sort();
    if (groups["Ungrouped"].length > 0) keys.push("Ungrouped");
    return keys.map((key) => ({ name: key, items: groups[key] }));
  }, [commands]);

  const toggleGroup = (groupName: string) => {
    const next = new Set(collapsedGroups);
    if (next.has(groupName)) next.delete(groupName);
    else next.add(groupName);
    setCollapsedGroups(next);
  };

  const handleCommandClick = (cmd: SavedCommand) => {
    if (selectedCommandId === cmd.id) {
      setSelectedCommandId(null);
      setEditingCommand(null);
    } else {
      setSelectedCommandId(cmd.id);
      setEditingCommand({ ...cmd });
      const currentTab = useStore.getState().rightSidebarTab;
      if (currentTab === "ai") {
        setRightSidebarTab("basic");
      }
      setShowAI(true);
    }
  };

  const handleCreateNewCommand = (groupName?: string) => {
    const timestamp = Date.now();
    const newId = addCommand({
      name: t("cmd.new"),
      group: groupName,
      mode: "TEXT",
      payload: "",
      createdAt: timestamp,
      updatedAt: timestamp,
    });
    setSelectedCommandId(newId);
    setEditingCommand({
      id: newId,
      name: t("cmd.new"),
      group: groupName,
      mode: "TEXT",
      payload: "",
      createdAt: timestamp,
      updatedAt: timestamp,
    });
    setRightSidebarTab("basic");
    setShowAI(true);
  };

  const tabs = [
    { id: "commands" as const, icon: Terminal, label: t("sidebar.commands") },
    {
      id: "sequences" as const,
      icon: ListVideo,
      label: t("sidebar.sequences"),
    },
    { id: "presets" as const, icon: Sliders, label: t("sidebar.presets") },
  ];

  return (
    <div
      className="flex flex-row bg-card border-r border-border h-full relative z-40 shadow-xl shrink-0 transition-[width] ease-out duration-75"
      style={{ width: leftSidebarCollapsed ? 48 : sidebarWidth }}
    >
      {/* Vertical Rail */}
      <div className="w-12 flex flex-col items-center py-3 gap-3 bg-muted/20 border-r border-border shrink-0 z-10">
        <button
          onClick={() => setLeftSidebarCollapsed(!leftSidebarCollapsed)}
          className="p-2 rounded-md text-muted-foreground hover:bg-muted hover:text-foreground transition-colors mb-2"
          title={leftSidebarCollapsed ? "Expand" : "Collapse"}
        >
          {leftSidebarCollapsed ? (
            <ChevronsRight className="w-4 h-4" />
          ) : (
            <ChevronsLeft className="w-4 h-4" />
          )}
        </button>

        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id && !leftSidebarCollapsed;
          return (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id);
                if (leftSidebarCollapsed) setLeftSidebarCollapsed(false);
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
              {/* Tooltip */}
              <div className="absolute left-full ml-2 px-2 py-1 bg-popover border border-border text-[10px] font-bold rounded shadow-lg opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity whitespace-nowrap z-50">
                {tab.label}
              </div>
            </button>
          );
        })}

        <div className="flex-1" />

        {/* Footer Actions in Rail */}
        <button
          onClick={() => setShowSystemLogs(true)}
          className="p-2.5 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-all relative group"
          title={t("sidebar.logs")}
        >
          <FileClock className="w-5 h-5" />
          <div className="absolute left-full ml-2 px-2 py-1 bg-popover border border-border text-[10px] font-bold rounded shadow-lg opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity whitespace-nowrap z-50">
            {t("sidebar.logs")}
          </div>
        </button>

        <button
          onClick={() => setShowAppSettings(true)}
          className="p-2.5 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-all relative group"
          title={t("sidebar.settings")}
        >
          <Settings className="w-5 h-5" />
          <div className="absolute left-full ml-2 px-2 py-1 bg-popover border border-border text-[10px] font-bold rounded shadow-lg opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity whitespace-nowrap z-50">
            {t("sidebar.settings")}
          </div>
        </button>

        {aiTokenUsage.total > 0 && (
          <div
            className="flex flex-col items-center gap-0.5 mt-2"
            title={`Token Usage: ${aiTokenUsage.total}`}
          >
            <Coins className="w-3 h-3 text-amber-500" />
            <span className="text-[9px] font-mono text-muted-foreground">
              {(aiTokenUsage.total / 1000).toFixed(1)}k
            </span>
          </div>
        )}
      </div>

      {/* Content Area */}
      <div
        className={cn(
          "flex-1 overflow-hidden flex flex-col bg-background/50 transition-opacity duration-200 relative",
          leftSidebarCollapsed
            ? "opacity-0 pointer-events-none"
            : "opacity-100",
        )}
      >
        <div className="flex-1 overflow-y-auto p-3 space-y-2 custom-scrollbar">
          {activeTab === "commands" && (
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between pb-2 sticky top-0 bg-card z-10 border-b border-border/40 mb-2">
                <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider flex items-center gap-2">
                  <Terminal className="w-3 h-3" /> {t("sidebar.library")}
                </span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={() => handleCreateNewCommand()}
                  title={t("sidebar.new_command")}
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </div>

              {commands.length === 0 && (
                <div className="text-center py-8 text-muted-foreground text-xs italic whitespace-pre-wrap">
                  {t("sidebar.no_commands")}
                </div>
              )}

              <Accordion className="w-full space-y-1">
                {groupedCommands.map((group) => {
                  if (group.items.length === 0) return null;
                  const isUngrouped = group.name === "Ungrouped";
                  const isExpanded = !collapsedGroups.has(group.name);

                  // If ungrouped, we render items directly or in a simpler container?
                  // Existing logic rendered them differently. Let's wrap Ungrouped in a pseudo-accordion or just render.
                  // For consistency, let's treat Ungrouped as a group but maybe always open or different styling?
                  // The previous implementation treated Ungrouped as a group that IS collapsible.

                  return (
                    <AccordionItem key={group.name} className="border-none">
                      {/* Only show trigger if not ungrouped or if we want to allow collapsing ungrouped */}
                      {!isUngrouped && (
                        <div className="flex items-center justify-between group/header pr-1 hover:bg-muted/30 rounded-md">
                          <AccordionTrigger
                            isOpen={isExpanded}
                            onClick={() => toggleGroup(group.name)}
                            className="py-1.5 px-2 hover:no-underline hover:text-primary"
                          >
                            <div className="flex items-center gap-2">
                              <Folder className="w-3.5 h-3.5 fill-current opacity-50" />
                              <span className="text-xs font-semibold">
                                {group.name}
                              </span>
                            </div>
                          </AccordionTrigger>
                          <div className="flex gap-0.5 opacity-0 group-hover/header:opacity-100 transition-opacity mr-1">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleCreateNewCommand(group.name);
                              }}
                              className="p-1 hover:bg-muted rounded text-muted-foreground hover:text-primary transition-all"
                              title="Add command to group"
                            >
                              <Plus className="w-3 h-3" />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setConfirmation({
                                  title: t("modal.delete"),
                                  message: `Delete "${group.name}" and all its commands?`,
                                  action: () =>
                                    deleteCommands(
                                      group.items.map((i) => i.id),
                                    ),
                                });
                              }}
                              className="p-1 hover:bg-destructive/10 rounded text-muted-foreground hover:text-destructive transition-all"
                              title="Delete group"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Content: If Ungrouped, always show. If Grouped, show based on expansion */}
                      <AccordionContent
                        isOpen={isUngrouped ? true : isExpanded}
                        className={cn(
                          !isUngrouped && "pl-2 ml-2 border-l border-border/40",
                        )}
                      >
                        <div className="flex flex-col gap-1.5 pt-1">
                          {group.items.map((cmd) => {
                            const isSelected = selectedCommandId === cmd.id;
                            return (
                              <div
                                key={cmd.id}
                                onClick={() => handleCommandClick(cmd)}
                                className={cn(
                                  "group flex flex-col gap-1 p-2 rounded-md border transition-all relative cursor-pointer",
                                  isSelected
                                    ? "border-primary/50 bg-primary/5 ring-1 ring-primary/20 shadow-sm"
                                    : "border-border/50 bg-muted/20 hover:bg-muted/50 hover:border-border",
                                )}
                              >
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-1.5 overflow-hidden">
                                    <span
                                      className={cn(
                                        "font-medium text-sm truncate",
                                        isSelected && "text-primary",
                                      )}
                                    >
                                      {cmd.name}
                                    </span>
                                    {cmd.usedBy?.length ? (
                                      <span className="text-[9px] opacity-50">
                                        <Link2 className="w-2.5 h-2.5" />
                                      </span>
                                    ) : null}
                                  </div>
                                  <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        onSendCommand(cmd);
                                      }}
                                      className="p-1 text-primary hover:text-primary/80"
                                      title="Send"
                                    >
                                      <Play className="w-3 h-3 fill-current" />
                                    </button>
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setConfirmation({
                                          title: t("modal.delete"),
                                          message: `Delete command "${cmd.name}"?`,
                                          action: () => deleteCommand(cmd.id),
                                        });
                                      }}
                                      className="p-1 text-muted-foreground hover:text-destructive"
                                      title="Delete"
                                    >
                                      <Trash2 className="w-3 h-3" />
                                    </button>
                                  </div>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Badge
                                    variant="outline"
                                    className="text-[8px] h-3.5 px-1 py-0 border-border/60 text-muted-foreground uppercase"
                                  >
                                    {cmd.mode}
                                  </Badge>
                                  <code className="text-[10px] text-muted-foreground truncate font-mono flex-1 opacity-70">
                                    {(cmd.payload || "")
                                      .replace(/\r/g, "CR")
                                      .replace(/\n/g, "LF")}
                                  </code>
                                </div>
                                {isSelected && (
                                  <div className="absolute -left-px top-2 bottom-2 w-1 bg-primary rounded-full" />
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  );
                })}
              </Accordion>
            </div>
          )}

          {activeTab === "sequences" && (
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between pb-2 sticky top-0 bg-card z-10 border-b border-border/40 mb-2">
                <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider flex items-center gap-2">
                  <ListVideo className="w-3 h-3" /> {t("sidebar.sequences")}
                </span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={() => handleOpenSeqModal()}
                  title="Create Sequence"
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
              {sequences.map((seq) => (
                <div
                  key={seq.id}
                  className={cn(
                    "group flex flex-col gap-1 p-2 rounded-md border border-border/50 bg-muted/20 hover:bg-muted/50 hover:border-border transition-all relative",
                  )}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-sm truncate">
                      {seq.name}
                    </span>
                    <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => onRunSequence(seq)}
                        className="p-1 text-primary"
                        title="Run Sequence"
                      >
                        <Play className="w-3 h-3 fill-current" />
                      </button>
                      <button
                        onClick={() => handleOpenSeqModal(seq)}
                        className="p-1 text-muted-foreground"
                        title="Edit Sequence"
                      >
                        <Edit2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === "presets" && (
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between pb-2 sticky top-0 bg-card z-10 border-b border-border/40 mb-2">
                <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider flex items-center gap-2">
                  <Sliders className="w-3 h-3" /> {t("sidebar.presets")}
                </span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={() => setIsSavePresetModalOpen(true)}
                  title="Save current config as preset"
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
              {presets.map((preset) => {
                const isActive = loadedPresetId === preset.id;
                return (
                  <div
                    key={preset.id}
                    className={cn(
                      "group flex items-center justify-between p-2 rounded-md border transition-all cursor-pointer",
                      isActive
                        ? "bg-primary/5 border-primary"
                        : "border-border/50 bg-muted/20 hover:bg-muted/50 hover:border-border",
                    )}
                    onClick={() => setLoadedPresetId(preset.id)}
                  >
                    <span className="font-medium text-sm truncate">
                      {preset.name}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Resize Handle */}
      {!leftSidebarCollapsed && (
        <div
          onMouseDown={(e) => {
            e.preventDefault();
            setIsResizing(true);
          }}
          className="absolute right-0 top-0 bottom-0 w-1.5 cursor-col-resize hover:bg-primary/20 active:bg-primary/40 transition-colors z-50 flex items-center justify-center group/handle"
        >
          <div className="h-10 w-0.5 bg-border rounded-full group-hover/handle:bg-primary/50 transition-colors" />
        </div>
      )}

      {isSeqModalOpen && (
        <SequenceFormModal
          initialData={editingSequence || {}}
          availableCommands={commands}
          onSave={handleSaveSeqWrapper}
          onClose={() => {
            setIsSeqModalOpen(false);
            setEditingSequence(undefined);
          }}
        />
      )}
      {isSavePresetModalOpen && (
        <SimpleInputModal
          title={t("cp.save_as")}
          placeholder="Enter preset name..."
          onSave={(name) => {
            handleSaveNewPreset(name);
            setIsSavePresetModalOpen(false);
          }}
          onClose={() => setIsSavePresetModalOpen(false)}
        />
      )}
      {confirmation && (
        <ConfirmationModal
          title={confirmation.title}
          message={confirmation.message}
          confirmLabel={t("modal.delete")}
          isDestructive
          onConfirm={() => {
            confirmation.action();
            setConfirmation(null);
          }}
          onCancel={() => setConfirmation(null)}
        />
      )}
    </div>
  );
};

export default Sidebar;
