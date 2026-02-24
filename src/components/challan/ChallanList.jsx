// src/pages/ChallanList.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  MagnifyingGlassIcon,
  FunnelIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ChevronUpDownIcon,
  ArrowDownTrayIcon,
  DocumentArrowDownIcon,
  EyeIcon,
  PencilIcon,
  TrashIcon,
  PlusIcon,
  XMarkIcon,
  CalendarDaysIcon
} from '@heroicons/react/24/outline';
import { BookUser, UserRoundCog, Map, Handshake, Landmark, IdCardLanyard } from 'lucide-react';
import { toast } from 'react-toastify';
import * as XLSX from 'xlsx';

// Import ChallanModal component
import ChallanModal from './ChallanModal';

const ChallanList = () => {
  const [challans, setChallans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0
  });

  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [statusFilter, setStatusFilter] = useState('all');

  // Sorting
  const [sortBy, setSortBy] = useState('date');
  const [sortOrder, setSortOrder] = useState('desc');

  // Modal states
  const [selectedChallan, setSelectedChallan] = useState(null);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Create/Edit Modal state
  const [showChallanModal, setShowChallanModal] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);

  const API_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

  // Fetch challans with pagination and filters
  const fetchChallans = async (page = 1) => {
    try {
      setLoading(true);

      const params = {
        page,
        limit: pagination.limit,
        search: searchTerm,
        fromDate,
        toDate,
        status: statusFilter !== 'all' ? statusFilter : undefined,
        sortBy,
        sortOrder
      };

      // Remove empty params
      Object.keys(params).forEach(key => {
        if (params[key] === '' || params[key] === undefined || params[key] === null) {
          delete params[key];
        }
      });

      const response = await axios.get(`${API_URL}/challans/pagination`, { params });

      if (response.data.success) {
        setChallans(response.data.data);
        setPagination({
          page: response.data.page || 1,
          limit: response.data.limit || 10,
          total: response.data.total || 0,
          totalPages: response.data.totalPages || 1
        });
      } else {
        throw new Error(response.data.message || 'Failed to fetch challans');
      }
    } catch (error) {
      console.error('Error fetching challans:', error);
      toast.error(error.response?.data?.message || error.message || 'Failed to load challans');
      setChallans([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchChallans();
  }, []);

  // Handle search
  const handleSearch = (e) => {
    e.preventDefault();
    fetchChallans(1);
  };

  // Handle filter apply - auto apply when filters change
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchChallans(1);
    }, 500); // Debounce for better UX

    return () => clearTimeout(timer);
  }, [searchTerm, fromDate, toDate, statusFilter]);

  // Handle filter reset
  const handleFilterReset = () => {
    setSearchTerm('');
    setFromDate('');
    setToDate('');
    setStatusFilter('all');
    setSortBy('date');
    setSortOrder('desc');
    fetchChallans(1);
  };

  // Handle sort
  const handleSort = (column) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortOrder('desc');
    }
    fetchChallans(1);
  };

  // Handle pagination
  const handlePageChange = (page) => {
    if (page >= 1 && page <= pagination.totalPages) {
      fetchChallans(page);
    }
  };

  // Handle create new challan
  const handleCreateChallan = () => {
    setIsEditMode(false);
    setSelectedChallan(null);
    setShowChallanModal(true);
  };

  // Handle view challan
  const handleViewChallan = (challan) => {
    setSelectedChallan(challan);
    setShowViewModal(true);
  };

  // Handle edit challan
  const handleEditChallan = (challan) => {
    setIsEditMode(true);
    setSelectedChallan(challan);
    setShowChallanModal(true);
  };

  // Handle delete challan
  const handleDeleteClick = (challan) => {
    setSelectedChallan(challan);
    setShowDeleteModal(true);
  };

  // Confirm delete
  const handleDeleteConfirm = async () => {
    if (!selectedChallan) return;

    try {
      setDeleteLoading(true);
      const response = await axios.delete(`${API_URL}/challans/soft-delete/${selectedChallan.id}`);

      if (response.data.success) {
        toast.success('Challan deleted successfully!');
        fetchChallans(pagination.page);
        setShowDeleteModal(false);
        setSelectedChallan(null);
      } else {
        throw new Error(response.data.message || 'Failed to delete challan');
      }
    } catch (error) {
      console.error('Error deleting challan:', error);
      toast.error(error.response?.data?.message || error.message || 'Failed to delete challan');
    } finally {
      setDeleteLoading(false);
    }
  };

  // Handle modal close
  const handleChallanModalClose = () => {
    setShowChallanModal(false);
    setSelectedChallan(null);
    setIsEditMode(false);
  };

  // Handle challan save success
  const handleChallanSaveSuccess = () => {
    fetchChallans(pagination.page);
    setShowChallanModal(false);
  };

  // Export to Excel directly from current data
  const exportToExcel = () => {
    try {
      // Use current challans data for export
      if (challans.length === 0) {
        toast.error('No data to export');
        return;
      }

      // Prepare data for Excel
      const exportData = challans.map(challan => ({
        'S.No': challan.id,
        'Challan No': challan.challanNo,
        'Date': challan.date,
        'Truck No': challan.truckNo,
        'Driver Name': challan.driverName,
        'Driver Mobile': challan.driverMobileNo,
        'Owner Mobile': challan.ownerMobileNo,
        'Party Name': challan.partyName,
        'Loading From': challan.lastLoadingFrom,
        'Unloading To': challan.lastUnloadingTo,
        'Prepared By': challan.preparedBy,
        'Status': challan.isDeleted ? 'Deleted' : 'Active',
        'Created At': new Date(challan.createdAt).toLocaleDateString('en-IN')
      }));

      // Create worksheet
      const ws = XLSX.utils.json_to_sheet(exportData);

      // Set column widths
      const wscols = [
        { wch: 8 },  // S.No
        { wch: 15 }, // Challan No
        { wch: 12 }, // Date
        { wch: 15 }, // Truck No
        { wch: 20 }, // Driver Name
        { wch: 15 }, // Driver Mobile
        { wch: 15 }, // Owner Mobile
        { wch: 20 }, // Party Name
        { wch: 20 }, // Loading From
        { wch: 20 }, // Unloading To
        { wch: 15 }, // Prepared By
        { wch: 10 }, // Status
        { wch: 15 }, // Created At
      ];
      ws['!cols'] = wscols;

      // Create workbook
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Challans');

      // Generate Excel file
      const fileName = `challans_${new Date().toISOString().split('T')[0]}.xlsx`;
      XLSX.writeFile(wb, fileName);

      toast.success('Data exported successfully!');
    } catch (error) {
      console.error('Error exporting data:', error);
      toast.error('Failed to export data');
    }
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  // Calculate serial number
  const getSerialNumber = (index) => {
    return (pagination.page - 1) * pagination.limit + index + 1;
  };

  // Get sort icon
  const getSortIcon = (column) => {
    if (sortBy !== column) return <ChevronUpDownIcon className="h-4 w-4 ml-1 opacity-50" />;
    return sortOrder === 'asc' ? (
      <ChevronUpDownIcon className="h-4 w-4 ml-1 transform rotate-180" />
    ) : (
      <ChevronUpDownIcon className="h-4 w-4 ml-1" />
    );
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-gray-50 to-gray-100 p-4 md:p-6">
      <div className="max-w-full mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Challan Management</h1>
              <p className="text-gray-600 mt-2">Track and manage all delivery challans</p>
            </div>
            <div className="flex flex-wrap gap-3">
              <button
                onClick={exportToExcel}
                className="inline-flex items-center px-4 py-2.5 bg-linear-to-r from-emerald-500 to-emerald-600 text-white rounded-lg hover:from-emerald-600 hover:to-emerald-700 transition-all duration-200 shadow-md hover:shadow-lg"
              >
                <DocumentArrowDownIcon className="h-5 w-5 mr-2" />
                Export Excel
              </button>
              <button
                onClick={handleCreateChallan}
                className="inline-flex cursor-pointer items-center px-4 py-2.5 bg-linear-to-r from-blue-500 to-blue-600 text-white rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all duration-200 shadow-md hover:shadow-lg"
              >
                <PlusIcon className="h-5 w-5 mr-2 " />
                Create Challan
              </button>
            </div>
          </div>
        </div>

        {/* Search and Filter Bar */}
        <div className="bg-white rounded-xl shadow-lg mb-8 p-5 border border-gray-200">
          <div className="flex flex-col lg:flex-row lg:items-center gap-4">
            {/* Search */}
            <div className="flex-1">
              <form onSubmit={handleSearch} className="relative">
                <div className="relative">
                  <MagnifyingGlassIcon className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search challan no, truck no, driver name..."
                    className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all duration-200"
                  />
                  <button
                    type="submit"
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 px-4 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Search
                  </button>
                </div>
              </form>
            </div>

            {/* Date Filters */}
            <div className="flex flex-wrap gap-3">
              <div className="relative flex-1 min-w-37.5">
                <CalendarDaysIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="date"
                  value={fromDate}
                  onChange={(e) => setFromDate(e.target.value)}
                  className="w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  placeholder="From Date"
                />
              </div>
              <div className="relative flex-1 min-w-37.5">
                <CalendarDaysIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="date"
                  value={toDate}
                  onChange={(e) => setToDate(e.target.value)}
                  className="w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  placeholder="To Date"
                />
              </div>

              {/* Status Filter */}
              {/* <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              >
                <option value="all">All Status</option>
                <option value="active">Active Only</option>
                <option value="deleted">Deleted Only</option>
              </select> */}

              {/* Reset Filter Button */}
              <button
                onClick={handleFilterReset}
                className="inline-flex items-center px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <XMarkIcon className="h-5 w-5 mr-2" />
                Reset
              </button>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-linear-to-br from-blue-50 to-blue-100 border border-blue-200 rounded-xl shadow p-5">
            <div className="text-sm font-medium text-blue-700 mb-1">Total Challans</div>
            <div className="text-3xl font-bold text-gray-900">{pagination.total}</div>
          </div>
          <div className="bg-linear-to-br from-green-50 to-green-100 border border-green-200 rounded-xl shadow p-5">
            <div className="text-sm font-medium text-green-700 mb-1">Active Challans</div>
            <div className="text-3xl font-bold text-gray-900">
              {challans.filter(c => !c.isDeleted).length}
            </div>
          </div>
          <div className="bg-linear-to-br from-purple-50 to-purple-100 border border-purple-200 rounded-xl shadow p-5">
            <div className="text-sm font-medium text-purple-700 mb-1">Current Page</div>
            <div className="text-3xl font-bold text-gray-900">{pagination.page}</div>
          </div>
          <div className="bg-linear-to-br from-amber-50 to-amber-100 border border-amber-200 rounded-xl shadow p-5">
            <div className="text-sm font-medium text-amber-700 mb-1">Total Pages</div>
            <div className="text-3xl font-bold text-gray-900">{pagination.totalPages}</div>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-200">
          {loading ? (
            <div className="flex flex-col justify-center items-center h-96">
              <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-600 mb-4"></div>
              <p className="text-gray-600">Loading challans...</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="min-w-225 sm:min-w-full w-full divide-y divide-blue-100 table-fixed">
                  <thead className="bg-linear-to-r from-gray-50 to-gray-100">
                    <tr>
                      <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        S.No
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider cursor-pointer hover:bg-gray-200 transition-colors"
                        onClick={() => handleSort('challanNo')}
                      >
                        <div className="flex items-center">
                          Challan No
                          {getSortIcon('challanNo')}
                        </div>
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider cursor-pointer hover:bg-gray-200 transition-colors"
                        onClick={() => handleSort('date')}
                      >
                        <div className="flex items-center">
                          Date
                          {getSortIcon('date')}
                        </div>
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider cursor-pointer hover:bg-gray-200 transition-colors"
                        onClick={() => handleSort('truckNo')}
                      >
                        <div className="flex items-center">
                          Truck No
                          {getSortIcon('truckNo')}
                        </div>
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider cursor-pointer hover:bg-gray-200 transition-colors"
                        onClick={() => handleSort('driverName')}
                      >
                        <div className="flex items-center">
                          Driver Name
                          {getSortIcon('driverName')}
                        </div>
                      </th>
                      <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Driver Mobile
                      </th>
                      <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Party Name
                      </th>
                      {/* <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Status
                      </th> */}
                      <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {challans.length > 0 ? (
                      challans.map((challan, index) => (
                        <tr
                          key={challan.id}
                          className={`hover:bg-gray-50 transition-colors ${challan.isDeleted ? 'bg-red-50 hover:bg-red-100' : ''}`}
                        >
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">
                              {getSerialNumber(index)}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-semibold text-gray-900">{challan.challanNo}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900 bg-gray-100 px-3 py-1 rounded-full inline-block">
                              {formatDate(challan.date)}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900 bg-blue-50 px-3 py-1 rounded-full inline-block">
                              {challan.truckNo}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">{challan.driverName}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">{challan.driverMobileNo}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">
                              {challan.partyName || (
                                <span className="text-gray-400 italic">Not specified</span>
                              )}
                            </div>
                          </td>
                          {/* <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-3 py-1 inline-flex text-xs leading-4 font-semibold rounded-full ${challan.isDeleted
                              ? 'bg-red-100 text-red-800'
                              : 'bg-green-100 text-green-800'
                              }`}>
                              {challan.isDeleted ? 'Deleted' : 'Active'}
                            </span>
                          </td> */}
                          <td className="px-4 py-2 whitespace-nowrap">
                            <div className="flex space-x-2">
                              <button
                                onClick={() => handleViewChallan(challan)}
                                className="p-2 text-blue-600 hover:text-blue-900 hover:bg-blue-50 rounded-lg transition-colors"
                                title="View Details"
                              >
                                <EyeIcon className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => handleEditChallan(challan)}
                                className="p-2 text-emerald-600 hover:text-emerald-900 hover:bg-emerald-50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                title="Edit"
                                disabled={challan.isDeleted}
                              >
                                <PencilIcon className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => handleDeleteClick(challan)}
                                className="p-2 text-red-600 hover:text-red-900 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                title="Delete"
                                disabled={challan.isDeleted}
                              >
                                <TrashIcon className="h-4 w-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="9" className="px-6 py-12 text-center">
                          <div className="flex flex-col items-center">
                            <svg className="h-16 w-16 text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                            </svg>
                            <p className="text-lg font-medium text-gray-700 mb-2">No challans found</p>
                            <p className="text-gray-500">Try adjusting your search or filter criteria</p>
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {challans.length > 0 && (
                <div className="px-6 py-4 bg-linear-to-r from-gray-50 to-gray-100 border-t border-gray-200">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div className="text-sm text-gray-700">
                      Showing <span className="font-semibold">{(pagination.page - 1) * pagination.limit + 1}</span> to{' '}
                      <span className="font-semibold">
                        {Math.min(pagination.page * pagination.limit, pagination.total)}
                      </span>{' '}
                      of <span className="font-semibold">{pagination.total}</span> results
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handlePageChange(pagination.page - 1)}
                        disabled={pagination.page === 1}
                        className={`p-2 rounded-lg transition-colors ${pagination.page === 1
                          ? 'text-gray-400 cursor-not-allowed'
                          : 'text-gray-700 hover:bg-white hover:shadow'}`}
                      >
                        <ChevronLeftIcon className="h-5 w-5" />
                      </button>

                      {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                        let pageNum;
                        if (pagination.totalPages <= 5) {
                          pageNum = i + 1;
                        } else if (pagination.page <= 3) {
                          pageNum = i + 1;
                        } else if (pagination.page >= pagination.totalPages - 2) {
                          pageNum = pagination.totalPages - 4 + i;
                        } else {
                          pageNum = pagination.page - 2 + i;
                        }

                        return (
                          <button
                            key={pageNum}
                            onClick={() => handlePageChange(pageNum)}
                            className={`px-3 py-1.5 rounded-lg transition-all ${pagination.page === pageNum
                              ? 'bg-blue-600 text-white shadow'
                              : 'text-gray-700 hover:bg-white hover:shadow'}`}
                          >
                            {pageNum}
                          </button>
                        );
                      })}

                      <button
                        onClick={() => handlePageChange(pagination.page + 1)}
                        disabled={pagination.page === pagination.totalPages}
                        className={`p-2 rounded-lg transition-colors ${pagination.page === pagination.totalPages
                          ? 'text-gray-400 cursor-not-allowed'
                          : 'text-gray-700 hover:bg-white hover:shadow'}`}
                      >
                        <ChevronRightIcon className="h-5 w-5" />
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Create/Edit Challan Modal */}
      <ChallanModal
        isOpen={showChallanModal}
        onClose={handleChallanModalClose}
        onSuccess={handleChallanSaveSuccess}
        challanData={isEditMode ? selectedChallan : null}
        isEditMode={isEditMode}
      />

      {/* View Modal */}
      {showViewModal && selectedChallan && (
        <div className="fixed inset-0 backdrop-blur  flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-4xl max-h-[90vh] w-full overflow-hidden animate-fade-in">
            <div className="bg-linear-to-r from-blue-900 to-blue-800 text-white px-6 py-4 flex justify-between items-center">
              <div>
                <h2 className="text-xl font-bold">Challan Details</h2>
                <p className="text-blue-200 text-sm mt-1"><span>Challan No: {selectedChallan.challanNo}</span></p>
              </div>
              <button
                onClick={() => setShowViewModal(false)}
                className="p-1 hover:bg-blue-700 rounded-full transition-colors"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto max-h-[calc(90vh-8rem)]">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Basic Details */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900 border-b pb-2 flex items-center">
                    <span className="bg-blue-100 text-blue-800 p-2 rounded-lg mr-2">
                      <BookUser className="h-6 w-6" />
                    </span>
                    Basic Details
                  </h3>
                  <DetailItem label="Challan No" value={selectedChallan.challanNo} />
                  <DetailItem label="Date" value={formatDate(selectedChallan.date)} />
                  <DetailItem label="Truck No" value={selectedChallan.truckNo} />
                  <DetailItem label="Party Name" value={selectedChallan.partyName} />
                </div>

                {/* Driver Details */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900 border-b pb-2 flex items-center">
                    <span className="bg-green-100 text-green-800 p-2 rounded-lg mr-2">
                      <UserRoundCog className="h-6 w-6" />
                    </span>
                    Driver Details
                  </h3>
                  <DetailItem label="Driver Name" value={selectedChallan.driverName} />
                  <DetailItem label="Driver Mobile" value={selectedChallan.driverMobileNo} />
                  <DetailItem label="Owner Mobile" value={selectedChallan.ownerMobileNo} />
                </div>

                {/* Route Details */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900 border-b pb-2 flex items-center">
                    <span className="bg-purple-100 text-purple-800 p-2 rounded-lg mr-2">
                      <Map className="h-6 w-6" />
                    </span>
                    Route Details
                  </h3>
                  <DetailItem label="Loading From" value={selectedChallan.lastLoadingFrom} />
                  <DetailItem label="Unloading To" value={selectedChallan.lastUnloadingTo} />
                  <DetailItem label="Prepared By" value={selectedChallan.preparedBy} />
                </div>

                {/* ID Details */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900 border-b pb-2 flex items-center">
                    <span className="bg-amber-100 text-amber-800 p-2 rounded-lg mr-2">
                      <IdCardLanyard className="h-6 w-6" />
                    </span>
                    ID Details
                  </h3>
                  <DetailItem label="Aadhar Card" value={selectedChallan.aadharCardNumber} />
                  <DetailItem label="PAN Card" value={selectedChallan.panCardNumber} />
                </div>

                {/* Bank Details */}
                <div className="md:col-span-2 space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900 border-b pb-2 flex items-center">
                    <span className="bg-emerald-100 text-emerald-800 p-2 rounded-lg mr-2">
                      <Landmark className="h-6 w-6" />
                    </span>
                    Bank Details
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <DetailItem label="Account Holder" value={selectedChallan.acHolderName} />
                    <DetailItem label="Account Number" value={selectedChallan.accountNo} />
                    <DetailItem label="IFSC Code" value={selectedChallan.ifscCode} />
                    <DetailItem label="Bank Name" value={selectedChallan.bankName} />
                  </div>
                </div>

                {/* Guarantor Details */}
                <div className="md:col-span-2 space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900 border-b pb-2 flex items-center">
                    <span className="bg-red-100 text-red-800 p-2 rounded-lg mr-2">
                      <Handshake className="h-6 w-6" />
                    </span>
                    Guarantor Details
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-3">
                      <h4 className="font-medium text-gray-700">Guarantor 1</h4>
                      <DetailItem label="Name" value={selectedChallan.guarantorName1} />
                      <DetailItem label="Mobile" value={selectedChallan.guarantorMobile1} />
                      <DetailItem label="Address" value={selectedChallan.guarantorAddress1} />
                    </div>
                    <div className="space-y-3">
                      <h4 className="font-medium text-gray-700">Guarantor 2</h4>
                      <DetailItem label="Name" value={selectedChallan.guarantorName2} />
                      <DetailItem label="Mobile" value={selectedChallan.guarantorMobile2} />
                      <DetailItem label="Address" value={selectedChallan.guarantorAddress2} />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-gray-50 px-6 py-4 border-t flex justify-end space-x-3">
              <button
                onClick={() => handleEditChallan(selectedChallan)}
                disabled={selectedChallan.isDeleted}
                className="px-5 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Edit Challan
              </button>
              <button
                onClick={() => setShowViewModal(false)}
                className="px-5 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && selectedChallan && (
        <div className="fixed inset-0 backdrop-blur flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full animate-fade-in">
            <div className="p-6">
              <div className="flex items-center justify-center w-16 h-16 mx-auto bg-red-100 rounded-full mb-4">
                <svg className="h-8 w-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.998-.833-2.732 0L4.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 text-center mb-2">Delete Challan</h3>
              <p className="text-gray-600 text-center mb-6">
                Are you sure you want to delete challan <span className="font-semibold text-red-600">{selectedChallan.challanNo}</span>?
                This action cannot be undone.
              </p>
              <div className="flex justify-center space-x-4">
                <button
                  onClick={() => setShowDeleteModal(false)}
                  disabled={deleteLoading}
                  className="px-6 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 min-w-25"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteConfirm}
                  disabled={deleteLoading}
                  className="px-6 py-2.5 bg-linear-to-r from-red-600 to-red-700 text-white rounded-lg hover:from-red-700 hover:to-red-800 transition-all disabled:opacity-50 min-w-25 flex items-center justify-center"
                >
                  {deleteLoading ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Deleting...
                    </>
                  ) : (
                    'Delete'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Helper component for view modal details
const DetailItem = ({ label, value }) => (
  <div className="flex flex-col">
    <span className="text-sm font-medium text-gray-500 mb-1">{label}</span>
    <span className={`text-gray-900 ${!value ? 'text-gray-400 italic' : ''}`}>
      {value || 'Not specified'}
    </span>
  </div>
);

export default ChallanList;