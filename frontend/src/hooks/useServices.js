import { useState, useEffect, useCallback } from 'react';
import { servicesAPI } from '../services/api';
import toast from 'react-hot-toast';

const useServices = () => {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchServices = useCallback(async () => {
    try {
      setLoading(true);
      const response = await servicesAPI.getAll();
      setServices(response.data || []);
      setError(null);
    } catch (err) {
      setError(err.message);
      toast.error('Failed to fetch services');
    } finally {
      setLoading(false);
    }
  }, []);

  const controlService = async (name, action) => {
    try {
      const response = await servicesAPI.control(name, action);
      toast.success(response.message || `${action} successful`);
      await fetchServices();
      return response;
    } catch (err) {
      toast.error(err.message || `Failed to ${action} service`);
      throw err;
    }
  };

  const searchServices = async (query) => {
    try {
      setLoading(true);
      const response = await servicesAPI.search(query);
      setServices(response.data || []);
    } catch (err) {
      toast.error('Search failed');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchServices();
  }, [fetchServices]);

  return {
    services,
    loading,
    error,
    fetchServices,
    controlService,
    searchServices
  };
};

export default useServices;