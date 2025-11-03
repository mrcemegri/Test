// CSV Export Utility
export const exportToCSV = (data, filename, headers = []) => {
  let csvContent = '';

  // Add headers if provided
  if (headers.length > 0) {
    csvContent += headers.join(',') + '\n';
  }

  // Add data rows
  data.forEach(row => {
    const values = headers.length > 0
      ? headers.map(header => {
          const value = row[header] || '';
          // Escape commas and quotes in values
          return typeof value === 'string' && (value.includes(',') || value.includes('"'))
            ? `"${value.replace(/"/g, '""')}"`
            : value;
        })
      : Object.values(row).map(value => {
          // Escape commas and quotes in values
          return typeof value === 'string' && (value.includes(',') || value.includes('"'))
            ? `"${value.replace(/"/g, '""')}"`
            : value;
        });

    csvContent += values.join(',') + '\n';
  });

  // Create blob and download
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);

  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}.csv`);
  link.style.visibility = 'hidden';

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

// Export Contacts to CSV
export const exportContactsToCSV = (contacts) => {
  const headers = [
    'First Name',
    'Last Name',
    'Email',
    'Phone',
    'Mobile',
    'Job Title',
    'Department',
    'Company',
    'Lifecycle Stage',
    'Assigned To',
    'Created Date'
  ];

  const data = contacts.map(contact => ({
    'First Name': contact.first_name || '',
    'Last Name': contact.last_name || '',
    'Email': contact.email || '',
    'Phone': contact.phone || '',
    'Mobile': contact.mobile || '',
    'Job Title': contact.job_title || '',
    'Department': contact.department || '',
    'Company': contact.company_name || '',
    'Lifecycle Stage': contact.lifecycle_stage || '',
    'Assigned To': contact.assigned_first_name && contact.assigned_last_name
      ? `${contact.assigned_first_name} ${contact.assigned_last_name}`
      : '',
    'Created Date': contact.created_at ? new Date(contact.created_at).toLocaleDateString() : ''
  }));

  exportToCSV(data, 'contacts', headers);
};

// Export Deals to CSV
export const exportDealsToCSV = (deals) => {
  const headers = [
    'Deal Name',
    'Amount',
    'Currency',
    'Status',
    'Pipeline',
    'Stage',
    'Contact',
    'Company',
    'Assigned To',
    'Expected Close Date',
    'Actual Close Date',
    'Created Date'
  ];

  const data = deals.map(deal => ({
    'Deal Name': deal.name || '',
    'Amount': deal.amount || 0,
    'Currency': deal.currency || 'USD',
    'Status': deal.status || '',
    'Pipeline': deal.pipeline_name || '',
    'Stage': deal.stage_name || '',
    'Contact': deal.contact_first_name && deal.contact_last_name
      ? `${deal.contact_first_name} ${deal.contact_last_name}`
      : '',
    'Company': deal.company_name || '',
    'Assigned To': deal.assigned_first_name && deal.assigned_last_name
      ? `${deal.assigned_first_name} ${deal.assigned_last_name}`
      : '',
    'Expected Close Date': deal.expected_close_date ? new Date(deal.expected_close_date).toLocaleDateString() : '',
    'Actual Close Date': deal.actual_close_date ? new Date(deal.actual_close_date).toLocaleDateString() : '',
    'Created Date': deal.created_at ? new Date(deal.created_at).toLocaleDateString() : ''
  }));

  exportToCSV(data, 'deals', headers);
};

// Export Companies to CSV
export const exportCompaniesToCSV = (companies) => {
  const headers = [
    'Name',
    'Domain',
    'Website',
    'Phone',
    'Address',
    'Industry',
    'Company Size',
    'Assigned To',
    'Created Date'
  ];

  const data = companies.map(company => ({
    'Name': company.name || '',
    'Domain': company.domain || '',
    'Website': company.website || '',
    'Phone': company.phone || '',
    'Address': company.address || '',
    'Industry': company.industry || '',
    'Company Size': company.company_size || '',
    'Assigned To': company.assigned_first_name && company.assigned_last_name
      ? `${company.assigned_first_name} ${company.assigned_last_name}`
      : '',
    'Created Date': company.created_at ? new Date(company.created_at).toLocaleDateString() : ''
  }));

  exportToCSV(data, 'companies', headers);
};

// Export Activities to CSV
export const exportActivitiesToCSV = (activities) => {
  const headers = [
    'Type',
    'Subject',
    'Description',
    'Contact',
    'Deal',
    'Created By',
    'Completed',
    'Created Date'
  ];

  const data = activities.map(activity => ({
    'Type': activity.type || '',
    'Subject': activity.subject || '',
    'Description': activity.description || '',
    'Contact': activity.contact_first_name && activity.contact_last_name
      ? `${activity.contact_first_name} ${activity.contact_last_name}`
      : '',
    'Deal': activity.deal_name || '',
    'Created By': activity.created_by_first_name && activity.created_by_last_name
      ? `${activity.created_by_first_name} ${activity.created_by_last_name}`
      : '',
    'Completed': activity.is_completed ? 'Yes' : 'No',
    'Created Date': activity.created_at ? new Date(activity.created_at).toLocaleDateString() : ''
  }));

  exportToCSV(data, 'activities', headers);
};

// PDF Export Utility (using browser print functionality)
export const exportToPDF = (elementId, filename) => {
  const element = document.getElementById(elementId);
  if (!element) {
    console.error(`Element with id ${elementId} not found`);
    return;
  }

  // Create a new window for printing
  const printWindow = window.open('', '_blank');

  // Write the HTML content to the new window
  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>${filename}</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            margin: 20px;
            line-height: 1.4;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 20px;
          }
          th, td {
            border: 1px solid #ddd;
            padding: 8px;
            text-align: left;
          }
          th {
            background-color: #f2f2f2;
            font-weight: bold;
          }
          @media print {
            body { margin: 0; }
            .no-print { display: none; }
          }
        </style>
      </head>
      <body>
        ${element.innerHTML}
      </body>
    </html>
  `);

  printWindow.document.close();

  // Wait for the content to load, then print
  printWindow.onload = () => {
    printWindow.print();
    printWindow.close();
  };
};

// Export Dashboard to PDF
export const exportDashboardToPDF = () => {
  // Add a specific class for dashboard export
  const dashboardElement = document.querySelector('.dashboard-content');
  if (dashboardElement) {
    dashboardElement.classList.add('pdf-export');
    exportToPDF('dashboard-export', 'dashboard-report');
    setTimeout(() => {
      dashboardElement.classList.remove('pdf-export');
    }, 1000);
  }
};

// Generate Excel-like file using CSV with Excel metadata
export const exportToExcel = (data, filename, sheetName = 'Sheet1') => {
  // Excel-compatible CSV with BOM for proper UTF-8 handling
  const BOM = '\uFEFF';
  let csvContent = BOM;

  // Add Excel-style metadata as comments (will be ignored by Excel)
  csvContent += `${sheetName}\n`;

  // Process data the same way as CSV
  if (data.length > 0) {
    const headers = Object.keys(data[0]);
    csvContent += headers.join(',') + '\n';

    data.forEach(row => {
      const values = headers.map(header => {
        const value = row[header] || '';
        return typeof value === 'string' && (value.includes(',') || value.includes('"'))
          ? `"${value.replace(/"/g, '""')}"`
          : value;
      });
      csvContent += values.join(',') + '\n';
    });
  }

  // Create blob and download
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);

  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}.xlsx`);
  link.style.visibility = 'hidden';

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

// Utility to format data for export
export const formatDataForExport = (data, type) => {
  switch (type) {
    case 'contacts':
      return data.map(item => ({
        ...item,
        created_at: item.created_at ? new Date(item.created_at).toLocaleDateString() : null,
        updated_at: item.updated_at ? new Date(item.updated_at).toLocaleDateString() : null
      }));

    case 'deals':
      return data.map(item => ({
        ...item,
        amount: parseFloat(item.amount) || 0,
        expected_close_date: item.expected_close_date ? new Date(item.expected_close_date).toLocaleDateString() : null,
        actual_close_date: item.actual_close_date ? new Date(item.actual_close_date).toLocaleDateString() : null,
        created_at: item.created_at ? new Date(item.created_at).toLocaleDateString() : null,
        updated_at: item.updated_at ? new Date(item.updated_at).toLocaleDateString() : null
      }));

    case 'companies':
      return data.map(item => ({
        ...item,
        created_at: item.created_at ? new Date(item.created_at).toLocaleDateString() : null,
        updated_at: item.updated_at ? new Date(item.updated_at).toLocaleDateString() : null
      }));

    case 'activities':
      return data.map(item => ({
        ...item,
        is_completed: item.is_completed ? 'Yes' : 'No',
        created_at: item.created_at ? new Date(item.created_at).toLocaleDateString() : null,
        updated_at: item.updated_at ? new Date(item.updated_at).toLocaleDateString() : null
      }));

    default:
      return data;
  }
};