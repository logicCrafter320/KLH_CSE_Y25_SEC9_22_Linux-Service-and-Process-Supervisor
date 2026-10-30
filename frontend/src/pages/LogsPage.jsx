import React, { useState, useEffect, useCallback } from 'react';
import LogViewer from '../components/Logs/LogViewer';
import LogFilter from '../components/Logs/LogFilter';
import { logsAPI } from '../services/api';
import {
  ArrowPathIcon,
  PlayIcon,
  StopIcon,
  TrashIcon,
  ArrowDownTrayIcon
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

const LogsPage = () => {
  const [logs, setLogs] = useState([]);
  const [units, setUnits] = useState([]);
  const [loading, setLoading] = useState(false);
  const [streaming, setStreaming] = useState(false);
  const [ws, setWs] = useState(null);
  const [logType, setLogType] = useState('journal');
  const [filters, setFilters] = useState({
    unit: '',
    priority: '',
    lines: '100',
    since: ''
  });

  const fetchLogs = useCallback(async () => {
    try {
      setLoading(true);
      let response;
      if (logType === 'journal') {
        response = await logsAPI.getJournal(filters);
      } else {
        response = await logsAPI.getDmesg(filters.lines);
      }
      setLogs(response.data || []);
    } catch (err) {
      toast.error('Failed to fetch logs');
    } finally {
      setLoading(false);
    }
  }, [filters, logType]);

  const fetchUnits = useCallback(async () => {
    try {
      const response = await logsAPI.getUnits();
      setUnits(response.data || []);
    } catch (err) {
      console.error('Failed to fetch units');
    }
  }, []);

  useEffect(() => {
    fetchLogs();
    fetchUnits();
  }, [fetchLogs, fetchUnits]);

  const startStreaming = () => {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const url = `${protocol}//localhost:5000/api/logs/stream${filters.unit ? `?unit=${filters.unit}` : ''}`;
    const websocket = new WebSocket(url);

    websocket.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        if (message.type === 'log') {
          setLogs(prev => {
            const updated = [...prev, {
              timestamp: new Date().toISOString(),
              message: message.data,
              unit: filters.unit || 'system',
              priority: '6'
            }];
            return updated.length > 500 ? updated.slice(-500) : updated;
          });
        }
      } catch (e) {}
    };

    websocket.onopen = () => {
      setStreaming(true);
      toast.success('Started streaming logs');
    };

    websocket.onclose = () => {
      setStreaming(false);
    };

    setWs(websocket);
  };

  const stopStreaming = () => {
    if (ws) {
      ws.close();
      setWs(null);
    }
    setStreaming(false);
    toast.success('Stopped streaming');
  };

  const clearLogs = () => {
    setLogs([]);
    toast.success('Logs cleared');
  };

  const exportLogs = () => {
    const content = logs.map(l =>
      `[${l.timestamp}] [${l.unit}] [P${l.priority}] ${l.message}`
    ).join('\n');
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `logs-${new Date().toISOString().slice(0, 19)}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Logs exported');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-linux-text">Log Viewer</h1>
          <p className="text-sm text-linux-text-secondary mt-1">
            Browse and stream system logs
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex rounded-lg overflow-hidden border border-linux-border">
            <button
              onClick={() => setLogType('journal')}
              className={`px-3 py-2 text-xs font-medium transition-colors ${
                logType === 'journal'
                  ? 'bg-linux-blue/20 text-linux-blue'
                  : 'text-linux-text-secondary hover:text-linux-text'
              }`}
            >
              Journal
            </button>
            <button
              onClick={() => setLogType('dmesg')}
              className={`px-3 py-2 text-xs font-medium transition-colors ${
                logType === 'dmesg'
                  ? 'bg-linux-blue/20 text-linux-blue'
                  : 'text-linux-text-secondary hover:text-linux-text'
              }`}
            >
              Kernel (dmesg)
            </button>
          </div>
        </div>
      </div>

      {logType === 'journal' && (
        <LogFilter filters={filters} onChange={setFilters} units={units} />
      )}

      {/* Action Bar */}
      <div className="flex items-center gap-2 flex-wrap">
        <button onClick={fetchLogs} disabled={loading} className="btn-primary flex items-center gap-2">
          <ArrowPathIcon className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Fetch Logs
        </button>
        {!streaming ? (
          <button onClick={startStreaming} className="btn-success flex items-center gap-2">
            <PlayIcon className="h-4 w-4" />
            Stream Live
          </button>
        ) : (
          <button onClick={stopStreaming} className="btn-danger flex items-center gap-2">
            <StopIcon className="h-4 w-4" />
            Stop Stream
          </button>
        )}
        <button onClick={clearLogs} className="btn-warning flex items-center gap-2">
          <TrashIcon className="h-4 w-4" />
          Clear
        </button>
        <button onClick={exportLogs} className="btn-primary flex items-center gap-2">
          <ArrowDownTrayIcon className="h-4 w-4" />
          Export
        </button>
        {streaming && (
          <span className="flex items-center gap-2 text-xs text-linux-green">
            <span className="w-2 h-2 bg-linux-green rounded-full animate-pulse"></span>
            Live streaming...
          </span>
        )}
        <span className="text-xs text-linux-text-secondary ml-auto">
          {logs.length} entries
        </span>
      </div>

      {/* Log Output */}
      <div className="card p-0 overflow-hidden">
        <LogViewer logs={logs} autoScroll={streaming} />
      </div>
    </div>
  );
};

export default LogsPage;