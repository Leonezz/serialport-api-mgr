import { BuildScriptRunner } from "@/components/conversation/script_tester";
import { ConversationMessageType, SerialportConversation } from ".";
import { getMessageDecoder, MessageMetaConfig } from "../message/message_meta";
import { OK, Result } from "../global";

const INITIAL_REQUEST_SCRIPT = `\
// The function takes a string as argument
// and returns a string.
//NOTE - DO NOT EDIT THE FIRST AND LAST LINES
//NOTE - THE FUNCTION BODY SHOULD RETURN A STRING
const processRequest = (message = undefined) => {
  // ...write your function body here
  const defaultMessage = "request"; //default message
  const request = message === undefined ? 
    defaultMessage : message;
  return request;
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

export const getScriptContent = (scriptContent: string) => {
  const lines = scriptContent.split("\n").filter((v) => v.length > 0);
  const startIdx = lines.findIndex((v) => !v.startsWith("//"));
  return lines.slice(startIdx + 1, lines.length - 1).join("\n");
};

export const getRequestMessage = ({
  message,
  mode: type,
  text: content,
  script,
}: ConversationMessageType & { message?: string }): Result<string> => {
  if (type === "text") {
    return OK(content);
  }
  return BuildScriptRunner<string>({
    argument: "message",
    script: getScriptContent(script),
  })(message || "");
};

export const verifyResponse = ({
  mode,
  text,
  script,
  response,
  ...messageMeta
}: ConversationMessageType & {
  response: Buffer;
} & MessageMetaConfig): Result<boolean> => {
  const receivedMessage = getMessageDecoder(messageMeta)(response)?.join("\n");
  if (receivedMessage === undefined) {
    return OK(false);
  }
  if (mode === "text") {
    return OK(text === receivedMessage);
  }

  return BuildScriptRunner<boolean>({
    argument: "response",
    script: getScriptContent(script),
  })(receivedMessage);
};
