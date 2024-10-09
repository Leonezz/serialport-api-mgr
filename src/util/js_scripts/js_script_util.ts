export const INITIAL_REQUEST_SCRIPT = `\
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

export const INITIAL_RESPONSE_SCRIPT = `\
// The function takes a string as argument
// and returns a boolean
//NOTE - DO NOT EDIT THE FIRST AND LAST LINES
//NOTE - THE FUNCTION BODY SHOULD RETURN A BOOLEAN
const verifyResponse = (response) => {
  // ...write your function body here
  return true;
}
`;

export const trimScript = (scriptContent: string) => {
  return scriptContent.split("\n").filter((v) => v.length > 0);
};

export const getScriptContent = (scriptContent: string) => {
  const lines = trimScript(scriptContent);
  const startIdx = lines.findIndex((v) => !v.startsWith("//"));
  return lines.slice(startIdx + 1, lines.length - 1).join("\n");
};
