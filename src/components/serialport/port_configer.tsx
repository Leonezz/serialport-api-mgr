import { Accordion, AccordionItem, Chip, Divider } from "@nextui-org/react";
import PortSelector from "./port_selector";
import { LucideSettings } from "lucide-react";
import {
  SerialPortMiscIndicators,
  SerialPortTypeCard,
} from "./port_misc_state_indicator";
import PortConfigGroups from "./port_config_groups";
import { SerialportConfig } from "@/types/serialport/serialport_config";
import useSerialportStatus from "@/hooks/store/usePortStatus";
import singleKeySetter from "@/util/util";

const SerialPortOpener = ({
  serialPortConfig,
  setSerialPortConfig,
}: {
  serialPortConfig: SerialportConfig;
  setSerialPortConfig: React.Dispatch<React.SetStateAction<SerialportConfig>>;
}) => {
  const { getPortStatusByName } = useSerialportStatus();
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
                singleKeySetter(setSerialPortConfig, "port_name")(portName);
              }}
              serialPortConfig={serialPortConfig}
            />
          </div>
        }
        textValue="header"
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
            <SerialPortTypeCard
              type={serialPortDeviceStatus?.port_type || "Unknown"}
            />
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
