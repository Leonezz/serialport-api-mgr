/**
 * Device Protocol Sync Hook
 *
 * Automatically applies protocol framing when a device is selected.
 * Per PRD Phase 3: Auto-apply on device selection
 */

import { useEffect, useRef } from "react";
import { useStore } from "../lib/store";

/**
 * Hook that syncs the session's protocol framing with the selected device's protocol.
 *
 * When a device is selected:
 * - If the device has linked protocols, enables protocol framing with the first protocol
 * - If the device has no protocols, disables protocol framing
 *
 * When device is deselected:
 * - Disables protocol framing
 */
export function useDeviceProtocolSync() {
  // Subscribe only to the trigger value — not the entire store
  const selectedDeviceId = useStore((state) => state.selectedDeviceId);
  const previousDeviceIdRef = useRef<string | null>(null);

  useEffect(() => {
    // Only trigger when device selection actually changes
    if (previousDeviceIdRef.current === selectedDeviceId) {
      return;
    }
    previousDeviceIdRef.current = selectedDeviceId;

    // Read everything else on-demand (not subscribed)
    const store = useStore.getState();
    const session = store.sessions[store.activeSessionId];
    if (!session) return;

    // If no device selected, don't change protocol state
    // (user may have manually configured protocol framing)
    if (!selectedDeviceId) {
      return;
    }

    // Find the selected device
    const device = store.devices.find((d) => d.id === selectedDeviceId);
    if (!device) return;

    // Check if device has linked protocols
    const deviceProtocolBindings = device.protocols || [];
    if (deviceProtocolBindings.length === 0) {
      // Device has no protocols - don't change framing settings
      store.addSystemLog(
        "INFO",
        "SYSTEM",
        `Device "${device.name}" has no linked protocols.`,
      );
      return;
    }

    // Get the first protocol binding (primary protocol)
    const primaryBinding = deviceProtocolBindings[0];
    const protocol = store.protocols.find(
      (p) => p.id === primaryBinding.protocolId,
    );

    if (!protocol) {
      store.addSystemLog(
        "WARN",
        "SYSTEM",
        `Device "${device.name}" references protocol that no longer exists.`,
      );
      return;
    }

    // Check if protocol has framing configuration
    if (protocol.framing) {
      // Enable protocol framing
      store.setActiveProtocolId(protocol.id);
      store.setProtocolFramingEnabled(true);

      store.addSystemLog(
        "INFO",
        "SYSTEM",
        `Auto-applied protocol framing from "${protocol.name}" (${protocol.framing.strategy}).`,
      );
    } else {
      store.addSystemLog(
        "INFO",
        "SYSTEM",
        `Device "${device.name}" selected. Protocol "${protocol.name}" has no default framing.`,
      );
    }
  }, [selectedDeviceId]);
}
