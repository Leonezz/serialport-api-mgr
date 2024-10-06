import { Accordion, AccordionItem, Button, Chip } from "@nextui-org/react";
import PortSelector from "./port_selector";
import { LucideSettings } from "lucide-react";
import {
  SerialPortMiscIndicators,
  SerialPortTypeCard,
} from "./port_misc_state_indicator";
import { PortConfigGroups } from "./port_config_groups";
import { SerialportConfig } from "@/types/serialport/serialport_config";
import { useSerialportStatus } from "@/hooks/store/usePortStatus";
import { useState } from "react";
import RefreshAvaliablePortsBtn from "./refresh_avaliable_ports_btn";
import OpenPortBtn from "./open_port_btn";
import { useNamedSerialortConfigStore } from "@/hooks/store/useNamedSerialPortConfig";
import { useToast } from "../shadcn/use-toast";
import { useUpdateEffect } from "ahooks";
import { omit } from "es-toolkit";
import { SerialportPresetConfigSelector } from "./config/config_selector";

const SerialPortOpener = ({
  serialPortConfig,
  presetConfigName,
  setSerialPortConfig,
  readonly,
}: {
  serialPortConfig: SerialportConfig;
  presetConfigName?: string;
  setSerialPortConfig: (v: Partial<SerialportConfig>) => void;
  readonly?: boolean;
}) => {
  const { getPortStatusByName } = useSerialportStatus();
  const serialPortDeviceStatus = getPortStatusByName({
    port_name: serialPortConfig.port_name,
  });
  const portOpened =
    serialPortDeviceStatus !== undefined &&
    serialPortDeviceStatus.port_status !== "Closed";
  const [newName, setNewName] = useState(presetConfigName || "");
  useUpdateEffect(() => {
    if (presetConfigName) {
      setNewName(presetConfigName);
    }
  }, [presetConfigName]);

  const selectedPortStatus = getPortStatusByName({
    port_name: serialPortConfig.port_name,
  });

  const { toastError } = useToast();
  const {
    add: addNamedSerialportConfig,
    update: updateNamedSerialportConfig,
    getByName,
  } = useNamedSerialortConfigStore();

  const namedConfig = getByName({ name: newName });
  const nameExisted = namedConfig !== undefined;
  useUpdateEffect(() => {
    if (namedConfig !== undefined) {
      setSerialPortConfig({
        ...omit(namedConfig.config, ["port_name"]),
        port_name: serialPortConfig.port_name,
      });
    }
  }, [namedConfig?.config]);

  const saveNamedSerialportConfig = () => {
    if (newName.length === 0) {
      return toastError({
        description: "preset named needed",
      });
    }
    if (!nameExisted) {
      addNamedSerialportConfig({
        basicInfo: { name: newName, comment: "" },
        config: serialPortConfig,
      });
    } else {
      updateNamedSerialportConfig({
        id: namedConfig.id,
        basicInfo: { name: newName },
        config: serialPortConfig,
      });
    }
  };

  return (
    <Accordion
      variant="splitted"
      isCompact
      fullWidth
      className="sticky top-0 w-full"
    >
      <AccordionItem
        key={"header"}
        startContent={
          <div className="flex flex-row gap-2 items-center">
            <LucideSettings size={40} className="stroke-primary" />
            <div className="flex flex-col">
              <p className="text-lg font-bold text-start">PORT</p>
              <Chip
                className="font-mono text-sm"
                size="sm"
                variant="flat"
                color={portOpened ? "success" : "default"}
              >
                {portOpened ? "Opened" : "Closed"}
              </Chip>
            </div>
          </div>
        }
        title={
          <div className="flex justify-end flex-wrap">
            <div className="flex flex-row sm:overflow-x-scroll scrollbar-hide sm:flex-nowrap flex-wrap gap-2 items-center z-50">
              <div className="flex gap-2 sm:overflow-x-scroll flex-row-reverse scrollbar-hide">
                <div className="flex flex-row gap-2 items-center">
                  {portOpened ? (
                    <div className="flex flex-col gap-1 text-xs font-mono">
                      <p color="success" className="w-max text-primary">
                        RX: {selectedPortStatus?.bytes_read || 0} bytes
                      </p>
                      <p color="warning" className="w-max text-success">
                        TX: {selectedPortStatus?.bytes_write || 0} bytes
                      </p>
                    </div>
                  ) : null}

                  <PortSelector
                    setSelectedPortName={(portName) => {
                      setSerialPortConfig({ port_name: portName });
                    }}
                    selectedName={serialPortConfig.port_name}
                    readonly={portOpened}
                    width="w-fit"
                    height="h-full"
                  />
                </div>
                <SerialportPresetConfigSelector
                  selectedName={newName}
                  setSelectedName={setNewName}
                  readonly={readonly || portOpened}
                  width="w-fit"
                  height="h-full"
                />
              </div>
              <RefreshAvaliablePortsBtn />
              <OpenPortBtn serialportConfig={serialPortConfig} />
            </div>
          </div>
        }
        textValue="header"
      >
        <div className="flex flex-col gap-4 space-x-2 w-full ">
          <PortConfigGroups
            value={serialPortConfig}
            onValueChange={(value) => setSerialPortConfig({ ...value })}
            portDeviceStatus={serialPortDeviceStatus}
          >
            <div className="pt-2">
              <SerialPortMiscIndicators
                status={serialPortDeviceStatus?.port_status}
              />
              <div className="flex flex-row items-center justify-between">
                <SerialPortTypeCard
                  type={serialPortDeviceStatus?.port_type || "Unknown"}
                />
                <Button
                  variant="light"
                  color="primary"
                  onClick={saveNamedSerialportConfig}
                  isDisabled={newName.length === 0}
                >
                  {nameExisted ? "Update" : "Save as"} Preset
                </Button>
              </div>
            </div>
          </PortConfigGroups>
        </div>
      </AccordionItem>
    </Accordion>
  );
};

export default SerialPortOpener;
