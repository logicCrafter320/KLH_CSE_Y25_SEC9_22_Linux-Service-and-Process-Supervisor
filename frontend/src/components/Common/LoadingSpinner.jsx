import React from 'react';

const LoadingSpinner = ({ size = 'md', text = 'Loading...' }) => {
  const sizeClasses = {
    sm: 'h-6 w-6',
    md: 'h-10 w-10',
    lg: 'h-16 w-16'
  };

  return (
    <div className="flex flex-col items-center justify-center py-12">
      <div className={`${sizeClasses[size]} relative`}>
        <div className="absolute inset-0 rounded-full border-2 border-linux-border"></div>
        <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-linux-blue animate-spin"></div>
      </div>
      {text && <p className="mt-4 text-linux-text-secondary text-sm">{text}</p>}
    </div>
  );
};

export default LoadingSpinner;