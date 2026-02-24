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
    FileText,
    Percent,
    Receipt,
    WalletCards,
    FileDown,
    Clock,
    IndianRupee
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const TruckTransactionLedger = () => {
    const [trucks, setTrucks] = useState([]);
    const [filteredTrucks, setFilteredTrucks] = useState([]);
    const [selectedTruck, setSelectedTruck] = useState(null);
    const [ledgerData, setLedgerData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [loadingLedger, setLoadingLedger] = useState(false);
    const [loadingPdf, setLoadingPdf] = useState({});
    const [searchTerm, setSearchTerm] = useState('');
    const [dateRange, setDateRange] = useState({
        fromDate: '',
        toDate: ''
    });

    const API_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

    // Fetch trucks list
    useEffect(() => {
        fetchTrucks();
    }, []);

    // Debounced search function
    const debouncedSearch = useCallback(
        debounce((searchValue, trucksList) => {
            if (!searchValue.trim()) {
                setFilteredTrucks(trucksList);
                return;
            }

            const searchLower = searchValue.toLowerCase().trim();

            const filtered = trucksList.filter(truck => {
                if (truck.truckNo?.toLowerCase().includes(searchLower)) {
                    return true;
                }
                if (truck.driver?.toLowerCase().includes(searchLower)) {
                    return true;
                }
                return false;
            });

            setFilteredTrucks(filtered);
        }, 300),
        []
    );

    // Update filtered trucks when search term or trucks change
    useEffect(() => {
        if (trucks.length > 0) {
            debouncedSearch(searchTerm, trucks);
        }
    }, [searchTerm, trucks, debouncedSearch]);

    const fetchTrucks = async () => {
        try {
            setLoading(true);
            const response = await axios.get(`${API_URL}/vendor/truck`);

            if (response.data.success) {
                const trucksData = response.data.data || [];
                setTrucks(trucksData);
                setFilteredTrucks(trucksData);
            } else {
                toast.error('Failed to fetch trucks');
            }
        } catch (error) {
            console.error('Error fetching trucks:', error);
            toast.error('Failed to load trucks');
        } finally {
            setLoading(false);
        }
    };

    // Fetch ledger for selected truck
    const fetchTruckLedger = async (truckId) => {
        if (!truckId) return;

        try {
            setLoadingLedger(true);
            const params = new URLSearchParams();
            if (dateRange.fromDate) params.append('fromDate', dateRange.fromDate);
            if (dateRange.toDate) params.append('toDate', dateRange.toDate);

            const response = await axios.get(
                `${API_URL}/vendor/truck-tally/${truckId}?${params.toString()}`
            );

            if (response.data.success) {
                setLedgerData(response.data);
                const truck = trucks.find(t => t.truckId === truckId);
                setSelectedTruck(truck);
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

    // Fetch booking details and generate PDF
    const generateBookingPDF = async (bookingId) => {
        try {
            setLoadingPdf(prev => ({ ...prev, [bookingId]: true }));

            const response = await axios.get(`${API_URL}/booking/one/${bookingId}`);

            if (!response.data.success) {
                throw new Error('Failed to fetch booking details');
            }

            const bookingData = response.data.data;
            const doc = new jsPDF();

            // Header
            doc.setFontSize(20);
            doc.setTextColor(0, 51, 102);
            doc.text('TRUCK BOOKING DETAILS', 105, 15, { align: 'center' });

            doc.setFontSize(11);
            doc.setTextColor(100, 100, 100);
            doc.text(`Booking Ref No. #: ${bookingData.id}`, 105, 22, { align: 'center' });

            const date = new Date().toLocaleDateString('en-IN');
            doc.setFontSize(9);
            doc.setTextColor(150, 150, 150);
            doc.text(`Generated on: ${date}`, 105, 28, { align: 'center' });

            let yPos = 40;

            // Company Details
            doc.setFontSize(11);
            doc.setTextColor(0, 51, 102);
            doc.text('Company:', 14, yPos);
            doc.setFontSize(10);
            doc.setTextColor(0, 0, 0);
            doc.text(bookingData.company?.companyName || 'stc transport', 45, yPos);
            yPos += 7;

            // Bank Accounts
            if (bookingData.company?.banks && bookingData.company.banks.length > 0) {
                doc.setFontSize(11);
                doc.setTextColor(0, 51, 102);
                doc.text('Bank:', 14, yPos);
                doc.setFontSize(9);
                doc.setTextColor(80, 80, 80);
                const bank = bookingData.company.banks[0];
                doc.text(`${bank.acHolderName} - A/C: ${bank.accountNo} (${bank.branchName})`, 45, yPos);
                yPos += 7;
            }

            yPos += 3;

            // Booking Information
            doc.setFontSize(12);
            doc.setTextColor(0, 51, 102);
            doc.text('Booking Information', 14, yPos);
            yPos += 7;

            // Two-column layout
            const leftColumn = [
                ['Booking ID:', bookingData.id],
                ['Date:', formatDate(bookingData.date)],
                ['Status:', bookingData.status || 'N/A'],
                ['Type:', bookingData.bookingType || 'N/A'],
                ['Commodity:', bookingData.commodity || 'N/A'],
            ];

            const rightColumn = [
                ['Weight:', `${bookingData.weight || 0} ${bookingData.weightType || ''}`],
                ['Rate:', `Rs. ${formatCurrency(bookingData.rate)}`],
                ['From:', bookingData.fromLocation || 'N/A'],
                ['To:', bookingData.toLocation || 'N/A'],
            ];

            doc.setFontSize(9);
            leftColumn.forEach((item, index) => {
                doc.setTextColor(60, 60, 60);
                doc.text(item[0], 14, yPos + (index * 5));
                doc.setTextColor(0, 0, 0);
                doc.text(String(item[1]), 45, yPos + (index * 5));
            });

            rightColumn.forEach((item, index) => {
                doc.setTextColor(60, 60, 60);
                doc.text(item[0], 100, yPos + (index * 5));
                doc.setTextColor(0, 0, 0);
                doc.text(String(item[1]), 130, yPos + (index * 5));
            });

            yPos += (Math.max(leftColumn.length, rightColumn.length) * 5) + 10;

            // Truck Details
            doc.setFontSize(12);
            doc.setTextColor(0, 51, 102);
            doc.text('Truck Details', 14, yPos);
            yPos += 7;

            doc.setFontSize(9);
            doc.setTextColor(60, 60, 60);
            doc.text('Truck No:', 14, yPos);
            doc.setTextColor(0, 0, 0);
            doc.text(bookingData.truck?.truckNo || 'N/A', 45, yPos);
            yPos += 5;

            doc.setTextColor(60, 60, 60);
            doc.text('Driver:', 14, yPos);
            doc.setTextColor(0, 0, 0);
            doc.text(bookingData.truck?.driverName || 'N/A', 45, yPos);
            yPos += 5;

            doc.setTextColor(60, 60, 60);
            doc.text('Driver Phone:', 14, yPos);
            doc.setTextColor(0, 0, 0);
            doc.text(bookingData.truck?.driverPhone || 'N/A', 45, yPos);
            yPos += 10;

            // Freight Summary
            const totalTruckPaid = bookingData.truckPayments?.reduce((sum, payment) =>
                sum + parseFloat(payment.amount || 0), 0) || 0;
            const truckFreight = parseFloat(bookingData.truckFreight || 0);
            const truckBalance = truckFreight - totalTruckPaid;

            doc.setFontSize(12);
            doc.setTextColor(0, 51, 102);
            doc.text('Freight Summary', 14, yPos);
            yPos += 7;

            doc.setFontSize(9);

            // First row
            doc.setTextColor(60, 60, 60);
            doc.text('Truck Freight:', 14, yPos);
            doc.setTextColor(0, 0, 0);
            doc.text(`Rs. ${formatCurrency(truckFreight)}`, 50, yPos);

            doc.setTextColor(60, 60, 60);
            doc.text('Total Paid:', 85, yPos);
            doc.setTextColor(0, 0, 0);
            doc.text(`Rs. ${formatCurrency(totalTruckPaid)}`, 125, yPos);
            yPos += 6;

            // Second row
            doc.setTextColor(60, 60, 60);
            doc.text('Balance:', 14, yPos);
            doc.setTextColor(truckBalance > 0 ? 220 : truckBalance < 0 ? 22 : 0,
                truckBalance > 0 ? 38 : truckBalance < 0 ? 163 : 0,
                truckBalance > 0 ? 38 : truckBalance < 0 ? 74 : 0);
            doc.text(`Rs. ${formatCurrency(truckBalance)}`, 50, yPos);
            yPos += 12;

            // Truck Payments Table
            if (bookingData.truckPayments && bookingData.truckPayments.length > 0) {
                doc.setFontSize(12);
                doc.setTextColor(0, 51, 102);
                doc.text('Truck Payment History', 14, yPos);
                yPos += 7;

                const paymentRows = bookingData.truckPayments.map(payment => [
                    formatDate(payment.paymentDate),
                    `Rs. ${formatCurrency(payment.amount)}`,
                    payment.paymentMode || 'N/A',
                    payment.utrNo || '-',
                    payment.remarks || '-',
                    payment.paymentFor || 'N/A'
                ]);

                autoTable(doc, {
                    startY: yPos,
                    head: [['Date', 'Amount', 'Mode', 'UTR', 'Remarks', 'Payment For']],
                    body: paymentRows,
                    theme: 'striped',
                    headStyles: { fillColor: [0, 51, 102], textColor: 255, fontSize: 9 },
                    styles: { fontSize: 8, cellPadding: 2 },
                    margin: { left: 14, right: 14 },
                });

                yPos = doc.lastAutoTable?.finalY + 10 || yPos + 30;
            }

            // Halting Charges Table
            if (bookingData.haltings && bookingData.haltings.length > 0) {
                doc.setFontSize(12);
                doc.setTextColor(0, 51, 102);
                doc.text('Halting Charges', 14, yPos);
                yPos += 7;

                const haltingRows = bookingData.haltings.map(halting => [
                    formatDate(halting.haltingDate),
                    halting.days,
                    `Rs. ${formatCurrency(halting.pricePerDay)}`,
                    `Rs. ${formatCurrency(halting.amount)}`,
                    halting.reason || '-'
                ]);

                autoTable(doc, {
                    startY: yPos,
                    head: [['Date', 'Days', 'Price/Day', 'Total', 'Reason']],
                    body: haltingRows,
                    theme: 'striped',
                    headStyles: { fillColor: [0, 51, 102], textColor: 255, fontSize: 9 },
                    styles: { fontSize: 8, cellPadding: 2 },
                    margin: { left: 14, right: 14 },
                });

                yPos = doc.lastAutoTable?.finalY + 10 || yPos + 30;
            }

            // Commissions Table
            if (bookingData.commissions && bookingData.commissions.length > 0) {
                doc.setFontSize(12);
                doc.setTextColor(0, 51, 102);
                doc.text('Commission Details', 14, yPos);
                yPos += 7;

                const commissionRows = bookingData.commissions.map(commission => [
                    commission.commissionType || 'N/A',
                    `Rs. ${formatCurrency(commission.amount)}`,
                    commission.paymentMode || 'N/A',
                    commission.utrNo || '-',
                    formatDate(commission.paymentDate),
                    commission.remark || '-'
                ]);

                autoTable(doc, {
                    startY: yPos,
                    head: [['Type', 'Amount', 'Mode', 'UTR No.', 'Date', 'Remark']],
                    body: commissionRows,
                    theme: 'striped',
                    headStyles: { fillColor: [0, 51, 102], textColor: 255, fontSize: 9 },
                    styles: { fontSize: 8, cellPadding: 2 },
                    margin: { left: 14, right: 14 },
                });

                yPos = doc.lastAutoTable?.finalY + 10 || yPos + 30;
            }

            // Footer
            const pageCount = doc.internal.getNumberOfPages();
            for (let i = 1; i <= pageCount; i++) {
                doc.setPage(i);
                doc.setFontSize(8);
                doc.setTextColor(150, 150, 150);
                doc.text(
                    `Generated by ${bookingData.company?.companyName || 'stc transport'}, ${new Date().toLocaleDateString('en-IN')}`,
                    105,
                    doc.internal.pageSize.height - 10,
                    { align: 'center' }
                );
                doc.text(
                    `Page ${i} of ${pageCount}`,
                    doc.internal.pageSize.width - 20,
                    doc.internal.pageSize.height - 10
                );
            }

            // Save PDF
            const fileName = `Truck_Booking_${bookingData.id}_${new Date().toISOString().split('T')[0]}.pdf`;
            doc.save(fileName);

            toast.success('PDF generated successfully');

        } catch (error) {
            console.error('Error generating PDF:', error);
            toast.error(`Failed to generate PDF: ${error.message}`);
        } finally {
            setLoadingPdf(prev => ({ ...prev, [bookingId]: false }));
        }
    };

    // Handle truck selection
    const handleTruckSelect = (truck) => {
        setSelectedTruck(truck);
        fetchTruckLedger(truck.truckId);
    };

    // Clear filters
    const clearFilters = () => {
        setSearchTerm('');
        setDateRange({ fromDate: '', toDate: '' });
        if (selectedTruck) {
            fetchTruckLedger(selectedTruck.truckId);
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

    // Calculate truck statistics
    const calculateTruckStats = () => {
        let totalTrucks = 0;
        let totalFreight = 0;
        let totalHalting = 0;
        let totalCommission = 0;
        let totalPayable = 0;
        let totalBalance = 0;
        let totalPaidAmount = 0;

        if (Array.isArray(filteredTrucks)) {
            totalTrucks = filteredTrucks.length;
            totalFreight = filteredTrucks.reduce((sum, truck) => sum + (truck.totalFreight || 0), 0);
            totalHalting = filteredTrucks.reduce((sum, truck) => sum + (truck.totalHalting || 0), 0);
            totalCommission = filteredTrucks.reduce((sum, truck) => sum + (truck.totalCommission || 0), 0);
            totalPayable = filteredTrucks.reduce((sum, truck) => sum + (truck.totalPayable || 0), 0);
            totalBalance = filteredTrucks.reduce((sum, truck) => sum + (truck.balance || 0), 0);
            totalPaidAmount = filteredTrucks.reduce((sum, truck) => sum + (truck.totalPaid || 0), 0);
        }

        return {
            totalTrucks,
            totalFreight,
            totalHalting,
            totalCommission,
            totalPayable,
            totalBalance,
            totalPaidAmount
        };
    };

    const stats = calculateTruckStats();

    // Export to Excel
    const exportToExcel = () => {
        if (!ledgerData) {
            toast.error('No ledger data to export');
            return;
        }

        try {
            const worksheetData = [];

            // Add header
            worksheetData.push(['TRUCK TRANSACTION LEDGER']);
            worksheetData.push(['']);
            worksheetData.push(['Truck No:', ledgerData.truck.truckNo]);
            worksheetData.push(['Driver:', ledgerData.truck.driverName]);
            worksheetData.push(['Opening Balance:', formatCurrency(ledgerData.openingBalance)]);
            worksheetData.push(['Closing Balance:', formatCurrency(ledgerData.closingBalance)]);
            worksheetData.push(['Closing Balance Type:', ledgerData.closingBalanceType]);
            worksheetData.push(['']);

            // Add table headers
            worksheetData.push([
                'Date',
                'Particulars',
                'Voucher Type',
                'Voucher No',
                'Debit (₹)',
                'Credit (₹)',
                'Commission (₹)',
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
                    formatCurrency(entry.commission),
                    formatCurrency(entry.balance),
                    entry.balanceType
                ]);
            });

            // Create worksheet
            const ws = XLSX.utils.aoa_to_sheet(worksheetData);

            // Set column widths
            const wscols = [
                { wch: 12 }, // Date
                { wch: 50 }, // Particulars
                { wch: 15 }, // Voucher Type
                { wch: 12 }, // Voucher No
                { wch: 15 }, // Debit
                { wch: 15 }, // Credit
                { wch: 15 }, // commission
                { wch: 15 }, // Balance
                { wch: 12 }  // Balance Type
            ];
            ws['!cols'] = wscols;

            // Create workbook
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, 'Truck Ledger');

            // Generate filename
            const truckNo = selectedTruck.truckNo.replace(/\s+/g, '_');
            const dateStr = new Date().toISOString().split('T')[0];
            XLSX.writeFile(wb, `Truck_Ledger_${truckNo}_${dateStr}.xlsx`);

            toast.success('Excel file exported successfully!');
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
                    <title>Truck Ledger - ${selectedTruck.truckNo}</title>
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
                        .commission { color: #3b82f6; }
                        .balance { font-weight: bold; }
                        .footer { margin-top: 30px; text-align: center; font-size: 12px; color: #666; }
                    </style>
                </head>
                <body>
                    <h1>TRUCK TRANSACTION LEDGER</h1>
                    <div class="header">
                        <div class="info"><strong>Truck No:</strong> ${ledgerData.truck.truckNo}</div>
                        <div class="info"><strong>Driver:</strong> ${ledgerData.truck.driverName}</div>
                        <div class="info"><strong>Opening Balance:</strong> ₹${formatCurrency(ledgerData.openingBalance)}</div>
                        <div class="info"><strong>Closing Balance:</strong> ₹${formatCurrency(ledgerData.closingBalance)}</div>
                        <div class="info"><strong>Closing Balance Type:</strong> ${ledgerData.closingBalanceType}</div>
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
                                <th>Commission (₹)</th>
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
                                    <td class="commission">${entry.commission ? '₹' + formatCurrency(entry.commission) : ''}</td>
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
        if (!ledgerData || !ledgerData.ledger) return { totalDebit: 0, totalCredit: 0, totalCommission: 0 };

        const totalDebit = ledgerData.ledger.reduce((sum, entry) => sum + (entry.debit || 0), 0);
        const totalCredit = ledgerData.ledger.reduce((sum, entry) => sum + (entry.credit || 0), 0);
        const totalCommission = ledgerData.ledger.reduce((sum, entry) => sum + (entry.commission || 0), 0);

        return { totalDebit, totalCredit, totalCommission };
    };

    const totals = calculateTotals();

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
                            Truck Transaction Ledger
                        </h1>
                        <p className="text-gray-600">
                            View detailed transaction history for each truck
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
                            onClick={fetchTrucks}
                            className="p-2 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors"
                            title="Refresh"
                        >
                            <RefreshCw className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            </div>

            {/* Stats Summary - Updated with new fields */}
            <div className="grid grid-cols-1 md:grid-cols-6 gap-4 mb-6">
                <div className="bg-white p-4 rounded-lg border border-gray-200">
                    <div className="flex items-center">
                        <div className="p-2 bg-blue-100 rounded-lg mr-3">
                            <Truck className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-600">Total Trucks</p>
                            <p className="text-lg font-bold text-gray-800">
                                {stats.totalTrucks}
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
                            <p className="text-sm text-gray-600">Total Freight</p>
                            <p className="text-lg font-bold text-gray-800">
                                ₹{formatCurrency(stats.totalFreight)}
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
                            <p className="text-sm text-gray-600">Total Halting</p>
                            <p className="text-lg font-bold text-gray-800">
                                ₹{formatCurrency(stats.totalHalting)}
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
                            <p className="text-sm text-gray-600">Total Commission</p>
                            <p className="text-lg font-bold text-gray-800">
                                ₹{formatCurrency(stats.totalCommission)}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="bg-white p-4 rounded-lg border border-gray-200">
                    <div className="flex items-center">
                        <div className="p-2 bg-green-100 rounded-lg mr-3">
                            <WalletCards className="w-5 h-5 text-green-600" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-600">Paid Amount</p>
                            <p className="text-lg font-bold text-gray-800">
                                ₹{formatCurrency(stats.totalPaidAmount)}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="bg-white p-4 rounded-lg border border-gray-200">
                    <div className="flex items-center">
                        <div className="p-2 bg-red-100 rounded-lg mr-3">
                            <Receipt className="w-5 h-5 text-red-600" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-600">Total Balance</p>
                            <p className="text-lg font-bold text-gray-800">
                                ₹{formatCurrency(stats.totalBalance)}
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
                                placeholder="Search by truck number or driver name..."
                                value={searchTerm}
                                onChange={handleSearchChange}
                                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
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
                        {/* <p className="text-xs text-gray-500 mt-2">
                            Search across truck numbers and driver names
                        </p> */}
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
                {/* Left Sidebar - Truck List */}
                <div className="lg:col-span-1">
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                        {/* Truck List Header */}
                        <div className="p-4 border-b border-gray-200">
                            <h2 className="text-lg font-semibold text-gray-800 mb-2">
                                Truck List ({filteredTrucks.length})
                            </h2>
                            {searchTerm && (
                                <p className="text-sm text-gray-600">
                                    Showing results for: "{searchTerm}"
                                </p>
                            )}
                        </div>

                        {/* Truck List */}
                        <div className="max-h-screen overflow-y-auto">
                            {loading ? (
                                <div className="flex justify-center py-10">
                                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                                </div>
                            ) : filteredTrucks.length === 0 ? (
                                <div className="text-center py-10">
                                    <Truck className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                                    <p className="text-gray-600">No trucks found</p>
                                    {searchTerm && (
                                        <p className="text-sm text-gray-500 mt-1">
                                            Try different search terms
                                        </p>
                                    )}
                                </div>
                            ) : (
                                filteredTrucks.map((truck) => (
                                    <div
                                        key={truck.truckId}
                                        onClick={() => handleTruckSelect(truck)}
                                        className={`p-4 border-b border-gray-100 cursor-pointer transition-colors hover:bg-gray-50 ${selectedTruck?.truckId === truck.truckId
                                            ? 'bg-blue-50 border-l-4 border-l-blue-500'
                                            : ''
                                            }`}
                                    >
                                        <div className="flex justify-between items-start">
                                            <div className="flex-1">
                                                <div className="flex items-center space-x-2 mb-2">
                                                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                                                        <Truck className="w-4 h-4 text-blue-600" />
                                                    </div>
                                                    <div className="flex-1">
                                                        <h3 className="font-medium text-gray-900">
                                                            {truck.truckNo}
                                                        </h3>
                                                        <div className="flex items-center space-x-1 text-sm text-gray-500">
                                                            <UserCircle className="w-3 h-3" />
                                                            <span>{truck.driver || 'N/A'}</span>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Truck Financial Summary - Updated */}
                                                <div className="grid grid-cols-3 gap-1 mb-2">
                                                    <div className="text-center">
                                                        <p className="text-xs text-gray-500">Freight</p>
                                                        <p className="text-xs font-bold text-orange-700">
                                                            ₹{formatCurrency(truck.totalFreight || 0)}
                                                        </p>
                                                    </div>
                                                    <div className="text-center">
                                                        <p className="text-xs text-gray-500">Halting</p>
                                                        <p className="text-xs font-bold text-yellow-700">
                                                            ₹{formatCurrency(truck.totalHalting || 0)}
                                                        </p>
                                                    </div>
                                                    <div className="text-center">
                                                        <p className="text-xs text-gray-500">Commission</p>
                                                        <p className="text-xs font-bold text-purple-700">
                                                            ₹{formatCurrency(truck.totalCommission || 0)}
                                                        </p>
                                                    </div>
                                                </div>

                                                <div className="grid grid-cols-2 gap-2">
                                                    <div className="text-center">
                                                        <p className="text-xs text-gray-500">Payable</p>
                                                        <p className="text-xs font-bold text-green-700">
                                                            ₹{formatCurrency(truck.totalPayable || 0)}
                                                        </p>
                                                    </div>
                                                    <div className="text-center">
                                                        <p className="text-xs text-gray-500">Balance</p>
                                                        <p className={`text-xs font-bold ${(truck.balance || 0) > 0 ? 'text-red-700' : 'text-gray-700'}`}>
                                                            ₹{formatCurrency(truck.balance || 0)}
                                                        </p>
                                                    </div>
                                                </div>

                                                {/* Additional Info */}
                                                <div className="mt-2">
                                                    <div className="flex items-center justify-between text-xs text-gray-600">
                                                        <div className="flex items-center space-x-1">
                                                            <CreditCard className="w-3 h-3" />
                                                            <span>Paid:</span>
                                                        </div>
                                                        <span className="font-medium">₹{formatCurrency(truck.totalPaid || 0)}</span>
                                                    </div>
                                                </div>
                                            </div>
                                            <ChevronRight className={`w-5 h-5 text-gray-400 ${selectedTruck?.truckId === truck.truckId ? 'text-blue-500' : ''
                                                }`} />
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>

                {/* Right Panel - Ledger Details */}
                <div className="lg:col-span-3">
                    {!selectedTruck ? (
                        <div className="bg-white rounded-lg shadow-sm border border-gray-200 h-full flex flex-col items-center justify-center p-8">
                            <BookOpen className="w-16 h-16 text-gray-300 mb-4" />
                            <h3 className="text-xl font-medium text-gray-700 mb-2">
                                Select a Truck
                            </h3>
                            <p className="text-gray-600 text-center max-w-md">
                                Choose a truck from the list to view their transaction ledger
                            </p>
                        </div>
                    ) : (
                        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                            {/* Ledger Header - Updated */}
                            <div className="p-6 border-b border-gray-200">
                                <div className=" justify-between mb-6">
                                    <div>
                                        <div className="flex justify-between space-x-3 mb-2">
                                            <div className='flex gap-4  items-center'>
                                                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                                                    <Truck className="w-6 h-6 text-blue-600" />
                                                </div>
                                                <div>
                                                    <h2 className="text-2xl font-bold text-gray-900">
                                                        {selectedTruck.truckNo}
                                                    </h2>
                                                    <div className="flex items-center space-x-2 text-gray-600">
                                                        <UserCircle className="w-4 h-4" />
                                                        <span>{selectedTruck.driver || 'N/A'}</span>
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
                                                    <div>
                                                        <button
                                                            onClick={() => fetchTruckLedger(selectedTruck.truckId)}
                                                            className="px-4 py-1.5 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 flex items-center space-x-1"
                                                        >
                                                            <Filter className="w-4 h-4" />
                                                            <span>Apply</span>
                                                        </button>
                                                    </div>
                                                </div>

                                            </div>
                                        </div>



                                        {/* Truck Summary - Updated */}
                                        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mt-4">
                                            <div className="bg-orange-50 p-3 rounded-lg border border-orange-200">
                                                <p className="text-xs text-orange-700 mb-1">Freight</p>
                                                <p className="text-lg font-bold text-orange-900">
                                                    ₹{formatCurrency(selectedTruck.totalFreight || 0)}
                                                </p>
                                            </div>
                                            <div className="bg-yellow-50 p-3 rounded-lg border border-yellow-200">
                                                <p className="text-xs text-yellow-700 mb-1">Halting</p>
                                                <p className="text-lg font-bold text-yellow-900">
                                                    ₹{formatCurrency(selectedTruck.totalHalting || 0)}
                                                </p>
                                            </div>
                                            <div className="bg-purple-50 p-3 rounded-lg border border-purple-200">
                                                <p className="text-xs text-purple-700 mb-1">Commission</p>
                                                <p className="text-lg font-bold text-purple-900">
                                                    ₹{formatCurrency(selectedTruck.totalCommission || 0)}
                                                </p>
                                            </div>
                                            <div className="bg-green-50 p-3 rounded-lg border border-green-200">
                                                <p className="text-xs text-green-700 mb-1">Payable</p>
                                                <p className="text-lg font-bold text-green-900">
                                                    ₹{formatCurrency(selectedTruck.totalPayable || 0)}
                                                </p>
                                            </div>
                                            <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
                                                <p className="text-xs text-blue-700 mb-1">Paid</p>
                                                <p className="text-lg font-bold text-blue-900">
                                                    ₹{formatCurrency(selectedTruck.totalPaid || 0)}
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                </div>


                                {/* Summary Cards */}
                                {ledgerData && (
                                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
                                                    <p className="text-sm text-purple-700 mb-1">Total Commission</p>
                                                    <p className="text-xl font-bold text-purple-900">
                                                        ₹{formatCurrency(totals.totalCommission)}
                                                    </p>
                                                </div>
                                                <Percent className="w-8 h-8 text-purple-500" />
                                            </div>
                                        </div>
                                        <div className={`p-4 rounded-lg border ${ledgerData.closingBalance > 0
                                            ? 'bg-red-50 border-red-200'
                                            : ledgerData.closingBalance < 0
                                                ? 'bg-green-50 border-green-200'
                                                : 'bg-purple-50 border-purple-200'
                                            }`}>
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <p className="text-sm text-gray-600 mb-1">Closing Balance</p>
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
                                                        {ledgerData.closingBalanceType === 'Dr' ? 'To Receive' : 'To Pay'}
                                                    </span>
                                                </div>
                                                <CreditCard className="w-8 h-8 text-gray-500" />
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
                                            Click "Apply" to load transaction details for {selectedTruck.truckNo}
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
                                                            Commission (₹)
                                                        </th>
                                                        <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                            Balance (₹)
                                                        </th>
                                                        <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                            Type
                                                        </th>
                                                        <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                            Action
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
                                                                    : entry.voucherType === 'Payment'
                                                                        ? 'bg-green-100 text-green-800'
                                                                        : entry.voucherType === 'Commission'
                                                                            ? 'bg-purple-100 text-purple-800'
                                                                            : entry.voucherType === 'Halting'
                                                                                ? 'bg-yellow-100 text-yellow-800'
                                                                                : 'bg-gray-100 text-gray-800'
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
                                                                {entry.commission > 0 && (
                                                                    <span className="text-sm font-bold text-purple-700">
                                                                        ₹{formatCurrency(entry.commission)}
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
                                                            <td className="py-3 px-4">
                                                                {entry.voucherType === 'Booking' && (
                                                                    <button
                                                                        onClick={() => generateBookingPDF(entry.voucherNo)}
                                                                        disabled={loadingPdf[entry.voucherNo]}
                                                                        className="text-blue-600 hover:text-blue-800 disabled:text-gray-400 disabled:cursor-not-allowed"
                                                                        title="Download Booking PDF"
                                                                    >
                                                                        {loadingPdf[entry.voucherNo] ? (
                                                                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
                                                                        ) : (
                                                                            <FileDown className="w-4 h-4" />
                                                                        )}
                                                                    </button>
                                                                )}
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
                                                    <div className="flex items-center justify-between mb-2">
                                                        <span className="text-sm text-gray-600 mr-4">Opening Balance:</span>
                                                        <span className="text-sm font-bold text-gray-900">
                                                            ₹{formatCurrency(ledgerData.openingBalance)}
                                                        </span>
                                                    </div>
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
                                                    <div className="flex items-center justify-between mb-2">
                                                        <span className="text-sm text-gray-600 mr-4">Total Commission:</span>
                                                        <span className="text-sm font-bold text-purple-700">
                                                            ₹{formatCurrency(totals.totalCommission)}
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
                                                        <span className="ml-2 text-xs text-gray-500">
                                                            ({ledgerData.closingBalanceType})
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

export default TruckTransactionLedger;