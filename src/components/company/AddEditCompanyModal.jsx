// AddEditCompanyModal.jsx
import React, { useState, useEffect } from 'react';
import {
  X,
  Save,
  Building,
  Mail,
  MapPin,
  User,
  Phone,
  FileText,
  AlertCircle,
} from 'lucide-react';


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
        error ? 'border-red-300' : 'border-gray-300'
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

// TextAreaField Component (stable - बाहर define किया)
const TextAreaField = ({
  label,
  name,
  icon: Icon,
  placeholder,
  rows = 3,
  value,
  onChange,
}) => (
  <div className="space-y-2">
    <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
      <Icon className="w-4 h-4" />
      {label}
    </label>
    <textarea
      name={name}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      rows={rows}
      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all resize-none"
    />
  </div>
);

const AddEditCompanyModal = ({ company, onClose, onSave }) => {
  const isEditMode = !!company;

  const [formData, setFormData] = useState({
    companyName: '',
    companyAddress: '',
    companyEmail: '',
    gstNo: '',
    panNo: '',
    personName: '',
    personEmail: '',
    phoneNumber: '',
    termsAndConditions: '',
    extraNotes: '',
    status: 'Active',
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  // कंपनी डेटा लोड होने पर form भरना (केवल company बदलने पर)
  useEffect(() => {
    if (company) {
      setFormData({
        companyName: company.companyName || '',
        companyAddress: company.companyAddress || '',
        companyEmail: company.companyEmail || '',
        gstNo: company.gstNo || '',
        panNo: company.panNo || '',
        personName: company.personName || '',
        personEmail: company.personEmail || '',
        phoneNumber: company.phoneNumber || '',
        termsAndConditions: company.termsAndConditions || '',
        extraNotes: company.extraNotes || '',
        status: company.status || 'Active',
      });
    }
  }, [company]);

  // Escape key + body scroll lock
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

    if (!formData.companyName.trim()) newErrors.companyName = 'Company name is required';
    if (!formData.companyEmail.trim()) newErrors.companyEmail = 'Company email is required';
    else if (!/\S+@\S+\.\S+/.test(formData.companyEmail))
      newErrors.companyEmail = 'Email is invalid';

    if (!formData.gstNo.trim()) newErrors.gstNo = 'GST number is required';
    else if (!/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/.test(formData.gstNo))
      newErrors.gstNo = 'Invalid GST format';

    if (!formData.panNo.trim()) newErrors.panNo = 'PAN number is required';
    else if (!/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(formData.panNo))
      newErrors.panNo = 'Invalid PAN format';

    if (!formData.personName.trim()) newErrors.personName = 'Contact person name is required';
    if (!formData.personEmail.trim()) newErrors.personEmail = 'Contact email is required';
    else if (!/\S+@\S+\.\S+/.test(formData.personEmail))
      newErrors.personEmail = 'Email is invalid';

    if (!formData.phoneNumber.trim()) newErrors.phoneNumber = 'Phone number is required';
    else if (!/^[0-9]{10}$/.test(formData.phoneNumber))
      newErrors.phoneNumber = 'Phone must be 10 digits';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setLoading(true);
    try {
      const apiUrl = isEditMode
        ? `http://localhost:5000/api/company/update/${company.id}`
        : 'http://localhost:5000/api/company/create';

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
        throw new Error(data.message || 'Failed to save company');
      }
    } catch (err) {
      alert(`Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    // Clear error on typing
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div className="bg-linear-to-br from-white to-gray-50 rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto transform transition-all animate-scale-in">
        <div className="p-6">
          {/* Header */}
          <div className="flex justify-between items-center mb-8">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-linear-to-br from-blue-100 to-blue-50 rounded-xl">
                <Building className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">
                  {isEditMode ? 'Edit Company' : 'Add New Company'}
                </h2>
                <p className="text-gray-600 mt-1">
                  {isEditMode ? 'Update company information' : 'Fill in the company details below'}
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
            <div className="space-y-8">
              {/* Company Information */}
              <div className="bg-linear-to-br from-blue-50/30 to-blue-50/10 rounded-2xl p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-2">
                  <Building className="w-5 h-5" />
                  Company Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <InputField
                    label="Company Name"
                    name="companyName"
                    icon={Building}
                    placeholder="Enter company name"
                    required
                    value={formData.companyName}
                    onChange={handleChange}
                    error={errors.companyName}
                  />
                  <InputField
                    label="Company Email"
                    name="companyEmail"
                    icon={Mail}
                    type="email"
                    placeholder="company@example.com"
                    required
                    value={formData.companyEmail}
                    onChange={handleChange}
                    error={errors.companyEmail}
                  />
                  <div className="md:col-span-2">
                    <InputField
                      label="Company Address"
                      name="companyAddress"
                      icon={MapPin}
                      placeholder="Enter full address"
                      value={formData.companyAddress}
                      onChange={handleChange}
                      error={errors.companyAddress}
                    />
                  </div>
                </div>
              </div>

              {/* Tax Details */}
              <div className="bg-linear-to-br from-green-50/30 to-green-50/10 rounded-2xl p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  Tax Details
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <InputField
                    label="GST Number"
                    name="gstNo"
                    icon={FileText}
                    placeholder="27ABCDE1234F1Z5"
                    required
                    value={formData.gstNo}
                    onChange={handleChange}
                    error={errors.gstNo}
                  />
                  <InputField
                    label="PAN Number"
                    name="panNo"
                    icon={FileText}
                    placeholder="ABCDE1234F"
                    required
                    value={formData.panNo}
                    onChange={handleChange}
                    error={errors.panNo}
                  />
                </div>
              </div>

              {/* Contact Person */}
              <div className="bg-linear-to-br from-purple-50/30 to-purple-50/10 rounded-2xl p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-2">
                  <User className="w-5 h-5" />
                  Contact Person
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <InputField
                    label="Contact Name"
                    name="personName"
                    icon={User}
                    placeholder="John Doe"
                    required
                    value={formData.personName}
                    onChange={handleChange}
                    error={errors.personName}
                  />
                  <InputField
                    label="Contact Email"
                    name="personEmail"
                    icon={Mail}
                    type="email"
                    placeholder="john@example.com"
                    required
                    value={formData.personEmail}
                    onChange={handleChange}
                    error={errors.personEmail}
                  />
                  <InputField
                    label="Phone Number"
                    name="phoneNumber"
                    icon={Phone}
                    type="tel"
                    placeholder="9876543210"
                    required
                    value={formData.phoneNumber}
                    onChange={handleChange}
                    error={errors.phoneNumber}
                  />
                </div>
              </div>

              {/* Additional Information */}
              <div className="bg-linear-to-br from-gray-50/30 to-gray-50/10 rounded-2xl p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  Additional Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <TextAreaField
                      label="Terms & Conditions"
                      name="termsAndConditions"
                      icon={FileText}
                      placeholder="Payment due within 30 days from invoice date..."
                      rows={4}
                      value={formData.termsAndConditions}
                      onChange={handleChange}
                    />
                  </div>
                  <div>
                    <TextAreaField
                      label="Extra Notes"
                      name="extraNotes"
                      icon={FileText}
                      placeholder="Additional notes or comments..."
                      rows={4}
                      value={formData.extraNotes}
                      onChange={handleChange}
                    />
                  </div>
                  <div>
                    <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                      <FileText className="w-4 h-4" />
                      Status
                    </label>
                    <select
                      name="status"
                      value={formData.status}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                    >
                      <option value="Active">Active</option>
                      <option value="Inactive">Inactive</option>
                      <option value="Pending">Pending</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end gap-4 pt-6 border-t border-gray-200">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-8 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50/50 transition-all duration-200 font-medium"
                  disabled={loading}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={loading}
                  className="flex items-center gap-2 px-8 py-3 bg-linear-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all duration-200 shadow-md hover:shadow-lg font-medium disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      {isEditMode ? 'Updating...' : 'Creating...'}
                    </>
                  ) : (
                    <>
                      <Save className="w-5 h-5" />
                      {isEditMode ? 'Update Company' : 'Create Company'}
                    </>
                  )}
                </button>
              </div>
            </div>
          </form>

          {/* Required Fields Note */}
          <div className="mt-8 pt-6 border-t border-gray-200">
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

export default AddEditCompanyModal;