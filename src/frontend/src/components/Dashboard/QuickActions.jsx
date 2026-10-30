import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CogIcon,
  CpuChipIcon,
  DocumentTextIcon,
  ArrowPathIcon,
  CommandLineIcon,
  ShieldCheckIcon
} from '@heroicons/react/24/outline';

const QuickActions = () => {
  const navigate = useNavigate();

  const actions = [
    {
      title: 'Manage Services',
      description: 'Start, stop, and monitor systemd services',
      icon: CogIcon,
      color: 'linux-blue',
      path: '/services'
    },
    {
      title: 'Monitor Processes',
      description: 'View and manage running processes',
      icon: CpuChipIcon,
      color: 'linux-green',
      path: '/processes'
    },
    {
      title: 'View Logs',
      description: 'Browse system and service logs',
      icon: DocumentTextIcon,
      color: 'linux-purple',
      path: '/logs'
    },
    {
      title: 'System Refresh',
      description: 'Refresh all system information',
      icon: ArrowPathIcon,
      color: 'linux-yellow',
      onClick: () => window.location.reload()
    },
    {
      title: 'Terminal Logs',
      description: 'Stream real-time log output',
      icon: CommandLineIcon,
      color: 'linux-orange',
      path: '/logs'
    },
    {
      title: 'System Health',
      description: 'Check overall system health status',
      icon: ShieldCheckIcon,
      color: 'linux-green',
      path: '/settings'
    }
  ];

  return (
    <div className="card">
      <h3 className="text-lg font-semibold text-linux-text mb-4">Quick Actions</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {actions.map((action, idx) => (
          <button
            key={idx}
            onClick={() => action.onClick ? action.onClick() : navigate(action.path)}
            className="flex items-start gap-3 p-4 rounded-xl bg-linux-darker border border-linux-border
                       hover:border-linux-blue/30 hover:bg-linux-card transition-all duration-200 text-left group"
          >
            <div className={`p-2 rounded-lg bg-${action.color}/10 group-hover:bg-${action.color}/20 transition-colors`}>
              <action.icon className={`h-5 w-5 text-${action.color}`} />
            </div>
            <div>
              <p className="text-sm font-medium text-linux-text group-hover:text-linux-blue transition-colors">
                {action.title}
              </p>
              <p className="text-xs text-linux-text-secondary mt-0.5">{action.description}</p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};

export default QuickActions;