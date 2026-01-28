/**
 * Command Library Page
 *
 * Displays all saved commands with search, filter, and CRUD operations.
 * Provides card-based layout similar to DeviceLibrary and ProtocolLibrary.
 */

import React, { useState, useMemo, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  Plus,
  Search,
  Upload,
  Download,
  Copy,
  Trash2,
  Edit,
  Terminal,
  Folder,
} from "lucide-react";
import { useStore } from "../lib/store";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { Badge } from "../components/ui/Badge";
import { PageHeader } from "../routes";
import ConfirmationModal from "../components/ConfirmationModal";
import CommandFormModal from "../components/CommandFormModal";
import { EmptyState } from "../components/ui/EmptyState";
import type { SavedCommand } from "../types";

const CommandLibrary: React.FC = () => {
  const navigate = useNavigate();
  const {
    commands,
    sequences,
    contexts,
    devices,
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

  // Filter commands based on search
  const filteredCommands = useMemo(() => {
    if (!searchQuery.trim()) return commands;
    const query = searchQuery.toLowerCase();
    return commands.filter(
      (c) =>
        c.name.toLowerCase().includes(query) ||
        c.description?.toLowerCase().includes(query) ||
        c.group?.toLowerCase().includes(query) ||
        c.payload?.toLowerCase().includes(query),
    );
  }, [commands, searchQuery]);

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
            <span className="text-sm text-muted-foreground">
              {filteredCommands.length} command
              {filteredCommands.length !== 1 ? "s" : ""}
            </span>
          </div>

          {/* Commands Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredCommands.map((command) => {
              const deviceName = getDeviceName(command.deviceId);
              return (
                <div
                  key={command.id}
                  className="group relative bg-card border border-border rounded-lg p-4 hover:border-primary/50 hover:shadow-md transition-all flex flex-col h-full"
                >
                  {/* Command Icon & Name */}
                  <div className="flex items-start gap-3 mb-3">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                      <Terminal className="w-5 h-5 text-primary" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="font-semibold truncate">{command.name}</h3>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Badge variant="secondary" className="text-[10px]">
                          {command.mode}
                        </Badge>
                        {command.group && (
                          <span className="flex items-center gap-1">
                            <Folder className="w-3 h-3" />
                            {command.group}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Description */}
                  {command.description && (
                    <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                      {command.description}
                    </p>
                  )}

                  {/* Payload Preview */}
                  {command.payload && (
                    <div className="bg-muted/50 rounded px-2 py-1 mb-3 font-mono text-xs text-muted-foreground truncate">
                      {command.payload}
                    </div>
                  )}

                  {/* Meta info */}
                  <div className="flex flex-wrap gap-2 mb-3 text-xs text-muted-foreground">
                    {command.parameters && command.parameters.length > 0 && (
                      <span>
                        {command.parameters.length} param
                        {command.parameters.length !== 1 ? "s" : ""}
                      </span>
                    )}
                    {deviceName && (
                      <span className="text-primary">• {deviceName}</span>
                    )}
                  </div>

                  {/* Spacer to push actions to bottom */}
                  <div className="flex-1" />

                  {/* Actions */}
                  <div className="flex items-center gap-2 pt-3 border-t border-border">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 gap-2"
                      onClick={() => handleEditCommand(command)}
                    >
                      <Edit className="w-3.5 h-3.5" />
                      Edit
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => handleDuplicate(command)}
                      title="Duplicate"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => handleExport(command)}
                      title="Export"
                    >
                      <Download className="w-3.5 h-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive hover:text-destructive"
                      onClick={() => setDeleteConfirm(command.id)}
                      title="Delete"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              );
            })}

            {/* Empty state */}
            {filteredCommands.length === 0 && (
              <div className="col-span-full">
                <EmptyState
                  variant={searchQuery ? "search" : "commands"}
                  description={
                    searchQuery ? "Try adjusting your search query" : undefined
                  }
                  onAction={searchQuery ? undefined : handleAddCommand}
                  hideAction={!!searchQuery}
                />
              </div>
            )}
          </div>
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
          onSave={() => {
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
