/**
 * Protocol Integration Module
 *
 * This module implements the two-layer architecture for protocol integration.
 * It provides functions to:
 * - Create commands from protocol templates
 * - Merge protocol layer (L1) and command layer (L2) at runtime
 * - Sync protocol layer when protocols are updated
 * - Create custom commands (not from protocols)
 *
 * Architecture Overview:
 * - Layer 1 (Protocol Layer): Data synced from protocol templates
 * - Layer 2 (Command Layer): User customizations, never overwritten by sync
 * - Effective Command: Runtime merge of L1 + L2 for execution
 */

import { generateId } from "./utils";
import type {
  SavedCommand,
  ProtocolLayer,
  CommandLayer,
  CommandParameter,
  CommandValidation,
  CommandScripting,
  FramingConfig,
  DataMode,
  TextEncoding,
  VariableExtractionRule,
  SimpleParameter,
  SimpleExtraction,
  ElementBinding,
} from "../types";
import type {
  Protocol,
  CommandTemplate,
  SimpleCommand,
  StructuredCommand,
} from "./protocolTypes";

// ============================================================================
// TYPES
// ============================================================================

/**
 * Effective command configuration after merging L1 + L2
 * This is what gets passed to the execution pipeline
 */
export interface EffectiveCommand {
  name: string;
  description?: string;
  payload: string;
  mode: DataMode;
  encoding?: TextEncoding;
  parameters: CommandParameter[];
  validation?: CommandValidation;
  scripting?: CommandScripting;
  framing?: FramingConfig;
  messageStructureId?: string;
  elementBindings?: ElementBinding[];
  extractionRules?: VariableExtractionRule[];
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Maps a SimpleExtraction (from protocol) to a VariableExtractionRule (for execution)
 */
function mapProtocolExtraction(
  extraction: SimpleExtraction,
): VariableExtractionRule {
  return {
    id: generateId(),
    variableName: extraction.variableName,
    pattern: extraction.pattern,
    captureGroup: 1, // Default to first capture group
    transform: extraction.transform,
  };
}

/**
 * Maps a SimpleParameter (from protocol) to a CommandParameter (for execution)
 * with optional enhancements from the command layer
 */
function mapProtocolParameter(
  protoParam: SimpleParameter,
  enhancement?: CommandLayer["parameterEnhancements"] extends Record<
    string,
    infer E
  >
    ? E
    : never,
): CommandParameter {
  return {
    id: generateId(),
    name: protoParam.name,
    label: enhancement?.customLabel ?? protoParam.label,
    description: protoParam.description,
    type: protoParam.type,
    defaultValue:
      enhancement?.customDefault !== undefined
        ? (enhancement.customDefault as string | number | boolean)
        : protoParam.defaultValue,
    required: protoParam.required,
    min: protoParam.min,
    max: protoParam.max,
    maxLength: protoParam.maxLength,
    options: protoParam.options,
    // Application mode from L2 (command layer)
    application: enhancement?.application ?? {
      mode: "SUBSTITUTE" as const,
      substitute: { type: "DIRECT" as const },
    },
  };
}

/**
 * Creates a ProtocolLayer from a CommandTemplate
 */
function createProtocolLayerFromTemplate(
  template: CommandTemplate,
  protocol: Protocol,
): ProtocolLayer {
  const base = {
    protocolId: protocol.id,
    protocolCommandId: template.id,
    protocolVersion: protocol.version,
    protocolCommandUpdatedAt: template.updatedAt,
  };

  if (template.type === "SIMPLE") {
    const simpleTemplate = template as SimpleCommand;
    return {
      ...base,
      payload: simpleTemplate.payload,
      mode: simpleTemplate.mode as DataMode,
      encoding: simpleTemplate.encoding as TextEncoding | undefined,
      parameters: simpleTemplate.parameters ?? [],
      validation: simpleTemplate.validation
        ? {
            enabled: simpleTemplate.validation.enabled,
            successPattern: simpleTemplate.validation.successPattern,
            successPatternType: simpleTemplate.validation.successPatternType,
            timeout: simpleTemplate.validation.timeout,
          }
        : undefined,
      extractVariables: simpleTemplate.extractVariables,
      protocolPreRequestScript: simpleTemplate.hooks?.preRequest,
      protocolPostResponseScript: simpleTemplate.hooks?.postResponse,
      defaultFraming: protocol.framing as FramingConfig | undefined,
    };
  }

  // STRUCTURED command
  const structuredTemplate = template as StructuredCommand;
  return {
    ...base,
    payload: "", // STRUCTURED commands don't have a text payload
    mode: "HEX" as DataMode,
    parameters: structuredTemplate.parameters ?? [],
    messageStructureId: structuredTemplate.messageStructureId,
    elementBindings: structuredTemplate.bindings?.map((b) => ({
      elementId: b.elementId,
      parameterName: b.parameterName,
      transform: b.transform,
    })),
    validation: structuredTemplate.validation
      ? {
          enabled: structuredTemplate.validation.enabled,
          timeout: structuredTemplate.validation.timeout,
        }
      : undefined,
    // Extract variable definitions from response patterns
    extractVariables: structuredTemplate.response?.patterns?.flatMap(
      (p) =>
        p.extractElements?.map((e) => ({
          pattern: e.elementId, // Use elementId as pattern reference
          variableName: e.variableName,
          transform: e.transform,
        })) ?? [],
    ),
    defaultFraming: protocol.framing as FramingConfig | undefined,
  };
}

// ============================================================================
// CORE FUNCTIONS
// ============================================================================

/**
 * Get the effective command configuration by merging L1 (protocol) and L2 (command) layers
 *
 * For CUSTOM commands: Uses the legacy fields directly
 * For PROTOCOL commands: Merges protocolLayer + commandLayer
 *
 * @param command - The saved command to get effective config for
 * @param protocols - Array of protocols to look up message structures
 * @returns The effective command configuration for execution
 */
export function getEffectiveCommand(
  command: SavedCommand,
  protocols: Protocol[] = [],
): EffectiveCommand {
  // For CUSTOM commands, use legacy fields directly
  if (command.source === "CUSTOM" || !command.protocolLayer) {
    return {
      name: command.commandLayer?.customName ?? command.name,
      description:
        command.commandLayer?.customDescription ?? command.description,
      payload: command.payload ?? "",
      mode: command.mode ?? "TEXT",
      encoding: command.encoding,
      parameters: command.parameters ?? [],
      validation: command.validation,
      scripting: command.scripting,
      framing: command.commandLayer?.framingOverride ?? command.responseFraming,
    };
  }

  // For PROTOCOL commands, merge L1 + L2
  const L1 = command.protocolLayer;
  const L2 = command.commandLayer ?? {};

  // Merge parameters with enhancements
  const mergedParameters: CommandParameter[] = L1.parameters.map(
    (protoParam) => {
      const enhancement = L2.parameterEnhancements?.[protoParam.name];
      return mapProtocolParameter(protoParam, enhancement);
    },
  );

  // Merge scripts (L1 runs first, then L2)
  const combinedPreScript = [
    L1.protocolPreRequestScript,
    L2.userPreRequestScript,
  ]
    .filter(Boolean)
    .join("\n\n// --- User Script ---\n\n");

  const combinedPostScript = [
    L1.protocolPostResponseScript,
    L2.userPostResponseScript,
  ]
    .filter(Boolean)
    .join("\n\n// --- User Script ---\n\n");

  // Merge extractions (protocol + user additional)
  const allExtractions: VariableExtractionRule[] = [
    ...(L1.extractVariables?.map(mapProtocolExtraction) ?? []),
    ...(L2.additionalExtractions ?? []),
  ];

  // Get message structure for STRUCTURED commands
  let messageStructureId: string | undefined;
  let elementBindings: ElementBinding[] | undefined;

  if (L1.messageStructureId) {
    const protocol = protocols.find((p) => p.id === L1.protocolId);
    if (protocol) {
      messageStructureId = L1.messageStructureId;
      elementBindings = L1.elementBindings;
    }
  }

  return {
    name: L2.customName ?? command.name,
    description: L2.customDescription ?? command.description,
    payload: L1.payload,
    mode: L1.mode,
    encoding: L1.encoding,
    parameters: mergedParameters,
    messageStructureId,
    elementBindings,
    validation: {
      enabled: L1.validation?.enabled ?? false,
      mode: L1.validation?.successPattern ? "PATTERN" : "ALWAYS_PASS",
      pattern: L1.validation?.successPattern,
      matchType: L1.validation?.successPatternType,
      timeout: L2.timeoutOverride ?? L1.validation?.timeout ?? 2000,
      extractionEnabled: allExtractions.length > 0,
      extractionRules: allExtractions,
    },
    scripting:
      combinedPreScript || combinedPostScript
        ? {
            enabled: true,
            preRequestScript: combinedPreScript || undefined,
            postResponseScript: combinedPostScript || undefined,
          }
        : undefined,
    framing: L2.framingOverride ?? L1.defaultFraming,
    extractionRules: allExtractions,
  };
}

/**
 * Create a new SavedCommand from a protocol template
 *
 * @param template - The command template from the protocol
 * @param protocol - The source protocol
 * @param deviceId - Optional device ID to assign the command to
 * @returns A new SavedCommand with protocol layer populated
 */
export function instantiateFromProtocol(
  template: CommandTemplate,
  protocol: Protocol,
  deviceId?: string,
): Omit<SavedCommand, "id" | "createdAt" | "updatedAt"> {
  return {
    name: template.name,
    description: template.description,
    source: "PROTOCOL",
    creator: "PROTOCOL",
    deviceId,
    protocolLayer: createProtocolLayerFromTemplate(template, protocol),
    commandLayer: {
      // Empty by default - user can add customizations later
    },
    // Legacy fields set to defaults for backward compatibility
    payload: "",
    mode: "TEXT",
  };
}

/**
 * Sync the protocol layer with the latest protocol template
 *
 * This function updates Layer 1 (protocol layer) while preserving
 * Layer 2 (command layer) customizations.
 *
 * @param command - The saved command to sync
 * @param protocol - The source protocol
 * @returns Updated command with synced protocol layer, or original if no update needed
 */
export function syncProtocolLayer(
  command: SavedCommand,
  protocol: Protocol,
): SavedCommand {
  // Only sync PROTOCOL source commands
  if (command.source !== "PROTOCOL" || !command.protocolLayer) {
    return command;
  }

  // Find the template in the protocol
  const template = protocol.commands.find(
    (c) => c.id === command.protocolLayer!.protocolCommandId,
  );

  if (!template) {
    // Template was deleted from protocol
    console.warn(
      `Template ${command.protocolLayer.protocolCommandId} not found in protocol ${protocol.id}`,
    );
    return command;
  }

  // Check if update is needed
  if (template.updatedAt <= command.protocolLayer.protocolCommandUpdatedAt) {
    return command; // Already up to date
  }

  // Update Layer 1 from template, keeping Layer 2 intact
  const newProtocolLayer = createProtocolLayerFromTemplate(template, protocol);

  return {
    ...command,
    protocolLayer: newProtocolLayer,
    updatedAt: Date.now(),
  };
}

/**
 * Sync all protocol commands in a collection
 *
 * @param commands - Array of saved commands
 * @param protocols - Array of protocols
 * @returns Array with updated commands (commands without protocol layer are unchanged)
 */
export function syncAllProtocolCommands(
  commands: SavedCommand[],
  protocols: Protocol[],
): SavedCommand[] {
  return commands.map((command) => {
    if (command.source !== "PROTOCOL" || !command.protocolLayer) {
      return command;
    }

    const protocol = protocols.find(
      (p) => p.id === command.protocolLayer!.protocolId,
    );

    if (!protocol) {
      return command;
    }

    return syncProtocolLayer(command, protocol);
  });
}

/**
 * Create a custom command (not from a protocol)
 *
 * @param data - Command data
 * @param deviceId - Optional device ID
 * @returns A new SavedCommand with source set to CUSTOM
 */
export function createCustomCommand(
  data: {
    name: string;
    description?: string;
    payload: string;
    mode?: DataMode;
    encoding?: TextEncoding;
    parameters?: CommandParameter[];
    validation?: CommandValidation;
    scripting?: CommandScripting;
  },
  deviceId?: string,
): Omit<SavedCommand, "id" | "createdAt" | "updatedAt"> {
  return {
    name: data.name,
    description: data.description,
    source: "CUSTOM",
    creator: "USER",
    deviceId,
    payload: data.payload,
    mode: data.mode ?? "TEXT",
    encoding: data.encoding,
    parameters: data.parameters,
    validation: data.validation,
    scripting: data.scripting,
    commandLayer: {
      // Can be populated later with user customizations
    },
  };
}

/**
 * Check if a command needs sync (protocol layer is outdated)
 *
 * @param command - The saved command to check
 * @param protocols - Array of protocols
 * @returns True if the command needs sync
 */
export function commandNeedsSync(
  command: SavedCommand,
  protocols: Protocol[],
): boolean {
  if (command.source !== "PROTOCOL" || !command.protocolLayer) {
    return false;
  }

  const protocol = protocols.find(
    (p) => p.id === command.protocolLayer!.protocolId,
  );

  if (!protocol) {
    return false;
  }

  const template = protocol.commands.find(
    (c) => c.id === command.protocolLayer!.protocolCommandId,
  );

  if (!template) {
    return false;
  }

  return template.updatedAt > command.protocolLayer.protocolCommandUpdatedAt;
}

/**
 * Represents a single field change in protocol layer diff
 */
export interface ProtocolLayerChange {
  field: string;
  label: string;
  oldValue: unknown;
  newValue: unknown;
  type: "modified" | "added" | "removed";
}

/**
 * Compute the diff between current protocol layer and updated template
 *
 * @param command - The saved command with current protocol layer
 * @param protocols - Array of protocols
 * @returns Array of changes, or null if no sync needed
 */
export function getProtocolLayerDiff(
  command: SavedCommand,
  protocols: Protocol[],
): ProtocolLayerChange[] | null {
  if (command.source !== "PROTOCOL" || !command.protocolLayer) {
    return null;
  }

  const protocol = protocols.find(
    (p) => p.id === command.protocolLayer!.protocolId,
  );

  if (!protocol) {
    return null;
  }

  const template = protocol.commands.find(
    (c) => c.id === command.protocolLayer!.protocolCommandId,
  );

  if (!template) {
    return null;
  }

  // No update needed
  if (template.updatedAt <= command.protocolLayer.protocolCommandUpdatedAt) {
    return null;
  }

  // Create new protocol layer to compare
  const newLayer = createProtocolLayerFromTemplate(template, protocol);
  const oldLayer = command.protocolLayer;
  const changes: ProtocolLayerChange[] = [];

  // Compare key fields
  const fieldsToCompare: { key: keyof ProtocolLayer; label: string }[] = [
    { key: "payload", label: "Payload" },
    { key: "mode", label: "Mode" },
    { key: "encoding", label: "Encoding" },
    { key: "messageStructureId", label: "Message Structure" },
  ];

  for (const { key, label } of fieldsToCompare) {
    const oldVal = oldLayer[key];
    const newVal = newLayer[key];
    if (JSON.stringify(oldVal) !== JSON.stringify(newVal)) {
      changes.push({
        field: key,
        label,
        oldValue: oldVal,
        newValue: newVal,
        type:
          oldVal === undefined
            ? "added"
            : newVal === undefined
              ? "removed"
              : "modified",
      });
    }
  }

  // Compare parameters
  const oldParams = oldLayer.parameters || [];
  const newParams = newLayer.parameters || [];
  if (JSON.stringify(oldParams) !== JSON.stringify(newParams)) {
    changes.push({
      field: "parameters",
      label: "Parameters",
      oldValue: `${oldParams.length} parameter(s)`,
      newValue: `${newParams.length} parameter(s)`,
      type: "modified",
    });
  }

  // Compare validation
  if (
    JSON.stringify(oldLayer.validation) !== JSON.stringify(newLayer.validation)
  ) {
    changes.push({
      field: "validation",
      label: "Validation",
      oldValue: oldLayer.validation?.enabled ? "Enabled" : "Disabled",
      newValue: newLayer.validation?.enabled ? "Enabled" : "Disabled",
      type: "modified",
    });
  }

  // Compare scripts
  if (oldLayer.protocolPreRequestScript !== newLayer.protocolPreRequestScript) {
    changes.push({
      field: "protocolPreRequestScript",
      label: "Pre-Request Script",
      oldValue: oldLayer.protocolPreRequestScript ? "Set" : "None",
      newValue: newLayer.protocolPreRequestScript ? "Set" : "None",
      type: "modified",
    });
  }

  if (
    oldLayer.protocolPostResponseScript !== newLayer.protocolPostResponseScript
  ) {
    changes.push({
      field: "protocolPostResponseScript",
      label: "Post-Response Script",
      oldValue: oldLayer.protocolPostResponseScript ? "Set" : "None",
      newValue: newLayer.protocolPostResponseScript ? "Set" : "None",
      type: "modified",
    });
  }

  return changes;
}

/**
 * Get sync status for all commands
 *
 * @param commands - Array of saved commands
 * @param protocols - Array of protocols
 * @returns Object with arrays of synced, outdated, and orphaned command IDs
 */
export function getCommandsSyncStatus(
  commands: SavedCommand[],
  protocols: Protocol[],
): {
  synced: string[];
  outdated: string[];
  orphaned: string[];
  custom: string[];
} {
  const synced: string[] = [];
  const outdated: string[] = [];
  const orphaned: string[] = [];
  const custom: string[] = [];

  for (const command of commands) {
    if (command.source === "CUSTOM" || !command.protocolLayer) {
      custom.push(command.id);
      continue;
    }

    const protocol = protocols.find(
      (p) => p.id === command.protocolLayer!.protocolId,
    );

    if (!protocol) {
      orphaned.push(command.id);
      continue;
    }

    const template = protocol.commands.find(
      (c) => c.id === command.protocolLayer!.protocolCommandId,
    );

    if (!template) {
      orphaned.push(command.id);
      continue;
    }

    if (template.updatedAt > command.protocolLayer.protocolCommandUpdatedAt) {
      outdated.push(command.id);
    } else {
      synced.push(command.id);
    }
  }

  return { synced, outdated, orphaned, custom };
}

/**
 * Detach a protocol command (convert to CUSTOM)
 *
 * This preserves the current effective configuration but removes
 * the protocol link, so future protocol updates won't affect it.
 *
 * @param command - The saved command to detach
 * @param protocols - Array of protocols (for resolving effective config)
 * @returns A new command with source set to CUSTOM
 */
export function detachFromProtocol(
  command: SavedCommand,
  protocols: Protocol[],
): SavedCommand {
  if (command.source === "CUSTOM" || !command.protocolLayer) {
    return command;
  }

  // Get the effective command to preserve current config
  const effective = getEffectiveCommand(command, protocols);

  return {
    ...command,
    source: "CUSTOM",
    // Move effective config to legacy fields
    payload: effective.payload,
    mode: effective.mode,
    encoding: effective.encoding,
    parameters: effective.parameters,
    validation: effective.validation,
    scripting: effective.scripting,
    responseFraming: effective.framing,
    // Clear protocol layer
    protocolLayer: undefined,
    // Keep command layer customizations
    updatedAt: Date.now(),
  };
}

// ============================================================================
// MIGRATION
// ============================================================================

/**
 * Migrate an old-format command to the new two-layer architecture
 *
 * This function handles:
 * - Commands without a `source` field (pre-migration)
 * - Commands with legacy `protocolId`/`syncMode` fields
 *
 * @param command - The command to migrate (may be old or new format)
 * @returns Migrated command in two-layer format
 */
export function migrateCommand(command: SavedCommand): SavedCommand {
  // Already migrated - has source field
  if (command.source) {
    return command;
  }

  // Check if this was a protocol-linked command (old format)
  // Old format might have: protocolId, protocolCommandId, sourceProtocolVersion, syncMode
  const oldCommand = command as SavedCommand & {
    protocolId?: string;
    protocolCommandId?: string;
    sourceProtocolVersion?: string;
    sourceCommandUpdatedAt?: number;
    syncMode?: string;
  };

  if (oldCommand.protocolId && oldCommand.protocolCommandId) {
    // Was a protocol-derived command - convert to PROTOCOL source
    // Note: We can't fully reconstruct the protocol layer without the protocol
    // So we mark it as needing sync
    return {
      ...command,
      source: "PROTOCOL",
      protocolLayer: {
        protocolId: oldCommand.protocolId,
        protocolCommandId: oldCommand.protocolCommandId,
        protocolVersion: oldCommand.sourceProtocolVersion ?? "0.0.0",
        protocolCommandUpdatedAt: oldCommand.sourceCommandUpdatedAt ?? 0,
        payload: command.payload ?? "",
        mode: command.mode ?? "TEXT",
        encoding: command.encoding,
        parameters: [],
        validation: command.validation
          ? {
              enabled: command.validation.enabled ?? false,
              successPattern:
                command.validation.mode === "PATTERN"
                  ? command.validation.pattern
                  : undefined,
              successPatternType: command.validation.matchType,
              timeout: command.validation.timeout,
            }
          : undefined,
      },
      commandLayer: {
        customName: command.name,
        customDescription: command.description,
      },
    };
  }

  // Custom command - just add source field
  return {
    ...command,
    source: "CUSTOM",
    commandLayer: command.commandLayer ?? {},
  };
}

/**
 * Migrate all commands in a collection
 *
 * @param commands - Array of commands (may be mixed old/new format)
 * @returns Array of migrated commands
 */
export function migrateAllCommands(commands: SavedCommand[]): SavedCommand[] {
  return commands.map(migrateCommand);
}

/**
 * Check if a command needs migration
 *
 * @param command - The command to check
 * @returns True if the command needs migration
 */
export function commandNeedsMigration(command: SavedCommand): boolean {
  return !command.source;
}
