/**
 * Protocol Library Page
 *
 * Displays all protocols with search, filter, and CRUD operations.
 * Provides navigation to protocol editor for each protocol.
 */

import React, { useState, useMemo, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Plus,
  Search,
  Upload,
  Download,
  Copy,
  Trash2,
  Edit,
  Terminal,
  Cpu,
  Radio,
  Layers,
  Command,
} from "lucide-react";
import { useStore } from "../lib/store";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { PageHeader } from "../routes";
import ConfirmationModal from "../components/ConfirmationModal";
import { EmptyState } from "../components/ui/EmptyState";
import { ProtocolCard } from "../components/ProtocolViews";
import type { Protocol } from "../lib/protocolTypes";

// Icon mapping for protocols
const PROTOCOL_ICONS: Record<string, React.ElementType> = {
  terminal: Terminal,
  cpu: Cpu,
  radio: Radio,
  layers: Layers,
  command: Command,
};

const getProtocolIcon = (iconName?: string) => {
  if (!iconName) return Terminal;
  return PROTOCOL_ICONS[iconName] || Terminal;
};

const ProtocolLibrary: React.FC = () => {
  const navigate = useNavigate();
  const {
    protocols,
    addProtocol,
    deleteProtocol,
    duplicateProtocol,
    addToast,
  } = useStore();

  const fileInputRef = useRef<HTMLInputElement>(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  // Filter protocols based on search
  const filteredProtocols = useMemo(() => {
    if (!searchQuery.trim()) return protocols;
    const query = searchQuery.toLowerCase();
    return protocols.filter(
      (p) =>
        p.name.toLowerCase().includes(query) ||
        p.description?.toLowerCase().includes(query) ||
        p.tags.some((t) => t.toLowerCase().includes(query)),
    );
  }, [protocols, searchQuery]);

  // Group protocols by tags for display (for future category filtering UI)
  const _protocolsByCategory = useMemo(() => {
    const groups: Record<string, Protocol[]> = { All: filteredProtocols };
    filteredProtocols.forEach((p) => {
      p.tags.forEach((tag) => {
        if (!groups[tag]) groups[tag] = [];
        groups[tag].push(p);
      });
    });
    return groups;
  }, [filteredProtocols]);

  const handleCreateNew = () => {
    const newId = addProtocol({
      name: "New Protocol",
      description: "New protocol description",
      version: "1.0",
      tags: [],
      framing: { strategy: "NONE" },
      messageStructures: [],
      commands: [],
    });
    navigate(`/protocols/${newId}/edit`);
  };

  const handleDuplicate = (id: string) => {
    const newId = duplicateProtocol(id);
    if (newId) {
      navigate(`/protocols/${newId}/edit`);
    }
  };

  const handleDelete = (id: string) => {
    deleteProtocol(id);
    setDeleteConfirm(null);
  };

  const handleExport = (protocol: Protocol) => {
    const dataStr = JSON.stringify(protocol, null, 2);
    const blob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${protocol.name.toLowerCase().replace(/\s+/g, "-")}-v${protocol.version}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
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

        // Validate basic protocol structure
        if (!imported.name || !imported.version) {
          throw new Error("Invalid protocol format");
        }

        // Strip id and timestamps to create as new
        const {
          id: _id,
          createdAt: _ca,
          updatedAt: _ua,
          ...protocolData
        } = imported;
        addProtocol(protocolData);
        addToast(
          "success",
          "Protocol Imported",
          `Protocol "${imported.name}" has been imported.`,
        );
      } catch (error) {
        addToast(
          "error",
          "Import Failed",
          "The file does not contain a valid protocol.",
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
        title="Protocol Library"
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
            <Button size="sm" className="gap-2" onClick={handleCreateNew}>
              <Plus className="w-4 h-4" />
              New Protocol
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
                placeholder="Search protocols..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <span className="text-sm text-muted-foreground">
              {filteredProtocols.length} protocol
              {filteredProtocols.length !== 1 ? "s" : ""}
            </span>
          </div>

          {/* Protocol Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredProtocols.map((protocol) => (
              <ProtocolCard
                key={protocol.id}
                protocol={protocol}
                IconComponent={getProtocolIcon(protocol.icon)}
                onDuplicate={handleDuplicate}
                onExport={handleExport}
                onDelete={(id) => setDeleteConfirm(id)}
              />
            ))}

            {/* Empty state */}
            {filteredProtocols.length === 0 && (
              <div className="col-span-full">
                <EmptyState
                  variant={searchQuery ? "search" : "protocols"}
                  description={
                    searchQuery ? "Try adjusting your search query" : undefined
                  }
                  onAction={searchQuery ? undefined : handleCreateNew}
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
          title="Delete Protocol?"
          message={`Are you sure you want to delete "${protocols.find((p) => p.id === deleteConfirm)?.name}"? This action cannot be undone.`}
          confirmLabel="Delete"
          isDestructive
          onConfirm={() => handleDelete(deleteConfirm)}
          onCancel={() => setDeleteConfirm(null)}
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

export default ProtocolLibrary;
