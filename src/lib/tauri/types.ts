/**
 * Unified type definitions for serial port operations
 *
 * These types are the single source of truth for serial port configuration.
 * When communicating with Rust/Tauri, use EnumConverter to transform values.
 */

import { z } from "zod";
import { SerialPortInfoSchema, SerialPortInfoArraySchema } from "./schemas";

// ============================================================================
// Unified Serial Port Types
// Used throughout the application - both UI and Tauri communication
// ============================================================================
// ============================================================================
// Port Information Types (from Rust)
// ============================================================================

/**
 * Serial port information from the system
 */
export type SerialPortInfo = z.infer<typeof SerialPortInfoSchema>;

/**
 * Array of serial port information
 */
export type SerialPortInfoArray = z.infer<typeof SerialPortInfoArraySchema>;
