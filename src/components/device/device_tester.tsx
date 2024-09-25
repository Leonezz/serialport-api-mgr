import { useNamedApiStore } from "@/hooks/store/useNamedConversationStore";
import { useNamedMessageMetaConfigStore } from "@/hooks/store/useNamedMessageMetaConfig";
import { useNamedSerialortConfigStore } from "@/hooks/store/useNamedSerialPortConfig";
import { SupportedConfig } from "../config_mgr/util";
import { DeviceApiMonitor } from "../serialport_monitor/device_api_monitor";

type DeviceTesterProps = {
  config: SupportedConfig["device"]["configType"];
};
const DeviceTester = ({ config }: DeviceTesterProps) => {
  const { get: getSerialportConfig } = useNamedSerialortConfigStore();
  const serialportConfig = getSerialportConfig({
    id: config.device_config_id,
  });
  const { get: getMessageMetaConfig } = useNamedMessageMetaConfigStore();
  const messageMetaConfig = getMessageMetaConfig({
    id: config.message_meta_id,
  });
  const { get: getApiConfig } = useNamedApiStore();
  const apis = config.api_ids
    .map((v) => getApiConfig({ id: v }))
    .filter((v) => v !== undefined);

  if (!serialportConfig || !messageMetaConfig || !apis) {
    return <span>Config Not Valid</span>;
  }
  return (
    <DeviceApiMonitor
      serialportConfig={serialportConfig}
      messageMetaConfig={messageMetaConfig}
      apiConfigs={apis}
    />
  );
};

export { DeviceTester };
