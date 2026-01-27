/**
 * Main Workspace Page
 *
 * This is the original App component, refactored as a page component.
 * It contains the main serial port communication interface.
 */

import React, { useState, useMemo } from "react";
import { Activity, Plus, X, Wifi, Usb } from "lucide-react";
import { getBytes } from "../lib/utils";
import { SavedCommand, SequenceStep, Session } from "../types";
import { AIProjectResult } from "../services/geminiService";
import ConsoleViewer from "../components/ConsoleViewer";
import Sidebar from "../components/Sidebar";
import RightSidebar from "../components/RightSidebar";
import ControlPanel from "../components/ControlPanel";
import InputPanel from "../components/InputPanel";
import PresetFormModal from "../components/PresetFormModal";
import AICommandGeneratorModal from "../components/AICommandGeneratorModal";
import ParameterInputModal from "../components/ParameterInputModal";
import SimpleInputModal from "../components/SimpleInputModal";
import ConfirmationModal from "../components/ConfirmationModal";
import SystemLogViewer from "../components/SystemLogViewer";
import AppSettingsModal from "../components/AppSettingsModal";
import { TopBar } from "../components/ui/TopBar";
import { StatusBar } from "../components/ui/StatusBar";
import { generateId, getErrorMessage } from "../lib/utils";
import { useSerialConnection } from "../hooks/useSerialConnection";
import { useValidation } from "../hooks/useValidation";
import { useFraming } from "../hooks/useFraming";
import { useCommandExecution } from "../hooks/useCommandExecution";
import { useStore } from "../lib/store";
import { cn } from "../lib/utils";

const MainWorkspace: React.FC = () => {
  // Store
  const {
    // State
    commands,
    sessions,
    activeSessionId,
    // Actions
    setConfig,
    setPresets,
    setCommands,
    setContexts,
    addSequence,
    setSendMode,
    setEncoding,
    addToast,
    setEditingPreset,
    setPendingParamCommand,
    setShowGeneratorModal,
    setActiveSequenceId,
    setIsConnected,
    addSession,
    removeSession,
    setActiveSessionId,
    renameSession,

    // New Actions
    addSystemLog,
    setFramingOverride,
    setPortName,

    // Modal States
    editingPreset,
    pendingParamCommand,
    showGeneratorModal,
    showSystemLogs,
    showAppSettings,
  } = useStore();

  const activeSession = sessions[activeSessionId];
  // Type assertion: config always has required fields due to defaults applied at session creation
  const config = activeSession.config as Required<typeof activeSession.config>;
  const {
    networkConfig,
    sendMode,
    encoding,
    checksum,
    isConnected: sessionIsConnected,
    connectionType,
  } = activeSession;

  const [generatorModalData, setGeneratorModalData] =
    useState<AIProjectResult | null>(null);

  // Renaming State
  const [renamingSessionId, setRenamingSessionId] = useState<string | null>(
    null,
  );

  // Session Deletion Confirmation
  const [sessionToDelete, setSessionToDelete] = useState<string | null>(null);

  // Signal State (Visual Only for now, managed per session conceptually but hook toggles)
  const [rts, setRts] = useState(false);
  const [dtr, setDtr] = useState(false);

  // --- Custom Hooks for Business Logic ---
  const validation = useValidation();
  const framing = useFraming();

  // Connection Hook
  const { connect, disconnect, write, toggleSignal, isWebSerialSupported } =
    useSerialConnection(
      (chunk: Uint8Array, sessionId: string) => {
        // Use framing hook to handle incoming data
        const handleData = framing.handleDataReceived(
          sessionId,
          validation.checkValidation,
        );
        handleData(chunk);
      },
      (sessionId) => {
        // onDisconnect
        const currentActive = useStore.getState().activeSessionId;
        if (sessionId === currentActive) {
          setIsConnected(false);
          setActiveSequenceId(null);
        }
        addSystemLog(
          "WARN",
          "CONNECTION",
          `Session ${sessionId} disconnected unexpectedly.`,
        );

        // Cleanup Framer
        framing.cleanupFramer(sessionId);

        // Clear validation for this session
        validation.clearValidation(sessionId);

        // Clear any override
        setFramingOverride(undefined);
      },
    );

  // Command execution hook - uses validation internally
  const commandExecution = useCommandExecution(
    activeSessionId,
    write,
    sendMode,
    setSendMode,
    encoding,
    setEncoding,
    checksum,
    validation.activeValidationsRef, // Use shared ref from validation hook
    framing.overrideTimerRef,
  );

  // Calculate bytes received/transmitted from session logs
  // Note: Must be called before any early returns to maintain hook order
  const { bytesReceived, bytesTransmitted } = useMemo(() => {
    const logs = activeSession.logs || [];
    let rx = 0;
    let tx = 0;
    for (const log of logs) {
      const bytes = getBytes(log.data);
      if (log.direction === "RX") {
        rx += bytes.length;
      } else {
        tx += bytes.length;
      }
    }
    return { bytesReceived: rx, bytesTransmitted: tx };
  }, [activeSession.logs]);

  const handleAIImport = (result: AIProjectResult) => {
    let newContextId: string | undefined;
    const timestamp = Date.now();
    if (result.sourceText) {
      const ctxId = generateId();
      setContexts((prev) => [
        ...prev,
        {
          id: ctxId,
          title: `Imported Config ${new Date().toLocaleTimeString()}`,
          content: result.sourceText || "",
          source: "AI_GENERATED",
          createdAt: timestamp,
        },
      ]);
      newContextId = ctxId;
      addToast(
        "success",
        "Context Created",
        "Source manual/text saved as context.",
      );
    }
    if (result.config && Object.keys(result.config).length > 0) {
      setConfig((prev) => ({ ...prev, ...result.config }));
      addToast(
        "success",
        "Config Updated",
        "Serial settings updated from AI suggestion.",
      );
    }
    const commandNameMap = new Map<string, string>();
    const deviceGroupName = result.deviceName || "Imported Device";

    const newCommandsForState: SavedCommand[] = result.commands.map((c) => {
      const id = generateId();
      commandNameMap.set(c.name, id);
      return {
        ...c,
        id,
        group: deviceGroupName,
        encoding: c.encoding || "UTF-8",
        creator: "AI Assistant",
        createdAt: timestamp,
        updatedAt: timestamp,
        usedBy: [],
        contextId: newContextId,
      };
    });
    setCommands((prev) => [...prev, ...newCommandsForState]);
    addToast(
      "success",
      "Imported",
      `Added ${newCommandsForState.length} commands.`,
    );
    addSystemLog(
      "INFO",
      "SYSTEM",
      `Imported project from AI: ${result.deviceName}`,
    );

    result.sequences.forEach((seq) => {
      const steps = (seq.steps || [])
        .map((s) => {
          const cmdId = commandNameMap.get(s.commandName);
          if (!cmdId) return null;
          return {
            id: generateId(),
            commandId: cmdId,
            delay: s.delay,
            stopOnError: s.stopOnError,
          };
        })
        .filter((s) => s !== null) as SequenceStep[];

      if (steps.length > 0) {
        addSequence({
          name: seq.name,
          description: seq.description,
          steps: steps,
          creator: "AI Assistant",
          createdAt: timestamp,
          updatedAt: timestamp,
        });
      }
    });
    setShowGeneratorModal(false);
    setGeneratorModalData(null);
  };

  if (!isWebSerialSupported) {
    return (
      <div className="h-full flex items-center justify-center bg-background text-foreground p-4">
        <div className="max-w-md text-center">
          <Activity className="w-16 h-16 text-destructive mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-2">
            Serial Communication Not Available
          </h1>
          <p className="text-muted-foreground">
            Please use a Tauri desktop app or a WebSerial-compatible browser
            (Chrome, Edge, Opera).
          </p>
        </div>
      </div>
    );
  }

  // Compute connection state for StatusBar
  const connectionState = sessionIsConnected ? "connected" : "disconnected";

  // Compute serial config string for StatusBar
  const serialConfigString = `${config.baudRate} ${config.dataBits}${config.parity.charAt(0).toUpperCase()}${config.stopBits}`;

  // Session tabs as center content for TopBar
  const sessionTabsContent = (
    <div className="flex items-end gap-1 h-full overflow-x-auto overflow-y-hidden [scrollbar-width:thin] [&::-webkit-scrollbar]:h-1.5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-muted-foreground/20 hover:[&::-webkit-scrollbar-thumb]:bg-muted-foreground/40">
      {Object.values(sessions).map((session: Session) => (
        <div
          key={session.id}
          className={cn(
            "group flex items-center gap-2 px-3 py-1.5 rounded-t-md text-xs font-medium border-t border-x cursor-pointer select-none transition-all max-w-37.5 shrink-0",
            activeSessionId === session.id
              ? "bg-background border-border text-foreground -mb-px z-10 shadow-sm"
              : "bg-muted/30 border-transparent text-muted-foreground hover:bg-muted hover:text-foreground",
          )}
          onClick={() => setActiveSessionId(session.id)}
          onDoubleClick={() => setRenamingSessionId(session.id)}
        >
          {session.connectionType === "SERIAL" ? (
            <Usb className="w-3 h-3 opacity-70" />
          ) : (
            <Wifi className="w-3 h-3 opacity-70" />
          )}
          <span className="truncate">{session.name}</span>
          {Object.keys(sessions).length > 1 && (
            <div
              role="button"
              onClick={(e) => {
                e.stopPropagation();
                setSessionToDelete(session.id);
              }}
              className="opacity-0 group-hover:opacity-100 p-0.5 rounded-sm hover:bg-destructive/10 hover:text-destructive"
            >
              <X className="w-3 h-3" />
            </div>
          )}
        </div>
      ))}
      <button
        onClick={addSession}
        className="ml-1 h-6 w-6 flex items-center justify-center rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors shrink-0"
        title="New Session"
      >
        <Plus className="w-4 h-4" />
      </button>
    </div>
  );

  return (
    <div className="flex flex-col h-screen w-full min-w-225 min-h-150 bg-background text-foreground font-sans overflow-hidden">
      {/* Top Bar - 48px */}
      <TopBar
        title="SerialMan AI"
        centerContent={sessionTabsContent}
        onSettingsClick={() => useStore.getState().setShowAppSettings(true)}
      />

      {/* Main Content Area */}
      <div className="flex flex-1 overflow-hidden">
        <Sidebar
          onSendCommand={(cmd) =>
            commandExecution.handleSendCommandRequest(cmd, (c) =>
              setPendingParamCommand(c),
            )
          }
          onRunSequence={commandExecution.handleRunSequence}
        />

        <div className="flex-1 flex flex-col min-w-0 bg-background relative">
          <ControlPanel
            onConnect={async (port) => {
              try {
                const connectedPortName = await connect(
                  activeSessionId,
                  config,
                  networkConfig,
                  connectionType,
                  port,
                );
                setIsConnected(true);
                // Save the port name to the session state for log retrieval
                if (
                  connectedPortName &&
                  typeof connectedPortName === "string"
                ) {
                  setPortName(connectedPortName);
                }

                addToast(
                  "success",
                  "Connected",
                  `Session "${activeSession.name}" is now online.`,
                );
                const connectionInfo =
                  connectionType === "SERIAL"
                    ? `${config.baudRate} ${config.dataBits}${config.parity.charAt(0).toUpperCase()}${config.stopBits}`
                    : `${networkConfig.host}:${networkConfig.port}`;
                addSystemLog(
                  "SUCCESS",
                  "CONNECTION",
                  `Connected to ${activeSession.name}`,
                  { type: connectionType, config: connectionInfo },
                );
              } catch (e: unknown) {
                const errorMsg = getErrorMessage(e);
                console.error(e);
                addToast(
                  "error",
                  "Connection Error",
                  errorMsg || "Failed to connect",
                );
                addSystemLog(
                  "ERROR",
                  "CONNECTION",
                  `Connection failed: ${errorMsg}`,
                );
              }
            }}
            onDisconnect={async () => {
              try {
                await disconnect(activeSessionId);
                setIsConnected(false);
                addSystemLog(
                  "INFO",
                  "CONNECTION",
                  `Disconnected from ${activeSession.name}`,
                );
              } catch (e: unknown) {
                addToast("error", "Disconnect Error", getErrorMessage(e));
              }
            }}
            onOpenAIGenerator={() => {
              setGeneratorModalData(null);
              setShowGeneratorModal(true);
            }}
          />

          {/* Main Content Area: Console + Input on Left, Sidebar on Right */}
          <div className="flex-1 relative overflow-hidden flex flex-row bg-muted/5">
            {/* Left Column: Console & Input */}
            <div className="flex-1 flex flex-col min-w-0 relative h-full bg-linear-to-br from-background via-background to-muted/10">
              {/* Console Wrapper */}
              <div className="flex-1 relative min-h-0 flex flex-col">
                <ConsoleViewer />
              </div>

              {/* Input Panel sits below console, aligned with it */}
              <InputPanel
                onSend={(data) => {
                  commandExecution.sendData(data).catch(() => {});
                }}
                rts={rts}
                dtr={dtr}
                onToggleSignal={(s) => {
                  if (s === "rts") setRts(!rts);
                  else setDtr(!dtr);
                  toggleSignal(activeSessionId, s);
                }}
                isConnected={sessionIsConnected}
              />
            </div>

            {/* Right Sidebar - Sticky Height */}
            <RightSidebar />
          </div>
        </div>
      </div>

      {/* Status Bar - 24px */}
      <StatusBar
        connectionState={connectionState}
        portName={activeSession.portName}
        serialConfig={
          connectionType === "SERIAL" ? serialConfigString : undefined
        }
        bytesReceived={bytesReceived}
        bytesTransmitted={bytesTransmitted}
      />

      {pendingParamCommand && (
        <ParameterInputModal
          command={pendingParamCommand}
          onSend={(values) => {
            let finalData = pendingParamCommand.payload;
            if (pendingParamCommand.mode === "TEXT") {
              switch (config.lineEnding) {
                case "LF":
                  finalData += "\n";
                  break;
                case "CR":
                  finalData += "\r";
                  break;
                case "CRLF":
                  finalData += "\r\n";
                  break;
              }
            }
            if (pendingParamCommand.mode !== sendMode)
              setSendMode(pendingParamCommand.mode);
            if (
              pendingParamCommand.encoding &&
              pendingParamCommand.encoding !== encoding
            )
              setEncoding(pendingParamCommand.encoding);
            commandExecution
              .sendData(finalData, pendingParamCommand, values)
              .catch(() => {});
          }}
          onClose={() => setPendingParamCommand(null)}
        />
      )}

      {editingPreset && (
        <PresetFormModal
          initialData={editingPreset}
          currentConfig={config}
          currentNetworkConfig={networkConfig}
          currentConnectionType={connectionType}
          onSave={(data) => {
            setPresets((prev) =>
              prev.map((p) => (p.id === data.id ? data : p)),
            );
            addToast(
              "success",
              "Preset Updated",
              `Preset "${data.name}" saved.`,
            );
          }}
          onClose={() => setEditingPreset(null)}
        />
      )}

      {showGeneratorModal && (
        <AICommandGeneratorModal
          existingCommands={commands}
          initialResult={generatorModalData}
          onImport={handleAIImport}
          onClose={() => {
            setShowGeneratorModal(false);
            setGeneratorModalData(null);
          }}
        />
      )}

      {renamingSessionId && (
        <SimpleInputModal
          title="Rename Session"
          defaultValue={sessions[renamingSessionId]?.name}
          placeholder="Session Name"
          onSave={(name) => renameSession(renamingSessionId, name)}
          onClose={() => setRenamingSessionId(null)}
        />
      )}

      {sessionToDelete && (
        <ConfirmationModal
          title="Close Session?"
          message={`Are you sure you want to close "${sessions[sessionToDelete]?.name}"? Any unsaved data in this session log will be lost.`}
          confirmLabel="Close"
          isDestructive
          onConfirm={() => {
            removeSession(sessionToDelete);
            setSessionToDelete(null);
          }}
          onCancel={() => setSessionToDelete(null)}
        />
      )}

      {showSystemLogs && <SystemLogViewer />}
      {showAppSettings && <AppSettingsModal />}
    </div>
  );
};

export default MainWorkspace;
