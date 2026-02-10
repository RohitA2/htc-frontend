"use client";

import React, { useState, useEffect } from 'react';
import {
    Calendar,
    Download,
    Filter,
    TrendingUp,
    IndianRupee ,
    FileText,
    CheckCircle,
    AlertCircle
} from 'lucide-react';

export default function CommissionLedgerPage() {
    const [ledgerData, setLedgerData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [fromDate, setFromDate] = useState('');
    const [toDate, setToDate] = useState('');
    const [filteredData, setFilteredData] = useState([]);

    // Format date for display
    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        const date = new Date(dateString);
        return date.toLocaleDateString('en-IN', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
        });
    };

    // Format currency for Indian Rupees
    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(amount);
    };

    // Fetch ledger data
    const fetchLedgerData = async () => {
        try {
            setLoading(true);
            const params = new URLSearchParams();
            if (fromDate) params.append('fromDate', fromDate);
            if (toDate) params.append('toDate', toDate);

            const response = await fetch(`http://localhost:5000/api/commission/commission-ledger?${params.toString()}`);

            if (!response.ok) {
                throw new Error('Failed to fetch ledger data');
            }

            const data = await response.json();
            if (data.success) {
                setLedgerData(data);
                setFilteredData(data.ledger || []);
            } else {
                throw new Error('Failed to load data');
            }
        } catch (err) {
            setError(err.message);
            console.error('Error fetching ledger data:', err);
        } finally {
            setLoading(false);
        }
    };

    // Apply date filter
    const handleFilter = () => {
        fetchLedgerData();
    };

    // Reset filters
    const handleReset = () => {
        setFromDate('');
        setToDate('');
        fetchLedgerData();
    };

    // Export to CSV
    const handleExport = () => {
        if (!ledgerData) return;

        const headers = ['Date', 'Voucher Type', 'Voucher No', 'Particulars', 'Source', 'Debit', 'Credit'];
        const rows = filteredData.map(item => [
            formatDate(item.date),
            item.voucherType,
            item.voucherNo,
            item.particulars,
            item.source,
            formatCurrency(item.debit),
            formatCurrency(item.credit)
        ]);

        const csvContent = [
            headers.join(','),
            ...rows.map(row => row.join(','))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `commission-ledger-${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        window.URL.revokeObjectURL(url);
    };

    // Initial fetch
    useEffect(() => {
        fetchLedgerData();
    }, []);

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Loading commission ledger...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center">
                    <AlertCircle className="h-12 w-12 text-red-500 mx-auto" />
                    <h2 className="mt-4 text-xl font-semibold text-gray-900">Error Loading Data</h2>
                    <p className="mt-2 text-gray-600">{error}</p>
                    <button
                        onClick={fetchLedgerData}
                        className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                        Retry
                    </button>
                </div>
            </div>
        );
    }

    if (!ledgerData) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center">
                    <FileText className="h-12 w-12 text-gray-400 mx-auto" />
                    <h2 className="mt-4 text-xl font-semibold text-gray-900">No Data Available</h2>
                    <p className="mt-2 text-gray-600">Commission ledger data is not available.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 p-4 md:p-6">
            <div className="max-w-full mx-auto">
                {/* Header */}
                <div className="mb-6 md:mb-8">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div>
                            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Commission Ledger</h1>
                            <p className="text-gray-600 mt-1">Track all commission and difference income transactions</p>
                        </div>
                        <button
                            onClick={handleExport}
                            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                        >
                            <Download className="h-4 w-4" />
                            Export CSV
                        </button>
                    </div>
                </div>

                {/* Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 md:mb-8">
                    <div className="bg-white rounded-xl shadow p-5">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-blue-100 rounded-lg">
                                <IndianRupee  rSign className="h-6 w-6 text-blue-600" />
                            </div>
                            <div>
                                <p className="text-sm text-gray-600">Difference Income</p>
                                <p className="text-2xl font-bold text-gray-900">
                                    {formatCurrency(ledgerData.summary.differenceIncome)}
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-xl shadow p-5">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-green-100 rounded-lg">
                                <TrendingUp className="h-6 w-6 text-green-600" />
                            </div>
                            <div>
                                <p className="text-sm text-gray-600">Commission Income</p>
                                <p className="text-2xl font-bold text-gray-900">
                                    {formatCurrency(ledgerData.summary.commissionIncome)}
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-xl shadow p-5">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-purple-100 rounded-lg">
                                <CheckCircle className="h-6 w-6 text-purple-600" />
                            </div>
                            <div>
                                <p className="text-sm text-gray-600">Total Income</p>
                                <p className="text-2xl font-bold text-gray-900">
                                    {formatCurrency(ledgerData.summary.totalIncome)}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Filters */}
                <div className="bg-white rounded-xl shadow p-4 md:p-6 mb-6">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
                        <div className="flex items-center gap-2">
                            <Filter className="h-5 w-5 text-gray-500" />
                            <h2 className="text-lg font-semibold text-gray-900">Filters</h2>
                        </div>
                        <div className="text-sm text-gray-600">
                            Showing {filteredData.length} transactions
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                From Date
                            </label>
                            <input
                                type="date"
                                value={fromDate}
                                onChange={(e) => setFromDate(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            />
                        </div>

                        <div className="flex items-end gap-2">
                            <button
                                onClick={handleFilter}
                                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                            >
                                Apply Filter
                            </button>
                            <button
                                onClick={handleReset}
                                className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                            >
                                Reset
                            </button>
                        </div>
                    </div>
                </div>

                {/* Ledger Table */}
                <div className="bg-white rounded-xl shadow overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Date
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Voucher Details
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Particulars
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Source
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Amount
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {filteredData.map((transaction, index) => (
                                    <tr
                                        key={index}
                                        className="hover:bg-gray-50 transition-colors"
                                    >
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm text-gray-900">
                                                {formatDate(transaction.date)}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="text-sm">
                                                <div className="font-medium text-gray-900">
                                                    {transaction.voucherNo}
                                                </div>
                                                <div className="text-gray-500">
                                                    {transaction.voucherType}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="text-sm text-gray-900 max-w-xs">
                                                {transaction.particulars}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${transaction.source === 'Difference Income'
                                                    ? 'bg-blue-100 text-blue-800'
                                                    : 'bg-green-100 text-green-800'
                                                }`}>
                                                {transaction.source}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm font-medium">
                                                {transaction.credit > 0 ? (
                                                    <span className="text-green-600">
                                                        +{formatCurrency(transaction.credit)}
                                                    </span>
                                                ) : (
                                                    <span className="text-red-600">
                                                        -{formatCurrency(transaction.debit)}
                                                    </span>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Empty State */}
                    {filteredData.length === 0 && (
                        <div className="text-center py-12">
                            <FileText className="h-12 w-12 text-gray-400 mx-auto" />
                            <h3 className="mt-2 text-sm font-medium text-gray-900">No transactions found</h3>
                            <p className="mt-1 text-sm text-gray-500">
                                Try adjusting your filters or date range
                            </p>
                        </div>
                    )}

                    {/* Summary Footer */}
                    {filteredData.length > 0 && (
                        <div className="border-t border-gray-200 bg-gray-50 px-6 py-4">
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                <div className="text-sm text-gray-600">
                                    Total {filteredData.length} transactions
                                </div>
                                <div className="flex items-center gap-6">
                                    <div className="text-right">
                                        <div className="text-sm text-gray-600">Total Credit</div>
                                        <div className="text-lg font-semibold text-green-600">
                                            {formatCurrency(
                                                filteredData.reduce((sum, item) => sum + item.credit, 0)
                                            )}
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-sm text-gray-600">Total Debit</div>
                                        <div className="text-lg font-semibold text-red-600">
                                            {formatCurrency(
                                                filteredData.reduce((sum, item) => sum + item.debit, 0)
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Help Text */}
                <div className="mt-6 text-sm text-gray-500">
                    <p>
                        • <span className="font-medium">Difference Income:</span> Income from price differences in transactions
                    </p>
                    <p className="mt-1">
                        • <span className="font-medium">Truck Commission:</span> Commission earned from truck-related services
                    </p>
                </div>
            </div>
        </div>
    );
}