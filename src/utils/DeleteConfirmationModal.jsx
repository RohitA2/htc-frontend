// shared/DeleteConfirmationModal.jsx
import React from 'react';
import { AlertTriangle, X, Trash2, AlertCircle } from 'lucide-react';

const DeleteConfirmationModal = ({ item, onClose, onConfirm, isBulkDelete, itemType = 'item' }) => {
  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-gradient-to-br from-white to-red-50 rounded-2xl shadow-2xl max-w-md w-full transform transition-all animate-scale-in">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-start justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-gradient-to-br from-red-100 to-red-50 rounded-xl">
                <AlertTriangle className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">
                  {isBulkDelete ? `Delete Multiple ${itemType}s` : `Delete ${itemType}`}
                </h2>
                <p className="text-sm text-gray-600 mt-1">Confirm deletion</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Warning Message */}
          <div className="bg-gradient-to-r from-red-50/50 to-orange-50/50 border border-red-100 rounded-xl p-4 mb-6">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium text-red-700">Warning: This action cannot be undone</p>
                <p className="text-sm text-red-600 mt-1">
                  All associated data will be permanently removed from the system.
                </p>
              </div>
            </div>
          </div>

          {/* Item Details */}
          <div className="bg-gray-50/50 rounded-xl p-4 mb-8">
            {isBulkDelete ? (
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-red-100 to-red-50 rounded-full mb-4">
                  <Trash2 className="w-8 h-8 text-red-600" />
                </div>
                <p className="text-gray-900 font-semibold text-lg">
                  Delete {item.name}?
                </p>
                <p className="text-gray-600 mt-2">
                  This will permanently delete {item.name.replace(/\d+/, '')} {itemType}s.
                </p>
              </div>
            ) : (
              <>
                <p className="text-gray-700 mb-3">You are about to delete:</p>
                <div className="space-y-3">
                  {item.companyName && (
                    <div className="flex items-center gap-3 p-3 bg-white/50 rounded-lg">
                      <div className="w-2 h-2 bg-red-500 rounded-full flex-shrink-0"></div>
                      <div>
                        <p className="font-medium text-gray-900">{item.companyName}</p>
                        <p className="text-sm text-gray-600">{item.companyEmail}</p>
                      </div>
                    </div>
                  )}
                  {item.acHolderName && (
                    <div className="flex items-center gap-3 p-3 bg-white/50 rounded-lg">
                      <div className="w-2 h-2 bg-red-500 rounded-full flex-shrink-0"></div>
                      <div>
                        <p className="font-medium text-gray-900">{item.acHolderName}</p>
                        <p className="text-sm text-gray-600">Account: ****{item.accountNo?.slice(-4)}</p>
                      </div>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-all font-medium"
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              className="flex-1 px-6 py-3 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-xl hover:from-red-600 hover:to-red-700 transition-all shadow-md hover:shadow-lg font-medium flex items-center justify-center gap-2"
            >
              <Trash2 className="w-4 h-4" />
              {isBulkDelete ? `Delete All` : `Delete ${itemType}`}
            </button>
          </div>

          {/* Additional Warning */}
          <div className="mt-6 pt-4 border-t border-gray-200">
            <p className="text-xs text-gray-500 text-center">
              This action will permanently delete the record and cannot be recovered.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DeleteConfirmationModal;