
import React, { useState } from 'react';
import { LogEntry } from '../../types';
import { Clock, X } from 'lucide-react';
import { cn, getBytes } from '../../lib/utils';
import HexDataView from './HexDataView';

const HexLogEntry: React.FC<{ log: LogEntry }> = ({ log }) => {
    const bytes = getBytes(log.data);
    const isTx = log.direction === 'TX';
    const [selection, setSelection] = useState<{ start: number; end: number } | null>(null);

    const time = new Date(log.timestamp).toLocaleTimeString([], { 
        hour12: false, 
        hour: '2-digit', 
        minute:'2-digit', 
        second:'2-digit', 
        fractionalSecondDigits: 3 
    } as any);

    return (
        <div className={cn(
            "mb-3 border rounded-md overflow-hidden shadow-sm transition-all w-fit max-w-full",
            isTx ? "border-primary/30 bg-primary/5 dark:bg-primary/5" : "border-border bg-card"
        )}>
            {/* Header */}
            <div className={cn(
                "flex items-center justify-between px-3 py-1.5 border-b select-none min-w-0",
                isTx ? "bg-primary/10 border-primary/20 text-primary" : "bg-muted/50 border-border/50 text-muted-foreground"
            )}>
                 <div className="flex items-center gap-3 shrink-0">
                    <span className={cn("font-bold text-[10px] px-1.5 py-0.5 rounded", isTx ? "bg-primary text-primary-foreground" : "bg-muted-foreground/20 text-foreground")}>
                        {log.direction}
                    </span>
                    <span className="opacity-70 text-[10px] flex items-center gap-1 font-mono">
                        <Clock className="w-3 h-3" /> {time}
                    </span>
                 </div>
                 
                 <div className="flex items-center gap-4 shrink-0">
                     {selection && (
                         <div className="flex items-center gap-2 animate-in fade-in slide-in-from-right-2">
                            <span className="font-mono text-[10px] bg-background/50 px-2 py-0.5 rounded border border-border/50 shadow-sm">
                                Sel: {Math.abs(selection.end - selection.start) + 1} B
                            </span>
                            <button 
                                onClick={(e) => { e.stopPropagation(); setSelection(null); }}
                                className="text-muted-foreground hover:text-foreground transition-colors p-0.5 rounded-sm hover:bg-black/5 dark:hover:bg-white/10"
                                title="Clear Selection"
                            >
                                <X className="w-3.5 h-3.5" />
                            </button>
                         </div>
                     )}
                     <div className="text-[10px] opacity-70 font-semibold font-mono">
                        {bytes.length} BYTES
                     </div>
                 </div>
            </div>

            {/* Content (Using Shared Viewer) */}
            <div className="p-3 overflow-x-auto bg-background/50 custom-scrollbar">
                <div className="min-w-fit">
                    <HexDataView 
                        data={bytes} 
                        selection={selection} 
                        setSelection={setSelection}
                        bytesPerRow={16}
                        hideBinary={true}
                        stickyHeader={false}
                        showInspector={true}
                    />
                </div>
            </div>
        </div>
    );
};

export default HexLogEntry;
