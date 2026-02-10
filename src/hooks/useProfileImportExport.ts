import React, { useRef } from "react";
import {
  SerialConfig,
  NetworkConfig,
  SerialPreset,
  SavedCommand,
  SerialSequence,
  ProjectContext,
  Device,
} from "../types";
import { FileInputRef } from "../components/ui";
import { generateId } from "../lib/utils";
import { useStore } from "../lib/store";
import { ExportProfileSchema } from "../lib/schemas";
import { useTranslation } from "react-i18next";

/**
 * Encapsulates project import/export logic extracted from ControlPanel (#81).
 *
 * Handles: exporting current state to JSON, importing and hydrating from file.
 */
export function useProfileImportExport() {
  const { t } = useTranslation();
  const {
    sessions,
    activeSessionId,
    themeMode,
    themeColor,
    setThemeMode,
    setThemeColor,
    setConfig,
    setNetworkConfig,
    setPresets,
    addToast,
    commands,
    sequences,
    contexts,
    devices,
    presets,
  } = useStore();

  const activeSession = sessions[activeSessionId];
  const { config, networkConfig } = activeSession;

  const fileInputRef = useRef<FileInputRef>(null);

  const exportProfile = () => {
    const backup = {
      version: "1.2.0",
      timestamp: Date.now(),
      appearance: { themeMode, themeColor },
      config,
      networkConfig,
      presets,
      commands,
      sequences,
      contexts,
      devices,
      logs: activeSession.logs.map((l) => ({
        ...l,
        data: typeof l.data === "string" ? l.data : Array.from(l.data),
      })),
    };
    const blob = new Blob([JSON.stringify(backup, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `serialman-backup-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    addToast("success", t("toast.success"), "Configuration saved to file.");
  };

  const importProfile = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !e.target.files[0]) return;
    const file = e.target.files[0];
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const rawData = JSON.parse(content);

        const result = ExportProfileSchema.safeParse(rawData);

        if (!result.success) {
          const errorResult = result as {
            error: { issues: { message: string }[] };
          };
          console.error("Validation Errors:", errorResult.error);
          throw new Error(
            `Invalid file format: ${errorResult.error.issues[0].message}`,
          );
        }

        const data = result.data;

        if (data.appearance) {
          if (data.appearance.themeMode)
            setThemeMode(data.appearance.themeMode);
          if (data.appearance.themeColor)
            setThemeColor(data.appearance.themeColor);
        }
        if (data.config) setConfig(data.config as SerialConfig);
        if (data.networkConfig)
          setNetworkConfig(data.networkConfig as NetworkConfig);

        if (data.presets) {
          const validPresets: SerialPreset[] = data.presets.map((p) => ({
            ...p,
            config: p.config,
          }));
          setPresets(validPresets);
        }

        const validCommands: SavedCommand[] = (data.commands || []).map(
          (c) => ({
            ...c,
            parameters: c.parameters?.map((p) => ({
              ...p,
              id: p.id || generateId(),
            })),
          }),
        );

        useStore.setState({
          commands: validCommands,
          sequences: (data.sequences || []) as SerialSequence[],
          contexts: (data.contexts || []) as ProjectContext[],
          devices: (data.devices || []) as Device[],
        });

        addToast("success", t("toast.success"), "Configuration loaded safely.");
      } catch (err: unknown) {
        const error = err as Error;
        console.error(error);
        addToast(
          "error",
          t("toast.error"),
          error.message || "Invalid JSON file.",
        );
      }
    };
    reader.readAsText(file);
    fileInputRef.current?.reset();
  };

  return {
    fileInputRef,
    exportProfile,
    importProfile,
  };
}
