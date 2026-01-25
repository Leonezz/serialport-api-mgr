/**
 * Protocol Editor - Structure Edit Modal
 *
 * Modal for editing message structure metadata (name, description, encoding, byte order)
 */

import { useState } from "react";
import { X } from "lucide-react";
import { Button } from "../../../components/ui/Button";
import { Input } from "../../../components/ui/Input";
import { Label } from "../../../components/ui/Label";
import { Select } from "../../../components/ui/Select";
import { Textarea } from "../../../components/ui/Textarea";
import type { MessageStructure } from "../../../lib/protocolTypes";

interface StructureEditModalProps {
  structure: MessageStructure;
  onSave: (structure: MessageStructure) => void;
  onClose: () => void;
}

export const StructureEditModal: React.FC<StructureEditModalProps> = ({
  structure,
  onSave,
  onClose,
}) => {
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
