import { Toaster as SonnerToaster } from "sonner";
import { useStore } from "../../lib/store";

/**
 * Toast System
 *
 * Built on sonner for accessible, animated toast notifications.
 *
 * Design System Specifications (FIGMA-DESIGN.md 6.5):
 * - Position: Bottom right, 24px margin
 * - Max Width: 400px
 * - Variants: success (green), warning (amber), error (red), info (blue)
 * - Animation: Slide in from right
 *
 * Usage: Call `addToast(type, title, message)` from the zustand store.
 * Sonner handles rendering, dismissal, and stacking automatically.
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

const ToastContainer: React.FC = () => {
  const themeMode = useStore((state) => state.themeMode);

  return (
    <SonnerToaster
      position="bottom-right"
      richColors
      theme={themeMode === "system" ? "system" : themeMode}
      toastOptions={{
        style: {
          maxWidth: "400px",
        },
      }}
    />
  );
};

ToastContainer.displayName = "ToastContainer";

export { ToastContainer };
export default ToastContainer;
