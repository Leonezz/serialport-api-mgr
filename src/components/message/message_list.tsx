import { ScrollShadow } from "@nextui-org/react";
import Message, { MessageProps } from "./message";
import { MessageMetaType } from "@/types/message/message_meta";

type MessageListProps = {
  messages: MessageProps[];
} & MessageMetaType;
const MessageList = ({ messages, ...messageMetaProps }: MessageListProps) => {
  messages = messages.sort((a, b) => b.time.getTime() - a.time.getTime());
  return (
    <ScrollShadow
      visibility="none"
      className="flex gap-1 px-3 flex-col-reverse"
    >
      {messages.map((message) => (
        <Message
          {...message}
          {...messageMetaProps}
          key={message.time.toString()}
        />
      ))}
    </ScrollShadow>
  );
};

export default MessageList;
