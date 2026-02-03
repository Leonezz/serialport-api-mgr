/**
 * Protocol Editor - Commands Tab
 *
 * Manages protocol command templates with filtering and CRUD operations
 */

import { useState } from "react";
import { Command, Pencil, Plus, Trash2, UserPlus } from "lucide-react";
import { Button } from "../../../components/ui/Button";
import { Input } from "../../../components/ui/Input";
import { EmptyState } from "../../../components/ui/EmptyState";
import type {
  CommandTemplate,
  SimpleCommand,
} from "../../../lib/protocolTypes";
import type { CommandsTabProps } from "../protocolEditorTypes";

export const CommandsTab: React.FC<CommandsTabProps> = ({
  editState,
  onAddCommand,
  onDeleteCommand,
  onEditCommand,
  onAddToDevice,
  linkedDevices,
}) => {
  const [filter, setFilter] = useState("");

  // Filter commands by name or description
  const filteredCommands = editState.commands.filter((cmd) => {
    if (!filter) return true;
    const lowerFilter = filter.toLowerCase();
    return (
      cmd.name.toLowerCase().includes(lowerFilter) ||
      cmd.description?.toLowerCase().includes(lowerFilter)
    );
  });

  // Get mode label for command
  const getModeLabel = (command: CommandTemplate): string => {
    if (command.type === "SIMPLE") {
      return (command as SimpleCommand).mode || "TEXT";
    }
    return "STRUCT";
  };

  // Get param count for command
  const getParamCount = (command: CommandTemplate): string => {
    const count = command.parameters?.length || 0;
    if (count === 0) return "No params";
    return `${count} param${count > 1 ? "s" : ""}`;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Protocol Commands</h2>
          <p className="text-sm text-muted-foreground">
            Define command templates that use the message structures.
          </p>
        </div>
        <Button size="sm" className="gap-2" onClick={onAddCommand}>
          <Plus className="w-4 h-4" />
          Add Command
        </Button>
      </div>

      {/* Filter Input */}
      {editState.commands.length > 0 && (
        <div className="relative">
          <Input
            placeholder="Filter commands..."
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="pl-9"
          />
          <Command className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        </div>
      )}

      {editState.commands.length === 0 ? (
        <div className="border border-dashed border-border rounded-lg">
          <EmptyState
            variant="commands"
            title="No commands defined"
            description="Add commands to define the protocol's communication interface"
            onAction={onAddCommand}
          />
        </div>
      ) : filteredCommands.length === 0 ? (
        <div className="border border-dashed border-border rounded-lg">
          <EmptyState
            variant="search"
            description="No commands match your filter"
            hideAction
          />
        </div>
      ) : (
        <div className="space-y-3">
          {filteredCommands.map((command) => (
            <div
              key={command.id}
              className="p-4 border border-border rounded-lg hover:border-primary/50 transition-colors"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <Command className="w-4 h-4 text-primary shrink-0" />
                    <h3 className="font-medium truncate">{command.name}</h3>
                  </div>
                  {command.description && (
                    <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                      {command.description}
                    </p>
                  )}
                  {/* Mode and Params Badges */}
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-xs px-2 py-0.5 rounded bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">
                      {getModeLabel(command)}
                    </span>
                    <span className="text-xs px-2 py-0.5 rounded bg-muted text-muted-foreground">
                      {getParamCount(command)}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0"
                    onClick={() => onAddToDevice(command)}
                    disabled={linkedDevices.length === 0}
                    title={
                      linkedDevices.length === 0
                        ? "No devices linked to this protocol"
                        : "Add to device"
                    }
                  >
                    <UserPlus className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0"
                    onClick={() => onEditCommand(command)}
                  >
                    <Pencil className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                    onClick={() => onDeleteCommand(command.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
