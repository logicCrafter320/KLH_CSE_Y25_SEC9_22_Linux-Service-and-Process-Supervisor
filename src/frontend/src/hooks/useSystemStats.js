import { useState, useEffect, useCallback } from 'react';
import { systemAPI } from '../services/api';

const useSystemStats = () => {
  const [systemInfo, setSystemInfo] = useState(null);
  const [cpuLoad, setCpuLoad] = useState(null);
  const [memory, setMemory] = useState(null);
  const [network, setNetwork] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchAll = useCallback(async () => {
    try {
      setLoading(true);
      const [infoRes, cpuRes, memRes, netRes] = await Promise.all([
        systemAPI.getInfo(),
        systemAPI.getCpuLoad(),
        systemAPI.getMemory(),
        systemAPI.getNetwork()
      ]);
      setSystemInfo(infoRes.data);
      setCpuLoad(cpuRes.data);
      setMemory(memRes.data);
      setNetwork(netRes.data);
    } catch (err) {
      console.error('Failed to fetch system stats:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  return {
    systemInfo,
    cpuLoad,
    memory,
    network,
    loading,
    refresh: fetchAll
  };
};

export default useSystemStats;