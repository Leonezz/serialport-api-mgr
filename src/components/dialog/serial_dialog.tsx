import { useState } from "react";
import SerialPortOpener from "../serialport/port_configer";
import { OpenSerialPortReq } from "@/bridge/call_rust";
import { CRLFOptionsType, ViewModeType } from "../serialport/msg_input_toolbar";
import MessageList from "../message/message_list";
import usePortStatus from "@/hooks/store/usePortStatus";
import MessageInput from "../serialport/msg_input";
import { TextEncodingType } from "../message/util";

const SerialDialog = () => {
  const [config, setConfig] = useState<OpenSerialPortReq>({
    portName: "",
    baudRate: 1,
    dataBits: "Eight",
    flowControl: "None",
    stopBits: "One",
    parity: "None",
  });
  const [viewMode, setViewMode] = useState<ViewModeType>("Text");
  const [crlf, setCrlf] = useState<CRLFOptionsType>("CRLF");
  const [textEncoding, setTextEncoding] = useState<TextEncodingType>("utf-8");

  // const test_msgs = [
  //   {
  //     sender: "Local",
  //     time: new Date(),
  //     data: Buffer.from("from local"),
  //   },
  //   { sender: "Remote", time: new Date(), data: Buffer.from("from remote") },
  //   { sender: "Local", time: new Date(), data: Buffer.from("local 1") },
  //   { sender: "Local", time: new Date(), data: Buffer.from("local 2") },
  //   {
  //     sender: "Local",
  //     time: new Date(),
  //     data: Buffer.from(
  //       "this is a very long content, it is so long that the dialog must wrap. yes it must wrap, if it is not I have to make this content longer"
  //     ),
  //   },
  // ] satisfies MessageProps[];

  const { getPortMessageList, getPortOpened } = usePortStatus();
  const messages = getPortMessageList({ port_name: config.portName });
  const portOpened = getPortOpened({ port_name: config.portName });
  return (
    <div className="h-full relative gap-2 flex flex-col">
      {/* <ResizablePanelGroup direction="vertical" className="w-full gap-2"> */}
      {/* <ResizablePanel defaultSize={75}> */}
      <SerialPortOpener
        portOpened={portOpened}
        serialConfig={config}
        setSerialConfig={setConfig}
      />
      <MessageList
        messages={messages}
        viewMode={viewMode}
        textEncoding={textEncoding}
      />
      {/* </ResizablePanel>
      <ResizableHandle withHandle />
      <ResizablePanel className="min-h-36"> */}
      <MessageInput
        portOpened={portOpened}
        portName={config.portName}
        viewMode={viewMode}
        setViewMode={setViewMode}
        crlfMode={crlf}
        setCrlfMode={setCrlf}
        textEncoding={textEncoding}
        setTextEncoding={setTextEncoding}
      />
      {/* </ResizablePanel>
    </ResizablePanelGroup> */}
    </div>
  );
};

export default SerialDialog;
