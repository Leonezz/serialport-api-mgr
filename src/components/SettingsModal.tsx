import React from "react";
import { SerialConfig, SerialPreset } from "../types";
import { X, Save, Trash2, Download } from "lucide-react";
import { Button } from "./ui/Button";
import { Select } from "./ui/Select";
import { Label } from "./ui/Label";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter,
} from "./ui/Card";

interface Props {
  config: SerialConfig;
  setConfig: React.Dispatch<React.SetStateAction<SerialConfig>>;
  presets: SerialPreset[];
  onSavePreset: (name: string, config: SerialConfig) => void;
  onDeletePreset: (id: string) => void;
  onClose: () => void;
}

const SettingsModal: React.FC<Props> = ({
  config,
  setConfig,
  presets,
  onSavePreset,
  onDeletePreset,
  onClose,
}) => {
  const handleChange = (
    key: keyof SerialConfig,
    value: SerialConfig[keyof SerialConfig],
  ) => {
    setConfig((prev) => ({ ...prev, [key]: value }));
  };

  const handlePresetChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const presetId = e.target.value;
    if (!presetId) return;
    const preset = presets.find((p) => p.id === presetId);
    if (preset) {
      setConfig({ ...preset.config });
    }
  };

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-sm shadow-2xl border-border">
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
              <Select
                className="flex-1 bg-background"
                onChange={handlePresetChange}
                defaultValue=""
              >
                <option value="" disabled>
                  Load a preset...
                </option>
                {presets.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </Select>
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
                <Save className="w-4 h-4" />
              </Button>
              <Button
                size="icon"
                variant="outline"
                className="hover:bg-destructive/10 hover:text-destructive hover:border-destructive/30"
                onClick={() => {
                  const select = document.querySelector("select");
                  const presetId = select ? select.value : "";
                  if (presetId && confirm("Delete this preset?")) {
                    onDeletePreset(presetId);
                  }
                }}
                title="Delete selected preset"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </div>

          <div className="grid gap-4">
            <div className="space-y-2">
              <Label>Baud Rate</Label>
              <Select
                value={config.baudRate}
                onChange={(e) =>
                  handleChange("baudRate", parseInt(e.target.value))
                }
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

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Data Bits</Label>
                <Select
                  value={config.dataBits}
                  onChange={(e) =>
                    handleChange("dataBits", parseInt(e.target.value))
                  }
                >
                  <option value={7}>7</option>
                  <option value={8}>8</option>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Stop Bits</Label>
                <Select
                  value={config.stopBits}
                  onChange={(e) =>
                    handleChange("stopBits", parseInt(e.target.value))
                  }
                >
                  <option value={1}>1</option>
                  <option value={2}>2</option>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Parity</Label>
              <Select
                value={config.parity}
                onChange={(e) =>
                  handleChange(
                    "parity",
                    e.target.value as unknown as SerialConfig["parity"],
                  )
                }
              >
                <option value="none">None</option>
                <option value="even">Even</option>
                <option value="odd">Odd</option>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Flow Control</Label>
              <Select
                value={config.flowControl}
                onChange={(e) =>
                  handleChange(
                    "flowControl",
                    e.target.value as unknown as SerialConfig["flowControl"],
                  )
                }
              >
                <option value="none">None</option>
                <option value="hardware">Hardware (RTS/CTS)</option>
              </Select>
            </div>
          </div>
        </CardContent>

        <CardFooter className="flex justify-end bg-muted/20 border-t border-border p-4">
          <Button onClick={onClose} className="w-24">
            Done
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};

export default SettingsModal;
