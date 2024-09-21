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

export const DEFAULTBasicInformation: BasicConfigInfomation = {
  id: "",
  name: "",
  comment: "",
  usedBy: [],
  createAt: new Date(),
  updateAt: new Date(),
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
    config: Extract<T, T>;
  }) => string;
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
              const now = new Date();
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

export { buildNamedConfigStore };
