import React from 'react';
import { useApp } from '../../context/AppContext';
import FluidTabs from '../Navigation/FluidTabs';
import {
  CommandLineIcon,
  SignalIcon,
  SignalSlashIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';

const Navbar = () => {
  const { wsConnected, systemStats } = useApp();

  return (
    <header className="bg-linux-darker/90 backdrop-blur-md border-b border-linux-border px-6 py-3 sticky top-0 z-40">
      <div className="flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Brand Logo */}
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-linux-blue to-linux-purple shadow-lg">
            <CommandLineIcon className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-linux-text leading-none">LinuxSV</h1>
            <p className="text-xs text-linux-text-secondary mt-1">Process Supervisor</p>
          </div>
        </div>

        {/* Fluid Tabs Navigation */}
        <div className="flex-1 flex justify-center">
          <FluidTabs />
        </div>

        {/* Right Status Indicator */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-linux-card border border-linux-border">
            {wsConnected ? (
              <>
                <SignalIcon className="h-4 w-4 text-linux-green animate-pulse" />
                <span className="text-xs text-linux-green font-medium">Connected</span>
              </>
            ) : (
              <>
                <SignalSlashIcon className="h-4 w-4 text-linux-red" />
                <span className="text-xs text-linux-red font-medium">Disconnected</span>
              </>
            )}
          </div>

          <button
            onClick={() => window.location.reload()}
            title="Refresh System"
            className="p-2 rounded-xl border border-linux-border bg-linux-card hover:bg-linux-border/50 transition-colors text-linux-text-secondary hover:text-linux-text"
          >
            <ArrowPathIcon className="h-4 w-4" />
          </button>
        </div>
      </div>
    </header>
  );
};

export default Navbar;