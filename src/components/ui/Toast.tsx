import React, { useEffect, useState } from "react";
import { CheckCircle, XCircle, AlertCircle, AlertTriangle } from "lucide-react";
import { cn } from "../../lib/utils";

export interface ToastMessage {
  id: string;
  type: "success" | "error" | "info" | "warning";
  title: string;
  message: string;
}

interface Props {
  toasts: ToastMessage[];
  removeToast: (id: string) => void;
}

const ToastContainer: React.FC<Props> = ({ toasts, removeToast }) => {
  return (
    <div className="fixed bottom-20 right-4 z-50 flex flex-col gap-2 pointer-events-none">
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

const ToastItem: React.FC<{ toast: ToastMessage; onRemove: () => void }> = ({
  toast,
  onRemove,
}) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onRemove();
    }, 4000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div
      className={cn(
        "pointer-events-auto flex items-start gap-3 p-3 rounded-lg shadow-lg border w-80 animate-in slide-in-from-right-10 fade-in duration-300",
        toast.type === "success"
          ? "bg-emerald-50 border-emerald-200 text-emerald-900 dark:bg-emerald-900/90 dark:border-emerald-800 dark:text-emerald-100"
          : toast.type === "error"
            ? "bg-red-50 border-red-200 text-red-900 dark:bg-red-900/90 dark:border-red-800 dark:text-red-100"
            : toast.type === "warning"
              ? "bg-amber-50 border-amber-200 text-amber-900 dark:bg-amber-900/90 dark:border-amber-800 dark:text-amber-100"
              : "bg-blue-50 border-blue-200 text-blue-900 dark:bg-blue-900/90 dark:border-blue-800 dark:text-blue-100",
      )}
    >
      <div className="mt-0.5">
        {toast.type === "success" && <CheckCircle className="w-5 h-5" />}
        {toast.type === "error" && <XCircle className="w-5 h-5" />}
        {toast.type === "info" && <AlertCircle className="w-5 h-5" />}
        {toast.type === "warning" && <AlertTriangle className="w-5 h-5" />}
      </div>
      <div className="flex-1">
        <h4 className="font-semibold text-sm">{toast.title}</h4>
        <p className="text-xs opacity-90">{toast.message}</p>
      </div>
    </div>
  );
};

export default ToastContainer;
