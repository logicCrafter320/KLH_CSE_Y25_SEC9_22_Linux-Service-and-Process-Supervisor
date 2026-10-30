import React from 'react';
import { useApp } from '../../context/AppContext';

const SystemStats = ({ cpuLoad, memory }) => {
  const { systemStats } = useApp();

  const formatBytes = (bytes) => {
    if (!bytes) return '0 B';
    const gb = bytes / (1024 ** 3);
    if (gb >= 1) return `${gb.toFixed(2)} GB`;
    const mb = bytes / (1024 ** 2);
    return `${mb.toFixed(0)} MB`;
  };

  const cpuCores = cpuLoad?.cpus || [];
  const memData = memory || systemStats?.memory;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* CPU Cores */}
      <div className="card">
        <h3 className="text-lg font-semibold text-linux-text mb-4">CPU Core Usage</h3>
        <div className="space-y-3">
          {cpuCores.length > 0 ? (
            cpuCores.map((core, idx) => (
              <div key={idx} className="flex items-center gap-3">
                <span className="text-xs text-linux-text-secondary w-16 font-mono">Core {core.core}</span>
                <div className="flex-1 progress-bar">
                  <div
                    className={`progress-fill ${
                      core.load > 85 ? 'bg-linux-red' :
                      core.load > 60 ? 'bg-linux-yellow' :
                      'bg-linux-blue'
                    }`}
                    style={{ width: `${core.load}%` }}
                  ></div>
                </div>
                <span className="text-xs font-mono text-linux-text-secondary w-12 text-right">
                  {core.load.toFixed(1)}%
                </span>
              </div>
            ))
          ) : (
            <div className="text-center text-linux-text-secondary text-sm py-8">
              Loading CPU data...
            </div>
          )}
        </div>
        {cpuLoad && (
          <div className="mt-4 pt-4 border-t border-linux-border grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-xs text-linux-text-secondary">User</p>
              <p className="text-sm font-semibold text-linux-blue">
                {cpuLoad.currentLoadUser?.toFixed(1)}%
              </p>
            </div>
            <div>
              <p className="text-xs text-linux-text-secondary">System</p>
              <p className="text-sm font-semibold text-linux-purple">
                {cpuLoad.currentLoadSystem?.toFixed(1)}%
              </p>
            </div>
            <div>
              <p className="text-xs text-linux-text-secondary">Idle</p>
              <p className="text-sm font-semibold text-linux-green">
                {cpuLoad.currentLoadIdle?.toFixed(1)}%
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Memory */}
      <div className="card">
        <h3 className="text-lg font-semibold text-linux-text mb-4">Memory Usage</h3>
        {memData ? (
          <>
            <div className="flex justify-center mb-6">
              <div className="relative w-40 h-40">
                <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
                  <circle cx="60" cy="60" r="52" fill="none" stroke="#30363d" strokeWidth="10" />
                  <circle
                    cx="60" cy="60" r="52" fill="none"
                    stroke={parseFloat(memData.usedPercent) > 85 ? '#f85149' :
                            parseFloat(memData.usedPercent) > 60 ? '#d29922' : '#3fb950'}
                    strokeWidth="10"
                    strokeDasharray={`${(parseFloat(memData.usedPercent) / 100) * 327} 327`}
                    strokeLinecap="round"
                    className="transition-all duration-1000"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-2xl font-bold text-linux-text">
                    {parseFloat(memData.usedPercent || 0).toFixed(1)}%
                  </span>
                  <span className="text-xs text-linux-text-secondary">Used</span>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {[
                { label: 'Total', value: formatBytes(memData.total), color: 'text-linux-text' },
                { label: 'Used', value: formatBytes(memData.used), color: 'text-linux-red' },
                { label: 'Free', value: formatBytes(memData.free), color: 'text-linux-green' },
                { label: 'Available', value: formatBytes(memData.available), color: 'text-linux-blue' },
                { label: 'Swap Used', value: formatBytes(memData.swapused || memData.swaptotal), color: 'text-linux-yellow' },
                { label: 'Swap Free', value: formatBytes(memData.swapfree || 0), color: 'text-linux-purple' }
              ].map(({ label, value, color }) => (
                <div key={label} className="bg-linux-darker rounded-lg p-3">
                  <p className="text-xs text-linux-text-secondary">{label}</p>
                  <p className={`text-sm font-semibold font-mono ${color}`}>{value}</p>
                </div>
              ))}
            </div>
          </>
        ) : (
          <div className="text-center text-linux-text-secondary text-sm py-8">
            Loading memory data...
          </div>
        )}
      </div>
    </div>
  );
};

export default SystemStats;