/**
 * Unified Tauri Environment Detection
 *
 * This module provides a consistent way to detect whether the app is running
 * in a Tauri desktop environment vs a standard web browser.
 *
 * We use the OFFICIAL Tauri API `isTauri()` function from `@tauri-apps/api/core`
 * which is the recommended way to detect the Tauri environment in v2.
 *
 * The compile-time environment variables (TAURI_ENV_*) are only available
 * when building with `tauri dev` or `tauri build`, and are NOT reliable
 * for runtime detection.
 */

import { isTauri } from "@tauri-apps/api/core";

/**
 * Check if the app is running in a Tauri environment.
 * This uses the official Tauri API which checks for runtime globals.
 *
 * NOTE: This is a synchronous check that works at module load time.
 */
export const IS_TAURI = isTauri();

/**
 * Function version of the check - useful for conditional logic that needs
 * a function reference. Returns the same value as IS_TAURI.
 */
export function isTauriEnvironment(): boolean {
  return isTauri();
}

/**
 * Log environment info for debugging
 */
export function logTauriEnvInfo(): void {
  console.log("[TauriEnv] Environment Detection:", {
    IS_TAURI,
    // These compile-time values may be undefined when running `pnpm dev`
    TAURI_TARGET_TRIPLE:
      typeof __TAURI_ENV_TARGET_TRIPLE__ !== "undefined"
        ? __TAURI_ENV_TARGET_TRIPLE__
        : undefined,
    TAURI_PLATFORM_VERSION:
      typeof __TAURI_ENV_PLATFORM_VERSION__ !== "undefined"
        ? __TAURI_ENV_PLATFORM_VERSION__
        : undefined,
    TAURI_DEBUG:
      typeof __TAURI_ENV_DEBUG__ !== "undefined"
        ? __TAURI_ENV_DEBUG__
        : undefined,
    // Runtime checks
    windowHasTauri:
      typeof window !== "undefined" ? "__TAURI__" in window : "N/A (SSR)",
    windowHasTauriInternals:
      typeof window !== "undefined"
        ? "__TAURI_INTERNALS__" in window
        : "N/A (SSR)",
  });
}

// Import the vite-env declarations for compile-time constants
import "../../vite-env.d.ts";
