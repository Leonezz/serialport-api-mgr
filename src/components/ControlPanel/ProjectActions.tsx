import React from "react";
import { Upload, Download, Wand2 } from "lucide-react";
import { Button, FileInput, FileInputRef } from "../ui";

interface ProjectActionsProps {
  fileInputRef: React.RefObject<FileInputRef | null>;
  onImport: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onExport: () => void;
  onOpenAIGenerator: () => void;
}

const ProjectActions: React.FC<ProjectActionsProps> = ({
  fileInputRef,
  onImport,
  onExport,
  onOpenAIGenerator,
}) => (
  <div className="flex flex-col gap-1.5 justify-end">
    <span className="text-[10px] font-bold text-transparent select-none uppercase tracking-wider">
      Project
    </span>
    <div className="flex items-center gap-1 bg-muted/30 p-1 rounded-md border border-border">
      <FileInput ref={fileInputRef} accept=".json" onChange={onImport} />
      <Button
        variant="ghost"
        size="icon"
        onClick={() => fileInputRef.current?.open()}
        className="h-7 w-7 rounded-sm hover:bg-background hover:shadow-sm"
        title="Load Project Backup"
      >
        <Upload className="w-3.5 h-3.5" />
      </Button>
      <div className="w-px h-4 bg-border/50"></div>
      <Button
        variant="ghost"
        size="icon"
        onClick={onExport}
        className="h-7 w-7 rounded-sm hover:bg-background hover:shadow-sm"
        title="Save Project Backup"
      >
        <Download className="w-3.5 h-3.5" />
      </Button>
      <div className="w-px h-4 bg-border/50"></div>
      <Button
        variant="ghost"
        size="icon"
        onClick={onOpenAIGenerator}
        className="h-7 w-7 rounded-sm hover:bg-background hover:shadow-sm text-purple-500 hover:text-purple-600"
        title="AI Project Generator (From manual/text)"
      >
        <Wand2 className="w-3.5 h-3.5" />
      </Button>
    </div>
  </div>
);

export default ProjectActions;
