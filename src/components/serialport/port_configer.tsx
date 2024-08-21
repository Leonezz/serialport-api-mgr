import { Accordion, AccordionItem } from "@nextui-org/react";
import { useEffect, useState } from "react";
import {
  emitToRustBus,
  OpenSerialPortReq,
  SerialPortInfo,
} from "../../bridge/call_rust";
import useAvaliablePorts from "@/hooks/use_avaliable_ports";
import PortSelector from "./port_selector";
import BaudRateInput from "./baud_rate_input";
import FlowControlRadio from "./flow_control_radio";
import DataBitsRadio from "./data_bits_radio";
import ParityRadio from "./parity_radio";
import StopBitsRadio from "./stop_bits_radio";
import { LucideSettings } from "lucide-react";

const SerialPortOpener = ({
  serialConfig,
  setSerialConfig,
  portOpened,
}: {
  portOpened: boolean;
  serialConfig: OpenSerialPortReq;
  setSerialConfig: React.Dispatch<React.SetStateAction<OpenSerialPortReq>>;
}) => {
  const { debouncedReloadPortList: reloadPortList } = useAvaliablePorts();

  const [selectedPort, setSelectedPort] = useState<SerialPortInfo>({
    port_name: "",
    port_type: "Unknown",
  });
  useEffect(reloadPortList, []);

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
              <p className="text-sm text-start text-neutral-400">opened</p>
            </div>
          </div>
        }
        title={
          <div className="flex justify-end flex-wrap">
            <PortSelector
              selectedPort={selectedPort}
              setSelectedPort={(port) => {
                console.log(port);
                setSelectedPort(port);
                setSerialConfig((prev) => ({
                  ...prev,
                  portName: port.port_name,
                }));
              }}
              refreshAvaliablePorts={reloadPortList}
              serialPortConfig={serialConfig}
            />
          </div>
        }
      >
        <div className="gap-2 pt-2">
          <BaudRateInput
            readonly={portOpened}
            value={serialConfig.baudRate}
            setValue={(v) =>
              setSerialConfig((prev) => ({
                ...prev,
                baudRate: v,
              }))
            }
          />
          <DataBitsRadio
            readonly={portOpened}
            value={serialConfig.dataBits}
            setValue={(v) =>
              setSerialConfig((prev) => ({
                ...prev,
                dataBits: v,
              }))
            }
          />
          <FlowControlRadio
            readonly={portOpened}
            value={serialConfig.flowControl}
            setValue={(v) =>
              setSerialConfig((prev) => ({
                ...prev,
                flowControl: v,
              }))
            }
          />
          <ParityRadio
            readonly={portOpened}
            value={serialConfig.parity}
            setValue={(v) =>
              setSerialConfig((prev) => ({
                ...prev,
                parity: v,
              }))
            }
          />
          <StopBitsRadio
            readonly={portOpened}
            value={serialConfig.stopBits}
            setValue={(v) =>
              setSerialConfig((prev) => ({
                ...prev,
                stopBits: v,
              }))
            }
          />
        </div>
      </AccordionItem>
    </Accordion>
  );
};

export default SerialPortOpener;
