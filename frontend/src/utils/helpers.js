export const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(amount || 0);
};

export const formatCurrencyPDF = (amount) => {
  const formattedNumber = new Intl.NumberFormat('en-IN', {
    maximumFractionDigits: 0
  }).format(amount || 0);
  return `INR ${formattedNumber}`;
};
export const formatDate = (dateString) => {
  if (!dateString) return '-';
  return new Date(dateString).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });
};

export const formatDateTime = (dateString) => {
  if (!dateString) return '-';
  return new Date(dateString).toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

export const getStatusColor = (status) => {
  const colors = {
    // Lead statuses
    new: 'bg-blue-100 text-blue-800',
    contacted: 'bg-purple-100 text-purple-800',
    interested: 'bg-solar-100 text-solar-800',
    converted: 'bg-green-100 text-green-800',
    rejected: 'bg-red-100 text-red-800',
    // Project stages
    Quotation: 'bg-solar-100 text-solar-800',
    'Structure installed': 'bg-indigo-100 text-indigo-800',
    'Work completed at site': 'bg-orange-100 text-orange-800',
    'net metering': 'bg-cyan-100 text-cyan-800',
    'Project Completed': 'bg-green-100 text-green-800',
    // Net meter status
    pending: 'bg-yellow-100 text-yellow-800',
    applied: 'bg-blue-100 text-blue-800',
    approved: 'bg-green-100 text-green-800',
    installed: 'bg-emerald-100 text-emerald-800',
    // Subsidy status
    'without subsidy': 'bg-gray-100 text-gray-800',
    received: 'bg-green-100 text-green-800'
  };
  return colors[status] || 'bg-gray-100 text-gray-800';
};

export const getPriorityColor = (priority) => {
  const colors = {
    high: 'bg-red-100 text-red-800 border-red-200',
    medium: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    low: 'bg-green-100 text-green-800 border-green-200'
  };
  return colors[priority] || colors.low;
};

export const exportToCSV = (data, filename) => {
  if (!data || data.length === 0) return;

  const headers = Object.keys(data[0]);
  const csvContent = [
    headers.join(','),
    ...data.map(row => 
      headers.map(h => {
        const val = row[h];
        if (val === null || val === undefined) return '';
        const str = String(val);
        if (str.includes(',') || str.includes('"') || str.includes('\n')) {
          return `"${str.replace(/"/g, '""')}"`;
        }
        return str;
      }).join(',')
    )
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  link.click();
};

export const parseCSV = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target.result;
      const lines = text.split('\n').filter(l => l.trim());
      const headers = lines[0].split(',').map(h => h.trim());
      const data = lines.slice(1).map(line => {
        const values = line.split(',').map(v => v.trim().replace(/^"|"$/g, ''));
        const obj = {};
        headers.forEach((h, i) => {
          obj[h] = values[i] || '';
        });
        return obj;
      });
      resolve(data);
    };
    reader.onerror = reject;
    reader.readAsText(file);
  });
};

export const LEAD_SOURCES = ['Website', 'Referral', 'Facebook', 'Google Ads', 'Walk-in', 'Other'];
export const LEAD_STATUSES = ['new', 'contacted', 'interested', 'converted', 'rejected'];
export const PROJECT_STAGES = ['Quotation', 'Structure installed', 'Work completed at site', 'net metering', 'Project Completed'];
export const NET_METER_STATUSES = ['pending', 'applied', 'approved', 'installed'];
export const SUBSIDY_STATUSES = ['applied', 'received', 'without subsidy'];

export const INVERTER_OPTIONS = {
  'Waaree': [
    'Waaree 3 KW Single Phase Solar On-Grid Inverter',
    'Waaree 5 KW Three Phase Solar On-Grid Inverter',
    'Waaree 8 KW Three Phase Solar On-Grid Inverter',
    'Waaree 15 kW Three-Phase Solar On-Grid Inverter'
  ],
  'UTL': [
    'UTL 3 KW Single Phase Solar On-Grid Inverter',
    'UTL 5 KW Three Phase Solar On-Grid Inverter',
    'UTL 8 KW Three Phase Solar On-Grid Inverter',
    'UTL 15 kW Three-Phase Solar On-Grid Inverter'
  ],
  'Luminous': [
    'Luminous 3 kW Single-Phase Solar On-Grid Inverter',
    'Luminous 5 kW Three-Phase Solar On-Grid Inverter',
    'Luminous 8 kW Three-Phase Solar On-Grid Inverter',
    'Luminous 15 kW Three-Phase Solar On-Grid Inverter'
  ],
  'Microtex': [
    'Microtex 3 KW Single Phase Solar On-Grid Inverter',
    'Microtex 5 kW Three-Phase Solar On-Grid Inverter',
    'Microtex 8 kW Three-Phase Solar On-Grid Inverter',
    'Microtex 15 kW Three-Phase Solar On-Grid Inverter'
  ],
  'Polycab': [
    'Polycab 3 kW Single-Phase Solar On-Grid Inverter',
    'Polycab 5 kW Three-Phase Solar On-Grid Inverter',
    'Polycab 8 kW Three-Phase Solar On-Grid Inverter',
    'Polycab 15 kW Three-Phase Solar On-Grid Inverter'
  ],
  'Su-Kam': [
    'Su-Kam 3 kW Single-Phase Solar On-Grid Inverter',
    'Su-Kam 5 kW Three-Phase Solar On-Grid Inverter',
    'Su-Kam 8 kW Three-Phase Solar On-Grid Inverter',
    'Su-Kam 15 kW Three-Phase Solar On-Grid Inverter'
  ],
  'Eastmen': [
    'Eastmen 3 kW Single-Phase Solar On-Grid Inverter',
    'Eastmen 5 kW Three-Phase Solar On-Grid Inverter',
    'Eastmen 8 kW Three-Phase Solar On-Grid Inverter',
    'Eastmen 15 kW Three-Phase Solar On-Grid Inverter'
  ]
};

export const DCR_PANEL_OPTIONS = [
  'Waaree Topcon Panel (560/570/580W)',
  'Adani Topcon Panel (560/570/580/595W)',
  'Luminous Topcon Panel (560/570/580/595W)',
  'Tata Topcon Panel (550/560/570W)',
  'UTL Topcon Panel (540/550/560W)',
  'Other'
];

export const NON_DCR_PANEL_OPTIONS = [
  'Waaree Topcon Panel (580/585/590/595W)',
  'Adani Topcon Panel (560/570/580/595W)',
  'Luminous Topcon Panel (560/570/580/595W)',
  'Tata Topcon Panel (550/560/570W)',
  'UTL Topcon Panel (540/550/560W)',
  'Other'
];

export const ACDB_OPTIONS = [
  'Havells MCB with IP 65 enclosure',
  'Polycab MCB with IP 65 enclosure',
  'Other'
];

export const DCDB_OPTIONS = [
  'Havells fuses or MCB with SPD',
  'Polycab fuses or MCB with SPD',
  'Other'
];

export const STRUCTURE_OPTIONS = [
  'GI Heavy C-Channel Hot-dip galvanized mounting structure',
  'JSW C-Channel Hot-dip galvanized mounting structure',
  'Apollo C-Channel Hot-dip galvanized mounting structure',
  'Other'
];

export const AC_CABLE_OPTIONS = [
  'Polycab 4mm AC cable',
  'RR Kabel 4mm AC cable',
  'KEI 4mm AC cable',
  'Other'
];

export const DC_CABLE_OPTIONS = [
  'Polycab 4mm DC cable',
  'RR Kabel 4mm DC cable',
  'KEI 4mm DC cable',
  'Other'
];

export const PAYMENT_METHODS = ['Cash', 'Bank Transfer', 'UPI', 'Cheque', 'Card'];
