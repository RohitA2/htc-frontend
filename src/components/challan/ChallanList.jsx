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
  EyeIcon,
  PencilIcon,
  TrashIcon,
  PlusIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
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

  // Sorting
  const [sortBy, setSortBy] = useState('date');

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
        sortBy,
        sortOrder: 'desc' // Default sort order
      };

      // Remove empty params
      Object.keys(params).forEach(key => {
        if (params[key] === '' || params[key] === undefined) {
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

  // Handle filter apply
  const handleFilterApply = () => {
    setShowFilters(false);
    fetchChallans(1);
  };

  // Handle filter reset
  const handleFilterReset = () => {
    setSearchTerm('');
    setFromDate('');
    setToDate('');
    setSortBy('date');
    fetchChallans(1);
  };

  // Handle sort
  const handleSort = (column) => {
    setSortBy(column);
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
      const response = await axios.delete(`${API_URL}/challans/${selectedChallan.id}`);

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
    return date.toLocaleDateString('en-IN');
  };

  // Calculate serial number
  const getSerialNumber = (index) => {
    return (pagination.page - 1) * pagination.limit + index + 1;
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Challan List</h1>
              <p className="text-gray-600 mt-1">Manage and track all challans</p>
            </div>
            <button
              onClick={handleCreateChallan}
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <PlusIcon className="h-5 w-5 mr-2" />
              Create Challan
            </button>
          </div>
        </div>

        {/* Search and Filter Bar */}
        <div className="bg-white rounded-lg shadow mb-6 p-4">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <form onSubmit={handleSearch} className="relative">
                <div className="relative">
                  <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search by challan no, truck no, driver name..."
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  />
                  <button
                    type="submit"
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
                  >
                    Search
                  </button>
                </div>
              </form>
            </div>

            {/* Filter and Export Buttons */}
            <div className="flex gap-2">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`inline-flex items-center px-4 py-2 border rounded-lg ${showFilters ? 'bg-blue-50 border-blue-300 text-blue-700' : 'border-gray-300 text-gray-700 hover:bg-gray-50'}`}
              >
                <FunnelIcon className="h-5 w-5 mr-2" />
                Filters
              </button>

              <button
                onClick={exportToExcel}
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                <ArrowDownTrayIcon className="h-5 w-5 mr-2" />
                Export Excel
              </button>
            </div>
          </div>

          {/* Filters Panel */}
          {showFilters && (
            <div className="mt-4 p-4 border border-gray-200 rounded-lg bg-gray-50">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Date Range */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    From Date
                  </label>
                  <input
                    type="date"
                    value={fromDate}
                    onChange={(e) => setFromDate(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    To Date
                  </label>
                  <input
                    type="date"
                    value={toDate}
                    onChange={(e) => setToDate(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  />
                </div>

                {/* Sort Options - Simplified */}
                {/* <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Sort By
                  </label>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  >
                    <option value="date">Date (Newest First)</option>
                    <option value="challanNo">Challan No</option>
                    <option value="truckNo">Truck No</option>
                    <option value="driverName">Driver Name</option>
                    <option value="createdAt">Created Date</option>
                  </select>
                </div> */}
              </div>

              {/* Filter Actions */}
              <div className="mt-4 flex justify-end gap-2">
                <button
                  onClick={handleFilterReset}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Reset
                </button>
                <button
                  onClick={handleFilterApply}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Apply Filters
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-sm text-gray-600">Total Challans</div>
            <div className="text-2xl font-bold text-gray-900">{pagination.total}</div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-sm text-gray-600">Current Page</div>
            <div className="text-2xl font-bold text-gray-900">{pagination.page}</div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-sm text-gray-600">Items per Page</div>
            <div className="text-2xl font-bold text-gray-900">{pagination.limit}</div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-sm text-gray-600">Total Pages</div>
            <div className="text-2xl font-bold text-gray-900">{pagination.totalPages}</div>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        S.No
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                        onClick={() => handleSort('challanNo')}
                      >
                        <div className="flex items-center">
                          Challan No
                          <ChevronUpDownIcon className="h-4 w-4 ml-1" />
                        </div>
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                        onClick={() => handleSort('date')}
                      >
                        <div className="flex items-center">
                          Date
                          <ChevronUpDownIcon className="h-4 w-4 ml-1" />
                        </div>
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                        onClick={() => handleSort('truckNo')}
                      >
                        <div className="flex items-center">
                          Truck No
                          <ChevronUpDownIcon className="h-4 w-4 ml-1" />
                        </div>
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                        onClick={() => handleSort('driverName')}
                      >
                        <div className="flex items-center">
                          Driver Name
                          <ChevronUpDownIcon className="h-4 w-4 ml-1" />
                        </div>
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Driver Mobile
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Party Name
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {challans.length > 0 ? (
                      challans.map((challan, index) => (
                        <tr key={challan.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {getSerialNumber(index)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">{challan.challanNo}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {formatDate(challan.date)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {challan.truckNo}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {challan.driverName}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {challan.driverMobileNo}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {challan.partyName || '-'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${challan.isDeleted ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>
                              {challan.isDeleted ? 'Deleted' : 'Active'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <div className="flex space-x-2">
                              <button
                                onClick={() => handleViewChallan(challan)}
                                className="text-blue-600 hover:text-blue-900"
                                title="View"
                              >
                                <EyeIcon className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => handleEditChallan(challan)}
                                className="text-green-600 hover:text-green-900"
                                title="Edit"
                                disabled={challan.isDeleted}
                              >
                                <PencilIcon className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => handleDeleteClick(challan)}
                                className="text-red-600 hover:text-red-900"
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
                        <td colSpan="9" className="px-6 py-8 text-center text-gray-500">
                          <div className="flex flex-col items-center">
                            <svg className="h-12 w-12 text-gray-400 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                            </svg>
                            <p className="text-lg font-medium">No challans found</p>
                            <p className="text-sm mt-1">Try adjusting your search or filter criteria</p>
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {challans.length > 0 && (
                <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div className="text-sm text-gray-700">
                      Showing <span className="font-medium">{(pagination.page - 1) * pagination.limit + 1}</span> to{' '}
                      <span className="font-medium">
                        {Math.min(pagination.page * pagination.limit, pagination.total)}
                      </span>{' '}
                      of <span className="font-medium">{pagination.total}</span> results
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handlePageChange(pagination.page - 1)}
                        disabled={pagination.page === 1}
                        className={`p-2 rounded-lg ${pagination.page === 1 ? 'text-gray-400 cursor-not-allowed' : 'text-gray-700 hover:bg-gray-100'}`}
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
                            className={`px-3 py-1 rounded-lg ${pagination.page === pageNum ? 'bg-blue-600 text-white' : 'text-gray-700 hover:bg-gray-100'}`}
                          >
                            {pageNum}
                          </button>
                        );
                      })}

                      <button
                        onClick={() => handlePageChange(pagination.page + 1)}
                        disabled={pagination.page === pagination.totalPages}
                        className={`p-2 rounded-lg ${pagination.page === pagination.totalPages ? 'text-gray-400 cursor-not-allowed' : 'text-gray-700 hover:bg-gray-100'}`}
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl max-h-[90vh] w-full overflow-hidden">
            <div className="bg-blue-900 text-white px-6 py-4 flex justify-between items-center">
              <h2 className="text-xl font-bold">Challan Details - {selectedChallan.challanNo}</h2>
              <button
                onClick={() => setShowViewModal(false)}
                className="hover:text-gray-200"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto max-h-[calc(90vh-8rem)]">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Basic Details */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">Basic Details</h3>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Challan No:</label>
                    <p className="mt-1 text-gray-900">{selectedChallan.challanNo}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Date:</label>
                    <p className="mt-1 text-gray-900">{formatDate(selectedChallan.date)}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Truck No:</label>
                    <p className="mt-1 text-gray-900">{selectedChallan.truckNo}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Party Name:</label>
                    <p className="mt-1 text-gray-900">{selectedChallan.partyName || '-'}</p>
                  </div>
                </div>

                {/* Driver Details */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">Driver Details</h3>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Driver Name:</label>
                    <p className="mt-1 text-gray-900">{selectedChallan.driverName}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Driver Mobile:</label>
                    <p className="mt-1 text-gray-900">{selectedChallan.driverMobileNo}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Owner Mobile:</label>
                    <p className="mt-1 text-gray-900">{selectedChallan.ownerMobileNo || '-'}</p>
                  </div>
                </div>

                {/* Route Details */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">Route Details</h3>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Last Loading From:</label>
                    <p className="mt-1 text-gray-900">{selectedChallan.lastLoadingFrom || '-'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Last Unloading To:</label>
                    <p className="mt-1 text-gray-900">{selectedChallan.lastUnloadingTo || '-'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Prepared By:</label>
                    <p className="mt-1 text-gray-900">{selectedChallan.preparedBy || '-'}</p>
                  </div>
                </div>

                {/* ID Details */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">ID Details</h3>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Aadhar Card Number:</label>
                    <p className="mt-1 text-gray-900">{selectedChallan.aadharCardNumber || '-'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">PAN Card Number:</label>
                    <p className="mt-1 text-gray-900">{selectedChallan.panCardNumber || '-'}</p>
                  </div>
                </div>

                {/* Bank Details */}
                <div className="space-y-4 md:col-span-2">
                  <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">Bank Details</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-600">Account Holder Name:</label>
                      <p className="mt-1 text-gray-900">{selectedChallan.acHolderName || '-'}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">Account Number:</label>
                      <p className="mt-1 text-gray-900">{selectedChallan.accountNo || '-'}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">IFSC Code:</label>
                      <p className="mt-1 text-gray-900">{selectedChallan.ifscCode || '-'}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">Bank Name:</label>
                      <p className="mt-1 text-gray-900">{selectedChallan.bankName || '-'}</p>
                    </div>
                  </div>
                </div>

                {/* Guarantor Details */}
                <div className="space-y-4 md:col-span-2">
                  <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">Guarantor Details</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-600">Guarantor 1 Name:</label>
                      <p className="mt-1 text-gray-900">{selectedChallan.guarantorName1 || '-'}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">Guarantor 1 Mobile:</label>
                      <p className="mt-1 text-gray-900">{selectedChallan.guarantorMobile1 || '-'}</p>
                    </div>
                    <div className="md:col-span-2">
                      <label className="text-sm font-medium text-gray-600">Guarantor 1 Address:</label>
                      <p className="mt-1 text-gray-900">{selectedChallan.guarantorAddress1 || '-'}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                    <div>
                      <label className="text-sm font-medium text-gray-600">Guarantor 2 Name:</label>
                      <p className="mt-1 text-gray-900">{selectedChallan.guarantorName2 || '-'}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">Guarantor 2 Mobile:</label>
                      <p className="mt-1 text-gray-900">{selectedChallan.guarantorMobile2 || '-'}</p>
                    </div>
                    <div className="md:col-span-2">
                      <label className="text-sm font-medium text-gray-600">Guarantor 2 Address:</label>
                      <p className="mt-1 text-gray-900">{selectedChallan.guarantorAddress2 || '-'}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-gray-50 px-6 py-4 border-t flex justify-end">
              <button
                onClick={() => setShowViewModal(false)}
                className="px-6 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && selectedChallan && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="p-6">
              <div className="flex items-center justify-center w-12 h-12 mx-auto bg-red-100 rounded-full mb-4">
                <svg className="h-6 w-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.998-.833-2.732 0L4.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 text-center mb-2">Delete Challan</h3>
              <p className="text-gray-600 text-center mb-6">
                Are you sure you want to delete challan <span className="font-semibold">{selectedChallan.challanNo}</span>? This action cannot be undone.
              </p>
              <div className="flex justify-center space-x-3">
                <button
                  onClick={() => setShowDeleteModal(false)}
                  disabled={deleteLoading}
                  className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteConfirm}
                  disabled={deleteLoading}
                  className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 flex items-center"
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

export default ChallanList;