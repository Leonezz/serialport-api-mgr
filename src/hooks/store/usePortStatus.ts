import { SerialPortStatus } from "@/types/serialport/serialport_status";
import { create } from "zustand";
import { mountStoreDevtool } from "simple-zustand-devtools";
import { v7 as uuid } from "uuid";
import { DateTime } from "luxon";
export type MessageType = {
  id: string;
  status:
    | "received"
    | "sent"
    | "pending"
    | "sending"
    | "failed"
    | "inactive"
    | "waiting";
  sender: "Local" | "Remote";
  time: DateTime;
  data: Buffer;
  expectedMessage?: string;
  order?: number;
  error?: string;
};

type SerialportStatusStore = {
  data: Map<
    string,
    {
      info: SerialPortStatus;
      messages: Map<string, MessageType>;
    }
  >;
};

type SerialportStatusStoreActions = {
  updateAvaliablePorts: (props: { ports: SerialPortStatus[] }) => void;
  getPortStatusByName: (props: {
    port_name: string;
  }) => SerialPortStatus | undefined;
  sendMessage: (props: { port_name: string; data: Buffer; id: string }) => void;
  messageSent: (props: {
    port_name: string;
    data: Buffer;
    message_id: string;
  }) => void;
  messageSending: (props: {
    port_name: string;
    data: Buffer;
    message_id: string;
  }) => void;
  messageSendFailed: (props: {
    port_name: string;
    data: Buffer;
    message_id: string;
    error_msg: string;
  }) => void;
  receiveMessage: (props: { port_name: string; data: Buffer }) => void;
  getPortMessageList: (props: { port_name: string }) => MessageType[];
  portOpened: (props: { port_name: string }) => void;
  portClosed: (props: { port_name: string }) => void;
  getPortOpened: (props: { port_name: string }) => boolean;
  getOpenedPorts: () => string[];
};

const useSerialportStatus = create<
  SerialportStatusStore & SerialportStatusStoreActions
>((set, get) => ({
  data: new Map(),

  updateAvaliablePorts: ({ ports }) =>
    set((prev) => {
      for (const info of ports) {
        const prevInfo = prev.data.get(info.port_name);
        prev.data.set(info.port_name, {
          info: info,
          messages: prevInfo?.messages || new Map(),
        });
      }
      return { data: prev.data };
    }),
  getPortStatusByName: ({ port_name }): SerialPortStatus | undefined => {
    const res = get().data.get(port_name);
    return res?.info;
  },
  sendMessage: ({ port_name, data, id }) =>
    set((prev) => {
      console.log(`${port_name} - ${data}`);
      const currentState = prev.data.get(port_name);
      console.log(`current state: ${currentState}`);
      if (!currentState) {
        return { data: prev.data };
      }
      currentState.messages.set(id, {
        id: id,
        status: "pending",
        sender: "Local",
        time: DateTime.now(),
        data: data,
      });
      prev.data.set(port_name, currentState);
      return {
        data: prev.data,
      };
    }),
  messageSending: ({ port_name, message_id }) => {
    set((prev) => {
      console.log(`${port_name} message ${message_id} sending`);
      const currentState = prev.data.get(port_name);
      const message = currentState?.messages.get(message_id);
      if (!currentState || !message) {
        return { data: prev.data };
      }
      return {
        data: prev.data.set(port_name, {
          ...currentState,
          messages: currentState.messages.set(message_id, {
            ...message,
            status: "sending",
            time: DateTime.now(),
          }),
        }),
      };
    });
  },
  messageSent: ({ port_name, message_id, data }) => {
    set((prev) => {
      console.log(
        `${port_name} successfully sent a message, id: ${message_id}`
      );
      const currentState = prev.data.get(port_name);
      const message = currentState?.messages.get(message_id);
      if (!currentState || !message) {
        return { data: prev.data };
      }
      return {
        data: prev.data.set(port_name, {
          ...currentState,
          messages: currentState.messages.set(message_id, {
            ...message,
            data: data,
            status: "sent",
            time: DateTime.now(),
          }),
        }),
      };
    });
  },
  messageSendFailed: ({ port_name, message_id, data, error_msg }) => {
    set((prev) => {
      console.error(`${port_name} send message ${message_id} failed`);
      const currentState = prev.data.get(port_name);
      const message = currentState?.messages.get(message_id);
      if (!currentState || !message) {
        return { data: prev.data };
      }

      return {
        data: prev.data.set(port_name, {
          ...currentState,
          messages: currentState.messages.set(message_id, {
            ...message,
            status: "failed",
            data: data,
            time: DateTime.now(),
            error: error_msg,
          }),
        }),
      };
    });
  },
  receiveMessage: ({ port_name: portName, data: content }) =>
    set((prev) => {
      const currentState = prev.data.get(portName);
      if (!currentState) {
        return { data: prev.data };
      }
      const messageId = uuid();
      currentState.messages.set(messageId, {
        id: messageId,
        status: "received",
        sender: "Remote",
        time: DateTime.now(),
        data: content,
      });
      prev.data.set(portName, currentState);
      return {
        data: prev.data,
      };
    }),
  getPortMessageList: ({ port_name: portName }) => {
    const portState = get().data.get(portName);
    if (!portState) {
      return [];
    }
    return [...portState.messages.values()];
  },

  portOpened: ({ port_name: portName }) =>
    set((prev) => {
      const currentState = prev.data.get(portName);
      if (!currentState) {
        return { data: prev.data };
      }
      currentState.info.port_status = {
        Opened: {
          baud_rate: 0,
          flow_control: "None",
          data_bits: "Eight",
          stop_bits: "One",
          parity: "None",
          carrire_detect: false,
          clear_to_send: false,
          data_set_ready: false,
          ring_indicator: false,
          read_timeout: 0,
          write_timeout: 0,
        },
      };
      prev.data.set(portName, currentState);
      return {
        data: prev.data,
      };
    }),
  portClosed: ({ port_name: portName }) =>
    set((prev) => {
      const currentState = prev.data.get(portName);
      if (!currentState) {
        return { data: prev.data };
      }
      currentState.info.port_status = "Closed";
      prev.data.set(portName, currentState);
      return {
        data: prev.data,
      };
    }),
  getPortOpened: ({ port_name: portName }) => {
    const state = get().data;
    const portState = state.get(portName);
    if (!portState) {
      return false;
    }
    return portState.info.port_status !== "Closed";
  },
  getOpenedPorts: () => {
    const state = get().data;
    return [...state.entries()]
      .filter(([_, info]) => info.info.port_status !== "Closed")
      .map(([portName, _]) => portName);
  },
}));

if (import.meta.env.DEV) {
  mountStoreDevtool("serialport_status", useSerialportStatus);
}

export { useSerialportStatus };
