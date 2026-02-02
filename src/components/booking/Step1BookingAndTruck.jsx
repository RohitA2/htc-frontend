import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';

const Step1BookingAndTruck = ({ formData, handleChange, handleCalculate, calculations }) => {
    // console.log('formData is', formData);
    // console.log('handleCalculate is', handleCalculate);
    // console.log('calculations is', calculations);
    // console.log('handleChange is', handleChange);
    const [companies, setCompanies] = useState([]);
    const [loadingCompanies, setLoadingCompanies] = useState(false);
    const [loadingParties, setLoadingParties] = useState(false);
    const [companyError, setCompanyError] = useState('');
    const [parties, setParties] = useState([]);
    const [partyError, setPartyError] = useState('');
    const [showAddPartyModal, setShowAddPartyModal] = useState(false);
    const [newParty, setNewParty] = useState({
        partyName: '',
        partyPhone: '',
        partyAddress: ''
    });
    const [addingParty, setAddingParty] = useState(false);

    const partySelectRef = useRef(null);

    // Fetch companies on component mount
    useEffect(() => {
        fetchCompanies();
        fetchParties();
    }, []);

    const fetchCompanies = async () => {
        setLoadingCompanies(true);
        setCompanyError('');

        try {
            const response = await axios.get('http://localhost:5000/api/company/list');
            if (response.data.success) {
                setCompanies(response.data.data);
            } else {
                setCompanyError('Failed to load companies');
            }
        } catch (error) {
            setCompanyError('Error loading companies: ' + (error.response?.data?.message || error.message));
            console.error('Error fetching companies:', error);
        } finally {
            setLoadingCompanies(false);
        }
    };

    const fetchParties = async () => {
        setLoadingParties(true);
        setPartyError('');

        try {
            const response = await axios.get('http://localhost:5000/api/party/list');
            if (response.data.success) {
                setParties(response.data.data);
            } else {
                setPartyError('Failed to load parties');
            }
        } catch (error) {
            setPartyError('Error loading parties: ' + (error.response?.data?.message || error.message));
            console.error('Error fetching parties:', error);
        } finally {
            setLoadingParties(false);
        }
    };

    const calculateCommissionFromPercentage = () => {
        if (formData.commissionPercentage && formData.rate && formData.weight && formData.commissionType === 'party') {
            const partyFreight = Number(formData.rate) * Number(formData.weight);
            return (Number(formData.commissionPercentage) / 100) * partyFreight;
        }
        return 0;
    };

    const handleCompanyChange = (e) => {
        const selectedCompanyId = e.target.value;
        const selectedCompany = companies.find(company => company.id.toString() === selectedCompanyId);

        handleChange({
            target: {
                name: 'companyId',
                value: selectedCompanyId
            }
        });

        // You can also store additional company info if needed
        // For example, auto-fill transporter name if it's the same company
        if (selectedCompany && !formData.transporterName) {
            handleChange({
                target: {
                    name: 'transporterName',
                    value: selectedCompany.companyName
                }
            });
        }
    };

    const handlePartyChange = (e) => {
        const selectedPartyId = e.target.value;

        if (selectedPartyId === 'add_new') {
            // Show add party modal
            setShowAddPartyModal(true);
            return;
        }

        const selectedParty = parties.find(party => party.id.toString() === selectedPartyId);

        handleChange({
            target: {
                name: 'partyId',
                value: selectedPartyId
            }
        });

        if (selectedParty) {
            // Auto-fill party details
            handleChange({
                target: {
                    name: 'partyName',
                    value: selectedParty.partyName || ''
                }
            });

            handleChange({
                target: {
                    name: 'partyPhone',
                    value: selectedParty.partyPhone || ''
                }
            });

            handleChange({
                target: {
                    name: 'partyAddress',
                    value: selectedParty.partyAddress || ''
                }
            });
        }
    };

    const handleAddNewParty = async () => {
        if (!newParty.partyName.trim()) {
            alert('Party name is required');
            return;
        }

        setAddingParty(true);
        try {
            const response = await axios.post('http://localhost:5000/api/party/create', newParty);

            if (response.data.success) {
                const addedParty = response.data.data;

                // Add to local state
                setParties(prev => [...prev, addedParty]);

                // Select the newly added party
                handleChange({
                    target: {
                        name: 'partyId',
                        value: addedParty.id.toString()
                    }
                });

                // Auto-fill party details
                handleChange({
                    target: {
                        name: 'partyName',
                        value: addedParty.partyName
                    }
                });

                handleChange({
                    target: {
                        name: 'partyPhone',
                        value: addedParty.partyPhone || ''
                    }
                });

                handleChange({
                    target: {
                        name: 'partyAddress',
                        value: addedParty.partyAddress || ''
                    }
                });

                // Close modal and reset form
                setShowAddPartyModal(false);
                setNewParty({
                    partyName: '',
                    partyPhone: '',
                    partyAddress: ''
                });
            } else {
                throw new Error(response.data.message || 'Failed to add party');
            }
        } catch (error) {
            alert('Error adding party: ' + (error.response?.data?.message || error.message));
            console.error('Error adding party:', error);
        } finally {
            setAddingParty(false);
        }
    };

    const handleManualPartyChange = (e) => {
        const { name, value } = e.target;
        handleChange(e);

        // When user manually enters party name, clear the partyId
        if (name === 'partyName' && formData.partyId) {
            handleChange({
                target: {
                    name: 'partyId',
                    value: ''
                }
            });
        }
    };

    const handleNewPartyChange = (e) => {
        const { name, value } = e.target;
        setNewParty(prev => ({
            ...prev,
            [name]: value
        }));
    };

    return (
        <div className="space-y-8">
            {showAddPartyModal && (
                <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
                        <div className="p-6">
                            {/* Header */}
                            <div className="flex justify-between items-center mb-6">
                                <div>
                                    <h3 className="text-xl font-bold text-gray-900 dark:text-white">Add New Party</h3>
                                    <p className="text-gray-600 dark:text-gray-300 text-sm mt-1">Enter party details</p>
                                </div>
                                <button
                                    onClick={() => setShowAddPartyModal(false)}
                                    className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-500" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                                    </svg>
                                </button>
                            </div>

                            {/* Form */}
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Party Name *
                                    </label>
                                    <input
                                        type="text"
                                        name="partyName"
                                        value={newParty.partyName}
                                        onChange={handleNewPartyChange}
                                        placeholder="Enter party name"
                                        className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                                        required
                                        autoFocus
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Phone Number
                                    </label>
                                    <input
                                        type="tel"
                                        name="partyPhone"
                                        value={newParty.partyPhone}
                                        onChange={handleNewPartyChange}
                                        placeholder="Enter phone number"
                                        className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Address
                                    </label>
                                    <textarea
                                        name="partyAddress"
                                        value={newParty.partyAddress}
                                        onChange={handleNewPartyChange}
                                        placeholder="Enter address"
                                        rows="3"
                                        className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white resize-none"
                                    />
                                </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex gap-3 mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
                                <button
                                    type="button"
                                    onClick={() => setShowAddPartyModal(false)}
                                    className="flex-1 px-4 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors font-medium"
                                    disabled={addingParty}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="button"
                                    onClick={handleAddNewParty}
                                    disabled={addingParty || !newParty.partyName.trim()}
                                    className="flex-1 px-4 py-3 bg-linear-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all font-medium disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                >
                                    {addingParty ? (
                                        <>
                                            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                            Adding...
                                        </>
                                    ) : (
                                        'Add Party'
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Booking Information */}
                <div className="bg-gray-50 dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700">
                    <h3 className="text-xl font-semibold mb-6 text-gray-800 dark:text-gray-200">Booking Information</h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Booking Date *</label>
                            <input
                                type="date"
                                name="date"
                                value={formData.date}
                                onChange={handleChange}
                                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Booking Type *</label>
                            <select
                                name="bookingType"
                                value={formData.bookingType}
                                onChange={handleChange}
                                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                                required
                            >
                                <option value="commission_only">Commission Only</option>
                                <option value="bank">Bank</option>
                                <option value="difference">Difference</option>
                                <option value="stc_truck">STC Truck</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Company *</label>
                            <div className="relative">
                                <select
                                    name="companyId"
                                    value={formData.companyId || ''}
                                    onChange={handleCompanyChange}
                                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white appearance-none"
                                    required
                                    disabled={loadingCompanies}
                                >
                                    <option value="">Select Company</option>
                                    {companies.map((company) => (
                                        <option key={company.id} value={company.id}>
                                            {company.companyName}
                                        </option>
                                    ))}
                                </select>
                                {loadingCompanies && (
                                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
                                    </div>
                                )}
                            </div>
                            {companyError && (
                                <p className="mt-1 text-sm text-red-600 dark:text-red-400">{companyError}</p>
                            )}
                            {formData.companyId && companies.length > 0 && (
                                <div className="mt-2 p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                                    {(() => {
                                        const selectedCompany = companies.find(c => c.id.toString() === formData.companyId);
                                        if (selectedCompany) {
                                            return (
                                                <>
                                                    <p className="text-xs text-gray-600 dark:text-gray-300">
                                                        <span className="font-medium">Contact:</span> {selectedCompany.personName} ({selectedCompany.phoneNumber})
                                                    </p>
                                                    {selectedCompany.gstNo && (
                                                        <p className="text-xs text-gray-600 dark:text-gray-300">
                                                            <span className="font-medium">GST:</span> {selectedCompany.gstNo}
                                                        </p>
                                                    )}
                                                </>
                                            );
                                        }
                                        return null;
                                    })()}
                                </div>
                            )}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Select Party
                            </label>
                            <div className="relative">
                                <select
                                    ref={partySelectRef}
                                    value={formData.partyId || ''}
                                    onChange={handlePartyChange}
                                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white appearance-none"
                                    disabled={loadingParties}
                                >
                                    <option value="">Select from existing parties</option>
                                    <option value="add_new" className="font-semibold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20">
                                        + Add New Party
                                    </option>
                                    <option disabled>───────────────</option>
                                    {parties.map((party) => (
                                        <option key={party.id} value={party.id}>
                                            {party.partyName} {party.partyPhone ? `(${party.partyPhone})` : ''}
                                        </option>
                                    ))}
                                </select>
                                {loadingParties && (
                                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-green-600"></div>
                                    </div>
                                )}
                            </div>
                            {partyError && (
                                <p className="mt-1 text-sm text-red-600 dark:text-red-400">{partyError}</p>
                            )}
                        </div>

                        {/* Party Name Field - Manual Entry */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Party Name {!formData.partyId && <span className="text-red-500">*</span>}
                            </label>
                            <div className="relative">
                                <input
                                    type="text"
                                    name="partyName"
                                    value={formData.partyName || ''}
                                    onChange={handleManualPartyChange}
                                    placeholder="Enter party name"
                                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                                    required={!formData.partyId}
                                />
                                {!formData.partyId && formData.partyName && (
                                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                                        <div className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                                            Manual Entry
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Party Phone Number</label>
                            <input
                                type="text"
                                name="partyPhone"
                                value={formData.partyPhone || ''}
                                onChange={handleManualPartyChange}
                                placeholder="Enter phone number"
                                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                            />
                        </div>

                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Party Address</label>
                            <textarea
                                name="partyAddress"
                                value={formData.partyAddress || ''}
                                onChange={handleManualPartyChange}
                                placeholder="Enter party address"
                                rows="2"
                                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white resize-none"
                            />
                        </div>
                    </div>
                </div>

                {/* Party Freight Details */}
                <div className="bg-gray-50 dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700">
                    <h3 className="text-xl font-semibold mb-6 text-gray-800 dark:text-gray-200">Party Freight Details</h3>

                    <div className="space-y-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Commodity *</label>
                            <input
                                type="text"
                                name="commodity"
                                value={formData.commodity}
                                onChange={handleChange}
                                placeholder="Enter commodity name"
                                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                                required
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">From Location *</label>
                                <input
                                    type="text"
                                    name="fromLocation"
                                    value={formData.fromLocation}
                                    onChange={handleChange}
                                    placeholder="Enter origin"
                                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">To Location *</label>
                                <input
                                    type="text"
                                    name="toLocation"
                                    value={formData.toLocation}
                                    onChange={handleChange}
                                    placeholder="Enter destination"
                                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                                    required
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Rate (₹) *</label>
                                <div className="relative">
                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">₹</span>
                                    <input
                                        type="number"
                                        name="rate"
                                        value={formData.rate}
                                        onChange={handleChange}
                                        step="0.01"
                                        min="0"
                                        placeholder="0.00"
                                        className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                                        required
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Weight *</label>
                                <input
                                    type="number"
                                    name="weight"
                                    value={formData.weight}
                                    onChange={handleChange}
                                    step="0.01"
                                    min="0"
                                    placeholder="0.00"
                                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Weight Type *</label>
                                <select
                                    name="weightType"
                                    value={formData.weightType}
                                    onChange={handleChange}
                                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                                    required
                                >
                                    <option value="kg">Kilograms (kg)</option>
                                    <option value="quintal">Quintal</option>
                                    <option value="ton">Ton</option>
                                </select>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Truck Details */}
            <div className="bg-gray-50 dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700">
                <h3 className="text-xl font-semibold mb-6 text-gray-800 dark:text-gray-200">Truck Details</h3>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Truck Number *</label>
                        <input
                            type="text"
                            name="truckNo"
                            value={formData.truckNo}
                            onChange={handleChange}
                            placeholder="MH12AB1234"
                            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Truck Number *</label>
                        <input
                            type="text"
                            name="tyreCount"
                            value={formData.tyreCount}
                            onChange={handleChange}
                            placeholder="18"
                            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Driver Name</label>
                        <input
                            type="text"
                            name="driverName"
                            value={formData.driverName}
                            onChange={handleChange}
                            placeholder="Enter driver name"
                            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Driver Phone</label>
                        <input
                            type="tel"
                            name="driverPhone"
                            value={formData.driverPhone}
                            onChange={handleChange}
                            placeholder="Enter phone number"
                            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Transporter Name</label>
                        <input
                            type="text"
                            name="transporterName"
                            value={formData.transporterName}
                            onChange={handleChange}
                            placeholder="Enter transporter name"
                            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Transporter Phone</label>
                        <input
                            type="tel"
                            name="transporterPhone"
                            value={formData.transporterPhone}
                            onChange={handleChange}
                            placeholder="98765xxxxx"
                            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                        />
                    </div>
                </div>

                {/* Commission Fields */}
                <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Commission from Truck Owner/Driver (₹)
                        </label>
                        <div className="relative">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">₹</span>
                            <input
                                type="number"
                                name="truckCommissionAmount"
                                value={formData.truckCommissionAmount || ''}
                                onChange={(e) => {
                                    handleChange(e);
                                    // Auto-fill commission amount when truck commission is entered and type is truck
                                    if (formData.commissionType === 'truck') {
                                        handleChange({
                                            target: {
                                                name: 'commissionAmount',
                                                value: e.target.value
                                            }
                                        });
                                    }
                                }}
                                step="0.01"
                                min="0"
                                placeholder="0.00"
                                className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Commission Type
                        </label>
                        <select
                            name="commissionType"
                            value={formData.commissionType || ''}
                            onChange={(e) => {
                                handleChange(e);
                                // Clear or set commission amount based on type
                                if (e.target.value === 'truck' && formData.truckCommissionAmount) {
                                    handleChange({
                                        target: {
                                            name: 'commissionAmount',
                                            value: formData.truckCommissionAmount
                                        }
                                    });
                                } else if (e.target.value === 'party' && formData.commissionPercentage && formData.rate && formData.weight) {
                                    const calculatedCommission = calculateCommissionFromPercentage();
                                    handleChange({
                                        target: {
                                            name: 'commissionAmount',
                                            value: calculatedCommission.toFixed(2)
                                        }
                                    });
                                } else if (!e.target.value || e.target.value === 'free') {
                                    handleChange({
                                        target: {
                                            name: 'commissionAmount',
                                            value: ''
                                        }
                                    });
                                }
                            }}
                            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                        >
                            <option value="">Select Source</option>
                            <option value="truck">From Truck Owner/Driver</option>
                            <option value="party">From Party</option>
                            <option value="bank">Bank / Other</option>
                            <option value="free">Free / No Commission</option>
                        </select>
                    </div>
                </div>

                {/* Commission Percentage Field */}
                <div className="mt-4">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Commission Percentage (%)
                    </label>
                    <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">%</span>
                        <input
                            type="number"
                            name="commissionPercentage"
                            value={formData.commissionPercentage || ''}
                            onChange={(e) => {
                                handleChange(e);
                                // Auto-calculate commission amount from percentage when type is party
                                if (e.target.value && formData.rate && formData.weight && formData.commissionType === 'party') {
                                    const calculatedCommission = calculateCommissionFromPercentage();
                                    handleChange({
                                        target: {
                                            name: 'commissionAmount',
                                            value: calculatedCommission.toFixed(2)
                                        }
                                    });
                                }
                            }}
                            step="0.01"
                            min="0"
                            max="100"
                            placeholder="0.00"
                            className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                        />
                    </div>
                    {formData.commissionType === 'party' && formData.commissionPercentage && formData.rate && formData.weight && (
                        <p className="mt-1 text-sm text-green-600 dark:text-green-400">
                            Will auto-fill: ₹{calculateCommissionFromPercentage().toFixed(2)}
                        </p>
                    )}
                </div>

                {/* Truck Freight Details */}
                <div className="mt-8">
                    <h4 className="text-lg font-semibold mb-4 text-gray-800 dark:text-gray-200">Truck Freight Details</h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Truck Rate (₹)</label>
                            <div className="relative">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">₹</span>
                                <input
                                    type="number"
                                    name="truckRate"
                                    value={formData.truckRate}
                                    onChange={handleChange}
                                    step="0.01"
                                    min="0"
                                    placeholder="0.00"
                                    className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                                />
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Truck Weight</label>
                            <input
                                type="number"
                                name="truckWeight"
                                value={formData.truckWeight}
                                onChange={handleChange}
                                step="0.01"
                                min="0"
                                placeholder="0.00"
                                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Weight Type</label>
                            <select
                                name="truckWeightType"
                                value={formData.truckWeightType}
                                onChange={handleChange}
                                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                            >
                                <option value="kg">Kilograms (kg)</option>
                                <option value="quintal">Quintal</option>
                                <option value="ton">Ton</option>
                            </select>
                        </div>
                    </div>

                    {/* Calculation Button */}
                    <div className="mt-8 flex justify-center">
                        <button
                            type="button"
                            onClick={handleCalculate}
                            disabled={!formData.rate || !formData.weight || !formData.truckRate || !formData.truckWeight}
                            className="px-8 py-4 bg-linear-to-r from-green-600 to-emerald-600 text-white rounded-xl font-medium hover:from-green-700 hover:to-emerald-700 transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 011.167.534 7.002 7.002 0 001.667 1.667 7.002 7.002 0 00.534 1.167L17 11a1 1 0 010 2l-2.101.667a7.002 7.002 0 00-.534 1.167 7.002 7.002 0 00-1.667 1.667 7.002 7.002 0 00-1.167.534L11 17a1 1 0 01-2 0l-.667-2.101a7.002 7.002 0 00-1.167-.534 7.002 7.002 0 00-1.667-1.667 7.002 7.002 0 00-.534-1.167L3 13a1 1 0 010-2l2.101-.667a7.002 7.002 0 00.534-1.167 7.002 7.002 0 001.667-1.667 7.002 7.002 0 001.167-.534L9 5a1 1 0 012 0l.667 2.101a7.002 7.002 0 001.167.534 7.002 7.002 0 001.667 1.667 7.002 7.002 0 00.534 1.167L17 9a1 1 0 010 2l-2.101.667a7.002 7.002 0 00-.534 1.167 7.002 7.002 0 00-1.667 1.667 7.002 7.002 0 00-1.167.534L11 15a1 1 0 01-2 0l-.667-2.101a7.002 7.002 0 00-1.167-.534 7.002 7.002 0 00-1.667-1.667 7.002 7.002 0 00-.534-1.167L3 11a1 1 0 010-2l2.101-.667a7.002 7.002 0 00.534-1.167 7.002 7.002 0 001.667-1.667 7.002 7.002 0 001.167-.534L9 3a1 1 0 012 0v2.101a7.002 7.002 0 011.167-.534 7.002 7.002 0 011.167-.534L11 3z" clipRule="evenodd" />
                            </svg>
                            Calculate Amounts
                        </button>
                    </div>

                    {/* Quick Summary */}
                    {calculations.partyFreight > 0 && (
                        <div className="mt-8 p-6 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
                            <h4 className="text-lg font-semibold mb-4 text-gray-800 dark:text-gray-200">Calculated Amounts</h4>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                                <div className="bg-blue-50 dark:bg-blue-900/30 p-4 rounded-lg">
                                    <p className="text-sm text-blue-700 dark:text-blue-300">Party Freight</p>
                                    <p className="text-2xl font-bold text-blue-800 dark:text-blue-200">₹{calculations.partyFreight.toFixed(2)}</p>
                                </div>
                                <div className="bg-emerald-50 dark:bg-emerald-900/30 p-4 rounded-lg">
                                    <p className="text-sm text-emerald-700 dark:text-emerald-300">Truck Freight</p>
                                    <p className="text-2xl font-bold text-emerald-800 dark:text-emerald-200">₹{calculations.truckFreight.toFixed(2)}</p>
                                </div>
                                <div className={`p-4 rounded-lg ${calculations.differenceAmount >= 0 ? 'bg-green-50 dark:bg-green-900/30' : 'bg-red-50 dark:bg-red-900/30'}`}>
                                    <p className="text-sm text-gray-700 dark:text-gray-300">Difference (Auto-filled)</p>
                                    <p className={`text-2xl font-bold ${calculations.differenceAmount >= 0 ? 'text-green-800 dark:text-green-200' : 'text-red-800 dark:text-red-200'}`}>
                                        {calculations.rawDifference >= 0 ? '+' : ''}₹{Math.abs(calculations.rawDifference).toFixed(2)}
                                    </p>
                                </div>
                            </div>
                            {formData.commissionAmount && (
                                <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-6">
                                    <div className="bg-purple-50 dark:bg-purple-900/30 p-4 rounded-lg">
                                        <p className="text-sm text-purple-700 dark:text-purple-300">
                                            Commission {formData.commissionType === 'truck' ? '(Truck)' : '(Party)'}
                                        </p>
                                        <p className="text-2xl font-bold text-purple-800 dark:text-purple-200">
                                            ₹{calculations.commissionAmount.toFixed(2)}
                                        </p>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Step1BookingAndTruck;