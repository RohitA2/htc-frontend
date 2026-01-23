// BankExport.jsx
import React, { useState } from 'react';
import { X, Download, FileText, FileSpreadsheet, BanknoteIcon } from 'lucide-react';

const BankExport = ({ banks, companies, selectedBanks, onClose }) => {
  const [exportFormat, setExportFormat] = useState('csv');
  const [includeColumns, setIncludeColumns] = useState({
    acHolderName: true,
    accountNo: true,
    branchName: true,
    IFSCode: true,
    isPrimary: true,
    status: true,
    companyName: true,
    createdAt: true
  });

  const exportData = selectedBanks.length > 0 
    ? banks.filter(bank => selectedBanks.includes(bank.id))
    : banks;

  const getCompanyName = (companyId) => {
    const company = companies.find(c => c.id === companyId);
    return company ? company.companyName : 'Unknown Company';
  };

  const handleExport = () => {
    const columns = Object.keys(includeColumns).filter(key => includeColumns[key]);
    
    const headers = columns.map(col => {
      const labels = {
        acHolderName: 'Account Holder',
        accountNo: 'Account Number',
        branchName: 'Branch Name',
        IFSCode: 'IFSC Code',
        isPrimary: 'Is Primary',
        status: 'Status',
        companyName: 'Company',
        createdAt: 'Created Date'
      };
      return labels[col] || col;
    });
    
    const rows = exportData.map(bank => 
      columns.map(col => {
        if (col === 'companyName') {
          return getCompanyName(bank.companyId);
        } else if (col === 'isPrimary') {
          return bank[col] ? 'Yes' : 'No';
        } else if (col === 'createdAt') {
          return new Date(bank[col]).toLocaleDateString();
        }
        return bank[col] || '';
      })
    );
    
    if (exportFormat === 'csv') {
      exportToCSV([headers, ...rows]);
    } else {
      exportToExcel([headers, ...rows]);
    }
    
    onClose();
  };

  const exportToCSV = (data) => {
    const csvContent = data.map(row => 
      row.map(cell => `"${cell}"`).join(',')
    ).join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `bank_accounts_${new Date().toISOString().split('T')[0]}.csv`);
    link.click();
  };

  const exportToExcel = (data) => {
    const csvContent = data.map(row => 
      row.map(cell => `"${cell}"`).join(',')
    ).join('\n');
    
    const blob = new Blob([csvContent], { type: 'application/vnd.ms-excel' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `bank_accounts_${new Date().toISOString().split('T')[0]}.xls`);
    link.click();
  };

  const toggleColumn = (column) => {
    setIncludeColumns(prev => ({
      ...prev,
      [column]: !prev[column]
    }));
  };

  const columnLabels = {
    acHolderName: 'Account Holder Name',
    accountNo: 'Account Number',
    branchName: 'Branch Name',
    IFSCode: 'IFSC Code',
    isPrimary: 'Primary Account',
    status: 'Status',
    companyName: 'Company Name',
    createdAt: 'Created Date'
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-gradient-to-br from-white to-blue-50 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-blue-100 to-blue-50 rounded-lg">
                <BanknoteIcon className="w-6 h-6 text-blue-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900">Export Bank Accounts</h2>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-full"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="space-y-6">
            {/* Export Format */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Export Format</h3>
              <div className="flex gap-4">
                <button
                  onClick={() => setExportFormat('csv')}
                  className={`flex items-center gap-2 px-4 py-3 border rounded-xl flex-1 transition-all ${
                    exportFormat === 'csv' ? 'border-blue-500 bg-blue-50 shadow-sm' : ''
                  }`}
                >
                  <FileText className="w-5 h-5" />
                  <div className="text-left">
                    <div className="font-medium">CSV</div>
                    <div className="text-sm text-gray-500">Comma separated values</div>
                  </div>
                </button>
                
                <button
                  onClick={() => setExportFormat('excel')}
                  className={`flex items-center gap-2 px-4 py-3 border rounded-xl flex-1 transition-all ${
                    exportFormat === 'excel' ? 'border-blue-500 bg-blue-50 shadow-sm' : ''
                  }`}
                >
                  <FileSpreadsheet className="w-5 h-5" />
                  <div className="text-left">
                    <div className="font-medium">Excel</div>
                    <div className="text-sm text-gray-500">Microsoft Excel format</div>
                  </div>
                </button>
              </div>
            </div>

            {/* Data Selection */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Data to Export</h3>
              <div className="bg-gradient-to-br from-blue-50 to-blue-100/30 p-4 rounded-xl border border-blue-100">
                <p className="text-sm text-gray-600">
                  {selectedBanks.length > 0
                    ? `Exporting ${selectedBanks.length} selected bank accounts`
                    : `Exporting all ${exportData.length} bank accounts`}
                </p>
              </div>
            </div>

            {/* Columns Selection */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Columns to Include</h3>
              <div className="grid grid-cols-2 gap-3">
                {Object.keys(includeColumns).map(column => (
                  <label
                    key={column}
                    className="flex items-center gap-3 p-3 border border-blue-100 rounded-xl hover:bg-blue-50/50 cursor-pointer transition-colors"
                  >
                    <input
                      type="checkbox"
                      checked={includeColumns[column]}
                      onChange={() => toggleColumn(column)}
                      className="rounded border-blue-300 focus:ring-blue-500"
                    />
                    <span className="text-sm">
                      {columnLabels[column]}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end gap-3 pt-6 border-t">
              <button
                onClick={onClose}
                className="px-6 py-3 border border-gray-300 rounded-xl hover:bg-gray-50 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleExport}
                className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all shadow-md hover:shadow-lg"
              >
                <Download className="w-4 h-4" />
                Export {exportData.length} Bank Accounts
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BankExport;