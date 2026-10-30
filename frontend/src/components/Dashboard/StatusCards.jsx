import React from 'react';
import { useApp } from '../../context/AppContext';
import {
  CpuChipIcon,
  CircleStackIcon,
  ServerStackIcon,
  ClockIcon
} from '@heroicons/react/24/outline';

const StatusCards = ({ systemInfo }) => {
  const { systemStats } = useApp();

  const formatBytes = (bytes) => {
    if (!bytes) return '0';
    const units = ['B', 'KB', 'MB', 'GB', 'TB'];
    let i = 0;
    let value = bytes;
    while (value >= 1024 && i < units.length - 1) {
      value /= 1024;
      i++;
    }
    return `${value.toFixed(1)} ${units[i]}`;
  };

  const formatUptime = (seconds) => {
    if (!seconds) return 'N/A';
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    if (days > 0) return `${days}d ${hours}h ${mins}m`;
    if (hours > 0) return `${hours}h ${mins}m`;
    return `${mins}m`;
  };

  const cpuLoad = systemStats?.cpu?.load || 0;
  const memPercent = systemStats?.memory?.usedPercent || 0;
  const diskUsed = systemStats?.disk?.[0]?.usedPercent || 0;
  const uptime = systemInfo?.uptime || 0;

  const cards = [
    {
      title: 'CPU Usage',
      value: `${parseFloat(cpuLoad).toFixed(1)}%`,
      subtitle: systemStats?.cpu?.model || 'Loading...',
      icon: CpuChipIcon,
      color: 'linux-blue',
      gradient: 'from-blue-500/20 to-cyan-500/20',
      borderColor: 'border-blue-500/20',
      percent: parseFloat(cpuLoad)
    },
    {
      title: 'Memory Usage',
      value: `${parseFloat(memPercent).toFixed(1)}%`,
      subtitle: `${formatBytes(systemStats?.memory?.used)} / ${formatBytes(systemStats?.memory?.total)}`,
      icon: CircleStackIcon,
      color: 'linux-purple',
      gradient: 'from-purple-500/20 to-pink-500/20',
      borderColor: 'border-purple-500/20',
      percent: parseFloat(memPercent)
    },
    {
      title: 'Disk Usage',
      value: `${parseFloat(diskUsed).toFixed(1)}%`,
      subtitle: systemStats?.disk?.[0]?.fs || 'Loading...',
      icon: ServerStackIcon,
      color: 'linux-orange',
      gradient: 'from-orange-500/20 to-yellow-500/20',
      borderColor: 'border-orange-500/20',
      percent: parseFloat(diskUsed)
    },
    {
      title: 'Uptime',
      value: formatUptime(uptime),
      subtitle: systemInfo?.os?.hostname || 'Loading...',
      icon: ClockIcon,
      color: 'linux-green',
      gradient: 'from-green-500/20 to-emerald-500/20',
      borderColor: 'border-green-500/20',
      percent: null
    }
  ];

  const getBarColor = (percent) => {
    if (percent > 85) return 'bg-linux-red';
    if (percent > 60) return 'bg-linux-yellow';
    return 'bg-linux-green';
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card, idx) => (
        <div
          key={idx}
          className={`card-hover bg-gradient-to-br ${card.gradient} ${card.borderColor}`}
        >
          <div className="flex items-start justify-between mb-4">
            <div>
              <p className="text-sm text-linux-text-secondary font-medium">{card.title}</p>
              <p className="text-2xl font-bold text-linux-text mt-1">{card.value}</p>
            </div>
            <div className={`p-2.5 rounded-xl bg-${card.color}/10`}>
              <card.icon className={`h-6 w-6 text-${card.color}`} />
            </div>
          </div>
          <p className="text-xs text-linux-text-secondary truncate mb-3">{card.subtitle}</p>
          {card.percent !== null && (
            <div className="progress-bar">
              <div
                className={`progress-fill ${getBarColor(card.percent)}`}
                style={{ width: `${Math.min(card.percent, 100)}%` }}
              ></div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default StatusCards;