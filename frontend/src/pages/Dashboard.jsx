import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users, FolderKanban, TrendingUp,
  AlertTriangle, Clock, Zap, IndianRupee,
  Sun, Battery, CheckCircle2, ArrowUpRight,
  Activity, Target, Award
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, Cell, PieChart, Pie, LineChart, Line
} from 'recharts';
import { useApi } from '../hooks/useApi';
import StatCard from '../components/StatCard';
import { formatCurrency, formatDateTime, getPriorityColor, PROJECT_STAGES } from '../utils/helpers';

const STAGE_COLORS = {
  'Quotation': '#38bdf8',
  'Structure installed': '#6366f1',
  'Work completed at site': '#f97316',
  'net metering': '#06b6d4',
  'Project Completed': '#10b981'
};

const Dashboard = () => {
  const { get, loading } = useApi();
  const [data, setData] = useState(null);
  const [animatedStats, setAnimatedStats] = useState({});
  const navigate = useNavigate();

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const res = await get('/api/dashboard/stats');
      setData(res);
      // Animate stats on load
      setTimeout(() => {
        setAnimatedStats({
          totalLeads: res.stats.totalLeads,
          totalProjects: res.stats.activeProjects || 0,
          totalRevenue: res.stats.totalRevenue,
          conversionRate: res.stats.conversionRate
        });
      }, 300);
    } catch (err) {
      console.error('Failed to load dashboard:', err);
    }
  };

  if (loading || !data) {
    return (
      <div className="space-y-8 animate-fade-in">
        {/* Hero Skeleton */}
        <div className="relative overflow-hidden rounded-2xl p-8 bg-gradient-to-br from-gray-200 to-gray-300 animate-pulse">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-gray-400 rounded-xl"></div>
            <div>
              <div className="h-8 bg-gray-400 rounded w-64 mb-2"></div>
              <div className="h-4 bg-gray-400 rounded w-48"></div>
            </div>
          </div>
          <div className="flex gap-4">
            <div className="w-32 h-12 bg-gray-400 rounded-xl"></div>
            <div className="w-36 h-12 bg-gray-400 rounded-xl"></div>
          </div>
        </div>

        {/* Stats Grid Skeleton */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="card p-6 bg-gradient-to-br from-gray-100 to-gray-200 animate-pulse">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="h-4 bg-gray-300 rounded w-20 mb-2"></div>
                  <div className="h-8 bg-gray-300 rounded w-16 mb-2"></div>
                  <div className="h-3 bg-gray-300 rounded w-24"></div>
                </div>
                <div className="w-12 h-12 bg-gray-300 rounded-xl"></div>
              </div>
            </div>
          ))}
        </div>

        {/* Charts Skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="card lg:col-span-2 p-6 bg-gradient-to-br from-gray-100 to-gray-200 animate-pulse">
            <div className="h-6 bg-gray-300 rounded w-48 mb-4"></div>
            <div className="h-80 bg-gray-300 rounded"></div>
          </div>
          <div className="card p-6 bg-gradient-to-br from-gray-100 to-gray-200 animate-pulse">
            <div className="h-6 bg-gray-300 rounded w-32 mb-4"></div>
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-16 bg-gray-300 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  const { stats, chartData, recentActivities, alerts } = data;
  const totalProjects = stats.activeProjects || 0;
  const completedProjects = stats.completedInstallations || 0;
  const activeProjects = Math.max(totalProjects - completedProjects, 0);
  const stageChartData = PROJECT_STAGES.map((stage) => ({
    name: stage,
    shortName: stage === 'Work completed at site' ? 'Work completed' : stage,
    value: stats.stageBreakdown?.[stage] || 0,
    color: STAGE_COLORS[stage] || '#0ea5e9'
  }));

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Hero Section */}
      <div className="relative overflow-hidden rounded-[20px] p-10 text-white animate-fade-in bg-gradient-to-br from-slate-900 via-slate-800 to-sky-700 border border-white/10"
           style={{
             boxShadow: 'inset 0 0 20px rgba(255, 255, 255, 0.08), 0 10px 30px rgba(15, 23, 42, 0.15)'
           }}>
        {/* Subtle Cyan Glow Overlay matching Sidebar */}
        <div className="absolute inset-0 opacity-20 bg-gradient-to-br from-cyan-300/30 via-sky-300/20 to-transparent"></div>
        <div className="absolute -top-20 -right-20 w-56 h-56 bg-sky-400/10 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-20 -left-20 w-44 h-44 bg-cyan-200/20 rounded-full blur-2xl"></div>
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent"></div>
        <div className="relative">
          <div className="flex items-center gap-4 mb-6">
            <div className="p-4 bg-white/20 rounded-3xl backdrop-blur-md border border-white/30 shadow-lg">
              <Sun className="w-10 h-10 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold text-white tracking-tight">Welcome to Nexora CRM</h1>
              <p className="text-blue-50 mt-2 text-lg font-medium">Powering your solar business forward</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-4 mt-8">
            <button
              onClick={() => navigate('/leads')}
              className="px-6 py-3 bg-white/90 rounded-xl hover:bg-slate-100 hover:scale-105 transition-all duration-300 flex items-center gap-2 font-semibold text-slate-900 border border-slate-200 shadow-sm"
            >
              <Users className="w-5 h-5 text-slate-700" />
              + New Lead
            </button>
            <button
              onClick={() => navigate('/projects')}
              className="px-6 py-3 bg-sky-600/90 rounded-xl hover:bg-sky-700 hover:scale-105 transition-all duration-300 flex items-center gap-2 font-semibold text-white border border-sky-500/30 shadow-md"
            >
              <FolderKanban className="w-5 h-5 text-white" />
              View Projects
            </button>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Leads"
          value={animatedStats.totalLeads || 0}
          subtitle={`${stats.convertedLeads} converted`}
          icon={Users}
          color="primary"
          trend={`${stats.newLeadsThisMonth || 0} this month`}
          trendUp={true}
        />
        <StatCard
          title="Total Projects"
          value={animatedStats.totalProjects || 0}
          subtitle={`${activeProjects} active · ${completedProjects} completed`}
          icon={FolderKanban}
          color="solar"
          trend={`${stats.projectsThisMonth || 0} this month`}
          trendUp={true}
        />
        <StatCard
          title="Total Revenue"
          value={formatCurrency(animatedStats.totalRevenue || 0)}
          subtitle={`${formatCurrency(stats.pendingPayments)} pending`}
          icon={IndianRupee}
          color="green"
          trend={`${stats.revenueGrowth || 0}% growth`}
          trendUp={stats.revenueGrowth > 0}
        />
        <StatCard
          title="Conversion Rate"
          value={`${animatedStats.conversionRate || 0}%`}
          subtitle="Leads to projects"
          icon={Target}
          color="secondary"
          trend={`${stats.conversionTrend || 0}% vs last month`}
          trendUp={stats.conversionTrend > 0}
        />
      </div>

      {/* Charts & Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Monthly Performance Chart */}
        <div className="card lg:col-span-2 group hover:shadow-xl hover:shadow-primary-500/10 transition-all duration-300 border-0 bg-gradient-to-br from-white to-gray-50/50 backdrop-blur-sm">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <Activity className="w-5 h-5 text-primary-600" />
                Monthly Performance
              </h3>
              <p className="text-sm text-gray-500 mt-1">Revenue and lead trends</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 text-sm">
                <button className="px-3 py-1 bg-primary-100 text-primary-700 rounded-full hover:bg-primary-200 transition-colors">7d</button>
                <button className="px-3 py-1 bg-primary-500 text-white rounded-full hover:bg-primary-600 transition-colors">30d</button>
                <button className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full hover:bg-gray-200 transition-colors">90d</button>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-primary-500 rounded-full"></div>
                  <span className="text-gray-600">Revenue</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-secondary-500 rounded-full"></div>
                  <span className="text-gray-600">Leads</span>
                </div>
              </div>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={320}>
            <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.4}/>
                  <stop offset="50%" stopColor="#f59e0b" stopOpacity={0.2}/>
                  <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorLeads" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.4}/>
                  <stop offset="50%" stopColor="#0ea5e9" stopOpacity={0.2}/>
                  <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" opacity={0.5} />
              <XAxis
                dataKey="name"
                tick={{ fontSize: 12, fill: '#6b7280' }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 12, fill: '#6b7280' }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#fff',
                  borderRadius: '12px',
                  border: '1px solid #e5e7eb',
                  boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)',
                  fontSize: '14px'
                }}
                labelStyle={{ color: '#374151', fontWeight: '600' }}
              />
              <Area
                type="monotone"
                dataKey="revenue"
                stroke="#f59e0b"
                strokeWidth={3}
                fillOpacity={1}
                fill="url(#colorRevenue)"
                name="Revenue (₹L)"
                dot={{ fill: '#f59e0b', strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6, stroke: '#f59e0b', strokeWidth: 2, fill: '#fff' }}
                animationDuration={1500}
              />
              <Area
                type="monotone"
                dataKey="leads"
                stroke="#0ea5e9"
                strokeWidth={3}
                fillOpacity={1}
                fill="url(#colorLeads)"
                name="Leads"
                dot={{ fill: '#f59e0b', strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6, stroke: '#f59e0b', strokeWidth: 2, fill: '#fff' }}
                animationDuration={1500}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Alerts Panel */}
        <div className="card group hover:shadow-xl hover:shadow-red-500/10 transition-all duration-300 border-0 bg-gradient-to-br from-white to-red-50/30 backdrop-blur-sm">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-red-100 rounded-lg">
              <AlertTriangle className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900">Alerts & Reminders</h3>
              <p className="text-sm text-gray-500">Stay on top of your tasks</p>
            </div>
          </div>
          <div className="space-y-4 max-h-[320px] overflow-auto custom-scrollbar">
            {alerts.length === 0 ? (
              <div className="text-center py-8 animate-fade-in">
                <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto mb-3 animate-bounce-in" />
                <p className="text-sm text-gray-500">All caught up! No pending alerts</p>
              </div>
            ) : (
              alerts.map((alert, idx) => (
                <div key={idx} className={`p-4 rounded-xl border transition-all duration-200 hover:shadow-md hover:scale-102 animate-slide-in ${getPriorityColor(alert.priority)} border-l-4 ${alert.priority === 'high' ? 'border-l-red-500' : alert.priority === 'medium' ? 'border-l-yellow-500' : 'border-l-blue-500'}`}>
                  <div className="flex items-start gap-3">
                    <div className="p-1.5 bg-white/60 rounded-lg flex-shrink-0">
                      <Clock className="w-4 h-4" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-gray-900">{alert.message}</p>
                      <p className="text-xs mt-1 opacity-75">{formatDateTime(alert.date)}</p>
                    </div>
                    <button className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs hover:bg-green-200 transition-colors">
                      Mark Done
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Conversion Funnel & Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="card group hover:shadow-xl transition-all duration-300 border-0 bg-gradient-to-br from-white to-blue-50/30">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Target className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900">Project Stages</h3>
              <p className="text-sm text-gray-500">Track project progress</p>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={stageChartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" opacity={0.5} />
              <XAxis
                dataKey="shortName"
                tick={{ fontSize: 11, fill: '#6b7280' }}
                axisLine={false}
                tickLine={false}
                interval={0}
                angle={-45}
                textAnchor="end"
                height={80}
              />
              <YAxis
                tick={{ fontSize: 12, fill: '#6b7280' }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                formatter={(value) => [`${value}`, 'Projects']}
                labelFormatter={(_, payload) => payload?.[0]?.payload?.name || ''}
                contentStyle={{
                  borderRadius: '12px',
                  border: '1px solid #e5e7eb',
                  boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)',
                  fontSize: '14px'
                }}
                labelStyle={{ color: '#374151', fontWeight: '600' }}
              />
              <Bar
                dataKey="value"
                radius={[6, 6, 0, 0]}
                className="hover:opacity-80 transition-opacity"
              >
                {stageChartData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={entry.color}
                    className="hover:brightness-110 transition-all duration-300"
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="card group hover:shadow-xl transition-all duration-300 border-0 bg-gradient-to-br from-white to-green-50/30">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-green-100 rounded-lg">
              <Activity className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900">Recent Activity</h3>
              <p className="text-sm text-gray-500">Latest updates and actions</p>
            </div>
          </div>
          <div className="space-y-3 max-h-[280px] overflow-auto custom-scrollbar">
            {recentActivities.map((activity) => (
              <div key={activity.id} className="flex items-start gap-4 p-3 hover:bg-gray-50/80 rounded-xl transition-all duration-200 hover:shadow-sm group/item">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-100 to-primary-200 flex items-center justify-center flex-shrink-0 group-hover/item:scale-110 transition-transform duration-200">
                  <Zap className="w-5 h-5 text-primary-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 group-hover/item:text-primary-700 transition-colors">{activity.description}</p>
                  <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {formatDateTime(activity.createdAt)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="card border-0 bg-gradient-to-r from-primary-50 to-solar-50">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <Award className="w-5 h-5 text-primary-600" />
              Quick Actions
            </h3>
            <p className="text-sm text-gray-600 mt-1">Common tasks to boost your productivity</p>
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
          <button
            onClick={() => navigate('/leads')}
            className="p-4 bg-white rounded-xl hover:shadow-lg transition-all duration-300 hover:scale-105 group"
          >
            <Users className="w-8 h-8 text-primary-600 mb-2 group-hover:scale-110 transition-transform" />
            <h4 className="font-semibold text-gray-900">Add Lead</h4>
            <p className="text-xs text-gray-500 mt-1">Create new customer lead</p>
          </button>
          <button
            onClick={() => navigate('/projects')}
            className="p-4 bg-white rounded-xl hover:shadow-lg transition-all duration-300 hover:scale-105 group"
          >
            <FolderKanban className="w-8 h-8 text-solar-600 mb-2 group-hover:scale-110 transition-transform" />
            <h4 className="font-semibold text-gray-900">New Project</h4>
            <p className="text-xs text-gray-500 mt-1">Start solar installation</p>
          </button>
          <button
            onClick={() => navigate('/payments')}
            className="p-4 bg-white rounded-xl hover:shadow-lg transition-all duration-300 hover:scale-105 group"
          >
            <IndianRupee className="w-8 h-8 text-green-600 mb-2 group-hover:scale-110 transition-transform" />
            <h4 className="font-semibold text-gray-900">Record Payment</h4>
            <p className="text-xs text-gray-500 mt-1">Update payment status</p>
          </button>
          <button
            onClick={() => navigate('/admin')}
            className="p-4 bg-white rounded-xl hover:shadow-lg transition-all duration-300 hover:scale-105 group"
          >
            <Award className="w-8 h-8 text-purple-600 mb-2 group-hover:scale-110 transition-transform" />
            <h4 className="font-semibold text-gray-900">Admin Panel</h4>
            <p className="text-xs text-gray-500 mt-1">Manage system settings</p>
          </button>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
