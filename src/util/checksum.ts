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

const crcNone = (_: Buffer) => [];

export const getSumCheckSigner = ({
  checkSum,
}: {
  checkSum: MessageMetaType["checkSum"];
}) => {
  const crcFunc = checkSum === "None" ? crcNone : crc[checkSum];
  return (data: number[]) => [
    ...data,
    ...encodeHexToBuffer(crcFunc(Buffer.from(data)).toString(16)),
  ];
};

