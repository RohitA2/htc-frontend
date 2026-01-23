// BankFilter.jsx
import React from 'react';
import { Building, CheckCircle, XCircle, Star } from 'lucide-react';

const BankFilter = ({ filters, companies, onFilterChange, onClear }) => {
  const handleStatusChange = (e) => {
    onFilterChange({
      ...filters,
      status: e.target.value
    });
  };

  const handlePrimaryChange = (e) => {
    onFilterChange({
      ...filters,
      isPrimary: e.target.value
    });
  };

  const handleCompanyChange = (e) => {
    onFilterChange({
      ...filters,
      companyId: e.target.value
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium text-gray-900">Filters</h3>
        <button
          onClick={onClear}
          className="text-sm text-blue-600 hover:text-blue-800 font-medium"
        >
          Clear all
        </button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
            <CheckCircle className="w-4 h-4" />
            Status
          </label>
          <select
            value={filters.status}
            onChange={handleStatusChange}
            className="w-full border border-blue-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
          >
            <option value="">All Status</option>
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
          </select>
        </div>
        
        <div>
          <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
            <Star className="w-4 h-4" />
            Primary Account
          </label>
          <select
            value={filters.isPrimary}
            onChange={handlePrimaryChange}
            className="w-full border border-blue-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
          >
            <option value="">All Accounts</option>
            <option value="true">Primary Only</option>
            <option value="false">Non-Primary Only</option>
          </select>
        </div>
        
        <div>
          <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
            <Building className="w-4 h-4" />
            Company
          </label>
          <select
            value={filters.companyId}
            onChange={handleCompanyChange}
            className="w-full border border-blue-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
          >
            <option value="">All Companies</option>
            {companies.map((company) => (
              <option key={company.id} value={company.id}>
                {company.companyName}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
};

export default BankFilter;