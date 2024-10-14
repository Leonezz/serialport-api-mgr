import ConfigMgrWrapper from "@/components/config_mgr/config_mgr";
import { ConfigIcons } from "@/components/config_mgr/config_title";
import { ConversationConfigMgr } from "@/components/conversation/config_mgr_wrapper";
import { SerialportDeviceConfigMgr } from "@/components/device/config_mgr_wrapper";
import { SerialportFlowConfigMgrDetail } from "@/components/flow/flow_config_mgr";
import MessageMetaConfigMgrDetail from "@/components/message/config_mgr/wrapper";
import SerialportConfigMgrDetail from "@/components/serialport/config_mgr/wrapper";
import { Tabs, Tab } from "@nextui-org/react";

const ConfigMgrPage = () => {
  const SerialportConfigMgr = ConfigMgrWrapper<"serialport">({
    children: SerialportConfigMgrDetail,
  });
  const MessageMetaConfigMgr = ConfigMgrWrapper<"message">({
    children: MessageMetaConfigMgrDetail,
  });
  const ApiConfigMgr = ConfigMgrWrapper<"api">({
    children: ConversationConfigMgr,
  });
  const DeviceConfigMgr = ConfigMgrWrapper<"device">({
    children: SerialportDeviceConfigMgr,
  });
  const FlowConfigMgr = ConfigMgrWrapper<"flow">({
    children: SerialportFlowConfigMgrDetail,
  });

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
          <SerialportConfigMgr configFor="serialport" />
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
          <MessageMetaConfigMgr configFor="message" />
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
          <ApiConfigMgr configFor="api" />
        </Tab>
        <Tab
          key={"device"}
          title={
            <div className="flex items-center space-x-2">
              <ConfigIcons.device />
              <span>Device</span>
            </div>
          }
        >
          <DeviceConfigMgr configFor="device" />
        </Tab>
        <Tab
          key={"flow"}
          title={
            <div className="flex items-center space-x-2">
              <ConfigIcons.flow />
              <span>Application</span>
            </div>
          }
        >
          <FlowConfigMgr configFor="flow" />
        </Tab>
      </Tabs>
    </div>
  );
};

export { ConfigMgrPage };
