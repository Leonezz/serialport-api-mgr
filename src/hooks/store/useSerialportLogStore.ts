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
    | "opened"
    | "open_failed"
    | "close"
    | "closed"
    | "close_failed";
  data?: string;
  error_msg?: string;
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
