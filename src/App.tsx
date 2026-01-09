
import React, { useState, useEffect, useRef } from 'react';
import { Activity, Trash2, Plus, X, Wifi, Usb } from 'lucide-react';
import { SavedCommand, SerialSequence, ValidationMode, SequenceStep, Session } from './types';
import { AIProjectResult } from './services/geminiService';
import ConsoleViewer from './components/ConsoleViewer';
import Sidebar from './components/Sidebar';
import RightSidebar from './components/RightSidebar';
import ControlPanel from './components/ControlPanel';
import InputPanel from './components/InputPanel';
import PresetFormModal from './components/PresetFormModal';
import AICommandGeneratorModal from './components/AICommandGeneratorModal';
import ParameterInputModal from './components/ParameterInputModal';
import SimpleInputModal from './components/SimpleInputModal';
import ConfirmationModal from './components/ConfirmationModal';
import SystemLogViewer from './components/SystemLogViewer';
import AppSettingsModal from './components/AppSettingsModal';
import ToastContainer from './components/ui/Toast';
import { Button } from './components/ui/Button';
import { generateId } from './lib/utils';
import { calculateChecksum, encodeText } from './lib/dataUtils';
import { executeUserScript } from './lib/scripting';
import { useSerialConnection } from './hooks/useSerialConnection';
import { useStore } from './lib/store';
import { cn } from './lib/utils';
import { SerialFramer } from './lib/framing';

interface ActiveValidation {
    sessionId: string;
    mode: ValidationMode | 'ALWAYS_PASS' | 'SCRIPT';
    pattern?: string;
    matchType?: 'CONTAINS' | 'REGEX';
    valScript?: string;
    transformScript?: string;
    params?: Record<string, any>;
    // Fix: Use any instead of NodeJS.Timeout to avoid namespace errors in browser environments
    timer: any;
    cmdName: string;
    resolve?: () => void;
    reject?: (err: Error) => void;
}

const App: React.FC = () => {
  // Store
  const { 
      // State
      themeMode, themeColor, presets, commands, sequences, contexts, toasts,
      sessions, activeSessionId,
      // Actions
      setConfig, setNetworkConfig, setPresets, setCommands, setSequences, setContexts,
      addCommand, updateCommand, deleteCommand, addSequence, updateSequence, deleteSequence,
      setSendMode, setEncoding, setChecksum, addLog, updateLog, clearLogs, addToast, removeToast,
      setEditingCommand, setEditingPreset, setPendingParamCommand, setShowGeneratorModal,
      setActiveSequenceId, setLoadedPresetId, setIsConnected,
      addSession, removeSession, setActiveSessionId, renameSession,
      
      // New Actions
      addSystemLog, setVariable, setFramingOverride,
      
      // Modal States
      editingCommand, editingPreset, pendingParamCommand, showGeneratorModal,
      showSystemLogs, showAppSettings
  } = useStore();

  const activeSession = sessions[activeSessionId];
  const { config, networkConfig, sendMode, encoding, checksum, logs, isConnected: sessionIsConnected, connectionType } = activeSession;

  const [initialAiPrompt, setInitialAiPrompt] = useState<string | undefined>(undefined);
  const [showAI, setShowAI] = useState(false);
  const [generatorModalData, setGeneratorModalData] = useState<AIProjectResult | null>(null);
  
  // Renaming State
  const [renamingSessionId, setRenamingSessionId] = useState<string | null>(null);
  
  // Session Deletion Confirmation
  const [sessionToDelete, setSessionToDelete] = useState<string | null>(null);

  // Validation Logic Refs
  const activeValidationsRef = useRef<Map<string, ActiveValidation>>(new Map());

  // Signal State (Visual Only for now, managed per session conceptually but hook toggles)
  const [rts, setRts] = useState(false);
  const [dtr, setDtr] = useState(false);

  // --- Framing Refs ---
  // Store a SerialFramer instance per session
  const framersRef = useRef<Map<string, SerialFramer>>(new Map());
  
  // Timer for framing override expiration safety
  // Fix: Use any instead of NodeJS.Timeout to avoid namespace errors in browser environments
  const overrideTimerRef = useRef<any | null>(null);

  const processFrame = (data: Uint8Array, timestamp: number, sessionId: string) => {
      // Add Log (Console) - Use the actual frame timestamp
      const logId = addLog(data, 'RX', undefined, sessionId);
      
      // Validate
      checkValidation(data, sessionId, logId);
      
      // System Log (Operation History)
      let preview = '';
      try {
          const text = new TextDecoder().decode(data);
          preview = text.replace(/[^\x20-\x7E]/g, '.'); 
      } catch (e) {
          preview = '...';
      }
      const displayPreview = preview.length > 50 ? preview.substring(0, 50) + '...' : preview;
      const hexPreview = Array.from(data).slice(0, 10).map(b => b.toString(16).padStart(2, '0').toUpperCase()).join(' ') + (data.length > 10 ? '...' : '');

      addSystemLog('INFO', 'COMMAND', `RX Frame ${data.length}B: ${displayPreview}`, {
          sessionId,
          hex: hexPreview,
          data: Array.from(data),
          timestamp
      });

      // --- Override Auto-Revert Logic ---
      const currentSessionState = useStore.getState().sessions[sessionId];
      if (currentSessionState && currentSessionState.framingOverride) {
          // Clear override in Store
          setFramingOverride(undefined);
          
          // Clear safety timer
          if (overrideTimerRef.current) {
              clearTimeout(overrideTimerRef.current);
              overrideTimerRef.current = null;
          }

          // Update Framer immediately to Global Config
          const framer = framersRef.current.get(sessionId);
          if (framer) {
              const globalConfig = currentSessionState.config.framing || { strategy: 'NONE', delimiter: '', timeout: 50, prefixLengthSize: 1, byteOrder: 'LE' };
              framer.setConfig(globalConfig);
          }
      }
  };

  const handleDataReceived = (chunk: Uint8Array, sessionId: string) => {
      let framer = framersRef.current.get(sessionId);
      
      const session = useStore.getState().sessions[sessionId];
      if (!session) return;

      const effectiveConfig = session.framingOverride || session.config.framing || { 
        strategy: 'NONE',
        delimiter: '',
        timeout: 50,
        prefixLengthSize: 1,
        byteOrder: 'LE'
      };

      if (!framer) {
          // Initialize Framer
          framer = new SerialFramer(
              effectiveConfig, 
              // Fix: Callback receives frames array, iterate to process individual frames
              (frames) => frames.forEach(f => processFrame(f.data, f.timestamp, sessionId))
          );
          framersRef.current.set(sessionId, framer);
      } else {
          // Always ensure config is up to date
          framer.setConfig(effectiveConfig);
      }

      // Push with current timestamp
      framer.push(chunk, Date.now());
  };

  // Connection Hook
  const { 
      connect, disconnect, write, toggleSignal, isWebSerialSupported 
  } = useSerialConnection(
      handleDataReceived,
      (sessionId) => { // onDisconnect
          const currentActive = useStore.getState().activeSessionId;
          if (sessionId === currentActive) {
              setIsConnected(false);
              setActiveSequenceId(null);
          }
          addSystemLog('WARN', 'CONNECTION', `Session ${sessionId} disconnected unexpectedly.`);
          
          // Cleanup Framer
          const framer = framersRef.current.get(sessionId);
          if (framer) {
              framer.reset();
              framersRef.current.delete(sessionId);
          }
          
          // Clear any override
          setFramingOverride(undefined);
      }
  );

  // --- Validation Logic ---
  const checkValidation = (data: Uint8Array, sessionId: string, logId?: string) => {
      let textData = '';
      try { textData = new TextDecoder().decode(data); } catch(e) {}

      activeValidationsRef.current.forEach((val, key) => {
          // Only check validations for this session
          if (val.sessionId !== sessionId) return;

          let passed = false;

          if (val.mode === 'ALWAYS_PASS') {
              // Implicit validation for scripts - passes on any data received
              passed = true;
          } else if (val.mode === 'PATTERN' && val.pattern) {
              if (val.matchType === 'CONTAINS') {
                  if (textData.includes(val.pattern)) passed = true;
              } else if (val.matchType === 'REGEX') {
                  try {
                      const regex = new RegExp(val.pattern);
                      if (regex.test(textData)) passed = true;
                  } catch (e) {
                      console.error(`[Validation] Regex Error for ${val.cmdName}:`, e);
                  }
              }
          } else if (val.mode === 'SCRIPT' && val.valScript) {
              try {
                  const result = executeUserScript(val.valScript, { data: textData, raw: data });
                  if (result === true) passed = true;
              } catch (err) {
                  console.error(`[Validation] Script Error for ${val.cmdName}:`, err);
              }
          }

          if (passed) {
              // console.log(`[Validation] Match found for command "${val.cmdName}" in Session ${sessionId}.`);
              clearTimeout(val.timer);
              activeValidationsRef.current.delete(key);
              
              if (!val.resolve) {
                  addToast('success', 'Passed', `Command "${val.cmdName}" response received.`);
              }

              // Transform Script Execution with setVar support
              if (val.transformScript) {
                  try {
                       const capturedVars: Record<string, any> = {};
                       // Inject setVar for telemetry and log for debugging
                       const setVar = (name: string, value: any) => {
                           setVariable(name, value, sessionId);
                           capturedVars[name] = value;
                       };
                       const log = (msg: string) => {
                           addSystemLog('INFO', 'SCRIPT', `[${val.cmdName}] Log: ${msg}`);
                       };
                       
                       const scriptArgs = { 
                           data: textData, 
                           raw: data, 
                           setVar, 
                           log,
                           params: val.params || {} 
                       };
                       
                       const result = executeUserScript(val.transformScript, scriptArgs);
                       
                       // If logId exists and we captured vars, update the log entry
                       if (logId && Object.keys(capturedVars).length > 0) {
                           updateLog(logId, { extractedVars: capturedVars }, sessionId);
                       }
                       
                       addSystemLog('SUCCESS', 'SCRIPT', `Executed post-response script for ${val.cmdName}`, {
                           arguments: { data: textData, raw: Array.from(data), params: val.params },
                           returnValue: result === undefined ? 'undefined' : result,
                           extractedVars: capturedVars
                       });
                  } catch (err: any) {
                      addToast('error', 'Transformation Error', err.message);
                      addSystemLog('ERROR', 'SCRIPT', `Post-response script error in ${val.cmdName}: ${err.message}`, {
                          arguments: { data: textData }
                      });
                  }
              }

              if (val.resolve) val.resolve();
          }
      });
  };

  // --- Command Logic ---
  const sendData = async (data: string, cmdInfo?: SavedCommand, params: Record<string, any> = {}): Promise<void> => {
    console.group(`Command Execution: ${cmdInfo?.name || 'Manual Input'} [Session: ${activeSessionId}]`);
    
    // Check session connection state from STORE
    if (!sessionIsConnected) {
      addToast('error', 'Send Failed', 'Port not connected');
      addSystemLog('ERROR', 'COMMAND', 'Attempted to send data while disconnected.', { data });
      console.groupEnd();
      throw new Error('Port not connected');
    }
    
    // Scripting: Pre-Request
    let payloadToProcess: string | Uint8Array = data;
    let isRawBytes = false;

    if (cmdInfo?.scripting?.enabled && cmdInfo.scripting.preRequestScript) {
        try {
            // Inject logging for pre-request scripts
            const log = (msg: string) => {
                addSystemLog('INFO', 'SCRIPT', `[${cmdInfo.name} Pre-Req] Log: ${msg}`);
            };
            const scriptArgs = { payload: data, params, log };
            const result = executeUserScript(cmdInfo.scripting.preRequestScript, scriptArgs);
            
            if (typeof result === 'string') {
                payloadToProcess = result;
            } else if (result instanceof Uint8Array || Array.isArray(result)) {
                payloadToProcess = result instanceof Uint8Array ? result : new Uint8Array(result);
                isRawBytes = true;
            }
            
            addSystemLog('SUCCESS', 'SCRIPT', `Executed pre-request script for ${cmdInfo.name}`, {
                arguments: { payload: data, params },
                returnValue: result === undefined ? 'undefined' : result
            });
        } catch (e: any) {
            addToast('error', 'Script Execution Failed', e.message);
            addSystemLog('ERROR', 'SCRIPT', `Pre-request script failed for ${cmdInfo.name}`, { error: e.message, arguments: { params } });
            console.groupEnd();
            throw e;
        }
    }

    // Framing: Override or Persistence
    if (cmdInfo?.responseFraming && cmdInfo.responseFraming.strategy !== 'NONE') {
        if (cmdInfo.framingPersistence === 'PERSISTENT') {
            // Permanent Switch: Update Session Config
            setConfig(prev => ({ ...prev, framing: cmdInfo.responseFraming! }));
            addSystemLog('INFO', 'SYSTEM', `Switched Framing Strategy to ${cmdInfo.responseFraming.strategy} (Persistent)`);
            
            // Ensure any temporary override is cleared so the new global takes effect
            setFramingOverride(undefined);
            if (overrideTimerRef.current) {
                clearTimeout(overrideTimerRef.current);
                overrideTimerRef.current = null;
            }
        } else {
            // Transient (One-Shot) Override
            setFramingOverride(cmdInfo.responseFraming);
            // Safety timeout to clear override if no response comes (prevent sticking in wrong mode)
            if (overrideTimerRef.current) clearTimeout(overrideTimerRef.current);
            overrideTimerRef.current = setTimeout(() => {
                setFramingOverride(undefined);
                overrideTimerRef.current = null;
            }, 5000); // 5s safety timeout
        }
    }

    // Validation / Response Handling Promise
    // We register a listener if:
    // 1. Explicit Validation is enabled
    // 2. OR Post-Response Script is enabled (Implicit validation: wait for any data)
    let validationPromise = Promise.resolve();
    
    const isValidationEnabled = cmdInfo?.validation?.enabled;
    const isPostScriptEnabled = cmdInfo?.scripting?.enabled && !!cmdInfo.scripting.postResponseScript;

    if (isValidationEnabled || isPostScriptEnabled) {
        validationPromise = new Promise((resolve, reject) => {
            const validationKey = generateId();
            // Use timeout from validation config, or default to 2000ms if only scripting is used
            const timeout = (isValidationEnabled && cmdInfo?.validation?.timeout) ? cmdInfo.validation.timeout : 2000;
            
            const timer = setTimeout(() => {
                if (activeValidationsRef.current.has(validationKey)) {
                    activeValidationsRef.current.delete(validationKey);
                    // If strictly validating, timeout is an error. 
                    // If just scripting (implicitly waiting), maybe just log a warning? 
                    // For consistency, we reject both, but sequences can choose to ignore error.
                    reject(new Error(`Timeout waiting for response to "${cmdInfo?.name || 'Command'}"`));
                }
            }, timeout);

            // Determine mode: If validation is OFF but script is ON, use 'SCRIPT' mode (implicit validation via script)
            // If validation is ON, use its mode (PATTERN).
            let mode: ValidationMode | 'ALWAYS_PASS' | 'SCRIPT' = 'ALWAYS_PASS';
            if (isValidationEnabled) {
                mode = cmdInfo!.validation!.mode;
            } else if (isPostScriptEnabled) {
                mode = 'SCRIPT';
            }

            activeValidationsRef.current.set(validationKey, {
                sessionId: activeSessionId,
                mode: mode,
                pattern: isValidationEnabled ? cmdInfo!.validation!.pattern : undefined,
                matchType: isValidationEnabled ? cmdInfo!.validation!.matchType : undefined,
                // Fix: 'valScript' is derived from postResponseScript when mode is SCRIPT. 
                // 'validation.script' does not exist on CommandValidation type.
                valScript: (mode === 'SCRIPT') ? cmdInfo!.scripting!.postResponseScript : undefined,
                transformScript: isPostScriptEnabled ? cmdInfo!.scripting!.postResponseScript : undefined,
                params, // Store request params to pass to post-response script
                timer,
                cmdName: cmdInfo?.name || 'Command',
                resolve: () => resolve(),
                reject
            });
        });
    }

    try {
      let dataBytes: Uint8Array;
      
      if (isRawBytes && payloadToProcess instanceof Uint8Array) {
          dataBytes = payloadToProcess;
      } else {
          const textPayload = payloadToProcess as string;
          const currentSendMode = cmdInfo ? cmdInfo.mode : sendMode;
          const currentEncoding = cmdInfo?.encoding || encoding;

          if (currentSendMode === 'HEX') {
            const cleanHex = textPayload.replace(/[^0-9A-Fa-f]/g, '');
            if (cleanHex.length % 2 !== 0) throw new Error('Invalid Hex String (Odd length)');
            const bytes = new Uint8Array(cleanHex.length / 2);
            for (let i = 0; i < bytes.length; i++) {
              bytes[i] = parseInt(cleanHex.substr(i * 2, 2), 16);
            }
            dataBytes = bytes;
          } else if (currentSendMode === 'BINARY') {
            const cleanBin = textPayload.replace(/[^01]/g, '');
            if (cleanBin.length % 8 !== 0) throw new Error('Invalid Binary String');
            const bytes = new Uint8Array(cleanBin.length / 8);
            for (let i = 0; i < bytes.length; i++) {
               bytes[i] = parseInt(cleanBin.substr(i * 8, 8), 2);
            }
            dataBytes = bytes;
          } else {
            dataBytes = encodeText(textPayload, currentEncoding);
          }
      }

      if (checksum !== 'NONE') {
         const chk = calculateChecksum(dataBytes, checksum);
         const newData = new Uint8Array(dataBytes.length + chk.length);
         newData.set(dataBytes);
         newData.set(chk, dataBytes.length);
         dataBytes = newData;
      }

      await write(activeSessionId, dataBytes);
      // Pass command parameters to log
      addLog(dataBytes, 'TX', cmdInfo?.contextId, activeSessionId, params);
      
      // System Log
      const displayPayload = typeof payloadToProcess === 'string' && payloadToProcess.length > 50 
        ? payloadToProcess.substring(0, 50) + '...' 
        : (isRawBytes ? '[Binary Data]' : payloadToProcess);
      
      addSystemLog('INFO', 'COMMAND', `Sent: ${cmdInfo?.name || 'Manual Data'}`, { 
          mode: cmdInfo?.mode || sendMode, 
          payload: displayPayload,
          length: dataBytes.length,
          params 
      });

      console.groupEnd();
      return validationPromise;

    } catch (e: any) {
      console.error('Transmission Error:', e);
      addToast('error', 'Error', 'Send failed: ' + e.message);
      addSystemLog('ERROR', 'COMMAND', `Send failed: ${e.message}`, { error: e });
      console.groupEnd();
      throw e;
    }
  };

  const handleSendCommandRequest = (cmd: SavedCommand) => {
      if (cmd.parameters && cmd.parameters.length > 0) {
          setPendingParamCommand(cmd);
      } else {
          let finalData = cmd.payload;
          if (cmd.mode === 'TEXT') {
               switch (config.lineEnding) {
                  case 'LF': finalData += '\n'; break;
                  case 'CR': finalData += '\r'; break;
                  case 'CRLF': finalData += '\r\n'; break;
               }
          }
          if(cmd.mode !== sendMode) setSendMode(cmd.mode);
          if(cmd.encoding && cmd.encoding !== encoding) setEncoding(cmd.encoding);
          sendData(finalData, cmd).catch(() => {});
      }
  };

  const handleRunSequence = async (seq: SerialSequence) => {
      if (!sessionIsConnected) {
          addToast('error', 'Cannot Run Sequence', 'Not connected to a port.');
          return;
      }
      setActiveSequenceId(seq.id);
      addToast('info', 'Sequence Started', `Running "${seq.name}"...`);
      addSystemLog('INFO', 'COMMAND', `Started Sequence: ${seq.name}`);

      for (let i = 0; i < seq.steps.length; i++) {
          const step = seq.steps[i];
          const cmd = commands.find(c => c.id === step.commandId);
          if (!cmd) continue;
          if (cmd.parameters && cmd.parameters.length > 0) {
              addToast('warning', 'Sequence Warning', `Step ${i + 1} has parameters. Using defaults.`);
          }
          try {
              let finalData = cmd.payload;
              if (cmd.mode === 'TEXT') {
                   switch (config.lineEnding) {
                      case 'LF': finalData += '\n'; break;
                      case 'CR': finalData += '\r'; break;
                      case 'CRLF': finalData += '\r\n'; break;
                   }
              }
              await sendData(finalData, cmd);
              if (step.delay > 0) await new Promise(r => setTimeout(r, step.delay));
          } catch (e: any) {
              addToast('error', 'Sequence Step Failed', `Step ${i + 1} (${cmd.name}): ${e.message}`);
              addSystemLog('ERROR', 'COMMAND', `Sequence ${seq.name} failed at step ${i+1}`, { error: e.message });
              if (step.stopOnError) {
                  setActiveSequenceId(null);
                  return;
              }
          }
      }
      setActiveSequenceId(null);
      addToast('success', 'Sequence Complete', `"${seq.name}" finished.`);
      addSystemLog('SUCCESS', 'COMMAND', `Sequence ${seq.name} completed.`);
  };

  // --- AI Handlers ---
  const handleOpenAIAssistant = async () => {
    setInitialAiPrompt(undefined);
    setShowAI(true);
  };

  const handleAIImport = (result: AIProjectResult) => {
      let newContextId: string | undefined;
      const timestamp = Date.now();
      if (result.sourceText) {
          const ctxId = generateId();
          setContexts(prev => [...prev, {
              id: ctxId, title: `Imported Config ${new Date().toLocaleTimeString()}`, content: result.sourceText || '', source: 'AI_GENERATED', createdAt: timestamp
          }]);
          newContextId = ctxId;
          addToast('success', 'Context Created', 'Source manual/text saved as context.');
      }
      if (result.config && Object.keys(result.config).length > 0) {
          setConfig(prev => ({ ...prev, ...result.config }));
          addToast('success', 'Config Updated', 'Serial settings updated from AI suggestion.');
      }
      const commandNameMap = new Map<string, string>();
      const deviceGroupName = result.deviceName || 'Imported Device';
      
      const newCommandsForState: SavedCommand[] = result.commands.map(c => {
          const id = generateId();
          commandNameMap.set(c.name, id);
          return {
              ...c, id, group: deviceGroupName, encoding: c.encoding || 'UTF-8', creator: 'AI Assistant', createdAt: timestamp, updatedAt: timestamp, usedBy: [], contextId: newContextId
          };
      });
      setCommands(prev => [...prev, ...newCommandsForState]);
      addToast('success', 'Imported', `Added ${newCommandsForState.length} commands.`);
      addSystemLog('INFO', 'SYSTEM', `Imported project from AI: ${result.deviceName}`);

      result.sequences.forEach(seq => {
          const steps = (seq.steps || []).map(s => {
              const cmdId = commandNameMap.get(s.commandName);
              if (!cmdId) return null;
              return { id: generateId(), commandId: cmdId, delay: s.delay, stopOnError: s.stopOnError };
          }).filter(s => s !== null) as SequenceStep[];

          if (steps.length > 0) {
              addSequence({ name: seq.name, description: seq.description, steps: steps, creator: 'AI Assistant', createdAt: timestamp, updatedAt: timestamp });
          }
      });
      setShowGeneratorModal(false);
      setGeneratorModalData(null);
  };

  // --- Effects for Theme ---
  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove('dark');
    root.setAttribute('data-theme', themeColor);
    let isDark = themeMode === 'dark';
    if (themeMode === 'system') isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    if (isDark) root.classList.add('dark');
  }, [themeMode, themeColor]);

  if (!isWebSerialSupported) {
    return (
      <div className="h-full flex items-center justify-center bg-background text-foreground p-4">
        <div className="max-w-md text-center">
          <Activity className="w-16 h-16 text-destructive mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-2">Web Serial Not Supported</h1>
          <p className="text-muted-foreground">Please use Google Chrome, Edge, or Opera.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen w-full bg-background text-foreground font-sans overflow-hidden">
      <Sidebar 
        onSendCommand={handleSendCommandRequest}
        onNewCommand={() => { /* Handled in Sidebar internal logic now */ }}
        onRunSequence={handleRunSequence}
      />

      <div className="flex-1 flex flex-col min-w-0 bg-background relative">
        {/* Session Tabs */}
        <div className="flex items-center bg-muted/40 border-b border-border pl-2 pr-2 h-9 flex-shrink-0">
            <div className="flex items-end gap-1 h-full w-full overflow-x-auto overflow-y-hidden [scrollbar-width:thin] [&::-webkit-scrollbar]:h-1.5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-muted-foreground/20 hover:[&::-webkit-scrollbar-thumb]:bg-muted-foreground/40">
                {Object.values(sessions).map((session: Session) => (
                    <div 
                        key={session.id}
                        className={cn(
                            "group flex items-center gap-2 px-3 py-1.5 rounded-t-md text-xs font-medium border-t border-x cursor-pointer select-none transition-all max-w-[150px] shrink-0",
                            activeSessionId === session.id 
                                ? "bg-background border-border text-foreground -mb-px z-10 shadow-sm" 
                                : "bg-muted/30 border-transparent text-muted-foreground hover:bg-muted hover:text-foreground"
                        )}
                        onClick={() => setActiveSessionId(session.id)}
                        onDoubleClick={() => setRenamingSessionId(session.id)}
                    >
                        {session.connectionType === 'SERIAL' ? <Usb className="w-3 h-3 opacity-70" /> : <Wifi className="w-3 h-3 opacity-70" />}
                        <span className="truncate">{session.name}</span>
                        {Object.keys(sessions).length > 1 && (
                            <div 
                                role="button"
                                onClick={(e) => { e.stopPropagation(); setSessionToDelete(session.id); }}
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
        </div>

        <ControlPanel 
            onConnect={async (port) => {
                try {
                    await connect(activeSessionId, config, networkConfig, port);
                    setIsConnected(true);
                    addToast('success', 'Connected', `Session "${activeSession.name}" is now online.`);
                    const connectionInfo = connectionType === 'SERIAL' 
                        ? `${config.baudRate} ${config.dataBits}${config.parity.charAt(0).toUpperCase()}${config.stopBits}` 
                        : `${networkConfig.host}:${networkConfig.port}`;
                    addSystemLog('SUCCESS', 'CONNECTION', `Connected to ${activeSession.name}`, { type: connectionType, config: connectionInfo });
                } catch (e: any) {
                    console.error(e);
                    addToast('error', 'Connection Error', e.message || 'Failed to connect');
                    addSystemLog('ERROR', 'CONNECTION', `Connection failed: ${e.message}`);
                }
            }}
            onDisconnect={async () => {
                try {
                    await disconnect(activeSessionId);
                    setIsConnected(false);
                    addSystemLog('INFO', 'CONNECTION', `Disconnected from ${activeSession.name}`);
                } catch (e: any) {
                    addToast('error', 'Disconnect Error', e.message);
                }
            }}
            onOpenAIGenerator={() => { setGeneratorModalData(null); setShowGeneratorModal(true); }}
        />

        {/* Main Content Area: Console + Input on Left, Sidebar on Right */}
        <div className="flex-1 relative overflow-hidden flex flex-row">
            {/* Left Column: Console & Input */}
            <div className="flex-1 flex flex-col min-w-0 relative h-full">
                {/* Console Wrapper */}
                <div className="flex-1 relative min-h-0 flex flex-col">
                    <div className="absolute top-2 right-4 z-10 flex gap-2">
                        <Button variant="secondary" size="icon" className="h-7 w-7 bg-background/80 backdrop-blur border border-border/50 hover:bg-background shadow-sm" onClick={() => clearLogs()} title="Clear Console">
                        <Trash2 className="w-3.5 h-3.5 text-muted-foreground" />
                        </Button>
                    </div>
                    <ConsoleViewer />
                </div>
                
                {/* Input Panel sits below console, aligned with it */}
                <InputPanel 
                    onSend={(data) => { sendData(data).catch(() => {}); }}
                    rts={rts} dtr={dtr} 
                    onToggleSignal={(s) => {
                        if (s === 'rts') setRts(!rts); else setDtr(!dtr);
                        toggleSignal(activeSessionId, s);
                    }} 
                    isConnected={sessionIsConnected}
                />
            </div>
            
            {/* Right Sidebar - Sticky Height */}
            <RightSidebar />
        </div>
      </div>

      {pendingParamCommand && (
          <ParameterInputModal 
            command={pendingParamCommand}
            onSend={(values) => {
                let finalData = pendingParamCommand.payload;
                if (pendingParamCommand.mode === 'TEXT') { switch (config.lineEnding) { case 'LF': finalData += '\n'; break; case 'CR': finalData += '\r'; break; case 'CRLF': finalData += '\r\n'; break; } }
                if(pendingParamCommand.mode !== sendMode) setSendMode(pendingParamCommand.mode);
                if(pendingParamCommand.encoding && pendingParamCommand.encoding !== encoding) setEncoding(pendingParamCommand.encoding);
                sendData(finalData, pendingParamCommand, values).catch(() => {});
            }}
            onClose={() => setPendingParamCommand(null)}
          />
      )}

      {editingPreset && (
          <PresetFormModal 
            initialData={editingPreset}
            currentConfig={config} currentNetworkConfig={networkConfig} currentConnectionType={connectionType}
            onSave={(data) => { setPresets(prev => prev.map(p => p.id === data.id ? data : p)); addToast('success', 'Preset Updated', `Preset "${data.name}" saved.`); }}
            onClose={() => setEditingPreset(null)}
          />
      )}

      {showGeneratorModal && (
          <AICommandGeneratorModal 
            existingCommands={commands}
            initialResult={generatorModalData}
            onImport={handleAIImport} 
            onClose={() => { setShowGeneratorModal(false); setGeneratorModalData(null); }} 
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

      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </div>
  );
};

export default App;
