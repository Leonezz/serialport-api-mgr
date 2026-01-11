import { ChecksumAlgorithm, TextEncoding } from "../types";

export const calculateChecksum = (
  data: Uint8Array,
  algo: ChecksumAlgorithm,
): Uint8Array => {
  if (algo === "NONE") return new Uint8Array(0);

  if (algo === "MOD256") {
    let sum = 0;
    for (const b of data) sum = (sum + b) % 256;
    return new Uint8Array([sum]);
  }

  if (algo === "XOR") {
    let xor = 0;
    for (const b of data) xor ^= b;
    return new Uint8Array([xor]);
  }

  if (algo === "CRC16") {
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

  return new Uint8Array(0);
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
