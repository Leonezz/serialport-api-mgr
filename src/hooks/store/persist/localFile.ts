import { StorageValue } from "zustand/middleware";
import {
  BaseDirectory,
  exists,
  readTextFile,
  writeTextFile,
  remove,
} from "@tauri-apps/plugin-fs";
import { DateTime } from "luxon";
const BASEDIR = BaseDirectory.AppLocalData;

const mappedDataLocalFileStorage = {
  getItem: async <T extends { data: Map<K, V> }, K, V>(
    name: string
  ): Promise<{ state: T } | null> => {
    if (!(await exists(name, { baseDir: BASEDIR }))) {
      return null;
    }
    const res = await readTextFile(name, { baseDir: BASEDIR });
    if (!res) return null;
    const existingValue: { state: T } = JSON.parse(res, (key, value) => {
      if (key === "createAt" || key === "updateAt") {
        return DateTime.fromMillis(value);
      }
      return value;
    });
    return {
      ...existingValue,
      state: {
        ...existingValue.state,
        data: new Map(existingValue.state.data),
      },
    };
  },
  setItem: async <T extends { data: Map<K, V> }, K, V>(
    name: string,
    value: StorageValue<T>
  ) => {
    const str = JSON.stringify(
      {
        ...value,
        state: {
          ...value.state,
          data: Array.from(value.state.data.entries()),
        },
      },
      (key, value) => {
        if (key === "createAt" || key === "updateAt") {
          return DateTime.fromISO(value).toMillis();
        }
        return value;
      }
    );
    return await writeTextFile(name, str, {
      baseDir: BASEDIR,
      create: true,
      append: false,
    });
  },
  removeItem: async (name: string) => {
    return await remove(name, { baseDir: BASEDIR });
  },
};

export default mappedDataLocalFileStorage;
