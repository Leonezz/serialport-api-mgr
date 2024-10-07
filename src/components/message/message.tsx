import { MessageType } from "@/hooks/store/usePortStatus";
import { Chip, ChipProps, Snippet, Spinner, Tooltip } from "@nextui-org/react";
import {
  getMessageDecoder,
  MessageMetaConfig,
} from "@/types/message/message_meta";
import { CircleAlert } from "lucide-react";
import { bufferToHexStr } from "./util";
import { DateTime } from "luxon";
import { DEFAULT_DATETIME_FORMAT } from "@/util/datetime";

const ReadableMessage = ({
  messageLines,
  crlf,
  view_mode: viewMode,
  text_encoding: textEncoding,
  ...props
}: {
  messageLines: string[];
} & Omit<MessageMetaConfig, "checkSum"> &
  ChipProps) => {
  const lineBreak = viewMode === "Text" ? "break-all" : "break-word";

  return (
    <div className="flex flex-row items-center">
      {messageLines.map((line) => (
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
  time: DateTime;
  bytes: number;
}) => {
  const timeStr = time.toFormat(DEFAULT_DATETIME_FORMAT);
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
  sessionMode,
  ...props
}: MessageProps & MessageMetaConfig & { sessionMode?: true }) => {
  const isLocalMsg = sender === "Local";
  const color = isLocalMsg ? "primary" : "warning";
  const isMsgLoading = status === "pending" || status === "sending";
  const isMsgInactive = status === "inactive";
  const isMsgFailed = status === "failed";
  const isMsgWaiting = status === "waiting";

  const bytesTotal = data.length;
  const messageLines = getMessageDecoder({
    view_mode: props.view_mode,
    text_encoding: props.text_encoding,
    crlf: props.crlf,
    check_sum: check_sum,
  })(data);
  const checkSumSuccess = messageLines !== undefined;

  return (
    <div
      className={`flex gap-2 max-w-[75%] ${
        isLocalMsg ? "flex-row self-end " : "flex-row-reverse self-start"
      }`}
    >
      <div>
        {(isMsgLoading || isMsgWaiting) && <Spinner size="sm" color={color} />}
        {(isMsgFailed || !checkSumSuccess || props.error !== undefined) && (
          <Tooltip
            content={
              <div className="flex flex-col">
                <h4>Error Message</h4>
                <code className="text-danger">{`${
                  isLocalMsg
                    ? isMsgInactive
                      ? "build message failed"
                      : "send message failed"
                    : `received data: ${bufferToHexStr(data)}`
                }`}</code>
                <code className="text-danger">{props.error}</code>
                <code className="text-danger">
                  {!checkSumSuccess && `${check_sum} checksum verify failed`}
                </code>
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
        className={`min-w-fit w-fit items-start text-md text-wrap`}
        variant="flat"
        color={color}
      >
        <div className="text-xs text-neutral-500 font-mono items-center">
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
        </div>

        {props.expectedMessage && (
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
        {checkSumSuccess && (
          <ReadableMessage
            messageLines={messageLines}
            {...props}
            check_sum={check_sum}
            color={color}
          />
        )}
      </Snippet>
    </div>
  );
};

export default Message;
