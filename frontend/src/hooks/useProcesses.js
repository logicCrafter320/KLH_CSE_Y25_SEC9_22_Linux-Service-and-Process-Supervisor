import { useState, useEffect, useCallback } from 'react';
import { processesAPI } from '../services/api';
import toast from 'react-hot-toast';

const useProcesses = (sortBy = 'cpu', limit = 50, searchQuery = '') => {
  const [processes, setProcesses] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchProcesses = useCallback(async () => {
    try {
      setLoading(true);
      const [procResponse, summaryResponse] = await Promise.all([
        processesAPI.getAll(sortBy, limit, searchQuery),
        processesAPI.getSummary()
      ]);
      setProcesses(procResponse.data || []);
      setSummary(summaryResponse.data || null);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [sortBy, limit, searchQuery]);

  const killProcess = async (pid, signal = 'SIGTERM') => {
    try {
      const response = await processesAPI.kill(pid, signal);
      if (response.success) {
        toast.success(response.message || `Signal sent to process ${pid}`);
      } else {
        toast.error(response.message || `Failed to send signal to process ${pid}`);
      }
      await fetchProcesses();
      return response;
    } catch (err) {
      toast.error(err.message || 'Failed to kill process');
      throw err;
    }
  };

  useEffect(() => {
    fetchProcesses();
    const interval = setInterval(fetchProcesses, 5000);
    return () => clearInterval(interval);
  }, [fetchProcesses]);

  return {
    processes,
    summary,
    loading,
    error,
    fetchProcesses,
    killProcess
  };
};

export default useProcesses;
