import React from 'react';
import SystemStats from './SystemStats';
import StatusCards from './StatusCards';
import QuickActions from './QuickActions';
import ResourceUsageCard from './ResourceUsageCard';
import { useApp } from '../../context/AppContext';
import { useNavigate } from 'react-router-dom';

const Dashboard = ({ systemInfo, cpuLoad, memory, network, loading }) => {
  const { systemStats } = useApp();
  const navigate = useNavigate();

  const cpuPercent = parseFloat(systemStats?.cpu?.load || 0);
  const memPercent = parseFloat(systemStats?.memory?.usedPercent || 0);

  // Sample history (replace with real data from your API later)
  const sampleHistory = [
    { date: 'Today, 09:26 PM', model: 'CPU Core Avg', credits: `${cpuPercent.toFixed(1)}%`, cost: 'Normal' },
    { date: 'Today, 09:21 PM', model: 'Memory Used', credits: `${memPercent.toFixed(1)}%`, cost: memPercent > 80 ? 'High' : 'Normal' },
    { date: 'Today, 09:18 PM', model: 'Disk I/O', credits: '12.4%', cost: 'Low' },
    { date: 'Today, 09:16 PM', model: 'Network RX', credits: '8.1 MB/s', cost: 'Normal' },
  ];

  return (
    <div className="space-y-6">
      <StatusCards systemInfo={systemInfo} />

      {/* New Resource Usage Card */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <ResourceUsageCard
          title="CPU Usage"
          usedPercent={cpuPercent}
          usedLabel={`${cpuPercent.toFixed(1)}%`}
          totalLabel="100%"
          leftLabel={`${(100 - cpuPercent).toFixed(1)}%`}
          usageHistory={sampleHistory}
          onViewAll={() => navigate('/processes')}
          onManagePlan={() => navigate('/settings')}
          onRefresh={() => window.location.reload()}
        />
        <ResourceUsageCard
          title="Memory Usage"
          usedPercent={memPercent}
          usedLabel={`${memPercent.toFixed(1)}%`}
          totalLabel="100%"
          leftLabel={`${(100 - memPercent).toFixed(1)}%`}
          usageHistory={sampleHistory}
          onViewAll={() => navigate('/processes')}
          onManagePlan={() => navigate('/settings')}
          onRefresh={() => window.location.reload()}
        />
      </div>

      <SystemStats cpuLoad={cpuLoad} memory={memory} />
      <QuickActions />
    </div>
  );
};

export default Dashboard;