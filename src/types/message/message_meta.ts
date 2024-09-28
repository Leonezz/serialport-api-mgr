// import { NamedConfigStoreType } from "@/util/store_types";
import decodeSerialData from "@/components/message/util";
import { CheckSumOptions } from "./checksum";
import { CRLFOptions, splitMessageByCRLF } from "./crlf";
import { TextEncodingOptions } from "./encoding";
import { ViewModeOptions } from "./view_mode";

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
}: MessageMetaConfig) => {
  return (message: Buffer) => {
    const str = decodeSerialData(view_mode, text_encoding, message);
    return splitMessageByCRLF({ message: str, crlfMode: crlf });
  };
};
