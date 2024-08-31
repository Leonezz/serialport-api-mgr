import useSerialportStatus from "@/hooks/store/usePortStatus";
import { Autocomplete, AutocompleteItem } from "@nextui-org/react";
import { SerialportConfig } from "@/types/serialport/serialport_config";
import { convertPortTypeToString } from "@/types/serialport/serialport_status";
import RefreshAvaliablePortsBtn from "./refresh_avaliable_ports_btn";
import OpenPortBtn from "./open_port_btn";

type PortSelectorProps = {
  setSelectedPortName: (port: string) => void;
  serialPortConfig: SerialportConfig;
};

const PortSelector = ({
  setSelectedPortName,
  serialPortConfig,
}: PortSelectorProps) => {
  const selectedPortName = serialPortConfig.port_name;

  const {
    data: portStatus,
    getPortOpened,
    getPortStatusByName,
  } = useSerialportStatus();
  const portOpened = getPortOpened({ port_name: selectedPortName });
  const selectedPortStatus = getPortStatusByName({
    port_name: selectedPortName,
  });

  return (
    <div className="flex flex-row sm:flex-nowrap flex-wrap gap-2 items-center z-50">
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
      <Autocomplete
        allowsCustomValue={false}
        label={<p className="text-md min-w-max">Port to Open</p>}
        placeholder="Select a port by name"
        size="sm"
        className="min-w-60"
        value={selectedPortName}
        onValueChange={(value) => {
          const port = portStatus.get(value);
          if (!port) {
            return;
          }
          setSelectedPortName(value);
        }}
        onSelectionChange={(key) => {
          if (!key) return;
          const port = portStatus.get(key.toString());
          if (!port) {
            return;
          }
          setSelectedPortName(key.toString());
        }}
        items={portStatus}
      >
        {([key, info]) => (
          <AutocompleteItem key={key} textValue={key}>
            <div>
              <p className="text-md">
                {key}
                {getPortOpened({ port_name: key }) ? "  (Opened)" : ""}
              </p>
              <p className="text-sm">
                {convertPortTypeToString(info.info.port_type)}
              </p>
            </div>
          </AutocompleteItem>
        )}
      </Autocomplete>
      <RefreshAvaliablePortsBtn />
      <OpenPortBtn serialportConfig={serialPortConfig} />
    </div>
  );
};

export default PortSelector;
