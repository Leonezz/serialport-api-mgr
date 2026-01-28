import * as React from "react";
import { createPortal } from "react-dom";
import { AlertTriangle, Info, CheckCircle, XCircle } from "lucide-react";
import { cn } from "../../lib/utils";
import { Button } from "./Button";

/**
 * ConfirmationDialog Component
 *
 * Design System Specifications (FIGMA-DESIGN.md 6.8):
 * - Width: 400px
 * - Structure: Icon (48px) -> Title (heading.lg, center) -> Message (body.md, text.secondary) -> Buttons
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
  // Handle Escape key
  React.useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen && !loading) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "unset";
    };
  }, [isOpen, onClose, loading]);

  if (!isOpen) return null;

  const Icon = iconMap[type];

  return createPortal(
    <div
      className="fixed inset-0 z-60 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={() => !loading && onClose()}
    >
      <div
        className={cn(
          "w-full max-w-[400px] bg-bg-surface rounded-radius-lg shadow-xl",
          "animate-in fade-in zoom-in-95 duration-200",
          "p-6 text-center",
        )}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Icon */}
        <div className="flex justify-center mb-4">
          <Icon className={cn("w-12 h-12", iconColorMap[type])} />
        </div>

        {/* Title */}
        <h2 className="text-lg font-semibold text-text-primary mb-2">
          {title}
        </h2>

        {/* Message */}
        <p className="text-sm text-text-secondary mb-6">{message}</p>

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
      </div>
    </div>,
    document.body,
  );
};

ConfirmationDialog.displayName = "ConfirmationDialog";

export { ConfirmationDialog };
