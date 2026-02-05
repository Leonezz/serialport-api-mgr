import React from "react";
import { NetworkConfig } from "../../types";
import { Input } from "../ui";

interface NetworkConfigPanelProps {
  networkConfig: NetworkConfig;
  isConnected: boolean;
  onNetworkConfigChange: (
    key: keyof NetworkConfig,
    value: NetworkConfig[keyof NetworkConfig],
  ) => void;
}

const NetworkConfigPanel: React.FC<NetworkConfigPanelProps> = ({
  networkConfig,
  isConnected,
  onNetworkConfigChange,
}) => (
  <>
    <div className="flex flex-col gap-1.5">
      <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider pl-1">
        Host (WebSocket/IP)
      </span>
      <Input
        value={networkConfig.host}
        onChange={(e) => onNetworkConfigChange("host", e.target.value)}
        disabled={isConnected}
        className="h-9 w-55 text-xs font-mono bg-muted/30 border-border"
        placeholder="192.168.1.100"
      />
    </div>
    <div className="flex flex-col gap-1.5">
      <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider pl-1">
        Port
      </span>
      <Input
        type="number"
        value={networkConfig.port}
        onChange={(e) =>
          onNetworkConfigChange("port", parseInt(e.target.value))
        }
        disabled={isConnected}
        className="h-9 w-20 text-xs font-mono bg-muted/30 border-border"
        placeholder="8080"
      />
    </div>
  </>
);

export default NetworkConfigPanel;
