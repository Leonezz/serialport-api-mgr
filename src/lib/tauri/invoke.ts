/**
 * Type-safe wrapper around Tauri's invoke function
 * Provides compile-time type checking and runtime validation with Zod
 */

import { invoke as tauriInvoke } from "@tauri-apps/api/core";
import type { CommandArgs, CommandReturn, TauriCommand } from "./tauriCommands";
import { SerialPortInfoArraySchema } from "./tauriSchemas";
import { LogEntrySchema } from "../storeSchemas";
import { z } from "zod";

// Create array schema for log entries
const LogEntryArraySchema = z.array(LogEntrySchema);

// ============================================================================
// Response Schema Registry
// ============================================================================

/**
 * Maps command names to their Zod validation schemas
 * Only commands that return data need validation schemas
 */
const RESPONSE_SCHEMAS: Partial<Record<TauriCommand["name"], z.ZodSchema>> = {
  get_all_port_info: SerialPortInfoArraySchema,
  get_logs: LogEntryArraySchema,
  // Commands that return void don't need schemas
  // (open_port, close_port, write_port, etc. all return void)
};

// ============================================================================
// Type-Safe Invoke Function
// ============================================================================

/**
 * Invoke a Tauri command with full type safety and runtime validation
 *
 * @param command - The command name (autocomplete supported)
 * @param args - Command arguments (type-checked against command definition)
 * @returns Promise resolving to the command's return type
 *
 * @example
 * // Get all ports (autocomplete for command name and args)
 * const ports = await invokeCommand('get_all_port_info', {});
 *
 * @example
 * // Open a port (args are type-checked)
 * await invokeCommand('open_port', {
 *   portName: '/dev/ttyUSB0',
 *   baudRate: 9600,
 *   dataBits: 'Eight',
 *   flowControl: 'None',
 *   parity: 'None',
 *   stopBits: 'One',
 *   dataTerminalReady: true,
 *   timeoutMs: 1000,
 * });
 */
export async function invokeCommand<T extends TauriCommand["name"]>(
  command: T,
  args: CommandArgs<T>,
): Promise<CommandReturn<T>> {
  // Invoke the Tauri command
  const result = await tauriInvoke(command, args);

  // Runtime validation with Zod (if schema exists)
  const schema = RESPONSE_SCHEMAS[command];
  if (schema) {
    // Validate and return the parsed result
    try {
      return schema.parse(result) as CommandReturn<T>;
    } catch (e) {
      // Log detailed error information for debugging
      console.error(
        `[Tauri Command] Schema validation failed for command "${command}"`,
        "\n[Raw Response]:",
        JSON.stringify(result, null, 2),
        "\n[Parse Error]:",
        e instanceof Error ? e.message : String(e),
        "\n[Full Error]:",
        e,
      );
      // Re-throw to let caller handle the error
      throw new Error(
        `Schema validation failed for command "${command}": ${e instanceof Error ? e.message : String(e)}`,
      );
    }
  }

  // For commands without schemas (void returns), return as-is
  return result as CommandReturn<T>;
}
