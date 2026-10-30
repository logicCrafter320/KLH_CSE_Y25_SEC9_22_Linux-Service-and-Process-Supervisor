import React from 'react';

const LogFilter = ({ filters, onChange, units = [] }) => {
  return (
    <div className="card mb-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div>
          <label className="block text-xs text-linux-text-secondary mb-1.5">Unit/Service</label>
          <select
            value={filters.unit || ''}
            onChange={(e) => onChange({ ...filters, unit: e.target.value })}
            className="input-field"
          >
            <option value="">All Units</option>
            {units.map(unit => (
              <option key={unit} value={unit}>{unit}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs text-linux-text-secondary mb-1.5">Priority</label>
          <select
            value={filters.priority || ''}
            onChange={(e) => onChange({ ...filters, priority: e.target.value })}
            className="input-field"
          >
            <option value="">All Priorities</option>
            <option value="0">Emergency</option>
            <option value="1">Alert</option>
            <option value="2">Critical</option>
            <option value="3">Error</option>
            <option value="4">Warning</option>
            <option value="5">Notice</option>
            <option value="6">Info</option>
            <option value="7">Debug</option>
          </select>
        </div>

        <div>
          <label className="block text-xs text-linux-text-secondary mb-1.5">Lines</label>
          <select
            value={filters.lines || 100}
            onChange={(e) => onChange({ ...filters, lines: e.target.value })}
            className="input-field"
          >
            <option value="50">50 lines</option>
            <option value="100">100 lines</option>
            <option value="200">200 lines</option>
            <option value="500">500 lines</option>
          </select>
        </div>

        <div>
          <label className="block text-xs text-linux-text-secondary mb-1.5">Since</label>
          <input
            type="text"
            placeholder="e.g., today, 1 hour ago"
            value={filters.since || ''}
            onChange={(e) => onChange({ ...filters, since: e.target.value })}
            className="input-field"
          />
        </div>
      </div>
    </div>
  );
};

export default LogFilter;