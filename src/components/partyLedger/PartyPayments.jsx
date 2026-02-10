import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import {
    Search,
    ChevronDown,
    ChevronUp,
    Phone,
    User,
    DollarSign,
    Calendar,
    Truck,
    CreditCard,
    AlertCircle,
    CheckCircle,
    X,
    Plus,
    Receipt,
    Download,
    MoreVertical,
    ClipboardClock
} from 'lucide-react';
import { debounce } from 'lodash';
import * as XLSX from 'xlsx';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const PartyLedger = () => {
    const [parties, setParties] = useState([]);
    const [filteredParties, setFilteredParties] = useState([]);
    const [expandedRows, setExpandedRows] = useState([]);
    const [partyDetails, setPartyDetails] = useState({});
    const [loading, setLoading] = useState(true);
    const [loadingDetails, setLoadingDetails] = useState({});
    const [companyIdMap, setCompanyIdMap] = useState({});

    // Search and Filter states
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [fromDate, setFromDate] = useState('');
    const [toDate, setToDate] = useState('');

    // Payment Modal states
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [selectedBooking, setSelectedBooking] = useState(null);
    const [selectedParty, setSelectedParty] = useState(null);
    const [paymentForm, setPaymentForm] = useState({
        amount: '',
        date: new Date().toISOString().split('T')[0],
        mode: 'cash',
        type: 'Credit',
        utrNo: '',
        remarks: '',
        bankId: ''
    });
    const [processingPayment, setProcessingPayment] = useState(false);
    const [banks, setBanks] = useState([]);
    const [loadingBanks, setLoadingBanks] = useState(false);

    // Payment History Modal
    const [showPaymentHistory, setShowPaymentHistory] = useState(false);
    const [selectedPaymentHistory, setSelectedPaymentHistory] = useState([]);

    const API_URL = import.meta.env.VITE_API_BASE_URL;
    // Debounced search
    const debouncedFetchParties = useCallback(
        debounce(async (search, status, fromDate, toDate) => {
            try {
                setLoading(true);
                const params = new URLSearchParams();
                if (search) params.append('search', search);
                if (status !== 'all') params.append('status', status);
                if (fromDate) params.append('fromDate', fromDate);
                if (toDate) params.append('toDate', toDate);

                const response = await axios.get(`${API_URL}/ledger/party?${params.toString()}`);

                let partiesData = response.data.data;
                if (!Array.isArray(partiesData)) {
                    console.warn('API did not return an array. Converting to array...');
                    partiesData = [];
                }

                setParties(partiesData);
                setFilteredParties(partiesData);
                setLoading(false);
            } catch (error) {
                console.error('Error fetching parties:', error);
                setParties([]);
                setFilteredParties([]);
                setLoading(false);
                toast.error('Failed to load parties');
            }
        }, 500),
        []
    );

    // Fetch parties with filters
    useEffect(() => {
        debouncedFetchParties(searchTerm, statusFilter, fromDate, toDate);
    }, [searchTerm, statusFilter, fromDate, toDate, debouncedFetchParties]);

    // Fetch banks when payment mode is bank
    useEffect(() => {
        if (showPaymentModal && paymentForm.mode === 'bank' && selectedParty) {
            const companyId = companyIdMap[selectedParty.partyId];
            if (companyId) {
                fetchBanks(companyId);
            } else {
                // If companyId is not in map, try to fetch it from party details
                fetchCompanyIdForParty(selectedParty.partyId);
            }
        }
    }, [showPaymentModal, paymentForm.mode, selectedParty, companyIdMap]);

    const fetchCompanyIdForParty = async (partyId) => {
        try {
            const response = await axios.get(`${API_URL}/ledger/party-details/${partyId}`);
            const details = response.data;
            if (details.bookings && details.bookings.length > 0 && details.bookings[0].companyId) {
                setCompanyIdMap(prev => ({
                    ...prev,
                    [partyId]: details.bookings[0].companyId
                }));
                // Now fetch banks with the companyId
                fetchBanks(details.bookings[0].companyId);
            }
        } catch (error) {
            console.error('Error fetching companyId for party:', error);
            toast.error('Failed to load party details');
        }
    };

    const fetchBanks = async (companyId) => {
        try {
            setLoadingBanks(true);
            const response = await axios.get(`${API_URL}/bank/list?companyId=${companyId}`);
            if (response.data.success) {
                setBanks(response.data.data || []);
            }
        } catch (error) {
            console.error('Error fetching banks:', error);
            setBanks([]);
            toast.error('Failed to load banks');
        } finally {
            setLoadingBanks(false);
        }
    };

    const toggleRow = async (partyId) => {
        if (expandedRows.includes(partyId)) {
            setExpandedRows(expandedRows.filter(id => id !== partyId));
        } else {
            setExpandedRows([...expandedRows, partyId]);

            if (!partyDetails[partyId]) {
                try {
                    setLoadingDetails(prev => ({ ...prev, [partyId]: true }));
                    const response = await axios.get(`${API_URL}/ledger/party-details/${partyId}`);

                    let details = response.data;
                    if (!details || typeof details !== 'object') {
                        console.warn(`Invalid response for party ${partyId}:`, response.data);
                        details = { party: {}, summary: {}, bookings: [] };
                    }

                    // Store companyId from the first booking if available
                    if (details.bookings && details.bookings.length > 0 && details.bookings[0].companyId) {
                        setCompanyIdMap(prev => ({
                            ...prev,
                            [partyId]: details.bookings[0].companyId
                        }));
                    }

                    setPartyDetails(prev => ({ ...prev, [partyId]: details }));
                    setLoadingDetails(prev => ({ ...prev, [partyId]: false }));
                } catch (error) {
                    console.error(`Error fetching details for party ${partyId}:`, error);
                    setLoadingDetails(prev => ({ ...prev, [partyId]: false }));
                    toast.error('Failed to load party details');
                }
            }
        }
    };

    // Format currency
    const formatCurrency = (amount) => {
        if (!amount || isNaN(amount)) return '0';
        return new Intl.NumberFormat('en-IN', {
            maximumFractionDigits: 0,
        }).format(amount);
    };

    // Format date
    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        try {
            const date = new Date(dateString);
            return date.toLocaleDateString('en-IN', {
                day: '2-digit',
                month: 'short',
                year: 'numeric'
            });
        } catch (error) {
            console.error('Error formatting date:', error);
            return 'Invalid Date';
        }
    };

    // Open payment modal for party
    const handleOpenPartyPaymentModal = (party) => {
        setSelectedParty(party);
        setSelectedBooking(null);
        setPaymentForm({
            amount: party.balance > 0 ? party.balance.toString() : '',
            date: new Date().toISOString().split('T')[0],
            mode: 'cash',
            type: 'Credit',
            utrNo: '',
            remarks: `Payment for ${party.partyName}`,
            bankId: ''
        });
        setShowPaymentModal(true);
    };

    // Open payment modal for booking
    const handleOpenBookingPaymentModal = (booking, party) => {
        setSelectedBooking(booking);
        setSelectedParty(party);
        setPaymentForm({
            amount: (booking.balance > 0 ? booking.balance : 0).toString(),
            date: new Date().toISOString().split('T')[0],
            mode: 'cash',
            type: 'Credit',
            utrNo: '',
            remarks: `Payment for Booking #${booking.bookingId || ''}`,
            bankId: ''
        });
        setShowPaymentModal(true);
    };

    // Open payment history modal
    const handleOpenPaymentHistory = (partyId) => {
        const details = partyDetails[partyId];
        if (!details || !Array.isArray(details.bookings)) {
            toast.error('No payment history available');
            return;
        }

        const allPayments = getAllPayments(details.bookings);
        if (allPayments.length === 0) {
            toast.error('No payment history available');
            return;
        }

        setSelectedPaymentHistory(allPayments);
        setShowPaymentHistory(true);
    };

    // Handle payment submission
    const handlePaymentSubmit = async (e) => {
        e.preventDefault();
        if (!selectedParty) return;

        try {
            setProcessingPayment(true);
            const paymentData = {
                partyId: selectedParty.partyId,
                bookingId: selectedBooking?.bookingId || null,
                amount: parseFloat(paymentForm.amount) || 0,
                paymentDate: paymentForm.date,
                paymentMode: paymentForm.mode,
                paymentType: paymentForm.type,
                utrNo: paymentForm.utrNo || null,
                remarks: paymentForm.remarks,
                bankId: paymentForm.mode === 'bank' ? paymentForm.bankId : null
            };

            // Call make-payment API
            const response = await axios.post(`${API_URL}/ledger/party-partial-payment`, paymentData);

            if (response.data.success) {
                // Refresh parties data
                debouncedFetchParties(searchTerm, statusFilter, fromDate, toDate);

                // Refresh the specific party details
                if (selectedParty.partyId) {
                    try {
                        const detailsResponse = await axios.get(`${API_URL}/ledger/party-details/${selectedParty.partyId}`);
                        setPartyDetails(prev => ({
                            ...prev,
                            [selectedParty.partyId]: detailsResponse.data
                        }));
                    } catch (error) {
                        console.error('Error refreshing party details:', error);
                        // Remove from cache to force reload next time
                        setPartyDetails(prev => {
                            const newDetails = { ...prev };
                            delete newDetails[selectedParty.partyId];
                            return newDetails;
                        });
                    }
                }

                // Close modal and reset
                setShowPaymentModal(false);
                setSelectedBooking(null);
                setSelectedParty(null);
                setPaymentForm({
                    amount: '',
                    date: new Date().toISOString().split('T')[0],
                    mode: 'cash',
                    type: 'Credit',
                    utrNo: '',
                    remarks: '',
                    bankId: ''
                });

                toast.success('Payment processed successfully!');
            } else {
                throw new Error(response.data.message || 'Payment failed');
            }

        } catch (error) {
            console.error('Error processing payment:', error);
            toast.error(error.response?.data?.message || 'Failed to process payment. Please try again.');
        } finally {
            setProcessingPayment(false);
        }
    };

    // Export to Excel with detailed payment information
    const exportToExcel = () => {
        try {
            // Prepare detailed data for export
            const detailedData = [];

            filteredParties.forEach(party => {
                const details = partyDetails[party.partyId];

                // Add party summary row
                detailedData.push({
                    'Type': 'Party Summary',
                    'Party ID': party.partyId || '',
                    'Party Name': party.partyName || '',
                    'Phone': party.partyPhone || '',
                    'Total Freight': party.totalFreight || 0,
                    'Total Paid': party.totalPaid || 0,
                    'Balance': party.balance || 0,
                    'Status': (party.balance || 0) > 0 ? 'Pending' : (party.balance || 0) < 0 ? 'Overpaid' : 'Settled',
                    'Date': '',
                    'Payment Mode': '',
                    'Payment Type': '',
                    'UTR No': '',
                    'Remarks': '',
                    'Booking ID': '',
                    'Route': ''
                });

                // Add payment details if available
                if (details && Array.isArray(details.bookings)) {
                    details.bookings.forEach(booking => {
                        // Add booking summary
                        detailedData.push({
                            'Type': 'Booking Summary',
                            'Party ID': '',
                            'Party Name': '',
                            'Phone': '',
                            'Total Freight': booking.freight || 0,
                            'Total Paid': booking.paid || 0,
                            'Balance': booking.balance || 0,
                            'Status': '',
                            'Date': formatDate(booking.bookingDate),
                            'Payment Mode': '',
                            'Payment Type': '',
                            'UTR No': '',
                            'Remarks': '',
                            'Booking ID': booking.bookingId || '',
                            'Route': `${booking.from || ''} → ${booking.to || ''}`
                        });

                        // Add individual payments for this booking
                        if (Array.isArray(booking.payments) && booking.payments.length > 0) {
                            booking.payments.forEach(payment => {
                                detailedData.push({
                                    'Type': 'Payment',
                                    'Party ID': '',
                                    'Party Name': '',
                                    'Phone': '',
                                    'Total Freight': '',
                                    'Total Paid': payment.amount || 0,
                                    'Balance': payment.runningBalance || 0,
                                    'Status': '',
                                    'Date': formatDate(payment.date),
                                    'Payment Mode': payment.mode || '',
                                    'Payment Type': payment.type || '',
                                    'UTR No': payment.utrNo || '',
                                    'Remarks': payment.remarks || '',
                                    'Booking ID': booking.bookingId || '',
                                    'Route': ''
                                });
                            });
                        }
                    });
                }

                // Add separator row between parties
                detailedData.push({});
            });

            // Create worksheet
            const ws = XLSX.utils.json_to_sheet(detailedData, {
                skipHeader: false,
                header: [
                    'Type', 'Party ID', 'Party Name', 'Phone',
                    'Total Freight', 'Total Paid', 'Balance', 'Status',
                    'Date', 'Payment Mode', 'Payment Type', 'UTR No',
                    'Remarks', 'Booking ID', 'Route'
                ]
            });

            // Set column widths
            const wscols = [
                { wch: 15 }, // Type
                { wch: 10 }, // Party ID
                { wch: 25 }, // Party Name
                { wch: 15 }, // Phone
                { wch: 15 }, // Total Freight
                { wch: 12 }, // Total Paid
                { wch: 12 }, // Balance
                { wch: 12 }, // Status
                { wch: 12 }, // Date
                { wch: 12 }, // Payment Mode
                { wch: 12 }, // Payment Type
                { wch: 15 }, // UTR No
                { wch: 25 }, // Remarks
                { wch: 12 }, // Booking ID
                { wch: 20 }  // Route
            ];
            ws['!cols'] = wscols;

            // Create workbook and add worksheet
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, 'Party Ledger Details');

            // Generate filename with current date
            const dateStr = new Date().toISOString().split('T')[0];
            XLSX.writeFile(wb, `Party_Ledger_Detailed_${dateStr}.xlsx`);

            toast.success('Excel file exported successfully!');
        } catch (error) {
            console.error('Error exporting to Excel:', error);
            toast.error('Failed to export Excel file');
        }
    };

    // Reset all filters
    const resetFilters = () => {
        setSearchTerm('');
        setStatusFilter('all');
        setFromDate('');
        setToDate('');
    };

    // Calculate total payments from all bookings
    const getAllPayments = (bookings) => {
        if (!Array.isArray(bookings)) return [];
        return bookings.flatMap(booking => {
            const bookingPayments = booking.payments || [];
            return bookingPayments.map(payment => ({
                ...payment,
                bookingId: booking.bookingId,
                from: booking.from,
                to: booking.to,
                bookingDate: booking.bookingDate
            }));
        }).sort((a, b) => new Date(b.date) - new Date(a.date));
    };

    // Safe calculations for statistics
    const totalBalance = Array.isArray(parties)
        ? parties.reduce((sum, party) => sum + (parseFloat(party.balance) || 0), 0)
        : 0;

    const pendingPartiesCount = Array.isArray(parties)
        ? parties.filter(p => (parseFloat(p.balance) || 0) > 0).length
        : 0;

    const settledPartiesCount = Array.isArray(parties)
        ? parties.filter(p => (parseFloat(p.balance) || 0) === 0).length
        : 0;

    // Check if party has payment history
    const hasPaymentHistory = (partyId) => {
        const details = partyDetails[partyId];
        if (!details || !Array.isArray(details.bookings)) return false;
        return getAllPayments(details.bookings).length > 0;
    };

    return (
        <div className="min-h-screen bg-gray-50 p-4 md:p-6">
            {/* Header */}
            <div className="mb-8">
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-3xl md:text-4xl font-bold text-gray-800 mb-2">
                            Party Ledger
                        </h1>
                        <p className="text-gray-600">
                            Track freight, payments, and balances for all parties
                        </p>
                    </div>
                    <button
                        onClick={exportToExcel}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2"
                    >
                        <Download className="w-4 h-4" />
                        <span>Export to Excel</span>
                    </button>
                </div>
            </div>

            {/* Search and Filter Bar */}
            <div className="bg-white rounded-lg shadow-sm p-4 md:p-6 mb-6 border border-gray-200">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                    <div className="flex-1">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                            <input
                                type="text"
                                placeholder="Search by party name..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                            />
                        </div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-sm"
                        >
                            <option value="all">All Status</option>
                            <option value="pending">Pending</option>
                            <option value="settled">Settled</option>
                            <option value="overpaid">Overpaid</option>
                        </select>

                        <input
                            type="date"
                            value={fromDate}
                            onChange={(e) => setFromDate(e.target.value)}
                            className="px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-sm"
                            placeholder="From Date"
                        />

                        <input
                            type="date"
                            value={toDate}
                            onChange={(e) => setToDate(e.target.value)}
                            className="px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-sm"
                            placeholder="To Date"
                        />

                        <button
                            onClick={resetFilters}
                            className="px-3 py-2.5 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm"
                        >
                            Clear
                        </button>
                    </div>
                </div>

                {/* Stats Summary */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="bg-white p-4 rounded-lg border border-gray-200">
                        <div className="flex items-center">
                            <div className="p-2 bg-blue-100 rounded-lg mr-3">
                                <User className="w-5 h-5 text-blue-600" />
                            </div>
                            <div>
                                <p className="text-sm text-gray-600">Total Parties</p>
                                <p className="text-lg font-bold text-gray-800">
                                    {Array.isArray(parties) ? parties.length : 0}
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white p-4 rounded-lg border border-gray-200">
                        <div className="flex items-center">
                            <div className="p-2 bg-green-100 rounded-lg mr-3">
                                <DollarSign className="w-5 h-5 text-green-600" />
                            </div>
                            <div>
                                <p className="text-sm text-gray-600">Total Balance</p>
                                <p className="text-lg font-bold text-gray-800">
                                    ₹{formatCurrency(totalBalance)}
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white p-4 rounded-lg border border-gray-200">
                        <div className="flex items-center">
                            <div className="p-2 bg-orange-100 rounded-lg mr-3">
                                <AlertCircle className="w-5 h-5 text-orange-600" />
                            </div>
                            <div>
                                <p className="text-sm text-gray-600">Pending Parties</p>
                                <p className="text-lg font-bold text-gray-800">
                                    {pendingPartiesCount}
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white p-4 rounded-lg border border-gray-200">
                        <div className="flex items-center">
                            <div className="p-2 bg-purple-100 rounded-lg mr-3">
                                <CreditCard className="w-5 h-5 text-purple-600" />
                            </div>
                            <div>
                                <p className="text-sm text-gray-600">Settled Parties</p>
                                <p className="text-lg font-bold text-gray-800">
                                    {settledPartiesCount}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Table */}
            <div className="bg-white rounded-lg shadow-sm overflow-hidden border border-gray-200">
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-20">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mb-3"></div>
                        <p className="text-gray-600 text-sm">Loading party data...</p>
                    </div>
                ) : (
                    <>
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-gray-50 border-b border-gray-200">
                                    <tr>
                                        <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Party Details</th>
                                        <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Truck(s)</th>   {/* ← new column */}
                                        <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Freight</th>
                                        <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Paid</th>
                                        <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Balance</th>
                                        <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                        <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200">
                                    {Array.isArray(filteredParties) && filteredParties.map((party) => {
                                        const isExpanded = expandedRows.includes(party.partyId);
                                        const details = partyDetails[party.partyId];
                                        const isLoading = loadingDetails[party.partyId];
                                        const hasHistory = hasPaymentHistory(party.partyId);

                                        return (
                                            <React.Fragment key={party.partyId}>
                                                <tr className={`hover:bg-gray-50 ${isExpanded ? 'bg-blue-50' : ''}`}>
                                                    <td className="py-3 px-4">
                                                        <div className="flex items-center space-x-2">
                                                            <button
                                                                onClick={() => toggleRow(party.partyId)}
                                                                className="p-1 hover:bg-gray-200 rounded transition-colors"
                                                            >
                                                                {isExpanded ? (
                                                                    <ChevronUp className="w-4 h-4 text-blue-600" />
                                                                ) : (
                                                                    <ChevronDown className="w-4 h-4 text-gray-500" />
                                                                )}
                                                            </button>
                                                            <div>
                                                                <p className="font-medium text-gray-900">
                                                                    {party.partyName || 'Unknown Party'}
                                                                </p>
                                                                <p className="text-xs text-gray-500">Phone: {party.partyPhone || 'N/A'}</p>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="py-3 px-4 text-xs font-medium text-gray-700">
                                                        {party.bookings && party.bookings.length > 0
                                                            ? [...new Set(party.bookings.map(b => b.truck?.truckNo || 'N/A'))].join(', ')
                                                            : '—'}
                                                    </td>
                                                    <td className="py-3 px-4">
                                                        <div className="text-sm font-medium text-orange-700">
                                                            ₹{formatCurrency(party.totalFreight)}
                                                        </div>
                                                    </td>
                                                    <td className="py-3 px-4">
                                                        <div className="text-sm font-medium text-green-700">
                                                            ₹{formatCurrency(party.totalPaid)}
                                                        </div>
                                                    </td>
                                                    <td className="py-3 px-4">
                                                        <div className={`text-sm font-bold ${(party.balance || 0) > 0 ? 'text-red-700' :
                                                            (party.balance || 0) < 0 ? 'text-purple-700' :
                                                                'text-gray-700'
                                                            }`}>
                                                            ₹{formatCurrency(party.balance)}
                                                        </div>
                                                    </td>
                                                    <td className="py-3 px-4">
                                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${(party.balance || 0) > 0 ? 'bg-red-100 text-red-800' :
                                                            (party.balance || 0) < 0 ? 'bg-purple-100 text-purple-800' :
                                                                'bg-green-100 text-green-800'
                                                            }`}>
                                                            {(party.balance || 0) > 0 ? 'Pending' :
                                                                (party.balance || 0) < 0 ? 'Overpaid' : 'Settled'}
                                                        </span>
                                                    </td>
                                                    <td className="py-3 px-4">
                                                        <div className="flex space-x-2">
                                                            <button
                                                                onClick={() => handleOpenPaymentHistory(party.partyId)}
                                                                disabled={!hasHistory}
                                                                className={`px-3 py-1.5 text-xs rounded flex items-center space-x-1 ${hasHistory
                                                                    ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                                                    : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                                                    }`}
                                                            >
                                                                <ClipboardClock className="w-4 h-4 mr-2 text-blue-600" />
                                                                <span>View History</span>
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>

                                                {/* Expanded Details Row */}
                                                {isExpanded && (
                                                    <tr>
                                                        <td colSpan="12" className="p-0">
                                                            <div className="p-4 bg-gray-50 border-t border-gray-200">
                                                                {isLoading ? (
                                                                    <div className="flex items-center justify-center py-8">
                                                                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500 mr-3"></div>
                                                                        <p className="text-gray-600 text-sm">Loading party details...</p>
                                                                    </div>
                                                                ) : details ? (
                                                                    <div className="max-w-full ">
                                                                        {/* Bookings Section */}
                                                                        <div>
                                                                            <h3 className="text-sm font-medium text-gray-900 mb-3 flex items-center">
                                                                                <Calendar className="w-4 h-4 mr-2 text-blue-600" />
                                                                                Booking History ({Array.isArray(details.bookings) ? details.bookings.length : 0})
                                                                            </h3>

                                                                            {Array.isArray(details.bookings) && details.bookings.length > 0 ? (
                                                                                <div className="space-y-3">
                                                                                    {details.bookings.map((booking, index) => {
                                                                                        const bookingPayments = Array.isArray(booking.payments) ? booking.payments : [];

                                                                                        return (
                                                                                            <div key={booking.bookingId || index}
                                                                                                className="bg-white border border-gray-200 rounded overflow-hidden">
                                                                                                <div className="p-4">
                                                                                                    {/* Booking Header */}
                                                                                                    <div className="flex flex-wrap justify-between items-start mb-4 pb-3 border-b border-gray-200">
                                                                                                        <div className="flex flex-col sm:flex-row sm:items-center gap-3 flex-wrap">
                                                                                                            <div className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs font-medium">
                                                                                                                Booking Ref. #{booking.bookingId || 'N/A'}
                                                                                                            </div>

                                                                                                            <div className="flex items-center gap-4 text-xs text-gray-700">
                                                                                                                <div className="flex items-center">
                                                                                                                    <Calendar className="w-3.5 h-3.5 mr-1.5 text-gray-500" />
                                                                                                                    {formatDate(booking.bookingDate || booking.date)}
                                                                                                                </div>
                                                                                                                <div className="text-xs text-gray-700 flex items-center">
                                                                                                                    <span className="font-medium mr-1.5">Route:</span>
                                                                                                                    {booking.from || '—'} → {booking.to || '—'}
                                                                                                                </div>

                                                                                                                <div className="flex items-center">
                                                                                                                    <Truck className="w-3.5 h-3.5 mr-1.5 text-gray-600" />
                                                                                                                    <span className="font-medium">
                                                                                                                        {booking?.truck?.truckNo || party.bookings?.find(b => b.bookingId === booking.bookingId)?.truck?.truckNo || 'No truck assigned'}
                                                                                                                    </span>
                                                                                                                </div>
                                                                                                            </div>


                                                                                                        </div>
                                                                                                    </div>

                                                                                                    {/* Booking Financials */}
                                                                                                    <div className="grid grid-cols-3 gap-3 mb-4">
                                                                                                        <div className="text-center p-3 bg-orange-50 rounded">
                                                                                                            <p className="text-xs text-gray-600 mb-1">Freight</p>
                                                                                                            <p className="text-sm font-bold text-orange-700">
                                                                                                                ₹{formatCurrency(booking.freight)}
                                                                                                            </p>
                                                                                                        </div>
                                                                                                        <div className="text-center p-3 bg-green-50 rounded">
                                                                                                            <p className="text-xs text-gray-600 mb-1">Paid</p>
                                                                                                            <p className="text-sm font-bold text-green-700">
                                                                                                                ₹{formatCurrency(booking.paid)}
                                                                                                            </p>
                                                                                                        </div>
                                                                                                        <div className={`text-center p-3 rounded ${(booking.balance || 0) > 0 ? 'bg-red-50' :
                                                                                                            (booking.balance || 0) < 0 ? 'bg-purple-50' :
                                                                                                                'bg-gray-50'
                                                                                                            }`}>
                                                                                                            <p className="text-xs text-gray-600 mb-1">Balance</p>
                                                                                                            <p className={`text-sm font-bold ${(booking.balance || 0) > 0 ? 'text-red-700' :
                                                                                                                (booking.balance || 0) < 0 ? 'text-purple-700' :
                                                                                                                    'text-gray-700'
                                                                                                                }`}>
                                                                                                                ₹{formatCurrency(booking.balance)}
                                                                                                            </p>
                                                                                                        </div>
                                                                                                    </div>

                                                                                                    {/* Payment Action */}
                                                                                                    {(booking.balance || 0) > 0 && (
                                                                                                        <div className="mb-4">
                                                                                                            <button
                                                                                                                onClick={() => handleOpenBookingPaymentModal(booking, party)}
                                                                                                                className="w-full px-4 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 flex items-center justify-center space-x-2"
                                                                                                            >
                                                                                                                <CreditCard className="w-4 h-4" />
                                                                                                                <span>Add Payment for This Booking</span>
                                                                                                            </button>
                                                                                                        </div>
                                                                                                    )}

                                                                                                    {/* Payment Details */}
                                                                                                    {bookingPayments.length > 0 && (
                                                                                                        <div>
                                                                                                            <h4 className="text-xs font-medium text-gray-700 mb-2">Payment Entries ({bookingPayments.length})</h4>
                                                                                                            <div className="overflow-x-auto">
                                                                                                                <table className="w-full text-xs">
                                                                                                                    <thead>
                                                                                                                        <tr className="bg-gray-100">
                                                                                                                            <th className="py-2 px-3 text-left">Date</th>
                                                                                                                            <th className="py-2 px-3 text-left">Amount</th>
                                                                                                                            <th className="py-2 px-3 text-left">Payment Mode</th>
                                                                                                                            <th className="py-2 px-3 text-left">Payment Type</th>
                                                                                                                            <th className="py-2 px-3 text-left">UTR No</th>
                                                                                                                            <th className="py-2 px-3 text-left">Remarks</th>
                                                                                                                            <th className="py-2 px-3 text-left">Balance After</th>
                                                                                                                        </tr>
                                                                                                                    </thead>
                                                                                                                    <tbody>
                                                                                                                        {bookingPayments.map((payment, pIndex) => (
                                                                                                                            <tr key={payment.paymentId || pIndex}
                                                                                                                                className="border-t border-gray-200">
                                                                                                                                <td className="py-2 px-3">{formatDate(payment.date)}</td>
                                                                                                                                <td className="py-2 px-3 font-medium">
                                                                                                                                    ₹{formatCurrency(payment.amount)}
                                                                                                                                </td>
                                                                                                                                <td className="py-2 px-3">
                                                                                                                                    <span className={`px-2 py-1 rounded text-xs ${payment.mode === 'cash' ? 'bg-green-100 text-green-800' :
                                                                                                                                        payment.mode === 'bank' ? 'bg-blue-100 text-blue-800' :
                                                                                                                                            'bg-yellow-100 text-yellow-800'
                                                                                                                                        }`}>
                                                                                                                                        {payment.mode || 'N/A'}
                                                                                                                                    </span>
                                                                                                                                </td>
                                                                                                                                <td className="py-2 px-3">
                                                                                                                                    <span className={`px-2 py-1 rounded text-xs ${payment.mode === 'cash' ? 'bg-green-100 text-green-800' :
                                                                                                                                        payment.mode === 'bank' ? 'bg-blue-100 text-blue-800' :
                                                                                                                                            'bg-yellow-100 text-yellow-800'
                                                                                                                                        }`}>
                                                                                                                                        {payment.type || 'N/A'}
                                                                                                                                    </span>
                                                                                                                                </td>
                                                                                                                                <td className="py-2 px-3">
                                                                                                                                    {payment.utrNo || '-'}
                                                                                                                                </td>
                                                                                                                                <td className="py-2 px-3 text-gray-600">
                                                                                                                                    {payment.remarks || '-'}
                                                                                                                                </td>
                                                                                                                                <td className="py-2 px-3 font-medium">
                                                                                                                                    ₹{formatCurrency(payment.runningBalance)}
                                                                                                                                </td>
                                                                                                                            </tr>
                                                                                                                        ))}
                                                                                                                    </tbody>
                                                                                                                </table>
                                                                                                            </div>
                                                                                                        </div>
                                                                                                    )}
                                                                                                </div>
                                                                                            </div>
                                                                                        );
                                                                                    })}
                                                                                </div>
                                                                            ) : (
                                                                                <div className="text-center py-8 bg-gray-50 rounded border border-gray-200">
                                                                                    <Calendar className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                                                                                    <p className="text-gray-600 text-sm">No booking history available</p>
                                                                                </div>
                                                                            )}
                                                                        </div>
                                                                    </div>
                                                                ) : (
                                                                    <div className="text-center py-8">
                                                                        <AlertCircle className="w-8 h-8 text-red-400 mx-auto mb-2" />
                                                                        <p className="text-gray-600 text-sm">Failed to load party details</p>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </td>
                                                    </tr>
                                                )}
                                            </React.Fragment>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>

                        {/* Empty State */}
                        {(!Array.isArray(filteredParties) || filteredParties.length === 0) && !loading && (
                            <div className="text-center py-16">
                                <User className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                                <h3 className="text-lg font-medium text-gray-700 mb-1">No Parties Found</h3>
                                <p className="text-gray-600 text-sm mb-4">No parties match your search criteria</p>
                                <button
                                    onClick={resetFilters}
                                    className="px-4 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
                                >
                                    Clear Filters
                                </button>
                            </div>
                        )}
                    </>
                )}
            </div>

            {/* Payment Modal */}
            {showPaymentModal && selectedParty && (
                <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-lg shadow-lg max-w-md w-full">
                        {/* Modal Header */}
                        <div className="p-4 border-b border-gray-200">
                            <div className="flex justify-between items-center">
                                <div>
                                    <h2 className="text-lg font-medium text-gray-900">Add Payment Entry</h2>
                                    <p className="text-sm text-gray-600 mt-1">
                                        {selectedParty.partyName} • {selectedBooking ? `Booking #${selectedBooking.bookingId}` : 'General Payment'}
                                    </p>
                                </div>
                                <button
                                    onClick={() => setShowPaymentModal(false)}
                                    className="p-1 hover:bg-gray-100 rounded"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                        </div>

                        {/* Modal Body */}
                        <form onSubmit={handlePaymentSubmit} className="p-4">
                            <div className="space-y-4">
                                {/* Payment Info */}
                                <div className="bg-blue-50 p-3 rounded border border-blue-200">
                                    <div className="grid grid-cols-2 gap-3 text-sm">
                                        <div>
                                            <p className="text-gray-600">Current Pending Balance</p>
                                            <p className="font-bold text-red-700">
                                                ₹{formatCurrency(selectedBooking ? (selectedBooking.balance || 0) : (selectedParty.balance || 0))}
                                            </p>
                                        </div>
                                        {selectedBooking && (
                                            <div>
                                                <p className="text-gray-600">Total Booking Freight</p>
                                                <p className="font-bold text-orange-700">
                                                    ₹{formatCurrency(selectedBooking.freight)}
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Payment Form */}
                                <div className="space-y-3">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Amount (₹) *
                                        </label>
                                        <input
                                            type="number"
                                            required
                                            min="1"
                                            max={selectedBooking ? (selectedBooking.balance || 0) : (selectedParty.balance || 0)}
                                            value={paymentForm.amount}
                                            onChange={(e) => setPaymentForm({ ...paymentForm, amount: e.target.value })}
                                            className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-sm"
                                            placeholder="Enter amount"
                                        />
                                        <p className="text-xs text-gray-500 mt-1">
                                            Maximum: ₹{formatCurrency(selectedBooking ? (selectedBooking.balance || 0) : (selectedParty.balance || 0))}
                                        </p>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Payment Date *
                                        </label>
                                        <input
                                            type="date"
                                            required
                                            value={paymentForm.date}
                                            onChange={(e) => setPaymentForm({ ...paymentForm, date: e.target.value })}
                                            className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-sm"
                                        />
                                    </div>

                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Payment Mode *
                                            </label>
                                            <select
                                                value={paymentForm.mode}
                                                onChange={(e) => setPaymentForm({ ...paymentForm, mode: e.target.value })}
                                                className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-sm"
                                            >
                                                <option value="cash">Cash</option>
                                                <option value="bank">Bank</option>
                                            </select>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Payment Type *
                                            </label>
                                            <select
                                                value={paymentForm.type}
                                                onChange={(e) => setPaymentForm({ ...paymentForm, type: e.target.value })}
                                                className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-sm"
                                            >
                                                <option value="Credit">Credit</option>
                                                <option value="Debit">Debit</option>
                                            </select>
                                        </div>
                                    </div>

                                    {paymentForm.mode === 'bank' && (
                                        <>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                                    Select Bank *
                                                </label>
                                                {loadingBanks ? (
                                                    <div className="flex items-center justify-center py-2">
                                                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500 mr-2"></div>
                                                        <span className="text-sm text-gray-600">Loading banks...</span>
                                                    </div>
                                                ) : banks.length > 0 ? (
                                                    <select
                                                        required
                                                        value={paymentForm.bankId}
                                                        onChange={(e) => setPaymentForm({ ...paymentForm, bankId: e.target.value })}
                                                        className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-sm"
                                                    >
                                                        <option value="">Select a bank</option>
                                                        {banks.map((bank) => (
                                                            <option key={bank.id} value={bank.id}>
                                                                {bank.acHolderName} - {bank.accountNo} {bank.isPrimary && '(Primary)'}
                                                            </option>
                                                        ))}
                                                    </select>
                                                ) : (
                                                    <p className="text-sm text-red-600">No banks found. Please add banks first.</p>
                                                )}
                                            </div>

                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                                    UTR/Reference Number
                                                </label>
                                                <input
                                                    type="text"
                                                    value={paymentForm.utrNo}
                                                    onChange={(e) => setPaymentForm({ ...paymentForm, utrNo: e.target.value })}
                                                    className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-sm"
                                                    placeholder="Enter UTR/Reference"
                                                />
                                            </div>
                                        </>
                                    )}

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Remarks
                                        </label>
                                        <textarea
                                            value={paymentForm.remarks}
                                            onChange={(e) => setPaymentForm({ ...paymentForm, remarks: e.target.value })}
                                            rows="2"
                                            className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-sm"
                                            placeholder="Add remarks..."
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Modal Footer */}
                            <div className="flex justify-end space-x-2 mt-6 pt-4 border-t border-gray-200">
                                <button
                                    type="button"
                                    onClick={() => setShowPaymentModal(false)}
                                    className="px-4 py-2 border border-gray-300 text-gray-700 text-sm rounded hover:bg-gray-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={processingPayment || (paymentForm.mode === 'bank' && !paymentForm.bankId)}
                                    className="px-4 py-2 bg-green-600 text-white text-sm rounded hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-1"
                                >
                                    {processingPayment ? (
                                        <>
                                            <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div>
                                            <span>Processing...</span>
                                        </>
                                    ) : (
                                        <>
                                            <CheckCircle className="w-4 h-4" />
                                            <span>Submit Payment</span>
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Payment History Modal */}
            {showPaymentHistory && (
                <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-lg shadow-lg max-w-4xl w-full max-h-[90vh] overflow-hidden">
                        {/* Modal Header */}
                        <div className="p-4 border-b border-gray-200">
                            <div className="flex justify-between items-center">
                                <div>
                                    <h2 className="text-lg font-medium text-gray-900">Payment History</h2>
                                    <p className="text-sm text-gray-600 mt-1">
                                        All payment entries ({Array.isArray(selectedPaymentHistory) ? selectedPaymentHistory.length : 0})
                                    </p>
                                </div>
                                <button
                                    onClick={() => setShowPaymentHistory(false)}
                                    className="p-1 hover:bg-gray-100 rounded"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                        </div>

                        {/* Modal Body */}
                        <div className="p-4 overflow-y-auto max-h-[calc(90vh-120px)]">
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="bg-gray-100">
                                            <th className="py-2 px-3 text-left">Date</th>
                                            <th className="py-2 px-3 text-left">Booking ID</th>
                                            <th className="py-2 px-3 text-left">Route</th>
                                            <th className="py-2 px-3 text-left">Amount</th>
                                            <th className="py-2 px-3 text-left">Mode</th>
                                            <th className="py-2 px-3 text-left">Type</th>
                                            <th className="py-2 px-3 text-left">UTR No</th>
                                            <th className="py-2 px-3 text-left">Remarks</th>
                                            <th className="py-2 px-3 text-left">Balance</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {Array.isArray(selectedPaymentHistory) && selectedPaymentHistory.map((payment, index) => (
                                            <tr key={payment.paymentId || index}
                                                className="border-t border-gray-200 hover:bg-gray-50">
                                                <td className="py-2 px-3">{formatDate(payment.date)}</td>
                                                <td className="py-2 px-3">
                                                    {payment.bookingId ? `#${payment.bookingId}` : '-'}
                                                </td>
                                                <td className="py-2 px-3">
                                                    {payment.from && payment.to ? `${payment.from} → ${payment.to}` : '-'}
                                                </td>
                                                <td className="py-2 px-3 font-medium">
                                                    ₹{formatCurrency(payment.amount)}
                                                </td>
                                                <td className="py-2 px-3">
                                                    <span className={`px-2 py-1 rounded text-xs ${payment.mode === 'cash' ? 'bg-green-100 text-green-800' :
                                                        payment.mode === 'bank' ? 'bg-blue-100 text-blue-800' :
                                                            'bg-yellow-100 text-yellow-800'
                                                        }`}>
                                                        {payment.mode || 'N/A'}
                                                    </span>
                                                </td>
                                                <td className="py-2 px-3">
                                                    <span className={`px-2 py-1 rounded text-xs ${payment.type === 'Credit' ? 'bg-green-100 text-green-800' :
                                                        'bg-red-100 text-red-800'
                                                        }`}>
                                                        {payment.type || 'N/A'}
                                                    </span>
                                                </td>
                                                <td className="py-2 px-3">
                                                    {payment.utrNo || '-'}
                                                </td>
                                                <td className="py-2 px-3 text-gray-600 max-w-xs truncate">
                                                    {payment.remarks || '-'}
                                                </td>
                                                <td className="py-2 px-3 font-medium">
                                                    ₹{formatCurrency(payment.runningBalance)}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {(!Array.isArray(selectedPaymentHistory) || selectedPaymentHistory.length === 0) && (
                                <div className="text-center py-8">
                                    <Receipt className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                                    <p className="text-gray-600 text-sm">No payment history available</p>
                                </div>
                            )}
                        </div>

                        {/* Modal Footer */}
                        <div className="p-4 border-t border-gray-200">
                            <div className="flex justify-end">
                                <button
                                    onClick={() => setShowPaymentHistory(false)}
                                    className="px-4 py-2 bg-gray-600 text-white text-sm rounded hover:bg-gray-700"
                                >
                                    Close
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PartyLedger;