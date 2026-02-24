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
    HandCoins,
    Layers,
    Clock,
    IndianRupee,
    FileText
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

    // Partial Payment Modal states (for specific booking)
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [selectedBooking, setSelectedBooking] = useState(null);
    const [selectedTruck, setSelectedTruck] = useState(null);
    const [paymentForm, setPaymentForm] = useState({
        amount: '',
        date: new Date().toISOString().split('T')[0],
        mode: 'cash',
        type: 'Debit',
        utrNo: '',
        remarks: '',
        // Bank details - direct inputs
        bankAccountNo: '',
        bankName: '',
        ifscCode: '',
        bankAcHolderName: '',
        panNumber: ''
    });
    const [processingPayment, setProcessingPayment] = useState(false);

    // Bulk Payment for Single Truck states
    const [showSingleTruckBulkModal, setShowSingleTruckBulkModal] = useState(false);
    const [selectedTruckForBulk, setSelectedTruckForBulk] = useState(null);
    const [singleTruckBulkForm, setSingleTruckBulkForm] = useState({
        amount: '',
        date: new Date().toISOString().split('T')[0],
        mode: 'cash',
        utrNo: '',
        remarks: '',
        // Bank details - direct inputs
        bankAccountNo: '',
        bankName: '',
        ifscCode: '',
        bankAcHolderName: '',
        panNumber: ''
    });
    const [processingSingleTruckBulk, setProcessingSingleTruckBulk] = useState(false);

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

    // Format date with time
    const formatDateTime = (dateString) => {
        if (!dateString) return 'N/A';
        try {
            const date = new Date(dateString);
            return date.toLocaleDateString('en-IN', {
                day: '2-digit',
                month: 'short',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
                hour12: true
            });
        } catch (error) {
            console.error('Error formatting date:', error);
            return 'Invalid Date';
        }
    };

    // Format date only
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

    // ==================== PAYMENT HANDLERS ====================

    // Open partial payment modal for specific booking (from expanded row)
    const handleOpenBookingPaymentModal = (booking, truck) => {
        setSelectedBooking(booking);
        setSelectedTruck(truck);
        setPaymentForm({
            amount: (booking.balance > 0 ? booking.balance : 0).toString(),
            date: new Date().toISOString().split('T')[0],
            mode: 'cash',
            type: 'Debit',
            utrNo: '',
            remarks: `Partial payment for Booking #${booking.bookingId || ''}`,
            // Reset bank details
            bankAccountNo: '',
            bankName: '',
            ifscCode: '',
            bankAcHolderName: '',
            panNumber: ''
        });
        setShowPaymentModal(true);
    };

    // Open single truck bulk payment modal
    const handleOpenSingleTruckBulkModal = (truck) => {
        setSelectedTruckForBulk(truck);
        setSingleTruckBulkForm({
            amount: truck.balance > 0 ? truck.balance.toString() : '',
            date: new Date().toISOString().split('T')[0],
            mode: 'cash',
            utrNo: '',
            remarks: `Full payment for all bookings of Truck ${truck.truckNo}`,
            // Reset bank details
            bankAccountNo: '',
            bankName: '',
            ifscCode: '',
            bankAcHolderName: '',
            panNumber: ''
        });
        setShowSingleTruckBulkModal(true);
    };

    const handleSingleTruckBulkSubmit = async (e) => {
        e.preventDefault();
        if (!selectedTruckForBulk) return;

        if (!singleTruckBulkForm.amount || parseFloat(singleTruckBulkForm.amount) <= 0) {
            toast.error('Please enter a valid amount');
            return;
        }

        if (parseFloat(singleTruckBulkForm.amount) > selectedTruckForBulk.balance) {
            toast.error(`Amount cannot exceed pending balance of ₹${formatCurrency(selectedTruckForBulk.balance)}`);
            return;
        }

        // Validate bank details if mode is bank
        if (singleTruckBulkForm.mode === 'bank') {
            if (!singleTruckBulkForm.bankAccountNo || !singleTruckBulkForm.bankName ||
                !singleTruckBulkForm.ifscCode || !singleTruckBulkForm.bankAcHolderName) {
                toast.error('Please fill in all required bank details');
                return;
            }
        }

        try {
            setProcessingSingleTruckBulk(true);

            const paymentData = {
                truckId: selectedTruckForBulk.truckId,
                amount: parseFloat(singleTruckBulkForm.amount) || 0,
                paymentDate: singleTruckBulkForm.date,
                paymentMode: singleTruckBulkForm.mode,
                utrNo: singleTruckBulkForm.utrNo || null,
                remark: singleTruckBulkForm.remarks || `Full payment for Truck ${selectedTruckForBulk.truckNo}`,
                // Include bank details if mode is bank
                ...(singleTruckBulkForm.mode === 'bank' && {
                    bankAccountNo: singleTruckBulkForm.bankAccountNo,
                    bankName: singleTruckBulkForm.bankName,
                    ifscCode: singleTruckBulkForm.ifscCode,
                    bankAcHolderName: singleTruckBulkForm.bankAcHolderName,
                    panNumber: singleTruckBulkForm.panNumber || null
                })
            };

            const response = await axios.post(`${API_URL}/vendor/truck-bulk-payment`, paymentData);

            if (response.data.success) {
                toast.success(`Full payment of ₹${formatCurrency(singleTruckBulkForm.amount)} processed successfully for Truck ${selectedTruckForBulk.truckNo}!`);

                // Refresh data
                debouncedFetchTrucks(searchTerm, statusFilter, fromDate, toDate);

                // Refresh the specific truck details
                if (selectedTruckForBulk.truckId) {
                    try {
                        const detailsResponse = await axios.get(`${API_URL}/vendor/truck-details/${selectedTruckForBulk.truckId}`);
                        setTruckDetails(prev => ({
                            ...prev,
                            [selectedTruckForBulk.truckId]: detailsResponse.data
                        }));
                    } catch (error) {
                        console.error('Error refreshing truck details:', error);
                        setTruckDetails(prev => {
                            const newDetails = { ...prev };
                            delete newDetails[selectedTruckForBulk.truckId];
                            return newDetails;
                        });
                    }
                }

                // Close modal and reset
                setShowSingleTruckBulkModal(false);
                setSelectedTruckForBulk(null);
                setSingleTruckBulkForm({
                    amount: '',
                    date: new Date().toISOString().split('T')[0],
                    mode: 'cash',
                    utrNo: '',
                    remarks: '',
                    bankAccountNo: '',
                    bankName: '',
                    ifscCode: '',
                    bankAcHolderName: '',
                    panNumber: ''
                });
            } else {
                throw new Error(response.data.message || 'Bulk payment failed');
            }

        } catch (error) {
            console.error('Error processing bulk payment for truck:', error);
            toast.error(error.response?.data?.message || 'Failed to process bulk payment. Please try again.');
        } finally {
            setProcessingSingleTruckBulk(false);
        }
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

    // Handle partial payment submission (from expanded row)
    const handlePaymentSubmit = async (e) => {
        e.preventDefault();
        if (!selectedTruck) return;

        // Validate bank details if mode is bank
        if (paymentForm.mode === 'bank') {
            if (!paymentForm.bankAccountNo || !paymentForm.bankName ||
                !paymentForm.ifscCode || !paymentForm.bankAcHolderName) {
                toast.error('Please fill in all required bank details');
                return;
            }
        }

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
                // Include bank details if mode is bank
                ...(paymentForm.mode === 'bank' && {
                    bankAccountNo: paymentForm.bankAccountNo,
                    bankName: paymentForm.bankName,
                    ifscCode: paymentForm.ifscCode,
                    bankAcHolderName: paymentForm.bankAcHolderName,
                    panNumber: paymentForm.panNumber || null
                })
            };

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
                    bankAccountNo: '',
                    bankName: '',
                    ifscCode: '',
                    bankAcHolderName: '',
                    panNumber: ''
                });

                toast.success('Partial payment processed successfully!');
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

    // Export to Excel for a specific truck
    const exportTruckToExcel = (truck) => {
        try {
            const details = truckDetails[truck.truckId];

            if (!details || !Array.isArray(details.bookings)) {
                toast.error('No detailed data available for this truck');
                return;
            }

            const detailedData = [];

            // Add truck header
            detailedData.push({
                'Section': 'TRUCK SUMMARY',
                'Truck No': truck.truckNo || '',
                'Driver': details?.truck?.driver || truck.driver || '',
                'Total Freight': truck.totalFreight || 0,
                'Total Halting': truck.totalHalting || 0,
                'Total Commission': truck.totalCommission || 0,
                'Total Payable': truck.totalPayable || 0,
                'Total Paid': truck.totalPaid || 0,
                'Balance': truck.balance || 0,
                'Status': (truck.balance || 0) > 0 ? 'Pending' : (truck.balance || 0) < 0 ? 'Advance' : 'Settled',
                'Date/Time': '',
                'Payment Mode': '',
                'Payment Type': '',
                'UTR No': '',
                'Remarks': '',
                'Booking ID': '',
                'Route': '',
                'Payment For': '',
                'Bank Account No': '',
                'Bank Name': '',
                'IFSC Code': '',
                'Account Holder': '',
                'PAN Number': ''
            });

            // Add separator
            detailedData.push({});

            // Process each booking
            details.bookings.forEach(booking => {
                // Add booking summary
                detailedData.push({
                    'Section': 'BOOKING SUMMARY',
                    'Truck No': '',
                    'Driver': '',
                    'Total Freight': booking.freight || 0,
                    'Total Halting': booking.halting || 0,
                    'Total Commission': booking.commission || 0,
                    'Total Payable': booking.netAmount || 0,
                    'Total Paid': booking.paid || 0,
                    'Balance': booking.balance || 0,
                    'Status': '',
                    'Date/Time': formatDate(booking.date),
                    'Payment Mode': '',
                    'Payment Type': '',
                    'UTR No': '',
                    'Remarks': '',
                    'Booking ID': booking.bookingId || '',
                    'Route': booking.route || '',
                    'Payment For': '',
                    'Bank Account No': '',
                    'Bank Name': '',
                    'IFSC Code': '',
                    'Account Holder': '',
                    'PAN Number': ''
                });

                // Add payments for this booking
                if (Array.isArray(booking.payments) && booking.payments.length > 0) {
                    booking.payments.forEach(payment => {
                        detailedData.push({
                            'Section': 'PAYMENT',
                            'Truck No': '',
                            'Driver': '',
                            'Total Freight': '',
                            'Total Halting': '',
                            'Total Commission': '',
                            'Total Payable': '',
                            'Total Paid': payment.amount || 0,
                            'Balance': payment.runningBalance || 0,
                            'Status': '',
                            'Date/Time': formatDateTime(payment.date),
                            'Payment Mode': payment.mode || '',
                            'Payment Type': payment.type || '',
                            'UTR No': payment.utrNo || '',
                            'Remarks': payment.remarks || '',
                            'Booking ID': booking.bookingId || '',
                            'Route': booking.route || '',
                            'Payment For': payment.paymentFor || 'freight',
                            'Bank Account No': payment.bankAccountNo || '',
                            'Bank Name': payment.bankName || '',
                            'IFSC Code': payment.Ifsc || '',
                            'Account Holder': payment.bankAcHolderName || '',
                            'PAN Number': payment.panNumber || ''
                        });
                    });
                }

                // Add separator between bookings
                detailedData.push({});
            });

            // Create worksheet
            const ws = XLSX.utils.json_to_sheet(detailedData, {
                skipHeader: false,
                header: [
                    'Section', 'Truck No', 'Driver',
                    'Total Freight', 'Total Halting', 'Total Commission', 'Total Payable', 'Total Paid', 'Balance', 'Status',
                    'Date/Time', 'Payment Mode', 'Payment Type', 'UTR No',
                    'Remarks', 'Booking ID', 'Route', 'Payment For',
                    'Bank Account No', 'Bank Name', 'IFSC Code', 'Account Holder', 'PAN Number'
                ]
            });

            // Set column widths
            const wscols = [
                { wch: 15 }, // Section
                { wch: 15 }, // Truck No
                { wch: 20 }, // Driver
                { wch: 15 }, // Total Freight
                { wch: 15 }, // Total Halting
                { wch: 15 }, // Total Commission
                { wch: 15 }, // Total Payable
                { wch: 12 }, // Total Paid
                { wch: 12 }, // Balance
                { wch: 12 }, // Status
                { wch: 18 }, // Date/Time
                { wch: 12 }, // Payment Mode
                { wch: 12 }, // Payment Type
                { wch: 15 }, // UTR No
                { wch: 25 }, // Remarks
                { wch: 12 }, // Booking ID
                { wch: 20 }, // Route
                { wch: 15 }, // Payment For
                { wch: 20 }, // Bank Account No
                { wch: 25 }, // Bank Name
                { wch: 15 }, // IFSC Code
                { wch: 25 }, // Account Holder
                { wch: 15 }  // PAN Number
            ];
            ws['!cols'] = wscols;

            // Create workbook and add worksheet
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, 'Truck Details');

            // Generate filename with truck number and current date
            const dateStr = new Date().toISOString().split('T')[0];
            XLSX.writeFile(wb, `${truck.truckNo}_Ledger_${dateStr}.xlsx`);

            toast.success(`Excel file exported successfully for ${truck.truckNo}!`);
        } catch (error) {
            console.error('Error exporting truck to Excel:', error);
            toast.error('Failed to export Excel file');
        }
    };

    // Export to Excel with detailed payment information
    const exportToExcel = () => {
        try {
            const detailedData = [];

            filteredTrucks.forEach(truck => {
                const details = truckDetails[truck.truckId];

                // Add truck summary row
                detailedData.push({
                    'Type': 'Truck Summary',
                    'Truck ID': truck.truckId || '',
                    'Truck No': truck.truckNo || '',
                    'Driver': details?.truck?.driver || truck.driver || '',
                    'Total Freight': truck.totalFreight || 0,
                    'Total Halting': truck.totalHalting || 0,
                    'Total Commission': truck.totalCommission || 0,
                    'Total Payable': truck.totalPayable || 0,
                    'Total Paid': truck.totalPaid || 0,
                    'Balance': truck.balance || 0,
                    'Status': (truck.balance || 0) > 0 ? 'Pending' : (truck.balance || 0) < 0 ? 'Advance' : 'Settled',
                    'Date/Time': '',
                    'Payment Mode': '',
                    'Payment Type': '',
                    'UTR No': '',
                    'Remarks': '',
                    'Booking ID': '',
                    'Route': '',
                    'Payment For': '',
                    'Bank Account No': '',
                    'Bank Name': '',
                    'IFSC Code': '',
                    'Account Holder': '',
                    'PAN Number': ''
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
                            'Total Halting': booking.halting || 0,
                            'Total Commission': booking.commission || 0,
                            'Total Payable': booking.netAmount || 0,
                            'Total Paid': booking.paid || 0,
                            'Balance': booking.balance || 0,
                            'Status': '',
                            'Date/Time': formatDateTime(booking.date),
                            'Payment Mode': '',
                            'Payment Type': '',
                            'UTR No': '',
                            'Remarks': '',
                            'Booking ID': booking.bookingId || '',
                            'Route': booking.route || '',
                            'Payment For': '',
                            'Bank Account No': '',
                            'Bank Name': '',
                            'IFSC Code': '',
                            'Account Holder': '',
                            'PAN Number': ''
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
                                    'Total Halting': '',
                                    'Total Commission': '',
                                    'Total Payable': '',
                                    'Total Paid': payment.amount || 0,
                                    'Balance': payment.runningBalance || 0,
                                    'Status': '',
                                    'Date/Time': formatDateTime(payment.date),
                                    'Payment Mode': payment.mode || '',
                                    'Payment Type': payment.type || '',
                                    'UTR No': payment.utrNo || '',
                                    'Remarks': payment.remarks || '',
                                    'Booking ID': booking.bookingId || '',
                                    'Route': booking.route || '',
                                    'Payment For': payment.paymentFor || 'freight',
                                    'Bank Account No': payment.bankAccountNo || '',
                                    'Bank Name': payment.bankName || '',
                                    'IFSC Code': payment.ifsc || '',
                                    'Account Holder': payment.bankAcHolderName || '',
                                    'PAN Number': payment.panNumber || ''
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
                    'Total Freight', 'Total Halting', 'Total Commission', 'Total Payable', 'Total Paid', 'Balance', 'Status',
                    'Date/Time', 'Payment Mode', 'Payment Type', 'UTR No',
                    'Remarks', 'Booking ID', 'Route', 'Payment For',
                    'Bank Account No', 'Bank Name', 'IFSC Code', 'Account Holder', 'PAN Number'
                ]
            });

            // Set column widths
            const wscols = [
                { wch: 15 }, // Type
                { wch: 10 }, // Truck ID
                { wch: 15 }, // Truck No
                { wch: 20 }, // Driver
                { wch: 15 }, // Total Freight
                { wch: 15 }, // Total Halting
                { wch: 15 }, // Total Commission
                { wch: 15 }, // Total Payable
                { wch: 12 }, // Total Paid
                { wch: 12 }, // Balance
                { wch: 12 }, // Status
                { wch: 18 }, // Date/Time
                { wch: 12 }, // Payment Mode
                { wch: 12 }, // Payment Type
                { wch: 15 }, // UTR No
                { wch: 25 }, // Remarks
                { wch: 12 }, // Booking ID
                { wch: 20 }, // Route
                { wch: 15 }, // Payment For
                { wch: 20 }, // Bank Account No
                { wch: 25 }, // Bank Name
                { wch: 15 }, // IFSC Code
                { wch: 25 }, // Account Holder
                { wch: 15 }  // PAN Number
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

    const totalPayable = Array.isArray(trucks)
        ? trucks.reduce((sum, truck) => sum + (parseFloat(truck.totalPayable) || 0), 0)
        : 0;

    const totalPaidAmount = Array.isArray(trucks)
        ? trucks.reduce((sum, truck) => sum + (parseFloat(truck.totalPaid) || 0), 0)
        : 0;

    const totalCommission = Array.isArray(trucks)
        ? trucks.reduce((sum, truck) => sum + (parseFloat(truck.totalCommission) || 0), 0)
        : 0;

    const totalHalting = Array.isArray(trucks)
        ? trucks.reduce((sum, truck) => sum + (parseFloat(truck.totalHalting) || 0), 0)
        : 0;

    const pendingTrucksCount = Array.isArray(trucks)
        ? trucks.filter(t => (parseFloat(t.balance) || 0) > 0).length
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
                            Track freight, halting charges, commission, payments, and balances for all vendor trucks
                        </p>
                    </div>
                    <button
                        onClick={exportToExcel}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2"
                    >
                        <Download className="w-4 h-4" />
                        <span>Export All to Excel</span>
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
                <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
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
                            <div className="p-2 bg-orange-100 rounded-lg mr-3">
                                <IndianRupee className="w-5 h-5 text-orange-600" />
                            </div>
                            <div>
                                <p className="text-sm text-gray-600">Total Payable</p>
                                <p className="text-lg font-bold text-gray-800">
                                    ₹{formatCurrency(totalPayable)}
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white p-4 rounded-lg border border-gray-200">
                        <div className="flex items-center">
                            <div className="p-2 bg-green-100 rounded-lg mr-3">
                                <HandCoins className="w-5 h-5 text-green-600" />
                            </div>
                            <div>
                                <p className="text-sm text-gray-600">Paid Amount</p>
                                <p className="text-lg font-bold text-gray-800">
                                    ₹{formatCurrency(totalPaidAmount)}
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white p-4 rounded-lg border border-gray-200">
                        <div className="flex items-center">
                            <div className="p-2 bg-red-100 rounded-lg mr-3">
                                <AlertCircle className="w-5 h-5 text-red-600" />
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
                                <Percent className="w-5 h-5 text-purple-600" />
                            </div>
                            <div>
                                <p className="text-sm text-gray-600">Commission</p>
                                <p className="text-lg font-bold text-gray-800">
                                    ₹{formatCurrency(totalCommission)}
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white p-4 rounded-lg border border-gray-200">
                        <div className="flex items-center">
                            <div className="p-2 bg-yellow-100 rounded-lg mr-3">
                                <Clock className="w-5 h-5 text-yellow-600" />
                            </div>
                            <div>
                                <p className="text-sm text-gray-600">Halting Charges</p>
                                <p className="text-lg font-bold text-gray-800">
                                    ₹{formatCurrency(totalHalting)}
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
                                        <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Halting</th>
                                        <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Commission</th>
                                        <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Payable</th>
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
                                        const isPending = (parseFloat(truck.balance) || 0) > 0;

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
                                                        <div className="text-sm font-medium text-yellow-700">
                                                            ₹{formatCurrency(truck.totalHalting)}
                                                        </div>
                                                    </td>
                                                    <td className="py-3 px-4">
                                                        <div className="text-sm font-medium text-purple-700">
                                                            ₹{formatCurrency(truck.totalCommission)}
                                                        </div>
                                                    </td>
                                                    <td className="py-3 px-4">
                                                        <div className="text-sm font-medium text-green-700">
                                                            ₹{formatCurrency(truck.totalPayable)}
                                                        </div>
                                                    </td>
                                                    <td className="py-3 px-4">
                                                        <div className="text-sm font-medium text-blue-700">
                                                            ₹{formatCurrency(truck.totalPaid)}
                                                        </div>
                                                    </td>
                                                    <td className="py-3 px-4">
                                                        <div className={`text-sm font-bold ${isPending ? 'text-red-700' :
                                                            (truck.balance || 0) < 0 ? 'text-purple-700' :
                                                                'text-gray-700'
                                                            }`}>
                                                            ₹{formatCurrency(truck.balance)}
                                                        </div>
                                                    </td>
                                                    <td className="py-3 px-4">
                                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${isPending ? 'bg-red-100 text-red-800' :
                                                            (truck.balance || 0) < 0 ? 'bg-purple-100 text-purple-800' :
                                                                'bg-green-100 text-green-800'
                                                            }`}>
                                                            {isPending ? 'Pending' :
                                                                (truck.balance || 0) < 0 ? 'Advance' : 'Settled'}
                                                        </span>
                                                    </td>
                                                    <td className="py-3 px-4">
                                                        <div className="flex items-center space-x-2">
                                                            {isPending && (
                                                                <button
                                                                    onClick={() => handleOpenSingleTruckBulkModal(truck)}
                                                                    className="px-3 py-1.5 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 flex items-center space-x-1"
                                                                    title="Make Full Payment for All Bookings"
                                                                >
                                                                    <Layers className="w-3.5 h-3.5" />
                                                                    <span>Bulk Pay</span>
                                                                </button>
                                                            )}
                                                            <button
                                                                onClick={() => handleOpenPaymentHistory(truck.truckId)}
                                                                disabled={!hasHistory}
                                                                className={`px-3 py-1.5 text-xs rounded flex items-center space-x-1 ${hasHistory
                                                                    ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                                                    : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                                                    }`}
                                                                title="View Payment History"
                                                            >
                                                                <ClipboardClock className="w-3.5 h-3.5" />
                                                                <span>History</span>
                                                            </button>
                                                            <button
                                                                onClick={() => exportTruckToExcel(truck)}
                                                                disabled={!truckDetails[truck.truckId]}
                                                                className={`px-3 py-1.5 text-xs rounded flex items-center space-x-1 ${truckDetails[truck.truckId]
                                                                    ? 'bg-green-100 text-green-700 hover:bg-green-200'
                                                                    : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                                                    }`}
                                                                title="Download Truck Excel Report"
                                                            >
                                                                <FileText className="w-3.5 h-3.5" />
                                                                <span>Excel</span>
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>

                                                {/* Expanded Details Row */}
                                                {isExpanded && (
                                                    <tr>
                                                        <td colSpan="9" className="p-0">
                                                            <div className="p-4 bg-gray-50 border-t border-gray-200">
                                                                {isLoading ? (
                                                                    <div className="flex items-center justify-center py-8">
                                                                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500 mr-3"></div>
                                                                        <p className="text-gray-600 text-sm">Loading truck details...</p>
                                                                    </div>
                                                                ) : details ? (
                                                                    <div className="space-y-6">
                                                                        {/* Summary Cards */}
                                                                        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                                                                            <div className="bg-white p-3 rounded border border-gray-200">
                                                                                <p className="text-xs text-gray-500">Total Freight</p>
                                                                                <p className="text-sm font-bold text-orange-700">₹{formatCurrency(details.summary?.totalFreight || 0)}</p>
                                                                            </div>
                                                                            <div className="bg-white p-3 rounded border border-gray-200">
                                                                                <p className="text-xs text-gray-500">Total Halting</p>
                                                                                <p className="text-sm font-bold text-yellow-700">₹{formatCurrency(details.summary?.totalHalting || 0)}</p>
                                                                            </div>
                                                                            <div className="bg-white p-3 rounded border border-gray-200">
                                                                                <p className="text-xs text-gray-500">Total Commission</p>
                                                                                <p className="text-sm font-bold text-purple-700">₹{formatCurrency(details.summary?.totalCommission || 0)}</p>
                                                                            </div>
                                                                            <div className="bg-white p-3 rounded border border-gray-200">
                                                                                <p className="text-xs text-gray-500">Total Payable</p>
                                                                                <p className="text-sm font-bold text-green-700">₹{formatCurrency(details.summary?.totalPayable || 0)}</p>
                                                                            </div>
                                                                            <div className="bg-white p-3 rounded border border-gray-200">
                                                                                <p className="text-xs text-gray-500">Total Paid</p>
                                                                                <p className="text-sm font-bold text-blue-700">₹{formatCurrency(details.summary?.totalPaid || 0)}</p>
                                                                            </div>
                                                                        </div>

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
                                                                                                                {formatDateTime(booking.date)}
                                                                                                            </div>
                                                                                                            <div className="text-xs text-gray-800">
                                                                                                                {booking.route || 'N/A'}
                                                                                                            </div>
                                                                                                        </div>
                                                                                                    </div>

                                                                                                    {/* Booking Financials */}
                                                                                                    <div className="grid grid-cols-6 gap-3 mb-4">
                                                                                                        <div className="text-center p-3 bg-orange-50 rounded">
                                                                                                            <p className="text-xs text-gray-600 mb-1">Freight</p>
                                                                                                            <p className="text-sm font-bold text-orange-700">
                                                                                                                ₹{formatCurrency(booking.freight)}
                                                                                                            </p>
                                                                                                        </div>
                                                                                                        <div className="text-center p-3 bg-yellow-50 rounded">
                                                                                                            <p className="text-xs text-gray-600 mb-1">Halting</p>
                                                                                                            <p className="text-sm font-bold text-yellow-700">
                                                                                                                ₹{formatCurrency(booking.halting)}
                                                                                                            </p>
                                                                                                        </div>
                                                                                                        <div className="text-center p-3 bg-purple-50 rounded">
                                                                                                            <p className="text-xs text-gray-600 mb-1">Commission</p>
                                                                                                            <p className="text-sm font-bold text-purple-700">
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

                                                                                                    {/* Partial Payment Action */}
                                                                                                    {(booking.balance || 0) > 0 && (
                                                                                                        <div className="mb-4">
                                                                                                            <button
                                                                                                                onClick={() => handleOpenBookingPaymentModal(booking, truck)}
                                                                                                                className="w-full px-4 py-2 bg-green-600 text-white text-sm rounded hover:bg-green-700 flex items-center justify-center space-x-2"
                                                                                                            >
                                                                                                                <CreditCard className="w-4 h-4" />
                                                                                                                <span>Make Partial Payment for This Booking</span>
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
                                                                                                                            <th className="py-2 px-3 text-left">Date/Time</th>
                                                                                                                            <th className="py-2 px-3 text-left">Payment For</th>
                                                                                                                            <th className="py-2 px-3 text-left">Amount</th>
                                                                                                                            <th className="py-2 px-3 text-left">Mode</th>
                                                                                                                            <th className="py-2 px-3 text-left">Type</th>
                                                                                                                            <th className="py-2 px-3 text-left">UTR No</th>
                                                                                                                            <th className="py-2 px-3 text-left">Balance After</th>
                                                                                                                            <th className="py-2 px-3 text-left">Bank Details</th>
                                                                                                                        </tr>
                                                                                                                    </thead>
                                                                                                                    <tbody>
                                                                                                                        {bookingPayments.map((payment, pIndex) => (
                                                                                                                            <tr key={payment.paymentId || pIndex}
                                                                                                                                className="border-t border-gray-200">
                                                                                                                                <td className="py-2 px-3">{formatDateTime(payment.date)}</td>
                                                                                                                                <td className="py-2 px-3">
                                                                                                                                    <span className={`px-2 py-1 rounded text-xs ${payment.paymentFor === 'freight' ? 'bg-orange-100 text-orange-800' :
                                                                                                                                        'bg-yellow-100 text-yellow-800'
                                                                                                                                        }`}>
                                                                                                                                        {payment.paymentFor || 'freight'}
                                                                                                                                    </span>
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
                                                                                                                                <td className="py-2 px-3 font-medium">
                                                                                                                                    ₹{formatCurrency(payment.runningBalance)}
                                                                                                                                </td>
                                                                                                                                <td className="py-2 px-3">
                                                                                                                                    {payment.mode === 'bank' ? (
                                                                                                                                        <div className="text-xs">
                                                                                                                                            <div>{payment.bankName || '-'}</div>
                                                                                                                                            <div className="text-gray-500">A/c: {payment.bankAccountNo || '-'}</div>
                                                                                                                                            <div className="text-gray-500">IFSC: {payment.Ifsc || '-'}</div>
                                                                                                                                        </div>
                                                                                                                                    ) : '-'}
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

            {/* Partial Payment Modal (from expanded row) */}
            {showPaymentModal && selectedTruck && (
                <div className="fixed inset-0 backdrop-blur-xs flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-lg shadow-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
                        {/* Modal Header */}
                        <div className="p-4 border-b border-gray-200 sticky top-0 bg-white">
                            <div className="flex justify-between items-center">
                                <div>
                                    <h2 className="text-lg font-medium text-gray-900">Make Partial Payment</h2>
                                    <p className="text-sm text-gray-600 mt-1">
                                        Truck: {selectedTruck.truckNo} • Booking #{selectedBooking?.bookingId}
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
                                            <p className="text-gray-600">Current Balance</p>
                                            <p className="font-bold text-red-700">
                                                ₹{formatCurrency(selectedBooking?.balance || 0)}
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-gray-600">Net Payable</p>
                                            <p className="font-bold text-green-700">
                                                ₹{formatCurrency(selectedBooking?.netAmount || 0)}
                                            </p>
                                        </div>
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
                                            max={selectedBooking?.balance || 0}
                                            value={paymentForm.amount}
                                            onChange={(e) => setPaymentForm({ ...paymentForm, amount: e.target.value })}
                                            className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-sm"
                                            placeholder="Enter amount"
                                        />
                                        <p className="text-xs text-gray-500 mt-1">
                                            Maximum: ₹{formatCurrency(selectedBooking?.balance || 0)}
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
                                        <div className="space-y-3 border-t border-gray-200 pt-3 mt-2">
                                            <h3 className="text-sm font-medium text-gray-700">Bank Details</h3>

                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                                    Account Holder Name *
                                                </label>
                                                <input
                                                    type="text"
                                                    required
                                                    value={paymentForm.bankAcHolderName}
                                                    onChange={(e) => setPaymentForm({ ...paymentForm, bankAcHolderName: e.target.value })}
                                                    className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-sm"
                                                    placeholder="Enter account holder name"
                                                />
                                            </div>

                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                                    Bank Name *
                                                </label>
                                                <input
                                                    type="text"
                                                    required
                                                    value={paymentForm.bankName}
                                                    onChange={(e) => setPaymentForm({ ...paymentForm, bankName: e.target.value })}
                                                    className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-sm"
                                                    placeholder="Enter bank name"
                                                />
                                            </div>

                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                                    Account Number *
                                                </label>
                                                <input
                                                    type="text"
                                                    required
                                                    value={paymentForm.bankAccountNo}
                                                    onChange={(e) => setPaymentForm({ ...paymentForm, bankAccountNo: e.target.value })}
                                                    className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-sm"
                                                    placeholder="Enter account number"
                                                />
                                            </div>

                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                                    IFSC Code *
                                                </label>
                                                <input
                                                    type="text"
                                                    required
                                                    value={paymentForm.ifscCode}
                                                    onChange={(e) => setPaymentForm({ ...paymentForm, ifscCode: e.target.value })}
                                                    className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-sm"
                                                    placeholder="Enter IFSC code"
                                                />
                                            </div>

                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                                    PAN Number
                                                </label>
                                                <input
                                                    type="text"
                                                    value={paymentForm.panNumber}
                                                    onChange={(e) => setPaymentForm({ ...paymentForm, panNumber: e.target.value })}
                                                    className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-sm"
                                                    placeholder="Enter PAN number (optional)"
                                                />
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
                                        </div>
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
                                    disabled={processingPayment}
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
                                            <span>Submit Partial Payment</span>
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Single Truck Bulk Payment Modal (Full Payment) */}
            {showSingleTruckBulkModal && selectedTruckForBulk && (
                <div className="fixed inset-0 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-lg shadow-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
                        {/* Modal Header */}
                        <div className="p-4 border-b border-gray-200 sticky top-0 bg-white">
                            <div className="flex justify-between items-center">
                                <div>
                                    <h2 className="text-lg font-medium text-gray-900">Full Payment</h2>
                                    <p className="text-sm text-gray-600 mt-1">
                                        Truck: {selectedTruckForBulk.truckNo}
                                    </p>
                                    <p className="text-xs text-gray-500 mt-1">
                                        Total Pending Balance: ₹{formatCurrency(selectedTruckForBulk.balance)}
                                    </p>
                                    <p className="text-xs text-blue-600 mt-1">
                                        This payment will be distributed across all pending bookings (oldest first)
                                    </p>
                                </div>
                                <button
                                    onClick={() => setShowSingleTruckBulkModal(false)}
                                    className="p-1 hover:bg-gray-100 rounded"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                        </div>

                        {/* Modal Body */}
                        <form onSubmit={handleSingleTruckBulkSubmit} className="p-4">
                            <div className="space-y-4">
                                {/* Payment Info */}
                                <div className="bg-blue-50 p-3 rounded border border-blue-200">
                                    <div className="text-sm">
                                        <p className="text-gray-600">Payment Distribution</p>
                                        <p className="font-medium text-gray-800 mt-1">
                                            Amount will be automatically distributed across all pending bookings
                                        </p>
                                        <p className="text-xs text-gray-500 mt-1">
                                            Oldest bookings will be settled first
                                        </p>
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
                                            max={selectedTruckForBulk.balance}
                                            value={singleTruckBulkForm.amount}
                                            onChange={(e) => setSingleTruckBulkForm({ ...singleTruckBulkForm, amount: e.target.value })}
                                            className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-sm"
                                            placeholder="Enter amount"
                                        />
                                        <p className="text-xs text-gray-500 mt-1">
                                            Maximum: ₹{formatCurrency(selectedTruckForBulk.balance)}
                                        </p>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Payment Date *
                                        </label>
                                        <input
                                            type="date"
                                            required
                                            value={singleTruckBulkForm.date}
                                            onChange={(e) => setSingleTruckBulkForm({ ...singleTruckBulkForm, date: e.target.value })}
                                            className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-sm"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Payment Mode *
                                        </label>
                                        <select
                                            value={singleTruckBulkForm.mode}
                                            onChange={(e) => setSingleTruckBulkForm({ ...singleTruckBulkForm, mode: e.target.value })}
                                            className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-sm"
                                        >
                                            <option value="cash">Cash</option>
                                            <option value="bank">Bank</option>
                                        </select>
                                    </div>

                                    {singleTruckBulkForm.mode === 'bank' && (
                                        <div className="space-y-3 border-t border-gray-200 pt-3 mt-2">
                                            <h3 className="text-sm font-medium text-gray-700">Bank Details</h3>

                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                                    Account Holder Name *
                                                </label>
                                                <input
                                                    type="text"
                                                    required
                                                    value={singleTruckBulkForm.bankAcHolderName}
                                                    onChange={(e) => setSingleTruckBulkForm({ ...singleTruckBulkForm, bankAcHolderName: e.target.value })}
                                                    className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-sm"
                                                    placeholder="Enter account holder name"
                                                />
                                            </div>

                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                                    Bank Name *
                                                </label>
                                                <input
                                                    type="text"
                                                    required
                                                    value={singleTruckBulkForm.bankName}
                                                    onChange={(e) => setSingleTruckBulkForm({ ...singleTruckBulkForm, bankName: e.target.value })}
                                                    className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-sm"
                                                    placeholder="Enter bank name"
                                                />
                                            </div>

                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                                    Account Number *
                                                </label>
                                                <input
                                                    type="text"
                                                    required
                                                    value={singleTruckBulkForm.bankAccountNo}
                                                    onChange={(e) => setSingleTruckBulkForm({ ...singleTruckBulkForm, bankAccountNo: e.target.value })}
                                                    className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-sm"
                                                    placeholder="Enter account number"
                                                />
                                            </div>

                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                                    IFSC Code *
                                                </label>
                                                <input
                                                    type="text"
                                                    required
                                                    value={singleTruckBulkForm.ifscCode}
                                                    onChange={(e) => setSingleTruckBulkForm({ ...singleTruckBulkForm, ifscCode: e.target.value })}
                                                    className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-sm"
                                                    placeholder="Enter IFSC code"
                                                />
                                            </div>

                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                                    PAN Number
                                                </label>
                                                <input
                                                    type="text"
                                                    value={singleTruckBulkForm.panNumber}
                                                    onChange={(e) => setSingleTruckBulkForm({ ...singleTruckBulkForm, panNumber: e.target.value })}
                                                    className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-sm"
                                                    placeholder="Enter PAN number (optional)"
                                                />
                                            </div>

                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                                    UTR/Reference Number
                                                </label>
                                                <input
                                                    type="text"
                                                    value={singleTruckBulkForm.utrNo}
                                                    onChange={(e) => setSingleTruckBulkForm({ ...singleTruckBulkForm, utrNo: e.target.value })}
                                                    className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-sm"
                                                    placeholder="Enter UTR/Reference"
                                                />
                                            </div>
                                        </div>
                                    )}

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Remarks
                                        </label>
                                        <textarea
                                            value={singleTruckBulkForm.remarks}
                                            onChange={(e) => setSingleTruckBulkForm({ ...singleTruckBulkForm, remarks: e.target.value })}
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
                                    onClick={() => setShowSingleTruckBulkModal(false)}
                                    className="px-4 py-2 border border-gray-300 text-gray-700 text-sm rounded hover:bg-gray-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={processingSingleTruckBulk}
                                    className="px-4 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-1"
                                >
                                    {processingSingleTruckBulk ? (
                                        <>
                                            <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div>
                                            <span>Processing...</span>
                                        </>
                                    ) : (
                                        <>
                                            <Layers className="w-4 h-4" />
                                            <span>Process Full Payment</span>
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
                    <div className="bg-white rounded-lg shadow-lg max-w-6xl w-full max-h-[90vh] overflow-hidden">
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
                                            <th className="py-2 px-3 text-left">Date/Time</th>
                                            <th className="py-2 px-3 text-left">Booking ID</th>
                                            <th className="py-2 px-3 text-left">Route</th>
                                            <th className="py-2 px-3 text-left">Payment For</th>
                                            <th className="py-2 px-3 text-left">Amount</th>
                                            <th className="py-2 px-3 text-left">Mode</th>
                                            <th className="py-2 px-3 text-left">Type</th>
                                            <th className="py-2 px-3 text-left">UTR No</th>
                                            <th className="py-2 px-3 text-left">Balance</th>
                                            <th className="py-2 px-3 text-left">Bank Details</th>
                                            <th className="py-2 px-3 text-left">PAN</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {Array.isArray(selectedPaymentHistory) && selectedPaymentHistory.map((payment, index) => (
                                            <tr key={payment.paymentId || index}
                                                className="border-t border-gray-200 hover:bg-gray-50">
                                                <td className="py-2 px-3">{formatDateTime(payment.date)}</td>
                                                <td className="py-2 px-3">
                                                    {payment.bookingId ? `#${payment.bookingId}` : '-'}
                                                </td>
                                                <td className="py-2 px-3">
                                                    {payment.route || '-'}
                                                </td>
                                                <td className="py-2 px-3">
                                                    <span className={`px-2 py-1 rounded text-xs ${payment.paymentFor === 'freight' ? 'bg-orange-100 text-orange-800' :
                                                        'bg-yellow-100 text-yellow-800'
                                                        }`}>
                                                        {payment.paymentFor || 'freight'}
                                                    </span>
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
                                                <td className="py-2 px-3 font-medium">
                                                    ₹{formatCurrency(payment.runningBalance)}
                                                </td>
                                                <td className="py-2 px-3">
                                                    {payment.mode === 'bank' ? (
                                                        <div className="text-xs">
                                                            <div className="font-medium">{payment.bankName || '-'}</div>
                                                            <div className="text-gray-500">A/c: {payment.bankAccountNo || '-'}</div>
                                                            <div className="text-gray-500">IFSC: {payment.ifscCode || '-'}</div>
                                                            <div className="text-gray-500">Holder: {payment.bankAcHolderName || '-'}</div>
                                                        </div>
                                                    ) : '-'}
                                                </td>
                                                <td className="py-2 px-3">
                                                    {payment.panNumber || '-'}
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