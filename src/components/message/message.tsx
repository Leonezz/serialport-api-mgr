import { MessageType } from "@/hooks/store/usePortStatus";
import { Snippet } from "@nextui-org/react";
import { ViewModeType } from "../serialport/msg_input_toolbar";
import decodeSerialData, { TextEncodingType } from "./util";

export type MessageProps = MessageType;
const Message = ({
  sender,
  time,
  data,
  viewMode,
  textEncoding,
}: MessageProps & {
  viewMode: ViewModeType;
  textEncoding: TextEncodingType;
}) => {
  const align = sender === "Local" ? "self-end" : "self-start";
  const visiableData = decodeSerialData(viewMode, textEncoding, data);

  return (
    <Snippet
      codeString={visiableData}
      hideSymbol
      size="md"
      className={`max-w-[75%] w-fit items-start text-md text-wrap ${align}`}
      variant="flat"
      color={sender === "Remote" ? "warning" : "primary"}
    >
      <p className="text-xs text-neutral-500 font-mono">{`${
        sender === "Remote" ? "Received" : "Send"
      } at ${time.toLocaleTimeString()}`}</p>
      <p
        className={
          "max-w-full text-pretty" +
          (viewMode === "Text" ? " break-all " : " break-words ")
        }
      >
        {visiableData}
      </p>
    </Snippet>
  );
};

export default Message;
