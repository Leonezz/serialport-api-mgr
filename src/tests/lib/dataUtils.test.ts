import { describe, it, expect } from "vitest";
import { encodeText, calculateChecksum } from "@/lib/dataUtils";

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
});
