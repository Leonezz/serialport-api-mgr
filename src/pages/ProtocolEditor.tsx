/**
 * Protocol Editor Page
 *
 * Full-page editor for Protocol definitions.
 * Contains tabs for:
 * - General: Name, version, description, tags
 * - Framing: Framing strategy configuration
 * - Structures: Message structure designer
 * - Commands: Command template editor
 */

import React, { useState, useMemo } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import {
  Settings,
  Layers,
  Command,
  Check,
  Play,
  Terminal,
  Plus,
  Trash2,
  GripVertical,
  ChevronDown,
  ChevronRight,
  Info,
  Pencil,
  Eye,
  X,
  Code,
  AlertCircle,
} from "lucide-react";
import { useStore } from "../lib/store";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { NumberInput } from "../components/ui/NumberInput";
import { HexInput } from "../components/ui/HexInput";
import { Label } from "../components/ui/Label";
import { Textarea } from "../components/ui/Textarea";
import { Select } from "../components/ui/Select";
import { Checkbox } from "../components/ui/Checkbox";
import { Radio } from "../components/ui/Radio";
import { Card } from "../components/ui/Card";
import { Badge } from "../components/ui/Badge";
import {
  SortableList,
  DragHandle,
  DragHandleProps,
} from "../components/ui/SortableList";
import { PageHeader } from "../routes";
import { EmptyState } from "../components/ui/EmptyState";
import type {
  Protocol,
  FramingConfig,
  SimpleCommand,
  StructuredCommand,
  MessageStructure,
  MessageElement,
  ElementConfig,
  CommandTemplate,
  CommandParameter,
  FramingStep,
} from "../lib/protocolTypes";
import { cn, generateId } from "../lib/utils";

// Tab definitions
type EditorTab = "general" | "framing" | "structures" | "commands";

const TABS: { id: EditorTab; label: string; icon: React.ElementType }[] = [
  { id: "general", label: "General", icon: Settings },
  { id: "framing", label: "Framing", icon: Layers },
  { id: "structures", label: "Structures", icon: Terminal },
  { id: "commands", label: "Commands", icon: Command },
];

interface ProtocolEditorProps {
  initialTab?: EditorTab;
}

// Inner component that handles the actual editing
// Uses key={protocol.id} from parent to reset state when navigating between protocols
interface ProtocolEditorContentProps {
  protocol: Protocol;
  initialTab: EditorTab;
}

const ProtocolEditorContent: React.FC<ProtocolEditorContentProps> = ({
  protocol,
  initialTab,
}) => {
  const navigate = useNavigate();
  const {
    updateProtocol,
    addMessageStructure,
    deleteMessageStructure,
    addCommandTemplate,
    deleteCommandTemplate,
    updateCommandTemplate,
    addToast,
  } = useStore();
  const id = protocol.id;

  const [activeTab, setActiveTab] = useState<EditorTab>(initialTab);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Local edit state - initialized from protocol prop on mount
  const [editState, setEditState] = useState<Protocol>(() => ({ ...protocol }));

  // Command edit modal state
  const [editingCommand, setEditingCommand] = useState<CommandTemplate | null>(
    null,
  );

  const handleSave = () => {
    updateProtocol(id, editState);
    setHasUnsavedChanges(false);
    addToast(
      "success",
      "Saved",
      `Protocol "${editState.name}" saved successfully.`,
    );
  };

  const handleChange = <K extends keyof Protocol>(
    key: K,
    value: Protocol[K],
  ) => {
    setEditState((prev) => ({ ...prev, [key]: value }));
    setHasUnsavedChanges(true);
  };

  // Structure handlers
  const handleAddStructure = () => {
    const newId = addMessageStructure(id, {
      name: "New Structure",
      description: "",
      encoding: "BINARY",
      byteOrder: "BE",
      elements: [],
    });
    if (newId) {
      // Refresh editState from store
      const updatedProtocol = useStore
        .getState()
        .protocols.find((p) => p.id === id);
      if (updatedProtocol) {
        setEditState({ ...updatedProtocol });
      }
      addToast("success", "Structure Added", "New message structure created.");
    }
  };

  const handleDeleteStructure = (structureId: string) => {
    deleteMessageStructure(id, structureId);
    const updatedProtocol = useStore
      .getState()
      .protocols.find((p) => p.id === id);
    if (updatedProtocol) {
      setEditState({ ...updatedProtocol });
    }
    addToast("info", "Deleted", "Message structure deleted.");
  };

  // Command handlers
  const handleAddCommand = () => {
    const newId = addCommandTemplate(id, {
      type: "SIMPLE",
      name: "New Command",
      description: "",
      tags: [],
      payload: "",
      mode: "TEXT",
      parameters: [],
      extractVariables: [],
    } as Omit<SimpleCommand, "id" | "createdAt" | "updatedAt">);
    if (newId) {
      const updatedProtocol = useStore
        .getState()
        .protocols.find((p) => p.id === id);
      if (updatedProtocol) {
        setEditState({ ...updatedProtocol });
      }
      addToast("success", "Command Added", "New command template created.");
    }
  };

  const handleDeleteCommand = (commandId: string) => {
    deleteCommandTemplate(id, commandId);
    const updatedProtocol = useStore
      .getState()
      .protocols.find((p) => p.id === id);
    if (updatedProtocol) {
      setEditState({ ...updatedProtocol });
    }
    addToast("info", "Deleted", "Command template deleted.");
  };

  const handleEditCommand = (command: CommandTemplate) => {
    setEditingCommand({ ...command });
  };

  const handleSaveCommand = (command: CommandTemplate) => {
    updateCommandTemplate(id, command.id, command);
    const updatedProtocol = useStore
      .getState()
      .protocols.find((p) => p.id === id);
    if (updatedProtocol) {
      setEditState({ ...updatedProtocol });
    }
    setEditingCommand(null);
    addToast("success", "Command Updated", `Command "${command.name}" saved.`);
  };

  const handleTestProtocol = () => {
    // Navigate to main workspace - user can test commands there
    navigate("/");
    addToast(
      "info",
      "Test Mode",
      `Navigate to the Commands tab in the sidebar to test "${editState.name}" commands.`,
    );
  };

  return (
    <div className="flex flex-col h-full bg-background">
      <PageHeader
        title={editState.name}
        backTo="/protocols"
        backLabel="Protocols"
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="gap-2"
              onClick={handleTestProtocol}
            >
              <Play className="w-4 h-4" />
              Test
            </Button>
            <Button
              size="sm"
              className="gap-2"
              onClick={handleSave}
              disabled={!hasUnsavedChanges}
            >
              <Check className="w-4 h-4" />
              Save
            </Button>
          </div>
        }
      />

      {/* Tabs */}
      <div className="border-b border-border px-4">
        <div className="flex gap-1">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors",
                  activeTab === tab.id
                    ? "border-primary text-primary"
                    : "border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/50",
                )}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-auto p-6">
        <div className="max-w-4xl mx-auto">
          {activeTab === "general" && (
            <GeneralTab editState={editState} onChange={handleChange} />
          )}
          {activeTab === "framing" && (
            <FramingTab editState={editState} onChange={handleChange} />
          )}
          {activeTab === "structures" && (
            <StructuresTab
              editState={editState}
              onChange={handleChange}
              onAddStructure={handleAddStructure}
              onDeleteStructure={handleDeleteStructure}
            />
          )}
          {activeTab === "commands" && (
            <CommandsTab
              editState={editState}
              onChange={handleChange}
              onAddCommand={handleAddCommand}
              onDeleteCommand={handleDeleteCommand}
              onEditCommand={handleEditCommand}
            />
          )}
        </div>
      </div>

      {/* Command Edit Modal */}
      {editingCommand && (
        <CommandEditModal
          command={editingCommand}
          messageStructures={editState.messageStructures}
          onSave={handleSaveCommand}
          onClose={() => setEditingCommand(null)}
        />
      )}
    </div>
  );
};

// Wrapper component that handles routing and not-found state
const ProtocolEditor: React.FC<ProtocolEditorProps> = ({
  initialTab = "general",
}) => {
  const { id } = useParams<{ id: string }>();
  const { protocols } = useStore();

  // Find the protocol
  const protocol = useMemo(
    () => protocols.find((p) => p.id === id),
    [protocols, id],
  );

  if (!protocol) {
    return (
      <div className="flex flex-col h-full bg-background">
        <PageHeader
          title="Protocol Not Found"
          backTo="/protocols"
          backLabel="Protocols"
        />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <Terminal className="w-12 h-12 text-muted-foreground/50 mx-auto mb-4" />
            <p className="text-muted-foreground">
              Protocol not found. It may have been deleted.
            </p>
            <Link to="/protocols">
              <Button className="mt-4">Back to Protocols</Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Key forces re-mount when navigating to a different protocol
  return (
    <ProtocolEditorContent
      key={protocol.id}
      protocol={protocol}
      initialTab={initialTab}
    />
  );
};

// General Tab Component
const GeneralTab: React.FC<{
  editState: Protocol;
  onChange: <K extends keyof Protocol>(key: K, value: Protocol[K]) => void;
}> = ({ editState, onChange }) => {
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

// Helper to convert delimiter string to hex display
const stringToHexDisplay = (str: string): string => {
  // Handle escape sequences
  const unescaped = str
    .replace(/\\r/g, "\r")
    .replace(/\\n/g, "\n")
    .replace(/\\t/g, "\t")
    .replace(/\\0/g, "\0");
  return Array.from(unescaped)
    .map(
      (c) => "0x" + c.charCodeAt(0).toString(16).toUpperCase().padStart(2, "0"),
    )
    .join(" ");
};

// Delimiter Configuration Component (per FIGMA-DESIGN.md 10.2)
const DelimiterConfig: React.FC<{
  framing: FramingConfig;
  onChange: (updates: Partial<FramingConfig>) => void;
}> = ({ framing, onChange }) => {
  const delimiter = framing.delimiter;
  // Track editing state separately to allow empty input during editing
  const [editingValue, setEditingValue] = useState<string | null>(null);

  // Get current delimiter as display string
  const getDelimiterDisplay = (): string => {
    if (!delimiter?.sequence) return "";
    if (typeof delimiter.sequence === "string") {
      // Convert special chars to escape sequences for display
      return delimiter.sequence
        .replace(/\r/g, "\\r")
        .replace(/\n/g, "\\n")
        .replace(/\t/g, "\\t")
        .replace(/\0/g, "\\0");
    }
    // Number array - convert to escape sequence string
    return delimiter.sequence
      .map((b) => {
        if (b === 0x0d) return "\\r";
        if (b === 0x0a) return "\\n";
        if (b === 0x09) return "\\t";
        if (b === 0x00) return "\\0";
        if (b >= 32 && b < 127) return String.fromCharCode(b);
        return `\\x${b.toString(16).padStart(2, "0")}`;
      })
      .join("");
  };

  // Display value: editing string when focused, formatted value when not
  const displayValue =
    editingValue !== null ? editingValue : getDelimiterDisplay();

  // Get hex preview of delimiter
  const getHexPreview = (): string => {
    if (!delimiter?.sequence) return "0x0D 0x0A";
    if (typeof delimiter.sequence === "string") {
      return stringToHexDisplay(delimiter.sequence);
    }
    return delimiter.sequence
      .map((b) => "0x" + b.toString(16).toUpperCase().padStart(2, "0"))
      .join(" ");
  };

  const handleDelimiterChange = (value: string) => {
    // Parse escape sequences
    const parsed = value
      .replace(/\\r/g, "\r")
      .replace(/\\n/g, "\n")
      .replace(/\\t/g, "\t")
      .replace(/\\0/g, "\0")
      .replace(/\\x([0-9a-fA-F]{2})/g, (_, hex) =>
        String.fromCharCode(parseInt(hex, 16)),
      );
    onChange({
      delimiter: {
        ...delimiter,
        sequence: parsed,
        position: delimiter?.position || "SUFFIX",
        includeInFrame: delimiter?.includeInFrame ?? false,
      },
    });
  };

  const handlePositionChange = (position: "SUFFIX" | "PREFIX") => {
    onChange({
      delimiter: {
        ...delimiter,
        sequence: delimiter?.sequence || "\r\n",
        position,
        includeInFrame: delimiter?.includeInFrame ?? false,
      },
    });
  };

  const handleIncludeChange = (includeInFrame: boolean) => {
    onChange({
      delimiter: {
        ...delimiter,
        sequence: delimiter?.sequence || "\r\n",
        position: delimiter?.position || "SUFFIX",
        includeInFrame,
      },
    });
  };

  return (
    <div className="p-4 border border-border rounded-lg space-y-4">
      <h3 className="font-medium">Delimiter Options</h3>

      {/* Delimiter Value with Hex Preview */}
      <div className="space-y-2">
        <Label>Delimiter Value</Label>
        <div className="grid grid-cols-2 gap-3">
          <Input
            value={displayValue}
            onChange={(e) => setEditingValue(e.target.value)}
            onFocus={() => setEditingValue(getDelimiterDisplay())}
            onBlur={() => {
              // Apply default if empty, otherwise commit the value
              if (editingValue === "") {
                handleDelimiterChange("\\r\\n");
              } else if (editingValue !== null) {
                handleDelimiterChange(editingValue);
              }
              setEditingValue(null);
            }}
            placeholder="\r\n"
          />
          <div className="flex items-center px-3 bg-muted rounded-md border border-border font-mono text-sm text-muted-foreground">
            {getHexPreview()}
          </div>
        </div>
        <p className="text-xs text-muted-foreground">
          Use escape sequences: \r (CR), \n (LF), \t (Tab), \x00 (hex byte)
        </p>
      </div>

      {/* Delimiter Position - Radio Buttons */}
      <div className="space-y-2">
        <Label>Delimiter Position</Label>
        <div className="flex gap-4 p-2 bg-muted/30 rounded-lg border border-border/50">
          <label className="flex items-center gap-2 cursor-pointer flex-1 p-2 rounded-md hover:bg-background/50 transition-colors">
            <input
              type="radio"
              name="delimiter-position"
              checked={delimiter?.position === "PREFIX"}
              onChange={() => handlePositionChange("PREFIX")}
              className="w-4 h-4 accent-primary"
            />
            <div className="flex flex-col">
              <span className="text-sm font-medium">Before frame</span>
              <span className="text-xs text-muted-foreground">
                Delimiter → Data
              </span>
            </div>
          </label>
          <label className="flex items-center gap-2 cursor-pointer flex-1 p-2 rounded-md hover:bg-background/50 transition-colors">
            <input
              type="radio"
              name="delimiter-position"
              checked={delimiter?.position === "SUFFIX" || !delimiter?.position}
              onChange={() => handlePositionChange("SUFFIX")}
              className="w-4 h-4 accent-primary"
            />
            <div className="flex flex-col">
              <span className="text-sm font-medium">After frame</span>
              <span className="text-xs text-muted-foreground">
                Data → Delimiter
              </span>
            </div>
          </label>
        </div>
      </div>

      {/* Include in Frame Checkbox */}
      <div className="flex items-center gap-2">
        <Checkbox
          id="include-delimiter"
          checked={delimiter?.includeInFrame ?? false}
          onChange={(e) => handleIncludeChange(e.target.checked)}
        />
        <Label
          htmlFor="include-delimiter"
          className="font-normal cursor-pointer"
        >
          Include delimiter in frame data
        </Label>
      </div>

      {/* Max Frame Length */}
      <div className="space-y-2">
        <Label>Max Frame Length</Label>
        <div className="flex items-center gap-2">
          <NumberInput
            value={framing.maxFrameLength}
            defaultValue={0}
            min={0}
            onChange={(val) => onChange({ maxFrameLength: val ?? 0 })}
            className="w-32"
          />
          <span className="text-sm text-muted-foreground whitespace-nowrap">
            bytes (0 = unlimited)
          </span>
        </div>
      </div>
    </div>
  );
};

// Framing Tab Component
const FramingTab: React.FC<{
  editState: Protocol;
  onChange: <K extends keyof Protocol>(key: K, value: Protocol[K]) => void;
}> = ({ editState, onChange }) => {
  const framing = editState.framing;
  const [showPreview, setShowPreview] = useState(false);
  const [previewInput, setPreviewInput] = useState(
    "48 65 6C 6C 6F 0D 0A 57 6F 72 6C 64 0D 0A",
  );

  const handleFramingChange = (updates: Partial<FramingConfig>) => {
    onChange("framing", { ...framing, ...updates });
  };

  // Parse hex input for preview
  const parseHexInput = (hex: string): number[] => {
    return hex
      .split(/[\s,]+/)
      .filter((s) => s.length > 0)
      .map((s) => parseInt(s, 16))
      .filter((n) => !isNaN(n));
  };

  // Generate framing preview
  const generatePreview = () => {
    const bytes = parseHexInput(previewInput);
    if (bytes.length === 0) return [];

    const frames: {
      start: number;
      end: number;
      bytes: number[];
      delimStart?: number;
      delimEnd?: number;
      isTimeoutFrame?: boolean;
    }[] = [];

    switch (framing.strategy) {
      case "NONE":
        frames.push({ start: 0, end: bytes.length, bytes });
        break;
      case "DELIMITER": {
        const delim =
          typeof framing.delimiter?.sequence === "string"
            ? framing.delimiter.sequence.split("").map((c) => c.charCodeAt(0))
            : framing.delimiter?.sequence || [0x0d, 0x0a];
        const position = framing.delimiter?.position || "SUFFIX";
        const includeInFrame = framing.delimiter?.includeInFrame ?? false;

        if (position === "SUFFIX") {
          // Delimiter comes after frame data
          let start = 0;
          for (let i = 0; i <= bytes.length - delim.length; i++) {
            let match = true;
            for (let j = 0; j < delim.length; j++) {
              if (bytes[i + j] !== delim[j]) {
                match = false;
                break;
              }
            }
            if (match) {
              // Frame ends at delimiter position (or includes delimiter)
              const frameEnd = includeInFrame ? i + delim.length : i;
              const delimEnd = i + delim.length;
              if (frameEnd > start) {
                frames.push({
                  start,
                  end: delimEnd,
                  bytes: bytes.slice(start, frameEnd),
                  delimStart: i,
                  delimEnd: delimEnd,
                });
              }
              start = delimEnd;
              i += delim.length - 1;
            }
          }
          // Remaining bytes (incomplete frame)
          if (start < bytes.length) {
            frames.push({
              start,
              end: bytes.length,
              bytes: bytes.slice(start),
            });
          }
        } else {
          // PREFIX mode: Delimiter comes before frame data
          let lastDelimEnd = 0;
          for (let i = 0; i <= bytes.length - delim.length; i++) {
            let match = true;
            for (let j = 0; j < delim.length; j++) {
              if (bytes[i + j] !== delim[j]) {
                match = false;
                break;
              }
            }
            if (match) {
              // If we have data before this delimiter, it's an incomplete frame
              if (lastDelimEnd < i && lastDelimEnd > 0) {
                frames.push({
                  start: lastDelimEnd,
                  end: i,
                  bytes: bytes.slice(lastDelimEnd, i),
                });
              }
              // Mark delimiter position
              lastDelimEnd = i + delim.length;
              // For prefix, frame starts at delimiter (or after delimiter)
              const frameStart = includeInFrame ? i : i + delim.length;
              // Find next delimiter or end of data
              let nextDelimPos = bytes.length;
              for (
                let k = lastDelimEnd;
                k <= bytes.length - delim.length;
                k++
              ) {
                let nextMatch = true;
                for (let j = 0; j < delim.length; j++) {
                  if (bytes[k + j] !== delim[j]) {
                    nextMatch = false;
                    break;
                  }
                }
                if (nextMatch) {
                  nextDelimPos = k;
                  break;
                }
              }
              if (nextDelimPos > lastDelimEnd || includeInFrame) {
                frames.push({
                  start: i,
                  end: nextDelimPos,
                  bytes: bytes.slice(frameStart, nextDelimPos),
                  delimStart: i,
                  delimEnd: i + delim.length,
                });
              }
              i += delim.length - 1;
            }
          }
        }
        break;
      }
      case "TIMEOUT":
        // For preview, show as single frame with note about timing
        // Timeout framing requires actual timing data which we can't simulate
        frames.push({
          start: 0,
          end: bytes.length,
          bytes,
          isTimeoutFrame: true,
        });
        break;
      case "LENGTH_FIELD": {
        const offset = framing.lengthField?.offset || 0;
        const size = framing.lengthField?.size || 1;
        const adjustment = framing.lengthField?.adjustment || 0;
        const byteOrder = framing.lengthField?.byteOrder || "BE";
        const includesHeader = framing.lengthField?.includesHeader ?? false;
        let pos = 0;
        while (pos < bytes.length) {
          if (pos + offset + size > bytes.length) break;
          let lengthValue = 0;
          for (let i = 0; i < size; i++) {
            const idx = byteOrder === "BE" ? i : size - 1 - i;
            lengthValue = (lengthValue << 8) | bytes[pos + offset + idx];
          }
          lengthValue += adjustment;
          // Calculate frame end based on whether length includes header
          // If includesHeader: length value is total frame size from pos
          // If not: length value is body size, add header (offset + size)
          const frameEnd = includesHeader
            ? Math.min(pos + lengthValue, bytes.length)
            : Math.min(pos + offset + size + lengthValue, bytes.length);
          frames.push({
            start: pos,
            end: frameEnd,
            bytes: bytes.slice(pos, frameEnd),
          });
          pos = frameEnd;
        }
        break;
      }
      case "SYNC_PATTERN": {
        const pattern = framing.syncPattern?.pattern || [0x55, 0xaa];
        let start = -1;
        for (let i = 0; i <= bytes.length - pattern.length; i++) {
          let match = true;
          for (let j = 0; j < pattern.length; j++) {
            if (bytes[i + j] !== pattern[j]) {
              match = false;
              break;
            }
          }
          if (match) {
            if (start >= 0 && start < i) {
              frames.push({
                start,
                end: i,
                bytes: bytes.slice(start, i),
              });
            }
            start = i;
          }
        }
        if (start >= 0) {
          frames.push({
            start,
            end: bytes.length,
            bytes: bytes.slice(start),
          });
        }
        break;
      }
      default:
        frames.push({ start: 0, end: bytes.length, bytes });
    }

    return frames;
  };

  const previewFrames = showPreview ? generatePreview() : [];

  // Handler for composite step changes
  const handleCompositeStepChange = (
    index: number,
    updates: Partial<FramingStep>,
  ) => {
    const steps = [...(framing.composite?.steps || [])];
    steps[index] = { ...steps[index], ...updates };
    handleFramingChange({ composite: { steps } });
  };

  const handleAddCompositeStep = () => {
    const steps = [...(framing.composite?.steps || [])];
    steps.push({ type: "FIND_SYNC", syncBytes: [0x55, 0xaa] });
    handleFramingChange({ composite: { steps } });
  };

  const handleRemoveCompositeStep = (index: number) => {
    const steps = [...(framing.composite?.steps || [])];
    steps.splice(index, 1);
    handleFramingChange({ composite: { steps } });
  };

  const handleReorderCompositeSteps = (
    reorderedSteps: (FramingStep & { _id: string })[],
  ) => {
    // Remove temporary _id when saving
    const steps = reorderedSteps.map(({ _id, ...step }) => step);
    handleFramingChange({ composite: { steps } });
  };

  return (
    <div className="space-y-6">
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold">Framing Strategy</h2>
            <p className="text-sm text-muted-foreground">
              Configure how message boundaries are detected in the data stream.
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="gap-2"
            onClick={() => setShowPreview(!showPreview)}
          >
            <Eye className="w-4 h-4" />
            {showPreview ? "Hide Preview" : "Show Preview"}
          </Button>
        </div>

        <div className="space-y-2">
          <Label>Strategy</Label>
          <Select
            value={framing.strategy}
            onChange={(e) =>
              handleFramingChange({
                strategy: e.target.value as FramingConfig["strategy"],
              })
            }
          >
            <option value="NONE">None (Pass-through)</option>
            <option value="DELIMITER">Delimiter</option>
            <option value="TIMEOUT">Timeout (Silence-based)</option>
            <option value="LENGTH_FIELD">Length Field</option>
            <option value="SYNC_PATTERN">Sync Pattern</option>
            <option value="COMPOSITE">Composite (Multi-step)</option>
            <option value="SCRIPT">Custom Script</option>
          </Select>
        </div>

        {/* Strategy-specific configuration */}
        {framing.strategy === "DELIMITER" && (
          <DelimiterConfig framing={framing} onChange={handleFramingChange} />
        )}

        {framing.strategy === "TIMEOUT" && (
          <div className="p-4 border border-border rounded-lg space-y-4">
            <h3 className="font-medium">Timeout Configuration</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Silence Duration (ms)</Label>
                <NumberInput
                  value={framing.timeout?.silenceMs}
                  defaultValue={4}
                  min={1}
                  onChange={(val) =>
                    handleFramingChange({
                      timeout: {
                        ...framing.timeout,
                        silenceMs: val ?? 4,
                      },
                    })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Minimum Bytes</Label>
                <NumberInput
                  value={framing.timeout?.minBytes}
                  defaultValue={1}
                  min={1}
                  onChange={(val) =>
                    handleFramingChange({
                      timeout: {
                        ...framing.timeout,
                        silenceMs: framing.timeout?.silenceMs || 4,
                        minBytes: val,
                      },
                    })
                  }
                />
              </div>
            </div>
            <div className="flex items-start gap-2 p-3 bg-muted/50 rounded-md">
              <Info className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
              <p className="text-sm text-muted-foreground">
                Modbus RTU uses silence-based framing. A message ends when the
                bus is silent for 3.5 character transmission times. At 9600
                baud, this is approximately 4ms.
              </p>
            </div>
          </div>
        )}

        {framing.strategy === "LENGTH_FIELD" && (
          <div className="p-4 border border-border rounded-lg space-y-4">
            <h3 className="font-medium">Length Field Configuration</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Offset (bytes from start)</Label>
                <NumberInput
                  value={framing.lengthField?.offset}
                  defaultValue={0}
                  min={0}
                  onChange={(val) =>
                    handleFramingChange({
                      lengthField: {
                        ...framing.lengthField,
                        offset: val ?? 0,
                        size: framing.lengthField?.size || 1,
                      },
                    })
                  }
                />
                <p className="text-xs text-muted-foreground">
                  Position of length field from frame start
                </p>
              </div>
              <div className="space-y-2">
                <Label>Size (bytes)</Label>
                <Select
                  value={framing.lengthField?.size || 1}
                  onChange={(e) =>
                    handleFramingChange({
                      lengthField: {
                        ...framing.lengthField,
                        offset: framing.lengthField?.offset || 0,
                        size: parseInt(e.target.value) as 1 | 2 | 4,
                      },
                    })
                  }
                >
                  <option value={1}>1 byte (0-255)</option>
                  <option value={2}>2 bytes (0-65535)</option>
                  <option value={4}>4 bytes</option>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Byte Order</Label>
                <Select
                  value={framing.lengthField?.byteOrder || "BE"}
                  onChange={(e) =>
                    handleFramingChange({
                      lengthField: {
                        ...framing.lengthField,
                        offset: framing.lengthField?.offset || 0,
                        size: framing.lengthField?.size || 1,
                        byteOrder: e.target.value as "LE" | "BE",
                      },
                    })
                  }
                >
                  <option value="BE">Big Endian (MSB first)</option>
                  <option value="LE">Little Endian (LSB first)</option>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Adjustment</Label>
                <NumberInput
                  value={framing.lengthField?.adjustment}
                  defaultValue={0}
                  onChange={(val) =>
                    handleFramingChange({
                      lengthField: {
                        ...framing.lengthField,
                        offset: framing.lengthField?.offset || 0,
                        size: framing.lengthField?.size || 1,
                        adjustment: val ?? 0,
                      },
                    })
                  }
                />
                <p className="text-xs text-muted-foreground">
                  Add to length value (use negative to exclude header)
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 mt-2">
              <Checkbox
                id="includes-header"
                checked={framing.lengthField?.includesHeader ?? false}
                onChange={(e) =>
                  handleFramingChange({
                    lengthField: {
                      ...framing.lengthField,
                      offset: framing.lengthField?.offset || 0,
                      size: framing.lengthField?.size || 1,
                      includesHeader: e.target.checked,
                    },
                  })
                }
              />
              <Label
                htmlFor="includes-header"
                className="font-normal cursor-pointer"
              >
                Length includes header bytes
              </Label>
            </div>
            <div className="flex items-start gap-2 p-3 bg-muted/50 rounded-md">
              <Info className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
              <div className="text-sm text-muted-foreground space-y-1">
                <p>
                  <strong>Frame size</strong> = Length value + Adjustment
                </p>
                <p>
                  If &quot;includes header&quot; is checked, the length value
                  already accounts for header bytes. Otherwise, add header size
                  via adjustment.
                </p>
              </div>
            </div>
          </div>
        )}

        {framing.strategy === "SYNC_PATTERN" && (
          <div className="p-4 border border-border rounded-lg space-y-4">
            <h3 className="font-medium">Sync Pattern Configuration</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Sync Bytes</Label>
                <HexInput
                  value={(framing.syncPattern?.pattern || [0x55, 0xaa])
                    .map((b) => b.toString(16).padStart(2, "0").toUpperCase())
                    .join(" ")}
                  onChange={(val) => {
                    const trimmed = val.trim();
                    // Allow empty input - don't force default during editing
                    if (trimmed === "") {
                      handleFramingChange({
                        syncPattern: {
                          pattern: [],
                          maxScan: framing.syncPattern?.maxScan || 1024,
                        },
                      });
                      return;
                    }
                    const pattern = trimmed
                      .split(/[\s,]+/)
                      .filter((s) => s.length > 0)
                      .map((s) => parseInt(s, 16))
                      .filter((n) => !isNaN(n) && n >= 0 && n <= 255);
                    handleFramingChange({
                      syncPattern: {
                        pattern,
                        maxScan: framing.syncPattern?.maxScan || 1024,
                      },
                    });
                  }}
                  placeholder="55 AA"
                  showByteCount
                />
              </div>
              <div className="space-y-2">
                <Label>Max Scan (bytes)</Label>
                <NumberInput
                  value={framing.syncPattern?.maxScan}
                  defaultValue={1024}
                  min={1}
                  onChange={(val) =>
                    handleFramingChange({
                      syncPattern: {
                        pattern: framing.syncPattern?.pattern || [0x55, 0xaa],
                        maxScan: val ?? 1024,
                      },
                    })
                  }
                />
                <p className="text-xs text-muted-foreground">
                  Max bytes to scan for pattern
                </p>
              </div>
            </div>
            <div className="flex items-start gap-2 p-3 bg-muted/50 rounded-md">
              <Info className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
              <p className="text-sm text-muted-foreground">
                The sync pattern marks the start of each message frame. Common
                patterns include 0x55 0xAA for many industrial protocols.
              </p>
            </div>
          </div>
        )}

        {framing.strategy === "COMPOSITE" && (
          <div className="p-4 border border-border rounded-lg space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-medium">Composite Framing Steps</h3>
              <Button
                variant="outline"
                size="sm"
                className="gap-2"
                onClick={handleAddCompositeStep}
              >
                <Plus className="w-4 h-4" />
                Add Step
              </Button>
            </div>

            {(framing.composite?.steps || []).length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <p>
                  No steps defined. Add steps to build a multi-stage framer.
                </p>
              </div>
            ) : (
              <SortableList
                items={(framing.composite?.steps || []).map((step, i) => ({
                  ...step,
                  _id: `step-${i}`,
                }))}
                getItemId={(step) => step._id}
                onReorder={handleReorderCompositeSteps}
                className="space-y-3"
                renderItem={(
                  step: FramingStep & { _id: string },
                  index: number,
                  dragHandleProps: DragHandleProps,
                ) => (
                  <Card
                    className={cn(
                      "overflow-hidden transition-all",
                      dragHandleProps.isDragging && "border-primary shadow-lg",
                    )}
                  >
                    <div className="flex">
                      {/* Drag Handle */}
                      <div className="px-2 bg-muted/50 border-r border-border flex items-center">
                        <DragHandle {...dragHandleProps} />
                      </div>
                      {/* Content */}
                      <div className="flex-1 p-3">
                        <div className="flex items-center justify-between mb-3">
                          <Badge variant="outline" className="font-medium">
                            Step {index + 1}: {step.type.replace(/_/g, " ")}
                          </Badge>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 hover:bg-destructive/10"
                            onClick={() => handleRemoveCompositeStep(index)}
                          >
                            <Trash2 className="w-4 h-4 text-destructive" />
                          </Button>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-1">
                            <Label className="text-xs">Step Type</Label>
                            <Select
                              value={step.type}
                              onChange={(e) =>
                                handleCompositeStepChange(index, {
                                  type: e.target.value as FramingStep["type"],
                                })
                              }
                            >
                              <option value="FIND_SYNC">Find Sync</option>
                              <option value="READ_LENGTH">Read Length</option>
                              <option value="READ_FIXED">
                                Read Fixed Bytes
                              </option>
                              <option value="FIND_DELIMITER">
                                Find Delimiter
                              </option>
                            </Select>
                          </div>
                          {step.type === "FIND_SYNC" && (
                            <div className="space-y-1">
                              <Label className="text-xs">
                                Sync Bytes (hex)
                              </Label>
                              <Input
                                value={(step.syncBytes || [])
                                  .map((b) =>
                                    b
                                      .toString(16)
                                      .padStart(2, "0")
                                      .toUpperCase(),
                                  )
                                  .join(", ")}
                                onChange={(e) => {
                                  const syncBytes = e.target.value
                                    .split(/[\s,]+/)
                                    .filter((s) => s.length > 0)
                                    .map((s) => parseInt(s, 16))
                                    .filter(
                                      (n) => !isNaN(n) && n >= 0 && n <= 255,
                                    );
                                  handleCompositeStepChange(index, {
                                    syncBytes,
                                  });
                                }}
                                placeholder="55, AA"
                              />
                            </div>
                          )}
                          {step.type === "READ_LENGTH" && (
                            <>
                              <div className="space-y-1">
                                <Label className="text-xs">Length Size</Label>
                                <Select
                                  value={step.lengthSize || 1}
                                  onChange={(e) =>
                                    handleCompositeStepChange(index, {
                                      lengthSize: parseInt(e.target.value) as
                                        | 1
                                        | 2
                                        | 4,
                                    })
                                  }
                                >
                                  <option value={1}>1 byte</option>
                                  <option value={2}>2 bytes</option>
                                  <option value={4}>4 bytes</option>
                                </Select>
                              </div>
                              <div className="space-y-1">
                                <Label className="text-xs">Byte Order</Label>
                                <Select
                                  value={step.lengthByteOrder || "BE"}
                                  onChange={(e) =>
                                    handleCompositeStepChange(index, {
                                      lengthByteOrder: e.target.value as
                                        | "LE"
                                        | "BE",
                                    })
                                  }
                                >
                                  <option value="BE">Big Endian</option>
                                  <option value="LE">Little Endian</option>
                                </Select>
                              </div>
                            </>
                          )}
                          {step.type === "READ_FIXED" && (
                            <div className="space-y-1">
                              <Label className="text-xs">Fixed Bytes</Label>
                              <NumberInput
                                value={step.fixedBytes}
                                defaultValue={0}
                                min={0}
                                onChange={(val) =>
                                  handleCompositeStepChange(index, {
                                    fixedBytes: val ?? 0,
                                  })
                                }
                              />
                            </div>
                          )}
                          {step.type === "FIND_DELIMITER" && (
                            <div className="space-y-1">
                              <Label className="text-xs">Delimiter (hex)</Label>
                              <Input
                                value={(step.delimiter || [])
                                  .map((b) =>
                                    b
                                      .toString(16)
                                      .padStart(2, "0")
                                      .toUpperCase(),
                                  )
                                  .join(", ")}
                                onChange={(e) => {
                                  const delimiter = e.target.value
                                    .split(/[\s,]+/)
                                    .filter((s) => s.length > 0)
                                    .map((s) => parseInt(s, 16))
                                    .filter(
                                      (n) => !isNaN(n) && n >= 0 && n <= 255,
                                    );
                                  handleCompositeStepChange(index, {
                                    delimiter,
                                  });
                                }}
                                placeholder="0D, 0A"
                              />
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </Card>
                )}
              />
            )}

            <div className="flex items-start gap-2 p-3 bg-muted/50 rounded-md">
              <Info className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
              <p className="text-sm text-muted-foreground">
                Composite framing allows building complex framers by chaining
                multiple steps. Each step processes the data stream in sequence.
              </p>
            </div>
          </div>
        )}

        {framing.strategy === "SCRIPT" && (
          <div className="p-4 border border-border rounded-lg space-y-4">
            <h3 className="font-medium flex items-center gap-2">
              <Code className="w-4 h-4" />
              Custom Framing Script
            </h3>
            <Textarea
              value={framing.script?.code || ""}
              onChange={(e) =>
                handleFramingChange({
                  script: { code: e.target.value },
                })
              }
              placeholder={`// Custom framing script
// Available: buffer (Uint8Array), emit(frame), flush()
// Return: number of bytes consumed

const DELIMITER = [0x0D, 0x0A];
let pos = 0;
while (pos < buffer.length - 1) {
  if (buffer[pos] === DELIMITER[0] && buffer[pos + 1] === DELIMITER[1]) {
    emit(buffer.slice(0, pos + 2));
    return pos + 2;
  }
  pos++;
}
return 0; // Need more data`}
              rows={12}
              className="font-mono text-sm"
            />
            <div className="flex items-start gap-2 p-3 bg-muted/50 rounded-md">
              <Info className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
              <p className="text-sm text-muted-foreground">
                Write JavaScript to implement custom framing logic. The script
                receives a <code className="text-xs bg-muted px-1">buffer</code>{" "}
                and should call{" "}
                <code className="text-xs bg-muted px-1">emit(frame)</code> for
                each complete frame, returning the number of bytes consumed.
              </p>
            </div>
          </div>
        )}
      </section>

      {/* Framing Preview */}
      {showPreview && (
        <section className="space-y-4 p-4 border border-border rounded-lg bg-muted/20">
          <div className="flex items-center gap-2">
            <Eye className="w-4 h-4" />
            <h3 className="font-medium">Framing Preview</h3>
          </div>
          <div className="space-y-2">
            <Label>Test Data (hex bytes)</Label>
            <Input
              value={previewInput}
              onChange={(e) => setPreviewInput(e.target.value)}
              placeholder="48 65 6C 6C 6F 0D 0A"
              className="font-mono"
            />
          </div>

          {/* Color-Coded Byte Grid */}
          {(() => {
            const allBytes = parseHexInput(previewInput);
            if (allBytes.length === 0) {
              return (
                <p className="text-sm text-muted-foreground">
                  Enter hex bytes above to see framing preview.
                </p>
              );
            }

            // Frame colors (cycle through for multiple frames)
            const frameColors = [
              "bg-blue-100 dark:bg-blue-900/40 border-blue-300 dark:border-blue-700",
              "bg-green-100 dark:bg-green-900/40 border-green-300 dark:border-green-700",
              "bg-amber-100 dark:bg-amber-900/40 border-amber-300 dark:border-amber-700",
              "bg-purple-100 dark:bg-purple-900/40 border-purple-300 dark:border-purple-700",
              "bg-cyan-100 dark:bg-cyan-900/40 border-cyan-300 dark:border-cyan-700",
            ];
            const delimiterColor =
              "bg-rose-200 dark:bg-rose-800/60 border-rose-400 dark:border-rose-600";

            // Check if a byte at position is a delimiter byte
            const isDelimiterByte = (byteIndex: number): boolean => {
              if (framing.strategy !== "DELIMITER") return false;
              for (const frame of previewFrames) {
                // Use delimStart/delimEnd from frame if available
                const f = frame as {
                  delimStart?: number;
                  delimEnd?: number;
                };
                if (
                  f.delimStart !== undefined &&
                  f.delimEnd !== undefined &&
                  byteIndex >= f.delimStart &&
                  byteIndex < f.delimEnd
                ) {
                  return true;
                }
              }
              return false;
            };

            // Get frame index for a byte position
            const getFrameIndex = (byteIndex: number): number => {
              for (let i = 0; i < previewFrames.length; i++) {
                if (
                  byteIndex >= previewFrames[i].start &&
                  byteIndex < previewFrames[i].end
                ) {
                  return i;
                }
              }
              return -1;
            };

            return (
              <div className="space-y-4">
                {/* Timeout Strategy Note */}
                {framing.strategy === "TIMEOUT" && (
                  <div className="flex items-start gap-2 p-3 bg-blue-500/10 border border-blue-500/30 rounded-md text-xs text-blue-600 dark:text-blue-400">
                    <Info className="w-4 h-4 mt-0.5 shrink-0" />
                    <div>
                      <strong>Note:</strong> Timeout-based framing cannot be
                      visualized in this static preview. In actual operation,
                      frames are detected by silence periods (gaps of{" "}
                      {framing.timeout?.silenceMs || 4}ms or more between
                      bytes). The preview shows all test bytes as a single frame
                      for reference.
                    </div>
                  </div>
                )}

                {/* Byte Grid */}
                <div className="space-y-2">
                  <Label>
                    Byte Grid ({allBytes.length} bytes, {previewFrames.length}{" "}
                    frame{previewFrames.length !== 1 ? "s" : ""})
                  </Label>
                  <div className="p-3 bg-background border border-border rounded-md overflow-x-auto">
                    {/* Hex Row */}
                    <div className="flex flex-wrap gap-0.5 font-mono text-xs">
                      {allBytes.map((byte, idx) => {
                        const frameIdx = getFrameIndex(idx);
                        const isDelim = isDelimiterByte(idx);
                        const colorClass = isDelim
                          ? delimiterColor
                          : frameIdx >= 0
                            ? frameColors[frameIdx % frameColors.length]
                            : "bg-muted";
                        return (
                          <div
                            key={idx}
                            className={cn(
                              "w-7 h-7 flex items-center justify-center rounded border text-[10px] font-medium",
                              colorClass,
                            )}
                            title={`Offset ${idx}: 0x${byte.toString(16).padStart(2, "0").toUpperCase()}${
                              isDelim ? " (delimiter)" : ""
                            }`}
                          >
                            {byte.toString(16).padStart(2, "0").toUpperCase()}
                          </div>
                        );
                      })}
                    </div>
                    {/* ASCII Row */}
                    <div className="flex flex-wrap gap-0.5 font-mono text-xs mt-1">
                      {allBytes.map((byte, idx) => {
                        const frameIdx = getFrameIndex(idx);
                        const isDelim = isDelimiterByte(idx);
                        const colorClass = isDelim
                          ? delimiterColor
                          : frameIdx >= 0
                            ? frameColors[frameIdx % frameColors.length]
                            : "bg-muted";
                        const char =
                          byte >= 32 && byte < 127
                            ? String.fromCharCode(byte)
                            : ".";
                        return (
                          <div
                            key={idx}
                            className={cn(
                              "w-7 h-5 flex items-center justify-center rounded text-[10px] text-muted-foreground",
                              colorClass,
                              "opacity-70",
                            )}
                          >
                            {char}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Legend */}
                <div className="flex flex-wrap gap-3 text-xs">
                  {previewFrames.map((frame, i) => (
                    <div key={i} className="flex items-center gap-1.5">
                      <div
                        className={cn(
                          "w-3 h-3 rounded border",
                          frameColors[i % frameColors.length],
                        )}
                      />
                      <span className="text-muted-foreground">
                        Frame {i + 1} ({frame.bytes.length}B)
                      </span>
                    </div>
                  ))}
                  {framing.strategy === "DELIMITER" && (
                    <div className="flex items-center gap-1.5">
                      <div
                        className={cn("w-3 h-3 rounded border", delimiterColor)}
                      />
                      <span className="text-muted-foreground">Delimiter</span>
                    </div>
                  )}
                </div>

                {/* Frame Details */}
                <div className="space-y-2">
                  <Label>Frame Details</Label>
                  <div className="grid gap-2">
                    {previewFrames.map((frame, i) => (
                      <div
                        key={i}
                        className={cn(
                          "p-2 rounded-md border text-xs",
                          frameColors[i % frameColors.length],
                        )}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-medium">Frame {i + 1}</span>
                          <span className="text-muted-foreground">
                            {frame.bytes.length} bytes (offset {frame.start}-
                            {frame.end - 1})
                          </span>
                        </div>
                        <div className="mt-1 font-mono text-[10px] break-all">
                          {frame.bytes
                            .map((b) =>
                              b.toString(16).padStart(2, "0").toUpperCase(),
                            )
                            .join(" ")}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            );
          })()}
        </section>
      )}
    </div>
  );
};

// ============================================================================
// STRUCTURE PREVIEW COMPONENT
// ============================================================================

// Helper to get default bytes for an element
const getElementDefaultBytes = (
  element: MessageElement,
): { bytes: number[]; label: string; isComputed: boolean } => {
  const config = element.config;

  switch (config.type) {
    case "STATIC":
      return {
        bytes: config.value,
        label: `[${config.value.map((b) => b.toString(16).padStart(2, "0").toUpperCase()).join(" ")}]`,
        isComputed: false,
      };

    case "ADDRESS":
      return {
        bytes: [config.range.min],
        label: `[${config.range.min.toString(16).padStart(2, "0").toUpperCase()}]`,
        isComputed: false,
      };

    case "FIELD": {
      // Default based on data type size
      const size =
        typeof element.size === "number"
          ? element.size
          : config.dataType === "UINT8" || config.dataType === "INT8"
            ? 1
            : config.dataType === "UINT16" || config.dataType === "INT16"
              ? 2
              : config.dataType === "UINT32" ||
                  config.dataType === "INT32" ||
                  config.dataType === "FLOAT32"
                ? 4
                : config.dataType === "FLOAT64"
                  ? 8
                  : 1;
      return {
        bytes: Array(size).fill(0),
        label: `${config.dataType}`,
        isComputed: false,
      };
    }

    case "LENGTH":
      return {
        bytes:
          typeof element.size === "number" ? Array(element.size).fill(0) : [0],
        label: "(computed)",
        isComputed: true,
      };

    case "CHECKSUM":
      return {
        bytes:
          typeof element.size === "number" ? Array(element.size).fill(0) : [0],
        label: `(${config.algorithm})`,
        isComputed: true,
      };

    case "PAYLOAD":
      return {
        bytes: [],
        label: "<payload>",
        isComputed: false,
      };

    case "PADDING":
      return {
        bytes:
          typeof element.size === "number"
            ? Array(element.size).fill(config.fillByte)
            : [config.fillByte],
        label: `fill: 0x${config.fillByte.toString(16).padStart(2, "0").toUpperCase()}`,
        isComputed: false,
      };

    case "RESERVED":
      return {
        bytes:
          typeof element.size === "number"
            ? Array(element.size).fill(config.fillByte)
            : [config.fillByte],
        label: `fill: 0x${config.fillByte.toString(16).padStart(2, "0").toUpperCase()}`,
        isComputed: false,
      };

    default:
      return { bytes: [0], label: "?", isComputed: false };
  }
};

// Preview component for a message structure
const StructurePreview: React.FC<{ structure: MessageStructure }> = ({
  structure,
}) => {
  const [showTest, setShowTest] = useState(false);
  const [testValues, setTestValues] = useState<Record<string, number[]>>({});

  // Compute composed bytes (default or test values)
  const composedResult = useMemo(() => {
    const segments: {
      elementId: string;
      name: string;
      bytes: number[];
      isComputed: boolean;
    }[] = [];

    for (const element of structure.elements) {
      const defaults = getElementDefaultBytes(element);
      const override = testValues[element.id];
      segments.push({
        elementId: element.id,
        name: element.name,
        bytes: override ?? defaults.bytes,
        isComputed: defaults.isComputed,
      });
    }

    return segments;
  }, [structure.elements, testValues]);

  const totalBytes = composedResult.reduce(
    (sum, seg) => sum + seg.bytes.length,
    0,
  );

  // Generate distinct colors for each element
  const colors = [
    "bg-blue-500/20 border-blue-500/40 text-blue-700 dark:text-blue-300",
    "bg-green-500/20 border-green-500/40 text-green-700 dark:text-green-300",
    "bg-purple-500/20 border-purple-500/40 text-purple-700 dark:text-purple-300",
    "bg-orange-500/20 border-orange-500/40 text-orange-700 dark:text-orange-300",
    "bg-pink-500/20 border-pink-500/40 text-pink-700 dark:text-pink-300",
    "bg-cyan-500/20 border-cyan-500/40 text-cyan-700 dark:text-cyan-300",
  ];

  return (
    <div className="mt-4 pt-4 border-t border-border">
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-medium flex items-center gap-2">
          <Eye className="w-4 h-4" />
          Preview & Test
        </span>
        <Button
          variant={showTest ? "primary" : "outline"}
          size="sm"
          className="gap-1 h-7"
          onClick={() => setShowTest(!showTest)}
        >
          <Play className="w-3.5 h-3.5" />
          {showTest ? "Hide Test" : "Test Mode"}
        </Button>
      </div>

      {/* Default Values Table */}
      <div className="mb-4 overflow-x-auto">
        <table className="w-full text-xs border-collapse">
          <thead>
            <tr className="bg-muted/50">
              <th className="text-left p-2 border border-border font-medium">
                Element
              </th>
              <th className="text-left p-2 border border-border font-medium">
                Type
              </th>
              <th className="text-left p-2 border border-border font-medium">
                Size
              </th>
              <th className="text-left p-2 border border-border font-medium">
                Default
              </th>
            </tr>
          </thead>
          <tbody>
            {structure.elements.map((element, idx) => {
              const defaults = getElementDefaultBytes(element);
              return (
                <tr key={element.id} className={colors[idx % colors.length]}>
                  <td className="p-2 border border-border font-mono">
                    {element.name}
                  </td>
                  <td className="p-2 border border-border">
                    {element.config.type}
                  </td>
                  <td className="p-2 border border-border">
                    {typeof element.size === "number"
                      ? `${element.size} byte${element.size !== 1 ? "s" : ""}`
                      : element.size}
                  </td>
                  <td className="p-2 border border-border font-mono">
                    {defaults.label}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Test Mode - Editable Values */}
      {showTest && (
        <div className="mb-4 p-3 bg-muted/30 rounded-lg border border-border">
          <p className="text-xs text-muted-foreground mb-3">
            Override values for testing. Enter hex bytes separated by spaces.
          </p>
          <div className="space-y-2">
            {structure.elements.map((element) => {
              const defaults = getElementDefaultBytes(element);
              if (defaults.isComputed) {
                return (
                  <div key={element.id} className="flex items-center gap-2">
                    <Label className="w-24 text-xs">{element.name}:</Label>
                    <span className="text-xs text-muted-foreground italic">
                      {defaults.label}
                    </span>
                  </div>
                );
              }

              return (
                <div key={element.id} className="flex items-center gap-2">
                  <Label className="w-24 text-xs">{element.name}:</Label>
                  <Input
                    className="flex-1 h-7 text-xs font-mono"
                    placeholder={defaults.bytes
                      .map((b) => b.toString(16).padStart(2, "0").toUpperCase())
                      .join(" ")}
                    defaultValue={
                      testValues[element.id]
                        ?.map((b) =>
                          b.toString(16).padStart(2, "0").toUpperCase(),
                        )
                        .join(" ") || ""
                    }
                    onBlur={(e) => {
                      const val = e.target.value.trim();
                      if (!val) {
                        setTestValues((prev) => {
                          const next = { ...prev };
                          delete next[element.id];
                          return next;
                        });
                        return;
                      }
                      // Parse hex bytes
                      const parts = val.split(/[\s,]+/).filter(Boolean);
                      const bytes = parts.map((p) =>
                        parseInt(p.replace(/^0x/i, ""), 16),
                      );
                      if (bytes.every((b) => !isNaN(b) && b >= 0 && b <= 255)) {
                        setTestValues((prev) => ({
                          ...prev,
                          [element.id]: bytes,
                        }));
                      }
                    }}
                  />
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Composed Output */}
      <div className="p-3 bg-muted/50 rounded-lg border border-border">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-medium">
            Composed Message ({totalBytes} bytes)
          </span>
        </div>

        {/* Byte Grid with Color Coding */}
        <div className="flex flex-wrap gap-1 mb-3">
          {composedResult.map((segment, segIdx) =>
            segment.bytes.map((byte, byteIdx) => (
              <div
                key={`${segment.elementId}-${byteIdx}`}
                className={cn(
                  "w-7 h-7 flex items-center justify-center rounded border text-[10px] font-mono font-medium",
                  colors[segIdx % colors.length],
                  segment.isComputed && "opacity-60 border-dashed",
                )}
                title={`${segment.name}[${byteIdx}]`}
              >
                {byte.toString(16).padStart(2, "0").toUpperCase()}
              </div>
            )),
          )}
        </div>

        {/* Legend */}
        <div className="flex flex-wrap gap-2 text-[10px]">
          {composedResult
            .filter((seg) => seg.bytes.length > 0)
            .map((segment, idx) => (
              <div key={segment.elementId} className="flex items-center gap-1">
                <div
                  className={cn(
                    "w-3 h-3 rounded border",
                    colors[idx % colors.length],
                  )}
                />
                <span>{segment.name}</span>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
};

// Structures Tab Component
const StructuresTab: React.FC<{
  editState: Protocol;
  onChange: <K extends keyof Protocol>(key: K, value: Protocol[K]) => void;
  onAddStructure: () => void;
  onDeleteStructure: (id: string) => void;
}> = ({ editState, onChange, onAddStructure, onDeleteStructure }) => {
  const [expanded, setExpanded] = useState<string | null>(null);
  const [editingStructure, setEditingStructure] =
    useState<MessageStructure | null>(null);
  const [editingElement, setEditingElement] = useState<{
    structureId: string;
    element: MessageElement | null;
    isNew: boolean;
  } | null>(null);

  // Update structure in editState
  const updateStructure = (
    structureId: string,
    updates: Partial<MessageStructure>,
  ) => {
    const newStructures = editState.messageStructures.map((s) =>
      s.id === structureId ? { ...s, ...updates } : s,
    );
    onChange("messageStructures", newStructures);
  };

  // Add element to structure
  const handleAddElement = (structureId: string) => {
    setEditingElement({
      structureId,
      element: null,
      isNew: true,
    });
  };

  // Edit element
  const handleEditElement = (structureId: string, element: MessageElement) => {
    setEditingElement({
      structureId,
      element: { ...element },
      isNew: false,
    });
  };

  // Delete element
  const handleDeleteElement = (structureId: string, elementId: string) => {
    const structure = editState.messageStructures.find(
      (s) => s.id === structureId,
    );
    if (structure) {
      updateStructure(structureId, {
        elements: structure.elements.filter((e) => e.id !== elementId),
      });
    }
  };

  // Save element
  const handleSaveElement = (element: MessageElement) => {
    if (!editingElement) return;

    const structure = editState.messageStructures.find(
      (s) => s.id === editingElement.structureId,
    );
    if (!structure) return;

    if (editingElement.isNew) {
      updateStructure(editingElement.structureId, {
        elements: [...structure.elements, element],
      });
    } else {
      updateStructure(editingElement.structureId, {
        elements: structure.elements.map((e) =>
          e.id === element.id ? element : e,
        ),
      });
    }
    setEditingElement(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Message Structures</h2>
          <p className="text-sm text-muted-foreground">
            Define the wire format for messages in this protocol.
          </p>
        </div>
        <Button size="sm" className="gap-2" onClick={onAddStructure}>
          <Plus className="w-4 h-4" />
          Add Structure
        </Button>
      </div>

      {editState.messageStructures.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 border border-dashed border-border rounded-lg">
          <Layers className="w-12 h-12 text-muted-foreground/50 mb-4" />
          <p className="text-muted-foreground mb-4">
            No message structures defined
          </p>
          <Button variant="outline" className="gap-2" onClick={onAddStructure}>
            <Plus className="w-4 h-4" />
            Create First Structure
          </Button>
        </div>
      ) : (
        <div className="space-y-2">
          {editState.messageStructures.map((structure) => (
            <div
              key={structure.id}
              className="border border-border rounded-lg overflow-hidden"
            >
              <button
                onClick={() =>
                  setExpanded(expanded === structure.id ? null : structure.id)
                }
                className="w-full flex items-center gap-3 p-4 text-left hover:bg-muted/50"
              >
                {expanded === structure.id ? (
                  <ChevronDown className="w-4 h-4" />
                ) : (
                  <ChevronRight className="w-4 h-4" />
                )}
                <div className="flex-1">
                  <h3 className="font-medium">{structure.name}</h3>
                  <p className="text-sm text-muted-foreground">
                    {structure.elements.length} elements
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={(e) => {
                    e.stopPropagation();
                    setEditingStructure({ ...structure });
                  }}
                  title="Edit Structure"
                >
                  <Pencil className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteStructure(structure.id);
                  }}
                >
                  <Trash2 className="w-4 h-4 text-destructive" />
                </Button>
              </button>
              {expanded === structure.id && (
                <div className="border-t border-border p-4 bg-muted/30">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-medium">Elements</span>
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-1 h-7"
                      onClick={() => handleAddElement(structure.id)}
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Add Element
                    </Button>
                  </div>
                  {structure.elements.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      No elements. Click &quot;Add Element&quot; to define the
                      structure.
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {structure.elements.map((element) => (
                        <div
                          key={element.id}
                          className="flex items-center gap-2 p-2 bg-background rounded border border-border group"
                        >
                          <GripVertical className="w-4 h-4 text-muted-foreground cursor-move" />
                          <span className="font-mono text-sm flex-1">
                            {element.name}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {typeof element.size === "number"
                              ? `${element.size} byte${element.size !== 1 ? "s" : ""}`
                              : element.size}
                          </span>
                          <span className="text-xs px-2 py-0.5 bg-muted rounded">
                            {element.config.type}
                          </span>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 opacity-0 group-hover:opacity-100"
                            onClick={() =>
                              handleEditElement(structure.id, element)
                            }
                          >
                            <Pencil className="w-3 h-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 opacity-0 group-hover:opacity-100"
                            onClick={() =>
                              handleDeleteElement(structure.id, element.id)
                            }
                          >
                            <Trash2 className="w-3 h-3 text-destructive" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Preview & Test Section */}
                  {structure.elements.length > 0 && (
                    <StructurePreview structure={structure} />
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Structure Edit Modal */}
      {editingStructure && (
        <StructureEditModal
          structure={editingStructure}
          onSave={(s) => {
            updateStructure(s.id, s);
            setEditingStructure(null);
          }}
          onClose={() => setEditingStructure(null)}
        />
      )}

      {/* Element Edit Modal */}
      {editingElement && (
        <ElementEditModal
          element={editingElement.element}
          isNew={editingElement.isNew}
          structureElements={
            editState.messageStructures.find(
              (s) => s.id === editingElement.structureId,
            )?.elements || []
          }
          onSave={handleSaveElement}
          onClose={() => setEditingElement(null)}
        />
      )}
    </div>
  );
};

// Structure Edit Modal
const StructureEditModal: React.FC<{
  structure: MessageStructure;
  onSave: (structure: MessageStructure) => void;
  onClose: () => void;
}> = ({ structure, onSave, onClose }) => {
  const [editState, setEditState] = useState({ ...structure });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-background rounded-lg shadow-xl w-full max-w-md mx-4">
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h3 className="font-semibold">Edit Structure</h3>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </div>
        <div className="p-4 space-y-4">
          <div className="space-y-2">
            <Label>Name</Label>
            <Input
              value={editState.name}
              onChange={(e) =>
                setEditState((s) => ({ ...s, name: e.target.value }))
              }
            />
          </div>
          <div className="space-y-2">
            <Label>Description</Label>
            <Textarea
              value={editState.description || ""}
              onChange={(e) =>
                setEditState((s) => ({ ...s, description: e.target.value }))
              }
              rows={2}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Encoding</Label>
              <Select
                value={editState.encoding}
                onChange={(e) =>
                  setEditState((s) => ({
                    ...s,
                    encoding: e.target.value as MessageStructure["encoding"],
                  }))
                }
              >
                <option value="BINARY">Binary</option>
                <option value="ASCII">ASCII</option>
                <option value="BCD">BCD</option>
                <option value="HEX_STRING">Hex String</option>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Byte Order</Label>
              <Select
                value={editState.byteOrder}
                onChange={(e) =>
                  setEditState((s) => ({
                    ...s,
                    byteOrder: e.target.value as "LE" | "BE",
                  }))
                }
              >
                <option value="BE">Big Endian</option>
                <option value="LE">Little Endian</option>
              </Select>
            </div>
          </div>
        </div>
        <div className="flex justify-end gap-2 p-4 border-t border-border">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={() => onSave(editState)}>Save</Button>
        </div>
      </div>
    </div>
  );
};

// Element Edit Modal
const ElementEditModal: React.FC<{
  element: MessageElement | null;
  isNew: boolean;
  structureElements: MessageElement[];
  onSave: (element: MessageElement) => void;
  onClose: () => void;
}> = ({ element, isNew, structureElements, onSave, onClose }) => {
  const [editState, setEditState] = useState<MessageElement>(() =>
    element
      ? { ...element }
      : {
          id: generateId(),
          name: "",
          size: 1,
          config: { type: "FIELD", dataType: "UINT8" },
        },
  );

  // Get other elements (excluding self) for includeElements selection
  const otherElements = structureElements.filter((e) => e.id !== editState.id);

  const handleConfigTypeChange = (type: ElementConfig["type"]) => {
    let newConfig: ElementConfig;
    switch (type) {
      case "STATIC":
        newConfig = { type: "STATIC", value: [0x00] };
        break;
      case "ADDRESS":
        newConfig = { type: "ADDRESS", range: { min: 0, max: 255 } };
        break;
      case "FIELD":
        newConfig = { type: "FIELD", dataType: "UINT8" };
        break;
      case "LENGTH":
        newConfig = { type: "LENGTH", includeElements: [], adjustment: 0 };
        break;
      case "CHECKSUM":
        newConfig = {
          type: "CHECKSUM",
          algorithm: "XOR",
          includeElements: [],
        };
        break;
      case "PAYLOAD":
        newConfig = { type: "PAYLOAD" };
        break;
      case "PADDING":
        newConfig = { type: "PADDING", fillByte: 0x00 };
        break;
      case "RESERVED":
        newConfig = { type: "RESERVED", fillByte: 0x00 };
        break;
      default:
        newConfig = { type: "FIELD", dataType: "UINT8" };
    }
    setEditState((s) => ({ ...s, config: newConfig }));
  };

  // Toggle element in includeElements array
  const toggleIncludeElement = (elementId: string) => {
    const config = editState.config as { includeElements?: string[] };
    const current = config.includeElements || [];
    const newInclude = current.includes(elementId)
      ? current.filter((id) => id !== elementId)
      : [...current, elementId];
    setEditState((s) => ({
      ...s,
      config: { ...s.config, includeElements: newInclude } as ElementConfig,
    }));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-background rounded-lg shadow-xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-4 border-b border-border sticky top-0 bg-background">
          <h3 className="font-semibold">
            {isNew ? "Add Element" : "Edit Element"}
          </h3>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </div>
        <div className="p-4 space-y-4">
          {/* Basic Info */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Name</Label>
              <Input
                value={editState.name}
                onChange={(e) =>
                  setEditState((s) => ({ ...s, name: e.target.value }))
                }
                placeholder="field_name"
              />
            </div>
            <div className="space-y-2">
              <Label>Size</Label>
              <Select
                value={
                  typeof editState.size === "number"
                    ? String(editState.size)
                    : editState.size
                }
                onChange={(e) => {
                  const val = e.target.value;
                  setEditState((s) => ({
                    ...s,
                    size:
                      val === "VARIABLE" || val === "COMPUTED"
                        ? val
                        : parseInt(val) || 1,
                  }));
                }}
              >
                <option value="1">1 byte</option>
                <option value="2">2 bytes</option>
                <option value="4">4 bytes</option>
                <option value="8">8 bytes</option>
                <option value="VARIABLE">Variable</option>
                <option value="COMPUTED">Computed</option>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Description</Label>
            <Input
              value={editState.description || ""}
              onChange={(e) =>
                setEditState((s) => ({ ...s, description: e.target.value }))
              }
              placeholder="Optional description"
            />
          </div>

          {/* Byte Order and Encoding overrides */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Byte Order (override)</Label>
              <Select
                value={editState.byteOrder || ""}
                onChange={(e) =>
                  setEditState((s) => ({
                    ...s,
                    byteOrder: e.target.value
                      ? (e.target.value as "LE" | "BE")
                      : undefined,
                  }))
                }
              >
                <option value="">Inherit from structure</option>
                <option value="BE">Big Endian (BE)</option>
                <option value="LE">Little Endian (LE)</option>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Encoding (override)</Label>
              <Select
                value={editState.encoding || ""}
                onChange={(e) =>
                  setEditState((s) => ({
                    ...s,
                    encoding: e.target.value
                      ? (e.target.value as MessageElement["encoding"])
                      : undefined,
                  }))
                }
              >
                <option value="">Inherit from structure</option>
                <option value="BINARY">Binary</option>
                <option value="ASCII">ASCII</option>
                <option value="BCD">BCD</option>
                <option value="HEX_STRING">Hex String</option>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Element Type</Label>
            <Select
              value={editState.config.type}
              onChange={(e) =>
                handleConfigTypeChange(e.target.value as ElementConfig["type"])
              }
            >
              <option value="STATIC">Static (fixed bytes)</option>
              <option value="ADDRESS">Address</option>
              <option value="FIELD">Data Field</option>
              <option value="LENGTH">Length Field</option>
              <option value="CHECKSUM">Checksum</option>
              <option value="PAYLOAD">Payload</option>
              <option value="PADDING">Padding</option>
              <option value="RESERVED">Reserved</option>
            </Select>
          </div>

          {/* Type-specific config */}
          <div className="p-3 border border-border rounded-md space-y-3">
            {editState.config.type === "STATIC" && (
              <div className="space-y-2">
                <Label>Static Value (hex bytes)</Label>
                <Input
                  value={editState.config.value
                    .map((b) => b.toString(16).padStart(2, "0").toUpperCase())
                    .join(" ")}
                  onChange={(e) => {
                    const value = e.target.value
                      .split(/[\s,]+/)
                      .filter((s) => s.length > 0)
                      .map((s) => parseInt(s, 16))
                      .filter((n) => !isNaN(n) && n >= 0 && n <= 255);
                    setEditState((s) => ({
                      ...s,
                      config: { ...s.config, value } as ElementConfig,
                    }));
                  }}
                  placeholder="AA BB CC"
                />
              </div>
            )}

            {editState.config.type === "ADDRESS" && (
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Min Address</Label>
                  <Input
                    type="number"
                    value={editState.config.range.min}
                    onChange={(e) =>
                      setEditState((s) => ({
                        ...s,
                        config: {
                          ...s.config,
                          range: {
                            ...(
                              s.config as {
                                range: { min: number; max: number };
                              }
                            ).range,
                            min: parseInt(e.target.value) || 0,
                          },
                        } as ElementConfig,
                      }))
                    }
                    min={0}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Max Address</Label>
                  <Input
                    type="number"
                    value={editState.config.range.max}
                    onChange={(e) =>
                      setEditState((s) => ({
                        ...s,
                        config: {
                          ...s.config,
                          range: {
                            ...(
                              s.config as {
                                range: { min: number; max: number };
                              }
                            ).range,
                            max: parseInt(e.target.value) || 255,
                          },
                        } as ElementConfig,
                      }))
                    }
                    min={0}
                  />
                </div>
              </div>
            )}

            {editState.config.type === "FIELD" && (
              <div className="space-y-2">
                <Label>Data Type</Label>
                <Select
                  value={editState.config.dataType}
                  onChange={(e) =>
                    setEditState((s) => ({
                      ...s,
                      config: {
                        ...s.config,
                        dataType: e.target.value,
                      } as ElementConfig,
                    }))
                  }
                >
                  <option value="UINT8">UINT8</option>
                  <option value="UINT16">UINT16</option>
                  <option value="UINT32">UINT32</option>
                  <option value="INT8">INT8</option>
                  <option value="INT16">INT16</option>
                  <option value="INT32">INT32</option>
                  <option value="FLOAT32">FLOAT32</option>
                  <option value="FLOAT64">FLOAT64</option>
                  <option value="STRING">STRING</option>
                  <option value="BYTES">BYTES</option>
                </Select>
              </div>
            )}

            {editState.config.type === "LENGTH" && (
              <div className="space-y-3">
                <div className="space-y-2">
                  <Label>Adjustment</Label>
                  <Input
                    type="number"
                    value={editState.config.adjustment}
                    onChange={(e) =>
                      setEditState((s) => ({
                        ...s,
                        config: {
                          ...s.config,
                          adjustment: parseInt(e.target.value) || 0,
                        } as ElementConfig,
                      }))
                    }
                  />
                  <p className="text-xs text-muted-foreground">
                    Value added/subtracted from calculated length.
                  </p>
                </div>

                {/* Include Elements for LENGTH */}
                <div className="space-y-2">
                  <Label>Include Elements (in length calculation)</Label>
                  {otherElements.length === 0 ? (
                    <p className="text-xs text-muted-foreground p-2 bg-muted/50 rounded">
                      Add other elements to the structure first, then configure
                      which ones to include.
                    </p>
                  ) : (
                    <div className="border border-border rounded-md p-2 space-y-1 max-h-32 overflow-y-auto">
                      {otherElements.map((el) => (
                        <div
                          key={el.id}
                          onClick={() => toggleIncludeElement(el.id)}
                          className="flex items-center gap-2 p-1 hover:bg-muted/50 rounded cursor-pointer"
                        >
                          <Checkbox
                            checked={
                              (
                                editState.config as {
                                  includeElements?: string[];
                                }
                              ).includeElements?.includes(el.id) || false
                            }
                            onChange={() => {}}
                            onClick={(e) => e.stopPropagation()}
                          />
                          <span className="text-sm font-mono">{el.name}</span>
                          <span className="text-xs text-muted-foreground">
                            ({el.config.type})
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {editState.config.type === "CHECKSUM" && (
              <div className="space-y-3">
                <div className="space-y-2">
                  <Label>Algorithm</Label>
                  <Select
                    value={editState.config.algorithm}
                    onChange={(e) =>
                      setEditState((s) => ({
                        ...s,
                        config: {
                          ...s.config,
                          algorithm: e.target.value,
                        } as ElementConfig,
                      }))
                    }
                  >
                    <option value="XOR">XOR</option>
                    <option value="MOD256">MOD256</option>
                    <option value="CRC16">CRC16</option>
                    <option value="CRC16_MODBUS">CRC16 Modbus</option>
                    <option value="CRC16_CCITT">CRC16 CCITT</option>
                    <option value="LRC">LRC</option>
                  </Select>
                </div>

                {/* Include Elements for CHECKSUM */}
                <div className="space-y-2">
                  <Label>Include Elements (in checksum calculation)</Label>
                  {otherElements.length === 0 ? (
                    <p className="text-xs text-muted-foreground p-2 bg-muted/50 rounded">
                      Add other elements to the structure first, then configure
                      which ones to include.
                    </p>
                  ) : (
                    <div className="border border-border rounded-md p-2 space-y-1 max-h-32 overflow-y-auto">
                      {otherElements.map((el) => (
                        <div
                          key={el.id}
                          onClick={() => toggleIncludeElement(el.id)}
                          className="flex items-center gap-2 p-1 hover:bg-muted/50 rounded cursor-pointer"
                        >
                          <Checkbox
                            checked={
                              (
                                editState.config as {
                                  includeElements?: string[];
                                }
                              ).includeElements?.includes(el.id) || false
                            }
                            onChange={() => {}}
                            onClick={(e) => e.stopPropagation()}
                          />
                          <span className="text-sm font-mono">{el.name}</span>
                          <span className="text-xs text-muted-foreground">
                            ({el.config.type})
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {(editState.config.type === "PADDING" ||
              editState.config.type === "RESERVED") && (
              <div className="space-y-2">
                <Label>Fill Byte (hex)</Label>
                <Input
                  value={editState.config.fillByte
                    .toString(16)
                    .padStart(2, "0")
                    .toUpperCase()}
                  onChange={(e) => {
                    const val = parseInt(e.target.value, 16);
                    setEditState((s) => ({
                      ...s,
                      config: {
                        ...s.config,
                        fillByte: isNaN(val)
                          ? 0
                          : Math.min(255, Math.max(0, val)),
                      } as ElementConfig,
                    }));
                  }}
                  placeholder="00"
                />
              </div>
            )}

            {editState.config.type === "PAYLOAD" && (
              <div className="space-y-3">
                <div className="flex items-start gap-2 p-2 bg-muted/50 rounded">
                  <AlertCircle className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
                  <p className="text-xs text-muted-foreground">
                    Payload elements carry variable-length data.
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label>Min Size (bytes)</Label>
                    <Input
                      type="number"
                      value={
                        (editState.config as { minSize?: number }).minSize || ""
                      }
                      onChange={(e) =>
                        setEditState((s) => ({
                          ...s,
                          config: {
                            ...s.config,
                            minSize: e.target.value
                              ? parseInt(e.target.value)
                              : undefined,
                          } as ElementConfig,
                        }))
                      }
                      min={0}
                      placeholder="0"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Max Size (bytes)</Label>
                    <Input
                      type="number"
                      value={
                        (editState.config as { maxSize?: number }).maxSize || ""
                      }
                      onChange={(e) =>
                        setEditState((s) => ({
                          ...s,
                          config: {
                            ...s.config,
                            maxSize: e.target.value
                              ? parseInt(e.target.value)
                              : undefined,
                          } as ElementConfig,
                        }))
                      }
                      min={1}
                      placeholder="unlimited"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
        <div className="flex justify-end gap-2 p-4 border-t border-border sticky bottom-0 bg-background">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={() => onSave(editState)}
            disabled={!editState.name.trim()}
          >
            {isNew ? "Add" : "Save"}
          </Button>
        </div>
      </div>
    </div>
  );
};

// Commands Tab Component (per FIGMA-DESIGN.md 10.2)
const CommandsTab: React.FC<{
  editState: Protocol;
  onChange: <K extends keyof Protocol>(key: K, value: Protocol[K]) => void;
  onAddCommand: () => void;
  onDeleteCommand: (id: string) => void;
  onEditCommand: (command: CommandTemplate) => void;
}> = ({ editState, onAddCommand, onDeleteCommand, onEditCommand }) => {
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

// Command Edit Modal
const CommandEditModal: React.FC<{
  command: CommandTemplate;
  messageStructures: MessageStructure[];
  onSave: (command: CommandTemplate) => void;
  onClose: () => void;
}> = ({ command, messageStructures, onSave, onClose }) => {
  const [editState, setEditState] = useState<CommandTemplate>({ ...command });
  const [activeSection, setActiveSection] = useState<
    "basic" | "parameters" | "response" | "hooks"
  >("basic");

  const isSimple = editState.type === "SIMPLE";
  const isStructured = editState.type === "STRUCTURED";

  // Get the selected message structure for structured commands
  const selectedStructure =
    isStructured && (editState as StructuredCommand).messageStructureId
      ? messageStructures.find(
          (s) => s.id === (editState as StructuredCommand).messageStructureId,
        )
      : null;

  // Switch command type
  const handleTypeChange = (newType: "SIMPLE" | "STRUCTURED") => {
    if (newType === editState.type) return;

    if (newType === "SIMPLE") {
      setEditState({
        id: editState.id,
        name: editState.name,
        description: editState.description,
        createdAt: editState.createdAt,
        updatedAt: editState.updatedAt,
        tags: editState.tags,
        category: editState.category,
        type: "SIMPLE",
        payload: "",
        mode: "TEXT",
        parameters: [],
        extractVariables: [],
      } as SimpleCommand);
    } else {
      setEditState({
        id: editState.id,
        name: editState.name,
        description: editState.description,
        createdAt: editState.createdAt,
        updatedAt: editState.updatedAt,
        tags: editState.tags,
        category: editState.category,
        type: "STRUCTURED",
        messageStructureId: messageStructures[0]?.id || "",
        parameters: [],
        bindings: [],
        staticValues: [],
        computedValues: [],
      } as StructuredCommand);
    }
  };

  // Parameter management for structured commands
  const addParameter = () => {
    if (!isStructured) return;
    const structured = editState as StructuredCommand;
    const newParam: CommandParameter = {
      id: `param_${Date.now()}`,
      name: `param${structured.parameters.length + 1}`,
      type: "STRING",
      required: false,
    };
    setEditState({
      ...structured,
      parameters: [...structured.parameters, newParam],
    } as CommandTemplate);
  };

  const updateParameter = (
    index: number,
    updates: Partial<CommandParameter>,
  ) => {
    if (!isStructured) return;
    const structured = editState as StructuredCommand;
    const newParams = [...structured.parameters];
    newParams[index] = { ...newParams[index], ...updates };
    setEditState({ ...structured, parameters: newParams } as CommandTemplate);
  };

  const removeParameter = (index: number) => {
    if (!isStructured) return;
    const structured = editState as StructuredCommand;
    const newParams = structured.parameters.filter((_, i) => i !== index);
    // Also remove any bindings that reference this parameter
    const paramName = structured.parameters[index].name;
    const newBindings = structured.bindings.filter(
      (b) => b.parameterName !== paramName,
    );
    setEditState({
      ...structured,
      parameters: newParams,
      bindings: newBindings,
    } as CommandTemplate);
  };

  // Binding management for structured commands
  const updateBinding = (paramName: string, elementId: string) => {
    if (!isStructured) return;
    const structured = editState as StructuredCommand;
    const existingIdx = structured.bindings.findIndex(
      (b) => b.parameterName === paramName,
    );
    let newBindings = [...structured.bindings];
    if (elementId) {
      if (existingIdx >= 0) {
        newBindings[existingIdx] = { ...newBindings[existingIdx], elementId };
      } else {
        newBindings.push({ elementId, parameterName: paramName });
      }
    } else {
      newBindings = newBindings.filter((b) => b.parameterName !== paramName);
    }
    setEditState({ ...structured, bindings: newBindings } as CommandTemplate);
  };

  // Static values management
  const addStaticValue = () => {
    if (!isStructured || !selectedStructure) return;
    const structured = editState as StructuredCommand;
    const usedElementIds = new Set(
      structured.staticValues.map((s) => s.elementId),
    );
    const availableElement = selectedStructure.elements.find(
      (e) => !usedElementIds.has(e.id),
    );
    if (!availableElement) return;
    setEditState({
      ...structured,
      staticValues: [
        ...structured.staticValues,
        { elementId: availableElement.id, value: 0 },
      ],
    } as CommandTemplate);
  };

  const updateStaticValue = (
    index: number,
    updates: Partial<{ elementId: string; value: number | number[] | string }>,
  ) => {
    if (!isStructured) return;
    const structured = editState as StructuredCommand;
    const newStatics = [...structured.staticValues];
    newStatics[index] = { ...newStatics[index], ...updates };
    setEditState({
      ...structured,
      staticValues: newStatics,
    } as CommandTemplate);
  };

  const removeStaticValue = (index: number) => {
    if (!isStructured) return;
    const structured = editState as StructuredCommand;
    setEditState({
      ...structured,
      staticValues: structured.staticValues.filter((_, i) => i !== index),
    } as CommandTemplate);
  };

  // Validation management
  const getValidation = () => editState.validation;
  const setValidation = (
    updates: Partial<{
      enabled: boolean;
      timeout: number;
      successPattern: string;
      successPatternType: "CONTAINS" | "REGEX";
    }>,
  ) => {
    const current = editState.validation || {
      enabled: false,
      timeout: 2000,
    };
    setEditState({
      ...editState,
      validation: { ...current, ...updates },
    } as CommandTemplate);
  };

  // Hooks management
  const getHooks = () => editState.hooks;
  const setHooks = (
    updates: Partial<{ preRequest?: string; postResponse?: string }>,
  ) => {
    const current = editState.hooks || {};
    setEditState({
      ...editState,
      hooks: { ...current, ...updates },
    } as CommandTemplate);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-background rounded-lg shadow-xl w-full max-w-4xl mx-4 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border shrink-0">
          <h3 className="font-semibold">Edit Command</h3>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* Section Tabs */}
        <div className="flex items-center gap-1 px-4 pt-3 border-b border-border shrink-0">
          {(["basic", "parameters", "response", "hooks"] as const).map(
            (tab) => (
              <button
                key={tab}
                onClick={() => setActiveSection(tab)}
                className={cn(
                  "px-3 py-2 text-sm font-medium rounded-t-md transition-colors",
                  activeSection === tab
                    ? "bg-muted text-foreground border-b-2 border-primary"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50",
                )}
              >
                {tab === "basic"
                  ? "Basic Info"
                  : tab === "parameters"
                    ? "Parameters"
                    : tab === "response"
                      ? "Response"
                      : "Hooks"}
              </button>
            ),
          )}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Basic Info Section */}
          {activeSection === "basic" && (
            <>
              {/* Command Type Toggle */}
              <div className="space-y-2">
                <Label>Command Type</Label>
                <div className="flex items-center gap-4 p-3 border border-border rounded-lg">
                  <div
                    onClick={() => handleTypeChange("SIMPLE")}
                    className="flex items-center gap-2 cursor-pointer"
                  >
                    <Radio
                      name="commandType"
                      checked={isSimple}
                      onChange={() => {}}
                      onClick={(e) => e.stopPropagation()}
                    />
                    <span className={cn(isSimple && "font-medium")}>
                      Simple
                    </span>
                    <span className="text-xs text-muted-foreground">
                      (Text-based)
                    </span>
                  </div>
                  <div
                    onClick={() => handleTypeChange("STRUCTURED")}
                    className="flex items-center gap-2 cursor-pointer"
                  >
                    <Radio
                      name="commandType"
                      checked={isStructured}
                      onChange={() => {}}
                      onClick={(e) => e.stopPropagation()}
                    />
                    <span className={cn(isStructured && "font-medium")}>
                      Structured
                    </span>
                    <span className="text-xs text-muted-foreground">
                      (Binary/Protocol)
                    </span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Name</Label>
                  <Input
                    value={editState.name}
                    onChange={(e) =>
                      setEditState((s) => ({ ...s, name: e.target.value }))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>Category</Label>
                  <Input
                    value={editState.category || ""}
                    onChange={(e) =>
                      setEditState((s) => ({ ...s, category: e.target.value }))
                    }
                    placeholder="e.g., Configuration, Query"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea
                  value={editState.description || ""}
                  onChange={(e) =>
                    setEditState((s) => ({ ...s, description: e.target.value }))
                  }
                  rows={2}
                />
              </div>

              {/* Simple Command Fields */}
              {isSimple && (
                <>
                  <div className="space-y-2">
                    <Label>Payload</Label>
                    <Textarea
                      value={(editState as SimpleCommand).payload}
                      onChange={(e) =>
                        setEditState(
                          (s) =>
                            ({
                              ...s,
                              payload: e.target.value,
                            }) as CommandTemplate,
                        )
                      }
                      placeholder="Enter command payload... Use {paramName} for parameters"
                      rows={3}
                      className="font-mono"
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label>Mode</Label>
                      <Select
                        value={(editState as SimpleCommand).mode}
                        onChange={(e) =>
                          setEditState(
                            (s) =>
                              ({
                                ...s,
                                mode: e.target.value,
                              }) as CommandTemplate,
                          )
                        }
                      >
                        <option value="TEXT">Text</option>
                        <option value="HEX">Hex</option>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Encoding</Label>
                      <Select
                        value={(editState as SimpleCommand).encoding || "UTF-8"}
                        onChange={(e) =>
                          setEditState(
                            (s) =>
                              ({
                                ...s,
                                encoding: e.target.value,
                              }) as CommandTemplate,
                          )
                        }
                      >
                        <option value="UTF-8">UTF-8</option>
                        <option value="ASCII">ASCII</option>
                        <option value="ISO-8859-1">ISO-8859-1</option>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Line Ending</Label>
                      <Select
                        value={
                          (editState as SimpleCommand).lineEnding || "NONE"
                        }
                        onChange={(e) =>
                          setEditState(
                            (s) =>
                              ({
                                ...s,
                                lineEnding: e.target.value,
                              }) as CommandTemplate,
                          )
                        }
                      >
                        <option value="NONE">None</option>
                        <option value="LF">LF (\n)</option>
                        <option value="CR">CR (\r)</option>
                        <option value="CRLF">CRLF (\r\n)</option>
                      </Select>
                    </div>
                  </div>
                </>
              )}

              {/* Structured Command Fields */}
              {isStructured && (
                <>
                  <div className="space-y-2">
                    <Label>Message Structure</Label>
                    <Select
                      value={
                        (editState as StructuredCommand).messageStructureId
                      }
                      onChange={(e) =>
                        setEditState(
                          (s) =>
                            ({
                              ...s,
                              messageStructureId: e.target.value,
                            }) as CommandTemplate,
                        )
                      }
                    >
                      {messageStructures.length === 0 ? (
                        <option value="">No structures available</option>
                      ) : (
                        messageStructures.map((structure) => (
                          <option key={structure.id} value={structure.id}>
                            {structure.name}
                          </option>
                        ))
                      )}
                    </Select>
                    {messageStructures.length === 0 && (
                      <p className="text-xs text-amber-600">
                        Create message structures first in the Structures tab.
                      </p>
                    )}
                  </div>

                  {/* Static Values Section */}
                  {selectedStructure && (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <Label>Static Values</Label>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={addStaticValue}
                          className="gap-1"
                        >
                          <Plus className="w-3 h-3" />
                          Add
                        </Button>
                      </div>
                      {(editState as StructuredCommand).staticValues.length ===
                      0 ? (
                        <p className="text-sm text-muted-foreground italic">
                          No static values defined. Static values set fixed
                          bytes for elements.
                        </p>
                      ) : (
                        <div className="space-y-2">
                          {(editState as StructuredCommand).staticValues.map(
                            (sv, idx) => (
                              <div
                                key={idx}
                                className="flex items-center gap-2 p-2 bg-muted/50 rounded"
                              >
                                <Select
                                  value={sv.elementId}
                                  onChange={(e) =>
                                    updateStaticValue(idx, {
                                      elementId: e.target.value,
                                    })
                                  }
                                  className="flex-1"
                                >
                                  {selectedStructure.elements.map((el) => (
                                    <option key={el.id} value={el.id}>
                                      {el.name}
                                    </option>
                                  ))}
                                </Select>
                                <span className="text-muted-foreground">→</span>
                                <Input
                                  value={
                                    typeof sv.value === "number"
                                      ? `0x${sv.value.toString(16).toUpperCase()}`
                                      : String(sv.value)
                                  }
                                  onChange={(e) => {
                                    const val = e.target.value;
                                    const parsed = val.startsWith("0x")
                                      ? parseInt(val, 16)
                                      : parseInt(val, 10);
                                    updateStaticValue(idx, {
                                      value: isNaN(parsed) ? val : parsed,
                                    });
                                  }}
                                  className="w-24 font-mono"
                                  placeholder="0x00"
                                />
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => removeStaticValue(idx)}
                                  className="text-destructive hover:text-destructive"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </Button>
                              </div>
                            ),
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </>
              )}

              <div className="space-y-2">
                <Label>Tags</Label>
                <Input
                  value={editState.tags.join(", ")}
                  onChange={(e) =>
                    setEditState((s) => ({
                      ...s,
                      tags: e.target.value
                        .split(",")
                        .map((t) => t.trim())
                        .filter((t) => t),
                    }))
                  }
                  placeholder="tag1, tag2, tag3"
                />
              </div>
            </>
          )}

          {/* Parameters Section */}
          {activeSection === "parameters" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium">Parameters</h4>
                  <p className="text-sm text-muted-foreground">
                    {isSimple
                      ? "Define parameters that can be substituted in the payload using {paramName}."
                      : "Define parameters and bind them to message structure elements."}
                  </p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addParameter}
                  className="gap-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Add Parameter
                </Button>
              </div>

              {isStructured &&
              (editState as StructuredCommand).parameters.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 border border-dashed border-border rounded-lg">
                  <p className="text-muted-foreground mb-2">
                    No parameters defined
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Add parameters to make the command configurable
                  </p>
                </div>
              ) : isStructured ? (
                <div className="border border-border rounded-lg overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-muted/50">
                      <tr>
                        <th className="px-3 py-2 text-left font-medium">
                          Name
                        </th>
                        <th className="px-3 py-2 text-left font-medium">
                          Type
                        </th>
                        <th className="px-3 py-2 text-left font-medium">
                          Default
                        </th>
                        <th className="px-3 py-2 text-left font-medium">
                          Bind to Element
                        </th>
                        <th className="px-3 py-2 w-10"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {(editState as StructuredCommand).parameters.map(
                        (param, idx) => {
                          const binding = (
                            editState as StructuredCommand
                          ).bindings.find(
                            (b) => b.parameterName === param.name,
                          );
                          return (
                            <tr key={param.id || idx}>
                              <td className="px-3 py-2">
                                <Input
                                  value={param.name}
                                  onChange={(e) =>
                                    updateParameter(idx, {
                                      name: e.target.value,
                                    })
                                  }
                                  className="h-8 text-sm font-mono"
                                />
                              </td>
                              <td className="px-3 py-2">
                                <Select
                                  value={param.type}
                                  onChange={(e) =>
                                    updateParameter(idx, {
                                      type: e.target.value as
                                        | "STRING"
                                        | "INTEGER"
                                        | "FLOAT"
                                        | "BOOLEAN"
                                        | "ENUM",
                                    })
                                  }
                                  className="h-8 text-sm"
                                >
                                  <option value="STRING">String</option>
                                  <option value="INTEGER">Integer</option>
                                  <option value="FLOAT">Float</option>
                                  <option value="BOOLEAN">Boolean</option>
                                  <option value="ENUM">Enum</option>
                                </Select>
                              </td>
                              <td className="px-3 py-2">
                                <Input
                                  value={String(param.defaultValue || "")}
                                  onChange={(e) =>
                                    updateParameter(idx, {
                                      defaultValue:
                                        param.type === "INTEGER"
                                          ? parseInt(e.target.value) || 0
                                          : param.type === "FLOAT"
                                            ? parseFloat(e.target.value) || 0
                                            : param.type === "BOOLEAN"
                                              ? e.target.value === "true"
                                              : e.target.value,
                                    })
                                  }
                                  className="h-8 text-sm"
                                  placeholder="-"
                                />
                              </td>
                              <td className="px-3 py-2">
                                <Select
                                  value={binding?.elementId || ""}
                                  onChange={(e) =>
                                    updateBinding(param.name, e.target.value)
                                  }
                                  className="h-8 text-sm"
                                >
                                  <option value="">-- Not bound --</option>
                                  {selectedStructure?.elements.map((el) => (
                                    <option key={el.id} value={el.id}>
                                      {el.name}
                                    </option>
                                  ))}
                                </Select>
                              </td>
                              <td className="px-3 py-2">
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => removeParameter(idx)}
                                  className="h-8 w-8 text-destructive hover:text-destructive"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </Button>
                              </td>
                            </tr>
                          );
                        },
                      )}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-sm text-muted-foreground italic">
                  Simple commands use template substitution. Add parameters
                  using the &quot;Add Parameter&quot; button and reference them
                  in the payload as {"{paramName}"}.
                </div>
              )}
            </div>
          )}

          {/* Response Section */}
          {activeSection === "response" && (
            <div className="space-y-4">
              <div>
                <h4 className="font-medium">Response Validation</h4>
                <p className="text-sm text-muted-foreground">
                  Configure how to validate the response from this command.
                </p>
              </div>

              <div className="space-y-3 p-4 border border-border rounded-lg">
                <Checkbox
                  checked={getValidation()?.enabled || false}
                  onChange={(e) => setValidation({ enabled: e.target.checked })}
                  label="Enable Validation"
                />

                {getValidation()?.enabled && (
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Timeout (ms)</Label>
                        <Input
                          type="number"
                          value={getValidation()?.timeout || 2000}
                          onChange={(e) =>
                            setValidation({
                              timeout: parseInt(e.target.value) || 2000,
                            })
                          }
                          min={100}
                          max={30000}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Match Type</Label>
                        <Select
                          value={
                            getValidation()?.successPatternType || "CONTAINS"
                          }
                          onChange={(e) =>
                            setValidation({
                              successPatternType: e.target.value as
                                | "CONTAINS"
                                | "REGEX",
                            })
                          }
                        >
                          <option value="CONTAINS">Contains</option>
                          <option value="REGEX">Regex</option>
                        </Select>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Success Pattern</Label>
                      <Input
                        value={getValidation()?.successPattern || ""}
                        onChange={(e) =>
                          setValidation({ successPattern: e.target.value })
                        }
                        placeholder={
                          getValidation()?.successPatternType === "REGEX"
                            ? "e.g., OK|SUCCESS"
                            : "e.g., OK"
                        }
                        className="font-mono"
                      />
                    </div>
                  </>
                )}
              </div>

              {/* Response Patterns for Structured Commands */}
              {isStructured && (
                <div className="space-y-3">
                  <div>
                    <h4 className="font-medium">Response Patterns</h4>
                    <p className="text-sm text-muted-foreground">
                      Define patterns for success, error, and data responses.
                    </p>
                  </div>
                  <div className="p-4 border border-dashed border-border rounded-lg text-center text-muted-foreground text-sm">
                    Response pattern configuration coming soon. Currently only
                    basic validation is supported.
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Hooks Section */}
          {activeSection === "hooks" && (
            <div className="space-y-4">
              <div>
                <h4 className="font-medium">Scripting Hooks</h4>
                <p className="text-sm text-muted-foreground">
                  JavaScript code that runs before sending and after receiving.
                </p>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Pre-Request Script</Label>
                  <Textarea
                    value={getHooks()?.preRequest || ""}
                    onChange={(e) => setHooks({ preRequest: e.target.value })}
                    placeholder="// Runs before sending command. Available: params, payload, log()&#10;// Return modified payload or nothing&#10;// Example: return payload + params.suffix;"
                    rows={5}
                    className="font-mono text-sm"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Post-Response Script</Label>
                  <Textarea
                    value={getHooks()?.postResponse || ""}
                    onChange={(e) => setHooks({ postResponse: e.target.value })}
                    placeholder="// Runs after receiving response. Available: data, raw, setVar(), params&#10;// Return true if validation passed&#10;// Example: const json = JSON.parse(data); setVar('temp', json.temp); return true;"
                    rows={5}
                    className="font-mono text-sm"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-2 p-4 border-t border-border shrink-0">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={() => onSave(editState)}>Save</Button>
        </div>
      </div>
    </div>
  );
};

export default ProtocolEditor;
