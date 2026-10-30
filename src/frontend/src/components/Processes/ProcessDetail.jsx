import React, { useState, useEffect } from 'react';
import { processesAPI } from '../../services/api';
import Modal from '../Common/Modal';
import StatusBadge from '../Common/StatusBadge';
import LoadingSpinner from '../Common/LoadingSpinner';

const ProcessDetail = ({ process, isOpen, onClose }) => {
  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && process?.pid) {
      setLoading(true);
      processesAPI.getDetail(process.pid)
        .then(res => setDetail(res.data))
        .catch(() => setDetail(null))
        .finally(() => setLoading(false));
    }
  }, [isOpen, process]);

  if (!process) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Process Detail - PID ${process.pid}`} size="lg">
      {loading ? (
        <LoadingSpinner text="Loading process details..." />
      ) : detail ? (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            {[
              { label: 'PID', value: detail.pid },
              { label: 'PPID', value: detail.ppid },
              { label: 'User', value: detail.user },
              { label: 'State', value: detail.state },
              { label: 'CPU %', value: `${detail.cpu}%` },
              { label: 'Memory %', value: `${detail.mem}%` },
              { label: 'RSS', value: detail.vmRSS },
              { label: 'VM Size', value: detail.vmSize },
              { label: 'VM Peak', value: detail.vmPeak },
              { label: 'Threads', value: detail.threads },
              { label: 'Start Time', value: detail.start },
              { label: 'CPU Time', value: detail.time }
            ].map(({ label, value }) => (
              <div key={label} className="bg-linux-darker rounded-lg p-3">
                <p className="text-xs text-linux-text-secondary">{label}</p>
                <p className="text-sm font-mono text-linux-text mt-1">{value}</p>
              </div>
            ))}
          </div>

          <div className="bg-linux-darker rounded-lg p-4">
            <p className="text-xs text-linux-text-secondary mb-2">Full Command</p>
            <code className="text-xs text-linux-blue font-mono break-all">
              {detail.fullCommand}
            </code>
          </div>
        </div>
      ) : (
        <p className="text-linux-text-secondary text-center py-8">
          Could not load process details. The process may have ended.
        </p>
      )}
    </Modal>
  );
};

export default ProcessDetail;