/**
 * Protocol Framing Hook
 *
 * Provides protocol-aware framing capabilities for building and parsing
 * messages according to protocol definitions (message structures).
 *
 * This hook integrates with the session's protocol framing settings
 * and provides utilities for STRUCTURED command execution.
 */

import { useCallback, useMemo } from "react";
import { useStore } from "../lib/store";
import {
  buildStructuredMessage,
  type BuildOptions,
} from "../lib/messageBuilder";
import {
  parseStructuredMessage,
  parseAndExtract,
  type ParseResult,
  type ParseOptions,
} from "../lib/messageParser";
import type {
  Protocol,
  MessageStructure,
  CommandTemplate,
  StructuredCommand,
  ElementBinding,
  StaticBinding,
  ResponsePattern,
} from "../lib/protocolTypes";

// ============================================================================
// TYPES
// ============================================================================

export interface ProtocolFramingState {
  /** Whether protocol framing is enabled for the active session */
  isEnabled: boolean;
  /** The currently active protocol (if any) */
  activeProtocol: Protocol | null;
  /** All available protocols */
  protocols: Protocol[];
}

export interface BuildMessageOptions {
  /** Parameter values for the command */
  params: Record<string, unknown>;
  /** Optional payload data */
  payload?: Uint8Array;
}

export interface ParseMessageOptions extends ParseOptions {
  /** Response patterns for variable extraction */
  patterns?: ResponsePattern[];
}

export interface ProtocolFramingActions {
  /** Enable protocol framing for active session */
  enableProtocolFraming: (protocolId: string) => void;
  /** Disable protocol framing for active session */
  disableProtocolFraming: () => void;
  /** Get protocol by ID */
  getProtocol: (protocolId: string) => Protocol | undefined;
  /** Get message structure by ID within a protocol */
  getMessageStructure: (
    protocolId: string,
    structureId: string,
  ) => MessageStructure | undefined;
  /** Get command template by ID within a protocol */
  getCommandTemplate: (
    protocolId: string,
    commandId: string,
  ) => CommandTemplate | undefined;
  /** Build binary message for a STRUCTURED command */
  buildProtocolMessage: (
    command: StructuredCommand,
    protocol: Protocol,
    options: BuildMessageOptions,
  ) => Uint8Array;
  /** Parse binary response using a message structure */
  parseProtocolMessage: (
    data: Uint8Array,
    structure: MessageStructure,
    options?: ParseMessageOptions,
  ) => ParseResult | Promise<ParseResult>;
  /** Get framing config from active protocol */
  getProtocolFramingConfig: () => Protocol["framing"] | null;
}

// ============================================================================
// HOOK IMPLEMENTATION
// ============================================================================

export function useProtocolFraming(): ProtocolFramingState &
  ProtocolFramingActions {
  const {
    sessions,
    activeSessionId,
    protocols,
    setProtocolFramingEnabled,
    setActiveProtocolId,
  } = useStore();

  const activeSession = sessions[activeSessionId];

  // Compute state
  const isEnabled = activeSession?.protocolFramingEnabled ?? false;
  const activeProtocolId = activeSession?.activeProtocolId;

  const activeProtocol = useMemo(() => {
    if (!isEnabled || !activeProtocolId) return null;
    return protocols.find((p) => p.id === activeProtocolId) ?? null;
  }, [isEnabled, activeProtocolId, protocols]);

  // Actions
  const enableProtocolFraming = useCallback(
    (protocolId: string) => {
      const protocol = protocols.find((p) => p.id === protocolId);
      if (protocol) {
        setActiveProtocolId(protocolId);
        setProtocolFramingEnabled(true);
      }
    },
    [protocols, setActiveProtocolId, setProtocolFramingEnabled],
  );

  const disableProtocolFraming = useCallback(() => {
    setProtocolFramingEnabled(false);
    setActiveProtocolId(undefined);
  }, [setProtocolFramingEnabled, setActiveProtocolId]);

  const getProtocol = useCallback(
    (protocolId: string) => protocols.find((p) => p.id === protocolId),
    [protocols],
  );

  const getMessageStructure = useCallback(
    (protocolId: string, structureId: string) => {
      const protocol = protocols.find((p) => p.id === protocolId);
      return protocol?.messageStructures.find((s) => s.id === structureId);
    },
    [protocols],
  );

  const getCommandTemplate = useCallback(
    (protocolId: string, commandId: string) => {
      const protocol = protocols.find((p) => p.id === protocolId);
      return protocol?.commands.find((c) => c.id === commandId);
    },
    [protocols],
  );

  const buildProtocolMessage = useCallback(
    async (
      command: StructuredCommand,
      protocol: Protocol,
      options: BuildMessageOptions,
    ): Promise<Uint8Array> => {
      // Find the message structure
      const structure = protocol.messageStructures.find(
        (s) => s.id === command.messageStructureId,
      );
      if (!structure) {
        throw new Error(
          `Message structure "${command.messageStructureId}" not found in protocol "${protocol.name}"`,
        );
      }

      // Prepare bindings
      const bindings: ElementBinding[] = command.bindings || [];

      // Convert staticValues to StaticBinding format
      const staticBindings: StaticBinding[] = (command.staticValues || []).map(
        (sv) => ({
          elementId: sv.elementId,
          value: sv.value,
        }),
      );

      // Build options
      const buildOpts: BuildOptions = {
        params: options.params,
        bindings,
        staticBindings,
        payload: options.payload,
      };

      const result = await buildStructuredMessage(structure, buildOpts);
      return result.data;
    },
    [],
  );

  const parseProtocolMessage = useCallback(
    (
      data: Uint8Array,
      structure: MessageStructure,
      options?: ParseMessageOptions,
    ): ParseResult | Promise<ParseResult> => {
      const patterns = options?.patterns || [];

      if (patterns.length > 0) {
        return parseAndExtract(data, structure, patterns, options);
      }

      return parseStructuredMessage(data, structure, options);
    },
    [],
  );

  const getProtocolFramingConfig = useCallback(() => {
    if (!activeProtocol) return null;
    return activeProtocol.framing;
  }, [activeProtocol]);

  return {
    // State
    isEnabled,
    activeProtocol,
    protocols,

    // Actions
    enableProtocolFraming,
    disableProtocolFraming,
    getProtocol,
    getMessageStructure,
    getCommandTemplate,
    buildProtocolMessage,
    parseProtocolMessage,
    getProtocolFramingConfig,
  };
}
