import { emitToRustBus } from "@/bridge/call_rust";
import { useRequestState } from "./useRequestState";
import { SerialportConfig } from "@/types/serialport/serialport_config";
import { useToast } from "@/components/shadcn/use-toast";
import { useSerialportLog } from "../store/useSerialportLogStore";

const useOpenPort = () => {
  const { toastError, toastSuccess } = useToast();
  const { appendLogItem } = useSerialportLog();
  const { loading: portOpening, runRequest: openPort } = useRequestState({
    action: (config: SerialportConfig) => {
      appendLogItem({
        type: "open_port",
        time: new Date(),
        port_name: config.port_name,
      });
      return emitToRustBus("open_port", config);
    },
    onError: (err, payload) => {
      appendLogItem({
        type: "port_open_failed",
        time: new Date(),
        port_name: payload?.[0].port_name || "Unknown",
      });
      toastError({
        description: `Opening port ${payload?.[0].port_name} failed: ${err?.msg}`,
      });
    },
    onSuccess: (_, payload) => {
      appendLogItem({
        type: "port_opened",
        time: new Date(),
        port_name: payload?.[0].port_name || "Unknown",
      });
      toastSuccess({
        description: `${payload?.[0].port_name} opened`,
      });
    },
  });
  return { portOpening, openPort };
};

export default useOpenPort;
