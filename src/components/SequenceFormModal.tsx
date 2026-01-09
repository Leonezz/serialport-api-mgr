
import React, { useState } from 'react';
import { SerialSequence, SequenceStep, SavedCommand } from '../types';
import { X, Save, Plus, Trash2, ArrowUp, ArrowDown, Clock, AlertTriangle } from 'lucide-react';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { Select } from './ui/Select';
import { Label } from './ui/Label';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from './ui/Card';
import { Textarea } from './ui/Textarea';

interface Props {
  initialData?: Partial<SerialSequence>;
  availableCommands: SavedCommand[];
  onSave: (sequence: Omit<SerialSequence, 'id'>) => void;
  onClose: () => void;
}

const SequenceFormModal: React.FC<Props> = ({ 
  initialData, 
  availableCommands,
  onSave, 
  onClose 
}) => {
  const [name, setName] = useState(initialData?.name || '');
  const [description, setDescription] = useState(initialData?.description || '');
  const [steps, setSteps] = useState<SequenceStep[]>(initialData?.steps || []);
  const [selectedCommandId, setSelectedCommandId] = useState<string>('');

  const addStep = () => {
    if (!selectedCommandId) return;
    const newStep: SequenceStep = {
        id: crypto.randomUUID(),
        commandId: selectedCommandId,
        delay: 500,
        stopOnError: true
    };
    setSteps([...steps, newStep]);
    setSelectedCommandId('');
  };

  const removeStep = (id: string) => {
      setSteps(prev => prev.filter(s => s.id !== id));
  };

  const moveStep = (index: number, direction: 'up' | 'down') => {
      if (direction === 'up' && index === 0) return;
      if (direction === 'down' && index === steps.length - 1) return;
      
      const newSteps = [...steps];
      const targetIndex = direction === 'up' ? index - 1 : index + 1;
      [newSteps[index], newSteps[targetIndex]] = [newSteps[targetIndex], newSteps[index]];
      setSteps(newSteps);
  };

  const updateStep = (id: string, updates: Partial<SequenceStep>) => {
      setSteps(prev => prev.map(s => s.id === id ? { ...s, ...updates } : s));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({ 
        name, 
        description,
        steps,
        // Metadata fields handled by parent for update/create, we just pass what we might have
        creator: initialData?.creator,
        createdAt: initialData?.createdAt || Date.now(),
        updatedAt: Date.now()
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-lg shadow-2xl border-border animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
        <CardHeader className="flex flex-row items-center justify-between pb-2 border-b border-border bg-muted/20">
          <CardTitle className="text-lg flex items-center gap-2">
            {initialData?.id ? 'Edit Sequence' : 'New Sequence'}
          </CardTitle>
          <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8 -mr-2">
            <X className="w-4 h-4" />
          </Button>
        </CardHeader>
        
        <form onSubmit={handleSubmit} className="flex-1 flex flex-col overflow-hidden">
          <CardContent className="pt-6 space-y-5 overflow-y-auto flex-1 custom-scrollbar">
            
            <div className="space-y-2">
                <Label htmlFor="seqName">Sequence Name</Label>
                <Input 
                    id="seqName" 
                    value={name} 
                    onChange={e => setName(e.target.value)} 
                    placeholder="e.g. Device Initialization" 
                    required 
                    autoFocus
                />
            </div>
            
            <div className="space-y-2">
                <Label htmlFor="seqDesc">Description (Optional)</Label>
                <Textarea 
                    id="seqDesc" 
                    value={description} 
                    onChange={e => setDescription(e.target.value)} 
                    placeholder="What does this sequence do?" 
                    className="h-20"
                />
            </div>

            <div className="space-y-3">
                <Label>Steps</Label>
                
                {/* Step List */}
                <div className="flex flex-col gap-2 min-h-[100px]">
                    {steps.length === 0 && (
                        <div className="p-4 border border-dashed rounded-md text-center text-muted-foreground text-xs">
                            No steps added yet.
                        </div>
                    )}
                    {steps.map((step, idx) => {
                        const cmd = availableCommands.find(c => c.id === step.commandId);
                        return (
                            <div key={step.id} className="flex flex-col gap-2 p-3 rounded-md border border-border bg-muted/10 animate-in fade-in slide-in-from-bottom-2">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <div className="h-5 w-5 rounded-full bg-primary/20 flex items-center justify-center text-[10px] font-bold text-primary">{idx + 1}</div>
                                        <span className="font-medium text-sm">{cmd?.name || 'Unknown Command'}</span>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <button type="button" onClick={() => moveStep(idx, 'up')} className="p-1 hover:bg-muted rounded text-muted-foreground" disabled={idx===0}><ArrowUp className="w-3 h-3" /></button>
                                        <button type="button" onClick={() => moveStep(idx, 'down')} className="p-1 hover:bg-muted rounded text-muted-foreground" disabled={idx===steps.length-1}><ArrowDown className="w-3 h-3" /></button>
                                        <button type="button" onClick={() => removeStep(step.id)} className="p-1 hover:bg-destructive/10 rounded text-muted-foreground hover:text-destructive"><Trash2 className="w-3 h-3" /></button>
                                    </div>
                                </div>
                                
                                <div className="flex items-center gap-4 text-xs">
                                    <div className="flex items-center gap-1.5 flex-1">
                                        <Clock className="w-3 h-3 text-muted-foreground" />
                                        <span className="whitespace-nowrap text-muted-foreground">Post-wait:</span>
                                        <Input 
                                            type="number" 
                                            className="h-6 w-20 text-xs px-1"
                                            value={step.delay}
                                            onChange={e => updateStep(step.id, { delay: Math.max(0, parseInt(e.target.value)) })}
                                        />
                                        <span className="text-muted-foreground">ms</span>
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                        <input 
                                            type="checkbox" 
                                            id={`stop-${step.id}`}
                                            checked={step.stopOnError}
                                            onChange={e => updateStep(step.id, { stopOnError: e.target.checked })}
                                            className="h-3.5 w-3.5 rounded border-input"
                                        />
                                        <label htmlFor={`stop-${step.id}`} className="text-muted-foreground select-none cursor-pointer">Stop on error</label>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Add Step Control */}
                <div className="flex gap-2 p-2 bg-muted/20 rounded-md border border-border/50">
                    <Select 
                        value={selectedCommandId} 
                        onChange={e => setSelectedCommandId(e.target.value)}
                        className="flex-1 text-xs h-8 bg-background"
                    >
                        <option value="">Select command to add...</option>
                        {availableCommands.map(c => (
                            <option key={c.id} value={c.id}>{c.group ? `[${c.group}] ` : ''}{c.name}</option>
                        ))}
                    </Select>
                    <Button type="button" size="sm" onClick={addStep} disabled={!selectedCommandId} className="h-8">
                        <Plus className="w-4 h-4 mr-1" /> Add
                    </Button>
                </div>

            </div>

          </CardContent>

          <CardFooter className="flex justify-end bg-muted/20 border-t border-border p-4 gap-2">
            <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
            <Button type="submit">
                <Save className="w-4 h-4 mr-2" /> Save Sequence
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
};

export default SequenceFormModal;
