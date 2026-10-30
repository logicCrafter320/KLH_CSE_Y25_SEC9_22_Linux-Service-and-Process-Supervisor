import React from 'react';

const StatusBadge = ({ status, size = 'sm' }) => {
  const getStatusConfig = (status) => {
    const s = status?.toLowerCase();
    if (['active', 'running', 'enabled'].includes(s)) {
      return {
        bg: 'bg-linux-green/15',
        text: 'text-linux-green',
        border: 'border-linux-green/30',
        dot: 'bg-linux-green',
        glow: 'shadow-linux-green/20'
      };
    }
    if (['inactive', 'dead', 'stopped', 'disabled'].includes(s)) {
      return {
        bg: 'bg-linux-text-secondary/10',
        text: 'text-linux-text-secondary',
        border: 'border-linux-text-secondary/30',
        dot: 'bg-linux-text-secondary',
        glow: ''
      };
    }
    if (['failed', 'error'].includes(s)) {
      return {
        bg: 'bg-linux-red/15',
        text: 'text-linux-red',
        border: 'border-linux-red/30',
        dot: 'bg-linux-red',
        glow: 'shadow-linux-red/20'
      };
    }
    if (['activating', 'deactivating', 'reloading', 'waiting'].includes(s)) {
      return {
        bg: 'bg-linux-yellow/15',
        text: 'text-linux-yellow',
        border: 'border-linux-yellow/30',
        dot: 'bg-linux-yellow animate-pulse',
        glow: 'shadow-linux-yellow/20'
      };
    }
    return {
      bg: 'bg-linux-blue/15',
      text: 'text-linux-blue',
      border: 'border-linux-blue/30',
      dot: 'bg-linux-blue',
      glow: ''
    };
  };

  const config = getStatusConfig(status);
  const sizeClasses = size === 'sm' ? 'text-xs px-2.5 py-0.5' : 'text-sm px-3 py-1';

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border font-medium
                      ${config.bg} ${config.text} ${config.border} ${sizeClasses}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`}></span>
      {status}
    </span>
  );
};

export default StatusBadge;