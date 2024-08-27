import { MessageMetaType } from "@/types/message/message_meta";
import useRequestState from "../commands.ts/useRequestState";
import { emitToRustBus, RustBusError } from "@/bridge/call_rust";
import { getSumCheckSigner } from "@/util/checksum";
import { getCrlfAppender } from "@/util/crlf";

const useSendMessage = ({
  crlf,
  checkSum,
  onSuccess,
  onError,
}: {
  crlf: MessageMetaType["crlf"];
  checkSum: MessageMetaType["check_sum"];
  onSuccess?: (
    res: void,
    args?: [{ port_name: string; data: number[] }]
  ) => void;
  onError?: (
    error?: RustBusError,
    args?: [{ port_name: string; data: number[] }]
  ) => void;
}) => {
  const crcSigner = getSumCheckSigner({ checkSum: checkSum });
  const crlfAppender = getCrlfAppender({ crlf: crlf });
  const { loading: sending, runRequest: sendMessageToSerialPort } =
    useRequestState({
      action: ({ port_name, data }: { port_name: string; data: number[] }) =>
        emitToRustBus("write_port", {
          port_name: port_name,
          data: crcSigner(crlfAppender(data)),
        }),
      onError: onError,
      onSuccess: onSuccess,
    });
  return { sending, sendMessageToSerialPort };
};

export default useSendMessage;
