/**
 * Command Library Page
 *
 * Displays all saved commands with search, filter, and CRUD operations.
 * Provides card-based layout similar to DeviceLibrary and ProtocolLibrary.
 */

import React, { useState, useMemo, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Search, Upload, Folder, LayoutGrid, List } from "lucide-react";
import { useStore } from "../lib/store";
import { cn } from "../lib/utils";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { Badge } from "../components/ui/Badge";
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "../components/ui/Accordion";
import { PageHeader } from "../routes";
import ConfirmationModal from "../components/ConfirmationModal";
import CommandFormModal from "../components/CommandFormModal";
import { CommandCard } from "../components/CommandViews";
import { EmptyState } from "../components/ui/EmptyState";
import type { SavedCommand } from "../types";

const CommandLibrary: React.FC = () => {
  const navigate = useNavigate();
  const {
    commands,
    sequences,
    contexts,
    devices,
    protocols,
    addCommand,
    deleteCommand,
    setEditingCommand,
    editingCommand,
    setContexts,
    addToast,
  } = useStore();

  const fileInputRef = useRef<HTMLInputElement>(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [viewMode, setViewMode] = useState<"grid" | "grouped">("grid");
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({});
  const [commandFilter, setCommandFilter] = useState<
    "all" | "device" | "personal"
  >("all");

  // Calculate command counts by type
  const commandCounts = useMemo(() => {
    const deviceCommands = commands.filter((c) => c.deviceId);
    const personalCommands = commands.filter((c) => !c.deviceId);
    return {
      all: commands.length,
      device: deviceCommands.length,
      personal: personalCommands.length,
    };
  }, [commands]);

  // Filter commands based on search and type
  const filteredCommands = useMemo(() => {
    let filtered = commands;

    // Filter by command type
    if (commandFilter === "device") {
      filtered = filtered.filter((c) => c.deviceId);
    } else if (commandFilter === "personal") {
      filtered = filtered.filter((c) => !c.deviceId);
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (c) =>
          c.name.toLowerCase().includes(query) ||
          c.description?.toLowerCase().includes(query) ||
          c.group?.toLowerCase().includes(query) ||
          c.payload?.toLowerCase().includes(query),
      );
    }

    return filtered;
  }, [commands, commandFilter, searchQuery]);

  // Group commands by their group field
  const groupedCommands = useMemo(() => {
    const groups: Record<string, SavedCommand[]> = {};
    filteredCommands.forEach((cmd) => {
      const groupName = cmd.group || "Ungrouped";
      if (!groups[groupName]) {
        groups[groupName] = [];
      }
      groups[groupName].push(cmd);
    });
    return groups;
  }, [filteredCommands]);

  // Toggle group open/closed
  const toggleGroup = (groupName: string) => {
    setOpenGroups((prev) => ({
      ...prev,
      [groupName]: !prev[groupName],
    }));
  };

  const handleAddCommand = () => {
    setEditingCommand(null);
    setShowAddModal(true);
  };

  const handleEditCommand = (command: SavedCommand) => {
    navigate(`/commands/${command.id}/edit`);
  };

  const handleDuplicate = (command: SavedCommand) => {
    const newCommand: Omit<SavedCommand, "id" | "createdAt" | "updatedAt"> = {
      ...command,
      name: `${command.name} (Copy)`,
    };
    addCommand(newCommand);
  };

  const handleDelete = (id: string) => {
    deleteCommand(id);
    setDeleteConfirm(null);
  };

  const handleExport = (command: SavedCommand) => {
    const dataStr = JSON.stringify(command, null, 2);
    const blob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${command.name.toLowerCase().replace(/\s+/g, "-")}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const getDeviceName = (deviceId?: string) => {
    if (!deviceId) return null;
    return devices.find((d) => d.id === deviceId)?.name;
  };

  const handleImport = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const imported = JSON.parse(content);

        // Validate basic command structure
        if (!imported.name || !imported.mode) {
          throw new Error("Invalid command format");
        }

        // Strip id and timestamps to create as new
        const {
          id: _id,
          createdAt: _ca,
          updatedAt: _ua,
          ...commandData
        } = imported;
        addCommand(commandData);
        addToast(
          "success",
          "Command Imported",
          `Command "${imported.name}" has been imported.`,
        );
      } catch (error) {
        addToast(
          "error",
          "Import Failed",
          "The file does not contain a valid command.",
        );
      }
    };
    reader.readAsText(file);

    // Reset input to allow importing the same file again
    event.target.value = "";
  };

  return (
    <div className="flex flex-col h-full bg-background">
      <PageHeader
        title="Command Library"
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="gap-2"
              onClick={handleImport}
            >
              <Upload className="w-4 h-4" />
              Import
            </Button>
            <Button size="sm" className="gap-2" onClick={handleAddCommand}>
              <Plus className="w-4 h-4" />
              New Command
            </Button>
          </div>
        }
      />

      {/* Filter Tabs */}
      <div className="border-b border-border">
        <div className="flex gap-1 px-6">
          <button
            onClick={() => setCommandFilter("all")}
            className={cn(
              "px-4 py-3 text-sm font-medium border-b-2 transition-colors",
              commandFilter === "all"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground",
            )}
          >
            All Commands ({commandCounts.all})
          </button>
          <button
            onClick={() => setCommandFilter("device")}
            className={cn(
              "px-4 py-3 text-sm font-medium border-b-2 transition-colors",
              commandFilter === "device"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground",
            )}
          >
            Device Commands ({commandCounts.device})
          </button>
          <button
            onClick={() => setCommandFilter("personal")}
            className={cn(
              "px-4 py-3 text-sm font-medium border-b-2 transition-colors",
              commandFilter === "personal"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground",
            )}
          >
            Personal Commands ({commandCounts.personal})
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Search Bar */}
          <div className="flex items-center gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search commands..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex items-center gap-1 border border-border rounded-md p-1">
              <Button
                variant={viewMode === "grid" ? "secondary" : "ghost"}
                size="sm"
                className="h-8 w-8 p-0"
                onClick={() => setViewMode("grid")}
                title="Grid view"
              >
                <LayoutGrid className="w-4 h-4" />
              </Button>
              <Button
                variant={viewMode === "grouped" ? "secondary" : "ghost"}
                size="sm"
                className="h-8 w-8 p-0"
                onClick={() => setViewMode("grouped")}
                title="Grouped view"
              >
                <List className="w-4 h-4" />
              </Button>
            </div>
            <span className="text-sm text-muted-foreground">
              {filteredCommands.length} command
              {filteredCommands.length !== 1 ? "s" : ""}
            </span>
          </div>

          {/* Grid View */}
          {viewMode === "grid" && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredCommands.map((command) => (
                <CommandCard
                  key={command.id}
                  command={command}
                  deviceName={getDeviceName(command.deviceId)}
                  protocols={protocols}
                  onEdit={handleEditCommand}
                  onDuplicate={handleDuplicate}
                  onExport={handleExport}
                  onDelete={(cmd) => setDeleteConfirm(cmd.id)}
                />
              ))}

              {/* Empty state */}
              {filteredCommands.length === 0 && (
                <div className="col-span-full">
                  <EmptyState
                    variant={searchQuery ? "search" : "commands"}
                    description={
                      searchQuery
                        ? "Try adjusting your search query"
                        : undefined
                    }
                    onAction={searchQuery ? undefined : handleAddCommand}
                    hideAction={!!searchQuery}
                  />
                </div>
              )}
            </div>
          )}

          {/* Grouped View */}
          {viewMode === "grouped" && (
            <div className="space-y-4">
              {filteredCommands.length === 0 ? (
                <EmptyState
                  variant={searchQuery ? "search" : "commands"}
                  description={
                    searchQuery ? "Try adjusting your search query" : undefined
                  }
                  onAction={searchQuery ? undefined : handleAddCommand}
                  hideAction={!!searchQuery}
                />
              ) : (
                <Accordion>
                  {Object.entries(groupedCommands)
                    .sort(([a], [b]) => a.localeCompare(b))
                    .map(([groupName, commands]) => (
                      <AccordionItem key={groupName}>
                        <AccordionTrigger
                          isOpen={openGroups[groupName]}
                          onClick={() => toggleGroup(groupName)}
                        >
                          <div className="flex items-center gap-2">
                            <Folder className="w-4 h-4" />
                            <span className="font-semibold">{groupName}</span>
                            <Badge variant="secondary" className="ml-2">
                              {commands.length}
                            </Badge>
                          </div>
                        </AccordionTrigger>
                        <AccordionContent isOpen={openGroups[groupName]}>
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 pt-3">
                            {commands.map((command) => (
                              <CommandCard
                                key={command.id}
                                command={command}
                                deviceName={getDeviceName(command.deviceId)}
                                protocols={protocols}
                                onEdit={handleEditCommand}
                                onDuplicate={handleDuplicate}
                                onExport={handleExport}
                                onDelete={(cmd) => setDeleteConfirm(cmd.id)}
                              />
                            ))}
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                </Accordion>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <ConfirmationModal
          title="Delete Command?"
          message={`Are you sure you want to delete "${commands.find((c) => c.id === deleteConfirm)?.name}"? This action cannot be undone.`}
          confirmLabel="Delete"
          isDestructive
          onConfirm={() => handleDelete(deleteConfirm)}
          onCancel={() => setDeleteConfirm(null)}
        />
      )}

      {/* Command Form Modal */}
      {showAddModal && (
        <CommandFormModal
          initialData={editingCommand || undefined}
          sequences={sequences}
          contexts={contexts}
          onSave={(command) => {
            addCommand(command);
            addToast(
              "success",
              "Command Saved",
              `Command "${command.name}" has been saved.`,
            );
            setShowAddModal(false);
            setEditingCommand(null);
          }}
          onCreateContext={(ctx) => setContexts((prev) => [...prev, ctx])}
          onUpdateContext={(ctx) =>
            setContexts((prev) => prev.map((c) => (c.id === ctx.id ? ctx : c)))
          }
          onClose={() => {
            setShowAddModal(false);
            setEditingCommand(null);
          }}
        />
      )}

      {/* Hidden file input for import */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".json"
        onChange={handleFileChange}
        className="hidden"
      />
    </div>
  );
};

export default CommandLibrary;
