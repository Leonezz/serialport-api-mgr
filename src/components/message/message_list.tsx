import { ScrollShadow } from "@nextui-org/react";
import Message, { MessageProps } from "./message";
import { MessageMetaConfig } from "@/types/message/message_meta";

type MessageListProps = {
  messages: MessageProps[];
  sessionMode?: true;
} & MessageMetaConfig;
const MessageList = ({
  messages,
  sessionMode,
  ...messageMetaProps
}: MessageListProps) => {
  messages = messages.sort((a, b) => {
    if (a.order && b.order) {
      return b.order - a.order;
    }
    return b.time.toMillis() - a.time.toMillis();
  });
  return (
    <ScrollShadow
      visibility="none"
      className="flex gap-1 px-3 flex-col-reverse h-full items-end"
    >
      {messages.map((message) => (
        <Message
          {...message}
          {...messageMetaProps}
          sessionMode={sessionMode}
          key={message.id}
        />
      ))}
    </ScrollShadow>
  );
};

export default MessageList;
