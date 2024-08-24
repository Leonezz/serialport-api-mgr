import { CheckSumType } from "./checksum";
import { CRLFOptionsType } from "./crlf";
import { TextEncodingType } from "./encoding";
import { ViewModeType } from "./view_mode";

export type MessageMetaType = {
  viewMode: ViewModeType;
  crlf: CRLFOptionsType;
  textEncoding: TextEncodingType;
  checksum: CheckSumType;
};
