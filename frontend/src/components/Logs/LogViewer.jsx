import React, { useEffect, useRef } from 'react';

const LogViewer = ({ logs, autoScroll = true }) => {
  const containerRef = useRef(null);

  useEffect(() => {
    if (autoScroll && containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [logs, autoScroll]);

  const getPriorityColor = (priority) => {
    const p = parseInt(priority);
    if (p <= 2) return 'text-linux-red'; // Emergency, Alert, Critical
    if (p === 3) return 'text-linux-orange'; // Error
    if (p === 4) return 'text-linux-yellow'; // Warning
    if (p === 5) return 'text-linux-blue'; // Notice
    if (p === 6) return 'text-linux-green'; // Info
    return 'text-linux-text-secondary'; // Debug
  };

  return (
    <div
      ref={containerRef}
      className="terminal-output max-h-[600px] min-h-[400px]"
    >
      {logs.length > 0 ? (
        logs.map((log, idx) => (
          <div key={idx} className="flex gap-3 py-0.5 hover:bg-white/5 px-2 -mx-2 rounded">
            <span className="text-linux-text-secondary text-xs whitespace-nowrap flex-shrink-0">
              {log.timestamp ? new Date(log.timestamp).toLocaleTimeString() : ''}
            </span>
            <span className="text-linux-purple text-xs whitespace-nowrap flex-shrink-0 w-40 truncate">
              {log.unit}
            </span>
            <span className={`text-xs ${getPriorityColor(log.priority)}`}>
              {log.message}
            </span>
          </div>
        ))
      ) : (
        <div className="flex items-center justify-center h-full text-linux-text-secondary">
          <p className="cursor-blink">Waiting for logs</p>
        </div>
      )}
    </div>
  );
};

export default LogViewer;