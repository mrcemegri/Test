import React, { useState } from 'react';
import {
  ArrowDownTrayIcon,
  DocumentArrowDownIcon,
  TableCellsIcon,
  PrinterIcon,
} from '@heroicons/react/24/outline';
import Button from '../UI/Button';
import {
  exportContactsToCSV,
  exportDealsToCSV,
  exportCompaniesToCSV,
  exportActivitiesToCSV,
  exportToPDF,
  exportToExcel,
  formatDataForExport
} from '../../utils/exportUtils';
import { toast } from 'react-hot-toast';

const ExportButton = ({
  data,
  type,
  title = 'Export Data',
  options = ['csv', 'excel', 'pdf'],
  className = '',
  onExport
}) => {
  const [loading, setLoading] = useState(false);
  const [showMenu, setShowMenu] = useState(false);

  const handleExport = async (format) => {
    setLoading(true);
    setShowMenu(false);

    try {
      const formattedData = formatDataForExport(data, type);
      const filename = `${type}_${new Date().toISOString().split('T')[0]}`;

      switch (format) {
        case 'csv':
          switch (type) {
            case 'contacts':
              exportContactsToCSV(formattedData);
              break;
            case 'deals':
              exportDealsToCSV(formattedData);
              break;
            case 'companies':
              exportCompaniesToCSV(formattedData);
              break;
            case 'activities':
              exportActivitiesToCSV(formattedData);
              break;
            default:
              exportToCSV(formattedData, filename);
          }
          toast.success(`Data exported as CSV successfully`);
          break;

        case 'excel':
          exportToExcel(formattedData, filename);
          toast.success(`Data exported as Excel file successfully`);
          break;

        case 'pdf':
          // For PDF, we need to export the visible table
          const tableId = `${type}-export-table`;
          exportToPDF(tableId, filename);
          toast.success(`Data exported as PDF successfully`);
          break;

        default:
          toast.error('Unsupported export format');
      }

      if (onExport) {
        onExport(format, formattedData);
      }
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Failed to export data');
    } finally {
      setLoading(false);
    }
  };

  const getExportIcon = (format) => {
    switch (format) {
      case 'csv':
        return <TableCellsIcon className="h-4 w-4" />;
      case 'excel':
        return <DocumentArrowDownIcon className="h-4 w-4" />;
      case 'pdf':
        return <PrinterIcon className="h-4 w-4" />;
      default:
        return <ArrowDownTrayIcon className="h-4 w-4" />;
    }
  };

  const getExportLabel = (format) => {
    switch (format) {
      case 'csv':
        return 'Export as CSV';
      case 'excel':
        return 'Export as Excel';
      case 'pdf':
        return 'Export as PDF';
      default:
        return 'Export';
    }
  };

  // Create hidden table for PDF export
  const createHiddenTable = () => {
    if (options.includes('pdf')) {
      const existingTable = document.getElementById(`${type}-export-table`);
      if (!existingTable && data.length > 0) {
        const tableDiv = document.createElement('div');
        tableDiv.id = `${type}-export-table`;
        tableDiv.style.display = 'none';

        const table = document.createElement('table');
        table.style.width = '100%';
        table.style.borderCollapse = 'collapse';

        // Create headers
        const headers = Object.keys(data[0]);
        const thead = document.createElement('thead');
        const headerRow = document.createElement('tr');

        headers.forEach(header => {
          const th = document.createElement('th');
          th.style.border = '1px solid #ddd';
          th.style.padding = '8px';
          th.style.backgroundColor = '#f2f2f2';
          th.style.fontWeight = 'bold';
          th.style.textAlign = 'left';
          th.textContent = header.charAt(0).toUpperCase() + header.slice(1).replace(/_/g, ' ');
          headerRow.appendChild(th);
        });

        thead.appendChild(headerRow);
        table.appendChild(thead);

        // Create body
        const tbody = document.createElement('tbody');

        formattedData = formatDataForExport(data, type);
        formattedData.forEach(row => {
          const tr = document.createElement('tr');

          headers.forEach(header => {
            const td = document.createElement('td');
            td.style.border = '1px solid #ddd';
            td.style.padding = '8px';
            td.style.textAlign = 'left';
            td.textContent = row[header] || '';
            tr.appendChild(td);
          });

          tbody.appendChild(tr);
        });

        table.appendChild(tbody);
        tableDiv.appendChild(table);
        document.body.appendChild(tableDiv);
      }
    }
  };

  React.useEffect(() => {
    createHiddenTable();

    return () => {
      // Cleanup hidden table on unmount
      const table = document.getElementById(`${type}-export-table`);
      if (table) {
        document.body.removeChild(table);
      }
    };
  }, [data, type, options]);

  return (
    <div className={`relative ${className}`}>
      <Button
        variant="outline"
        onClick={() => setShowMenu(!showMenu)}
        disabled={loading || !data || data.length === 0}
        loading={loading}
      >
        <ArrowDownTrayIcon className="h-4 w-4 mr-2" />
        {title}
      </Button>

      {showMenu && (
        <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg ring-1 ring-black ring-opacity-5 z-10">
          <div className="py-1">
            {options.includes('csv') && (
              <button
                className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                onClick={() => handleExport('csv')}
              >
                <TableCellsIcon className="h-4 w-4 mr-3 text-gray-400" />
                CSV
              </button>
            )}

            {options.includes('excel') && (
              <button
                className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                onClick={() => handleExport('excel')}
              >
                <DocumentArrowDownIcon className="h-4 w-4 mr-3 text-gray-400" />
                Excel
              </button>
            )}

            {options.includes('pdf') && (
              <button
                className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                onClick={() => handleExport('pdf')}
              >
                <PrinterIcon className="h-4 w-4 mr-3 text-gray-400" />
                PDF
              </button>
            )}
          </div>
        </div>
      )}

      {/* Click outside to close */}
      {showMenu && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setShowMenu(false)}
        />
      )}
    </div>
  );
};

export default ExportButton;