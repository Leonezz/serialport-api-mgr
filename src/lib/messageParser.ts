/**
 * Message Parser Module
 *
 * Parses binary responses using MessageStructure definitions.
 * Used for extracting data from STRUCTURED command responses.
 *
 * Supports parsing element types:
 * - STATIC: Validates expected static values
 * - ADDRESS/FIELD: Decodes parameter values
 * - LENGTH: Reads length field (used for variable-length messages)
 * - CHECKSUM: Validates checksum
 * - PAYLOAD: Extracts payload data
 * - PADDING/RESERVED: Skips bytes
 */

import { match } from "ts-pattern";
import type {
  MessageStructure,
  MessageElement,
  ByteOrder,
  DataType,
  ResponsePattern,
} from "./protocolTypes";
import { executeSandboxedScript } from "./sandboxedScripting";
import { calculateChecksum } from "./dataUtils";

// ============================================================================
// TYPES
// ============================================================================

/**
 * Result of parsing a structured message
 */
export interface ParseResult {
  /** Whether the parse was successful */
  success: boolean;
  /** Error message if parsing failed */
  error?: string;
  /** Parsed field values keyed by element name */
  fields: Record<string, ParsedValue>;
  /** Raw element data breakdown */
  elements: ElementParseInfo[];
  /** Extracted payload (if present) */
  payload?: Uint8Array;
  /** Checksum validation result */
  checksumValid?: boolean;
}

/**
 * A parsed value with type information
 */
export interface ParsedValue {
  /** The decoded value */
  value: number | string | Uint8Array;
  /** The data type used for decoding */
  dataType: DataType | "BYTES" | "STRING";
  /** Raw bytes for this field */
  raw: Uint8Array;
}

/**
 * Information about a parsed element
 */
export interface ElementParseInfo {
  elementId: string;
  name: string;
  offset: number;
  size: number;
  bytes: Uint8Array;
  value?: ParsedValue;
}

/**
 * Options for parsing a message
 */
export interface ParseOptions {
  /** Strict mode - fail on any mismatch */
  strict?: boolean;
  /** Expected length field values (for validation) */
  expectedLengths?: Record<string, number>;
}

/**
 * Result of extracting variables from a parsed message
 */
export interface ExtractionResult {
  /** Extracted variables keyed by variable name */
  variables: Record<string, unknown>;
  /** Whether extraction was successful */
  success: boolean;
  /** Error if extraction failed */
  error?: string;
}

// ============================================================================
// DECODING HELPERS
// ============================================================================

/**
 * Decode a numeric value from bytes based on data type and byte order
 */
function decodeNumericValue(
  bytes: Uint8Array,
  dataType: DataType,
  byteOrder: ByteOrder,
): number {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const isLE = byteOrder === "LE";

  return match(dataType)
    .with("UINT8", () => bytes[0])
    .with("INT8", () => (bytes[0] > 127 ? bytes[0] - 256 : bytes[0]))
    .with("UINT16", () => view.getUint16(0, isLE))
    .with("INT16", () => view.getInt16(0, isLE))
    .with("UINT32", () => view.getUint32(0, isLE))
    .with("INT32", () => view.getInt32(0, isLE))
    .with("FLOAT32", () => view.getFloat32(0, isLE))
    .with("FLOAT64", () => view.getFloat64(0, isLE))
    .with("STRING", "BYTES", () => bytes[0])
    .exhaustive();
}

/**
 * Get the size in bytes for a data type
 */
function getDataTypeSize(dataType: DataType): number {
  return match(dataType)
    .with("UINT8", "INT8", "STRING", "BYTES", () => 1)
    .with("UINT16", "INT16", () => 2)
    .with("UINT32", "INT32", "FLOAT32", () => 4)
    .with("FLOAT64", () => 8)
    .exhaustive();
}

/**
 * Compare two Uint8Arrays for equality
 */
function arraysEqual(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) return false;
  }
  return true;
}

// ============================================================================
// ELEMENT SIZE CALCULATION
// ============================================================================

/**
 * Calculate the actual size of an element, which may depend on other parsed elements
 */
function getElementSize(
  element: MessageElement,
  parsedLengths: Map<string, number>,
): number | null {
  if (typeof element.size === "number") {
    return element.size;
  }

  if (element.size === "COMPUTED") {
    // For LENGTH elements, the size should be specified numerically
    // For PAYLOAD, size may come from a LENGTH field
    if (element.config.type === "PAYLOAD") {
      // Check if there's a length field that specifies the payload size
      // This would need to be linked somehow - for now return null
      return null;
    }
    return null;
  }

  if (element.size === "VARIABLE") {
    // Variable size - cannot determine statically
    return null;
  }

  return null;
}

// ============================================================================
// MAIN PARSE FUNCTION
// ============================================================================

/**
 * Parse a binary response using a MessageStructure
 *
 * @param data - The raw binary data to parse
 * @param structure - The message structure definition
 * @param options - Parse options
 * @returns ParseResult with field values and validation status
 */
export function parseStructuredMessage(
  data: Uint8Array,
  structure: MessageStructure,
  options: ParseOptions = {},
): ParseResult {
  const byteOrder = structure.byteOrder ?? "BE";
  const fields: Record<string, ParsedValue> = {};
  const elements: ElementParseInfo[] = [];
  const parsedLengths = new Map<string, number>();
  const elementBytes = new Map<string, Uint8Array>();

  let offset = 0;
  let checksumValid: boolean | undefined;
  let payload: Uint8Array | undefined;

  for (const element of structure.elements) {
    // Determine element size
    let size: number;
    if (typeof element.size === "number") {
      size = element.size;
    } else if (element.config.type === "FIELD") {
      size = getDataTypeSize(element.config.dataType);
    } else if (element.config.type === "ADDRESS") {
      size = 1; // Default address size
    } else if (element.config.type === "LENGTH") {
      size = typeof element.size === "number" ? element.size : 1;
    } else if (element.config.type === "CHECKSUM") {
      // Determine checksum size from algorithm
      switch (element.config.algorithm) {
        case "CRC16":
        case "CRC16_MODBUS":
        case "CRC16_CCITT":
          size = 2;
          break;
        default:
          size = 1;
      }
    } else if (element.config.type === "PAYLOAD") {
      // Payload size might be calculated from LENGTH field
      // For now, consume remaining bytes (minus any trailing elements)
      const remainingElements = structure.elements.slice(
        structure.elements.indexOf(element) + 1,
      );
      let trailingSize = 0;
      for (const trailing of remainingElements) {
        if (typeof trailing.size === "number") {
          trailingSize += trailing.size;
        } else if (trailing.config.type === "CHECKSUM") {
          switch (trailing.config.algorithm) {
            case "CRC16":
            case "CRC16_MODBUS":
            case "CRC16_CCITT":
              trailingSize += 2;
              break;
            default:
              trailingSize += 1;
          }
        }
      }
      size = data.length - offset - trailingSize;
      if (size < 0) size = 0;
    } else {
      // Default to specified size or 1
      size = typeof element.size === "number" ? element.size : 1;
    }

    // Check if we have enough data
    if (offset + size > data.length) {
      return {
        success: false,
        error: `Not enough data for element "${element.name}": need ${size} bytes at offset ${offset}, but only ${data.length - offset} available`,
        fields,
        elements,
      };
    }

    // Extract bytes for this element
    const bytes = data.slice(offset, offset + size);
    elementBytes.set(element.id, bytes);

    // Parse based on element type
    let parsedValue: ParsedValue | undefined;

    switch (element.config.type) {
      case "STATIC": {
        // Validate static bytes match expected
        const expected = new Uint8Array(element.config.value);
        if (options.strict && !arraysEqual(bytes, expected)) {
          return {
            success: false,
            error: `Static element "${element.name}" mismatch: expected ${Array.from(expected)}, got ${Array.from(bytes)}`,
            fields,
            elements,
          };
        }
        parsedValue = {
          value: bytes,
          dataType: "BYTES",
          raw: bytes,
        };
        break;
      }

      case "ADDRESS":
      case "FIELD": {
        const dataType: DataType =
          element.config.type === "FIELD" ? element.config.dataType : "UINT8";
        const value = decodeNumericValue(bytes, dataType, byteOrder);
        parsedValue = {
          value,
          dataType,
          raw: bytes,
        };
        fields[element.name] = parsedValue;
        break;
      }

      case "LENGTH": {
        const lengthSize = typeof element.size === "number" ? element.size : 1;
        const dataType: DataType =
          lengthSize === 1 ? "UINT8" : lengthSize === 2 ? "UINT16" : "UINT32";
        const value = decodeNumericValue(bytes, dataType, byteOrder);
        parsedLengths.set(element.id, value);
        parsedValue = {
          value,
          dataType,
          raw: bytes,
        };
        fields[element.name] = parsedValue;
        break;
      }

      case "CHECKSUM": {
        // Validate checksum
        const config = element.config;
        const dataToCheck: number[] = [];
        for (const targetId of config.includeElements) {
          const targetBytes = elementBytes.get(targetId);
          if (targetBytes) {
            dataToCheck.push(...targetBytes);
          }
        }
        const expectedChecksum = calculateChecksum(
          new Uint8Array(dataToCheck),
          config.algorithm,
        );
        checksumValid = arraysEqual(bytes, expectedChecksum);

        if (options.strict && !checksumValid) {
          return {
            success: false,
            error: `Checksum "${element.name}" invalid: expected ${Array.from(expectedChecksum)}, got ${Array.from(bytes)}`,
            fields,
            elements,
            checksumValid: false,
          };
        }

        parsedValue = {
          value: bytes,
          dataType: "BYTES",
          raw: bytes,
        };
        break;
      }

      case "PAYLOAD": {
        payload = bytes;
        parsedValue = {
          value: bytes,
          dataType: "BYTES",
          raw: bytes,
        };
        fields[element.name] = parsedValue;
        break;
      }

      case "PADDING":
      case "RESERVED": {
        // Just skip these bytes
        parsedValue = {
          value: bytes,
          dataType: "BYTES",
          raw: bytes,
        };
        break;
      }
    }

    elements.push({
      elementId: element.id,
      name: element.name,
      offset,
      size,
      bytes,
      value: parsedValue,
    });

    offset += size;
  }

  return {
    success: true,
    fields,
    elements,
    payload,
    checksumValid,
  };
}

/**
 * Extract variables from a parsed message using response patterns
 *
 * @param parseResult - The result from parseStructuredMessage
 * @param patterns - Response patterns defining extraction rules
 * @returns ExtractionResult with extracted variables
 */
export async function extractVariables(
  parseResult: ParseResult,
  patterns: ResponsePattern[],
): Promise<ExtractionResult> {
  if (!parseResult.success) {
    return {
      variables: {},
      success: false,
      error: parseResult.error,
    };
  }

  const variables: Record<string, unknown> = {};

  for (const pattern of patterns) {
    // Check if pattern matches (by matching conditions if any)
    // For now, assume all patterns apply

    // Extract elements
    if (pattern.extractElements) {
      for (const extraction of pattern.extractElements) {
        // Find the field by element ID or name
        const field = parseResult.fields[extraction.elementId];
        if (field) {
          let value: unknown = field.value;

          // Apply transform if specified
          if (extraction.transform) {
            try {
              value = await executeSandboxedScript(
                `return ${extraction.transform}`,
                { value },
                { timeout: 1000 },
              );
            } catch (e) {
              console.warn(
                `Transform failed for ${extraction.variableName}:`,
                e,
              );
            }
          }

          variables[extraction.variableName] = value;
        }
      }
    }
  }

  return {
    variables,
    success: true,
  };
}

/**
 * Parse and extract in one step
 *
 * @param data - The raw binary data
 * @param structure - The message structure definition
 * @param patterns - Response patterns for extraction
 * @param options - Parse options
 */
export async function parseAndExtract(
  data: Uint8Array,
  structure: MessageStructure,
  patterns: ResponsePattern[] = [],
  options: ParseOptions = {},
): Promise<ParseResult & ExtractionResult> {
  const parseResult = parseStructuredMessage(data, structure, options);

  if (!parseResult.success) {
    return {
      ...parseResult,
      variables: {},
    };
  }

  const extractResult = await extractVariables(parseResult, patterns);

  return {
    ...parseResult,
    ...extractResult,
  };
}

/**
 * Validate that a message matches a structure without extracting all fields
 *
 * @param data - The raw binary data
 * @param structure - The message structure definition
 * @returns Whether the message matches the structure
 */
export function validateStructure(
  data: Uint8Array,
  structure: MessageStructure,
): boolean {
  const result = parseStructuredMessage(data, structure, { strict: true });
  return result.success && (result.checksumValid ?? true);
}

/**
 * Get the minimum expected size of a message structure
 */
export function getMinimumMessageSize(structure: MessageStructure): number {
  let total = 0;
  for (const element of structure.elements) {
    if (typeof element.size === "number") {
      total += element.size;
    } else if (element.config.type === "FIELD") {
      total += getDataTypeSize(element.config.dataType);
    } else if (element.config.type === "CHECKSUM") {
      switch (element.config.algorithm) {
        case "CRC16":
        case "CRC16_MODBUS":
        case "CRC16_CCITT":
          total += 2;
          break;
        default:
          total += 1;
      }
    }
    // PAYLOAD and VARIABLE sizes contribute 0 to minimum
  }
  return total;
}
