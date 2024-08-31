"use client";
import useSerialportStatus from "@/hooks/store/usePortStatus";
import { listen, Event, UnlistenFn } from "@tauri-apps/api/event";
import { useEffect } from "react";
import { Buffer } from "buffer";
import { INFO } from "./logging";
import useAvaliablePorts from "@/hooks/commands/useAvaliablePorts";
type TauriSerialEvents = {
  port_name: string;
};

type TauriEvnts = {
  port_closed: {} & TauriSerialEvents;
  port_opened: {} & TauriSerialEvents;
  port_wrote: { event: { WriteFinished: number[] } } & TauriSerialEvents;
  port_read: { event: { ReadFinished: number[] } } & TauriSerialEvents;
};

const listenTauriEvent = async <Name extends keyof TauriEvnts>(
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
  const { reviceMessage, sendMessage } = useSerialportStatus();
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
        port_wrote({ port_name: port_name, event: event });
        sendMessage({
          port_name: port_name,
          data: Buffer.from(event.WriteFinished),
        });
        refresh();
      })
    );

    events.push(
      listenTauriEvent("port_read", ({ port_name, event }) => {
        port_read({ port_name: port_name, event: event });
        reviceMessage({
          port_name: port_name,
          data: Buffer.from(event.ReadFinished),
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
