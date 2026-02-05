import React from "react";
import { createPortal } from "react-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
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
import { SerialConfigSchema, NetworkConfigSchema } from "../lib/schemas";

const PresetFormSchema = z.object({
  name: z.string().min(1, "Preset name is required"),
  type: z.enum(["SERIAL", "NETWORK"]),
  config: SerialConfigSchema,
  network: NetworkConfigSchema,
});

type PresetFormData = z.infer<typeof PresetFormSchema>;

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
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<PresetFormData>({
    resolver: zodResolver(PresetFormSchema),
    defaultValues: {
      name: initialData.name,
      type: initialData.type,
      config: initialData.config,
      network: initialData.network || { host: "localhost", port: 8080 },
    },
  });

  const type = watch("type");
  const localConfig = watch("config");
  const localNetwork = watch("network");

  const loadActiveSettings = () => {
    setValue("type", currentConnectionType);
    if (currentConnectionType === "SERIAL") {
      setValue("config", { ...currentConfig });
    } else {
      setValue("network", { ...currentNetworkConfig });
    }
  };

  const onSubmit = (data: PresetFormData) => {
    onSave({
      ...initialData,
      name: data.name,
      type: data.type,
      config: data.config,
      network: data.type === "NETWORK" ? data.network : undefined,
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
          onSubmit={handleSubmit(onSubmit)}
          className="flex-1 overflow-hidden flex flex-col"
        >
          <CardContent className="pt-6 space-y-5 overflow-y-auto">
            <div className="space-y-2">
              <Label htmlFor="presetName">Preset Name</Label>
              <Input id="presetName" {...register("name")} autoFocus />
              {errors.name && (
                <p className="text-xs text-destructive">
                  {errors.name.message}
                </p>
              )}
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
                onChange={(v) => setValue("type", v as ConnectionType)}
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
                    onChange={(value) => setValue("config.baudRate", value)}
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
                    onChange={(value) => setValue("config.dataBits", value)}
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
                    onChange={(value) => setValue("config.parity", value)}
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
                    onChange={(value) => setValue("config.stopBits", value)}
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
                    onChange={(value) => setValue("config.lineEnding", value)}
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
                    onChange={(value) => setValue("config.flowControl", value)}
                    size="sm"
                  />
                </div>
              </div>
            ) : (
              <div className="space-y-3 border p-3 rounded-md bg-muted/10">
                <div className="space-y-1.5">
                  <Label className="text-xs">Host / IP</Label>
                  <Input
                    {...register("network.host")}
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
                      setValue("network.port", parseInt(e.target.value))
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
