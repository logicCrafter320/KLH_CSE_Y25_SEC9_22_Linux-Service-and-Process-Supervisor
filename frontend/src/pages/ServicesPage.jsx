import React, { useState } from 'react';
import ServiceList from '../components/Services/ServiceList';
import SearchBar from '../components/Common/SearchBar';
import useServices from '../hooks/useServices';
import {
  TableCellsIcon,
  Squares2X2Icon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';

const ServicesPage = () => {
  const { services, loading, fetchServices, controlService, searchServices } = useServices();
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState('table');
  const [filter, setFilter] = useState('all');

  const handleSearch = (query) => {
    setSearchQuery(query);
    if (query.length >= 2) {
      searchServices(query);
    } else if (query.length === 0) {
      fetchServices();
    }
  };

  const filteredServices = services.filter(s => {
    if (filter === 'active') return s.active === 'active';
    if (filter === 'inactive') return s.active === 'inactive';
    if (filter === 'failed') return s.active === 'failed';
    return true;
  });

  const stats = {
    total: services.length,
    active: services.filter(s => s.active === 'active').length,
    inactive: services.filter(s => s.active === 'inactive').length,
    failed: services.filter(s => s.active === 'failed').length
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-linux-text">Service Manager</h1>
          <p className="text-sm text-linux-text-secondary mt-1">
            Manage systemd services on your system
          </p>
        </div>
        <button onClick={fetchServices} className="btn-primary flex items-center gap-2">
          <ArrowPathIcon className="h-4 w-4" />
          Refresh
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Total', value: stats.total, color: 'text-linux-blue', filterVal: 'all' },
          { label: 'Active', value: stats.active, color: 'text-linux-green', filterVal: 'active' },
          { label: 'Inactive', value: stats.inactive, color: 'text-linux-text-secondary', filterVal: 'inactive' },
          { label: 'Failed', value: stats.failed, color: 'text-linux-red', filterVal: 'failed' }
        ].map(({ label, value, color, filterVal }) => (
          <button
            key={label}
            onClick={() => setFilter(filterVal)}
            className={`card text-center transition-all ${
              filter === filterVal ? 'border-linux-blue ring-1 ring-linux-blue/30' : ''
            }`}
          >
            <p className={`text-2xl font-bold font-mono ${color}`}>{value}</p>
            <p className="text-xs text-linux-text-secondary mt-1">{label}</p>
          </button>
        ))}
      </div>

      {/* Search & Controls */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1">
          <SearchBar
            value={searchQuery}
            onChange={handleSearch}
            placeholder="Search services..."
            onClear={fetchServices}
          />
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setViewMode('grid')}
            className={`p-2.5 rounded-lg border transition-colors ${
              viewMode === 'grid'
                ? 'bg-linux-blue/10 border-linux-blue/30 text-linux-blue'
                : 'border-linux-border text-linux-text-secondary hover:text-linux-text'
            }`}
          >
            <Squares2X2Icon className="h-5 w-5" />
          </button>
          <button
            onClick={() => setViewMode('table')}
            className={`p-2.5 rounded-lg border transition-colors ${
              viewMode === 'table'
                ? 'bg-linux-blue/10 border-linux-blue/30 text-linux-blue'
                : 'border-linux-border text-linux-text-secondary hover:text-linux-text'
            }`}
          >
            <TableCellsIcon className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Service List */}
      <ServiceList
        services={filteredServices}
        loading={loading}
        onControl={controlService}
        viewMode={viewMode}
      />
    </div>
  );
};

export default ServicesPage;