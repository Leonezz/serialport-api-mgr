import { useRequest, useResetState } from "ahooks";
import { ActionResState } from "./util";
import { RustBusError } from "@/bridge/call_rust";

const useRequestState = <Res, Payload extends any[]>({
  action,
  onSuccess,
  onError,
  defaultParams,
  debounceWait = 300,
  manual = true,
}: {
  action: (...p: Payload) => Promise<Res>;
  debounceWait?: number;
  manual?: boolean;
  onSuccess?: (d?: Res, p?: Payload) => void;
  onError?: (e?: RustBusError, p?: Payload) => void;
  defaultParams?: Payload;
}) => {
  const [state, setState, resetState] = useResetState<ActionResState<Res>>({
    failed: false,
    succeed: false,
  });
  const setFailed = (e: RustBusError) =>
    setState({ failed: true, succeed: false, data: undefined, error: e });
  const setSuccess = (d: Res) =>
    setState({ failed: false, succeed: true, data: d, error: undefined });

  const { loading, run, data } = useRequest(action, {
    defaultParams: defaultParams,
    debounceWait: debounceWait,
    manual: manual,
    onBefore: resetState,
    onError: (e: any, p: Payload) => {
      setFailed(e);
      if (onError) {
        onError(e, p);
      }
      console.log(e);
    },
    onSuccess: (d: Res, p: Payload) => {
      setSuccess(d);
      if (onSuccess) {
        onSuccess(d, p);
      }
    },
  });

  return {
    errState: state,
    setFailed,
    setSuccess,
    resetErrState: resetState,
    setErrState: setState,
    loading,
    runRequest: run,
    data,
  };
};

export default useRequestState;
