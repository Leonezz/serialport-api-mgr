/**
 * Protocol Editor - General Tab
 *
 * Handles basic protocol information: name, version, description, tags, metadata
 */

import { useState } from "react";
import { Link } from "react-router-dom";
import { ExternalLink } from "lucide-react";
import { Button, Input, Label, Textarea } from "../../../components/ui";
import type { GeneralTabProps } from "../protocolEditorTypes";

export const GeneralTab: React.FC<GeneralTabProps> = ({
  editState,
  onChange,
  linkedDevices,
  linkedCommands,
}) => {
  const [tagInput, setTagInput] = useState("");

  const handleAddTag = () => {
    if (tagInput.trim() && !editState.tags.includes(tagInput.trim())) {
      onChange("tags", [...editState.tags, tagInput.trim()]);
      setTagInput("");
    }
  };

  const handleRemoveTag = (tag: string) => {
    onChange(
      "tags",
      editState.tags.filter((t) => t !== tag),
    );
  };

  return (
    <div className="space-y-6">
      <section className="space-y-4">
        <h2 className="text-lg font-semibold">Basic Information</h2>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              value={editState.name}
              onChange={(e) => onChange("name", e.target.value)}
              placeholder="Protocol name"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="version">Version</Label>
            <Input
              id="version"
              value={editState.version}
              onChange={(e) => onChange("version", e.target.value)}
              placeholder="1.0"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            value={editState.description || ""}
            onChange={(e) => onChange("description", e.target.value)}
            placeholder="Describe the protocol..."
            rows={3}
          />
        </div>

        <div className="space-y-2">
          <Label>Tags</Label>
          <div className="flex flex-wrap gap-2 mb-2">
            {editState.tags.map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center gap-1 px-2 py-1 text-sm bg-muted rounded-md"
              >
                {tag}
                <button
                  onClick={() => handleRemoveTag(tag)}
                  className="hover:text-destructive"
                >
                  ×
                </button>
              </span>
            ))}
          </div>
          <div className="flex gap-2">
            <Input
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              placeholder="Add tag..."
              onKeyDown={(e) => e.key === "Enter" && handleAddTag()}
            />
            <Button variant="outline" onClick={handleAddTag}>
              Add
            </Button>
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold">Metadata</h2>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="author">Author</Label>
            <Input
              id="author"
              value={editState.author || ""}
              onChange={(e) => onChange("author", e.target.value)}
              placeholder="Author name"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="sourceUrl">Documentation URL</Label>
            <Input
              id="sourceUrl"
              type="url"
              value={editState.sourceUrl || ""}
              onChange={(e) => onChange("sourceUrl", e.target.value)}
              placeholder="https://..."
            />
          </div>
        </div>

        {/* Timestamps */}
        <div className="pt-4 border-t border-border">
          <div className="grid grid-cols-2 gap-4 text-sm text-muted-foreground">
            <div className="space-y-1">
              <span className="text-[10px] uppercase font-bold tracking-wider">
                Created
              </span>
              <p className="font-mono">
                {editState.createdAt
                  ? new Date(editState.createdAt).toLocaleString()
                  : "N/A"}
              </p>
            </div>
            <div className="space-y-1">
              <span className="text-[10px] uppercase font-bold tracking-wider">
                Last Modified
              </span>
              <p className="font-mono">
                {editState.updatedAt
                  ? new Date(editState.updatedAt).toLocaleString()
                  : "N/A"}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Used By Section */}
      {(linkedDevices.length > 0 || linkedCommands.length > 0) && (
        <section className="space-y-4">
          <h2 className="text-lg font-semibold">Used By</h2>

          {/* Linked Devices */}
          {linkedDevices.length > 0 && (
            <div className="space-y-2">
              <Label>Devices ({linkedDevices.length})</Label>
              <div className="grid grid-cols-1 gap-2">
                {linkedDevices.map((device) => (
                  <Link
                    key={device.id}
                    to={`/devices/${device.id}/edit`}
                    className="flex items-center justify-between p-3 bg-muted/50 rounded-lg hover:bg-muted transition-colors group"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{device.name}</p>
                      {device.description && (
                        <p className="text-sm text-muted-foreground truncate">
                          {device.description}
                        </p>
                      )}
                    </div>
                    <ExternalLink className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors ml-2 shrink-0" />
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Linked Commands */}
          {linkedCommands.length > 0 && (
            <div className="space-y-2">
              <Label>Commands ({linkedCommands.length})</Label>
              <div className="grid grid-cols-1 gap-2">
                {linkedCommands.map((command) => (
                  <Link
                    key={command.id}
                    to={`/commands/${command.id}/edit`}
                    className="flex items-center justify-between p-3 bg-muted/50 rounded-lg hover:bg-muted transition-colors group"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{command.name}</p>
                      {command.description && (
                        <p className="text-sm text-muted-foreground truncate">
                          {command.description}
                        </p>
                      )}
                    </div>
                    <ExternalLink className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors ml-2 shrink-0" />
                  </Link>
                ))}
              </div>
            </div>
          )}
        </section>
      )}
    </div>
  );
};
