export type SerialportConversation = {
  request: ConversationMessageType;
  response: ConversationMessageType;
};

type ConversationMessageType = {
  mode: "text" | "script";
  text: string;
  script: string;
};
