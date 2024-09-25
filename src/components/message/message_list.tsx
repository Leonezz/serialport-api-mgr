import { ScrollShadow } from "@nextui-org/react";
import Message, { MessageProps } from "./message";
import { MessageMetaConfig } from "@/types/message/message_meta";

type MessageListProps = {
  messages: MessageProps[];
} & MessageMetaConfig;
const MessageList = ({ messages, ...messageMetaProps }: MessageListProps) => {
  messages = messages.sort((a, b) => {
    if (a.order && b.order) {
      return b.order - a.order;
    }
    return b.time.getTime() - a.time.getTime();
  });
  return (
    <ScrollShadow
      visibility="none"
      className="flex gap-1 px-3 flex-col-reverse h-full items-end"
    >
      {messages.map((message) => (
        <Message {...message} {...messageMetaProps} key={message.id} />
      ))}
    </ScrollShadow>
  );
};

export default MessageList;
