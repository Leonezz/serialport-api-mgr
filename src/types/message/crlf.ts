export const CRLFOptions = ["None", "CR", "LF", "CRLF"] as const;
export const CRLFCode = {
  CR: [0x0d] as const,
  LF: [0x0a] as const,
  CRLF: [0x0d, 0x0a] as const,
  None: [] as const,
} as const;
export const CRLFString = {
  CR: "\r" as const,
  LF: "\n" as const,
  CRLF: "\r\n" as const,
  None: "" as const,
} as const;

