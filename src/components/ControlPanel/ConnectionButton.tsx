import React from "react";
import { Play, Square } from "lucide-react";
import { Button } from "../ui";
import type { TFunction } from "i18next";

interface ConnectionButtonProps {
  isConnected: boolean;
  connectionType: "SERIAL" | "NETWORK";
  onConnect: () => void;
  onDisconnect: () => void;
  t: TFunction;
}

const ConnectionButton: React.FC<ConnectionButtonProps> = ({
  isConnected,
  connectionType,
  onConnect,
  onDisconnect,
  t,
}) => (
  <div className="flex flex-col gap-1.5 justify-end">
    <span className="text-[10px] font-bold text-transparent select-none uppercase tracking-wider">
      Action
    </span>
    {!isConnected ? (
      <Button
        onClick={onConnect}
        variant="primary"
        className="h-9 px-8 shadow-md font-semibold tracking-wide transition-all hover:scale-105 active:scale-95"
      >
        <Play className="w-4 h-4 mr-2 fill-current" />{" "}
        {connectionType === "SERIAL" ? t("cp.open") : t("cp.connect")}
      </Button>
    ) : (
      <Button
        variant="destructive"
        onClick={onDisconnect}
        className="h-9 px-8 shadow-md font-semibold tracking-wide transition-all hover:scale-105 active:scale-95"
      >
        <Square className="w-4 h-4 mr-2 fill-current" />{" "}
        {connectionType === "SERIAL" ? t("cp.close") : t("cp.disconnect")}
      </Button>
    )}
  </div>
);

export default ConnectionButton;
