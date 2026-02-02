/**
 * Message Builder Module
 *
 * Builds binary frames from MessageStructure definitions.
 * Used for executing STRUCTURED commands defined in protocols.
 *
 * Supports element types:
 * - STATIC: Fixed byte values
 * - ADDRESS/FIELD: Parameter-bound values with encoding
 * - LENGTH: Calculated length of referenced elements
 * - CHECKSUM: Calculated checksum over referenced elements
 * - PAYLOAD: Variable payload data
 * - PADDING: Fill bytes
 * - RESERVED: Reserved/unused bytes
 */

import type {
  MessageStructure,
  MessageElement,
  ElementBinding,
  ByteOrder,
  DataType,
  ChecksumAlgorithm,
  StaticBinding,
} from "./protocolTypes";
import { executeSandboxedScript } from "./sandboxedScripting";

// ============================================================================
// TYPES
// ============================================================================

/**
 * Result of building a structured message
 */
export interface BuildResult {
  /** The complete binary frame */
  data: Uint8Array;
  /** Breakdown of elements and their byte ranges */
  elements: ElementBuildInfo[];
}

/**
 * Information about a built element
 */
export interface ElementBuildInfo {
  elementId: string;
  name: string;
  offset: number;
  size: number;
  bytes: Uint8Array;
}

/**
 * Options for building a message
 */
export interface BuildOptions {
  /** Parameter values keyed by parameter name */
  params: Record<string, unknown>;
  /** Element bindings from the command (parameter-based) */
  bindings: ElementBinding[];
  /** Static bindings from the command (fixed values) */
  staticBindings?: StaticBinding[];
  /** Optional payload data for PAYLOAD elements */
  payload?: Uint8Array;
}

// ============================================================================
// ENCODING HELPERS
// ============================================================================

/**
 * Encode a numeric value to bytes based on data type and byte order
 */
function encodeNumericValue(
  value: number,
  dataType: DataType,
  byteOrder: ByteOrder,
): Uint8Array {
  let bytes: number[];

  switch (dataType) {
    case "UINT8":
      bytes = [value & 0xff];
      break;

    case "INT8":
      bytes = [value < 0 ? (value + 256) & 0xff : value & 0xff];
      break;

    case "UINT16":
      if (byteOrder === "BE") {
        bytes = [(value >> 8) & 0xff, value & 0xff];
      } else {
        bytes = [value & 0xff, (value >> 8) & 0xff];
      }
      break;

    case "INT16": {
      const unsigned = value < 0 ? value + 65536 : value;
      if (byteOrder === "BE") {
        bytes = [(unsigned >> 8) & 0xff, unsigned & 0xff];
      } else {
        bytes = [unsigned & 0xff, (unsigned >> 8) & 0xff];
      }
      break;
    }

    case "UINT32":
      if (byteOrder === "BE") {
        bytes = [
          (value >>> 24) & 0xff,
          (value >>> 16) & 0xff,
          (value >>> 8) & 0xff,
          value & 0xff,
        ];
      } else {
        bytes = [
          value & 0xff,
          (value >>> 8) & 0xff,
          (value >>> 16) & 0xff,
          (value >>> 24) & 0xff,
        ];
      }
      break;

    case "INT32": {
      const unsigned = value < 0 ? value + 4294967296 : value;
      if (byteOrder === "BE") {
        bytes = [
          (unsigned >>> 24) & 0xff,
          (unsigned >>> 16) & 0xff,
          (unsigned >>> 8) & 0xff,
          unsigned & 0xff,
        ];
      } else {
        bytes = [
          unsigned & 0xff,
          (unsigned >>> 8) & 0xff,
          (unsigned >>> 16) & 0xff,
          (unsigned >>> 24) & 0xff,
        ];
      }
      break;
    }

    case "FLOAT32": {
      const buffer = new ArrayBuffer(4);
      const view = new DataView(buffer);
      view.setFloat32(0, value, byteOrder === "LE");
      bytes = Array.from(new Uint8Array(buffer));
      break;
    }

    case "FLOAT64": {
      const buffer = new ArrayBuffer(8);
      const view = new DataView(buffer);
      view.setFloat64(0, value, byteOrder === "LE");
      bytes = Array.from(new Uint8Array(buffer));
      break;
    }

    default:
      // Default to single byte
      bytes = [value & 0xff];
  }

  return new Uint8Array(bytes);
}

/**
 * Get the size in bytes for a data type
 */
function getDataTypeSize(dataType: DataType): number {
  switch (dataType) {
    case "UINT8":
    case "INT8":
      return 1;
    case "UINT16":
    case "INT16":
      return 2;
    case "UINT32":
    case "INT32":
    case "FLOAT32":
      return 4;
    case "FLOAT64":
      return 8;
    default:
      return 1;
  }
}

/**
 * Convert a value to a number for encoding
 */
function toNumber(value: unknown): number {
  if (typeof value === "number") return value;
  if (typeof value === "string") {
    const num = parseFloat(value);
    return isNaN(num) ? 0 : num;
  }
  if (typeof value === "boolean") return value ? 1 : 0;
  return 0;
}

/**
 * Calculate checksum with support for all protocol checksum algorithms
 */
function calculateProtocolChecksum(
  data: Uint8Array,
  algorithm: ChecksumAlgorithm,
): Uint8Array {
  switch (algorithm) {
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
      // Big endian: High Byte first, Low Byte second
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
}

// ============================================================================
// ELEMENT BUILDERS
// ============================================================================

/**
 * Build a STATIC element
 */
function buildStaticElement(element: MessageElement): Uint8Array {
  if (element.config.type !== "STATIC") {
    throw new Error(`Expected STATIC element, got ${element.config.type}`);
  }
  return new Uint8Array(element.config.value);
}

/**
 * Build an ADDRESS or FIELD element with parameter binding
 */
async function buildFieldElement(
  element: MessageElement,
  options: BuildOptions,
  byteOrder: ByteOrder,
): Promise<Uint8Array> {
  const config = element.config;
  if (config.type !== "ADDRESS" && config.type !== "FIELD") {
    throw new Error(`Expected ADDRESS or FIELD element, got ${config.type}`);
  }

  // First check for static binding
  const staticBinding = options.staticBindings?.find(
    (b) => b.elementId === element.id,
  );
  if (staticBinding) {
    // Handle static value (could be number, array of numbers, or string)
    const val = staticBinding.value;
    if (Array.isArray(val)) {
      return new Uint8Array(val);
    }
    if (typeof val === "string") {
      // Assume hex string or text
      return new TextEncoder().encode(val);
    }
    // Single number
    const dataType: DataType =
      config.type === "FIELD" ? config.dataType : "UINT8";
    return encodeNumericValue(toNumber(val), dataType, byteOrder);
  }

  // Find parameter binding for this element
  const binding = options.bindings.find((b) => b.elementId === element.id);
  if (!binding) {
    throw new Error(
      `No binding found for element "${element.name}" (${element.id})`,
    );
  }

  // Get value from parameter
  let value: unknown = options.params[binding.parameterName];
  if (value === undefined) {
    throw new Error(
      `Parameter "${binding.parameterName}" not provided for element "${element.name}"`,
    );
  }

  // Apply transform if specified
  if (binding.transform) {
    try {
      value = await executeSandboxedScript(
        `const value = context.value; return ${binding.transform}`,
        { value },
        { timeout: 1000 },
      );
    } catch (e) {
      console.warn(`Transform failed for ${element.name}:`, e);
    }
  }

  // Get data type from config
  const dataType: DataType =
    config.type === "FIELD" ? config.dataType : "UINT8";

  // Encode value
  return encodeNumericValue(toNumber(value), dataType, byteOrder);
}

/**
 * Build a LENGTH element (placeholder - value calculated after other elements)
 */
function buildLengthPlaceholder(element: MessageElement): Uint8Array {
  // Determine size based on element.size
  const size = typeof element.size === "number" ? element.size : 1;
  return new Uint8Array(size);
}

/**
 * Build a CHECKSUM element (placeholder - value calculated after other elements)
 */
function buildChecksumPlaceholder(element: MessageElement): Uint8Array {
  if (element.config.type !== "CHECKSUM") {
    throw new Error(`Expected CHECKSUM element, got ${element.config.type}`);
  }

  // Determine size based on algorithm
  const algo = element.config.algorithm;
  switch (algo) {
    case "CRC16":
      return new Uint8Array(2);
    case "MOD256":
    case "XOR":
    default:
      return new Uint8Array(1);
  }
}

/**
 * Build a PAYLOAD element
 */
function buildPayloadElement(
  element: MessageElement,
  options: BuildOptions,
): Uint8Array {
  return options.payload ?? new Uint8Array(0);
}

/**
 * Build a PADDING element
 */
function buildPaddingElement(element: MessageElement): Uint8Array {
  if (element.config.type !== "PADDING") {
    throw new Error(`Expected PADDING element, got ${element.config.type}`);
  }
  const size = typeof element.size === "number" ? element.size : 0;
  const fillByte = element.config.fillByte ?? 0x00;
  return new Uint8Array(size).fill(fillByte);
}

/**
 * Build a RESERVED element
 */
function buildReservedElement(element: MessageElement): Uint8Array {
  if (element.config.type !== "RESERVED") {
    throw new Error(`Expected RESERVED element, got ${element.config.type}`);
  }
  const size = typeof element.size === "number" ? element.size : 0;
  const fillByte = element.config.fillByte ?? 0x00;
  return new Uint8Array(size).fill(fillByte);
}

// ============================================================================
// MAIN BUILD FUNCTION
// ============================================================================

/**
 * Build a complete binary frame from a MessageStructure
 *
 * @param structure - The message structure definition
 * @param options - Build options including params, bindings, and payload
 * @returns BuildResult with the complete binary frame and element breakdown
 */
export async function buildStructuredMessage(
  structure: MessageStructure,
  options: BuildOptions,
): Promise<BuildResult> {
  const byteOrder = structure.byteOrder ?? "BE";
  const elementResults: Map<string, Uint8Array> = new Map();
  const elementInfos: ElementBuildInfo[] = [];

  // Phase 1: Build all elements except LENGTH and CHECKSUM
  for (const element of structure.elements) {
    let bytes: Uint8Array;

    switch (element.config.type) {
      case "STATIC":
        bytes = buildStaticElement(element);
        break;

      case "ADDRESS":
      case "FIELD":
        bytes = await buildFieldElement(element, options, byteOrder);
        break;

      case "LENGTH":
        bytes = buildLengthPlaceholder(element);
        break;

      case "CHECKSUM":
        bytes = buildChecksumPlaceholder(element);
        break;

      case "PAYLOAD":
        bytes = buildPayloadElement(element, options);
        break;

      case "PADDING":
        bytes = buildPaddingElement(element);
        break;

      case "RESERVED":
        bytes = buildReservedElement(element);
        break;

      default:
        throw new Error(
          `Unknown element type: ${(element.config as { type: string }).type}`,
        );
    }

    elementResults.set(element.id, bytes);
  }

  // Phase 2: Calculate LENGTH elements
  for (const element of structure.elements) {
    if (element.config.type !== "LENGTH") continue;

    const config = element.config;
    let totalLength = config.adjustment ?? 0;

    for (const targetId of config.includeElements) {
      const targetBytes = elementResults.get(targetId);
      if (targetBytes) {
        totalLength += targetBytes.length;
      } else {
        console.warn(`LENGTH element references unknown element: ${targetId}`);
      }
    }

    // Encode length value
    const size = typeof element.size === "number" ? element.size : 1;
    const dataType: DataType =
      size === 1 ? "UINT8" : size === 2 ? "UINT16" : "UINT32";
    const lengthBytes = encodeNumericValue(totalLength, dataType, byteOrder);
    elementResults.set(element.id, lengthBytes);
  }

  // Phase 3: Calculate CHECKSUM elements
  for (const element of structure.elements) {
    if (element.config.type !== "CHECKSUM") continue;

    const config = element.config;

    // Collect bytes from referenced elements
    const dataToChecksum: number[] = [];
    for (const targetId of config.includeElements) {
      const targetBytes = elementResults.get(targetId);
      if (targetBytes) {
        dataToChecksum.push(...targetBytes);
      } else {
        console.warn(
          `CHECKSUM element references unknown element: ${targetId}`,
        );
      }
    }

    // Calculate checksum
    const checksumBytes = calculateProtocolChecksum(
      new Uint8Array(dataToChecksum),
      config.algorithm,
    );
    elementResults.set(element.id, checksumBytes);
  }

  // Phase 4: Assemble final frame in order
  let offset = 0;
  const parts: Uint8Array[] = [];

  for (const element of structure.elements) {
    const bytes = elementResults.get(element.id)!;
    parts.push(bytes);

    elementInfos.push({
      elementId: element.id,
      name: element.name,
      offset,
      size: bytes.length,
      bytes: bytes,
    });

    offset += bytes.length;
  }

  // Concatenate all parts
  const totalLength = parts.reduce((sum, p) => sum + p.length, 0);
  const data = new Uint8Array(totalLength);
  let pos = 0;
  for (const part of parts) {
    data.set(part, pos);
    pos += part.length;
  }

  return {
    data,
    elements: elementInfos,
  };
}

/**
 * Convenience function to build a message from command and protocol data
 *
 * @param structure - The message structure
 * @param bindings - Element bindings from the command
 * @param params - Parameter values
 * @param payload - Optional payload data
 */
export async function buildMessage(
  structure: MessageStructure,
  bindings: ElementBinding[],
  params: Record<string, unknown>,
  payload?: Uint8Array,
): Promise<Uint8Array> {
  const result = await buildStructuredMessage(structure, {
    params,
    bindings,
    payload,
  });
  return result.data;
}

/**
 * Get the expected size of a message structure (if all sizes are fixed)
 */
export function getMessageStructureSize(
  structure: MessageStructure,
): number | null {
  let total = 0;
  for (const element of structure.elements) {
    if (typeof element.size === "number") {
      total += element.size;
    } else {
      // Variable or computed size - can't determine statically
      return null;
    }
  }
  return total;
}
