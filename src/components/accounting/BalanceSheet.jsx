"use client";

import React, { useState, useEffect } from 'react';

const BalanceSheetPage = () => {
    const [balanceSheet, setBalanceSheet] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const API_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

    const fetchBalanceSheet = async () => {
        try {
            setLoading(true);
            const response = await fetch(`${API_URL}/accounting/balance-sheet`);

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            setBalanceSheet(data);
        } catch (err) {
            setError(err.message);
            console.error('Error fetching balance sheet:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchBalanceSheet();
    }, []);

    const calculateTotalAssets = () => {
        if (!balanceSheet?.assets) return 0;
        return Object.values(balanceSheet.assets).reduce((sum, value) => sum + value, 0);
    };

    const calculateTotalLiabilities = () => {
        if (!balanceSheet?.liabilities) return 0;
        return Object.values(balanceSheet.liabilities).reduce((sum, value) => sum + value, 0);
    };

    const calculateTotalEquity = () => {
        return (balanceSheet?.capital || 0) + (calculateTotalAssets() - calculateTotalLiabilities());
    };

    const calculateBalanceStatus = () => {
        const totalAssets = calculateTotalAssets();
        const totalLiabilities = calculateTotalLiabilities();
        const totalEquity = calculateTotalEquity();
        return totalAssets === totalLiabilities + totalEquity;
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Loading balance sheet...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="bg-red-50 border border-red-200 rounded-lg p-8 max-w-md">
                    <h2 className="text-red-600 text-xl font-bold mb-4">Error Loading Balance Sheet</h2>
                    <p className="text-red-500 mb-4">{error}</p>
                    <button
                        onClick={fetchBalanceSheet}
                        className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 transition"
                    >
                        Retry
                    </button>
                </div>
            </div>
        );
    }

    if (!balanceSheet) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <p className="text-gray-600">No balance sheet data available</p>
                </div>
            </div>
        );
    }

    const totalAssets = calculateTotalAssets();
    const totalLiabilities = calculateTotalLiabilities();
    const totalEquity = calculateTotalEquity();
    const isBalanced = calculateBalanceStatus();

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4 md:p-8">
            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <div className="mb-8 text-center">
                    <h1 className="text-3xl md:text-4xl font-bold text-gray-800 mb-2">
                        Balance Sheet
                    </h1>
                    <p className="text-gray-600">As of {new Date().toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                    })}</p>
                </div>

                {/* Balance Status Banner */}
                <div className={`mb-8 p-4 rounded-lg ${isBalanced ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
                    <div className="flex items-center justify-between">
                        <div>
                            <span className={`font-semibold ${isBalanced ? 'text-green-800' : 'text-red-800'}`}>
                                Balance Status: {isBalanced ? '✓ BALANCED' : '✗ NOT BALANCED'}
                            </span>
                            <p className={`text-sm mt-1 ${isBalanced ? 'text-green-600' : 'text-red-600'}`}>
                                {isBalanced
                                    ? 'Assets = Liabilities + Equity'
                                    : `Assets (${totalAssets}) ≠ Liabilities (${totalLiabilities}) + Equity (${totalEquity})`
                                }
                            </p>
                        </div>
                        <div className="text-right">
                            <div className="text-2xl font-bold text-gray-800">
                                ${totalAssets.toLocaleString()}
                            </div>
                            <div className="text-sm text-gray-600">Total Assets</div>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Assets Section */}
                    <div className="bg-white rounded-xl shadow-lg overflow-hidden">
                        <div className="bg-blue-600 p-4">
                            <h2 className="text-2xl font-bold text-white">Assets</h2>
                        </div>

                        <div className="p-6">
                            <div className="space-y-4">
                                {balanceSheet.assets && Object.entries(balanceSheet.assets).map(([account, amount]) => (
                                    <div key={account} className="flex justify-between items-center py-3 border-b border-gray-100">
                                        <div>
                                            <span className="font-medium text-gray-700 capitalize">
                                                {account.replace(/([A-Z])/g, ' $1').trim()}
                                            </span>
                                        </div>
                                        <div className="text-right">
                                            <div className="font-semibold text-gray-900">
                                                ${amount.toLocaleString()}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Total Assets */}
                            <div className="mt-6 pt-6 border-t border-gray-200">
                                <div className="flex justify-between items-center">
                                    <span className="text-lg font-bold text-gray-800">Total Assets</span>
                                    <div className="text-right">
                                        <div className="text-2xl font-bold text-blue-600">
                                            ${totalAssets.toLocaleString()}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Liabilities & Equity Section */}
                    <div className="space-y-8">
                        {/* Liabilities Card */}
                        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
                            <div className="bg-red-600 p-4">
                                <h2 className="text-2xl font-bold text-white">Liabilities</h2>
                            </div>

                            <div className="p-6">
                                <div className="space-y-4">
                                    {balanceSheet.liabilities && Object.entries(balanceSheet.liabilities).map(([account, amount]) => (
                                        <div key={account} className="flex justify-between items-center py-3 border-b border-gray-100">
                                            <div>
                                                <span className="font-medium text-gray-700 capitalize">
                                                    {account.replace(/([A-Z])/g, ' $1').trim()}
                                                </span>
                                            </div>
                                            <div className="text-right">
                                                <div className="font-semibold text-gray-900">
                                                    ${amount.toLocaleString()}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {/* Total Liabilities */}
                                <div className="mt-6 pt-6 border-t border-gray-200">
                                    <div className="flex justify-between items-center">
                                        <span className="text-lg font-bold text-gray-800">Total Liabilities</span>
                                        <div className="text-right">
                                            <div className="text-xl font-bold text-red-600">
                                                ${totalLiabilities.toLocaleString()}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Equity Card */}
                        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
                            <div className="bg-green-600 p-4">
                                <h2 className="text-2xl font-bold text-white">Equity</h2>
                            </div>

                            <div className="p-6">
                                <div className="space-y-4">
                                    <div className="flex justify-between items-center py-3 border-b border-gray-100">
                                        <div>
                                            <span className="font-medium text-gray-700">Capital</span>
                                        </div>
                                        <div className="text-right">
                                            <div className="font-semibold text-gray-900">
                                                ${balanceSheet.capital?.toLocaleString() || '0'}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex justify-between items-center py-3 border-b border-gray-100">
                                        <div>
                                            <span className="font-medium text-gray-700">Retained Earnings</span>
                                            <p className="text-sm text-gray-500">(Calculated: Assets - Liabilities - Capital)</p>
                                        </div>
                                        <div className="text-right">
                                            <div className="font-semibold text-gray-900">
                                                ${(totalAssets - totalLiabilities - (balanceSheet.capital || 0)).toLocaleString()}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Total Equity */}
                                <div className="mt-6 pt-6 border-t border-gray-200">
                                    <div className="flex justify-between items-center">
                                        <span className="text-lg font-bold text-gray-800">Total Equity</span>
                                        <div className="text-right">
                                            <div className="text-xl font-bold text-green-600">
                                                ${totalEquity.toLocaleString()}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Balance Equation */}
                <div className="mt-8 bg-white rounded-xl shadow-lg p-6">
                    <div className="flex flex-col md:flex-row md:items-center justify-between">
                        <div className="mb-4 md:mb-0">
                            <h3 className="text-lg font-semibold text-gray-800 mb-2">Accounting Equation Check</h3>
                            <p className="text-gray-600">Assets = Liabilities + Equity</p>
                        </div>

                        <div className="text-right">
                            <div className={`text-2xl font-bold ${isBalanced ? 'text-green-600' : 'text-red-600'}`}>
                                ${totalAssets.toLocaleString()} = ${(totalLiabilities + totalEquity).toLocaleString()}
                            </div>
                            <p className={`text-sm ${isBalanced ? 'text-green-500' : 'text-red-500'}`}>
                                {isBalanced ? 'Equation is balanced ✓' : 'Equation is not balanced ✗'}
                            </p>
                        </div>
                    </div>
                </div>

                {/* API Status & Refresh */}
                <div className="mt-8 flex justify-between items-center bg-white rounded-lg p-4 shadow">
                    <div>
                        <span className="text-sm text-gray-500">API Status:</span>
                        <span className={`ml-2 px-2 py-1 rounded text-xs font-medium ${balanceSheet.success ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                            {balanceSheet.success ? 'Success' : 'Failed'}
                        </span>
                    </div>

                    <button
                        onClick={fetchBalanceSheet}
                        className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded transition duration-200"
                    >
                        Refresh Balance Sheet
                    </button>
                </div>

                {/* Footer Notes */}
                <div className="mt-8 text-center text-sm text-gray-500">
                    <p>Note: This balance sheet is generated from API data. All amounts are in dollars.</p>
                    <p className="mt-1">API Endpoint: {window.location.origin}/api/accounting/balance-sheet</p>
                </div>
            </div>
        </div>
    );
};

export default BalanceSheetPage;