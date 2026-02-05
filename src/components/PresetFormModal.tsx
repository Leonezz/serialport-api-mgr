import React, { useState } from "react";
import { createPortal } from "react-dom";
import {
  SerialPreset,
  SerialConfig,
  NetworkConfig,
  ConnectionType,
} from "../types";
import { X, Check, ArrowDownCircle } from "lucide-react";
import {
  Button,
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
  DropdownOption,
  Input,
  Label,
  SegmentedControl,
  SelectDropdown,
} from "./ui";

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

  return createPortal(
    <div
      className="fixed inset-0 bg-background/80 backdrop-blur-sm z-60 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <Card
        className="w-full max-w-md shadow-2xl border-border animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
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
              <SegmentedControl
                value={type}
                onChange={(v) => setType(v as ConnectionType)}
                size="sm"
                options={[
                  { value: "SERIAL", label: "Serial Port" },
                  { value: "NETWORK", label: "Network (TCP)" },
                ]}
              />
            </div>

            {type === "SERIAL" ? (
              <div className="grid grid-cols-2 gap-4 border p-3 rounded-md bg-muted/10">
                <div className="space-y-1.5">
                  <Label className="text-xs">Baud Rate</Label>
                  <SelectDropdown
                    options={[
                      9600, 19200, 38400, 57600, 74880, 115200, 230400, 460800,
                      921600,
                    ].map(
                      (r): DropdownOption<number> => ({
                        value: r,
                        label: r.toString(),
                      }),
                    )}
                    value={localConfig.baudRate}
                    onChange={(value) => handleSerialChange("baudRate", value)}
                    size="sm"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs">Data Bits</Label>
                  <SelectDropdown
                    options={
                      [
                        { value: "Eight", label: "8-bit" },
                        { value: "Seven", label: "7-bit" },
                      ] as DropdownOption<SerialConfig["dataBits"]>[]
                    }
                    value={localConfig.dataBits}
                    onChange={(value) => handleSerialChange("dataBits", value)}
                    size="sm"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs">Parity</Label>
                  <SelectDropdown
                    options={
                      [
                        { value: "None", label: "None" },
                        { value: "Even", label: "Even" },
                        { value: "Odd", label: "Odd" },
                      ] as DropdownOption<SerialConfig["parity"]>[]
                    }
                    value={localConfig.parity}
                    onChange={(value) => handleSerialChange("parity", value)}
                    size="sm"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs">Stop Bits</Label>
                  <SelectDropdown
                    options={
                      [
                        { value: "One", label: "1-bit" },
                        { value: "Two", label: "2-bit" },
                      ] as DropdownOption<SerialConfig["stopBits"]>[]
                    }
                    value={localConfig.stopBits}
                    onChange={(value) => handleSerialChange("stopBits", value)}
                    size="sm"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs">Line Ending</Label>
                  <SelectDropdown
                    options={
                      [
                        { value: "NONE", label: "None" },
                        { value: "LF", label: "LF (\\n)" },
                        { value: "CR", label: "CR (\\r)" },
                        { value: "CRLF", label: "CRLF (\\r\\n)" },
                      ] as DropdownOption<SerialConfig["lineEnding"]>[]
                    }
                    value={localConfig.lineEnding}
                    onChange={(value) =>
                      handleSerialChange("lineEnding", value)
                    }
                    size="sm"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs">Flow Control</Label>
                  <SelectDropdown
                    options={
                      [
                        { value: "None", label: "None" },
                        { value: "Hardware", label: "Hardware (RTS/CTS)" },
                      ] as DropdownOption<SerialConfig["flowControl"]>[]
                    }
                    value={localConfig.flowControl}
                    onChange={(value) =>
                      handleSerialChange("flowControl", value)
                    }
                    size="sm"
                  />
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
              <Check className="w-4 h-4 mr-2" /> Save Changes
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>,
    document.body,
  );
};

export default PresetFormModal;
