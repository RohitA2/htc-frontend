import React, { useState, useEffect } from 'react';
import {
    Table,
    Card,
    Button,
    Row,
    Col,
    Input,
    Space,
    Dropdown,
    Modal,
    message,
    Tag,
    Tooltip,
    Select,
    DatePicker
} from 'antd';
import {
    PlusOutlined,
    SearchOutlined,
    FilterOutlined,
    DownloadOutlined,
    DeleteOutlined,
    MoreOutlined,
    PhoneOutlined,
    MoneyCollectOutlined
} from '@ant-design/icons';
import { SquarePen, BadgeInfo, PencilRuler, PrinterCheck } from 'lucide-react'
import axios from 'axios';
import moment from 'moment';
import BookingForm from './BookingForm';
import BiltyForm from '../bilty/BiltyForm';
import { Divider } from "antd";

const { Search } = Input;
const { Option } = Select;
const { RangePicker } = DatePicker;
const API_URL = import.meta.env.VITE_API_BASE_URL;

const BookingsListPage = () => {
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searchText, setSearchText] = useState('');
    const [selectedStatus, setSelectedStatus] = useState('all');
    const [selectedDates, setSelectedDates] = useState([]);
    const [pagination, setPagination] = useState({
        current: 1,
        pageSize: 10,
        total: 0
    });

    // State to control BookingForm visibility and mode
    const [showBookingForm, setShowBookingForm] = useState(false);
    const [editingBooking, setEditingBooking] = useState(null); // Store booking data to edit

    const [slipPreviewVisible, setSlipPreviewVisible] = useState(false);
    const [previewBooking, setPreviewBooking] = useState(null);
    const [previewSlipType, setPreviewSlipType] = useState(null); // 'difference' | 'booking' | 'bilty'

    const [biltyFormVisible, setBiltyFormVisible] = useState(false);
    const [selectedBookingForBilty, setSelectedBookingForBilty] = useState(null);

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
            // console.log('API Call with filters:', config.params); // Debug log
            const response = await axios.get(`${API_URL}/booking/pagination`, config);
            setBookings(response.data.data);
            setPagination({
                current: response.data.pagination.page,
                pageSize: response.data.pagination.limit,
                total: response.data.pagination.total
            });
        } catch (error) {
            message.error(
                error?.response?.data?.message || 'Failed to fetch bookings'
            );
            console.error('Error fetching bookings:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchBookings();
    }, []);

    // Handle table pagination
    const handleTableChange = (pagination) => {
        const filters = buildFilters();
        fetchBookings(pagination.current, pagination.pageSize, filters);
    };

    // Handle search
    const handleSearch = (value) => {
        setSearchText(value);
        const filters = buildFilters();
        if (value) {
            filters.search = value;
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

    // Handle date filter - FIXED VERSION
    const handleDateFilter = (dates, dateStrings) => {
        console.log('Date picker dates:', dates); // moment objects
        console.log('Date picker strings:', dateStrings); // formatted strings

        setSelectedDates(dates);

        const filters = buildFilters();

        if (dates && dates.length === 2) {
            // Use the dateStrings which contain the selected dates
            filters.fromDate = dateStrings[0] || null;
            filters.toDate = dateStrings[1] || null;

            // Alternative: Use moment objects
            // filters.fromDate = dates[0] ? dates[0].format('YYYY-MM-DD') : null;
            // filters.toDate = dates[1] ? dates[1].format('YYYY-MM-DD') : null;
        } else {
            delete filters.fromDate;
            delete filters.toDate;
        }

        console.log('Filters after date selection:', filters); // Debug
        fetchBookings(1, pagination.pageSize, filters);
    };

    // Calculate total commission from commissions array
    const calculateTotalCommission = (commissions) => {
        if (!commissions || !Array.isArray(commissions)) return 0;
        return commissions.reduce((sum, commission) => {
            return sum + parseFloat(commission.amount || 0);
        }, 0);
    };

    // Export functionality
    const handleExport = () => {
        if (bookings.length === 0) {
            message.warning('No data to export');
            return;
        }

        // Prepare data for export
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

        // Convert to CSV
        const csvContent = convertToCSV(exportData);
        downloadCSV(csvContent, `bookings_export_${moment().format('YYYYMMDD_HHmmss')}.csv`);
        message.success('Data exported successfully');
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

    // PDF Generation functions
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

            message.success(`Downloading ${slipType} slip...`);
        } catch (error) {
            console.error('PDF download failed:', error);
            message.error('Failed to download PDF');
        }
    };

    const openSlipPreview = (record, slipType) => {
        setPreviewBooking(record);
        setPreviewSlipType(slipType);
        setSlipPreviewVisible(true);
    };

    // Action handlers
    const handleEdit = (booking) => {
        // Set the booking data for editing
        setEditingBooking(booking);
        setShowBookingForm(true);
    };

    const handleDelete = async (bookingId) => {
        Modal.confirm({
            title: 'Delete Booking',
            content: 'Are you sure you want to delete this booking? This action cannot be undone.',
            okText: 'Delete',
            okType: 'danger',
            cancelText: 'Cancel',
            onOk: async () => {
                try {
                    const token = localStorage.getItem('token');
                    await axios.delete(`${API_URL}/booking/${bookingId}`, {
                        headers: {
                            'Authorization': `Bearer ${token}`
                        }
                    });
                    message.success('Booking deleted successfully');
                    fetchBookings(pagination.current, pagination.pageSize, buildFilters());
                } catch (error) {
                    message.error('Failed to delete booking');
                    console.error('Error deleting booking:', error);
                }
            }
        });
    };

    const handleChallanInfo = (bookingId) => {
        window.location.href = `/bookings/challan/${bookingId}`;
    };

    // Close booking form
    const handleCloseBookingForm = () => {
        setShowBookingForm(false);
        setEditingBooking(null);
    };

    // Handle success after creating/updating booking
    const handleBookingSuccess = () => {
        setShowBookingForm(false);
        setEditingBooking(null);
        fetchBookings(pagination.current, pagination.pageSize, buildFilters());
        message.success(editingBooking ? 'Booking updated successfully!' : 'Booking Dispatched successfully!');
    };

    // Handle Bilty click
    const handleBiltyClick = (record) => {
        setSelectedBookingForBilty(record);
        setBiltyFormVisible(true);
    };

    // Status tag color mapping
    const statusColors = {
        pending: 'warning',
        completed: 'success',
        cancelled: 'error',
        in_transit: 'processing',
        delivered: 'green',
        active: 'blue',
        inactive: 'default'
    };

    // Action menu items for Dropdown
    const getActionMenuItems = (record) => [
        {
            key: 'edit',
            icon: <SquarePen className="w-4 h-4 mr-2 text-blue-600" />,
            label: 'Edit Booking',
            onClick: () => handleEdit(record)
        },
        {
            key: 'challan',
            icon: <BadgeInfo className="w-4 h-4 mr-2 text-green-600" />,
            label: 'Challan Info',
            onClick: () => handleChallanInfo(record.id)
        },
        {
            key: 'bilty-form',
            icon: <PencilRuler className="w-4 h-4 mr-2 text-purple-600" />,
            label: 'Create/Edit Bilty',
            onClick: () => handleBiltyClick(record)
        },
        {
            key: 'divider1',
            type: 'divider',
        },
        {
            key: 'pdfs',
            icon: <PrinterCheck className="w-4 h-4 mr-2 text-yellow-600" />,
            label: 'Generate PDFs',
            children: [
                {
                    key: 'difference',
                    label: 'Difference Slip',
                    onClick: () => openSlipPreview(record, 'difference')
                },
                {
                    key: 'booking',
                    label: 'Booking Slip',
                    onClick: () => openSlipPreview(record, 'booking')
                },
                {
                    key: 'bilty',
                    label: 'Bilty Slip',
                    onClick: () => openSlipPreview(record, 'bilty')
                }
            ]
        },
        {
            key: 'divider2',
            type: 'divider',
        },
        {
            key: 'delete',
            icon: <DeleteOutlined />,
            label: 'Delete',
            danger: true,
            onClick: () => handleDelete(record.id)
        }
    ];

    // Calculate truck rate (per weight unit)
    const calculateTruckRate = (booking) => {
        if (!booking.truckFreight || !booking.weight || parseFloat(booking.weight) === 0) {
            return 0;
        }
        return parseFloat(booking.truckFreight) / parseFloat(booking.weight);
    };

    // Table columns
    const columns = [
        {
            title: 'Booking ID',
            dataIndex: 'id',
            key: 'id',
            width: 100,
            sorter: (a, b) => a.id - b.id,
        },
        {
            title: 'Date',
            dataIndex: 'date',
            key: 'date',
            width: 120,
            render: (date) => date ? moment(date).format('DD/MM/YY') : '-',
            sorter: (a, b) => moment(a.date || 0).unix() - moment(b.date || 0).unix(),
        },
        {
            title: 'Party',
            dataIndex: 'party',
            key: 'partyName',
            width: 150,
            render: (party) => (
                <div>
                    <div>{party?.partyName || '-'}</div>
                    <div style={{ fontSize: '12px', color: '#666' }}>
                        <PhoneOutlined /> {party?.partyPhone || '-'}
                    </div>
                </div>
            ),
        },
        {
            title: 'Truck & Driver',
            key: 'truckDriver',
            width: 180,
            render: (_, record) => (
                <div>
                    <div>
                        <strong>{record.truck?.truckNo || '-'}</strong>
                    </div>
                    <div style={{ fontSize: '12px', color: '#666' }}>
                        {record.truck?.driverName || '-'}
                    </div>
                    <div style={{ fontSize: '12px', color: '#666' }}>
                        <PhoneOutlined /> {record.truck?.driverPhone || '-'}
                    </div>
                </div>
            ),
        },
        {
            title: 'From - To',
            key: 'route',
            width: 150,
            render: (_, record) => (
                <Tooltip title={`${record.fromLocation || ''} → ${record.toLocation || ''}`}>
                    <span>{record.fromLocation || '-'} → {record.toLocation || '-'}</span>
                </Tooltip>
            ),
        },
        {
            title: 'Commodity',
            dataIndex: 'commodity',
            key: 'commodity',
            width: 120,
            render: (text) => text || '-'
        },
        {
            title: 'Weight',
            key: 'weight',
            width: 100,
            render: (_, record) => `${record.weight || 0} ${record.weightType || ''}`,
        },
        {
            title: 'Rates',
            key: 'rates',
            width: 140,
            render: (_, record) => (
                <div style={{ fontSize: '12px' }}>
                    <div>
                        <MoneyCollectOutlined style={{ color: '#1890ff', marginRight: 4 }} />
                        Party: ₹{record.rate ? parseFloat(record.rate).toLocaleString('en-IN') : '0'}
                    </div>
                    <div>
                        <MoneyCollectOutlined style={{ color: '#52c41a', marginRight: 4 }} />
                        Truck: ₹{calculateTruckRate(record).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </div>
                </div>
            ),
        },
        {
            title: 'Freight',
            key: 'freight',
            width: 150,
            render: (_, record) => (
                <div>
                    <div style={{ color: '#1890ff' }}>
                        Party: ₹{parseFloat(record.partyFreight || 0).toLocaleString('en-IN')}
                    </div>
                    <div style={{ color: '#52c41a' }}>
                        Truck: ₹{parseFloat(record.truckFreight || 0).toLocaleString('en-IN')}
                    </div>
                </div>
            ),
        },
        {
            title: 'Difference',
            dataIndex: 'differenceAmount',
            key: 'differenceAmount',
            width: 120,
            render: (amount) => {
                const numAmount = parseFloat(amount || 0);
                return (
                    <Tag color={numAmount >= 0 ? 'green' : 'red'}>
                        ₹{numAmount.toLocaleString('en-IN')}
                    </Tag>
                );
            },
        },
        {
            title: 'Commission',
            key: 'commission',
            width: 120,
            render: (_, record) => {
                const totalCommission = calculateTotalCommission(record.commissions);
                return (
                    <Tag color={totalCommission >= 0 ? 'gold' : 'red'}>
                        ₹{totalCommission.toLocaleString('en-IN')}
                    </Tag>
                );
            },
        },
        {
            title: 'Status',
            dataIndex: 'status',
            key: 'status',
            width: 120,
            render: (status) => {
                const formattedStatus = status ? status.charAt(0).toUpperCase() + status.slice(1) : 'Unknown';
                return (
                    <Tag color={statusColors[status] || 'default'}>
                        {formattedStatus}
                    </Tag>
                );
            },
            filters: [
                { text: 'Pending', value: 'pending' },
                { text: 'Completed', value: 'completed' },
                { text: 'Cancelled', value: 'cancelled' },
                { text: 'In Transit', value: 'in_transit' },
                { text: 'Delivered', value: 'delivered' },
            ],
            onFilter: (value, record) => record.status === value,
        },
        {
            title: 'Actions',
            key: 'actions',
            width: 100,
            fixed: 'right',
            render: (_, record) => (
                <Dropdown
                    menu={{
                        items: getActionMenuItems(record)
                    }}
                    trigger={['click']}
                >
                    <Button type="text" icon={<MoreOutlined />} />
                </Dropdown>
            ),
        },
    ];

    // Calculate totals for all displayed bookings
    const calculateTotals = () => {
        const totals = {
            partyFreight: 0,
            truckFreight: 0,
            difference: 0,
            commission: 0
        };

        bookings.forEach(booking => {
            totals.partyFreight += parseFloat(booking.partyFreight || 0);
            totals.truckFreight += parseFloat(booking.truckFreight || 0);
            totals.difference += parseFloat(booking.differenceAmount || 0);
            totals.commission += calculateTotalCommission(booking.commissions);
        });

        return totals;
    };

    const totals = calculateTotals();

    return (
        <div style={{ padding: '2px', backgroundColor: '#f0f2f5', minHeight: '100vh' }}>
            <Card>
                <Row gutter={[16, 16]} style={{ marginBottom: 24 }} align="middle">
                    <Col xs={24} sm={12} md={8}>
                        <h2 style={{ margin: 0 }}>Bookings List</h2>
                    </Col>
                    <Col xs={24} sm={12} md={8}>
                        <Search
                            placeholder="Search by party, truck, driver, phone..."
                            allowClear
                            enterButton={<SearchOutlined />}
                            size="large"
                            onSearch={handleSearch}
                            onChange={(e) => setSearchText(e.target.value)}
                            value={searchText}
                            style={{ width: '100%' }}
                        />
                    </Col>
                    <Col xs={24} sm={24} md={8} style={{ textAlign: 'right' }}>
                        <Space>
                            <Button
                                type="primary"
                                icon={<PlusOutlined />}
                                onClick={() => {
                                    setEditingBooking(null);
                                    setShowBookingForm(true);
                                }}
                                size="large"
                            >
                                Create Booking
                            </Button>
                            <Button
                                icon={<DownloadOutlined />}
                                onClick={handleExport}
                                size="large"
                                disabled={bookings.length === 0}
                            >
                                Export
                            </Button>
                        </Space>
                    </Col>
                </Row>

                {/* Filters Row */}
                <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
                    <Col xs={24} sm={12} md={6}>
                        <Select
                            placeholder="Filter by Status"
                            style={{ width: '100%' }}
                            value={selectedStatus}
                            onChange={handleStatusFilter}
                            allowClear
                        >
                            <Option value="all">All Status</Option>
                            <Option value="pending">Pending</Option>
                            <Option value="completed">Completed</Option>
                            <Option value="cancelled">Cancelled</Option>
                            <Option value="in_transit">In Transit</Option>
                            <Option value="delivered">Delivered</Option>
                        </Select>
                    </Col>
                    <Col xs={24} sm={12} md={6}>
                        <RangePicker
                            style={{ width: '100%' }}
                            onChange={handleDateFilter}
                            format="DD/MM/YYYY"
                            placeholder={['Start Date', 'End Date']}
                            value={selectedDates}
                        />
                    </Col>
                    <Col xs={24} sm={12} md={6}>
                        <Select
                            placeholder="Filter by Booking Type"
                            style={{ width: '100%' }}
                            allowClear
                        >
                            <Option value="normal">Normal</Option>
                            <Option value="express">Express</Option>
                        </Select>
                    </Col>
                    <Col xs={24} sm={12} md={6}>
                        <Button
                            icon={<FilterOutlined />}
                            onClick={() => {
                                setSelectedStatus('all');
                                setSelectedDates([]);
                                setSearchText('');
                                fetchBookings(1, pagination.pageSize);
                            }}
                            style={{ width: '100%' }}
                        >
                            Clear Filters
                        </Button>
                    </Col>
                </Row>

                {/* Summary Stats */}
                <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
                    <Col xs={12} sm={6} md={4}>
                        <Card size="small">
                            <div style={{ fontSize: '12px', color: '#666' }}>Total Bookings</div>
                            <div style={{ fontSize: '24px', fontWeight: 'bold' }}>{pagination.total}</div>
                        </Card>
                    </Col>
                    <Col xs={12} sm={6} md={5}>
                        <Card size="small">
                            <div style={{ fontSize: '12px', color: '#666' }}>Total Party Freight</div>
                            <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#1890ff' }}>
                                ₹{totals.partyFreight.toLocaleString('en-IN')}
                            </div>
                        </Card>
                    </Col>
                    <Col xs={12} sm={6} md={5}>
                        <Card size="small">
                            <div style={{ fontSize: '12px', color: '#666' }}>Total Truck Freight</div>
                            <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#52c41a' }}>
                                ₹{totals.truckFreight.toLocaleString('en-IN')}
                            </div>
                        </Card>
                    </Col>
                    <Col xs={12} sm={6} md={5}>
                        <Card size="small">
                            <div style={{ fontSize: '12px', color: '#666' }}>Total Difference</div>
                            <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#fa8c16' }}>
                                ₹{totals.difference.toLocaleString('en-IN')}
                            </div>
                        </Card>
                    </Col>
                    <Col xs={12} sm={6} md={5}>
                        <Card size="small">
                            <div style={{ fontSize: '12px', color: '#666' }}>Total Commission</div>
                            <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#faad14' }}>
                                ₹{totals.commission.toLocaleString('en-IN')}
                            </div>
                        </Card>
                    </Col>
                </Row>

                {/* Bookings Table */}
                <Table
                    columns={columns}
                    dataSource={bookings}
                    rowKey="id"
                    loading={loading}
                    scroll={{ x: "max-content" }}
                    pagination={{
                        ...pagination,
                        showSizeChanger: true,
                        showQuickJumper: true,
                        showTotal: (total, range) =>
                            `${range[0]}-${range[1]} of ${total} bookings`,
                        pageSizeOptions: ['10', '20', '50', '100']
                    }}
                    onChange={handleTableChange}
                    className="min-w-300"
                />
            </Card>

            {/* Render BookingForm when showBookingForm is true */}
            {showBookingForm && (
                <BookingForm
                    booking={editingBooking} // Pass booking data for editing
                    isEditMode={!!editingBooking} // Indicate if it's edit mode
                    onSuccess={handleBookingSuccess}
                    onClose={handleCloseBookingForm}
                />
            )}

            <Modal
                title={
                    previewSlipType
                        ? `${previewSlipType.charAt(0).toUpperCase() + previewSlipType.slice(1)} Slip Preview`
                        : 'Slip Preview'
                }
                open={slipPreviewVisible}
                onCancel={() => setSlipPreviewVisible(false)}
                width={700}
                footer={[
                    <Button key="close" onClick={() => setSlipPreviewVisible(false)}>
                        Close
                    </Button>,
                    <Button
                        key="download"
                        type="primary"
                        icon={<DownloadOutlined />}
                        onClick={() => {
                            if (previewBooking && previewSlipType) {
                                downloadPDF(previewSlipType, previewBooking.id);
                            }
                        }}
                    >
                        Download PDF
                    </Button>,
                ]}
            >
                {previewBooking && previewSlipType && (
                    <div style={{ fontSize: 14, lineHeight: 1.6 }}>
                        {/* Common header info */}
                        <Row gutter={[16, 8]} style={{ marginBottom: 16 }}>
                            <Col span={12}>
                                <strong>Booking ID:</strong> {previewBooking.id}
                            </Col>
                            <Col span={12}>
                                <strong>Date:</strong> {moment(previewBooking.date).format('DD/MM/YYYY')}
                            </Col>
                        </Row>

                        <Divider style={{ margin: '12px 0' }} />

                        {previewSlipType === 'difference' && (
                            <>
                                <h4 style={{ color: '#fa8c16', marginBottom: 12 }}>Difference Slip Details</h4>
                                <Row gutter={[16, 8]}>
                                    <Col span={12}>
                                        <strong>Party Name:</strong> {previewBooking.party?.partyName || '-'}
                                    </Col>
                                    <Col span={12}>
                                        <strong>Party Freight:</strong> ₹
                                        {parseFloat(previewBooking.partyFreight || 0).toLocaleString('en-IN')}
                                    </Col>
                                    <Col span={12}>
                                        <strong>Truck No:</strong> {previewBooking.truck?.truckNo || '-'}
                                    </Col>
                                    <Col span={12}>
                                        <strong>Truck Freight:</strong> ₹
                                        {parseFloat(previewBooking.truckFreight || 0).toLocaleString('en-IN')}
                                    </Col>
                                    <Col span={24}>
                                        <strong>Difference Amount:</strong>{' '}
                                        <Tag color={parseFloat(previewBooking.differenceAmount || 0) >= 0 ? 'green' : 'red'}>
                                            ₹{parseFloat(previewBooking.differenceAmount || 0).toLocaleString('en-IN')}
                                        </Tag>
                                    </Col>
                                </Row>

                                {previewBooking.commissions?.length > 0 && (
                                    <>
                                        <Divider dashed />
                                        <strong>Commissions:</strong>
                                        <ul style={{ margin: '8px 0 0 20px', paddingLeft: 0 }}>
                                            {previewBooking.commissions.map((comm, idx) => (
                                                <li key={idx}>
                                                    {comm.name || 'Commission'} : ₹{parseFloat(comm.amount || 0).toLocaleString('en-IN')}
                                                </li>
                                            ))}
                                        </ul>
                                    </>
                                )}
                            </>
                        )}

                        {previewSlipType === 'booking' && (
                            <>
                                <h4 style={{ color: '#1890ff', marginBottom: 12 }}>Booking Slip Details</h4>
                                <Row gutter={[16, 8]}>
                                    <Col span={12}>
                                        <strong>Party:</strong> {previewBooking.party?.partyName} ({previewBooking.party?.partyPhone})
                                    </Col>
                                    <Col span={12}>
                                        <strong>Truck:</strong> {previewBooking.truck?.truckNo} — {previewBooking.truck?.driverName}
                                    </Col>
                                    <Col span={12}>
                                        <strong>From → To:</strong> {previewBooking.fromLocation} → {previewBooking.toLocation}
                                    </Col>
                                    <Col span={12}>
                                        <strong>Commodity:</strong> {previewBooking.commodity || '-'}
                                    </Col>
                                    <Col span={12}>
                                        <strong>Weight:</strong> {previewBooking.weight} {previewBooking.weightType}
                                    </Col>
                                    <Col span={12}>
                                        <strong>Party Rate:</strong> ₹{parseFloat(previewBooking.rate || 0).toLocaleString('en-IN')}
                                    </Col>
                                    <Col span={24}>
                                        <strong>Total Party Freight:</strong>{' '}
                                        <span style={{ fontWeight: 'bold', color: '#1890ff' }}>
                                            ₹{parseFloat(previewBooking.partyFreight || 0).toLocaleString('en-IN')}
                                        </span>
                                    </Col>
                                </Row>
                            </>
                        )}

                        {previewSlipType === 'bilty' && (
                            <>
                                <h4 style={{ color: '#52c41a', marginBottom: 12 }}>Bilty Slip Details</h4>
                                <Row gutter={[16, 8]}>
                                    <Col span={12}>
                                        <strong>Consignor / Party:</strong> {previewBooking.party?.partyName || '-'}
                                    </Col>
                                    <Col span={12}>
                                        <strong>Truck No:</strong> {previewBooking.truck?.truckNo || '-'}
                                    </Col>
                                    <Col span={12}>
                                        <strong>Driver:</strong> {previewBooking.truck?.driverName || '-'} (
                                        {previewBooking.truck?.driverPhone || '-'})
                                    </Col>
                                    <Col span={24}>
                                        <strong>Route:</strong> {previewBooking.fromLocation || '-'} →{' '}
                                        {previewBooking.toLocation || '-'}
                                    </Col>
                                    <Col span={12}>
                                        <strong>Commodity:</strong> {previewBooking.commodity || '-'}
                                    </Col>
                                    <Col span={12}>
                                        <strong>Weight / Type:</strong> {previewBooking.weight} {previewBooking.weightType}
                                    </Col>
                                    {/* Add more bilty-specific fields if you have them (e.g. invoice no, e-way bill, etc.) */}
                                </Row>
                            </>
                        )}
                    </div>
                )}
            </Modal>

            {/* Bilty Form Modal */}
            <BiltyForm
                booking={selectedBookingForBilty}
                visible={biltyFormVisible}
                onClose={() => setBiltyFormVisible(false)}
                onSuccess={() => {
                    setBiltyFormVisible(false);
                    message.success('Bilty saved successfully!');
                    fetchBookings(pagination.current, pagination.pageSize, buildFilters());
                }}
            />
        </div>
    );
};

export default BookingsListPage;