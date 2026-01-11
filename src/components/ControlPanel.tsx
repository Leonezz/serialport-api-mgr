import React, { useEffect, useState, useRef, useMemo } from "react";
import {
  SerialConfig,
  NetworkConfig,
  SerialPreset,
  SavedCommand,
  DashboardWidget,
  FramingConfig,
  SerialSequence,
  ProjectContext,
} from "../types";
import { Button } from "./ui/Button";
import { Select } from "./ui/Select";
import { Input } from "./ui/Input";
import {
  Play,
  Square,
  RefreshCw,
  Usb,
  Globe,
  Cable,
  Download,
  Upload,
  Save,
  X,
  RotateCcw,
  Plus,
  Copy,
  Wand2,
  Scissors,
} from "lucide-react";
import { cn, generateId } from "../lib/utils";
import SimpleInputModal from "./SimpleInputModal";
import { useStore } from "../lib/store";
import { serialService, ISerialPort } from "../lib/serialService";
import { ExportProfileSchema } from "../lib/schemas";
import { useTranslation } from "react-i18next";
import { FramingConfigEditor } from "./shared/FramingConfigEditor";
import { getSemanticPortName, getPortTooltip } from "../lib/portUtils";

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
    themeMode,
    setThemeMode,
    themeColor,
    setThemeColor,
    presets,
    loadedPresetId,
    setLoadedPresetId,
    setPresets,
    addToast,
    commands,
    sequences,
    contexts,
    applyPresetLayout,
  } = useStore();

  const activeSession = sessions[activeSessionId];
  const { config, networkConfig, connectionType, isConnected, widgets } =
    activeSession;

  const [availablePorts, setAvailablePorts] = useState<ISerialPort[]>([]);
  const [selectedPortIndex, setSelectedPortIndex] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);
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

  const activePresetName = loadedPresetId
    ? presets.find((p) => p.id === loadedPresetId)?.name
    : null;

  // Calculate isDirty
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

  const refreshPorts = async () => {
    if (serialService.isSupported()) {
      const ports = await serialService.getPorts();
      setAvailablePorts(ports);
    }
  };

  useEffect(() => {
    refreshPorts();
    if (serialService.isSupported()) {
      serialService.addEventListener("connect", refreshPorts);
      serialService.addEventListener("disconnect", refreshPorts);
      return () => {
        serialService.removeEventListener("connect", refreshPorts);
        serialService.removeEventListener("disconnect", refreshPorts);
      };
    }
  }, []);

  // When loadedPresetId changes, apply dashboard layout if exists
  useEffect(() => {
    if (loadedPresetId) {
      applyPresetLayout(activeSessionId, loadedPresetId);
    }
  }, [loadedPresetId, activeSessionId]);

  const handleChange = (key: keyof SerialConfig, value: any) => {
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
        script: "", // FramingConfigEditor will auto-fill default when switching to SCRIPT
        ...(prev.framing || {}), // Ensure we don't crash if framing is undefined in state
        ...updates,
      },
    }));
  };

  const handleNetworkChange = (key: keyof NetworkConfig, value: any) => {
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
          const errorResult = result as any;
          console.error("Validation Errors:", errorResult.error);
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
          const validPresets: SerialPreset[] = data.presets.map((p: any) => ({
            ...p,
            config: p.config as SerialConfig,
          }));
          setPresets(validPresets);
        }

        // Hydrate commands ensuring parameters have IDs
        const validCommands: SavedCommand[] = (data.commands || []).map(
          (c: any) => ({
            ...c,
            parameters: c.parameters?.map((p: any) => ({
              ...p,
              id: p.id || generateId(),
            })),
          }),
        );

        useStore.setState({
          commands: validCommands,
          sequences: (data.sequences || []) as SerialSequence[],
          contexts: (data.contexts || []) as ProjectContext[],
        });

        addToast("success", t("toast.success"), "Configuration loaded safely.");
      } catch (err: any) {
        console.error(err);
        addToast(
          "error",
          t("toast.error"),
          err.message || "Invalid JSON file.",
        );
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const strategy = config.framing?.strategy || "NONE";

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
            {/* Mode Selector */}
            <div className="flex flex-col gap-1.5">
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider pl-1">
                {t("cp.mode")}
              </span>
              <div className="flex items-center bg-muted/30 p-1 rounded-md border border-border h-9">
                <button
                  onClick={() => setConnectionType("SERIAL")}
                  disabled={isConnected}
                  className={cn(
                    "px-2 h-full rounded-sm text-xs font-medium flex items-center gap-1.5 transition-all",
                    connectionType === "SERIAL"
                      ? "bg-background shadow-sm text-foreground"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  <Cable className="w-3 h-3" /> Serial
                </button>
                <div className="w-px h-3 bg-border/50 mx-1"></div>
                <button
                  onClick={() => setConnectionType("NETWORK")}
                  disabled={isConnected}
                  className={cn(
                    "px-2 h-full rounded-sm text-xs font-medium flex items-center gap-1.5 transition-all",
                    connectionType === "NETWORK"
                      ? "bg-background shadow-sm text-foreground"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  <Globe className="w-3 h-3" /> TCP
                </button>
              </div>
            </div>

            {connectionType === "SERIAL" ? (
              <>
                <div className="flex flex-col gap-1.5">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider pl-1">
                    {t("cp.port")}
                  </span>
                  <div className="flex items-center gap-1">
                    <div className="w-50">
                      <Select
                        className="h-9 text-xs font-mono bg-muted/30 border-border focus:border-primary focus:ring-primary/20"
                        value={selectedPortIndex}
                        onChange={(e) => setSelectedPortIndex(e.target.value)}
                        disabled={isConnected}
                      >
                        <option value="" disabled>
                          Select a port...
                        </option>
                        <optgroup label="Simulated Devices">
                          <option
                            value="mock-echo"
                            className="font-bold text-emerald-600"
                          >
                            🔌 Virtual Echo Device
                          </option>
                          <option
                            value="mock-json-stream"
                            className="font-bold text-blue-600"
                          >
                            🧩 Virtual JSON Stream (Fragment/Burst)
                          </option>
                          <option
                            value="mock-timeout-stream"
                            className="font-bold text-purple-600"
                          >
                            ⏱️ Virtual Packet Stream (Timeout)
                          </option>
                          <option
                            value="mock-prefix-stream"
                            className="font-bold text-amber-600"
                          >
                            📏 Virtual Prefix Stream (2B LE)
                          </option>
                        </optgroup>
                        {availablePorts.length > 0 && (
                          <optgroup label="Physical Ports">
                            {availablePorts.map((port, idx) => {
                              const rustInfo = port.getRustPortInfo?.();
                              const semanticName = rustInfo
                                ? getSemanticPortName(rustInfo)
                                : `Port ${idx + 1}`;
                              const tooltip = rustInfo
                                ? getPortTooltip(rustInfo)
                                : "";
                              return (
                                <option key={idx} value={idx} title={tooltip}>
                                  {semanticName}
                                </option>
                              );
                            })}
                          </optgroup>
                        )}
                        <option value="new">+ Request New Port...</option>
                      </Select>
                    </div>
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-9 w-9 text-muted-foreground hover:text-foreground bg-muted/30 border-border"
                      onClick={refreshPorts}
                      title="Refresh Ports"
                    >
                      <RefreshCw className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
                <div className="flex flex-col gap-1.5">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider pl-1">
                    {t("cp.baud")}
                  </span>
                  <div className="w-25">
                    <Select
                      value={config.baudRate}
                      onChange={(e) =>
                        handleChange("baudRate", parseInt(e.target.value))
                      }
                      className="h-9 text-xs font-mono bg-muted/30 border-border"
                      disabled={isConnected}
                    >
                      {[
                        9600, 19200, 38400, 57600, 74880, 115200, 230400,
                        460800, 921600,
                      ].map((r) => (
                        <option key={r} value={r}>
                          {r}
                        </option>
                      ))}
                    </Select>
                  </div>
                </div>
                <div className="flex flex-col gap-1.5">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider pl-1">
                    Data Bits
                  </span>
                  <div className="w-17.5">
                    <Select
                      value={config.dataBits}
                      onChange={(e) =>
                        handleChange("dataBits", parseInt(e.target.value))
                      }
                      className="h-9 text-xs font-mono bg-muted/30 border-border"
                      disabled={isConnected}
                    >
                      <option value={8}>8-bit</option>
                      <option value={7}>7-bit</option>
                    </Select>
                  </div>
                </div>
                <div className="flex flex-col gap-1.5">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider pl-1">
                    Parity
                  </span>
                  <div className="w-20">
                    <Select
                      value={config.parity}
                      onChange={(e) => handleChange("parity", e.target.value)}
                      className="h-9 text-xs font-mono bg-muted/30 border-border"
                      disabled={isConnected}
                    >
                      <option value="none">None</option>
                      <option value="even">Even</option>
                      <option value="odd">Odd</option>
                    </Select>
                  </div>
                </div>
                <div className="flex flex-col gap-1.5">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider pl-1">
                    Stop Bits
                  </span>
                  <div className="w-17.5">
                    <Select
                      value={config.stopBits}
                      onChange={(e) =>
                        handleChange("stopBits", parseInt(e.target.value))
                      }
                      className="h-9 text-xs font-mono bg-muted/30 border-border"
                      disabled={isConnected}
                    >
                      <option value={1}>1-bit</option>
                      <option value={2}>2-bit</option>
                    </Select>
                  </div>
                </div>

                {/* Framing Strategy Button */}
                <div className="flex flex-col gap-1.5 relative">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider pl-1">
                    {t("cp.framing")}
                  </span>
                  <Button
                    variant="outline"
                    className={cn(
                      "h-9 px-3 text-xs gap-2 border-border bg-muted/30",
                      strategy !== "NONE" &&
                        "border-primary/50 text-primary bg-primary/5",
                    )}
                    onClick={() => setShowFramingModal(true)}
                    // Framing can be changed while connected to parse data differently on the fly
                    disabled={false}
                  >
                    <Scissors className="w-3.5 h-3.5" />
                    {strategy === "NONE"
                      ? "None"
                      : strategy === "TIMEOUT"
                        ? "Timeout"
                        : strategy === "PREFIX_LENGTH"
                          ? "Prefix"
                          : strategy === "SCRIPT"
                            ? "Script"
                            : "Delim"}
                  </Button>
                </div>
              </>
            ) : (
              <>
                <div className="flex flex-col gap-1.5">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider pl-1">
                    Host (WebSocket/IP)
                  </span>
                  <Input
                    value={networkConfig.host}
                    onChange={(e) =>
                      handleNetworkChange("host", e.target.value)
                    }
                    disabled={isConnected}
                    className="h-9 w-55 text-xs font-mono bg-muted/30 border-border"
                    placeholder="192.168.1.100"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider pl-1">
                    Port
                  </span>
                  <Input
                    type="number"
                    value={networkConfig.port}
                    onChange={(e) =>
                      handleNetworkChange("port", parseInt(e.target.value))
                    }
                    disabled={isConnected}
                    className="h-9 w-20 text-xs font-mono bg-muted/30 border-border"
                    placeholder="8080"
                  />
                </div>
              </>
            )}

            {/* --- Preset Management Toolbar --- */}
            <div className="h-full w-px bg-border/50 mx-2"></div>
            <div className="flex flex-col gap-1.5">
              <span className="text-[10px] font-bold text-transparent select-none uppercase tracking-wider">
                {t("cp.profile")}
              </span>
              <div className="flex items-center gap-1.5 bg-muted/30 p-1 rounded-md border border-border h-9">
                {loadedPresetId ? (
                  <>
                    <div
                      className={cn(
                        "px-2 text-xs font-medium max-w-30 truncate flex items-center gap-1.5",
                        isPresetDirty ? "text-amber-500" : "text-foreground",
                      )}
                    >
                      {activePresetName}
                      {isPresetDirty && (
                        <span
                          className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"
                          title="Unsaved Changes"
                        ></span>
                      )}
                    </div>
                    {isPresetDirty && (
                      <>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 text-amber-500 hover:text-amber-600 hover:bg-amber-500/10"
                          onClick={onUpdateLoadedPreset}
                          title="Update Profile"
                        >
                          <Save className="w-3.5 h-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 text-muted-foreground hover:text-foreground"
                          onClick={onRevertLoadedPreset}
                          title="Revert Changes"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                        </Button>
                      </>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 text-muted-foreground hover:text-foreground"
                      onClick={() => {
                        setSaveModalDefault(`${activePresetName} (Copy)`);
                        setIsSaveModalOpen(true);
                      }}
                      title="Save As New Preset (Copy)"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </Button>
                    <div className="w-px h-4 bg-border/50"></div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                      onClick={() => {
                        setLoadedPresetId(null);
                        addToast(
                          "info",
                          "Detached",
                          "Configuration is now custom.",
                        );
                      }}
                      title="Detach (Cancel) Profile"
                    >
                      <X className="w-3.5 h-3.5" />
                    </Button>
                  </>
                ) : (
                  <div className="px-1 flex items-center gap-2">
                    <span className="text-[10px] text-muted-foreground italic px-1">
                      {t("cp.custom")}
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 text-[10px] gap-1 px-2 border border-dashed border-border"
                      onClick={() => {
                        setSaveModalDefault("");
                        setIsSaveModalOpen(true);
                      }}
                    >
                      <Plus className="w-3 h-3" /> {t("cp.save_as")}
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-end gap-3">
          {/* Project Management */}
          <div className="flex flex-col gap-1.5 justify-end">
            <span className="text-[10px] font-bold text-transparent select-none uppercase tracking-wider">
              Project
            </span>
            <div className="flex items-center gap-1 bg-muted/30 p-1 rounded-md border border-border">
              <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept=".json"
                onChange={handleImportProfile}
              />
              <Button
                variant="ghost"
                size="icon"
                onClick={() => fileInputRef.current?.click()}
                className="h-7 w-7 rounded-sm hover:bg-background hover:shadow-sm"
                title="Load Project Backup"
              >
                <Upload className="w-3.5 h-3.5" />
              </Button>
              <div className="w-px h-4 bg-border/50"></div>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleExportProfile}
                className="h-7 w-7 rounded-sm hover:bg-background hover:shadow-sm"
                title="Save Project Backup"
              >
                <Download className="w-3.5 h-3.5" />
              </Button>
              <div className="w-px h-4 bg-border/50"></div>
              <Button
                variant="ghost"
                size="icon"
                onClick={onOpenAIGenerator}
                className="h-7 w-7 rounded-sm hover:bg-background hover:shadow-sm text-purple-500 hover:text-purple-600"
                title="AI Project Generator (From manual/text)"
              >
                <Wand2 className="w-3.5 h-3.5" />
              </Button>
            </div>
          </div>

          <div className="w-px h-9 bg-border mx-1 mb-0.5"></div>

          {/* Connection Button */}
          <div className="flex flex-col gap-1.5 justify-end">
            <span className="text-[10px] font-bold text-transparent select-none uppercase tracking-wider">
              Action
            </span>
            {!isConnected ? (
              <Button
                onClick={handleConnectClick}
                className="h-9 px-8 bg-primary hover:bg-primary/90 shadow-md font-semibold tracking-wide transition-all hover:scale-105 active:scale-95"
              >
                <Play className="w-4 h-4 mr-2 fill-current" />{" "}
                {connectionType === "SERIAL" ? t("cp.open") : t("cp.connect")}
              </Button>
            ) : (
              <Button
                variant="destructive"
                onClick={onDisconnect}
                className="h-9 px-8 shadow-md font-semibold tracking-wide transition-all hover:scale-105 active:scale-95"
              >
                <Square className="w-4 h-4 mr-2 fill-current" />{" "}
                {connectionType === "SERIAL"
                  ? t("cp.close")
                  : t("cp.disconnect")}
              </Button>
            )}
          </div>
        </div>
      </div>

      {isSaveModalOpen && (
        <SimpleInputModal
          title={saveModalDefault ? "Copy Preset" : "Save New Preset"}
          defaultValue={saveModalDefault}
          placeholder="Enter preset name..."
          onSave={(name) => handleSaveNewPreset(name)}
          onClose={() => setIsSaveModalOpen(false)}
        />
      )}

      {showFramingModal && (
        <div
          className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => setShowFramingModal(false)}
        >
          <div
            className="w-full max-w-2xl bg-card border border-border rounded-lg shadow-2xl p-6 space-y-4 animate-in fade-in zoom-in-95"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-2 border-b border-border">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Scissors className="w-4 h-4" /> Framing Strategy
              </h3>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowFramingModal(false)}
                className="h-8 w-8"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>

            <FramingConfigEditor
              config={config.framing}
              onChange={handleFramingChange}
            />

            <div className="flex justify-end pt-2">
              <Button
                onClick={() => setShowFramingModal(false)}
                className="w-full sm:w-auto"
              >
                Done
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ControlPanel;
