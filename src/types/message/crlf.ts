export const CRLFOptions = ["None", "CR", "LF", "CRLF"] as const;
export const CRLFCode = {
  CR: [0x0d] as const,
  LF: [0x0a] as const,
  CRLF: [0x0d, 0x0a] as const,
  None: [] as const,
} as const;
const CRLFString = {
  CR: "\r" as const,
  LF: "\n" as const,
  CRLF: "\r\n" as const,
  None: "" as const,
} as const;
type CRLFModeTypes = (typeof CRLFOptions)[number];
export const splitMessageByCRLF = ({
  message,
  crlfMode,
}: {
  message: string;
  crlfMode: CRLFModeTypes;
}) => {
  if (crlfMode === "None") {
    return [message];
  }
  const spliter = CRLFString[crlfMode];
  const lines = [];
  for (let idx = 0; idx < message.length; ) {
    const endIdx = message.indexOf(spliter, idx);
    if (endIdx === -1) {
      lines.push(message.substring(idx));
      break;
    }
    lines.push(message.substring(idx, endIdx));
    idx = endIdx + spliter.length;
  }
  return lines;
};
