// BankModal.jsx
import React from 'react';
import { 
  X, User, CreditCard, MapPin, Hash, Building, 
  Star, CheckCircle, Calendar, Edit, Shield
} from 'lucide-react';

const BankModal = ({ bank, companyName, onClose, onEdit }) => {
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatAccountNumber = (accountNo) => {
    if (!accountNo) return '';
    return accountNo.replace(/(\d{4})(?=\d)/g, '$1 ');
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-gradient-to-br from-white to-blue-50 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex justify-between items-start mb-8">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="p-3 bg-gradient-to-br from-blue-100 to-blue-50 rounded-xl">
                  <CreditCard className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">{bank.acHolderName}</h2>
                  <p className="text-gray-600">Bank Account Details</p>
                </div>
              </div>
              {bank.isPrimary && (
                <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-yellow-100 to-yellow-50 rounded-full border border-yellow-200">
                  <Star className="w-4 h-4 text-yellow-600 fill-yellow-400" />
                  <span className="text-sm font-medium text-yellow-800">Primary Account</span>
                </div>
              )}
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Account Information */}
          <div className="space-y-6">
            <div className="bg-gradient-to-br from-blue-50/50 to-blue-50/10 rounded-2xl p-5">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <User className="w-5 h-5 text-blue-500" />
                Account Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-start gap-3">
                  <User className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm text-gray-500">Account Holder</p>
                    <p className="font-medium text-gray-900">{bank.acHolderName}</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <Hash className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm text-gray-500">Account Number</p>
                    <p className="font-medium text-gray-900 font-mono">{formatAccountNumber(bank.accountNo)}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Bank Details */}
            <div className="bg-gradient-to-br from-green-50/50 to-green-50/10 rounded-2xl p-5">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-green-500" />
                Bank Details
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-start gap-3">
                  <MapPin className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm text-gray-500">Branch Name</p>
                    <p className="font-medium text-gray-900">{bank.branchName}</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <Hash className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm text-gray-500">IFSC Code</p>
                    <p className="font-medium text-gray-900 font-mono">{bank.IFSCode}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Company Information */}
            <div className="bg-gradient-to-br from-purple-50/50 to-purple-50/10 rounded-2xl p-5">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Building className="w-5 h-5 text-purple-500" />
                Company Information
              </h3>
              <div className="flex items-start gap-3">
                <Building className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm text-gray-500">Company Name</p>
                  <p className="font-medium text-gray-900">{companyName}</p>
                  <p className="text-xs text-gray-500 mt-1">Company ID: {bank.companyId}</p>
                </div>
              </div>
            </div>

            {/* Status and Dates */}
            <div className="bg-gradient-to-br from-gray-50/50 to-gray-50/10 rounded-2xl p-5">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Shield className="w-5 h-5 text-gray-500" />
                Status & Dates
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm text-gray-500">Status</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                        bank.status === 'Active' 
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {bank.status}
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <Calendar className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm text-gray-500">Created Date</p>
                    <p className="font-medium text-gray-900">
                      {formatDate(bank.createdAt)}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <Calendar className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm text-gray-500">Last Updated</p>
                    <p className="font-medium text-gray-900">
                      {formatDate(bank.updatedAt)}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end gap-3 pt-6 border-t border-gray-200">
              <button
                onClick={onClose}
                className="px-6 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-all"
              >
                Close
              </button>
              {onEdit && (
                <button
                  onClick={onEdit}
                  className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all shadow-md hover:shadow-lg"
                >
                  <Edit className="w-4 h-4" />
                  Edit Bank Account
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BankModal;