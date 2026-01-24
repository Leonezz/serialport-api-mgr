/**
 * Sequence Library Page
 *
 * Displays all saved sequences with search, filter, and CRUD operations.
 * Provides card-based layout similar to other library pages.
 */

import React, { useState, useMemo } from "react";
import {
  Plus,
  Search,
  Upload,
  Download,
  Copy,
  Trash2,
  Edit,
  Workflow,
  Clock,
} from "lucide-react";
import { useStore } from "../lib/store";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { PageHeader } from "../routes";
import ConfirmationModal from "../components/ConfirmationModal";
import SequenceFormModal from "../components/SequenceFormModal";
import { EmptyState } from "../components/ui/EmptyState";
import type { SerialSequence } from "../types";

const SequenceLibrary: React.FC = () => {
  const { sequences, commands, devices, addSequence, deleteSequence } =
    useStore();

  const [searchQuery, setSearchQuery] = useState("");
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [editingSequence, setEditingSequence] = useState<SerialSequence | null>(
    null,
  );
  const [showAddModal, setShowAddModal] = useState(false);

  // Filter sequences based on search
  const filteredSequences = useMemo(() => {
    if (!searchQuery.trim()) return sequences;
    const query = searchQuery.toLowerCase();
    return sequences.filter(
      (s) =>
        s.name.toLowerCase().includes(query) ||
        s.description?.toLowerCase().includes(query),
    );
  }, [sequences, searchQuery]);

  const handleAddSequence = () => {
    setEditingSequence(null);
    setShowAddModal(true);
  };

  const handleEditSequence = (sequence: SerialSequence) => {
    setEditingSequence(sequence);
    setShowAddModal(true);
  };

  const handleDuplicate = (sequence: SerialSequence) => {
    const newSequence: Omit<SerialSequence, "id" | "createdAt" | "updatedAt"> =
      {
        ...sequence,
        name: `${sequence.name} (Copy)`,
      };
    addSequence(newSequence);
  };

  const handleDelete = (id: string) => {
    deleteSequence(id);
    setDeleteConfirm(null);
  };

  const handleExport = (sequence: SerialSequence) => {
    const dataStr = JSON.stringify(sequence, null, 2);
    const blob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${sequence.name.toLowerCase().replace(/\s+/g, "-")}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const getDeviceName = (deviceId?: string) => {
    if (!deviceId) return null;
    return devices.find((d) => d.id === deviceId)?.name;
  };

  const getCommandName = (commandId: string) => {
    if (commandId === "__DELAY__") return "Delay";
    return commands.find((c) => c.id === commandId)?.name || "Unknown";
  };

  const getTotalDelay = (sequence: SerialSequence) => {
    return sequence.steps.reduce((acc, step) => acc + step.delay, 0);
  };

  return (
    <div className="flex flex-col h-full bg-background">
      <PageHeader
        title="Sequence Library"
        actions={
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="gap-2">
              <Upload className="w-4 h-4" />
              Import
            </Button>
            <Button size="sm" className="gap-2" onClick={handleAddSequence}>
              <Plus className="w-4 h-4" />
              New Sequence
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
                placeholder="Search sequences..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <span className="text-sm text-muted-foreground">
              {filteredSequences.length} sequence
              {filteredSequences.length !== 1 ? "s" : ""}
            </span>
          </div>

          {/* Sequences Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredSequences.map((sequence) => {
              const deviceName = getDeviceName(sequence.deviceId);
              const totalDelay = getTotalDelay(sequence);
              return (
                <div
                  key={sequence.id}
                  className="group relative bg-card border border-border rounded-lg p-4 hover:border-primary/50 hover:shadow-md transition-all flex flex-col h-full"
                >
                  {/* Sequence Icon & Name */}
                  <div className="flex items-start gap-3 mb-3">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                      <Workflow className="w-5 h-5 text-primary" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="font-semibold truncate">
                        {sequence.name}
                      </h3>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span>
                          {sequence.steps.length} step
                          {sequence.steps.length !== 1 ? "s" : ""}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {totalDelay}ms
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Description */}
                  {sequence.description && (
                    <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                      {sequence.description}
                    </p>
                  )}

                  {/* Steps Preview */}
                  {sequence.steps.length > 0 && (
                    <div className="bg-muted/50 rounded px-2 py-1.5 mb-3 space-y-1">
                      {sequence.steps.slice(0, 3).map((step, idx) => (
                        <div
                          key={step.id}
                          className="flex items-center gap-2 text-xs"
                        >
                          <span className="w-4 h-4 rounded-full bg-primary/20 text-primary flex items-center justify-center text-[10px] font-medium">
                            {idx + 1}
                          </span>
                          <span className="text-muted-foreground truncate">
                            {getCommandName(step.commandId)}
                          </span>
                        </div>
                      ))}
                      {sequence.steps.length > 3 && (
                        <div className="text-xs text-muted-foreground pl-6">
                          +{sequence.steps.length - 3} more
                        </div>
                      )}
                    </div>
                  )}

                  {/* Device assignment */}
                  {deviceName && (
                    <div className="text-xs text-primary mb-3">
                      Device: {deviceName}
                    </div>
                  )}

                  {/* Spacer to push actions to bottom */}
                  <div className="flex-1" />

                  {/* Actions */}
                  <div className="flex items-center gap-2 pt-3 border-t border-border">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 gap-2"
                      onClick={() => handleEditSequence(sequence)}
                    >
                      <Edit className="w-3.5 h-3.5" />
                      Edit
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => handleDuplicate(sequence)}
                      title="Duplicate"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => handleExport(sequence)}
                      title="Export"
                    >
                      <Download className="w-3.5 h-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive hover:text-destructive"
                      onClick={() => setDeleteConfirm(sequence.id)}
                      title="Delete"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              );
            })}

            {/* Empty state */}
            {filteredSequences.length === 0 && (
              <div className="col-span-full">
                <EmptyState
                  variant={searchQuery ? "search" : "sequences"}
                  description={
                    searchQuery ? "Try adjusting your search query" : undefined
                  }
                  onAction={searchQuery ? undefined : handleAddSequence}
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
          title="Delete Sequence?"
          message={`Are you sure you want to delete "${sequences.find((s) => s.id === deleteConfirm)?.name}"? This action cannot be undone.`}
          confirmLabel="Delete"
          isDestructive
          onConfirm={() => handleDelete(deleteConfirm)}
          onCancel={() => setDeleteConfirm(null)}
        />
      )}

      {/* Sequence Form Modal */}
      {showAddModal && (
        <SequenceFormModal
          initialData={editingSequence || undefined}
          availableCommands={commands}
          onSave={() => {
            setShowAddModal(false);
            setEditingSequence(null);
          }}
          onClose={() => {
            setShowAddModal(false);
            setEditingSequence(null);
          }}
        />
      )}
    </div>
  );
};

export default SequenceLibrary;
