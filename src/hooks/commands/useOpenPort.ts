import { emitToRustBus } from "@/bridge/call_rust";
import useRequestState from "./useRequestState";
import { SerialportConfig } from "@/types/serialport/serialport_config";
import { useToast } from "@/components/shadcn/use-toast";

const useOpenPort = () => {
  const { toastError, toastSuccess } = useToast();
  const { loading: portOpening, runRequest: openPort } = useRequestState({
    action: (config: SerialportConfig) => emitToRustBus("open_port", config),
    onError: (err, payload) =>
      toastError({
        description: `Opening port ${payload?.[0].port_name} failed: ${err?.msg}`,
      }),
    onSuccess: (_, payload) =>
      toastSuccess({
        description: `${payload?.[0].port_name} opened`,
      }),
  });
  return { portOpening, openPort };
};

export default useOpenPort;
