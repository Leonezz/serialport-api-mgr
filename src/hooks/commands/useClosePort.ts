import { useToast } from "@/components/shadcn/use-toast";
import { useRequestState } from "./useRequestState";
import { emitToRustBus } from "@/bridge/call_rust";
import { useSerialportLog } from "../store/useSerialportLogStore";
import { DateTime } from "luxon";

const useClosePort = () => {
  const { toastError, toastSuccess } = useToast();
  const { appendLogItem } = useSerialportLog();
  const { loading: portClosing, runRequest: closePort } = useRequestState({
    action: ({ portName }: { portName: string }) => {
      appendLogItem({
        type: "close",
        port_name: portName,
        time: DateTime.now(),
      });
      return emitToRustBus("close_port", { port_name: portName });
    },
    onError: (err, payload) => {
      appendLogItem({
        type: "close_failed",
        time: DateTime.now(),
        port_name: payload?.[0].portName || "Unknown",
        error_msg: err?.msg || "Unknown error",
      });
      toastError({
        description: `Closing port ${payload?.[0].portName} failed: ${err?.msg}`,
      });
    },
    onSuccess: (_, payload) => {
      appendLogItem({
        type: "closed",
        time: DateTime.now(),
        port_name: payload?.[0].portName || "Unknown",
      });
      toastSuccess({
        description: `${payload?.[0].portName} closed`,
      });
    },
  });
  return { portClosing, closePort };
};

export default useClosePort;
