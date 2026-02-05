/**
 * Reusable Sequence View Components
 *
 * Provides consistent card view for sequences
 * Used in SequenceLibrary
 */

import React from "react";
import { Link } from "react-router-dom";
import { Edit, Copy, Download, Trash2, Workflow, Clock } from "lucide-react";
import { Button } from "./ui";
import type { SerialSequence } from "../types";

interface SequenceCardProps {
  sequence: SerialSequence;
  deviceName?: string | null;
  totalDelay: number;
  getCommandName: (commandId: string) => string;
  onEdit: (id: string) => void;
  onDuplicate: (sequence: SerialSequence) => void;
  onExport: (sequence: SerialSequence) => void;
  onDelete: (id: string) => void;
}

/**
 * Card view for displaying a sequence with full details
 */
export const SequenceCard: React.FC<SequenceCardProps> = ({
  sequence,
  deviceName,
  totalDelay,
  getCommandName,
  onEdit,
  onDuplicate,
  onExport,
  onDelete,
}) => {
  return (
    <div className="group relative bg-card border border-border rounded-lg p-4 hover:border-primary/50 hover:shadow-md transition-all flex flex-col h-full">
      {/* Sequence Icon & Name */}
      <div className="flex items-start gap-3 mb-3">
        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
          <Workflow className="w-5 h-5 text-primary" />
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="font-semibold truncate">{sequence.name}</h3>
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
            <div key={step.id} className="flex items-center gap-2 text-xs">
              <span className="w-4 h-4 rounded-full bg-primary/20 text-primary flex items-center justify-center text-[10px] font-medium">
                {idx + 1}
              </span>
              <span className="text-muted-foreground truncate">
                {getCommandName(step.commandId)}
              </span>
            </div>
          ))}
          {sequence.steps.length > 3 && (
            <div className="text-xs text-muted-foreground text-center">
              +{sequence.steps.length - 3} more
            </div>
          )}
        </div>
      )}

      {/* Meta info */}
      {deviceName && sequence.deviceId && (
        <div className="flex flex-wrap gap-2 mb-3 text-xs text-muted-foreground">
          <Link
            to={`/devices/${sequence.deviceId}/edit`}
            className="text-primary hover:underline hover:text-primary/80 transition-colors"
            onClick={(e) => e.stopPropagation()}
          >
            Device: {deviceName}
          </Link>
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
          onClick={() => onEdit(sequence.id)}
        >
          <Edit className="w-3.5 h-3.5" />
          Edit
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={() => onDuplicate(sequence)}
          title="Duplicate"
        >
          <Copy className="w-3.5 h-3.5" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={() => onExport(sequence)}
          title="Export"
        >
          <Download className="w-3.5 h-3.5" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-destructive hover:text-destructive"
          onClick={() => onDelete(sequence.id)}
          title="Delete"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </Button>
      </div>
    </div>
  );
};
