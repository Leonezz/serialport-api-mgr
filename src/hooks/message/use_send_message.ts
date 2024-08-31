import { MessageMetaConfig } from "@/types/message/message_meta";
import useRequestState from "../commands/useRequestState";
import { emitToRustBus, AppError } from "@/bridge/call_rust";
import { getSumCheckSigner } from "@/util/checksum";
import { getCrlfAppender } from "@/util/crlf";

const useSendMessage = ({
  crlf,
  checkSum,
  onSuccess,
  onError,
}: {
  crlf: MessageMetaConfig["crlf"];
  checkSum: MessageMetaConfig["check_sum"];
  onSuccess?: (
    res: void,
    args?: [{ port_name: string; data: number[] }]
  ) => void;
  onError?: (
    error?: AppError,
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
