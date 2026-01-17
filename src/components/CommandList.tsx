import React from "react";
import { Play, Trash2 } from "lucide-react";
import { Button } from "./ui/Button";
import { Badge } from "./ui/Badge";
import { SavedCommand } from "@/types";

interface Props {
  commands: SavedCommand[];
  onSend: (cmd: SavedCommand) => void;
  onDelete: (id: string) => void;
}

const CommandList: React.FC<Props> = ({ commands, onSend, onDelete }) => {
  return (
    <div className="flex flex-col gap-1">
      {commands.length === 0 && (
        <div className="p-8 text-center text-muted-foreground text-sm italic">
          No saved commands.
        </div>
      )}
      {commands.map((cmd) => (
        <div
          key={cmd.id}
          className="p-3 hover:bg-muted/50 rounded-md group transition-colors flex flex-col gap-2 border border-transparent hover:border-border"
        >
          <div className="flex items-center justify-between">
            <span className="font-medium text-foreground text-sm truncate pr-2">
              {cmd.name}
            </span>
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 text-primary hover:text-primary hover:bg-primary/10"
                onClick={() => onSend(cmd)}
                title="Send"
              >
                <Play className="w-3 h-3 fill-current" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                onClick={() => onDelete(cmd.id)}
                title="Delete"
              >
                <Trash2 className="w-3 h-3" />
              </Button>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <code className="text-xs text-muted-foreground font-mono truncate max-w-35 bg-muted px-1.5 py-0.5 rounded">
              {(cmd.payload || "").replace(/\r/g, "\\r").replace(/\n/g, "\\n")}
            </code>
            <Badge
              variant="secondary"
              className="text-[10px] h-5 px-1 font-mono"
            >
              {cmd.mode === "HEX" ? "HEX" : "TXT"}
            </Badge>
          </div>
        </div>
      ))}
    </div>
  );
};

export default CommandList;
