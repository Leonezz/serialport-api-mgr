import React, { useState, useEffect, useRef } from "react";
import {
  Button,
  DropdownOption,
  HexInput,
  SelectDropdown,
  Textarea,
} from "./ui";
import { Send, ArrowDownToLine, Zap, Paperclip, X, Save } from "lucide-react";
import QuickSaveCommandModal from "./QuickSaveCommandModal";
import {
  LineEnding,
  DataMode,
  ChecksumAlgorithm,
  TextEncoding,
} from "../types";
import { cn } from "../lib/utils";
import { appendLineEnding } from "../lib/utils/dataUtils";
import { useStore } from "../lib/store";
import { useShallow } from "zustand/react/shallow";

interface Props {
  onSend: (data: string) => void;
  rts: boolean;
  dtr: boolean;
  onToggleSignal: (signal: "rts" | "dtr") => void;
  isConnected: boolean;
}

const InputPanel: React.FC<Props> = ({
  onSend,
  rts,
  dtr,
  onToggleSignal,
  isConnected,
}) => {
  const { config, sendMode, encoding, checksum, inputBuffer } = useStore(
    useShallow((state) => {
      const session = state.sessions[state.activeSessionId];
      return {
        config: session?.config,
        sendMode: session?.sendMode,
        encoding: session?.encoding,
        checksum: session?.checksum,
        inputBuffer: session?.inputBuffer ?? "",
      };
    }),
  );

  const { setConfig, setSendMode, setEncoding, setChecksum, setInputBuffer } =
    useStore(
      useShallow((state) => ({
        setConfig: state.setConfig,
        setSendMode: state.setSendMode,
        setEncoding: state.setEncoding,
        setChecksum: state.setChecksum,
        setInputBuffer: state.setInputBuffer,
      })),
    );

  // Custom Resize Logic
  const [textareaHeight, setTextareaHeight] = useState(80);
  const [isDragging, setIsDragging] = useState(false);
  const dragStartY = useRef(0);
  const dragStartHeight = useRef(0);

  // Quick save modal
  const [showQuickSaveModal, setShowQuickSaveModal] = useState(false);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      const delta = dragStartY.current - e.clientY;
      const newHeight = Math.max(
        80,
        Math.min(window.innerHeight * 0.8, dragStartHeight.current + delta),
      );
      setTextareaHeight(newHeight);
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      document.body.style.cursor = "default";
      document.body.style.userSelect = "auto";
    };

    if (isDragging) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "row-resize";
      document.body.style.userSelect = "none";
    }

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "default";
      document.body.style.userSelect = "auto";
    };
  }, [isDragging]);

  const startResize = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    dragStartY.current = e.clientY;
    dragStartHeight.current = textareaHeight;
  };

  const handleSend = () => {
    let finalData = inputBuffer;

    // For TEXT, we append line endings here.
    if (sendMode === "TEXT") {
      finalData = appendLineEnding(finalData, config.lineEnding);
    }

    onSend(finalData);
    setInputBuffer("");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const setLineEnding = (le: LineEnding) => {
    setConfig((prev) => ({ ...prev, lineEnding: le }));
  };

  return (
    <div className="flex flex-col border-t border-border bg-card/50 backdrop-blur-sm shadow-[0_-2px_12px_rgba(0,0,0,0.08)] dark:shadow-[0_-2px_12px_rgba(0,0,0,0.3)] z-30 relative">
      <div
        className="group absolute top-0 left-0 right-0 h-2 -mt-1 cursor-row-resize z-50 flex items-center justify-center hover:bg-primary/10 transition-colors"
        onMouseDown={startResize}
        title="Drag to resize input area"
      >
        <div className="w-16 h-1 rounded-full bg-border group-hover:bg-primary/50 transition-colors shadow-sm"></div>
      </div>

      <div className="flex items-center justify-between px-4 py-2.5 bg-muted/10 border-b border-border/50">
        <div className="flex items-center gap-4 overflow-x-auto no-scrollbar">
          <div className="flex flex-col gap-1 shrink-0">
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider pl-0.5">
              Format
            </span>
            <div className="flex bg-muted/50 rounded-lg p-0.5 h-9 items-center border border-border/50 shadow-sm">
              {(["TEXT", "HEX", "BINARY"] as DataMode[]).map((m) => (
                <button
                  key={m}
                  onClick={() => setSendMode(m)}
                  className={cn(
                    "px-3 py-0.5 text-[10px] font-bold rounded-md transition-all h-full min-w-15",
                    sendMode === m
                      ? "bg-background text-foreground shadow-md"
                      : "text-muted-foreground hover:text-foreground hover:bg-background/50",
                  )}
                >
                  {m}
                </button>
              ))}
            </div>
          </div>
          <div className="w-px h-9 bg-border/60 shrink-0"></div>

          {sendMode === "TEXT" && (
            <>
              <div className="flex flex-col gap-1 shrink-0">
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider pl-0.5">
                  Encoding
                </span>
                <div className="w-32">
                  <SelectDropdown
                    options={
                      [
                        { value: "UTF-8", label: "UTF-8" },
                        { value: "ASCII", label: "ASCII (7-bit)" },
                        { value: "ISO-8859-1", label: "ISO-8859-1" },
                      ] as DropdownOption<TextEncoding>[]
                    }
                    value={encoding}
                    onChange={(value) => setEncoding(value)}
                    size="sm"
                    menuMinWidth={140}
                  />
                </div>
              </div>
              <div className="w-px h-9 bg-border/60 shrink-0"></div>
              <div className="flex flex-col gap-1 shrink-0">
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider pl-0.5">
                  Line Ending
                </span>
                <div className="w-32">
                  <SelectDropdown
                    options={
                      [
                        { value: "NONE", label: "None" },
                        { value: "LF", label: "LF (\\n)" },
                        { value: "CR", label: "CR (\\r)" },
                        { value: "CRLF", label: "CRLF (\\r\\n)" },
                      ] as DropdownOption<LineEnding>[]
                    }
                    value={config.lineEnding}
                    onChange={(value) => setLineEnding(value)}
                    size="sm"
                    menuMinWidth={140}
                  />
                </div>
              </div>
              <div className="w-px h-9 bg-border/60 shrink-0"></div>
            </>
          )}

          <div className="flex flex-col gap-1 shrink-0">
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider pl-0.5">
              Checksum
            </span>
            <div className="w-32">
              <SelectDropdown
                options={
                  [
                    { value: "NONE", label: "None" },
                    { value: "MOD256", label: "Mod 256 (Sum)" },
                    { value: "XOR", label: "XOR 8-bit" },
                    { value: "CRC16", label: "CRC16 (Modbus)" },
                  ] as DropdownOption<ChecksumAlgorithm>[]
                }
                value={checksum}
                onChange={(value) => setChecksum(value)}
                size="sm"
                menuMinWidth={160}
              />
            </div>
          </div>
          <div className="w-px h-9 bg-border/60 shrink-0"></div>

          <div className="flex flex-col gap-1 shrink-0">
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider pl-0.5">
              Control Signals
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => onToggleSignal("dtr")}
                disabled={!isConnected}
                title="Data Terminal Ready"
                className={cn(
                  "flex items-center gap-1.5 text-[10px] font-bold px-3 h-9 rounded-md transition-all border shadow-sm",
                  dtr
                    ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/30 shadow-emerald-500/20"
                    : "text-muted-foreground bg-background/80 border-border/60 hover:bg-muted hover:text-foreground hover:border-primary/30",
                )}
              >
                <Zap className={cn("w-3 h-3", dtr && "fill-current")} /> DTR
              </button>
              <button
                onClick={() => onToggleSignal("rts")}
                disabled={!isConnected}
                title="Request To Send"
                className={cn(
                  "flex items-center gap-1.5 text-[10px] font-bold px-3 h-9 rounded-md transition-all border shadow-sm",
                  rts
                    ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/30 shadow-emerald-500/20"
                    : "text-muted-foreground bg-background/80 border-border/60 hover:bg-muted hover:text-foreground hover:border-primary/30",
                )}
              >
                <ArrowDownToLine
                  className={cn("w-3 h-3", rts && "fill-current")}
                />{" "}
                RTS
              </button>
            </div>
          </div>
        </div>

        <div className="flex-col gap-1 items-end ml-4 hidden md:flex">
          <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
            Buffer
          </span>
          <span className="text-[11px] font-mono text-foreground/80">
            {inputBuffer.length} chars
          </span>
        </div>
      </div>

      <div className="p-4 bg-background/50 relative">
        <div className="flex flex-col gap-3 w-full">
          {sendMode === "HEX" || sendMode === "BINARY" ? (
            <div style={{ minHeight: `${textareaHeight}px` }}>
              <HexInput
                mode={sendMode}
                value={inputBuffer}
                onChange={setInputBuffer}
                autoFormat
                showByteCount
                showPreview
                className="font-mono text-sm"
              />
            </div>
          ) : (
            <Textarea
              value={inputBuffer}
              onChange={(e) => setInputBuffer(e.target.value)}
              onKeyDown={handleKeyDown}
              className="font-mono text-sm resize-none border-border bg-background focus-visible:border-primary focus-visible:ring-primary/30 p-3 leading-relaxed transition-all custom-scrollbar shadow-sm"
              style={{ height: `${textareaHeight}px` }}
              placeholder="Enter text..."
              spellCheck={false}
            />
          )}
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9 text-muted-foreground hover:text-foreground hover:bg-primary/10 rounded-lg"
                onClick={() => alert("File selection to be implemented.")}
                title="Attach File (Upcoming)"
              >
                <Paperclip className="w-4 h-4" />
              </Button>
              {inputBuffer.length > 0 && (
                <>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-9 w-9 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-lg"
                    onClick={() => setShowQuickSaveModal(true)}
                    title="Save as Command"
                  >
                    <Save className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-9 w-9 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg"
                    onClick={() => setInputBuffer("")}
                    title="Clear Input"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </>
              )}
            </div>
            <Button
              onClick={handleSend}
              disabled={!isConnected}
              className="h-10 px-6 rounded-lg bg-primary hover:bg-primary/90 shadow-md hover:shadow-lg flex items-center justify-center gap-2 font-bold tracking-wide transition-all active:scale-95"
            >
              <span className="text-sm">SEND</span>
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Quick Save Command Modal */}
      {showQuickSaveModal && (
        <QuickSaveCommandModal
          payload={inputBuffer}
          mode={sendMode}
          onClose={() => setShowQuickSaveModal(false)}
        />
      )}
    </div>
  );
};

export default InputPanel;
