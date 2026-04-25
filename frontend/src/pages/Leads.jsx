import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search, Plus, Filter, Download, Upload, Edit2, Trash2,
  ArrowRight, Loader2, X, ChevronDown, Phone, MapPin, Calendar
} from 'lucide-react';
import { useApi } from '../hooks/useApi';
import Modal from '../components/Modal';
import StatusBadge from '../components/StatusBadge';
import {
  formatDate, exportToCSV, parseCSV, LEAD_SOURCES, LEAD_STATUSES, formatCurrency,
  INVERTER_OPTIONS, DCR_PANEL_OPTIONS, NON_DCR_PANEL_OPTIONS, ACDB_OPTIONS, DCDB_OPTIONS,
  STRUCTURE_OPTIONS, AC_CABLE_OPTIONS, DC_CABLE_OPTIONS, PROJECT_STAGES, NET_METER_STATUSES, SUBSIDY_STATUSES
} from '../utils/helpers';

const DEFAULT_PRICING = {
  costPerKw: 50000,
  customKwPricing: {
    '3': 180000,
    '5': 230000
  }
};

const Leads = () => {
  const { get, post, put, del, loading } = useApi();
  const navigate = useNavigate();

  const [leads, setLeads] = useState([]);
  const [stats, setStats] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [sourceFilter, setSourceFilter] = useState('');
  const [sortConfig, setSortConfig] = useState({ key: 'createdAt', direction: 'desc' });

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isConvertModalOpen, setIsConvertModalOpen] = useState(false);
  const [editingLead, setEditingLead] = useState(null);
  const [convertingLead, setConvertingLead] = useState(null);
  const [formData, setFormData] = useState({
    name: '', phone: '', email: '', address: '', loadRequirement: '',
    source: 'Website', status: 'new', followUpDate: '', notes: ''
  });
  const [convertData, setConvertData] = useState({
    systemSize: '', inverter: '', panelType: '', panelCount: '', totalCost: '',
    stage: 'Quotation', netMeterStatus: 'pending', subsidyStatus: 'without subsidy',
    notes: '',
    dcrQty: '', dcrModel: '',
    nonDcrQty: '', nonDcrModel: '',
    acdb: '', dcdb: '',
    structure: '', dcCable: '', acCable: '',
    copperEarthing: '', chemicalEarthing: '', accessories: ''
  });
  const [pricingSettings, setPricingSettings] = useState(DEFAULT_PRICING);

  useEffect(() => {
    const dcr = parseInt(convertData.dcrQty) || 0;
    const nonDcr = parseInt(convertData.nonDcrQty) || 0;
    const panelCount = dcr + nonDcr;
    if (String(convertData.panelCount) !== String(panelCount)) {
      setConvertData(prev => ({ ...prev, panelCount: panelCount || '' }));
    }
  }, [convertData.dcrQty, convertData.nonDcrQty]);

  const estimateProjectCost = (loadKw) => {
    const kw = Number(loadKw);
    if (!Number.isFinite(kw) || kw <= 0) return 0;
    const kwKey = String(Number.isInteger(kw) ? kw : kw);
    const customPrice = pricingSettings?.customKwPricing?.[kwKey];
    if (Number.isFinite(Number(customPrice)) && Number(customPrice) > 0) {
      return Math.round(Number(customPrice));
    }
    return Math.round(kw * (Number(pricingSettings?.costPerKw) || DEFAULT_PRICING.costPerKw));
  };

  useEffect(() => {
    fetchLeads();
    fetchStats();
  }, [statusFilter, sourceFilter, sortConfig]);

  useEffect(() => {
    fetchPricingSettings();
  }, []);

  const fetchLeads = async () => {
    const params = new URLSearchParams();
    if (statusFilter) params.append('status', statusFilter);
    if (sourceFilter) params.append('source', sourceFilter);
    params.append('sortBy', sortConfig.key);
    params.append('sortOrder', sortConfig.direction);

    try {
      const res = await get(`/api/leads?${params}`);
      setLeads(res);
    } catch (err) {
      console.error('Failed to fetch leads:', err);
    }
  };

  const fetchStats = async () => {
    try {
      const res = await get('/api/leads/stats');
      setStats(res);
    } catch (err) {
      console.error('Failed to fetch stats:', err);
    }
  };

  const fetchPricingSettings = async () => {
    try {
      const pricing = await get('/api/settings/pricing');
      setPricingSettings({
        costPerKw: Number(pricing?.costPerKw) || DEFAULT_PRICING.costPerKw,
        customKwPricing: {
          ...DEFAULT_PRICING.customKwPricing,
          ...(pricing?.customKwPricing || {})
        }
      });
    } catch (err) {
      console.error('Failed to fetch pricing settings, using defaults:', err);
      setPricingSettings(DEFAULT_PRICING);
    }
  };

  const filteredLeads = leads.filter(lead =>
    searchQuery === '' ||
    lead.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    lead.phone.includes(searchQuery) ||
    lead.address.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSort = (key) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  const openModal = (lead = null) => {
    if (lead) {
      setEditingLead(lead);
      setFormData({
        name: lead.name,
        phone: lead.phone,
        email: lead.email || '',
        address: lead.address,
        loadRequirement: lead.loadRequirement,
        source: lead.source,
        status: lead.status,
        followUpDate: lead.followUpDate || '',
        notes: lead.notes || ''
      });
    } else {
      setEditingLead(null);
      setFormData({
        name: '', phone: '', email: '', address: '', loadRequirement: '',
        source: 'Website', status: 'new', followUpDate: '', notes: ''
      });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingLead) {
        await put(`/api/leads/${editingLead.id}`, formData);
      } else {
        await post('/api/leads', formData);
      }
      setIsModalOpen(false);
      fetchLeads();
      fetchStats();
    } catch (err) {
      console.error('Failed to save lead:', err);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this lead?')) return;
    try {
      await del(`/api/leads/${id}`);
      fetchLeads();
      fetchStats();
    } catch (err) {
      console.error('Failed to delete lead:', err);
    }
  };

  const openConvertModal = (lead) => {
    setConvertingLead(lead);
    setConvertData({
      systemSize: lead.loadRequirement || '',
      inverter: '',
      panelType: '',
      panelCount: '',
      totalCost: estimateProjectCost(lead.loadRequirement),
      stage: 'Quotation',
      netMeterStatus: 'pending',
      subsidyStatus: 'without subsidy',
      notes: lead.notes || '',
      dcrQty: '', dcrModel: '',
      nonDcrQty: '', nonDcrModel: '',
      acdb: '', dcdb: '',
      structure: '', dcCable: '', acCable: '',
      copperEarthing: '', chemicalEarthing: '', accessories: ''
    });
    setIsConvertModalOpen(true);
  };

  const handleConvert = async (e) => {
    e.preventDefault();
    try {
      await post(`/api/leads/${convertingLead.id}/convert`, convertData);
      
      setIsConvertModalOpen(false);
      fetchLeads();
      fetchStats();
      navigate('/projects');
    } catch (err) {
      console.error('Failed to convert lead:', err);
    }
  };

  const handleExport = () => {
    const exportData = filteredLeads.map(l => ({
      Name: l.name,
      Phone: l.phone,
      Email: l.email,
      Address: l.address,
      'Load (kW)': l.loadRequirement,
      Source: l.source,
      Status: l.status,
      'Follow-up Date': l.followUpDate,
      Notes: l.notes,
      'Created At': l.createdAt
    }));
    exportToCSV(exportData, `leads-${new Date().toISOString().split('T')[0]}.csv`);
  };

  const handleImport = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      const data = await parseCSV(file);
      for (const row of data) {
        await post('/api/leads', {
          name: row.name,
          phone: row.phone,
          email: row.email,
          address: row.address,
          loadRequirement: parseFloat(row.loadRequirement) || 0,
          source: row.source || 'Other',
          status: row.status || 'new',
          followUpDate: row.followUpDate,
          notes: row.notes
        });
      }
      fetchLeads();
      fetchStats();
      alert('Leads imported successfully!');
    } catch (err) {
      alert('Failed to import leads: ' + err.message);
    }
    e.target.value = '';
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Leads</h1>
          <p className="text-sm text-gray-500 mt-1">
            {stats?.total || 0} total · {stats?.converted || 0} converted · {stats?.conversionRate || 0}% rate
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <label className="btn-secondary flex items-center gap-2 cursor-pointer">
            <Upload className="w-4 h-4" />
            <span className="hidden sm:inline">Import</span>
            <input type="file" accept=".csv" className="hidden" onChange={handleImport} />
          </label>
          <button onClick={handleExport} className="btn-secondary flex items-center gap-2">
            <Download className="w-4 h-4" />
            <span className="hidden sm:inline">Export</span>
          </button>
          <button onClick={() => openModal()} className="btn-primary flex items-center gap-2">
            <Plus className="w-4 h-4" />
            New Lead
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="card py-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search leads..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input-field pl-10"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="input-field sm:w-40"
          >
            <option value="">All Statuses</option>
            {LEAD_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <select
            value={sourceFilter}
            onChange={(e) => setSourceFilter(e.target.value)}
            className="input-field sm:w-40"
          >
            <option value="">All Sources</option>
            {LEAD_SOURCES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
      </div>

      {/* Leads Table */}
      <div className="card overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="table-header cursor-pointer" onClick={() => handleSort('name')}>
                  Name {sortConfig.key === 'name' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                </th>
                <th className="table-header">Contact</th>
                <th className="table-header cursor-pointer" onClick={() => handleSort('loadRequirement')}>
                  Load {sortConfig.key === 'loadRequirement' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                </th>
                <th className="table-header">Source</th>
                <th className="table-header">Status</th>
                <th className="table-header">Follow-up</th>
                <th className="table-header text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredLeads.map((lead) => (
                <tr key={lead.id} className="hover:bg-gray-50 transition-colors">
                  <td className="table-cell">
                    <div>
                      <p className="font-medium text-gray-900">{lead.name}</p>
                      <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                        <MapPin className="w-3 h-3" /> {lead.address}
                      </p>
                    </div>
                  </td>
                  <td className="table-cell">
                    <div className="flex items-center gap-1 text-sm text-gray-600">
                      <Phone className="w-3.5 h-3.5" />
                      {lead.phone}
                    </div>
                    {lead.email && <p className="text-xs text-gray-500 mt-0.5">{lead.email}</p>}
                  </td>
                  <td className="table-cell">
                    <span className="font-medium">{lead.loadRequirement} kW</span>
                  </td>
                  <td className="table-cell text-gray-600">{lead.source}</td>
                  <td className="table-cell">
                    <StatusBadge status={lead.status} />
                  </td>
                  <td className="table-cell">
                    {lead.followUpDate ? (
                      <span className={`flex items-center gap-1 text-sm ${new Date(lead.followUpDate) < new Date() && lead.status !== 'converted'
                        ? 'text-red-600 font-medium' : 'text-gray-600'
                        }`}>
                        <Calendar className="w-3.5 h-3.5" />
                        {formatDate(lead.followUpDate)}
                      </span>
                    ) : (
                      <span className="text-gray-400 text-sm">-</span>
                    )}
                  </td>
                  <td className="table-cell text-right">
                    <div className="flex items-center justify-end gap-2">
                      {lead.status !== 'converted' && lead.status !== 'rejected' && (
                        <button
                          onClick={() => openConvertModal(lead)}
                          className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                          title="Convert to Project"
                        >
                          <ArrowRight className="w-4 h-4" />
                        </button>
                      )}
                      <button
                        onClick={() => openModal(lead)}
                        className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Edit"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(lead.id)}
                        className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filteredLeads.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            <p>No leads found</p>
          </div>
        )}
      </div>

      {/* Lead Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}
        title={editingLead ? 'Edit Lead' : 'New Lead'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
              <input required value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })}
                className="input-field" placeholder="Full name" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phone *</label>
              <input required value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })}
                className="input-field" placeholder="+91-XXXXXXXXXX" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input type="email" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })}
              className="input-field" placeholder="email@example.com" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Address *</label>
            <textarea required value={formData.address} onChange={e => setFormData({ ...formData, address: e.target.value })}
              className="input-field min-h-[60px]" placeholder="Full address" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Load (kW) *</label>
              <input required type="number" step="0.1" min="0.5" max="100"
                value={formData.loadRequirement} onChange={e => setFormData({ ...formData, loadRequirement: e.target.value })}
                className="input-field" placeholder="3" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Source *</label>
              <select value={formData.source} onChange={e => setFormData({ ...formData, source: e.target.value })}
                className="input-field">
                {LEAD_SOURCES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status *</label>
              <select value={formData.status} onChange={e => setFormData({ ...formData, status: e.target.value })}
                className="input-field">
                {LEAD_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Follow-up Date</label>
            <input type="date" value={formData.followUpDate} onChange={e => setFormData({ ...formData, followUpDate: e.target.value })}
              className="input-field" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
            <textarea value={formData.notes} onChange={e => setFormData({ ...formData, notes: e.target.value })}
              className="input-field min-h-[80px]" placeholder="Additional notes..." />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setIsModalOpen(false)} className="btn-secondary">Cancel</button>
            <button type="submit" disabled={loading} className="btn-primary flex items-center gap-2">
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              {editingLead ? 'Update' : 'Create'} Lead
            </button>
          </div>
        </form>
      </Modal>

      {/* Convert Modal */}
      <Modal isOpen={isConvertModalOpen} onClose={() => setIsConvertModalOpen(false)} title="Convert Lead to Project" size="lg">
        <form onSubmit={handleConvert} className="space-y-4">
          <div className="bg-solar-50 border border-solar-200 rounded-lg p-4">
            <p className="text-sm font-medium text-solar-800">Converting: {convertingLead?.name}</p>
            <p className="text-xs text-solar-600 mt-1">{convertingLead?.loadRequirement} kW system</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">System Size (kW)</label>
              <input type="number" step="0.1" min="0.5" value={convertData.systemSize}
                onChange={e => setConvertData({ ...convertData, systemSize: e.target.value })}
                className="input-field" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Panel Count</label>
              <input type="number" value={convertData.panelCount}
                onChange={e => setConvertData({ ...convertData, panelCount: e.target.value })}
                className="input-field" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Total Cost (₹)</label>
              <input type="number" min="0" value={convertData.totalCost}
                onChange={e => setConvertData({ ...convertData, totalCost: e.target.value })}
                className="input-field" placeholder="180000" />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Stage</label>
              <select value={convertData.stage}
                onChange={e => setConvertData({ ...convertData, stage: e.target.value })}
                className="input-field">
                {PROJECT_STAGES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Net Meter</label>
              <select value={convertData.netMeterStatus}
                onChange={e => setConvertData({ ...convertData, netMeterStatus: e.target.value })}
                className="input-field">
                {NET_METER_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Subsidy Status</label>
              <select value={convertData.subsidyStatus}
                onChange={e => setConvertData({ ...convertData, subsidyStatus: e.target.value })}
                className="input-field">
                {SUBSIDY_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>

          <div className="bg-gray-50/50 p-4 rounded-xl border border-gray-100 space-y-4">
            <div className="grid grid-cols-1 gap-4">
              <div className="w-full">
                <label className="block text-xs font-medium text-gray-700 mb-1">Inverter Model</label>
                <select
                  value={Object.values(INVERTER_OPTIONS).flat().includes(convertData.inverter) ? convertData.inverter : (convertData.inverter ? 'Other' : '')}
                  onChange={e => setConvertData({ ...convertData, inverter: e.target.value })}
                  className="input-field"
                >
                  <option value="">Select Inverter Model</option>
                  {Object.entries(INVERTER_OPTIONS).map(([brand, options]) => (
                    <optgroup key={brand} label={brand}>
                      {options.map(option => <option key={option} value={option}>{option}</option>)}
                    </optgroup>
                  ))}
                  <option value="Other">Other</option>
                </select>
                {convertData.inverter && !Object.values(INVERTER_OPTIONS).flat().includes(convertData.inverter) && (
                  <input
                    value={convertData.inverter === 'Other' ? '' : convertData.inverter}
                    onChange={e => setConvertData({ ...convertData, inverter: e.target.value })}
                    className="input-field mt-2"
                    placeholder="Enter custom Inverter model..."
                  />
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="grid grid-cols-3 gap-2">
                <div className="col-span-1">
                  <label className="block text-xs font-medium text-gray-500 mb-1">DCR Qty</label>
                  <input type="number" value={convertData.dcrQty} onChange={e => setConvertData({ ...convertData, dcrQty: e.target.value })} className="input-field" placeholder="0" />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-medium text-gray-500 mb-1">DCR Panel Model</label>
                  <select
                    value={DCR_PANEL_OPTIONS.includes(convertData.dcrModel) ? convertData.dcrModel : (convertData.dcrModel ? 'Other' : '')}
                    onChange={e => setConvertData({ ...convertData, dcrModel: e.target.value })}
                    className="input-field"
                  >
                    <option value="">Select DCR Model</option>
                    {DCR_PANEL_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                  </select>
                  {convertData.dcrModel && !DCR_PANEL_OPTIONS.includes(convertData.dcrModel) && (
                    <input
                      value={convertData.dcrModel === 'Other' ? '' : convertData.dcrModel}
                      onChange={e => setConvertData({ ...convertData, dcrModel: e.target.value })}
                      className="input-field mt-2"
                      placeholder="Enter custom DCR model..."
                    />
                  )}
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div className="col-span-1">
                  <label className="block text-xs font-medium text-gray-500 mb-1">Non-DCR Qty</label>
                  <input type="number" value={convertData.nonDcrQty} onChange={e => setConvertData({ ...convertData, nonDcrQty: e.target.value })} className="input-field" placeholder="0" />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-medium text-gray-500 mb-1">Non-DCR Model</label>
                  <select
                    value={NON_DCR_PANEL_OPTIONS.includes(convertData.nonDcrModel) ? convertData.nonDcrModel : (convertData.nonDcrModel ? 'Other' : '')}
                    onChange={e => setConvertData({ ...convertData, nonDcrModel: e.target.value })}
                    className="input-field"
                  >
                    <option value="">Select Non-DCR Model</option>
                    {NON_DCR_PANEL_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                  </select>
                  {convertData.nonDcrModel && !NON_DCR_PANEL_OPTIONS.includes(convertData.nonDcrModel) && (
                    <input
                      value={convertData.nonDcrModel === 'Other' ? '' : convertData.nonDcrModel}
                      onChange={e => setConvertData({ ...convertData, nonDcrModel: e.target.value })}
                      className="input-field mt-2"
                      placeholder="Enter custom Non-DCR model..."
                    />
                  )}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">ACDB</label>
                <select
                  value={ACDB_OPTIONS.includes(convertData.acdb) ? convertData.acdb : (convertData.acdb ? 'Other' : '')}
                  onChange={e => setConvertData({ ...convertData, acdb: e.target.value })}
                  className="input-field"
                >
                  <option value="">Select ACDB</option>
                  {ACDB_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                </select>
                {convertData.acdb && !ACDB_OPTIONS.includes(convertData.acdb) && (
                  <input
                    value={convertData.acdb === 'Other' ? '' : convertData.acdb}
                    onChange={e => setConvertData({ ...convertData, acdb: e.target.value })}
                    className="input-field mt-2"
                    placeholder="Enter custom ACDB details..."
                  />
                )}
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">DCDB</label>
                <select
                  value={DCDB_OPTIONS.includes(convertData.dcdb) ? convertData.dcdb : (convertData.dcdb ? 'Other' : '')}
                  onChange={e => setConvertData({ ...convertData, dcdb: e.target.value })}
                  className="input-field"
                >
                  <option value="">Select DCDB</option>
                  {DCDB_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                </select>
                {convertData.dcdb && !DCDB_OPTIONS.includes(convertData.dcdb) && (
                  <input
                    value={convertData.dcdb === 'Other' ? '' : convertData.dcdb}
                    onChange={e => setConvertData({ ...convertData, dcdb: e.target.value })}
                    className="input-field mt-2"
                    placeholder="Enter custom DCDB details..."
                  />
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Structure</label>
                <select
                  value={STRUCTURE_OPTIONS.includes(convertData.structure) ? convertData.structure : (convertData.structure ? 'Other' : '')}
                  onChange={e => setConvertData({ ...convertData, structure: e.target.value })}
                  className="input-field"
                >
                  <option value="">Select Structure</option>
                  {STRUCTURE_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                </select>
                {convertData.structure && !STRUCTURE_OPTIONS.includes(convertData.structure) && (
                  <input
                    value={convertData.structure === 'Other' ? '' : convertData.structure}
                    onChange={e => setConvertData({ ...convertData, structure: e.target.value })}
                    className="input-field mt-2"
                    placeholder="Enter custom structure details..."
                  />
                )}
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">DC Cable</label>
                <select
                  value={DC_CABLE_OPTIONS.includes(convertData.dcCable) ? convertData.dcCable : (convertData.dcCable ? 'Other' : '')}
                  onChange={e => setConvertData({ ...convertData, dcCable: e.target.value })}
                  className="input-field"
                >
                  <option value="">Select DC Cable</option>
                  {DC_CABLE_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                </select>
                {convertData.dcCable && !DC_CABLE_OPTIONS.includes(convertData.dcCable) && (
                  <input
                    value={convertData.dcCable === 'Other' ? '' : convertData.dcCable}
                    onChange={e => setConvertData({ ...convertData, dcCable: e.target.value })}
                    className="input-field mt-2"
                    placeholder="Enter custom DC cable details..."
                  />
                )}
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">AC Cable</label>
                <select
                  value={AC_CABLE_OPTIONS.includes(convertData.acCable) ? convertData.acCable : (convertData.acCable ? 'Other' : '')}
                  onChange={e => setConvertData({ ...convertData, acCable: e.target.value })}
                  className="input-field"
                >
                  <option value="">Select AC Cable</option>
                  {AC_CABLE_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                </select>
                {convertData.acCable && !AC_CABLE_OPTIONS.includes(convertData.acCable) && (
                  <input
                    value={convertData.acCable === 'Other' ? '' : convertData.acCable}
                    onChange={e => setConvertData({ ...convertData, acCable: e.target.value })}
                    className="input-field mt-2"
                    placeholder="Enter custom AC cable details..."
                  />
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Copper Earthing Cable</label>
                <input value={convertData.copperEarthing} onChange={e => setConvertData({ ...convertData, copperEarthing: e.target.value })} className="input-field" placeholder="Specs for earthing" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Chemical Earthing</label>
                <input value={convertData.chemicalEarthing} onChange={e => setConvertData({ ...convertData, chemicalEarthing: e.target.value })} className="input-field" placeholder="e.g. 2 x 50mm electrodes" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Other Accessories</label>
              <textarea value={convertData.accessories} onChange={e => setConvertData({ ...convertData, accessories: e.target.value })} className="input-field min-h-[50px]" placeholder="MC4 connectors, conduits, etc." />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
            <textarea value={convertData.notes}
              onChange={e => setConvertData({ ...convertData, notes: e.target.value })}
              className="input-field min-h-[80px]" />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setIsConvertModalOpen(false)} className="btn-secondary">Cancel</button>
            <button type="submit" disabled={loading} className="btn-primary flex items-center gap-2 bg-green-600 hover:bg-green-700">
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              Convert to Project
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Leads;
