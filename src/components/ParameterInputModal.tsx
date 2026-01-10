import React, { useState, useEffect } from 'react';
import { CommandParameter, SavedCommand } from '../types';
import { Play, RotateCcw } from 'lucide-react';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { Label } from './ui/Label';
import { Select } from './ui/Select';
import { Modal } from './ui/Modal';

interface Props {
  command: SavedCommand;
  onSend: (values: Record<string, unknown>) => void;
  onClose: () => void;
}

const ParameterInputModal: React.FC<Props> = ({ command, onSend, onClose }) => {
  const [values, setValues] = useState<Record<string, unknown>>({});

  // Initialize defaults
  useEffect(() => {
    const initial: Record<string, unknown> = {};
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

  const handleChange = (name: string, val: unknown) => {
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
                    value={val as string}
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
                    value={val as number}
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
                    value={val as number}
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
                    value={val as string}
                    onChange={e => handleChange(param.name, e.target.value)}
                    maxLength={param.maxLength}
                    placeholder="Enter text..."
                  />
              );
      }
  };

  const titleSection = (
    <div>
      <div className="text-lg font-semibold">Command Parameters</div>
      <div className="text-xs text-muted-foreground font-mono mt-1">{command.name}</div>
    </div>
  );

  const footer = (
    <>
      <Button type="button" variant="ghost" size="sm" onClick={() => setValues({})} title="Clear all">
        <RotateCcw className="w-4 h-4" />
      </Button>
      <div className="flex gap-2 ml-auto">
        <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
        <Button type="submit" form="param-input-form" className="gap-2">
          <Play className="w-4 h-4" /> Send Command
        </Button>
      </div>
    </>
  );

  return (
    <Modal
      isOpen={true}
      onClose={onClose}
      title={titleSection}
      size="md"
      footer={footer}
      className="flex flex-col max-h-[90vh]"
      contentClassName="overflow-y-auto custom-scrollbar"
      footerClassName="justify-between"
    >
      <form id="param-input-form" onSubmit={handleSubmit} className="space-y-5">
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
      </form>
    </Modal>
  );
};

export default ParameterInputModal;
