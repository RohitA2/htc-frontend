import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { debounce } from 'lodash';
import {
    Search,
    User,
    Phone,
    Calendar,
    CreditCard,
    Banknote,
    BookOpen,
    Download,
    ChevronRight,
    Filter,
    Printer,
    X,
    RefreshCw,
    TrendingUp,
    TrendingDown,
    Wallet,
    Truck,
    UserCircle,
    FileText
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const PartyTransactionLedger = () => {
    const [parties, setParties] = useState([]);
    const [filteredParties, setFilteredParties] = useState([]);
    const [selectedParty, setSelectedParty] = useState(null);
    const [ledgerData, setLedgerData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [loadingLedger, setLoadingLedger] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [dateRange, setDateRange] = useState({
        fromDate: '',
        toDate: ''
    });

    const API_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

    // Fetch parties list
    useEffect(() => {
        fetchParties();
    }, []);

    // Debounced search function
    const debouncedSearch = useCallback(
        debounce((searchValue, partiesList) => {
            if (!searchValue.trim()) {
                setFilteredParties(partiesList);
                return;
            }

            const searchLower = searchValue.toLowerCase().trim();

            const filtered = partiesList.filter(party => {
                // Search in party name
                if (party.partyName?.toLowerCase().includes(searchLower)) {
                    return true;
                }

                // Search in party phone
                if (party.partyPhone?.includes(searchValue)) {
                    return true;
                }

                // Search in truck numbers from bookings
                if (party.bookings?.some(booking =>
                    booking.truck?.truckNo?.toLowerCase().includes(searchLower)
                )) {
                    return true;
                }

                // Search in driver names from bookings
                if (party.bookings?.some(booking =>
                    booking.truck?.driverName?.toLowerCase().includes(searchLower)
                )) {
                    return true;
                }

                return false;
            });

            setFilteredParties(filtered);
        }, 300),
        []
    );

    // Update filtered parties when search term or parties change
    useEffect(() => {
        if (parties.length > 0) {
            debouncedSearch(searchTerm, parties);
        }
    }, [searchTerm, parties, debouncedSearch]);

    const fetchParties = async () => {
        try {
            setLoading(true);
            const response = await axios.get(`${API_URL}/ledger/party`);

            if (response.data.success) {
                const partiesData = response.data.data || [];
                setParties(partiesData);
                setFilteredParties(partiesData);
            } else {
                toast.error('Failed to fetch parties');
            }
        } catch (error) {
            console.error('Error fetching parties:', error);
            toast.error('Failed to load parties');
        } finally {
            setLoading(false);
        }
    };

    // Fetch ledger for selected party
    const fetchPartyLedger = async (partyId) => {
        if (!partyId) return;

        try {
            setLoadingLedger(true);
            const params = new URLSearchParams();
            if (dateRange.fromDate) params.append('fromDate', dateRange.fromDate);
            if (dateRange.toDate) params.append('toDate', dateRange.toDate);

            const response = await axios.get(
                `${API_URL}/ledger/party-tally/${partyId}?${params.toString()}`
            );

            if (response.data.success) {
                setLedgerData(response.data);
                // Find and set the selected party from parties list
                const party = parties.find(p => p.partyId === partyId);
                setSelectedParty(party);
            } else {
                toast.error('Failed to fetch ledger data');
            }
        } catch (error) {
            console.error('Error fetching ledger:', error);
            toast.error('Failed to load ledger data');
        } finally {
            setLoadingLedger(false);
        }
    };

    // Handle party selection
    const handlePartySelect = (party) => {
        setSelectedParty(party);
        fetchPartyLedger(party.partyId);
    };

    // Clear filters
    const clearFilters = () => {
        setSearchTerm('');
        setDateRange({ fromDate: '', toDate: '' });
        if (selectedParty) {
            fetchPartyLedger(selectedParty.partyId);
        }
    };

    // Format currency
    const formatCurrency = (amount) => {
        if (amount === null || amount === undefined) return '0';
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
            return 'Invalid Date';
        }
    };

    // Calculate party statistics
    const calculatePartyStats = () => {
        let totalParties = 0;
        let totalFreight = 0;
        let totalPaid = 0;
        let totalBalance = 0;
        let pendingParties = 0;

        if (Array.isArray(filteredParties)) {
            totalParties = filteredParties.length;
            totalFreight = filteredParties.reduce((sum, party) => sum + (party.totalFreight || 0), 0);
            totalPaid = filteredParties.reduce((sum, party) => sum + (party.totalPaid || 0), 0);
            totalBalance = filteredParties.reduce((sum, party) => sum + (party.balance || 0), 0);
            pendingParties = filteredParties.filter(party => (party.balance || 0) > 0).length;
        }

        return {
            totalParties,
            totalFreight,
            totalPaid,
            totalBalance,
            pendingParties
        };
    };

    const stats = calculatePartyStats();

    // Export to Excel
    const exportToExcel = () => {
        if (!ledgerData) {
            toast.error('No ledger data to export');
            return;
        }

        try {
            const worksheetData = [];

            // Add header
            worksheetData.push(['PARTY TRANSACTION LEDGER']);
            worksheetData.push(['']);
            worksheetData.push(['Party:', ledgerData.party.name]);
            worksheetData.push(['Opening Balance:', formatCurrency(ledgerData.openingBalance)]);
            worksheetData.push(['Closing Balance:', formatCurrency(ledgerData.closingBalance)]);
            worksheetData.push(['']);

            // Add table headers
            worksheetData.push([
                'Date',
                'Particulars',
                'Voucher Type',
                'Voucher No',
                'Debit (₹)',
                'Credit (₹)',
                'Balance (₹)',
                'Balance Type'
            ]);

            // Add ledger entries
            ledgerData.ledger.forEach(entry => {
                worksheetData.push([
                    formatDate(entry.date),
                    entry.particulars,
                    entry.voucherType,
                    entry.voucherNo,
                    formatCurrency(entry.debit),
                    formatCurrency(entry.credit),
                    formatCurrency(entry.balance),
                    entry.balanceType
                ]);
            });

            // Create worksheet
            const ws = XLSX.utils.aoa_to_sheet(worksheetData);

            // Set column widths
            const wscols = [
                { wch: 12 }, // Date
                { wch: 40 }, // Particulars
                { wch: 15 }, // Voucher Type
                { wch: 12 }, // Voucher No
                { wch: 15 }, // Debit
                { wch: 15 }, // Credit
                { wch: 15 }, // Balance
                { wch: 12 }  // Balance Type
            ];
            ws['!cols'] = wscols;

            // Create workbook
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, 'Party Ledger');

            // Generate filename
            const partyName = selectedParty.partyName.replace(/\s+/g, '_');
            const dateStr = new Date().toISOString().split('T')[0];
            XLSX.writeFile(wb, `Party_Ledger_${partyName}_${dateStr}.xlsx`);

            toast.info('Excel file exported successfully!');
        } catch (error) {
            console.error('Error exporting to Excel:', error);
            toast.error('Failed to export Excel file');
        }
    };

    // Print ledger
    const printLedger = () => {
        if (!ledgerData) {
            toast.error('No ledger data to print');
            return;
        }

        const printWindow = window.open('', '_blank');
        printWindow.document.write(`
            <html>
                <head>
                    <title>Party Ledger - ${selectedParty.partyName}</title>
                    <style>
                        body { font-family: Arial, sans-serif; padding: 20px; }
                        h1 { color: #333; text-align: center; }
                        .header { margin-bottom: 20px; }
                        .info { margin-bottom: 10px; }
                        table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
                        th { background-color: #f5f5f5; }
                        .debit { color: #dc2626; }
                        .credit { color: #16a34a; }
                        .balance { font-weight: bold; }
                        .footer { margin-top: 30px; text-align: center; font-size: 12px; color: #666; }
                    </style>
                </head>
                <body>
                    <h1>PARTY TRANSACTION LEDGER</h1>
                    <div class="header">
                        <div class="info"><strong>Party:</strong> ${ledgerData.party.name}</div>
                        <div class="info"><strong>Opening Balance:</strong> ₹${formatCurrency(ledgerData.openingBalance)}</div>
                        <div class="info"><strong>Closing Balance:</strong> ₹${formatCurrency(ledgerData.closingBalance)}</div>
                    </div>
                    <table>
                        <thead>
                            <tr>
                                <th>Date</th>
                                <th>Particulars</th>
                                <th>Voucher Type</th>
                                <th>Voucher No</th>
                                <th>Debit (₹)</th>
                                <th>Credit (₹)</th>
                                <th>Balance (₹)</th>
                                <th>Balance Type</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${ledgerData.ledger.map(entry => `
                                <tr>
                                    <td>${formatDate(entry.date)}</td>
                                    <td>${entry.particulars}</td>
                                    <td>${entry.voucherType}</td>
                                    <td>${entry.voucherNo}</td>
                                    <td class="debit">${entry.debit ? '₹' + formatCurrency(entry.debit) : ''}</td>
                                    <td class="credit">${entry.credit ? '₹' + formatCurrency(entry.credit) : ''}</td>
                                    <td class="balance">₹${formatCurrency(entry.balance)}</td>
                                    <td>${entry.balanceType}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                    <div class="footer">
                        <p>Generated on: ${new Date().toLocaleDateString()}</p>
                    </div>
                </body>
            </html>
        `);
        printWindow.document.close();
        printWindow.print();
    };

    // Calculate totals
    const calculateTotals = () => {
        if (!ledgerData || !ledgerData.ledger) return { totalDebit: 0, totalCredit: 0 };

        const totalDebit = ledgerData.ledger.reduce((sum, entry) => sum + (entry.debit || 0), 0);
        const totalCredit = ledgerData.ledger.reduce((sum, entry) => sum + (entry.credit || 0), 0);

        return { totalDebit, totalCredit };
    };

    const totals = calculateTotals();

    // Get unique truck numbers for a party
    const getPartyTrucks = (party) => {
        if (!party.bookings || !Array.isArray(party.bookings)) return [];
        const trucks = party.bookings.map(b => b.truck?.truckNo).filter(Boolean);
        return [...new Set(trucks)];
    };

    // Get unique driver names for a party
    const getPartyDrivers = (party) => {
        if (!party.bookings || !Array.isArray(party.bookings)) return [];
        const drivers = party.bookings.map(b => b.truck?.driverName).filter(Boolean);
        return [...new Set(drivers)];
    };

    // Handle search input change
    const handleSearchChange = (e) => {
        setSearchTerm(e.target.value);
    };

    return (
        <div className="min-h-screen bg-gray-50 p-4 md:p-6">
            {/* Header */}
            <div className="mb-8">
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-3xl md:text-4xl font-bold text-gray-800 mb-2">
                            Party Transaction Ledger
                        </h1>
                        <p className="text-gray-600">
                            View detailed transaction history for each party
                        </p>
                    </div>
                    <div className="flex items-center space-x-3">
                        {ledgerData && (
                            <>
                                <button
                                    onClick={exportToExcel}
                                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2"
                                >
                                    <Download className="w-4 h-4" />
                                    <span className="hidden md:inline">Export Excel</span>
                                </button>
                                <button
                                    onClick={printLedger}
                                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
                                >
                                    <Printer className="w-4 h-4" />
                                    <span className="hidden md:inline">Print</span>
                                </button>
                            </>
                        )}
                        <button
                            onClick={fetchParties}
                            className="p-2 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors"
                            title="Refresh"
                        >
                            <RefreshCw className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            </div>

            {/* Stats Summary */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
                <div className="bg-white p-4 rounded-lg border border-gray-200">
                    <div className="flex items-center">
                        <div className="p-2 bg-blue-100 rounded-lg mr-3">
                            <User className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-600">Total Parties</p>
                            <p className="text-lg font-bold text-gray-800">
                                {stats.totalParties}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="bg-white p-4 rounded-lg border border-gray-200">
                    <div className="flex items-center">
                        <div className="p-2 bg-orange-100 rounded-lg mr-3">
                            <FileText className="w-5 h-5 text-orange-600" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-600">Total Freight</p>
                            <p className="text-lg font-bold text-gray-800">
                                ₹{formatCurrency(stats.totalFreight)}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="bg-white p-4 rounded-lg border border-gray-200">
                    <div className="flex items-center">
                        <div className="p-2 bg-green-100 rounded-lg mr-3">
                            <CreditCard className="w-5 h-5 text-green-600" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-600">Total Paid</p>
                            <p className="text-lg font-bold text-gray-800">
                                ₹{formatCurrency(stats.totalPaid)}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="bg-white p-4 rounded-lg border border-gray-200">
                    <div className="flex items-center">
                        <div className="p-2 bg-red-100 rounded-lg mr-3">
                            <Wallet className="w-5 h-5 text-red-600" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-600">Total Balance</p>
                            <p className="text-lg font-bold text-gray-800">
                                ₹{formatCurrency(stats.totalBalance)}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="bg-white p-4 rounded-lg border border-gray-200">
                    <div className="flex items-center">
                        <div className="p-2 bg-purple-100 rounded-lg mr-3">
                            <UserCircle className="w-5 h-5 text-purple-600" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-600">Pending Parties</p>
                            <p className="text-lg font-bold text-gray-800">
                                {stats.pendingParties}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Search and Filters */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 md:p-6 mb-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex-1">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                            <input
                                type="text"
                                placeholder="Search by party name, phone, truck number, or driver name..."
                                value={searchTerm}
                                onChange={handleSearchChange}
                                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                            />
                            {searchTerm && (
                                <button
                                    onClick={() => setSearchTerm('')}
                                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            )}
                        </div>
                        <p className="text-xs text-gray-500 mt-2">
                            Search across all fields: party name, phone number, truck numbers, and driver names
                        </p>
                    </div>

                    <div className="flex flex-wrap gap-2">
                        <div className="flex items-center space-x-2">
                            <Calendar className="w-4 h-4 text-gray-500" />
                            <input
                                type="date"
                                value={dateRange.fromDate}
                                onChange={(e) => setDateRange({ ...dateRange, fromDate: e.target.value })}
                                className="px-3 py-2 border border-gray-300 rounded text-sm"
                                placeholder="From Date"
                            />
                            <span className="text-gray-500">to</span>
                            <input
                                type="date"
                                value={dateRange.toDate}
                                onChange={(e) => setDateRange({ ...dateRange, toDate: e.target.value })}
                                className="px-3 py-2 border border-gray-300 rounded text-sm"
                                placeholder="To Date"
                            />
                        </div>
                        <button
                            onClick={clearFilters}
                            className="px-4 py-2 border border-gray-300 text-gray-700 text-sm rounded hover:bg-gray-50 flex items-center space-x-1"
                        >
                            <X className="w-4 h-4" />
                            <span>Clear All</span>
                        </button>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                {/* Left Sidebar - Party List */}
                <div className="lg:col-span-1">
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                        {/* Party List Header */}
                        <div className="p-4 border-b border-gray-200">
                            <h2 className="text-lg font-semibold text-gray-800 mb-2">
                                Party List ({filteredParties.length})
                            </h2>
                            {searchTerm && (
                                <p className="text-sm text-gray-600">
                                    Showing results for: "{searchTerm}"
                                </p>
                            )}
                        </div>

                        {/* Party List */}
                        <div className="max-h-screen overflow-y-auto">
                            {loading ? (
                                <div className="flex justify-center py-10">
                                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                                </div>
                            ) : filteredParties.length === 0 ? (
                                <div className="text-center py-10">
                                    <User className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                                    <p className="text-gray-600">No parties found</p>
                                    {searchTerm && (
                                        <p className="text-sm text-gray-500 mt-1">
                                            Try different search terms
                                        </p>
                                    )}
                                </div>
                            ) : (
                                filteredParties.map((party) => {
                                    const trucks = getPartyTrucks(party);
                                    const drivers = getPartyDrivers(party);

                                    return (
                                        <div
                                            key={party.partyId}
                                            onClick={() => handlePartySelect(party)}
                                            className={`p-4 border-b border-gray-100 cursor-pointer transition-colors hover:bg-gray-50 ${selectedParty?.partyId === party.partyId
                                                ? 'bg-blue-50 border-l-4 border-l-blue-500'
                                                : ''
                                                }`}
                                        >
                                            <div className="flex justify-between items-start">
                                                <div className="flex-1">
                                                    <div className="flex items-center space-x-2 mb-2">
                                                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                                                            <User className="w-4 h-4 text-blue-600" />
                                                        </div>
                                                        <div className="flex-1">
                                                            <h3 className="font-medium text-gray-900">
                                                                {party.partyName}
                                                            </h3>
                                                            <div className="flex items-center space-x-1 text-sm text-gray-500">
                                                                <Phone className="w-3 h-3" />
                                                                <span>{party.partyPhone || 'N/A'}</span>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* Party Financial Summary */}
                                                    <div className="grid grid-cols-3 gap-1 mb-2">
                                                        <div className="text-center">
                                                            <p className="text-xs text-gray-500">Freight</p>
                                                            <p className="text-xs font-bold text-orange-700">
                                                                ₹{formatCurrency(party.totalFreight || 0)}
                                                            </p>
                                                        </div>
                                                        <div className="text-center">
                                                            <p className="text-xs text-gray-500">Paid</p>
                                                            <p className="text-xs font-bold text-green-700">
                                                                ₹{formatCurrency(party.totalPaid || 0)}
                                                            </p>
                                                        </div>
                                                        <div className="text-center">
                                                            <p className="text-xs text-gray-500">Balance</p>
                                                            <p className={`text-xs font-bold ${(party.balance || 0) > 0 ? 'text-red-700' : 'text-gray-700'}`}>
                                                                ₹{formatCurrency(party.balance || 0)}
                                                            </p>
                                                        </div>
                                                    </div>

                                                    {/* Truck and Driver Info */}
                                                    {(trucks.length > 0 || drivers.length > 0) && (
                                                        <div className="mt-2 space-y-1">
                                                            {trucks.length > 0 && (
                                                                <div className="flex items-center space-x-1 text-xs text-gray-600">
                                                                    <Truck className="w-3 h-3" />
                                                                    <span className="truncate">
                                                                        {trucks.join(', ')}
                                                                    </span>
                                                                </div>
                                                            )}
                                                            {drivers.length > 0 && (
                                                                <div className="flex items-center space-x-1 text-xs text-gray-600">
                                                                    <UserCircle className="w-3 h-3" />
                                                                    <span className="truncate">
                                                                        {drivers.join(', ')}
                                                                    </span>
                                                                </div>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                                <ChevronRight className={`w-5 h-5 text-gray-400 ${selectedParty?.partyId === party.partyId ? 'text-blue-500' : ''
                                                    }`} />
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </div>
                </div>

                {/* Right Panel - Ledger Details */}
                <div className="lg:col-span-3">
                    {!selectedParty ? (
                        <div className="bg-white rounded-lg shadow-sm border border-gray-200 h-full flex flex-col items-center justify-center p-8">
                            <BookOpen className="w-16 h-16 text-gray-300 mb-4" />
                            <h3 className="text-xl font-medium text-gray-700 mb-2">
                                Select a Party
                            </h3>
                            <p className="text-gray-600 text-center max-w-md">
                                Choose a party from the list to view their transaction ledger
                            </p>
                        </div>
                    ) : (
                        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                            {/* Ledger Header */}
                            <div className="p-6 border-b border-gray-200">
                                <div className="flex flex-col md:flex-row md:items-center justify-between mb-6">
                                    <div>
                                        <div className="flex items-center space-x-3 mb-2">
                                            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                                                <User className="w-6 h-6 text-blue-600" />
                                            </div>
                                            <div>
                                                <h2 className="text-2xl font-bold text-gray-900">
                                                    {selectedParty.partyName}
                                                </h2>
                                                <div className="flex items-center space-x-2 text-gray-600">
                                                    <Phone className="w-4 h-4" />
                                                    <span>{selectedParty.partyPhone || 'N/A'}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex space-x-2 mt-4 md:mt-0">
                                        <div className="flex items-center space-x-2">
                                            <Calendar className="w-4 h-4 text-gray-500" />
                                            <input
                                                type="date"
                                                value={dateRange.fromDate}
                                                onChange={(e) => setDateRange({ ...dateRange, fromDate: e.target.value })}
                                                className="px-3 py-1.5 border border-gray-300 rounded text-sm"
                                            />
                                            <span className="text-gray-500">to</span>
                                            <input
                                                type="date"
                                                value={dateRange.toDate}
                                                onChange={(e) => setDateRange({ ...dateRange, toDate: e.target.value })}
                                                className="px-3 py-1.5 border border-gray-300 rounded text-sm"
                                            />
                                        </div>
                                        <button
                                            onClick={() => fetchPartyLedger(selectedParty.partyId)}
                                            className="px-4 py-1.5 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 flex items-center space-x-1"
                                        >
                                            <Filter className="w-4 h-4" />
                                            <span>Apply</span>
                                        </button>
                                    </div>
                                </div>

                                {/* Summary Cards */}
                                {ledgerData && (
                                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                        {/* <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <p className="text-sm text-blue-700 mb-1">Opening Balance</p>
                                                    <p className="text-xl font-bold text-blue-900">
                                                        ₹{formatCurrency(ledgerData.openingBalance)}
                                                    </p>
                                                </div>
                                                <Wallet className="w-8 h-8 text-blue-500" />
                                            </div>
                                        </div> */}
                                        <div className="bg-red-50 p-4 rounded-lg border border-red-200">
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <p className="text-sm text-red-700 mb-1">Total Debit</p>
                                                    <p className="text-xl font-bold text-red-900">
                                                        ₹{formatCurrency(totals.totalDebit)}
                                                    </p>
                                                </div>
                                                <TrendingUp className="w-8 h-8 text-red-500" />
                                            </div>
                                        </div>
                                        <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <p className="text-sm text-green-700 mb-1">Total Credit</p>
                                                    <p className="text-xl font-bold text-green-900">
                                                        ₹{formatCurrency(totals.totalCredit)}
                                                    </p>
                                                </div>
                                                <TrendingDown className="w-8 h-8 text-green-500" />
                                            </div>
                                        </div>
                                        <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <p className="text-sm text-purple-700 mb-1">Closing Balance</p>
                                                    <p className={`text-xl font-bold ${ledgerData.closingBalance > 0
                                                        ? 'text-red-900'
                                                        : ledgerData.closingBalance < 0
                                                            ? 'text-green-900'
                                                            : 'text-purple-900'
                                                        }`}>
                                                        ₹{formatCurrency(ledgerData.closingBalance)}
                                                    </p>
                                                    <span className={`text-xs px-2 py-0.5 rounded-full ${ledgerData.closingBalance > 0
                                                        ? 'bg-red-100 text-red-800'
                                                        : ledgerData.closingBalance < 0
                                                            ? 'bg-green-100 text-green-800'
                                                            : 'bg-purple-100 text-purple-800'
                                                        }`}>
                                                        {ledgerData.closingBalance > 0 ? 'To Receive' :
                                                            ledgerData.closingBalance < 0 ? 'To Pay' : 'Settled'}
                                                    </span>
                                                </div>
                                                <CreditCard className="w-8 h-8 text-purple-500" />
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Ledger Table */}
                            <div className="p-6">
                                {loadingLedger ? (
                                    <div className="flex flex-col items-center justify-center py-20">
                                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mb-3"></div>
                                        <p className="text-gray-600">Loading ledger data...</p>
                                    </div>
                                ) : !ledgerData ? (
                                    <div className="text-center py-20">
                                        <BookOpen className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                                        <h3 className="text-lg font-medium text-gray-700 mb-2">
                                            No Ledger Data
                                        </h3>
                                        <p className="text-gray-600">
                                            Click "Apply" to load transaction details for {selectedParty.partyName}
                                        </p>
                                    </div>
                                ) : ledgerData.ledger.length === 0 ? (
                                    <div className="text-center py-20">
                                        <Banknote className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                                        <h3 className="text-lg font-medium text-gray-700 mb-2">
                                            No Transactions Found
                                        </h3>
                                        <p className="text-gray-600">
                                            No transaction records for the selected period
                                        </p>
                                    </div>
                                ) : (
                                    <>
                                        <div className="overflow-x-auto">
                                            <table className="w-full">
                                                <thead>
                                                    <tr className="bg-gray-50 border-b border-gray-200">
                                                        <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                            Date
                                                        </th>
                                                        <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                            Particulars
                                                        </th>
                                                        <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                            Voucher Type
                                                        </th>
                                                        <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                            Voucher No
                                                        </th>
                                                        <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                            Debit (₹)
                                                        </th>
                                                        <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                            Credit (₹)
                                                        </th>
                                                        <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                            Balance (₹)
                                                        </th>
                                                        <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                            Type
                                                        </th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-gray-200">
                                                    {ledgerData.ledger.map((entry, index) => (
                                                        <tr
                                                            key={index}
                                                            className="hover:bg-gray-50"
                                                        >
                                                            <td className="py-3 px-4">
                                                                <div className="flex items-center space-x-2">
                                                                    <Calendar className="w-4 h-4 text-gray-400" />
                                                                    <span className="text-sm font-medium text-gray-900">
                                                                        {formatDate(entry.date)}
                                                                    </span>
                                                                </div>
                                                            </td>
                                                            <td className="py-3 px-4">
                                                                <div className="max-w-xs">
                                                                    <p className="text-sm text-gray-900">
                                                                        {entry.particulars}
                                                                    </p>
                                                                </div>
                                                            </td>
                                                            <td className="py-3 px-4">
                                                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${entry.voucherType === 'Booking'
                                                                    ? 'bg-blue-100 text-blue-800'
                                                                    : 'bg-green-100 text-green-800'
                                                                    }`}>
                                                                    {entry.voucherType}
                                                                </span>
                                                            </td>
                                                            <td className="py-3 px-4">
                                                                <span className="text-sm font-medium text-gray-900">
                                                                    #{entry.voucherNo}
                                                                </span>
                                                            </td>
                                                            <td className="py-3 px-4">
                                                                {entry.debit > 0 && (
                                                                    <span className="text-sm font-bold text-red-700">
                                                                        ₹{formatCurrency(entry.debit)}
                                                                    </span>
                                                                )}
                                                            </td>
                                                            <td className="py-3 px-4">
                                                                {entry.credit > 0 && (
                                                                    <span className="text-sm font-bold text-green-700">
                                                                        ₹{formatCurrency(entry.credit)}
                                                                    </span>
                                                                )}
                                                            </td>
                                                            <td className="py-3 px-4">
                                                                <span className={`text-sm font-bold ${entry.balance > 0
                                                                    ? 'text-red-700'
                                                                    : entry.balance < 0
                                                                        ? 'text-green-700'
                                                                        : 'text-gray-700'
                                                                    }`}>
                                                                    ₹{formatCurrency(entry.balance)}
                                                                </span>
                                                            </td>
                                                            <td className="py-3 px-4">
                                                                <span className={`px-2 py-1 rounded text-xs font-medium ${entry.balanceType === 'Dr'
                                                                    ? 'bg-red-100 text-red-800'
                                                                    : 'bg-green-100 text-green-800'
                                                                    }`}>
                                                                    {entry.balanceType}
                                                                </span>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>

                                        {/* Table Footer */}
                                        <div className="mt-6 pt-6 border-t border-gray-200">
                                            <div className="flex justify-end">
                                                <div className="text-right">
                                                    {/* <div className="flex items-center justify-between mb-2">
                                                        <span className="text-sm text-gray-600 mr-4">Opening Balance:</span>
                                                        <span className="text-sm font-bold text-gray-900">
                                                            ₹{formatCurrency(ledgerData.openingBalance)}
                                                        </span>
                                                    </div> */}   
                                                    <div className="flex items-center justify-between mb-2">
                                                        <span className="text-sm text-gray-600 mr-4">Total Debit:</span>
                                                        <span className="text-sm font-bold text-red-700">
                                                            ₹{formatCurrency(totals.totalDebit)}
                                                        </span>
                                                    </div>
                                                    <div className="flex items-center justify-between mb-2">
                                                        <span className="text-sm text-gray-600 mr-4">Total Credit:</span>
                                                        <span className="text-sm font-bold text-green-700">
                                                            ₹{formatCurrency(totals.totalCredit)}
                                                        </span>
                                                    </div>
                                                    <div className="flex items-center justify-between pt-2 border-t border-gray-200">
                                                        <span className="text-base font-semibold text-gray-800 mr-4">
                                                            Closing Balance:
                                                        </span>
                                                        <span className={`text-lg font-bold ${ledgerData.closingBalance > 0
                                                            ? 'text-red-700'
                                                            : ledgerData.closingBalance < 0
                                                                ? 'text-green-700'
                                                                : 'text-gray-700'
                                                            }`}>
                                                            ₹{formatCurrency(ledgerData.closingBalance)}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default PartyTransactionLedger;