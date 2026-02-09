import React, { useState, useRef } from "react";
import { useStore } from "../lib/store";
import { FileText, Upload, Trash2, Download, Loader2 } from "lucide-react";
import { cn, generateId } from "../lib/utils";
import { Badge, Button } from "./ui";
import {
  fileToBase64,
  formatBytes,
  downloadBase64File,
  suggestCategory,
} from "../lib/attachmentUtils";
import { DeviceAttachment } from "../types";

interface Props {
  deviceId: string;
}

export const AttachmentManager: React.FC<Props> = ({ deviceId }) => {
  const devices = useStore((state) => state.devices);
  const addAttachment = useStore((state) => state.addDeviceAttachment);
  const removeAttachment = useStore((state) => state.removeDeviceAttachment);
  const addToast = useStore((state) => state.addToast);

  const device = devices.find((d) => d.id === deviceId);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  if (!device) return null;

  const handleFiles = async (files: FileList) => {
    setIsUploading(true);
    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];

        // 10MB limit as per PRD
        if (file.size > 10 * 1024 * 1024) {
          addToast(
            "error",
            "File too large",
            `${file.name} exceeds the 10MB limit.`,
          );
          continue;
        }

        const base64 = await fileToBase64(file);
        const category = suggestCategory(file.name, file.type);

        const newAttachment: DeviceAttachment = {
          id: generateId(),
          name: file.name.split(".")[0],
          filename: file.name,
          mimeType: file.type || "application/octet-stream",
          size: file.size,
          data: base64,
          category,
          createdAt: Date.now(),
        };

        addAttachment(deviceId, newAttachment);
      }
      addToast("success", "Upload Complete", `Added ${files.length} file(s).`);
    } catch {
      addToast("error", "Upload Failed", "An error occurred during upload.");
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const onDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFiles(e.dataTransfer.files);
    }
  };

  return (
    <div className="space-y-4">
      {/* Upload Zone */}
      <div
        className={cn(
          "relative border-2 border-dashed rounded-xl p-6 transition-all flex flex-col items-center justify-center text-center gap-2",
          dragActive
            ? "border-primary bg-primary/5"
            : "border-border bg-muted/5 hover:bg-muted/10",
          isUploading && "opacity-50 pointer-events-none",
        )}
        onDragEnter={onDrag}
        onDragLeave={onDrag}
        onDragOver={onDrag}
        onDrop={onDrop}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          className="absolute inset-0 opacity-0 cursor-pointer"
          onChange={(e) => e.target.files && handleFiles(e.target.files)}
        />
        <div className="p-3 bg-background rounded-full shadow-sm border border-border">
          {isUploading ? (
            <Loader2 className="w-6 h-6 text-primary animate-spin" />
          ) : (
            <Upload className="w-6 h-6 text-muted-foreground" />
          )}
        </div>
        <div>
          <p className="text-sm font-medium">
            {isUploading ? "Uploading..." : "Click or drag to upload"}
          </p>
          <p className="text-[10px] text-muted-foreground">
            Datasheets, manuals, or diagrams (Max 10MB)
          </p>
        </div>
      </div>

      {/* Attachment List */}
      <div className="space-y-2">
        {device.attachments.length === 0 && !isUploading && (
          <div className="py-8 text-center text-muted-foreground text-xs italic opacity-50">
            No reference materials attached.
          </div>
        )}

        {device.attachments.map((att) => (
          <div
            key={att.id}
            className="flex items-center gap-3 p-3 rounded-lg border border-border bg-card hover:border-primary/30 transition-all group"
          >
            <div className="p-2 bg-muted rounded text-muted-foreground group-hover:text-primary transition-colors">
              <FileText className="w-4 h-4" />
            </div>
            <div className="flex-1 overflow-hidden">
              <div
                className="font-medium text-sm truncate"
                title={att.filename}
              >
                {att.name}
              </div>
              <div className="flex items-center gap-2">
                <Badge
                  variant="outline"
                  className="text-[8px] h-3.5 px-1 py-0 bg-background"
                >
                  {att.category}
                </Badge>
                <span className="text-[10px] text-muted-foreground">
                  {formatBytes(att.size)}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={() =>
                  downloadBase64File(att.data, att.filename, att.mimeType)
                }
                title="Download"
              >
                <Download className="w-3.5 h-3.5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-muted-foreground hover:text-destructive"
                onClick={() => {
                  if (confirm(`Remove "${att.filename}"?`)) {
                    removeAttachment(deviceId, att.id);
                  }
                }}
                title="Delete"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
