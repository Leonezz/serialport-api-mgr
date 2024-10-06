import { useSerialportStatus } from "@/hooks/store/usePortStatus";
import { Autocomplete, AutocompleteItem } from "@nextui-org/react";
import { convertPortTypeToString } from "@/types/serialport/serialport_status";

type PortSelectorProps = {
  setSelectedPortName: (port: string) => void;
  selectedName: string;
  readonly?: boolean;
  width: "w-full" | "w-fit" | "w-min" | "w-max";
  height: "h-full" | "h-fit" | "h-min" | "h-max";
};

const PortSelector = ({
  setSelectedPortName,
  selectedName,
  readonly,
  width,
  height,
}: PortSelectorProps) => {
  const { data: portStatus, getPortOpened } = useSerialportStatus();

  return (
    <Autocomplete
      allowsCustomValue={false}
      label={
        <p className="text-medium font-semibold text-content1-foreground">
          Port to Open
        </p>
      }
      placeholder="Select a port by name"
      size="sm"
      className={`${width} ${height} md:min-w-24 hover:w-full`}
      value={selectedName}
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
      readOnly={readonly}
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
