/**
 * Command Builder
 *
 * Merges protocolLayer (L1) and commandLayer (L2) to build executable commands.
 * Handles both CUSTOM and PROTOCOL source types.
 */

import type { SavedCommand, DataMode, TextEncoding } from "../../types";

/**
 * Executable command - final command ready to be sent
 */
export interface ExecutableCommand {
  payload: string;
  mode: DataMode;
  encoding?: TextEncoding;
  validation?: {
    enabled: boolean;
    successPattern?: string;
    successPatternType?: "CONTAINS" | "REGEX";
    timeout?: number;
  };
}

/**
 * Build executable command from SavedCommand
 *
 * For CUSTOM commands: Uses legacy fields directly
 * For PROTOCOL commands: Merges protocolLayer + commandLayer
 */
export function buildCommandForExecution(
  command: SavedCommand,
): ExecutableCommand {
  const source = command.source || "CUSTOM";

  if (source === "CUSTOM") {
    // Use legacy fields for custom commands
    return {
      payload: command.payload || "",
      mode: command.mode || "TEXT",
      encoding: command.encoding,
      validation: command.validation
        ? {
            enabled: command.validation.enabled ?? false,
            successPattern: command.validation.pattern,
            successPatternType: command.validation.matchType,
            timeout: command.validation.timeout,
          }
        : undefined,
    };
  }

  // PROTOCOL source - merge L1 + L2
  if (!command.protocolLayer) {
    console.error(
      `[commandBuilder] Command "${command.name}" (${command.id}) has source=PROTOCOL but no protocolLayer`,
    );
    return {
      payload: command.payload || "",
      mode: command.mode || "TEXT",
    };
  }

  const protocolLayer = command.protocolLayer;
  const commandLayer = command.commandLayer;

  // Build parameter values from commandLayer enhancements
  const parameterValues = buildParameterValues(protocolLayer, commandLayer);

  // Substitute parameters in payload template
  const payload = substituteParameters(
    protocolLayer.payload,
    parameterValues,
    protocolLayer.parameters || [],
  );

  // Validate hex payload if mode is HEX
  if (protocolLayer.mode === "HEX") {
    const stripped = payload.replace(/\s+/g, "");
    if (stripped.length > 0 && !/^[0-9a-fA-F]*$/.test(stripped)) {
      throw new Error(
        `Invalid hex characters in payload for "${command.name}". Expected 0-9, A-F only.`,
      );
    }
  }

  // Merge validation (L2 can override timeout)
  const validation = protocolLayer.validation
    ? {
        enabled: protocolLayer.validation.enabled ?? false,
        successPattern: protocolLayer.validation.successPattern,
        successPatternType: protocolLayer.validation.successPatternType,
        timeout:
          commandLayer?.timeoutOverride || protocolLayer.validation.timeout,
      }
    : undefined;

  return {
    payload,
    mode: protocolLayer.mode,
    encoding: protocolLayer.encoding,
    validation,
  };
}

/**
 * Build parameter values map from protocol parameters and command enhancements
 */
function buildParameterValues(
  protocolLayer: NonNullable<SavedCommand["protocolLayer"]>,
  commandLayer: SavedCommand["commandLayer"],
): Record<string, any> {
  const values: Record<string, any> = {};
  const parameters = protocolLayer.parameters || [];

  for (const param of parameters) {
    const enhancement = commandLayer?.parameterEnhancements?.[param.name];

    // Use customDefault from L2, or defaultValue from L1, or empty string
    const value = enhancement?.customDefault ?? param.defaultValue ?? "";

    // For required parameters without a value, throw error
    if (
      param.required &&
      (value === "" || value === null || value === undefined)
    ) {
      throw new Error(`Required parameter "${param.name}" has no value`);
    }

    values[param.name] = value;
  }

  return values;
}

/**
 * Substitute parameters in payload template
 *
 * Template syntax: {paramName}
 * Escaped braces: \{ and \} for literal braces
 *
 * Examples:
 * - Template: "AT+{command}" + values: {command: "GMR"} → "AT+GMR"
 * - Template: "G{code} X{x} Y{y}" + values: {code: 1, x: 10, y: 20} → "G1 X10 Y20"
 */
export function substituteParameters(
  template: string,
  values: Record<string, any>,
  parameters: Array<{ name?: string; type?: string; required?: boolean }>,
): string {
  let result = template;

  // Replace each parameter
  for (const param of parameters) {
    // Skip parameters without name or type
    if (!param.name || !param.type) continue;

    const paramName = param.name;
    const value = values[paramName];

    // Skip if no value (already validated for required params)
    if (value === undefined || value === null || value === "") {
      continue;
    }

    // Format value based on parameter type
    const formattedValue = formatParameterValue(value, param.type);

    // Replace all occurrences of {paramName}
    const regex = new RegExp(`\\{${escapeRegExp(paramName)}\\}`, "g");
    result = result.replace(regex, formattedValue);
  }

  // Handle escaped braces (convert \{ to { and \} to })
  result = result.replace(/\\{/g, "{").replace(/\\}/g, "}");

  // Check for unreplaced parameters (template has {something} that wasn't in parameters list)
  const unreplacedMatch = result.match(/\{([^}]+)\}/);
  if (unreplacedMatch) {
    console.warn(
      `Template contains unreplaced parameter: ${unreplacedMatch[1]}`,
    );
  }

  return result;
}

/**
 * Format parameter value based on type
 */
function formatParameterValue(value: any, type: string): string {
  switch (type) {
    case "STRING":
      return String(value);

    case "INTEGER":
      return String(Math.floor(Number(value)));

    case "FLOAT":
      return String(Number(value));

    case "BOOLEAN":
      return value ? "1" : "0";

    case "ENUM":
      return String(value);

    default:
      return String(value);
  }
}

/**
 * Escape special regex characters
 */
function escapeRegExp(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Get effective payload (merged L1+L2 or legacy)
 */
export function getEffectivePayload(command: SavedCommand): string {
  const source = command.source || "CUSTOM";

  if (source === "CUSTOM") {
    return command.payload || "";
  }

  if (!command.protocolLayer) {
    console.error(
      `[commandBuilder] Command "${command.name}" (${command.id}) has source=PROTOCOL but no protocolLayer`,
    );
    return command.payload || "";
  }

  const parameterValues = buildParameterValues(
    command.protocolLayer,
    command.commandLayer,
  );

  return substituteParameters(
    command.protocolLayer.payload,
    parameterValues,
    command.protocolLayer.parameters || [],
  );
}

/**
 * Get effective mode (merged L1+L2 or legacy)
 */
export function getEffectiveMode(command: SavedCommand): DataMode {
  const source = command.source || "CUSTOM";

  if (source === "CUSTOM") {
    return command.mode || "TEXT";
  }

  if (!command.protocolLayer) {
    console.error(
      `[commandBuilder] Command "${command.name}" (${command.id}) has source=PROTOCOL but no protocolLayer`,
    );
    return command.mode || "TEXT";
  }

  return command.protocolLayer.mode;
}

/**
 * Get effective name (commandLayer override or base name)
 */
export function getEffectiveName(command: SavedCommand): string {
  const source = command.source || "CUSTOM";

  if (source === "CUSTOM") {
    return command.name;
  }

  return command.commandLayer?.customName || command.name;
}

/**
 * Get effective description (commandLayer override or base description)
 */
export function getEffectiveDescription(
  command: SavedCommand,
): string | undefined {
  const source = command.source || "CUSTOM";

  if (source === "CUSTOM") {
    return command.description;
  }

  return command.commandLayer?.customDescription || command.description;
}
