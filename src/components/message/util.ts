import {
  MessageMetaConfig,
  MessageMetaConfigFields,
} from "@/types/message/message_meta";
import { Buffer } from "buffer";

export const bufferToHexStr = (data: Buffer) =>
  data.reduce(
    (str, byte) => str + byte.toString(16).padStart(4, "0x") + " ",
    ""
  );

export const bufferToText = (
  data: Buffer,
  textEncoding: MessageMetaConfigFields<"text_encoding">
) => {
  const textDecoder = new TextDecoder(textEncoding);
  return textDecoder.decode(data);
};

export const bufferToBinStr = (data: Buffer) =>
  data.reduce((str, byte) => str + byte.toString(2).padStart(8, "0") + " ", "");

const decodeSerialData = ({
  data,
  textEncoding,
  viewMode,
}: {
  data: Buffer;
  textEncoding: MessageMetaConfigFields<"text_encoding">;
  viewMode: MessageMetaConfig["view_mode"];
}) => {
  switch (viewMode) {
    case "Text":
      return bufferToText(data, textEncoding);
    case "Hex": {
      return bufferToHexStr(data);
    }
    case "Bin": {
      return bufferToBinStr(data);
    }
  }
};

export default decodeSerialData;
