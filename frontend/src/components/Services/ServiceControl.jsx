import React from 'react';

const ServiceControl = ({ service, onControl, onClose }) => {
  const actions = [
    { action: 'reload', label: 'Reload', color: 'text-linux-blue' },
    { action: 'enable', label: 'Enable', color: 'text-linux-green' },
    { action: 'disable', label: 'Disable', color: 'text-linux-red' }
  ];

  return (
    <div className="mt-3 pt-3 border-t border-linux-border">
      <p className="text-xs text-linux-text-secondary mb-2">More Actions</p>
      <div className="flex gap-2">
        {actions.map(({ action, label, color }) => (
          <button
            key={action}
            onClick={() => { onControl(action); onClose(); }}
            className={`flex-1 py-1.5 rounded-md text-xs font-medium ${color}
                       bg-linux-darker hover:bg-linux-border/50 transition-colors`}
          >
            {label}
          </button>
        ))}
      </div>
    </div>
  );
};

export default ServiceControl;