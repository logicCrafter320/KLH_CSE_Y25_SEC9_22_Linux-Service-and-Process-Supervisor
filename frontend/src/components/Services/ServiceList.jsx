import React from 'react';
import ServiceCard from './ServiceCard';
import LoadingSpinner from '../Common/LoadingSpinner';

const ServiceList = ({ services, loading, onControl, viewMode = 'grid' }) => {
  if (loading) return <LoadingSpinner text="Loading services..." />;

  if (!services.length) {
    return (
      <div className="card text-center py-12">
        <p className="text-linux-text-secondary">No services found</p>
      </div>
    );
  }

  if (viewMode === 'table') {
    return (
      <div className="card overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-linux-border">
              <th className="table-header">Service</th>
              <th className="table-header">Load</th>
              <th className="table-header">Active</th>
              <th className="table-header">State</th>
              <th className="table-header">Description</th>
              <th className="table-header">Actions</th>
            </tr>
          </thead>
          <tbody>
            {services.map((service, idx) => (
              <ServiceCard
                key={idx}
                service={service}
                onControl={onControl}
                viewMode="table"
              />
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
      {services.map((service, idx) => (
        <ServiceCard
          key={idx}
          service={service}
          onControl={onControl}
          viewMode="grid"
        />
      ))}
    </div>
  );
};

export default ServiceList;