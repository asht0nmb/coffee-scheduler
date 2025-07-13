import { useEffect } from 'react';

/**
 * Custom hook for handling modal escape key and body overflow management.
 * Consolidates the common pattern of ESC key handling and body scroll prevention.
 */
interface UseModalEscapeOptions {
  /** Whether the modal is currently open */
  isOpen: boolean;
  /** Callback function to close the modal */
  onClose: () => void;
  /** Whether to prevent body scrolling when modal is open (default: true) */
  preventScroll?: boolean;
  /** Whether to enable ESC key handling (default: true) */
  enableEscapeKey?: boolean;
}

export function useModalEscape({
  isOpen,
  onClose,
  preventScroll = true,
  enableEscapeKey = true,
}: UseModalEscapeOptions) {
  useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (enableEscapeKey && e.key === 'Escape') {
        onClose();
      }
    };

    // Add event listener for ESC key
    if (enableEscapeKey) {
      document.addEventListener('keydown', handleEscape);
    }

    // Prevent body scrolling
    if (preventScroll) {
      document.body.style.overflow = 'hidden';
    }

    // Cleanup function
    return () => {
      if (enableEscapeKey) {
        document.removeEventListener('keydown', handleEscape);
      }
      if (preventScroll) {
        document.body.style.overflow = 'unset';
      }
    };
  }, [isOpen, onClose, preventScroll, enableEscapeKey]);

  return null; // This hook doesn't return any JSX
}