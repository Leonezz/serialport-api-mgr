import React, { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import {
  AIProjectResult,
  generateProjectFromDescription,
} from "../services/geminiService";
import {
  X,
  Sparkles,
  Check,
  AlertCircle,
  Loader2,
  ArrowRight,
  Paperclip,
  FileText,
  Settings2,
  Terminal,
  ListVideo,
  Box,
  Trash2,
  Pencil,
  AlertTriangle,
  Sliders,
  Coins,
} from "lucide-react";
import { Button } from "./ui/Button";
import { Textarea } from "./ui/Textarea";
import { Input } from "./ui/Input";
import { Label } from "./ui/Label";
import { FileInput, FileInputRef } from "./ui/FileInput";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter,
} from "./ui/Card";
import { Badge } from "./ui/Badge";
import { cn } from "../lib/utils";
import { SavedCommand } from "../types";
import CommandFormModal from "./CommandFormModal";
import { useStore } from "../lib/store";

interface Props {
  existingCommands: SavedCommand[];
  initialResult?: AIProjectResult | null;
  onImport: (result: AIProjectResult) => void;
  onClose: () => void;
}

interface Attachment {
  name: string;
  mimeType: string;
  data: string; // base64
}

const AICommandGeneratorModal: React.FC<Props> = ({
  existingCommands,
  initialResult,
  onImport,
  onClose,
}) => {
  const { sequences, contexts, setContexts } = useStore();
  const [input, setInput] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedResult, setGeneratedResult] =
    useState<AIProjectResult | null>(null);
  const [deviceName, setDeviceName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState<"input" | "preview">("input");
  const [attachment, setAttachment] = useState<Attachment | null>(null);
  const [previewTab, setPreviewTab] = useState<
    "config" | "commands" | "sequences"
  >("commands");

  // Advanced Edit State
  const [editingCommandIndex, setEditingCommandIndex] = useState<number | null>(
    null,
  );
  const [editingCommandData, setEditingCommandData] =
    useState<Partial<SavedCommand> | null>(null);

  const fileInputRef = useRef<FileInputRef>(null);

  // Initialize with passed data if available (e.g. from AI Assistant)
  useEffect(() => {
    if (initialResult) {
      setGeneratedResult(initialResult);
      setDeviceName(initialResult.deviceName || "New Device");
      setStep("preview");
      if (initialResult.commands.length > 0) setPreviewTab("commands");
      else if (initialResult.sequences.length > 0) setPreviewTab("sequences");
      else setPreviewTab("config");
    }
  }, [initialResult]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.size > 5 * 1024 * 1024) {
        setError("File is too large (max 5MB).");
        return;
      }
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        const base64 = result.split(",")[1];
        setAttachment({
          name: file.name,
          mimeType: file.type,
          data: base64,
        });
        setError(null);
      };
      reader.onerror = () => setError("Failed to read file.");
      reader.readAsDataURL(file);
    }
    fileInputRef.current?.reset();
  };

  const handleGenerate = async () => {
    if (!input.trim() && !attachment) {
      setError("Please provide a description or attach a file.");
      return;
    }

    setIsGenerating(true);
    setError(null);
    try {
      const result = await generateProjectFromDescription(
        input,
        attachment || undefined,
      );

      if (
        result.commands.length > 0 ||
        result.sequences.length > 0 ||
        Object.keys(result.config || {}).length > 0
      ) {
        setGeneratedResult(result);
        setDeviceName(result.deviceName || "New Device");
        setStep("preview");
        if (result.commands.length > 0) setPreviewTab("commands");
        else if (result.sequences.length > 0) setPreviewTab("sequences");
        else setPreviewTab("config");
      } else {
        setError(
          "AI couldn't find any relevant configuration in the provided content.",
        );
      }
    } catch (err: unknown) {
      const error = err as Error;
      setError(error.message || "Failed to generate configuration.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleImport = () => {
    if (generatedResult) {
      onImport({
        ...generatedResult,
        deviceName: deviceName.trim() || generatedResult.deviceName,
      });
    }
    onClose();
  };

  // --- CRUD Operations for Generated Result ---

  const deleteCommand = (index: number) => {
    if (!generatedResult) return;
    const newCommands = [...generatedResult.commands];
    newCommands.splice(index, 1);
    setGeneratedResult({ ...generatedResult, commands: newCommands });
  };

  const deleteSequence = (index: number) => {
    if (!generatedResult) return;
    const newSequences = [...generatedResult.sequences];
    newSequences.splice(index, 1);
    setGeneratedResult({ ...generatedResult, sequences: newSequences });
  };

  const startEditCommand = (index: number) => {
    if (!generatedResult) return;
    setEditingCommandIndex(index);
    setEditingCommandData({
      ...generatedResult.commands[index],
      id: "temp-edit",
    }); // Dummy ID for form
  };

  const checkDuplicate = (name: string) => {
    return existingCommands.some(
      (c) => c.name.toLowerCase() === name.toLowerCase(),
    );
  };

  return createPortal(
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-60 flex items-center justify-center p-4">
      <Card className="w-full max-w-4xl shadow-2xl border-border animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[90vh] relative">
        <CardHeader className="flex flex-row items-center justify-between pb-2 border-b border-border bg-muted/20">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-purple-500" />
            <CardTitle className="text-lg">AI Project Generator</CardTitle>
          </div>
          <div className="flex items-center gap-2">
            {generatedResult?.usage && step === "preview" && (
              <Badge
                variant="outline"
                className="text-[10px] font-mono gap-1 text-muted-foreground bg-background/50"
              >
                <Coins className="w-3 h-3 text-amber-500" />{" "}
                {generatedResult.usage.total} Tokens
              </Badge>
            )}
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="h-8 w-8 -mr-2"
              aria-label="Close dialog"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </CardHeader>

        <div className="flex-1 overflow-y-auto flex flex-col min-h-0">
          <CardContent className="pt-6 space-y-4 flex-1 flex flex-col min-h-0">
            {step === "input" && (
              <div className="space-y-4">
                <div className="p-4 bg-purple-500/5 border border-purple-500/20 rounded-lg text-sm text-foreground/80">
                  <p className="font-medium text-purple-400 mb-1">
                    How it works:
                  </p>
                  Paste a device manual or describe your project. The AI will
                  attempt to extract:
                  <ul className="list-disc list-inside mt-1 ml-1 opacity-80">
                    <li>Serial Port Settings (Baud rate, etc.)</li>
                    <li>Commands (AT commands, Hex codes)</li>
                    <li>Sequences (Initialization flows, etc.)</li>
                  </ul>
                </div>

                <div className="relative">
                  <Textarea
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Example: I have a SIM800L module. Baud rate is 9600. It needs AT+CPIN? to check SIM, then AT+CREG? to check network. Create a startup sequence."
                    className="min-h-50 font-mono text-xs pb-12"
                    autoFocus
                  />

                  <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between">
                    <div>
                      <FileInput
                        ref={fileInputRef}
                        accept="image/*,application/pdf,text/plain"
                        onChange={handleFileChange}
                      />
                      {!attachment ? (
                        <Button
                          variant="secondary"
                          size="sm"
                          className="h-7 text-xs gap-1.5 bg-background border border-border hover:bg-muted"
                          onClick={() => fileInputRef.current?.open()}
                        >
                          <Paperclip className="w-3.5 h-3.5" /> Attach Manual
                          (PDF/Img)
                        </Button>
                      ) : (
                        <div className="flex items-center gap-2 bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-300 px-2 py-1 rounded-md border border-purple-200 dark:border-purple-800 animate-in fade-in slide-in-from-left-2">
                          <FileText className="w-3.5 h-3.5" />
                          <span
                            className="text-xs font-medium max-w-50 truncate"
                            title={attachment.name}
                          >
                            {attachment.name}
                          </span>
                          <button
                            onClick={() => setAttachment(null)}
                            className="ml-1 p-0.5 hover:bg-purple-200 dark:hover:bg-purple-800 rounded-full transition-colors"
                            aria-label="Remove attachment"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      )}
                    </div>
                    <span className="text-[10px] text-muted-foreground">
                      {input.length} chars
                    </span>
                  </div>
                </div>

                {error && (
                  <div className="flex items-center gap-2 text-destructive text-sm bg-destructive/10 p-3 rounded-md">
                    <AlertCircle className="w-4 h-4" />
                    {error}
                  </div>
                )}
              </div>
            )}

            {step === "preview" && generatedResult && (
              <div className="flex flex-col h-full gap-4">
                {/* Device Name Input */}
                <div className="flex flex-col gap-1.5 bg-muted/20 p-3 rounded-md border border-border/50 shrink-0">
                  <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                    Device Group Name
                  </Label>
                  <div className="flex items-center gap-2">
                    <Box className="w-4 h-4 text-purple-500" />
                    <Input
                      value={deviceName}
                      onChange={(e) => setDeviceName(e.target.value)}
                      className="h-8 font-semibold"
                      placeholder="Enter device name..."
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between shrink-0">
                  <div
                    className="flex items-center gap-2 bg-muted p-1 rounded-md"
                    role="tablist"
                    aria-label="Preview sections"
                  >
                    <button
                      role="tab"
                      aria-selected={previewTab === "commands"}
                      aria-controls="commands-panel"
                      onClick={() => setPreviewTab("commands")}
                      className={cn(
                        "px-3 py-1.5 rounded-sm text-xs font-medium transition-all flex items-center gap-2",
                        previewTab === "commands"
                          ? "bg-background shadow-sm text-foreground"
                          : "text-muted-foreground hover:text-foreground",
                      )}
                    >
                      <Terminal className="w-3.5 h-3.5" />
                      Commands{" "}
                      <Badge
                        variant="secondary"
                        className="ml-1 px-1 h-4 text-[9px]"
                      >
                        {generatedResult.commands.length}
                      </Badge>
                    </button>
                    <button
                      role="tab"
                      aria-selected={previewTab === "sequences"}
                      aria-controls="sequences-panel"
                      onClick={() => setPreviewTab("sequences")}
                      className={cn(
                        "px-3 py-1.5 rounded-sm text-xs font-medium transition-all flex items-center gap-2",
                        previewTab === "sequences"
                          ? "bg-background shadow-sm text-foreground"
                          : "text-muted-foreground hover:text-foreground",
                      )}
                    >
                      <ListVideo className="w-3.5 h-3.5" />
                      Sequences{" "}
                      <Badge
                        variant="secondary"
                        className="ml-1 px-1 h-4 text-[9px]"
                      >
                        {generatedResult.sequences.length}
                      </Badge>
                    </button>
                    <button
                      role="tab"
                      aria-selected={previewTab === "config"}
                      aria-controls="config-panel"
                      onClick={() => setPreviewTab("config")}
                      className={cn(
                        "px-3 py-1.5 rounded-sm text-xs font-medium transition-all flex items-center gap-2",
                        previewTab === "config"
                          ? "bg-background shadow-sm text-foreground"
                          : "text-muted-foreground hover:text-foreground",
                      )}
                    >
                      <Settings2 className="w-3.5 h-3.5" />
                      Config
                    </button>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      if (initialResult)
                        onClose(); // If came from Assistant, just close
                      else setStep("input"); // If local generator, go back
                    }}
                    className="h-7 text-xs"
                  >
                    {initialResult ? "Cancel" : "Back to Input"}
                  </Button>
                </div>

                <div className="flex-1 overflow-y-auto border rounded-md bg-muted/10 p-4 custom-scrollbar">
                  {/* COMMANDS VIEW */}
                  {previewTab === "commands" && (
                    <div
                      role="tabpanel"
                      id="commands-panel"
                      aria-labelledby="commands-tab"
                    >
                      <div className="grid grid-cols-1 gap-3">
                        {generatedResult.commands.length === 0 ? (
                          <div className="text-center py-10 text-muted-foreground opacity-50">
                            No commands generated.
                          </div>
                        ) : (
                          generatedResult.commands.map((cmd, idx) => {
                            const isDuplicate = checkDuplicate(cmd.name);

                            return (
                              <div
                                key={idx}
                                className={cn(
                                  "p-3 rounded-md border border-border bg-card flex flex-col gap-2 shadow-sm relative group transition-all",
                                  isDuplicate &&
                                    "border-amber-500/50 bg-amber-500/5",
                                )}
                              >
                                {/* Actions */}
                                <div className="absolute right-2 top-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                                  <button
                                    onClick={() => startEditCommand(idx)}
                                    className="p-1 hover:bg-muted rounded text-muted-foreground hover:text-foreground"
                                    aria-label={`Edit command ${cmd.name}`}
                                  >
                                    <Pencil className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    onClick={() => deleteCommand(idx)}
                                    className="p-1 hover:bg-destructive/10 rounded text-muted-foreground hover:text-destructive"
                                    aria-label={`Delete command ${cmd.name}`}
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>

                                <div className="flex items-center gap-2 pr-12">
                                  <span className="font-bold text-sm truncate">
                                    {cmd.name}
                                  </span>
                                  <Badge
                                    variant="outline"
                                    className="text-[10px] h-5 opacity-50"
                                  >
                                    {cmd.group || "General"}
                                  </Badge>
                                  {isDuplicate && (
                                    <span className="text-[10px] text-amber-600 flex items-center gap-1 bg-amber-100 dark:bg-amber-900/30 px-1.5 rounded-sm">
                                      <AlertTriangle className="w-3 h-3" />{" "}
                                      Duplicate Name
                                    </span>
                                  )}
                                </div>
                                <code className="text-xs bg-muted p-1.5 rounded font-mono break-all text-muted-foreground">
                                  {cmd.payload}
                                </code>
                                <div className="flex justify-between items-center mt-1">
                                  <div className="flex items-center gap-3">
                                    {cmd.validation?.enabled && (
                                      <span className="text-[9px] flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-bold">
                                        <Check className="w-3 h-3" /> Validated
                                      </span>
                                    )}
                                    {cmd.parameters &&
                                      cmd.parameters.length > 0 && (
                                        <span className="text-[9px] flex items-center gap-1 text-blue-600 dark:text-blue-400 font-bold">
                                          <Sliders className="w-3 h-3" />{" "}
                                          {cmd.parameters.length} Params
                                        </span>
                                      )}
                                  </div>
                                  <Badge
                                    variant="secondary"
                                    className="text-[9px] h-4 ml-auto"
                                  >
                                    {cmd.mode}
                                  </Badge>
                                </div>
                              </div>
                            );
                          })
                        )}
                      </div>
                    </div>
                  )}

                  {/* SEQUENCES VIEW */}
                  {previewTab === "sequences" && (
                    <div
                      role="tabpanel"
                      id="sequences-panel"
                      aria-labelledby="sequences-tab"
                    >
                      <div className="space-y-4">
                        {generatedResult.sequences.length === 0 ? (
                          <div className="text-center py-10 text-muted-foreground opacity-50">
                            No sequences generated.
                          </div>
                        ) : (
                          generatedResult.sequences.map((seq, idx) => (
                            <div
                              key={idx}
                              className="p-3 rounded-md border border-border bg-card flex flex-col gap-2 shadow-sm relative group"
                            >
                              <div className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button
                                  onClick={() => deleteSequence(idx)}
                                  className="p-1 hover:bg-destructive/10 rounded text-muted-foreground hover:text-destructive"
                                  aria-label={`Delete sequence ${seq.name}`}
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                              <div className="flex items-center justify-between border-b pb-2 mb-1 pr-8">
                                <div className="flex items-center gap-2">
                                  <ListVideo className="w-4 h-4 text-primary" />
                                  <span className="font-bold text-sm">
                                    {seq.name}
                                  </span>
                                </div>
                                <span className="text-xs text-muted-foreground">
                                  {seq.steps.length} Steps
                                </span>
                              </div>
                              <div className="space-y-1">
                                {(seq.steps || []).map((step, sIdx) => (
                                  <div
                                    key={sIdx}
                                    className="flex items-center gap-2 text-xs p-1.5 bg-muted/30 rounded"
                                  >
                                    <span className="font-mono text-muted-foreground w-4">
                                      {sIdx + 1}.
                                    </span>
                                    <span className="font-medium flex-1">
                                      {step.commandName}
                                    </span>
                                    <span className="text-muted-foreground text-[10px]">
                                      Wait {step.delay}ms
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  )}

                  {/* CONFIG VIEW */}
                  {previewTab === "config" && (
                    <div
                      role="tabpanel"
                      id="config-panel"
                      aria-labelledby="config-tab"
                    >
                      <div className="flex flex-col gap-4">
                        {Object.keys(generatedResult.config || {}).length ===
                        0 ? (
                          <div className="text-center py-10 text-muted-foreground opacity-50">
                            No configuration changes detected.
                          </div>
                        ) : (
                          <div className="grid grid-cols-2 gap-4">
                            {Object.entries(generatedResult.config || {}).map(
                              ([key, value]) => (
                                <div
                                  key={key}
                                  className="p-3 rounded-md border border-border bg-card flex flex-col gap-1"
                                >
                                  <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">
                                    {key.replace(/([A-Z])/g, " $1").trim()}
                                  </span>
                                  <span className="text-sm font-mono font-medium">
                                    {String(value)}
                                  </span>
                                </div>
                              ),
                            )}
                          </div>
                        )}
                        <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 text-blue-800 dark:text-blue-300 rounded text-xs border border-blue-100 dark:border-blue-900">
                          Note: These settings will be applied to your current
                          active configuration upon import.
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </div>

        <CardFooter className="flex justify-end bg-muted/20 border-t border-border p-4 gap-2">
          {step === "input" ? (
            <Button
              onClick={handleGenerate}
              disabled={isGenerating || (!input.trim() && !attachment)}
              className="bg-purple-600 hover:bg-purple-700 text-white"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Analyzing...
                </>
              ) : (
                <>
                  Generate <ArrowRight className="w-4 h-4 ml-2" />
                </>
              )}
            </Button>
          ) : (
            <Button
              onClick={handleImport}
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              <Check className="w-4 h-4 mr-2" /> Import Project
            </Button>
          )}
        </CardFooter>

        {/* Modal for Editing Generated Commands */}
        {editingCommandData && (
          <CommandFormModal
            initialData={editingCommandData}
            sequences={sequences}
            contexts={contexts}
            onSave={(data) => {
              if (generatedResult && editingCommandIndex !== null) {
                const newCommands = [...generatedResult.commands];
                // Preserve the id (even if dummy) or let CommandFormModal handle it logic, but here we just need to update the object
                // CommandFormModal returns Omit<SavedCommand, 'id'>
                newCommands[editingCommandIndex] = data;
                setGeneratedResult({
                  ...generatedResult,
                  commands: newCommands,
                });
              }
              setEditingCommandIndex(null);
              setEditingCommandData(null);
            }}
            onClose={() => {
              setEditingCommandIndex(null);
              setEditingCommandData(null);
            }}
            onCreateContext={(ctx) => setContexts((prev) => [...prev, ctx])}
            onUpdateContext={(ctx) =>
              setContexts((prev) =>
                prev.map((c) => (c.id === ctx.id ? ctx : c)),
              )
            }
          />
        )}
      </Card>
    </div>,
    document.body,
  );
};

export default AICommandGeneratorModal;
