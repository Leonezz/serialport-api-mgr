import React from "react";
import { Terminal, FileClock, Settings, Coins } from "lucide-react";
import { IconButton } from "../ui/IconButton";
import type { TFunction } from "i18next";

interface CollapsedSidebarProps {
  onExpand: () => void;
  onShowSystemLogs: () => void;
  onShowAppSettings: () => void;
  aiTokenTotal: number;
  t: TFunction;
}

const CollapsedSidebar: React.FC<CollapsedSidebarProps> = ({
  onExpand,
  onShowSystemLogs,
  onShowAppSettings,
  aiTokenTotal,
  t,
}) => (
  <div className="flex-1 flex flex-col items-center py-3 gap-2">
    <IconButton
      variant="ghost"
      size="md"
      onClick={onExpand}
      aria-label="Library"
      title="Library"
      className="text-muted-foreground hover:text-foreground"
    >
      <Terminal className="w-5 h-5" />
    </IconButton>
    <div className="flex-1" />
    <IconButton
      variant="ghost"
      size="md"
      onClick={onShowSystemLogs}
      aria-label={t("sidebar.logs")}
      title={t("sidebar.logs")}
      className="text-muted-foreground hover:text-foreground"
    >
      <FileClock className="w-5 h-5" />
    </IconButton>
    <IconButton
      variant="ghost"
      size="md"
      onClick={onShowAppSettings}
      aria-label={t("sidebar.settings")}
      title={t("sidebar.settings")}
      className="text-muted-foreground hover:text-foreground"
    >
      <Settings className="w-5 h-5" />
    </IconButton>
    {aiTokenTotal > 0 && (
      <div
        className="flex flex-col items-center gap-0.5 mt-2"
        title={`Token Usage: ${aiTokenTotal}`}
      >
        <Coins className="w-3 h-3 text-amber-500" />
        <span className="text-[9px] font-mono text-muted-foreground">
          {(aiTokenTotal / 1000).toFixed(1)}k
        </span>
      </div>
    )}
  </div>
);

export default CollapsedSidebar;
