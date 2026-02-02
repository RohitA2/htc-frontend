// CompanyPage.jsx
import React, { useState, useEffect } from 'react';
import {
  Search,
  Filter,
  Download,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Eye,
  Edit,
  Trash2,
  CheckCircle,
  XCircle,
  Plus,
  RefreshCw
} from 'lucide-react';
import CompanyExport from './CompanyExport';
import CompanyFilter from './CompanyFilter';
import CompanyModal from './CompanyModal';
import DeleteConfirmationModal from './DeleteConfirmationModal';
import AddEditCompanyModal from './AddEditCompanyModal';

const CompanyPage = () => {
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    status: '',
    dateRange: { start: '', end: '' }
  });
  const [showFilters, setShowFilters] = useState(false);
  const [showExport, setShowExport] = useState(false);
  const [selectedCompanies, setSelectedCompanies] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showAddEditModal, setShowAddEditModal] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState(null);
  const [companyToDelete, setCompanyToDelete] = useState(null);
  const [editingCompany, setEditingCompany] = useState(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const API_URL = import.meta.env.VITE_API_BASE_URL;

  const fetchCompanies = async (page = 1, search = '', filter = {}) => {
    setLoading(true);
    try {
      const queryParams = new URLSearchParams({
        page: page,
        limit: 10,
        search: search,
        status: filter.status || '',
        startDate: filter.dateRange?.start || '',
        endDate: filter.dateRange?.end || ''
      });

      const response = await fetch(`${API_URL}/company/pagination?${queryParams}`);
      const data = await response.json();

      if (data.success) {
        setCompanies(data.data);
        setTotalPages(data.totalPages);
        setTotalCount(data.count);
      } else {
        throw new Error(data.message || 'Failed to fetch companies');
      }
    } catch (err) {
      setError(err.message);
      console.error('Error fetching companies:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCompanies(currentPage, searchTerm, filters);
  }, [currentPage, filters, refreshTrigger]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchTerm !== '') {
        fetchCompanies(1, searchTerm, filters);
        setCurrentPage(1);
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const handleSearch = (e) => setSearchTerm(e.target.value);

  const handleFilterChange = (newFilters) => {
    setFilters(newFilters);
    setCurrentPage(1);
  };

  const handleClearFilters = () => {
    setFilters({
      status: '',
      dateRange: { start: '', end: '' }
    });
    setSearchTerm('');
    setCurrentPage(1);
  };

  const goToPage = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const handlePrevPage = () => goToPage(currentPage - 1);
  const handleNextPage = () => goToPage(currentPage + 1);

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedCompanies(companies.map(company => company.id));
    } else {
      setSelectedCompanies([]);
    }
  };

  const handleSelectCompany = (id) => {
    setSelectedCompanies(prev =>
      prev.includes(id)
        ? prev.filter(companyId => companyId !== id)
        : [...prev, id]
    );
  };

  const handleViewCompany = (company) => {
    setSelectedCompany(company);
    setShowModal(true);
  };

  const handleEditCompany = (company) => {
    setEditingCompany(company);
    setShowAddEditModal(true);
  };

  const handleDeleteClick = (company) => {
    setCompanyToDelete(company);
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = async () => {
    if (!companyToDelete) return;

    try {
      const response = await fetch(`${API_URL}/company/delete/${companyToDelete.id}`, {
        method: 'DELETE',
      });
      const data = await response.json();

      if (data.success) {
        setRefreshTrigger(prev => prev + 1);
        setSelectedCompanies(prev => prev.filter(id => id !== companyToDelete.id));
      } else {
        throw new Error(data.message || 'Failed to delete company');
      }
    } catch (err) {
      alert(`Error deleting company: ${err.message}`);
    } finally {
      setShowDeleteModal(false);
      setCompanyToDelete(null);
    }
  };

  const handleBulkDelete = () => {
    if (selectedCompanies.length > 0) {
      setCompanyToDelete({ id: 'bulk', name: `${selectedCompanies.length} selected companies` });
      setShowDeleteModal(true);
    }
  };

  const handleConfirmBulkDelete = async () => {
    try {
      const response = await fetch(`${API_URL}/company/delete`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ ids: selectedCompanies }),
      });
      const data = await response.json();

      if (data.success) {
        setRefreshTrigger(prev => prev + 1);
        setSelectedCompanies([]);
      } else {
        throw new Error(data.message || 'Failed to delete companies');
      }
    } catch (err) {
      alert(`Error deleting companies: ${err.message}`);
    } finally {
      setShowDeleteModal(false);
      setCompanyToDelete(null);
    }
  };

  const handleAddCompany = () => {
    setEditingCompany(null);
    setShowAddEditModal(true);
  };

  const handleCompanySaved = () => {
    setRefreshTrigger(prev => prev + 1);
    setShowAddEditModal(false);
    setEditingCompany(null);
  };

  const handleRefresh = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  const StatusBadge = ({ status }) => {
    const statusConfig = {
      Active: {
        bg: 'bg-green-100',
        text: 'text-green-800',
        icon: <CheckCircle className="w-3 h-3" />
      },
      Inactive: {
        bg: 'bg-red-100',
        text: 'text-red-800',
        icon: <XCircle className="w-3 h-3" />
      },
      Pending: {
        bg: 'bg-yellow-100',
        text: 'text-yellow-800',
        icon: <Eye className="w-3 h-3" />
      }
    };

    const config = statusConfig[status] || statusConfig.Inactive;

    return (
      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${config.bg} ${config.text}`}>
        {config.icon}
        <span className="ml-1">{status}</span>
      </span>
    );
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-gray-50 to-gray-100 p-3 sm:p-4 md:p-6 lg:p-8 xl:p-12">
      {/* Header */}
      <div className="mb-6 sm:mb-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 sm:gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Company Management</h1>
            <p className="text-sm sm:text-base text-gray-600 mt-1">Manage and view all company records</p>
          </div>
          <div className="flex flex-wrap gap-2 sm:gap-3">
            <button
              onClick={handleRefresh}
              className="flex items-center gap-1.5 px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm"
              title="Refresh"
            >
              <RefreshCw className="w-4 h-4" />
              <span className="hidden sm:inline">Refresh</span>
            </button>
            <button
              onClick={handleAddCompany}
              className="flex items-center gap-1.5 px-3 sm:px-4 py-2 bg-linear-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all shadow-md text-sm"
            >
              <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
              <span>Add Company</span>
            </button>
          </div>
        </div>
      </div>

      {/* Stats Cards - responsive grid */}
      <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 md:gap-6 mb-6 sm:mb-8">
        <div className="bg-linear-to-br from-white to-gray-50 rounded-xl shadow-md p-4 border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs sm:text-sm text-gray-600 font-medium">Total Companies</p>
              <p className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 mt-1">{totalCount}</p>
            </div>
            <div className="p-2 sm:p-3 rounded-xl bg-linear-to-br from-blue-100 to-blue-50">
              <div className="w-6 h-6 sm:w-8 sm:h-8 bg-linear-to-r from-blue-500 to-blue-600 rounded-lg" />
            </div>
          </div>
        </div>

        <div className="bg-linear-to-br from-white to-gray-50 rounded-xl shadow-md p-4 border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs sm:text-sm text-gray-600 font-medium">Active</p>
              <p className="text-xl sm:text-2xl md:text-3xl font-bold text-green-600 mt-1">
                {companies.filter(c => c.status === 'Active').length}
              </p>
            </div>
            <div className="p-2 sm:p-3 rounded-xl bg-linear-to-br from-green-100 to-green-50">
              <CheckCircle className="w-6 h-6 sm:w-8 sm:h-8 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-linear-to-br from-white to-gray-50 rounded-xl shadow-md p-4 border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs sm:text-sm text-gray-600 font-medium">This Page</p>
              <p className="text-xl sm:text-2xl md:text-3xl font-bold text-purple-600 mt-1">{companies.length}</p>
            </div>
            <div className="p-2 sm:p-3 rounded-xl bg-linear-to-br from-purple-100 to-purple-50">
              <Eye className="w-6 h-6 sm:w-8 sm:h-8 text-purple-600" />
            </div>
          </div>
        </div>

        <div className="bg-linear-to-br from-white to-gray-50 rounded-xl shadow-md p-4 border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs sm:text-sm text-gray-600 font-medium">Selected</p>
              <p className="text-xl sm:text-2xl md:text-3xl font-bold text-orange-600 mt-1">{selectedCompanies.length}</p>
            </div>
            <div className="p-2 sm:p-3 rounded-xl bg-linear-to-br from-orange-100 to-orange-50">
              <Filter className="w-6 h-6 sm:w-8 sm:h-8 text-orange-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Search and Action Bar */}
      <div className="bg-linear-to-br from-white to-gray-50 rounded-xl shadow-md mb-6 sm:mb-8 border border-gray-100 overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-gray-200">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
            <div className="relative flex-1 w-full min-w-0">
              <Search className="absolute left-3 sm:left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 sm:w-5 sm:h-5" />
              <input
                type="text"
                placeholder="Search by company name, email, GST, PAN, or contact person..."
                className="w-full pl-10 sm:pl-12 pr-3 sm:pr-4 py-2.5 sm:py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white/50 backdrop-blur-sm transition-all text-sm"
                value={searchTerm}
                onChange={handleSearch}
              />
            </div>

            <div className="flex flex-wrap gap-2 sm:gap-3 w-full lg:w-auto">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center gap-1.5 px-3 sm:px-5 py-2.5 border border-gray-300 rounded-xl hover:bg-gray-50/50 transition-all text-sm flex-1 sm:flex-none"
              >
                <Filter className="w-4 h-4" />
                <span className="hidden sm:inline">Filters</span>
                {Object.values(filters).some(val =>
                  val && (typeof val === 'string' ? val : Object.values(val).some(v => v))
                ) && (
                    <span className="bg-blue-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center animate-pulse ml-1">
                      !
                    </span>
                  )}
              </button>

              <button
                onClick={() => setShowExport(true)}
                className="flex items-center gap-1.5 px-3 sm:px-5 py-2.5 bg-linear-to-r from-green-500 to-green-600 text-white rounded-xl hover:from-green-600 hover:to-green-700 transition-all shadow-md text-sm flex-1 sm:flex-none"
              >
                <Download className="w-4 h-4" />
                <span className="hidden sm:inline">Export</span>
              </button>

              {selectedCompanies.length > 0 && (
                <button
                  onClick={handleBulkDelete}
                  className="flex items-center gap-1.5 px-3 sm:px-5 py-2.5 bg-linear-to-r from-red-500 to-red-600 text-white rounded-xl hover:from-red-600 hover:to-red-700 transition-all shadow-md text-sm flex-1 sm:flex-none"
                >
                  <Trash2 className="w-4 h-4" />
                  <span className="hidden xs:inline">Delete ({selectedCompanies.length})</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {showFilters && (
          <div className="p-4 sm:p-5 border-t border-gray-200 bg-linear-to-br from-gray-50 to-white/50">
            <CompanyFilter
              filters={filters}
              onFilterChange={handleFilterChange}
              onClear={handleClearFilters}
            />
          </div>
        )}
      </div>

      {/* Companies Table - scrollable */}
      <div className="bg-linear-to-br from-white to-gray-50 rounded-xl shadow-md overflow-hidden border border-gray-100 max-h-[65vh] sm:max-h-[70vh] md:max-h-[75vh]">
        {loading ? (
          <div className="p-8 sm:p-12 text-center">
            <div className="inline-block animate-spin rounded-full h-10 w-10 sm:h-12 sm:w-12 border-4 border-blue-500 border-t-transparent mx-auto"></div>
            <p className="mt-4 text-gray-600 text-base sm:text-lg">Loading companies...</p>
          </div>
        ) : error ? (
          <div className="p-8 sm:p-12 text-center">
            <div className="inline-flex items-center justify-center w-14 h-14 sm:w-16 sm:h-16 bg-red-100 rounded-full mb-4 mx-auto">
              <XCircle className="w-7 h-7 sm:w-8 sm:h-8 text-red-600" />
            </div>
            <p className="text-red-600 text-base sm:text-lg mb-4">Error: {error}</p>
            <button
              onClick={() => fetchCompanies(currentPage, searchTerm, filters)}
              className="px-5 sm:px-6 py-2.5 bg-linear-to-r from-blue-500 to-blue-600 text-white rounded-xl hover:from-blue-600 hover:to-blue-700 transition-all shadow-md text-sm"
            >
              Retry
            </button>
          </div>
        ) : (
          <>
            <div className="overflow-auto max-h-[calc(65vh-120px)] sm:max-h-[calc(70vh-140px)] scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-gray-100 hover:scrollbar-thumb-gray-500">
              <table className="min-w-250 sm:min-w-full w-full divide-y divide-gray-200 table-fixed">
                <thead className="bg-linear-to-r from-gray-50 to-gray-100/50 sticky top-0 z-10">
                  <tr>
                    <th className="w-10 px-2 sm:px-4 py-2.5 sm:py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      <input
                        type="checkbox"
                        className="rounded border-gray-300 focus:ring-blue-500 w-4 h-4"
                        checked={selectedCompanies.length === companies.length && companies.length > 0}
                        onChange={handleSelectAll}
                      />
                    </th>
                    <th className="w-56 px-2 sm:px-4 py-2.5 sm:py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Company
                    </th>
                    <th className="w-48 px-2 sm:px-4 py-2.5 sm:py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Contact
                    </th>
                    <th className="w-40 px-2 sm:px-4 py-2.5 sm:py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      GST / PAN
                    </th>
                    <th className="w-28 px-2 sm:px-4 py-2.5 sm:py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Status
                    </th>
                    {/* <th className="w-32 px-2 sm:px-4 py-2.5 sm:py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Created Date
                    </th> */}
                    <th className="w-36 px-2 sm:px-4 py-2.5 sm:py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200/50 bg-white">
                  {companies.map((company) => (
                    <tr
                      key={company.id}
                      className="hover:bg-linear-to-r hover:from-blue-50/30 hover:to-transparent transition-all duration-150"
                    >
                      <td className="px-2 sm:px-4 py-3 sm:py-5 whitespace-nowrap w-10">
                        <input
                          type="checkbox"
                          className="rounded border-gray-300 focus:ring-blue-500 w-4 h-4"
                          checked={selectedCompanies.includes(company.id)}
                          onChange={() => handleSelectCompany(company.id)}
                        />
                      </td>
                      <td className="px-2 sm:px-4 py-3 sm:py-5 w-56">
                        <div className="space-y-1">
                          <div className="font-semibold text-gray-900 text-sm sm:text-base truncate">
                            {company.companyName}
                          </div>
                          <div className="text-xs sm:text-sm text-gray-600 truncate">
                            {company.companyEmail}
                          </div>
                          <div className="text-xs text-gray-500 truncate">
                            {company.companyAddress || '—'}
                          </div>
                        </div>
                      </td>
                      <td className="px-2 sm:px-4 py-3 sm:py-5 w-48">
                        <div className="space-y-1">
                          <div className="font-medium text-gray-900 text-sm truncate">
                            {company.personName || '—'}
                          </div>
                          <div className="text-xs text-gray-600 truncate">
                            {company.personEmail || '—'}
                          </div>
                          <div className="text-xs text-gray-600">
                            {company.phoneNumber || '—'}
                          </div>
                        </div>
                      </td>
                      <td className="px-2 sm:px-4 py-3 sm:py-5 w-40">
                        <div className="space-y-1 text-xs sm:text-sm">
                          <div>
                            <span className="font-medium text-gray-700">GST:</span>{' '}
                            <span className="font-mono text-gray-900">{company.gstNo || '—'}</span>
                          </div>
                          <div>
                            <span className="font-medium text-gray-700">PAN:</span>{' '}
                            <span className="font-mono text-gray-900">{company.panNo || '—'}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-2 sm:px-4 py-3 sm:py-5 w-28">
                        <StatusBadge status={company.status} />
                      </td>
                      {/* <td className="px-2 sm:px-4 py-3 sm:py-5 whitespace-nowrap w-32">
                        <div className="text-xs sm:text-sm text-gray-900 font-medium">
                          {formatDate(company.createdAt)}
                        </div>
                      </td> */}
                      <td className="px-2 sm:px-4 py-3 sm:py-5 whitespace-nowrap w-36">
                        <div className="flex items-center gap-1.5 sm:gap-2">
                          <button
                            onClick={() => handleViewCompany(company)}
                            className="p-1.5 sm:p-2 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-lg transition-colors shrink-0 w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center"
                            title="View"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleEditCompany(company)}
                            className="p-1.5 sm:p-2 bg-green-50 hover:bg-green-100 text-green-600 rounded-lg transition-colors shrink-0 w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center"
                            title="Edit"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteClick(company)}
                            className="p-1.5 sm:p-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg transition-colors shrink-0 w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Empty State */}
            {companies.length === 0 && (
              <div className="text-center py-12 sm:py-16">
                <div className="inline-flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 bg-gray-100 rounded-full mb-4 sm:mb-6 mx-auto">
                  <Eye className="w-8 h-8 sm:w-10 sm:h-10 text-gray-400" />
                </div>
                <div className="text-gray-500 text-base sm:text-xl mb-2">No companies found</div>
                {searchTerm && (
                  <button
                    onClick={handleClearFilters}
                    className="text-blue-600 hover:text-blue-800 font-medium transition-colors text-sm sm:text-base"
                  >
                    Clear search and filters
                  </button>
                )}
              </div>
            )}

            {/* Pagination */}
            <div className="px-4 sm:px-7 py-3 sm:py-5 border-t border-gray-200 bg-linear-to-r from-gray-50/50 to-transparent">
              <div className="flex flex-col xs:flex-row justify-between items-center gap-4">
                <div className="text-xs sm:text-sm text-gray-700 order-3 xs:order-1">
                  Showing <span className="font-semibold text-gray-900">{companies.length}</span> of{' '}
                  <span className="font-semibold text-gray-900">{totalCount}</span> companies
                </div>

                <div className="flex items-center gap-1.5 order-2">
                  <button
                    onClick={() => goToPage(1)}
                    disabled={currentPage === 1}
                    className="p-2 sm:p-3 rounded-xl border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50/50 transition-colors shrink-0"
                  >
                    <ChevronsLeft className="w-4 h-4" />
                  </button>
                  <button
                    onClick={handlePrevPage}
                    disabled={currentPage === 1}
                    className="p-2 sm:p-3 rounded-xl border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50/50 transition-colors shrink-0"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>

                  <div className="flex gap-1 sm:gap-2 px-2">
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      let pageNum;
                      if (totalPages <= 5) {
                        pageNum = i + 1;
                      } else if (currentPage <= 3) {
                        pageNum = i + 1;
                      } else if (currentPage >= totalPages - 2) {
                        pageNum = totalPages - 4 + i;
                      } else {
                        pageNum = currentPage - 2 + i;
                      }

                      return (
                        <button
                          key={pageNum}
                          onClick={() => goToPage(pageNum)}
                          className={`w-8 h-8 sm:w-10 sm:h-10 rounded-xl border transition-all text-sm flex items-center justify-center ${currentPage === pageNum
                            ? 'bg-linear-to-r from-blue-600 to-blue-700 text-white border-blue-600 shadow-md'
                            : 'border-gray-300 hover:bg-gray-50/50'
                            }`}
                        >
                          {pageNum}
                        </button>
                      );
                    })}
                  </div>

                  <button
                    onClick={handleNextPage}
                    disabled={currentPage === totalPages}
                    className="p-2 sm:p-3 rounded-xl border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50/50 transition-colors shrink-0"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => goToPage(totalPages)}
                    disabled={currentPage === totalPages}
                    className="p-2 sm:p-3 rounded-xl border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50/50 transition-colors shrink-0"
                  >
                    <ChevronsRight className="w-4 h-4" />
                  </button>
                </div>

                <div className="text-xs sm:text-sm text-gray-700 order-1 xs:order-3">
                  Page <span className="font-semibold text-gray-900">{currentPage}</span> of{' '}
                  <span className="font-semibold text-gray-900">{totalPages}</span>
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Modals */}
      {showExport && (
        <CompanyExport
          companies={companies}
          selectedCompanies={selectedCompanies}
          onClose={() => setShowExport(false)}
        />
      )}

      {showModal && selectedCompany && (
        <CompanyModal
          company={selectedCompany}
          onClose={() => setShowModal(false)}
          onEdit={() => {
            setShowModal(false);
            handleEditCompany(selectedCompany);
          }}
        />
      )}

      {showDeleteModal && companyToDelete && (
        <DeleteConfirmationModal
          company={companyToDelete}
          onClose={() => {
            setShowDeleteModal(false);
            setCompanyToDelete(null);
          }}
          onConfirm={companyToDelete.id === 'bulk' ? handleConfirmBulkDelete : handleConfirmDelete}
          isBulkDelete={companyToDelete.id === 'bulk'}
        />
      )}

      {showAddEditModal && (
        <AddEditCompanyModal
          company={editingCompany}
          onClose={() => {
            setShowAddEditModal(false);
            setEditingCompany(null);
          }}
          onSave={handleCompanySaved}
        />
      )}
    </div>
  );
};

export default CompanyPage;