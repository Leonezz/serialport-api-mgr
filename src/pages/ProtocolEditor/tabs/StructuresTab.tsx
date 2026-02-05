/**
 * Protocol Editor - Structures Tab
 *
 * Manages message structures with element editing
 */

import { useState } from "react";
import {
  ChevronDown,
  ChevronRight,
  GripVertical,
  Layers,
  Pencil,
  Plus,
  Trash2,
} from "lucide-react";
import { Button } from "../../../components/ui";
import type {
  MessageElement,
  MessageStructure,
} from "../../../lib/protocolTypes";
import type { StructuresTabProps } from "../protocolEditorTypes";
import { StructurePreview } from "../components/StructurePreview";
import { StructureEditModal } from "../modals/StructureEditModal";
import { ElementEditModal } from "../modals/ElementEditModal";

export const StructuresTab: React.FC<StructuresTabProps> = ({
  editState,
  onChange,
  onAddStructure,
  onDeleteStructure,
}) => {
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
              <div
                role="button"
                tabIndex={0}
                onClick={() =>
                  setExpanded(expanded === structure.id ? null : structure.id)
                }
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    setExpanded(
                      expanded === structure.id ? null : structure.id,
                    );
                  }
                }}
                className="w-full flex items-center gap-3 p-4 text-left hover:bg-muted/50 cursor-pointer"
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
              </div>
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
