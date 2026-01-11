import React from "react";
import { AlertTriangle } from "lucide-react";
import { Button } from "./ui/Button";
import { Modal } from "./ui/Modal";

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
  confirmLabel = "Confirm",
  isDestructive = false,
  onConfirm,
  onCancel,
}) => {
  const titleWithIcon = (
    <span className="flex items-center gap-2">
      {isDestructive && <AlertTriangle className="w-5 h-5 text-destructive" />}
      {title}
    </span>
  );

  const footer = (
    <>
      <Button variant="ghost" onClick={onCancel}>
        Cancel
      </Button>
      <Button
        variant={isDestructive ? "destructive" : "default"}
        onClick={onConfirm}
      >
        {confirmLabel}
      </Button>
    </>
  );

  return (
    <Modal
      isOpen={true}
      onClose={onCancel}
      title={titleWithIcon}
      size="sm"
      zIndex={100}
      footer={footer}
    >
      <p className="text-sm text-muted-foreground">{message}</p>
    </Modal>
  );
};

export default ConfirmationModal;
