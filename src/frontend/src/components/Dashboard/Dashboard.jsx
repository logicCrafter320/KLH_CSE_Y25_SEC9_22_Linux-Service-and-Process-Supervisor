import React from 'react';
import SystemStats from './SystemStats';
import StatusCards from './StatusCards';
import QuickActions from './QuickActions';

const Dashboard = ({ systemInfo, cpuLoad, memory, network, loading }) => {
  return (
    <div className="space-y-6">
      <StatusCards systemInfo={systemInfo} />
      <SystemStats cpuLoad={cpuLoad} memory={memory} />
      <QuickActions />
    </div>
  );
};

export default Dashboard;