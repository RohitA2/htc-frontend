import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { debounce } from 'lodash';
import {
    Search,
    Calendar,
    Download,
    Printer,
    RefreshCw,
    FileText,
    BookOpen,
    CreditCard,
    Banknote,
    Truck,
    User,
    Percent,
    X,
    Filter,
    ChevronDown,
    ChevronUp,
    Wallet,
    TrendingUp,
    TrendingDown
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const DayBook = () => {
    const [entries, setEntries] = useState([]);
    const [filteredEntries, setFilteredEntries] = useState([]);
    const [loading, setLoading] = useState(false);
    const [dateFilter, setDateFilter] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [voucherTypeFilter, setVoucherTypeFilter] = useState('all');
    const [ledgerFilter, setLedgerFilter] = useState('all');
    const [groupByDate, setGroupByDate] = useState(false);
    const [expandedDates, setExpandedDates] = useState([]);
    const [summary, setSummary] = useState({
        totalDebit: 0,
        totalCredit: 0,
        difference: 0
    });

    const API_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

    // Fetch day book entries
    useEffect(() => {
        fetchDayBook();
    }, [dateFilter]);

    const fetchDayBook = async () => {
        try {
            setLoading(true);
            const params = new URLSearchParams();
            if (dateFilter) params.append('date', dateFilter);

            const response = await axios.get(`${API_URL}/accounting/day-book?${params.toString()}`);

            if (response.data.success) {
                const entriesData = response.data.data || [];
                setEntries(entriesData);
                setFilteredEntries(entriesData);
                calculateSummary(entriesData);
            } else {
                toast.error('Failed to fetch day book entries');
            }
        } catch (error) {
            console.error('Error fetching day book:', error);
            toast.error('Failed to load day book');
        } finally {
            setLoading(false);
        }
    };

    // Calculate summary statistics
    const calculateSummary = (entriesList) => {
        const totalDebit = entriesList.reduce((sum, entry) => sum + (entry.debit || 0), 0);
        const totalCredit = entriesList.reduce((sum, entry) => sum + (entry.credit || 0), 0);
        const difference = totalDebit - totalCredit;

        setSummary({
            totalDebit,
            totalCredit,
            difference
        });
    };

    // Get unique voucher types
    const getUniqueVoucherTypes = () => {
        const types = entries.map(entry => entry.voucherType);
        return [...new Set(types)].filter(Boolean);
    };

    // Get unique ledgers
    const getUniqueLedgers = () => {
        const ledgers = entries.map(entry => entry.ledger);
        return [...new Set(ledgers)].filter(Boolean).sort();
    };

    // Filter entries based on criteria
    useEffect(() => {
        let filtered = [...entries];

        // Apply search filter
        if (searchTerm) {
            const searchLower = searchTerm.toLowerCase();
            filtered = filtered.filter(entry =>
                entry.ledger?.toLowerCase().includes(searchLower) ||
                entry.particulars?.toLowerCase().includes(searchLower) ||
                entry.voucherNo?.toString().includes(searchTerm)
            );
        }

        // Apply voucher type filter
        if (voucherTypeFilter !== 'all') {
            filtered = filtered.filter(entry => entry.voucherType === voucherTypeFilter);
        }

        // Apply ledger filter
        if (ledgerFilter !== 'all') {
            filtered = filtered.filter(entry => entry.ledger === ledgerFilter);
        }

        setFilteredEntries(filtered);
        calculateSummary(filtered);
    }, [searchTerm, voucherTypeFilter, ledgerFilter, entries]);

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

    // Group entries by date
    const groupEntriesByDate = () => {
        const grouped = {};
        filteredEntries.forEach(entry => {
            const date = formatDate(entry.date);
            if (!grouped[date]) {
                grouped[date] = [];
            }
            grouped[date].push(entry);
        });
        return grouped;
    };

    // Get voucher type icon and color
    const getVoucherTypeInfo = (type) => {
        switch (type) {
            case 'Booking':
                return { icon: <BookOpen className="w-4 h-4" />, color: 'bg-blue-100 text-blue-800' };
            case 'Receipt':
                return { icon: <CreditCard className="w-4 h-4" />, color: 'bg-green-100 text-green-800' };
            case 'Payment':
                return { icon: <Banknote className="w-4 h-4" />, color: 'bg-red-100 text-red-800' };
            default:
                return { icon: <FileText className="w-4 h-4" />, color: 'bg-gray-100 text-gray-800' };
        }
    };

    // Get ledger icon
    const getLedgerIcon = (ledger) => {
        if (ledger === 'Cash' || ledger === 'Bank') {
            return <Wallet className="w-4 h-4" />;
        }
        if (ledger === 'Commission / Difference') {
            return <Percent className="w-4 h-4" />;
        }
        if (ledger && ledger.includes('MP') || ledger && ledger.includes('MH')) {
            return <Truck className="w-4 h-4" />;
        }
        return <User className="w-4 h-4" />;
    };

    // Toggle date group expansion
    const toggleDateGroup = (date) => {
        if (expandedDates.includes(date)) {
            setExpandedDates(expandedDates.filter(d => d !== date));
        } else {
            setExpandedDates([...expandedDates, date]);
        }
    };

    // Export to Excel
    const exportToExcel = () => {
        if (filteredEntries.length === 0) {
            toast.error('No data to export');
            return;
        }

        try {
            const worksheetData = [];

            // Add header
            worksheetData.push(['DAY BOOK - ACCOUNTING ENTRIES']);
            worksheetData.push(['']);
            worksheetData.push(['Date Range:', dateFilter ? formatDate(dateFilter) : 'All Dates']);
            worksheetData.push(['Total Debit:', formatCurrency(summary.totalDebit)]);
            worksheetData.push(['Total Credit:', formatCurrency(summary.totalCredit)]);
            worksheetData.push(['Difference:', formatCurrency(summary.difference)]);
            worksheetData.push(['']);

            // Add table headers
            worksheetData.push([
                'Date',
                'Voucher Type',
                'Voucher No',
                'Ledger',
                'Particulars',
                'Debit (₹)',
                'Credit (₹)'
            ]);

            // Add entries
            filteredEntries.forEach(entry => {
                worksheetData.push([
                    formatDate(entry.date),
                    entry.voucherType,
                    entry.voucherNo,
                    entry.ledger,
                    entry.particulars,
                    formatCurrency(entry.debit),
                    formatCurrency(entry.credit)
                ]);
            });

            // Create worksheet
            const ws = XLSX.utils.aoa_to_sheet(worksheetData);

            // Set column widths
            const wscols = [
                { wch: 12 }, // Date
                { wch: 15 }, // Voucher Type
                { wch: 12 }, // Voucher No
                { wch: 20 }, // Ledger
                { wch: 40 }, // Particulars
                { wch: 15 }, // Debit
                { wch: 15 }  // Credit
            ];
            ws['!cols'] = wscols;

            // Create workbook
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, 'Day Book');

            // Generate filename
            const dateStr = dateFilter || new Date().toISOString().split('T')[0];
            XLSX.writeFile(wb, `Day_Book_${dateStr}.xlsx`);

            toast.success('Excel file exported successfully!');
        } catch (error) {
            console.error('Error exporting to Excel:', error);
            toast.error('Failed to export Excel file');
        }
    };

    // Print day book
    const printDayBook = () => {
        if (filteredEntries.length === 0) {
            toast.error('No data to print');
            return;
        }

        const printWindow = window.open('', '_blank');
        printWindow.document.write(`
            <html>
                <head>
                    <title>Day Book - ${dateFilter ? formatDate(dateFilter) : 'All Dates'}</title>
                    <style>
                        body { font-family: Arial, sans-serif; padding: 20px; }
                        h1 { color: #333; text-align: center; margin-bottom: 30px; }
                        .header { margin-bottom: 20px; }
                        .summary { display: flex; justify-content: space-between; margin-bottom: 20px; padding: 10px; background: #f5f5f5; border-radius: 5px; }
                        .summary-item { text-align: center; }
                        .summary-label { font-size: 12px; color: #666; }
                        .summary-value { font-size: 16px; font-weight: bold; }
                        table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                        th { background-color: #f5f5f5; border: 1px solid #ddd; padding: 8px; text-align: left; font-size: 12px; }
                        td { border: 1px solid #ddd; padding: 8px; font-size: 12px; }
                        .debit { color: #dc2626; }
                        .credit { color: #16a34a; }
                        .voucher-type { padding: 2px 6px; border-radius: 3px; font-size: 11px; }
                        .booking { background: #dbeafe; color: #1e40af; }
                        .receipt { background: #d1fae5; color: #065f46; }
                        .payment { background: #fee2e2; color: #991b1b; }
                        .footer { margin-top: 30px; text-align: center; font-size: 12px; color: #666; }
                    </style>
                </head>
                <body>
                    <h1>DAY BOOK - ACCOUNTING ENTRIES</h1>
                    <div class="header">
                        <p><strong>Date Range:</strong> ${dateFilter ? formatDate(dateFilter) : 'All Dates'}</p>
                    </div>
                    <div class="summary">
                        <div class="summary-item">
                            <div class="summary-label">Total Debit</div>
                            <div class="summary-value debit">₹${formatCurrency(summary.totalDebit)}</div>
                        </div>
                        <div class="summary-item">
                            <div class="summary-label">Total Credit</div>
                            <div class="summary-value credit">₹${formatCurrency(summary.totalCredit)}</div>
                        </div>
                        <div class="summary-item">
                            <div class="summary-label">Difference</div>
                            <div class="summary-value ${summary.difference >= 0 ? 'debit' : 'credit'}">₹${formatCurrency(Math.abs(summary.difference))}</div>
                        </div>
                    </div>
                    <table>
                        <thead>
                            <tr>
                                <th>Date</th>
                                <th>Voucher Type</th>
                                <th>Voucher No</th>
                                <th>Ledger</th>
                                <th>Particulars</th>
                                <th>Debit (₹)</th>
                                <th>Credit (₹)</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${filteredEntries.map(entry => `
                                <tr>
                                    <td>${formatDate(entry.date)}</td>
                                    <td><span class="voucher-type ${entry.voucherType.toLowerCase()}">${entry.voucherType}</span></td>
                                    <td>${entry.voucherNo}</td>
                                    <td>${entry.ledger}</td>
                                    <td>${entry.particulars}</td>
                                    <td class="debit">${entry.debit ? '₹' + formatCurrency(entry.debit) : ''}</td>
                                    <td class="credit">${entry.credit ? '₹' + formatCurrency(entry.credit) : ''}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                    <div class="footer">
                        <p>Generated on: ${new Date().toLocaleDateString()} | Total Entries: ${filteredEntries.length}</p>
                    </div>
                </body>
            </html>
        `);
        printWindow.document.close();
        printWindow.print();
    };

    // Clear all filters
    const clearFilters = () => {
        setSearchTerm('');
        setDateFilter('');
        setVoucherTypeFilter('all');
        setLedgerFilter('all');
        setGroupByDate(false);
        setExpandedDates([]);
    };

    const groupedEntries = groupByDate ? groupEntriesByDate() : {};
    const uniqueVoucherTypes = getUniqueVoucherTypes();
    const uniqueLedgers = getUniqueLedgers();

    return (
        <div className="min-h-screen bg-gray-50 p-4 md:p-6">
            {/* Header */}
            <div className="mb-8">
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-3xl md:text-4xl font-bold text-gray-800 mb-2">
                            Day Book
                        </h1>
                        <p className="text-gray-600">
                            Complete accounting entries with double-entry system
                        </p>
                    </div>
                    <div className="flex items-center space-x-3">
                        <button
                            onClick={exportToExcel}
                            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2"
                        >
                            <Download className="w-4 h-4" />
                            <span className="hidden md:inline">Export Excel</span>
                        </button>
                        <button
                            onClick={printDayBook}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
                        >
                            <Printer className="w-4 h-4" />
                            <span className="hidden md:inline">Print</span>
                        </button>
                        <button
                            onClick={fetchDayBook}
                            className="p-2 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors"
                            title="Refresh"
                        >
                            <RefreshCw className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-white p-4 rounded-lg border border-gray-200">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-600 mb-1">Total Debit</p>
                            <p className="text-xl font-bold text-red-700">
                                ₹{formatCurrency(summary.totalDebit)}
                            </p>
                        </div>
                        <TrendingUp className="w-8 h-8 text-red-500" />
                    </div>
                </div>

                <div className="bg-white p-4 rounded-lg border border-gray-200">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-600 mb-1">Total Credit</p>
                            <p className="text-xl font-bold text-green-700">
                                ₹{formatCurrency(summary.totalCredit)}
                            </p>
                        </div>
                        <TrendingDown className="w-8 h-8 text-green-500" />
                    </div>
                </div>

                <div className="bg-white p-4 rounded-lg border border-gray-200">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-600 mb-1">Difference</p>
                            <p className={`text-xl font-bold ${summary.difference >= 0 ? 'text-red-700' : 'text-green-700'}`}>
                                ₹{formatCurrency(Math.abs(summary.difference))}
                            </p>
                        </div>
                        <Wallet className="w-8 h-8 text-gray-500" />
                    </div>
                </div>

                <div className="bg-white p-4 rounded-lg border border-gray-200">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-600 mb-1">Total Entries</p>
                            <p className="text-xl font-bold text-gray-800">
                                {filteredEntries.length}
                            </p>
                        </div>
                        <FileText className="w-8 h-8 text-gray-500" />
                    </div>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 md:p-6 mb-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Search Entries
                        </label>
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                            <input
                                type="text"
                                placeholder="Search by ledger, particulars, or voucher no..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Date Filter
                        </label>
                        <div className="relative">
                            <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                            <input
                                type="date"
                                value={dateFilter}
                                onChange={(e) => setDateFilter(e.target.value)}
                                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Voucher Type
                        </label>
                        <select
                            value={voucherTypeFilter}
                            onChange={(e) => setVoucherTypeFilter(e.target.value)}
                            className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                        >
                            <option value="all">All Voucher Types</option>
                            {uniqueVoucherTypes.map(type => (
                                <option key={type} value={type}>{type}</option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Ledger Account
                        </label>
                        <select
                            value={ledgerFilter}
                            onChange={(e) => setLedgerFilter(e.target.value)}
                            className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                        >
                            <option value="all">All Ledgers</option>
                            {uniqueLedgers.map(ledger => (
                                <option key={ledger} value={ledger}>{ledger}</option>
                            ))}
                        </select>
                    </div>
                </div>

                <div className="flex justify-between items-center mt-4 pt-4 border-t border-gray-200">
                    <div className="flex items-center space-x-4">
                        <label className="flex items-center space-x-2 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={groupByDate}
                                onChange={(e) => setGroupByDate(e.target.checked)}
                                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                            />
                            <span className="text-sm text-gray-700">Group by Date</span>
                        </label>
                        <span className="text-sm text-gray-600">
                            Showing {filteredEntries.length} entries
                        </span>
                    </div>

                    <div className="flex space-x-2">
                        <button
                            onClick={clearFilters}
                            className="px-4 py-2 border border-gray-300 text-gray-700 text-sm rounded hover:bg-gray-50 flex items-center space-x-1"
                        >
                            <X className="w-4 h-4" />
                            <span>Clear Filters</span>
                        </button>
                    </div>
                </div>
            </div>

            {/* Day Book Table */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-20">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mb-3"></div>
                        <p className="text-gray-600">Loading day book entries...</p>
                    </div>
                ) : filteredEntries.length === 0 ? (
                    <div className="text-center py-20">
                        <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-700 mb-2">
                            No Entries Found
                        </h3>
                        <p className="text-gray-600">
                            {entries.length === 0 ? 'No accounting entries available' : 'No entries match your filters'}
                        </p>
                        {(searchTerm || dateFilter || voucherTypeFilter !== 'all' || ledgerFilter !== 'all') && (
                            <button
                                onClick={clearFilters}
                                className="mt-4 px-4 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
                            >
                                Clear Filters
                            </button>
                        )}
                    </div>
                ) : groupByDate ? (
                    // Grouped by Date View
                    <div>
                        {Object.entries(groupedEntries).map(([date, dateEntries]) => {
                            const isExpanded = expandedDates.includes(date);
                            const dateTotalDebit = dateEntries.reduce((sum, entry) => sum + (entry.debit || 0), 0);
                            const dateTotalCredit = dateEntries.reduce((sum, entry) => sum + (entry.credit || 0), 0);

                            return (
                                <div key={date} className="border-b border-gray-200 last:border-b-0">
                                    {/* Date Header */}
                                    <div
                                        className="p-4 bg-gray-50 border-b border-gray-200 cursor-pointer hover:bg-gray-100 transition-colors"
                                        onClick={() => toggleDateGroup(date)}
                                    >
                                        <div className="flex justify-between items-center">
                                            <div className="flex items-center space-x-3">
                                                {isExpanded ? (
                                                    <ChevronUp className="w-5 h-5 text-blue-600" />
                                                ) : (
                                                    <ChevronDown className="w-5 h-5 text-gray-500" />
                                                )}
                                                <div>
                                                    <h3 className="font-medium text-gray-900">{date}</h3>
                                                    <p className="text-sm text-gray-600">
                                                        {dateEntries.length} entries
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="flex items-center space-x-4">
                                                <div className="text-right">
                                                    <p className="text-sm text-gray-600">Date Total</p>
                                                    <div className="flex space-x-4">
                                                        <span className="text-sm font-bold text-red-700">
                                                            ₹{formatCurrency(dateTotalDebit)}
                                                        </span>
                                                        <span className="text-sm font-bold text-green-700">
                                                            ₹{formatCurrency(dateTotalCredit)}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Date Entries (Expanded) */}
                                    {isExpanded && (
                                        <div className="overflow-x-auto">
                                            <table className="w-full">
                                                <thead>
                                                    <tr className="bg-gray-50 border-b border-gray-200">
                                                        <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                            Voucher
                                                        </th>
                                                        <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                            Ledger Account
                                                        </th>
                                                        <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                            Particulars
                                                        </th>
                                                        <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                            Debit (₹)
                                                        </th>
                                                        <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                            Credit (₹)
                                                        </th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-gray-200">
                                                    {dateEntries.map((entry, index) => {
                                                        const voucherInfo = getVoucherTypeInfo(entry.voucherType);

                                                        return (
                                                            <tr key={index} className="hover:bg-gray-50">
                                                                <td className="py-3 px-4">
                                                                    <div className="flex items-center space-x-2">
                                                                        <div className={`p-1.5 rounded ${voucherInfo.color}`}>
                                                                            {voucherInfo.icon}
                                                                        </div>
                                                                        <div>
                                                                            <p className="text-sm font-medium text-gray-900">
                                                                                {entry.voucherType} #{entry.voucherNo}
                                                                            </p>
                                                                        </div>
                                                                    </div>
                                                                </td>
                                                                <td className="py-3 px-4">
                                                                    <div className="flex items-center space-x-2">
                                                                        <div className="text-gray-500">
                                                                            {getLedgerIcon(entry.ledger)}
                                                                        </div>
                                                                        <span className="text-sm text-gray-900">
                                                                            {entry.ledger}
                                                                        </span>
                                                                    </div>
                                                                </td>
                                                                <td className="py-3 px-4">
                                                                    <p className="text-sm text-gray-900 max-w-md">
                                                                        {entry.particulars}
                                                                    </p>
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
                                                            </tr>
                                                        );
                                                    })}
                                                </tbody>
                                            </table>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    // Regular Table View
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="bg-gray-50 border-b border-gray-200">
                                    <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Date
                                    </th>
                                    <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Voucher
                                    </th>
                                    <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Ledger Account
                                    </th>
                                    <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Particulars
                                    </th>
                                    <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Debit (₹)
                                    </th>
                                    <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Credit (₹)
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {filteredEntries.map((entry, index) => {
                                    const voucherInfo = getVoucherTypeInfo(entry.voucherType);

                                    return (
                                        <tr key={index} className="hover:bg-gray-50">
                                            <td className="py-3 px-4">
                                                <div className="flex items-center space-x-2">
                                                    <Calendar className="w-4 h-4 text-gray-400" />
                                                    <span className="text-sm text-gray-900">
                                                        {formatDate(entry.date)}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="py-3 px-4">
                                                <div className="flex items-center space-x-2">
                                                    <div className={`p-1.5 rounded ${voucherInfo.color}`}>
                                                        {voucherInfo.icon}
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-medium text-gray-900">
                                                            {entry.voucherType} #{entry.voucherNo}
                                                        </p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="py-3 px-4">
                                                <div className="flex items-center space-x-2">
                                                    <div className="text-gray-500">
                                                        {getLedgerIcon(entry.ledger)}
                                                    </div>
                                                    <span className="text-sm text-gray-900">
                                                        {entry.ledger}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="py-3 px-4">
                                                <p className="text-sm text-gray-900 max-w-md">
                                                    {entry.particulars}
                                                </p>
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
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* Table Footer with Totals */}
                {filteredEntries.length > 0 && (
                    <div className="p-4 border-t border-gray-200 bg-gray-50">
                        <div className="flex justify-between items-center">
                            <div className="text-sm text-gray-600">
                                Showing {filteredEntries.length} of {entries.length} total entries
                            </div>
                            <div className="flex items-center space-x-6">
                                <div className="text-right">
                                    <p className="text-sm text-gray-600">Total Debit</p>
                                    <p className="text-lg font-bold text-red-700">
                                        ₹{formatCurrency(summary.totalDebit)}
                                    </p>
                                </div>
                                <div className="text-right">
                                    <p className="text-sm text-gray-600">Total Credit</p>
                                    <p className="text-lg font-bold text-green-700">
                                        ₹{formatCurrency(summary.totalCredit)}
                                    </p>
                                </div>
                                <div className="text-right">
                                    <p className="text-sm text-gray-600">Difference</p>
                                    <p className={`text-lg font-bold ${summary.difference >= 0 ? 'text-red-700' : 'text-green-700'}`}>
                                        ₹{formatCurrency(Math.abs(summary.difference))}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default DayBook;