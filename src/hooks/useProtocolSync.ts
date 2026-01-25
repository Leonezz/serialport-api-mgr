/**
 * Protocol Sync Hook
 *
 * Handles automatic synchronization of protocol-sourced commands
 * when the application loads or when protocols are updated.
 *
 * Per PRD Phase 5: Polish & Sync Notifications
 */

import { useEffect, useRef, useCallback } from "react";
import { useStore } from "../lib/store";
import {
  syncAllProtocolCommands,
  getCommandsSyncStatus,
} from "../lib/protocolIntegration";

export interface SyncResult {
  synced: number;
  outdated: number;
  orphaned: number;
  unchanged: number;
}

/**
 * Hook that synchronizes protocol-sourced commands on app load
 * and provides manual sync capabilities.
 *
 * @returns Object with sync state and manual sync function
 */
export function useProtocolSync() {
  const {
    commands,
    protocols,
    updateCommand,
    addToast,
    addSystemLog,
    setLastProtocolSyncTimestamp,
    lastProtocolSyncTimestamp,
  } = useStore();

  const hasRunInitialSync = useRef(false);
  const lastProtocolsHash = useRef<string>("");

  /**
   * Perform sync and return results
   */
  const performSync = useCallback((): SyncResult => {
    if (commands.length === 0 || protocols.length === 0) {
      return { synced: 0, outdated: 0, orphaned: 0, unchanged: 0 };
    }

    // Get current sync status before sync
    const statusBefore = getCommandsSyncStatus(commands, protocols);

    if (statusBefore.outdated.length === 0) {
      // Nothing to sync
      return {
        synced: statusBefore.synced.length,
        outdated: 0,
        orphaned: statusBefore.orphaned.length,
        unchanged: statusBefore.synced.length,
      };
    }

    // Perform sync
    const syncedCommands = syncAllProtocolCommands(commands, protocols);

    // Update each command that changed
    let updatedCount = 0;
    for (const syncedCmd of syncedCommands) {
      const originalCmd = commands.find((c) => c.id === syncedCmd.id);
      if (
        originalCmd &&
        syncedCmd.protocolLayer?.protocolCommandUpdatedAt !==
          originalCmd.protocolLayer?.protocolCommandUpdatedAt
      ) {
        updateCommand(syncedCmd.id, syncedCmd);
        updatedCount++;
      }
    }

    // Update timestamp on successful sync
    setLastProtocolSyncTimestamp(Date.now());

    return {
      synced: statusBefore.synced.length + updatedCount,
      outdated: 0,
      orphaned: statusBefore.orphaned.length,
      unchanged: statusBefore.synced.length,
    };
  }, [commands, protocols, updateCommand, setLastProtocolSyncTimestamp]);

  /**
   * Manual sync with toast notification
   */
  const syncNow = useCallback(() => {
    const result = performSync();

    if (result.outdated === 0 && result.synced > 0) {
      addToast(
        "success",
        "Commands Synced",
        `${result.synced} protocol command(s) are up to date.`,
      );
    } else if (result.synced === 0) {
      addToast(
        "info",
        "No Changes",
        "All protocol commands are already synced.",
      );
    }

    if (result.orphaned > 0) {
      addToast(
        "warning",
        "Orphaned Commands",
        `${result.orphaned} command(s) reference deleted protocols.`,
      );
    }

    return result;
  }, [performSync, addToast]);

  /**
   * Get current sync status without performing sync
   */
  const getSyncStatus = useCallback(() => {
    return getCommandsSyncStatus(commands, protocols);
  }, [commands, protocols]);

  // Initial sync on mount
  useEffect(() => {
    if (hasRunInitialSync.current) return;
    if (commands.length === 0 || protocols.length === 0) return;

    hasRunInitialSync.current = true;

    // Check if any commands need sync
    const status = getCommandsSyncStatus(commands, protocols);

    if (status.outdated.length > 0) {
      addSystemLog(
        "INFO",
        "SYSTEM",
        `Found ${status.outdated.length} outdated protocol command(s). Syncing...`,
      );

      const result = performSync();

      if (result.synced > 0) {
        addToast(
          "info",
          "Protocol Commands Updated",
          `${status.outdated.length} command(s) synced with protocol updates.`,
        );
        addSystemLog(
          "INFO",
          "SYSTEM",
          `Synced ${status.outdated.length} protocol command(s) on startup.`,
        );
      }
    } else {
      addSystemLog(
        "INFO",
        "SYSTEM",
        `All ${status.synced.length} protocol command(s) are up to date.`,
      );
    }

    if (status.orphaned.length > 0) {
      addSystemLog(
        "WARN",
        "SYSTEM",
        `Found ${status.orphaned.length} orphaned command(s) - their source protocols no longer exist.`,
      );
    }
  }, [commands, protocols, performSync, addToast, addSystemLog]);

  // Auto-sync when protocols change
  useEffect(() => {
    // Create a simple hash of protocols to detect changes
    const protocolsHash = protocols
      .map((p) => `${p.id}:${p.updatedAt}`)
      .sort()
      .join("|");

    // Skip if this is the first run or protocols haven't changed
    if (
      !hasRunInitialSync.current ||
      protocolsHash === lastProtocolsHash.current
    ) {
      lastProtocolsHash.current = protocolsHash;
      return;
    }

    lastProtocolsHash.current = protocolsHash;

    // Check for outdated commands after protocol update
    const status = getCommandsSyncStatus(commands, protocols);

    if (status.outdated.length > 0) {
      addSystemLog(
        "INFO",
        "SYSTEM",
        `Protocol updated. ${status.outdated.length} command(s) need sync.`,
      );

      const result = performSync();

      if (result.synced > 0) {
        addToast(
          "info",
          "Commands Auto-Synced",
          `${status.outdated.length} command(s) updated from protocol changes.`,
        );
      }
    }
  }, [protocols, commands, performSync, addToast, addSystemLog]);

  return {
    syncNow,
    getSyncStatus,
    performSync,
    lastSyncTimestamp: lastProtocolSyncTimestamp,
  };
}
