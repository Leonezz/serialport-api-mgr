import { describe, it, expect } from "vitest";
import {
  encodeText,
  calculateChecksum,
  hexToBytes,
  bytesToHex,
  parseHexData,
} from "@/lib/utils/dataUtils";

describe("dataUtils", () => {
  describe("encodeText", () => {
    it("should encode UTF-8 text correctly", () => {
      const result = encodeText("Hello", "UTF-8");
      expect(Array.from(result)).toEqual([72, 101, 108, 108, 111]);
    });

    it("should encode ASCII text correctly", () => {
      const result = encodeText("ABC", "ASCII");
      expect(Array.from(result)).toEqual([65, 66, 67]);
    });

    it("should encode ISO-8859-1 text correctly", () => {
      const result = encodeText("ABC", "ISO-8859-1");
      expect(Array.from(result)).toEqual([65, 66, 67]);
    });

    it("should handle special characters in UTF-8", () => {
      const result = encodeText("ü", "UTF-8");
      expect(Array.from(result)).toEqual([195, 188]);
    });

    it("should force 7-bit for ASCII encoding", () => {
      // Character with code > 127 should be masked to 7-bit
      // Note: JavaScript strings are UTF-16, so "€" is 1 character with code U+20AC
      const result = encodeText("€", "ASCII"); // Euro sign (€) = U+20AC (8364)
      expect(result.length).toBe(1); // One character = one byte in ASCII encoding
      // The character code 8364 & 0x7F = 108 (masked to 7-bit)
      expect(result[0]).toBe(8364 & 0x7f); // Should be 108
      expect(result[0]).toBeLessThanOrEqual(127);
    });

    it("should replace characters >255 with ? in ISO-8859-1", () => {
      const result = encodeText("€", "ISO-8859-1"); // Euro sign = U+20AC (8364)
      // Should be replaced with '?' (63)
      expect(Array.from(result)).toEqual([63]);
    });

    it("should handle empty string", () => {
      const result = encodeText("", "UTF-8");
      expect(Array.from(result)).toEqual([]);
    });
  });

  describe("calculateChecksum", () => {
    const testData = new Uint8Array([1, 2, 3, 4, 5]);

    it("should return empty array for NONE algorithm", () => {
      const result = calculateChecksum(testData, "NONE");
      expect(result).toEqual(new Uint8Array(0));
    });

    it("should calculate MOD256 checksum correctly", () => {
      const result = calculateChecksum(testData, "MOD256");
      // (1+2+3+4+5) % 256 = 15
      expect(result).toEqual(new Uint8Array([15]));
    });

    it("should calculate XOR checksum correctly", () => {
      const result = calculateChecksum(testData, "XOR");
      // 1^2^3^4^5 = 1
      expect(result).toEqual(new Uint8Array([1]));
    });

    it("should calculate CRC16 checksum correctly", () => {
      const result = calculateChecksum(testData, "CRC16");
      // CRC16-MODBUS result should be 2 bytes
      expect(result.length).toBe(2);
      expect(result).toBeInstanceOf(Uint8Array);
    });

    it("should handle empty data for MOD256", () => {
      const result = calculateChecksum(new Uint8Array(0), "MOD256");
      expect(result).toEqual(new Uint8Array([0]));
    });

    it("should handle empty data for XOR", () => {
      const result = calculateChecksum(new Uint8Array(0), "XOR");
      expect(result).toEqual(new Uint8Array([0]));
    });

    it("should handle empty data for CRC16", () => {
      const result = calculateChecksum(new Uint8Array(0), "CRC16");
      expect(result.length).toBe(2);
      expect(result).toBeInstanceOf(Uint8Array);
    });

    it("should handle large data for MOD256", () => {
      const largeData = new Uint8Array(1000).fill(1);
      const result = calculateChecksum(largeData, "MOD256");
      // 1000 * 1 % 256 = 232
      expect(result).toEqual(new Uint8Array([232]));
    });

    it("should handle all zeros", () => {
      const zeros = new Uint8Array([0, 0, 0, 0]);
      expect(calculateChecksum(zeros, "MOD256")).toEqual(new Uint8Array([0]));
      expect(calculateChecksum(zeros, "XOR")).toEqual(new Uint8Array([0]));
    });

    it("should handle all 0xFF bytes for MOD256", () => {
      const maxBytes = new Uint8Array([0xff, 0xff]);
      const result = calculateChecksum(maxBytes, "MOD256");
      // (255 + 255) % 256 = 254
      expect(result).toEqual(new Uint8Array([254]));
    });
  });

  describe("hexToBytes", () => {
    it("should convert basic hex string to bytes", () => {
      const result = hexToBytes("48656C6C6F");
      expect(Array.from(result)).toEqual([72, 101, 108, 108, 111]); // "Hello"
    });

    it("should handle hex string with spaces", () => {
      const result = hexToBytes("48 65 6C 6C 6F");
      expect(Array.from(result)).toEqual([72, 101, 108, 108, 111]);
    });

    it("should handle lowercase hex", () => {
      const result = hexToBytes("abcd");
      expect(Array.from(result)).toEqual([171, 205]);
    });

    it("should handle uppercase hex", () => {
      const result = hexToBytes("ABCD");
      expect(Array.from(result)).toEqual([171, 205]);
    });

    it("should handle mixed case hex", () => {
      const result = hexToBytes("AbCd");
      expect(Array.from(result)).toEqual([171, 205]);
    });

    it("should handle hex with multiple spaces", () => {
      const result = hexToBytes("48  65   6C");
      expect(Array.from(result)).toEqual([72, 101, 108]);
    });

    it("should throw on non-hex characters", () => {
      expect(() => hexToBytes("48-65-6C")).toThrow(
        "Invalid hex string: contains non-hex characters",
      );
    });

    it("should handle empty string", () => {
      const result = hexToBytes("");
      expect(Array.from(result)).toEqual([]);
    });

    it("should handle hex with only whitespace", () => {
      const result = hexToBytes("   ");
      expect(Array.from(result)).toEqual([]);
    });

    it("should left-pad odd length hex string", () => {
      const result = hexToBytes("ABC");
      expect(Array.from(result)).toEqual([10, 188]); // "0ABC" = 0x0A 0xBC
    });

    it("should left-pad odd length after space removal", () => {
      const result = hexToBytes("A B C");
      expect(Array.from(result)).toEqual([10, 188]); // "ABC" -> "0ABC"
    });

    it("should throw on 0x prefix (non-hex character x)", () => {
      expect(() => hexToBytes("0x48 0x65")).toThrow(
        "Invalid hex string: contains non-hex characters",
      );
    });

    it("should handle all zeros", () => {
      const result = hexToBytes("00 00 00");
      expect(Array.from(result)).toEqual([0, 0, 0]);
    });

    it("should handle all 0xFF", () => {
      const result = hexToBytes("FF FF FF");
      expect(Array.from(result)).toEqual([255, 255, 255]);
    });

    it("should handle single byte", () => {
      const result = hexToBytes("42");
      expect(Array.from(result)).toEqual([66]);
    });

    it("should handle leading zeros", () => {
      const result = hexToBytes("01 02 03");
      expect(Array.from(result)).toEqual([1, 2, 3]);
    });
  });

  describe("bytesToHex", () => {
    it("should convert bytes to uppercase hex with space separator", () => {
      const bytes = new Uint8Array([72, 101, 108, 108, 111]);
      const result = bytesToHex(bytes);
      expect(result).toBe("48 65 6C 6C 6F");
    });

    it("should convert bytes to lowercase hex", () => {
      const bytes = new Uint8Array([72, 101, 108, 108, 111]);
      const result = bytesToHex(bytes, false);
      expect(result).toBe("48 65 6c 6c 6f");
    });

    it("should use custom separator", () => {
      const bytes = new Uint8Array([72, 101, 108]);
      const result = bytesToHex(bytes, true, "-");
      expect(result).toBe("48-65-6C");
    });

    it("should handle no separator", () => {
      const bytes = new Uint8Array([72, 101, 108]);
      const result = bytesToHex(bytes, true, "");
      expect(result).toBe("48656C");
    });

    it("should handle empty byte array", () => {
      const bytes = new Uint8Array([]);
      const result = bytesToHex(bytes);
      expect(result).toBe("");
    });

    it("should handle single byte", () => {
      const bytes = new Uint8Array([255]);
      const result = bytesToHex(bytes);
      expect(result).toBe("FF");
    });

    it("should handle zeros", () => {
      const bytes = new Uint8Array([0, 0, 0]);
      const result = bytesToHex(bytes);
      expect(result).toBe("00 00 00");
    });

    it("should pad single digit hex", () => {
      const bytes = new Uint8Array([1, 2, 15]);
      const result = bytesToHex(bytes);
      expect(result).toBe("01 02 0F");
    });

    it("should handle all 0xFF bytes", () => {
      const bytes = new Uint8Array([255, 255, 255]);
      const result = bytesToHex(bytes);
      expect(result).toBe("FF FF FF");
    });

    it("should work with lowercase and custom separator", () => {
      const bytes = new Uint8Array([10, 188]);
      const result = bytesToHex(bytes, false, ":");
      expect(result).toBe("0a:bc");
    });
  });

  describe("parseHexData", () => {
    it("should parse valid hex string", () => {
      const result = parseHexData("48656C6C6F");
      expect(Array.from(result)).toEqual([72, 101, 108, 108, 111]);
    });

    it("should parse hex with spaces", () => {
      const result = parseHexData("48 65 6C 6C 6F");
      expect(Array.from(result)).toEqual([72, 101, 108, 108, 111]);
    });

    it("should throw with helpful error message on invalid hex", () => {
      expect(() => parseHexData("XYZ")).toThrow(
        'Failed to parse hex data "XYZ": Invalid hex string: contains non-hex characters',
      );
    });

    it("should throw with helpful error on non-hex characters", () => {
      expect(() => parseHexData("48-65")).toThrow(
        'Failed to parse hex data "48-65": Invalid hex string: contains non-hex characters',
      );
    });

    it("should handle empty string", () => {
      const result = parseHexData("");
      expect(Array.from(result)).toEqual([]);
    });

    it("should throw on 0x prefixed hex", () => {
      expect(() => parseHexData("0x48 0x65")).toThrow(
        'Failed to parse hex data "0x48 0x65": Invalid hex string: contains non-hex characters',
      );
    });
  });

  describe("hexToBytes and bytesToHex round-trip", () => {
    it("should round-trip correctly", () => {
      const original = new Uint8Array([1, 2, 3, 255, 0, 127]);
      const hex = bytesToHex(original, true, " ");
      const restored = hexToBytes(hex);
      expect(Array.from(restored)).toEqual(Array.from(original));
    });

    it("should round-trip with no separator", () => {
      const original = new Uint8Array([72, 101, 108, 108, 111]);
      const hex = bytesToHex(original, false, "");
      const restored = hexToBytes(hex);
      expect(Array.from(restored)).toEqual(Array.from(original));
    });

    it("should round-trip empty array", () => {
      const original = new Uint8Array([]);
      const hex = bytesToHex(original);
      const restored = hexToBytes(hex);
      expect(Array.from(restored)).toEqual(Array.from(original));
    });
  });
});
