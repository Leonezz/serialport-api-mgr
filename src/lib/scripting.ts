import { executeSandboxedScript } from "./sandboxedScripting";

/**
 * Execute user-provided script in a sandboxed environment
 *
 * @param code - JavaScript code to execute
 * @param context - Context object available to the script
 * @returns Promise resolving to the script's return value
 *
 * @example
 * const result = await executeUserScript('return value * 2', { value: 21 });
 * // result === 42
 */
export const executeUserScript = async (
  code: string,
  context: Record<string, unknown>,
): Promise<unknown> => {
  return executeSandboxedScript(code, context, { timeout: 5000 });
};
