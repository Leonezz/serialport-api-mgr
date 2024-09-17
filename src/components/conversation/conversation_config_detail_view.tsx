import SerialportConversation from "@/types/conversation";
import { Textarea } from "@nextui-org/react";

type ConversationConfigDetailViewProps = {
  value: SerialportConversation;
  onValueChange: (v: Partial<SerialportConversation>) => void;
  verticalLayout?: boolean;
};
const ConversationConfigDetailView = ({
  value,
  onValueChange,
  verticalLayout,
}: ConversationConfigDetailViewProps) => {
  return (
    <div className="flex flex-col gap-2">
      <Textarea
        value={value.request}
        onValueChange={(value) => {
          onValueChange({ request: value });
        }}
        variant="bordered"
        placeholder="Enter the request content"
        labelPlacement="outside"
        label={
          <p className="text-medium font-bold text-content1-foreground">
            Request
          </p>
        }
        classNames={{
          base: "max-w-full",
          input: "resize-none min-h-[40px]",
        }}
      />
      <Textarea
        value={value.response}
        onValueChange={(value) => onValueChange({ response: value })}
        variant="bordered"
        placeholder="Enter the request content"
        label={
          <p className="text-medium font-bold text-content1-foreground">
            Response
          </p>
        }
        labelPlacement="outside"
        classNames={{
          base: "max-w-full",
          input: "resize-none min-h-[40px]",
        }}
      />
    </div>
  );
};

export default ConversationConfigDetailView;
