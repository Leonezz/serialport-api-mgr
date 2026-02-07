/**
 * Protocol Editor - Structure Edit Modal
 *
 * Modal for editing message structure metadata (name, description, encoding, byte order)
 */

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { X } from "lucide-react";
import { Button, Input, Label, Select, Textarea } from "../../../components/ui";
import type { MessageStructure } from "../../../lib/protocolTypes";
import {
  ElementEncodingSchema,
  ByteOrderSchema,
} from "../../../lib/protocolSchemas";

const StructureEditFormSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  encoding: ElementEncodingSchema.default("BINARY"),
  byteOrder: ByteOrderSchema.default("BE"),
});

type StructureEditFormData = z.infer<typeof StructureEditFormSchema>;

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
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<StructureEditFormData>({
    resolver: zodResolver(StructureEditFormSchema),
    defaultValues: {
      name: structure.name,
      description: structure.description || "",
      encoding: structure.encoding,
      byteOrder: structure.byteOrder,
    },
  });

  const onSubmit = (data: StructureEditFormData): void => {
    onSave({
      ...structure,
      name: data.name,
      description: data.description,
      encoding: data.encoding,
      byteOrder: data.byteOrder,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-background rounded-lg shadow-xl w-full max-w-md mx-4">
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h3 className="font-semibold">Edit Structure</h3>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </div>
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="p-4 space-y-4">
            <div className="space-y-2">
              <Label>Name</Label>
              <Input {...register("name")} />
              {errors.name && (
                <p className="text-xs text-destructive">
                  {errors.name.message}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea {...register("description")} rows={2} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Encoding</Label>
                <Select
                  value={watch("encoding")}
                  onChange={(e) =>
                    setValue(
                      "encoding",
                      e.target.value as StructureEditFormData["encoding"],
                    )
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
                  value={watch("byteOrder")}
                  onChange={(e) =>
                    setValue("byteOrder", e.target.value as "LE" | "BE")
                  }
                >
                  <option value="BE">Big Endian</option>
                  <option value="LE">Little Endian</option>
                </Select>
              </div>
            </div>
          </div>
          <div className="flex justify-end gap-2 p-4 border-t border-border">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit">Save</Button>
          </div>
        </form>
      </div>
    </div>
  );
};
