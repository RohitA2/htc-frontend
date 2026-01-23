import React, { useState } from 'react';
import axios from 'axios';

import Step1BookingAndTruck from './Step1BookingAndTruck';
import Step2FinancialDetails from './Step2FinancialDetails';
import Step3ReviewAndSubmit from './Step3ReviewAndSubmit';

const calculateFreight = (rate, weight) => {
    if (!rate || !weight) return 0;
    return Number(rate) * Number(weight);
};

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

const BookingForm = () => {
    const [activeStep, setActiveStep] = useState(0);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const [formData, setFormData] = useState({
        date: new Date().toISOString().split('T')[0],
        bookingType: 'normal',
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

    const handleSubmit = async () => {
        setLoading(true);
        setError('');
        setSuccess('');

        try {
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
            };

            const response = await axios.post('/api/bookings', payload);

            setSuccess('Booking created successfully!');

            setTimeout(() => {
                setFormData({
                    date: new Date().toISOString().split('T')[0],
                    bookingType: 'normal',
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
        } catch (err) {
            setError(err.response?.data?.message || 'Error creating booking');
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

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="bg-white dark:bg-gray-800 shadow-xl rounded-2xl overflow-hidden">
                {/* Header */}
                <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-8 py-6 text-white">
                    <h1 className="text-3xl font-bold">Create New Booking</h1>
                    <p className="mt-2 text-blue-100">Fill in the details step by step to create a new transport booking</p>
                </div>

                {/* Progress Steps */}
                <div className="px-8 pt-6 pb-4 border-b border-gray-200 dark:border-gray-700">
                    <div className="flex justify-between items-center">
                        {steps.map((step, index) => (
                            <div key={index} className="flex-1 flex flex-col items-center">
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold border-2 transition-all duration-300
                  ${index === activeStep
                                        ? 'bg-blue-600 border-blue-600 text-white shadow-lg'
                                        : index < activeStep
                                            ? 'bg-green-500 border-green-500 text-white'
                                            : 'bg-gray-200 border-gray-300 text-gray-600 dark:bg-gray-700 dark:text-gray-400'}`}
                                >
                                    {index + 1}
                                </div>
                                <span className="mt-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                                    {step}
                                </span>
                                {index < steps.length - 1 && (
                                    <div className={`h-1 w-full mt-4 rounded-full transition-all duration-300
                    ${index < activeStep ? 'bg-green-500' : 'bg-gray-200 dark:bg-gray-700'}`}
                                    />
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Messages */}
                {error && (
                    <div className="mx-8 mt-4 p-4 bg-red-50 border-l-4 border-red-500 text-red-700 rounded-r-lg">
                        <p>{error}</p>
                    </div>
                )}
                {success && (
                    <div className="mx-8 mt-4 p-4 bg-green-50 border-l-4 border-green-500 text-green-700 rounded-r-lg">
                        <p>{success}</p>
                    </div>
                )}

                {/* Form Content */}
                <div className="p-8">
                    {renderStep()}
                </div>

                {/* Navigation */}
                <div className="px-8 py-6 bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 flex justify-between">
                    <button
                        type="button"
                        onClick={handleBack}
                        disabled={activeStep === 0}
                        className={`px-6 py-3 rounded-lg font-medium transition-colors
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
                            className="px-8 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg font-medium hover:from-blue-700 hover:to-indigo-700 transition-all shadow-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                        >
                            {loading ? (
                                <>
                                    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                                    </svg>
                                    <span>Submitting...</span>
                                </>
                            ) : (
                                'Submit Booking'
                            )}
                        </button>
                    ) : (
                        <button
                            type="button"
                            onClick={handleNext}
                            className="px-8 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg font-medium hover:from-blue-700 hover:to-indigo-700 transition-all shadow-md"
                        >
                            Next →
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default BookingForm;