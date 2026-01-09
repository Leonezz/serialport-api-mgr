
import React, { useState, useMemo, useEffect } from 'react';
import { SavedCommand, SerialSequence, SerialPreset } from '../types';
import { Play, Trash2, Plus, Folder, ChevronDown, ChevronRight, Terminal, ListVideo, Sliders, Info, Link2, Check, Save, Coins, FileClock, Settings, Activity, MousePointer2, Edit2 } from 'lucide-react';
import { Button } from './ui/Button';
import { Badge } from './ui/Badge';
import { cn, generateId } from '../lib/utils';
import SequenceFormModal from './SequenceFormModal';
import SimpleInputModal from './SimpleInputModal';
import ConfirmationModal from './ConfirmationModal';
import { useStore } from '../lib/store';
import { useTranslation } from 'react-i18next';

interface Props {
  onSendCommand: (cmd: SavedCommand) => void;
  onNewCommand: (group?: string) => void;
  onRunSequence: (seq: SerialSequence) => void;
}

interface ConfirmationState {
    title: string;
    message: string;
    action: () => void;
}

const Sidebar: React.FC<Props> = ({
  onSendCommand,
  onNewCommand,
  onRunSequence,
}) => {
  const { t } = useTranslation();
  const { 
      sessions, activeSessionId,
      commands, sequences, presets, activeSequenceId: runningSeqId, loadedPresetId,
      selectedCommandId, setSelectedCommandId, setRightSidebarTab, setEditingCommand,
      deleteCommand, deleteCommands, addCommand,
      addSequence, updateSequence, deleteSequence,
      setLoadedPresetId, setPresets, addToast,
      setShowSystemLogs, setShowAppSettings, setShowAI
  } = useStore();

  const activeSession = sessions[activeSessionId];
  const { aiTokenUsage } = activeSession;

  const [activeTab, setActiveTab] = useState<'commands' | 'sequences' | 'presets'>('commands');
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set());
  
  // Resize State
  const [sidebarWidth, setSidebarWidth] = useState(280);
  const [isResizing, setIsResizing] = useState(false);
  
  // Modal States
  const [isSeqModalOpen, setIsSeqModalOpen] = useState(false);
  const [editingSequence, setEditingSequence] = useState<SerialSequence | undefined>(undefined);
  const [isSavePresetModalOpen, setIsSavePresetModalOpen] = useState(false);
  
  const [confirmation, setConfirmation] = useState<ConfirmationState | null>(null);

  const handleOpenSeqModal = (seq?: SerialSequence) => {
    setEditingSequence(seq);
    setIsSeqModalOpen(true);
  };

  const handleSaveSeqWrapper = (data: Omit<SerialSequence, 'id'>) => {
    if (editingSequence?.id) {
      updateSequence(editingSequence.id, data);
      addToast('success', t('toast.success'), `"${data.name}" ${t('toast.saved')}.`);
    } else {
      addSequence(data);
      addToast('success', t('toast.success'), `"${data.name}" added to library.`);
    }
  };

  const handleSaveNewPreset = (name: string) => {
    const newPreset: SerialPreset = {
      id: generateId(),
      name,
      type: activeSession.connectionType,
      config: { ...activeSession.config },
      network: activeSession.connectionType === 'NETWORK' ? { ...activeSession.networkConfig } : undefined,
      widgets: [...(activeSession.widgets || [])]
    };
    setPresets(prev => {
      const currentPresets = Array.isArray(prev) ? prev : [];
      return [...currentPresets, newPreset];
    });
    setLoadedPresetId(newPreset.id);
    addToast('success', t('toast.saved'), `Preset "${name}" created.`);
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing) return;
      let newWidth = e.clientX;
      if (newWidth < 240) newWidth = 240; 
      if (newWidth > 600) newWidth = 600;
      setSidebarWidth(newWidth);
    };
    const handleMouseUp = () => setIsResizing(false);
    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing]);

  const groupedCommands = useMemo(() => {
    const groups: Record<string, SavedCommand[]> = { 'Ungrouped': [] };
    commands.forEach(cmd => {
        const key = cmd.group || 'Ungrouped';
        if (!groups[key]) groups[key] = [];
        groups[key].push(cmd);
    });
    const keys = Object.keys(groups).filter(k => k !== 'Ungrouped').sort();
    if (groups['Ungrouped'].length > 0) keys.push('Ungrouped');
    return keys.map(key => ({ name: key, items: groups[key] }));
  }, [commands]);

  const toggleGroup = (groupName: string) => {
      const next = new Set(collapsedGroups);
      if (next.has(groupName)) next.delete(groupName);
      else next.add(groupName);
      setCollapsedGroups(next);
  };

  const handleCommandClick = (cmd: SavedCommand) => {
      if (selectedCommandId === cmd.id) {
          // Deselect
          setSelectedCommandId(null);
          setEditingCommand(null);
      } else {
          // Select
          setSelectedCommandId(cmd.id);
          setEditingCommand({ ...cmd }); // Initialize draft
          
          const currentTab = useStore.getState().rightSidebarTab;
          if (currentTab === 'ai') {
              setRightSidebarTab('basic');
          }
          setShowAI(true); 
      }
  };

  const handleCreateNewCommand = (groupName?: string) => {
      const timestamp = Date.now();
      const newId = addCommand({
          name: t('cmd.new'),
          group: groupName,
          mode: 'TEXT',
          payload: '',
          createdAt: timestamp,
          updatedAt: timestamp,
      });
      setSelectedCommandId(newId);
      setEditingCommand({
          id: newId, name: t('cmd.new'), group: groupName, mode: 'TEXT', payload: '', createdAt: timestamp, updatedAt: timestamp
      });
      
      setRightSidebarTab('basic');
      setShowAI(true);
  };

  return (
    <div 
        className="flex flex-col bg-card border-r border-border h-full relative z-40 shadow-xl flex-shrink-0 transition-[width] ease-out duration-75"
        style={{ width: sidebarWidth }}
    >
      <div className="flex items-center p-2 border-b border-border gap-1 shrink-0">
        <button onClick={() => setActiveTab('commands')} className={cn("flex-1 flex items-center justify-center gap-1.5 text-[10px] font-bold py-2 rounded-md transition-all uppercase tracking-wide border", activeTab === 'commands' ? "bg-primary/10 text-primary border-primary/20" : "border-transparent text-muted-foreground hover:text-foreground hover:bg-muted")} title={t('sidebar.commands')}><Terminal className="w-3.5 h-3.5" /> {t('sidebar.commands')}</button>
        <button onClick={() => setActiveTab('sequences')} className={cn("flex-1 flex items-center justify-center gap-1.5 text-[10px] font-bold py-2 rounded-md transition-all uppercase tracking-wide border", activeTab === 'sequences' ? "bg-primary/10 text-primary border-primary/20" : "border-transparent text-muted-foreground hover:text-foreground hover:bg-muted")} title={t('sidebar.sequences')}><ListVideo className="w-3.5 h-3.5" /> {t('sidebar.sequences')}</button>
        <button onClick={() => setActiveTab('presets')} className={cn("flex-1 flex items-center justify-center gap-1.5 text-[10px] font-bold py-2 rounded-md transition-all uppercase tracking-wide border", activeTab === 'presets' ? "bg-primary/10 text-primary border-primary/20" : "border-transparent text-muted-foreground hover:text-foreground hover:bg-muted")} title={t('sidebar.presets')}><Sliders className="w-3.5 h-3.5" /> {t('sidebar.presets')}</button>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-2 custom-scrollbar">
        {activeTab === 'commands' && (
          <div className="flex flex-col gap-2">
             <div className="flex items-center justify-between pb-2 sticky top-0 bg-card z-10">
                <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">{t('sidebar.library')}</span>
                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => handleCreateNewCommand()} title={t('sidebar.new_command')}>
                    <Plus className="w-4 h-4" />
                </Button>
             </div>
             
             {commands.length === 0 && <div className="text-center py-8 text-muted-foreground text-xs italic whitespace-pre-wrap">{t('sidebar.no_commands')}</div>}

             {groupedCommands.map(group => {
                 if (group.items.length === 0) return null;
                 const isCollapsed = collapsedGroups.has(group.name);
                 return (
                    <div key={group.name} className="flex flex-col gap-1">
                        {group.name !== 'Ungrouped' && (
                            <div className="flex items-center justify-between group/header pr-1">
                                <button onClick={() => toggleGroup(group.name)} className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground py-1 px-1 transition-colors select-none flex-1 text-left">
                                    {isCollapsed ? <ChevronRight className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                                    <Folder className="w-3 h-3 fill-current opacity-50" /> {group.name}
                                </button>
                                <div className="flex gap-0.5 opacity-0 group-hover/header:opacity-100 transition-opacity">
                                    <button onClick={(e) => { e.stopPropagation(); handleCreateNewCommand(group.name); }} className="p-1 hover:bg-muted rounded text-muted-foreground hover:text-primary transition-all"><Plus className="w-3 h-3" /></button>
                                    <button onClick={(e) => { e.stopPropagation(); setConfirmation({ title: t('modal.delete'), message: `Delete "${group.name}" and all its commands?`, action: () => deleteCommands(group.items.map(i => i.id)) }); }} className="p-1 hover:bg-destructive/10 rounded text-muted-foreground hover:text-destructive transition-all"><Trash2 className="w-3 h-3" /></button>
                                </div>
                            </div>
                        )}
                        {(!isCollapsed || group.name === 'Ungrouped') && (
                            <div className={cn("flex flex-col gap-1.5", group.name !== 'Ungrouped' && "pl-2 border-l border-border/40 ml-1.5")}>
                                {group.items.map(cmd => {
                                    const isSelected = selectedCommandId === cmd.id;
                                    return (
                                        <div 
                                            key={cmd.id} 
                                            onClick={() => handleCommandClick(cmd)}
                                            className={cn(
                                                "group flex flex-col gap-1 p-2 rounded-md border transition-all relative cursor-pointer",
                                                isSelected 
                                                    ? "border-primary/50 bg-primary/5 ring-1 ring-primary/20 shadow-sm" 
                                                    : "border-border/50 bg-muted/20 hover:bg-muted/50 hover:border-border"
                                            )}
                                        >
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-1.5 overflow-hidden">
                                                    <span className={cn("font-medium text-sm truncate", isSelected && "text-primary")}>{cmd.name}</span>
                                                    {cmd.usedBy?.length ? <span className="text-[9px] opacity-50"><Link2 className="w-2.5 h-2.5" /></span> : null}
                                                </div>
                                                <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                                                    <button onClick={(e) => { e.stopPropagation(); onSendCommand(cmd); }} className="p-1 text-primary hover:text-primary/80"><Play className="w-3 h-3 fill-current" /></button>
                                                    <button onClick={(e) => { e.stopPropagation(); setConfirmation({ title: t('modal.delete'), message: `Delete command "${cmd.name}"?`, action: () => deleteCommand(cmd.id) }); }} className="p-1 text-muted-foreground hover:text-destructive"><Trash2 className="w-3 h-3" /></button>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Badge variant="outline" className="text-[8px] h-3.5 px-1 py-0 border-border/60 text-muted-foreground uppercase">{cmd.mode}</Badge>
                                                <code className="text-[10px] text-muted-foreground truncate font-mono flex-1 opacity-70">{(cmd.payload || '').replace(/\r/g, 'CR').replace(/\n/g, 'LF')}</code>
                                            </div>
                                            {isSelected && <div className="absolute left-[-1px] top-2 bottom-2 w-1 bg-primary rounded-full" />}
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                 );
             })}
          </div>
        )}

        {activeTab === 'sequences' && (
             <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between pb-2 sticky top-0 bg-card z-10">
                    <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">{t('sidebar.sequences')}</span>
                    <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => handleOpenSeqModal()} title="Create Sequence"><Plus className="w-4 h-4" /></Button>
                </div>
                {sequences.map(seq => (
                    <div key={seq.id} className={cn("group flex flex-col gap-1 p-2 rounded-md border border-border/50 bg-muted/20 hover:bg-muted/50 hover:border-border transition-all relative")}>
                        <div className="flex items-center justify-between">
                            <span className="font-medium text-sm truncate">{seq.name}</span>
                            <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button onClick={() => onRunSequence(seq)} className="p-1 text-primary"><Play className="w-3 h-3 fill-current" /></button>
                                <button onClick={() => handleOpenSeqModal(seq)} className="p-1 text-muted-foreground"><Edit2 className="w-3 h-3" /></button>
                            </div>
                        </div>
                    </div>
                ))}
             </div>
        )}

        {activeTab === 'presets' && (
            <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between pb-2 sticky top-0 bg-card z-10">
                    <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">{t('sidebar.presets')}</span>
                    <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setIsSavePresetModalOpen(true)} title="Save current config as preset"><Plus className="w-4 h-4" /></Button>
                </div>
                {presets.map(preset => {
                    const isActive = loadedPresetId === preset.id;
                    return (
                        <div key={preset.id} className={cn("group flex items-center justify-between p-2 rounded-md border transition-all cursor-pointer", isActive ? "bg-primary/5 border-primary" : "border-border/50 bg-muted/20 hover:bg-muted/50 hover:border-border")} onClick={() => setLoadedPresetId(preset.id)}>
                            <span className="font-medium text-sm truncate">{preset.name}</span>
                        </div>
                    );
                })}
            </div>
        )}
      </div>

      <div className="border-t border-border bg-muted/10 shrink-0">
          <div className="flex items-center justify-between p-2">
               <div className="flex items-center gap-1">
                  <Button variant="ghost" size="icon" onClick={() => setShowSystemLogs(true)} className="h-8 w-8 text-muted-foreground hover:text-foreground" title={t('sidebar.logs')}><FileClock className="w-4 h-4" /></Button>
                  <Button variant="ghost" size="icon" onClick={() => setShowAppSettings(true)} className="h-8 w-8 text-muted-foreground hover:text-foreground" title={t('sidebar.settings')}><Settings className="w-4 h-4" /></Button>
               </div>
               {aiTokenUsage.total > 0 && <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground"><Coins className="w-3 h-3 text-amber-500" /><span className="font-mono">{aiTokenUsage.total.toLocaleString()}</span></div>}
          </div>
      </div>

      <div className="absolute right-0 top-0 bottom-0 w-1.5 cursor-ew-resize hover:bg-primary/20 active:bg-primary/40 transition-colors z-50" onMouseDown={(e) => { e.preventDefault(); setIsResizing(true); }} />

      {isSeqModalOpen && <SequenceFormModal initialData={editingSequence || {}} availableCommands={commands} onSave={handleSaveSeqWrapper} onClose={() => { setIsSeqModalOpen(false); setEditingSequence(undefined); }} />}
      {isSavePresetModalOpen && <SimpleInputModal title={t('cp.save_as')} placeholder="Enter preset name..." onSave={(name) => { handleSaveNewPreset(name); setIsSavePresetModalOpen(false); }} onClose={() => setIsSavePresetModalOpen(false)} />}
      {confirmation && <ConfirmationModal title={confirmation.title} message={confirmation.message} confirmLabel={t('modal.delete')} isDestructive onConfirm={() => { confirmation.action(); setConfirmation(null); }} onCancel={() => setConfirmation(null)} />}
    </div>
  );
};

export default Sidebar;
