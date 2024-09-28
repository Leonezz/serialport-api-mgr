// import { SerialportConversation } from "@/types/conversation";
// import { MessageMetaConfig } from "@/types/message/message_meta";
// import { SerialportConfig } from "@/types/serialport/serialport_config";
// import { useCallback, useState } from "react";
// import { MessageType } from "../store/usePortStatus";
// import { v7 as uuid } from "uuid";
// import { useUpdateEffect } from "ahooks";
// import { useSendMessageAwaitable } from "../message/use_send_message";
// import { useExpectMessage } from "../message/use_expect_message";

// const useDialogSession = ({
//   messageMetaConfig,
//   serialportConfig,
//   expectedDialog,
// }: {
//   messageMetaConfig: MessageMetaConfig;
//   serialportConfig: SerialportConfig;
//   expectedDialog: SerialportConversation;
// }) => {
//   const makeMessagesFromApi = useCallback(
//     (): MessageType[] =>
//       [
//         {
//           id: uuid(),
//           status: "pending",
//           sender: "Local",
//           time: new Date(),
//           data: Buffer.from(expectedDialog.request),
//         },
//         {
//           id: uuid(),
//           status: "pending",
//           sender: "Remote",
//           time: new Date(),
//           data: Buffer.from(expectedDialog.response),
//           expectedData: Buffer.from(expectedDialog.response),
//         },
//       ] satisfies MessageType[],
//     [expectedDialog]
//   );
//   const [expectedMessages, setExpectedMessages] = useState(makeMessagesFromApi);

//   useUpdateEffect(() => {
//     setExpectedMessages(makeMessagesFromApi);
//   }, [makeMessagesFromApi]);

//   const setMessageStatus = ({
//     idx,
//     status,
//   }: {
//     idx: number;
//     status: MessageType["status"];
//   }) => {
//     setExpectedMessages((prev) => {
//       if (prev.length <= idx) {
//         return prev;
//       }
//       prev[idx].status = status;
//       return [...prev];
//     });
//   };

//   const setReceiveFailedMessage = ({
//     idx,
//     realMessage,
//   }: {
//     idx: number;
//     realMessage: number[];
//   }) => {
//     setExpectedMessages((prev) => {
//       if (prev.length <= idx || prev[idx].sender !== "Remote") {
//         return prev;
//       }
//       prev[idx].data = Buffer.from(realMessage);
//       return [...prev];
//     });
//   };

//   const { sendMessageToSerialport } =
//     useSendMessageAwaitable(messageMetaConfig);
//   const { receivedData, waitMessage } = useExpectMessage({
//     port_name: serialportConfig.port_name,
//   });

//   const runSession = () => {
//     console.log("run session");
//     return expectedMessages.reduce((prev: Promise<void>, cur, idx) => {
//       console.log("step " + idx);
//       return prev
//         .then(() => {
//           console.log(cur);
//           if (cur.sender === "Local") {
//             return sendMessageToSerialport({
//               port_name: serialportConfig.port_name,
//               data: [...cur.data],
//             })
//               .then(() => setMessageStatus({ idx: idx, status: "sent" }))
//               .catch(() => setMessageStatus({ idx: idx, status: "failed" }));
//           } else {
//             return waitMessage([...cur.data])
//               .then(() => setMessageStatus({ idx: idx, status: "received" }))
//               .catch(() => {
//                 setMessageStatus({ idx: idx, status: "failed" });
//                 setReceiveFailedMessage({
//                   idx: idx,
//                   realMessage: receivedData || [],
//                 });
//               });
//           }
//         })
//         .catch(() => new Promise<void>((rsv, rej) => rej()))
//         .finally(() => new Promise<void>((rsv, rej) => rej()));
//     }, new Promise<void>((rsv, rej) => rsv()));
//   };

//   return { messages: expectedMessages, runSession };
// };

// export { useDialogSession };
