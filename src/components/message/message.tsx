import { MessageType } from "@/hooks/store/usePortStatus";
import { Chip, ChipProps, Snippet, Spinner, Tooltip } from "@nextui-org/react";
import { Buffer } from "buffer";
import {
  getMessageDecoder,
  MessageMetaConfig,
} from "@/types/message/message_meta";
import { checkSumVerifyMessage } from "@/util/checksum";
import { getCrcBytes } from "@/types/message/checksum";
import { dropRight } from "es-toolkit";
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
  const lines = getMessageDecoder({
    view_mode: viewMode,
    text_encoding: textEncoding,
    crlf: crlf,
    check_sum: props.check_sum,
  })(data);
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

const MessageStatus = ({
  status,
  time,
  bytes,
}: {
  status: MessageType["status"];
  time: Date;
  bytes: number;
}) => {
  const timeStr = time.toLocaleTimeString();
  if (status === "inactive") {
    return <code>{status}</code>;
  }
  if (status === "waiting") {
    return <code className="text-warning">{`waiting since ${timeStr}`}</code>;
  }
  if (status === "failed") {
    return <code className="text-danger">{`failed at ${timeStr}`}</code>;
  }
  if (status === "pending") {
    return <code className="text-secondary">{`pending since ${timeStr}`}</code>;
  }
  if (status === "received") {
    return (
      <code className="text-success">{`received ${bytes} bytes at ${timeStr}`}</code>
    );
  }
  if (status === "sending") {
    return <code className="text-secondary">{`sending since ${timeStr}`}</code>;
  }
  if (status === "sent") {
    return (
      <code className="text-success">{`sent ${bytes} bytes at ${timeStr}`}</code>
    );
  }
};

export type MessageProps = MessageType;
const Message = ({
  sender,
  time,
  data,
  status,
  check_sum,
  ...props
}: MessageProps & MessageMetaConfig) => {
  const isLocalMsg = sender === "Local";
  const color = isLocalMsg ? "primary" : "warning";
  const isMsgLoading = status === "pending" || status === "sending";
  const isMsgInactive = status === "inactive";
  const isMsgFailed = status === "failed";
  const isMsgToVerify = props.expectedMessage !== undefined;
  const isMsgWaiting = status === "waiting";

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
        {(isMsgLoading || isMsgWaiting) && <Spinner size="sm" color={color} />}
        {isMsgFailed && (
          <Tooltip
            content={
              <div>
                <h4>Error Message</h4>
                <code className="text-danger">{props.error}</code>
              </div>
            }
          >
            <CircleAlert className="danger stroke-danger" />
          </Tooltip>
        )}
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
          <MessageStatus status={status} bytes={bytesTotal} time={time} />
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
        {isMsgToVerify && (
          <div className="flex flex-row items-center text-neutral-500">
            <p
              className={`flex flex-row max-w-full text-wrap break-words items-center align-middle`}
            >
              <p className="h-full">{props.expectedMessage}</p>
              <Chip
                size="sm"
                variant="solid"
                radius="sm"
                className="text-xs font-mono p-0.5 h-fit ml-1"
                color={color}
              >
                EXPECT
              </Chip>
            </p>
          </div>
        )}
        <ReadableMessage
          data={data}
          {...props}
          check_sum={check_sum}
          color={color}
        />
      </Snippet>
    </div>
  );
};

export default Message;
