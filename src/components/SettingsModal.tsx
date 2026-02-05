import React, { useState } from "react";
import { createPortal } from "react-dom";
import { SerialConfig, SerialPreset } from "../types";
import { X, Check, Trash2, Download } from "lucide-react";
import {
  Button,
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
  DropdownOption,
  Label,
  SelectDropdown,
} from "./ui";

interface Props {
  config: SerialConfig;
  setConfig: React.Dispatch<React.SetStateAction<SerialConfig>>;
  presets: SerialPreset[];
  onSavePreset: (name: string, config: SerialConfig) => void;
  onDeletePreset: (id: string) => void;
  onClose: () => void;
}

// Options for serial configuration
const BAUD_RATE_OPTIONS: DropdownOption<number>[] = [
  9600, 19200, 38400, 57600, 74880, 115200, 230400, 460800, 921600,
].map((rate) => ({ value: rate, label: rate.toLocaleString() }));

const DATA_BITS_OPTIONS: DropdownOption<SerialConfig["dataBits"]>[] = [
  { value: "Seven", label: "7" },
  { value: "Eight", label: "8" },
];

const STOP_BITS_OPTIONS: DropdownOption<SerialConfig["stopBits"]>[] = [
  { value: "One", label: "1" },
  { value: "Two", label: "2" },
];

const PARITY_OPTIONS: DropdownOption<string>[] = [
  { value: "none", label: "None" },
  { value: "even", label: "Even" },
  { value: "odd", label: "Odd" },
];

const FLOW_CONTROL_OPTIONS: DropdownOption<string>[] = [
  { value: "none", label: "None" },
  { value: "hardware", label: "Hardware (RTS/CTS)" },
];

const SettingsModal: React.FC<Props> = ({
  config,
  setConfig,
  presets,
  onSavePreset,
  onDeletePreset,
  onClose,
}) => {
  const [selectedPresetId, setSelectedPresetId] = useState<string>("");

  const handleChange = <K extends keyof SerialConfig>(
    key: K,
    value: SerialConfig[K],
  ) => {
    setConfig((prev) => ({ ...prev, [key]: value }));
  };

  const handlePresetChange = (presetId: string) => {
    if (!presetId) return;
    setSelectedPresetId(presetId);
    const preset = presets.find((p) => p.id === presetId);
    if (preset) {
      setConfig({ ...preset.config });
    }
  };

  const presetOptions: DropdownOption<string>[] = presets.map((p) => ({
    value: p.id,
    label: p.name,
  }));

  return createPortal(
    <div
      className="fixed inset-0 bg-background/80 backdrop-blur-sm z-60 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <Card
        className="w-full max-w-sm shadow-2xl border-border"
        onClick={(e) => e.stopPropagation()}
      >
        <CardHeader className="flex flex-row items-center justify-between pb-2 border-b border-border">
          <CardTitle className="text-lg">Port Settings</CardTitle>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="h-8 w-8 -mr-2"
          >
            <X className="w-4 h-4" />
          </Button>
        </CardHeader>

        <CardContent className="pt-6 space-y-6">
          {/* Presets Section */}
          <div className="p-3 bg-muted/50 rounded-lg border border-border/50 space-y-3">
            <Label className="text-xs font-bold text-muted-foreground uppercase flex items-center gap-2">
              <Download className="w-3 h-3" /> Presets
            </Label>
            <div className="flex gap-2">
              <div className="flex-1">
                <SelectDropdown
                  options={presetOptions}
                  value={selectedPresetId}
                  onChange={handlePresetChange}
                  placeholder="Load a preset..."
                />
              </div>
              <Button
                size="icon"
                variant="outline"
                onClick={() => {
                  const name = prompt(
                    "Preset Name:",
                    `Config ${config.baudRate}`,
                  );
                  if (name) onSavePreset(name, config);
                }}
                title="Save current settings as preset"
              >
                <Check className="w-4 h-4" />
              </Button>
              <Button
                size="icon"
                variant="outline"
                className="hover:bg-destructive/10 hover:text-destructive hover:border-destructive/30"
                onClick={() => {
                  if (selectedPresetId && confirm("Delete this preset?")) {
                    onDeletePreset(selectedPresetId);
                    setSelectedPresetId("");
                  }
                }}
                title="Delete selected preset"
                disabled={!selectedPresetId}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </div>

          <div className="grid gap-4">
            <div className="space-y-2">
              <Label>Baud Rate</Label>
              <SelectDropdown
                options={BAUD_RATE_OPTIONS}
                value={config.baudRate}
                onChange={(value) => handleChange("baudRate", value)}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Data Bits</Label>
                <SelectDropdown
                  options={DATA_BITS_OPTIONS}
                  value={config.dataBits}
                  onChange={(value) => handleChange("dataBits", value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Stop Bits</Label>
                <SelectDropdown
                  options={STOP_BITS_OPTIONS}
                  value={config.stopBits}
                  onChange={(value) => handleChange("stopBits", value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Parity</Label>
              <SelectDropdown
                options={PARITY_OPTIONS}
                value={config.parity}
                onChange={(value) =>
                  handleChange("parity", value as SerialConfig["parity"])
                }
              />
            </div>

            <div className="space-y-2">
              <Label>Flow Control</Label>
              <SelectDropdown
                options={FLOW_CONTROL_OPTIONS}
                value={config.flowControl}
                onChange={(value) =>
                  handleChange(
                    "flowControl",
                    value as SerialConfig["flowControl"],
                  )
                }
              />
            </div>
          </div>
        </CardContent>

        <CardFooter className="flex justify-end bg-muted/20 border-t border-border p-4">
          <Button onClick={onClose} className="w-24">
            Done
          </Button>
        </CardFooter>
      </Card>
    </div>,
    document.body,
  );
};

export default SettingsModal;
