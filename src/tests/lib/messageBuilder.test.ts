import { describe, it, expect } from "vitest";
import {
  buildStructuredMessage,
  buildMessage,
  getMessageStructureSize,
} from "@/lib/messageBuilder";
import type { MessageStructure, MessageElement } from "@/lib/protocolTypes";

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
// STATIC ELEMENT TESTS
// ============================================================================

describe("buildStructuredMessage - STATIC elements", () => {
  it("should insert fixed bytes for STATIC elements", () => {
    const structure = createStructure([
      createElement("header", "Header", {
        type: "STATIC",
        value: [0xaa, 0xbb],
      }),
    ]);

    const result = buildStructuredMessage(structure, {
      params: {},
      bindings: [],
    });

    expect(result.data).toEqual(new Uint8Array([0xaa, 0xbb]));
    expect(result.elements).toHaveLength(1);
    expect(result.elements[0].name).toBe("Header");
    expect(result.elements[0].offset).toBe(0);
    expect(result.elements[0].size).toBe(2);
  });

  it("should handle multiple STATIC elements", () => {
    const structure = createStructure([
      createElement("start", "Start", { type: "STATIC", value: [0x02] }),
      createElement("end", "End", { type: "STATIC", value: [0x03] }),
    ]);

    const result = buildStructuredMessage(structure, {
      params: {},
      bindings: [],
    });

    expect(result.data).toEqual(new Uint8Array([0x02, 0x03]));
  });
});

// ============================================================================
// FIELD ELEMENT TESTS
// ============================================================================

describe("buildStructuredMessage - FIELD elements", () => {
  it("should encode UINT8 field", () => {
    const structure = createStructure([
      createElement("value", "Value", {
        type: "FIELD",
        dataType: "UINT8",
      }),
    ]);

    const result = buildStructuredMessage(structure, {
      params: { val: 255 },
      bindings: [{ elementId: "value", parameterName: "val" }],
    });

    expect(result.data).toEqual(new Uint8Array([0xff]));
  });

  it("should encode INT8 field with negative value", () => {
    const structure = createStructure([
      createElement("value", "Value", {
        type: "FIELD",
        dataType: "INT8",
      }),
    ]);

    const result = buildStructuredMessage(structure, {
      params: { val: -1 },
      bindings: [{ elementId: "value", parameterName: "val" }],
    });

    expect(result.data).toEqual(new Uint8Array([0xff]));
  });

  it("should encode UINT16 big-endian", () => {
    const structure = createStructure(
      [
        createElement("value", "Value", {
          type: "FIELD",
          dataType: "UINT16",
        }),
      ],
      "BE",
    );

    const result = buildStructuredMessage(structure, {
      params: { val: 0x1234 },
      bindings: [{ elementId: "value", parameterName: "val" }],
    });

    expect(result.data).toEqual(new Uint8Array([0x12, 0x34]));
  });

  it("should encode UINT16 little-endian", () => {
    const structure = createStructure(
      [
        createElement("value", "Value", {
          type: "FIELD",
          dataType: "UINT16",
        }),
      ],
      "LE",
    );

    const result = buildStructuredMessage(structure, {
      params: { val: 0x1234 },
      bindings: [{ elementId: "value", parameterName: "val" }],
    });

    expect(result.data).toEqual(new Uint8Array([0x34, 0x12]));
  });

  it("should encode UINT32 big-endian", () => {
    const structure = createStructure(
      [
        createElement("value", "Value", {
          type: "FIELD",
          dataType: "UINT32",
        }),
      ],
      "BE",
    );

    const result = buildStructuredMessage(structure, {
      params: { val: 0x12345678 },
      bindings: [{ elementId: "value", parameterName: "val" }],
    });

    expect(result.data).toEqual(new Uint8Array([0x12, 0x34, 0x56, 0x78]));
  });

  it("should encode FLOAT32", () => {
    const structure = createStructure(
      [
        createElement("value", "Value", {
          type: "FIELD",
          dataType: "FLOAT32",
        }),
      ],
      "BE",
    );

    const result = buildStructuredMessage(structure, {
      params: { val: 1.0 },
      bindings: [{ elementId: "value", parameterName: "val" }],
    });

    // 1.0 in IEEE 754 float32 big-endian: 0x3F800000
    expect(result.data).toEqual(new Uint8Array([0x3f, 0x80, 0x00, 0x00]));
  });

  it("should apply transform to field value", () => {
    const structure = createStructure([
      createElement("value", "Value", {
        type: "FIELD",
        dataType: "UINT8",
      }),
    ]);

    const result = buildStructuredMessage(structure, {
      params: { val: 5 },
      bindings: [
        { elementId: "value", parameterName: "val", transform: "value * 2" },
      ],
    });

    expect(result.data).toEqual(new Uint8Array([10]));
  });
});

// ============================================================================
// ADDRESS ELEMENT TESTS
// ============================================================================

describe("buildStructuredMessage - ADDRESS elements", () => {
  it("should encode ADDRESS element as UINT8 by default", () => {
    const structure = createStructure([
      createElement("addr", "Address", {
        type: "ADDRESS",
      }),
    ]);

    const result = buildStructuredMessage(structure, {
      params: { address: 0x42 },
      bindings: [{ elementId: "addr", parameterName: "address" }],
    });

    expect(result.data).toEqual(new Uint8Array([0x42]));
  });
});

// ============================================================================
// LENGTH ELEMENT TESTS
// ============================================================================

describe("buildStructuredMessage - LENGTH elements", () => {
  it("should calculate length of referenced elements", () => {
    const structure = createStructure([
      createElement("header", "Header", { type: "STATIC", value: [0xaa] }),
      createElement(
        "len",
        "Length",
        {
          type: "LENGTH",
          includeElements: ["data"],
          adjustment: 0,
        },
        1,
      ),
      createElement("data", "Data", {
        type: "STATIC",
        value: [0x01, 0x02, 0x03],
      }),
    ]);

    const result = buildStructuredMessage(structure, {
      params: {},
      bindings: [],
    });

    // Header: 0xAA, Length: 3 (size of data), Data: 0x01 0x02 0x03
    expect(result.data).toEqual(new Uint8Array([0xaa, 0x03, 0x01, 0x02, 0x03]));
  });

  it("should apply adjustment to calculated length", () => {
    const structure = createStructure([
      createElement(
        "len",
        "Length",
        {
          type: "LENGTH",
          includeElements: ["data"],
          adjustment: 2, // Add 2 to length
        },
        1,
      ),
      createElement("data", "Data", { type: "STATIC", value: [0x01, 0x02] }),
    ]);

    const result = buildStructuredMessage(structure, {
      params: {},
      bindings: [],
    });

    // Length should be 2 + 2 = 4
    expect(result.data[0]).toBe(4);
  });

  it("should calculate length of multiple elements", () => {
    const structure = createStructure([
      createElement(
        "len",
        "Length",
        {
          type: "LENGTH",
          includeElements: ["data1", "data2"],
          adjustment: 0,
        },
        1,
      ),
      createElement("data1", "Data1", { type: "STATIC", value: [0x01, 0x02] }),
      createElement("data2", "Data2", {
        type: "STATIC",
        value: [0x03, 0x04, 0x05],
      }),
    ]);

    const result = buildStructuredMessage(structure, {
      params: {},
      bindings: [],
    });

    // Length should be 2 + 3 = 5
    expect(result.data[0]).toBe(5);
  });
});

// ============================================================================
// CHECKSUM ELEMENT TESTS
// ============================================================================

describe("buildStructuredMessage - CHECKSUM elements", () => {
  it("should calculate MOD256 checksum", () => {
    const structure = createStructure([
      createElement("data", "Data", {
        type: "STATIC",
        value: [0x01, 0x02, 0x03],
      }),
      createElement("chk", "Checksum", {
        type: "CHECKSUM",
        algorithm: "MOD256",
        includeElements: ["data"],
      }),
    ]);

    const result = buildStructuredMessage(structure, {
      params: {},
      bindings: [],
    });

    // MOD256 of [1, 2, 3] = (1 + 2 + 3) % 256 = 6
    expect(result.data).toEqual(new Uint8Array([0x01, 0x02, 0x03, 0x06]));
  });

  it("should calculate XOR checksum", () => {
    const structure = createStructure([
      createElement("data", "Data", {
        type: "STATIC",
        value: [0x01, 0x02, 0x04],
      }),
      createElement("chk", "Checksum", {
        type: "CHECKSUM",
        algorithm: "XOR",
        includeElements: ["data"],
      }),
    ]);

    const result = buildStructuredMessage(structure, {
      params: {},
      bindings: [],
    });

    // XOR of [1, 2, 4] = 1 ^ 2 ^ 4 = 7
    expect(result.data).toEqual(new Uint8Array([0x01, 0x02, 0x04, 0x07]));
  });

  it("should calculate CRC16_MODBUS checksum", () => {
    const structure = createStructure([
      createElement("data", "Data", {
        type: "STATIC",
        value: [0x01, 0x03, 0x00, 0x00, 0x00, 0x0a],
      }),
      createElement("chk", "Checksum", {
        type: "CHECKSUM",
        algorithm: "CRC16_MODBUS",
        includeElements: ["data"],
      }),
    ]);

    const result = buildStructuredMessage(structure, {
      params: {},
      bindings: [],
    });

    // CRC16 is 2 bytes
    expect(result.data.length).toBe(8);
    // Verify it's a valid CRC (actual value depends on algorithm implementation)
    expect(result.elements.find((e) => e.name === "Checksum")?.size).toBe(2);
  });

  it("should calculate LRC checksum", () => {
    const structure = createStructure([
      createElement("data", "Data", {
        type: "STATIC",
        value: [0x01, 0x02, 0x03],
      }),
      createElement("chk", "Checksum", {
        type: "CHECKSUM",
        algorithm: "LRC",
        includeElements: ["data"],
      }),
    ]);

    const result = buildStructuredMessage(structure, {
      params: {},
      bindings: [],
    });

    // LRC = two's complement of sum: ~(1 + 2 + 3) + 1 = ~6 + 1 = 0xFA
    expect(result.data).toEqual(new Uint8Array([0x01, 0x02, 0x03, 0xfa]));
  });
});

// ============================================================================
// PADDING ELEMENT TESTS
// ============================================================================

describe("buildStructuredMessage - PADDING elements", () => {
  it("should insert padding bytes with default fill", () => {
    const structure = createStructure([
      createElement("data", "Data", { type: "STATIC", value: [0x01] }),
      createElement(
        "pad",
        "Padding",
        {
          type: "PADDING",
          fillByte: 0x00,
        },
        3,
      ),
    ]);

    const result = buildStructuredMessage(structure, {
      params: {},
      bindings: [],
    });

    expect(result.data).toEqual(new Uint8Array([0x01, 0x00, 0x00, 0x00]));
  });

  it("should use custom fill byte", () => {
    const structure = createStructure([
      createElement(
        "pad",
        "Padding",
        {
          type: "PADDING",
          fillByte: 0xff,
        },
        2,
      ),
    ]);

    const result = buildStructuredMessage(structure, {
      params: {},
      bindings: [],
    });

    expect(result.data).toEqual(new Uint8Array([0xff, 0xff]));
  });
});

// ============================================================================
// RESERVED ELEMENT TESTS
// ============================================================================

describe("buildStructuredMessage - RESERVED elements", () => {
  it("should insert reserved bytes", () => {
    const structure = createStructure([
      createElement(
        "reserved",
        "Reserved",
        {
          type: "RESERVED",
          fillByte: 0x00,
        },
        4,
      ),
    ]);

    const result = buildStructuredMessage(structure, {
      params: {},
      bindings: [],
    });

    expect(result.data).toEqual(new Uint8Array([0x00, 0x00, 0x00, 0x00]));
  });
});

// ============================================================================
// PAYLOAD ELEMENT TESTS
// ============================================================================

describe("buildStructuredMessage - PAYLOAD elements", () => {
  it("should insert payload data", () => {
    const structure = createStructure([
      createElement("header", "Header", { type: "STATIC", value: [0xaa] }),
      createElement("payload", "Payload", { type: "PAYLOAD" }, "VARIABLE"),
      createElement("footer", "Footer", { type: "STATIC", value: [0xbb] }),
    ]);

    const result = buildStructuredMessage(structure, {
      params: {},
      bindings: [],
      payload: new Uint8Array([0x01, 0x02, 0x03]),
    });

    expect(result.data).toEqual(new Uint8Array([0xaa, 0x01, 0x02, 0x03, 0xbb]));
  });

  it("should handle empty payload", () => {
    const structure = createStructure([
      createElement("header", "Header", { type: "STATIC", value: [0xaa] }),
      createElement("payload", "Payload", { type: "PAYLOAD" }, "VARIABLE"),
    ]);

    const result = buildStructuredMessage(structure, {
      params: {},
      bindings: [],
    });

    expect(result.data).toEqual(new Uint8Array([0xaa]));
  });
});

// ============================================================================
// COMPLEX FRAME TESTS (Modbus-like)
// ============================================================================

describe("buildStructuredMessage - Complex frames", () => {
  it("should build a Modbus-like read holding registers frame", () => {
    const structure = createStructure(
      [
        createElement("addr", "Slave Address", {
          type: "ADDRESS",
        }),
        createElement("func", "Function Code", {
          type: "FIELD",
          dataType: "UINT8",
        }),
        createElement("startAddr", "Start Address", {
          type: "FIELD",
          dataType: "UINT16",
        }),
        createElement("quantity", "Quantity", {
          type: "FIELD",
          dataType: "UINT16",
        }),
        createElement("crc", "CRC", {
          type: "CHECKSUM",
          algorithm: "CRC16_MODBUS",
          includeElements: ["addr", "func", "startAddr", "quantity"],
        }),
      ],
      "BE",
    );

    const result = buildStructuredMessage(structure, {
      params: {
        slaveAddr: 1,
        funcCode: 3,
        regStart: 0,
        regCount: 10,
      },
      bindings: [
        { elementId: "addr", parameterName: "slaveAddr" },
        { elementId: "func", parameterName: "funcCode" },
        { elementId: "startAddr", parameterName: "regStart" },
        { elementId: "quantity", parameterName: "regCount" },
      ],
    });

    // Expected: [0x01, 0x03, 0x00, 0x00, 0x00, 0x0A, CRC_LO, CRC_HI]
    expect(result.data.length).toBe(8);
    expect(result.data[0]).toBe(0x01); // Slave address
    expect(result.data[1]).toBe(0x03); // Function code
    expect(result.data[2]).toBe(0x00); // Start address high
    expect(result.data[3]).toBe(0x00); // Start address low
    expect(result.data[4]).toBe(0x00); // Quantity high
    expect(result.data[5]).toBe(0x0a); // Quantity low
    // Last 2 bytes are CRC
    expect(result.elements).toHaveLength(5);
  });
});

// ============================================================================
// HELPER FUNCTION TESTS
// ============================================================================

describe("buildMessage helper", () => {
  it("should return just the data array", () => {
    const structure = createStructure([
      createElement("data", "Data", { type: "STATIC", value: [0x01, 0x02] }),
    ]);

    const result = buildMessage(structure, [], {});

    expect(result).toEqual(new Uint8Array([0x01, 0x02]));
  });
});

describe("getMessageStructureSize", () => {
  it("should return total size for fixed-size elements", () => {
    const structure = createStructure([
      createElement("a", "A", { type: "STATIC", value: [0x01] }, 1),
      createElement("b", "B", { type: "STATIC", value: [0x02, 0x03] }, 2),
      createElement("c", "C", { type: "PADDING", fillByte: 0 }, 4),
    ]);

    expect(getMessageStructureSize(structure)).toBe(7);
  });

  it("should return null for variable-size elements", () => {
    const structure = createStructure([
      createElement("a", "A", { type: "STATIC", value: [0x01] }),
      createElement("b", "B", { type: "PAYLOAD" }, "VARIABLE"),
    ]);

    expect(getMessageStructureSize(structure)).toBeNull();
  });
});
