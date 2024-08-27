import { useState } from "react";
import SerialPortOpener from "../serialport/port_configer";
import MessageList from "../message/message_list";
import usePortStatus from "@/hooks/store/usePortStatus";
import MessageInput from "../serialport/msg_input";
import { SerialPortConfig } from "@/types/serialport/serialport_config";
import { MessageMetaType } from "@/types/message/message_meta";
import singleKeySetter from "@/util/util";

type SerialPortDialogProps = {
  serial_port: SerialPortConfig;
  message_meta: MessageMetaType;
};
const SerialPortDialog = ({
  serial_port,
  message_meta,
}: SerialPortDialogProps) => {
  const [serialPortConfig, setSerialPortConfig] =
    useState<SerialPortConfig>(serial_port);
  const [messageConfig, setMessageConfig] =
    useState<MessageMetaType>(message_meta);

  const { getPortMessageList, getPortOpened } = usePortStatus();
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
        viewMode={messageConfig.view_mode}
        setViewMode={singleKeySetter(setMessageConfig, "view_mode")}
        crlfMode={messageConfig.crlf}
        setCrlfMode={singleKeySetter(setMessageConfig, "crlf")}
        textEncoding={messageConfig.text_encoding}
        setTextEncoding={singleKeySetter(setMessageConfig, "text_encoding")}
        checkSum={messageConfig.check_sum}
        setCheckSum={singleKeySetter(setMessageConfig, "check_sum")}
      />
    </div>
  );
};

export default SerialPortDialog;
