import { Accordion, AccordionItem, Chip, Divider } from "@nextui-org/react";
import { useEffect } from "react";
import useAvaliablePorts from "@/hooks/use_avaliable_ports";
import PortSelector from "./port_selector";
import { LucideSettings } from "lucide-react";
import {
  SerialPortMiscIndicators,
  SerialPortTypeCard,
} from "./port_misc_state_indicator";
import PortConfigGroups from "./port_config_groups";
import { SerialPortConfig } from "@/types/serialport/serialport_config";
import usePortStatus from "@/hooks/store/usePortStatus";

const SerialPortOpener = ({
  serialPortConfig,
  setSerialPortConfig,
}: {
  serialPortConfig: SerialPortConfig;
  setSerialPortConfig: React.Dispatch<React.SetStateAction<SerialPortConfig>>;
}) => {
  const { debouncedReloadPortList: reloadPortList } = useAvaliablePorts();
  useEffect(reloadPortList, []);

  const { getPortStatusByName } = usePortStatus();
  const serialPortDeviceStatus = getPortStatusByName({
    port_name: serialPortConfig.port_name,
  });
  const portOpened =
    serialPortDeviceStatus !== undefined &&
    serialPortDeviceStatus.port_status !== "Closed";
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
              <p className="text-lg font-bold text-start">Config Port</p>
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
            <PortSelector
              setSelectedPortName={(portName) => {
                if (portOpened) {
                  return;
                }
                setSerialPortConfig(
                  (prev) =>
                    ({
                      ...prev,
                      port_name: portName,
                    } satisfies SerialPortConfig)
                );
              }}
              refreshAvaliablePorts={reloadPortList}
              serialPortConfig={serialPortConfig}
            />
          </div>
        }
      >
        <div className="flex flex-row space-x-2 w-full justify-stretch">
          <PortConfigGroups
            serialConfig={serialPortConfig}
            setSerialConfig={setSerialPortConfig}
            portDeviceStatus={serialPortDeviceStatus}
          />
          <Divider
            orientation="vertical"
            className="border-x-5 w-1 border-neutral-800 my-2"
          />
          <div className="flex flex-row justify-evenly gap-5">
            <SerialPortTypeCard type={serialPortDeviceStatus?.port_type || "Unknown"} />
            <SerialPortMiscIndicators
              status={serialPortDeviceStatus?.port_status}
            />
          </div>
        </div>
      </AccordionItem>
    </Accordion>
  );
};

export default SerialPortOpener;
