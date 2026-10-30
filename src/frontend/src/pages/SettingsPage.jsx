import React from 'react';
import { useApp } from '../context/AppContext';
import useSystemStats from '../hooks/useSystemStats';
import {
  ServerIcon,
  CpuChipIcon,
  GlobeAltIcon,
  UserIcon
} from '@heroicons/react/24/outline';

const SettingsPage = () => {
  const { refreshInterval, setRefreshInterval, wsConnected } = useApp();
  const { systemInfo, loading } = useSystemStats();

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold text-linux-text">Settings</h1>
        <p className="text-sm text-linux-text-secondary mt-1">
          Configure your Linux Supervisor preferences
        </p>
      </div>

      {/* Connection Settings */}
      <div className="card">
        <h3 className="text-lg font-semibold text-linux-text mb-4">Connection</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-linux-text">WebSocket Status</p>
              <p className="text-xs text-linux-text-secondary">Real-time data connection</p>
            </div>
            <span className={`flex items-center gap-2 text-sm font-medium ${
              wsConnected ? 'text-linux-green' : 'text-linux-red'
            }`}>
              <span className={`w-2.5 h-2.5 rounded-full ${
                wsConnected ? 'bg-linux-green animate-pulse' : 'bg-linux-red'
              }`}></span>
              {wsConnected ? 'Connected' : 'Disconnected'}
            </span>
          </div>
          <div>
            <label className="block text-sm text-linux-text mb-2">Refresh Interval</label>
            <select
              value={refreshInterval}
              onChange={(e) => setRefreshInterval(parseInt(e.target.value))}
              className="input-field w-48"
            >
              <option value="1000">1 second</option>
              <option value="2000">2 seconds</option>
              <option value="5000">5 seconds</option>
              <option value="10000">10 seconds</option>
              <option value="30000">30 seconds</option>
              <option value="60000">1 minute</option>
            </select>
          </div>
        </div>
      </div>

      {/* System Information */}
      {systemInfo && (
        <div className="card">
          <h3 className="text-lg font-semibold text-linux-text mb-4 flex items-center gap-2">
            <ServerIcon className="h-5 w-5 text-linux-blue" />
            System Information
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              { icon: ServerIcon, label: 'Hostname', value: systemInfo.os?.hostname },
              { icon: GlobeAltIcon, label: 'Distribution', value: `${systemInfo.os?.distro} ${systemInfo.os?.release}` },
              { icon: CpuChipIcon, label: 'Kernel', value: systemInfo.os?.kernel },
              { icon: CpuChipIcon, label: 'Architecture', value: systemInfo.os?.arch },
              { icon: CpuChipIcon, label: 'CPU', value: `${systemInfo.cpu?.manufacturer} ${systemInfo.cpu?.brand}` },
              { icon: CpuChipIcon, label: 'Cores', value: `${systemInfo.cpu?.cores} (${systemInfo.cpu?.physicalCores} physical)` }
            ].map(({ icon: Icon, label, value }) => (
              <div key={label} className="flex items-start gap-3 bg-linux-darker rounded-lg p-3">
                <Icon className="h-5 w-5 text-linux-blue flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs text-linux-text-secondary">{label}</p>
                  <p className="text-sm font-mono text-linux-text">{value || 'N/A'}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Users */}
      {systemInfo?.users && systemInfo.users.length > 0 && (
        <div className="card">
          <h3 className="text-lg font-semibold text-linux-text mb-4 flex items-center gap-2">
            <UserIcon className="h-5 w-5 text-linux-green" />
            Logged In Users
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-linux-border">
                  <th className="table-header">User</th>
                  <th className="table-header">Terminal</th>
                  <th className="table-header">Login Date</th>
                  <th className="table-header">Login Time</th>
                  <th className="table-header">IP</th>
                </tr>
              </thead>
              <tbody>
                {systemInfo.users.map((user, idx) => (
                  <tr key={idx} className="table-row">
                    <td className="table-cell font-mono text-linux-blue">{user.user}</td>
                    <td className="table-cell">{user.terminal}</td>
                    <td className="table-cell">{user.loginDate}</td>
                    <td className="table-cell">{user.loginTime}</td>
                    <td className="table-cell font-mono">{user.ip}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* About */}
      <div className="card">
        <h3 className="text-lg font-semibold text-linux-text mb-4">About</h3>
        <div className="space-y-2 text-sm">
          <p className="text-linux-text-secondary">
            <span className="text-linux-text font-medium">Linux Supervisor</span> v1.0.0
          </p>
          <p className="text-linux-text-secondary">
            A modern web-based interface for monitoring and managing Linux services and processes.
          </p>
          <p className="text-linux-text-secondary">
            Built with React.js, Node.js, Express.js, and Tailwind CSS.
          </p>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;