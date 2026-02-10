import React, { useEffect, useState, useRef, useMemo } from "react";
import { SerialConfig, NetworkConfig, FramingConfig } from "../types";
import { Usb, Globe } from "lucide-react";
import { cn } from "../lib/utils";
import SimpleInputModal from "./SimpleInputModal";
import { useStore } from "../lib/store";
import { serialService, ISerialPort } from "../lib/serialService";
import { useTranslation } from "react-i18next";
import { usePresetOperations } from "../hooks/usePresetOperations";
import { useProfileImportExport } from "../hooks/useProfileImportExport";

import ModeSelector from "./ControlPanel/ModeSelector";
import SerialConfigPanel from "./ControlPanel/SerialConfigPanel";
import NetworkConfigPanel from "./ControlPanel/NetworkConfigPanel";
import PresetToolbar from "./ControlPanel/PresetToolbar";
import ProjectActions from "./ControlPanel/ProjectActions";
import ConnectionButton from "./ControlPanel/ConnectionButton";
import FramingModal from "./ControlPanel/FramingModal";

interface Props {
  onConnect: (port?: ISerialPort | string) => void;
  onDisconnect: () => void;
  onOpenAIGenerator: () => void;
}

const ControlPanel: React.FC<Props> = ({
  onConnect,
  onDisconnect,
  onOpenAIGenerator,
}) => {
  const { t } = useTranslation();
  const {
    sessions,
    activeSessionId,
    setConfig,
    setNetworkConfig,
    setConnectionType,
    protocols,
    setProtocolFramingEnabled,
    setActiveProtocolId,
  } = useStore();

  const activeSession = sessions[activeSessionId];
  const {
    config,
    networkConfig,
    connectionType,
    isConnected,
    protocolFramingEnabled,
    activeProtocolId,
  } = activeSession;

  // Extracted hooks (#81)
  const preset = usePresetOperations();
  const profile = useProfileImportExport();

  // Get the active protocol for framing display
  const activeProtocol = useMemo(() => {
    if (!protocolFramingEnabled || !activeProtocolId) return null;
    return protocols.find((p) => p.id === activeProtocolId) ?? null;
  }, [protocolFramingEnabled, activeProtocolId, protocols]);

  const [availablePorts, setAvailablePorts] = useState<ISerialPort[]>([]);
  const [selectedPortIndex, setSelectedPortIndex] = useState<string>("");
  const configScrollRef = useRef<HTMLDivElement>(null);
  const [isConfigScrollable, setIsConfigScrollable] = useState(false);

  // Detect if config panel is scrollable
  useEffect(() => {
    const checkScrollable = () => {
      if (configScrollRef.current) {
        const { scrollWidth, clientWidth } = configScrollRef.current;
        setIsConfigScrollable(scrollWidth > clientWidth);
      }
    };

    checkScrollable();
    window.addEventListener("resize", checkScrollable);
    return () => window.removeEventListener("resize", checkScrollable);
  }, [config, networkConfig, connectionType, availablePorts.length]);

  // Modal State
  const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);
  const [saveModalDefault, setSaveModalDefault] = useState("");
  const [showFramingModal, setShowFramingModal] = useState(false);

  const refreshPorts = async () => {
    if (serialService.isSupported()) {
      const ports = await serialService.getPorts();
      setAvailablePorts(ports);
    }
  };

  useEffect(() => {
    if (!serialService.isSupported()) return;

    serialService.getPorts().then(setAvailablePorts);

    serialService.addEventListener("connect", refreshPorts);
    serialService.addEventListener("disconnect", refreshPorts);
    return () => {
      serialService.removeEventListener("connect", refreshPorts);
      serialService.removeEventListener("disconnect", refreshPorts);
    };
  }, []);

  const handleChange = (
    key: keyof SerialConfig,
    value: SerialConfig[keyof SerialConfig],
  ) => {
    setConfig((prev) => ({ ...prev, [key]: value }));
  };

  const handleFramingChange = (updates: Partial<FramingConfig>) => {
    setConfig((prev) => ({
      ...prev,
      framing: {
        strategy: "NONE",
        delimiter: "",
        timeout: 50,
        prefixLengthSize: 1,
        byteOrder: "LE",
        script: "",
        ...(prev.framing || {}),
        ...updates,
      },
    }));
  };

  const handleNetworkChange = (
    key: keyof NetworkConfig,
    value: NetworkConfig[keyof NetworkConfig],
  ) => {
    setNetworkConfig((prev) => ({ ...prev, [key]: value }));
  };

  const handleConnectClick = () => {
    if (connectionType === "SERIAL") {
      if (selectedPortIndex.startsWith("mock")) {
        onConnect(selectedPortIndex);
      } else if (selectedPortIndex === "" || selectedPortIndex === "new") {
        onConnect();
      } else {
        const port = availablePorts[parseInt(selectedPortIndex)];
        onConnect(port);
      }
    } else {
      onConnect();
    }
  };

  const extractDashboardConfig = (): DashboardWidget[] => {
    return [...widgets];
  };

  const onUpdateLoadedPreset = () => {
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

  const onRevertLoadedPreset = () => {
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

  const handleSaveNewPreset = (name: string) => {
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

  // Import/Export
  const handleExportProfile = () => {
    // Export active session logs, but global settings
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

  const handleImportProfile = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !e.target.files[0]) return;
    const file = e.target.files[0];
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const rawData = JSON.parse(content);

        // Validate with Zod
        const result = ExportProfileSchema.safeParse(rawData);

        if (!result.success) {
          const errorResult = result as {
            error: { issues: { message: string }[] };
          };
          throw new Error(
            `Invalid file format: ${errorResult.error.issues[0].message}`,
          );
        }

        const data = result.data;

        // Hydration
        if (data.appearance) {
          if (data.appearance.themeMode)
            setThemeMode(data.appearance.themeMode);
          if (data.appearance.themeColor)
            setThemeColor(data.appearance.themeColor);
        }
        // Force cast config because schema validation guarantees structure but TS types might differ slightly in strictness
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

        // Hydrate commands ensuring parameters have IDs
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

          devices: (data.devices || []) as Device[], // Use existing schema if available
        });

        addToast("success", t("toast.success"), "Configuration loaded safely.");
      } catch (err: unknown) {
        const error = err as Error;
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

  const handleProtocolFramingToggle = () => {
    if (protocolFramingEnabled) {
      setProtocolFramingEnabled(false);
      setActiveProtocolId(undefined);
    } else if (protocols.length === 1) {
      setActiveProtocolId(protocols[0].id);
      setProtocolFramingEnabled(true);
    } else {
      setActiveProtocolId(protocols[0].id);
      setProtocolFramingEnabled(true);
    }
  };

  return (
    <>
      <div className="border-b border-border bg-background flex items-center px-4 py-3 gap-5 shrink-0 z-20 shadow-sm relative">
        {/* Branding */}
        <div className="flex items-center gap-3 min-w-40 mr-2">
          <div
            className={cn(
              "p-2 rounded-lg transition-colors shadow-inner",
              isConnected ? "bg-emerald-500/10" : "bg-primary/10",
            )}
          >
            {connectionType === "SERIAL" ? (
              <Usb
                className={cn(
                  "w-6 h-6",
                  isConnected ? "text-emerald-500" : "text-primary",
                )}
              />
            ) : (
              <Globe
                className={cn(
                  "w-6 h-6",
                  isConnected ? "text-emerald-500" : "text-primary",
                )}
              />
            )}
          </div>
          <div className="flex flex-col leading-tight">
            <span className="font-bold tracking-tight text-foreground text-lg">
              {t("app.title")}
            </span>
            <span
              className={cn(
                "text-[10px] font-bold uppercase tracking-widest",
                isConnected ? "text-emerald-500" : "text-muted-foreground",
              )}
            >
              {isConnected ? t("status.connected") : t("status.offline")}
            </span>
          </div>
        </div>

        <div className="h-10 w-px bg-border mx-1"></div>

        {/* Configuration Controls - with scroll fade indicators */}
        <div className="relative flex-1 min-w-0">
          <div
            ref={configScrollRef}
            data-scrollable={isConfigScrollable}
            className="flex items-end gap-3 overflow-x-auto no-scrollbar pb-1"
          >
            <ModeSelector
              connectionType={connectionType}
              isConnected={isConnected}
              onConnectionTypeChange={setConnectionType}
              t={t}
            />

            {connectionType === "SERIAL" ? (
              <SerialConfigPanel
                config={config}
                isConnected={isConnected}
                availablePorts={availablePorts}
                selectedPortIndex={selectedPortIndex}
                onSelectedPortIndexChange={setSelectedPortIndex}
                onConfigChange={handleChange}
                onRefreshPorts={refreshPorts}
                onShowFramingModal={() => setShowFramingModal(true)}
                protocols={protocols}
                protocolFramingEnabled={protocolFramingEnabled}
                activeProtocol={activeProtocol}
                onProtocolFramingToggle={handleProtocolFramingToggle}
                t={t}
              />
            ) : (
              <NetworkConfigPanel
                networkConfig={networkConfig}
                isConnected={isConnected}
                onNetworkConfigChange={handleNetworkChange}
              />
            )}

            <PresetToolbar
              loadedPresetId={preset.loadedPresetId}
              activePresetName={preset.activePresetName}
              isPresetDirty={preset.isPresetDirty}
              onUpdate={preset.updateLoadedPreset}
              onRevert={preset.revertLoadedPreset}
              onCopy={() => {
                setSaveModalDefault(`${preset.activePresetName} (Copy)`);
                setIsSaveModalOpen(true);
              }}
              onDetach={preset.detachPreset}
              onSaveAs={() => {
                setSaveModalDefault("");
                setIsSaveModalOpen(true);
              }}
              t={t}
            />
          </div>
        </div>

        <div className="flex items-end gap-3">
          <ProjectActions
            fileInputRef={profile.fileInputRef}
            onImport={profile.importProfile}
            onExport={profile.exportProfile}
            onOpenAIGenerator={onOpenAIGenerator}
          />

          <div className="w-px h-9 bg-border mx-1 mb-0.5"></div>

          <ConnectionButton
            isConnected={isConnected}
            connectionType={connectionType}
            onConnect={handleConnectClick}
            onDisconnect={onDisconnect}
            t={t}
          />
        </div>
      </div>

      {isSaveModalOpen && (
        <SimpleInputModal
          title={saveModalDefault ? "Copy Preset" : "Save New Preset"}
          defaultValue={saveModalDefault}
          placeholder="Enter preset name..."
          onSave={(name) => preset.saveNewPreset(name)}
          onClose={() => setIsSaveModalOpen(false)}
        />
      )}

      <FramingModal
        isOpen={showFramingModal}
        config={config.framing}
        onFramingChange={handleFramingChange}
        onClose={() => setShowFramingModal(false)}
      />
    </>
  );
};

export default ControlPanel;
