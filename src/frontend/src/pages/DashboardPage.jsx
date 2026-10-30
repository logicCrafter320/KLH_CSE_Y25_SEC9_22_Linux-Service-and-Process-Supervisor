import React from 'react';
import Dashboard from '../components/Dashboard/Dashboard';
import ExpandDetails from '../components/Dashboard/ExpandDetails';
import useSystemStats from '../hooks/useSystemStats';
import { useApp } from '../context/AppContext';

const DashboardPage = () => {
  const { systemInfo, cpuLoad, memory, network, loading } = useSystemStats();
  const { systemStats } = useApp();

  const linuxDetails = [
    { label: 'Kernel', value: systemInfo?.os?.kernel || 'Linux 6.8.0', fullWidth: true },
    { label: 'OS Distro', value: systemInfo?.os?.distro || 'Ubuntu 24.04' },
    { label: 'Hostname', value: systemInfo?.os?.hostname || 'GaneshPC' },
    { label: 'CPU Cores', value: `${systemStats?.cpu?.cores || 8} Cores` },
    { label: 'Free Memory', value: `${((systemStats?.memory?.free || 0) / (1024**3)).toFixed(1)} GB` },
  ];

  return (
    <div className="space-y-6">
      {/* Header with Top-Right Expandable Micro-Widget */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-linux-text">System Dashboard</h1>
          <p className="text-sm text-linux-text-secondary mt-1">
            Real-time overview of your Linux system
          </p>
        </div>

        {/* Top-Right Micro Interaction */}
        <div className="flex-shrink-0">
          <ExpandDetails title="System Details" data={linuxDetails} />
        </div>
      </div>

      <Dashboard
        systemInfo={systemInfo}
        cpuLoad={cpuLoad}
        memory={memory}
        network={network}
        loading={loading}
      />
    </div>
  );
};

export default DashboardPage;