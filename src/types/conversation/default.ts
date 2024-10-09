import { BuildScriptRunner } from "@/components/conversation/script_tester";
import { ConversationMessageType, SerialportConversation } from ".";
import { getMessageDecoder, MessageMetaConfig } from "../message/message_meta";
import { OK, Result } from "../global";
import {
  getScriptContent,
  INITIAL_REQUEST_SCRIPT,
  INITIAL_RESPONSE_SCRIPT,
} from "@/util/js_scripts/js_script_util";

export const DEFAULTSerialportConversation: SerialportConversation = {
  request: { mode: "text", text: "resqust", script: INITIAL_REQUEST_SCRIPT },
  response: {
    mode: "text",
    text: "response",
    script: INITIAL_RESPONSE_SCRIPT,
  },
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
