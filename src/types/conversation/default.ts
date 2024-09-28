import { ConversationMessageType, SerialportConversation } from ".";
import { getMessageDecoder, MessageMetaConfig } from "../message/message_meta";

const INITIAL_REQUEST_SCRIPT = `\
// The function takes a string as argument
// and returns a string
//NOTE - DO NOT EDIT THE FIRST AND LAST LINES
//NOTE - THE FUNCTION BODY SHOULD RETURN A STRING
const processRequest = () => {
  // ...write your function body here
  return "request";
}
`;

const INITIAL_RESPONSE_SCRIPT = `\
// The function takes a string as argument
// and returns a boolean
//NOTE - DO NOT EDIT THE FIRST AND LAST LINES
//NOTE - THE FUNCTION BODY SHOULD RETURN A BOOLEAN
const verifyResponse = (response) => {
  // ...write your function body here
  return true;
}
`;

export const DEFAULTSerialportConversation: SerialportConversation = {
  request: { mode: "text", text: "resqust", script: INITIAL_REQUEST_SCRIPT },
  response: {
    mode: "text",
    text: "response",
    script: INITIAL_RESPONSE_SCRIPT,
  },
};

const getScriptContent = (scriptContent: string) => {
  const lines = scriptContent.split("\n").filter((v) => v.length > 0);
  const startIdx = lines.findIndex((v) => !v.startsWith("//"));
  return lines.slice(startIdx + 1, lines.length - 1).join("\n");
};

export const getRequestMessage = ({
  mode: type,
  text: content,
  script,
}: ConversationMessageType): string => {
  if (type === "text") {
    return content;
  }
  try {
    const messageBuilder = new Function(getScriptContent(script));
    return messageBuilder();
  } catch {
    throw "run request script failed";
  }
};

export const verifyResponse = ({
  mode,
  text,
  script,
  response,
  ...messageMeta
}: ConversationMessageType & {
  response: Buffer;
} & MessageMetaConfig): boolean => {
  const receivedMessage = getMessageDecoder(messageMeta)(response).join("\n");
  if (mode === "text") {
    return text === receivedMessage;
  }
  try {
    const verifier = new Function("response", getScriptContent(script));
    return verifier(receivedMessage);
  } catch {
    throw "run response script failed";
  }
};
