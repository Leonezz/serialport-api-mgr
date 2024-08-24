import { ScrollShadow } from "@nextui-org/react";
import Message, { MessageProps } from "./message";
import { ViewModeType } from "@/types/message/view_mode";
import { CRLFOptionsType } from "@/types/message/crlf";
import { TextEncodingType } from "@/types/message/encoding";

type MessageListProps = {
  messages: MessageProps[];
  viewMode: ViewModeType;
  textEncoding: TextEncodingType;
  crlf: CRLFOptionsType;
};
const MessageList = ({
  messages,
  viewMode,
  textEncoding,
  crlf
}: MessageListProps) => {
  messages = messages.sort((a, b) => b.time.getTime() - a.time.getTime());
  return (
    <ScrollShadow
      visibility="none"
      className="flex gap-1 px-3 flex-col-reverse"
    >
      {messages.map((message) => (
        <Message {...message} viewMode={viewMode} textEncoding={textEncoding} crlf={crlf} />
      ))}
    </ScrollShadow>
  );
};

export default MessageList;
