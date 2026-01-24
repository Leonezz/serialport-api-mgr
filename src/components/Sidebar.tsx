import React, { useState, useMemo, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { SavedCommand, SerialSequence, SerialPreset } from "../types";
import {
  Play,
  Trash2,
  Plus,
  Folder,
  Terminal,
  Sliders,
  Link2,
  FileClock,
  Settings,
  Coins,
  Pencil,
  PanelLeftClose,
  PanelLeft,
  Layers,
  ExternalLink,
  Search,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import { IconButton } from "./ui/IconButton";
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
import DeviceFormModal from "./DeviceFormModal";
import { useStore } from "../lib/store";
import { EmptyState } from "./ui/EmptyState";
import { useTranslation } from "react-i18next";
// Note: DeviceList is no longer used inline - Devices now links to /devices page

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
  const navigate = useNavigate();
  const {
    sessions,
    activeSessionId,
    commands,
    sequences,
    presets,
    protocols,
    devices,
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
    selectedDeviceId, // Use selectedDeviceId for filtering
    sidebarSectionsCollapsed,
    toggleSidebarSection,
  } = useStore();

  const activeSession = sessions[activeSessionId];
  const { aiTokenUsage } = activeSession;

  const [activeTab, setActiveTab] = useState<"library" | "presets">("library");

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
      if (newWidth > 360) newWidth = 360;
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

  // Filter commands based on selected device
  const filteredCommands = useMemo(() => {
    if (!selectedDeviceId) return commands;
    return commands.filter((cmd) => cmd.deviceId === selectedDeviceId);
  }, [commands, selectedDeviceId]);

  // Filter sequences based on selected device
  const filteredSequences = useMemo(() => {
    if (!selectedDeviceId) return sequences;
    return sequences.filter((seq) => seq.deviceId === selectedDeviceId);
  }, [sequences, selectedDeviceId]);

  const groupedCommands = useMemo(() => {
    const groups: Record<string, SavedCommand[]> = { Ungrouped: [] };
    filteredCommands.forEach((cmd) => {
      const key = cmd.group || "Ungrouped";
      if (!groups[key]) groups[key] = [];
      groups[key].push(cmd);
    });
    const keys = Object.keys(groups)
      .filter((k) => k !== "Ungrouped")
      .sort();
    if (groups["Ungrouped"].length > 0) keys.push("Ungrouped");
    return keys.map((key) => ({ name: key, items: groups[key] }));
  }, [filteredCommands]);

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
      deviceId: selectedDeviceId || undefined, // Assign to current device if selected
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
      deviceId: selectedDeviceId || undefined,
    });
    setRightSidebarTab("basic");
    setShowAI(true);
  };

  // Search state
  const [searchQuery, setSearchQuery] = useState("");

  return (
    <div
      className="flex flex-col bg-bg-surface border-r border-border-default h-full relative z-40 shadow-xl shrink-0 transition-[width] ease-out duration-75"
      style={{ width: leftSidebarCollapsed ? 56 : sidebarWidth }}
    >
      {/* 48px Header - Section 8.3 */}
      <div className="h-12 flex items-center justify-between px-4 border-b border-border-default shrink-0">
        {!leftSidebarCollapsed && (
          <span className="text-heading-sm font-semibold text-text-primary uppercase tracking-wider">
            Library
          </span>
        )}
        <IconButton
          variant="ghost"
          size="sm"
          onClick={() => setLeftSidebarCollapsed(!leftSidebarCollapsed)}
          aria-label={
            leftSidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"
          }
          title={leftSidebarCollapsed ? "Expand" : "Collapse"}
          className={leftSidebarCollapsed ? "mx-auto" : ""}
        >
          {leftSidebarCollapsed ? (
            <PanelLeft className="w-4 h-4" />
          ) : (
            <PanelLeftClose className="w-4 h-4" />
          )}
        </IconButton>
      </div>

      {/* Collapsed State - Icon Rail */}
      {leftSidebarCollapsed && (
        <div className="flex-1 flex flex-col items-center py-3 gap-2">
          <IconButton
            variant="ghost"
            size="md"
            onClick={() => {
              setLeftSidebarCollapsed(false);
              setActiveTab("library");
            }}
            aria-label="Library"
            title="Library"
            className="text-muted-foreground hover:text-foreground"
          >
            <Terminal className="w-5 h-5" />
          </IconButton>
          <IconButton
            variant="ghost"
            size="md"
            onClick={() => {
              setLeftSidebarCollapsed(false);
              setActiveTab("presets");
            }}
            aria-label="Presets"
            title="Presets"
            className="text-muted-foreground hover:text-foreground"
          >
            <Sliders className="w-5 h-5" />
          </IconButton>
          <div className="flex-1" />
          <IconButton
            variant="ghost"
            size="md"
            onClick={() => setShowSystemLogs(true)}
            aria-label={t("sidebar.logs")}
            title={t("sidebar.logs")}
            className="text-muted-foreground hover:text-foreground"
          >
            <FileClock className="w-5 h-5" />
          </IconButton>
          <IconButton
            variant="ghost"
            size="md"
            onClick={() => setShowAppSettings(true)}
            aria-label={t("sidebar.settings")}
            title={t("sidebar.settings")}
            className="text-muted-foreground hover:text-foreground"
          >
            <Settings className="w-5 h-5" />
          </IconButton>
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
      )}

      {/* Expanded Content */}
      {!leftSidebarCollapsed && (
        <>
          {/* 40px Search Input - 12px margin - Section 8.3 */}
          <div className="px-3 py-3">
            <div className="relative h-10">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
              <input
                type="text"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-full pl-9 pr-3 rounded-radius-sm border border-border-default bg-bg-muted text-body-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-accent-primary/50 focus:border-accent-primary"
              />
            </div>
          </div>

          {/* Tab Switcher */}
          <div className="px-3 pb-2 flex gap-1">
            <button
              onClick={() => setActiveTab("library")}
              className={cn(
                "flex-1 h-8 text-body-sm font-medium rounded-radius-sm transition-colors",
                activeTab === "library"
                  ? "bg-accent-primary text-white"
                  : "bg-bg-muted text-text-secondary hover:bg-bg-hover",
              )}
            >
              Library
            </button>
            <button
              onClick={() => setActiveTab("presets")}
              className={cn(
                "flex-1 h-8 text-body-sm font-medium rounded-radius-sm transition-colors",
                activeTab === "presets"
                  ? "bg-accent-primary text-white"
                  : "bg-bg-muted text-text-secondary hover:bg-bg-hover",
              )}
            >
              Presets
            </button>
          </div>

          {/* Scrollable Content */}
          <div className="flex-1 overflow-y-auto custom-scrollbar">
            {activeTab === "library" && (
              <div className="flex flex-col">
                {/* DEVICES Section - 32px header */}
                <div
                  className="h-8 flex items-center justify-between px-3 cursor-pointer hover:bg-bg-hover transition-colors border-b border-border-default"
                  onClick={() => toggleSidebarSection("devices")}
                >
                  <div className="flex items-center gap-2">
                    {sidebarSectionsCollapsed.devices ? (
                      <ChevronRight className="w-4 h-4 text-text-muted" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-text-muted" />
                    )}
                    <span className="text-label-sm font-semibold text-text-secondary uppercase tracking-wider">
                      Devices
                    </span>
                    <Badge
                      variant="secondary"
                      className="text-[10px] h-4 px-1.5 py-0"
                    >
                      {devices.length}
                    </Badge>
                  </div>
                  <div
                    className="flex items-center gap-1"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Link to="/devices">
                      <IconButton
                        variant="ghost"
                        size="xs"
                        aria-label="Open Device Library"
                        title="Open Device Library"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </IconButton>
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
                {!sidebarSectionsCollapsed.devices && (
                  <div className="px-3 py-2 flex flex-col gap-1">
                    {/* All Devices option */}
                    <button
                      onClick={() =>
                        useStore.getState().setSelectedDeviceId(null)
                      }
                      className={cn(
                        "flex items-center gap-2 px-2 py-1.5 rounded-radius-sm text-body-sm transition-colors text-left",
                        selectedDeviceId === null
                          ? "bg-accent-primary/10 text-accent-primary"
                          : "hover:bg-bg-hover text-text-muted",
                      )}
                    >
                      <span>All Devices</span>
                    </button>

                    {devices.map((device) => (
                      <button
                        key={device.id}
                        onClick={() =>
                          useStore.getState().setSelectedDeviceId(device.id)
                        }
                        className={cn(
                          "group flex items-center justify-between px-2 py-1.5 rounded-radius-sm text-body-sm transition-colors",
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
                            useStore.getState().setEditingDevice(device);
                            useStore.getState().setShowDeviceModal(true);
                          }}
                          className="opacity-0 group-hover:opacity-100 transition-opacity"
                          aria-label="Edit Device"
                          title="Edit Device"
                        >
                          <Pencil className="w-3 h-3" />
                        </IconButton>
                      </button>
                    ))}

                    {devices.length === 0 && (
                      <EmptyState
                        variant="devices"
                        className="py-4"
                        onAction={() =>
                          useStore.getState().setShowDeviceModal(true)
                        }
                      />
                    )}
                  </div>
                )}

                {/* PROTOCOLS Section - 32px header */}
                <div
                  className="h-8 flex items-center justify-between px-3 cursor-pointer hover:bg-bg-hover transition-colors border-b border-border-default"
                  onClick={() => toggleSidebarSection("protocols")}
                >
                  <div className="flex items-center gap-2">
                    {sidebarSectionsCollapsed.protocols ? (
                      <ChevronRight className="w-4 h-4 text-text-muted" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-text-muted" />
                    )}
                    <span className="text-label-sm font-semibold text-text-secondary uppercase tracking-wider">
                      Protocols
                    </span>
                    <Badge
                      variant="secondary"
                      className="text-[10px] h-4 px-1.5 py-0"
                    >
                      {protocols.length}
                    </Badge>
                  </div>
                  <div
                    className="flex items-center gap-1"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Link to="/protocols">
                      <IconButton
                        variant="ghost"
                        size="xs"
                        aria-label="Open Protocol Library"
                        title="Open Protocol Library"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </IconButton>
                    </Link>
                    <IconButton
                      variant="ghost"
                      size="xs"
                      onClick={() => navigate("/protocols/new")}
                      aria-label="Create Protocol"
                      title="Create Protocol"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </IconButton>
                  </div>
                </div>
                {!sidebarSectionsCollapsed.protocols && (
                  <div className="px-3 py-2 flex flex-col gap-1">
                    {protocols.map((protocol) => (
                      <Link
                        key={protocol.id}
                        to={`/protocols/${protocol.id}/edit`}
                        className="flex items-center gap-2 px-2 py-1.5 rounded-radius-sm text-body-sm hover:bg-bg-hover transition-colors"
                      >
                        <Layers className="w-4 h-4 text-text-muted" />
                        <span className="truncate">{protocol.name}</span>
                      </Link>
                    ))}
                    {protocols.length === 0 && (
                      <EmptyState
                        variant="protocols"
                        className="py-4"
                        onAction={() => navigate("/protocols/new")}
                      />
                    )}
                  </div>
                )}

                {/* COMMANDS Section - 32px header */}
                <div
                  className="h-8 flex items-center justify-between px-3 cursor-pointer hover:bg-bg-hover transition-colors border-b border-border-default"
                  onClick={() => toggleSidebarSection("commands")}
                >
                  <div className="flex items-center gap-2">
                    {sidebarSectionsCollapsed.commands ? (
                      <ChevronRight className="w-4 h-4 text-text-muted" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-text-muted" />
                    )}
                    <span className="text-label-sm font-semibold text-text-secondary uppercase tracking-wider">
                      {t("sidebar.commands")}
                    </span>
                    <Badge
                      variant="secondary"
                      className="text-[10px] h-4 px-1.5 py-0"
                    >
                      {filteredCommands.length}
                    </Badge>
                  </div>
                  <div
                    className="flex items-center gap-1"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Link to="/commands">
                      <IconButton
                        variant="ghost"
                        size="xs"
                        aria-label="Open Command Library"
                        title="Open Command Library"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </IconButton>
                    </Link>
                    <IconButton
                      variant="ghost"
                      size="xs"
                      onClick={() => handleCreateNewCommand()}
                      aria-label={t("sidebar.new_command")}
                      title={t("sidebar.new_command")}
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </IconButton>
                  </div>
                </div>
                {!sidebarSectionsCollapsed.commands && (
                  <div className="px-3 py-2">
                    {filteredCommands.length === 0 ? (
                      <EmptyState
                        variant="commands"
                        title={
                          selectedDeviceId
                            ? "No commands for this device"
                            : undefined
                        }
                        className="py-4"
                        onAction={() => handleCreateNewCommand()}
                      />
                    ) : (
                      <Accordion className="w-full space-y-1">
                        {groupedCommands.map((group) => {
                          if (group.items.length === 0) return null;
                          const isUngrouped = group.name === "Ungrouped";
                          const isExpanded = !collapsedGroups.has(group.name);

                          return (
                            <AccordionItem
                              key={group.name}
                              className="border-none"
                            >
                              {!isUngrouped && (
                                <div className="flex items-center justify-between group/header pr-1 hover:bg-bg-hover rounded-radius-sm">
                                  <AccordionTrigger
                                    isOpen={isExpanded}
                                    onClick={() => toggleGroup(group.name)}
                                    className="py-1.5 px-2 hover:no-underline hover:text-accent-primary"
                                  >
                                    <div className="flex items-center gap-2">
                                      <Folder className="w-3.5 h-3.5 fill-current opacity-50" />
                                      <span className="text-body-xs font-semibold">
                                        {group.name}
                                      </span>
                                    </div>
                                  </AccordionTrigger>
                                  <div className="flex gap-0.5 opacity-0 group-hover/header:opacity-100 transition-opacity mr-1">
                                    <IconButton
                                      variant="primary"
                                      size="xs"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleCreateNewCommand(group.name);
                                      }}
                                      aria-label="Add command to group"
                                      title="Add command to group"
                                    >
                                      <Plus className="w-3 h-3" />
                                    </IconButton>
                                    <IconButton
                                      variant="destructive"
                                      size="xs"
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
                                      aria-label="Delete group"
                                      title="Delete group"
                                    >
                                      <Trash2 className="w-3 h-3" />
                                    </IconButton>
                                  </div>
                                </div>
                              )}

                              <AccordionContent
                                isOpen={isUngrouped ? true : isExpanded}
                                className={cn(
                                  !isUngrouped &&
                                    "pl-2 ml-2 border-l border-border-default/40",
                                )}
                              >
                                <div className="flex flex-col gap-1.5 pt-1">
                                  {group.items.map((cmd) => {
                                    const isSelected =
                                      selectedCommandId === cmd.id;
                                    return (
                                      <div
                                        key={cmd.id}
                                        onClick={() => handleCommandClick(cmd)}
                                        className={cn(
                                          "group flex flex-col gap-1 p-2 rounded-radius-sm transition-all relative cursor-pointer",
                                          isSelected
                                            ? "bg-accent-primary/10 border-l-2 border-accent-primary"
                                            : "hover:bg-bg-hover",
                                        )}
                                      >
                                        <div className="flex items-center justify-between">
                                          <div className="flex items-center gap-1.5 overflow-hidden">
                                            <span
                                              className={cn(
                                                "font-medium text-body-sm truncate",
                                                isSelected &&
                                                  "text-accent-primary",
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
                                            <IconButton
                                              variant="primary"
                                              size="xs"
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                onSendCommand(cmd);
                                              }}
                                              aria-label="Send"
                                              title="Send"
                                            >
                                              <Play className="w-3 h-3 fill-current" />
                                            </IconButton>
                                            <IconButton
                                              variant="destructive"
                                              size="xs"
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                setConfirmation({
                                                  title: t("modal.delete"),
                                                  message: `Delete command "${cmd.name}"?`,
                                                  action: () =>
                                                    deleteCommand(cmd.id),
                                                });
                                              }}
                                              aria-label="Delete"
                                              title="Delete"
                                            >
                                              <Trash2 className="w-3 h-3" />
                                            </IconButton>
                                          </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                          <Badge
                                            variant="outline"
                                            className="text-[8px] h-3.5 px-1 py-0 border-border-default/60 text-text-muted uppercase"
                                          >
                                            {cmd.mode}
                                          </Badge>
                                          <code className="text-[10px] text-text-muted truncate font-mono flex-1 opacity-70">
                                            {(cmd.payload || "")
                                              .replace(/\r/g, "CR")
                                              .replace(/\n/g, "LF")}
                                          </code>
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              </AccordionContent>
                            </AccordionItem>
                          );
                        })}
                      </Accordion>
                    )}
                  </div>
                )}

                {/* SEQUENCES Section - 32px header */}
                <div
                  className="h-8 flex items-center justify-between px-3 cursor-pointer hover:bg-bg-hover transition-colors border-b border-border-default"
                  onClick={() => toggleSidebarSection("sequences")}
                >
                  <div className="flex items-center gap-2">
                    {sidebarSectionsCollapsed.sequences ? (
                      <ChevronRight className="w-4 h-4 text-text-muted" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-text-muted" />
                    )}
                    <span className="text-label-sm font-semibold text-text-secondary uppercase tracking-wider">
                      {t("sidebar.sequences")}
                    </span>
                    <Badge
                      variant="secondary"
                      className="text-[10px] h-4 px-1.5 py-0"
                    >
                      {filteredSequences.length}
                    </Badge>
                  </div>
                  <div
                    className="flex items-center gap-1"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Link to="/sequences">
                      <IconButton
                        variant="ghost"
                        size="xs"
                        aria-label="Open Sequence Library"
                        title="Open Sequence Library"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </IconButton>
                    </Link>
                    <IconButton
                      variant="ghost"
                      size="xs"
                      onClick={() => handleOpenSeqModal()}
                      aria-label="Create Sequence"
                      title="Create Sequence"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </IconButton>
                  </div>
                </div>
                {!sidebarSectionsCollapsed.sequences && (
                  <div className="px-3 py-2">
                    {filteredSequences.length === 0 ? (
                      <EmptyState
                        variant="sequences"
                        title={
                          selectedDeviceId
                            ? "No sequences for this device"
                            : undefined
                        }
                        className="py-4"
                        onAction={() => handleOpenSeqModal()}
                      />
                    ) : (
                      <div className="flex flex-col gap-1.5">
                        {filteredSequences.map((seq) => (
                          <div
                            key={seq.id}
                            className="group flex flex-col gap-1 p-2 rounded-radius-sm hover:bg-bg-hover transition-all"
                          >
                            <div className="flex items-center justify-between">
                              <span className="font-medium text-body-sm truncate">
                                {seq.name}
                              </span>
                              <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                <IconButton
                                  variant="primary"
                                  size="xs"
                                  onClick={() => onRunSequence(seq)}
                                  aria-label="Run Sequence"
                                  title="Run Sequence"
                                >
                                  <Play className="w-3 h-3 fill-current" />
                                </IconButton>
                                <IconButton
                                  variant="ghost"
                                  size="xs"
                                  onClick={() => handleOpenSeqModal(seq)}
                                  aria-label="Quick Edit"
                                  title="Quick Edit"
                                >
                                  <Pencil className="w-3 h-3" />
                                </IconButton>
                                <IconButton
                                  variant="ghost"
                                  size="xs"
                                  onClick={() =>
                                    navigate(`/sequences/${seq.id}/edit`)
                                  }
                                  aria-label="Open Full Editor"
                                  title="Open Full Editor"
                                >
                                  <ExternalLink className="w-3 h-3" />
                                </IconButton>
                              </div>
                            </div>
                            <div className="text-body-xs text-text-muted">
                              {seq.steps.length} step
                              {seq.steps.length !== 1 ? "s" : ""}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {activeTab === "presets" && (
              <div className="flex flex-col">
                {/* Presets Header */}
                <div className="h-8 flex items-center justify-between px-3 border-b border-border-default">
                  <span className="text-label-sm font-semibold text-text-secondary uppercase tracking-wider">
                    {t("sidebar.presets")}
                  </span>
                  <IconButton
                    variant="ghost"
                    size="xs"
                    onClick={() => setIsSavePresetModalOpen(true)}
                    aria-label="Save current config as preset"
                    title="Save current config as preset"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </IconButton>
                </div>
                <div className="px-3 py-2 flex flex-col gap-1.5">
                  {presets.map((preset) => {
                    const isActive = loadedPresetId === preset.id;
                    return (
                      <div
                        key={preset.id}
                        className={cn(
                          "group flex items-center justify-between p-2 rounded-radius-sm transition-all cursor-pointer",
                          isActive
                            ? "bg-accent-primary/10 border-l-2 border-accent-primary"
                            : "hover:bg-bg-hover",
                        )}
                        onClick={() => setLoadedPresetId(preset.id)}
                      >
                        <span className="font-medium text-body-sm truncate">
                          {preset.name}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </>
      )}

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
      <DeviceFormModal />
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
