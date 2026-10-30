import React from 'react';
import LoadingSpinner from '../Common/LoadingSpinner';

const ProcessList = ({ processes, summary, loading, onKill, onSelectProcess }) => {
  if (loading) return <LoadingSpinner text="Loading processes..." />;

  return (
    <div className="space-y-4">
      {/* Process Summary */}
      {summary && (
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {[
            { label: 'Total', value: summary.all, color: 'text-linux-blue' },
            { label: 'Running', value: summary.running, color: 'text-linux-green' },
            { label: 'Sleeping', value: summary.sleeping, color: 'text-linux-yellow' },
            { label: 'Blocked', value: summary.blocked, color: 'text-linux-red' },
            { label: 'Unknown', value: summary.unknown, color: 'text-linux-text-secondary' }
          ].map(({ label, value, color }) => (
            <div key={label} className="bg-linux-card border border-linux-border rounded-lg p-3 text-center">
              <p className={`text-xl font-bold font-mono ${color}`}>{value || 0}</p>
              <p className="text-xs text-linux-text-secondary mt-1">{label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Process Table */}
      <div className="card overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-linux-border">
              <th className="table-header">PID</th>
              <th className="table-header">User</th>
              <th className="table-header">CPU %</th>
              <th className="table-header">MEM %</th>
              <th className="table-header">RSS</th>
              <th className="table-header">State</th>
              <th className="table-header">Command</th>
              <th className="table-header">Actions</th>
            </tr>
          </thead>
          <tbody>
            {processes.map((proc, idx) => (
              <tr key={idx} className="table-row cursor-pointer" onClick={() => onSelectProcess(proc)}>
                <td className="table-cell font-mono text-linux-blue">{proc.pid}</td>
                <td className="table-cell">
                  <span className="px-2 py-0.5 rounded bg-linux-purple/10 text-linux-purple text-xs">
                    {proc.user}
                  </span>
                </td>
                <td className="table-cell">
                  <div className="flex items-center gap-2">
                    <div className="w-16 progress-bar">
                      <div
                        className={`progress-fill ${
                          proc.cpu > 50 ? 'bg-linux-red' :
                          proc.cpu > 20 ? 'bg-linux-yellow' : 'bg-linux-green'
                        }`}
                        style={{ width: `${Math.min(proc.cpu, 100)}%` }}
                      ></div>
                    </div>
                    <span className="font-mono text-xs">{proc.cpu.toFixed(1)}</span>
                  </div>
                </td>
                <td className="table-cell">
                  <div className="flex items-center gap-2">
                    <div className="w-16 progress-bar">
                      <div
                        className={`progress-fill ${
                          proc.mem > 50 ? 'bg-linux-red' :
                          proc.mem > 20 ? 'bg-linux-yellow' : 'bg-linux-blue'
                        }`}
                        style={{ width: `${Math.min(proc.mem, 100)}%` }}
                      ></div>
                    </div>
                    <span className="font-mono text-xs">{proc.mem.toFixed(1)}</span>
                  </div>
                </td>
                <td className="table-cell font-mono text-xs">
                  {(proc.rss / 1024).toFixed(1)} MB
                </td>
                <td className="table-cell">
                  <span className={`text-xs font-mono ${
                    proc.stat?.startsWith('R') ? 'text-linux-green' :
                    proc.stat?.startsWith('S') ? 'text-linux-yellow' :
                    proc.stat?.startsWith('Z') ? 'text-linux-red' :
                    'text-linux-text-secondary'
                  }`}>
                    {proc.stat}
                  </span>
                </td>
                <td className="table-cell max-w-xs">
                  <span className="font-mono text-xs truncate block text-linux-text-secondary">
                    {proc.command}
                  </span>
                </td>
                <td className="table-cell">
                  <button
                    onClick={(e) => { e.stopPropagation(); onKill(proc.pid); }}
                    className="px-2.5 py-1 rounded-md bg-linux-red/10 text-linux-red text-xs font-medium
                               hover:bg-linux-red/20 transition-colors"
                  >
                    Kill
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ProcessList;