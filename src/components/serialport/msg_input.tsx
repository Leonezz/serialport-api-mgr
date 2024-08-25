import { emitToRustBus } from "@/bridge/call_rust";
import { Button, Textarea } from "@nextui-org/react";
import { useState } from "react";
import { Buffer } from "buffer";
import useRequestState from "@/hooks/commands.ts/useRequestState";
import { useToast } from "../shadcn/use-toast";
import MsgInputToolBar, { MsgInputToolBarProps } from "./msg_input_toolbar";
import { useDebounceEffect } from "ahooks";
import { CRLFCode } from "@/types/message/crlf";
import {
  binStrToVisible,
  encodeBinToBuffer,
  encodeHexToBuffer,
  hexStrToVisible,
  verifyBinStr,
  verifyHexStr,
} from "@/util/message";
import { checkSumMessage } from "@/util/checksum";

type MessageInputProps = {
  portName: string;
  portOpened: boolean;
} & MsgInputToolBarProps;
const MessageInput = ({
  portName,
  viewMode,
  setViewMode,
  crlfMode,
  setCrlfMode,
  portOpened,
  textEncoding,
  setTextEncoding,
  checkSum,
  setCheckSum,
}: MessageInputProps) => {
  const [messageData, setMessageData] = useState("");
  const [visibleMessage, setVisibleMessage] = useState(messageData);
  const [messageError, setMessageError] = useState<string | undefined>(
    undefined
  );
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
  const { loading: writingPort, runRequest: writePort } = useRequestState({
    action: () =>
      emitToRustBus("write_port", {
        port_name: portName,
        data: checkSumMessage({
          message: [...encodeMessage(messageData), ...CRLFCode[crlfMode]],
          checkSum: checkSum,
        }),
      }),
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
          viewMode={viewMode}
          setViewMode={setViewMode}
          crlfMode={crlfMode}
          setCrlfMode={setCrlfMode}
          textEncoding={textEncoding}
          setTextEncoding={setTextEncoding}
          portOpened={portOpened}
          checkSum={checkSum}
          setCheckSum={setCheckSum}
        />
        <Button
          isDisabled={
            !portOpened ||
            messageError !== undefined ||
            messageData.length === 0
          }
          isLoading={writingPort}
          size="sm"
          color="primary"
          onClick={writePort}
          className="h-full"
        >
          Send Message
        </Button>
      </div>
    </footer>
  );
};

export default MessageInput;
