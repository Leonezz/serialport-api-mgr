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
import { calculateChecksum, encodeText } from "../lib/dataUtils";
import {
  applyParameters,
  collectPositionParameters,
  applyPositionParameters,
} from "../lib/parameterUtils";
import { generateId, getErrorMessage } from "../lib/utils";
import { TIMING } from "../lib/constants";

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
  const {
    sessions,
    setConfig,
    setFramingOverride,
    addLog,
    addSystemLog,
    addToast,
    commands,
    setActiveSequenceId,
  } = useStore();

  const activeSession = sessions[activeSessionId];
  const { config, isConnected: sessionIsConnected } = activeSession;

  /**
   * Send data to the active session
   */
  const sendData = async (
    data: string,
    cmdInfo?: SavedCommand,
    params: Record<string, unknown> = {},
  ): Promise<void> => {
    console.group(
      `Command Execution: ${cmdInfo?.name || "Manual Input"} [Session: ${activeSessionId}]`,
    );

    // Check session connection state from STORE
    if (!sessionIsConnected) {
      addToast("error", "Send Failed", "Port not connected");
      addSystemLog(
        "ERROR",
        "COMMAND",
        "Attempted to send data while disconnected.",
        { data },
      );
      console.groupEnd();
      throw new Error("Port not connected");
    }

    // Apply parameters to payload using the new parameter system
    let processedData = data;
    if (cmdInfo && Object.keys(params).length > 0) {
      processedData = applyParameters(data, params, cmdInfo);
      if (processedData !== data) {
        addSystemLog("INFO", "COMMAND", `Applied parameters to payload`, {
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
          addSystemLog(
            "INFO",
            "SCRIPT",
            `[${cmdInfo.name} Pre-Req] Log: ${msg}`,
          );
        };
        const scriptArgs = { payload: processedData, params, log };
        const result = executeUserScript(
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

        addSystemLog(
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
        addToast("error", "Script Execution Failed", errorMsg);
        addSystemLog(
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
        setConfig((prev) => ({ ...prev, framing: cmdInfo.responseFraming! }));
        addSystemLog(
          "INFO",
          "SYSTEM",
          `Switched Framing Strategy to ${cmdInfo.responseFraming.strategy} (Persistent)`,
        );

        // Ensure any temporary override is cleared so the new global takes effect
        setFramingOverride(undefined);
        if (overrideTimerRef.current) {
          clearTimeout(overrideTimerRef.current);
          overrideTimerRef.current = null;
        }
      } else {
        // Transient (One-Shot) Override
        setFramingOverride(cmdInfo.responseFraming);
        // Safety timeout to clear override if no response comes (prevent sticking in wrong mode)
        if (overrideTimerRef.current) clearTimeout(overrideTimerRef.current);
        overrideTimerRef.current = setTimeout(() => {
          setFramingOverride(undefined);
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
            // If strictly validating, timeout is an error.
            // If just scripting (implicitly waiting), maybe just log a warning?
            // For consistency, we reject both, but sequences can choose to ignore error.
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
          // Fix: 'valScript' is derived from postResponseScript when mode is SCRIPT.
          // 'validation.script' does not exist on CommandValidation type.
          valScript:
            mode === "SCRIPT"
              ? cmdInfo!.scripting!.postResponseScript
              : undefined,
          transformScript: isPostScriptEnabled
            ? cmdInfo!.scripting!.postResponseScript
            : undefined,
          params, // Store request params to pass to post-response script
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
        const currentSendMode = cmdInfo ? cmdInfo.mode : sendMode;
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
        const positionParams = collectPositionParameters(params, cmdInfo);
        if (positionParams.length > 0) {
          dataBytes = applyPositionParameters(dataBytes, positionParams);
          addSystemLog(
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

      await write(activeSessionId, dataBytes);
      // Pass command parameters to log
      addLog(dataBytes, "TX", cmdInfo?.contextIds, activeSessionId, params);

      // System Log
      const displayPayload =
        typeof payloadToProcess === "string" && payloadToProcess.length > 50
          ? payloadToProcess.substring(0, 50) + "..."
          : isRawBytes
            ? "[Binary Data]"
            : payloadToProcess;

      addSystemLog(
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
      addToast("error", "Error", "Send failed: " + errorMsg);
      addSystemLog("ERROR", "COMMAND", `Send failed: ${errorMsg}`, {
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
    if (cmd.parameters && cmd.parameters.length > 0) {
      onShowParamModal(cmd);
    } else {
      let finalData = cmd.payload;
      if (cmd.mode === "TEXT") {
        switch (config.lineEnding) {
          case "LF":
            finalData += "\n";
            break;
          case "CR":
            finalData += "\r";
            break;
          case "CRLF":
            finalData += "\r\n";
            break;
        }
      }
      if (cmd.mode !== sendMode) setSendMode(cmd.mode);
      if (cmd.encoding && cmd.encoding !== encoding) setEncoding(cmd.encoding);
      sendData(finalData, cmd).catch(() => {});
    }
  };

  /**
   * Run a sequence of commands
   */
  const handleRunSequence = async (seq: SerialSequence) => {
    if (!sessionIsConnected) {
      addToast("error", "Cannot Run Sequence", "Not connected to a port.");
      return;
    }
    setActiveSequenceId(seq.id);
    addToast("info", "Sequence Started", `Running "${seq.name}"...`);
    addSystemLog("INFO", "COMMAND", `Started Sequence: ${seq.name}`);

    for (let i = 0; i < seq.steps.length; i++) {
      const step = seq.steps[i];
      const cmd = commands.find((c) => c.id === step.commandId);
      if (!cmd) continue;
      if (cmd.parameters && cmd.parameters.length > 0) {
        addToast(
          "warning",
          "Sequence Warning",
          `Step ${i + 1} has parameters. Using defaults.`,
        );
      }
      try {
        let finalData = cmd.payload;
        if (cmd.mode === "TEXT") {
          switch (config.lineEnding) {
            case "LF":
              finalData += "\n";
              break;
            case "CR":
              finalData += "\r";
              break;
            case "CRLF":
              finalData += "\r\n";
              break;
          }
        }
        await sendData(finalData, cmd);
        if (step.delay > 0) await new Promise((r) => setTimeout(r, step.delay));
      } catch (e: unknown) {
        const errorMsg = getErrorMessage(e);
        addToast(
          "error",
          "Sequence Step Failed",
          `Step ${i + 1} (${cmd.name}): ${errorMsg}`,
        );
        addSystemLog(
          "ERROR",
          "COMMAND",
          `Sequence ${seq.name} failed at step ${i + 1}`,
          {
            error: errorMsg,
          },
        );
        if (step.stopOnError) {
          setActiveSequenceId(null);
          return;
        }
      }
    }
    setActiveSequenceId(null);
    addToast("success", "Sequence Complete", `"${seq.name}" finished.`);
    addSystemLog("SUCCESS", "COMMAND", `Sequence ${seq.name} completed.`);
  };

  return {
    sendData,
    handleSendCommandRequest,
    handleRunSequence,
  };
}
