// CompanyModal.jsx
import React from 'react';
import {
  X, Mail, Phone, MapPin, FileText, User, Calendar,
  Building, Globe, Shield, FileCheck, Clock, Edit2,
  ExternalLink, Copy, CheckCircle, AlertCircle
} from 'lucide-react';

const CompanyModal = ({ company, onClose }) => {
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    // You can add toast notification here
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto animate-fadeIn">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[95vh] overflow-y-auto animate-slideUp">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-white border-b border-gray-100">
          <div className="p-6">
            <div className="flex justify-between items-start">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-linear-to-br from-blue-50 to-indigo-50 rounded-xl">
                  <Building className="w-8 h-8 text-blue-600" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">{company.companyName}</h2>
                  <div className="flex items-center gap-3 mt-2">
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${company.status === 'Active'
                      ? 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-600/20'
                      : 'bg-rose-50 text-rose-700 ring-1 ring-rose-600/20'
                      }`}>
                      {company.status === 'Active' ? (
                        <CheckCircle className="w-3.5 h-3.5 mr-1.5" />
                      ) : (
                        <AlertCircle className="w-3.5 h-3.5 mr-1.5" />
                      )}
                      {company.status}
                    </span>
                  </div>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-100 rounded-xl transition-all duration-200 hover:scale-105 active:scale-95"
              >
                <X className="w-6 h-6 text-gray-500" />
              </button>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column */}
            <div className="lg:col-span-2 space-y-6">
              {/* Company Information Card */}
              <div className="bg-linear-to-br from-gray-50 to-white rounded-xl border border-gray-200 p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Building className="w-5 h-5 text-blue-600" />
                  <h3 className="text-lg font-semibold text-gray-900">Company Information</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-4">
                    <div className="group">
                      <div className="flex items-center gap-2 mb-1">
                        <Mail className="w-4 h-4 text-gray-400" />
                        <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Company Email</span>
                        <button
                          onClick={() => copyToClipboard(company.companyEmail)}
                          className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-gray-100 rounded"
                        >
                          <Copy className="w-3 h-3 text-gray-400 hover:text-gray-600" />
                        </button>
                      </div>
                      <a
                        href={`mailto:${company.companyEmail}`}
                        className="text-gray-900 font-medium hover:text-blue-600 transition-colors flex items-center gap-1"
                      >
                        {company.companyEmail}
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>

                    <div className="group">
                      <div className="flex items-center gap-2 mb-1">
                        <MapPin className="w-4 h-4 text-gray-400" />
                        <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Address</span>
                      </div>
                      <p className="text-gray-900 font-medium">{company.companyAddress}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Tax Details Card */}
              <div className="bg-linear-to-br from-amber-50/50 to-white rounded-xl border border-amber-100 p-6">
                <div className="flex items-center gap-2 mb-4">
                  <FileText className="w-5 h-5 text-amber-600" />
                  <h3 className="text-lg font-semibold text-gray-900">Tax & Legal Details</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="group">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-medium text-amber-600 uppercase tracking-wide">GST Number</span>
                      <button
                        onClick={() => copyToClipboard(company.gstNo)}
                        className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-amber-50 rounded"
                      >
                        <Copy className="w-3 h-3 text-amber-400 hover:text-amber-600" />
                      </button>
                    </div>
                    <div className="bg-amber-50/50 rounded-lg p-3 border border-amber-100">
                      <p className="font-mono text-gray-900 font-semibold">{company.gstNo}</p>
                    </div>
                  </div>

                  <div className="group">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-medium text-amber-600 uppercase tracking-wide">PAN Number</span>
                      <button
                        onClick={() => copyToClipboard(company.panNo)}
                        className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-amber-50 rounded"
                      >
                        <Copy className="w-3 h-3 text-amber-400 hover:text-amber-600" />
                      </button>
                    </div>
                    <div className="bg-amber-50/50 rounded-lg p-3 border border-amber-100">
                      <p className="font-mono text-gray-900 font-semibold">{company.panNo}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column */}
            <div className="space-y-6">
              {/* Contact Person Card */}
              <div className="bg-linear-to-br from-indigo-50/50 to-white rounded-xl border border-indigo-100 p-6">
                <div className="flex items-center gap-2 mb-4">
                  <User className="w-5 h-5 text-indigo-600" />
                  <h3 className="text-lg font-semibold text-gray-900">Primary Contact</h3>
                </div>
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-linear-to-br from-indigo-500 to-purple-500 rounded-full flex items-center justify-center">
                      <User className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">{company.personName}</p>
                      <p className="text-sm text-gray-500">Contact Person</p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="group">
                      <div className="flex items-center gap-2 mb-1">
                        <Mail className="w-4 h-4 text-indigo-400" />
                        <span className="text-xs font-medium text-gray-500">Email</span>
                      </div>
                      <a
                        href={`mailto:${company.personEmail}`}
                        className="text-gray-900 font-medium hover:text-indigo-600 transition-colors text-sm"
                      >
                        {company.personEmail}
                      </a>
                    </div>

                    <div className="group">
                      <div className="flex items-center gap-2 mb-1">
                        <Phone className="w-4 h-4 text-indigo-400" />
                        <span className="text-xs font-medium text-gray-500">Phone</span>
                      </div>
                      <a
                        href={`tel:${company.phoneNumber}`}
                        className="text-gray-900 font-medium hover:text-indigo-600 transition-colors text-sm"
                      >
                        {company.phoneNumber}
                      </a>
                    </div>
                  </div>
                </div>
              </div>

              {/* Timeline Card */}
              <div className="bg-linear-to-br from-gray-50 to-white rounded-xl border border-gray-200 p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Clock className="w-5 h-5 text-gray-600" />
                  <h3 className="text-lg font-semibold text-gray-900">Timeline</h3>
                </div>
                <div className="space-y-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <Calendar className="w-4 h-4 text-gray-400" />
                      <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Created</span>
                    </div>
                    <p className="text-gray-900 font-medium text-sm">
                      {formatDate(company.createdAt)}
                    </p>
                  </div>

                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <Calendar className="w-4 h-4 text-gray-400" />
                      <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Last Updated</span>
                    </div>
                    <p className="text-gray-900 font-medium text-sm">
                      {formatDate(company.updatedAt)}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Additional Information */}
          <div className="mt-6 space-y-6">
            <div className="bg-linear-to-br from-emerald-50/50 to-white rounded-xl border border-emerald-100 p-6">
              <div className="flex items-center gap-2 mb-4">
                <FileCheck className="w-5 h-5 text-emerald-600" />
                <h3 className="text-lg font-semibold text-gray-900">Terms & Conditions</h3>
              </div>
              <div className="bg-white rounded-lg border border-emerald-100 p-4">
                <p className="text-gray-700 leading-relaxed">
                  {company.termsAndConditions || 'No terms and conditions specified'}
                </p>
              </div>
            </div>

            <div className="bg-linear-to-br from-slate-50 to-white rounded-xl border border-slate-200 p-6">
              <div className="flex items-center gap-2 mb-4">
                <FileText className="w-5 h-5 text-slate-600" />
                <h3 className="text-lg font-semibold text-gray-900">Additional Notes</h3>
              </div>
              <div className="bg-white rounded-lg border border-slate-200 p-4">
                <p className="text-gray-700 leading-relaxed">
                  {company.extraNotes || 'No additional notes'}
                </p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="mt-8 pt-6 border-t border-gray-100">
            <div className="flex justify-between items-center">
              <div className="flex gap-3">
                <button
                  onClick={onClose}
                  className="px-5 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 transition-all duration-200 hover:shadow-sm active:scale-95"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CompanyModal;

// Add these CSS animations to your global CSS or component
const styles = `
@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes slideUp {
  from { 
    opacity: 0;
    transform: translateY(20px);
  }
  to { 
    opacity: 1;
    transform: translateY(0);
  }
}

.animate-fadeIn {
  animation: fadeIn 0.3s ease-out;
}

.animate-slideUp {
  animation: slideUp 0.4s ease-out;
}
`;

// You can add these styles to your global CSS or create a separate CSS file