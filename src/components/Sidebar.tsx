import React, { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { SavedCommand, SerialSequence, SerialPreset } from "../types";
import { PanelLeftClose, PanelLeft } from "lucide-react";
import { IconButton } from "./ui/IconButton";
import { generateId } from "../lib/utils";
import SequenceFormModal from "./SequenceFormModal";
import CommandFormModal from "./CommandFormModal";
import SimpleInputModal from "./SimpleInputModal";
import ConfirmationModal from "./ConfirmationModal";
import DeviceFormModal from "./DeviceFormModal";
import { useStore } from "../lib/store";
import { useTranslation } from "react-i18next";
import {
  useSidebarUIState,
  useSidebarData,
  useSidebarCommandActions,
  useSidebarSequenceActions,
  useSidebarProtocolActions,
  useSidebarPresetActions,
  useSidebarUIActions,
  useSidebarContexts,
  useAITokenUsage,
  useActiveSessionBasicInfo,
} from "../lib/selectors";

import SearchBar from "./Sidebar/SearchBar";
import CollapsedSidebar from "./Sidebar/CollapsedSidebar";
import SidebarFooter from "./Sidebar/SidebarFooter";
import DeviceSection from "./Sidebar/DeviceSection";
import ProtocolSection from "./Sidebar/ProtocolSection";
import CommandSection from "./Sidebar/CommandSection";
import SequenceSection from "./Sidebar/SequenceSection";

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

  // Use optimized selectors to avoid over-subscription (fixes #68)
  const {
    leftSidebarCollapsed,
    setLeftSidebarCollapsed,
    sidebarSectionsCollapsed,
    toggleSidebarSection,
  } = useSidebarUIState();

  const {
    commands,
    sequences,
    devices,
    protocols,
    selectedDeviceId,
    selectedCommandId,
  } = useSidebarData();

  const {
    addCommand,
    deleteCommand,
    deleteCommands,
    setSelectedCommandId,
    setEditingCommand,
  } = useSidebarCommandActions();

  const { addSequence, updateSequence } = useSidebarSequenceActions();

  const { addProtocol } = useSidebarProtocolActions();

  const { setPresets, setLoadedPresetId } = useSidebarPresetActions();

  const {
    setRightSidebarTab,
    setShowSystemLogs,
    setShowAppSettings,
    setShowAI,
    addToast,
  } = useSidebarUIActions();

  const { contexts, setContexts } = useSidebarContexts();

  const aiTokenUsage = useAITokenUsage();
  const activeSessionBasicInfo = useActiveSessionBasicInfo();

  // Track collapsed groups (folders) - inverse logic: if in set, it is collapsed (closed)
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(
    new Set(),
  );

  // Resize State
  const [sidebarWidth, setSidebarWidth] = useState(280);
  const [isResizing, setIsResizing] = useState(false);

  // Search state - must be declared before useMemo hooks that use it
  const [searchQuery, setSearchQuery] = useState("");

  // Modal States
  const [isSeqModalOpen, setIsSeqModalOpen] = useState(false);
  const [editingSequence, setEditingSequence] = useState<
    SerialSequence | undefined
  >(undefined);
  const [isCommandModalOpen, setIsCommandModalOpen] = useState(false);
  const [editingCommandForModal, setEditingCommandForModal] = useState<
    Partial<SavedCommand> | undefined
  >(undefined);
  const [isSavePresetModalOpen, setIsSavePresetModalOpen] = useState(false);
  const [isNewProtocolModalOpen, setIsNewProtocolModalOpen] = useState(false);

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
      type: activeSessionBasicInfo.connectionType,
      config: activeSessionBasicInfo.config
        ? { ...activeSessionBasicInfo.config }
        : undefined,
      network:
        activeSessionBasicInfo.connectionType === "NETWORK"
          ? activeSessionBasicInfo.networkConfig
            ? { ...activeSessionBasicInfo.networkConfig }
            : undefined
          : undefined,
      widgets: [...activeSessionBasicInfo.widgets],
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

  // Filter commands based on selected device and search query
  const filteredCommands = useMemo(() => {
    let result = commands;

    // Filter by device if selected (check device.commandIds)
    if (selectedDeviceId) {
      const selectedDevice = devices.find((d) => d.id === selectedDeviceId);
      if (selectedDevice) {
        result = result.filter((cmd) =>
          selectedDevice.commandIds?.includes(cmd.id),
        );
      }
    }

    // Filter by search query
    const query = searchQuery.trim().toLowerCase();
    if (query) {
      result = result.filter((cmd) => {
        const nameMatch = cmd.name.toLowerCase().includes(query);
        const payloadMatch = cmd.protocolLayer?.payload
          ?.toLowerCase()
          .includes(query);
        const groupMatch = cmd.commandLayer?.group
          ?.toLowerCase()
          .includes(query);
        return nameMatch || payloadMatch || groupMatch;
      });
    }

    return result;
  }, [commands, devices, selectedDeviceId, searchQuery]);

  // Filter sequences based on selected device and search query
  const filteredSequences = useMemo(() => {
    let result = sequences;

    // Filter by device if selected (check device.sequenceIds)
    if (selectedDeviceId) {
      const selectedDevice = devices.find((d) => d.id === selectedDeviceId);
      if (selectedDevice) {
        result = result.filter((seq) =>
          selectedDevice.sequenceIds?.includes(seq.id),
        );
      }
    }

    // Filter by search query
    const query = searchQuery.trim().toLowerCase();
    if (query) {
      result = result.filter((seq) => {
        const nameMatch = seq.name.toLowerCase().includes(query);
        return nameMatch;
      });
    }

    return result;
  }, [sequences, devices, selectedDeviceId, searchQuery]);

  const groupedCommands = useMemo(() => {
    const groups: Record<string, SavedCommand[]> = { Ungrouped: [] };
    filteredCommands.forEach((cmd) => {
      const key = cmd.commandLayer?.group || "Ungrouped";
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
    // Open command modal with initial data
    setEditingCommandForModal({
      name: "",
      group: groupName,
      mode: "TEXT",
      payload: "",
      deviceId: selectedDeviceId || undefined,
    });
    setIsCommandModalOpen(true);
  };

  const handleCreateProtocol = () => {
    setIsNewProtocolModalOpen(true);
  };

  const handleSaveNewProtocol = (name: string) => {
    const newId = addProtocol({
      name,
      description: "",
      version: "1.0",
      tags: [],
      framing: { strategy: "NONE" },
      messageStructures: [],
      commands: [],
    });
    navigate(`/protocols/${newId}/edit`);
  };

  const handleSaveCommandFromModal = (
    data: Omit<SavedCommand, "id" | "createdAt" | "updatedAt">,
  ) => {
    const timestamp = Date.now();
    const newId = addCommand({
      ...data,
      createdAt: timestamp,
      updatedAt: timestamp,
    });

    // If the command is linked to a device, add it to the device's commandIds
    if (data.deviceId) {
      useStore.getState().addCommandToDevice(data.deviceId, newId);
    }

    setSelectedCommandId(newId);
    setRightSidebarTab("basic");
    setShowAI(true);
    addToast("success", t("toast.success"), `"${data.name}" added to library.`);
  };

  return (
    <div
      className="flex flex-col bg-bg-surface border-r border-border-default h-full relative z-10 shadow-xl shrink-0 transition-[width] ease-out duration-75"
      style={{ width: leftSidebarCollapsed ? 56 : sidebarWidth }}
    >
      {/* 48px Header */}
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
        <CollapsedSidebar
          onExpand={() => setLeftSidebarCollapsed(false)}
          onShowSystemLogs={() => setShowSystemLogs(true)}
          onShowAppSettings={() => setShowAppSettings(true)}
          aiTokenTotal={aiTokenUsage.total}
          t={t}
        />
      )}

      {/* Expanded Content */}
      {!leftSidebarCollapsed && (
        <>
          <SearchBar
            searchQuery={searchQuery}
            onSearchQueryChange={setSearchQuery}
          />

          {/* Scrollable Content */}
          <div className="flex-1 overflow-y-auto custom-scrollbar">
            <div className="flex flex-col">
              <DeviceSection
                devices={devices}
                selectedDeviceId={selectedDeviceId}
                isCollapsed={sidebarSectionsCollapsed.devices}
                onToggleCollapse={() => toggleSidebarSection("devices")}
              />

              <ProtocolSection
                protocols={protocols}
                isCollapsed={sidebarSectionsCollapsed.protocols}
                onToggleCollapse={() => toggleSidebarSection("protocols")}
                onCreateProtocol={handleCreateProtocol}
              />

              <CommandSection
                filteredCommands={filteredCommands}
                groupedCommands={groupedCommands}
                selectedDeviceId={selectedDeviceId}
                selectedCommandId={selectedCommandId}
                collapsedGroups={collapsedGroups}
                isCollapsed={sidebarSectionsCollapsed.commands}
                onToggleCollapse={() => toggleSidebarSection("commands")}
                onToggleGroup={toggleGroup}
                onCommandClick={handleCommandClick}
                onSendCommand={onSendCommand}
                onCreateCommand={handleCreateNewCommand}
                onDeleteCommand={deleteCommand}
                onDeleteCommands={deleteCommands}
                onRequestConfirmation={setConfirmation}
                t={t}
              />

              <SequenceSection
                filteredSequences={filteredSequences}
                selectedDeviceId={selectedDeviceId}
                isCollapsed={sidebarSectionsCollapsed.sequences}
                onToggleCollapse={() => toggleSidebarSection("sequences")}
                onRunSequence={onRunSequence}
                onEditSequence={(seq) => handleOpenSeqModal(seq)}
                onCreateSequence={() => handleOpenSeqModal()}
                t={t}
              />
            </div>
          </div>

          <SidebarFooter
            onShowSystemLogs={() => setShowSystemLogs(true)}
            onShowAppSettings={() => setShowAppSettings(true)}
            aiTokenTotal={aiTokenUsage.total}
            t={t}
          />
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
      {isCommandModalOpen && editingCommandForModal && (
        <CommandFormModal
          initialData={editingCommandForModal}
          sequences={sequences}
          contexts={contexts}
          onSave={handleSaveCommandFromModal}
          onClose={() => {
            setIsCommandModalOpen(false);
            setEditingCommandForModal(undefined);
          }}
          onCreateContext={(ctx) => setContexts((prev) => [...prev, ctx])}
          onUpdateContext={(ctx) =>
            setContexts((prev) => prev.map((c) => (c.id === ctx.id ? ctx : c)))
          }
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
      {isNewProtocolModalOpen && (
        <SimpleInputModal
          title="New Protocol"
          placeholder="Enter protocol name..."
          onSave={(name) => {
            handleSaveNewProtocol(name);
            setIsNewProtocolModalOpen(false);
          }}
          onClose={() => setIsNewProtocolModalOpen(false)}
        />
      )}
      {useStore((s) => s.showDeviceModal) && <DeviceFormModal />}
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
