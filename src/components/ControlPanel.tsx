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
