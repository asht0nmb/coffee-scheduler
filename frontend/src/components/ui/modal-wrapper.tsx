import { ReactNode } from 'react';
import { useModalEscape } from '@/hooks/useModalEscape';
import { LAYOUT_CONSTANTS } from '@/constants';

interface ModalWrapperProps {
  /** Whether the modal is currently open */
  isOpen: boolean;
  /** Callback function to close the modal */
  onClose: () => void;
  /** Modal content */
  children: ReactNode;
  /** Maximum width of the modal (default: '28rem') */
  maxWidth?: string;
  /** Whether to show backdrop blur effect (default: true) */
  showBackdrop?: boolean;
  /** Whether to prevent body scrolling (default: true) */
  preventScroll?: boolean;
  /** Whether to enable ESC key handling (default: true) */
  enableEscapeKey?: boolean;
  /** Whether clicking backdrop should close modal (default: true) */
  enableBackdropClick?: boolean;
  /** Additional CSS classes for the modal container */
  className?: string;
  /** Z-index for the modal (default: from LAYOUT_CONSTANTS) */
  zIndex?: number;
}

export function ModalWrapper({
  isOpen,
  onClose,
  children,
  maxWidth = '28rem',
  showBackdrop = true,
  preventScroll = true,
  enableEscapeKey = true,
  enableBackdropClick = true,
  className = '',
  zIndex = LAYOUT_CONSTANTS.Z_INDEX.MODAL,
}: ModalWrapperProps) {
  // Use the modal escape hook for common behavior
  useModalEscape({
    isOpen,
    onClose,
    preventScroll,
    enableEscapeKey,
  });

  // Don't render if modal is not open
  if (!isOpen) return null;

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (enableBackdropClick && e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div
      className={`fixed inset-0 flex items-center justify-center p-4 ${
        showBackdrop ? 'backdrop-blur-sm bg-black/50' : ''
      }`}
      style={{ zIndex }}
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
    >
      <div
        className={`bg-white rounded-lg shadow-xl w-full mx-auto max-h-[90vh] overflow-y-auto border border-neutral-200 ${className}`}
        style={{ maxWidth }}
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
}

/**
 * Modal header component with consistent styling
 */
interface ModalHeaderProps {
  title: string;
  onClose?: () => void;
  showCloseButton?: boolean;
  className?: string;
}

export function ModalHeader({
  title,
  onClose,
  showCloseButton = true,
  className = '',
}: ModalHeaderProps) {
  return (
    <div className={`flex items-center justify-between p-6 border-b border-neutral-200 ${className}`}>
      <h2 className="text-xl font-display font-semibold text-neutral-900">
        {title}
      </h2>
      {showCloseButton && onClose && (
        <button
          onClick={onClose}
          className="text-neutral-400 hover:text-neutral-600 transition-colors cursor-pointer p-1 rounded-md hover:bg-neutral-100"
          aria-label="Close modal"
        >
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}
    </div>
  );
}

/**
 * Modal body component with consistent padding
 */
interface ModalBodyProps {
  children: ReactNode;
  className?: string;
}

export function ModalBody({ children, className = '' }: ModalBodyProps) {
  return (
    <div className={`p-6 ${className}`}>
      {children}
    </div>
  );
}

/**
 * Modal footer component with consistent styling
 */
interface ModalFooterProps {
  children: ReactNode;
  className?: string;
}

export function ModalFooter({ children, className = '' }: ModalFooterProps) {
  return (
    <div className={`flex justify-end space-x-3 p-6 border-t border-neutral-200 bg-neutral-50 ${className}`}>
      {children}
    </div>
  );
}