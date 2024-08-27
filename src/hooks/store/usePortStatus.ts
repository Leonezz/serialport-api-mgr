import { SerialPortStatus } from "@/types/serialport/serialport_status";
import { create } from "zustand";
export type MessageType = {
  sender: "Local" | "Remote";
  time: Date;
  data: Buffer;
};

type SerialportStatusStore = {
  data: Map<
    string,
    {
      info: SerialPortStatus;
      messages: MessageType[];
    }
  >;
};

type SerialportStatusStoreActions = {
  updateAvaliablePorts: (props: { ports: SerialPortStatus[] }) => void;
  getPortStatusByName: (props: { port_name: string }) => SerialPortStatus | undefined;
  sendMessage: (props: { port_name: string; data: Buffer }) => void;
  reviceMessage: (props: { port_name: string; data: Buffer }) => void;
  getPortMessageList: (props: { port_name: string }) => MessageType[];
  portOpened: (props: { port_name: string }) => void;
  portClosed: (props: { port_name: string }) => void;
  getPortOpened: (props: { port_name: string }) => boolean;
  getOpenedPorts: () => string[];
};

const useSerialportStatus = create<SerialportStatusStore & SerialportStatusStoreActions>((set, get) => ({
  data: new Map(),

  updateAvaliablePorts: ({ ports }) =>
    set((prev) => {
      for (const info of ports) {
        const prevInfo = prev.data.get(info.port_name);
        prev.data.set(info.port_name, {
          info: info,
          messages: prevInfo?.messages || [],
        });
      }
      return { data: prev.data };
    }),
  getPortStatusByName: ({port_name}): SerialPortStatus | undefined => {
    const res = get().data.get(port_name);
    return res?.info;
  },
  sendMessage: ({ port_name, data }) =>
    set((prev) => {
      console.log(`${port_name} - ${data}`);
      const currentState = prev.data.get(port_name);
      console.log(`current state: ${currentState}`);
      if (!currentState) {
        return { data: prev.data };
      }
      currentState.messages.push({
        sender: "Local",
        time: new Date(),
        data: data,
      });
      prev.data.set(port_name, currentState);
      return {
        data: prev.data,
      };
    }),
  reviceMessage: ({ port_name: portName, data: content }) =>
    set((prev) => {
      const currentState = prev.data.get(portName);
      if (!currentState) {
        return { data: prev.data };
      }
      currentState.messages.push({
        sender: "Remote",
        time: new Date(),
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
    return portState.messages;
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
          write_timeout: 0
        }
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

export default useSerialportStatus;
