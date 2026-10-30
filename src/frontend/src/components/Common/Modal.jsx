import React, { useEffect } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';

const Modal = ({ isOpen, onClose, title, children, size = 'md' }) => {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const sizeClasses = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
    full: 'max-w-6xl'
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose}></div>
      <div className={`relative ${sizeClasses[size]} w-full bg-linux-card border border-linux-border 
                       rounded-xl shadow-2xl transform transition-all`}>
        <div className="flex items-center justify-between p-6 border-b border-linux-border">
          <h3 className="text-lg font-semibold text-linux-text">{title}</h3>
          <button
            onClick={onClose}
            className="text-linux-text-secondary hover:text-linux-text transition-colors p-1 rounded-lg hover:bg-linux-border/50"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>
        <div className="p-6 max-h-[70vh] overflow-y-auto">
          {children}
        </div>
      </div>
    </div>
  );
};

export default Modal;