import React from "react";
import { Cable, Globe } from "lucide-react";
import { cn } from "../../lib/utils";
import type { TFunction } from "i18next";

interface ModeSelectorProps {
  connectionType: "SERIAL" | "NETWORK";
  isConnected: boolean;
  onConnectionTypeChange: (type: "SERIAL" | "NETWORK") => void;
  t: TFunction;
}

const ModeSelector: React.FC<ModeSelectorProps> = ({
  connectionType,
  isConnected,
  onConnectionTypeChange,
  t,
}) => (
  <div className="flex flex-col gap-1.5">
    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider pl-1">
      {t("cp.mode")}
    </span>
    <div className="flex items-center bg-muted/30 p-1 rounded-md border border-border h-9">
      <button
        onClick={() => onConnectionTypeChange("SERIAL")}
        disabled={isConnected}
        className={cn(
          "px-2 h-full rounded-sm text-xs font-medium flex items-center gap-1.5 transition-all",
          connectionType === "SERIAL"
            ? "bg-background shadow-sm text-foreground"
            : "text-muted-foreground hover:text-foreground",
        )}
      >
        <Cable className="w-3 h-3" /> Serial
      </button>
      <div className="w-px h-3 bg-border/50 mx-1"></div>
      <button
        onClick={() => onConnectionTypeChange("NETWORK")}
        disabled={isConnected}
        className={cn(
          "px-2 h-full rounded-sm text-xs font-medium flex items-center gap-1.5 transition-all",
          connectionType === "NETWORK"
            ? "bg-background shadow-sm text-foreground"
            : "text-muted-foreground hover:text-foreground",
        )}
      >
        <Globe className="w-3 h-3" /> TCP
      </button>
    </div>
  </div>
);

export default ModeSelector;
