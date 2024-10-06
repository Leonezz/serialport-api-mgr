// import { NamedConfigStoreType } from "@/util/store_types";
import decodeSerialData from "@/components/message/util";
import { CheckSumOptions, getCrcBytes } from "./checksum";
import { CRLFOptions, splitMessageByCRLF } from "./crlf";
import { TextEncodingOptions } from "./encoding";
import { ViewModeOptions } from "./view_mode";
import { checkSumVerifyMessage } from "@/util/checksum";
import { dropRight } from "es-toolkit";
import { Buffer } from "buffer";

export type MessageMetaConfigFields<T extends keyof typeof MessageMetaOptions> =
  (typeof MessageMetaOptions)[T][number];

export type MessageMetaConfig = {
  view_mode: MessageMetaConfigFields<"view_mode">;
  crlf: MessageMetaConfigFields<"crlf">;
  text_encoding: MessageMetaConfigFields<"text_encoding">;
  check_sum: MessageMetaConfigFields<"check_sum">;
};

// export type NamedMessageMetaConfig = NamedConfigStoreType<MessageMetaConfig>;

export const DEFAULTMessageConfig: MessageMetaConfig = {
  check_sum: "None",
  crlf: "CRLF",
  text_encoding: "utf-8",
  view_mode: "Text",
};

export const MessageMetaOptions = {
  check_sum: CheckSumOptions,
  crlf: CRLFOptions,
  text_encoding: TextEncodingOptions,
  view_mode: ViewModeOptions,
} as const;

export const getMessageDecoder = ({
  check_sum,
  crlf,
  text_encoding,
  view_mode,
}: MessageMetaConfig) => {
  return (message: Buffer) => {
    const checkSumSuccess = checkSumVerifyMessage({
      check_sum: check_sum,
      message: message,
    });
    if (!checkSumSuccess) {
      return undefined;
    }
    const checkSumBytes = getCrcBytes(check_sum);
    message = Buffer.from(dropRight([...message], checkSumBytes));
    const str = decodeSerialData({
      viewMode: view_mode,
      textEncoding: text_encoding,
      data: message,
    });
    return splitMessageByCRLF({ message: str, crlfMode: crlf });
  };
};
