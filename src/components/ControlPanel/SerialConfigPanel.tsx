import React from "react";
import { RefreshCw, Scissors, Link2 } from "lucide-react";
import { SerialConfig } from "../../types";
import { Protocol } from "../../lib/protocolTypes";
import { Button, DropdownOption, Select, SelectDropdown } from "../ui";
import { ISerialPort } from "../../lib/serialService";
import { cn } from "../../lib/utils";
import { getSemanticPortName, getPortTooltip } from "../../lib/utils/portUtils";
import type { TFunction } from "i18next";

interface SerialConfigPanelProps {
  config: SerialConfig;
  isConnected: boolean;
  availablePorts: ISerialPort[];
  selectedPortIndex: string;
  onSelectedPortIndexChange: (value: string) => void;
  onConfigChange: (
    key: keyof SerialConfig,
    value: SerialConfig[keyof SerialConfig],
  ) => void;
  onRefreshPorts: () => void;
  onShowFramingModal: () => void;
  protocols: Protocol[];
  protocolFramingEnabled: boolean;
  activeProtocol: Protocol | null;
  onProtocolFramingToggle: () => void;
  t: TFunction;
}

const SerialConfigPanel: React.FC<SerialConfigPanelProps> = ({
  config,
  isConnected,
  availablePorts,
  selectedPortIndex,
  onSelectedPortIndexChange,
  onConfigChange,
  onRefreshPorts,
  onShowFramingModal,
  protocols,
  protocolFramingEnabled,
  activeProtocol,
  onProtocolFramingToggle,
  t,
}) => {
  const strategy = config.framing?.strategy || "NONE";

  return (
    <>
      <div className="flex flex-col gap-1.5">
        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider pl-1">
          {t("cp.port")}
        </span>
        <div className="flex items-center gap-1">
          <div className="w-50">
            <Select
              className="h-9 text-xs font-mono bg-muted/30 border-border focus:border-primary focus:ring-primary/20"
              value={selectedPortIndex}
              onChange={(e) => onSelectedPortIndexChange(e.target.value)}
              disabled={isConnected}
            >
              <option value="" disabled>
                Select a port...
              </option>
              <optgroup label="Simulated Devices">
                <option
                  value="mock-echo"
                  className="font-bold text-emerald-600"
                >
                  🔌 Virtual Echo Device
                </option>
                <option
                  value="mock-json-stream"
                  className="font-bold text-blue-600"
                >
                  🧩 Virtual JSON Stream (Fragment/Burst)
                </option>
                <option
                  value="mock-timeout-stream"
                  className="font-bold text-purple-600"
                >
                  ⏱️ Virtual Packet Stream (Timeout)
                </option>
                <option
                  value="mock-prefix-stream"
                  className="font-bold text-amber-600"
                >
                  📏 Virtual Prefix Stream (2B LE)
                </option>
                <option
                  value="mock-sine-wave"
                  className="font-bold text-pink-600"
                >
                  📈 Virtual Sine Wave Generator
                </option>
              </optgroup>
              {availablePorts.length > 0 && (
                <optgroup label="Physical Ports">
                  {availablePorts.map((port, idx) => {
                    const rustInfo = port.getRustPortInfo?.();
                    const semanticName = rustInfo
                      ? getSemanticPortName(rustInfo)
                      : `Port ${idx + 1}`;
                    const tooltip = rustInfo ? getPortTooltip(rustInfo) : "";
                    return (
                      <option key={idx} value={idx} title={tooltip}>
                        {semanticName}
                      </option>
                    );
                  })}
                </optgroup>
              )}
              <option value="new">+ Request New Port...</option>
            </Select>
          </div>
          <Button
            variant="outline"
            size="icon"
            className="h-9 w-9 text-muted-foreground hover:text-foreground bg-muted/30 border-border"
            onClick={onRefreshPorts}
            title="Refresh Ports"
          >
            <RefreshCw className="w-4 h-4" />
          </Button>
        </div>
      </div>
      <div className="flex flex-col gap-1.5">
        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider pl-1">
          {t("cp.baud")}
        </span>
        <div className="w-25">
          <SelectDropdown
            options={[
              9600, 19200, 38400, 57600, 74880, 115200, 230400, 460800, 921600,
            ].map(
              (r): DropdownOption<number> => ({
                value: r,
                label: r.toString(),
              }),
            )}
            value={config.baudRate}
            onChange={(value) => onConfigChange("baudRate", value)}
            disabled={isConnected}
            size="sm"
          />
        </div>
      </div>
      <div className="flex flex-col gap-1.5">
        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider pl-1">
          Data Bits
        </span>
        <div className="w-24">
          <SelectDropdown
            options={
              [
                { value: "Eight", label: "8-bit" },
                { value: "Seven", label: "7-bit" },
              ] as DropdownOption<SerialConfig["dataBits"]>[]
            }
            value={config.dataBits}
            onChange={(value) => onConfigChange("dataBits", value)}
            disabled={isConnected}
            size="sm"
            menuMinWidth={120}
          />
        </div>
      </div>
      <div className="flex flex-col gap-1.5">
        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider pl-1">
          Parity
        </span>
        <div className="w-24">
          <SelectDropdown
            options={
              [
                { value: "None", label: "None" },
                { value: "Even", label: "Even" },
                { value: "Odd", label: "Odd" },
              ] as DropdownOption<SerialConfig["parity"]>[]
            }
            value={config.parity}
            onChange={(value) => onConfigChange("parity", value)}
            disabled={isConnected}
            size="sm"
            menuMinWidth={120}
          />
        </div>
      </div>
      <div className="flex flex-col gap-1.5">
        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider pl-1">
          Stop Bits
        </span>
        <div className="w-24">
          <SelectDropdown
            options={
              [
                { value: "One", label: "1-bit" },
                { value: "Two", label: "2-bit" },
              ] as DropdownOption<SerialConfig["stopBits"]>[]
            }
            value={config.stopBits}
            onChange={(value) => onConfigChange("stopBits", value)}
            disabled={isConnected}
            size="sm"
            menuMinWidth={120}
          />
        </div>
      </div>

      {/* Framing Strategy Section */}
      <div className="flex flex-col gap-1.5 relative">
        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider pl-1">
          {t("cp.framing")}
        </span>
        <div className="flex items-center gap-1">
          {/* Protocol Framing Toggle */}
          {protocols.length > 0 && (
            <Button
              variant="outline"
              className={cn(
                "h-9 px-2 text-xs gap-1.5 border-border bg-muted/30",
                protocolFramingEnabled &&
                  activeProtocol &&
                  "border-emerald-500/50 text-emerald-600 bg-emerald-500/5",
              )}
              onClick={onProtocolFramingToggle}
              title={
                protocolFramingEnabled && activeProtocol
                  ? `Using framing from: ${activeProtocol.name}`
                  : "Enable protocol-defined framing"
              }
            >
              <Link2
                className={cn(
                  "w-3.5 h-3.5",
                  protocolFramingEnabled && "text-emerald-500",
                )}
              />
              {protocolFramingEnabled && activeProtocol
                ? activeProtocol.name.length > 8
                  ? activeProtocol.name.slice(0, 8) + "\u2026"
                  : activeProtocol.name
                : "Proto"}
            </Button>
          )}
          {/* Custom Framing Button */}
          <Button
            variant="outline"
            className={cn(
              "h-9 px-3 text-xs gap-2 border-border bg-muted/30",
              !protocolFramingEnabled &&
                strategy !== "NONE" &&
                "border-primary/50 text-primary bg-primary/5",
            )}
            onClick={onShowFramingModal}
            disabled={protocolFramingEnabled}
            title={
              protocolFramingEnabled
                ? "Disable protocol framing to use custom framing"
                : "Configure custom framing strategy"
            }
          >
            <Scissors className="w-3.5 h-3.5" />
            {protocolFramingEnabled
              ? "Custom"
              : strategy === "NONE"
                ? "None"
                : strategy === "TIMEOUT"
                  ? "Timeout"
                  : strategy === "PREFIX_LENGTH"
                    ? "Prefix"
                    : strategy === "SCRIPT"
                      ? "Script"
                      : "Delim"}
          </Button>
        </div>
      </div>
    </>
  );
};

export default SerialConfigPanel;
