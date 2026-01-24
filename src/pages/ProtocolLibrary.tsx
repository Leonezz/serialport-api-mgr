/**
 * Protocol Library Page
 *
 * Displays all protocols with search, filter, and CRUD operations.
 * Provides navigation to protocol editor for each protocol.
 */

import React, { useState, useMemo } from "react";
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
  const { protocols, addProtocol, deleteProtocol, duplicateProtocol } =
    useStore();

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

  return (
    <div className="flex flex-col h-full bg-background">
      <PageHeader
        title="Protocol Library"
        actions={
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="gap-2">
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
            {filteredProtocols.map((protocol) => {
              const IconComponent = getProtocolIcon(protocol.icon);
              return (
                <div
                  key={protocol.id}
                  className="group relative bg-card border border-border rounded-lg p-4 hover:border-primary/50 hover:shadow-md transition-all flex flex-col h-full"
                >
                  {/* Protocol Icon & Name */}
                  <div className="flex items-start gap-3 mb-3">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                      <IconComponent className="w-5 h-5 text-primary" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="font-semibold truncate">
                        {protocol.name}
                      </h3>
                      <p className="text-xs text-muted-foreground">
                        v{protocol.version} • {protocol.commands.length}{" "}
                        commands
                      </p>
                    </div>
                  </div>

                  {/* Description */}
                  {protocol.description && (
                    <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                      {protocol.description}
                    </p>
                  )}

                  {/* Tags */}
                  {protocol.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-3">
                      {protocol.tags.slice(0, 3).map((tag) => (
                        <span
                          key={tag}
                          className="px-2 py-0.5 text-xs bg-muted rounded-full"
                        >
                          {tag}
                        </span>
                      ))}
                      {protocol.tags.length > 3 && (
                        <span className="px-2 py-0.5 text-xs text-muted-foreground">
                          +{protocol.tags.length - 3}
                        </span>
                      )}
                    </div>
                  )}

                  {/* Spacer to push actions to bottom */}
                  <div className="flex-1" />

                  {/* Actions */}
                  <div className="flex items-center gap-2 pt-3 border-t border-border">
                    <Link
                      to={`/protocols/${protocol.id}/edit`}
                      className="flex-1"
                    >
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full gap-2"
                      >
                        <Edit className="w-3.5 h-3.5" />
                        Edit
                      </Button>
                    </Link>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => handleDuplicate(protocol.id)}
                      title="Duplicate"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => handleExport(protocol)}
                      title="Export"
                    >
                      <Download className="w-3.5 h-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive hover:text-destructive"
                      onClick={() => setDeleteConfirm(protocol.id)}
                      title="Delete"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              );
            })}

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
    </div>
  );
};

export default ProtocolLibrary;
