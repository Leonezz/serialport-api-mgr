import { decode } from "punycode";
import { ViewModeType } from "../serialport/msg_input_toolbar";
import { Buffer } from "buffer";

export const TextEncodingOptions = [
  "utf-8",
  "gbk",
  "gb18030",
  "big5",
  "euc-jp",
  "iso-2022-jp",
  "shift-jis",
  "euc-kr",
  "utf-16be",
  "utf-16le",
  "replacement ",
  "ISO-2022-CN",
  "ISO-2022-CN-ext",
  "iso-2022-kr",
  "hz-gb-2312",
  "ibm866",
  "iso-8859-2",
  "iso-8859-3",
  "iso-8859-4",
  "iso-8859-5",
  "iso-8859-6",
  "iso-8859-7",
  "iso-8859-8",
  "iso-8859-8i",
  "iso-8859-10",
  "iso-8859-13",
  "iso-8859-14",
  "iso-8859-15",
  "iso-8859-16",
  "koi8-r",
  "koi8-u",
  "macintosh",
  "windows-874",
  "windows-1250",
  "windows-1251",
  "windows-1252",
  "windows-1253",
  "windows-1254",
  "windows-1255",
  "windows-1256",
  "windows-1257",
  "windows-1258",
  "x-mac-cyrillic",
] as const;

export type TextEncodingType = (typeof TextEncodingOptions)[number];

const decodeSerialData = (
  viewMode: ViewModeType,
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
