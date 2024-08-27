// import { NamedConfigStoreType } from "@/util/store_types";
import { CheckSumOptions } from "./checksum";
import { CRLFOptions } from "./crlf";
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
