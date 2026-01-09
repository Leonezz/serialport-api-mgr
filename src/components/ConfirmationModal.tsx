
import React from 'react';
import { X, AlertTriangle } from 'lucide-react';
import { Button } from './ui/Button';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from './ui/Card';

interface Props {
  title: string;
  message: string;
  confirmLabel?: string;
  isDestructive?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

const ConfirmationModal: React.FC<Props> = ({ 
    title, 
    message, 
    confirmLabel = 'Confirm', 
    isDestructive = false, 
    onConfirm, 
    onCancel 
}) => {
  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
      <Card className="w-full max-w-sm shadow-2xl border-border animate-in fade-in zoom-in-95 duration-200">
        <CardHeader className="flex flex-row items-center justify-between pb-2 border-b border-border bg-muted/20">
          <CardTitle className="text-lg flex items-center gap-2">
             {isDestructive && <AlertTriangle className="w-5 h-5 text-destructive" />}
             {title}
          </CardTitle>
          <Button variant="ghost" size="icon" onClick={onCancel} className="h-8 w-8 -mr-2">
            <X className="w-4 h-4" />
          </Button>
        </CardHeader>
        <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">{message}</p>
        </CardContent>
        <CardFooter className="flex justify-end bg-muted/20 border-t border-border p-4 gap-2">
            <Button variant="ghost" onClick={onCancel}>Cancel</Button>
            <Button 
                variant={isDestructive ? 'destructive' : 'default'} 
                onClick={onConfirm}
            >
                {confirmLabel}
            </Button>
        </CardFooter>
      </Card>
    </div>
  );
};

export default ConfirmationModal;
