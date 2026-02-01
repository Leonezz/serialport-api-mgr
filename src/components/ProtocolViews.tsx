/**
 * Reusable Protocol View Components
 *
 * Provides consistent card view for protocols
 * Used in ProtocolLibrary
 */

import React from "react";
import { Link } from "react-router-dom";
import { Edit, Copy, Download, Trash2 } from "lucide-react";
import { Button } from "./ui/Button";
import type { Protocol } from "../lib/protocolTypes";

interface ProtocolCardProps {
  protocol: Protocol;
  IconComponent: React.ElementType;
  onDuplicate: (id: string) => void;
  onExport: (protocol: Protocol) => void;
  onDelete: (id: string) => void;
}

/**
 * Card view for displaying a protocol with full details
 */
export const ProtocolCard: React.FC<ProtocolCardProps> = ({
  protocol,
  IconComponent,
  onDuplicate,
  onExport,
  onDelete,
}) => {
  return (
    <div className="group relative bg-card border border-border rounded-lg p-4 hover:border-primary/50 hover:shadow-md transition-all flex flex-col h-full">
      {/* Protocol Icon & Name */}
      <div className="flex items-start gap-3 mb-3">
        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
          <IconComponent className="w-5 h-5 text-primary" />
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="font-semibold truncate">{protocol.name}</h3>
          <p className="text-xs text-muted-foreground">
            v{protocol.version} • {protocol.commands.length} commands
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
        <Link to={`/protocols/${protocol.id}/edit`} className="flex-1">
          <Button variant="outline" size="sm" className="w-full gap-2">
            <Edit className="w-3.5 h-3.5" />
            Edit
          </Button>
        </Link>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={() => onDuplicate(protocol.id)}
          title="Duplicate"
        >
          <Copy className="w-3.5 h-3.5" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={() => onExport(protocol)}
          title="Export"
        >
          <Download className="w-3.5 h-3.5" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-destructive hover:text-destructive"
          onClick={() => onDelete(protocol.id)}
          title="Delete"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </Button>
      </div>
    </div>
  );
};
