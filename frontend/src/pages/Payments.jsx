import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { 
  Search, Plus, Download, IndianRupee, Calendar, CreditCard, Edit2,
  Loader2, CheckCircle2, AlertCircle
} from 'lucide-react';
import { useApi } from '../hooks/useApi';
import Modal from '../components/Modal';
import { formatCurrency, formatDate, exportToCSV, PAYMENT_METHODS } from '../utils/helpers';

const Payments = () => {
  const { get, post, put, loading } = useApi();
  const [searchParams] = useSearchParams();
  const projectFilter = searchParams.get('project');

  const [payments, setPayments] = useState([]);
  const [stats, setStats] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isEditReceivedModalOpen, setIsEditReceivedModalOpen] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [paymentForm, setPaymentForm] = useState({
    amount: '', method: 'Bank Transfer', description: '', date: new Date().toISOString().split('T')[0]
  });
  const [editReceivedForm, setEditReceivedForm] = useState({
    advancePaid: '',
    adjustmentNote: '',
    date: new Date().toISOString().split('T')[0]
  });

  useEffect(() => {
    fetchPayments();
    fetchStats();
  }, []);

  const fetchPayments = async () => {
    try {
      const res = await get('/api/payments');
      setPayments(res);
    } catch (err) {
      console.error('Failed to fetch payments:', err);
    }
  };

  const fetchStats = async () => {
    try {
      const res = await get('/api/payments/stats');
      setStats(res);
    } catch (err) {
      console.error('Failed to fetch stats:', err);
    }
  };

  const filteredPayments = payments.filter(p => {
    const matchesSearch = searchQuery === '' || p.customerName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesProject = !projectFilter || p.projectId === projectFilter;
    let matchesStatus = true;
    if (statusFilter === 'fullyPaid') matchesStatus = p.remainingBalance === 0;
    else if (statusFilter === 'partiallyPaid') matchesStatus = p.advancePaid > 0 && p.remainingBalance > 0;
    else if (statusFilter === 'unpaid') matchesStatus = p.advancePaid === 0;
    
    return matchesSearch && matchesProject && matchesStatus;
  });

  const openPaymentModal = (payment) => {
    setSelectedPayment(payment);
    setPaymentForm({
      amount: '',
      method: 'Bank Transfer',
      description: '',
      date: new Date().toISOString().split('T')[0]
    });
    setIsPaymentModalOpen(true);
  };

  const openEditReceivedModal = (payment) => {
    setSelectedPayment(payment);
    setEditReceivedForm({
      advancePaid: payment.advancePaid,
      adjustmentNote: '',
      date: new Date().toISOString().split('T')[0]
    });
    setIsEditReceivedModalOpen(true);
  };

  const handleAddPayment = async (e) => {
    e.preventDefault();
    try {
      await post('/api/payments', {
        projectId: selectedPayment.projectId,
        ...paymentForm,
        amount: parseFloat(paymentForm.amount)
      });
      setIsPaymentModalOpen(false);
      fetchPayments();
      fetchStats();
    } catch (err) {
      console.error('Failed to add payment:', err);
    }
  };

  const handleEditReceivedPayment = async (e) => {
    e.preventDefault();
    try {
      await put(`/api/payments/${selectedPayment.id}`, {
        advancePaid: parseFloat(editReceivedForm.advancePaid),
        adjustmentNote: editReceivedForm.adjustmentNote,
        date: editReceivedForm.date
      });
      setIsEditReceivedModalOpen(false);
      fetchPayments();
      fetchStats();
    } catch (err) {
      console.error('Failed to edit received payment:', err);
    }
  };

  const handleExport = () => {
    const exportData = filteredPayments.map(p => ({
      'Customer': p.customerName,
      'Total Cost': p.totalCost,
      'Advance Paid': p.advancePaid,
      'Remaining': p.remainingBalance,
      'Status': p.remainingBalance === 0 ? 'Paid' : p.advancePaid > 0 ? 'Partial' : 'Unpaid'
    }));
    exportToCSV(exportData, `payments-${new Date().toISOString().split('T')[0]}.csv`);
  };

  const getPaymentStatus = (payment) => {
    if (payment.remainingBalance === 0) return { label: 'Paid', color: 'bg-green-100 text-green-800' };
    if (payment.advancePaid > 0) return { label: 'Partial', color: 'bg-yellow-100 text-yellow-800' };
    return { label: 'Unpaid', color: 'bg-red-100 text-red-800' };
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Payments</h1>
          <p className="text-sm text-gray-500 mt-1">
            {stats?.totalRevenue ? formatCurrency(stats.totalRevenue) : '₹0'} received · 
            {stats?.totalPending ? formatCurrency(stats.totalPending) : '₹0'} pending
          </p>
        </div>
        <button onClick={handleExport} className="btn-secondary flex items-center gap-2">
          <Download className="w-4 h-4" />
          Export
        </button>
      </div>

      {/* Payment Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <button 
          onClick={() => setStatusFilter(statusFilter === 'fullyPaid' ? '' : 'fullyPaid')}
          className={`card text-left transition-all ${statusFilter === 'fullyPaid' ? 'ring-2 ring-primary-500 bg-primary-50' : 'hover:border-gray-300'}`}
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-50 rounded-lg flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Fully Paid</p>
              <p className="text-xl font-bold text-gray-900">{stats?.fullyPaid || 0}</p>
            </div>
          </div>
        </button>
        <button 
          onClick={() => setStatusFilter(statusFilter === 'partiallyPaid' ? '' : 'partiallyPaid')}
          className={`card text-left transition-all ${statusFilter === 'partiallyPaid' ? 'ring-2 ring-primary-500 bg-primary-50' : 'hover:border-gray-300'}`}
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-yellow-50 rounded-lg flex items-center justify-center">
              <AlertCircle className="w-5 h-5 text-yellow-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Partially Paid</p>
              <p className="text-xl font-bold text-gray-900">{stats?.partiallyPaid || 0}</p>
            </div>
          </div>
        </button>
        <button 
          onClick={() => setStatusFilter(statusFilter === 'unpaid' ? '' : 'unpaid')}
          className={`card text-left transition-all ${statusFilter === 'unpaid' ? 'ring-2 ring-primary-500 bg-primary-50' : 'hover:border-gray-300'}`}
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-red-50 rounded-lg flex items-center justify-center">
              <IndianRupee className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Unpaid</p>
              <p className="text-xl font-bold text-gray-900">{stats?.unpaid || 0}</p>
            </div>
          </div>
        </button>
      </div>

      {/* Search */}
      <div className="card py-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search payments..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="input-field pl-10"
          />
        </div>
      </div>

      {/* Payments List */}
      <div className="space-y-4">
        {filteredPayments.map((payment) => {
          const status = getPaymentStatus(payment);
          const progress = payment.totalCost > 0 ? (payment.advancePaid / payment.totalCost) * 100 : 0;

          return (
            <div key={payment.id} className="card hover:shadow-md transition-shadow">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
                <div>
                  <h3 className="font-semibold text-gray-900">{payment.customerName}</h3>
                  <p className="text-sm text-gray-500">Project ID: {payment.projectId}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${status.color}`}>
                    {status.label}
                  </span>
                  <button
                    onClick={() => openEditReceivedModal(payment)}
                    className="btn-secondary text-sm py-1.5 px-2.5 flex items-center justify-center"
                    title="Edit received"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  {payment.remainingBalance > 0 && (
                    <button 
                      onClick={() => openPaymentModal(payment)}
                      className="btn-primary text-sm py-1.5 px-3 flex items-center gap-1"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Add Payment
                    </button>
                  )}
                </div>
              </div>

              {/* Payment Progress */}
              <div className="grid grid-cols-3 gap-4 mb-4">
                <div className="text-center">
                  <p className="text-xs text-gray-500">Total Cost</p>
                  <p className="text-lg font-bold text-gray-900">{formatCurrency(payment.totalCost)}</p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-gray-500">Paid</p>
                  <p className="text-lg font-bold text-green-600">{formatCurrency(payment.advancePaid)}</p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-gray-500">Remaining</p>
                  <p className="text-lg font-bold text-red-600">{formatCurrency(payment.remainingBalance)}</p>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="mb-4">
                <div className="w-full bg-gray-200 rounded-full h-2.5">
                  <div 
                    className="bg-primary-500 h-2.5 rounded-full transition-all"
                    style={{ width: `${Math.min(progress, 100)}%` }}
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1 text-right">{Math.round(progress)}% paid</p>
              </div>

              {/* Payment History */}
              {payment.paymentHistory.length > 0 && (
                <div className="border-t border-gray-100 pt-3">
                  <p className="text-xs font-medium text-gray-500 mb-2">Payment History</p>
                  <div className="space-y-2">
                    {payment.paymentHistory.map((ph) => (
                      <div key={ph.id} className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                          <CreditCard className="w-3.5 h-3.5 text-gray-400" />
                          <span className="text-gray-600">{formatDate(ph.date)}</span>
                          <span className="text-gray-400">·</span>
                          <span className="text-gray-600">{ph.method}</span>
                          {ph.description && (
                            <>
                              <span className="text-gray-400">·</span>
                              <span className="text-gray-500">{ph.description}</span>
                            </>
                          )}
                        </div>
                        <span className="font-medium text-green-600">+{formatCurrency(ph.amount)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {filteredPayments.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          <p>No payment records found</p>
        </div>
      )}

      {/* Add Payment Modal */}
      <Modal isOpen={isPaymentModalOpen} onClose={() => setIsPaymentModalOpen(false)} title="Add Payment">
        <form onSubmit={handleAddPayment} className="space-y-4">
          <div className="bg-primary-50 border border-primary-200 rounded-lg p-4">
            <p className="text-sm font-medium text-primary-800">{selectedPayment?.customerName}</p>
            <p className="text-xs text-primary-600 mt-1">
              Remaining: {formatCurrency(selectedPayment?.remainingBalance || 0)}
            </p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Amount (₹) *</label>
            <input 
              type="number" 
              required 
              min="1" 
              max={selectedPayment?.remainingBalance}
              value={paymentForm.amount}
              onChange={e => setPaymentForm({...paymentForm, amount: e.target.value})}
              className="input-field" 
              placeholder="Enter amount"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Payment Method *</label>
            <select 
              value={paymentForm.method}
              onChange={e => setPaymentForm({...paymentForm, method: e.target.value})}
              className="input-field"
            >
              {PAYMENT_METHODS.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Date *</label>
            <input 
              type="date" 
              required
              value={paymentForm.date}
              onChange={e => setPaymentForm({...paymentForm, date: e.target.value})}
              className="input-field"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea 
              value={paymentForm.description}
              onChange={e => setPaymentForm({...paymentForm, description: e.target.value})}
              className="input-field min-h-[60px]" 
              placeholder="Payment description..."
            />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setIsPaymentModalOpen(false)} className="btn-secondary">Cancel</button>
            <button type="submit" disabled={loading} className="btn-primary flex items-center gap-2">
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              Record Payment
            </button>
          </div>
        </form>
      </Modal>

      {/* Edit Received Modal */}
      <Modal
        isOpen={isEditReceivedModalOpen}
        onClose={() => setIsEditReceivedModalOpen(false)}
        title="Edit Received Payment"
      >
        <form onSubmit={handleEditReceivedPayment} className="space-y-4">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <p className="text-sm font-medium text-yellow-800">{selectedPayment?.customerName}</p>
            <p className="text-xs text-yellow-700 mt-1">
              Total Cost: {formatCurrency(selectedPayment?.totalCost || 0)}
            </p>
            <p className="text-xs text-yellow-700">
              Current Received: {formatCurrency(selectedPayment?.advancePaid || 0)}
            </p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Received Payment (₹) *</label>
            <input
              type="number"
              required
              min="0"
              max={selectedPayment?.totalCost}
              value={editReceivedForm.advancePaid}
              onChange={e => setEditReceivedForm({ ...editReceivedForm, advancePaid: e.target.value })}
              className="input-field"
              placeholder="Enter corrected received amount"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Adjustment Date *</label>
            <input
              type="date"
              required
              value={editReceivedForm.date}
              onChange={e => setEditReceivedForm({ ...editReceivedForm, date: e.target.value })}
              className="input-field"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Reason / Note</label>
            <textarea
              value={editReceivedForm.adjustmentNote}
              onChange={e => setEditReceivedForm({ ...editReceivedForm, adjustmentNote: e.target.value })}
              className="input-field min-h-[60px]"
              placeholder="Why this correction was made..."
            />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setIsEditReceivedModalOpen(false)} className="btn-secondary">Cancel</button>
            <button type="submit" disabled={loading} className="btn-primary flex items-center gap-2">
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              Save Correction
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Payments;
