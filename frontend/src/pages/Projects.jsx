import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Search, Plus, Filter, Download, Edit2, Trash2, ChevronRight,
  Loader2, CheckCircle2, Circle, Clock, Zap, Shield, FileText, Mail
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useApi } from '../hooks/useApi';
import Modal from '../components/Modal';
import StatusBadge from '../components/StatusBadge';
import { formatCurrency, formatDate, exportToCSV, PROJECT_STAGES, NET_METER_STATUSES, SUBSIDY_STATUSES, INVERTER_OPTIONS, DCR_PANEL_OPTIONS, NON_DCR_PANEL_OPTIONS, ACDB_OPTIONS, DCDB_OPTIONS, STRUCTURE_OPTIONS, AC_CABLE_OPTIONS, DC_CABLE_OPTIONS } from '../utils/helpers';
import { generateQuotationPDF } from '../utils/pdfGenerator';

const allInverterModels = Object.values(INVERTER_OPTIONS).flat();

const STAGE_ICONS = {
  Quotation: Circle,
  'Structure installed': Circle,
  'Work completed at site': CheckCircle2,
  'net metering': Shield,
  'Project Completed': CheckCircle2
};

const Projects = () => {
  const { get, post, put, del, patch, loading } = useApi();
  const navigate = useNavigate();

  const [projects, setProjects] = useState([]);
  const [stats, setStats] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [stageFilter, setStageFilter] = useState('');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState(null);
  const [formData, setFormData] = useState({
    customerName: '', phone: '', email: '', address: '',
    systemSize: '', inverter: '', panelType: '', panelCount: '', totalCost: '',
    stage: 'Quotation', netMeterStatus: 'pending', subsidyStatus: 'without subsidy',
    notes: '',
    dcrQty: '', dcrModel: '',
    nonDcrQty: '', nonDcrModel: '',
    acdb: '', dcdb: '',
    structure: '', dcCable: '', acCable: '',
    copperEarthing: '', chemicalEarthing: '', accessories: ''
  });

  useEffect(() => {
    fetchProjects();
    fetchStats();
  }, [stageFilter]);

  // Auto-calculate total panel count
  useEffect(() => {
    const dcr = parseInt(formData.dcrQty) || 0;
    const nonDcr = parseInt(formData.nonDcrQty) || 0;
    if (dcr + nonDcr > 0) {
      setFormData(prev => ({ ...prev, panelCount: dcr + nonDcr }));
    }
  }, [formData.dcrQty, formData.nonDcrQty]);

  // Logic for smart suggestions based on system size
  useEffect(() => {
    if (formData.systemSize && !editingProject) {
      const size = parseFloat(formData.systemSize);
      // Example suggestions for common sizes
    }
  }, [formData.systemSize]);

  const fetchProjects = async () => {
    const params = new URLSearchParams();
    if (stageFilter) params.append('stage', stageFilter);

    try {
      const res = await get(`/api/projects?${params}`);
      setProjects(res);
    } catch (err) {
      console.error('Failed to fetch projects:', err);
    }
  };

  const fetchStats = async () => {
    try {
      const res = await get('/api/projects/stats');
      setStats(res);
    } catch (err) {
      console.error('Failed to fetch stats:', err);
    }
  };

  const filteredProjects = projects.filter(p => 
    searchQuery === '' || 
    p.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.phone.includes(searchQuery)
  );

  // Check if current models are custom/other
  const isOtherDcr = formData.dcrModel && !DCR_PANEL_OPTIONS.filter(opt => opt !== 'Other').includes(formData.dcrModel);
  const isOtherNonDcr = formData.nonDcrModel && !NON_DCR_PANEL_OPTIONS.filter(opt => opt !== 'Other').includes(formData.nonDcrModel);
  const isOtherInverter = formData.inverter && !allInverterModels.includes(formData.inverter);
  const isOtherAcdb = formData.acdb && !ACDB_OPTIONS.filter(opt => opt !== 'Other').includes(formData.acdb);
  const isOtherDcdb = formData.dcdb && !DCDB_OPTIONS.filter(opt => opt !== 'Other').includes(formData.dcdb);
  const isOtherStructure = formData.structure && !STRUCTURE_OPTIONS.filter(opt => opt !== 'Other').includes(formData.structure);
  const isOtherAcCable = formData.acCable && !AC_CABLE_OPTIONS.filter(opt => opt !== 'Other').includes(formData.acCable);
  const isOtherDcCable = formData.dcCable && !DC_CABLE_OPTIONS.filter(opt => opt !== 'Other').includes(formData.dcCable);

  const openModal = (project = null) => {
    if (project) {
      setEditingProject(project);
      setFormData({
        customerName: project.customerName,
        phone: project.phone,
        email: project.email || '',
        address: project.address,
        systemSize: project.systemSize,
        inverter: project.inverter,
        panelType: project.panelType,
        panelCount: project.panelCount,
        totalCost: project.paymentInfo?.totalCost ?? '',
        stage: project.stage,
        netMeterStatus: project.netMeterStatus,
        subsidyStatus: project.subsidyStatus,
        notes: project.notes || '',
        dcrQty: project.dcrQty || '',
        dcrModel: project.dcrModel || '',
        nonDcrQty: project.nonDcrQty || '',
        nonDcrModel: project.nonDcrModel || '',
        acdb: project.acdb || '',
        dcdb: project.dcdb || '',
        structure: project.structure || '',
        dcCable: project.dcCable || '',
        acCable: project.acCable || '',
        copperEarthing: project.copperEarthing || '',
        chemicalEarthing: project.chemicalEarthing || '',
        accessories: project.accessories || ''
      });
    } else {
      setEditingProject(null);
      setFormData({
        customerName: '', phone: '', email: '', address: '',
        systemSize: '', inverter: '', panelType: '', panelCount: '', totalCost: '',
        stage: 'Quotation', netMeterStatus: 'pending', subsidyStatus: 'without subsidy',
        notes: '',
        dcrQty: '', dcrModel: '',
        nonDcrQty: '', nonDcrModel: '',
        acdb: '', dcdb: '',
        structure: '', dcCable: '', acCable: '',
        copperEarthing: '', chemicalEarthing: '', accessories: ''
      });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingProject) {
        await put(`/api/projects/${editingProject.id}`, formData);
        toast.success('Project updated successfully');
      } else {
        await post('/api/projects', formData);
        toast.success('Project created successfully');
      }
      setIsModalOpen(false);
      fetchProjects();
      fetchStats();
    } catch (err) {
      console.error('Failed to save project:', err);
      toast.error(err.message || 'Failed to save project');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure? This will also delete payment records.')) return;
    try {
      await del(`/api/projects/${id}`);
      fetchProjects();
      fetchStats();
    } catch (err) {
      console.error('Failed to delete project:', err);
    }
  };

  const updateStage = async (id, stage) => {
    try {
      await patch(`/api/projects/${id}/stage`, { stage });
      fetchProjects();
      fetchStats();
    } catch (err) {
      console.error('Failed to update stage:', err);
    }
  };

  const handleEmailQuote = async (project) => {
    if (!project.email) {
      alert('No email address found for this customer.');
      return;
    }

    try {
      const doc = await generateQuotationPDF(project, false);
      const pdfBase64 = doc.output('datauristring');
      const res = await post(`/api/projects/${project.id}/email-quotation`, { pdfBase64 });
      alert(res.message || `Quotation emailed to ${project.email} successfully!`);
    } catch (err) {
      console.error('Failed to email quotation:', err);
      // Try to get the specific error message from the backend response
      const errorMsg = err.response?.data?.error || err.message || 'An unexpected error occurred';
      alert(`Email Failed: ${errorMsg}`);
    }
  };

  const updateNetMeter = async (id, status) => {
    try {
      await patch(`/api/projects/${id}/netmeter`, { netMeterStatus: status });
      fetchProjects();
    } catch (err) {
      console.error('Failed to update net meter:', err);
    }
  };

  const updateSubsidy = async (id, status) => {
    try {
      await patch(`/api/projects/${id}/subsidy`, { subsidyStatus: status });
      fetchProjects();
    } catch (err) {
      console.error('Failed to update subsidy:', err);
    }
  };

  const handleExport = () => {
    const exportData = filteredProjects.map(p => ({
      'Lead ID': p.leadId,
      'Customer': p.customerName,
      'Phone': p.phone,
      'Email': p.email,
      'Address': p.address,
      'System Size (kW)': p.systemSize,
      'Inverter': p.inverter,
      'Panel Type': p.panelType,
      'Panel Count': p.panelCount,
      'Stage': p.stage,
      'Net Meter Status': p.netMeterStatus,
      'Subsidy Status': p.subsidyStatus,
      'Start Date': p.startDate,
      'Notes': p.notes,
      'Project ID': p.id,
      'Created At': p.createdAt,
      'Updated At': p.updatedAt,
      'Total Cost': p.paymentInfo?.totalCost || '',
      'Advance Paid': p.paymentInfo?.advancePaid || '',
      'Remaining Balance': p.paymentInfo?.remainingBalance || ''
    }));
    exportToCSV(exportData, `projects-${new Date().toISOString().split('T')[0]}.csv`);
  };

  const getStageProgress = (currentStage) => {
    const stages = PROJECT_STAGES;
    const currentIndex = stages.indexOf(currentStage);
    return ((currentIndex + 1) / stages.length) * 100;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Projects</h1>
          <p className="text-sm text-gray-500 mt-1">
            {stats?.total || 0} total · {stats?.['Project Completed'] || 0} completed · {stats?.['Structure installed'] || 0} installing
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={handleExport} className="btn-secondary flex items-center gap-2">
            <Download className="w-4 h-4" />
            <span className="hidden sm:inline">Export</span>
          </button>
          <button onClick={() => openModal()} className="btn-primary flex items-center gap-2">
            <Plus className="w-4 h-4" />
            New Project
          </button>
        </div>
      </div>

      {/* Stage Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {PROJECT_STAGES.map(stage => (
          <button
            key={stage}
            onClick={() => setStageFilter(stageFilter === stage ? '' : stage)}
            className={`p-3 rounded-xl border text-center transition-all ${
              stageFilter === stage 
                ? 'bg-primary-50 border-primary-200 shadow-sm' 
                : 'bg-white border-gray-200 hover:border-gray-300'
            }`}
          >
            <p className="text-lg font-bold text-gray-900">{stats?.[stage] || 0}</p>
            <p className="text-xs text-gray-500 capitalize">{stage}</p>
          </button>
        ))}
      </div>

      {/* Filters */}
      <div className="card py-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search projects..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="input-field pl-10"
          />
        </div>
      </div>

      {/* Projects Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {filteredProjects.map((project) => (
          <div key={project.id} className="card hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-start gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-gray-900">{project.customerName}</h3>
                    <button 
                      onClick={async () => await generateQuotationPDF(project)}
                      className="p-1 text-primary-600 hover:bg-primary-50 rounded transition-colors"
                      title="Generate Quotation PDF"
                    >
                      <FileText className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={async () => await handleEmailQuote(project)}
                      className="p-1 text-primary-600 hover:bg-primary-50 rounded transition-colors"
                      disabled={loading}
                      title="Email Quotation to Customer"
                    >
                      <Mail className="w-4 h-4" />
                    </button>
                  </div>
                  <p className="text-sm text-gray-500">{project.phone}</p>
                  <p className="text-xs text-gray-400 mt-1">{project.address}</p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button onClick={() => openModal(project)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg">
                  <Edit2 className="w-4 h-4" />
                </button>
                <button onClick={() => handleDelete(project.id)} className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* System Info */}
            <div className="grid grid-cols-3 gap-3 mb-4">
              <div className="bg-gray-50 rounded-lg p-2 text-center">
                <p className="text-lg font-bold text-gray-900">{project.systemSize}</p>
                <p className="text-xs text-gray-500">kW</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-2 text-center">
                <p className="text-lg font-bold text-gray-900">{project.panelCount}</p>
                <p className="text-xs text-gray-500">Panels</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-2 text-center">
                <p className="text-lg font-bold text-gray-900">{formatDate(project.startDate)}</p>
                <p className="text-xs text-gray-500">Started</p>
              </div>
            </div>

            {/* Financial Info */}
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="bg-gray-50 rounded-lg p-2 text-center">
                <p className="text-sm font-bold text-gray-900 overflow-hidden text-ellipsis">{formatCurrency(project.paymentInfo?.totalCost || 0)}</p>
                <p className="text-xs text-gray-500">Total Cost</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-2 text-center">
                <p className="text-sm font-bold text-green-600 overflow-hidden text-ellipsis">{formatCurrency(project.paymentInfo?.advancePaid || 0)}</p>
                <p className="text-xs text-gray-500">Payment Received</p>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="mb-4">
              <div className="flex justify-between text-xs text-gray-500 mb-1">
                <span>Progress</span>
                <span>{Math.round(getStageProgress(project.stage))}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-primary-500 h-2 rounded-full transition-all duration-500"
                  style={{ width: `${getStageProgress(project.stage)}%` }}
                />
              </div>
            </div>

            {/* Stage Selector */}
            <div className="mb-3">
              <label className="text-xs font-medium text-gray-500 mb-1 block">Stage</label>
              <select 
                value={project.stage}
                onChange={(e) => updateStage(project.id, e.target.value)}
                className="input-field text-sm py-1.5"
              >
                {PROJECT_STAGES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>

            {/* Status Grid */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-gray-500 mb-1 block">Net Meter</label>
                <select 
                  value={project.netMeterStatus}
                  onChange={(e) => updateNetMeter(project.id, e.target.value)}
                  className="input-field text-sm py-1.5"
                >
                  {NET_METER_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500 mb-1 block">Subsidy</label>
                <select 
                  value={project.subsidyStatus}
                  onChange={(e) => updateSubsidy(project.id, e.target.value)}
                  className="input-field text-sm py-1.5"
                >
                  {SUBSIDY_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between">
              <StatusBadge status={project.stage} />
              <button 
                onClick={() => navigate(`/payments?project=${project.id}`)}
                className="text-sm text-primary-600 hover:text-primary-700 font-medium flex items-center gap-1"
              >
                Payments <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {filteredProjects.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          <p>No projects found</p>
        </div>
      )}

      {/* Project Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} 
             title={editingProject ? 'Edit Project' : 'New Project'} size="lg">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Customer Name *</label>
              <input required value={formData.customerName} 
                     onChange={e => setFormData({...formData, customerName: e.target.value})}
                     className="input-field" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phone *</label>
              <input required value={formData.phone}
                     onChange={e => setFormData({...formData, phone: e.target.value})}
                     className="input-field" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input type="email" value={formData.email}
                   onChange={e => setFormData({...formData, email: e.target.value})}
                   className="input-field" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Address *</label>
            <textarea required value={formData.address}
                      onChange={e => setFormData({...formData, address: e.target.value})}
                      className="input-field min-h-[60px]" />
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">System Size (kW) *</label>
              <input required type="number" step="0.1" min="0.5"
                     value={formData.systemSize}
                     onChange={e => setFormData({...formData, systemSize: e.target.value})}
                     className="input-field" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Panel Count</label>
              <input type="number" value={formData.panelCount}
                     onChange={e => setFormData({...formData, panelCount: e.target.value})}
                     className="input-field" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Total Cost (₹)</label>
              <input type="number" min="0" value={formData.totalCost}
                     onChange={e => setFormData({...formData, totalCost: e.target.value})}
                     className="input-field" placeholder="180000" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Stage</label>
              <select value={formData.stage}
                      onChange={e => setFormData({...formData, stage: e.target.value})}
                      className="input-field">
                {PROJECT_STAGES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Net Meter</label>
              <select value={formData.netMeterStatus}
                      onChange={e => setFormData({...formData, netMeterStatus: e.target.value})}
                      className="input-field">
                {NET_METER_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>

          {/* System Components & Materials Section */}
          <div className="relative py-2">
            <div className="absolute inset-0 flex items-center" aria-hidden="true">
              <div className="w-full border-t border-gray-200"></div>
            </div>
            <div className="relative flex justify-start">
              <span className="pr-3 bg-white text-sm font-bold text-primary-700 flex items-center gap-2">
                <Zap className="w-4 h-4" /> System Components & Materials
              </span>
            </div>
          </div>

          <div className="bg-gray-50/50 p-4 rounded-xl border border-gray-100 space-y-4">
            <div className="grid grid-cols-1 gap-4">
              <div className="w-full">
                <label className="block text-xs font-medium text-gray-700 mb-1">Inverter Model</label>
                <select
                  value={allInverterModels.includes(formData.inverter) ? formData.inverter : (formData.inverter ? 'Other' : '')}
                  onChange={e => setFormData({...formData, inverter: e.target.value})}
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
                {isOtherInverter && (
                  <input
                    value={formData.inverter === 'Other' ? '' : formData.inverter}
                    onChange={e => setFormData({...formData, inverter: e.target.value})}
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
                  <input type="number" value={formData.dcrQty} onChange={e => setFormData({...formData, dcrQty: e.target.value})} className="input-field" placeholder="0" />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-medium text-gray-500 mb-1">DCR Panel Model</label>
                  <select 
                    value={DCR_PANEL_OPTIONS.includes(formData.dcrModel) ? formData.dcrModel : (formData.dcrModel ? 'Other' : '')} 
                    onChange={e => setFormData({...formData, dcrModel: e.target.value})} 
                    className="input-field"
                  >
                    <option value="">Select DCR Model</option>
                    {DCR_PANEL_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                  </select>
                  {isOtherDcr && (
                    <input 
                      value={formData.dcrModel === 'Other' ? '' : formData.dcrModel}
                      onChange={e => setFormData({...formData, dcrModel: e.target.value})}
                      className="input-field mt-2"
                      placeholder="Enter custom DCR model..."
                    />
                  )}
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div className="col-span-1">
                  <label className="block text-xs font-medium text-gray-500 mb-1">Non-DCR Qty</label>
                  <input type="number" value={formData.nonDcrQty} onChange={e => setFormData({...formData, nonDcrQty: e.target.value})} className="input-field" placeholder="0" />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-medium text-gray-500 mb-1">Non-DCR Model</label>
                  <select 
                    value={NON_DCR_PANEL_OPTIONS.includes(formData.nonDcrModel) ? formData.nonDcrModel : (formData.nonDcrModel ? 'Other' : '')} 
                    onChange={e => setFormData({...formData, nonDcrModel: e.target.value})} 
                    className="input-field"
                  >
                    <option value="">Select Non-DCR Model</option>
                    {NON_DCR_PANEL_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                  </select>
                  {isOtherNonDcr && (
                    <input 
                      value={formData.nonDcrModel === 'Other' ? '' : formData.nonDcrModel}
                      onChange={e => setFormData({...formData, nonDcrModel: e.target.value})}
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
                  value={ACDB_OPTIONS.includes(formData.acdb) ? formData.acdb : (formData.acdb ? 'Other' : '')}
                  onChange={e => setFormData({...formData, acdb: e.target.value})}
                  className="input-field"
                >
                  <option value="">Select ACDB</option>
                  {ACDB_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                </select>
                {isOtherAcdb && (
                  <input
                    value={formData.acdb === 'Other' ? '' : formData.acdb}
                    onChange={e => setFormData({...formData, acdb: e.target.value})}
                    className="input-field mt-2"
                    placeholder="Enter custom ACDB details..."
                  />
                )}
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">DCDB</label>
                <select
                  value={DCDB_OPTIONS.includes(formData.dcdb) ? formData.dcdb : (formData.dcdb ? 'Other' : '')}
                  onChange={e => setFormData({...formData, dcdb: e.target.value})}
                  className="input-field"
                >
                  <option value="">Select DCDB</option>
                  {DCDB_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                </select>
                {isOtherDcdb && (
                  <input
                    value={formData.dcdb === 'Other' ? '' : formData.dcdb}
                    onChange={e => setFormData({...formData, dcdb: e.target.value})}
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
                  value={STRUCTURE_OPTIONS.includes(formData.structure) ? formData.structure : (formData.structure ? 'Other' : '')}
                  onChange={e => setFormData({...formData, structure: e.target.value})}
                  className="input-field"
                >
                  <option value="">Select Structure</option>
                  {STRUCTURE_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                </select>
                {isOtherStructure && (
                  <input
                    value={formData.structure === 'Other' ? '' : formData.structure}
                    onChange={e => setFormData({...formData, structure: e.target.value})}
                    className="input-field mt-2"
                    placeholder="Enter custom structure details..."
                  />
                )}
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">DC Cable</label>
                <select
                  value={DC_CABLE_OPTIONS.includes(formData.dcCable) ? formData.dcCable : (formData.dcCable ? 'Other' : '')}
                  onChange={e => setFormData({...formData, dcCable: e.target.value})}
                  className="input-field"
                >
                  <option value="">Select DC Cable</option>
                  {DC_CABLE_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                </select>
                {isOtherDcCable && (
                  <input
                    value={formData.dcCable === 'Other' ? '' : formData.dcCable}
                    onChange={e => setFormData({...formData, dcCable: e.target.value})}
                    className="input-field mt-2"
                    placeholder="Enter custom DC cable details..."
                  />
                )}
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">AC Cable</label>
                <select
                  value={AC_CABLE_OPTIONS.includes(formData.acCable) ? formData.acCable : (formData.acCable ? 'Other' : '')}
                  onChange={e => setFormData({...formData, acCable: e.target.value})}
                  className="input-field"
                >
                  <option value="">Select AC Cable</option>
                  {AC_CABLE_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                </select>
                {isOtherAcCable && (
                  <input
                    value={formData.acCable === 'Other' ? '' : formData.acCable}
                    onChange={e => setFormData({...formData, acCable: e.target.value})}
                    className="input-field mt-2"
                    placeholder="Enter custom AC cable details..."
                  />
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Copper Earthing Cable</label>
                <input value={formData.copperEarthing} onChange={e => setFormData({...formData, copperEarthing: e.target.value})} className="input-field" placeholder="Specs for earthing" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Chemical Earthing</label>
                <input value={formData.chemicalEarthing} onChange={e => setFormData({...formData, chemicalEarthing: e.target.value})} className="input-field" placeholder="e.g. 2 x 50mm electrodes" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Other Accessories</label>
              <textarea value={formData.accessories} onChange={e => setFormData({...formData, accessories: e.target.value})} className="input-field min-h-[50px]" placeholder="MC4 connectors, conduits, etc." />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Subsidy Status</label>
            <select value={formData.subsidyStatus}
                    onChange={e => setFormData({...formData, subsidyStatus: e.target.value})}
                    className="input-field">
              {SUBSIDY_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
            <textarea value={formData.notes}
                      onChange={e => setFormData({...formData, notes: e.target.value})}
                      className="input-field min-h-[80px]" />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setIsModalOpen(false)} className="btn-secondary">Cancel</button>
            <button type="submit" disabled={loading} className="btn-primary flex items-center gap-2">
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              {editingProject ? 'Update' : 'Create'} Project
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Projects;
