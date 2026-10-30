import React, { useState } from 'react';
import ProcessList from '../components/Processes/ProcessList';
import ProcessDetail from '../components/Processes/ProcessDetail';
import ConfirmDialog from '../components/Common/ConfirmDialog';
import SearchBar from '../components/Common/SearchBar';
import useProcesses from '../hooks/useProcesses';
import { ArrowPathIcon } from '@heroicons/react/24/outline';

const ProcessesPage = () => {
  const [sortBy, setSortBy] = useState('cpu');
  const [limit, setLimit] = useState(100);
  const [searchQuery, setSearchQuery] = useState('');
  const { processes, summary, loading, fetchProcesses, killProcess } = useProcesses(sortBy, limit, searchQuery);
  const [selectedProcess, setSelectedProcess] = useState(null);
  const [showDetail, setShowDetail] = useState(false);
  const [killConfirm, setKillConfirm] = useState({ show: false, pid: null });

  const handleKill = (pid) => {
    setKillConfirm({ show: true, pid });
  };

  const confirmKill = async () => {
    if (killConfirm.pid) {
      await killProcess(killConfirm.pid);
    }
  };

  const handleSelectProcess = (process) => {
    setSelectedProcess(process);
    setShowDetail(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-linux-text">Process Monitor</h1>
          <p className="text-sm text-linux-text-secondary mt-1">
            View and manage running processes
          </p>
        </div>
        <button onClick={fetchProcesses} className="btn-primary flex items-center gap-2">
          <ArrowPathIcon className="h-4 w-4" />
          Refresh
        </button>
      </div>

      {/* Controls */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1">
          <SearchBar
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder="Search all Linux processes by PID, name, or command..."
          />
        </div>
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          className="input-field w-auto"
        >
          <option value="cpu">Sort by CPU</option>
          <option value="memory">Sort by Memory</option>
          <option value="pid">Sort by PID</option>
          <option value="name">Sort by Name</option>
        </select>
        <select
          value={limit}
          onChange={(e) => setLimit(parseInt(e.target.value))}
          className="input-field w-auto"
        >
          <option value="50">50 processes</option>
          <option value="100">100 processes</option>
          <option value="200">200 processes</option>
          <option value="500">500 processes</option>
        </select>
      </div>

      {/* Process List */}
      <ProcessList
        processes={processes}
        summary={summary}
        loading={loading}
        onKill={handleKill}
        onSelectProcess={handleSelectProcess}
      />

      {/* Process Detail Modal */}
      <ProcessDetail
        process={selectedProcess}
        isOpen={showDetail}
        onClose={() => setShowDetail(false)}
      />

      {/* Kill Confirmation */}
      <ConfirmDialog
        isOpen={killConfirm.show}
        onClose={() => setKillConfirm({ show: false, pid: null })}
        onConfirm={confirmKill}
        title="Kill Process"
        message={`Are you sure you want to send SIGTERM to process ${killConfirm.pid}? This action cannot be undone.`}
        confirmText="Kill Process"
        danger
      />
    </div>
  );
};

export default ProcessesPage;