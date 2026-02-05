import React from "react";
import { Check, RotateCcw, Copy, X, Plus } from "lucide-react";
import { Button } from "../ui";
import { cn } from "../../lib/utils";
import type { TFunction } from "i18next";

interface PresetToolbarProps {
  loadedPresetId: string | null;
  activePresetName: string | null | undefined;
  isPresetDirty: boolean;
  onUpdate: () => void;
  onRevert: () => void;
  onCopy: () => void;
  onDetach: () => void;
  onSaveAs: () => void;
  t: TFunction;
}

const PresetToolbar: React.FC<PresetToolbarProps> = ({
  loadedPresetId,
  activePresetName,
  isPresetDirty,
  onUpdate,
  onRevert,
  onCopy,
  onDetach,
  onSaveAs,
  t,
}) => (
  <>
    <div className="h-full w-px bg-border/50 mx-2"></div>
    <div className="flex flex-col gap-1.5">
      <span className="text-[10px] font-bold text-transparent select-none uppercase tracking-wider">
        {t("cp.profile")}
      </span>
      <div className="flex items-center gap-1.5 bg-muted/30 p-1 rounded-md border border-border h-9">
        {loadedPresetId ? (
          <>
            <div
              className={cn(
                "px-2 text-xs font-medium max-w-30 truncate flex items-center gap-1.5",
                isPresetDirty ? "text-amber-500" : "text-foreground",
              )}
            >
              {activePresetName}
              {isPresetDirty && (
                <span
                  className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"
                  title="Unsaved Changes"
                ></span>
              )}
            </div>
            {isPresetDirty && (
              <>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 text-amber-500 hover:text-amber-600 hover:bg-amber-500/10"
                  onClick={onUpdate}
                  title="Update Profile"
                >
                  <Check className="w-3.5 h-3.5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 text-muted-foreground hover:text-foreground"
                  onClick={onRevert}
                  title="Revert Changes"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </Button>
              </>
            )}
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 text-muted-foreground hover:text-foreground"
              onClick={onCopy}
              title="Save As New Preset (Copy)"
            >
              <Copy className="w-3.5 h-3.5" />
            </Button>
            <div className="w-px h-4 bg-border/50"></div>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
              onClick={onDetach}
              title="Detach (Cancel) Profile"
            >
              <X className="w-3.5 h-3.5" />
            </Button>
          </>
        ) : (
          <div className="px-1 flex items-center gap-2">
            <span className="text-[10px] text-muted-foreground italic px-1">
              {t("cp.custom")}
            </span>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 text-[10px] gap-1 px-2 border border-dashed border-border"
              onClick={onSaveAs}
            >
              <Plus className="w-3 h-3" /> {t("cp.save_as")}
            </Button>
          </div>
        )}
      </div>
    </div>
  </>
);

export default PresetToolbar;
