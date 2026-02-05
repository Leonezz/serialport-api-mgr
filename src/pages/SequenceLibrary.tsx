/**
 * Sequence Library Page
 *
 * Displays all saved sequences with search, filter, and CRUD operations.
 * Provides card-based layout similar to other library pages.
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
  Workflow,
  Clock,
} from "lucide-react";
import { useStore } from "../lib/store";
import { getErrorMessage } from "../lib/utils";
import { SerialSequenceSchema } from "../lib/schemas";
import { Button, EmptyState, Input } from "../components/ui";
import { PageHeader } from "../routes";
import ConfirmationModal from "../components/ConfirmationModal";
import SequenceFormModal from "../components/SequenceFormModal";
import { SequenceCard } from "../components/SequenceViews";
import type { SerialSequence } from "../types";

const SequenceLibrary: React.FC = () => {
  const {
    sequences,
    commands,
    devices,
    addSequence,
    deleteSequence,
    addToast,
  } = useStore();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  const [searchQuery, setSearchQuery] = useState("");
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
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
    setShowAddModal(true);
  };

  const handleEditSequence = (sequenceId: string) => {
    navigate(`/sequences/${sequenceId}/edit`);
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

        // Validate with Zod schema
        const result = SerialSequenceSchema.safeParse(imported);
        if (!result.success) {
          throw result.error;
        }

        // Strip id and timestamps to create as new
        const {
          id: _id,
          createdAt: _ca,
          updatedAt: _ua,
          ...sequenceData
        } = result.data;
        addSequence(sequenceData);
        addToast(
          "success",
          "Sequence Imported",
          `Sequence "${result.data.name}" has been imported.`,
        );
      } catch (error) {
        addToast("error", "Import Failed", getErrorMessage(error));
      }
    };
    reader.readAsText(file);

    // Reset input to allow importing the same file again
    event.target.value = "";
  };

  return (
    <div className="flex flex-col h-full bg-background">
      <PageHeader
        title="Sequence Library"
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
            {filteredSequences.map((sequence) => (
              <SequenceCard
                key={sequence.id}
                sequence={sequence}
                deviceName={getDeviceName(sequence.deviceId)}
                totalDelay={getTotalDelay(sequence)}
                getCommandName={getCommandName}
                onEdit={handleEditSequence}
                onDuplicate={handleDuplicate}
                onExport={handleExport}
                onDelete={(id) => setDeleteConfirm(id)}
              />
            ))}

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

      {/* Sequence Form Modal (for creating new sequences) */}
      {showAddModal && (
        <SequenceFormModal
          availableCommands={commands}
          onSave={() => {
            setShowAddModal(false);
          }}
          onClose={() => {
            setShowAddModal(false);
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

export default SequenceLibrary;
