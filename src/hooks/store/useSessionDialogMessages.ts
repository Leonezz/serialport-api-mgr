import { create } from "zustand";
import { MessageType } from "./usePortStatus";
import { SerialportConversation } from "@/types/conversation";
import { v7 as uuid } from "uuid";
import { MessageMetaConfig } from "@/types/message/message_meta";
import { Buffer } from "buffer";
import { mountStoreDevtool } from "simple-zustand-devtools";

const makeSessionMessageFromApi = (api: SerialportConversation) => {
  return [
    {
      id: uuid(),
      status: "inactive",
      sender: "Local",
      time: new Date(),
      data: Buffer.from(api.request),
      order: 1,
    },
    {
      id: uuid(),
      status: "inactive",
      sender: "Remote",
      time: new Date(),
      data: Buffer.from(api.response),
      expectedData: Buffer.from(api.response),
      order: 2,
    },
  ] satisfies MessageType[];
};

type SessionDialog = {
  session_id: string;
  port_name: string;
  message_meta: MessageMetaConfig;
  messages: MessageType[];
};

type SessionDialogStore = {
  data: Map<string, SessionDialog>;
};

type SessionDialogStoreActions = {
  getMessagesBySessionId: (id: string) => SessionDialog | undefined;
  addSession: ({}: {
    port_name: string;
    messages: SerialportConversation;
    message_meta: MessageMetaConfig;
  }) => SessionDialog;
  removeSession: ({}: { session_id: string }) => void;
  setPortName: ({}: { sessionId: string; portName: string }) => void;
  query: ({}: { port_name: string }) => SessionDialog | undefined;
  sendMessage: ({}: { port_name: string; message_id: string }) => void;
  messageSending: ({}: { port_name: string; message_id: string }) => void;
  messageSent: ({}: { port_name: string; message_id: string }) => void;
  messageSendFailed: ({}: { port_name: string; message_id: string }) => void;
  receiveMessage: ({}: { port_name: string; data: Buffer }) => void;
};

const useSessionDialogStore = create<
  SessionDialogStore & SessionDialogStoreActions
>((set, get) => ({
  data: new Map(),
  getMessagesBySessionId: (id) => {
    return get().data.get(id);
  },
  addSession: ({ port_name, messages, message_meta }) => {
    const id = uuid();
    const newValue = {
      session_id: id,
      port_name: port_name,
      message_meta: message_meta,
      messages: makeSessionMessageFromApi(messages),
    };
    set((prev) => ({
      data: prev.data.set(id, newValue),
    }));
    return newValue;
  },
  removeSession: ({ session_id }) => {
    set((prev) => {
      prev.data.delete(session_id);
      return { data: prev.data };
    });
  },
  setPortName: ({ sessionId, portName }) => {
    const currentValue = get().data.get(sessionId);
    if (!currentValue) {
      return;
    }
    set((prev) => ({
      data: prev.data.set(sessionId, {
        ...currentValue,
        port_name: portName,
      }),
    }));
  },
  query: ({ port_name }) => {
    return [...get().data.entries()]
      .filter(([_, value]) => value.port_name === port_name)
      .at(0)?.[1];
  },
  sendMessage: ({ port_name, message_id }) => {
    const currentValue = get().query({ port_name: port_name });
    console.log(currentValue, message_id);
    if (!currentValue) {
      return;
    }
    const messages = currentValue.messages.map((v) => {
      if (v.id === message_id) {
        return {
          ...v,
          status: "pending",
          time: new Date(),
        } satisfies MessageType;
      }
      return v;
    });
    set((prev) => ({
      data: prev.data.set(currentValue.session_id, {
        ...currentValue,
        messages: messages,
      }),
    }));
  },
  messageSending: ({ port_name, message_id }) => {
    const currentValue = get().query({ port_name: port_name });
    if (!currentValue) {
      return;
    }
    const messages = currentValue.messages.map((v) => {
      if (v.id === message_id) {
        return {
          ...v,
          status: "sending",
          time: new Date(),
        } satisfies MessageType;
      }
      return v;
    });
    set((prev) => ({
      data: prev.data.set(currentValue.session_id, {
        ...currentValue,
        messages: messages,
      }),
    }));
  },
  messageSent: ({ port_name, message_id }) => {
    const currentValue = get().query({ port_name: port_name });
    if (!currentValue) {
      return;
    }
    const messages = currentValue.messages.map((v) => {
      if (v.id === message_id) {
        return { ...v, status: "sent", time: new Date() } satisfies MessageType;
      }
      return v;
    });
    set((prev) => ({
      data: prev.data.set(currentValue.session_id, {
        ...currentValue,
        messages: messages,
      }),
    }));
  },
  messageSendFailed: ({ port_name, message_id }) => {
    const currentValue = get().query({ port_name: port_name });
    if (!currentValue) {
      return;
    }
    const messages = currentValue.messages.map((v) => {
      if (v.id === message_id) {
        return {
          ...v,
          status: "failed",
          time: new Date(),
        } satisfies MessageType;
      }
      return v;
    });
    set((prev) => ({
      data: prev.data.set(currentValue.session_id, {
        ...currentValue,
        messages: messages,
      }),
    }));
  },
  receiveMessage: ({ port_name, data }) => {
    const currentValue = get().query({ port_name: port_name });
    if (!currentValue) {
      return;
    }
    const curMessages = currentValue.messages;
    const curMessageIdx = curMessages.findIndex(
      (v) => v.sender === "Remote" && v.status !== "received"
    );
    if (curMessageIdx === -1) {
      return;
    }
    const messages = curMessages.map((v, idx) => {
      if (idx === curMessageIdx) {
        const valueMatch =
          JSON.stringify(v.expectedData) === JSON.stringify(data);
        return {
          ...v,
          status: valueMatch ? "received" : "failed",
          data: data,
          error: valueMatch ? undefined : "value not match",
        } satisfies MessageType;
      }
      return v;
    });
    set((prev) => ({
      data: prev.data.set(currentValue.session_id, {
        ...currentValue,
        messages: messages,
      }),
    }));
  },
}));

if (import.meta.env.DEV) {
  mountStoreDevtool("namedSessionDialogStore", useSessionDialogStore);
}

export { useSessionDialogStore };
