import { useRef } from "react";
import { ValidationMode, TelemetryVariableValue } from "../types";
import { executeUserScript } from "../lib/scripting";
import { useStore } from "../lib/store";
import { getErrorMessage } from "../lib/utils";
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
 * Custom hook for managing command response validation
 * Handles pattern matching, regex, script validation, and transform scripts
 */
export function useValidation() {
  const activeValidationsRef = useRef<Map<string, ActiveValidation>>(new Map());

  /**
   * Register a validation for a command response
   */
  const registerValidation = (
    sessionId: string,
    config: {
      mode: ValidationMode | "ALWAYS_PASS" | "SCRIPT";
      pattern?: string;
      matchType?: "CONTAINS" | "REGEX";
      valScript?: string;
      transformScript?: string;
      params?: Record<string, unknown>;
      timeout?: number;
    },
    cmdName: string,
    onSuccess?: () => void,
    onError?: (err: Error) => void,
  ): Promise<void> => {
    return new Promise((resolve, reject) => {
      const validationId = `${sessionId}_${Date.now()}_${Math.random()}`;
      const timeout = config.timeout || TIMING.DEFAULT_VALIDATION_TIMEOUT_MS;

      const timer = setTimeout(() => {
        activeValidationsRef.current.delete(validationId);
        const errMsg = `Command "${cmdName}" validation timeout (${timeout}ms)`;
        useStore.getState().addSystemLog("ERROR", "VALIDATION", errMsg);
        if (onError) onError(new Error(errMsg));
        reject(new Error(errMsg));
      }, timeout);

      activeValidationsRef.current.set(validationId, {
        sessionId,
        mode: config.mode,
        pattern: config.pattern,
        matchType: config.matchType,
        valScript: config.valScript,
        transformScript: config.transformScript,
        params: config.params,
        timer,
        cmdName,
        resolve: () => {
          if (onSuccess) onSuccess();
          resolve();
        },
        reject,
      });
    });
  };

  /**
   * Handle validation passed - cleanup and run transform script
   */
  const handleValidationPassed = async (
    val: ActiveValidation,
    key: string,
    textData: string,
    data: Uint8Array,
    sessionId: string,
    logId?: string,
  ) => {
    // Validation passed
    clearTimeout(val.timer);
    activeValidationsRef.current.delete(key);

    if (!val.resolve) {
      useStore
        .getState()
        .addToast(
          "success",
          "Passed",
          `Command "${val.cmdName}" response received.`,
        );
    }

    // Execute transform script if present
    if (val.transformScript) {
      try {
        const capturedVars: Record<string, unknown> = {};

        const store = useStore.getState();

        // Inject setVar for telemetry and log for debugging
        const setVar = (name: string, value: unknown) => {
          useStore
            .getState()
            .setVariable(name, value as TelemetryVariableValue, sessionId);
          capturedVars[name] = value;
        };
        const log = (msg: string) => {
          useStore
            .getState()
            .addSystemLog("INFO", "SCRIPT", `[${val.cmdName}] Log: ${msg}`);
        };

        const scriptArgs = {
          data: textData,
          raw: data,
          setVar,
          log,
          params: val.params || {},
        };

        const result = await executeUserScript(val.transformScript, scriptArgs);

        // If logId exists and we captured vars, update the log entry
        if (logId && Object.keys(capturedVars).length > 0) {
          store.updateLog(logId, { extractedVars: capturedVars }, sessionId);
        }

        store.addSystemLog(
          "SUCCESS",
          "SCRIPT",
          `Executed post-response script for ${val.cmdName}`,
          {
            arguments: {
              data: textData,
              raw: Array.from(data),
              params: val.params,
            },
            returnValue: result === undefined ? "undefined" : result,
            extractedVars: capturedVars,
          },
        );
      } catch (err: unknown) {
        const errorMsg = getErrorMessage(err);
        useStore.getState().addToast("error", "Transformation Error", errorMsg);
        useStore
          .getState()
          .addSystemLog(
            "ERROR",
            "SCRIPT",
            `Post-response script error in ${val.cmdName}: ${errorMsg}`,
            {
              arguments: { data: textData },
            },
          );
      }
    }

    // Resolve the validation promise
    if (val.resolve) val.resolve();
  };

  /**
   * Check incoming data against all active validations for a session
   */
  const checkValidation = (
    data: Uint8Array,
    sessionId: string,
    logId?: string,
  ) => {
    let textData = "";
    try {
      textData = new TextDecoder().decode(data);
    } catch {
      // Ignore decode errors
    }

    activeValidationsRef.current.forEach((val, key) => {
      // Only check validations for this session
      if (val.sessionId !== sessionId) return;

      let passed = false;

      // Check validation mode
      if (val.mode === "ALWAYS_PASS") {
        // Implicit validation for scripts - passes on any data received
        passed = true;
      } else if (val.mode === "PATTERN" && val.pattern) {
        if (val.matchType === "CONTAINS") {
          if (textData.includes(val.pattern)) passed = true;
        } else if (val.matchType === "REGEX") {
          try {
            const regex = new RegExp(val.pattern);
            if (regex.test(textData)) passed = true;
          } catch (e) {
            console.error(`[Validation] Regex Error for ${val.cmdName}:`, e);
          }
        }
      } else if (val.mode === "SCRIPT" && val.valScript) {
        // Script validation is async - handle it separately
        executeUserScript(val.valScript, {
          data: textData,
          raw: data,
        })
          .then((result) => {
            if (result === true) {
              handleValidationPassed(
                val,
                key,
                textData,
                data,
                sessionId,
                logId,
              );
            }
          })
          .catch((err) => {
            console.error(`[Validation] Script Error for ${val.cmdName}:`, err);
          });
        return; // Exit early, async handling takes over
      }

      if (passed) {
        handleValidationPassed(val, key, textData, data, sessionId, logId);
      }
    });
  };

  /**
   * Clear all validations for a session (e.g., on disconnect)
   */
  const clearValidation = (sessionId: string) => {
    activeValidationsRef.current.forEach((val, key) => {
      if (val.sessionId === sessionId) {
        clearTimeout(val.timer);
        activeValidationsRef.current.delete(key);
      }
    });
  };

  return {
    registerValidation,
    checkValidation,
    clearValidation,
    activeValidationsRef, // Export the ref for use by useCommandExecution
  };
}
