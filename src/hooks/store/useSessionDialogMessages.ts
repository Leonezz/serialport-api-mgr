import { create } from "zustand";
import { MessageType } from "./usePortStatus";
import { SerialportConversation } from "@/types/conversation";
import { v7 as uuid } from "uuid";
import { MessageMetaConfig } from "@/types/message/message_meta";
import { Buffer } from "buffer";
import { mountStoreDevtool } from "simple-zustand-devtools";
import {
  getRequestMessage,
  verifyResponse,
} from "@/types/conversation/default";
import { DateTime } from "luxon";

type SessionDialogMessageType = (
  | {
      sender: "Remote";
      verifyMode: "text" | "script";
      verifyText: string;
      verifyScript: string;
    }
  | { sender: "Local" }
) &
  MessageType;

const makeSessionMessageFromApi = ({
  api,
  message,
}: {
  api: SerialportConversation;
  message?: string;
}) => {
  return [
    {
      id: uuid(),
      status: "inactive",
      sender: "Local",
      time: DateTime.now(),
      data: Buffer.from([]),
      expectedMessage: getRequestMessage({ ...api.request, message: message }),
      order: 1,
    },
    {
      id: uuid(),
      status: "inactive",
      sender: "Remote",
      time: DateTime.now(),
      data: Buffer.from([]),
      expectedMessage:
        api.response.mode === "script"
          ? "[VERIFY BY SCRIPT]"
          : api.response.text,
      order: 2,
      verifyMode: api.response.mode,
      verifyText: api.response.text,
      verifyScript: api.response.script,
    },
  ] satisfies SessionDialogMessageType[];
};

type SessionDialog = {
  session_id: string;
  port_name: string;
  message_meta: MessageMetaConfig;
  messages: SessionDialogMessageType[];
};

type SessionDialogStore = {
  data: Map<string, SessionDialog>;
};

type SessionDialogStoreActions = {
  getMessagesBySessionId: (id: string) => SessionDialog | undefined;
  setSession: ({}: {
    id?: string;
    message?: string;
    port_name: string;
    messages: SerialportConversation;
    message_meta: MessageMetaConfig;
  }) => SessionDialog;
  removeSession: ({}: { session_id: string }) => void;
  resetSession: ({}: { session_id: string }) => void;
  setPortName: ({}: { sessionId: string; portName: string }) => void;
  query: ({}: { port_name: string }) => SessionDialog | undefined;
  sendMessage: ({}: {
    data: Buffer;
    port_name: string;
    message_id: string;
  }) => void;
  messageSending: ({}: {
    data: Buffer;
    port_name: string;
    message_id: string;
  }) => void;
  messageSent: ({}: {
    data: Buffer;
    port_name: string;
    message_id: string;
  }) => void;
  messageSendFailed: ({}: {
    data: Buffer;
    port_name: string;
    message_id: string;
  }) => void;
  receiveMessage: ({}: { port_name: string; data: Buffer }) => void;
};

const useSessionDialogStore = create<
  SessionDialogStore & SessionDialogStoreActions
>((set, get) => ({
  data: new Map(),
  getMessagesBySessionId: (id) => {
    return get().data.get(id);
  },
  setSession: ({ id, message, port_name, messages, message_meta }) => {
    id = id === undefined ? uuid() : id;
    const newValue = {
      session_id: id,
      port_name: port_name,
      message_meta: message_meta,
      messages: makeSessionMessageFromApi({ api: messages, message: message }),
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
  resetSession: ({ session_id }) => {
    const currentValue = get().data.get(session_id);
    if (!currentValue) {
      return;
    }
    set((prev) => ({
      data: prev.data.set(session_id, {
        ...currentValue,
        messages: currentValue.messages.map((v) => ({
          ...v,
          data: Buffer.from([]),
          time: DateTime.now(),
          status: "inactive",
        })),
      }),
    }));
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
  sendMessage: ({ port_name, message_id, data }) => {
    const currentValue = get().query({ port_name: port_name });
    console.log(data);
    if (!currentValue) {
      return;
    }
    const messages = currentValue.messages.map((v) => {
      if (v.id === message_id) {
        return {
          ...v,
          status: "pending",
          data: data,
          time: DateTime.now(),
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
  messageSending: ({ port_name, message_id, data }) => {
    const currentValue = get().query({ port_name: port_name });
    if (!currentValue) {
      return;
    }
    const messages = currentValue.messages.map((v) => {
      if (v.id === message_id) {
        return {
          ...v,
          status: "sending",
          data: data,
          time: DateTime.now(),
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
  messageSent: ({ port_name, message_id, data }) => {
    const currentValue = get().query({ port_name: port_name });
    if (!currentValue) {
      return;
    }
    const messages = currentValue.messages
      .map((v) => {
        if (v.id === message_id) {
          return {
            ...v,
            status: "sent",
            data: data,
            time: DateTime.now(),
          } satisfies MessageType;
        }
        return v;
      })
      .map((v, idx, arr) => {
        const prev = arr.at(idx - 1);
        if (
          prev &&
          (prev.status === "received" || prev.status === "sent") &&
          v.sender === "Remote" &&
          v.status === "inactive"
        ) {
          return {
            ...v,
            time: DateTime.now(),
            status: "waiting",
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
  messageSendFailed: ({ port_name, message_id, data }) => {
    const currentValue = get().query({ port_name: port_name });
    if (!currentValue) {
      return;
    }
    const messages = currentValue.messages.map((v) => {
      if (v.id === message_id) {
        return {
          ...v,
          status: "failed",
          data: data,
          time: DateTime.now(),
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

    const messages = curMessages
      .map((v, idx) => {
        if (idx === curMessageIdx && v.sender === "Remote") {
          try {
            const verified = verifyResponse({
              mode: v.verifyMode,
              text: v.verifyText,
              script: v.verifyScript,
              response: data,
              ...currentValue.message_meta,
            });
            return {
              ...v,
              status: verified ? "received" : "failed",
              data: data,
              error: verified ? undefined : "value not match",
            } satisfies SessionDialogMessageType;
          } catch {
            return {
              ...v,
              status: "failed",
              data: data,
              error: "run verify script failed",
            } satisfies SessionDialogMessageType;
          }
        }
        return v;
      })
      .map((v, idx, arr) => {
        const prev = arr.at(idx - 1);
        if (
          prev &&
          (prev.status === "received" || prev.status === "sent") &&
          v.sender === "Remote" &&
          v.status === "inactive"
        ) {
          return {
            ...v,
            time: DateTime.now(),
            status: "waiting",
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
