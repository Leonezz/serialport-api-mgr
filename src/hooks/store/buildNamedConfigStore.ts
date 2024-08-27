import { create } from "zustand";
import { v7 as uuid } from "uuid";
type NamedConfigStoreType<T> = {
  id: string;
  name: string;
  config: T;
};
type NamedConfigStore<T> = {
  data: Map<string, NamedConfigStoreType<T>>;
};

type NamedConfigStoreCURDActions<T> = {
  get: ({ id }: { id: string }) => NamedConfigStoreType<T> | undefined;
  delete: ({ id }: { id: string }) => boolean;
  add: ({ name, config }: { name: string; config: T }) => string;
  update: ({
    id,
    name,
    config,
  }: {
    id: string;
    name?: string;
    config: Partial<T>;
  }) => boolean;
};

const buildNamedConfigStore = <T, Extra, ExtraActions>(
  extraInit: Extra,
  actions: ExtraActions
) => {
  return create<
    NamedConfigStore<T> & Extra & NamedConfigStoreCURDActions<T> & ExtraActions
  >((set, get) => ({
    ...extraInit,
    ...actions,
    data: new Map(),
    get: ({ id }) => {
      return get().data.get(id);
    },
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
    add: ({ name, config }) => {
      const id = uuid();
      set((prev) => ({
        ...prev,
        data: prev.data.set(id, { id: id, name: name, config: config }),
      }));
      return id;
    },
    update: ({ id, name, config }) => {
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
            name: name || currentConfig.name,
            config: { ...currentConfig.config, ...config },
          }),
        };
      });
      return true;
    },
  }));
};

export default buildNamedConfigStore;
