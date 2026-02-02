/**
 * Parameter application utilities
 * Handles variable detection and replacement based on parameter application modes
 */

import type {
  VariableSyntax,
  CommandParameter,
  ParameterApplication,
  SavedCommand,
} from "../types";
import { executeUserScript } from "./scripting";

/**
 * Get the regex pattern for a variable syntax
 */
const getVariablePattern = (
  syntax: VariableSyntax,
  customPattern?: string,
): RegExp => {
  switch (syntax) {
    case "SHELL":
      // ${name} or $name
      return /\$\{([a-zA-Z_][a-zA-Z0-9_]*)\}|\$([a-zA-Z_][a-zA-Z0-9_]*)/g;
    case "MUSTACHE":
      // {{name}}
      return /\{\{([a-zA-Z_][a-zA-Z0-9_]*)\}\}/g;
    case "BATCH":
      // %name%
      return /%([a-zA-Z_][a-zA-Z0-9_]*)%/g;
    case "COLON":
      // :name
      return /:([a-zA-Z_][a-zA-Z0-9_]*)/g;
    case "BRACES":
      // {name}
      return /\{([a-zA-Z_][a-zA-Z0-9_]*)\}/g;
    case "CUSTOM":
      if (customPattern) {
        try {
          return new RegExp(customPattern, "g");
        } catch {
          console.warn(
            "Invalid custom variable pattern, falling back to SHELL",
          );
        }
      }
      return /\$\{([a-zA-Z_][a-zA-Z0-9_]*)\}/g;
    default:
      return /\$\{([a-zA-Z_][a-zA-Z0-9_]*)\}/g;
  }
};

/**
 * Detect variables in payload based on syntax
 */
export const detectVariables = (
  payload: string,
  syntax: VariableSyntax = "SHELL",
  customPattern?: string,
): string[] => {
  const pattern = getVariablePattern(syntax, customPattern);
  const variables: string[] = [];
  let match;

  while ((match = pattern.exec(payload)) !== null) {
    // For SHELL syntax, match[1] is ${name} and match[2] is $name
    const varName = match[1] || match[2];
    if (varName && !variables.includes(varName)) {
      variables.push(varName);
    }
  }

  return variables;
};

/**
 * Apply substitute mode to a value
 */
const applySubstitute = (
  value: unknown,
  config: ParameterApplication["substitute"],
): string => {
  const strValue = String(value);
  const type = config?.type || "DIRECT";

  switch (type) {
    case "QUOTED": {
      const quoteStyle = config?.quoteStyle || "DOUBLE";
      const quote =
        quoteStyle === "DOUBLE" ? '"' : quoteStyle === "SINGLE" ? "'" : "`";
      return `${quote}${strValue}${quote}`;
    }
    case "ESCAPED": {
      const escapeChars = config?.escapeChars || '"\\';
      let escaped = strValue;
      for (const char of escapeChars) {
        escaped = escaped.split(char).join("\\" + char);
      }
      return escaped;
    }
    case "URL_ENCODED":
      return encodeURIComponent(strValue);
    case "BASE64":
      return btoa(strValue);
    case "DIRECT":
    default:
      return strValue;
  }
};

/**
 * Apply transform mode to a value
 */
const applyTransform = async (
  value: unknown,
  config: ParameterApplication["transform"],
  params: Record<string, unknown>,
): Promise<string> => {
  const preset = config?.preset || "CUSTOM";

  switch (preset) {
    case "UPPERCASE":
      return String(value).toUpperCase();
    case "LOWERCASE":
      return String(value).toLowerCase();
    case "TO_HEX": {
      const num = typeof value === "number" ? value : parseInt(String(value));
      return isNaN(num) ? String(value) : num.toString(16);
    }
    case "FROM_HEX": {
      const parsed = parseInt(String(value), 16);
      return isNaN(parsed) ? String(value) : String(parsed);
    }
    case "CHECKSUM_MOD256": {
      const bytes =
        value instanceof Uint8Array
          ? value
          : new TextEncoder().encode(String(value));
      let sum = 0;
      for (const b of bytes) sum = (sum + b) % 256;
      return sum.toString(16).padStart(2, "0");
    }
    case "CHECKSUM_XOR": {
      const bytes =
        value instanceof Uint8Array
          ? value
          : new TextEncoder().encode(String(value));
      let xor = 0;
      for (const b of bytes) xor ^= b;
      return xor.toString(16).padStart(2, "0");
    }
    case "CHECKSUM_CRC16": {
      const bytes =
        value instanceof Uint8Array
          ? value
          : new TextEncoder().encode(String(value));
      let crc = 0xffff;
      for (let i = 0; i < bytes.length; i++) {
        crc ^= bytes[i];
        for (let j = 0; j < 8; j++) {
          if ((crc & 1) !== 0) {
            crc = (crc >> 1) ^ 0xa001;
          } else {
            crc = crc >> 1;
          }
        }
      }
      return crc.toString(16).padStart(4, "0");
    }
    case "JSON_STRINGIFY":
      return JSON.stringify(value);
    case "JSON_PARSE":
      try {
        return String(JSON.parse(String(value)));
      } catch {
        return String(value);
      }
    case "LENGTH":
      return String(
        typeof value === "string"
          ? value.length
          : Array.isArray(value)
            ? value.length
            : String(value).length,
      );
    case "TRIM":
      return String(value).trim();
    case "CUSTOM":
      if (config?.expression) {
        try {
          const result = await executeUserScript(config.expression, {
            value,
            params,
            Math,
            parseInt,
            parseFloat,
            String,
            Number,
          });
          return String(result);
        } catch (e) {
          console.warn("Transform expression failed:", e);
          return String(value);
        }
      }
      return String(value);
    default:
      return String(value);
  }
};

/**
 * Apply format mode to a value
 */
const applyFormat = (
  value: unknown,
  config: ParameterApplication["format"],
): string => {
  const type = config?.type || "NUMBER";

  switch (type) {
    case "NUMBER": {
      const numConfig = config?.number || {};
      const num = typeof value === "number" ? value : parseFloat(String(value));
      if (isNaN(num)) return String(value);

      const radix = parseInt(numConfig.radix || "10");
      let result = numConfig.signed && num < 0 ? "-" : "";
      const absNum = Math.abs(num);

      // Convert to string with radix
      let numStr = Math.floor(absNum).toString(radix);
      if (numConfig.uppercase) numStr = numStr.toUpperCase();

      // Apply padding
      if (
        numConfig.width &&
        numConfig.padding &&
        numConfig.padding !== "NONE"
      ) {
        const padChar = numConfig.padding === "ZERO" ? "0" : " ";
        numStr = numStr.padStart(numConfig.width, padChar);
      }

      // Apply prefix/suffix
      result += (numConfig.prefix || "") + numStr + (numConfig.suffix || "");
      return result;
    }

    case "STRING": {
      const strConfig = config?.string || {};
      let result = String(value);

      // Truncate if needed
      if (
        strConfig.truncate &&
        strConfig.width &&
        result.length > strConfig.width
      ) {
        result = result.substring(0, strConfig.width);
      }

      // Pad to width
      if (strConfig.width && result.length < strConfig.width) {
        const padChar = strConfig.paddingChar || " ";
        const alignment = strConfig.alignment || "LEFT";
        const padNeeded = strConfig.width - result.length;

        if (alignment === "LEFT") {
          result = result + padChar.repeat(padNeeded);
        } else if (alignment === "RIGHT") {
          result = padChar.repeat(padNeeded) + result;
        } else {
          const leftPad = Math.floor(padNeeded / 2);
          const rightPad = padNeeded - leftPad;
          result = padChar.repeat(leftPad) + result + padChar.repeat(rightPad);
        }
      }

      // Null terminate
      if (strConfig.nullTerminate) {
        result += "\0";
      }

      return result;
    }

    case "DATE": {
      const dateConfig = config?.date || {};
      const date = value instanceof Date ? value : new Date(String(value));
      if (isNaN(date.getTime())) return String(value);

      const format = dateConfig.format || "ISO";
      switch (format) {
        case "UNIX":
          return String(Math.floor(date.getTime() / 1000));
        case "UNIX_MS":
          return String(date.getTime());
        case "CUSTOM":
          // Basic pattern replacement
          if (dateConfig.customPattern) {
            let result = dateConfig.customPattern;
            result = result.replace("YYYY", String(date.getFullYear()));
            result = result.replace(
              "MM",
              String(date.getMonth() + 1).padStart(2, "0"),
            );
            result = result.replace(
              "DD",
              String(date.getDate()).padStart(2, "0"),
            );
            result = result.replace(
              "HH",
              String(date.getHours()).padStart(2, "0"),
            );
            result = result.replace(
              "mm",
              String(date.getMinutes()).padStart(2, "0"),
            );
            result = result.replace(
              "ss",
              String(date.getSeconds()).padStart(2, "0"),
            );
            return result;
          }
          return date.toISOString();
        case "ISO":
        default:
          return date.toISOString();
      }
    }

    case "BYTES": {
      const bytesConfig = config?.bytes || {};
      const num = typeof value === "number" ? value : parseInt(String(value));
      if (isNaN(num)) return String(value);

      const byteSize = parseInt(bytesConfig.byteSize || "1");
      const endianness = bytesConfig.endianness || "LE";
      const output = bytesConfig.output || "RAW";

      // Convert number to bytes
      const bytes = new Uint8Array(byteSize);
      let n = bytesConfig.signed && num < 0 ? (1 << (byteSize * 8)) + num : num;

      if (endianness === "LE") {
        for (let i = 0; i < byteSize; i++) {
          bytes[i] = n & 0xff;
          n = Math.floor(n / 256);
        }
      } else {
        for (let i = byteSize - 1; i >= 0; i--) {
          bytes[i] = n & 0xff;
          n = Math.floor(n / 256);
        }
      }

      // Format output
      switch (output) {
        case "ARRAY":
          return "[" + Array.from(bytes).join(", ") + "]";
        case "HEX_STRING":
          return Array.from(bytes)
            .map((b) => b.toString(16).padStart(2, "0"))
            .join("");
        case "RAW":
        default:
          // Return raw bytes as string (for binary protocols)
          return String.fromCharCode(...bytes);
      }
    }

    default:
      return String(value);
  }
};

/**
 * Apply position mode - returns bytes to insert at specific offset
 * This is for binary protocols where values are inserted at specific byte positions
 */
export const applyPosition = async (
  value: unknown,
  config: ParameterApplication["position"],
): Promise<{ offset: number; bytes: Uint8Array }> => {
  const posConfig = config || { byteOffset: 0, byteSize: "1" };
  const byteSize = parseInt(posConfig.byteSize || "1");
  const endianness = posConfig.endianness || "LE";

  // Apply value transform if specified
  let num: number;
  if (posConfig.valueTransform) {
    try {
      const result = await executeUserScript(posConfig.valueTransform, {
        value,
        Math,
        parseInt,
        parseFloat,
      });
      num = typeof result === "number" ? result : parseFloat(String(result));
    } catch {
      num = typeof value === "number" ? value : parseFloat(String(value));
    }
  } else {
    num = typeof value === "number" ? value : parseFloat(String(value));
  }

  if (isNaN(num)) num = 0;

  // Convert to bytes
  const bytes = new Uint8Array(byteSize);
  let n = num < 0 ? (1 << (byteSize * 8)) + num : num;

  if (endianness === "LE") {
    for (let i = 0; i < byteSize; i++) {
      bytes[i] = n & 0xff;
      n = Math.floor(n / 256);
    }
  } else {
    for (let i = byteSize - 1; i >= 0; i--) {
      bytes[i] = n & 0xff;
      n = Math.floor(n / 256);
    }
  }

  // Handle bit field if specified
  if (posConfig.bitField) {
    // For bit fields, we need to merge with existing data
    // This is handled differently in the caller
  }

  return {
    offset: posConfig.byteOffset || 0,
    bytes,
  };
};

/**
 * Apply a single parameter value based on its application config
 */
const applyParameterValue = async (
  value: unknown,
  application: ParameterApplication | undefined,
  params: Record<string, unknown>,
): Promise<string> => {
  const mode = application?.mode || "SUBSTITUTE";

  switch (mode) {
    case "SUBSTITUTE":
      return applySubstitute(value, application?.substitute);
    case "TRANSFORM":
      return await applyTransform(value, application?.transform, params);
    case "FORMAT":
      return applyFormat(value, application?.format);
    case "POSITION":
      // Position mode is handled separately for binary data
      // For text payloads, just return the value as string
      return String(value);
    default:
      return String(value);
  }
};

/**
 * Apply parameters to a payload string
 * Replaces variables with parameter values based on their application modes
 */
export const applyParameters = async (
  payload: string,
  params: Record<string, unknown>,
  command?: SavedCommand,
): Promise<string> => {
  if (!command) {
    // Simple replacement without application modes
    const syntax = "SHELL";
    const pattern = getVariablePattern(syntax);
    return payload.replace(pattern, (match, name1, name2) => {
      const varName = name1 || name2;
      return varName in params ? String(params[varName]) : match;
    });
  }

  const syntax = command.variableSyntax || "SHELL";
  const caseSensitive = command.caseSensitiveVariables !== false;
  const pattern = getVariablePattern(syntax, command.customVariablePattern);

  // Build a map of parameter names to their configs
  const paramConfigs = new Map<string, CommandParameter>();
  if (command.parameters) {
    for (const param of command.parameters) {
      const key = caseSensitive ? param.name : param.name.toLowerCase();
      paramConfigs.set(key, param);
    }
  }

  // Collect all matches first (since replace callback can't be async)
  const matches: Array<{
    match: string;
    index: number;
    varName: string;
    lookupKey: string;
  }> = [];
  let execResult: RegExpExecArray | null;
  const globalPattern = new RegExp(pattern.source, pattern.flags + "g");
  while ((execResult = globalPattern.exec(payload)) !== null) {
    const varName = execResult[1] || execResult[2];
    const lookupKey = caseSensitive ? varName : varName.toLowerCase();
    matches.push({
      match: execResult[0],
      index: execResult.index,
      varName,
      lookupKey,
    });
  }

  // Process matches in reverse order to maintain correct indices
  let result = payload;
  for (let i = matches.length - 1; i >= 0; i--) {
    const { match, index, varName, lookupKey } = matches[i];

    // Check if we have a value for this variable
    let value: unknown;
    if (caseSensitive) {
      value = params[varName];
    } else {
      // Case-insensitive lookup
      const key = Object.keys(params).find(
        (k) => k.toLowerCase() === lookupKey,
      );
      value = key !== undefined ? params[key] : undefined;
    }

    if (value === undefined) {
      // No value provided, keep the original placeholder
      continue;
    }

    // Get parameter config
    const paramConfig = paramConfigs.get(lookupKey);
    const application = paramConfig?.application;

    const replacement = await applyParameterValue(value, application, params);
    result =
      result.slice(0, index) + replacement + result.slice(index + match.length);
  }

  return result;
};

/**
 * Collect position-mode parameters for binary payload construction
 * Returns a list of byte insertions to apply to a binary payload
 */
export const collectPositionParameters = async (
  params: Record<string, unknown>,
  command?: SavedCommand,
): Promise<Array<{ name: string; offset: number; bytes: Uint8Array }>> => {
  if (!command?.parameters) return [];

  const results: Array<{ name: string; offset: number; bytes: Uint8Array }> =
    [];

  for (const param of command.parameters) {
    if (param.application?.mode === "POSITION") {
      const value = params[param.name];
      if (value !== undefined) {
        const { offset, bytes } = await applyPosition(
          value,
          param.application.position,
        );
        results.push({ name: param.name, offset, bytes });
      }
    }
  }

  // Sort by offset for proper application order
  results.sort((a, b) => a.offset - b.offset);
  return results;
};

/**
 * Apply position parameters to a binary payload
 */
export const applyPositionParameters = (
  basePayload: Uint8Array,
  positionParams: Array<{ name: string; offset: number; bytes: Uint8Array }>,
): Uint8Array => {
  if (positionParams.length === 0) return basePayload;

  // Calculate required size
  const maxEnd = positionParams.reduce(
    (max, p) => Math.max(max, p.offset + p.bytes.length),
    basePayload.length,
  );

  const result = new Uint8Array(maxEnd);
  result.set(basePayload);

  // Apply each position parameter
  for (const { offset, bytes } of positionParams) {
    for (let i = 0; i < bytes.length && offset + i < result.length; i++) {
      result[offset + i] = bytes[i];
    }
  }

  return result;
};
