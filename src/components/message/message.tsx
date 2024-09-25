import { MessageType } from "@/hooks/store/usePortStatus";
import { Chip, ChipProps, Snippet, Spinner } from "@nextui-org/react";
import decodeSerialData from "./util";
import { Buffer } from "buffer";
import { MessageMetaConfig } from "@/types/message/message_meta";
import { checkSumVerifyMessage } from "@/util/checksum";
import { getCrcBytes } from "@/types/message/checksum";
import { dropRight } from "es-toolkit";
import { splitMessageByCRLF } from "@/util/crlf";
import { CircleAlert } from "lucide-react";

const ReadableMessage = ({
  data,
  crlf,
  view_mode: viewMode,
  text_encoding: textEncoding,
  ...props
}: {
  data: Buffer;
} & Omit<MessageMetaConfig, "checkSum"> &
  ChipProps) => {
  const message = decodeSerialData(viewMode, textEncoding, data);
  const lines = splitMessageByCRLF({ message: message, crlfMode: crlf });
  const lineBreak = viewMode === "Text" ? "break-all" : "break-word";

  return (
    <div className="flex flex-row items-center">
      {lines.map((line) => (
        <p
          key={line}
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
  status,
  check_sum,
  ...messageMetaProps
}: MessageProps & MessageMetaConfig) => {
  const isLocalMsg = sender === "Local";
  const color = isLocalMsg ? "primary" : "warning";
  const isMsgLoading = status === "pending" || status === "sending";
  const isMsgInactive = status === "inactive";
  const isMsgFailed = status === "failed";

  const checkSumSuccess = checkSumVerifyMessage({
    message: data,
    check_sum: check_sum,
  });
  const checkSumBytes = getCrcBytes(check_sum);
  const bytesTotal = data.length;
  data = Buffer.from(dropRight([...data], checkSumBytes));

  return (
    <div
      className={`flex gap-2 ${
        isLocalMsg ? "flex-row self-end " : "flex-row-reverse self-start"
      }`}
    >
      <div>
        {isMsgLoading && <Spinner size="sm" color={color} />}
        {isMsgFailed && <CircleAlert className="danger stroke-danger" />}
      </div>
      <Snippet
        codeString={String.fromCharCode(...data)}
        hideSymbol
        size="md"
        className={`max-w-[75%] min-w-fit w-fit items-start text-md text-wrap`}
        variant="flat"
        color={color}
      >
        <p className="text-xs text-neutral-500 font-mono items-center">
          {status === "received" || status === "sent" ? (
            <code>{`${
              sender === "Remote" ? "Received" : "Send"
            } at ${time.toLocaleTimeString()} (${bytesTotal} bytes total)`}</code>
          ) : (
            <code>{`${status}`}</code>
          )}
          {check_sum !== "None" ? (
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
        <ReadableMessage
          data={data}
          {...messageMetaProps}
          check_sum={check_sum}
          color={color}
        />
      </Snippet>
    </div>
  );
};

export default Message;
