import { MessageType } from "@/hooks/store/usePortStatus";
import { Chip, ChipProps, Snippet } from "@nextui-org/react";
import decodeSerialData from "./util";
import { Buffer } from "buffer";
import { MessageMetaType } from "@/types/message/message_meta";
import { splitMessageByCRLF } from "@/types/message/crlf";
import { checkSumVerifyMessage } from "@/util/checksum";
import { getCrcBytes } from "@/types/message/checksum";
import { dropRight } from "es-toolkit";

const ReadableMessage = ({
  data,
  crlf,
  viewMode,
  textEncoding,
  ...props
}: {
  data: Buffer;
} & Omit<MessageMetaType, "checkSum"> &
  ChipProps) => {
  const message = decodeSerialData(viewMode, textEncoding, data);
  const lines = splitMessageByCRLF({ message: message, crlfMode: crlf });
  const lineBreak = viewMode === "Text" ? "break-all" : "break-word";

  return (
    <div className="flex flex-row items-center">
      {lines.map((line) => (
        <p
          className={`flex flex-row max-w-full text-wrap ${lineBreak} items-center align-middle`}
        >
          <p className="h-full">{line}</p>
          {crlf !== "None" && viewMode === "Text" ? (
            <Chip
              size="sm"
              variant="solid"
              radius="sm"
              className="text-xs font-mono p-0.5 h-fit ml-1"
              color={props.color}
            >
              {crlf}
            </Chip>
          ) : null}
        </p>
      ))}
    </div>
  );
};

export type MessageProps = MessageType;
const Message = ({
  sender,
  time,
  data,
  checkSum,
  ...messageMetaProps
}: MessageProps & MessageMetaType) => {
  const align = sender === "Local" ? "self-end" : "self-start";
  const color = sender === "Remote" ? "warning" : "primary";

  const checkSumSuccess = checkSumVerifyMessage({
    message: data,
    checkSum: checkSum,
  });
  const checkSumBytes = getCrcBytes(checkSum);
  const bytesTotal = data.length;
  data = Buffer.from(dropRight([...data], checkSumBytes));

  return (
    <Snippet
      codeString={String.fromCharCode(...data)}
      hideSymbol
      size="md"
      className={`max-w-[75%] w-fit items-start text-md text-wrap ${align}`}
      variant="flat"
      color={color}
    >
      <p className="text-xs text-neutral-500 font-mono items-center">
        <code>{`${
          sender === "Remote" ? "Received" : "Send"
        } at ${time.toLocaleTimeString()} (${bytesTotal} bytes total)`}</code>
        {checkSum !== "None" ? (
          <Chip
            size="sm"
            variant="solid"
            radius="sm"
            aria-label="CRC Correct"
            className="text-xs font-mono p-0.5 h-4 ml-1"
            color={checkSumSuccess ? "success" : "danger"}
          >
            CRC
          </Chip>
        ) : null}
      </p>
      <ReadableMessage data={data} {...messageMetaProps} color={color} />
    </Snippet>
  );
};

export default Message;
