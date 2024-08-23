import { ScrollShadow } from "@nextui-org/react";
import Message, { MessageProps } from "./message";
import { ViewModeType } from "../serialport/msg_input_toolbar";
import { TextEncodingType } from "./util";

type MessageListProps = {
  messages: MessageProps[];
  viewMode: ViewModeType;
  textEncoding: TextEncodingType;
};
const MessageList = ({
  messages,
  viewMode,
  textEncoding,
}: MessageListProps) => {
  messages = messages.sort((a, b) => b.time.getTime() - a.time.getTime());
  return (
    <ScrollShadow
      visibility="none"
      className="flex gap-1 px-3 flex-col-reverse"
    >
      {messages.map((message) => (
        <Message {...message} viewMode={viewMode} textEncoding={textEncoding} />
      ))}
    </ScrollShadow>
  );
};

export default MessageList;
