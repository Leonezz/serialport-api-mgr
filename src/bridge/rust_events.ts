"use client";
import { useSerialportStatus } from "@/hooks/store/usePortStatus";
import { listen, Event, UnlistenFn } from "@tauri-apps/api/event";
import { useEffect } from "react";
import { Buffer } from "buffer";
import { INFO } from "./logging";
import useAvaliablePorts from "@/hooks/commands/useAvaliablePorts";
import { useSessionDialogStore } from "@/hooks/store/useSessionDialogMessages";
import { useSerialportLog } from "@/hooks/store/useSerialportLogStore";
type TauriSerialEvents = {
  port_name: string;
};

type TauriEvnts = {
  port_closed: {} & TauriSerialEvents;
  port_opened: {} & TauriSerialEvents;
  port_wrote: {
    event: { WriteFinished: { data: number[]; message_id: string } };
  } & TauriSerialEvents;
  port_write_sending: {
    event: {
      Writing: { data: number[]; message_id: string };
    };
  } & TauriSerialEvents;
  port_write_failed: {
    event: { WriteError: { data: number[]; error: any; message_id: string } };
  } & TauriSerialEvents;
  port_read: { event: { ReadFinished: number[] } } & TauriSerialEvents;
};

export const listenTauriEvent = async <Name extends keyof TauriEvnts>(
  name: Name,
  handler: (params: TauriEvnts[Name]) => void
) => {
  const handerWrapper = (tauriParams: Event<TauriEvnts[Name]>) => {
    handler(tauriParams.payload);
  };
  return await listen(name, handerWrapper);
};

const port_closed = (arg: TauriEvnts["port_closed"]) => {
  INFO("rust_events", `${arg} closed`);
};

const port_opened = (arg: TauriEvnts["port_opened"]) => {
  INFO("rust_events", `${arg} closed`);
};

const port_wrote = (arg: TauriEvnts["port_wrote"]) => {
  INFO("rust_events", `${arg}`);
};

const port_read = (arg: TauriEvnts["port_read"]) => {
  INFO("rust_events", `${arg}`);
};

export const useTauriEvents = () => {
  const {
    receiveMessage: reviceMessage,
    messageSent,
    messageSendFailed,
    messageSending,
  } = useSerialportStatus();
  const {
    messageSending: sessionMessageSending,
    messageSent: sessionMessageSent,
    messageSendFailed: sessionMessageSendFailed,
    receiveMessage: sessionReceiveMessage,
  } = useSessionDialogStore();
  const { appendLogItem } = useSerialportLog();
  const { refresh } = useAvaliablePorts();
  useEffect(() => {
    const events: Promise<UnlistenFn>[] = [];
    events.push(
      listenTauriEvent("port_closed", (params) => {
        port_closed({ ...params });
        refresh();
      })
    );

    events.push(
      listenTauriEvent("port_opened", (params) => {
        port_opened({ ...params });
        refresh();
      })
    );

    events.push(
      listenTauriEvent("port_wrote", ({ port_name, event }) => {
        port_wrote({
          port_name: port_name,
          event: event,
        });
        const bufferSent = Buffer.from(event.WriteFinished.data);
        messageSent({
          port_name: port_name,
          message_id: event.WriteFinished.message_id,
          data: bufferSent,
        });
        sessionMessageSent({
          port_name: port_name,
          message_id: event.WriteFinished.message_id,
          data: bufferSent,
        });
        appendLogItem({
          type: "sent",
          port_name: port_name,
          message: bufferSent,
          time: new Date(),
        });

        refresh();
      })
    );

    events.push(
      listenTauriEvent("port_write_sending", ({ event, port_name }) => {
        const bufferSending = Buffer.from(event.Writing.data);
        messageSending({
          port_name: port_name,
          message_id: event.Writing.message_id,
          data: bufferSending,
        });
        sessionMessageSending({
          port_name: port_name,
          message_id: event.Writing.message_id,
          data: bufferSending,
        });
        appendLogItem({
          type: "sending",
          message: bufferSending,
          port_name: port_name,
          time: new Date(),
        });
      })
    );

    events.push(
      listenTauriEvent("port_write_failed", ({ port_name, event }) => {
        const bufferSendFailed = Buffer.from(event.WriteError.data);
        messageSendFailed({
          port_name: port_name,
          message_id: event.WriteError.message_id,
          data: bufferSendFailed,
        });
        sessionMessageSendFailed({
          port_name: port_name,
          message_id: event.WriteError.message_id,
          data: bufferSendFailed,
        });
        appendLogItem({
          type: "send_failed",
          message: bufferSendFailed,
          port_name: port_name,
          time: new Date(),
        });
        refresh();
      })
    );

    events.push(
      listenTauriEvent("port_read", ({ port_name, event }) => {
        const bufferRead = Buffer.from(event.ReadFinished);
        port_read({ port_name: port_name, event: event });
        reviceMessage({
          port_name: port_name,
          data: bufferRead,
        });
        sessionReceiveMessage({
          port_name: port_name,
          data: bufferRead,
        });
        appendLogItem({
          type: "received",
          message: bufferRead,
          port_name: port_name,
          time: new Date(),
        });
        refresh();
      })
    );

    return () => {
      for (const fn of events) {
        fn.then((f) => f());
      }
    };
  }, []);
};
