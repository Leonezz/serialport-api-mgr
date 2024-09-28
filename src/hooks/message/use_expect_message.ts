// import { listenTauriEvent } from "@/bridge/rust_events";
// import { UnlistenFn } from "@tauri-apps/api/event";
// import { useAsyncEffect, useSet } from "ahooks";
// import { useEffect, useState } from "react";

// const useExpectMessage = ({ port_name }: { port_name: string }) => {
//   const [receivedData, setReceivedData] = useState<number[]>();
//   const [unlistenFns, { add: addUnlistenFn, remove: removeUnlistenFn }] =
//     useSet<Promise<UnlistenFn>>();
//   const waitMessage = (message_data: number[]) => {
//     return new Promise<void>((rej, rsv) => {
//       setReceivedData(undefined);
//       const unlisten = listenTauriEvent("port_read", (payload) => {
//         if (payload.port_name === port_name) {
//           setReceivedData(payload.event.ReadFinished);
//         }
//       });
//       addUnlistenFn(unlisten);

//       if (JSON.stringify(receivedData) === JSON.stringify(message_data)) {
//         rsv();
//       } else if (receivedData !== undefined) {
//         rej();
//       }
//     });
//   };
//   useAsyncEffect(async () => {
//     return unlistenFns.forEach(async (fn) => await fn.then((v) => v()));
//   }, []);
//   return { receivedData, waitMessage };
// };

// export { useExpectMessage };
