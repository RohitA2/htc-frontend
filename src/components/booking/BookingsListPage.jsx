import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import moment from 'moment';
import BookingForm from './BookingForm';
import BiltyForm from '../bilty/BiltyForm';
import {
    PlusIcon,
    MagnifyingGlassIcon,
    FunnelIcon,
    ArrowDownTrayIcon,
    TrashIcon,
    EllipsisVerticalIcon,
    PhoneIcon,
    CurrencyDollarIcon,
    PencilIcon,
    InformationCircleIcon,
    DocumentDuplicateIcon,
    ChevronLeftIcon,
    ChevronRightIcon,
    ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import {
    ChevronDownIcon,
    CalendarIcon,
    XMarkIcon
} from '@heroicons/react/24/solid';
import { toast } from 'react-toastify';

const API_URL = import.meta.env.VITE_API_BASE_URL;

const BookingsListPage = () => {
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searchText, setSearchText] = useState('');
    const [selectedStatus, setSelectedStatus] = useState('all');
    const [selectedDates, setSelectedDates] = useState([]);
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [pagination, setPagination] = useState({
        current: 1,
        pageSize: 10,
        total: 0
    });

    // State to control BookingForm visibility and mode
    const [showBookingForm, setShowBookingForm] = useState(false);
    const [editingBooking, setEditingBooking] = useState(null);

    const [slipPreviewVisible, setSlipPreviewVisible] = useState(false);
    const [previewBooking, setPreviewBooking] = useState(null);
    const [previewSlipType, setPreviewSlipType] = useState(null);

    const [biltyFormVisible, setBiltyFormVisible] = useState(false);
    const [selectedBookingForBilty, setSelectedBookingForBilty] = useState(null);

    // Action dropdown state
    const [openDropdownId, setOpenDropdownId] = useState(null);
    const [deleteModalVisible, setDeleteModalVisible] = useState(false);
    const [bookingToDelete, setBookingToDelete] = useState(null);

    // Refs for closing dropdown when clicking outside
    const dropdownRefs = useRef({});
    const datePickerRef = useRef(null);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            // Check if click is outside all dropdowns
            const isOutsideAllDropdowns = Object.values(dropdownRefs.current).every(ref =>
                ref && !ref.contains(event.target)
            );

            if (isOutsideAllDropdowns) {
                setOpenDropdownId(null);
            }

            if (datePickerRef.current && !datePickerRef.current.contains(event.target)) {
                setShowDatePicker(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Build filters object for API call
    const buildFilters = () => {
        const filters = {};

        if (searchText) {
            filters.search = searchText;
        }

        if (selectedStatus !== 'all') {
            filters.status = selectedStatus;
        }

        if (selectedDates && selectedDates.length === 2) {
            filters.fromDate = selectedDates[0] ? moment(selectedDates[0]).format('YYYY-MM-DD') : null;
            filters.toDate = selectedDates[1] ? moment(selectedDates[1]).format('YYYY-MM-DD') : null;
        }

        return filters;
    };

    // Fetch bookings data with filters
    const fetchBookings = async (page = 1, limit = 10, filters = {}) => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const config = {
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                params: {
                    page,
                    limit,
                    ...filters
                }
            };
            const response = await axios.get(`${API_URL}/booking/pagination`, config);
            setBookings(response.data.data);
            setPagination({
                current: response.data.pagination.page,
                pageSize: response.data.pagination.limit,
                total: response.data.pagination.total
            });
        } catch (error) {
            console.error('Error fetching bookings:', error);
            message.error(error?.response?.data?.message || 'Failed to fetch bookings');
            toast.error(error?.response?.data?.message || 'Failed to fetch bookings');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchBookings();
    }, []);

    // Handle table pagination
    const handleTableChange = (page, pageSize) => {
        const filters = buildFilters();
        fetchBookings(page, pageSize, filters);
    };

    // Handle search
    const handleSearch = () => {
        const filters = buildFilters();
        if (searchText) {
            filters.search = searchText;
        }
        fetchBookings(1, pagination.pageSize, filters);
    };

    // Handle status filter
    const handleStatusFilter = (status) => {
        setSelectedStatus(status);
        const filters = buildFilters();
        if (status !== 'all') {
            filters.status = status;
        } else {
            delete filters.status;
        }
        fetchBookings(1, pagination.pageSize, filters);
    };

    // Handle date filter
    const handleDateFilter = (startDate, endDate) => {
        setSelectedDates([startDate, endDate]);
        setShowDatePicker(false);

        const filters = buildFilters();
        if (startDate && endDate) {
            filters.fromDate = moment(startDate).format('YYYY-MM-DD');
            filters.toDate = moment(endDate).format('YYYY-MM-DD');
        } else {
            delete filters.fromDate;
            delete filters.toDate;
        }

        fetchBookings(1, pagination.pageSize, filters);
    };

    // Calculate total commission
    const calculateTotalCommission = (commissions) => {
        if (!commissions || !Array.isArray(commissions)) return 0;
        return commissions.reduce((sum, commission) => {
            return sum + parseFloat(commission.amount || 0);
        }, 0);
    };

    // Export functionality
    const handleExport = () => {
        if (bookings.length === 0) {
            toast.error('No data to export');
            return;
        }

        const exportData = bookings.map(booking => ({
            'Booking ID': booking.id,
            'Date': moment(booking.date).format('DD/MM/YYYY'),
            'Party': booking.party?.partyName || '',
            'Party Phone': booking.party?.partyPhone || '',
            'Truck No': booking.truck?.truckNo || '',
            'Driver': booking.truck?.driverName || '',
            'Driver Phone': booking.truck?.driverPhone || '',
            'From': booking.fromLocation || '',
            'To': booking.toLocation || '',
            'Commodity': booking.commodity || '',
            'Weight': `${booking.weight || 0} ${booking.weightType || ''}`,
            'Party Rate': booking.rate || 0,
            'Truck Rate': booking.truckFreight && booking.weight ?
                (parseFloat(booking.truckFreight) / parseFloat(booking.weight)).toFixed(2) : 0,
            'Party Freight': booking.partyFreight || '0.00',
            'Truck Freight': booking.truckFreight || '0.00',
            'Difference': booking.differenceAmount || '0.00',
            'Commission': calculateTotalCommission(booking.commissions).toFixed(2),
            'Status': booking.status || '',
            'Created By': booking.updatedByUser?.fullName || ''
        }));

        const csvContent = convertToCSV(exportData);
        downloadCSV(csvContent, `bookings_export_${moment().format('YYYYMMDD_HHmmss')}.csv`);
        toast.info('Data exported successfully');
    };

    const convertToCSV = (data) => {
        if (data.length === 0) return '';
        const headers = Object.keys(data[0]);
        const csvRows = [
            headers.join(','),
            ...data.map(row => headers.map(header => `"${String(row[header] || '')}"`).join(','))
        ];
        return csvRows.join('\n');
    };

    const downloadCSV = (content, filename) => {
        const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', filename);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    // PDF Generation
    const downloadPDF = async (slipType, bookingId) => {
        try {
            const token = localStorage.getItem('token');
            let endpoint = '';

            switch (slipType) {
                case 'difference':
                    endpoint = `/pdf/difference-slip/${bookingId}`;
                    break;
                case 'booking':
                    endpoint = `/pdf/booking-slip/${bookingId}`;
                    break;
                case 'bilty':
                    endpoint = `/pdf/bilty-slip/${bookingId}`;
                    break;
                default:
                    return;
            }

            const response = await axios.get(`${API_URL}${endpoint}`, {
                headers: { Authorization: `Bearer ${token}` },
                responseType: 'blob',
            });

            const blob = new Blob([response.data], { type: 'application/pdf' });
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `${slipType}-slip-${bookingId}.pdf`);
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);

            toast.info(`Downloading ${slipType} slip...`);
        } catch (error) {
            console.error('PDF download failed:', error);
            toast.error('Failed to download PDF');
        }
    };

    const openSlipPreview = (record, slipType) => {
        setPreviewBooking(record);
        setPreviewSlipType(slipType);
        setSlipPreviewVisible(true);
    };

    // Action handlers
    const handleEdit = (booking) => {
        setEditingBooking(booking);
        setShowBookingForm(true);
        setOpenDropdownId(null);
    };

    const handleDeleteClick = (bookingId) => {
        setBookingToDelete(bookingId);
        setDeleteModalVisible(true);
        setOpenDropdownId(null);
    };

    const handleDeleteConfirm = async () => {
        if (!bookingToDelete) return;

        try {
            const token = localStorage.getItem('token');
            await axios.delete(`${API_URL}/booking/soft-delete/${bookingToDelete}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            toast.success('Booking deleted successfully');
            fetchBookings(pagination.current, pagination.pageSize, buildFilters());
        } catch (error) {
            toast.error('Failed to delete booking');
            console.error('Error deleting booking:', error);
        } finally {
            setDeleteModalVisible(false);
            setBookingToDelete(null);
        }
    };

    const handleChallanInfo = (bookingId) => {
        window.location.href = `/bookings/challan/${bookingId}`;
    };

    const handleCloseBookingForm = () => {
        setShowBookingForm(false);
        setEditingBooking(null);
    };

    const handleBookingSuccess = () => {
        setShowBookingForm(false);
        setEditingBooking(null);
        fetchBookings(pagination.current, pagination.pageSize, buildFilters());
        toast.success(editingBooking ? 'Booking updated successfully!' : 'Booking Dispatched successfully!');
    };

    const handleBiltyClick = (record) => {
        setSelectedBookingForBilty(record);
        setBiltyFormVisible(true);
        setOpenDropdownId(null);
    };

    // Status color mapping
    const statusColors = {
        pending: 'bg-yellow-100 text-yellow-800 border border-yellow-200',
        completed: 'bg-green-100 text-green-800 border border-green-200',
        cancelled: 'bg-red-100 text-red-800 border border-red-200',
        in_transit: 'bg-blue-100 text-blue-800 border border-blue-200',
        delivered: 'bg-emerald-100 text-emerald-800 border border-emerald-200',
        active: 'bg-blue-100 text-blue-800 border border-blue-200',
        inactive: 'bg-gray-100 text-gray-800 border border-gray-200'
    };

    // Calculate truck rate
    const calculateTruckRate = (booking) => {
        if (!booking.truckFreight || !booking.weight || parseFloat(booking.weight) === 0) {
            return 0;
        }
        return parseFloat(booking.truckFreight) / parseFloat(booking.weight);
    };

    // Calculate totals
    const calculateTotals = () => {
        const totals = {
            partyFreight: 0,
            truckFreight: 0,
            difference: 0,
            commission: 0,
            grandtotal: 0
        };

        bookings.forEach(booking => {
            totals.partyFreight += parseFloat(booking.partyFreight || 0);
            totals.truckFreight += parseFloat(booking.truckFreight || 0);
            totals.difference += parseFloat(booking.differenceAmount || 0);
            totals.commission += calculateTotalCommission(booking.commissions);
            totals.grandtotal += parseFloat(booking.differenceAmount || 0) + calculateTotalCommission(booking.commissions);
        });

        return totals;
    };

    const totals = calculateTotals();

    // Responsive column configuration
    const columns = [
        {
            key: 'id',
            title: 'Booking ID',
            render: (booking) => (
                <span className="font-semibold text-gray-800">#{booking.id}</span>
            ),
            className: 'min-w-[80px] max-w-[100px] whitespace-nowrap'
        },
        {
            key: 'date',
            title: 'Date',
            render: (booking) => (
                <div className="text-sm font-medium text-gray-700">
                    {booking.date ? moment(booking.date).format('DD/MM/YY') : '-'}
                </div>
            ),
            className: 'min-w-[80px] max-w-[100px] whitespace-nowrap'
        },
        {
            key: 'party',
            title: 'Party',
            render: (booking) => (
                <div className="min-w-37.5 max-w-50">
                    <div className="font-medium text-gray-900 truncate" title={booking.party?.partyName || '-'}>
                        {booking.party?.partyName || '-'}
                    </div>
                    <div className="text-xs text-gray-500 flex items-center gap-1 truncate">
                        <PhoneIcon className="w-3 h-3 shrink-0" />
                        <span className="truncate">{booking.party?.partyPhone || '-'}</span>
                    </div>
                </div>
            ),
            className: 'min-w-[150px] max-w-[200px]'
        },
        {
            key: 'truckDriver',
            title: 'Truck & Driver',
            render: (booking) => (
                <div className="min-w-37.5 max-w-50">
                    <div className="font-medium text-gray-900 truncate" title={booking.truck?.truckNo || '-'}>
                        {booking.truck?.truckNo || '-'}
                    </div>
                    <div className="text-xs text-gray-500 truncate">{booking.truck?.driverName || '-'}</div>
                    <div className="text-xs text-gray-500 flex items-center gap-1 truncate">
                        <PhoneIcon className="w-3 h-3 shrink-0" />
                        <span className="truncate">{booking.truck?.driverPhone || '-'}</span>
                    </div>
                </div>
            ),
            className: 'min-w-[150px] max-w-[200px]'
        },
        {
            key: 'route',
            title: 'From - To',
            render: (booking) => (
                <div className="min-w-30 max-w-45">
                    <div className="text-sm text-gray-700 truncate" title={`${booking.fromLocation || '-'} → ${booking.toLocation || '-'}`}>
                        {booking.fromLocation || '-'} → {booking.toLocation || '-'}
                    </div>
                </div>
            ),
            className: 'min-w-[120px] max-w-[180px]'
        },
        {
            key: 'commodity',
            title: 'Commodity',
            render: (booking) => (
                <div className="min-w-20 max-w-30">
                    <span className="text-sm text-gray-700 truncate block" title={booking.commodity || '-'}>
                        {booking.commodity || '-'}
                    </span>
                </div>
            ),
            className: 'min-w-[80px] max-w-[120px]'
        },
        {
            key: 'weight',
            title: 'Weight',
            render: (booking) => (
                <div className="min-w-20 max-w-25">
                    <span className="text-sm font-medium text-gray-800">
                        {booking.weight || 0} {booking.weightType || ''}
                    </span>
                </div>
            ),
            className: 'min-w-[80px] max-w-[100px] whitespace-nowrap'
        },
        {
            key: 'rates',
            title: 'Rates',
            render: (booking) => (
                <div className="min-w-30 max-w-37.5 text-sm space-y-1">
                    <div className="flex items-center gap-1 text-blue-600 truncate">
                        <CurrencyDollarIcon className="w-3 h-3 shrink-0" />
                        <span className="truncate">P: ₹{booking.rate ? parseFloat(booking.rate).toLocaleString('en-IN') : '0'}</span>
                    </div>
                    <div className="flex items-center gap-1 text-green-600 truncate">
                        <CurrencyDollarIcon className="w-3 h-3 shrink-0" />
                        <span className="truncate">T: ₹{calculateTruckRate(booking).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                    </div>
                </div>
            ),
            className: 'min-w-[120px] max-w-[150px]'
        },
        {
            key: 'freight',
            title: 'Freight',
            render: (booking) => (
                <div className="min-w-30 max-w-37.5 space-y-1">
                    <div className="text-sm text-blue-600 truncate">
                        P: ₹{parseFloat(booking.partyFreight || 0).toLocaleString('en-IN')}
                    </div>
                    <div className="text-sm text-green-600 truncate">
                        T: ₹{parseFloat(booking.truckFreight || 0).toLocaleString('en-IN')}
                    </div>
                </div>
            ),
            className: 'min-w-[120px] max-w-[150px]'
        },
        {
            key: 'differenceAmount',
            title: 'Difference',
            render: (booking) => {
                const numAmount = parseFloat(booking.differenceAmount || 0);
                return (
                    <div className="min-w-20 max-w-30">
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium whitespace-nowrap ${numAmount >= 0 ? 'bg-green-100 text-green-800 border border-green-200' : 'bg-red-100 text-red-800 border border-red-200'
                            }`}>
                            ₹{numAmount.toLocaleString('en-IN')}
                        </span>
                    </div>
                );
            },
            className: 'min-w-[80px] max-w-[120px] whitespace-nowrap'
        },
        {
            key: 'commission',
            title: 'Commission',
            render: (booking) => {
                const totalCommission = calculateTotalCommission(booking.commissions);
                return (
                    <div className="min-w-20 max-w-30">
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium whitespace-nowrap bg-yellow-100 text-yellow-800 border border-yellow-200">
                            ₹{totalCommission.toLocaleString('en-IN')}
                        </span>
                    </div>
                );
            },
            className: 'min-w-[80px] max-w-[120px] whitespace-nowrap'
        },
        {
            key: 'status',
            title: 'Status',
            render: (booking) => {
                const status = booking.status || 'unknown';
                const formattedStatus = status.charAt(0).toUpperCase() + status.slice(1).replace('_', ' ');
                return (
                    <div className="min-w-20 max-w-30">
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium whitespace-nowrap ${statusColors[status] || 'bg-gray-100 text-gray-800 border border-gray-200'
                            }`}>
                            {formattedStatus}
                        </span>
                    </div>
                );
            },
            className: 'min-w-[80px] max-w-[120px] whitespace-nowrap'
        },
        {
            key: 'actions',
            title: 'Actions',
            render: (booking) => (
                <div className="relative" ref={el => dropdownRefs.current[booking.id] = el}>
                    <button
                        onClick={() => setOpenDropdownId(openDropdownId === booking.id ? null : booking.id)}
                        className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
                        aria-label="Actions"
                    >
                        <EllipsisVerticalIcon className="w-5 h-5 text-gray-600" />
                    </button>

                    {openDropdownId === booking.id && (
                        <div className="absolute right-0 mt-1 w-48 sm:w-56 md:w-64 bg-white rounded-lg shadow-xl z-50 border border-gray-200 overflow-hidden">
                            <div className="py-1 max-h-[calc(100vh-200px)] sm:max-h-96 overflow-y-auto custom-scrollbar">
                                {/* Primary Actions */}
                                <div className="px-2 py-1">
                                    <button
                                        onClick={() => handleEdit(booking)}
                                        className="flex items-center w-full px-3 py-2.5 text-sm text-gray-700 hover:bg-gray-50 rounded-md transition-colors"
                                    >
                                        <PencilIcon className="w-4 h-4 mr-3 text-blue-600 shrink-0" />
                                        <span className="truncate">Edit Booking</span>
                                    </button>
                                    <button
                                        onClick={() => handleChallanInfo(booking.id)}
                                        className="flex items-center w-full px-3 py-2.5 text-sm text-gray-700 hover:bg-gray-50 rounded-md transition-colors"
                                    >
                                        <InformationCircleIcon className="w-4 h-4 mr-3 text-green-600 shrink-0" />
                                        <span className="truncate">Challan Info</span>
                                    </button>
                                    <button
                                        onClick={() => handleBiltyClick(booking)}
                                        className="flex items-center w-full px-3 py-2.5 text-sm text-gray-700 hover:bg-gray-50 rounded-md transition-colors"
                                    >
                                        <DocumentDuplicateIcon className="w-4 h-4 mr-3 text-purple-600 shrink-0" />
                                        <span className="truncate">Create/Edit Bilty</span>
                                    </button>
                                </div>

                                <div className="border-t my-1"></div>

                                {/* PDF Generation Section */}
                                <div className="px-2 py-1">
                                    <div className="px-3 py-1 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                        Generate PDFs
                                    </div>
                                    <button
                                        onClick={() => openSlipPreview(booking, 'difference')}
                                        className="flex items-center w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-md transition-colors"
                                    >
                                        <span className="ml-1 truncate">Difference Slip</span>
                                    </button>
                                    <button
                                        onClick={() => openSlipPreview(booking, 'booking')}
                                        className="flex items-center w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-md transition-colors"
                                    >
                                        <span className="ml-1 truncate">Booking Slip</span>
                                    </button>
                                    <button
                                        onClick={() => openSlipPreview(booking, 'bilty')}
                                        className="flex items-center w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-md transition-colors"
                                    >
                                        <span className="ml-1 truncate">Bilty Slip</span>
                                    </button>
                                </div>

                                <div className="border-t my-1"></div>

                                {/* Delete Action */}
                                <div className="px-2 py-1">
                                    <button
                                        onClick={() => handleDeleteClick(booking.id)}
                                        className="flex items-center w-full px-3 py-2.5 text-sm text-red-600 hover:bg-red-50 rounded-md transition-colors"
                                    >
                                        <TrashIcon className="w-4 h-4 mr-3 shrink-0" />
                                        <span className="truncate">Delete Booking</span>
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            ),
            className: 'min-w-[50px] max-w-[80px] whitespace-nowrap'
        }
    ];

    // Date picker component
    const DateRangePicker = () => (
        <div className="relative" ref={datePickerRef}>
            <button
                onClick={() => setShowDatePicker(!showDatePicker)}
                className="w-full flex items-center justify-between px-3 py-2.5 border border-gray-300 rounded-lg bg-white hover:bg-gray-50 transition-colors focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
                <span className="flex items-center gap-2 text-sm">
                    <CalendarIcon className="w-4 h-4 text-gray-500" />
                    {selectedDates.length === 2
                        ? `${moment(selectedDates[0]).format('DD/MM/YY')} - ${moment(selectedDates[1]).format('DD/MM/YY')}`
                        : 'Select Date Range'
                    }
                </span>
                <ChevronDownIcon className="w-4 h-4 text-gray-500" />
            </button>

            {showDatePicker && (
                <div className="absolute z-50 mt-1 p-4 bg-white border border-gray-300 rounded-lg shadow-xl w-64 sm:w-72">
                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">Start Date</label>
                        <input
                            type="date"
                            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            onChange={(e) => {
                                const start = e.target.value ? new Date(e.target.value) : null;
                                const end = selectedDates[1] || null;
                                if (start) {
                                    handleDateFilter(start, end);
                                }
                            }}
                        />
                    </div>
                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">End Date</label>
                        <input
                            type="date"
                            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            onChange={(e) => {
                                const end = e.target.value ? new Date(e.target.value) : null;
                                const start = selectedDates[0] || null;
                                if (end) {
                                    handleDateFilter(start, end);
                                }
                            }}
                        />
                    </div>
                    <button
                        onClick={() => {
                            setSelectedDates([]);
                            handleDateFilter(null, null);
                        }}
                        className="w-full px-3 py-2 text-sm text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                    >
                        Clear Dates
                    </button>
                </div>
            )}
        </div>
    );

    return (
        <div className="min-h-screen bg-gray-50 p-3 sm:p-4 md:p-6">
            <style>{`
                .custom-scrollbar {
                    scrollbar-width: thin;
                    scrollbar-color: #cbd5e0 #f7fafc;
                }
                
                .custom-scrollbar::-webkit-scrollbar {
                    width: 6px;
                }
                
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: #f7fafc;
                    border-radius: 3px;
                }
                
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background-color: #cbd5e0;
                    border-radius: 3px;
                }
                
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background-color: #a0aec0;
                }
            `}</style>

            <div className="max-w-full mx-auto">
                {/* Header */}
                <div className="mb-6">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                        <h1 className="text-xl sm:text-2xl font-bold text-gray-800">Bookings List</h1>

                        <div className="flex-1 max-w-md">
                            <div className="relative">
                                <input
                                    type="text"
                                    placeholder="Search by party, truck, driver, phone..."
                                    className="w-full pl-10 pr-4 py-2.5 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    value={searchText}
                                    onChange={(e) => setSearchText(e.target.value)}
                                    onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                                />
                                <button
                                    onClick={handleSearch}
                                    className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                >
                                    <MagnifyingGlassIcon className="w-5 h-5" />
                                </button>
                            </div>
                        </div>

                        <div className="flex gap-2 sm:gap-3">
                            <button
                                onClick={() => {
                                    setEditingBooking(null);
                                    setShowBookingForm(true);
                                }}
                                className="flex items-center gap-2 px-3 sm:px-4 py-2 text-sm sm:text-base bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors whitespace-nowrap"
                            >
                                <PlusIcon className="w-4 h-4 sm:w-5 sm:h-5" />
                                <span className="hidden sm:inline">Create Booking</span>
                                <span className="sm:hidden">Create</span>
                            </button>
                            <button
                                onClick={handleExport}
                                disabled={bookings.length === 0}
                                className={`flex items-center gap-2 px-3 sm:px-4 py-2 text-sm sm:text-base rounded-lg transition-colors whitespace-nowrap ${bookings.length === 0
                                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                    : 'bg-gray-600 text-white hover:bg-gray-700'
                                    }`}
                            >
                                <ArrowDownTrayIcon className="w-4 h-4 sm:w-5 sm:h-5" />
                                <span className="hidden sm:inline">Export</span>
                                <span className="sm:hidden">Export</span>
                            </button>
                        </div>
                    </div>

                    {/* Filters */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
                        <select
                            value={selectedStatus}
                            onChange={(e) => handleStatusFilter(e.target.value)}
                            className="px-3 py-2.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        >
                            <option value="all">All Status</option>
                            <option value="pending">Pending</option>
                            <option value="completed">Completed</option>
                            <option value="cancelled">Cancelled</option>
                            <option value="in_transit">In Transit</option>
                            <option value="delivered">Delivered</option>
                        </select>

                        <DateRangePicker />

                        <select className="px-3 py-2.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                            <option value="">Booking Type</option>
                            <option value="normal">Normal</option>
                            <option value="express">Express</option>
                        </select>

                        <button
                            onClick={() => {
                                setSelectedStatus('all');
                                setSelectedDates([]);
                                setSearchText('');
                                fetchBookings(1, pagination.pageSize);
                            }}
                            className="flex items-center justify-center gap-2 px-3 py-2.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                        >
                            <FunnelIcon className="w-4 h-4" />
                            Clear Filters
                        </button>
                    </div>

                    {/* Summary Cards */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
                        {[
                            { label: 'Total Bookings', value: pagination.total, color: 'text-gray-800' },
                            { label: 'Party Freight', value: `₹${totals.partyFreight.toLocaleString('en-IN')}`, color: 'text-blue-600' },
                            { label: 'Truck Freight', value: `₹${totals.truckFreight.toLocaleString('en-IN')}`, color: 'text-green-600' },
                            { label: 'Difference', value: `₹${totals.difference.toLocaleString('en-IN')}`, color: 'text-orange-600' },
                            { label: 'Commission', value: `₹${totals.commission.toLocaleString('en-IN')}`, color: 'text-yellow-600' },
                            { label: 'Total Profit', value: `₹${totals.grandtotal.toLocaleString('en-IN')}`, color: 'text-emerald-600' }
                        ].map((item, index) => (
                            <div key={index} className="bg-white p-3 sm:p-4 rounded-lg shadow border border-gray-100">
                                <div className="text-xs sm:text-sm text-gray-600 truncate">{item.label}</div>
                                <div className={`text-lg sm:text-xl font-bold truncate ${item.color}`}>
                                    {item.value}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Bookings Table */}
                <div className="bg-white rounded-lg shadow border border-gray-200">
                    <div className="overflow-x-auto">
                        <table className=" min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    {columns.map((column) => (
                                        <th
                                            key={column.key}
                                            className={`px-2 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap ${column.className || ''}`}
                                        >
                                            {column.title}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {loading ? (
                                    <tr>
                                        <td colSpan={columns.length} className="px-6 py-12 text-center">
                                            <div className="flex flex-col items-center justify-center gap-3">
                                                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
                                                <p className="text-sm text-gray-600">Loading bookings...</p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : bookings.length === 0 ? (
                                    <tr>
                                        <td colSpan={columns.length} className="px-6 py-12 text-center">
                                            <div className="flex flex-col items-center justify-center gap-3">
                                                <div className="text-gray-400">
                                                    <MagnifyingGlassIcon className="w-12 h-12" />
                                                </div>
                                                <p className="text-gray-500">No bookings found</p>
                                                <p className="text-sm text-gray-400">Try changing your filters or search terms</p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    bookings.map((booking) => (
                                        <tr key={booking.id} className="hover:bg-gray-50 transition-colors">
                                            {columns.map((column) => (
                                                <td
                                                    key={column.key}
                                                    className={`px-4 py-3 ${column.className || ''}`}
                                                >
                                                    <div className="min-w-0">
                                                        {column.render(booking)}
                                                    </div>
                                                </td>
                                            ))}
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    <div className="px-4 py-3 border-t border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-3">
                        <div className="text-xs sm:text-sm text-gray-700">
                            Showing {((pagination.current - 1) * pagination.pageSize) + 1} to{' '}
                            {Math.min(pagination.current * pagination.pageSize, pagination.total)} of{' '}
                            {pagination.total} bookings
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="flex items-center gap-1">
                                <button
                                    onClick={() => handleTableChange(pagination.current - 1, pagination.pageSize)}
                                    disabled={pagination.current === 1}
                                    className={`p-1.5 rounded-lg transition-colors ${pagination.current === 1
                                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                        }`}
                                    aria-label="Previous page"
                                >
                                    <ChevronLeftIcon className="w-4 h-4" />
                                </button>

                                <span className="px-3 py-1 text-sm bg-gray-100 rounded-lg">
                                    Page {pagination.current}
                                </span>

                                <button
                                    onClick={() => handleTableChange(pagination.current + 1, pagination.pageSize)}
                                    disabled={pagination.current * pagination.pageSize >= pagination.total}
                                    className={`p-1.5 rounded-lg transition-colors ${pagination.current * pagination.pageSize >= pagination.total
                                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                        }`}
                                    aria-label="Next page"
                                >
                                    <ChevronRightIcon className="w-4 h-4" />
                                </button>
                            </div>

                            <select
                                value={pagination.pageSize}
                                onChange={(e) => handleTableChange(1, parseInt(e.target.value))}
                                className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            >
                                <option value="10">10 / page</option>
                                <option value="20">20 / page</option>
                                <option value="50">50 / page</option>
                                <option value="100">100 / page</option>
                            </select>
                        </div>
                    </div>
                </div>
            </div>

            {/* Slip Preview Modal */}
            {slipPreviewVisible && previewBooking && (
                <div className="fixed inset-0 backdrop-blur flex items-center justify-center z-2000 p-3 sm:p-4">
                    <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between p-4 sm:p-6 border-b sticky top-0 bg-white z-10">
                            <h3 className="text-lg font-semibold text-gray-800">
                                {previewSlipType.charAt(0).toUpperCase() + previewSlipType.slice(1)} Slip Preview
                            </h3>
                            <button
                                onClick={() => setSlipPreviewVisible(false)}
                                className="text-gray-400 hover:text-gray-600 transition-colors p-1"
                            >
                                <XMarkIcon className="w-6 h-6" />
                            </button>
                        </div>

                        <div className="p-4 sm:p-6">
                            <div className="space-y-4">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <div className="text-sm text-gray-600">Booking ID</div>
                                        <div className="font-medium">{previewBooking.id}</div>
                                    </div>
                                    <div>
                                        <div className="text-sm text-gray-600">Date</div>
                                        <div className="font-medium">
                                            {moment(previewBooking.date).format('DD/MM/YYYY')}
                                        </div>
                                    </div>
                                </div>

                                <div className="border-t pt-4">
                                    {previewSlipType === 'difference' && (
                                        <>
                                            <h4 className="text-lg font-medium text-orange-600 mb-4">Difference Slip Details</h4>
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                <div>
                                                    <div className="text-sm text-gray-600">Party Name</div>
                                                    <div className="font-medium">{previewBooking.party?.partyName || '-'}</div>
                                                </div>
                                                <div>
                                                    <div className="text-sm text-gray-600">Party Freight</div>
                                                    <div className="font-medium text-blue-600">
                                                        ₹{parseFloat(previewBooking.partyFreight || 0).toLocaleString('en-IN')}
                                                    </div>
                                                </div>
                                                <div>
                                                    <div className="text-sm text-gray-600">Truck No</div>
                                                    <div className="font-medium">{previewBooking.truck?.truckNo || '-'}</div>
                                                </div>
                                                <div>
                                                    <div className="text-sm text-gray-600">Truck Freight</div>
                                                    <div className="font-medium text-green-600">
                                                        ₹{parseFloat(previewBooking.truckFreight || 0).toLocaleString('en-IN')}
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="mt-4">
                                                <div className="text-sm text-gray-600">Difference Amount</div>
                                                <div className={`inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium ${parseFloat(previewBooking.differenceAmount || 0) >= 0
                                                    ? 'bg-green-100 text-green-800 border border-green-200'
                                                    : 'bg-red-100 text-red-800 border border-red-200'
                                                    }`}>
                                                    ₹{parseFloat(previewBooking.differenceAmount || 0).toLocaleString('en-IN')}
                                                </div>
                                            </div>

                                            {previewBooking.commissions?.length > 0 && (
                                                <div className="mt-6 border-t pt-4">
                                                    <div className="text-sm font-medium text-gray-700 mb-2">Commissions</div>
                                                    <ul className="space-y-2">
                                                        {previewBooking.commissions.map((comm, idx) => (
                                                            <li key={idx} className="flex justify-between items-center py-1">
                                                                <span className="text-sm">{comm.name || 'Commission'}</span>
                                                                <span className="font-medium">₹{parseFloat(comm.amount || 0).toLocaleString('en-IN')}</span>
                                                            </li>
                                                        ))}
                                                    </ul>
                                                </div>
                                            )}
                                        </>
                                    )}

                                    {previewSlipType === 'booking' && (
                                        <>
                                            <h4 className="text-lg font-medium text-blue-600 mb-4">Booking Slip Details</h4>
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                <div>
                                                    <div className="text-sm text-gray-600">Party</div>
                                                    <div className="font-medium">
                                                        {previewBooking.party?.partyName} ({previewBooking.party?.partyPhone})
                                                    </div>
                                                </div>
                                                <div>
                                                    <div className="text-sm text-gray-600">Truck & Driver</div>
                                                    <div className="font-medium">
                                                        {previewBooking.truck?.truckNo} — {previewBooking.truck?.driverName}
                                                    </div>
                                                </div>
                                                <div>
                                                    <div className="text-sm text-gray-600">Route</div>
                                                    <div className="font-medium">
                                                        {previewBooking.fromLocation} → {previewBooking.toLocation}
                                                    </div>
                                                </div>
                                                <div>
                                                    <div className="text-sm text-gray-600">Commodity</div>
                                                    <div className="font-medium">{previewBooking.commodity || '-'}</div>
                                                </div>
                                                <div>
                                                    <div className="text-sm text-gray-600">Weight</div>
                                                    <div className="font-medium">
                                                        {previewBooking.weight} {previewBooking.weightType}
                                                    </div>
                                                </div>
                                                <div>
                                                    <div className="text-sm text-gray-600">Party Rate</div>
                                                    <div className="font-medium">
                                                        ₹{parseFloat(previewBooking.rate || 0).toLocaleString('en-IN')}
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                                                <div className="text-sm text-gray-600">Total Party Freight</div>
                                                <div className="text-xl font-bold text-blue-700">
                                                    ₹{parseFloat(previewBooking.partyFreight || 0).toLocaleString('en-IN')}
                                                </div>
                                            </div>
                                        </>
                                    )}

                                    {previewSlipType === 'bilty' && (
                                        <>
                                            <h4 className="text-lg font-medium text-green-600 mb-4">Bilty Slip Details</h4>
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                <div>
                                                    <div className="text-sm text-gray-600">Consignor / Party</div>
                                                    <div className="font-medium">{previewBooking.party?.partyName || '-'}</div>
                                                </div>
                                                <div>
                                                    <div className="text-sm text-gray-600">Truck No</div>
                                                    <div className="font-medium">{previewBooking.truck?.truckNo || '-'}</div>
                                                </div>
                                                <div>
                                                    <div className="text-sm text-gray-600">Driver</div>
                                                    <div className="font-medium">
                                                        {previewBooking.truck?.driverName || '-'} ({previewBooking.truck?.driverPhone || '-'})
                                                    </div>
                                                </div>
                                                <div className="col-span-1 sm:col-span-2">
                                                    <div className="text-sm text-gray-600">Route</div>
                                                    <div className="font-medium">
                                                        {previewBooking.fromLocation || '-'} → {previewBooking.toLocation || '-'}
                                                    </div>
                                                </div>
                                                <div>
                                                    <div className="text-sm text-gray-600">Commodity</div>
                                                    <div className="font-medium">{previewBooking.commodity || '-'}</div>
                                                </div>
                                                <div>
                                                    <div className="text-sm text-gray-600">Weight / Type</div>
                                                    <div className="font-medium">
                                                        {previewBooking.weight} {previewBooking.weightType}
                                                    </div>
                                                </div>
                                            </div>
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="border-t p-4 sm:p-6 flex flex-col sm:flex-row justify-end gap-3 sticky bottom-0 bg-white">
                            <button
                                onClick={() => setSlipPreviewVisible(false)}
                                className="px-4 py-2.5 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                            >
                                Close
                            </button>
                            <button
                                onClick={() => {
                                    if (previewBooking && previewSlipType) {
                                        downloadPDF(previewSlipType, previewBooking.id);
                                    }
                                }}
                                className="flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                            >
                                <ArrowDownTrayIcon className="w-5 h-5" />
                                Download PDF
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {deleteModalVisible && (
                <div className="fixed inset-0 backdrop-blur flex items-center justify-center z-2000 p-4">
                    <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
                        <div className="p-6">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="p-2 bg-red-100 rounded-full">
                                    <ExclamationTriangleIcon className="w-6 h-6 text-red-600" />
                                </div>
                                <h3 className="text-lg font-semibold text-gray-900">Delete Booking</h3>
                            </div>
                            <p className="text-gray-600 mb-6">
                                Are you sure you want to delete this booking? This action cannot be undone.
                            </p>
                            <div className="flex justify-end gap-3">
                                <button
                                    onClick={() => {
                                        setDeleteModalVisible(false);
                                        setBookingToDelete(null);
                                    }}
                                    className="px-4 py-2.5 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleDeleteConfirm}
                                    className="px-4 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                                >
                                    Delete
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Booking Form Modal */}
            {showBookingForm && (
                <BookingForm
                    booking={editingBooking}
                    isEditMode={!!editingBooking}
                    onSuccess={handleBookingSuccess}
                    onClose={handleCloseBookingForm}
                />
            )}

            {/* Bilty Form Modal */}
            {biltyFormVisible && (
                <BiltyForm
                    booking={selectedBookingForBilty}
                    visible={biltyFormVisible}
                    onClose={() => setBiltyFormVisible(false)}
                    onSuccess={() => {
                        setBiltyFormVisible(false);
                        toast.info('Bilty saved successfully!');
                        fetchBookings(pagination.current, pagination.pageSize, buildFilters());
                    }}
                />
            )}
        </div>
    );
};

export default BookingsListPage;