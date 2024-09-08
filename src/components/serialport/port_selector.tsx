import useSerialportStatus from "@/hooks/store/usePortStatus";
import { Autocomplete, AutocompleteItem } from "@nextui-org/react";
import { SerialportConfig } from "@/types/serialport/serialport_config";
import { convertPortTypeToString } from "@/types/serialport/serialport_status";

type PortSelectorProps = {
  setSelectedPortName: (port: string) => void;
  serialPortConfig: SerialportConfig;
};

const PortSelector = ({
  setSelectedPortName,
  serialPortConfig,
}: PortSelectorProps) => {
  const selectedPortName = serialPortConfig.port_name;

  const { data: portStatus, getPortOpened } = useSerialportStatus();

  return (
    <Autocomplete
      allowsCustomValue={false}
      label={
        <p className="text-medium font-bold text-content1-foreground">
          Port to Open
        </p>
      }
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
  );
};

export default PortSelector;
