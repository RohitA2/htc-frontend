// CompanyExport.jsx
import React, { useState } from 'react';
import { X, Download, FileText, FileSpreadsheet } from 'lucide-react';

const CompanyExport = ({ companies, selectedCompanies, onClose }) => {
  const [exportFormat, setExportFormat] = useState('csv');
  const [includeColumns, setIncludeColumns] = useState({
    companyName: true,
    companyEmail: true,
    companyAddress: true,
    gstNo: true,
    panNo: true,
    personName: true,
    personEmail: true,
    phoneNumber: true,
    status: true,
    createdAt: true
  });

  const exportData = selectedCompanies.length > 0
    ? companies.filter(company => selectedCompanies.includes(company.id))
    : companies;

  const handleExport = () => {
    // Create CSV/Excel data
    const columns = Object.keys(includeColumns).filter(key => includeColumns[key]);

    // Headers
    const headers = columns.map(col =>
      col.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())
    );

    // Data rows
    const rows = exportData.map(company =>
      columns.map(col => company[col] || '')
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
    link.setAttribute('download', `companies_${new Date().toISOString().split('T')[0]}.csv`);
    link.click();
  };

  const exportToExcel = (data) => {
    // For Excel export, you might want to use a library like SheetJS
    // This is a simplified version
    const csvContent = data.map(row =>
      row.map(cell => `"${cell}"`).join(',')
    ).join('\n');

    const blob = new Blob([csvContent], { type: 'application/vnd.ms-excel' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `companies_${new Date().toISOString().split('T')[0]}.xls`);
    link.click();
  };

  const toggleColumn = (column) => {
    setIncludeColumns(prev => ({
      ...prev,
      [column]: !prev[column]
    }));
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Export Companies</h2>
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
                  className={`flex items-center gap-2 px-4 py-3 border rounded-lg flex-1 ${exportFormat === 'csv' ? 'border-blue-500 bg-blue-50' : ''
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
                  className={`flex items-center gap-2 px-4 py-3 border rounded-lg flex-1 ${exportFormat === 'excel' ? 'border-blue-500 bg-blue-50' : ''
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
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600">
                  {selectedCompanies.length > 0
                    ? `Exporting ${selectedCompanies.length} selected companies`
                    : `Exporting all ${exportData.length} companies`}
                </p>
              </div>
            </div>

            {/* Columns Selection */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Columns to Include</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {Object.keys(includeColumns).map(column => (
                  <label
                    key={column}
                    className="flex items-center gap-3 p-3 border rounded-lg hover:bg-gray-50 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={includeColumns[column]}
                      onChange={() => toggleColumn(column)}
                      className="rounded border-gray-300"
                    />
                    <span className="capitalize">
                      {column.replace(/([A-Z])/g, ' $1').trim()}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end gap-3 pt-6 border-t">
              <button
                onClick={onClose}
                className="px-6 py-2 border rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleExport}
                className="flex items-center gap-2 px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
              >
                <Download className="w-4 h-4" />
                Export {exportData.length} Companies
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CompanyExport;