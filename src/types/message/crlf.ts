export const CRLFOptions = ["None", "CR", "LF", "CRLF"] as const;
export const CRLFCode = {
  CR: [0x0d] as const,
  CRLF: [0x0d, 0x0a] as const,
  LF: [0x0a] as const,
  None: [] as const,
} as const;
export const CRLFString = {
  CR: "\r" as const,
  CRLF: "\r\n" as const,
  LF: "\n" as const,
  None: "" as const,
} as const;

type CRLFModeTypes = (typeof CRLFOptions)[number];
export const splitMessageByCRLF = ({
  crlfMode,
  message,
}: {
  crlfMode: CRLFModeTypes;
  message: string;
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

export const getCrlfAppender = ({ crlf }: { crlf: CRLFModeTypes }) => {
  return (data: number[]) => [...data, ...CRLFCode[crlf]];
};
