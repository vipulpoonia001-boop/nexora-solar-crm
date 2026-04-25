import React, { useEffect, useState } from 'react';
import { Download, KeyRound, RefreshCw, Shield, UserPlus, Users, Wrench, FolderKanban } from 'lucide-react';
import Modal from '../components/Modal';
import StatCard from '../components/StatCard';
import { useApi } from '../hooks/useApi';
import { formatCurrency, formatDateTime } from '../utils/helpers';

const INITIAL_NEW_USER = {
  name: '',
  email: '',
  phone: '',
  role: 'staff',
  password: ''
};

const INITIAL_PASSWORD_RESET = {
  userId: '',
  name: '',
  password: ''
};

const INITIAL_PRICING = {
  costPerKw: 50000,
  electricityRate: 8,
  unitsPerKw: 120,
  customKwPricing: {
    '3': 180000,
    '5': 230000
  }
};

const Admin = () => {
  const { get, post, put, loading } = useApi();
  const [overview, setOverview] = useState(null);
  const [users, setUsers] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [createUserModalOpen, setCreateUserModalOpen] = useState(false);
  const [passwordModalOpen, setPasswordModalOpen] = useState(false);
  const [newUser, setNewUser] = useState(INITIAL_NEW_USER);
  const [passwordReset, setPasswordReset] = useState(INITIAL_PASSWORD_RESET);
  const [keepLastActivities, setKeepLastActivities] = useState(200);
  const [pricingSettings, setPricingSettings] = useState(INITIAL_PRICING);

  useEffect(() => {
    fetchAdminData();
  }, []);

  const fetchAdminData = async () => {
    try {
      const [overviewRes, usersRes, pricingRes] = await Promise.all([
        get('/api/admin/overview'),
        get('/api/admin/users'),
        get('/api/admin/settings/pricing')
      ]);
      setOverview(overviewRes);
      setUsers(usersRes);
      setPricingSettings({
        electricityRate: Number(pricingRes?.electricityRate) || INITIAL_PRICING.electricityRate,
        unitsPerKw: Number(pricingRes?.unitsPerKw) || INITIAL_PRICING.unitsPerKw,
        costPerKw: Number(pricingRes?.costPerKw) || INITIAL_PRICING.costPerKw,
        customKwPricing: {
          ...INITIAL_PRICING.customKwPricing,
          ...(pricingRes?.customKwPricing || {})
        }
      });
    } catch (error) {
      alert(`Failed to fetch admin data: ${error.message}`);
    }
  };

  const refreshUsers = async () => {
    try {
      const usersRes = await get('/api/admin/users');
      setUsers(usersRes);
    } catch (error) {
      alert(`Failed to refresh users: ${error.message}`);
    }
  };

  const filteredUsers = users.filter((user) => {
    const query = searchQuery.trim().toLowerCase();
    const matchesSearch = !query ||
      user.name?.toLowerCase().includes(query) ||
      user.email?.toLowerCase().includes(query) ||
      user.phone?.toLowerCase().includes(query);
    const matchesRole = !roleFilter || user.role === roleFilter;
    const matchesStatus =
      !statusFilter ||
      (statusFilter === 'active' && user.active) ||
      (statusFilter === 'inactive' && !user.active);

    return matchesSearch && matchesRole && matchesStatus;
  });

  const handleCreateUser = async (event) => {
    event.preventDefault();
    try {
      await post('/api/admin/users', newUser);
      setCreateUserModalOpen(false);
      setNewUser(INITIAL_NEW_USER);
      await fetchAdminData();
    } catch (error) {
      alert(`Failed to create user: ${error.message}`);
    }
  };

  const handleToggleUserActive = async (user) => {
    try {
      await put(`/api/admin/users/${user.id}`, { active: !user.active });
      await fetchAdminData();
    } catch (error) {
      alert(`Failed to update user status: ${error.message}`);
    }
  };

  const handleToggleUserRole = async (user) => {
    const nextRole = user.role === 'admin' ? 'staff' : 'admin';
    try {
      await put(`/api/admin/users/${user.id}`, { role: nextRole });
      await fetchAdminData();
    } catch (error) {
      alert(`Failed to update user role: ${error.message}`);
    }
  };

  const openPasswordReset = (user) => {
    setPasswordReset({
      userId: user.id,
      name: user.name,
      password: ''
    });
    setPasswordModalOpen(true);
  };

  const handleResetPassword = async (event) => {
    event.preventDefault();
    try {
      await put(`/api/admin/users/${passwordReset.userId}/password`, {
        password: passwordReset.password
      });
      setPasswordModalOpen(false);
      setPasswordReset(INITIAL_PASSWORD_RESET);
      alert('Password reset successful.');
    } catch (error) {
      alert(`Failed to reset password: ${error.message}`);
    }
  };

  const handleDownloadBackup = async () => {
    try {
      const blob = await get('/api/admin/system/backup', { responseType: 'blob' });
      const downloadUrl = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = `nexora-backup-${new Date().toISOString().slice(0, 10)}.json`;
      link.click();
      URL.revokeObjectURL(downloadUrl);
    } catch (error) {
      alert(`Failed to export backup: ${error.message}`);
    }
  };

  const handlePruneActivities = async () => {
    try {
      const response = await post('/api/admin/system/prune-activities', {
        keepLast: Number(keepLastActivities)
      });
      await fetchAdminData();
      alert(`Cleanup complete. Removed ${response.removed} old activities.`);
    } catch (error) {
      alert(`Failed to clean up activities: ${error.message}`);
    }
  };

  const handleSavePricingSettings = async (event) => {
    event.preventDefault();
    try {
      const payload = {
        costPerKw: Number(pricingSettings.costPerKw),
        electricityRate: Number(pricingSettings.electricityRate),
        unitsPerKw: Number(pricingSettings.unitsPerKw),
        customKwPricing: {
          '3': Number(pricingSettings.customKwPricing?.['3']),
          '5': Number(pricingSettings.customKwPricing?.['5'])
        }
      };
      const updated = await put('/api/admin/settings/pricing', payload);
      setPricingSettings({
        electricityRate: Number(updated?.electricityRate) || INITIAL_PRICING.electricityRate,
        unitsPerKw: Number(updated?.unitsPerKw) || INITIAL_PRICING.unitsPerKw,
        costPerKw: Number(updated?.costPerKw) || INITIAL_PRICING.costPerKw,
        customKwPricing: {
          ...INITIAL_PRICING.customKwPricing,
          ...(updated?.customKwPricing || {})
        }
      });
      alert('Pricing settings saved successfully.');
    } catch (error) {
      alert(`Failed to save pricing settings: ${error.message}`);
    }
  };

  if (!overview) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Admin Panel</h1>
          <p className="text-sm text-gray-500 mt-1">Manage users, security, and system maintenance tools.</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button onClick={fetchAdminData} className="btn-secondary flex items-center gap-2">
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
          <button onClick={() => setCreateUserModalOpen(true)} className="btn-primary flex items-center gap-2">
            <UserPlus className="w-4 h-4" />
            Add User
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Users"
          value={overview.stats.totalUsers}
          subtitle={`${overview.stats.activeUsers} active`}
          icon={Users}
          color="primary"
        />
        <StatCard
          title="Admin Accounts"
          value={overview.stats.adminUsers}
          subtitle={`${overview.stats.staffUsers} staff`}
          icon={Shield}
          color="blue"
        />
        <StatCard
          title="Collected Revenue"
          value={formatCurrency(overview.stats.collectedRevenue)}
          subtitle={`${formatCurrency(overview.stats.pendingPayments)} pending`}
          icon={Wrench}
          color="green"
        />
        <StatCard
          title="Projects"
          value={overview.stats.totalProjects}
          subtitle={`${overview.stats.completedProjects} completed`}
          icon={FolderKanban}
          color="solar"
        />
      </div>

      <div className="card p-0 overflow-hidden">
        <div className="p-4 border-b border-gray-200 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          <h2 className="text-lg font-semibold text-gray-900">User Management</h2>
          <div className="flex items-center gap-2 flex-wrap">
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search user"
              className="input-field w-44"
            />
            <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)} className="input-field w-32">
              <option value="">All roles</option>
              <option value="admin">admin</option>
              <option value="staff">staff</option>
            </select>
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="input-field w-32">
              <option value="">All status</option>
              <option value="active">active</option>
              <option value="inactive">inactive</option>
            </select>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="table-header">Name</th>
                <th className="table-header">Email</th>
                <th className="table-header">Role</th>
                <th className="table-header">Status</th>
                <th className="table-header">Last Updated</th>
                <th className="table-header text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredUsers.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50">
                  <td className="table-cell">
                    <div>
                      <p className="font-medium">{user.name}</p>
                      <p className="text-xs text-gray-500">{user.phone || '-'}</p>
                    </div>
                  </td>
                  <td className="table-cell">{user.email}</td>
                  <td className="table-cell">
                    <span className={`status-badge ${user.role === 'admin' ? 'bg-primary-100 text-primary-700' : 'bg-gray-100 text-gray-700'}`}>
                      {user.role}
                    </span>
                  </td>
                  <td className="table-cell">
                    <span className={`status-badge ${user.active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                      {user.active ? 'active' : 'inactive'}
                    </span>
                  </td>
                  <td className="table-cell">{formatDateTime(user.updatedAt)}</td>
                  <td className="table-cell text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button onClick={() => handleToggleUserRole(user)} className="btn-secondary px-3 py-1.5">
                        {user.role === 'admin' ? 'Make Staff' : 'Make Admin'}
                      </button>
                      <button onClick={() => handleToggleUserActive(user)} className="btn-secondary px-3 py-1.5">
                        {user.active ? 'Deactivate' : 'Activate'}
                      </button>
                      <button onClick={() => openPasswordReset(user)} className="btn-secondary px-3 py-1.5 flex items-center gap-1">
                        <KeyRound className="w-3.5 h-3.5" />
                        Reset Password
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filteredUsers.length === 0 && (
          <div className="text-center py-10 text-sm text-gray-500">
            No users match your current filters.
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card space-y-4">
          <h2 className="text-lg font-semibold text-gray-900">Pricing Settings</h2>
          <p className="text-sm text-gray-500">Control automatic project cost during lead conversion.</p>
          <form onSubmit={handleSavePricingSettings} className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Default Cost Per kW (₹)</label>
              <input
                type="number"
                min="1"
                value={pricingSettings.costPerKw}
                onChange={(e) => setPricingSettings((prev) => ({ ...prev, costPerKw: e.target.value }))}
                className="input-field"
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Electricity Rate (₹/Unit)</label>
                <input
                  type="number"
                  value={pricingSettings.electricityRate}
                  onChange={(e) => setPricingSettings((prev) => ({ ...prev, electricityRate: e.target.value }))}
                  className="input-field"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Monthly Gen per kW (Units)</label>
                <input
                  type="number"
                  value={pricingSettings.unitsPerKw}
                  onChange={(e) => setPricingSettings((prev) => ({ ...prev, unitsPerKw: e.target.value }))}
                  className="input-field"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">3 kW Price (₹)</label>
                <input
                  type="number"
                  min="1"
                  value={pricingSettings.customKwPricing?.['3'] ?? ''}
                  onChange={(e) => setPricingSettings((prev) => ({
                    ...prev,
                    customKwPricing: {
                      ...(prev.customKwPricing || {}),
                      '3': e.target.value
                    }
                  }))}
                  className="input-field"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">5 kW Price (₹)</label>
                <input
                  type="number"
                  min="1"
                  value={pricingSettings.customKwPricing?.['5'] ?? ''}
                  onChange={(e) => setPricingSettings((prev) => ({
                    ...prev,
                    customKwPricing: {
                      ...(prev.customKwPricing || {}),
                      '5': e.target.value
                    }
                  }))}
                  className="input-field"
                />
              </div>
            </div>
            <button type="submit" className="btn-primary" disabled={loading}>Save Pricing</button>
          </form>
        </div>

        <div className="card space-y-4">
          <h2 className="text-lg font-semibold text-gray-900">System Tools</h2>
          <p className="text-sm text-gray-500">Quick maintenance tools for backup and activity log cleanup.</p>
          <button onClick={handleDownloadBackup} className="btn-secondary flex items-center gap-2">
            <Download className="w-4 h-4" />
            Export Full JSON Backup
          </button>
          <div className="flex items-center gap-2">
            <input
              type="number"
              min="10"
              max="5000"
              value={keepLastActivities}
              onChange={(e) => setKeepLastActivities(e.target.value)}
              className="input-field w-32"
            />
            <button onClick={handlePruneActivities} className="btn-danger">
              Prune Activities
            </button>
          </div>
          <p className="text-xs text-gray-500">Keeps only the most recent N activity records.</p>
        </div>

        <div className="card lg:col-span-2">
          <h2 className="text-lg font-semibold text-gray-900 mb-3">Recent System Activity</h2>
          <div className="space-y-2 max-h-60 overflow-auto">
            {overview.recentActivities?.map((activity) => (
              <div key={activity.id} className="p-3 rounded-lg border border-gray-200">
                <p className="text-sm text-gray-900">{activity.description}</p>
                <p className="text-xs text-gray-500 mt-1">{formatDateTime(activity.createdAt)}</p>
              </div>
            ))}
            {(!overview.recentActivities || overview.recentActivities.length === 0) && (
              <p className="text-sm text-gray-500">No recent activity found.</p>
            )}
          </div>
        </div>
      </div>

      <Modal
        isOpen={createUserModalOpen}
        onClose={() => setCreateUserModalOpen(false)}
        title="Create New User"
      >
        <form onSubmit={handleCreateUser} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
            <input
              required
              value={newUser.name}
              onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
              className="input-field"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
            <input
              type="email"
              required
              value={newUser.email}
              onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
              className="input-field"
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
              <input
                value={newUser.phone}
                onChange={(e) => setNewUser({ ...newUser, phone: e.target.value })}
                className="input-field"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Role *</label>
              <select
                value={newUser.role}
                onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
                className="input-field"
              >
                <option value="staff">staff</option>
                <option value="admin">admin</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password *</label>
            <input
              type="password"
              minLength={6}
              required
              value={newUser.password}
              onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
              className="input-field"
            />
          </div>
          <div className="flex justify-end gap-2 pt-1">
            <button type="button" onClick={() => setCreateUserModalOpen(false)} className="btn-secondary">Cancel</button>
            <button type="submit" className="btn-primary" disabled={loading}>Create User</button>
          </div>
        </form>
      </Modal>

      <Modal
        isOpen={passwordModalOpen}
        onClose={() => setPasswordModalOpen(false)}
        title={`Reset Password: ${passwordReset.name}`}
      >
        <form onSubmit={handleResetPassword} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">New Password *</label>
            <input
              type="password"
              minLength={6}
              required
              value={passwordReset.password}
              onChange={(e) => setPasswordReset({ ...passwordReset, password: e.target.value })}
              className="input-field"
            />
          </div>
          <div className="flex justify-end gap-2 pt-1">
            <button type="button" onClick={() => setPasswordModalOpen(false)} className="btn-secondary">Cancel</button>
            <button type="submit" className="btn-primary" disabled={loading}>Reset Password</button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Admin;
