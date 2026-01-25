/**
 * Protocol Editor Helper Functions
 *
 * Utility functions used across Protocol Editor components
 */

import type { MessageElement } from "../../lib/protocolTypes";

/**
 * Get default bytes representation for a message element
 */
export const getElementDefaultBytes = (
  element: MessageElement,
): { bytes: number[]; label: string; isComputed: boolean } => {
  const config = element.config;

  switch (config.type) {
    case "STATIC":
      return {
        bytes: config.value,
        label: `[${config.value.map((b) => b.toString(16).padStart(2, "0").toUpperCase()).join(" ")}]`,
        isComputed: false,
      };

    case "ADDRESS":
      return {
        bytes: [config.range.min],
        label: `[${config.range.min.toString(16).padStart(2, "0").toUpperCase()}]`,
        isComputed: false,
      };

    case "FIELD": {
      // Default based on data type size
      const size =
        typeof element.size === "number"
          ? element.size
          : config.dataType === "UINT8" || config.dataType === "INT8"
            ? 1
            : config.dataType === "UINT16" || config.dataType === "INT16"
              ? 2
              : config.dataType === "UINT32" ||
                  config.dataType === "INT32" ||
                  config.dataType === "FLOAT32"
                ? 4
                : config.dataType === "FLOAT64"
                  ? 8
                  : 1;
      return {
        bytes: Array(size).fill(0),
        label: `${config.dataType}`,
        isComputed: false,
      };
    }

    case "LENGTH":
      return {
        bytes:
          typeof element.size === "number" ? Array(element.size).fill(0) : [0],
        label: "(computed)",
        isComputed: true,
      };

    case "CHECKSUM":
      return {
        bytes:
          typeof element.size === "number" ? Array(element.size).fill(0) : [0],
        label: `(${config.algorithm})`,
        isComputed: true,
      };

    case "PAYLOAD":
      return {
        bytes: [],
        label: "<payload>",
        isComputed: false,
      };

    case "PADDING":
      return {
        bytes:
          typeof element.size === "number"
            ? Array(element.size).fill(config.fillByte)
            : [config.fillByte],
        label: `fill: 0x${config.fillByte.toString(16).padStart(2, "0").toUpperCase()}`,
        isComputed: false,
      };

    case "RESERVED":
      return {
        bytes:
          typeof element.size === "number"
            ? Array(element.size).fill(config.fillByte)
            : [config.fillByte],
        label: `fill: 0x${config.fillByte.toString(16).padStart(2, "0").toUpperCase()}`,
        isComputed: false,
      };

    default:
      return { bytes: [0], label: "?", isComputed: false };
  }
};

/**
 * Convert delimiter string to hex display
 */
export const stringToHexDisplay = (str: string): string => {
  // Handle escape sequences
  const unescaped = str
    .replace(/\\r/g, "\r")
    .replace(/\\n/g, "\n")
    .replace(/\\t/g, "\t");
  return Array.from(unescaped)
    .map((c) => c.charCodeAt(0).toString(16).padStart(2, "0").toUpperCase())
    .join(" ");
};
