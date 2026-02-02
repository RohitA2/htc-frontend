import React, { useState, useEffect, useMemo } from 'react';
import {
    Modal,
    Form,
    Input,
    Button,
    Row,
    Col,
    DatePicker,
    InputNumber,
    Select,
    Table,
    message,
    Card,
    Space,
    Typography,
    Divider,
    Tag,
} from 'antd';
import {
    SaveOutlined,
    PrinterOutlined,
    CloseOutlined,
    FileTextOutlined,
    PlusOutlined,
    DeleteOutlined,
    DownloadOutlined,
} from '@ant-design/icons';
import moment from 'moment';
import axios from 'axios';

const { Title, Text } = Typography;
const { Option } = Select;
const API_URL = import.meta.env.VITE_API_BASE_URL;

const BiltyForm = ({ booking, visible, onClose, onSuccess }) => {
    // console.log("i am booking", booking);
    const [form] = Form.useForm();
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [articles, setArticles] = useState([
        {
            key: '1',
            noOfArticles: '1',
            particular: '',
            weightType: 'Ton',
            weight: '',
            rate: '',
            rateType: 'Weight',
            totalFreightAmt: '',
            remarks: '',
        },
        {
            key: 'advance',
            isAdvanceRow: true,
            advancedMode: 'Received',
            advanced: '',
            deduction: '',
            balance: '',
        }
    ]);

    // Form watchers
    const totalFreightAmt = Form.useWatch('totalFreightAmt', form) || 0;
    const advanced = Form.useWatch('advanced', form) || 0;
    const received = Form.useWatch('received', form) || 0;
    const deduction = Form.useWatch('deduction', form) || 0;
    const weight = Form.useWatch('weight', form) || 0;
    const rate = Form.useWatch('rate', form) || 0;

    // Calculate balance
    const balance = useMemo(() => {
        return (Number(totalFreightAmt || 0) - Number(advanced || 0) - Number(received || 0) - Number(deduction || 0)).toFixed(2);
    }, [totalFreightAmt, advanced, received, deduction]);

    // Calculate total freight from weight and rate
    useEffect(() => {
        if (weight && rate) {
            const total = Number(weight) * Number(rate);
            form.setFieldsValue({ totalFreightAmt: total.toFixed(2) });

            // Calculate balance
            const currentBalance = total -
                Number(form.getFieldValue('advanced') || 0) -
                Number(form.getFieldValue('received') || 0) -
                Number(form.getFieldValue('deduction') || 0);

            form.setFieldsValue({ balance: currentBalance.toFixed(2) });
        }
    }, [weight, rate, form]);

    // Calculate initial balance from booking data
    const calculateInitialBalance = () => {
        if (!booking) return 0;

        const totalFreight = parseFloat(booking.partyFreight) || 0;
        let totalAdvance = 0;
        let totalDeduction = 0;

        // Calculate total advance from partyPayments
        if (booking.partyPayments && booking.partyPayments.length > 0) {
            const advancePayments = booking.partyPayments.filter(payment =>
                payment.paymentType === 'advance'
            );
            totalAdvance = advancePayments.reduce((sum, payment) =>
                sum + parseFloat(payment.amount || 0), 0
            );
        }

        // Calculate total deduction from commissions
        if (booking.commissions && booking.commissions.length > 0) {
            totalDeduction = booking.commissions.reduce((sum, commission) =>
                sum + parseFloat(commission.commissionAmount || 0), 0
            );
        }

        return (totalFreight - totalAdvance - totalDeduction).toFixed(2);
    };

    // Load booking data when modal opens
    useEffect(() => {
        if (booking && visible) {
            const loadData = async () => {
                try {
                    const token = localStorage.getItem('token');
                    // Try to fetch existing bilty
                    const res = await axios.get(`${API_URL}/bilty/booking/${booking.id}`, {
                        headers: { Authorization: `Bearer ${token}` },
                    });

                    if (res.data && res.data.id) {
                        // Load existing bilty data
                        const biltyData = res.data;
                        form.setFieldsValue({
                            ...biltyData,
                            bookingSlipDate: moment(),
                            biltyDate: biltyData.biltyDate ? moment(biltyData.biltyDate) : moment(booking.date || Date.now()),
                            bookingSlipNo: booking.id,
                        });

                        if (biltyData.articles && biltyData.articles.length > 0) {
                            setArticles([
                                ...biltyData.articles.map((item, idx) => ({
                                    key: String(idx + 1),
                                    ...item
                                })),
                                {
                                    key: 'advance',
                                    isAdvanceRow: true,
                                    advancedMode: 'Received',
                                    advanced: biltyData.advanced || 0,
                                    deduction: biltyData.deduction || 0,
                                    balance: biltyData.balance || 0,
                                }
                            ]);
                        }
                    } else {
                        // Calculate total advance from partyPayments
                        let totalAdvance = 0;
                        if (booking.partyPayments && booking.partyPayments.length > 0) {
                            const advancePayments = booking.partyPayments.filter(payment =>
                                payment.paymentType === 'advance'
                            );
                            totalAdvance = advancePayments.reduce((sum, payment) =>
                                sum + parseFloat(payment.amount || 0), 0
                            );
                        }

                        // Calculate total deduction from commissions
                        let totalDeduction = 0;
                        if (booking.commissions && booking.commissions.length > 0) {
                            totalDeduction = booking.commissions.reduce((sum, commission) =>
                                sum + parseFloat(commission.commissionAmount || 0), 0
                            );
                        }

                        // Calculate balance
                        const totalFreight = parseFloat(booking.partyFreight) || 0;
                        const calculatedBalance = (totalFreight - totalAdvance - totalDeduction).toFixed(2);

                        // Set default values from booking
                        form.setFieldsValue({
                            bookingSlipDate: moment(),
                            biltyDate: moment(booking.date || Date.now()),
                            bookingSlipNo: booking.id,
                            billyDesignToCompany: booking.company?.companyName || ' ',
                            partyId: booking.party?.id,

                            // Location details
                            fromLocation: booking.fromLocation || '',
                            toLocation: booking.toLocation || '',
                            deliveryAddress: booking.deliveryAddress || booking.party?.partyAddress || '',
                            truckNo: booking.truck?.truckNo || '',

                            // Consignee details
                            consigneeParty: booking.party?.partyName || '',
                            consigneeGST: booking.party?.gstNo || '',
                            consigneeReceiver: booking.party?.partyName || '',
                            consigneeReceiverGST: booking.party?.gstNo || '',

                            // Article details
                            noOfArticles: booking.noOfArticles || '1',
                            particular: booking.commodity || '',
                            weightType: booking.weightType || 'Ton',
                            weight: booking.weight || '',
                            rate: booking.rate || '',
                            rateType: 'Weight',
                            totalFreightAmt: booking.partyFreight || '',
                            remarks: booking.remarks || '',

                            // Payment details
                            advanced: totalAdvance || 0,
                            received: 0,
                            deduction: totalDeduction || 0,
                            balance: calculatedBalance,

                            // Invoice details
                            invoiceNo: booking.invoiceNo || '',
                            partyPhone: booking.party?.partyPhone || '',
                            goodsValue: booking.goodsValue || '',
                            remark: booking.remark || '',
                        });

                        // Set article row
                        setArticles([
                            {
                                key: '1',
                                noOfArticles: booking.noOfArticles || '1',
                                particular: booking.commodity || '',
                                weightType: booking.weightType || 'Ton',
                                weight: booking.weight || '',
                                rate: booking.rate || '',
                                rateType: 'Weight',
                                totalFreightAmt: booking.partyFreight || '',
                                remarks: booking.remarks || '',
                            },
                            {
                                key: 'advance',
                                isAdvanceRow: true,
                                advancedMode: 'Received',
                                advanced: totalAdvance || 0,
                                deduction: totalDeduction || 0,
                                balance: calculatedBalance,
                            }
                        ]);
                    }
                } catch (error) {
                    console.error('Error loading bilty data:', error);
                    // Set basic default values from booking
                    let totalAdvance = 0;
                    let totalDeduction = 0;

                    if (booking.partyPayments) {
                        const advancePayments = booking.partyPayments.filter(p => p.paymentType === 'advance');
                        totalAdvance = advancePayments.reduce((sum, p) => sum + parseFloat(p.amount || 0), 0);
                    }

                    if (booking.commissions) {
                        totalDeduction = booking.commissions.reduce((sum, c) => sum + parseFloat(c.commissionAmount || 0), 0);
                    }

                    const totalFreight = parseFloat(booking.partyFreight) || 0;
                    const balance = (totalFreight - totalAdvance - totalDeduction).toFixed(2);

                    form.setFieldsValue({
                        bookingSlipDate: moment(),
                        biltyDate: moment(booking.date || Date.now()),
                        bookingSlipNo: booking.id,
                        biltyDesignToCompany: booking.company?.companyName || 'STC Transport',
                        fromLocation: booking.fromLocation || '',
                        toLocation: booking.toLocation || '',
                        truckNo: booking.truck?.truckNo || '',
                        weight: booking.weight || '',
                        rate: booking.rate || '',
                        totalFreightAmt: booking.partyFreight || '',
                        advanced: totalAdvance,
                        deduction: totalDeduction,
                        balance: balance,
                    });
                }
            };

            loadData();
        }
    }, [booking, visible, form]);

    // Update balance when advance or deduction changes
    useEffect(() => {
        if (form) {
            const currentTotal = parseFloat(form.getFieldValue('totalFreightAmt') || 0);
            const currentAdvanced = parseFloat(form.getFieldValue('advanced') || 0);
            const currentReceived = parseFloat(form.getFieldValue('received') || 0);
            const currentDeduction = parseFloat(form.getFieldValue('deduction') || 0);

            const currentBalance = (currentTotal - currentAdvanced - currentReceived - currentDeduction).toFixed(2);
            form.setFieldsValue({ balance: currentBalance });

            // Update the balance in articles array
            const newArticles = [...articles];
            const advanceRowIndex = newArticles.findIndex(item => item.isAdvanceRow);
            if (advanceRowIndex !== -1) {
                newArticles[advanceRowIndex].balance = currentBalance;
                setArticles(newArticles);
            }
        }
    }, [form?.getFieldValue('advanced'), form?.getFieldValue('deduction'), form?.getFieldValue('totalFreightAmt')]);

    const columns = [
        {
            title: 'No Of Articles',
            dataIndex: 'noOfArticles',
            width: 120,
            render: (text, record, index) => {
                if (record.isAdvanceRow) {
                    return (
                        <div style={{ fontWeight: 'bold', color: '#1890ff' }}>
                            Advanced Mode
                        </div>
                    );
                }
                return (
                    <Form.Item name="noOfArticles" style={{ margin: 0 }}>
                        <Input
                            style={{ width: '100%' }}
                            value={text}
                            onChange={(e) => {
                                const newArticles = [...articles];
                                newArticles[index].noOfArticles = e.target.value;
                                setArticles(newArticles);
                            }}
                        />
                    </Form.Item>
                );
            },
        },
        {
            title: 'Particular',
            dataIndex: 'particular',
            render: (text, record, index) => {
                if (record.isAdvanceRow) {
                    return (
                        <Form.Item name="advancedMode" style={{ margin: 0 }}>
                            <Select style={{ width: '100%' }} defaultValue="Received">
                                <Option value="Received">Received</Option>
                            </Select>
                        </Form.Item>
                    );
                }
                return (
                    <Form.Item name="particular" style={{ margin: 0 }}>
                        <Input
                            style={{ width: '100%' }}
                            value={text}
                            onChange={(e) => {
                                const newArticles = [...articles];
                                newArticles[index].particular = e.target.value;
                                setArticles(newArticles);
                            }}
                        />
                    </Form.Item>
                );
            },
        },
        {
            title: 'Weight Type',
            dataIndex: 'weightType',
            width: 100,
            render: (text, record, index) => {
                if (record.isAdvanceRow) {
                    return <div style={{ fontWeight: 'bold', textAlign: 'center' }}>Advanced</div>;
                }
                return (
                    <Form.Item name="weightType" style={{ margin: 0 }}>
                        <Select style={{ width: '100%' }} defaultValue="Ton">
                            <Option value="Ton">Ton</Option>
                            <Option value="Kg">Kg</Option>
                        </Select>
                    </Form.Item>
                );
            },
        },
        {
            title: 'Weight',
            dataIndex: 'weight',
            width: 100,
            render: (text, record, index) => {
                if (record.isAdvanceRow) {
                    return (
                        <InputNumber
                            style={{ width: '100%' }}
                            value={record.advanced}
                            formatter={value => `₹${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                            parser={value => value.replace(/₹\s?|(,*)/g, '')}
                            onChange={(value) => {
                                const newArticles = [...articles];
                                newArticles[index].advanced = value;
                                setArticles(newArticles);
                                form.setFieldsValue({ advanced: value });

                                // Update balance after advanced change
                                const total = parseFloat(form.getFieldValue('totalFreightAmt') || 0);
                                const deduction = parseFloat(form.getFieldValue('deduction') || 0);
                                const received = parseFloat(form.getFieldValue('received') || 0);
                                const newBalance = (total - (value || 0) - deduction - received).toFixed(2);
                                form.setFieldsValue({ balance: newBalance });
                            }}
                        />
                    );
                }
                return (
                    <Form.Item name="weight" style={{ margin: 0 }}>
                        <InputNumber
                            style={{ width: '100%' }}
                            value={text}
                            onChange={(value) => {
                                const newArticles = [...articles];
                                newArticles[index].weight = value;
                                setArticles(newArticles);
                                form.setFieldsValue({ weight: value });
                            }}
                        />
                    </Form.Item>
                );
            },
        },
        {
            title: 'Rate',
            dataIndex: 'rate',
            width: 100,
            render: (text, record, index) => {
                if (record.isAdvanceRow) {
                    return (
                        <div style={{ fontWeight: 'bold', textAlign: 'center' }}>Deduction</div>
                    );
                }
                return (
                    <Form.Item name="rate" style={{ margin: 0 }}>
                        <InputNumber
                            style={{ width: '100%' }}
                            value={text}
                            formatter={value => `₹${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                            parser={value => value.replace(/₹\s?|(,*)/g, '')}
                            onChange={(value) => {
                                const newArticles = [...articles];
                                newArticles[index].rate = value;
                                setArticles(newArticles);
                                form.setFieldsValue({ rate: value });
                            }}
                        />
                    </Form.Item>
                );
            },
        },
        {
            title: 'Rate Type',
            dataIndex: 'rateType',
            width: 100,
            render: (text, record, index) => {
                if (record.isAdvanceRow) {
                    return (
                        <div style={{ fontWeight: 'bold', textAlign: 'center' }}>Balance</div>
                    );
                }
                return (
                    <Form.Item name="rateType" style={{ margin: 0 }}>
                        <Select style={{ width: '100%' }} defaultValue="Weight">
                            <Option value="Weight">Weight</Option>
                            <Option value="Fixed">Fixed</Option>
                        </Select>
                    </Form.Item>
                );
            },
        },
        {
            title: 'Total Freight Amt',
            dataIndex: 'totalFreightAmt',
            width: 150,
            render: (text, record, index) => {
                if (record.isAdvanceRow) {
                    const currentBalance = form?.getFieldValue('balance') || balance;
                    return (
                        <Space direction="vertical" size={4} style={{ width: '100%' }}>
                            <div>
                                <Text strong style={{ minWidth: 80, display: 'inline-block' }}>Advanced:</Text>
                                <InputNumber
                                    size="small"
                                    value={record.advanced}
                                    formatter={value => `₹${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                                    parser={value => value.replace(/₹\s?|(,*)/g, '')}
                                    onChange={(value) => {
                                        const newArticles = [...articles];
                                        newArticles[index].advanced = value;
                                        setArticles(newArticles);
                                        form.setFieldsValue({ advanced: value });
                                    }}
                                    style={{ width: 120 }}
                                />
                            </div>
                            <div>
                                <Text strong style={{ minWidth: 80, display: 'inline-block' }}>Deduction:</Text>
                                <InputNumber
                                    size="small"
                                    value={record.deduction}
                                    formatter={value => `₹${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                                    parser={value => value.replace(/₹\s?|(,*)/g, '')}
                                    onChange={(value) => {
                                        const newArticles = [...articles];
                                        newArticles[index].deduction = value;
                                        setArticles(newArticles);
                                        form.setFieldsValue({ deduction: value });
                                    }}
                                    style={{ width: 120 }}
                                />
                            </div>
                            <div>
                                <Text strong style={{ minWidth: 80, display: 'inline-block' }}>Balance:</Text>
                                <Text strong type="success" style={{ fontSize: '14px' }}>
                                    ₹{parseFloat(currentBalance).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </Text>
                            </div>
                        </Space>
                    );
                }
                return (
                    <Form.Item name="totalFreightAmt" style={{ margin: 0 }}>
                        <InputNumber
                            style={{ width: '100%' }}
                            value={text}
                            formatter={value => `₹${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                            parser={value => value.replace(/₹\s?|(,*)/g, '')}
                            onChange={(value) => {
                                const newArticles = [...articles];
                                newArticles[index].totalFreightAmt = value;
                                setArticles(newArticles);
                                form.setFieldsValue({ totalFreightAmt: value });
                            }}
                        />
                    </Form.Item>
                );
            },
        },
        {
            title: 'Remarks',
            dataIndex: 'remarks',
            render: (text, record, index) => {
                if (record.isAdvanceRow) {
                    return (
                        <Form.Item name="remark" style={{ margin: 0 }}>
                            <Input placeholder="Remark" />
                        </Form.Item>
                    );
                }
                return (
                    <Form.Item name="remarks" style={{ margin: 0 }}>
                        <Input
                            style={{ width: '100%' }}
                            value={text}
                            onChange={(e) => {
                                const newArticles = [...articles];
                                newArticles[index].remarks = e.target.value;
                                setArticles(newArticles);
                            }}
                        />
                    </Form.Item>
                );
            },
        },
    ];

    const handleSave = async () => {
        try {
            await form.validateFields();
            const values = form.getFieldsValue();

            // Calculate total freight from weight and rate
            const totalFreight = Number(values.weight || 0) * Number(values.rate || 0);
            const calculatedBalance = totalFreight -
                Number(values.advanced || 0) -
                Number(values.received || 0) -
                Number(values.deduction || 0);

            const payload = {
                ...values,
                bookingId: booking.id,
                partyId: booking.party?.id,
                biltyDate: values.biltyDate ? values.biltyDate.format('YYYY-MM-DD') : null,
                bookingSlipDate: values.bookingSlipDate ? values.bookingSlipDate.format('YYYY-MM-DD') : null,
                totalFreightAmt: totalFreight,
                advanced: Number(values.advanced || 0),
                received: Number(values.received || 0),
                deduction: Number(values.deduction || 0),
                balance: calculatedBalance,
                weight: Number(values.weight || 0),
                rate: Number(values.rate || 0),
                goodsValue: Number(values.goodsValue || 0),
            };

            setSaving(true);
            const token = localStorage.getItem('token');

            // Check if bilty exists
            const checkRes = await axios.get(`${API_URL}/bilty/booking/${booking.id}`, {
                headers: { Authorization: `Bearer ${token}` },
            });

            let response;
            if (checkRes.data && checkRes.data.id) {
                // Update existing bilty
                response = await axios.post(`${API_URL}/bilty/update/${checkRes.data.id}`, payload, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                message.success('Bilty updated successfully!');
            } else {
                // Create new bilty
                response = await axios.post(`${API_URL}/bilty/create`, payload, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                message.success('Bilty created successfully!');
            }

            if (onSuccess) {
                onSuccess(response.data);
            }
        } catch (error) {
            console.error('Error saving bilty:', error);
            message.error(error.response?.data?.message || 'Failed to save bilty');
        } finally {
            setSaving(false);
        }
    };

    const handleSaveAndGeneratePDF = async () => {
        try {
            await handleSave();
            // Generate PDF after saving
            await generatePDF();
        } catch (error) {
            console.error('Error in save and generate:', error);
        }
    };

    const generatePDF = async () => {
        if (!booking?.id) return;

        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get(`${API_URL}/pdf/bilty-slip/${booking.id}`, {
                headers: { Authorization: `Bearer ${token}` },
                responseType: 'blob',
            });

            const blob = new Blob([response.data], { type: 'application/pdf' });
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `bilty-${booking.id}-${moment().format('YYYYMMDD')}.pdf`);
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);

            message.success('Bilty PDF downloaded successfully!');
        } catch (error) {
            console.error('PDF download failed:', error);
            message.error('Failed to download Bilty PDF');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal
            title={
                <Space>
                    <FileTextOutlined style={{ color: '#faad14' }} />
                    <span>Bilty Form - Booking #{booking?.id}</span>
                </Space>
            }
            open={visible}
            onCancel={onClose}
            width={1300}
            footer={null}
            destroyOnHidden
        >
            <Form form={form} layout="vertical">
                {/* Header Section */}
                <Card
                    style={{
                        background: '#fffbe6',
                        border: '1px solid #ffe58f',
                        marginBottom: 16,
                    }}
                    bodystyles={{ padding: '16px 24px' }}
                >
                    <Row gutter={[16, 8]} align="middle">
                        <Col span={6}>
                            <Title level={4} style={{ margin: 0, color: '#d48806' }}>Bilty</Title>
                        </Col>
                        <Col span={6} style={{ textAlign: 'right' }}>
                            <Text strong style={{ display: 'block', marginBottom: 4 }}>Booking Slip Date</Text>
                            <Form.Item name="bookingSlipDate" style={{ margin: 0 }}>
                                <DatePicker
                                    format="DD/MM/YYYY"
                                    style={{ width: '100%' }}
                                    disabled
                                />
                            </Form.Item>
                        </Col>
                        <Col span={6}>
                            <Text strong style={{ display: 'block', marginBottom: 4 }}>Bilty Date</Text>
                            <Form.Item name="biltyDate" style={{ margin: 0 }}>
                                <DatePicker
                                    format="DD/MM/YYYY"
                                    style={{ width: '100%' }}
                                />
                            </Form.Item>
                        </Col>
                        <Col span={6}>
                            <Text strong style={{ display: 'block', marginBottom: 4 }}>Booking Slip No</Text>
                            <Form.Item name="bookingSlipNo" style={{ margin: 0 }}>
                                <Input readOnly />
                            </Form.Item>
                        </Col>
                    </Row>
                </Card>

                {/* Main Form Sections */}
                <Row gutter={16} style={{ marginBottom: 16 }}>
                    {/* Left Column */}
                    <Col span={14}>
                        <Card
                            title="Basic Information"
                            style={{ height: '100%' }}
                            bodyStyle={{ padding: '16px' }}
                        >
                            <Row gutter={[16, 12]}>
                                <Col span={12}>
                                    <Form.Item
                                        label="Bilty Design To company"
                                        name="billyDesignToCompany"
                                        rules={[{ required: true, message: 'Please enter company name' }]}
                                    >
                                        <Input placeholder="Enter company name" />
                                    </Form.Item>
                                </Col>
                                <Col span={12}>
                                    <Form.Item
                                        label="From Location"
                                        name="fromLocation"
                                        rules={[{ required: true, message: 'Please enter from location' }]}
                                    >
                                        <Input placeholder="Enter from location" />
                                    </Form.Item>
                                </Col>
                                <Col span={12}>
                                    <Form.Item
                                        label="To Location"
                                        name="toLocation"
                                        rules={[{ required: true, message: 'Please enter to location' }]}
                                    >
                                        <Input placeholder="Enter to location" />
                                    </Form.Item>
                                </Col>
                                <Col span={12}>
                                    <Form.Item
                                        label="Delivery Address"
                                        name="deliveryAddress"
                                    >
                                        <Input placeholder="Enter delivery address" />
                                    </Form.Item>
                                </Col>
                                <Col span={12}>
                                    <Form.Item
                                        label="Truck No"
                                        name="truckNo"
                                        rules={[{ required: true, message: 'Please enter truck number' }]}
                                    >
                                        <Input placeholder="Enter truck number" />
                                    </Form.Item>
                                </Col>
                            </Row>
                        </Card>
                    </Col>

                    {/* Right Column */}
                    <Col span={10}>
                        <Card
                            title="Consignee Details"
                            style={{ height: '100%' }}
                            bodyStyle={{ padding: '16px' }}
                        >
                            <Row gutter={[16, 12]}>
                                <Col span={12}>
                                    <Form.Item label="Consignee (Party)" name="consigneeParty">
                                        <Input placeholder="Enter party name" />
                                    </Form.Item>
                                </Col>
                                <Col span={12}>
                                    <Form.Item label="GST No" name="consigneeGST">
                                        <Input placeholder="Enter GST number" />
                                    </Form.Item>
                                </Col>
                                <Col span={12}>
                                    <Form.Item label="Consignee (Receiver)" name="consigneeReceiver">
                                        <Input placeholder="Enter receiver name" />
                                    </Form.Item>
                                </Col>
                                <Col span={12}>
                                    <Form.Item label="GST No" name="consigneeReceiverGST">
                                        <Input placeholder="Enter receiver GST" />
                                    </Form.Item>
                                </Col>
                            </Row>
                        </Card>
                    </Col>
                </Row>

                {/* Articles Table Section */}
                <Card
                    title="Articles & Payment Details"
                    style={{ marginBottom: 16 }}
                    bodyStyle={{ padding: 0 }}
                >
                    <Table
                        columns={columns}
                        dataSource={articles}
                        pagination={false}
                        size="middle"
                        rowKey="key"
                        bordered
                        scroll={{ x: 'max-content' }}
                    />
                </Card>

                {/* Invoice Details */}
                <Card
                    title="Invoice Details"
                    style={{ marginBottom: 24 }}
                    bodyStyle={{ padding: '16px 24px' }}
                >
                    <Row gutter={[16, 12]}>
                        <Col span={6}>
                            <Form.Item label="Invoice No" name="invoiceNo">
                                <Input placeholder="Enter invoice number" />
                            </Form.Item>
                        </Col>
                        <Col span={6}>
                            <Form.Item label="Party Phone" name="partyPhone">
                                <Input placeholder="Enter phone number" />
                            </Form.Item>
                        </Col>
                        <Col span={6}>
                            <Form.Item label="Goods Value" name="goodsValue">
                                <InputNumber
                                    style={{ width: '100%' }}
                                    formatter={value => `₹${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                                    parser={value => value.replace(/₹\s?|(,*)/g, '')}
                                    placeholder="Enter goods value"
                                />
                            </Form.Item>
                        </Col>
                        <Col span={6}>
                            <Form.Item label="Remark" name="remark">
                                <Input placeholder="Enter remark" />
                            </Form.Item>
                        </Col>
                    </Row>
                </Card>

                {/* Action Buttons */}
                <Divider />
                <Row justify="end" gutter={16}>
                    <Col>
                        <Button
                            icon={<CloseOutlined />}
                            onClick={onClose}
                            size="large"
                        >
                            Cancel
                        </Button>
                    </Col>
                    <Col>
                        <Button
                            type="primary"
                            icon={<SaveOutlined />}
                            onClick={handleSave}
                            loading={saving}
                            size="large"
                        >
                            Save Bilty
                        </Button>
                    </Col>
                    <Col>
                        <Button
                            type="primary"
                            icon={<PrinterOutlined />}
                            onClick={handleSaveAndGeneratePDF}
                            loading={saving || loading}
                            size="large"
                            style={{ background: '#52c41a', borderColor: '#52c41a' }}
                        >
                            Save & Generate Bilty
                        </Button>
                    </Col>
                </Row>
            </Form>
        </Modal>
    );
};

export default BiltyForm;