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

// Import the vite-env declarations for compile-time constants
import "../../vite-env.d.ts";
