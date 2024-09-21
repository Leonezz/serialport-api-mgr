import { SerialportConversation } from "@/types/conversation";
import { ConversationConfiger } from "./conversation_config_detail_view";

type ConversationConfigDetailViewProps = {
  value: SerialportConversation;
  onValueChange: (v: Partial<SerialportConversation>) => void;
  onValueSave: () => void;
  onValueDelete: () => void;
};
const ConversationConfigMgr = ({
  value,
  onValueChange,
}: ConversationConfigDetailViewProps) => {
  return (
    <ConversationConfiger
      value={value}
      onValueChange={onValueChange}
      readonly={false}
    />
  );
};

export { ConversationConfigMgr };
