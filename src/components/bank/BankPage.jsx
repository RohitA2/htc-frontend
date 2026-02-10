// BankPage.jsx
import React, { useState, useEffect } from 'react';
import {
    Search,
    Filter,
    Download,
    ChevronLeft,
    ChevronRight,
    ChevronsLeft,
    ChevronsRight,
    Eye,
    Edit,
    Trash2,
    CheckCircle,
    XCircle,
    Plus,
    RefreshCw,
    Building,
    CreditCard,
    Star,
    BanknoteIcon,
    Shield,
    Users
} from 'lucide-react';
import BankExport from './BankExport';
import BankFilter from './BankFilter';
import BankModal from './BankModal';
import DeleteConfirmationModal from '../../utils/DeleteConfirmationModal';
import AddEditBankModal from './AddEditBankModal';

const BankPage = () => {
    const [banks, setBanks] = useState([]);
    const [companies, setCompanies] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalCount, setTotalCount] = useState(0);
    const [searchTerm, setSearchTerm] = useState('');
    const [filters, setFilters] = useState({
        status: '',
        isPrimary: '',
        companyId: ''
    });
    const [showFilters, setShowFilters] = useState(false);
    const [showExport, setShowExport] = useState(false);
    const [selectedBanks, setSelectedBanks] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [showAddEditModal, setShowAddEditModal] = useState(false);
    const [selectedBank, setSelectedBank] = useState(null);
    const [bankToDelete, setBankToDelete] = useState(null);
    const [editingBank, setEditingBank] = useState(null);
    const [refreshTrigger, setRefreshTrigger] = useState(0);

    const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

    // Fetch banks with pagination
    const fetchBanks = async (page = 1, search = '', filter = {}) => {
        setLoading(true);
        try {
            const queryParams = new URLSearchParams({
                page: page,
                limit: 10,
                search: search,
                status: filter.status || '',
                isPrimary: filter.isPrimary || '',
                companyId: filter.companyId || ''
            });
            const response = await fetch(`${API_BASE_URL}/bank/pagination?${queryParams}`);
            const data = await response.json();
            if (data.success) {
                setBanks(data.data);
                setTotalPages(data.totalPages);
                setTotalCount(data.count);
            } else {
                throw new Error(data.message || 'Failed to fetch banks');
            }
        } catch (err) {
            setError(err.message);
            console.error('Error fetching banks:', err);
        } finally {
            setLoading(false);
        }
    };

    // Fetch companies for dropdown
    const fetchCompanies = async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/company/list?limit=100`);
            const data = await response.json();
            if (data.success) {
                setCompanies(data.data);
            }
        } catch (err) {
            console.error('Error fetching companies:', err);
        }
    };

    useEffect(() => {
        fetchBanks(currentPage, searchTerm, filters);
        fetchCompanies();
    }, [currentPage, filters, refreshTrigger]);

    useEffect(() => {
        const timer = setTimeout(() => {
            if (searchTerm !== '') {
                fetchBanks(1, searchTerm, filters);
                setCurrentPage(1);
            }
        }, 500);
        return () => clearTimeout(timer);
    }, [searchTerm]);

    const handleSearch = (e) => {
        setSearchTerm(e.target.value);
    };

    const handleFilterChange = (newFilters) => {
        setFilters(newFilters);
        setCurrentPage(1);
    };

    const handleClearFilters = () => {
        setFilters({
            status: '',
            isPrimary: '',
            companyId: ''
        });
        setSearchTerm('');
        setCurrentPage(1);
    };

    const goToPage = (page) => {
        if (page >= 1 && page <= totalPages) {
            setCurrentPage(page);
        }
    };

    const handlePrevPage = () => goToPage(currentPage - 1);
    const handleNextPage = () => goToPage(currentPage + 1);

    const handleSelectAll = (e) => {
        if (e.target.checked) {
            setSelectedBanks(banks.map(bank => bank.id));
        } else {
            setSelectedBanks([]);
        }
    };

    const handleSelectBank = (id) => {
        setSelectedBanks(prev =>
            prev.includes(id)
                ? prev.filter(bankId => bankId !== id)
                : [...prev, id]
        );
    };

    const handleViewBank = (bank) => {
        setSelectedBank(bank);
        setShowModal(true);
    };

    const handleEditBank = (bank) => {
        setEditingBank(bank);
        setShowAddEditModal(true);
    };

    const handleDeleteClick = (bank) => {
        setBankToDelete(bank);
        setShowDeleteModal(true);
    };

    const handleConfirmDelete = async () => {
        if (!bankToDelete) return;
        try {
            const response = await fetch(`${API_BASE_URL}/bank/delete/${bankToDelete.id}`, {
                method: 'DELETE',
            });
            const data = await response.json();
            if (data.success) {
                setRefreshTrigger(prev => prev + 1);
                setSelectedBanks(prev => prev.filter(id => id !== bankToDelete.id));
            } else {
                throw new Error(data.message || 'Failed to delete bank');
            }
        } catch (err) {
            alert(`Error deleting bank: ${err.message}`);
        } finally {
            setShowDeleteModal(false);
            setBankToDelete(null);
        }
    };

    const handleBulkDelete = () => {
        if (selectedBanks.length > 0) {
            setBankToDelete({ id: 'bulk', name: `${selectedBanks.length} selected banks` });
            setShowDeleteModal(true);
        }
    };

    const handleConfirmBulkDelete = async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/banks/bulk-delete`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ ids: selectedBanks }),
            });
            const data = await response.json();
            if (data.success) {
                setRefreshTrigger(prev => prev + 1);
                setSelectedBanks([]);
            } else {
                throw new Error(data.message || 'Failed to delete banks');
            }
        } catch (err) {
            alert(`Error deleting banks: ${err.message}`);
        } finally {
            setShowDeleteModal(false);
            setBankToDelete(null);
        }
    };

    const handleAddBank = () => {
        setEditingBank(null);
        setShowAddEditModal(true);
    };

    const handleBankSaved = () => {
        setRefreshTrigger(prev => prev + 1);
        setShowAddEditModal(false);
        setEditingBank(null);
    };

    const handleRefresh = () => {
        setRefreshTrigger(prev => prev + 1);
    };

    const handleTogglePrimary = async (bank) => {
        if (bank.isPrimary) return;
        try {
            const response = await fetch(`${API_BASE_URL}/bank/update/${bank.id}`, {
                method: 'PUT',
            });
            const data = await response.json();
            if (data.success) {
                setRefreshTrigger(prev => prev + 1);
            } else {
                throw new Error(data.message || 'Failed to update primary bank');
            }
        } catch (err) {
            alert(`Error updating primary bank: ${err.message}`);
        }
    };

    const StatusBadge = ({ status }) => {
        const statusConfig = {
            Active: {
                bg: 'bg-linear-to-r from-green-100 to-green-50',
                text: 'text-green-800',
                icon: <CheckCircle className="w-3 h-3" />
            },
            Inactive: {
                bg: 'bg-linear-to-r from-red-100 to-red-50',
                text: 'text-red-800',
                icon: <XCircle className="w-3 h-3" />
            }
        };
        const config = statusConfig[status] || statusConfig.Inactive;
        return (
            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${config.bg} ${config.text} border border-green-200`}>
                {config.icon}
                <span className="ml-1">{status}</span>
            </span>
        );
    };

    const PrimaryBadge = () => (
        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-linear-to-r from-yellow-100 to-yellow-50 text-yellow-800 border border-yellow-200">
            <Star className="w-3 h-3 fill-yellow-400" />
            <span className="ml-1">Primary</span>
        </span>
    );

    const getCompanyName = (companyId) => {
        const company = companies.find(c => c.id === companyId);
        return company ? company.companyName : 'Unknown Company';
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('en-IN', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
        });
    };

    const formatAccountNumber = (accountNo) => {
        if (!accountNo) return '';
        return `****${accountNo.slice(-4)}`;
    };

    return (
        <div className="min-h-screen bg-linear-to-br from-gray-50 to-blue-50/20 p-2 sm:p-4 md:p-6 lg:p-12">
            {/* Header */}
            <div className="mb-6 sm:mb-8">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 sm:gap-4">
                    <div>
                        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Bank Account Management</h1>
                        <p className="text-sm sm:text-base text-gray-600 mt-1 sm:mt-2">Manage and view all bank account records</p>
                    </div>
                    <div className="flex flex-wrap gap-2 sm:gap-3">
                        <button
                            onClick={handleRefresh}
                            className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-all text-xs sm:text-sm"
                            title="Refresh"
                        >
                            <RefreshCw className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                            <span className="hidden sm:inline">Refresh</span>
                        </button>
                        <button
                            onClick={handleAddBank}
                            className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 bg-linear-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all shadow-md hover:shadow-lg text-xs sm:text-sm"
                        >
                            <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
                            <span className=" xs:inline">Add Bank</span>
                        </button>
                    </div>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 md:gap-6 mb-6 sm:mb-8">
                <div className="bg-linear-to-br from-white to-blue-50/50 rounded-xl shadow-sm sm:shadow-md p-3 sm:p-4 md:p-5 border border-blue-100">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-xs sm:text-sm text-gray-600 font-medium">Total Accounts</p>
                            <p className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 mt-1">{totalCount}</p>
                        </div>
                        <div className="p-2 sm:p-3 rounded-xl bg-linear-to-br from-blue-100 to-blue-50">
                            <BanknoteIcon className="w-5 h-5 sm:w-6 sm:h-6 md:w-8 md:h-8 text-blue-600" />
                        </div>
                    </div>
                </div>
                <div className="bg-linear-to-br from-white to-green-50/50 rounded-xl shadow-sm sm:shadow-md p-3 sm:p-4 md:p-5 border border-green-100">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-xs sm:text-sm text-gray-600 font-medium">Active</p>
                            <p className="text-xl sm:text-2xl md:text-3xl font-bold text-green-600 mt-1">
                                {banks.filter(b => b.status === 'Active').length}
                            </p>
                        </div>
                        <div className="p-2 sm:p-3 rounded-xl bg-linear-to-br from-green-100 to-green-50">
                            <Shield className="w-5 h-5 sm:w-6 sm:h-6 md:w-8 md:h-8 text-green-600" />
                        </div>
                    </div>
                </div>
                <div className="bg-linear-to-br from-white to-yellow-50/50 rounded-xl shadow-sm sm:shadow-md p-3 sm:p-4 md:p-5 border border-yellow-100">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-xs sm:text-sm text-gray-600 font-medium">Primary</p>
                            <p className="text-xl sm:text-2xl md:text-3xl font-bold text-yellow-600 mt-1">
                                {banks.filter(b => b.isPrimary).length}
                            </p>
                        </div>
                        <div className="p-2 sm:p-3 rounded-xl bg-linear-to-br from-yellow-100 to-yellow-50">
                            <Star className="w-5 h-5 sm:w-6 sm:h-6 md:w-8 md:h-8 text-yellow-600 fill-yellow-400" />
                        </div>
                    </div>
                </div>
                <div className="bg-linear-to-br from-white to-purple-50/50 rounded-xl shadow-sm sm:shadow-md p-3 sm:p-4 md:p-5 border border-purple-100">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-xs sm:text-sm text-gray-600 font-medium">Selected</p>
                            <p className="text-xl sm:text-2xl md:text-3xl font-bold text-purple-600 mt-1">{selectedBanks.length}</p>
                        </div>
                        <div className="p-2 sm:p-3 rounded-xl bg-linear-to-br from-purple-100 to-purple-50">
                            <Users className="w-5 h-5 sm:w-6 sm:h-6 md:w-8 md:h-8 text-purple-600" />
                        </div>
                    </div>
                </div>
            </div>

            {/* Search and Action Bar */}
            <div className="bg-linear-to-br from-white to-blue-50/30 rounded-xl shadow-md mb-6 sm:mb-8 border border-blue-100 overflow-hidden">
                <div className="p-3 sm:p-5 border-b border-blue-100">
                    <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-3 sm:gap-5">
                        <div className="relative flex-1 w-full min-w-0">
                            <Search className="absolute left-3 sm:left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 sm:w-5 sm:h-5" />
                            <input
                                type="text"
                                placeholder="Search accounts, IFSC, branch..."
                                className="w-full pl-10 sm:pl-12 pr-3 sm:pr-4 py-2.5 sm:py-3 border border-blue-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white/70 backdrop-blur-sm transition-all text-sm"
                                value={searchTerm}
                                onChange={handleSearch}
                            />
                        </div>
                        <div className="flex flex-wrap gap-2 sm:gap-3 w-full lg:w-auto lg:flex-none">
                            <button
                                onClick={() => setShowFilters(!showFilters)}
                                className="flex items-center gap-1.5 px-3 sm:px-4 py-2.5 border border-blue-200 rounded-xl hover:bg-blue-50/50 transition-all text-xs sm:text-sm flex-1 sm:flex-none min-w-11"
                            >
                                <Filter className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
                                <span className="hidden sm:inline">Filters</span>
                                {Object.values(filters).some(val => val) && (
                                    <span className="bg-blue-500 text-white text-xs rounded-full w-4 h-4 sm:w-5 sm:h-5 flex items-center justify-center animate-pulse ml-1 sm:ml-2 shrink-0">
                                        !
                                    </span>
                                )}
                            </button>
                            <button
                                onClick={() => setShowExport(true)}
                                className="flex items-center gap-1.5 px-3 sm:px-5 py-2.5 bg-linear-to-r from-green-500 to-emerald-600 text-white rounded-xl hover:from-green-600 hover:to-emerald-700 transition-all shadow-md hover:shadow-lg text-xs sm:text-sm flex-1 sm:flex-none min-w-11"
                            >
                                <Download className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
                                <span className="hidden sm:inline">Export</span>
                            </button>
                            {selectedBanks.length > 0 && (
                                <button
                                    onClick={handleBulkDelete}
                                    className="flex items-center gap-1.5 px-3 sm:px-5 py-2.5 bg-linear-to-r from-red-500 to-rose-600 text-white rounded-xl hover:from-red-600 hover:to-rose-700 transition-all shadow-md hover:shadow-lg text-xs sm:text-sm flex-1 sm:flex-none"
                                >
                                    <Trash2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
                                    <span className="hidden xs:inline">Delete ({selectedBanks.length})</span>
                                </button>
                            )}
                        </div>
                    </div>
                </div>
                {/* Filters Panel */}
                {showFilters && (
                    <div className="p-3 sm:p-5 border-t border-blue-100 bg-linear-to-br from-blue-50/50 to-white/50">
                        <BankFilter
                            filters={filters}
                            companies={companies}
                            onFilterChange={handleFilterChange}
                            onClear={handleClearFilters}
                        />
                    </div>
                )}
            </div>

            {/* Enhanced Scrollable Banks Table */}
            <div className="bg-linear-to-br from-white to-blue-50/30 rounded-xl shadow-md overflow-hidden border border-blue-100 max-h-[70vh] sm:max-h-[75vh]">
                {loading ? (
                    <div className="p-8 sm:p-12 text-center">
                        <div className="inline-block animate-spin rounded-full h-10 w-10 sm:h-12 sm:w-12 border-[3px] border-blue-500 border-t-transparent mx-auto"></div>
                        <p className="mt-3 sm:mt-4 text-gray-600 text-sm sm:text-lg">Loading bank accounts...</p>
                    </div>
                ) : error ? (
                    <div className="p-8 sm:p-12 text-center">
                        <div className="inline-flex items-center justify-center w-14 h-14 sm:w-16 sm:h-16 bg-red-100 rounded-full mb-4 mx-auto">
                            <XCircle className="w-7 h-7 sm:w-8 sm:h-8 text-red-600" />
                        </div>
                        <p className="text-red-600 text-sm sm:text-lg mb-4">Error: {error}</p>
                        <button
                            onClick={() => fetchBanks(currentPage, searchTerm, filters)}
                            className="px-5 sm:px-6 py-2.5 sm:py-3 bg-linear-to-r from-blue-500 to-blue-600 text-white rounded-xl hover:from-blue-600 hover:to-blue-700 transition-all shadow-md text-sm"
                        >
                            Retry
                        </button>
                    </div>
                ) : (
                    <>
                        <div className="overflow-auto max-h-[calc(70vh-140px)] sm:max-h-[calc(75vh-160px)] scrollbar-thin scrollbar-thumb-blue-300 scrollbar-track-blue-100 hover:scrollbar-thumb-blue-400">
                            <table className="min-w-225 sm:min-w-full w-full divide-y divide-blue-100 table-fixed">
                                <thead className="bg-linear-to-r from-blue-50 to-blue-100/50 sticky top-0 z-10">
                                    <tr>
                                        <th className="w-12 px-2 sm:px-4 py-2.5 sm:py-3 text-left text-xs font-semibold text-blue-800 uppercase tracking-wider">
                                            <input
                                                type="checkbox"
                                                className="w-4 h-4 rounded border-blue-300 focus:ring-blue-500"
                                                checked={selectedBanks.length === banks.length && banks.length > 0}
                                                onChange={handleSelectAll}
                                            />
                                        </th>
                                        <th className="w-28 sm:w-32 px-2 sm:px-4 py-2.5 sm:py-3 text-left text-xs font-semibold text-blue-800 uppercase tracking-wider">
                                            Account
                                        </th>
                                        <th className="w-32 sm:w-36 px-2 sm:px-4 py-2.5 sm:py-3 text-left text-xs font-semibold text-blue-800 uppercase tracking-wider">
                                            Bank Info
                                        </th>
                                        <th className="w-24 sm:w-28 px-2 sm:px-4 py-2.5 sm:py-3 text-left text-xs font-semibold text-blue-800 uppercase tracking-wider">
                                            Company
                                        </th>
                                        <th className="w-20 px-2 sm:px-4 py-2.5 sm:py-3 text-left text-xs font-semibold text-blue-800 uppercase tracking-wider">
                                            Status
                                        </th>
                                        {/* <th className="w-24 px-2 sm:px-4 py-2.5 sm:py-3 text-left text-xs font-semibold text-blue-800 uppercase tracking-wider">
                                            Created
                                        </th> */}
                                        <th className="w-24 px-2 sm:px-6 py-2.5 sm:py-3 text-left text-xs font-semibold text-blue-800 uppercase tracking-wider">
                                            Actions
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-blue-100/50">
                                    {banks.map((bank) => (
                                        <tr
                                            key={bank.id}
                                            className={`hover:bg-linear-to-r hover:from-blue-50/70 hover:to-transparent transition-all duration-200 ${bank.isPrimary ? 'bg-linear-to-r from-yellow-50/40 to-transparent border-l-4 border-yellow-400' : ''
                                                }`}
                                        >
                                            <td className="px-2 sm:px-4 py-2.5 sm:py-3 whitespace-nowrap w-12">
                                                <input
                                                    type="checkbox"
                                                    className="w-4 h-4 rounded border-blue-300 focus:ring-blue-500"
                                                    checked={selectedBanks.includes(bank.id)}
                                                    onChange={() => handleSelectBank(bank.id)}
                                                />
                                            </td>
                                            <td className="px-2 sm:px-4 py-2.5 sm:py-3 w-28 sm:w-32">
                                                <div className="space-y-1">
                                                    <div className="font-semibold text-gray-900 text-xs sm:text-sm flex items-center gap-1.5">
                                                        {bank.acHolderName}
                                                        {bank.isPrimary && (
                                                            <Star className="w-3 h-3 sm:w-4 sm:h-4 text-yellow-500 fill-yellow-400 shrink-0" />
                                                        )}
                                                    </div>
                                                    <div className="text-xs text-gray-600 font-mono">
                                                        {formatAccountNumber(bank.accountNo)}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-2 sm:px-4 py-2.5 sm:py-3 w-32 sm:w-36">
                                                <div className="space-y-1">
                                                    <div className="font-medium text-xs sm:text-sm text-gray-900 truncate">{bank.branchName}</div>
                                                    <div className="text-xs text-gray-600 font-mono">IFSC: {bank.IFSCode}</div>
                                                </div>
                                            </td>
                                            <td className="px-2 sm:px-4 py-2.5 sm:py-3 w-24 sm:w-28">
                                                <div className="flex items-center gap-1.5 sm:gap-2 truncate">
                                                    <div className="p-1.5 sm:p-2 bg-blue-100 rounded-lg shrink-0">
                                                        <Building className="w-3 h-3 sm:w-4 sm:h-4 text-blue-600" />
                                                    </div>
                                                    <span className="text-xs sm:text-sm font-medium text-gray-900 truncate" title={getCompanyName(bank.companyId)}>
                                                        {getCompanyName(bank.companyId)}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-2 sm:px-4 py-2.5 sm:py-3 w-20">
                                                <div className="flex flex-col gap-1 sm:space-y-1.5">
                                                    <StatusBadge status={bank.status} />
                                                    {bank.isPrimary && <PrimaryBadge />}
                                                </div>
                                            </td>
                                            {/* <td className="px-2 sm:px-4 py-2.5 sm:py-3 whitespace-nowrap w-24">
                                                <div className="text-xs sm:text-sm text-gray-900 font-medium">
                                                    {formatDate(bank.createdAt)}
                                                </div>
                                            </td> */}
                                            <td className="px-2 sm:px-4 py-2.5 sm:py-3 whitespace-nowrap w-24">
                                                <div className="flex items-center gap-1 sm:gap-1.5">
                                                    <button
                                                        onClick={() => handleViewBank(bank)}
                                                        className="p-1.5 sm:p-2 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-lg transition-all shrink-0 w-8 h-8 sm:w-9 sm:h-9"
                                                        title="View"
                                                    >
                                                        <Eye className="w-3 h-3 sm:w-4 sm:h-4 m-auto" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleEditBank(bank)}
                                                        className="p-1.5 sm:p-2 bg-green-50 hover:bg-green-100 text-green-600 rounded-lg transition-all shrink-0 w-8 h-8 sm:w-9 sm:h-9"
                                                        title="Edit"
                                                    >
                                                        <Edit className="w-3 h-3 sm:w-4 sm:h-4 m-auto" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleTogglePrimary(bank)}
                                                        className={`p-1.5 sm:p-2 rounded-lg transition-all shrink-0 w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center ${bank.isPrimary
                                                            ? 'bg-yellow-50 text-yellow-600 cursor-default'
                                                            : 'bg-purple-50 hover:bg-purple-100 text-purple-600'
                                                            }`}
                                                        title={bank.isPrimary ? 'Primary Account' : 'Set as Primary'}
                                                        disabled={bank.isPrimary}
                                                    >
                                                        <Star className={`w-3 h-3 sm:w-4 sm:h-4 ${bank.isPrimary ? 'fill-yellow-400' : ''}`} />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeleteClick(bank)}
                                                        className="p-1.5 sm:p-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg transition-all shrink-0 w-8 h-8 sm:w-9 sm:h-9"
                                                        title="Delete"
                                                    >
                                                        <Trash2 className="w-3 h-3 sm:w-4 sm:h-4 m-auto" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Empty State */}
                        {banks.length === 0 && (
                            <div className="text-center py-12 sm:py-16">
                                <div className="inline-flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 bg-blue-100 rounded-full mb-4 sm:mb-6 mx-auto">
                                    <CreditCard className="w-8 h-8 sm:w-10 sm:h-10 text-blue-400" />
                                </div>
                                <div className="text-gray-500 text-sm sm:text-xl mb-2">No bank accounts found</div>
                                {searchTerm && (
                                    <button
                                        onClick={handleClearFilters}
                                        className="text-blue-600 hover:text-blue-800 font-medium text-sm transition-colors"
                                    >
                                        Clear search and filters
                                    </button>
                                )}
                            </div>
                        )}

                        {/* Enhanced Pagination */}
                        <div className="px-3 sm:px-6 lg:px-7 py-3 sm:py-4 md:py-5 border-t border-blue-100 bg-linear-to-r from-blue-50/70 to-transparent">
                            <div className="flex flex-col xs:flex-row sm:flex-col md:flex-row justify-between items-center gap-3 sm:gap-4">
                                <div className="text-xs sm:text-sm text-gray-700 text-center sm:text-left order-3 sm:order-1">
                                    Showing <span className="font-semibold text-gray-900">{banks.length}</span> of{' '}
                                    <span className="font-semibold text-gray-900">{totalCount}</span> accounts
                                </div>

                                <div className="flex items-center gap-1 sm:gap-1.5 order-2 sm:order-2 flex-wrap justify-center">
                                    <button
                                        onClick={() => goToPage(1)}
                                        disabled={currentPage === 1}
                                        className="p-1.5 sm:p-2 md:p-3 rounded-lg border border-blue-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-blue-50/70 transition-all shrink-0 w-8 h-8 sm:w-9 sm:h-9 md:w-11 md:h-11"
                                    >
                                        <ChevronsLeft className="w-3 h-3 sm:w-3.5 sm:h-3.5 md:w-4 md:h-4 m-auto" />
                                    </button>
                                    <button
                                        onClick={handlePrevPage}
                                        disabled={currentPage === 1}
                                        className="p-1.5 sm:p-2 md:p-3 rounded-lg border border-blue-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-blue-50/70 transition-all shrink-0 w-8 h-8 sm:w-9 sm:h-9 md:w-11 md:h-11"
                                    >
                                        <ChevronLeft className="w-3 h-3 sm:w-3.5 sm:h-3.5 md:w-4 md:h-4 m-auto" />
                                    </button>

                                    <div className="flex gap-0.5 sm:gap-1 px-2 py-1 bg-white/50 rounded-lg border border-blue-200">
                                        {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                                            let pageNum;
                                            if (totalPages <= 5) {
                                                pageNum = i + 1;
                                            } else if (currentPage <= 3) {
                                                pageNum = i + 1;
                                            } else if (currentPage >= totalPages - 2) {
                                                pageNum = totalPages - 4 + i;
                                            } else {
                                                pageNum = currentPage - 2 + i;
                                            }
                                            return (
                                                <button
                                                    key={pageNum}
                                                    onClick={() => goToPage(pageNum)}
                                                    className={`w-8 h-8 sm:w-9 sm:h-9 md:w-11 md:h-11 rounded-lg border transition-all text-xs font-medium flex items-center justify-center min-w-0 ${currentPage === pageNum
                                                        ? 'bg-linear-to-r from-blue-600 to-blue-700 text-white border-blue-600 shadow-sm'
                                                        : 'border-blue-300 hover:bg-blue-50/70 hover:border-blue-400'
                                                        }`}
                                                >
                                                    {pageNum}
                                                </button>
                                            );
                                        })}
                                    </div>

                                    <button
                                        onClick={handleNextPage}
                                        disabled={currentPage === totalPages}
                                        className="p-1.5 sm:p-2 md:p-3 rounded-lg border border-blue-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-blue-50/70 transition-all shrink-0 w-8 h-8 sm:w-9 sm:h-9 md:w-11 md:h-11"
                                    >
                                        <ChevronRight className="w-3 h-3 sm:w-3.5 sm:h-3.5 md:w-4 md:h-4 m-auto" />
                                    </button>
                                    <button
                                        onClick={() => goToPage(totalPages)}
                                        disabled={currentPage === totalPages}
                                        className="p-1.5 sm:p-2 md:p-3 rounded-lg border border-blue-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-blue-50/70 transition-all shrink-0 w-8 h-8 sm:w-9 sm:h-9 md:w-11 md:h-11"
                                    >
                                        <ChevronsRight className="w-3 h-3 sm:w-3.5 sm:h-3.5 md:w-4 md:h-4 m-auto" />
                                    </button>
                                </div>

                                <div className="text-xs sm:text-sm text-gray-700 text-center sm:text-right order-1 sm:order-3">
                                    Page <span className="font-semibold text-gray-900">{currentPage}</span> of{' '}
                                    <span className="font-semibold text-gray-900">{totalPages}</span>
                                </div>
                            </div>
                        </div>
                    </>
                )}
            </div>

            {/* Modals */}
            {showExport && (
                <BankExport
                    banks={banks}
                    companies={companies}
                    selectedBanks={selectedBanks}
                    onClose={() => setShowExport(false)}
                />
            )}
            {showModal && selectedBank && (
                <BankModal
                    bank={selectedBank}
                    companyName={getCompanyName(selectedBank.companyId)}
                    onClose={() => setShowModal(false)}
                    onEdit={() => {
                        setShowModal(false);
                        handleEditBank(selectedBank);
                    }}
                />
            )}
            {showDeleteModal && bankToDelete && (
                <DeleteConfirmationModal
                    item={bankToDelete}
                    onClose={() => {
                        setShowDeleteModal(false);
                        setBankToDelete(null);
                    }}
                    onConfirm={bankToDelete.id === 'bulk' ? handleConfirmBulkDelete : handleConfirmDelete}
                    isBulkDelete={bankToDelete.id === 'bulk'}
                    itemType="bank account"
                />
            )}
            {showAddEditModal && (
                <AddEditBankModal
                    bank={editingBank}
                    companies={companies}
                    onClose={() => {
                        setShowAddEditModal(false);
                        setEditingBank(null);
                    }}
                    onSave={handleBankSaved}
                />
            )}
            <style>{`.scrollbar-thin {
  scrollbar-width: thin;
  scrollbar-color: theme('colors.blue.300') theme('colors.blue.100');
}
.scrollbar-thin::-webkit-scrollbar {
  height: 8px;
  width: 8px;
}
.scrollbar-thin::-webkit-scrollbar-track {
  @apply bg-blue-100;
}
.scrollbar-thin::-webkit-scrollbar-thumb {
  @apply bg-blue-300 rounded-lg hover:bg-blue-400;
}`}</style>
        </div>
    );
};

export default BankPage;