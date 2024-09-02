import { MessageMetaConfig } from "@/types/message/message_meta";
import useRequestState from "../commands/useRequestState";
import { emitToRustBus, AppError } from "@/bridge/call_rust";
import { getSumCheckSigner } from "@/util/checksum";
import { getCrlfAppender } from "@/util/crlf";
import { v7 as uuid } from "uuid";
import useSerialportStatus from "../store/usePortStatus";
import { Buffer } from "buffer";

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
  const { sendMessage } = useSerialportStatus();
  const { loading: sending, runRequest: sendMessageToSerialPort } =
    useRequestState({
      action: async ({
        port_name,
        data,
      }: {
        port_name: string;
        data: number[];
      }) => {
        const messageId = uuid();
        const dataToSend = crcSigner(crlfAppender(data));
        emitToRustBus("write_port", {
          port_name: port_name,
          data: dataToSend,
          message_id: messageId,
        });
        sendMessage({
          port_name: port_name,
          data: Buffer.from(dataToSend),
          id: messageId,
        });
      },

      onError: onError,
      onSuccess: onSuccess,
    });
  return { sending, sendMessageToSerialPort };
};

export default useSendMessage;
