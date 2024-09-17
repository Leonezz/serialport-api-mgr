import ConfigMgrBuilder from "@/components/config_mgr/config_mgr";
import { ConfigIcons } from "@/components/config_mgr/config_title";
import { Tabs, Tab } from "@nextui-org/react";

const ConfigMgr = () => {
  const SerialportConfigMgr = ConfigMgrBuilder("serialport");
  const MessageMetaConfigMgr = ConfigMgrBuilder("message");
  const ApiConfigMgr = ConfigMgrBuilder("api");
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
              <ConfigIcons.serialport />
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
              <ConfigIcons.message />
              <span>Message</span>
            </div>
          }
        >
          {MessageMetaConfigMgr}
        </Tab>
        <Tab
          key={"api"}
          title={
            <div className="flex items-center space-x-2">
              <ConfigIcons.api />
              <span>Api</span>
            </div>
          }
        >
          {ApiConfigMgr}
        </Tab>
      </Tabs>
    </div>
  );
};

export default ConfigMgr;
