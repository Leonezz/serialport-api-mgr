import { emitToRustBus } from "@/bridge/call_rust";
import { useRequestState } from "./useRequestState";
import { SerialportConfig } from "@/types/serialport/serialport_config";
import { useToast } from "@/components/shadcn/use-toast";
import { useSerialportLog } from "../store/useSerialportLogStore";
import { DateTime } from "luxon";

const useOpenPort = () => {
  const { toastError, toastSuccess } = useToast();
  const { appendLogItem } = useSerialportLog();
  const { loading: portOpening, runRequest: openPort } = useRequestState({
    action: (config: SerialportConfig) => {
      appendLogItem({
        type: "open_port",
        time: DateTime.now(),
        port_name: config.port_name,
      });
      return emitToRustBus("open_port", config);
    },
    onError: (err, payload) => {
      appendLogItem({
        type: "open_failed",
        time: DateTime.now(),
        port_name: payload?.[0].port_name || "Unknown",
        error_msg: err?.msg || "Unknown error",
      });
      toastError({
        description: `Opening port ${payload?.[0].port_name} failed: ${err?.msg}`,
      });
    },
    onSuccess: (_, payload) => {
      appendLogItem({
        type: "opened",
        time: DateTime.now(),
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
