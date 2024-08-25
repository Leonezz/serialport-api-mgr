import { CRLFCode, CRLFOptions, CRLFString } from "@/types/message/crlf";

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

export const getCrlfAppender = ({ crlf }: { crlf: CRLFModeTypes }) => {
  return (data: number[]) => [...data, ...CRLFCode[crlf]];
};
