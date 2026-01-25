/**
 * Protocol Editor Page
 *
 * Full-page editor for Protocol definitions.
 * Contains tabs for:
 * - General: Name, version, description, tags
 * - Framing: Framing strategy configuration
 * - Structures: Message structure designer
 * - Commands: Command template editor
 */

import React, { useState, useMemo } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import {
  Settings,
  Layers,
  Command,
  Check,
  Play,
  Terminal,
  Plus,
  X,
} from "lucide-react";
import { useStore } from "../lib/store";
import { Button } from "../components/ui/Button";
import { PageHeader } from "../routes";
import type {
  Protocol,
  SimpleCommand,
  CommandTemplate,
} from "../lib/protocolTypes";
import { cn } from "../lib/utils";
import { instantiateFromProtocol } from "../lib/protocolIntegration";

// Extracted components
import { GeneralTab } from "./ProtocolEditor/tabs/GeneralTab";
import { FramingTab } from "./ProtocolEditor/tabs/FramingTab";
import { StructuresTab } from "./ProtocolEditor/tabs/StructuresTab";
import { CommandsTab } from "./ProtocolEditor/tabs/CommandsTab";
import { CommandEditModal } from "./ProtocolEditor/modals/CommandEditModal";

// Tab definitions
type EditorTab = "general" | "framing" | "structures" | "commands";

const TABS: { id: EditorTab; label: string; icon: React.ElementType }[] = [
  { id: "general", label: "General", icon: Settings },
  { id: "framing", label: "Framing", icon: Layers },
  { id: "structures", label: "Structures", icon: Terminal },
  { id: "commands", label: "Commands", icon: Command },
];

interface ProtocolEditorProps {
  initialTab?: EditorTab;
}

// Inner component that handles the actual editing
// Uses key={protocol.id} from parent to reset state when navigating between protocols
interface ProtocolEditorContentProps {
  protocol: Protocol;
  initialTab: EditorTab;
}

const ProtocolEditorContent: React.FC<ProtocolEditorContentProps> = ({
  protocol,
  initialTab,
}) => {
  const navigate = useNavigate();
  const {
    updateProtocol,
    addMessageStructure,
    deleteMessageStructure,
    addCommandTemplate,
    deleteCommandTemplate,
    updateCommandTemplate,
    addToast,
    devices,
    addCommand,
  } = useStore();
  const id = protocol.id;

  const [activeTab, setActiveTab] = useState<EditorTab>(initialTab);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Local edit state - initialized from protocol prop on mount
  const [editState, setEditState] = useState<Protocol>(() => ({ ...protocol }));

  // Command edit modal state
  const [editingCommand, setEditingCommand] = useState<CommandTemplate | null>(
    null,
  );

  // Device picker for "Add to Device" functionality
  const [addToDeviceCommand, setAddToDeviceCommand] =
    useState<CommandTemplate | null>(null);

  // Get devices that have this protocol linked
  const linkedDevices = useMemo(() => {
    return devices.filter((d) =>
      d.protocols?.some((p) => p.protocolId === protocol.id),
    );
  }, [devices, protocol.id]);

  // Handler for adding a command to a device
  const handleAddCommandToDevice = (
    command: CommandTemplate,
    deviceId: string,
  ) => {
    const cmdData = instantiateFromProtocol(command, protocol, deviceId);
    addCommand(cmdData);
    const deviceName = devices.find((d) => d.id === deviceId)?.name || "device";
    addToast(
      "success",
      "Command Added",
      `"${command.name}" added to ${deviceName}.`,
    );
    setAddToDeviceCommand(null);
  };

  const handleSave = () => {
    updateProtocol(id, editState);
    setHasUnsavedChanges(false);
    addToast(
      "success",
      "Saved",
      `Protocol "${editState.name}" saved successfully.`,
    );
  };

  const handleChange = <K extends keyof Protocol>(
    key: K,
    value: Protocol[K],
  ) => {
    setEditState((prev) => ({ ...prev, [key]: value }));
    setHasUnsavedChanges(true);
  };

  // Structure handlers
  const handleAddStructure = () => {
    const newId = addMessageStructure(id, {
      name: "New Structure",
      description: "",
      encoding: "BINARY",
      byteOrder: "BE",
      elements: [],
    });
    if (newId) {
      // Refresh editState from store
      const updatedProtocol = useStore
        .getState()
        .protocols.find((p) => p.id === id);
      if (updatedProtocol) {
        setEditState({ ...updatedProtocol });
      }
      addToast("success", "Structure Added", "New message structure created.");
    }
  };

  const handleDeleteStructure = (structureId: string) => {
    deleteMessageStructure(id, structureId);
    const updatedProtocol = useStore
      .getState()
      .protocols.find((p) => p.id === id);
    if (updatedProtocol) {
      setEditState({ ...updatedProtocol });
    }
    addToast("info", "Deleted", "Message structure deleted.");
  };

  // Command handlers
  const handleAddCommand = () => {
    const newId = addCommandTemplate(id, {
      type: "SIMPLE",
      name: "New Command",
      description: "",
      tags: [],
      payload: "",
      mode: "TEXT",
      parameters: [],
      extractVariables: [],
    } as Omit<SimpleCommand, "id" | "createdAt" | "updatedAt">);
    if (newId) {
      const updatedProtocol = useStore
        .getState()
        .protocols.find((p) => p.id === id);
      if (updatedProtocol) {
        setEditState({ ...updatedProtocol });
      }
      addToast("success", "Command Added", "New command template created.");
    }
  };

  const handleDeleteCommand = (commandId: string) => {
    deleteCommandTemplate(id, commandId);
    const updatedProtocol = useStore
      .getState()
      .protocols.find((p) => p.id === id);
    if (updatedProtocol) {
      setEditState({ ...updatedProtocol });
    }
    addToast("info", "Deleted", "Command template deleted.");
  };

  const handleEditCommand = (command: CommandTemplate) => {
    setEditingCommand({ ...command });
  };

  const handleSaveCommand = (command: CommandTemplate) => {
    updateCommandTemplate(id, command.id, command);
    const updatedProtocol = useStore
      .getState()
      .protocols.find((p) => p.id === id);
    if (updatedProtocol) {
      setEditState({ ...updatedProtocol });
    }
    setEditingCommand(null);
    addToast("success", "Command Updated", `Command "${command.name}" saved.`);
  };

  const handleTestProtocol = () => {
    // Navigate to main workspace - user can test commands there
    navigate("/");
    addToast(
      "info",
      "Test Mode",
      `Navigate to the Commands tab in the sidebar to test "${editState.name}" commands.`,
    );
  };

  return (
    <div className="flex flex-col h-full bg-background">
      <PageHeader
        title={editState.name}
        backTo="/protocols"
        backLabel="Protocols"
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="gap-2"
              onClick={handleTestProtocol}
            >
              <Play className="w-4 h-4" />
              Test
            </Button>
            <Button
              size="sm"
              className="gap-2"
              onClick={handleSave}
              disabled={!hasUnsavedChanges}
            >
              <Check className="w-4 h-4" />
              Save
            </Button>
          </div>
        }
      />

      {/* Tabs */}
      <div className="border-b border-border px-4">
        <div className="flex gap-1">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors",
                  activeTab === tab.id
                    ? "border-primary text-primary"
                    : "border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/50",
                )}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab Content - Using CSS visibility to preserve state instead of conditional rendering */}
      <div className="flex-1 overflow-auto p-6">
        <div className="max-w-4xl mx-auto">
          {/* General Tab - always mounted, hidden when not active */}
          <div className={activeTab !== "general" ? "hidden" : undefined}>
            <GeneralTab editState={editState} onChange={handleChange} />
          </div>
          {/* Framing Tab - always mounted, hidden when not active */}
          <div className={activeTab !== "framing" ? "hidden" : undefined}>
            <FramingTab editState={editState} onChange={handleChange} />
          </div>
          {/* Structures Tab - always mounted, hidden when not active */}
          <div className={activeTab !== "structures" ? "hidden" : undefined}>
            <StructuresTab
              editState={editState}
              onChange={handleChange}
              onAddStructure={handleAddStructure}
              onDeleteStructure={handleDeleteStructure}
            />
          </div>
          {/* Commands Tab - always mounted, hidden when not active */}
          <div className={activeTab !== "commands" ? "hidden" : undefined}>
            <CommandsTab
              editState={editState}
              onChange={handleChange}
              onAddCommand={handleAddCommand}
              onDeleteCommand={handleDeleteCommand}
              onEditCommand={handleEditCommand}
              onAddToDevice={setAddToDeviceCommand}
              linkedDevices={linkedDevices}
            />
          </div>
        </div>
      </div>

      {/* Command Edit Modal */}
      {editingCommand && (
        <CommandEditModal
          command={editingCommand}
          messageStructures={editState.messageStructures}
          onSave={handleSaveCommand}
          onClose={() => setEditingCommand(null)}
        />
      )}

      {/* Add to Device Modal */}
      {addToDeviceCommand && (
        <div
          className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => setAddToDeviceCommand(null)}
        >
          <div
            className="w-full max-w-sm bg-card border border-border rounded-lg shadow-2xl animate-in fade-in zoom-in-95"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-4 border-b border-border">
              <div>
                <h3 className="font-semibold">Add to Device</h3>
                <p className="text-xs text-muted-foreground">
                  Add &quot;{addToDeviceCommand.name}&quot; to a device
                </p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0"
                onClick={() => setAddToDeviceCommand(null)}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
            <div className="p-4 space-y-2 max-h-64 overflow-y-auto">
              {linkedDevices.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No devices are linked to this protocol.
                </p>
              ) : (
                linkedDevices.map((device) => (
                  <button
                    key={device.id}
                    className="w-full flex items-center gap-3 p-3 rounded-lg border border-border hover:border-primary/50 hover:bg-muted/50 transition-colors text-left"
                    onClick={() =>
                      handleAddCommandToDevice(addToDeviceCommand, device.id)
                    }
                  >
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{device.name}</p>
                      {device.manufacturer && (
                        <p className="text-xs text-muted-foreground truncate">
                          {device.manufacturer}
                          {device.model && ` - ${device.model}`}
                        </p>
                      )}
                    </div>
                    <Plus className="w-4 h-4 text-muted-foreground" />
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Wrapper component that handles routing and not-found state
const ProtocolEditor: React.FC<ProtocolEditorProps> = ({
  initialTab = "general",
}) => {
  const { id } = useParams<{ id: string }>();
  const { protocols } = useStore();

  // Find the protocol
  const protocol = useMemo(
    () => protocols.find((p) => p.id === id),
    [protocols, id],
  );

  if (!protocol) {
    return (
      <div className="flex flex-col h-full bg-background">
        <PageHeader
          title="Protocol Not Found"
          backTo="/protocols"
          backLabel="Protocols"
        />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <Terminal className="w-12 h-12 text-muted-foreground/50 mx-auto mb-4" />
            <p className="text-muted-foreground">
              Protocol not found. It may have been deleted.
            </p>
            <Link to="/protocols">
              <Button className="mt-4">Back to Protocols</Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Key forces re-mount when navigating to a different protocol
  return (
    <ProtocolEditorContent
      key={protocol.id}
      protocol={protocol}
      initialTab={initialTab}
    />
  );
};

export default ProtocolEditor;
