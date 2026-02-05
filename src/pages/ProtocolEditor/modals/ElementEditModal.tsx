/**
 * Protocol Editor - Element Edit Modal
 *
 * Modal for creating/editing message structure elements with type-specific configuration
 */

import { useState } from "react";
import { AlertCircle, X } from "lucide-react";
import { Button, Checkbox, Input, Label, Select } from "../../../components/ui";
import { generateId } from "../../../lib/utils";
import type { MessageElement, ElementConfig } from "../../../lib/protocolTypes";

interface ElementEditModalProps {
  element: MessageElement | null;
  isNew: boolean;
  structureElements: MessageElement[];
  onSave: (element: MessageElement) => void;
  onClose: () => void;
}

export const ElementEditModal: React.FC<ElementEditModalProps> = ({
  element,
  isNew,
  structureElements,
  onSave,
  onClose,
}) => {
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
