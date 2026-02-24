import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { format } from 'date-fns';

const Halting = () => {
  const [loading, setLoading] = useState(false);
  const [haltingData, setHaltingData] = useState([]);
  const [summary, setSummary] = useState({
    totalHaltingAmount: 0,
    totalHaltingPaid: 0,
    totalHaltingBalance: 0
  });
  const [pagination, setPagination] = useState({
    current: 1,
    limit: 10,
    total: 0,
    totalPages: 1
  });

  // Filter states
  const [searchText, setSearchText] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [paymentStatus, setPaymentStatus] = useState('');

  // Expanded rows state
  const [expandedRows, setExpandedRows] = useState([]);

  // Payment modal state
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedHalting, setSelectedHalting] = useState(null);
  const [paymentData, setPaymentData] = useState({
    amount: '',
    paymentMode: 'cash',
    paymentDate: format(new Date(), 'yyyy-MM-dd'),
    utrNo: '',
  });
  const [paymentLoading, setPaymentLoading] = useState(false);

  // Fetch halting data
  const fetchHaltingData = async (page = 1) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page,
        limit: pagination.limit,
        ...(searchText && { search: searchText }),
        ...(paymentStatus && { paymentStatus }),
        ...(fromDate && { fromDate }),
        ...(toDate && { toDate }),
      });

      const response = await axios.get(`http://localhost:5000/api/haltings/all?${params}`);
      
      if (response.data.success) {
        setHaltingData(response.data.data);
        setSummary(response.data.summary || {
          totalHaltingAmount: 0,
          totalHaltingPaid: 0,
          totalHaltingBalance: 0
        });
        setPagination({
          current: response.data.pagination.page,
          limit: response.data.pagination.limit,
          total: response.data.pagination.totalRecords,
          totalPages: response.data.pagination.totalPages
        });
      }
    } catch (error) {
      console.error('Error fetching halting data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHaltingData(1);
  }, [searchText, paymentStatus, fromDate, toDate]);

  // Handle search
  const handleSearch = (e) => {
    e.preventDefault();
    fetchHaltingData(1);
  };

  // Reset filters
  const resetFilters = () => {
    setSearchText('');
    setFromDate('');
    setToDate('');
    setPaymentStatus('');
    fetchHaltingData(1);
  };

  // Toggle row expansion
  const toggleRowExpansion = (id) => {
    setExpandedRows(prev => 
      prev.includes(id) 
        ? prev.filter(rowId => rowId !== id)
        : [...prev, id]
    );
  };

  // Handle payment button click
  const handlePayment = (halting) => {
    setSelectedHalting(halting);
    setPaymentData({
      amount: halting.haltingBalance?.toString() || '',
      paymentMode: 'cash',
      paymentDate: format(new Date(), 'yyyy-MM-dd'),
      utrNo: '',
    });
    setShowPaymentModal(true);
  };

  // Handle payment input change
  const handlePaymentInputChange = (e) => {
    const { name, value } = e.target;
    setPaymentData(prev => ({ ...prev, [name]: value }));
  };

  // Submit payment
  const submitPayment = async () => {
    if (!selectedHalting) return;
    
    setPaymentLoading(true);
    try {
      const payload = {
        truckId: selectedHalting.truckId,
        bookingId: selectedHalting.bookingId,
        amount: parseFloat(paymentData.amount),
        paymentMode: paymentData.paymentMode,
        paymentDate: paymentData.paymentDate,
        utrNo: paymentData.utrNo || null,
        paymentFor: 'halting' // Important: sending 'halting' for halting payments
      };

      const response = await axios.post(
        'http://localhost:5000/api/truck-payments/create-partial-payment',
        payload
      );

      if (response.data.success) {
        // Refresh halting data
        await fetchHaltingData(pagination.current);
        setShowPaymentModal(false);
        setSelectedHalting(null);
      }
    } catch (error) {
      console.error('Error processing payment:', error);
      alert(error.response?.data?.message || 'Failed to process payment');
    } finally {
      setPaymentLoading(false);
    }
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return format(new Date(dateString), 'dd MMM yyyy');
  };

  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2
    }).format(amount);
  };

  // Get payment status badge color
  const getPaymentStatusColor = (status) => {
    switch(status?.toLowerCase()) {
      case 'paid':
        return 'bg-green-100 text-green-800';
      case 'partial':
        return 'bg-yellow-100 text-yellow-800';
      case 'pending':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Halting Management</h1>
        <p className="text-gray-600">Manage and track all halting entries</p>
      </div>

      {/* Summary Cards */}
      <div className="mb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Halting Amount</p>
              <p className="text-2xl font-bold text-gray-800">
                {formatCurrency(summary.totalHaltingAmount)}
              </p>
            </div>
            <div className="bg-blue-100 p-3 rounded-full">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Paid</p>
              <p className="text-2xl font-bold text-green-600">
                {formatCurrency(summary.totalHaltingPaid)}
              </p>
            </div>
            <div className="bg-green-100 p-3 rounded-full">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Balance</p>
              <p className="text-2xl font-bold text-orange-600">
                {formatCurrency(summary.totalHaltingBalance)}
              </p>
            </div>
            <div className="bg-orange-100 p-3 rounded-full">
              <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Filters Section */}
      <div className="mb-6 bg-white rounded-lg shadow p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Search Input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Search
            </label>
            <div className="relative">
              <input
                type="text"
                placeholder="Search truck no, driver..."
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                onClick={handleSearch}
                className="absolute right-2 top-2 text-gray-400 hover:text-gray-600"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </button>
            </div>
          </div>

          {/* Date Range */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              From Date
            </label>
            <input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Payment Status Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Payment Status
            </label>
            <select
              value={paymentStatus}
              onChange={(e) => setPaymentStatus(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Status</option>
              <option value="paid">Paid</option>
              <option value="partial">Partial</option>
              <option value="pending">Pending</option>
            </select>
          </div>
        </div>

        {/* Filter Actions */}
        <div className="mt-4 flex justify-end">
          <button
            onClick={resetFilters}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500"
          >
            Reset Filters
          </button>
        </div>
      </div>

      {/* Table Section */}
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
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Expand
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      ID
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Truck Details
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Booking Details
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Halting Details
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Amount Breakdown
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {haltingData.map((item) => (
                    <React.Fragment key={item.id}>
                      {/* Main Row */}
                      <tr className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <button
                            onClick={() => toggleRowExpansion(item.id)}
                            className="text-gray-500 hover:text-gray-700 focus:outline-none"
                          >
                            <svg
                              className={`w-5 h-5 transform transition-transform ${
                                expandedRows.includes(item.id) ? 'rotate-180' : ''
                              }`}
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M19 9l-7 7-7-7"
                              />
                            </svg>
                          </button>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          #{item.id}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {item.truck.truckNo}
                          </div>
                          <div className="text-sm text-gray-500">
                            Driver: {item.truck.driverName}
                          </div>
                          <div className="text-xs text-gray-400">
                            {item.truck.transporterName}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            #{item.bookingId}
                          </div>
                          <div className="text-sm text-gray-500">
                            {item.booking.fromLocation} → {item.booking.toLocation}
                          </div>
                          <div className="text-xs text-gray-400">
                            Booking: {formatDate(item.booking.date)}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {item.days} {item.days === 1 ? 'day' : 'days'}
                          </div>
                          <div className="text-sm text-gray-500">
                            ₹{item.pricePerDay}/day
                          </div>
                          <div className="text-xs text-gray-400">
                            Reason: {item.reason}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            Total: {formatCurrency(item.haltingAmount)}
                          </div>
                          <div className="text-sm text-green-600">
                            Paid: {formatCurrency(item.haltingPaid)}
                          </div>
                          <div className="text-sm font-medium text-orange-600">
                            Balance: {formatCurrency(item.haltingBalance)}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getPaymentStatusColor(item.paymentStatus)}`}>
                            {item.paymentStatus?.charAt(0).toUpperCase() + item.paymentStatus?.slice(1)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatDate(item.haltingDate)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <button
                            onClick={() => handlePayment(item)}
                            disabled={item.haltingBalance <= 0}
                            className={`inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded-md shadow-sm text-white ${
                              item.haltingBalance > 0
                                ? 'bg-blue-600 hover:bg-blue-700 focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'
                                : 'bg-gray-400 cursor-not-allowed'
                            }`}
                          >
                            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                            </svg>
                            {item.haltingBalance > 0 ? 'Payment' : 'Paid'}
                          </button>
                        </td>
                      </tr>

                      {/* Expanded Row - Transaction Details */}
                      {expandedRows.includes(item.id) && (
                        <tr className="bg-gray-50">
                          <td colSpan="9" className="px-6 py-4">
                            <div className="border-l-4 border-blue-500 pl-4">
                              <h3 className="text-sm font-medium text-gray-900 mb-3">
                                Transaction History
                              </h3>
                              {item.haltingPayments && item.haltingPayments.length > 0 ? (
                                <div className="space-y-2">
                                  {item.haltingPayments.map((payment, index) => (
                                    <div key={index} className="bg-white p-3 rounded shadow-sm">
                                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                        <div>
                                          <p className="text-xs text-gray-500">Payment ID</p>
                                          <p className="text-sm font-medium">#{payment.paymentId}</p>
                                        </div>
                                        <div>
                                          <p className="text-xs text-gray-500">Amount</p>
                                          <p className="text-sm font-medium text-green-600">
                                            {formatCurrency(payment.amount)}
                                          </p>
                                        </div>
                                        <div>
                                          <p className="text-xs text-gray-500">Payment Mode</p>
                                          <p className="text-sm capitalize">{payment.paymentMode}</p>
                                        </div>
                                        <div>
                                          <p className="text-xs text-gray-500">Payment Type</p>
                                          <p className="text-sm">{payment.paymentType}</p>
                                        </div>
                                        <div>
                                          <p className="text-xs text-gray-500">Date</p>
                                          <p className="text-sm">{formatDate(payment.paymentDate)}</p>
                                        </div>
                                        {payment.utrNo && (
                                          <div>
                                            <p className="text-xs text-gray-500">UTR No.</p>
                                            <p className="text-sm">{payment.utrNo}</p>
                                          </div>
                                        )}
                                        {payment.bankName && (
                                          <div>
                                            <p className="text-xs text-gray-500">Bank</p>
                                            <p className="text-sm">{payment.bankName}</p>
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <p className="text-sm text-gray-500">No transactions found</p>
                              )}
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
            </div>

            {/* No Data Message */}
            {haltingData.length === 0 && !loading && (
              <div className="text-center py-12">
                <p className="text-gray-500">No halting records found</p>
              </div>
            )}

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <div className="px-6 py-4 bg-white border-t border-gray-200 flex items-center justify-between">
                <div className="text-sm text-gray-700">
                  Showing <span className="font-medium">{(pagination.current - 1) * pagination.limit + 1}</span> to{' '}
                  <span className="font-medium">
                    {Math.min(pagination.current * pagination.limit, pagination.total)}
                  </span>{' '}
                  of <span className="font-medium">{pagination.total}</span> results
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => fetchHaltingData(pagination.current - 1)}
                    disabled={pagination.current === 1}
                    className={`px-3 py-1 rounded-md ${
                      pagination.current === 1
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'
                    }`}
                  >
                    Previous
                  </button>
                  {[...Array(pagination.totalPages)].map((_, index) => (
                    <button
                      key={index + 1}
                      onClick={() => fetchHaltingData(index + 1)}
                      className={`px-3 py-1 rounded-md ${
                        pagination.current === index + 1
                          ? 'bg-blue-600 text-white'
                          : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'
                      }`}
                    >
                      {index + 1}
                    </button>
                  ))}
                  <button
                    onClick={() => fetchHaltingData(pagination.current + 1)}
                    disabled={pagination.current === pagination.totalPages}
                    className={`px-3 py-1 rounded-md ${
                      pagination.current === pagination.totalPages
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'
                    }`}
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Payment Modal */}
      {showPaymentModal && selectedHalting && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Make Payment for Halting #{selectedHalting.id}
              </h3>
              
              <div className="mb-4 p-3 bg-gray-50 rounded">
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <p className="text-gray-500">Truck No:</p>
                    <p className="font-medium">{selectedHalting.truck.truckNo}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Amount:</p>
                    <p className="font-medium">₹{selectedHalting.haltingAmount}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Paid:</p>
                    <p className="font-medium text-green-600">₹{selectedHalting.haltingPaid}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Balance:</p>
                    <p className="font-medium text-orange-600">₹{selectedHalting.haltingBalance}</p>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Amount *
                  </label>
                  <input
                    type="number"
                    name="amount"
                    value={paymentData.amount}
                    onChange={handlePaymentInputChange}
                    max={selectedHalting.haltingBalance}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Payment Mode *
                  </label>
                  <select
                    name="paymentMode"
                    value={paymentData.paymentMode}
                    onChange={handlePaymentInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="cash">Cash</option>
                    <option value="bank">Bank Transfer</option>
                    <option value="cheque">Cheque</option>
                    <option value="upi">UPI</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Payment Date *
                  </label>
                  <input
                    type="date"
                    name="paymentDate"
                    value={paymentData.paymentDate}
                    onChange={handlePaymentInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                {paymentData.paymentMode !== 'cash' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      UTR/Reference No.
                    </label>
                    <input
                      type="text"
                      name="utrNo"
                      value={paymentData.utrNo}
                      onChange={handlePaymentInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                )}
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => {
                    setShowPaymentModal(false);
                    setSelectedHalting(null);
                  }}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                >
                  Cancel
                </button>
                <button
                  onClick={submitPayment}
                  disabled={paymentLoading || !paymentData.amount || parseFloat(paymentData.amount) <= 0}
                  className={`px-4 py-2 text-sm font-medium text-white rounded-md ${
                    paymentLoading || !paymentData.amount || parseFloat(paymentData.amount) <= 0
                      ? 'bg-gray-400 cursor-not-allowed'
                      : 'bg-blue-600 hover:bg-blue-700'
                  }`}
                >
                  {paymentLoading ? (
                    <span className="flex items-center">
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Processing...
                    </span>
                  ) : (
                    'Make Payment'
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

export default Halting;