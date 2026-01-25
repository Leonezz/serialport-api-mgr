/**
 * Protocol Editor - General Tab
 *
 * Handles basic protocol information: name, version, description, tags, metadata
 */

import { useState } from "react";
import { Button } from "../../../components/ui/Button";
import { Input } from "../../../components/ui/Input";
import { Label } from "../../../components/ui/Label";
import { Textarea } from "../../../components/ui/Textarea";
import type { GeneralTabProps } from "../types";

export const GeneralTab: React.FC<GeneralTabProps> = ({
  editState,
  onChange,
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
    </div>
  );
};
