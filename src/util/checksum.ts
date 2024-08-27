import { getCrcBytes } from "@/types/message/checksum";
import { MessageMetaConfig } from "@/types/message/message_meta";
import crc from "crc";
import { encodeHexToBuffer } from "./message";
import { Buffer } from "buffer";
import { dropRight } from "es-toolkit";

export const checkSumVerifyMessage = ({
  message,
  check_sum,
}: {
  message: Buffer;
  check_sum: MessageMetaConfig["check_sum"];
}) => {
  if (check_sum === "None") {
    return true;
  }
  const checkSumBytes = getCrcBytes(check_sum);
  const bytesToCheck = dropRight([...message], checkSumBytes);
  const checkSumFunc = crc[check_sum];
  const realCheckSum = checkSumFunc(Buffer.from(bytesToCheck)).toString(16);
  const messageHex = message.reduce((prev, cur) => prev + cur.toString(16), "");
  return messageHex.endsWith(realCheckSum);
};

const crcNone = (_: Buffer) => [];

export const getSumCheckSigner = ({
  checkSum,
}: {
  checkSum: MessageMetaConfig["check_sum"];
}) => {
  const crcFunc = checkSum === "None" ? crcNone : crc[checkSum];
  return (data: number[]) => [
    ...data,
    ...encodeHexToBuffer(crcFunc(Buffer.from(data)).toString(16)),
  ];
};
