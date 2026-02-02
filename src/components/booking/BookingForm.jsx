import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { X } from 'lucide-react';
import Step1BookingAndTruck from './Step1BookingAndTruck';
import Step2FinancialDetails from './Step2FinancialDetails';
import Step3ReviewAndSubmit from './Step3ReviewAndSubmit';
import { toast } from 'react-toastify';

const calculateFreight = (rate, weight) => {
    if (!rate || !weight) return 0;
    return Number(rate) * Number(weight);
};

const API_URL = import.meta.env.VITE_API_BASE_URL;

const calculateAll = (formData) => {
    const partyRate = Number(formData.rate) || 0;
    const partyWeight = Number(formData.weight) || 0;
    const truckRate = Number(formData.truckRate) || 0;
    const truckWeight = Number(formData.truckWeight) || 0;

    const partyFreight = calculateFreight(partyRate, partyWeight);
    const truckFreight = calculateFreight(truckRate, truckWeight);
    const rawDifference = partyFreight - truckFreight;

    let commissionAmount = Number(formData.commissionAmount) || 0;

    if (formData.commissionType === 'truck' && formData.truckCommissionAmount) {
        commissionAmount = Number(formData.truckCommissionAmount) || 0;
    } else if (formData.commissionPercentage && !formData.commissionAmount) {
        commissionAmount = (Number(formData.commissionPercentage) / 100) * partyFreight;
    }

    const differenceAmount = Number(formData.differenceAmount) || rawDifference;

    const advanceFromParty = Number(formData.initialPaymentFromParty) || 0;
    const advanceToTruck = Number(formData.initialPaymentToTruck) || 0;

    // Correct commission logic
    let partyNet = partyFreight + differenceAmount;
    if (formData.commissionType !== 'truck') {
        partyNet -= commissionAmount;
    }

    let truckNet = truckFreight;
    if (formData.commissionType === 'truck') {
        truckNet -= commissionAmount;
    }

    return {
        partyFreight,
        truckFreight,
        commissionAmount,
        differenceAmount,
        partyNetAmount: partyNet,
        truckNetAmount: truckNet,
        partyPending: partyNet - advanceFromParty,
        truckPending: truckNet - advanceToTruck,
        rawDifference,
    };
};

const BookingForm = ({ booking, isEditMode, onSuccess, onClose }) => {
    const [activeStep, setActiveStep] = useState(0);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [isVisible, setIsVisible] = useState(true);
    const [showConfirm, setShowConfirm] = useState(false);

    const [formData, setFormData] = useState({
        date: new Date().toISOString().split('T')[0],
        bookingType: 'commission only',
        companyId: '',
        partyName: '',
        partyPhone: '',
        partyAddress: '',
        commodity: '',
        rate: '',
        weight: '',
        weightType: 'kg',
        fromLocation: '',
        toLocation: '',
        truckNo: '',
        tyreCount: '',
        driverName: '',
        driverPhone: '',
        transporterName: '',
        transporterPhone: '',
        truckRate: '',
        truckWeight: '',
        truckWeightType: 'kg',

        commissionPercentage: '',
        commissionAmount: '',
        commissionRemark: '',
        commissionType: '',
        truckCommissionAmount: '',

        differenceAmount: '',
        diffRemark: '',
        initialPaymentToTruck: '',
        initialPaymentFromParty: '',

        commissionGivenDate: '',
        commissionPaymentMode: '',
        commissionPaymentType: '',
        commissionBankAccountNo: '',
        commissionUtrNo: '',

        differenceGivenDate: '',
        differencePaymentMode: '',
        differencePaymentType: '',
        differenceBankAccountNo: '',
        differenceUtrNo: '',
        haltingDetails: {
            arrivalTime: '',
            unloadingStartTime: '',
            unloadingEndTime: '',
            estimatedHours: '', // New field for initial booking
            haltingReason: '',
            haltingCharges: '',
            haltingPaymentStatus: 'pending',
            haltingPaymentMode: '',
            haltingPaidAmount: '',
            haltingRemark: ''
        },
    });

    const [calculations, setCalculations] = useState({
        partyFreight: 0,
        truckFreight: 0,
        commissionAmount: 0,
        differenceAmount: 0,
        partyNetAmount: 0,
        truckNetAmount: 0,
        partyPending: 0,
        truckPending: 0,
        rawDifference: 0,
    });

    const steps = ['Booking & Truck Details', 'Financial Details', 'Review & Submit'];

    // Load booking data when component mounts or when booking prop changes
    useEffect(() => {
        if (isEditMode && booking) {
            loadBookingData(booking);
        }
    }, [isEditMode, booking]);

    const loadBookingData = (bookingData) => {
        // Extract commission data
        const commissionData = bookingData.commissions?.[0] || {};
        const haltingData = bookingData.haltingDetails?.[0] || {};

        // Calculate commission type
        let commissionType = '';
        if (commissionData.commissionType) {
            commissionType = commissionData.commissionType;
        } else if (bookingData.commissionAmount > 0) {
            // Try to infer from commission amount
            commissionType = 'party';
        }

        // Prepare form data from booking
        const newFormData = {
            date: bookingData.date ? new Date(bookingData.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
            bookingType: bookingData.bookingType || 'commission only',
            companyId: bookingData.companyId || '',
            partyName: bookingData.Party?.partyName || '',
            partyPhone: bookingData.Party?.partyPhone || '',
            partyAddress: bookingData.Party?.partyAddress || '',
            commodity: bookingData.commodity || '',
            rate: bookingData.rate || '',
            weight: bookingData.weight || '',
            weightType: bookingData.weightType || 'kg',
            fromLocation: bookingData.fromLocation || '',
            toLocation: bookingData.toLocation || '',
            truckNo: bookingData.Truck?.truckNo || '',
            tyreCount: bookingData.Truck?.tyreCount || '',
            driverName: bookingData.Truck?.driverName || '',
            driverPhone: bookingData.Truck?.driverPhone || '',
            transporterName: bookingData.Truck?.transporterName || '',
            transporterPhone: bookingData.Truck?.transporterPhone || '',
            truckRate: bookingData.truckRate || '',
            truckWeight: bookingData.weight || '', // Using same weight as party weight
            truckWeightType: bookingData.weightType || 'kg',

            commissionPercentage: '',
            commissionAmount: bookingData.commissionAmount || '',
            commissionRemark: commissionData.remark || '',
            commissionType: commissionType,
            truckCommissionAmount: commissionData.commissionType === 'truck' ? commissionData.amount : '',

            differenceAmount: bookingData.differenceAmount || '',
            diffRemark: '',
            initialPaymentToTruck: bookingData.truckPayments?.[0]?.amount || '',
            initialPaymentFromParty: bookingData.partyPayments?.[0]?.amount || '',

            commissionGivenDate: commissionData.paymentDate || '',
            commissionPaymentMode: commissionData.paymentMode || '',
            commissionPaymentType: commissionData.paymentType || '',
            commissionBankAccountNo: commissionData.bankAccountNo || '',
            commissionUtrNo: commissionData.utrNo || '',

            differenceGivenDate: '',
            differencePaymentMode: '',
            differencePaymentType: '',
            differenceBankAccountNo: '',
            differenceUtrNo: '',
            haltingDetails: {
                arrivalTime: haltingData.arrivalTime || '',
                unloadingStartTime: haltingData.unloadingStartTime || '',
                unloadingEndTime: haltingData.unloadingEndTime || '',
                estimatedHours: haltingData.estimatedHours || '', // Load estimated hours
                haltingReason: haltingData.haltingReason || '',
                haltingCharges: haltingData.haltingCharges || '',
                haltingPaymentStatus: haltingData.haltingPaymentStatus || 'pending',
                haltingPaymentMode: haltingData.haltingPaymentMode || '',
                haltingPaidAmount: haltingData.haltingPaidAmount || '',
                haltingRemark: haltingData.haltingRemark || ''
            },
        };

        setFormData(newFormData);

        // Calculate initial values
        const newCalcs = calculateAll(newFormData);
        setCalculations(newCalcs);
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => {
            const newData = { ...prev, [name]: value };

            // Always recalculate when relevant fields change
            if ([
                'rate', 'weight', 'truckRate', 'truckWeight',
                'commissionPercentage', 'commissionAmount', 'truckCommissionAmount', 'commissionType',
                'differenceAmount', 'initialPaymentFromParty', 'initialPaymentToTruck'
            ].includes(name)) {
                const newCalcs = calculateAll(newData);
                setCalculations(newCalcs);

                // AUTO-FILL LOGIC FOR COMMISSION
                if (name === 'commissionType') {
                    if (value === 'truck' && newData.truckCommissionAmount) {
                        // Auto-fill commission amount from truck commission
                        newData.commissionAmount = Number(newData.truckCommissionAmount).toFixed(2);
                    } else if (value === 'party' && newData.commissionPercentage && newData.rate && newData.weight) {
                        // Auto-fill from percentage
                        const partyFreight = calculateFreight(newData.rate, newData.weight);
                        newData.commissionAmount = ((Number(newData.commissionPercentage) / 100) * partyFreight).toFixed(2);
                    } else if (!value || value === 'free') {
                        // Clear commission if free or no type
                        newData.commissionAmount = '';
                    }
                }

                // Auto-fill commission amount when truck commission is entered and type is truck
                if (name === 'truckCommissionAmount' && newData.commissionType === 'truck') {
                    newData.commissionAmount = Number(value).toFixed(2) || '';
                }

                // Auto-fill commission amount when percentage is entered and type is party
                if (name === 'commissionPercentage' && newData.commissionType === 'party' && newData.rate && newData.weight) {
                    const partyFreight = calculateFreight(newData.rate, newData.weight);
                    newData.commissionAmount = ((Number(value) / 100) * partyFreight).toFixed(2);
                }

                // Auto-fill difference amount if not manually entered or when rates/weights change
                if ((!newData.differenceAmount && name !== 'differenceAmount') ||
                    ['rate', 'weight', 'truckRate', 'truckWeight'].includes(name)) {
                    const partyFreight = calculateFreight(newData.rate, newData.weight);
                    const truckFreight = calculateFreight(newData.truckRate, newData.truckWeight);
                    const rawDifference = partyFreight - truckFreight;
                    newData.differenceAmount = rawDifference.toFixed(2);
                }
            }

            return newData;
        });
    };

    const handleCalculate = () => {
        const newCalcs = calculateAll(formData);
        setCalculations(newCalcs);

        // Auto-fill commissionAmount based on commission type
        if (formData.commissionType === 'truck' && formData.truckCommissionAmount) {
            setFormData(prev => ({
                ...prev,
                commissionAmount: Number(formData.truckCommissionAmount).toFixed(2)
            }));
        } else if (formData.commissionType === 'party' && formData.commissionPercentage && formData.rate && formData.weight) {
            const partyFreight = calculateFreight(formData.rate, formData.weight);
            const commissionAmount = (Number(formData.commissionPercentage) / 100) * partyFreight;
            setFormData(prev => ({
                ...prev,
                commissionAmount: commissionAmount.toFixed(2)
            }));
        }

        // Auto-fill difference amount
        if (!formData.differenceAmount || formData.differenceAmount === "0.00") {
            const partyFreight = calculateFreight(formData.rate, formData.weight);
            const truckFreight = calculateFreight(formData.truckRate, formData.truckWeight);
            const rawDifference = partyFreight - truckFreight;
            setFormData(prev => ({
                ...prev,
                differenceAmount: rawDifference.toFixed(2)
            }));
        }
    };

    const handleNext = () => setActiveStep(prev => prev + 1);
    const handleBack = () => setActiveStep(prev => prev - 1);

    const handleClose = () => {
        setIsVisible(false);
        if (onClose) {
            onClose();
        }
    };

    const handleSubmit = async () => {
        setLoading(true);
        setError('');
        setSuccess('');

        try {
            const token = localStorage.getItem('token');
            const payload = {
                ...formData,
                rate: Number(formData.rate) || 0,
                weight: Number(formData.weight) || 0,
                truckRate: Number(formData.truckRate) || 0,
                truckWeight: Number(formData.truckWeight) || 0,
                commissionAmount: Number(formData.commissionAmount) || 0,
                truckCommissionAmount: Number(formData.truckCommissionAmount) || 0,
                differenceAmount: Number(formData.differenceAmount) || 0,
                initialPaymentToTruck: Number(formData.initialPaymentToTruck) || 0,
                initialPaymentFromParty: Number(formData.initialPaymentFromParty) || 0,
                commissionType: formData.commissionType || null,

                // Send calculated totals
                partyFreight: calculations.partyFreight,
                truckFreight: calculations.truckFreight,

                commissionGivenDate: formData.commissionGivenDate || null,
                commissionPaymentMode: formData.commissionPaymentMode || null,
                commissionPaymentType: formData.commissionPaymentType || null,
                commissionBankAccountNo: formData.commissionBankAccountNo || null,
                commissionUtrNo: formData.commissionUtrNo || null,

                differenceGivenDate: formData.differenceGivenDate || null,
                differencePaymentMode: formData.differencePaymentMode || null,
                differencePaymentType: formData.differencePaymentType || null,
                differenceBankAccountNo: formData.differenceBankAccountNo || null,
                differenceUtrNo: formData.differenceUtrNo || null,
                haltingDetails: [{
                    arrivalTime: formData.haltingDetails.arrivalTime || null,
                    unloadingStartTime: formData.haltingDetails.unloadingStartTime || null,
                    unloadingEndTime: formData.haltingDetails.unloadingEndTime || null,
                    estimatedHours: Number(formData.haltingDetails.estimatedHours) || 0, // New field
                    haltingReason: formData.haltingDetails.haltingReason || null,
                    haltingCharges: Number(formData.haltingDetails.haltingCharges) || 0,
                    haltingPaymentStatus: formData.haltingDetails.haltingPaymentStatus || 'pending',
                    haltingPaymentMode: formData.haltingDetails.haltingPaymentMode || null,
                    haltingPaidAmount: Number(formData.haltingDetails.haltingPaidAmount) || 0,
                    haltingRemark: formData.haltingDetails.haltingRemark || null
                }],
            };

            let response;
            if (isEditMode && booking) {
                // Update existing booking
                response = await axios.put(`${API_URL}/booking/update/${booking.id}`, payload, {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                });
                toast.success('Booking updated successfully!');
                setSuccess('Booking updated successfully!');
            } else {
                // Create new booking
                response = await axios.post(`${API_URL}/booking/create`, payload, {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                });
                toast.success('Booking created successfully!');
                setSuccess('Booking created successfully!');
            }

            // Call onSuccess prop to close modal and refresh list
            if (onSuccess) {
                onSuccess();
            }

            // Reset form if creating new booking
            if (!isEditMode) {
                setTimeout(() => {
                    setFormData({
                        date: new Date().toISOString().split('T')[0],
                        bookingType: 'commission only',
                        companyId: '',
                        partyName: '',
                        partyPhone: '',
                        partyAddress: '',
                        commodity: '',
                        rate: '',
                        weight: '',
                        weightType: 'kg',
                        fromLocation: '',
                        toLocation: '',
                        truckNo: '',
                        tyreCount: '',
                        driverName: '',
                        driverPhone: '',
                        transporterName: '',
                        transporterPhone: '',
                        truckRate: '',
                        truckWeight: '',
                        truckWeightType: 'kg',
                        commissionPercentage: '',
                        commissionAmount: '',
                        commissionRemark: '',
                        commissionType: '',
                        truckCommissionAmount: '',
                        differenceAmount: '',
                        diffRemark: '',
                        initialPaymentToTruck: '',
                        initialPaymentFromParty: '',
                        commissionGivenDate: '',
                        commissionPaymentMode: '',
                        commissionPaymentType: '',
                        commissionBankAccountNo: '',
                        commissionUtrNo: '',
                        differenceGivenDate: '',
                        differencePaymentMode: '',
                        differencePaymentType: '',
                        differenceBankAccountNo: '',
                        differenceUtrNo: '',
                    });
                    setCalculations({
                        partyFreight: 0,
                        truckFreight: 0,
                        commissionAmount: 0,
                        differenceAmount: 0,
                        partyNetAmount: 0,
                        truckNetAmount: 0,
                        partyPending: 0,
                        truckPending: 0,
                        rawDifference: 0,
                    });
                    setActiveStep(0);
                }, 2000);
            }
        } catch (err) {
            setError(err.response?.data?.message || `Error ${isEditMode ? 'updating' : 'creating'} booking`);
            console.error(`Error ${isEditMode ? 'updating' : 'creating'} booking:`, err);
        } finally {
            setLoading(false);
        }
    };

    const renderStep = () => {
        switch (activeStep) {
            case 0:
                return <Step1BookingAndTruck
                    formData={formData}
                    handleChange={handleChange}
                    handleCalculate={handleCalculate}
                    calculations={calculations}
                />;
            case 1:
                return <Step2FinancialDetails
                    formData={formData}
                    handleChange={handleChange}
                    handleCalculate={handleCalculate}
                    calculations={calculations}
                />;
            case 2:
                return <Step3ReviewAndSubmit
                    formData={formData}
                    calculations={calculations}
                />;
            default:
                return null;
        }
    };

    // Function to show confirmation before closing
    const showCloseConfirmation = () => {
        const hasChanges = activeStep > 0 || Object.values(formData).some(value => value !== '' && value !== null && value !== undefined);
        if (hasChanges) {
            setShowConfirm(true);
        } else {
            handleClose();
        }
    };

    if (!isVisible) return null;

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto flex items-start justify-center px-4 py-10 bg-black/50">
            <div className="bg-white dark:bg-gray-800 shadow-xl rounded-2xl overflow-hidden w-full max-w-6xl">
                {/* Header */}
                <div className="bg-linear-to-r from-blue-600 to-indigo-600 px-8 py-4 text-white flex justify-between items-center">
                    <div>
                        <h1 className="text-2xl font-bold">
                            {isEditMode ? 'Edit Booking' : 'Create New Booking'}
                        </h1>
                        <p className="mt-1 text-blue-100 text-sm">
                            {isEditMode ? `Editing Booking ID: ${booking?.id}` : 'Fill in the details step by step'}
                        </p>
                    </div>
                    <button
                        onClick={showCloseConfirmation}
                        className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
                    >
                        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Progress Steps */}
                <div className="px-8 pt-4 pb-2 border-b border-gray-200 dark:border-gray-700">
                    <div className="flex justify-between items-center">
                        {steps.map((step, index) => (
                            <div key={index} className="flex-1 flex flex-col items-center">
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-all duration-300
                  ${index === activeStep
                                        ? 'bg-blue-600 border-blue-600 text-white shadow-lg'
                                        : index < activeStep
                                            ? 'bg-green-500 border-green-500 text-white'
                                            : 'bg-gray-200 border-gray-300 text-gray-600 dark:bg-gray-700 dark:text-gray-400'}`}
                                >
                                    {index + 1}
                                </div>
                                <span className="mt-1 text-xs font-medium text-gray-700 dark:text-gray-300 truncate w-full text-center">
                                    {step}
                                </span>
                                {index < steps.length - 1 && (
                                    <div className={`h-1 w-full mt-1 rounded-full transition-all duration-300
                    ${index < activeStep ? 'bg-green-500' : 'bg-gray-200 dark:bg-gray-700'}`}
                                    />
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Form Content - Thin Scrollbar */}
                <div className="p-6 max-h-[60vh] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600 scrollbar-track-transparent">
                    {renderStep()}
                </div>

                {/* Navigation */}
                <div className="px-6 py-4 bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 flex justify-between">
                    <button
                        type="button"
                        onClick={handleBack}
                        disabled={activeStep === 0}
                        className={`px-4 py-2 rounded-lg font-medium transition-colors text-sm
              ${activeStep === 0
                                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                : 'bg-gray-200 hover:bg-gray-300 text-gray-800 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-gray-200'}`}
                    >
                        ← Back
                    </button>

                    {activeStep === steps.length - 1 ? (
                        <button
                            type="button"
                            onClick={handleSubmit}
                            disabled={loading}
                            className="px-6 py-2 bg-linear-to-r from-blue-600 to-indigo-600 text-white rounded-lg font-medium hover:from-blue-700 hover:to-indigo-700 transition-all shadow-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 text-sm"
                        >
                            {loading ? (
                                <>
                                    <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                                    </svg>
                                    <span>{isEditMode ? 'Updating...' : 'Submitting...'}</span>
                                </>
                            ) : (
                                `${isEditMode ? 'Update' : 'Submit'} Booking`
                            )}
                        </button>
                    ) : (
                        <button
                            type="button"
                            onClick={handleNext}
                            className="px-6 py-2 bg-linear-to-r from-blue-600 to-indigo-600 text-white rounded-lg font-medium hover:from-blue-700 hover:to-indigo-700 transition-all shadow-md text-sm"
                        >
                            Next →
                        </button>
                    )}
                </div>
            </div>
            {showConfirm && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 max-w-sm w-full mx-4 shadow-xl">
                        <h3 className="text-lg font-semibold mb-3 text-gray-900 dark:text-white">Discard changes?</h3>
                        <p className="text-gray-600 dark:text-gray-300 mb-6">
                            You have unsaved changes. Closing will lose them.
                        </p>
                        <div className="flex gap-3 justify-end">
                            <button
                                onClick={() => setShowConfirm(false)}
                                className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={() => {
                                    setShowConfirm(false);
                                    handleClose();
                                }}
                                className="px-4 py-2 bg-red-600 text-white hover:bg-red-700 rounded-lg"
                            >
                                Discard & Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default BookingForm;