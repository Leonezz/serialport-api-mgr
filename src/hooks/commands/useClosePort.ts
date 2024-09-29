import { useToast } from "@/components/shadcn/use-toast";
import { useRequestState } from "./useRequestState";
import { SerialportConfig } from "@/types/serialport/serialport_config";
import { emitToRustBus } from "@/bridge/call_rust";
import { useSerialportLog } from "../store/useSerialportLogStore";

const useClosePort = () => {
  const { toastError, toastSuccess } = useToast();
  const { appendLogItem } = useSerialportLog();
  const { loading: portClosing, runRequest: closePort } = useRequestState({
    action: (config: SerialportConfig) => {
      appendLogItem({
        type: "close_port",
        port_name: config.port_name,
        time: new Date(),
      });
      return emitToRustBus("close_port", { port_name: config.port_name });
    },
    onError: (err, payload) => {
      appendLogItem({
        type: "port_close_failed",
        time: new Date(),
        port_name: payload?.[0].port_name || "Unknown",
      });
      toastError({
        description: `Closing port ${payload?.[0].port_name} failed: ${err?.msg}`,
      });
    },
    onSuccess: (_, payload) => {
      appendLogItem({
        type: "port_closed",
        time: new Date(),
        port_name: payload?.[0].port_name || "Unknown",
      });
      toastSuccess({
        description: `${payload?.[0].port_name} closed`,
      });
    },
  });
  return { portClosing, closePort };
};

export default useClosePort;
