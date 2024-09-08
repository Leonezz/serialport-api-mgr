import { useState } from "react";
import SerialPortOpener from "../serialport/port_configer";
import MessageList from "../message/message_list";
import useSerialportStatus from "@/hooks/store/usePortStatus";
import MessageInput from "../serialport/msg_input";
import { SerialportConfig } from "@/types/serialport/serialport_config";
import { MessageMetaConfig } from "@/types/message/message_meta";

type SerialPortDialogProps = {
  serial_port: SerialportConfig;
  message_meta: MessageMetaConfig;
};
const SerialPortDialog = ({
  serial_port,
  message_meta,
}: SerialPortDialogProps) => {
  const [serialPortConfig, setSerialPortConfig] =
    useState<SerialportConfig>(serial_port);
  const [messageConfig, setMessageConfig] =
    useState<MessageMetaConfig>(message_meta);
  const updateMessageMetaConfig = (data: Partial<MessageMetaConfig>) =>
    setMessageConfig((prev) => ({
      ...prev,
      ...data,
    }));

  const { getPortMessageList, getPortOpened } = useSerialportStatus();
  const messages = getPortMessageList({
    port_name: serialPortConfig.port_name,
  });
  const portOpened = getPortOpened({ port_name: serialPortConfig.port_name });
  return (
    <div className="h-full relative gap-2 flex flex-col">
      <SerialPortOpener
        serialPortConfig={serialPortConfig}
        setSerialPortConfig={setSerialPortConfig}
      />
      <MessageList messages={messages} {...messageConfig} />
      <MessageInput
        portOpened={portOpened}
        portName={serialPortConfig.port_name}
        messageMetaConfig={messageConfig}
        updateMessageMetaConfig={updateMessageMetaConfig}
      />
    </div>
  );
};

export default SerialPortDialog;
