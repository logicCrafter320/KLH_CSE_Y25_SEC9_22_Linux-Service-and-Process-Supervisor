import React from 'react';
import { useApp } from '../../context/AppContext';

const Footer = () => {
  const { systemStats } = useApp();

  const formatUptime = (seconds) => {
    if (!seconds) return 'N/A';
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    return `${days}d ${hours}h ${mins}m`;
  };

  return (
    <footer className="bg-linux-darker border-t border-linux-border px-6 py-2">
      <div className="flex items-center justify-between text-xs text-linux-text-secondary">
        <span>Linux Supervisor v1.0.0</span>
        <div className="flex items-center gap-4">
          {systemStats && (
            <span>Uptime: {formatUptime(systemStats.timestamp ? undefined : undefined)}</span>
          )}
          <span>© {new Date().getFullYear()} LinuxSV</span>
        </div>
      </div>
    </footer>
  );
};

export default Footer;