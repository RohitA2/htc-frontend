import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import {
    TrendingUp,
    TrendingDown,
    Scale,
    DollarSign,
    CreditCard,
    Truck,
    User,
    Percent,
    Download,
    Printer,
    RefreshCw,
    Filter,
    ChevronDown,
    ChevronUp,
    BarChart3,
    PieChart,
    AlertCircle,
    CheckCircle,
    X
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import {
    BarChart,
    Bar,
    PieChart as RechartsPieChart,
    Pie,
    Cell,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
    LineChart,
    Line
} from 'recharts';

const TrialBalance = () => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [expandedSections, setExpandedSections] = useState(['chart', 'table']);
    const [chartType, setChartType] = useState('bar'); // 'bar', 'pie', 'line'
    const [filterType, setFilterType] = useState('all'); // 'all', 'party', 'truck', 'income'

    const API_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

    // ✅ STEP 1: CREATE A CLEAN, DERIVED DATASET
    const nonZeroRows = useMemo(() => {
        if (!data?.rows) return [];
        return data.rows.filter(
            r => r.debit !== 0 || r.credit !== 0
        );
    }, [data]);

    // ✅ STEP 2: FIX LEDGER TYPE FUNCTION
    const getLedgerType = (ledger) => {
        if (ledger.startsWith('Party')) return 'Party';
        if (ledger.startsWith('Truck')) return 'Truck';
        if (ledger === 'Cash') return 'Asset';
        if (ledger.startsWith('Bank')) return 'Asset';
        if (ledger.includes('Commission')) return 'Income';
        return 'Other';
    };

    // ✅ STEP 3: FIX CATEGORY TOTALS
    const calculateCategoryTotals = () => {
        if (!nonZeroRows.length) {
            return { party: 0, truck: 0, income: 0 };
        }

        return {
            party: nonZeroRows
                .filter(r => r.ledger.startsWith('Party'))
                .reduce((s, r) => s + r.debit, 0),

            truck: nonZeroRows
                .filter(r => r.ledger.startsWith('Truck'))
                .reduce((s, r) => s + r.credit, 0),

            income: nonZeroRows
                .filter(r => r.ledger.includes('Commission'))
                .reduce((s, r) => s + r.credit, 0),
        };
    };

    // Fetch trial balance data
    useEffect(() => {
        fetchTrialBalance();
    }, []);

    const fetchTrialBalance = async () => {
        try {
            setLoading(true);
            const response = await axios.get(`${API_URL}/accounting/trial-balance`);

            if (response.data.success) {
                setData(response.data);
            } else {
                toast.error('Failed to fetch trial balance');
            }
        } catch (error) {
            console.error('Error fetching trial balance:', error);
            toast.error('Failed to load trial balance');
        } finally {
            setLoading(false);
        }
    };

    // Format currency
    const formatCurrency = (amount) => {
        if (amount === null || amount === undefined) return '0';
        return new Intl.NumberFormat('en-IN', {
            maximumFractionDigits: 0,
        }).format(amount);
    };

    // Toggle section expansion
    const toggleSection = (section) => {
        if (expandedSections.includes(section)) {
            setExpandedSections(expandedSections.filter(s => s !== section));
        } else {
            setExpandedSections([...expandedSections, section]);
        }
    };

    // Export to Excel
    const exportToExcel = () => {
        if (!data) {
            toast.error('No data to export');
            return;
        }

        try {
            const worksheetData = [];

            // Add header
            worksheetData.push(['TRIAL BALANCE']);
            worksheetData.push(['']);
            worksheetData.push(['Generated on:', new Date().toLocaleDateString()]);
            worksheetData.push(['Status:', data.balanced ? 'Balanced ✓' : 'Not Balanced ✗']);
            worksheetData.push(['Total Debit:', `₹${formatCurrency(data.totalDebit)}`]);
            worksheetData.push(['Total Credit:', `₹${formatCurrency(data.totalCredit)}`]);
            worksheetData.push(['Difference:', `₹${formatCurrency(Math.abs(data.totalDebit - data.totalCredit))}`]);
            worksheetData.push(['']);

            // Add table headers
            worksheetData.push(['Ledger Account', 'Debit (₹)', 'Credit (₹)', 'Balance']);

            // Add data rows (only non-zero)
            nonZeroRows.forEach(row => {
                const balance = row.debit - row.credit;
                worksheetData.push([
                    row.ledger,
                    formatCurrency(row.debit),
                    formatCurrency(row.credit),
                    `${balance >= 0 ? 'Dr' : 'Cr'} ${formatCurrency(Math.abs(balance))}`
                ]);
            });

            // Add totals row
            worksheetData.push([]);
            worksheetData.push(['TOTAL', formatCurrency(data.totalDebit), formatCurrency(data.totalCredit), '']);

            // Create worksheet
            const ws = XLSX.utils.aoa_to_sheet(worksheetData);

            // Set column widths
            const wscols = [
                { wch: 35 }, // Ledger
                { wch: 15 }, // Debit
                { wch: 15 }, // Credit
                { wch: 15 }  // Balance
            ];
            ws['!cols'] = wscols;

            // Create workbook
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, 'Trial Balance');

            // Generate filename
            const dateStr = new Date().toISOString().split('T')[0];
            XLSX.writeFile(wb, `Trial_Balance_${dateStr}.xlsx`);

            toast.success('Excel file exported successfully!');
        } catch (error) {
            console.error('Error exporting to Excel:', error);
            toast.error('Failed to export Excel file');
        }
    };

    // Print trial balance
    const printTrialBalance = () => {
        if (!data) {
            toast.error('No data to print');
            return;
        }

        const printWindow = window.open('', '_blank');
        printWindow.document.write(`
            <html>
                <head>
                    <title>Trial Balance</title>
                    <style>
                        body { font-family: Arial, sans-serif; padding: 30px; }
                        h1 { color: #333; text-align: center; margin-bottom: 20px; border-bottom: 2px solid #4f46e5; padding-bottom: 10px; }
                        .header { display: flex; justify-content: space-between; margin-bottom: 30px; }
                        .stats { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; margin-bottom: 30px; }
                        .stat-card { padding: 20px; border-radius: 8px; text-align: center; }
                        .debit-card { background: #fee2e2; border: 1px solid #fecaca; }
                        .credit-card { background: #d1fae5; border: 1px solid #a7f3d0; }
                        .diff-card { background: #e0e7ff; border: 1px solid #c7d2fe; }
                        .stat-label { font-size: 14px; color: #666; margin-bottom: 8px; }
                        .stat-value { font-size: 24px; font-weight: bold; }
                        .debit-value { color: #dc2626; }
                        .credit-value { color: #16a34a; }
                        table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                        th { background: #f8fafc; border: 1px solid #e2e8f0; padding: 12px; text-align: left; font-weight: 600; }
                        td { border: 1px solid #e2e8f0; padding: 12px; }
                        .debit { color: #dc2626; font-weight: 600; }
                        .credit { color: #16a34a; font-weight: 600; }
                        .balance { padding: 4px 8px; border-radius: 4px; font-size: 12px; }
                        .dr-balance { background: #fee2e2; color: #dc2626; }
                        .cr-balance { background: #d1fae5; color: #16a34a; }
                        .party-row { background: #f0f9ff; }
                        .truck-row { background: #fefce8; }
                        .income-row { background: #faf5ff; }
                        .footer { margin-top: 40px; text-align: center; font-size: 12px; color: #666; border-top: 1px solid #e2e8f0; padding-top: 20px; }
                        .status { padding: 8px 16px; border-radius: 20px; font-weight: 600; margin: 20px auto; width: fit-content; }
                        .balanced { background: #d1fae5; color: #065f46; }
                        .unbalanced { background: #fee2e2; color: #991b1b; }
                    </style>
                </head>
                <body>
                    <h1>TRIAL BALANCE</h1>
                    
                    <div class="header">
                        <div>
                            <p><strong>Generated:</strong> ${new Date().toLocaleDateString()}</p>
                        </div>
                        <div class="status ${data.balanced ? 'balanced' : 'unbalanced'}">
                            ${data.balanced ? '✓ Balanced' : '✗ Not Balanced'}
                        </div>
                    </div>

                    <div class="stats">
                        <div class="stat-card debit-card">
                            <div class="stat-label">Total Debit</div>
                            <div class="stat-value debit-value">₹${formatCurrency(data.totalDebit)}</div>
                        </div>
                        <div class="stat-card credit-card">
                            <div class="stat-label">Total Credit</div>
                            <div class="stat-value credit-value">₹${formatCurrency(data.totalCredit)}</div>
                        </div>
                        <div class="stat-card diff-card">
                            <div class="stat-label">Difference</div>
                            <div class="stat-value">₹${formatCurrency(Math.abs(data.totalDebit - data.totalCredit))}</div>
                        </div>
                    </div>

                    <table>
                        <thead>
                            <tr>
                                <th>Ledger Account</th>
                                <th>Debit (₹)</th>
                                <th>Credit (₹)</th>
                                <th>Balance</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${nonZeroRows.map(row => {
            const balance = row.debit - row.credit;
            const ledgerType = getLedgerType(row.ledger);
            const rowClass = ledgerType === 'Party' ? 'party-row' :
                ledgerType === 'Truck' ? 'truck-row' : 'income-row';

            return `
                                    <tr class="${rowClass}">
                                        <td>${row.ledger}</td>
                                        <td class="debit">${row.debit ? '₹' + formatCurrency(row.debit) : ''}</td>
                                        <td class="credit">${row.credit ? '₹' + formatCurrency(row.credit) : ''}</td>
                                        <td>
                                            ${balance !== 0 ?
                    `<span class="balance ${balance > 0 ? 'dr-balance' : 'cr-balance'}">
                                                    ${balance > 0 ? 'Dr' : 'Cr'} ${formatCurrency(Math.abs(balance))}
                                                </span>` :
                    '-'
                }
                                        </td>
                                    </tr>
                                `;
        }).join('')}
                        </tbody>
                        <tfoot>
                            <tr style="background: #f8fafc; font-weight: bold;">
                                <td>TOTAL</td>
                                <td class="debit">₹${formatCurrency(data.totalDebit)}</td>
                                <td class="credit">₹${formatCurrency(data.totalCredit)}</td>
                                <td></td>
                            </tr>
                        </tfoot>
                    </table>

                    <div class="footer">
                        <p>Generated by Accounting System | Active Accounts: ${nonZeroRows.length}</p>
                    </div>
                </body>
            </html>
        `);
        printWindow.document.close();
        printWindow.print();
    };

    // ✅ STEP 4: FIX FILTERED DATA + CHART DATA
    const getFilteredData = () => {
        if (filterType === 'all') return nonZeroRows;

        return nonZeroRows.filter(row => {
            if (filterType === 'party') return row.ledger.startsWith('Party');
            if (filterType === 'truck') return row.ledger.startsWith('Truck');
            if (filterType === 'income') return row.ledger.includes('Commission');
            return true;
        });
    };

    const getChartData = () => {
        return getFilteredData().map(row => {
            const type = getLedgerType(row.ledger);
            return {
                name: row.ledger.split(' - ')[1] || row.ledger,
                debit: row.debit,
                credit: row.credit,
                net: row.debit - row.credit,
                fill:
                    type === 'Party' ? '#3b82f6' :
                        type === 'Truck' ? '#f59e0b' :
                            type === 'Income' ? '#10b981' :
                                '#6b7280'
            };
        });
    };

    // Get ledger type icon
    const getLedgerIcon = (ledger) => {
        const type = getLedgerType(ledger);
        if (type === 'Party') return <User className="w-4 h-4" />;
        if (type === 'Truck') return <Truck className="w-4 h-4" />;
        if (type === 'Income') return <Percent className="w-4 h-4" />;
        return <CreditCard className="w-4 h-4" />;
    };

    const categoryTotals = calculateCategoryTotals();
    const filteredRows = getFilteredData();
    const chartData = getChartData();

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 p-4 md:p-6">
            {/* Header */}
            <div className="mb-8">
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-3xl md:text-4xl font-bold text-gray-800 mb-2">
                            Trial Balance
                        </h1>
                        <p className="text-gray-600">
                            Financial statement showing all ledger balances
                        </p>
                    </div>
                    <div className="flex items-center space-x-3">
                        <button
                            onClick={exportToExcel}
                            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2 shadow-md hover:shadow-lg"
                        >
                            <Download className="w-4 h-4" />
                            <span className="hidden md:inline">Export Excel</span>
                        </button>
                        <button
                            onClick={printTrialBalance}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2 shadow-md hover:shadow-lg"
                        >
                            <Printer className="w-4 h-4" />
                            <span className="hidden md:inline">Print</span>
                        </button>
                        <button
                            onClick={fetchTrialBalance}
                            className="p-2 bg-white rounded-lg hover:bg-gray-100 transition-colors shadow-md hover:shadow-lg"
                            title="Refresh"
                        >
                            <RefreshCw className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            </div>

            {/* Status Banner */}
            {data && (
                <div className={`mb-6 p-4 rounded-lg border shadow-sm ${data.balanced ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                            {data.balanced ? (
                                <CheckCircle className="w-6 h-6 text-green-600" />
                            ) : (
                                <AlertCircle className="w-6 h-6 text-red-600" />
                            )}
                            <div>
                                <h3 className="font-medium text-gray-900">
                                    {data.balanced ? 'Trial Balance is Balanced' : 'Trial Balance is Not Balanced'}
                                </h3>
                                <p className="text-sm text-gray-600">
                                    {data.balanced ? 'All debit and credit totals match correctly.' : `Difference of ₹${formatCurrency(Math.abs(data.totalDebit - data.totalCredit))} needs reconciliation.`}
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center space-x-2">
                            <Scale className="w-5 h-5 text-gray-500" />
                            <span className={`text-lg font-bold ${data.balanced ? 'text-green-700' : 'text-red-700'}`}>
                                ₹{formatCurrency(Math.abs(data.totalDebit - data.totalCredit))}
                            </span>
                        </div>
                    </div>
                </div>
            )}

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-600 mb-1">Total Debit</p>
                            <p className="text-2xl font-bold text-red-600">
                                ₹{data ? formatCurrency(data.totalDebit) : '0'}
                            </p>
                        </div>
                        <div className="p-3 bg-red-100 rounded-full">
                            <TrendingUp className="w-6 h-6 text-red-600" />
                        </div>
                    </div>
                    <div className="mt-3 pt-3 border-t border-gray-100">
                        <p className="text-xs text-gray-500">Party Debits</p>
                        <p className="text-sm font-medium">₹{formatCurrency(categoryTotals.party)}</p>
                    </div>
                </div>

                <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-600 mb-1">Total Credit</p>
                            <p className="text-2xl font-bold text-green-600">
                                ₹{data ? formatCurrency(data.totalCredit) : '0'}
                            </p>
                        </div>
                        <div className="p-3 bg-green-100 rounded-full">
                            <TrendingDown className="w-6 h-6 text-green-600" />
                        </div>
                    </div>
                    <div className="mt-3 pt-3 border-t border-gray-100">
                        <p className="text-xs text-gray-500">Truck Credits</p>
                        <p className="text-sm font-medium">₹{formatCurrency(categoryTotals.truck)}</p>
                    </div>
                </div>

                <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-600 mb-1">Difference</p>
                            <p className={`text-2xl font-bold ${data && data.totalDebit > data.totalCredit ? 'text-red-600' : 'text-green-600'}`}>
                                ₹{data ? formatCurrency(Math.abs(data.totalDebit - data.totalCredit)) : '0'}
                            </p>
                        </div>
                        <div className="p-3 bg-blue-100 rounded-full">
                            <Scale className="w-6 h-6 text-blue-600" />
                        </div>
                    </div>
                    <div className="mt-3 pt-3 border-t border-gray-100">
                        <p className="text-xs text-gray-500">Commission Income</p>
                        <p className="text-sm font-medium">₹{formatCurrency(categoryTotals.income)}</p>
                    </div>
                </div>

                <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between">
                        <div>
                            {/* ✅ STEP 5: FIX COUNTS IN SUMMARY CARDS */}
                            <p className="text-sm text-gray-600 mb-1">Active Accounts</p>
                            <p className="text-2xl font-bold text-purple-600">
                                {nonZeroRows.length}
                            </p>
                        </div>
                        <div className="p-3 bg-purple-100 rounded-full">
                            <CreditCard className="w-6 h-6 text-purple-600" />
                        </div>
                    </div>
                    <div className="mt-3 pt-3 border-t border-gray-100">
                        <div className="flex justify-between text-xs text-gray-500">
                            <span>Parties: {nonZeroRows.filter(r => r.ledger.startsWith('Party')).length}</span>
                            <span>Trucks: {nonZeroRows.filter(r => r.ledger.startsWith('Truck')).length}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Chart Section */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm mb-6 overflow-hidden">
                <div
                    className="p-4 border-b border-gray-200 cursor-pointer hover:bg-gray-50 transition-colors"
                    onClick={() => toggleSection('chart')}
                >
                    <div className="flex justify-between items-center">
                        <div className="flex items-center space-x-3">
                            {expandedSections.includes('chart') ? (
                                <ChevronUp className="w-5 h-5 text-blue-600" />
                            ) : (
                                <ChevronDown className="w-5 h-5 text-gray-500" />
                            )}
                            <div className="flex items-center space-x-2">
                                <BarChart3 className="w-5 h-5 text-blue-600" />
                                <h2 className="text-lg font-semibold text-gray-800">Visual Analysis</h2>
                            </div>
                        </div>
                        <div className="flex items-center space-x-2">
                            <select
                                value={filterType}
                                onChange={(e) => setFilterType(e.target.value)}
                                className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                            >
                                <option value="all">All Accounts</option>
                                <option value="party">Parties Only</option>
                                <option value="truck">Trucks Only</option>
                                <option value="income">Income Only</option>
                            </select>
                            <div className="flex bg-gray-100 rounded-lg p-1">
                                <button
                                    onClick={(e) => { e.stopPropagation(); setChartType('bar'); }}
                                    className={`px-3 py-1 rounded text-sm ${chartType === 'bar' ? 'bg-white shadow' : 'text-gray-600'}`}
                                >
                                    Bar
                                </button>
                                <button
                                    onClick={(e) => { e.stopPropagation(); setChartType('pie'); }}
                                    className={`px-3 py-1 rounded text-sm ${chartType === 'pie' ? 'bg-white shadow' : 'text-gray-600'}`}
                                >
                                    Pie
                                </button>
                                <button
                                    onClick={(e) => { e.stopPropagation(); setChartType('line'); }}
                                    className={`px-3 py-1 rounded text-sm ${chartType === 'line' ? 'bg-white shadow' : 'text-gray-600'}`}
                                >
                                    Line
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {expandedSections.includes('chart') && data && (
                    <div className="p-6">
                        <div className="h-96">
                            <ResponsiveContainer width="100%" height="100%">
                                {chartType === 'bar' ? (
                                    <BarChart data={chartData}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                                        <XAxis
                                            dataKey="name"
                                            angle={-45}
                                            textAnchor="end"
                                            height={60}
                                            fontSize={12}
                                        />
                                        <YAxis fontSize={12} />
                                        <Tooltip
                                            formatter={(value) => [`₹${formatCurrency(value)}`, 'Amount']}
                                            labelFormatter={(label) => `Account: ${label}`}
                                        />
                                        <Legend />
                                        <Bar
                                            dataKey="debit"
                                            name="Debit"
                                            fill="#ef4444"
                                            radius={[4, 4, 0, 0]}
                                            animationBegin={0}
                                            animationDuration={1500}
                                        />
                                        <Bar
                                            dataKey="credit"
                                            name="Credit"
                                            fill="#10b981"
                                            radius={[4, 4, 0, 0]}
                                            animationBegin={500}
                                            animationDuration={1500}
                                        />
                                    </BarChart>
                                ) : chartType === 'pie' ? (
                                    <RechartsPieChart>
                                        <Pie
                                            data={chartData}
                                            cx="50%"
                                            cy="50%"
                                            labelLine={false}
                                            label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                                            outerRadius={100}
                                            fill="#8884d8"
                                            dataKey="net"
                                            animationBegin={0}
                                            animationDuration={1500}
                                        >
                                            {chartData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={entry.fill} />
                                            ))}
                                        </Pie>
                                        <Tooltip
                                            formatter={(value) => [`₹${formatCurrency(Math.abs(value))}`, 'Balance']}
                                        />
                                        <Legend />
                                    </RechartsPieChart>
                                ) : (
                                    <LineChart data={chartData}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                                        <XAxis
                                            dataKey="name"
                                            angle={-45}
                                            textAnchor="end"
                                            height={60}
                                            fontSize={12}
                                        />
                                        <YAxis fontSize={12} />
                                        <Tooltip
                                            formatter={(value) => [`₹${formatCurrency(value)}`, 'Amount']}
                                            labelFormatter={(label) => `Account: ${label}`}
                                        />
                                        <Legend />
                                        <Line
                                            type="monotone"
                                            dataKey="debit"
                                            name="Debit"
                                            stroke="#ef4444"
                                            strokeWidth={2}
                                            dot={{ r: 4 }}
                                            activeDot={{ r: 6 }}
                                            animationBegin={0}
                                            animationDuration={1500}
                                        />
                                        <Line
                                            type="monotone"
                                            dataKey="credit"
                                            name="Credit"
                                            stroke="#10b981"
                                            strokeWidth={2}
                                            dot={{ r: 4 }}
                                            activeDot={{ r: 6 }}
                                            animationBegin={500}
                                            animationDuration={1500}
                                        />
                                    </LineChart>
                                )}
                            </ResponsiveContainer>
                        </div>
                    </div>
                )}
            </div>

            {/* Trial Balance Table */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                <div
                    className="p-4 border-b border-gray-200 cursor-pointer hover:bg-gray-50 transition-colors"
                    onClick={() => toggleSection('table')}
                >
                    <div className="flex justify-between items-center">
                        <div className="flex items-center space-x-3">
                            {expandedSections.includes('table') ? (
                                <ChevronUp className="w-5 h-5 text-blue-600" />
                            ) : (
                                <ChevronDown className="w-5 h-5 text-gray-500" />
                            )}
                            <div className="flex items-center space-x-2">
                                <Scale className="w-5 h-5 text-blue-600" />
                                <h2 className="text-lg font-semibold text-gray-800">
                                    Trial Balance Details
                                    {filterType !== 'all' && (
                                        <span className="ml-2 text-sm font-normal text-gray-500">
                                            ({filterType === 'party' ? 'Parties' : filterType === 'truck' ? 'Trucks' : 'Income'})
                                        </span>
                                    )}
                                </h2>
                            </div>
                        </div>
                        <div className="flex items-center space-x-2">
                            <span className="text-sm text-gray-600">
                                Showing {filteredRows.length} of {nonZeroRows.length} active accounts
                            </span>
                            <div className="flex bg-gray-100 rounded-lg p-1">
                                <button
                                    onClick={(e) => { e.stopPropagation(); setFilterType('all'); }}
                                    className={`px-3 py-1 rounded text-sm ${filterType === 'all' ? 'bg-white shadow' : 'text-gray-600'}`}
                                >
                                    All
                                </button>
                                <button
                                    onClick={(e) => { e.stopPropagation(); setFilterType('party'); }}
                                    className={`px-3 py-1 rounded text-sm ${filterType === 'party' ? 'bg-white shadow' : 'text-gray-600'}`}
                                >
                                    Parties
                                </button>
                                <button
                                    onClick={(e) => { e.stopPropagation(); setFilterType('truck'); }}
                                    className={`px-3 py-1 rounded text-sm ${filterType === 'truck' ? 'bg-white shadow' : 'text-gray-600'}`}
                                >
                                    Trucks
                                </button>
                                <button
                                    onClick={(e) => { e.stopPropagation(); setFilterType('income'); }}
                                    className={`px-3 py-1 rounded text-sm ${filterType === 'income' ? 'bg-white shadow' : 'text-gray-600'}`}
                                >
                                    Income
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {expandedSections.includes('table') && (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="bg-gray-50 border-b border-gray-200">
                                    <th className="py-4 px-6 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Ledger Account
                                    </th>
                                    <th className="py-4 px-6 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Type
                                    </th>
                                    <th className="py-4 px-6 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Debit (₹)
                                    </th>
                                    <th className="py-4 px-6 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Credit (₹)
                                    </th>
                                    <th className="py-4 px-6 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Balance
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {loading ? (
                                    <tr>
                                        <td colSpan="5" className="py-20 text-center">
                                            <div className="flex flex-col items-center justify-center">
                                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mb-3"></div>
                                                <p className="text-gray-600">Loading trial balance...</p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : !data ? (
                                    <tr>
                                        <td colSpan="5" className="py-20 text-center">
                                            <div className="flex flex-col items-center justify-center">
                                                <Scale className="w-12 h-12 text-gray-300 mb-3" />
                                                <p className="text-gray-600">No trial balance data available</p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : filteredRows.length === 0 ? (
                                    <tr>
                                        <td colSpan="5" className="py-20 text-center">
                                            <div className="flex flex-col items-center justify-center">
                                                <Filter className="w-12 h-12 text-gray-300 mb-3" />
                                                <p className="text-gray-600">No accounts match the selected filter</p>
                                                <button
                                                    onClick={() => setFilterType('all')}
                                                    className="mt-2 px-4 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
                                                >
                                                    Show All Accounts
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    filteredRows.map((row, index) => {
                                        const balance = row.debit - row.credit;
                                        const ledgerType = getLedgerType(row.ledger);

                                        return (
                                            <tr
                                                key={index}
                                                className="hover:bg-gray-50 transition-colors"
                                                style={{
                                                    animation: `fadeIn 0.5s ease-out ${index * 0.05}s`,
                                                    animationFillMode: 'both'
                                                }}
                                            >
                                                <td className="py-4 px-6">
                                                    <div className="flex items-center space-x-3">
                                                        <div className={`p-2 rounded-lg ${ledgerType === 'Party' ? 'bg-blue-100' :
                                                            ledgerType === 'Truck' ? 'bg-yellow-100' :
                                                                ledgerType === 'Income' ? 'bg-green-100' :
                                                                    'bg-gray-100'
                                                            }`}>
                                                            {getLedgerIcon(row.ledger)}
                                                        </div>
                                                        <div>
                                                            <p className="text-sm font-medium text-gray-900">
                                                                {row.ledger.split(' - ')[1] || row.ledger}
                                                            </p>
                                                            <p className="text-xs text-gray-500">
                                                                {row.ledger.split(' - ')[0]}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="py-4 px-6">
                                                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${ledgerType === 'Party' ? 'bg-blue-100 text-blue-800' :
                                                        ledgerType === 'Truck' ? 'bg-yellow-100 text-yellow-800' :
                                                            ledgerType === 'Income' ? 'bg-green-100 text-green-800' :
                                                                'bg-gray-100 text-gray-800'
                                                        }`}>
                                                        {ledgerType}
                                                    </span>
                                                </td>
                                                <td className="py-4 px-6">
                                                    {row.debit > 0 && (
                                                        <div className="flex items-center space-x-2">
                                                            <TrendingUp className="w-4 h-4 text-red-500" />
                                                            <span className="text-sm font-bold text-red-700">
                                                                ₹{formatCurrency(row.debit)}
                                                            </span>
                                                        </div>
                                                    )}
                                                </td>
                                                <td className="py-4 px-6">
                                                    {row.credit > 0 && (
                                                        <div className="flex items-center space-x-2">
                                                            <TrendingDown className="w-4 h-4 text-green-500" />
                                                            <span className="text-sm font-bold text-green-700">
                                                                ₹{formatCurrency(row.credit)}
                                                            </span>
                                                        </div>
                                                    )}
                                                </td>
                                                <td className="py-4 px-6">
                                                    {balance !== 0 ? (
                                                        <span className={`inline-flex items-center px-3 py-1.5 rounded-lg text-sm font-medium ${balance > 0
                                                            ? 'bg-red-100 text-red-800 border border-red-200'
                                                            : 'bg-green-100 text-green-800 border border-green-200'
                                                            }`}>
                                                            {balance > 0 ? 'Dr' : 'Cr'} ₹{formatCurrency(Math.abs(balance))}
                                                        </span>
                                                    ) : (
                                                        <span className="text-sm text-gray-500">-</span>
                                                    )}
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>
                )}

                <div className="flex justify-end mt-4">
                    <button
                        onClick={printTrialBalance}
                        className="px-4 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
                    >
                        Print Trial Balance
                    </button>
                </div>
            </div>
        </div>
    );
};

export default TrialBalance;