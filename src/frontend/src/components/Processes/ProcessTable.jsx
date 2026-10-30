import React from 'react';

const ProcessTable = ({ processes }) => {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-linux-border">
            <th className="table-header">PID</th>
            <th className="table-header">User</th>
            <th className="table-header">CPU</th>
            <th className="table-header">Memory</th>
            <th className="table-header">Command</th>
          </tr>
        </thead>
        <tbody>
          {processes.slice(0, 10).map((proc, idx) => (
            <tr key={idx} className="table-row">
              <td className="table-cell font-mono text-linux-blue">{proc.pid}</td>
              <td className="table-cell">{proc.user}</td>
              <td className="table-cell font-mono">{proc.cpu}%</td>
              <td className="table-cell font-mono">{proc.mem}%</td>
              <td className="table-cell font-mono text-xs truncate max-w-xs">{proc.command}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default ProcessTable;