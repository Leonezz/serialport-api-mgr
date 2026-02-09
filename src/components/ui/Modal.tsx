import React from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { Button } from "./Button";
import { cn } from "../../lib/utils";

/**
 * Modal Component
 *
 * Design System Specifications (FIGMA-DESIGN.md 6.4):
 * - Sizes: sm (400px), md (560px), lg (720px)
 * - Structure: Header (56px) -> Content (scrollable) -> Footer (64px)
 * - Overlay: black @ 50% opacity
 * - Animation: fade in + scale from 95%, 200ms ease-out
 *
 * Built on @radix-ui/react-dialog for:
 * - Focus trapping, scroll lock, accessible dismiss
 */

export interface ModalProps {
  /** Whether the modal is open */
  isOpen: boolean;
  /** Callback when modal should close */
  onClose: () => void;
  /** Modal title */
  title: string | React.ReactNode;
  /** Modal content */
  children: React.ReactNode;
  /** Optional footer content (buttons, actions, etc.) */
  footer?: React.ReactNode;
  /** Modal size variant */
  size?: "sm" | "md" | "lg" | "xl" | "2xl" | "full";
  /** z-index level (50 for standard, 100 for high priority) */
  zIndex?: 50 | 100;
  /** Whether to show close button in header */
  showCloseButton?: boolean;
  /** Additional className for the modal */
  className?: string;
  /** Additional className for header */
  headerClassName?: string;
  /** Additional className for content */
  contentClassName?: string;
  /** Additional className for footer */
  footerClassName?: string;
  /** Whether clicking outside closes the modal */
  closeOnClickOutside?: boolean;
}

const sizeClasses = {
  sm: "max-w-[400px]",
  md: "max-w-[560px]",
  lg: "max-w-[720px]",
  xl: "max-w-[900px]",
  "2xl": "max-w-[1024px]",
  full: "max-w-full",
};

/**
 * Reusable modal wrapper component
 * Provides consistent backdrop, animations, and layout structure
 */
export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  footer,
  size = "md",
  zIndex = 50,
  showCloseButton = true,
  className = "",
  headerClassName = "",
  contentClassName = "",
  footerClassName = "",
  closeOnClickOutside = true,
}) => {
  return (
    <Dialog.Root open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay
          className={cn(
            "fixed inset-0 bg-black/50 backdrop-blur-sm overscroll-contain",
            zIndex === 100 ? "z-100" : "z-60",
          )}
          style={{ overscrollBehavior: "contain" }}
        />
        <Dialog.Content
          className={cn(
            "fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2",
            "w-[calc(100%-2rem)] bg-bg-surface rounded-radius-lg shadow-xl",
            "animate-in fade-in zoom-in-95 duration-200",
            "flex flex-col max-h-[90vh]",
            zIndex === 100 ? "z-100" : "z-60",
            sizeClasses[size],
            className,
          )}
          onPointerDownOutside={
            closeOnClickOutside ? undefined : (e) => e.preventDefault()
          }
          onEscapeKeyDown={() => onClose()}
        >
          {/* Header - 56px */}
          <div
            className={cn(
              "flex items-center justify-between px-4 h-14 shrink-0",
              "border-b border-border-default bg-bg-muted/30",
              headerClassName,
            )}
          >
            <Dialog.Title className="text-lg font-semibold text-text-primary">
              {title}
            </Dialog.Title>
            {showCloseButton && (
              <Dialog.Close asChild>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={onClose}
                  aria-label="Close modal"
                >
                  <X className="w-4 h-4" />
                </Button>
              </Dialog.Close>
            )}
          </div>

          {/* Content - Scrollable */}
          <div className={cn("flex-1 overflow-y-auto p-4", contentClassName)}>
            {children}
          </div>

          {/* Footer - 64px */}
          {footer && (
            <div
              className={cn(
                "flex items-center justify-end gap-2 px-4 h-16 shrink-0",
                "border-t border-border-default bg-bg-muted/30",
                footerClassName,
              )}
            >
              {footer}
            </div>
          )}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
};

export default Modal;
