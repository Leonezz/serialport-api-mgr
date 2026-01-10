import React, { useEffect } from 'react';
import { X } from 'lucide-react';
import { Button } from './Button';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from './Card';

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
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full';

  /** z-index level (50 for standard, 100 for high priority) */
  zIndex?: 50 | 100;

  /** Whether to show close button in header */
  showCloseButton?: boolean;

  /** Additional className for the Card */
  className?: string;

  /** Additional className for CardHeader */
  headerClassName?: string;

  /** Additional className for CardContent */
  contentClassName?: string;

  /** Additional className for CardFooter */
  footerClassName?: string;
}

const sizeClasses = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-xl',
  '2xl': 'max-w-2xl',
  full: 'max-w-full'
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
  size = 'md',
  zIndex = 50,
  showCloseButton = true,
  className = '',
  headerClassName = '',
  contentClassName = '',
  footerClassName = ''
}) => {
  // Handle Escape key to close modal
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      // Prevent body scroll when modal is open
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className={`fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4 ${zIndex === 100 ? 'z-[100]' : 'z-50'}`}
      onClick={onClose} // Click backdrop to close
    >
      <Card
        className={`w-full ${sizeClasses[size]} shadow-2xl border-border animate-in fade-in zoom-in-95 duration-200 ${className}`}
        onClick={(e) => e.stopPropagation()} // Prevent closing when clicking inside modal
      >
        <CardHeader className={`flex flex-row items-center justify-between pb-2 border-b border-border bg-muted/20 ${headerClassName}`}>
          <CardTitle className="text-lg">
            {title}
          </CardTitle>
          {showCloseButton && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="h-8 w-8 -mr-2"
              aria-label="Close modal"
            >
              <X className="w-4 h-4" />
            </Button>
          )}
        </CardHeader>

        <CardContent className={`pt-6 ${contentClassName}`}>
          {children}
        </CardContent>

        {footer && (
          <CardFooter className={`flex justify-end bg-muted/20 border-t border-border p-4 gap-2 ${footerClassName}`}>
            {footer}
          </CardFooter>
        )}
      </Card>
    </div>
  );
};

export default Modal;
