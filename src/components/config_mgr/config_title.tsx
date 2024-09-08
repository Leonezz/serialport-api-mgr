import { Avatar } from "@nextui-org/react";
import { Handshake, Usb } from "lucide-react";

const ConfigTitle = ({
  type,
  content,
}: {
  type: "serialport" | "message";
  content: string;
}) => {
  const icon =
    type === "serialport" ? (
      <Usb size={4} className="h-4 w-4" />
    ) : (
      <Handshake />
    );
  return (
    <div className="flex gap-2 items-center">
      <Avatar alt={content} className=" h-6 w-6" radius="sm" icon={icon} />
      <span className="text-md max-w-[130px] truncate">{content}</span>
    </div>
  );
};
export default ConfigTitle;
