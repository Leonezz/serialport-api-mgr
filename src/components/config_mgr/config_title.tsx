import { Avatar } from "@nextui-org/react";
import {
  Combine,
  Handshake,
  MessagesSquare,
  Microchip,
  Usb,
} from "lucide-react";
export const ConfigIcons = {
  serialport: Usb,
  message: Handshake,
  api: MessagesSquare,
  device: Microchip,
  flow: Combine,
};

export type ConfigTitleProps = {
  type: keyof typeof ConfigIcons;
  content: string;
};
export const ConfigTitle = ({ type, content }: ConfigTitleProps) => {
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
