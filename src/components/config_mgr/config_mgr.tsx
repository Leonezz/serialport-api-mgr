import { DEFAULTSerialportConfig } from "@/types/serialport/serialport_config";
import ConfigTitle from "./config_title";
import { useSet } from "ahooks";
import ListWithDetail from "../basics/list-with-detail";
import { Card, CardBody } from "@nextui-org/react";
import AddConfigToolBar from "./add_config_toolbar";

import useNamedSerialortConfigStore, {
  NamedSerialportConfig,
} from "@/hooks/store/useNamedSerialPortConfig";
import PortConfigGroups from "../serialport/port_config_groups";
import ConfigDetailCommon from "./config_detail";
import { BasicConfigInfomation } from "@/hooks/store/buildNamedConfigStore";
import { SerialportConfig } from "@/types/serialport/serialport_config";
import { usePrevious, useSafeState } from "ahooks";
import { isEqual, omit } from "es-toolkit";
import { useEffect } from "react";
import {
  DEFAULTMessageConfig,
  MessageMetaConfig,
} from "@/types/message/message_meta";
import useNamedMessageMetaConfigStore, {
  NamedMessageMetaConfig,
} from "@/hooks/store/useNamedMessageMetaConfig";
import MessageMetaConfiger from "../serialport/message_meta_configer";

type SupportedConfig = {
  serialport: {
    configType: SerialportConfig;
    namedConfigType: NamedSerialportConfig;
  };
  message: {
    configType: MessageMetaConfig;
    namedConfigType: NamedMessageMetaConfig;
  };
};
const UseStoreHandles = {
  serialport: useNamedSerialortConfigStore,
  message: useNamedMessageMetaConfigStore,
} as const;
const DEFAULTConfigs = {
  serialport: DEFAULTSerialportConfig,
  message: DEFAULTMessageConfig,
} as const;

type ConfigDetailProps<Key extends keyof SupportedConfig> = {
  value: SupportedConfig[Key]["namedConfigType"];
  onValueChange: () => void;
  onValueSave: () => void;
  onValueDelete: () => void;
};
const ConfigMgrDetailViewBuilder = <Key extends keyof SupportedConfig>({
  configDetailFor,
  value,
  onValueChange,
  onValueSave,
  onValueDelete,
}: ConfigDetailProps<Key> & { configDetailFor: Key }) => {
  type ConfigDataType = SupportedConfig[Key]["configType"];

  const [defaultValue, setDefaultValue] = useSafeState(value);
  const previousValue = usePrevious(value);
  const { update: updateConfig, delete: deleteConfig } =
    UseStoreHandles[configDetailFor]();
  useEffect(() => {
    if (
      isEqual(
        { ...previousValue, modified: false },
        { ...value, modified: false }
      )
    ) {
      return;
    }
    setDefaultValue(value);
  }, [value]);

  const setCommonInfo = (
    data: Partial<Omit<BasicConfigInfomation, "id" | "updateAt" | "createAt">>
  ) => {
    setDefaultValue((prev) => ({
      ...prev,
      ...data,
    }));
    onValueChange();
  };
  const setConfig = (data: Partial<ConfigDataType>) => {
    setDefaultValue((prev) => ({
      ...prev,
      config: { ...prev.config, ...data },
    }));
    onValueChange();
  };

  const doSaveConfig = () => {
    updateConfig({
      id: defaultValue.id,
      basicInfo: { ...omit(defaultValue, ["config"]) },
      config: { ...defaultValue.config },
    });
    onValueSave();
  };
  const doDeleteConfig = () => {
    deleteConfig({ id: defaultValue.id });
    onValueDelete();
  };

  return (
    <ConfigDetailCommon
      value={defaultValue}
      onValueChange={setCommonInfo}
      onValueSave={doSaveConfig}
      onValueDelete={doDeleteConfig}
      readonly={false}
    >
      {configDetailFor === "serialport" ? (
        <PortConfigGroups
          //FIXME - TYPE safety
          value={defaultValue.config as SerialportConfig}
          onValueChange={setConfig}
          verticalLayout
        />
      ) : (
        <MessageMetaConfiger
          //FIXME - TYPE safety
          value={defaultValue.config as MessageMetaConfig}
          onValueChange={setConfig}
          verticalLayout
        />
      )}
    </ConfigDetailCommon>
  );
};

const Title = <Key extends keyof SupportedConfig>(key: Key) => {
  return <Item extends { name: string }>(item: Item) => (
    <ConfigTitle type={key} content={item.name} />
  );
};

const ConfigMgrBuilder = <Key extends keyof SupportedConfig>(key: Key) => {
  const {
    getAll: getAllConfig,
    getNameList: getConfigNameList,
    add: addNewConfig,
  } = UseStoreHandles[key]();
  const configList = getAllConfig();

  const [modifiedList, { add: addToModified, remove: removeModified }] =
    useSet<string>([]);

  const items = configList.map((v) => ({
    ...v,
    modified: modifiedList.has(v.id),
  }));
  const title = Title(key);
  const defaultConfig = DEFAULTConfigs[key];

  return (
    <ListWithDetail
      items={items}
      defaultSelectId=""
      detailView={(item) => {
        return item ? (
          <ConfigMgrDetailViewBuilder
            configDetailFor={key}
            value={item}
            onValueChange={() => addToModified(item.id)}
            onValueDelete={() => removeModified(item.id)}
            onValueSave={() => removeModified(item.id)}
          />
        ) : (
          <Card className="w-full h-full">
            <CardBody className=" justify-center">
              <span className="text-neutral-500 text-3xl text-center">
                Not Selected
              </span>
            </CardBody>
          </Card>
        );
      }}
      renderTitle={title}
      topContent={
        <div className="flex flex-row gap-1 justify-between items-center w-full">
          <span className="text-medium font-extrabold">Config List</span>
          <AddConfigToolBar
            onClick={() => {
              const NEW_CONFIG_PREFIX = "New Config";
              const new_cnt = getConfigNameList().filter((v) =>
                v.startsWith(NEW_CONFIG_PREFIX)
              ).length;
              addNewConfig({
                basicInfo: {
                  name: `${NEW_CONFIG_PREFIX}-${new_cnt}`,
                  comment: "",
                },
                //FIXME - TYPE safety
                config: defaultConfig as SerialportConfig & MessageMetaConfig,
              });
            }}
          />
        </div>
      }
    />
  );
};

export default ConfigMgrBuilder;
