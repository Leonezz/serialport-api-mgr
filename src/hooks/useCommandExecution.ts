import {
  SavedCommand,
  SerialSequence,
  DataMode,
  ValidationMode,
  TextEncoding,
  ChecksumAlgorithm,
} from "../types";
import { executeUserScript } from "../lib/scripting";
import { useStore } from "../lib/store";
import {
  calculateChecksum,
  encodeText,
  appendLineEnding,
} from "../lib/utils/dataUtils";
import {
  applyParameters,
  collectPositionParameters,
  applyPositionParameters,
} from "../lib/utils/parameterUtils";
import { generateId, getErrorMessage } from "../lib/utils";
import { TIMING } from "../lib/constants";
import { getEffectiveCommand } from "../lib/protocolIntegration";
import {
  buildStructuredMessage,
  type BuildOptions,
} from "../lib/builders/messageBuilder";
import {
  getEffectiveMode,
  getEffectivePayload,
} from "../lib/builders/commandBuilder";
import type {
  Protocol,
  StructuredCommand,
  ElementBinding,
  StaticBinding,
} from "../lib/protocolTypes";

interface ActiveValidation {
  sessionId: string;
  mode: ValidationMode | "ALWAYS_PASS" | "SCRIPT";
  pattern?: string;
  matchType?: "CONTAINS" | "REGEX";
  valScript?: string;
  transformScript?: string;
  params?: Record<string, unknown>;
  timer: ReturnType<typeof setTimeout>;
  cmdName: string;
  resolve?: () => void;
  reject?: (err: Error) => void;
}

/**
 * Build binary message for a STRUCTURED protocol command
 */
async function buildProtocolCommandMessage(
  command: StructuredCommand,
  protocol: Protocol,
  params: Record<string, unknown>,
  payload?: Uint8Array,
): Promise<Uint8Array> {
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
    params,
    bindings,
    staticBindings,
    payload,
  };

  const result = await buildStructuredMessage(structure, buildOpts);
  return result.data;
}

/**
 * Custom hook for managing command execution
 * Handles command sending, scripting, encoding, framing, checksums, and sequence execution
 */
export function useCommandExecution(
  activeSessionId: string,
  write: (sessionId: string, data: Uint8Array) => Promise<void>,
  sendMode: DataMode,
  setSendMode: (mode: DataMode) => void,
  encoding: TextEncoding,
  setEncoding: (enc: TextEncoding) => void,
  checksum: ChecksumAlgorithm,
  activeValidationsRef: React.MutableRefObject<Map<string, ActiveValidation>>,
  overrideTimerRef: React.MutableRefObject<ReturnType<
    typeof setTimeout
  > | null>,
) {
  // Read state on-demand inside callbacks via useStore.getState() to avoid
  // subscribing MainWorkspace to the entire store (perf optimization).

  /**
   * Send data to the active session
   */
  const sendData = async (
    data: string,
    cmdInfo?: SavedCommand,
    params: Record<string, unknown> = {},
  ): Promise<void> => {
    const store = useStore.getState();
    console.group(
      `Command Execution: ${cmdInfo?.name || "Manual Input"} [Session: ${activeSessionId}]`,
    );

    // Check session connection state from STORE
    const sessionIsConnected = store.sessions[activeSessionId]?.isConnected;
    if (!sessionIsConnected) {
      store.addToast("error", "Send Failed", "Port not connected");
      store.addSystemLog(
        "ERROR",
        "COMMAND",
        "Attempted to send data while disconnected.",
        { data },
      );
      console.groupEnd();
      throw new Error("Port not connected");
    }

    // =========================================================================
    // Protocol-based STRUCTURED Command Handling
    // For commands synced from protocols, we use binary message building
    // =========================================================================
    if (cmdInfo?.source === "PROTOCOL" && cmdInfo.protocolLayer?.protocolId) {
      const effectiveCmd = getEffectiveCommand(cmdInfo, store.protocols);

      // Check if this is a STRUCTURED command (binary protocol)
      if (
        effectiveCmd &&
        "type" in effectiveCmd &&
        effectiveCmd.type === "STRUCTURED" &&
        effectiveCmd.messageStructureId
      ) {
        const protocol = store.protocols.find(
          (p) => p.id === cmdInfo.protocolLayer!.protocolId,
        );
        if (!protocol) {
          const errorMsg = `Protocol "${cmdInfo.protocolLayer.protocolId}" not found`;
          store.addToast("error", "Protocol Error", errorMsg);
          store.addSystemLog("ERROR", "COMMAND", errorMsg);
          console.groupEnd();
          throw new Error(errorMsg);
        }

        try {
          // Build binary message using protocol structure
          const binaryMessage = await buildProtocolCommandMessage(
            effectiveCmd as StructuredCommand,
            protocol,
            params,
          );

          store.addSystemLog(
            "INFO",
            "COMMAND",
            `Built STRUCTURED message for "${cmdInfo.name}"`,
            {
              protocol: protocol.name,
              structure: effectiveCmd.messageStructureId,
              length: binaryMessage.length,
              params,
            },
          );

          // Write directly - STRUCTURED commands bypass text encoding
          await write(activeSessionId, binaryMessage);
          store.addLog(
            binaryMessage,
            "TX",
            cmdInfo.contextIds,
            activeSessionId,
            params,
          );

          store.addSystemLog(
            "INFO",
            "COMMAND",
            `Sent: ${cmdInfo.name} (STRUCTURED)`,
            {
              mode: "BINARY",
              length: binaryMessage.length,
              params,
            },
          );

          console.groupEnd();
          return; // Early return - STRUCTURED commands don't use validation/scripting (yet)
        } catch (e: unknown) {
          const errorMsg = getErrorMessage(e);
          store.addToast("error", "Protocol Build Error", errorMsg);
          store.addSystemLog(
            "ERROR",
            "COMMAND",
            `Failed to build STRUCTURED message for "${cmdInfo.name}"`,
            { error: errorMsg, params },
          );
          console.groupEnd();
          throw e;
        }
      }
    }

    // =========================================================================
    // Standard Command Handling (TEXT/HEX/BINARY modes)
    // =========================================================================

    // Apply parameters to payload using the new parameter system
    let processedData = data;
    if (cmdInfo && Object.keys(params).length > 0) {
      processedData = await applyParameters(data, params, cmdInfo);
      if (processedData !== data) {
        store.addSystemLog("INFO", "COMMAND", `Applied parameters to payload`, {
          original: data,
          processed: processedData,
          params,
        });
      }
    }

    // Scripting: Pre-Request
    let payloadToProcess: string | Uint8Array = processedData;
    let isRawBytes = false;

    if (cmdInfo?.scripting?.enabled && cmdInfo.scripting.preRequestScript) {
      try {
        // Inject logging for pre-request scripts
        const log = (msg: string) => {
          useStore
            .getState()
            .addSystemLog(
              "INFO",
              "SCRIPT",
              `[${cmdInfo.name} Pre-Req] Log: ${msg}`,
            );
        };
        const scriptArgs = { payload: processedData, params, log };
        const result = await executeUserScript(
          cmdInfo.scripting.preRequestScript,
          scriptArgs,
        );

        if (typeof result === "string") {
          payloadToProcess = result;
        } else if (result instanceof Uint8Array || Array.isArray(result)) {
          payloadToProcess =
            result instanceof Uint8Array ? result : new Uint8Array(result);
          isRawBytes = true;
        }

        store.addSystemLog(
          "SUCCESS",
          "SCRIPT",
          `Executed pre-request script for ${cmdInfo.name}`,
          {
            arguments: { payload: processedData, params },
            returnValue: result === undefined ? "undefined" : result,
          },
        );
      } catch (e: unknown) {
        const errorMsg = getErrorMessage(e);
        store.addToast("error", "Script Execution Failed", errorMsg);
        store.addSystemLog(
          "ERROR",
          "SCRIPT",
          `Pre-request script failed for ${cmdInfo.name}`,
          {
            error: errorMsg,
            arguments: { params },
          },
        );
        console.groupEnd();
        throw e;
      }
    }

    // Framing: Override or Persistence
    if (
      cmdInfo?.responseFraming &&
      cmdInfo.responseFraming.strategy !== "NONE"
    ) {
      if (cmdInfo.framingPersistence === "PERSISTENT") {
        // Permanent Switch: Update Session Config
        store.setConfig((prev) => ({
          ...prev,
          framing: cmdInfo.responseFraming!,
        }));
        store.addSystemLog(
          "INFO",
          "SYSTEM",
          `Switched Framing Strategy to ${cmdInfo.responseFraming.strategy} (Persistent)`,
        );

        // Ensure any temporary override is cleared so the new global takes effect
        store.setFramingOverride(undefined);
        if (overrideTimerRef.current) {
          clearTimeout(overrideTimerRef.current);
          overrideTimerRef.current = null;
        }
      } else {
        // Transient (One-Shot) Override
        store.setFramingOverride(cmdInfo.responseFraming);
        // Safety timeout to clear override if no response comes (prevent sticking in wrong mode)
        if (overrideTimerRef.current) clearTimeout(overrideTimerRef.current);
        overrideTimerRef.current = setTimeout(() => {
          useStore.getState().setFramingOverride(undefined);
          overrideTimerRef.current = null;
        }, TIMING.FRAMING_OVERRIDE_TIMEOUT_MS);
      }
    }

    // Validation / Response Handling Promise
    // We register a listener if:
    // 1. Explicit Validation is enabled
    // 2. OR Post-Response Script is enabled (Implicit validation: wait for any data)
    let validationPromise = Promise.resolve();

    const isValidationEnabled = cmdInfo?.validation?.enabled;
    const isPostScriptEnabled =
      cmdInfo?.scripting?.enabled && !!cmdInfo.scripting.postResponseScript;

    if (isValidationEnabled || isPostScriptEnabled) {
      validationPromise = new Promise((resolve, reject) => {
        const validationKey = generateId();
        // Use timeout from validation config, or default to 2000ms if only scripting is used
        const timeout =
          isValidationEnabled && cmdInfo?.validation?.timeout
            ? cmdInfo.validation.timeout
            : TIMING.DEFAULT_VALIDATION_TIMEOUT_MS;

        const timer = setTimeout(() => {
          if (activeValidationsRef.current.has(validationKey)) {
            activeValidationsRef.current.delete(validationKey);
            reject(
              new Error(
                `Timeout waiting for response to "${cmdInfo?.name || "Command"}"`,
              ),
            );
          }
        }, timeout);

        // Determine mode: If validation is OFF but script is ON, use 'SCRIPT' mode (implicit validation via script)
        // If validation is ON, use its mode (PATTERN).
        let mode: ValidationMode | "ALWAYS_PASS" | "SCRIPT" = "ALWAYS_PASS";
        if (isValidationEnabled) {
          mode = cmdInfo!.validation!.mode;
        } else if (isPostScriptEnabled) {
          mode = "SCRIPT";
        }

        activeValidationsRef.current.set(validationKey, {
          sessionId: activeSessionId,
          mode: mode,
          pattern: isValidationEnabled
            ? cmdInfo!.validation!.pattern
            : undefined,
          matchType: isValidationEnabled
            ? cmdInfo!.validation!.matchType
            : undefined,
          valScript:
            mode === "SCRIPT"
              ? cmdInfo!.scripting!.postResponseScript
              : undefined,
          transformScript: isPostScriptEnabled
            ? cmdInfo!.scripting!.postResponseScript
            : undefined,
          params,
          timer,
          cmdName: cmdInfo?.name || "Command",
          resolve: () => resolve(),
          reject,
        });
      });
    }

    try {
      let dataBytes: Uint8Array;

      if (isRawBytes && payloadToProcess instanceof Uint8Array) {
        dataBytes = payloadToProcess;
      } else {
        const textPayload = payloadToProcess as string;
        // Use effective mode which handles both CUSTOM and PROTOCOL commands
        const currentSendMode = cmdInfo ? getEffectiveMode(cmdInfo) : sendMode;
        const currentEncoding = cmdInfo?.encoding || encoding;

        if (currentSendMode === "HEX") {
          const cleanHex = textPayload.replace(/[^0-9A-Fa-f]/g, "");
          if (cleanHex.length % 2 !== 0)
            throw new Error("Invalid Hex String (Odd length)");
          const bytes = new Uint8Array(cleanHex.length / 2);
          for (let i = 0; i < bytes.length; i++) {
            bytes[i] = parseInt(cleanHex.substring(i * 2, i * 2 + 2), 16);
          }
          dataBytes = bytes;
        } else if (currentSendMode === "BINARY") {
          const cleanBin = textPayload.replace(/[^01]/g, "");
          if (cleanBin.length % 8 !== 0)
            throw new Error("Invalid Binary String");
          const bytes = new Uint8Array(cleanBin.length / 8);
          for (let i = 0; i < bytes.length; i++) {
            bytes[i] = parseInt(cleanBin.substring(i * 8, i * 8 + 8), 2);
          }
          dataBytes = bytes;
        } else {
          dataBytes = encodeText(textPayload, currentEncoding);
        }
      }

      // Apply position-mode parameters for binary protocols
      if (cmdInfo && Object.keys(params).length > 0) {
        const positionParams = await collectPositionParameters(params, cmdInfo);
        if (positionParams.length > 0) {
          dataBytes = applyPositionParameters(dataBytes, positionParams);
          store.addSystemLog(
            "INFO",
            "COMMAND",
            `Applied ${positionParams.length} position parameter(s) to binary payload`,
            {
              positions: positionParams.map((p) => ({
                name: p.name,
                offset: p.offset,
              })),
            },
          );
        }
      }

      if (checksum !== "NONE") {
        const chk = calculateChecksum(dataBytes, checksum);
        const newData = new Uint8Array(dataBytes.length + chk.length);
        newData.set(dataBytes);
        newData.set(chk, dataBytes.length);
        dataBytes = newData;
      }

      // Log TX before write to ensure correct chronological ordering
      // (echo devices respond immediately, RX would appear before TX otherwise)
      store.addLog(
        dataBytes,
        "TX",
        cmdInfo?.contextIds,
        activeSessionId,
        params,
      );
      await write(activeSessionId, dataBytes);

      // System Log
      const displayPayload =
        typeof payloadToProcess === "string" && payloadToProcess.length > 50
          ? payloadToProcess.substring(0, 50) + "..."
          : isRawBytes
            ? "[Binary Data]"
            : payloadToProcess;

      store.addSystemLog(
        "INFO",
        "COMMAND",
        `Sent: ${cmdInfo?.name || "Manual Data"}`,
        {
          mode: cmdInfo?.mode || sendMode,
          payload: displayPayload,
          length: dataBytes.length,
          params,
        },
      );

      console.groupEnd();
      return validationPromise;
    } catch (e: unknown) {
      const errorMsg = getErrorMessage(e);
      console.error("Transmission Error:", e);
      store.addToast("error", "Error", "Send failed: " + errorMsg);
      store.addSystemLog("ERROR", "COMMAND", `Send failed: ${errorMsg}`, {
        error: String(e),
      });
      console.groupEnd();
      throw e;
    }
  };

  /**
   * Handle command send request (with parameter modal if needed)
   */
  const handleSendCommandRequest = (
    cmd: SavedCommand,
    onShowParamModal: (cmd: SavedCommand) => void,
  ) => {
    // For PROTOCOL commands with parameters in protocolLayer, check those too
    const hasLegacyParams = cmd.parameters && cmd.parameters.length > 0;
    const hasProtocolParams =
      cmd.source === "PROTOCOL" &&
      cmd.protocolLayer?.parameters &&
      cmd.protocolLayer.parameters.length > 0;

    if (hasLegacyParams || hasProtocolParams) {
      onShowParamModal(cmd);
    } else {
      const store = useStore.getState();
      const config = store.sessions[activeSessionId]?.config;
      // Use effective mode/payload which handles both CUSTOM and PROTOCOL commands
      const effectiveMode = getEffectiveMode(cmd);
      let finalData = getEffectivePayload(cmd);

      if (effectiveMode === "TEXT" && config) {
        finalData = appendLineEnding(finalData, config.lineEnding);
      }
      if (effectiveMode !== sendMode) setSendMode(effectiveMode);
      if (cmd.encoding && cmd.encoding !== encoding) setEncoding(cmd.encoding);
      sendData(finalData, cmd).catch((error) => {
        useStore
          .getState()
          .addSystemLog(
            "ERROR",
            "COMMAND",
            `Failed to send "${cmd.name}": ${error instanceof Error ? error.message : String(error)}`,
          );
        useStore
          .getState()
          .addToast(
            "error",
            "Send Failed",
            error instanceof Error ? error.message : "Command failed to send",
          );
      });
    }
  };

  /**
   * Run a sequence of commands
   */
  const handleRunSequence = async (seq: SerialSequence) => {
    const store = useStore.getState();
    const sessionIsConnected = store.sessions[activeSessionId]?.isConnected;
    if (!sessionIsConnected) {
      store.addToast(
        "error",
        "Cannot Run Sequence",
        "Not connected to a port.",
      );
      return;
    }
    store.setActiveSequenceId(seq.id);
    store.addToast("info", "Sequence Started", `Running "${seq.name}"...`);
    store.addSystemLog("INFO", "COMMAND", `Started Sequence: ${seq.name}`);

    for (let i = 0; i < seq.steps.length; i++) {
      const step = seq.steps[i];
      // Re-read commands from store at each step (may have been updated)
      const currentCommands = useStore.getState().commands;
      const cmd = currentCommands.find((c) => c.id === step.commandId);
      if (!cmd) continue;

      // Check for parameters in both legacy and protocol layer
      const hasLegacyParams = cmd.parameters && cmd.parameters.length > 0;
      const hasProtocolParams =
        cmd.source === "PROTOCOL" &&
        cmd.protocolLayer?.parameters &&
        cmd.protocolLayer.parameters.length > 0;

      if (hasLegacyParams || hasProtocolParams) {
        useStore
          .getState()
          .addToast(
            "warning",
            "Sequence Warning",
            `Step ${i + 1} has parameters. Using defaults.`,
          );
      }
      try {
        // Use effective mode/payload which handles both CUSTOM and PROTOCOL commands
        const effectiveMode = getEffectiveMode(cmd);
        let finalData = getEffectivePayload(cmd);
        const currentConfig =
          useStore.getState().sessions[activeSessionId]?.config;

        if (effectiveMode === "TEXT" && currentConfig) {
          finalData = appendLineEnding(finalData, currentConfig.lineEnding);
        }
        await sendData(finalData, cmd);
        if (step.delay > 0) await new Promise((r) => setTimeout(r, step.delay));
      } catch (e: unknown) {
        const errorMsg = getErrorMessage(e);
        useStore
          .getState()
          .addToast(
            "error",
            "Sequence Step Failed",
            `Step ${i + 1} (${cmd.name}): ${errorMsg}`,
          );
        useStore
          .getState()
          .addSystemLog(
            "ERROR",
            "COMMAND",
            `Sequence ${seq.name} failed at step ${i + 1}`,
            {
              error: errorMsg,
            },
          );
        if (step.stopOnError) {
          useStore.getState().setActiveSequenceId(null);
          return;
        }
      }
    }
    useStore.getState().setActiveSequenceId(null);
    useStore
      .getState()
      .addToast("success", "Sequence Complete", `"${seq.name}" finished.`);
    useStore
      .getState()
      .addSystemLog("SUCCESS", "COMMAND", `Sequence ${seq.name} completed.`);
  };

  return {
    sendData,
    handleSendCommandRequest,
    handleRunSequence,
  };
}
