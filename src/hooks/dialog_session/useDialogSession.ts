import { MessageMetaConfig } from "@/types/message/message_meta";
import { useSessionDialogStore } from "../store/useSessionDialogMessages";
import { SerialportConversation } from "@/types/conversation";
import { useEffect, useState } from "react";
import { ERR, OK, Result } from "@/types/global";
import { useSendMessage } from "../message/use_send_message";
import { useToast } from "@/components/shadcn/use-toast";
import { Buffer } from "buffer";

export const useDialogSession = ({
  sessionId,
  messageMetaConfig,
  apiConfig,
  message,
  portName,
}: {
  sessionId?: string;
  messageMetaConfig: MessageMetaConfig;
  apiConfig: SerialportConversation;
  message?: string;
  portName: string;
}) => {
  const {
    getMessagesBySessionId,
    setSession,
    resetSession,
    removeSession,
    setPortName,
  } = useSessionDialogStore();
  const [localSessionId, setLocalSessionId] = useState(sessionId);
  useEffect(() => {
    if (sessionId !== undefined) {
      return () => {};
    }
    const session = setSession({
      port_name: portName,
      message_meta: messageMetaConfig,
      messages: apiConfig,
      message: message,
    });
    const generatedSessionId = session.session_id;
    setLocalSessionId(generatedSessionId);

    return () => removeSession({ session_id: generatedSessionId });
  }, []);

  const messages = getMessagesBySessionId(localSessionId || "");

  const totalTasks = messages?.messages.length || 0;
  const finishedTasks =
    messages?.messages.reduce(
      (prev, cur) =>
        prev + (cur.status === "received" || cur.status === "sent" ? 1 : 0),
      0
    ) || 0;
  const failedTasks =
    messages?.messages.reduce(
      (prev, cur) => prev + (cur.status === "failed" ? 1 : 0),
      0
    ) || 0;
  const sessionFinished = totalTasks === failedTasks + finishedTasks;

  const nextMessage = messages?.messages
    .sort((a, b) => (a.order || 0) - (b.order || 1))
    .find((v) => v.sender === "Local" && v.status === "inactive");

  const [sendResult, setSendResult] = useState<
    Result<"pending" | "sending" | "success">
  >(OK("pending"));

  const { toastError } = useToast();
  const { sendMessageToSerialPort, sending } = useSendMessage({
    crlf: messageMetaConfig.crlf,
    checkSum: messageMetaConfig.check_sum,
    onError: (err, payload) => {
      const errorMsg = `send data to port: ${payload?.[0].port_name} failed, ${err}`;
      toastError({
        description: errorMsg,
      });
      setSendResult(ERR(new Error(errorMsg)));
    },
    onSuccess: () => setSendResult(OK("success")),
  });
  const runNext = () => {
    if (!nextMessage) {
      return ERR(new Error("get next message failed"));
    }

    setSendResult(OK("sending"));

    sendMessageToSerialPort({
      port_name: portName,
      data: [...Buffer.from(nextMessage.expectedMessage || "")],
      messageId: nextMessage.id,
    });
  };

  const reset = () => {
    localSessionId && resetSession({ session_id: localSessionId });
    setSendResult(OK("pending"));
  };

  const setPort = (portName: string) => {
    if (localSessionId === undefined) {
      return ERR(new Error("session not set up"));
    }
    setPortName({ sessionId: localSessionId, portName: portName });
    return OK("");
  };

  return {
    sessionId: localSessionId,
    setPortName: setPort,
    messages,
    totalTasks,
    finishedTasks,
    failedTasks,
    sessionFinished,
    runNext,
    sending,
    sendResult,
    reset,
  };
};
