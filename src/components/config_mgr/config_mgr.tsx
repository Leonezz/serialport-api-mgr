import { useSet } from "ahooks";
import ListWithDetail from "../basics/list-with-detail";
import AddConfigToolBar from "./add_config_toolbar";

import ConfigDetailCommon from "./config_detail";
import { ComponentType, useState } from "react";
import { DEFAULTConfigs, SupportedConfig, UseStoreHandles } from "./util";
import { ConfigTitle } from "./config_title";

type ConfigDetailProps<Key extends keyof SupportedConfig> = {
  value: SupportedConfig[Key]["configType"];
  onValueChange: (v: Partial<SupportedConfig[Key]["configType"]>) => void;
  onValueSave: () => void;
  onValueDelete: () => void;
};

type ConfigDetailWrapperProps<Key extends keyof SupportedConfig> = {
  children: ComponentType<ConfigDetailProps<Key>>;
};
const ConfigMgrDetailViewWrapper =
  <Key extends keyof SupportedConfig>({
    children: DetailView,
  }: ConfigDetailWrapperProps<Key>) =>
  ({
    configFor,
    value,
    onValueChange,
    onValueSave,
    onValueDelete,
  }: {
    configFor: Key;
    value: Extract<
      SupportedConfig[Key]["namedConfigType"],
      SupportedConfig[Key]["namedConfigType"]
    >;
    onValueChange: () => void;
    onValueSave: () => void;
    onValueDelete: () => void;
  }) => {
    const { update: updateConfig, delete: deleteConfig } =
      UseStoreHandles[configFor]();
    const [localValue, setLocalValue] =
      useState<SupportedConfig[Key]["namedConfigType"]>(value);
    console.log(localValue);
    return (
      <ConfigDetailCommon
        configFor={configFor}
        value={localValue}
        onValueChange={(v) => {
          setLocalValue((prev) => ({ ...prev, ...v }));
          onValueChange();
        }}
        onValueSave={onValueSave}
        onValueDelete={onValueDelete}
        readonly={false}
      >
        <DetailView
          value={localValue.config}
          onValueChange={(v) => {
            setLocalValue((prev) => {
              return {
                ...prev,
                config: { ...prev.config, ...v },
              };
            });
            onValueChange();
          }}
          onValueDelete={() => {
            deleteConfig({ id: localValue.id });
            onValueDelete();
          }}
          onValueSave={() => {
            updateConfig({
              id: localValue.id,
              basicInfo: { ...localValue },
              config: { ...localValue.config },
            });
            onValueSave();
          }}
        />
      </ConfigDetailCommon>
    );
  };

const ConfigMgrWrapper = <Key extends keyof SupportedConfig>({
  children: ConfigDetail,
}: {
  children: ComponentType<ConfigDetailProps<Key>>;
}) => {
  const ConfigMgrWrapper = ConfigMgrDetailViewWrapper<Key>({
    children: ConfigDetail,
  });
  return ({ configFor }: { configFor: Key }) => {
    const {
      getAll: getAllConfigs,
      getNameList: getConfigNameList,
      add: addNewConfig,
    } = UseStoreHandles[configFor]();

    const allConfigsItems = getAllConfigs();

    const [modifiedList, { add: addToModified, remove: removeModified }] =
      useSet<string>([]);

    const defaultConfig = DEFAULTConfigs[configFor];

    return (
      <ListWithDetail
        items={allConfigsItems}
        modifiedItems={modifiedList}
        defaultSelectId=""
        detailView={(configItem) => {
          return (
            <ConfigMgrWrapper
              key={configItem.id}
              value={configItem}
              configFor={configFor}
              onValueChange={() => {
                addToModified(configItem.id);
              }}
              onValueSave={() => removeModified(configItem.id)}
              onValueDelete={() => removeModified(configItem.id)}
            />
          );
        }}
        renderTitle={({ item }) => (
          <ConfigTitle type={configFor} content={item.name} />
        )}
        topContent={
          <div className="flex flex-row gap-1 justify-between items-center w-full">
            <span className="text-medium font-extrabold">Config List</span>
            <AddConfigToolBar
              onClick={() => {
                const NEW_CONFIG_PREFIX = `New ${configFor} Config`;
                const new_cnt = getConfigNameList().filter((v) =>
                  v.startsWith(NEW_CONFIG_PREFIX)
                ).length;
                addNewConfig({
                  basicInfo: {
                    name: `${NEW_CONFIG_PREFIX}-${new_cnt}`,
                    comment: "",
                  },
                  config: defaultConfig,
                });
              }}
            />
          </div>
        }
      />
    );
  };
};

export default ConfigMgrWrapper;
