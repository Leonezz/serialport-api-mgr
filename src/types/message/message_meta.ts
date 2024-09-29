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
  view_mode: "Text",
  crlf: "CRLF",
  text_encoding: "utf-8",
  check_sum: "None",
};

export const MessageMetaOptions = {
  view_mode: ViewModeOptions,
  crlf: CRLFOptions,
  text_encoding: TextEncodingOptions,
  check_sum: CheckSumOptions,
} as const;

export const getMessageDecoder = ({
  view_mode,
  text_encoding,
  crlf,
  check_sum,
}: MessageMetaConfig) => {
  return (message: Buffer) => {
    const checkSumSuccess = checkSumVerifyMessage({
      message: message,
      check_sum: check_sum,
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
