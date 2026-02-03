import { ChecksumAlgorithm, LineEnding, TextEncoding } from "../types";

/**
 * Supported checksum algorithm names (superset of base + protocol algorithms)
 */
type SupportedChecksumAlgorithm =
  | ChecksumAlgorithm
  | "CRC16_MODBUS"
  | "CRC16_CCITT"
  | "LRC";

export const calculateChecksum = (
  data: Uint8Array,
  algo: SupportedChecksumAlgorithm,
): Uint8Array => {
  switch (algo) {
    case "NONE":
      return new Uint8Array(0);

    case "MOD256": {
      let sum = 0;
      for (const b of data) sum = (sum + b) % 256;
      return new Uint8Array([sum]);
    }

    case "XOR": {
      let xor = 0;
      for (const b of data) xor ^= b;
      return new Uint8Array([xor]);
    }

    case "CRC16":
    case "CRC16_MODBUS": {
      // CRC-16-MODBUS (Polynomial 0x8005, initial 0xFFFF, reversed)
      let crc = 0xffff;
      for (let i = 0; i < data.length; i++) {
        crc ^= data[i];
        for (let j = 0; j < 8; j++) {
          if ((crc & 1) !== 0) {
            crc = (crc >> 1) ^ 0xa001;
          } else {
            crc = crc >> 1;
          }
        }
      }
      // Modbus sends Low Byte first, High Byte second
      return new Uint8Array([crc & 0xff, (crc >> 8) & 0xff]);
    }

    case "CRC16_CCITT": {
      // CRC-16-CCITT (Polynomial 0x1021, initial 0xFFFF)
      let crc = 0xffff;
      for (let i = 0; i < data.length; i++) {
        crc ^= data[i] << 8;
        for (let j = 0; j < 8; j++) {
          if ((crc & 0x8000) !== 0) {
            crc = ((crc << 1) ^ 0x1021) & 0xffff;
          } else {
            crc = (crc << 1) & 0xffff;
          }
        }
      }
      return new Uint8Array([(crc >> 8) & 0xff, crc & 0xff]);
    }

    case "LRC": {
      // Longitudinal Redundancy Check (two's complement of sum)
      let sum = 0;
      for (const b of data) sum = (sum + b) & 0xff;
      const lrc = (~sum + 1) & 0xff;
      return new Uint8Array([lrc]);
    }

    default:
      return new Uint8Array(0);
  }
};

/**
 * Append the appropriate line ending characters to a string
 */
export const appendLineEnding = (
  data: string,
  lineEnding: LineEnding,
): string => {
  switch (lineEnding) {
    case "LF":
      return data + "\n";
    case "CR":
      return data + "\r";
    case "CRLF":
      return data + "\r\n";
    default:
      return data;
  }
};

export const encodeText = (
  text: string,
  encoding: TextEncoding,
): Uint8Array => {
  if (encoding === "UTF-8") {
    return new TextEncoder().encode(text);
  }

  if (encoding === "ASCII") {
    const arr = new Uint8Array(text.length);
    for (let i = 0; i < text.length; i++) {
      arr[i] = text.charCodeAt(i) & 0x7f; // Force 7-bit
    }
    return arr;
  }

  if (encoding === "ISO-8859-1") {
    const arr = new Uint8Array(text.length);
    for (let i = 0; i < text.length; i++) {
      const code = text.charCodeAt(i);
      arr[i] = code > 255 ? 63 : code; // Replace >255 with '?' (63)
    }
    return arr;
  }

  return new TextEncoder().encode(text);
};

/**
 * Convert hex string to bytes
 * @param hexStr - Hex string (e.g., "48656C6C6F" or "48 65 6C 6C 6F")
 * @returns Uint8Array of bytes
 * @throws Error if hex string is invalid (contains non-hex characters after cleaning spaces)
 */
export const hexToBytes = (hexStr: string): Uint8Array => {
  // Remove only whitespace, preserve hex characters for validation
  const noWhitespace = hexStr.replace(/\s+/g, "");

  if (noWhitespace.length === 0) {
    return new Uint8Array(0);
  }

  // Validate that string contains only hex characters
  if (!/^[0-9A-Fa-f]+$/.test(noWhitespace)) {
    throw new Error("Invalid hex string: contains non-hex characters");
  }

  // Left-pad with 0 if odd length
  const cleanHex =
    noWhitespace.length % 2 !== 0 ? "0" + noWhitespace : noWhitespace;

  const bytes = new Uint8Array(cleanHex.length / 2);
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(cleanHex.substring(i * 2, i * 2 + 2), 16);
  }

  return bytes;
};

/**
 * Convert bytes to hex string
 * @param bytes - Byte array
 * @param uppercase - Whether to use uppercase hex letters (default: true)
 * @param separator - Separator between bytes (default: " ")
 * @returns Hex string representation
 */
export const bytesToHex = (
  bytes: Uint8Array,
  uppercase: boolean = true,
  separator: string = " ",
): string => {
  const hexArray = Array.from(bytes).map((b) => {
    const hex = b.toString(16).padStart(2, "0");
    return uppercase ? hex.toUpperCase() : hex;
  });

  return hexArray.join(separator);
};

/**
 * Parse hex data string, alias for hexToBytes with better error messages
 * Handles various hex formats: "48656C6C6F", "48 65 6C 6C 6F", "0x48 0x65"
 */
export const parseHexData = (hexStr: string): Uint8Array => {
  try {
    return hexToBytes(hexStr);
  } catch (error) {
    throw new Error(
      `Failed to parse hex data "${hexStr}": ${error instanceof Error ? error.message : String(error)}`,
    );
  }
};
