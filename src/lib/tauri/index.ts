/**
 * Public exports for the Tauri command system
 *
 * Primary API: TauriSerialAPI - High-level interface with automatic type conversions
 * Advanced API: invokeCommand - Low-level typed wrapper for direct command invocation
 * Utilities: EnumConverter - Bidirectional enum conversion utilities
 * Events: Strongly-typed event system for Tauri events
 */

// High-level API (recommended for most use cases)
export { TauriSerialAPI } from "./api";

// Low-level typed invoke wrapper
export { invokeCommand } from "./invoke";

// Strongly-typed event system
export {
  TauriEventNames,
  listenToTauriEvent,
  listenToMultipleEvents,
  listenOnce,
} from "./events";

// Unified serial port type exports
export type { SerialPortInfo, SerialPortInfoArray } from "./tauriTypes";

// Command type exports
export type * from "./tauriCommands";
export type * from "./events";
