import { create } from "zustand";
import { v7 as uuid } from "uuid";
import { DateTime } from "luxon";

export type SerialportLogItem = {
  id: string;
  port_name: string;
  time: DateTime;
  type:
    | "send"
    | "pending"
    | "sending"
    | "sent"
    | "send_failed"
    | "received"
    | "open_port"
    | "port_opened"
    | "port_open_failed"
    | "close_port"
    | "port_closed"
    | "port_close_failed";
  message?: Buffer;
};

type SerialportLogStore = {
  data: SerialportLogItem[];
};

type SerialportLogStoreActions = {
  appendLogItem: ({}: Omit<SerialportLogItem, "id">) => void;
  get: () => SerialportLogItem[];
};

export const useSerialportLog = create<
  SerialportLogStore & SerialportLogStoreActions
>((set, get) => ({
  data: [],
  appendLogItem: (item) =>
    set((prev) => ({ data: [{ ...item, id: uuid() }, ...prev.data] })),
  get: () => get().data,
}));
