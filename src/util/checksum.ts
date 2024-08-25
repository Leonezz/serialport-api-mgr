import { getCrcBytes } from "@/types/message/checksum";
import { MessageMetaType } from "@/types/message/message_meta";
import crc from "crc";
import { encodeHexToBuffer } from "./message";
import { Buffer } from "buffer";
import { dropRight } from "es-toolkit";

export const checkSumVerifyMessage = ({
  message,
  checkSum,
}: {
  message: Buffer;
  checkSum: MessageMetaType["checkSum"];
}) => {
  if (checkSum === "None") {
    return true;
  }
  const checkSumBytes = getCrcBytes(checkSum);
  const bytesToCheck = dropRight([...message], checkSumBytes);
  const checkSumFunc = crc[checkSum];
  const realCheckSum = checkSumFunc(Buffer.from(bytesToCheck)).toString(16);
  const messageHex = message.reduce((prev, cur) => prev + cur.toString(16), "");
  return messageHex.endsWith(realCheckSum);
};

export const checkSumMessage = ({
  message,
  checkSum,
}: {
  message: number[];
  checkSum: MessageMetaType["checkSum"];
}): number[] => {
  if (checkSum === "None") {
    return message;
  }
  const checkSumStr = crc[checkSum](Buffer.from(message)).toString(16);
  return [...message, ...encodeHexToBuffer(checkSumStr)];
};
