import { CheckSumOptions } from "./checksum";
import { CRLFOptions } from "./crlf";
import { TextEncodingOptions } from "./encoding";
import { ViewModeOptions } from "./view_mode";

export type MessageConfigType<T extends keyof typeof MessageMetaOptions> =
  (typeof MessageMetaOptions)[T][number];

export type MessageMetaType = {
  viewMode: MessageConfigType<"viewMode">;
  crlf: MessageConfigType<"crlf">;
  textEncoding: MessageConfigType<"textEncoding">;
  checkSum: MessageConfigType<"checkSum">;
};

export const DEFAULTMessageConfig: MessageMetaType = {
  viewMode: "Text",
  crlf: "CRLF",
  textEncoding: "utf-8",
  checkSum: "None",
};

export const MessageMetaOptions = {
  viewMode: ViewModeOptions,
  crlf: CRLFOptions,
  textEncoding: TextEncodingOptions,
  checkSum: CheckSumOptions,
} as const;
