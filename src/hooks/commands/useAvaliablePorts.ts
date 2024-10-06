import { emitToRustBus } from "@/bridge/call_rust";
import { useToast } from "@/components/shadcn/use-toast";
import { useSerialportStatus } from "@/hooks/store/usePortStatus";

import { useRequestState } from "./useRequestState";

const useAvaliablePorts = () => {
  const { toastError, toastWarn } = useToast();
  const { updateAvaliablePorts } = useSerialportStatus();
  const { runRequest, loading } = useRequestState({
    action: () => emitToRustBus("get_all_port_info", undefined),
    onError: (err) =>
      toastError({
        description: `refresh avaliable ports failed: ${err?.msg}`,
      }),
    onSuccess: (data) => {
      if (data === undefined) {
        toastWarn({
          description:
            "refresh avaliable ports succeed but the result is undefined",
        });
        return;
      }
      updateAvaliablePorts({ ports: data });
    },
  });
  return { refresh: runRequest, refreshing: loading };
};

export default useAvaliablePorts;
