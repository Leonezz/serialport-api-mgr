import {
  convertPortTypeToString,
  emitToRustBus,
  OpenSerialPortReq,
  SerialPortInfo,
} from "@/bridge/call_rust";
import usePortStatus from "@/hooks/store/usePortStatus";
import { Autocomplete, AutocompleteItem, Button } from "@nextui-org/react";
import { useToast } from "../shadcn/use-toast";
import useRequestState from "@/hooks/commands.ts/useRequestState";

type PortSelectorProps = {
  selectedPort: SerialPortInfo;
  setSelectedPort: (port: SerialPortInfo) => void;
  refreshAvaliablePorts: () => void;
  serialPortConfig: OpenSerialPortReq;
};

const PortSelector = ({
  selectedPort,
  setSelectedPort,
  refreshAvaliablePorts,
  serialPortConfig,
}: PortSelectorProps) => {
  const { loading: portOpening, runRequest: openPort } = useRequestState({
    action: () =>
      emitToRustBus("open_port", {
        ...serialPortConfig,
        portName: selectedPort.port_name,
      }),
    onError: (err) =>
      toastError({
        description: `Opening port ${selectedPort.port_name} failed: ${err?.msg}`,
      }),
    onSuccess: () =>
      toastSuccess({
        description: `${selectedPort.port_name} opened`,
      }),
  });

  const { toastError, toastSuccess } = useToast();
  const { loading: portClosing, runRequest: closePort } = useRequestState({
    action: () =>
      emitToRustBus("close_port", { portName: selectedPort.port_name }),
    onError: (err) =>
      toastError({
        description: `Closing port ${selectedPort.port_name} failed: ${err?.msg}`,
      }),
    onSuccess: () =>
      toastSuccess({
        description: `${selectedPort.port_name} closed`,
      }),
  });

  const { data: portStatus, getOpenedPorts } = usePortStatus();
  const openedPorts = getOpenedPorts();

  const isPortOpened = openedPorts.includes(selectedPort.port_name);

  return (
    <div className="flex flex-row sm:flex-nowrap flex-wrap gap-2 items-center z-50">
      <Autocomplete
        allowsCustomValue={false}
        label={<p className="text-md min-w-max">Port to Open</p>}
        placeholder="Select a port by name"
        size="sm"
        className="min-w-60"
        value={selectedPort?.port_name}
        onSelectionChange={(key) => {
          console.log(key);
          console.log(portStatus);
          if (!key) return;
          const port = portStatus.get(key.toString().split("-")[0]);
          if (!port) {
            return;
          }
          setSelectedPort(port.info);
        }}
        items={portStatus}
      >
        {([key, info]) => (
          <AutocompleteItem key={key} textValue={key}>
            <div>
              <p className="text-md">
                {key}
                {openedPorts.includes(key) ? "  (Opened)" : ""}
              </p>
              <p className="text-sm">
                {convertPortTypeToString(info.info.port_type)}
              </p>
            </div>
          </AutocompleteItem>
        )}
      </Autocomplete>
      <Button
        color="primary"
        onClick={refreshAvaliablePorts}
        isDisabled={portOpening}
      >
        Refresh
      </Button>
      <Button
        color="danger"
        onClick={isPortOpened ? closePort : openPort}
        isLoading={portOpening || portClosing}
        isDisabled={selectedPort.port_name.length === 0}
      >
        {isPortOpened ? "Close" : "Open"}
      </Button>
    </div>
  );
};

export default PortSelector;
