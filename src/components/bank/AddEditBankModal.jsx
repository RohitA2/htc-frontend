// AddEditBankModal.jsx
import React, { useState, useEffect } from 'react';
import {
  X,
  Save,
  User,
  CreditCard,
  MapPin,
  Hash,
  Building,
  Star,
  AlertCircle,
  Shield,
} from 'lucide-react';

// InputField Component (stable - बाहर define किया)
const InputField = ({
  label,
  name,
  icon: Icon,
  type = 'text',
  placeholder,
  required = false,
  value,
  onChange,
  error,
}) => (
  <div className="space-y-2">
    <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
      <Icon className="w-4 h-4" />
      {label}
      {required && <span className="text-red-500">*</span>}
    </label>
    <input
      type={type}
      name={name}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all ${
        error ? 'border-red-300 bg-red-50/50' : 'border-blue-200'
      }`}
    />
    {error && (
      <p className="text-sm text-red-600 flex items-center gap-1">
        <AlertCircle className="w-4 h-4" />
        {error}
      </p>
    )}
  </div>
);

const AddEditBankModal = ({ bank, companies, onClose, onSave }) => {
  const isEditMode = !!bank;

  const [formData, setFormData] = useState({
    acHolderName: '',
    accountNo: '',
    branchName: '',
    IFSCode: '',
    isPrimary: false,
    companyId: '',
    status: 'Active',
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  // बैंक डेटा लोड होने पर form भरना
  useEffect(() => {
    if (bank) {
      setFormData({
        acHolderName: bank.acHolderName || '',
        accountNo: bank.accountNo || '',
        branchName: bank.branchName || '',
        IFSCode: bank.IFSCode || '',
        isPrimary: bank.isPrimary || false,
        companyId: bank.companyId || '',
        status: bank.status || 'Active',
      });
    }
  }, [bank]);

  // Modal behavior: Escape key + body scroll lock
  useEffect(() => {
    const handleEscapeKey = (event) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscapeKey);
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', handleEscapeKey);
      document.body.style.overflow = 'auto';
    };
  }, [onClose]);

  const validateForm = () => {
    const newErrors = {};

    if (!formData.acHolderName.trim()) newErrors.acHolderName = 'Account holder name is required';
    if (!formData.accountNo.trim()) newErrors.accountNo = 'Account number is required';
    else if (!/^\d{9,18}$/.test(formData.accountNo))
      newErrors.accountNo = 'Account number must be 9-18 digits';

    if (!formData.branchName.trim()) newErrors.branchName = 'Branch name is required';
    if (!formData.IFSCode.trim()) newErrors.IFSCode = 'IFSC code is required';
    else if (!/^[A-Z]{4}0[A-Z0-9]{6}$/.test(formData.IFSCode))
      newErrors.IFSCode = 'Invalid IFSC code format';

    if (!formData.companyId) newErrors.companyId = 'Company selection is required';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setLoading(true);
    try {
      const apiUrl = isEditMode
        ? `http://localhost:5000/api/bank/update/${bank.id}`
        : 'http://localhost:5000/api/bank/create';

      const method = isEditMode ? 'PUT' : 'POST';

      const response = await fetch(apiUrl, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (data.success) {
        onSave();
      } else {
        throw new Error(data.message || 'Failed to save bank account');
      }
    } catch (err) {
      alert(`Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));

    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-gradient-to-br from-white to-blue-50 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex justify-between items-center mb-8">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-gradient-to-br from-blue-100 to-blue-50 rounded-xl">
                <CreditCard className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">
                  {isEditMode ? 'Edit Bank Account' : 'Add New Bank Account'}
                </h2>
                <p className="text-gray-600 mt-1">
                  {isEditMode ? 'Update bank account information' : 'Fill in the bank account details below'}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="space-y-6">
              {/* Account Information */}
              <div className="bg-gradient-to-br from-blue-50/30 to-blue-50/10 rounded-2xl p-5">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <User className="w-5 h-5" />
                  Account Information
                </h3>
                <div className="space-y-4">
                  <InputField
                    label="Account Holder Name"
                    name="acHolderName"
                    icon={User}
                    placeholder="John Doe"
                    required
                    value={formData.acHolderName}
                    onChange={handleChange}
                    error={errors.acHolderName}
                  />
                  <InputField
                    label="Account Number"
                    name="accountNo"
                    icon={Hash}
                    placeholder="123456789012"
                    required
                    value={formData.accountNo}
                    onChange={handleChange}
                    error={errors.accountNo}
                  />
                </div>
              </div>

              {/* Bank Details */}
              <div className="bg-gradient-to-br from-green-50/30 to-green-50/10 rounded-2xl p-5">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <CreditCard className="w-5 h-5" />
                  Bank Details
                </h3>
                <div className="space-y-4">
                  <InputField
                    label="Branch Name"
                    name="branchName"
                    icon={MapPin}
                    placeholder="Main Branch, City"
                    required
                    value={formData.branchName}
                    onChange={handleChange}
                    error={errors.branchName}
                  />
                  <InputField
                    label="IFSC Code"
                    name="IFSCode"
                    icon={Hash}
                    placeholder="SBIN0004567"
                    required
                    value={formData.IFSCode}
                    onChange={handleChange}
                    error={errors.IFSCode}
                  />
                </div>
              </div>

              {/* Company and Settings */}
              <div className="bg-gradient-to-br from-purple-50/30 to-purple-50/10 rounded-2xl p-5">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Building className="w-5 h-5" />
                  Company & Settings
                </h3>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                      <Building className="w-4 h-4" />
                      Company
                      <span className="text-red-500">*</span>
                    </label>
                    <select
                      name="companyId"
                      value={formData.companyId}
                      onChange={handleChange}
                      className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all ${
                        errors.companyId ? 'border-red-300 bg-red-50/50' : 'border-blue-200'
                      }`}
                    >
                      <option value="">Select Company</option>
                      {companies.map((company) => (
                        <option key={company.id} value={company.id}>
                          {company.companyName}
                        </option>
                      ))}
                    </select>
                    {errors.companyId && (
                      <p className="text-sm text-red-600 flex items-center gap-1">
                        <AlertCircle className="w-4 h-4" />
                        {errors.companyId}
                      </p>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                        <Shield className="w-4 h-4" />
                        Status
                      </label>
                      <select
                        name="status"
                        value={formData.status}
                        onChange={handleChange}
                        className="w-full px-4 py-3 border border-blue-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                      >
                        <option value="Active">Active</option>
                        <option value="Inactive">Inactive</option>
                      </select>
                    </div>

                    <div className="flex items-center gap-3 p-4 border border-blue-200 rounded-xl">
                      <div className="flex items-center h-5">
                        <input
                          type="checkbox"
                          name="isPrimary"
                          checked={formData.isPrimary}
                          onChange={handleChange}
                          className="w-4 h-4 text-blue-600 border-blue-300 rounded focus:ring-blue-500"
                        />
                      </div>
                      <div className="flex items-center gap-2">
                        <Star className="w-4 h-4 text-yellow-500" />
                        <div>
                          <label className="text-sm font-medium text-gray-700">
                            Set as Primary Account
                          </label>
                          <p className="text-xs text-gray-500">Make this the main bank account</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end gap-4 pt-6 border-t border-gray-200">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-8 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-all"
                  disabled={loading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all shadow-md hover:shadow-lg font-medium disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      {isEditMode ? 'Updating...' : 'Creating...'}
                    </>
                  ) : (
                    <>
                      <Save className="w-5 h-5" />
                      {isEditMode ? 'Update Bank Account' : 'Create Bank Account'}
                    </>
                  )}
                </button>
              </div>
            </div>
          </form>

          {/* Required Fields Note */}
          <div className="mt-6 pt-6 border-t border-gray-200">
            <p className="text-sm text-gray-500 flex items-center gap-2">
              <AlertCircle className="w-4 h-4" />
              Fields marked with <span className="text-red-500">*</span> are required
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddEditBankModal;