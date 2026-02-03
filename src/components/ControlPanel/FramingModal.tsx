import React from "react";
import { createPortal } from "react-dom";
import { Scissors, X } from "lucide-react";
import { FramingConfig } from "../../types";
import { Button } from "../ui/Button";
import { FramingConfigEditor } from "../shared/FramingConfigEditor";

interface FramingModalProps {
  isOpen: boolean;
  config: FramingConfig | undefined;
  onFramingChange: (updates: Partial<FramingConfig>) => void;
  onClose: () => void;
}

const FramingModal: React.FC<FramingModalProps> = ({
  isOpen,
  config,
  onFramingChange,
  onClose,
}) => {
  if (!isOpen) return null;

  return createPortal(
    <div
      className="fixed inset-0 bg-background/80 backdrop-blur-sm z-60 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl bg-card border border-border rounded-lg shadow-2xl p-6 space-y-4 animate-in fade-in zoom-in-95"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between pb-2 border-b border-border">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Scissors className="w-4 h-4" /> Framing Strategy
          </h3>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="h-8 w-8"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>

        <FramingConfigEditor config={config} onChange={onFramingChange} />

        <div className="flex justify-end pt-2">
          <Button onClick={onClose} className="w-full sm:w-auto">
            Done
          </Button>
        </div>
      </div>
    </div>,
    document.body,
  );
};

export default FramingModal;
