import { useState } from "react";
import SerialPortOpener from "../serialport/port_configer";
import MessageList from "../message/message_list";
import usePortStatus from "@/hooks/store/usePortStatus";
import MessageInput from "../serialport/msg_input";
import { ViewModeType } from "@/types/message/view_mode";
import { CRLFOptionsType } from "@/types/message/crlf";
import { TextEncodingType } from "@/types/message/encoding";
import { SerialPortConfig } from "@/types/serialport/serialport_config";
import { MessageMetaType } from "@/types/message/message_meta";

type SerialPortDialogProps = {
  serial_port: SerialPortConfig;
  message_meta: MessageMetaType;
};
const SerialPortDialog = ({
  serial_port,
  message_meta,
}: SerialPortDialogProps) => {
  const [config, setConfig] = useState<SerialPortConfig>(serial_port);
  const [viewMode, setViewMode] = useState<ViewModeType>(message_meta.viewMode);
  const [crlf, setCrlf] = useState<CRLFOptionsType>(message_meta.crlf);
  const [textEncoding, setTextEncoding] = useState<TextEncodingType>(
    message_meta.textEncoding
  );

  const { getPortMessageList, getPortOpened } = usePortStatus();
  const messages = getPortMessageList({ port_name: config.port_name });
  const portOpened = getPortOpened({ port_name: config.port_name });
  return (
    <div className="h-full relative gap-2 flex flex-col">
      <SerialPortOpener
        serialPortConfig={config}
        setSerialPortConfig={setConfig}
      />
      <MessageList
        messages={messages}
        viewMode={viewMode}
        textEncoding={textEncoding}
        crlf={crlf}
      />
      <MessageInput
        portOpened={portOpened}
        portName={config.port_name}
        viewMode={viewMode}
        setViewMode={setViewMode}
        crlfMode={crlf}
        setCrlfMode={setCrlf}
        textEncoding={textEncoding}
        setTextEncoding={setTextEncoding}
      />
    </div>
  );
};

export default SerialPortDialog;
