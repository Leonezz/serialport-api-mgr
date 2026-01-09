
import React, { useState, useEffect } from 'react';
import { CommandParameter, SavedCommand } from '../types';
import { X, Play, RotateCcw } from 'lucide-react';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { Label } from './ui/Label';
import { Select } from './ui/Select';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from './ui/Card';

interface Props {
  command: SavedCommand;
  onSend: (values: Record<string, any>) => void;
  onClose: () => void;
}

const ParameterInputModal: React.FC<Props> = ({ command, onSend, onClose }) => {
  const [values, setValues] = useState<Record<string, any>>({});

  // Initialize defaults
  useEffect(() => {
    const initial: Record<string, any> = {};
    command.parameters?.forEach(p => {
        if (p.defaultValue !== undefined) {
            initial[p.name] = p.defaultValue;
        } else if (p.type === 'BOOLEAN') {
            initial[p.name] = false;
        } else {
            initial[p.name] = '';
        }
    });
    setValues(initial);
  }, [command]);

  const handleChange = (name: string, val: any) => {
      setValues(prev => ({ ...prev, [name]: val }));
  };

  const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      onSend(values);
      onClose();
  };

  const renderInput = (param: CommandParameter) => {
      const val = values[param.name];

      switch(param.type) {
          case 'ENUM':
              return (
                  <Select 
                    value={val} 
                    onChange={e => handleChange(param.name, e.target.value)}
                    className="w-full"
                  >
                      {param.options?.map((opt, i) => (
                          <option key={i} value={opt.value}>{opt.label || opt.value}</option>
                      ))}
                  </Select>
              );
          case 'BOOLEAN':
              return (
                  <div className="flex items-center h-10">
                      <input 
                        type="checkbox" 
                        checked={!!val} 
                        onChange={e => handleChange(param.name, e.target.checked)}
                        className="w-5 h-5 rounded border-input text-primary focus:ring-primary"
                        id={`param-${param.id}`}
                      />
                      <label htmlFor={`param-${param.id}`} className="ml-2 text-sm text-muted-foreground select-none cursor-pointer">
                          {val ? 'True / Enabled' : 'False / Disabled'}
                      </label>
                  </div>
              );
          case 'INTEGER':
              return (
                  <Input 
                    type="number"
                    value={val} 
                    onChange={e => handleChange(param.name, parseInt(e.target.value))}
                    min={param.min}
                    max={param.max}
                    step={1}
                    placeholder={`Integer ${param.min !== undefined ? `${param.min} - ${param.max}` : ''}`}
                  />
              );
          case 'FLOAT':
              return (
                  <Input 
                    type="number"
                    value={val} 
                    onChange={e => handleChange(param.name, parseFloat(e.target.value))}
                    min={param.min}
                    max={param.max}
                    step="any"
                    placeholder="Float value"
                  />
              );
          default: // STRING
              return (
                  <Input 
                    value={val} 
                    onChange={e => handleChange(param.name, e.target.value)}
                    maxLength={param.maxLength}
                    placeholder="Enter text..."
                  />
              );
      }
  };

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-2xl border-border animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
        <CardHeader className="flex flex-row items-center justify-between pb-2 border-b border-border bg-muted/20">
          <div>
              <CardTitle className="text-lg">Command Parameters</CardTitle>
              <div className="text-xs text-muted-foreground font-mono mt-1">{command.name}</div>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8 -mr-2">
            <X className="w-4 h-4" />
          </Button>
        </CardHeader>
        
        <form onSubmit={handleSubmit} className="flex-1 overflow-hidden flex flex-col">
          <CardContent className="pt-6 space-y-5 overflow-y-auto custom-scrollbar">
             {command.parameters && command.parameters.length > 0 ? (
                 command.parameters.map(param => (
                     <div key={param.id} className="space-y-1.5">
                         <div className="flex justify-between items-baseline">
                             <Label htmlFor={`param-${param.id}`} className="text-sm font-semibold">{param.label || param.name}</Label>
                             <span className="text-[10px] text-muted-foreground font-mono opacity-70">{param.name} ({param.type})</span>
                         </div>
                         {renderInput(param)}
                         {param.description && (
                             <div className="text-[10px] text-muted-foreground">{param.description}</div>
                         )}
                     </div>
                 ))
             ) : (
                 <div className="text-center text-muted-foreground py-4">No parameters defined.</div>
             )}
          </CardContent>

          <CardFooter className="flex justify-between bg-muted/20 border-t border-border p-4 gap-2">
            <Button type="button" variant="ghost" size="sm" onClick={() => setValues({})} title="Clear all">
                <RotateCcw className="w-4 h-4" />
            </Button>
            <div className="flex gap-2">
                <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
                <Button type="submit" className="gap-2">
                    <Play className="w-4 h-4" /> Send Command
                </Button>
            </div>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
};

export default ParameterInputModal;
