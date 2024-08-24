import { Accordion, AccordionItem, Chip, Divider } from "@nextui-org/react";
import { useEffect } from "react";
import useAvaliablePorts from "@/hooks/use_avaliable_ports";
import PortSelector from "./port_selector";
import { LucideSettings } from "lucide-react";
import usePortStatus from "@/hooks/store/usePortStatus";
import SerialPortMiscIndicators from "./port_misc_state_indicator";
import PortConfigGroups from "./port_config_groups";
import { SerialPortConfig } from "@/types/serialport/serialport_config";

const SerialPortOpener = ({
  serialConfig,
  setSerialConfig,
}: {
  serialConfig: SerialPortConfig;
  setSerialConfig: React.Dispatch<React.SetStateAction<SerialPortConfig>>;
}) => {
  const { debouncedReloadPortList: reloadPortList } = useAvaliablePorts();
  useEffect(reloadPortList, []);

  const portName = serialConfig.port_name;
  const { getPortStatusByName, getPortOpened } = usePortStatus();
  const portDeviceStatus = getPortStatusByName({ port_name: portName });
  const portOpened = getPortOpened({ port_name: serialConfig.port_name });

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
              <Chip className="font-mono text-sm" size="sm" variant="flat" color={portOpened?"success" : "default"}>{portOpened ? "Opened" : "Closed"}</Chip>
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
                setSerialConfig((prev) => ({
                  ...prev,
                  port_name: portName,
                } satisfies SerialPortConfig));
              }}
              refreshAvaliablePorts={reloadPortList}
              serialPortConfig={serialConfig}
            />
          </div>
        }
      >
        <div className="flex flex-row space-x-2 w-full justify-stretch">
          <PortConfigGroups
            serialConfig={serialConfig}
            setSerialConfig={setSerialConfig}
            portDeviceStatus={portDeviceStatus}
          />
          <Divider orientation="vertical" className="border-x-5 w-1 border-neutral-800 my-2" />
          <SerialPortMiscIndicators value={portDeviceStatus?.port_status} />
        </div>
      </AccordionItem>
    </Accordion>
  );
};

export default SerialPortOpener;
