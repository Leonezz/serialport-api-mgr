
import React, { useState, useEffect, useRef } from 'react';
import { Button } from './ui/Button';
import { Textarea } from './ui/Textarea';
import { Select } from './ui/Select';
import { Send, ArrowDownToLine, Zap, Paperclip, X } from 'lucide-react';
import { LineEnding, DataMode, ChecksumAlgorithm, TextEncoding } from '../types';
import { cn } from '../lib/utils';
import { useStore } from '../lib/store';

interface Props {
  onSend: (data: string) => void;
  rts: boolean;
  dtr: boolean;
  onToggleSignal: (signal: 'rts' | 'dtr') => void;
  isConnected: boolean;
}

const InputPanel: React.FC<Props> = ({
  onSend,
  rts,
  dtr,
  onToggleSignal,
  isConnected
}) => {
  const { 
      sessions, activeSessionId,
      setConfig, setSendMode, setEncoding, setChecksum, setInputBuffer 
  } = useStore();

  const activeSession = sessions[activeSessionId];
  const { config, sendMode, encoding, checksum, inputBuffer } = activeSession;
  
  // Custom Resize Logic
  const [textareaHeight, setTextareaHeight] = useState(80);
  const [isDragging, setIsDragging] = useState(false);
  const dragStartY = useRef(0);
  const dragStartHeight = useRef(0);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      const delta = dragStartY.current - e.clientY;
      const newHeight = Math.max(80, Math.min(window.innerHeight * 0.8, dragStartHeight.current + delta));
      setTextareaHeight(newHeight);
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      document.body.style.cursor = 'default';
      document.body.style.userSelect = 'auto';
    };

    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = 'row-resize';
      document.body.style.userSelect = 'none';
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = 'default';
      document.body.style.userSelect = 'auto';
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
    if (sendMode === 'TEXT') {
        switch (config.lineEnding) {
            case 'LF': finalData += '\n'; break;
            case 'CR': finalData += '\r'; break;
            case 'CRLF': finalData += '\r\n'; break;
        }
    }
    
    onSend(finalData);
    setInputBuffer('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const setLineEnding = (le: LineEnding) => {
      setConfig(prev => ({ ...prev, lineEnding: le }));
  };

  return (
    <div className="flex flex-col border-t border-border bg-background shadow-[0_-4px_20px_rgba(0,0,0,0.2)] z-30 relative">
        <div 
            className="group absolute top-0 left-0 right-0 h-2 -mt-1 cursor-row-resize z-50 flex items-center justify-center hover:bg-primary/5 transition-colors"
            onMouseDown={startResize}
            title="Drag to resize input area"
        >
            <div className="w-12 h-1 rounded-full bg-border/80 group-hover:bg-primary/50 transition-colors shadow-sm"></div>
        </div>

        <div className="flex items-center justify-between px-4 py-3 bg-muted/20 border-b border-border/50">
             <div className="flex items-center gap-6 overflow-x-auto no-scrollbar">
                 <div className="flex flex-col gap-1.5 flex-shrink-0">
                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider pl-0.5">Format</span>
                    <div className="flex bg-muted rounded-md p-1 h-8 items-center border border-border/50">
                        {(['TEXT', 'HEX', 'BINARY'] as DataMode[]).map((m) => (
                            <button key={m} onClick={() => setSendMode(m)} className={cn("px-3 py-0.5 text-[10px] font-bold rounded-sm transition-all h-full", sendMode === m ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground hover:bg-muted-foreground/10")}>{m}</button>
                        ))}
                    </div>
                 </div>
                 <div className="w-px h-8 bg-border/60 flex-shrink-0"></div>

                 {sendMode === 'TEXT' && (
                    <>
                     <div className="flex flex-col gap-1.5 flex-shrink-0"><span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider pl-0.5">Encoding</span><div className="w-28"><Select value={encoding} onChange={(e) => setEncoding(e.target.value as TextEncoding)} className="h-8 text-[11px] bg-background border-border focus:ring-primary/20"><option value="UTF-8">UTF-8</option><option value="ASCII">ASCII (7-bit)</option><option value="ISO-8859-1">ISO-8859-1</option></Select></div></div>
                     <div className="w-px h-8 bg-border/60 flex-shrink-0"></div>
                     <div className="flex flex-col gap-1.5 flex-shrink-0"><span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider pl-0.5">Line Ending</span><div className="w-28"><Select value={config.lineEnding} onChange={(e) => setLineEnding(e.target.value as LineEnding)} className="h-8 text-[11px] bg-background border-border focus:ring-primary/20"><option value="NONE">None</option><option value="LF">LF (\n)</option><option value="CR">CR (\r)</option><option value="CRLF">CRLF (\r\n)</option></Select></div></div>
                     <div className="w-px h-8 bg-border/60 flex-shrink-0"></div>
                    </>
                 )}

                 <div className="flex flex-col gap-1.5 flex-shrink-0"><span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider pl-0.5">Checksum</span><div className="w-28"><Select value={checksum} onChange={(e) => setChecksum(e.target.value as ChecksumAlgorithm)} className="h-8 text-[11px] bg-background border-border focus:ring-primary/20"><option value="NONE">None</option><option value="MOD256">Mod 256 (Sum)</option><option value="XOR">XOR 8-bit</option><option value="CRC16">CRC16 (Modbus)</option></Select></div></div>
                 <div className="w-px h-8 bg-border/60 flex-shrink-0"></div>

                 <div className="flex flex-col gap-1.5 flex-shrink-0">
                     <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider pl-0.5">Control Signals</span>
                     <div className="flex items-center gap-2">
                         <button onClick={() => onToggleSignal('dtr')} disabled={!isConnected} title="Data Terminal Ready" className={cn("flex items-center gap-1.5 text-[10px] font-bold px-3 h-8 rounded-md transition-all border", dtr ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/30" : "text-muted-foreground bg-background border-border hover:bg-muted hover:text-foreground")}><Zap className={cn("w-3 h-3", dtr && "fill-current")} /> DTR</button>
                         <button onClick={() => onToggleSignal('rts')} disabled={!isConnected} title="Request To Send" className={cn("flex items-center gap-1.5 text-[10px] font-bold px-3 h-8 rounded-md transition-all border", rts ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/30" : "text-muted-foreground bg-background border-border hover:bg-muted hover:text-foreground")}><ArrowDownToLine className={cn("w-3 h-3", rts && "fill-current")} /> RTS</button>
                     </div>
                 </div>
             </div>
             
             <div className="flex flex-col gap-1.5 items-end opacity-50 ml-4 hidden md:flex"><span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Buffer</span><span className="text-[10px] font-mono text-foreground">{inputBuffer.length} chars</span></div>
        </div>

        <div className="p-4 bg-background relative">
            <div className="relative w-full">
                <Textarea 
                    value={inputBuffer}
                    onChange={(e) => setInputBuffer(e.target.value)}
                    onKeyDown={handleKeyDown}
                    className="font-mono text-sm resize-none border-border bg-muted/20 focus-visible:ring-primary/30 p-3 pb-14 leading-relaxed transition-none custom-scrollbar"
                    style={{ height: `${textareaHeight}px` }}
                    placeholder={sendMode === 'TEXT' ? `Enter text...` : sendMode === 'HEX' ? `Enter Hex (e.g. AA BB 0D 0A for \\r\\n)...` : `Enter Binary (e.g. 01010101 00001101)...`}
                    spellCheck={false}
                />
                <div className="absolute bottom-2 left-2 right-2 flex justify-between items-center p-1.5 gap-2 bg-background/60 backdrop-blur-md border border-border/40 rounded-lg transition-all hover:bg-background/80 hover:shadow-sm">
                    <div className="flex items-center gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-primary/10" onClick={() => alert("File selection to be implemented.")} title="Attach File (Upcoming)"><Paperclip className="w-4 h-4" /></Button>
                        {inputBuffer.length > 0 && <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10" onClick={() => setInputBuffer('')} title="Clear Input"><X className="w-4 h-4" /></Button>}
                    </div>
                    <Button onClick={handleSend} disabled={!isConnected} className="h-8 px-4 rounded-md bg-primary hover:bg-primary/90 shadow-sm flex items-center justify-center gap-2 font-bold tracking-wide transition-all active:scale-95"><span className="text-[11px]">SEND</span><Send className="w-3.5 h-3.5" /></Button>
                </div>
            </div>
        </div>
    </div>
  );
};

export default InputPanel;
