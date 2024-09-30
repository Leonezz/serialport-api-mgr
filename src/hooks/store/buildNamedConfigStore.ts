import { create } from "zustand";
import { v7 as uuid } from "uuid";
import { devtools, persist } from "zustand/middleware";
import mappedDataLocalFileStorage from "./persist/localFile";
import { omit, uniqWith } from "es-toolkit";
import { SupportedConfig } from "@/components/config_mgr/util";
import { DateTime } from "luxon";
export type BasicConfigInfomation = {
  id: string;
  name: string;
  comment: string;
  usedBy: {
    type: keyof SupportedConfig;
    id: string;
  }[];
  createAt: DateTime;
  updateAt: DateTime;
};

export const DEFAULTBasicInformation: BasicConfigInfomation = {
  id: "",
  name: "",
  comment: "",
  usedBy: [],
  createAt: DateTime.now(),
  updateAt: DateTime.now(),
};

export type NamedConfigStoreType<T> = {
  config: Extract<T, T>;
} & BasicConfigInfomation;
type NamedConfigStore<T> = {
  data: Map<string, NamedConfigStoreType<T>>;
};

type NamedConfigStoreCURDActions<T> = {
  get: ({
    id,
  }: {
    id: string;
  }) =>
    | Extract<
        NamedConfigStoreType<Extract<T, T>>,
        NamedConfigStoreType<Extract<T, T>>
      >
    | undefined;
  getByName: ({
    name,
  }: {
    name: string;
  }) =>
    | Extract<
        NamedConfigStoreType<Extract<T, T>>,
        NamedConfigStoreType<Extract<T, T>>
      >
    | undefined;
  getIdList: () => string[];
  getNameList: () => string[];
  getAll: () => Extract<
    NamedConfigStoreType<Extract<T, T>>,
    NamedConfigStoreType<Extract<T, T>>
  >[];
  delete: ({ id }: { id: string }) => boolean;
  add: ({
    basicInfo,
    config,
  }: {
    basicInfo: Omit<
      Extract<BasicConfigInfomation, BasicConfigInfomation>,
      "id" | "createAt" | "updateAt" | "usedBy"
    >;
    config: T;
  }) => string;
  addUser: ({
    id,
    type,
    userId,
  }: {
    id: string;
    type: keyof SupportedConfig;
    userId: string;
  }) => boolean;
  removeUser: ({
    id,
    type,
    userId,
  }: {
    id: string;
    type: keyof SupportedConfig;
    userId: string;
  }) => boolean;
  update: ({
    id,
    basicInfo,
    config,
    newUser,
  }: {
    id: string;
    basicInfo?: Partial<
      Omit<
        Extract<BasicConfigInfomation, BasicConfigInfomation>,
        "id" | "createAt" | "updateAt" | "useBy"
      >
    >;
    newUser?: string;
    config?: Partial<Extract<T, T>>;
  }) => boolean;
};

const buildNamedConfigStore = <T, Extra, ExtraActions>(
  storageName: string,
  extraInit: Extra,
  actions: ExtraActions
) => {
  return create<
    NamedConfigStore<Extract<T, T>> &
      Extra &
      NamedConfigStoreCURDActions<T> &
      ExtraActions
  >()(
    devtools(
      persist(
        (set, get) => ({
          ...extraInit,
          ...actions,
          data: new Map(),
          get: ({ id }) => {
            return get().data.get(id);
          },
          getByName: ({ name }) => {
            const data = get().data;
            return [...data.values()].find((value) => value.name === name);
          },
          getIdList: () => [...get().data.keys()],
          getNameList: () =>
            [...get().data.values()].map((value) => value.name),
          getAll: () => [...get().data.values()],
          delete: ({ id }) => {
            if (!get().data.has(id)) {
              return false;
            }
            set((prev) => {
              prev.data.delete(id);
              return {
                ...prev,
                data: prev.data,
              };
            });
            return true;
          },
          add: ({ basicInfo, config }) => {
            const id = uuid();
            set((prev) => {
              const now = DateTime.now();
              const newEntry: Omit<
                Extract<
                  NamedConfigStoreType<Extract<T, T>>,
                  NamedConfigStoreType<Extract<T, T>>
                >,
                "config"
              > = {
                ...basicInfo,
                id: id,
                createAt: now,
                updateAt: now,
                usedBy: [],
              };
              return {
                ...prev,
                data: prev.data.set(id, {
                  ...newEntry,
                  config: config,
                }),
              };
            });
            return id;
          },
          addUser: ({ id, type, userId }) => {
            if (!get().data.has(id)) {
              return false;
            }
            set((prev) => {
              const currentConfig = prev.data.get(id);
              if (!currentConfig) {
                return prev;
              }
              const usedBy = uniqWith(
                [...currentConfig.usedBy, { type: type, id: userId }],
                (a, b) => a.id === b.id && a.type === b.type
              );
              return {
                ...prev,
                data: prev.data.set(id, {
                  ...currentConfig,
                  usedBy: [...usedBy],
                }),
              };
            });
            return true;
          },
          removeUser: ({ id, type, userId }) => {
            if (!get().data.has(id)) {
              return false;
            }
            set((prev) => {
              const currentConfig = prev.data.get(id);
              if (!currentConfig) {
                return prev;
              }
              return {
                ...prev,
                data: prev.data.set(id, {
                  ...currentConfig,
                  usedBy: [
                    ...new Set([
                      ...currentConfig.usedBy.filter(
                        (v) => v.type === type && v.id !== userId
                      ),
                    ]),
                  ],
                }),
              };
            });
            return true;
          },
          update: ({ id, basicInfo, config }) => {
            if (!get().data.has(id)) {
              return false;
            }
            set((prev) => {
              const currentConfig = prev.data.get(id);
              if (!currentConfig) {
                return prev;
              }
              return {
                ...prev,
                data: prev.data.set(id, {
                  id: id,
                  config: { ...currentConfig.config, ...config },
                  ...omit(currentConfig, ["id", "config"]),
                  ...basicInfo,
                  updateAt: DateTime.now(),
                }),
              };
            });
            return true;
          },
        }),
        {
          name: storageName,
          storage: mappedDataLocalFileStorage,
        }
      )
    )
  );
};

export { buildNamedConfigStore };
