import { useToast } from "@/components/shadcn/use-toast";
import { useRequestState } from "./useRequestState";
import { SerialportConfig } from "@/types/serialport/serialport_config";
import { emitToRustBus } from "@/bridge/call_rust";

const useClosePort = () => {
  const { toastError, toastSuccess } = useToast();
  const { loading: portClosing, runRequest: closePort } = useRequestState({
    action: (config: SerialportConfig) =>
      emitToRustBus("close_port", { port_name: config.port_name }),
    onError: (err, payload) =>
      toastError({
        description: `Closing port ${payload?.[0].port_name} failed: ${err?.msg}`,
      }),
    onSuccess: (_, payload) =>
      toastSuccess({
        description: `${payload?.[0].port_name} closed`,
      }),
  });
  return { portClosing, closePort };
};

export default useClosePort;
