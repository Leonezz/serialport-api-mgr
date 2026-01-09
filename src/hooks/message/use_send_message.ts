import { MessageMetaConfig } from "@/types/message/message_meta";
import { useRequestState } from "../commands/useRequestState";
import { emitToRustBus, AppError } from "@/bridge/call_rust";
import { getSumCheckSigner } from "@/util/checksum";
import { v7 as uuid } from "uuid";
import { useSerialportStatus } from "../store/usePortStatus";
import { Buffer } from "buffer";
import { useSessionDialogStore } from "../store/useSessionDialogMessages";
import { getCrlfAppender } from "@/types/message/crlf";
import { useSerialportLog } from "../store/useSerialportLogStore";
import { DateTime } from "luxon";
import { bufferToHexStr } from "@/components/message/util";

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
  const { sendMessage, messageSent, messageSendFailed } = useSerialportStatus();
  const { sendMessage: sessionSendMessage, messageSent: sessionMessageSent, messageSendFailed: sessionMessageSendFailed } = useSessionDialogStore();
  const { appendLogItem } = useSerialportLog();
  const { loading: sending, runRequest: sendMessageToSerialPort } =
    useRequestState({
      action: async ({
        port_name,
        data,
        messageId,
      }: {
        port_name: string;
        data: number[];
        messageId?: string;
      }) => {
        const msgId = messageId || uuid();
        const dataToSend = crcSigner(crlfAppender(data));
        const bufferToSend = Buffer.from(dataToSend);
        emitToRustBus("write_port", {
          port_name: port_name,
          data: dataToSend,
          message_id: msgId,
        }).then(() => {
          messageSent({
            port_name: port_name,
            data: bufferToSend,
            message_id: msgId,
          });
          sessionMessageSent({
            port_name: port_name,
            data: bufferToSend,
            message_id: msgId,
          });
          appendLogItem({
            type: "sent",
            data: bufferToHexStr(bufferToSend),
            time: DateTime.now(),
            port_name: port_name,
          });
        }).catch((err) => {
          messageSendFailed({
            port_name: port_name,
            data: bufferToSend,
            message_id: msgId,
            error_msg: err,
          });
          sessionMessageSendFailed({
            port_name: port_name,
            data: bufferToSend,
            message_id: msgId,
          });
          appendLogItem({
            type: "send_failed",
            data: bufferToHexStr(bufferToSend),
            time: DateTime.now(),
            port_name: port_name,
          });
        });
        sendMessage({
          port_name: port_name,
          data: bufferToSend,
          id: msgId,
        });
        sessionSendMessage({
          port_name: port_name,
          data: bufferToSend,
          message_id: msgId,
        });
        appendLogItem({
          type: "send",
          data: bufferToHexStr(bufferToSend),
          time: DateTime.now(),
          port_name: port_name,
        });
      },

      onError: onError,
      onSuccess: onSuccess,
    });
  return { sending, sendMessageToSerialPort };
};

const useSendMessageAwaitable = ({ crlf, check_sum }: MessageMetaConfig) => {
  const crcSigner = getSumCheckSigner({ checkSum: check_sum });
  const crlfAppender = getCrlfAppender({ crlf: crlf });
  const { sendMessage } = useSerialportStatus();

  const doSend = ({
    port_name,
    data,
  }: {
    port_name: string;
    data: number[];
  }) => {
    const message_id = uuid();
    const dataToSend = crcSigner(crlfAppender(data));
    const res = emitToRustBus("write_port", {
      port_name: port_name,
      data: dataToSend,
      message_id: message_id,
    });
    sendMessage({
      port_name: port_name,
      data: Buffer.from(dataToSend),
      id: message_id,
    });
    return res;
  };
  return { sendMessageToSerialport: doSend };
};

export { useSendMessage, useSendMessageAwaitable };
