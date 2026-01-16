import React, { useState, useRef, useEffect } from "react";
import {
  Loader2,
  Bot,
  Send,
  FileText,
  ChevronRight,
  Plus,
  AlertCircle,
  Play,
  Coins,
  Paperclip,
  X,
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import { cn, generateId } from "../../lib/utils";
import {
  ChatMessage,
  SavedCommand,
  SerialSequence,
  ProjectContext,
} from "../../types";
import {
  createChatSession,
  AIProjectResult,
} from "../../services/geminiService";
import { Button } from "../ui/Button";
import { Textarea } from "../ui/Textarea";
import { Chat, Part } from "@google/genai";
import { useStore } from "../../lib/store";

const AIAssistantContent: React.FC = () => {
  const {
    commands,
    sequences,
    presets,
    activeSessionId,
    sessions,
    setAiMessages,
    addTokenUsage,
    setConfig,
    setLoadedPresetId,
  } = useStore();

  const activeSession = sessions[activeSessionId];
  const messages = activeSession.aiMessages;
  const tokenUsage = activeSession.aiTokenUsage;
  const widgets = activeSession.widgets || [];
  const isConnected = activeSession.isConnected;

  const [inputValue, setInputValue] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [attachment, setAttachment] = useState<{
    name: string;
    mimeType: string;
    data: string;
  } | null>(null);

  const chatEndRef = useRef<HTMLDivElement>(null);
  const chatSessionRef = useRef<Chat | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    try {
      chatSessionRef.current = createChatSession({
        commands,
        sequences,
        presets,
        widgets,
      });
      if (messages.length === 0) {
        setAiMessages([
          {
            id: generateId(),
            role: "model",
            text: "Hello! I'm your SerialPort expert. How can I assist with your debugging today?",
            timestamp: Date.now(),
          },
        ]);
      }
    } catch (e) {
      console.error("AI Init Error", e);
    }
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = async () => {
    if (!inputValue.trim() && !attachment) return;
    if (!chatSessionRef.current) return;

    const userMsg: ChatMessage = {
      id: generateId(),
      role: "user",
      text: inputValue,
      timestamp: Date.now(),
      attachment: attachment || undefined,
    };
    const currentMsgs = [...messages, userMsg];
    setAiMessages(currentMsgs);
    setInputValue("");
    setAttachment(null);
    setIsProcessing(true);

    try {
      const parts: Part[] = [];
      if (userMsg.text) parts.push({ text: userMsg.text });
      if (userMsg.attachment)
        parts.push({
          inlineData: {
            mimeType: userMsg.attachment.mimeType,
            data: userMsg.attachment.data,
          },
        });

      const response = await chatSessionRef.current.sendMessage({
        message: parts,
      });
      if (response.text) {
        setAiMessages([
          ...currentMsgs,
          {
            id: generateId(),
            role: "model",
            text: response.text,
            timestamp: Date.now(),
          },
        ]);
      }
    } catch (e: any) {
      setAiMessages([
        ...currentMsgs,
        {
          id: generateId(),
          role: "model",
          text: `Error: ${e.message}`,
          timestamp: Date.now(),
        },
      ]);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.size > 5 * 1024 * 1024) {
        console.warn("File is too large (max 5MB).");
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
      };
      reader.onerror = () => console.error("Failed to read file.");
      reader.readAsDataURL(file);
    }
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <div className="flex flex-col h-full overflow-hidden animate-in fade-in slide-in-from-right-4 duration-200">
      <div className="p-3 bg-muted/20 border-b border-border flex justify-between items-center shrink-0">
        <div className="flex items-center gap-2 text-purple-600 dark:text-purple-400 font-bold text-[10px] uppercase tracking-wider">
          <Bot className="w-3.5 h-3.5" /> SIDE ASSISTANT
        </div>
        <div className="text-[9px] font-mono opacity-50 flex items-center gap-1">
          <Coins className="w-3 h-3 text-amber-500" />{" "}
          {tokenUsage.total.toLocaleString()}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={cn(
              "flex flex-col max-w-[95%]",
              msg.role === "user" ? "ml-auto items-end" : "mr-auto items-start",
            )}
          >
            <div
              className={cn(
                "rounded-2xl p-3 text-xs shadow-sm border leading-relaxed",
                msg.role === "user"
                  ? "bg-primary text-primary-foreground border-primary/20 rounded-tr-none"
                  : "bg-card text-foreground border-border rounded-tl-none",
              )}
            >
              {/* Fix: Moved styling classes to a wrapper div to satisfy ReactMarkdown component constraints */}
              <div className="prose prose-xs dark:prose-invert max-w-none leading-relaxed break-words prose-pre:bg-muted/50 prose-code:text-primary">
                <ReactMarkdown>{msg.text || ""}</ReactMarkdown>
              </div>
            </div>
          </div>
        ))}
        {isProcessing && (
          <div className="text-muted-foreground text-[10px] p-2 animate-pulse flex items-center gap-2">
            <Loader2 className="w-3 h-3 animate-spin" /> Thinking...
          </div>
        )}
        <div ref={chatEndRef} />
      </div>

      <div className="p-4 bg-background border-t border-border">
        {attachment && (
          <div className="mb-2 flex items-center gap-2 text-xs bg-muted/50 p-2 rounded-lg">
            <Paperclip className="w-3 h-3 text-muted-foreground" />
            <span className="truncate flex-1">{attachment.name}</span>
            <button
              onClick={() => setAttachment(null)}
              className="text-muted-foreground hover:text-foreground"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        )}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,.pdf,.txt,.json,.csv"
          onChange={handleFileChange}
          className="hidden"
        />
        <div className="bg-muted/30 border border-border rounded-2xl flex flex-col focus-within:ring-1 focus-within:ring-primary/20 transition-all shadow-sm">
          <Textarea
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage();
              }
            }}
            placeholder="Message SerialMan..."
            className="min-h-[40px] max-h-[150px] resize-none py-2 px-3 text-xs bg-transparent border-none shadow-none focus-visible:ring-0"
          />
          <div className="flex justify-between items-center p-1.5">
            <Button
              onClick={() => fileInputRef.current?.click()}
              disabled={isProcessing}
              size="icon"
              variant="ghost"
              className="h-7 w-7 rounded-full"
            >
              <Paperclip className="w-3.5 h-3.5" />
            </Button>
            <Button
              onClick={handleSendMessage}
              disabled={(!inputValue.trim() && !attachment) || isProcessing}
              size="icon"
              className="h-7 w-7 rounded-full bg-primary text-primary-foreground"
            >
              <Send className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AIAssistantContent;
