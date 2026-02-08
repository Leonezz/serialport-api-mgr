import { useEffect, useMemo } from "react";
import { SerialPreset, DashboardWidget } from "../types";
import { generateId } from "../lib/utils";
import { useStore } from "../lib/store";
import { useTranslation } from "react-i18next";

/**
 * Encapsulates preset management logic extracted from ControlPanel (#81).
 *
 * Handles: dirty detection, save/update/revert/copy/detach operations.
 */
export function usePresetOperations() {
  const { t } = useTranslation();
  const {
    sessions,
    activeSessionId,
    presets,
    loadedPresetId,
    setLoadedPresetId,
    setPresets,
    setConfig,
    setNetworkConfig,
    setConnectionType,
    applyPresetLayout,
    addToast,
  } = useStore();

  const activeSession = sessions[activeSessionId];
  const { config, networkConfig, connectionType, widgets } = activeSession;

  const activePresetName = loadedPresetId
    ? (presets.find((p) => p.id === loadedPresetId)?.name ?? null)
    : null;

  const isPresetDirty = useMemo(() => {
    if (!loadedPresetId) return false;
    const preset = presets.find((p) => p.id === loadedPresetId);
    if (!preset) return false;
    if (preset.type !== connectionType) return true;
    if (preset.type === "SERIAL")
      return JSON.stringify(preset.config) !== JSON.stringify(config);
    else
      return JSON.stringify(preset.network) !== JSON.stringify(networkConfig);
  }, [loadedPresetId, presets, config, networkConfig, connectionType]);

  // When loadedPresetId changes, apply dashboard layout if exists
  useEffect(() => {
    if (loadedPresetId) {
      applyPresetLayout(activeSessionId, loadedPresetId);
    }
  }, [loadedPresetId, activeSessionId, applyPresetLayout]);

  const extractDashboardConfig = (): DashboardWidget[] => {
    return [...widgets];
  };

  const updateLoadedPreset = () => {
    if (!loadedPresetId) return;
    const preset = presets.find((p) => p.id === loadedPresetId);
    if (!preset) return;

    const updatedPreset: SerialPreset = {
      ...preset,
      type: connectionType,
      config: connectionType === "SERIAL" ? config : preset.config,
      network: connectionType === "NETWORK" ? networkConfig : preset.network,
      widgets: extractDashboardConfig(),
    };

    setPresets((prev) =>
      prev.map((p) => (p.id === loadedPresetId ? updatedPreset : p)),
    );
    addToast(
      "success",
      t("toast.success"),
      `Saved config & dashboard to "${preset.name}".`,
    );
  };

  const revertLoadedPreset = () => {
    if (!loadedPresetId) return;
    const p = presets.find((x) => x.id === loadedPresetId);
    if (p) {
      if (p.type === "NETWORK") {
        setConnectionType("NETWORK");
        if (p.network) setNetworkConfig(p.network);
      } else {
        setConnectionType("SERIAL");
        setConfig(p.config);
      }
      applyPresetLayout(activeSessionId, loadedPresetId);
      addToast("info", "Reverted", "Settings restored from profile.");
    }
  };

  const saveNewPreset = (name: string) => {
    const newPreset: SerialPreset = {
      id: generateId(),
      name,
      type: connectionType,
      config: { ...config },
      network: connectionType === "NETWORK" ? { ...networkConfig } : undefined,
      widgets: extractDashboardConfig(),
    };
    setPresets((prev) => [...prev, newPreset]);
    setLoadedPresetId(newPreset.id);
    addToast(
      "success",
      t("toast.saved"),
      `Preset "${name}" created with current dashboard.`,
    );
  };

  const detachPreset = () => {
    setLoadedPresetId(null);
    addToast("info", "Detached", "Configuration is now custom.");
  };

  return {
    activePresetName,
    isPresetDirty,
    loadedPresetId,
    updateLoadedPreset,
    revertLoadedPreset,
    saveNewPreset,
    detachPreset,
  };
}
