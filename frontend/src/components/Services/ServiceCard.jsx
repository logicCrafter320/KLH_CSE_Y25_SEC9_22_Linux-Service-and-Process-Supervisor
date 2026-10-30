import React, { useState } from 'react';
import StatusBadge from '../Common/StatusBadge';
import ServiceControl from './ServiceControl';
import {
  PlayIcon,
  StopIcon,
  ArrowPathIcon,
  EllipsisVerticalIcon
} from '@heroicons/react/24/solid';

const ServiceCard = ({ service, onControl, viewMode = 'grid' }) => {
  const [showControls, setShowControls] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  const handleAction = async (action) => {
    setActionLoading(true);
    try {
      await onControl(service.unit, action);
    } finally {
      setActionLoading(false);
    }
  };

  if (viewMode === 'table') {
    return (
      <tr className="table-row">
        <td className="table-cell font-mono text-xs">
          <span className="text-linux-blue">{service.unit}</span>
        </td>
        <td className="table-cell">
          <StatusBadge status={service.load} />
        </td>
        <td className="table-cell">
          <StatusBadge status={service.active} />
        </td>
        <td className="table-cell">
          <StatusBadge status={service.sub} />
        </td>
        <td className="table-cell text-linux-text-secondary max-w-xs truncate">
          {service.description}
        </td>
        <td className="table-cell">
          <div className="flex items-center gap-1">
            <button
              onClick={() => handleAction('start')}
              disabled={actionLoading || service.active === 'active'}
              className="p-1.5 rounded-md hover:bg-linux-green/10 text-linux-green disabled:opacity-30 transition-colors"
              title="Start"
            >
              <PlayIcon className="h-4 w-4" />
            </button>
            <button
              onClick={() => handleAction('stop')}
              disabled={actionLoading || service.active !== 'active'}
              className="p-1.5 rounded-md hover:bg-linux-red/10 text-linux-red disabled:opacity-30 transition-colors"
              title="Stop"
            >
              <StopIcon className="h-4 w-4" />
            </button>
            <button
              onClick={() => handleAction('restart')}
              disabled={actionLoading}
              className="p-1.5 rounded-md hover:bg-linux-yellow/10 text-linux-yellow disabled:opacity-30 transition-colors"
              title="Restart"
            >
              <ArrowPathIcon className="h-4 w-4" />
            </button>
          </div>
        </td>
      </tr>
    );
  }

  return (
    <div className="card-hover relative group">
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-semibold text-linux-text truncate font-mono">
            {service.unit}
          </h4>
          <p className="text-xs text-linux-text-secondary mt-1 truncate">
            {service.description}
          </p>
        </div>
        <button
          onClick={() => setShowControls(!showControls)}
          className="p-1 rounded-md hover:bg-linux-border/50 text-linux-text-secondary ml-2"
        >
          <EllipsisVerticalIcon className="h-5 w-5" />
        </button>
      </div>

      <div className="flex items-center gap-2 mb-3">
        <StatusBadge status={service.active} />
        <StatusBadge status={service.sub} />
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={() => handleAction('start')}
          disabled={actionLoading || service.active === 'active'}
          className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg
                     bg-linux-green/10 text-linux-green text-xs font-medium
                     hover:bg-linux-green/20 disabled:opacity-30 transition-all"
        >
          <PlayIcon className="h-3.5 w-3.5" />
          Start
        </button>
        <button
          onClick={() => handleAction('stop')}
          disabled={actionLoading || service.active !== 'active'}
          className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg
                     bg-linux-red/10 text-linux-red text-xs font-medium
                     hover:bg-linux-red/20 disabled:opacity-30 transition-all"
        >
          <StopIcon className="h-3.5 w-3.5" />
          Stop
        </button>
        <button
          onClick={() => handleAction('restart')}
          disabled={actionLoading}
          className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg
                     bg-linux-yellow/10 text-linux-yellow text-xs font-medium
                     hover:bg-linux-yellow/20 disabled:opacity-30 transition-all"
        >
          <ArrowPathIcon className="h-3.5 w-3.5" />
          Restart
        </button>
      </div>

      {showControls && (
        <ServiceControl
          service={service}
          onControl={handleAction}
          onClose={() => setShowControls(false)}
        />
      )}

      {actionLoading && (
        <div className="absolute inset-0 bg-linux-card/80 rounded-xl flex items-center justify-center">
          <div className="h-6 w-6 border-2 border-linux-blue border-t-transparent rounded-full animate-spin"></div>
        </div>
      )}
    </div>
  );
};

export default ServiceCard;