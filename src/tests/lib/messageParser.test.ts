import { describe, it, expect } from "vitest";
import {
  parseStructuredMessage,
  extractVariables,
  parseAndExtract,
  validateStructure,
  getMinimumMessageSize,
} from "@/lib/messageParser";
import type {
  MessageStructure,
  MessageElement,
  ResponsePattern,
} from "@/lib/protocolTypes";

// ============================================================================
// TEST HELPERS
// ============================================================================

const createElement = (
  id: string,
  name: string,
  config: MessageElement["config"],
  size: number | "VARIABLE" | "COMPUTED" = 1,
): MessageElement => ({
  id,
  name,
  config,
  size,
});

const createStructure = (
  elements: MessageElement[],
  byteOrder: "BE" | "LE" = "BE",
): MessageStructure => ({
  id: "test-struct",
  name: "Test Structure",
  byteOrder,
  encoding: "BINARY",
  elements,
});

// ============================================================================
// STATIC ELEMENT PARSING
// ============================================================================

describe("parseStructuredMessage - STATIC elements", () => {
  it("should parse static bytes successfully", () => {
    const structure = createStructure([
      createElement(
        "header",
        "Header",
        { type: "STATIC", value: [0xaa, 0xbb] },
        2,
      ),
    ]);

    const data = new Uint8Array([0xaa, 0xbb]);
    const result = parseStructuredMessage(data, structure);

    expect(result.success).toBe(true);
    expect(result.elements).toHaveLength(1);
    expect(result.elements[0].name).toBe("Header");
    expect(result.elements[0].offset).toBe(0);
    expect(result.elements[0].size).toBe(2);
    expect(Array.from(result.elements[0].bytes)).toEqual([0xaa, 0xbb]);
  });

  it("should fail in strict mode when static bytes don't match", () => {
    const structure = createStructure([
      createElement(
        "header",
        "Header",
        { type: "STATIC", value: [0xaa, 0xbb] },
        2,
      ),
    ]);

    const data = new Uint8Array([0xaa, 0xcc]); // Wrong second byte
    const result = parseStructuredMessage(data, structure, { strict: true });

    expect(result.success).toBe(false);
    expect(result.error).toContain("Static element");
    expect(result.error).toContain("mismatch");
  });

  it("should pass in non-strict mode when static bytes don't match", () => {
    const structure = createStructure([
      createElement(
        "header",
        "Header",
        { type: "STATIC", value: [0xaa, 0xbb] },
        2,
      ),
    ]);

    const data = new Uint8Array([0xaa, 0xcc]);
    const result = parseStructuredMessage(data, structure, { strict: false });

    expect(result.success).toBe(true);
  });
});

// ============================================================================
// FIELD ELEMENT PARSING
// ============================================================================

describe("parseStructuredMessage - FIELD elements", () => {
  it("should decode UINT8 field", () => {
    const structure = createStructure([
      createElement("value", "Value", { type: "FIELD", dataType: "UINT8" }, 1),
    ]);

    const data = new Uint8Array([0x42]); // 66 decimal
    const result = parseStructuredMessage(data, structure);

    expect(result.success).toBe(true);
    expect(result.fields["Value"]).toBeDefined();
    expect(result.fields["Value"].value).toBe(66);
    expect(result.fields["Value"].dataType).toBe("UINT8");
  });

  it("should decode INT8 field with negative value", () => {
    const structure = createStructure([
      createElement("value", "Value", { type: "FIELD", dataType: "INT8" }, 1),
    ]);

    const data = new Uint8Array([0xfe]); // -2 in two's complement
    const result = parseStructuredMessage(data, structure);

    expect(result.success).toBe(true);
    expect(result.fields["Value"].value).toBe(-2);
    expect(result.fields["Value"].dataType).toBe("INT8");
  });

  it("should decode UINT16 big-endian", () => {
    const structure = createStructure(
      [
        createElement(
          "value",
          "Value",
          { type: "FIELD", dataType: "UINT16" },
          2,
        ),
      ],
      "BE",
    );

    const data = new Uint8Array([0x01, 0x00]); // 256 in BE
    const result = parseStructuredMessage(data, structure);

    expect(result.success).toBe(true);
    expect(result.fields["Value"].value).toBe(256);
  });

  it("should decode UINT16 little-endian", () => {
    const structure = createStructure(
      [
        createElement(
          "value",
          "Value",
          { type: "FIELD", dataType: "UINT16" },
          2,
        ),
      ],
      "LE",
    );

    const data = new Uint8Array([0x00, 0x01]); // 256 in LE
    const result = parseStructuredMessage(data, structure);

    expect(result.success).toBe(true);
    expect(result.fields["Value"].value).toBe(256);
  });

  it("should decode UINT32 big-endian", () => {
    const structure = createStructure(
      [
        createElement(
          "value",
          "Value",
          { type: "FIELD", dataType: "UINT32" },
          4,
        ),
      ],
      "BE",
    );

    const data = new Uint8Array([0x00, 0x01, 0x00, 0x00]); // 65536 in BE
    const result = parseStructuredMessage(data, structure);

    expect(result.success).toBe(true);
    expect(result.fields["Value"].value).toBe(65536);
  });

  it("should decode INT32 with negative value", () => {
    const structure = createStructure(
      [
        createElement(
          "value",
          "Value",
          { type: "FIELD", dataType: "INT32" },
          4,
        ),
      ],
      "BE",
    );

    const data = new Uint8Array([0xff, 0xff, 0xff, 0xff]); // -1 in two's complement
    const result = parseStructuredMessage(data, structure);

    expect(result.success).toBe(true);
    expect(result.fields["Value"].value).toBe(-1);
  });

  it("should decode FLOAT32", () => {
    const structure = createStructure(
      [
        createElement(
          "value",
          "Value",
          { type: "FIELD", dataType: "FLOAT32" },
          4,
        ),
      ],
      "BE",
    );

    // 3.14 in IEEE 754 BE: 0x4048F5C3
    const data = new Uint8Array([0x40, 0x48, 0xf5, 0xc3]);
    const result = parseStructuredMessage(data, structure);

    expect(result.success).toBe(true);
    expect(result.fields["Value"].value).toBeCloseTo(3.14, 2);
  });
});

// ============================================================================
// ADDRESS ELEMENT PARSING
// ============================================================================

describe("parseStructuredMessage - ADDRESS elements", () => {
  it("should decode ADDRESS as UINT8 by default", () => {
    const structure = createStructure([
      createElement("addr", "Address", { type: "ADDRESS" }, 1),
    ]);

    const data = new Uint8Array([0x05]);
    const result = parseStructuredMessage(data, structure);

    expect(result.success).toBe(true);
    expect(result.fields["Address"]).toBeDefined();
    expect(result.fields["Address"].value).toBe(5);
  });
});

// ============================================================================
// LENGTH ELEMENT PARSING
// ============================================================================

describe("parseStructuredMessage - LENGTH elements", () => {
  it("should decode single-byte LENGTH", () => {
    const structure = createStructure([
      createElement(
        "len",
        "Length",
        { type: "LENGTH", includeElements: [] },
        1,
      ),
    ]);

    const data = new Uint8Array([0x10]); // 16
    const result = parseStructuredMessage(data, structure);

    expect(result.success).toBe(true);
    expect(result.fields["Length"]).toBeDefined();
    expect(result.fields["Length"].value).toBe(16);
  });

  it("should decode two-byte LENGTH", () => {
    const structure = createStructure(
      [
        createElement(
          "len",
          "Length",
          { type: "LENGTH", includeElements: [] },
          2,
        ),
      ],
      "BE",
    );

    const data = new Uint8Array([0x01, 0x00]); // 256 in BE
    const result = parseStructuredMessage(data, structure);

    expect(result.success).toBe(true);
    expect(result.fields["Length"].value).toBe(256);
  });
});

// ============================================================================
// CHECKSUM ELEMENT PARSING
// ============================================================================

describe("parseStructuredMessage - CHECKSUM elements", () => {
  it("should validate MOD256 checksum", () => {
    const structure = createStructure([
      createElement(
        "data",
        "Data",
        { type: "STATIC", value: [0x01, 0x02, 0x03] },
        3,
      ),
      createElement(
        "chk",
        "Checksum",
        {
          type: "CHECKSUM",
          algorithm: "MOD256",
          includeElements: ["data"],
        },
        1,
      ),
    ]);

    // 0x01 + 0x02 + 0x03 = 0x06 (mod 256)
    const data = new Uint8Array([0x01, 0x02, 0x03, 0x06]);
    const result = parseStructuredMessage(data, structure);

    expect(result.success).toBe(true);
    expect(result.checksumValid).toBe(true);
  });

  it("should detect invalid MOD256 checksum", () => {
    const structure = createStructure([
      createElement(
        "data",
        "Data",
        { type: "STATIC", value: [0x01, 0x02, 0x03] },
        3,
      ),
      createElement(
        "chk",
        "Checksum",
        {
          type: "CHECKSUM",
          algorithm: "MOD256",
          includeElements: ["data"],
        },
        1,
      ),
    ]);

    const data = new Uint8Array([0x01, 0x02, 0x03, 0xff]); // Wrong checksum
    const result = parseStructuredMessage(data, structure);

    expect(result.success).toBe(true); // Non-strict mode
    expect(result.checksumValid).toBe(false);
  });

  it("should fail in strict mode with invalid checksum", () => {
    const structure = createStructure([
      createElement(
        "data",
        "Data",
        { type: "STATIC", value: [0x01, 0x02, 0x03] },
        3,
      ),
      createElement(
        "chk",
        "Checksum",
        {
          type: "CHECKSUM",
          algorithm: "MOD256",
          includeElements: ["data"],
        },
        1,
      ),
    ]);

    const data = new Uint8Array([0x01, 0x02, 0x03, 0xff]);
    const result = parseStructuredMessage(data, structure, { strict: true });

    expect(result.success).toBe(false);
    expect(result.error).toContain("Checksum");
    expect(result.error).toContain("invalid");
  });

  it("should validate XOR checksum", () => {
    const structure = createStructure([
      createElement(
        "data",
        "Data",
        { type: "STATIC", value: [0x01, 0x02, 0x03] },
        3,
      ),
      createElement(
        "chk",
        "Checksum",
        {
          type: "CHECKSUM",
          algorithm: "XOR",
          includeElements: ["data"],
        },
        1,
      ),
    ]);

    // 0x01 ^ 0x02 ^ 0x03 = 0x00
    const data = new Uint8Array([0x01, 0x02, 0x03, 0x00]);
    const result = parseStructuredMessage(data, structure);

    expect(result.success).toBe(true);
    expect(result.checksumValid).toBe(true);
  });

  it("should validate CRC16_MODBUS checksum", () => {
    const structure = createStructure([
      createElement("data", "Data", { type: "STATIC", value: [0x01, 0x03] }, 2),
      createElement(
        "chk",
        "Checksum",
        {
          type: "CHECKSUM",
          algorithm: "CRC16_MODBUS",
          includeElements: ["data"],
        },
        2,
      ),
    ]);

    // CRC16 Modbus of [0x01, 0x03] = 0x2140 (LE: 0x40, 0x21)
    const data = new Uint8Array([0x01, 0x03, 0x40, 0x21]);
    const result = parseStructuredMessage(data, structure);

    expect(result.success).toBe(true);
    expect(result.checksumValid).toBe(true);
  });
});

// ============================================================================
// PAYLOAD ELEMENT PARSING
// ============================================================================

describe("parseStructuredMessage - PAYLOAD elements", () => {
  it("should extract payload data", () => {
    const structure = createStructure([
      createElement("header", "Header", { type: "STATIC", value: [0xaa] }, 1),
      createElement("payload", "Payload", { type: "PAYLOAD" }, 4),
      createElement("footer", "Footer", { type: "STATIC", value: [0xbb] }, 1),
    ]);

    const data = new Uint8Array([0xaa, 0x01, 0x02, 0x03, 0x04, 0xbb]);
    const result = parseStructuredMessage(data, structure);

    expect(result.success).toBe(true);
    expect(result.payload).toBeDefined();
    expect(Array.from(result.payload!)).toEqual([0x01, 0x02, 0x03, 0x04]);
    expect(result.fields["Payload"]).toBeDefined();
  });

  it("should calculate payload size from remaining bytes", () => {
    const structure = createStructure([
      createElement("header", "Header", { type: "STATIC", value: [0xaa] }, 1),
      createElement("payload", "Payload", { type: "PAYLOAD" }, "VARIABLE"),
      createElement("footer", "Footer", { type: "STATIC", value: [0xbb] }, 1),
    ]);

    const data = new Uint8Array([0xaa, 0x01, 0x02, 0xbb]);
    const result = parseStructuredMessage(data, structure);

    expect(result.success).toBe(true);
    expect(result.payload).toBeDefined();
    expect(Array.from(result.payload!)).toEqual([0x01, 0x02]);
  });
});

// ============================================================================
// PADDING/RESERVED ELEMENT PARSING
// ============================================================================

describe("parseStructuredMessage - PADDING/RESERVED elements", () => {
  it("should skip PADDING bytes", () => {
    const structure = createStructure([
      createElement("data", "Data", { type: "STATIC", value: [0x01] }, 1),
      createElement("pad", "Padding", { type: "PADDING", fillByte: 0 }, 2),
      createElement("end", "End", { type: "STATIC", value: [0xff] }, 1),
    ]);

    const data = new Uint8Array([0x01, 0x00, 0x00, 0xff]);
    const result = parseStructuredMessage(data, structure);

    expect(result.success).toBe(true);
    expect(result.elements).toHaveLength(3);
    expect(result.elements[1].name).toBe("Padding");
  });

  it("should skip RESERVED bytes", () => {
    const structure = createStructure([
      createElement("data", "Data", { type: "STATIC", value: [0x01] }, 1),
      createElement("reserved", "Reserved", { type: "RESERVED" }, 3),
    ]);

    const data = new Uint8Array([0x01, 0xaa, 0xbb, 0xcc]);
    const result = parseStructuredMessage(data, structure);

    expect(result.success).toBe(true);
    expect(result.elements).toHaveLength(2);
  });
});

// ============================================================================
// ERROR HANDLING
// ============================================================================

describe("parseStructuredMessage - error handling", () => {
  it("should fail when data is too short", () => {
    const structure = createStructure([
      createElement(
        "data",
        "Data",
        { type: "STATIC", value: [0x01, 0x02, 0x03] },
        3,
      ),
    ]);

    const data = new Uint8Array([0x01, 0x02]); // Only 2 bytes, need 3
    const result = parseStructuredMessage(data, structure);

    expect(result.success).toBe(false);
    expect(result.error).toContain("Not enough data");
  });
});

// ============================================================================
// COMPLEX MESSAGE PARSING
// ============================================================================

describe("parseStructuredMessage - complex messages", () => {
  it("should parse a Modbus-like response frame", () => {
    const structure = createStructure([
      createElement("addr", "Address", { type: "ADDRESS" }, 1),
      createElement(
        "func",
        "Function",
        { type: "FIELD", dataType: "UINT8" },
        1,
      ),
      createElement(
        "len",
        "ByteCount",
        { type: "LENGTH", includeElements: [] },
        1,
      ),
      createElement("payload", "Data", { type: "PAYLOAD" }, 4),
      createElement(
        "crc",
        "CRC",
        {
          type: "CHECKSUM",
          algorithm: "CRC16_MODBUS",
          includeElements: ["addr", "func", "len", "payload"],
        },
        2,
      ),
    ]);

    // Modbus response: addr=0x01, func=0x03, len=0x04, data=[0x00,0x0A,0x00,0x14], CRC
    const dataBytes = [0x01, 0x03, 0x04, 0x00, 0x0a, 0x00, 0x14];
    // Calculate CRC16 Modbus for the data bytes
    let crc = 0xffff;
    for (const byte of dataBytes) {
      crc ^= byte;
      for (let j = 0; j < 8; j++) {
        if ((crc & 1) !== 0) {
          crc = (crc >> 1) ^ 0xa001;
        } else {
          crc = crc >> 1;
        }
      }
    }
    const crcLow = crc & 0xff;
    const crcHigh = (crc >> 8) & 0xff;

    const data = new Uint8Array([...dataBytes, crcLow, crcHigh]);
    const result = parseStructuredMessage(data, structure);

    expect(result.success).toBe(true);
    expect(result.checksumValid).toBe(true);
    expect(result.fields["Address"].value).toBe(1);
    expect(result.fields["Function"].value).toBe(3);
    expect(result.fields["ByteCount"].value).toBe(4);
    expect(result.payload).toBeDefined();
    expect(Array.from(result.payload!)).toEqual([0x00, 0x0a, 0x00, 0x14]);
  });
});

// ============================================================================
// VARIABLE EXTRACTION
// ============================================================================

describe("extractVariables", () => {
  it("should extract variables from parsed fields", () => {
    const parseResult = {
      success: true,
      fields: {
        Temperature: {
          value: 25,
          dataType: "UINT8" as const,
          raw: new Uint8Array([25]),
        },
        Humidity: {
          value: 60,
          dataType: "UINT8" as const,
          raw: new Uint8Array([60]),
        },
      },
      elements: [],
    };

    const patterns: ResponsePattern[] = [
      {
        type: "SUCCESS",
        condition: "true",
        extractElements: [
          { elementId: "Temperature", variableName: "temp" },
          { elementId: "Humidity", variableName: "humid" },
        ],
      },
    ];

    const result = extractVariables(parseResult, patterns);

    expect(result.success).toBe(true);
    expect(result.variables["temp"]).toBe(25);
    expect(result.variables["humid"]).toBe(60);
  });

  it("should handle failed parse result", () => {
    const parseResult = {
      success: false,
      error: "Parse failed",
      fields: {},
      elements: [],
    };

    const patterns: ResponsePattern[] = [];
    const result = extractVariables(parseResult, patterns);

    expect(result.success).toBe(false);
    expect(result.error).toBe("Parse failed");
  });

  it("should return empty variables when no patterns match", () => {
    const parseResult = {
      success: true,
      fields: {},
      elements: [],
    };

    const patterns: ResponsePattern[] = [];
    const result = extractVariables(parseResult, patterns);

    expect(result.success).toBe(true);
    expect(Object.keys(result.variables)).toHaveLength(0);
  });
});

// ============================================================================
// PARSE AND EXTRACT
// ============================================================================

describe("parseAndExtract", () => {
  it("should parse and extract in one step", () => {
    const structure = createStructure([
      createElement(
        "temp",
        "Temperature",
        { type: "FIELD", dataType: "UINT8" },
        1,
      ),
    ]);

    const patterns: ResponsePattern[] = [
      {
        type: "SUCCESS",
        condition: "true",
        extractElements: [{ elementId: "Temperature", variableName: "temp" }],
      },
    ];

    const data = new Uint8Array([0x19]); // 25
    const result = parseAndExtract(data, structure, patterns);

    expect(result.success).toBe(true);
    expect(result.fields["Temperature"].value).toBe(25);
    expect(result.variables["temp"]).toBe(25);
  });

  it("should return empty variables on parse failure", () => {
    const structure = createStructure([
      createElement("data", "Data", { type: "STATIC", value: [0xaa] }, 1),
    ]);

    const data = new Uint8Array([]); // Empty - will fail
    const result = parseAndExtract(data, structure, []);

    expect(result.success).toBe(false);
    expect(Object.keys(result.variables)).toHaveLength(0);
  });
});

// ============================================================================
// VALIDATE STRUCTURE
// ============================================================================

describe("validateStructure", () => {
  it("should return true for valid message", () => {
    const structure = createStructure([
      createElement(
        "header",
        "Header",
        { type: "STATIC", value: [0xaa, 0xbb] },
        2,
      ),
    ]);

    const data = new Uint8Array([0xaa, 0xbb]);
    const result = validateStructure(data, structure);

    expect(result).toBe(true);
  });

  it("should return false for mismatched static bytes", () => {
    const structure = createStructure([
      createElement(
        "header",
        "Header",
        { type: "STATIC", value: [0xaa, 0xbb] },
        2,
      ),
    ]);

    const data = new Uint8Array([0xaa, 0xcc]); // Wrong second byte
    const result = validateStructure(data, structure);

    expect(result).toBe(false);
  });

  it("should return false for invalid checksum", () => {
    const structure = createStructure([
      createElement("data", "Data", { type: "STATIC", value: [0x01] }, 1),
      createElement(
        "chk",
        "Checksum",
        {
          type: "CHECKSUM",
          algorithm: "MOD256",
          includeElements: ["data"],
        },
        1,
      ),
    ]);

    const data = new Uint8Array([0x01, 0xff]); // Invalid checksum
    const result = validateStructure(data, structure);

    expect(result).toBe(false);
  });

  it("should return true for valid checksum", () => {
    const structure = createStructure([
      createElement("data", "Data", { type: "STATIC", value: [0x01] }, 1),
      createElement(
        "chk",
        "Checksum",
        {
          type: "CHECKSUM",
          algorithm: "MOD256",
          includeElements: ["data"],
        },
        1,
      ),
    ]);

    const data = new Uint8Array([0x01, 0x01]); // Valid checksum
    const result = validateStructure(data, structure);

    expect(result).toBe(true);
  });
});

// ============================================================================
// GET MINIMUM MESSAGE SIZE
// ============================================================================

describe("getMinimumMessageSize", () => {
  it("should calculate size for fixed-size elements", () => {
    const structure = createStructure([
      createElement("a", "A", { type: "STATIC", value: [0x01] }, 1),
      createElement("b", "B", { type: "FIELD", dataType: "UINT16" }, 2),
      createElement(
        "c",
        "C",
        { type: "CHECKSUM", algorithm: "MOD256", includeElements: [] },
        1,
      ),
    ]);

    const result = getMinimumMessageSize(structure);

    expect(result).toBe(4); // 1 + 2 + 1
  });

  it("should use data type size for FIELD elements without explicit size", () => {
    const structure = createStructure([
      createElement(
        "a",
        "A",
        { type: "FIELD", dataType: "UINT32" },
        "COMPUTED",
      ),
    ]);

    const result = getMinimumMessageSize(structure);

    expect(result).toBe(4); // UINT32 = 4 bytes
  });

  it("should calculate 2 bytes for CRC16 checksums", () => {
    const structure = createStructure([
      createElement(
        "crc",
        "CRC",
        { type: "CHECKSUM", algorithm: "CRC16_MODBUS", includeElements: [] },
        "COMPUTED",
      ),
    ]);

    const result = getMinimumMessageSize(structure);

    expect(result).toBe(2);
  });

  it("should calculate 2 bytes for CRC16_CCITT checksums", () => {
    const structure = createStructure([
      createElement(
        "crc",
        "CRC",
        { type: "CHECKSUM", algorithm: "CRC16_CCITT", includeElements: [] },
        "COMPUTED",
      ),
    ]);

    const result = getMinimumMessageSize(structure);

    expect(result).toBe(2);
  });

  it("should not count PAYLOAD and VARIABLE sizes", () => {
    const structure = createStructure([
      createElement("header", "Header", { type: "STATIC", value: [0xaa] }, 1),
      createElement("payload", "Payload", { type: "PAYLOAD" }, "VARIABLE"),
      createElement("footer", "Footer", { type: "STATIC", value: [0xbb] }, 1),
    ]);

    const result = getMinimumMessageSize(structure);

    expect(result).toBe(2); // Only header + footer counted
  });
});
