/**
 * Public exports for the Tauri command system
 *
 * Primary API: TauriSerialAPI - High-level interface with automatic type conversions
 * Advanced API: invokeCommand - Low-level typed wrapper for direct command invocation
 * Utilities: EnumConverter - Bidirectional enum conversion utilities
 */

// High-level API (recommended for most use cases)
export { TauriSerialAPI } from './api';

// Low-level typed invoke wrapper
export { invokeCommand } from './invoke';

// Enum conversion utilities
export { EnumConverter } from './enums';

// Type exports
export type * from './types';
export type * from './commands';
