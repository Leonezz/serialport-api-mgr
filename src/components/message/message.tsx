import { MessageType } from "@/hooks/store/usePortStatus";
import { Chip, ChipProps, Snippet } from "@nextui-org/react";
import decodeSerialData from "./util";
import { Fragment } from "react/jsx-runtime";
import { CRLFOptionsType, CRLFString } from "@/types/message/crlf";
import { ViewModeType } from "@/types/message/view_mode";
import { TextEncodingType } from "@/types/message/encoding";

const MessageWithCRLF = ({
  message,
  crlf,
  viewMode,
  ...props
}: {
  message: string;
  crlf: CRLFOptionsType;
  viewMode: ViewModeType;
} & ChipProps) => {
  if (crlf === "None" || viewMode !== "Text") {
    return <p className="max-w-full break-word text-wrap">{message}</p>;
  }

  const spliter = CRLFString[crlf];
  const lines: React.ReactNode[] = [];
  for (let idx = 0; idx < message.length; ) {
    const endIdx = message.indexOf(spliter, idx);
    if (endIdx === -1) {
      lines.push(message.substring(idx));
      break;
    }
    lines.push(
      <Fragment>
        <p className="h-full">{message.substring(idx, endIdx)}</p>
        <Chip
          size="sm"
          variant="solid"
          radius="sm"
          className="text-xs font-mono p-0.5 h-fit ml-1"
          color={props.color}
        >
          {crlf}
        </Chip>
      </Fragment>
    );
    idx = endIdx + spliter.length;
  }

  return lines.map((line) => (
    <p className="flex flex-row max-w-full text-wrap break-all items-center align-middle">{line}</p>
  ));
};

export type MessageProps = MessageType;
const Message = ({
  sender,
  time,
  data,
  viewMode,
  textEncoding,
  crlf,
}: MessageProps & {
  viewMode: ViewModeType;
  textEncoding: TextEncodingType;
  crlf: CRLFOptionsType;
}) => {
  const align = sender === "Local" ? "self-end" : "self-start";
  const visiableData = decodeSerialData(viewMode, textEncoding, data);
  const color = sender === "Remote" ? "warning" : "primary";
  return (
    <Snippet
      codeString={String.fromCharCode(...data)}
      hideSymbol
      size="md"
      className={`max-w-[75%] w-fit items-start text-md text-wrap ${align}`}
      variant="flat"
      color={color}
    >
      <p className="text-xs text-neutral-500 font-mono">{`${
        sender === "Remote" ? "Received" : "Send"
      } at ${time.toLocaleTimeString()}`}</p>
      <MessageWithCRLF
        message={visiableData}
        viewMode={viewMode}
        crlf={crlf}
        color={color}
      />
    </Snippet>
  );
};

export default Message;
