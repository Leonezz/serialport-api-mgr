import { Button, Textarea } from "@nextui-org/react";
import { useState } from "react";
import { Buffer } from "buffer";
import { useToast } from "../shadcn/use-toast";
import MsgInputToolBar, { MsgInputToolBarProps } from "./msg_input_toolbar";
import { useDebounceEffect } from "ahooks";
import {
  binStrToVisible,
  encodeBinToBuffer,
  encodeHexToBuffer,
  hexStrToVisible,
  verifyBinStr,
  verifyHexStr,
} from "@/util/message";
import useSendMessage from "@/hooks/message/use_send_message";

type MessageInputProps = {
  portName: string;
  portOpened: boolean;
} & MsgInputToolBarProps;
const MessageInput = ({
  portName,
  portOpened,
  messageMetaConfig,
  updateMessageMetaConfig,
}: MessageInputProps) => {
  const [messageData, setMessageData] = useState("");
  const [visibleMessage, setVisibleMessage] = useState(messageData);
  const [messageError, setMessageError] = useState<string | undefined>(
    undefined
  );
  const viewMode = messageMetaConfig.view_mode;
  useDebounceEffect(
    () => {
      if (viewMode === "Text") {
        setMessageData(visibleMessage);
      } else {
        setMessageData(visibleMessage.replace(/ /g, "").replace(/0x/g, ""));
      }
    },
    [visibleMessage, viewMode],
    { wait: 10 }
  );

  useDebounceEffect(
    () => {
      if (viewMode === "Hex" && !verifyHexStr(messageData)) {
        setMessageError("Invalid Hex Data");
      } else if (viewMode === "Bin" && !verifyBinStr(messageData)) {
        setMessageError("Invalid Binary Data");
      } else {
        setMessageError(undefined);
      }
    },
    [messageData, viewMode],
    { wait: 10 }
  );

  const encodeMessage = (text: string) => {
    if (viewMode === "Hex") {
      return encodeHexToBuffer(text);
    }
    if (viewMode === "Bin") {
      return encodeBinToBuffer(text);
    }

    return [...Buffer.from(text)];
  };

  const { toastError } = useToast();
  const { sending, sendMessageToSerialPort } = useSendMessage({
    crlf: messageMetaConfig.crlf,
    checkSum: messageMetaConfig.check_sum,
    onError: (err) =>
      toastError({
        description: `write ${messageData} to port ${portName} failed: ${err}`,
      }),
  });

  return (
    <footer className="flex flex-col gap-1 px-2 sticky bottom-0 mt-auto w-full">
      <Textarea
        value={visibleMessage}
        onValueChange={(value) => {
          if (viewMode === "Hex") {
            return setVisibleMessage(hexStrToVisible(value));
          }
          if (viewMode === "Bin") {
            return setVisibleMessage(binStrToVisible(value));
          }
          return setVisibleMessage(value);
        }}
        label={messageError === undefined ? "Message" : messageError}
        isInvalid={messageError !== undefined}
        variant="bordered"
        placeholder="Enter your message"
        classNames={{
          base: "max-w-full",
          input: "resize-none min-h-[40px]",
        }}
      />
      <div className="flex items-center gap-2">
        <MsgInputToolBar
          portName={portName}
          portOpened={portOpened}
          messageMetaConfig={messageMetaConfig}
          updateMessageMetaConfig={updateMessageMetaConfig}
        />
        <Button
          isDisabled={
            !portOpened ||
            messageError !== undefined ||
            messageData.length === 0
          }
          isLoading={sending}
          size="sm"
          color="primary"
          onClick={() =>
            sendMessageToSerialPort({
              port_name: portName,
              data: encodeMessage(messageData),
            })
          }
          className="h-full"
        >
          Send Message
        </Button>
      </div>
    </footer>
  );
};

export default MessageInput;
