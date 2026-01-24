import React, { useEffect } from "react";
import { CheckCircle, XCircle, Info, AlertTriangle, X } from "lucide-react";
import { cn } from "../../lib/utils";

/**
 * Toast Component
 *
 * Design System Specifications (FIGMA-DESIGN.md 6.5):
 * - Position: Bottom right, 24px margin
 * - Max Width: 400px
 * - Padding: 16px
 * - Border Radius: radius.md
 * - Shadow: shadow.lg
 * - Variants: success (green), warning (amber), error (red), info (blue)
 * - Left border: 4px in variant color
 * - Animation: Slide in from right, 300ms
 */

export interface ToastMessage {
  id: string;
  type: "success" | "error" | "info" | "warning";
  title: string;
  message: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  duration?: number;
}

interface ToastContainerProps {
  toasts: ToastMessage[];
  removeToast: (id: string) => void;
}

const variantStyles = {
  success: {
    bg: "bg-green-50 dark:bg-green-900/30",
    border: "border-l-status-success",
    icon: CheckCircle,
    iconColor: "text-status-success",
  },
  error: {
    bg: "bg-red-50 dark:bg-red-900/30",
    border: "border-l-status-error",
    icon: XCircle,
    iconColor: "text-status-error",
  },
  warning: {
    bg: "bg-amber-50 dark:bg-amber-900/30",
    border: "border-l-status-warning",
    icon: AlertTriangle,
    iconColor: "text-status-warning",
  },
  info: {
    bg: "bg-blue-50 dark:bg-blue-900/30",
    border: "border-l-status-info",
    icon: Info,
    iconColor: "text-status-info",
  },
};

const ToastContainer: React.FC<ToastContainerProps> = ({
  toasts,
  removeToast,
}) => {
  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2 pointer-events-none">
      {toasts.map((toast) => (
        <ToastItem
          key={toast.id}
          toast={toast}
          onRemove={() => removeToast(toast.id)}
        />
      ))}
    </div>
  );
};

interface ToastItemProps {
  toast: ToastMessage;
  onRemove: () => void;
}

const ToastItem: React.FC<ToastItemProps> = ({ toast, onRemove }) => {
  const { type, title, message, action, duration = 4000 } = toast;
  const styles = variantStyles[type];
  const Icon = styles.icon;

  useEffect(() => {
    const timer = setTimeout(() => {
      onRemove();
    }, duration);
    return () => clearTimeout(timer);
  }, [onRemove, duration]);

  return (
    <div
      className={cn(
        "pointer-events-auto w-full max-w-[400px] p-4 rounded-radius-md shadow-lg",
        "border-l-4 border border-border-default",
        styles.bg,
        styles.border,
        "animate-in slide-in-from-right-full duration-300",
      )}
    >
      <div className="flex items-start gap-3">
        {/* Icon */}
        <Icon
          className={cn("w-5 h-5 flex-shrink-0 mt-0.5", styles.iconColor)}
        />

        {/* Content */}
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-semibold text-text-primary">{title}</h4>
          <p className="text-xs text-text-secondary mt-1">{message}</p>
          {action && (
            <button
              onClick={action.onClick}
              className="text-xs font-medium text-accent-primary hover:underline mt-2"
            >
              {action.label}
            </button>
          )}
        </div>

        {/* Close button */}
        <button
          onClick={onRemove}
          className="flex-shrink-0 p-1 rounded-radius-sm text-text-muted hover:text-text-primary hover:bg-bg-hover transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

export default ToastContainer;
export { ToastContainer, ToastItem };
