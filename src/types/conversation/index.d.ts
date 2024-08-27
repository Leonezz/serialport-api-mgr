import { MessageMetaConfig } from "../message/message_meta";

type SerialPortReq = {
  //REVIEW - should the message meta be the same for req and res?
  message_meta: MessageMetaConfig;
  req_message: number[];
};

type SerialPortRes = {
  message_meta: MessageMetaConfig;
  //TODO - move expected check to a script
  expect_message: number[];
};

type SerialPortConversationId = string;
type SerialPortConversation = {
  id: SerialPortConversationId;
  req?: SerialPortReq;
  res?: SerialPortRes;
};

export type SerialPortCompleteConversation = SerialPortConversation[];
