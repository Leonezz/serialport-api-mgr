/**
 * Reusable Command View Components
 *
 * Provides consistent card and list item views for commands
 * Used in CommandLibrary and DeviceEditorPage
 */

import React from "react";
import { Link } from "react-router-dom";
import {
  Terminal,
  Folder,
  Edit,
  Copy,
  Download,
  Trash2,
  Layers,
} from "lucide-react";
import { Button } from "./ui/Button";
import { Badge } from "./ui/Badge";
import { getEffectiveMode, getEffectivePayload } from "../lib/commandBuilder";
import type { SavedCommand } from "../types";
import type { Protocol } from "../lib/protocolTypes";

interface CommandCardProps {
  command: SavedCommand;
  deviceName?: string | null;
  protocols?: Protocol[];
  onEdit: (command: SavedCommand) => void;
  onDuplicate?: (command: SavedCommand) => void;
  onExport?: (command: SavedCommand) => void;
  onDelete?: (command: SavedCommand) => void;
  showActions?: boolean;
  editOnly?: boolean;
}

/**
 * Card view for displaying a command with full details
 */
export const CommandCard: React.FC<CommandCardProps> = ({
  command,
  deviceName,
  protocols,
  onEdit,
  onDuplicate,
  onExport,
  onDelete,
  showActions = true,
  editOnly = false,
}) => {
  const isProtocolCommand = command.source === "PROTOCOL";
  const protocolName =
    isProtocolCommand && command.protocolLayer && protocols
      ? protocols.find((p) => p.id === command.protocolLayer?.protocolId)?.name
      : null;

  // Use effective mode/payload which handles both CUSTOM and PROTOCOL commands
  const commandMode = getEffectiveMode(command);
  const commandPayload = getEffectivePayload(command);

  return (
    <div className="group relative bg-card border border-border rounded-lg p-4 hover:border-primary/50 hover:shadow-md transition-all flex flex-col h-full">
      {/* Command Icon & Name */}
      <div className="flex items-start gap-3 mb-3">
        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
          {isProtocolCommand ? (
            <Layers className="w-5 h-5 text-blue-500" />
          ) : (
            <Terminal className="w-5 h-5 text-primary" />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="font-semibold truncate">{command.name}</h3>
          <div className="flex items-center gap-2 text-xs text-muted-foreground flex-wrap">
            <Badge variant="secondary" className="text-[10px]">
              {commandMode}
            </Badge>
            {protocolName && (
              <Badge variant="outline" className="text-[10px]">
                {protocolName}
              </Badge>
            )}
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
      {commandPayload && (
        <div className="bg-muted/50 rounded px-2 py-1 mb-3 font-mono text-xs text-muted-foreground truncate">
          {commandPayload}
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
        {deviceName && command.deviceId && (
          <Link
            to={`/devices/${command.deviceId}/edit`}
            className="text-primary hover:underline hover:text-primary/80 transition-colors"
            onClick={(e) => e.stopPropagation()}
          >
            • {deviceName}
          </Link>
        )}
      </div>

      {/* Spacer to push actions to bottom */}
      <div className="flex-1" />

      {/* Actions */}
      {showActions && (
        <div className="flex items-center gap-2 pt-3 border-t border-border">
          {editOnly ? (
            <Button
              variant="outline"
              size="sm"
              className="w-full gap-2"
              onClick={() => onEdit(command)}
            >
              <Edit className="w-3.5 h-3.5" />
              Edit
            </Button>
          ) : (
            <>
              <Button
                variant="outline"
                size="sm"
                className="flex-1 gap-2"
                onClick={() => onEdit(command)}
              >
                <Edit className="w-3.5 h-3.5" />
                Edit
              </Button>
              {onDuplicate && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => onDuplicate(command)}
                  title="Duplicate"
                >
                  <Copy className="w-3.5 h-3.5" />
                </Button>
              )}
              {onExport && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => onExport(command)}
                  title="Export"
                >
                  <Download className="w-3.5 h-3.5" />
                </Button>
              )}
              {onDelete && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-destructive hover:text-destructive"
                  onClick={() => onDelete(command)}
                  title="Delete"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
};

interface CommandListItemProps {
  command: SavedCommand;
  protocols?: Protocol[];
  onEdit: (command: SavedCommand) => void;
  showEditButton?: boolean;
}

/**
 * Compact list view for displaying a command
 */
export const CommandListItem: React.FC<CommandListItemProps> = ({
  command,
  protocols,
  onEdit,
  showEditButton = true,
}) => {
  const isProtocolCommand = command.source === "PROTOCOL";
  const protocolName =
    isProtocolCommand && command.protocolLayer && protocols
      ? protocols.find((p) => p.id === command.protocolLayer?.protocolId)?.name
      : null;

  // Use effective mode which handles both CUSTOM and PROTOCOL commands
  const commandMode = getEffectiveMode(command);

  return (
    <div className="flex items-center justify-between p-3 border border-border rounded-lg hover:bg-muted/50">
      <div className="flex items-center gap-2 flex-1 min-w-0">
        {/* Protocol Icon + Badge */}
        {isProtocolCommand && (
          <>
            <Layers className="w-4 h-4 text-blue-500 shrink-0" />
            {protocolName && (
              <Badge variant="outline" className="text-xs">
                {protocolName}
              </Badge>
            )}
          </>
        )}

        {/* Command Name */}
        <span className="font-medium truncate">{command.name}</span>

        {/* Group */}
        {command.group && (
          <span className="text-xs text-muted-foreground">{command.group}</span>
        )}

        {/* Mode Badge */}
        <Badge variant="secondary" className="text-[10px] ml-auto shrink-0">
          {commandMode}
        </Badge>
      </div>

      {/* Edit Button */}
      {showEditButton && (
        <Button variant="ghost" size="sm" onClick={() => onEdit(command)}>
          <Edit className="w-4 h-4" />
        </Button>
      )}
    </div>
  );
};
