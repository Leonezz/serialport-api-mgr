import { SerialPortInfo } from "@/bridge/call_rust";
import { create } from "zustand";
export type MessageType = {
  sender: "Local" | "Remote";
  time: Date;
  data: Buffer;
};

type PortStatus = {
  data: Map<
    string,
    {
      info: SerialPortInfo;
      opened: boolean;
      messages: MessageType[];
    }
  >;
};

type PortStatusActions = {
  updateAvaliablePorts: (props: { ports: SerialPortInfo[] }) => void;
  sendMessage: (props: { port_name: string; data: Buffer }) => void;
  reviceMessage: (props: { port_name: string; data: Buffer }) => void;
  getPortMessageList: (props: { port_name: string }) => MessageType[];
  portOpened: (props: { port_name: string }) => void;
  portClosed: (props: { port_name: string }) => void;
  getPortOpened: (props: { port_name: string }) => boolean;
  getOpenedPorts: () => string[];
};

const usePortStatus = create<PortStatus & PortStatusActions>((set, get) => ({
  data: new Map(),

  updateAvaliablePorts: ({ ports }) =>
    set((prev) => {
      for (const info of ports) {
        if (prev.data.has(info.port_name)) {
          continue;
        }
        prev.data.set(info.port_name, {
          info: info,
          opened: false,
          messages: [],
        });
      }
      return { data: prev.data };
    }),
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
      currentState.opened = true;
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
      currentState.opened = false;
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
    return portState.opened;
  },
  getOpenedPorts: () => {
    const state = get().data;
    return [...state.entries()]
      .filter(([_, info]) => info.opened)
      .map(([portName, _]) => portName);
  },
}));

export default usePortStatus;
