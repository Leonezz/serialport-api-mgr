
import React, { useState } from 'react';
import { X, Save } from 'lucide-react';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from './ui/Card';

interface Props {
  title: string;
  defaultValue?: string;
  placeholder?: string;
  onSave: (value: string) => void;
  onClose: () => void;
}

const SimpleInputModal: React.FC<Props> = ({ title, defaultValue = '', placeholder, onSave, onClose }) => {
  const [value, setValue] = useState(defaultValue);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (value.trim()) {
        onSave(value.trim());
        onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-sm shadow-2xl border-border animate-in fade-in zoom-in-95 duration-200">
        <CardHeader className="flex flex-row items-center justify-between pb-2 border-b border-border bg-muted/20">
          <CardTitle className="text-lg">{title}</CardTitle>
          <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8 -mr-2">
            <X className="w-4 h-4" />
          </Button>
        </CardHeader>
        <form onSubmit={handleSubmit}>
            <CardContent className="pt-6">
                <Input 
                    value={value} 
                    onChange={(e) => setValue(e.target.value)} 
                    placeholder={placeholder}
                    autoFocus
                    required
                />
            </CardContent>
            <CardFooter className="flex justify-end bg-muted/20 border-t border-border p-4 gap-2">
                <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
                <Button type="submit">
                    <Save className="w-4 h-4 mr-2" /> Save
                </Button>
            </CardFooter>
        </form>
      </Card>
    </div>
  );
};

export default SimpleInputModal;
