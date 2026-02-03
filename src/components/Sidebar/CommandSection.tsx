import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { SavedCommand } from "../../types";
import {
  Play,
  Trash2,
  Plus,
  Folder,
  Link2,
  Layers,
  ExternalLink,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import { IconButton } from "../ui/IconButton";
import { Badge } from "../ui/Badge";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "../ui/Accordion";
import { cn } from "../../lib/utils";
import { EmptyState } from "../ui/EmptyState";
import type { TFunction } from "i18next";

interface CommandGroup {
  name: string;
  items: SavedCommand[];
}

interface ConfirmationRequest {
  title: string;
  message: string;
  action: () => void;
}

interface CommandSectionProps {
  filteredCommands: SavedCommand[];
  groupedCommands: CommandGroup[];
  selectedDeviceId: string | null;
  selectedCommandId: string | null;
  collapsedGroups: Set<string>;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  onToggleGroup: (groupName: string) => void;
  onCommandClick: (cmd: SavedCommand) => void;
  onSendCommand: (cmd: SavedCommand) => void;
  onCreateCommand: (groupName?: string) => void;
  onDeleteCommand: (id: string) => void;
  onDeleteCommands: (ids: string[]) => void;
  onRequestConfirmation: (confirmation: ConfirmationRequest) => void;
  t: TFunction;
}

const CommandSection: React.FC<CommandSectionProps> = ({
  filteredCommands,
  groupedCommands,
  selectedDeviceId,
  selectedCommandId,
  collapsedGroups,
  isCollapsed,
  onToggleCollapse,
  onToggleGroup,
  onCommandClick,
  onSendCommand,
  onCreateCommand,
  onDeleteCommand,
  onDeleteCommands,
  onRequestConfirmation,
  t,
}) => {
  const navigate = useNavigate();

  return (
    <>
      <div
        className="h-8 flex items-center justify-between px-3 cursor-pointer hover:bg-bg-hover transition-colors border-b border-border-default"
        onClick={onToggleCollapse}
      >
        <div className="flex items-center gap-2">
          {isCollapsed ? (
            <ChevronRight className="w-4 h-4 text-text-muted" />
          ) : (
            <ChevronDown className="w-4 h-4 text-text-muted" />
          )}
          <span className="text-label-sm font-semibold text-text-secondary uppercase tracking-wider">
            {t("sidebar.commands")}
          </span>
          <Badge variant="secondary" className="text-[10px] h-4 px-1.5 py-0">
            {filteredCommands.length}
          </Badge>
        </div>
        <div
          className="flex items-center gap-1"
          onClick={(e) => e.stopPropagation()}
        >
          <Link
            to="/commands"
            className="inline-flex items-center justify-center rounded-radius-sm transition-colors h-6 w-6 p-0.5 text-muted-foreground hover:bg-muted hover:text-foreground"
            aria-label="Open Command Library"
            title="Open Command Library"
          >
            <ExternalLink className="w-4 h-4" />
          </Link>
          <IconButton
            variant="ghost"
            size="xs"
            onClick={() => onCreateCommand()}
            aria-label={t("sidebar.new_command")}
            title={t("sidebar.new_command")}
          >
            <Plus className="w-3.5 h-3.5" />
          </IconButton>
        </div>
      </div>
      {!isCollapsed && (
        <div className="px-3 py-2">
          {filteredCommands.length === 0 ? (
            <EmptyState
              variant="commands"
              title={
                selectedDeviceId ? "No commands for this device" : undefined
              }
              className="py-4"
              onAction={() => onCreateCommand()}
            />
          ) : (
            <Accordion className="w-full space-y-1">
              {groupedCommands.map((group) => {
                if (group.items.length === 0) return null;
                const isUngrouped = group.name === "Ungrouped";
                const isExpanded = !collapsedGroups.has(group.name);

                return (
                  <AccordionItem key={group.name} className="border-none">
                    {!isUngrouped && (
                      <div className="flex items-center justify-between group/header pr-1 hover:bg-bg-hover rounded-radius-sm">
                        <AccordionTrigger
                          isOpen={isExpanded}
                          onClick={() => onToggleGroup(group.name)}
                          className="py-1.5 px-2 hover:no-underline hover:text-accent-primary"
                        >
                          <div className="flex items-center gap-2">
                            <Folder className="w-3.5 h-3.5 fill-current opacity-50" />
                            <span className="text-body-xs font-semibold">
                              {group.name}
                            </span>
                          </div>
                        </AccordionTrigger>
                        <div className="flex gap-0.5 opacity-0 group-hover/header:opacity-100 transition-opacity mr-1">
                          <IconButton
                            variant="primary"
                            size="xs"
                            onClick={(e) => {
                              e.stopPropagation();
                              onCreateCommand(group.name);
                            }}
                            aria-label="Add command to group"
                            title="Add command to group"
                          >
                            <Plus className="w-3 h-3" />
                          </IconButton>
                          <IconButton
                            variant="destructive"
                            size="xs"
                            onClick={(e) => {
                              e.stopPropagation();
                              onRequestConfirmation({
                                title: t("modal.delete"),
                                message: `Delete "${group.name}" and all its commands?`,
                                action: () =>
                                  onDeleteCommands(
                                    group.items.map((i) => i.id),
                                  ),
                              });
                            }}
                            aria-label="Delete group"
                            title="Delete group"
                          >
                            <Trash2 className="w-3 h-3" />
                          </IconButton>
                        </div>
                      </div>
                    )}

                    <AccordionContent
                      isOpen={isUngrouped ? true : isExpanded}
                      className={cn(
                        !isUngrouped &&
                          "pl-2 ml-2 border-l border-border-default/40",
                      )}
                    >
                      <div className="flex flex-col gap-1.5 pt-1">
                        {group.items.map((cmd) => {
                          const isSelected = selectedCommandId === cmd.id;
                          return (
                            <div
                              key={cmd.id}
                              onClick={() => onCommandClick(cmd)}
                              className={cn(
                                "group flex flex-col gap-1 p-2 rounded-radius-md transition-all relative cursor-pointer border",
                                isSelected
                                  ? "bg-accent-primary/10 border-accent-primary shadow-sm ring-1 ring-accent-primary/20"
                                  : "bg-bg-muted/30 border-border-default/50 hover:bg-bg-hover hover:border-border-default hover:shadow-sm",
                              )}
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-1.5 overflow-hidden">
                                  {cmd.source === "PROTOCOL" && (
                                    <Layers className="w-3 h-3 text-blue-500 shrink-0" />
                                  )}
                                  <span
                                    className={cn(
                                      "font-medium text-body-sm truncate",
                                      isSelected && "text-accent-primary",
                                    )}
                                  >
                                    {cmd.name}
                                  </span>
                                  {cmd.usedBy?.length ? (
                                    <span className="text-[9px] opacity-50">
                                      <Link2 className="w-2.5 h-2.5" />
                                    </span>
                                  ) : null}
                                </div>
                                <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                                  <IconButton
                                    variant="primary"
                                    size="xs"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      onSendCommand(cmd);
                                    }}
                                    aria-label="Send"
                                    title="Send"
                                  >
                                    <Play className="w-3 h-3 fill-current" />
                                  </IconButton>
                                  <IconButton
                                    variant="ghost"
                                    size="xs"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      navigate(`/commands/${cmd.id}/edit`);
                                    }}
                                    aria-label="Open Full Editor"
                                    title="Open Full Editor"
                                  >
                                    <ExternalLink className="w-3 h-3" />
                                  </IconButton>
                                  <IconButton
                                    variant="destructive"
                                    size="xs"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      onRequestConfirmation({
                                        title: t("modal.delete"),
                                        message: `Delete command "${cmd.name}"?`,
                                        action: () => onDeleteCommand(cmd.id),
                                      });
                                    }}
                                    aria-label="Delete"
                                    title="Delete"
                                  >
                                    <Trash2 className="w-3 h-3" />
                                  </IconButton>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <Badge
                                  variant="outline"
                                  className="text-[8px] h-3.5 px-1 py-0 border-border-default/60 text-text-muted uppercase"
                                >
                                  {cmd.mode}
                                </Badge>
                                <code className="text-[10px] text-text-muted truncate font-mono flex-1 opacity-70">
                                  {(cmd.payload || "")
                                    .replace(/\r/g, "CR")
                                    .replace(/\n/g, "LF")}
                                </code>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                );
              })}
            </Accordion>
          )}
        </div>
      )}
    </>
  );
};

export default CommandSection;
