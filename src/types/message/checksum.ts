export const CheckSumOptions = [
  "None",
  "crc32",
  // "crc1",
  "crc8",
  "crc24",
  // "crc81wire",
  // "crc8dvbs2",
  "crc16",
  // "crc16ccitt",
  // "crc16modbus",
  // "crc16kermit",
  // "crc16xmodem",
  // "crc32mpeg2",
  // "crcjam",
] as const;

type CheckSumTypes = (typeof CheckSumOptions)[number];

export const getCrcBytes = (crcName: CheckSumTypes) => {
  switch (crcName) {
    case "None":
      return 0;
    case "crc32":
      return 4;
    case "crc8":
      return 1;
    case "crc24":
      return 3;
    case "crc16":
      return 2;
    // case "crc16ccitt":
    //   return 2;
    // case "crc16modbus":
    //   return 2;
    // case "crc16kermit":
    //   return 2;
    // case "crc16xmodem":
    //   return 2;
    // case "crc32mpeg2":
    //   return 4;
  }
};
