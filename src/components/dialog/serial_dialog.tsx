import { useState } from "react";
import SerialPortOpener from "../serialport/port_configer";
import MessageList from "../message/message_list";
import usePortStatus from "@/hooks/store/usePortStatus";
import MessageInput from "../serialport/msg_input";
import { ViewModeType } from "@/types/message/view_mode";
import { CRLFOptionsType } from "@/types/message/crlf";
import { TextEncodingType } from "@/types/message/encoding";
import { SerialPortConfig } from "@/types/serialport/serialport_config";

const SerialDialog = () => {
  const [config, setConfig] = useState<SerialPortConfig>({
    port_name: "",
    baud_rate: 1,
    data_bits: "Eight",
    flow_control: "None",
    stop_bits: "One",
    parity: "None",
    read_timeout: 0,
    write_timeout: 0,
  });
  const [viewMode, setViewMode] = useState<ViewModeType>("Text");
  const [crlf, setCrlf] = useState<CRLFOptionsType>("CRLF");
  const [textEncoding, setTextEncoding] = useState<TextEncodingType>("utf-8");

  const { getPortMessageList, getPortOpened } = usePortStatus();
  const messages = getPortMessageList({ port_name: config.port_name });
  return (
    <div className="h-full relative gap-2 flex flex-col">
      <SerialPortOpener
        serialConfig={config}
        setSerialConfig={setConfig}
      />
      <MessageList
        messages={messages}
        viewMode={viewMode}
        textEncoding={textEncoding}
        crlf={crlf}
      />
      <MessageInput
        portOpened={getPortOpened({port_name: config.port_name})}
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

export default SerialDialog;
