import {
  useNamedApiStore,
  NamedSerialportApi,
} from "@/hooks/store/useNamedConversationStore";
import {
  useNamedSerialportDeviceStore,
  NamedSerialportDeviceConfig,
} from "@/hooks/store/useNamedDeviceConfigStore";
import {
  useNamedMessageMetaConfigStore,
  NamedMessageMetaConfig,
} from "@/hooks/store/useNamedMessageMetaConfig";
import {
  useNamedSerialortConfigStore,
  NamedSerialportConfig,
} from "@/hooks/store/useNamedSerialPortConfig";
import { SerialportConversation } from "@/types/conversation";
import { DEFAULTSerialportConversation } from "@/types/conversation/default";
import { type SerialportDevice } from "@/types/device";
import { DEFAULTSerialportDeviceConfig } from "@/types/device/default";
import {
  DEFAULTMessageConfig,
  MessageMetaConfig,
} from "@/types/message/message_meta";
import {
  DEFAULTSerialportConfig,
  SerialportConfig,
} from "@/types/serialport/serialport_config";

export const UseStoreHandles = {
  serialport: useNamedSerialortConfigStore,
  message: useNamedMessageMetaConfigStore,
  api: useNamedApiStore,
  device: useNamedSerialportDeviceStore,
} as const;

export type SupportedConfig = {
  serialport: {
    configType: SerialportConfig;
    namedConfigType: NamedSerialportConfig;
  };
  message: {
    configType: MessageMetaConfig;
    namedConfigType: NamedMessageMetaConfig;
  };
  api: {
    configType: SerialportConversation;
    namedConfigType: NamedSerialportApi;
  };
  device: {
    configType: SerialportDevice;
    namedConfigType: NamedSerialportDeviceConfig;
  };
};
export const DEFAULTConfigs = {
  serialport: DEFAULTSerialportConfig,
  message: DEFAULTMessageConfig,
  api: DEFAULTSerialportConversation,
  device: DEFAULTSerialportDeviceConfig,
} as const;
