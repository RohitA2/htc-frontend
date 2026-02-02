// src/components/ChallanModal.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { toast } from 'react-toastify';

const ChallanModal = ({ isOpen, onClose, onSuccess, challanData, isEditMode = false }) => {
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    challanNo: '',
    date: new Date().toISOString().split('T')[0],
    truckNo: '',
    driverName: '',
    driverMobileNo: '',
    ownerMobileNo: '',
    aadharCardNumber: '',
    panCardNumber: '',
    acHolderName: '',
    accountNo: '',
    ifscCode: '',
    bankName: '',
    branch: '',
    linkAc: '',
    guarantorName1: '',
    guarantorAddress1: '',
    guarantorMobile1: '',
    guarantorName2: '',
    guarantorAddress2: '',
    guarantorMobile2: '',
    partyName: '',
    lastLoadingFrom: '',
    lastUnloadingTo: '',
    preparedBy: '',
  });

  const [files, setFiles] = useState({
    registrationCard: null,
    gadiPhoto: null,
    insuranceCopy: null,
    driverLicence: null,
    driverPhoto: null,
    aadharCardFile: null,
    panCardFile: null,
    tdsCertificate: null,
    bankPassbookOrCancelCheque: null,
  });

  const [fileDisplayNames, setFileDisplayNames] = useState({});
  const [errors, setErrors] = useState({});

  const API_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

  // Required fields based on your backend model
  const requiredTextFields = ['challanNo', 'date', 'truckNo', 'driverName', 'driverMobileNo'];
  const requiredFileFields = isEditMode ? [] : ['registrationCard', 'gadiPhoto', 'driverLicence'];

  // Load data if in edit mode
  useEffect(() => {
    if (isEditMode && challanData) {
      setFormData({
        challanNo: challanData.challanNo || '',
        date: challanData.date || new Date().toISOString().split('T')[0],
        truckNo: challanData.truckNo || '',
        driverName: challanData.driverName || '',
        driverMobileNo: challanData.driverMobileNo || '',
        ownerMobileNo: challanData.ownerMobileNo || '',
        aadharCardNumber: challanData.aadharCardNumber || '',
        panCardNumber: challanData.panCardNumber || '',
        acHolderName: challanData.acHolderName || '',
        accountNo: challanData.accountNo || '',
        ifscCode: challanData.ifscCode || '',
        bankName: challanData.bankName || '',
        branch: challanData.branch || '',
        linkAc: challanData.linkAc || '',
        guarantorName1: challanData.guarantorName1 || '',
        guarantorAddress1: challanData.guarantorAddress1 || '',
        guarantorMobile1: challanData.guarantorMobile1 || '',
        guarantorName2: challanData.guarantorName2 || '',
        guarantorAddress2: challanData.guarantorAddress2 || '',
        guarantorMobile2: challanData.guarantorMobile2 || '',
        partyName: challanData.partyName || '',
        lastLoadingFrom: challanData.lastLoadingFrom || '',
        lastUnloadingTo: challanData.lastUnloadingTo || '',
        preparedBy: challanData.preparedBy || '',
      });

      // Set existing file names for display
      const fileDisplay = {};
      if (challanData.registrationCard) fileDisplay.registrationCard = 'Already uploaded';
      if (challanData.gadiPhoto) fileDisplay.gadiPhoto = 'Already uploaded';
      if (challanData.insuranceCopy) fileDisplay.insuranceCopy = 'Already uploaded';
      if (challanData.driverLicence) fileDisplay.driverLicence = 'Already uploaded';
      if (challanData.driverPhoto) fileDisplay.driverPhoto = 'Already uploaded';
      if (challanData.aadharCardFile) fileDisplay.aadharCardFile = 'Already uploaded';
      if (challanData.panCardFile) fileDisplay.panCardFile = 'Already uploaded';
      if (challanData.tdsCertificate) fileDisplay.tdsCertificate = 'Already uploaded';
      if (challanData.bankPassbookOrCancelCheque) fileDisplay.bankPassbookOrCancelCheque = 'Already uploaded';
      
      setFileDisplayNames(fileDisplay);
    }
  }, [isEditMode, challanData]);

  const validateForm = () => {
    const newErrors = {};

    // Validate text fields
    requiredTextFields.forEach((field) => {
      if (!formData[field]?.trim()) {
        newErrors[field] = true;
      }
    });

    // Validate file fields (only for create mode)
    if (!isEditMode) {
      requiredFileFields.forEach((field) => {
        if (!files[field]) {
          newErrors[field] = true;
        }
      });
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleTextChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    // Clear error when user types
    if (errors[name]) {
      setErrors((prev) => {
        const updated = { ...prev };
        delete updated[name];
        return updated;
      });
    }
  };

  const handleFileChange = (e, field) => {
    const file = e.target.files?.[0];
    if (file) {
      setFiles((prev) => ({ ...prev, [field]: file }));
      setFileDisplayNames((prev) => ({ ...prev, [field]: file.name }));

      // Clear error
      if (errors[field]) {
        setErrors((prev) => {
          const updated = { ...prev };
          delete updated[field];
          return updated;
        });
      }
    }
  };

  const resetForm = () => {
    setFormData({
      challanNo: '',
      date: new Date().toISOString().split('T')[0],
      truckNo: '',
      driverName: '',
      driverMobileNo: '',
      ownerMobileNo: '',
      aadharCardNumber: '',
      panCardNumber: '',
      acHolderName: '',
      accountNo: '',
      ifscCode: '',
      bankName: '',
      branch: '',
      linkAc: '',
      guarantorName1: '',
      guarantorAddress1: '',
      guarantorMobile1: '',
      guarantorName2: '',
      guarantorAddress2: '',
      guarantorMobile2: '',
      partyName: '',
      lastLoadingFrom: '',
      lastUnloadingTo: '',
      preparedBy: '',
    });
    setFiles({
      registrationCard: null,
      gadiPhoto: null,
      insuranceCopy: null,
      driverLicence: null,
      driverPhoto: null,
      aadharCardFile: null,
      panCardFile: null,
      tdsCertificate: null,
      bankPassbookOrCancelCheque: null,
    });
    setFileDisplayNames({});
    setErrors({});
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      toast.error('Please fill all required fields', {
        position: 'top-right',
        autoClose: 4000,
      });
      return;
    }

    setLoading(true);

    const payload = new FormData();

    // Append text fields
    Object.entries(formData).forEach(([key, value]) => {
      if (value !== '' && value !== null && value !== undefined) {
        payload.append(key, value);
      }
    });

    // Append files
    Object.entries(files).forEach(([key, file]) => {
      if (file) {
        payload.append(key, file);
      }
    });

    try {
      let response;
      
      if (isEditMode && challanData) {
        // Update existing challan
        response = await axios.put(`${API_URL}/challans/${challanData.id}`, payload, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });
      } else {
        // Create new challan
        response = await axios.post(`${API_URL}/challans`, payload, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });
      }

      if (response.data.success) {
        const successMessage = isEditMode 
          ? 'Challan updated successfully!' 
          : 'Challan created successfully!';
        
        toast.success(successMessage, {
          position: 'top-right',
          autoClose: 3000,
        });

        resetForm();
        
        if (onSuccess) {
          onSuccess();
        }

        setTimeout(() => {
          onClose();
        }, 1200);
      } else {
        throw new Error(response.data.message || 'Failed to save challan');
      }
    } catch (error) {
      const errorMsg =
        error?.response?.data?.message ||
        error.message ||
        'Something went wrong. Please try again.';
      toast.error(errorMsg, {
        position: 'top-right',
        autoClose: 5000,
      });
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white w-full max-w-6xl max-h-[92vh] rounded shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="bg-blue-900 text-white px-6 py-3 flex justify-between items-center">
          <h2 className="text-xl font-bold">
            {isEditMode ? 'Edit Challan' : 'Create New Challan'}
          </h2>
          <button
            onClick={onClose}
            disabled={loading}
            className="hover:text-gray-200 transition-colors disabled:opacity-50"
          >
            <XMarkIcon className="h-7 w-7" />
          </button>
        </div>

        {/* Scrollable Table Form */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6">
          <table className="w-full border-collapse text-sm">
            <tbody>
              {/* Row 1 - Challan No + Date */}
              <tr className="border-b">
                <td className="bg-gray-100 font-bold p-3 w-1/4 border-r">CHALLAN NO. *</td>
                <td className="p-3 border-r">
                  <input
                    type="text"
                    name="challanNo"
                    value={formData.challanNo}
                    onChange={handleTextChange}
                    className={`w-full p-2 border ${errors.challanNo ? 'border-red-500' : 'border-gray-300'} rounded focus:outline-none focus:ring-1 focus:ring-blue-500`}
                    placeholder="Enter challan number"
                    disabled={isEditMode}
                  />
                </td>
                <td className="bg-gray-100 font-bold p-3 w-1/4 border-r">DATE *</td>
                <td className="p-3">
                  <input
                    type="date"
                    name="date"
                    value={formData.date}
                    onChange={handleTextChange}
                    className={`w-full p-2 border ${errors.date ? 'border-red-500' : 'border-gray-300'} rounded focus:outline-none focus:ring-1 focus:ring-blue-500`}
                  />
                </td>
              </tr>

              {/* Row 2 - Truck No + Registration Card */}
              <tr className="border-b">
                <td className="bg-gray-100 font-bold p-3 border-r">TRUCK NO. *</td>
                <td className="p-3 border-r">
                  <input
                    type="text"
                    name="truckNo"
                    value={formData.truckNo}
                    onChange={handleTextChange}
                    className={`w-full p-2 border ${errors.truckNo ? 'border-red-500' : 'border-gray-300'} rounded focus:outline-none focus:ring-1 focus:ring-blue-500`}
                    placeholder="Enter truck number"
                  />
                </td>
                <td className="bg-gray-100 font-bold p-3 border-r">REGISTRATION CARD {!isEditMode && '*'}</td>
                <td className="p-3">
                  <label className="flex items-center cursor-pointer w-full">
                    <span className={`px-4 py-2 bg-gray-100 border ${errors.registrationCard ? 'border-red-500 text-red-600' : 'border-gray-300'} rounded-l font-medium hover:bg-gray-200 transition-colors`}>
                      Choose File
                    </span>
                    <span className="px-4 py-2 bg-white border border-l-0 border-gray-300 rounded-r flex-1 truncate text-gray-700">
                      {fileDisplayNames.registrationCard || 'No file chosen'}
                    </span>
                    <input
                      type="file"
                      accept="image/*,.pdf"
                      className="hidden"
                      onChange={(e) => handleFileChange(e, 'registrationCard')}
                    />
                  </label>
                  {isEditMode && fileDisplayNames.registrationCard && (
                    <p className="text-xs text-gray-500 mt-1">Leave empty to keep existing file</p>
                  )}
                </td>
              </tr>

              {/* Row 3 - Gadi Photo + Insurance Copy */}
              <tr className="border-b">
                <td className="bg-gray-100 font-bold p-3 border-r">GADI PHOTO {!isEditMode && '*'}</td>
                <td className="p-3 border-r">
                  <label className="flex items-center cursor-pointer w-full">
                    <span className={`px-4 py-2 bg-gray-100 border ${errors.gadiPhoto ? 'border-red-500 text-red-600' : 'border-gray-300'} rounded-l font-medium hover:bg-gray-200 transition-colors`}>
                      Choose File
                    </span>
                    <span className="px-4 py-2 bg-white border border-l-0 border-gray-300 rounded-r flex-1 truncate text-gray-700">
                      {fileDisplayNames.gadiPhoto || 'No file chosen'}
                    </span>
                    <input type="file" accept="image/*" className="hidden" onChange={(e) => handleFileChange(e, 'gadiPhoto')} />
                  </label>
                  {isEditMode && fileDisplayNames.gadiPhoto && (
                    <p className="text-xs text-gray-500 mt-1">Leave empty to keep existing file</p>
                  )}
                </td>
                <td className="bg-gray-100 font-bold p-3 border-r">INSURANCE COPY</td>
                <td className="p-3">
                  <label className="flex items-center cursor-pointer w-full">
                    <span className="px-4 py-2 bg-gray-100 border border-gray-300 rounded-l font-medium hover:bg-gray-200 transition-colors">
                      Choose File
                    </span>
                    <span className="px-4 py-2 bg-white border border-l-0 border-gray-300 rounded-r flex-1 truncate text-gray-700">
                      {fileDisplayNames.insuranceCopy || 'No file chosen'}
                    </span>
                    <input type="file" accept="image/*,.pdf" className="hidden" onChange={(e) => handleFileChange(e, 'insuranceCopy')} />
                  </label>
                  {isEditMode && fileDisplayNames.insuranceCopy && (
                    <p className="text-xs text-gray-500 mt-1">Leave empty to keep existing file</p>
                  )}
                </td>
              </tr>

              {/* Row 4 - Driver Licence + Driver Name */}
              <tr className="border-b">
                <td className="bg-gray-100 font-bold p-3 border-r">DRIVER LICENCE {!isEditMode && '*'}</td>
                <td className="p-3 border-r">
                  <label className="flex items-center cursor-pointer w-full">
                    <span className={`px-4 py-2 bg-gray-100 border ${errors.driverLicence ? 'border-red-500 text-red-600' : 'border-gray-300'} rounded-l font-medium hover:bg-gray-200 transition-colors`}>
                      Choose File
                    </span>
                    <span className="px-4 py-2 bg-white border border-l-0 border-gray-300 rounded-r flex-1 truncate text-gray-700">
                      {fileDisplayNames.driverLicence || 'No file chosen'}
                    </span>
                    <input type="file" accept="image/*,.pdf" className="hidden" onChange={(e) => handleFileChange(e, 'driverLicence')} />
                  </label>
                  {isEditMode && fileDisplayNames.driverLicence && (
                    <p className="text-xs text-gray-500 mt-1">Leave empty to keep existing file</p>
                  )}
                </td>
                <td className="bg-gray-100 font-bold p-3 border-r">DRIVER NAME *</td>
                <td className="p-3">
                  <input
                    type="text"
                    name="driverName"
                    value={formData.driverName}
                    onChange={handleTextChange}
                    className={`w-full p-2 border ${errors.driverName ? 'border-red-500' : 'border-gray-300'} rounded focus:outline-none focus:ring-1 focus:ring-blue-500`}
                    placeholder="Enter driver name"
                  />
                </td>
              </tr>

              {/* Row 5 - Driver Photo + Driver Mobile No */}
              <tr className="border-b">
                <td className="bg-gray-100 font-bold p-3 border-r">DRIVER PHOTO</td>
                <td className="p-3 border-r">
                  <label className="flex items-center cursor-pointer w-full">
                    <span className="px-4 py-2 bg-gray-100 border border-gray-300 rounded-l font-medium hover:bg-gray-200 transition-colors">
                      Choose File
                    </span>
                    <span className="px-4 py-2 bg-white border border-l-0 border-gray-300 rounded-r flex-1 truncate text-gray-700">
                      {fileDisplayNames.driverPhoto || 'No file chosen'}
                    </span>
                    <input type="file" accept="image/*" className="hidden" onChange={(e) => handleFileChange(e, 'driverPhoto')} />
                  </label>
                  {isEditMode && fileDisplayNames.driverPhoto && (
                    <p className="text-xs text-gray-500 mt-1">Leave empty to keep existing file</p>
                  )}
                </td>
                <td className="bg-gray-100 font-bold p-3 border-r">DRIVER MOBILE NO. *</td>
                <td className="p-3">
                  <input
                    type="text"
                    name="driverMobileNo"
                    value={formData.driverMobileNo}
                    onChange={handleTextChange}
                    className={`w-full p-2 border ${errors.driverMobileNo ? 'border-red-500' : 'border-gray-300'} rounded focus:outline-none focus:ring-1 focus:ring-blue-500`}
                    placeholder="Enter driver mobile number"
                  />
                </td>
              </tr>

              {/* Row 6 - Owner Mobile No + Aadhar Number */}
              <tr className="border-b">
                <td className="bg-gray-100 font-bold p-3 border-r">OWNER MOB. NO.</td>
                <td className="p-3 border-r">
                  <input
                    type="text"
                    name="ownerMobileNo"
                    value={formData.ownerMobileNo}
                    onChange={handleTextChange}
                    className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                    placeholder="Enter owner mobile number"
                  />
                </td>
                <td className="bg-gray-100 font-bold p-3 border-r">AADHAR CARD NUMBER</td>
                <td className="p-3">
                  <input
                    type="text"
                    name="aadharCardNumber"
                    value={formData.aadharCardNumber}
                    onChange={handleTextChange}
                    className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                    placeholder="Enter Aadhar number"
                  />
                </td>
              </tr>

              {/* Row 7 - Aadhar File + PAN Number */}
              <tr className="border-b">
                <td className="bg-gray-100 font-bold p-3 border-r">AADHAR CARD</td>
                <td className="p-3 border-r">
                  <label className="flex items-center cursor-pointer w-full">
                    <span className="px-4 py-2 bg-gray-100 border border-gray-300 rounded-l font-medium hover:bg-gray-200 transition-colors">
                      Choose File
                    </span>
                    <span className="px-4 py-2 bg-white border border-l-0 border-gray-300 rounded-r flex-1 truncate text-gray-700">
                      {fileDisplayNames.aadharCardFile || 'No file chosen'}
                    </span>
                    <input type="file" accept="image/*,.pdf" className="hidden" onChange={(e) => handleFileChange(e, 'aadharCardFile')} />
                  </label>
                  {isEditMode && fileDisplayNames.aadharCardFile && (
                    <p className="text-xs text-gray-500 mt-1">Leave empty to keep existing file</p>
                  )}
                </td>
                <td className="bg-gray-100 font-bold p-3 border-r">PAN CARD NUMBER</td>
                <td className="p-3">
                  <input
                    type="text"
                    name="panCardNumber"
                    value={formData.panCardNumber}
                    onChange={handleTextChange}
                    className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                    placeholder="Enter PAN number"
                  />
                </td>
              </tr>

              {/* Row 8 - PAN File + TDS Certificate */}
              <tr className="border-b">
                <td className="bg-gray-100 font-bold p-3 border-r">PAN CARD</td>
                <td className="p-3 border-r">
                  <label className="flex items-center cursor-pointer w-full">
                    <span className="px-4 py-2 bg-gray-100 border border-gray-300 rounded-l font-medium hover:bg-gray-200 transition-colors">
                      Choose File
                    </span>
                    <span className="px-4 py-2 bg-white border border-l-0 border-gray-300 rounded-r flex-1 truncate text-gray-700">
                      {fileDisplayNames.panCardFile || 'No file chosen'}
                    </span>
                    <input type="file" accept="image/*,.pdf" className="hidden" onChange={(e) => handleFileChange(e, 'panCardFile')} />
                  </label>
                  {isEditMode && fileDisplayNames.panCardFile && (
                    <p className="text-xs text-gray-500 mt-1">Leave empty to keep existing file</p>
                  )}
                </td>
                <td className="bg-gray-100 font-bold p-3 border-r">TDS CERTIFICATE</td>
                <td className="p-3">
                  <label className="flex items-center cursor-pointer w-full">
                    <span className="px-4 py-2 bg-gray-100 border border-gray-300 rounded-l font-medium hover:bg-gray-200 transition-colors">
                      Choose File
                    </span>
                    <span className="px-4 py-2 bg-white border border-l-0 border-gray-300 rounded-r flex-1 truncate text-gray-700">
                      {fileDisplayNames.tdsCertificate || 'No file chosen'}
                    </span>
                    <input type="file" accept="image/*,.pdf" className="hidden" onChange={(e) => handleFileChange(e, 'tdsCertificate')} />
                  </label>
                  {isEditMode && fileDisplayNames.tdsCertificate && (
                    <p className="text-xs text-gray-500 mt-1">Leave empty to keep existing file</p>
                  )}
                </td>
              </tr>

              {/* Row 9 - Bank Passbook + AC Holder Name */}
              <tr className="border-b">
                <td className="bg-gray-100 font-bold p-3 border-r">BANK P.B / CANCEL CH.</td>
                <td className="p-3 border-r">
                  <label className="flex items-center cursor-pointer w-full">
                    <span className="px-4 py-2 bg-gray-100 border border-gray-300 rounded-l font-medium hover:bg-gray-200 transition-colors">
                      Choose File
                    </span>
                    <span className="px-4 py-2 bg-white border border-l-0 border-gray-300 rounded-r flex-1 truncate text-gray-700">
                      {fileDisplayNames.bankPassbookOrCancelCheque || 'No file chosen'}
                    </span>
                    <input type="file" accept="image/*,.pdf" className="hidden" onChange={(e) => handleFileChange(e, 'bankPassbookOrCancelCheque')} />
                  </label>
                  {isEditMode && fileDisplayNames.bankPassbookOrCancelCheque && (
                    <p className="text-xs text-gray-500 mt-1">Leave empty to keep existing file</p>
                  )}
                </td>
                <td className="bg-gray-100 font-bold p-3 border-r">AC HOLDER NAME</td>
                <td className="p-3">
                  <input 
                    type="text" 
                    name="acHolderName" 
                    value={formData.acHolderName} 
                    onChange={handleTextChange} 
                    className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                    placeholder="Enter account holder name"
                  />
                </td>
              </tr>

              {/* Row 10 - Account No + IFSC Code */}
              <tr className="border-b">
                <td className="bg-gray-100 font-bold p-3 border-r">ACCOUNT NO.</td>
                <td className="p-3 border-r">
                  <input 
                    type="text" 
                    name="accountNo" 
                    value={formData.accountNo} 
                    onChange={handleTextChange} 
                    className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                    placeholder="Enter account number"
                  />
                </td>
                <td className="bg-gray-100 font-bold p-3 border-r">IFSC CODE</td>
                <td className="p-3">
                  <input 
                    type="text" 
                    name="ifscCode" 
                    value={formData.ifscCode} 
                    onChange={handleTextChange} 
                    className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                    placeholder="Enter IFSC code"
                  />
                </td>
              </tr>

              {/* Row 11 - Bank Name + Branch */}
              <tr className="border-b">
                <td className="bg-gray-100 font-bold p-3 border-r">BANK NAME</td>
                <td className="p-3 border-r">
                  <input 
                    type="text" 
                    name="bankName" 
                    value={formData.bankName} 
                    onChange={handleTextChange} 
                    className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                    placeholder="Enter bank name"
                  />
                </td>
                <td className="bg-gray-100 font-bold p-3 border-r">BRANCH</td>
                <td className="p-3">
                  <input 
                    type="text" 
                    name="branch" 
                    value={formData.branch} 
                    onChange={handleTextChange} 
                    className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                    placeholder="Enter branch"
                  />
                </td>
              </tr>

              {/* Row 12 - Linked Account + Party Name */}
              <tr className="border-b">
                <td className="bg-gray-100 font-bold p-3 border-r">LINK AC</td>
                <td className="p-3 border-r">
                  <input 
                    type="text" 
                    name="linkAc" 
                    value={formData.linkAc} 
                    onChange={handleTextChange} 
                    className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                    placeholder="Enter linked account"
                  />
                </td>
                <td className="bg-gray-100 font-bold p-3 border-r">PARTY NAME</td>
                <td className="p-3">
                  <input 
                    type="text" 
                    name="partyName" 
                    value={formData.partyName} 
                    onChange={handleTextChange} 
                    className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                    placeholder="Enter party name"
                  />
                </td>
              </tr>

              {/* Guarantor 1 */}
              <tr className="border-b">
                <td className="bg-gray-100 font-bold p-3 border-r">GUARANTOR NAME (1)</td>
                <td className="p-3 border-r">
                  <input 
                    type="text" 
                    name="guarantorName1" 
                    value={formData.guarantorName1} 
                    onChange={handleTextChange} 
                    className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                    placeholder="Enter guarantor name"
                  />
                </td>
                <td className="bg-gray-100 font-bold p-3 border-r">GUARANTOR NAME (2)</td>
                <td className="p-3">
                  <input 
                    type="text" 
                    name="guarantorName2" 
                    value={formData.guarantorName2} 
                    onChange={handleTextChange} 
                    className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                    placeholder="Enter guarantor name"
                  />
                </td>
              </tr>

              <tr className="border-b">
                <td className="bg-gray-100 font-bold p-3 border-r">ADDRESS (1)</td>
                <td className="p-3 border-r">
                  <textarea
                    name="guarantorAddress1"
                    value={formData.guarantorAddress1}
                    onChange={handleTextChange}
                    rows={2}
                    className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                    placeholder="Enter address"
                  />
                </td>
                <td className="bg-gray-100 font-bold p-3 border-r">ADDRESS (2)</td>
                <td className="p-3">
                  <textarea
                    name="guarantorAddress2"
                    value={formData.guarantorAddress2}
                    onChange={handleTextChange}
                    rows={2}
                    className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                    placeholder="Enter address"
                  />
                </td>
              </tr>

              <tr className="border-b">
                <td className="bg-gray-100 font-bold p-3 border-r">MOBILE NO. (1)</td>
                <td className="p-3 border-r">
                  <input 
                    type="text" 
                    name="guarantorMobile1" 
                    value={formData.guarantorMobile1} 
                    onChange={handleTextChange} 
                    className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                    placeholder="Enter mobile number"
                  />
                </td>
                <td className="bg-gray-100 font-bold p-3 border-r">MOBILE NO. (2)</td>
                <td className="p-3">
                  <input 
                    type="text" 
                    name="guarantorMobile2" 
                    value={formData.guarantorMobile2} 
                    onChange={handleTextChange} 
                    className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                    placeholder="Enter mobile number"
                  />
                </td>
              </tr>

              {/* Last Loading/Unloading */}
              <tr className="border-b">
                <td className="bg-gray-100 font-bold p-3 border-r">LAST LOADING FROM</td>
                <td className="p-3 border-r">
                  <input 
                    type="text" 
                    name="lastLoadingFrom" 
                    value={formData.lastLoadingFrom} 
                    onChange={handleTextChange} 
                    className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                    placeholder="Enter loading location"
                  />
                </td>
                <td className="bg-gray-100 font-bold p-3 border-r">LAST UNLOADING TO</td>
                <td className="p-3">
                  <input 
                    type="text" 
                    name="lastUnloadingTo" 
                    value={formData.lastUnloadingTo} 
                    onChange={handleTextChange} 
                    className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                    placeholder="Enter unloading location"
                  />
                </td>
              </tr>

              {/* Prepared By */}
              <tr className="border-b">
                <td className="bg-gray-100 font-bold p-3 border-r">PREPARED BY</td>
                <td className="p-3" colSpan={3}>
                  <input 
                    type="text" 
                    name="preparedBy" 
                    value={formData.preparedBy} 
                    onChange={handleTextChange} 
                    className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                    placeholder="Enter prepared by"
                  />
                </td>
              </tr>
            </tbody>
          </table>
          
          {/* Required fields note */}
          <div className="mt-4 text-sm text-gray-600">
            <p className="text-red-500">* Required fields must be filled</p>
            {isEditMode && (
              <p className="text-blue-500 mt-1">For files: Leave empty to keep existing files</p>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="bg-gray-50 px-6 py-4 flex justify-end border-t">
          <button
            onClick={handleSubmit}
            disabled={loading}
            className={`px-10 py-3 rounded font-semibold text-white ${loading
              ? 'bg-blue-400 cursor-not-allowed'
              : 'bg-blue-700 hover:bg-blue-800'
              } transition-colors flex items-center`}
          >
            {loading ? (
              <>
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                {isEditMode ? 'Updating...' : 'Saving...'}
              </>
            ) : (
              isEditMode ? 'Update Challan' : 'Create Challan'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChallanModal;