'use client';

import { useEffect, useState } from 'react';

interface SimplePopupProps {
  show: boolean;
  onHide: () => void;
  title: string;
  message?: string;
  duration?: number;
  type?: 'warning' | 'error' | 'success' | 'info';
}

export const SimplePopup = ({ 
  show, 
  onHide, 
  title, 
  message, 
  duration = 3000,
  type = 'warning' 
}: SimplePopupProps) => {
  const [isVisible, setIsVisible] = useState(false);

  // Auto-dismiss after duration when shown
  useEffect(() => {
    if (show) {
      setIsVisible(true);
      const timer = setTimeout(() => {
        setIsVisible(false);
        // Small delay for exit animation, then call onHide
        setTimeout(onHide, 150);
      }, duration);

      return () => clearTimeout(timer);
    } else {
      setIsVisible(false);
    }
  }, [show, duration, onHide]);

  if (!show) return null;

  // Type-based styling
  const typeStyles = {
    warning: {
      bg: 'bg-warning-50 border-warning-200',
      text: 'text-warning-800',
      icon: 'text-warning-500',
      iconPath: 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.268 16.5c-.77.833.192 2.5 1.732 2.5z'
    },
    error: {
      bg: 'bg-error-50 border-error-200',
      text: 'text-error-800',
      icon: 'text-error-500',
      iconPath: 'M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z'
    },
    success: {
      bg: 'bg-success-50 border-success-200',
      text: 'text-success-800',
      icon: 'text-success-500',
      iconPath: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z'
    },
    info: {
      bg: 'bg-primary-50 border-primary-200',
      text: 'text-primary-800',
      icon: 'text-primary-500',
      iconPath: 'M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z'
    }
  };

  const style = typeStyles[type];

  return (
    <div className="fixed top-4 right-4 z-[70] max-w-sm">
      {/* Simple Toast-style Popup */}
      <div 
        className={`
          p-4 border rounded-lg shadow-lg
          transform transition-all duration-200 ease-out
          ${isVisible ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'}
          ${style.bg} ${style.text}
        `}
      >
        <div className="flex items-start gap-3">
          {/* Icon */}
          <div className={`flex-shrink-0 mt-0.5 ${style.icon}`}>
            <svg 
              className="w-5 h-5" 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor" 
              strokeWidth={1.5}
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                d={style.iconPath} 
              />
            </svg>
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <h4 className="text-sm font-medium font-display">
              {title}
            </h4>
            {message && (
              <p className="mt-1 text-sm opacity-90 font-body">
                {message}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};