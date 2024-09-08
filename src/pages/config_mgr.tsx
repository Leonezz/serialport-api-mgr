import ConfigMgrBuilder from "@/components/config_mgr/config_mgr";
import { Tabs, Tab } from "@nextui-org/react";
import { Handshake, Usb } from "lucide-react";

const ConfigMgr = () => {
  const SerialportConfigMgr = ConfigMgrBuilder("serialport");
  const MessageMetaConfigMgr = ConfigMgrBuilder("message");
  const tabs = [];
  for (let i = 0; i < 145; ++i) {
    tabs.push({ id: i.toString() });
  }
  return (
    <div className="flex h-full w-full flex-col max-h-full ">
      <Tabs
        aria-label="Options"
        color="primary"
        size="sm"
        classNames={{
          panel: "flex flex-grow min-h-0 pb-0",
        }}
        title={"Config"}
      >
        <Tab
          key="serialport"
          title={
            <div className="flex items-center space-x-2">
              <Usb />
              <span>Serialport</span>
            </div>
          }
        >
          {SerialportConfigMgr}
        </Tab>
        <Tab
          key="message"
          title={
            <div className="flex items-center space-x-2">
              <Handshake />
              <span>Message</span>
            </div>
          }
        >
          {MessageMetaConfigMgr}
        </Tab>
      </Tabs>
    </div>
  );
};

export default ConfigMgr;
