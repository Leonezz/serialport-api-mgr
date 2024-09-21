import { MessageMetaConfiger } from "../message_meta_configer";
import { MessageMetaConfig } from "@/types/message/message_meta";

type MessageMetaConfigMgrDetailProps = {
  value: MessageMetaConfig;
  onValueChange: (v: Partial<MessageMetaConfig>) => void;
  onValueSave: () => void;
  onValueDelete: () => void;
};
const MessageMetaConfigMgrDetail = ({
  value,
  onValueChange,
  // ...props
}: MessageMetaConfigMgrDetailProps) => {
  return (
    <MessageMetaConfiger
      value={value}
      onValueChange={onValueChange}
      verticalLayout
    />
  );
};

export default MessageMetaConfigMgrDetail;
