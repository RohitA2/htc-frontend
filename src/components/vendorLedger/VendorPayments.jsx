import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import {
    Search,
    ChevronDown,
    ChevronUp,
    Truck,
    User,
    DollarSign,
    Calendar,
    CreditCard,
    AlertCircle,
    CheckCircle,
    X,
    Plus,
    Receipt,
    Download,
    ClipboardClock,
    Package,
    Wallet,
    Percent,
    HandCoins
} from 'lucide-react';
import { FcPaid } from "react-icons/fc";
import { debounce } from 'lodash';
import * as XLSX from 'xlsx';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';


const VendorLedger = () => {
    const [trucks, setTrucks] = useState([]);
    const [filteredTrucks, setFilteredTrucks] = useState([]);
    const [expandedRows, setExpandedRows] = useState([]);
    const [truckDetails, setTruckDetails] = useState({});
    const [loading, setLoading] = useState(true);
    const [loadingDetails, setLoadingDetails] = useState({});

    // Search and Filter states
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [fromDate, setFromDate] = useState('');
    const [toDate, setToDate] = useState('');

    // Payment Modal states
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [selectedBooking, setSelectedBooking] = useState(null);
    const [selectedTruck, setSelectedTruck] = useState(null);
    const [paymentForm, setPaymentForm] = useState({
        amount: '',
        date: new Date().toISOString().split('T')[0],
        mode: 'cash',
        type: 'Debit', // For vendor, it's usually debit (we pay them)
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
    const debouncedFetchTrucks = useCallback(
        debounce(async (search, status, fromDate, toDate) => {
            try {
                setLoading(true);
                const params = new URLSearchParams();
                if (search) params.append('search', search);
                if (status !== 'all') params.append('status', status);
                if (fromDate) params.append('fromDate', fromDate);
                if (toDate) params.append('toDate', toDate);

                const response = await axios.get(`${API_URL}/vendor/truck?${params.toString()}`);

                if (response.data.success) {
                    let trucksData = response.data.data;
                    if (!Array.isArray(trucksData)) {
                        console.warn('API did not return an array. Converting to array...');
                        trucksData = [];
                    }

                    setTrucks(trucksData);
                    setFilteredTrucks(trucksData);
                } else {
                    setTrucks([]);
                    setFilteredTrucks([]);
                }
                setLoading(false);
            } catch (error) {
                console.error('Error fetching trucks:', error);
                setTrucks([]);
                setFilteredTrucks([]);
                setLoading(false);
                toast.error('Failed to load vendor trucks');
            }
        }, 500),
        []
    );

    // Fetch trucks with filters
    useEffect(() => {
        debouncedFetchTrucks(searchTerm, statusFilter, fromDate, toDate);
    }, [searchTerm, statusFilter, fromDate, toDate, debouncedFetchTrucks]);

    // Fetch banks when payment mode is bank
    useEffect(() => {
        if (showPaymentModal && paymentForm.mode === 'bank') {
            fetchBanks();
        }
    }, [showPaymentModal, paymentForm.mode]);

    const fetchBanks = async () => {
        try {
            setLoadingBanks(true);
            const response = await axios.get(`${API_URL}/bank/list`);
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

    const toggleRow = async (truckId) => {
        if (expandedRows.includes(truckId)) {
            setExpandedRows(expandedRows.filter(id => id !== truckId));
        } else {
            setExpandedRows([...expandedRows, truckId]);

            if (!truckDetails[truckId]) {
                try {
                    setLoadingDetails(prev => ({ ...prev, [truckId]: true }));
                    const response = await axios.get(`${API_URL}/vendor/truck-details/${truckId}`);

                    if (response.data.success) {
                        setTruckDetails(prev => ({ ...prev, [truckId]: response.data }));
                    } else {
                        console.warn(`Invalid response for truck ${truckId}:`, response.data);
                        setTruckDetails(prev => ({
                            ...prev,
                            [truckId]: {
                                truck: {},
                                summary: {},
                                bookings: []
                            }
                        }));
                    }
                    setLoadingDetails(prev => ({ ...prev, [truckId]: false }));
                } catch (error) {
                    console.error(`Error fetching details for truck ${truckId}:`, error);
                    setLoadingDetails(prev => ({ ...prev, [truckId]: false }));
                    toast.error('Failed to load truck details');
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

    // Open payment modal for truck
    const handleOpenTruckPaymentModal = (truck) => {
        setSelectedTruck(truck);
        setSelectedBooking(null);
        setPaymentForm({
            amount: truck.balance > 0 ? truck.balance.toString() : '',
            date: new Date().toISOString().split('T')[0],
            mode: 'cash',
            type: 'Debit',
            utrNo: '',
            remarks: `Payment for Truck ${truck.truckNo}`,
            bankId: ''
        });
        setShowPaymentModal(true);
    };

    // Open payment modal for booking
    const handleOpenBookingPaymentModal = (booking, truck) => {
        setSelectedBooking(booking);
        setSelectedTruck(truck);
        setPaymentForm({
            amount: (booking.balance > 0 ? booking.balance : 0).toString(),
            date: new Date().toISOString().split('T')[0],
            mode: 'cash',
            type: 'Debit',
            utrNo: '',
            remarks: `Payment for Booking #${booking.bookingId || ''}`,
            bankId: ''
        });
        setShowPaymentModal(true);
    };

    // Open payment history modal
    const handleOpenPaymentHistory = (truckId) => {
        const details = truckDetails[truckId];
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
        if (!selectedTruck) return;

        try {
            setProcessingPayment(true);
            const paymentData = {
                truckId: selectedTruck.truckId,
                bookingId: selectedBooking?.bookingId || null,
                amount: parseFloat(paymentForm.amount) || 0,
                paymentDate: paymentForm.date,
                paymentMode: paymentForm.mode,
                paymentType: paymentForm.type,
                utrNo: paymentForm.utrNo || null,
                remarks: paymentForm.remarks,
                bankId: paymentForm.mode === 'bank' ? paymentForm.bankId : null
            };

            // Call truck-partial-payment API
            const response = await axios.post(`${API_URL}/vendor/truck-partial-payment`, paymentData);

            if (response.data.success) {
                // Refresh trucks data
                debouncedFetchTrucks(searchTerm, statusFilter, fromDate, toDate);

                // Refresh the specific truck details
                if (selectedTruck.truckId) {
                    try {
                        const detailsResponse = await axios.get(`${API_URL}/vendor/truck-details/${selectedTruck.truckId}`);
                        setTruckDetails(prev => ({
                            ...prev,
                            [selectedTruck.truckId]: detailsResponse.data
                        }));
                    } catch (error) {
                        console.error('Error refreshing truck details:', error);
                        // Remove from cache to force reload next time
                        setTruckDetails(prev => {
                            const newDetails = { ...prev };
                            delete newDetails[selectedTruck.truckId];
                            return newDetails;
                        });
                    }
                }

                // Close modal and reset
                setShowPaymentModal(false);
                setSelectedBooking(null);
                setSelectedTruck(null);
                setPaymentForm({
                    amount: '',
                    date: new Date().toISOString().split('T')[0],
                    mode: 'cash',
                    type: 'Debit',
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

            filteredTrucks.forEach(truck => {
                const details = truckDetails[truck.truckId];

                // Add truck summary row
                detailedData.push({
                    'Type': 'Truck Summary',
                    'Truck ID': truck.truckId || '',
                    'Truck No': truck.truckNo || '',
                    'Driver': details?.truck?.driver || '',
                    'Total Freight': truck.totalFreight || 0,
                    'Total Commission': truck.totalCommission || 0,
                    'Net Payable': truck.netPayable || 0,
                    'Total Paid': truck.totalPaid || 0,
                    'Balance': truck.balance || 0,
                    'Status': (truck.balance || 0) > 0 ? 'Pending' : (truck.balance || 0) < 0 ? 'Advance' : 'Settled',
                    'Date': '',
                    'Payment Mode': '',
                    'Payment Type': '',
                    'UTR No': '',
                    'Remarks': '',
                    'Booking ID': '',
                    'Route': ''
                });

                // Add booking details if available
                if (details && Array.isArray(details.bookings)) {
                    details.bookings.forEach(booking => {
                        // Add booking summary
                        detailedData.push({
                            'Type': 'Booking Summary',
                            'Truck ID': '',
                            'Truck No': '',
                            'Driver': '',
                            'Total Freight': booking.freight || 0,
                            'Total Commission': booking.commission || 0,
                            'Net Payable': booking.netAmount || 0,
                            'Total Paid': booking.paid || 0,
                            'Balance': booking.balance || 0,
                            'Status': '',
                            'Date': formatDate(booking.date),
                            'Payment Mode': '',
                            'Payment Type': '',
                            'UTR No': '',
                            'Remarks': '',
                            'Booking ID': booking.bookingId || '',
                            'Route': booking.route || ''
                        });

                        // Add individual payments for this booking
                        if (Array.isArray(booking.payments) && booking.payments.length > 0) {
                            booking.payments.forEach(payment => {
                                detailedData.push({
                                    'Type': 'Payment',
                                    'Truck ID': '',
                                    'Truck No': '',
                                    'Driver': '',
                                    'Total Freight': '',
                                    'Total Commission': '',
                                    'Net Payable': '',
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

                // Add separator row between trucks
                detailedData.push({});
            });

            // Create worksheet
            const ws = XLSX.utils.json_to_sheet(detailedData, {
                skipHeader: false,
                header: [
                    'Type', 'Truck ID', 'Truck No', 'Driver',
                    'Total Freight', 'Total Commission', 'Net Payable', 'Total Paid', 'Balance', 'Status',
                    'Date', 'Payment Mode', 'Payment Type', 'UTR No',
                    'Remarks', 'Booking ID', 'Route'
                ]
            });

            // Set column widths
            const wscols = [
                { wch: 15 }, // Type
                { wch: 10 }, // Truck ID
                { wch: 15 }, // Truck No
                { wch: 20 }, // Driver
                { wch: 15 }, // Total Freight
                { wch: 15 }, // Total Commission
                { wch: 15 }, // Net Payable
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
            XLSX.utils.book_append_sheet(wb, ws, 'Vendor Ledger Details');

            // Generate filename with current date
            const dateStr = new Date().toISOString().split('T')[0];
            XLSX.writeFile(wb, `Vendor_Ledger_Detailed_${dateStr}.xlsx`);

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
                route: booking.route,
                bookingDate: booking.date
            }));
        }).sort((a, b) => new Date(b.date) - new Date(a.date));
    };

    // Safe calculations for statistics
    const totalBalance = Array.isArray(trucks)
        ? trucks.reduce((sum, truck) => sum + (parseFloat(truck.balance) || 0), 0)
        : 0;

    const totalNetPayable = Array.isArray(trucks)
        ? trucks.reduce((sum, truck) => sum + (parseFloat(truck.netPayable) || 0), 0)
        : 0;

    const pendingTrucksCount = Array.isArray(trucks)
        ? trucks.filter(t => (parseFloat(t.balance) || 0) > 0).length
        : 0;


    const totalPaidAmount = Array.isArray(trucks)
        ? trucks.reduce((sum, truck) => sum + (parseFloat(truck.totalPaid) || 0), 0)
        : 0;

    const settledTrucksCount = Array.isArray(trucks)
        ? trucks.filter(t => (parseFloat(t.balance) || 0) === 0).length
        : 0;

    // Check if truck has payment history
    const hasPaymentHistory = (truckId) => {
        const details = truckDetails[truckId];
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
                            Vendor/Truck Ledger
                        </h1>
                        <p className="text-gray-600">
                            Track freight, commission, payments, and balances for all vendor trucks
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
                                placeholder="Search by truck number or driver..."
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
                            <option value="advance">Advance</option>
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
                <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                    <div className="bg-white p-4 rounded-lg border border-gray-200">
                        <div className="flex items-center">
                            <div className="p-2 bg-blue-100 rounded-lg mr-3">
                                <Truck className="w-5 h-5 text-blue-600" />
                            </div>
                            <div>
                                <p className="text-sm text-gray-600">Total Trucks</p>
                                <p className="text-lg font-bold text-gray-800">
                                    {Array.isArray(trucks) ? trucks.length : 0}
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white p-4 rounded-lg border border-gray-200">
                        <div className="flex items-center">
                            <div className="p-2 bg-green-100 rounded-lg mr-3">
                                <DollarSign className="w-5 h-5 text-red-600" />
                            </div>
                            <div>
                                <p className="text-sm text-gray-600">Total Net Payable</p>
                                <p className="text-lg font-bold text-gray-800">
                                    ₹{formatCurrency(totalNetPayable)}
                                </p>
                            </div>
                        </div>
                    </div>
                    <div className="bg-white p-4 rounded-lg border border-gray-200">
                        <div className="flex items-center">
                            <div className="p-2 bg-orange-100 rounded-lg mr-3">
                                <HandCoins className="w-5 h-5 text-green-600" />
                            </div>
                            <div>
                                <p className="text-sm text-gray-600">Paid Balance</p>
                                <p className="text-lg font-bold text-gray-800">
                                    ₹{formatCurrency(totalPaidAmount)}
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
                                <p className="text-sm text-gray-600">Pending Balance</p>
                                <p className="text-lg font-bold text-gray-800">
                                    ₹{formatCurrency(totalBalance)}
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white p-4 rounded-lg border border-gray-200">
                        <div className="flex items-center">
                            <div className="p-2 bg-purple-100 rounded-lg mr-3">
                                <Package className="w-5 h-5 text-purple-600" />
                            </div>
                            <div>
                                <p className="text-sm text-gray-600">Pending Trucks</p>
                                <p className="text-lg font-bold text-gray-800">
                                    {pendingTrucksCount}
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
                        <p className="text-gray-600 text-sm">Loading truck data...</p>
                    </div>
                ) : (
                    <>
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-gray-50 border-b border-gray-200">
                                    <tr>
                                        <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Truck Details</th>
                                        <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Freight</th>
                                        <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Commission</th>
                                        <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Net Payable</th>
                                        <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Paid</th>
                                        <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Balance</th>
                                        <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                        <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200">
                                    {Array.isArray(filteredTrucks) && filteredTrucks.map((truck) => {
                                        const isExpanded = expandedRows.includes(truck.truckId);
                                        const details = truckDetails[truck.truckId];
                                        const isLoading = loadingDetails[truck.truckId];
                                        const hasHistory = hasPaymentHistory(truck.truckId);

                                        return (
                                            <React.Fragment key={truck.truckId}>
                                                <tr className={`hover:bg-gray-50 ${isExpanded ? 'bg-blue-50' : ''}`}>
                                                    <td className="py-3 px-4">
                                                        <div className="flex items-center space-x-2">
                                                            <button
                                                                onClick={() => toggleRow(truck.truckId)}
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
                                                                    {truck.truckNo || 'Unknown Truck'}
                                                                </p>
                                                                <p className="text-xs text-gray-500">
                                                                    Driver: {truck?.driver || 'N/A'}
                                                                </p>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="py-3 px-4">
                                                        <div className="text-sm font-medium text-orange-700">
                                                            ₹{formatCurrency(truck.totalFreight)}
                                                        </div>
                                                    </td>
                                                    <td className="py-3 px-4">
                                                        <div className="text-sm font-medium text-red-700">
                                                            ₹{formatCurrency(truck.totalCommission)}
                                                        </div>
                                                    </td>
                                                    <td className="py-3 px-4">
                                                        <div className="text-sm font-medium text-green-700">
                                                            ₹{formatCurrency(truck.netPayable)}
                                                        </div>
                                                    </td>
                                                    <td className="py-3 px-4">
                                                        <div className="text-sm font-medium text-blue-700">
                                                            ₹{formatCurrency(truck.totalPaid)}
                                                        </div>
                                                    </td>
                                                    <td className="py-3 px-4">
                                                        <div className={`text-sm font-bold ${(truck.balance || 0) > 0 ? 'text-red-700' :
                                                            (truck.balance || 0) < 0 ? 'text-purple-700' :
                                                                'text-gray-700'
                                                            }`}>
                                                            ₹{formatCurrency(truck.balance)}
                                                        </div>
                                                    </td>
                                                    <td className="py-3 px-4">
                                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${(truck.balance || 0) > 0 ? 'bg-red-100 text-red-800' :
                                                            (truck.balance || 0) < 0 ? 'bg-purple-100 text-purple-800' :
                                                                'bg-green-100 text-green-800'
                                                            }`}>
                                                            {(truck.balance || 0) > 0 ? 'Pending' :
                                                                (truck.balance || 0) < 0 ? 'Advance' : 'Settled'}
                                                        </span>
                                                    </td>
                                                    <td className="py-3 px-4">
                                                        <div className="flex space-x-2">
                                                            <button
                                                                onClick={() => handleOpenPaymentHistory(truck.truckId)}
                                                                disabled={!hasHistory}
                                                                className={`px-3 py-1.5 text-xs rounded flex items-center space-x-1 ${hasHistory
                                                                    ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                                                    : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                                                    }`}
                                                            >
                                                                <ClipboardClock className="w-4 h-4 mr-2 text-blue-600" />
                                                                <span>History</span>
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>

                                                {/* Expanded Details Row */}
                                                {isExpanded && (
                                                    <tr>
                                                        <td colSpan="8" className="p-0">
                                                            <div className="p-4 bg-gray-50 border-t border-gray-200">
                                                                {isLoading ? (
                                                                    <div className="flex items-center justify-center py-8">
                                                                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500 mr-3"></div>
                                                                        <p className="text-gray-600 text-sm">Loading truck details...</p>
                                                                    </div>
                                                                ) : details ? (
                                                                    <div className="space-y-6">
                                                                        {/* Truck Info and Summary */}
                                                                        {/* <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                                                            <div className="bg-white p-4 rounded border border-gray-200">
                                                                                <h3 className="text-sm font-medium text-gray-900 mb-3 flex items-center">
                                                                                    <Truck className="w-4 h-4 mr-2 text-blue-600" />
                                                                                    Truck Information
                                                                                </h3>
                                                                                <div className="space-y-2">
                                                                                    <div className="flex justify-between">
                                                                                        <span className="text-xs text-gray-600">Truck Number</span>
                                                                                        <span className="text-sm font-medium">{details.truck?.truckNo || 'N/A'}</span>
                                                                                    </div>
                                                                                    <div className="flex justify-between">
                                                                                        <span className="text-xs text-gray-600">Driver</span>
                                                                                        <span className="text-sm font-medium flex items-center">
                                                                                            <User className="w-3 h-3 mr-1 text-gray-500" />
                                                                                            {details.truck?.driver || 'N/A'}
                                                                                        </span>
                                                                                    </div>
                                                                                    <div className="flex justify-between">
                                                                                        <span className="text-xs text-gray-600">Truck ID</span>
                                                                                        <span className="text-sm font-medium">{details.truck?.id || truck.truckId}</span>
                                                                                    </div>
                                                                                </div>
                                                                            </div>

                                                                            <div className="bg-white p-4 rounded border border-gray-200">
                                                                                <h3 className="text-sm font-medium text-gray-900 mb-3 flex items-center">
                                                                                    <Wallet className="w-4 h-4 mr-2 text-green-600" />
                                                                                    Financial Summary
                                                                                </h3>
                                                                                <div className="space-y-2">
                                                                                    <div className="flex justify-between">
                                                                                        <span className="text-xs text-gray-600">Total Freight</span>
                                                                                        <span className="text-sm font-bold text-orange-700">
                                                                                            ₹{formatCurrency(details.summary?.totalFreight)}
                                                                                        </span>
                                                                                    </div>
                                                                                    <div className="flex justify-between">
                                                                                        <span className="text-xs text-gray-600">Total Commission</span>
                                                                                        <span className="text-sm font-bold text-red-700">
                                                                                            ₹{formatCurrency(details.summary?.totalCommission)}
                                                                                        </span>
                                                                                    </div>
                                                                                    <div className="flex justify-between">
                                                                                        <span className="text-xs text-gray-600">Net Payable</span>
                                                                                        <span className="text-sm font-bold text-green-700">
                                                                                            ₹{formatCurrency(details.summary?.netPayable)}
                                                                                        </span>
                                                                                    </div>
                                                                                    <div className="flex justify-between">
                                                                                        <span className="text-xs text-gray-600">Total Paid</span>
                                                                                        <span className="text-sm font-bold text-blue-700">
                                                                                            ₹{formatCurrency(details.summary?.totalPaid)}
                                                                                        </span>
                                                                                    </div>
                                                                                    <div className="flex justify-between">
                                                                                        <span className="text-xs text-gray-600">Balance</span>
                                                                                        <span className={`text-sm font-bold ${(details.summary?.balance || 0) > 0 ? 'text-red-700' :
                                                                                            (details.summary?.balance || 0) < 0 ? 'text-purple-700' :
                                                                                                'text-gray-700'
                                                                                            }`}>
                                                                                            ₹{formatCurrency(details.summary?.balance)}
                                                                                        </span>
                                                                                    </div>
                                                                                </div>
                                                                            </div>

                                                                            <div className="bg-white p-4 rounded border border-gray-200">
                                                                                <h3 className="text-sm font-medium text-gray-900 mb-3 flex items-center">
                                                                                    <Receipt className="w-4 h-4 mr-2 text-purple-600" />
                                                                                    Quick Actions
                                                                                </h3>
                                                                                <div className="space-y-2">
                                                                                    <button
                                                                                        onClick={() => handleOpenTruckPaymentModal(truck)}
                                                                                        disabled={(details.summary?.balance || 0) <= 0}
                                                                                        className={`w-full px-3 py-2 text-xs rounded flex items-center justify-center space-x-1 ${(details.summary?.balance || 0) > 0
                                                                                            ? 'bg-blue-600 text-white hover:bg-blue-700'
                                                                                            : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                                                                            }`}
                                                                                    >
                                                                                        <Plus className="w-3 h-3" />
                                                                                        <span>Make Payment</span>
                                                                                    </button>
                                                                                    {hasHistory && (
                                                                                        <button
                                                                                            onClick={() => handleOpenPaymentHistory(truck.truckId)}
                                                                                            className="w-full px-3 py-2 text-xs bg-gray-100 text-gray-700 rounded hover:bg-gray-200 flex items-center justify-center space-x-1"
                                                                                        >
                                                                                            <ClipboardClock className="w-4 h-4 mr-2 text-blue-600" />
                                                                                            <span>View Payment History</span>
                                                                                        </button>
                                                                                    )}
                                                                                </div>
                                                                            </div>
                                                                        </div> */}

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
                                                                                                        <div className="flex items-center space-x-3">
                                                                                                            <div className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs font-medium">
                                                                                                                Booking Ref. Number #{booking.bookingId || 'N/A'}
                                                                                                            </div>
                                                                                                            <div className="text-xs text-gray-600 flex items-center">
                                                                                                                <Calendar className="w-3 h-3 mr-1" />
                                                                                                                {formatDate(booking.date)}
                                                                                                            </div>
                                                                                                            <div className="text-xs text-gray-800">
                                                                                                                {booking.route || 'N/A'}
                                                                                                            </div>
                                                                                                        </div>
                                                                                                    </div>

                                                                                                    {/* Booking Financials */}
                                                                                                    <div className="grid grid-cols-5 gap-3 mb-4">
                                                                                                        <div className="text-center p-3 bg-orange-50 rounded">
                                                                                                            <p className="text-xs text-gray-600 mb-1">Freight</p>
                                                                                                            <p className="text-sm font-bold text-orange-700">
                                                                                                                ₹{formatCurrency(booking.freight)}
                                                                                                            </p>
                                                                                                        </div>
                                                                                                        <div className="text-center p-3 bg-red-50 rounded">
                                                                                                            <p className="text-xs text-gray-600 mb-1">Commission</p>
                                                                                                            <p className="text-sm font-bold text-red-700">
                                                                                                                ₹{formatCurrency(booking.commission)}
                                                                                                            </p>
                                                                                                        </div>
                                                                                                        <div className="text-center p-3 bg-green-50 rounded">
                                                                                                            <p className="text-xs text-gray-600 mb-1">Net Amount</p>
                                                                                                            <p className="text-sm font-bold text-green-700">
                                                                                                                ₹{formatCurrency(booking.netAmount)}
                                                                                                            </p>
                                                                                                        </div>
                                                                                                        <div className="text-center p-3 bg-blue-50 rounded">
                                                                                                            <p className="text-xs text-gray-600 mb-1">Paid</p>
                                                                                                            <p className="text-sm font-bold text-blue-700">
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
                                                                                                                onClick={() => handleOpenBookingPaymentModal(booking, truck)}
                                                                                                                className="w-full px-4 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 flex items-center justify-center space-x-2"
                                                                                                            >
                                                                                                                <CreditCard className="w-4 h-4" />
                                                                                                                <span>Make Payment for This Booking</span>
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
                                                                                                                            <th className="py-2 px-3 text-left">Mode</th>
                                                                                                                            <th className="py-2 px-3 text-left">Type</th>
                                                                                                                            <th className="py-2 px-3 text-left">UTR No</th>
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
                                                                                                                                    <span className={`px-2 py-1 rounded text-xs ${payment.type === 'Debit' ? 'bg-green-100 text-green-800' :
                                                                                                                                        'bg-red-100 text-red-800'
                                                                                                                                        }`}>
                                                                                                                                        {payment.type || 'N/A'}
                                                                                                                                    </span>
                                                                                                                                </td>
                                                                                                                                <td className="py-2 px-3">
                                                                                                                                    {payment.utrNo || '-'}
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
                                                                        <p className="text-gray-600 text-sm">Failed to load truck details</p>
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
                        {(!Array.isArray(filteredTrucks) || filteredTrucks.length === 0) && !loading && (
                            <div className="text-center py-16">
                                <Truck className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                                <h3 className="text-lg font-medium text-gray-700 mb-1">No Trucks Found</h3>
                                <p className="text-gray-600 text-sm mb-4">No trucks match your search criteria</p>
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
            {showPaymentModal && selectedTruck && (
                <div className="fixed inset-0 backdrop-blur-xs  flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-lg shadow-lg max-w-md w-full">
                        {/* Modal Header */}
                        <div className="p-4 border-b border-gray-200">
                            <div className="flex justify-between items-center">
                                <div>
                                    <h2 className="text-lg font-medium text-gray-900">Make Payment</h2>
                                    <p className="text-sm text-gray-600 mt-1">
                                        Truck: {selectedTruck.truckNo} • {selectedBooking ? `Booking #${selectedBooking.bookingId}` : 'General Payment'}
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
                                            <p className="text-gray-600">Current Payable Balance</p>
                                            <p className="font-bold text-red-700">
                                                ₹{formatCurrency(selectedBooking ? (selectedBooking.balance || 0) : (selectedTruck.balance || 0))}
                                            </p>
                                        </div>
                                        {selectedBooking && (
                                            <div>
                                                <p className="text-gray-600">Booking Net Amount</p>
                                                <p className="font-bold text-green-700">
                                                    ₹{formatCurrency(selectedBooking.netAmount)}
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
                                            max={selectedBooking ? (selectedBooking.balance || 0) : (selectedTruck.balance || 0)}
                                            value={paymentForm.amount}
                                            onChange={(e) => setPaymentForm({ ...paymentForm, amount: e.target.value })}
                                            className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-sm"
                                            placeholder="Enter amount"
                                        />
                                        <p className="text-xs text-gray-500 mt-1">
                                            Maximum: ₹{formatCurrency(selectedBooking ? (selectedBooking.balance || 0) : (selectedTruck.balance || 0))}
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
                                                <option value="Debit">Debit</option>
                                                <option value="Credit">Credit</option>
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
                                                    {payment.route || '-'}
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
                                                    <span className={`px-2 py-1 rounded text-xs ${payment.type === 'Debit' ? 'bg-green-100 text-green-800' :
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

export default VendorLedger;