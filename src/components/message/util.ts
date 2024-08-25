import { MessageMetaType } from "@/types/message/message_meta";
import { Buffer } from "buffer";

const decodeSerialData = (
  viewMode: MessageMetaType["viewMode"],
  textEncoding = "utf-8",
  data: Buffer
) => {
  switch (viewMode) {
    case "Text": {
      const textDecoder = new TextDecoder(textEncoding);
      return textDecoder.decode(data);
    }
    case "Hex": {
      return data.reduce(
        (str, byte) => str + byte.toString(16).padStart(4, "0x") + " ",
        ""
      );
    }
    case "Bin": {
      return data.reduce(
        (str, byte) => str + byte.toString(2).padStart(8, "0") + " ",
        ""
      );
    }
  }
};

export default decodeSerialData;
