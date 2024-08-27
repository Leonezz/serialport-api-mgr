import { CheckSumOptions } from "./checksum";
import { CRLFOptions } from "./crlf";
import { TextEncodingOptions } from "./encoding";
import { ViewModeOptions } from "./view_mode";

export type MessageConfigType<T extends keyof typeof MessageMetaOptions> =
  (typeof MessageMetaOptions)[T][number];

export type MessageMetaType = {
  view_mode: MessageConfigType<"view_mode">;
  crlf: MessageConfigType<"crlf">;
  text_encoding: MessageConfigType<"text_encoding">;
  check_sum: MessageConfigType<"check_sum">;
};

export const DEFAULTMessageConfig: MessageMetaType = {
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
