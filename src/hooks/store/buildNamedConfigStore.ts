import { create } from "zustand";
import { v7 as uuid } from "uuid";
import { devtools, persist } from "zustand/middleware";
import mappedDataLocalFileStorage from "./persist/localFile";
import { omit } from "es-toolkit";
export type BasicConfigInfomation = {
  id: string;
  name: string;
  comment: string;
  usedBy: string[];
  createAt: Date;
  updateAt: Date;
};
export type NamedConfigStoreType<T> = {
  config: T;
} & BasicConfigInfomation;
type NamedConfigStore<T> = {
  data: Map<string, NamedConfigStoreType<T>>;
};

type NamedConfigStoreCURDActions<T> = {
  get: ({ id }: { id: string }) => NamedConfigStoreType<T> | undefined;
  getByName: ({
    name,
  }: {
    name: string;
  }) => NamedConfigStoreType<T> | undefined;
  getIdList: () => string[];
  getNameList: () => string[];
  getAll: () => NamedConfigStoreType<T>[];
  delete: ({ id }: { id: string }) => boolean;
  add: ({
    basicInfo,
    config,
  }: {
    basicInfo: Omit<
      BasicConfigInfomation,
      "id" | "createAt" | "updateAt" | "usedBy"
    >;
    config: T;
  }) => string;
  update: ({
    id,
    basicInfo,
    config,
    newUser,
  }: {
    id: string;
    basicInfo?: Partial<
      Omit<BasicConfigInfomation, "id" | "createAt" | "updateAt" | "useBy">
    >;
    newUser?: string;
    config?: Partial<T>;
  }) => boolean;
};

const buildNamedConfigStore = <T, Extra, ExtraActions>(
  storageName: string,
  extraInit: Extra,
  actions: ExtraActions
) => {
  return create<
    NamedConfigStore<T> & Extra & NamedConfigStoreCURDActions<T> & ExtraActions
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
              const now = new Date();
              const newEntry: Omit<NamedConfigStoreType<T>, "config"> = {
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
          update: ({ id, basicInfo, newUser, config }) => {
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
                  updateAt: new Date(),
                  usedBy: newUser
                    ? [...currentConfig.usedBy, newUser]
                    : currentConfig.usedBy,
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

export default buildNamedConfigStore;
