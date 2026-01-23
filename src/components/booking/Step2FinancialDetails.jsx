import React, { useState, useEffect } from 'react';
import axios from 'axios';

const Step2FinancialDetails = ({ formData, handleChange, handleCalculate, calculations }) => {
    const [commissionBanks, setCommissionBanks] = useState([]);
    const [differenceBanks, setDifferenceBanks] = useState([]);
    const [loadingCommissionBanks, setLoadingCommissionBanks] = useState(false);
    const [loadingDifferenceBanks, setLoadingDifferenceBanks] = useState(false);
    const [bankError, setBankError] = useState('');

    // Fetch bank accounts when commission payment mode changes to bank
    useEffect(() => {
        if (formData.commissionPaymentMode === 'bank') {
            fetchCommissionBanks();
        } else {
            setCommissionBanks([]);
        }
    }, [formData.commissionPaymentMode]);

    // Fetch bank accounts when difference payment mode changes to bank
    useEffect(() => {
        if (formData.differencePaymentMode === 'bank') {
            fetchDifferenceBanks();
        } else {
            setDifferenceBanks([]);
        }
    }, [formData.differencePaymentMode]);

    const fetchCommissionBanks = async () => {
        setLoadingCommissionBanks(true);
        setBankError('');
        
        try {
            const response = await axios.get('http://localhost:5000/api/bank/list');
            if (response.data.success) {
                setCommissionBanks(response.data.data);
            } else {
                setBankError('Failed to load bank accounts');
            }
        } catch (error) {
            setBankError('Error loading bank accounts: ' + (error.response?.data?.message || error.message));
            console.error('Error fetching commission banks:', error);
        } finally {
            setLoadingCommissionBanks(false);
        }
    };

    const fetchDifferenceBanks = async () => {
        setLoadingDifferenceBanks(true);
        setBankError('');
        
        try {
            const response = await axios.get('http://localhost:5000/api/bank/list');
            if (response.data.success) {
                setDifferenceBanks(response.data.data);
            } else {
                setBankError('Failed to load bank accounts');
            }
        } catch (error) {
            setBankError('Error loading bank accounts: ' + (error.response?.data?.message || error.message));
            console.error('Error fetching difference banks:', error);
        } finally {
            setLoadingDifferenceBanks(false);
        }
    };

    const handleBankChange = (type, e) => {
        const selectedBankId = e.target.value;
        const bankList = type === 'commission' ? commissionBanks : differenceBanks;
        const selectedBank = bankList.find(bank => bank.id.toString() === selectedBankId);
        
        if (selectedBank) {
            if (type === 'commission') {
                handleChange({
                    target: {
                        name: 'commissionBankAccountNo',
                        value: selectedBank.accountNo
                    }
                });
            } else {
                handleChange({
                    target: {
                        name: 'differenceBankAccountNo',
                        value: selectedBank.accountNo
                    }
                });
            }
        }
    };

    const safeCalc = (value) => (typeof value === 'number' ? value : 0);

    const partyFreight = safeCalc(calculations?.partyFreight);
    const truckFreight = safeCalc(calculations?.truckFreight);
    const commissionAmount = safeCalc(calculations?.commissionAmount);
    const differenceAmount = safeCalc(calculations?.differenceAmount);
    const partyNetAmount = safeCalc(calculations?.partyNetAmount);
    const truckNetAmount = safeCalc(calculations?.truckNetAmount);
    const partyPending = safeCalc(calculations?.partyPending);
    const truckPending = safeCalc(calculations?.truckPending);
    const initialPaymentFromParty = Number(formData.initialPaymentFromParty) || 0;
    const initialPaymentToTruck = Number(formData.initialPaymentToTruck) || 0;

    const hasCalculations = partyFreight > 0 || truckFreight > 0;

    const isTruckCommission = formData.commissionType === 'truck';
    const isPartyCommission = formData.commissionType === 'party';

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Left Column - Commission & Difference */}
            <div className="space-y-8">
                {/* Commission Details */}
                <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
                    <h3 className="text-xl font-semibold mb-6 text-gray-800 dark:text-gray-200">Commission Details</h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Payment Type</label>
                            <select
                                name="commissionPaymentType"
                                value={formData.commissionPaymentType || ''}
                                onChange={handleChange}
                                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                            >
                                <option value="">Select Type</option>
                                <option value="Debit">Debit</option>
                                <option value="Credit">Credit</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Commission Amount (₹)
                                <span className="text-xs text-green-600 dark:text-green-400 ml-1">
                                    {formData.commissionType ? `(${formData.commissionType === 'truck' ? 'from Truck' : 'from Party'})` : ''}
                                </span>
                            </label>
                            <div className="relative">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">₹</span>
                                <input
                                    type="number"
                                    name="commissionAmount"
                                    value={formData.commissionAmount || commissionAmount || ''}
                                    onChange={handleChange}
                                    onBlur={handleCalculate}
                                    step="0.01"
                                    min="0"
                                    placeholder={commissionAmount > 0 ? commissionAmount.toFixed(2) : "Auto-filled or manual"}
                                    className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white ${formData.commissionAmount || commissionAmount ? 'border-green-500 bg-green-50 dark:bg-green-900/20' : 'border-gray-300 dark:border-gray-600'
                                        }`}
                                />
                            </div>
                            {(formData.commissionType === 'truck' && formData.truckCommissionAmount) && (
                                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                                    Auto-filled from Truck Commission: ₹{Number(formData.truckCommissionAmount).toFixed(2)}
                                </p>
                            )}
                            {(formData.commissionType === 'party' && formData.commissionPercentage && formData.rate && formData.weight) && (
                                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                                    Calculated from {formData.commissionPercentage}% of Party Freight
                                </p>
                            )}
                        </div>
                    </div>

                    {/* Payment Fields */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Date Given</label>
                            <input
                                type="date"
                                name="commissionGivenDate"
                                value={formData.commissionGivenDate || ''}
                                onChange={handleChange}
                                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Payment Mode</label>
                            <select
                                name="commissionPaymentMode"
                                value={formData.commissionPaymentMode || ''}
                                onChange={handleChange}
                                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                            >
                                <option value="">Select Mode</option>
                                <option value="cash">Cash</option>
                                <option value="bank">Bank Transfer</option>
                            </select>
                        </div>
                    </div>

                    {formData.commissionPaymentMode === 'bank' && (
                        <div className="space-y-6 mb-6">
                            {bankError && (
                                <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                                    <p className="text-sm text-red-600">{bankError}</p>
                                </div>
                            )}
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Select Bank Account</label>
                                    <div className="relative">
                                        <select
                                            name="commissionBankSelect"
                                            onChange={(e) => handleBankChange('commission', e)}
                                            disabled={loadingCommissionBanks}
                                            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white appearance-none"
                                        >
                                            <option value="">Select Bank Account</option>
                                            {commissionBanks.map((bank) => (
                                                <option key={bank.id} value={bank.id}>
                                                    {bank.acHolderName} - {bank.accountNo} ({bank.branchName})
                                                </option>
                                            ))}
                                        </select>
                                        {loadingCommissionBanks && (
                                            <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                                                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
                                            </div>
                                        )}
                                    </div>
                                    {commissionBanks.length === 0 && !loadingCommissionBanks && (
                                        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                                            No bank accounts available. Please add bank accounts first.
                                        </p>
                                    )}
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Account Number</label>
                                    <input
                                        type="text"
                                        name="commissionBankAccountNo"
                                        value={formData.commissionBankAccountNo || ''}
                                        onChange={handleChange}
                                        placeholder="Will auto-fill when bank is selected"
                                        className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white bg-gray-50 dark:bg-gray-800"
                                        readOnly={!!formData.commissionBankAccountNo}
                                    />
                                </div>
                            </div>
                            
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">UTR / Ref No</label>
                                <input
                                    type="text"
                                    name="commissionUtrNo"
                                    value={formData.commissionUtrNo || ''}
                                    onChange={handleChange}
                                    placeholder="Transaction ID / UTR"
                                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                                />
                            </div>
                            
                            {/* Show selected bank details */}
                            {formData.commissionBankAccountNo && commissionBanks.length > 0 && (
                                <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                                    {(() => {
                                        const selectedBank = commissionBanks.find(bank => 
                                            bank.accountNo === formData.commissionBankAccountNo
                                        );
                                        if (selectedBank) {
                                            return (
                                                <>
                                                    <p className="text-sm text-blue-700 dark:text-blue-300">
                                                        <span className="font-medium">Account Holder:</span> {selectedBank.acHolderName}
                                                    </p>
                                                    <p className="text-sm text-blue-700 dark:text-blue-300">
                                                        <span className="font-medium">Branch:</span> {selectedBank.branchName}
                                                    </p>
                                                    <p className="text-sm text-blue-700 dark:text-blue-300">
                                                        <span className="font-medium">IFSC:</span> {selectedBank.IFSCode}
                                                    </p>
                                                </>
                                            );
                                        }
                                        return null;
                                    })()}
                                </div>
                            )}
                        </div>
                    )}

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Commission Remarks</label>
                        <textarea
                            name="commissionRemark"
                            value={formData.commissionRemark || ''}
                            onChange={handleChange}
                            rows="3"
                            placeholder="Any remarks about commission"
                            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                        />
                    </div>
                </div>

                {/* Difference Details */}
                <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
                    <h3 className="text-xl font-semibold mb-6 text-gray-800 dark:text-gray-200">Difference / Adjustment Details</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                        <div >
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Payment Type</label>
                            <select
                                name="differencePaymentType"
                                value={formData.differencePaymentType || ''}
                                onChange={handleChange}
                                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                            >
                                <option value="">Select Type</option>
                                <option value="Debit">Debit</option>
                                <option value="Credit">Credit</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Difference Amount (₹)</label>
                            <div className="relative">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">₹</span>
                                <input
                                    type="number"
                                    name="differenceAmount"
                                    value={formData.differenceAmount || differenceAmount || ''}
                                    onChange={handleChange}
                                    onBlur={handleCalculate}
                                    step="0.01"
                                    placeholder={differenceAmount !== 0 ? differenceAmount.toFixed(2) : "Auto-calculated"}
                                    className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white ${formData.differenceAmount || differenceAmount !== 0 ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' : 'border-gray-300 dark:border-gray-600'
                                        }`}
                                />
                            </div>
                            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                                Auto-calculated: Party Freight (₹{partyFreight.toFixed(2)}) - Truck Freight (₹{truckFreight.toFixed(2)})
                            </p>
                        </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Date Given</label>
                            <input
                                type="date"
                                name="differenceGivenDate"
                                value={formData.differenceGivenDate || ''}
                                onChange={handleChange}
                                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Payment Mode</label>
                            <select
                                name="differencePaymentMode"
                                value={formData.differencePaymentMode || ''}
                                onChange={handleChange}
                                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                            >
                                <option value="">Select Mode</option>
                                <option value="cash">Cash</option>
                                <option value="bank">Bank Transfer</option>
                            </select>
                        </div>
                    </div>

                    {formData.differencePaymentMode === 'bank' && (
                        <div className="space-y-6 mb-6">
                            {bankError && (
                                <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                                    <p className="text-sm text-red-600">{bankError}</p>
                                </div>
                            )}
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Select Bank Account</label>
                                    <div className="relative">
                                        <select
                                            name="differenceBankSelect"
                                            onChange={(e) => handleBankChange('difference', e)}
                                            disabled={loadingDifferenceBanks}
                                            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white appearance-none"
                                        >
                                            <option value="">Select Bank Account</option>
                                            {differenceBanks.map((bank) => (
                                                <option key={bank.id} value={bank.id}>
                                                    {bank.acHolderName} - {bank.accountNo} ({bank.branchName})
                                                </option>
                                            ))}
                                        </select>
                                        {loadingDifferenceBanks && (
                                            <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                                                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
                                            </div>
                                        )}
                                    </div>
                                    {differenceBanks.length === 0 && !loadingDifferenceBanks && (
                                        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                                            No bank accounts available. Please add bank accounts first.
                                        </p>
                                    )}
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Account Number</label>
                                    <input
                                        type="text"
                                        name="differenceBankAccountNo"
                                        value={formData.differenceBankAccountNo || ''}
                                        onChange={handleChange}
                                        placeholder="Will auto-fill when bank is selected"
                                        className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white bg-gray-50 dark:bg-gray-800"
                                        readOnly={!!formData.differenceBankAccountNo}
                                    />
                                </div>
                            </div>
                            
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">UTR / Ref No</label>
                                <input
                                    type="text"
                                    name="differenceUtrNo"
                                    value={formData.differenceUtrNo || ''}
                                    onChange={handleChange}
                                    placeholder="Transaction ID / UTR"
                                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                                />
                            </div>
                            
                            {/* Show selected bank details */}
                            {formData.differenceBankAccountNo && differenceBanks.length > 0 && (
                                <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                                    {(() => {
                                        const selectedBank = differenceBanks.find(bank => 
                                            bank.accountNo === formData.differenceBankAccountNo
                                        );
                                        if (selectedBank) {
                                            return (
                                                <>
                                                    <p className="text-sm text-blue-700 dark:text-blue-300">
                                                        <span className="font-medium">Account Holder:</span> {selectedBank.acHolderName}
                                                    </p>
                                                    <p className="text-sm text-blue-700 dark:text-blue-300">
                                                        <span className="font-medium">Branch:</span> {selectedBank.branchName}
                                                    </p>
                                                    <p className="text-sm text-blue-700 dark:text-blue-300">
                                                        <span className="font-medium">IFSC:</span> {selectedBank.IFSCode}
                                                    </p>
                                                </>
                                            );
                                        }
                                        return null;
                                    })()}
                                </div>
                            )}
                        </div>
                    )}

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Difference Remarks</label>
                        <textarea
                            name="diffRemark"
                            value={formData.diffRemark || ''}
                            onChange={handleChange}
                            rows="3"
                            placeholder="Reason for difference amount"
                            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                        />
                    </div>
                </div>
            </div>

            {/* Right Column - Initial Payments & Summary */}
            <div className="space-y-8">
                {/* Initial Payments */}
                <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
                    <h3 className="text-xl font-semibold mb-6 text-gray-800 dark:text-gray-200">Initial Payments</h3>

                    <div className="space-y-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Payment to Truck Owner/Driver (₹)</label>
                            <div className="relative">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">₹</span>
                                <input
                                    type="number"
                                    name="initialPaymentToTruck"
                                    value={formData.initialPaymentToTruck || ''}
                                    onChange={handleChange}
                                    onBlur={handleCalculate}
                                    step="0.01"
                                    min="0"
                                    placeholder="Advance paid"
                                    className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Payment Received from Party (₹)</label>
                            <div className="relative">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">₹</span>
                                <input
                                    type="number"
                                    name="initialPaymentFromParty"
                                    value={formData.initialPaymentFromParty || ''}
                                    onChange={handleChange}
                                    onBlur={handleCalculate}
                                    step="0.01"
                                    min="0"
                                    placeholder="Advance received"
                                    className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                                />
                            </div>
                        </div>

                        <button
                            type="button"
                            onClick={handleCalculate}
                            className="w-full py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg font-medium hover:from-blue-700 hover:to-indigo-700 transition-all shadow-md"
                        >
                            Recalculate All Amounts
                        </button>
                    </div>
                </div>

                {/* Financial Summary */}
                {hasCalculations ? (
                    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-gray-800 dark:to-gray-900 p-6 rounded-xl border border-blue-200 dark:border-gray-700 shadow-sm">
                        <h3 className="text-xl font-semibold mb-6 text-gray-800 dark:text-gray-200">Financial Summary</h3>

                        {/* Party Account */}
                        <div className="mb-8 bg-white/50 dark:bg-gray-800/50 p-5 rounded-lg">
                            <h4 className="text-lg font-medium mb-4 text-blue-800 dark:text-blue-300">Party Account</h4>
                            <div className="space-y-3 text-sm">
                                <div className="flex justify-between text-gray-800 dark:text-gray-200">
                                    <span>Party Freight:</span>
                                    <strong>₹{partyFreight.toFixed(2)}</strong>
                                </div>
                                <div className="flex justify-between text-gray-600 dark:text-gray-400">
                                    <span>Advance Received:</span>
                                    <span>-₹{initialPaymentFromParty.toFixed(2)}</span>
                                </div>
                                <div className="border-t border-gray-300 dark:border-gray-600 pt-2 flex justify-between font-bold text-blue-800 dark:text-blue-200">
                                    <span>Balance Receivable:</span>
                                    <span>₹{(partyFreight - initialPaymentFromParty).toFixed(2)}</span>
                                </div>
                            </div>
                        </div>

                        {/* Truck Account */}
                        <div className="mb-8 bg-white/50 dark:bg-gray-800/50 p-5 rounded-lg">
                            <h4 className="text-lg font-medium mb-4 text-emerald-800 dark:text-emerald-300">Truck Account</h4>
                            <div className="space-y-3 text-sm text-gray-800 dark:text-gray-200">
                                <div className="flex justify-between">
                                    <span>Truck Freight:</span>
                                    <strong>₹{truckFreight.toFixed(2)}</strong>
                                </div>
                                {isTruckCommission && commissionAmount > 0 && (
                                    <div className="flex justify-between text-red-600 dark:text-red-400">
                                        <span>Commission Deducted:</span>
                                        <span>-₹{commissionAmount.toFixed(2)}</span>
                                    </div>
                                )}
                                <div className="flex justify-between text-gray-600 dark:text-gray-400">
                                    <span>Advance Paid:</span>
                                    <span>-₹{initialPaymentToTruck.toFixed(2)}</span>
                                </div>
                                <div className="border-t border-gray-300 dark:border-gray-600 pt-2 flex justify-between font-bold text-emerald-800 dark:text-emerald-200">
                                    <span>Balance Payable:</span>
                                    <span>₹{(truckFreight - (isTruckCommission ? commissionAmount : 0) - initialPaymentToTruck).toFixed(2)}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                        <p className="text-lg">Fill in rates & weights, then click "Calculate" to see summary</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Step2FinancialDetails;