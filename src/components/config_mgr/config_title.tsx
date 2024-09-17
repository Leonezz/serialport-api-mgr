import { Avatar } from "@nextui-org/react";
import { Handshake, MessagesSquare, Usb } from "lucide-react";
export const ConfigIcons = {
  serialport: Usb,
  message: Handshake,
  api: MessagesSquare,
};

const ConfigTitle = ({
  type,
  content,
}: {
  type: keyof typeof ConfigIcons;
  content: string;
}) => {
  const ICON = ConfigIcons[type];
  return (
    <div className="flex gap-2 items-center">
      <Avatar
        alt={content}
        className=" h-6 w-6"
        radius="sm"
        icon={<ICON className="h-4 w-4" />}
      />
      <span className="text-md max-w-[130px] truncate">{content}</span>
    </div>
  );
};
export default ConfigTitle;
