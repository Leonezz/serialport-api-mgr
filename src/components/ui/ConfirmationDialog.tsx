import * as React from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { AlertTriangle, Info, CheckCircle, XCircle } from "lucide-react";
import { cn } from "../../lib/utils";
import { Button } from "./Button";

/**
 * ConfirmationDialog Component
 *
 * Design System Specifications (FIGMA-DESIGN.md 6.8):
 * - Width: 400px
 * - Structure: Icon (48px) -> Title (heading.lg, center) -> Message (body.md, text.secondary) -> Buttons
 *
 * Built on @radix-ui/react-dialog for focus trapping, scroll lock, accessible dismiss.
 */

export interface ConfirmationDialogProps {
  /** Whether the dialog is open */
  isOpen: boolean;
  /** Close callback */
  onClose: () => void;
  /** Confirm callback */
  onConfirm: () => void;
  /** Dialog title */
  title: string;
  /** Dialog message/description */
  message: string;
  /** Type affects icon and confirm button style */
  type?: "warning" | "danger" | "info" | "success";
  /** Confirm button text */
  confirmText?: string;
  /** Cancel button text */
  cancelText?: string;
  /** Loading state for confirm button */
  loading?: boolean;
}

const iconMap = {
  warning: AlertTriangle,
  danger: XCircle,
  info: Info,
  success: CheckCircle,
};

const iconColorMap = {
  warning: "text-status-warning",
  danger: "text-status-error",
  info: "text-status-info",
  success: "text-status-success",
};

const ConfirmationDialog: React.FC<ConfirmationDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  type = "warning",
  confirmText = "Confirm",
  cancelText = "Cancel",
  loading = false,
}) => {
  const Icon = iconMap[type];

  return (
    <Dialog.Root
      open={isOpen}
      onOpenChange={(open) => !open && !loading && onClose()}
    >
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-60 bg-black/50 backdrop-blur-sm" />
        <Dialog.Content
          className={cn(
            "fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2",
            "w-full max-w-[400px] bg-bg-surface rounded-radius-lg shadow-xl z-60",
            "animate-in fade-in zoom-in-95 duration-200",
            "p-6 text-center",
          )}
          onEscapeKeyDown={loading ? (e) => e.preventDefault() : undefined}
          onPointerDownOutside={loading ? (e) => e.preventDefault() : undefined}
        >
          {/* Icon */}
          <div className="flex justify-center mb-4">
            <Icon className={cn("w-12 h-12", iconColorMap[type])} />
          </div>

          {/* Title */}
          <Dialog.Title className="text-lg font-semibold text-text-primary mb-2">
            {title}
          </Dialog.Title>

          {/* Message */}
          <Dialog.Description className="text-sm text-text-secondary mb-6">
            {message}
          </Dialog.Description>

          {/* Buttons */}
          <div className="flex justify-center gap-3">
            <Button variant="secondary" onClick={onClose} disabled={loading}>
              {cancelText}
            </Button>
            <Button
              variant={type === "danger" ? "destructive" : "primary"}
              onClick={onConfirm}
              loading={loading}
            >
              {confirmText}
            </Button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
};

ConfirmationDialog.displayName = "ConfirmationDialog";

export { ConfirmationDialog };
