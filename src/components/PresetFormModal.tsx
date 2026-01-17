import React, { useState } from "react";
import {
  SerialPreset,
  SerialConfig,
  NetworkConfig,
  ConnectionType,
} from "../types";
import { X, Save, ArrowDownCircle } from "lucide-react";
import { Button } from "./ui/Button";
import { Input } from "./ui/Input";
import { Label } from "./ui/Label";
import { Select } from "./ui/Select";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter,
} from "./ui/Card";

interface Props {
  initialData: SerialPreset;
  currentConfig: SerialConfig;
  currentNetworkConfig: NetworkConfig;
  currentConnectionType: ConnectionType;
  onSave: (updatedPreset: SerialPreset) => void;
  onClose: () => void;
}

const PresetFormModal: React.FC<Props> = ({
  initialData,
  currentConfig,
  currentNetworkConfig,
  currentConnectionType,
  onSave,
  onClose,
}) => {
  const [name, setName] = useState(initialData.name);
  const [type, setType] = useState<ConnectionType>(initialData.type);

  // Local state for configs
  const [localConfig, setLocalConfig] = useState<SerialConfig>(
    initialData.config,
  );
  const [localNetwork, setLocalNetwork] = useState<NetworkConfig>(
    initialData.network || { host: "localhost", port: 8080 },
  );

  const handleSerialChange = (
    key: keyof SerialConfig,
    value: SerialConfig[keyof SerialConfig],
  ) => {
    setLocalConfig((prev) => ({ ...prev, [key]: value }));
  };

  const handleNetworkChange = (
    key: keyof NetworkConfig,
    value: NetworkConfig[keyof NetworkConfig],
  ) => {
    setLocalNetwork((prev) => ({ ...prev, [key]: value }));
  };

  const loadActiveSettings = () => {
    setType(currentConnectionType);
    if (currentConnectionType === "SERIAL") {
      setLocalConfig({ ...currentConfig });
    } else {
      setLocalNetwork({ ...currentNetworkConfig });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      ...initialData,
      name,
      type,
      config: localConfig,
      network: type === "NETWORK" ? localNetwork : undefined,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-2xl border-border animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] flex flex-col">
        <CardHeader className="flex flex-row items-center justify-between pb-2 border-b border-border bg-muted/20 shrink-0">
          <CardTitle className="text-lg">Edit Configuration Preset</CardTitle>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="h-8 w-8 -mr-2"
          >
            <X className="w-4 h-4" />
          </Button>
        </CardHeader>

        <form
          onSubmit={handleSubmit}
          className="flex-1 overflow-hidden flex flex-col"
        >
          <CardContent className="pt-6 space-y-5 overflow-y-auto">
            <div className="space-y-2">
              <Label htmlFor="presetName">Preset Name</Label>
              <Input
                id="presetName"
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoFocus
                required
              />
            </div>

            <div className="flex justify-end">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={loadActiveSettings}
                className="text-xs h-7"
                title="Populate fields with currently active settings from the main window"
              >
                <ArrowDownCircle className="w-3.5 h-3.5 mr-1.5" /> Load Active
                Settings
              </Button>
            </div>

            <div className="space-y-2">
              <Label>Connection Type</Label>
              <div className="flex items-center gap-2 p-1 bg-muted rounded-lg border border-border">
                <button
                  type="button"
                  onClick={() => setType("SERIAL")}
                  className={`flex-1 text-xs font-bold py-1.5 rounded-md transition-all ${type === "SERIAL" ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"}`}
                >
                  Serial Port
                </button>
                <button
                  type="button"
                  onClick={() => setType("NETWORK")}
                  className={`flex-1 text-xs font-bold py-1.5 rounded-md transition-all ${type === "NETWORK" ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"}`}
                >
                  Network (TCP)
                </button>
              </div>
            </div>

            {type === "SERIAL" ? (
              <div className="grid grid-cols-2 gap-4 border p-3 rounded-md bg-muted/10">
                <div className="space-y-1.5">
                  <Label className="text-xs">Baud Rate</Label>
                  <Select
                    value={localConfig.baudRate}
                    onChange={(e) =>
                      handleSerialChange("baudRate", parseInt(e.target.value))
                    }
                    className="h-8 text-xs bg-background"
                  >
                    {[
                      9600, 19200, 38400, 57600, 74880, 115200, 230400, 460800,
                      921600,
                    ].map((r) => (
                      <option key={r} value={r}>
                        {r}
                      </option>
                    ))}
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs">Data Bits</Label>
                  <Select
                    value={localConfig.dataBits}
                    onChange={(e) =>
                      handleSerialChange("dataBits", parseInt(e.target.value))
                    }
                    className="h-8 text-xs bg-background"
                  >
                    <option value={8}>8-bit</option>
                    <option value={7}>7-bit</option>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs">Parity</Label>
                  <Select
                    value={localConfig.parity}
                    onChange={(e) =>
                      handleSerialChange(
                        "parity",
                        e.target.value as unknown as SerialConfig["parity"],
                      )
                    }
                    className="h-8 text-xs bg-background"
                  >
                    <option value="none">None</option>
                    <option value="even">Even</option>
                    <option value="odd">Odd</option>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs">Stop Bits</Label>
                  <Select
                    value={localConfig.stopBits}
                    onChange={(e) =>
                      handleSerialChange("stopBits", parseInt(e.target.value))
                    }
                    className="h-8 text-xs bg-background"
                  >
                    <option value={1}>1-bit</option>
                    <option value={2}>2-bit</option>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs">Line Ending</Label>
                  <Select
                    value={localConfig.lineEnding}
                    onChange={(e) =>
                      handleSerialChange(
                        "lineEnding",
                        e.target.value as unknown as SerialConfig["lineEnding"],
                      )
                    }
                    className="h-8 text-xs bg-background"
                  >
                    <option value="NONE">None</option>
                    <option value="LF">LF (\n)</option>
                    <option value="CR">CR (\r)</option>
                    <option value="CRLF">CRLF (\r\n)</option>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs">Flow Control</Label>
                  <Select
                    value={localConfig.flowControl}
                    onChange={(e) =>
                      handleSerialChange(
                        "flowControl",
                        e.target
                          .value as unknown as SerialConfig["flowControl"],
                      )
                    }
                    className="h-8 text-xs bg-background"
                  >
                    <option value="none">None</option>
                    <option value="hardware">Hardware (RTS/CTS)</option>
                  </Select>
                </div>
              </div>
            ) : (
              <div className="space-y-3 border p-3 rounded-md bg-muted/10">
                <div className="space-y-1.5">
                  <Label className="text-xs">Host / IP</Label>
                  <Input
                    value={localNetwork.host}
                    onChange={(e) =>
                      handleNetworkChange("host", e.target.value)
                    }
                    className="h-8 text-xs bg-background"
                    placeholder="localhost"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Port</Label>
                  <Input
                    type="number"
                    value={localNetwork.port}
                    onChange={(e) =>
                      handleNetworkChange("port", parseInt(e.target.value))
                    }
                    className="h-8 text-xs bg-background"
                    placeholder="8080"
                  />
                </div>
              </div>
            )}
          </CardContent>
          <CardFooter className="flex justify-end bg-muted/20 border-t border-border p-4 gap-2 shrink-0">
            <Button type="button" variant="ghost" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit">
              <Save className="w-4 h-4 mr-2" /> Save Changes
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
};

export default PresetFormModal;
