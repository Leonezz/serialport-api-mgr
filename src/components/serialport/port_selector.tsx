import {
  emitToRustBus,
  OpenSerialPortReq,
} from "@/bridge/call_rust";
import usePortStatus from "@/hooks/store/usePortStatus";
import { Autocomplete, AutocompleteItem, Button } from "@nextui-org/react";
import { useToast } from "../shadcn/use-toast";
import useRequestState from "@/hooks/commands.ts/useRequestState";
import { convertPortTypeToString } from "@/bridge/types";

type PortSelectorProps = {
  setSelectedPortName: (port: string) => void;
  refreshAvaliablePorts: () => void;
  serialPortConfig: OpenSerialPortReq;
};

const PortSelector = ({
  setSelectedPortName,
  refreshAvaliablePorts,
  serialPortConfig,
}: PortSelectorProps) => {
  const selectedPortName = serialPortConfig.portName;
  const { loading: portOpening, runRequest: openPort } = useRequestState({
    action: () =>
      emitToRustBus("open_port", {
        ...serialPortConfig,
        portName: selectedPortName,
      }),
    onError: (err) =>
      toastError({
        description: `Opening port ${selectedPortName} failed: ${err?.msg}`,
      }),
    onSuccess: () =>
      toastSuccess({
        description: `${selectedPortName} opened`,
      }),
  });

  const { toastError, toastSuccess } = useToast();
  const { loading: portClosing, runRequest: closePort } = useRequestState({
    action: () =>
      emitToRustBus("close_port", { portName: selectedPortName }),
    onError: (err) =>
      toastError({
        description: `Closing port ${selectedPortName} failed: ${err?.msg}`,
      }),
    onSuccess: () =>
      toastSuccess({
        description: `${selectedPortName} closed`,
      }),
  });

  const { data: portStatus, getPortOpened, getPortStatusByName } = usePortStatus();
  const portOpened = getPortOpened({port_name: selectedPortName});
  const selectedPortStatus = getPortStatusByName({port_name: selectedPortName});

  return (
    <div className="flex flex-row sm:flex-nowrap flex-wrap gap-2 items-center z-50">
      {portOpened ? <div className="flex flex-col gap-1 text-xs font-mono">
        <p color="success" className="w-max text-primary">RX: {selectedPortStatus?.bytes_read || 0} bytes</p>
        <p color="warning" className="w-max text-success">TX: {selectedPortStatus?.bytes_write || 0} bytes</p>
      </div> : null}
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
                {getPortOpened({port_name: key}) ? "  (Opened)" : ""}
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
        onClick={portOpened ? closePort : openPort}
        isLoading={portOpening || portClosing}
        isDisabled={selectedPortName.length === 0}
      >
        {portOpened ? "Close" : "Open"}
      </Button>
    </div>
  );
};

export default PortSelector;
