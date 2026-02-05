import React from "react";
import { FileClock, Settings, Coins } from "lucide-react";
import { IconButton } from "../ui";
import type { TFunction } from "i18next";

interface SidebarFooterProps {
  onShowSystemLogs: () => void;
  onShowAppSettings: () => void;
  aiTokenTotal: number;
  t: TFunction;
}

const SidebarFooter: React.FC<SidebarFooterProps> = ({
  onShowSystemLogs,
  onShowAppSettings,
  aiTokenTotal,
  t,
}) => (
  <div className="px-3 py-3 border-t border-border-default bg-bg-muted/20 shrink-0 space-y-2">
    <IconButton
      variant="ghost"
      size="md"
      onClick={onShowSystemLogs}
      aria-label={t("sidebar.logs")}
      title={t("sidebar.logs")}
      className="w-full justify-start gap-2 text-text-secondary hover:text-foreground"
    >
      <FileClock className="w-4 h-4" />
      <span className="text-sm">{t("sidebar.logs")}</span>
    </IconButton>
    <IconButton
      variant="ghost"
      size="md"
      onClick={onShowAppSettings}
      aria-label={t("sidebar.settings")}
      title={t("sidebar.settings")}
      className="w-full justify-start gap-2 text-text-secondary hover:text-foreground"
    >
      <Settings className="w-4 h-4" />
      <span className="text-sm">{t("sidebar.settings")}</span>
    </IconButton>
    {aiTokenTotal > 0 && (
      <div className="flex items-center gap-2 px-2 py-1 text-xs text-muted-foreground">
        <Coins className="w-3.5 h-3.5 text-amber-500" />
        <span className="font-mono">
          {(aiTokenTotal / 1000).toFixed(1)}k tokens
        </span>
      </div>
    )}
  </div>
);

export default SidebarFooter;
