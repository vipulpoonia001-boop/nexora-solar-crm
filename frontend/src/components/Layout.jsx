import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Users, FolderKanban, CreditCard,
  LogOut, Menu, X, Bell, Shield
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const navItems = [
  { path: '/', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/leads', label: 'Leads', icon: Users },
  { path: '/projects', label: 'Projects', icon: FolderKanban },
  { path: '/payments', label: 'Payments', icon: CreditCard },
];

const Layout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const visibleNavItems = user?.role === 'admin'
    ? [...navItems, { path: '/admin', label: 'Admin', icon: Shield }]
    : navItems;

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Desktop Sidebar */}
      <aside
        className={`hidden lg:flex flex-col bg-gradient-to-b from-white via-white to-gray-50 border-r border-gray-200/50 transition-all duration-500 ${sidebarOpen ? 'w-72' : 'w-20'
          } shadow-xl`}
      >
        <div className="h-24 flex items-center px-6 border-b border-gray-200/50 bg-gradient-to-br from-slate-900 via-slate-800 to-sky-700 relative overflow-hidden group"
             style={{
               boxShadow: 'inset 0 0 20px rgba(255, 255, 255, 0.08), 0 4px 15px rgba(15, 23, 42, 0.18)'
             }}>
          <div className="absolute inset-0 opacity-10 bg-gradient-to-br from-cyan-300/30 via-sky-300/20 to-transparent"></div>
          <div className="flex items-center gap-5 relative z-10">
            <div className="w-16 h-16 bg-white/15 rounded-2xl flex items-center justify-center backdrop-blur-md border border-white/15 shadow-lg transform group-hover:scale-110 transition-transform duration-300">
              <img src="/logo.png" alt="Nexora Power" className="w-9 h-9 object-contain" />
            </div>
            {sidebarOpen && (
              <div className="animate-fade-in">
                <h1 className="font-bold text-white text-2xl leading-tight tracking-tight">NEXORA</h1>
                <p className="text-xs text-slate-200">Solar Power CRM</p>
              </div>
            )}
          </div>
        </div>

        <nav className="flex-1 px-4 py-6 space-y-2">
          {visibleNavItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              title={!sidebarOpen ? item.label : undefined}
            >
              {({ isActive }) => (
                <div className={`relative flex items-center gap-4 px-4 py-3.5 rounded-xl transition-all duration-300 group ${
                  isActive
                    ? 'bg-gradient-to-r from-primary-50 to-primary-100 text-primary-700 font-semibold shadow-lg border border-primary-200'
                    : 'text-gray-600 hover:bg-gradient-to-r hover:from-gray-50 hover:to-gray-100 hover:text-gray-900 hover:shadow-md'
                }`}>
                  {isActive && <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-primary-500 to-solar-500 rounded-r-full animate-fade-in"></div>}
                  <div className={`p-2 rounded-lg transition-all duration-300 ${
                    isActive
                      ? 'bg-primary-100 text-primary-600'
                      : 'bg-gray-100 text-gray-500 group-hover:bg-primary-50 group-hover:text-primary-600 group-hover:scale-110'
                  }`}>
                    <item.icon className="w-5 h-5 transition-transform group-hover:rotate-12" />
                  </div>
                  {sidebarOpen && <span className="text-sm font-medium animate-fade-in">{item.label}</span>}
                </div>
              )}
            </NavLink>
          ))}
        </nav>

        <div className="p-4 border-t border-gray-200/50">
          <button
            onClick={handleLogout}
            className="flex items-center gap-4 px-4 py-3.5 w-full rounded-xl text-gray-600 hover:bg-gradient-to-r hover:from-red-50 hover:to-red-100 hover:text-red-600 transition-all duration-300 group"
          >
            <div className="p-2 rounded-lg bg-gray-100 text-gray-500 group-hover:bg-red-100 group-hover:text-red-600 transition-all duration-300">
              <LogOut className="w-5 h-5" />
            </div>
            {sidebarOpen && <span className="text-sm font-medium">Logout</span>}
          </button>
        </div>
      </aside>

      {/* Mobile Sidebar Overlay */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Mobile Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-72 bg-gradient-to-b from-white via-white to-gray-50 border-r border-gray-200/50 transform transition-all duration-500 shadow-2xl lg:hidden ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}>
        <div className="h-24 flex items-center justify-between px-6 border-b border-gray-200/50 bg-gradient-to-br from-slate-900 via-slate-800 to-sky-700 relative overflow-hidden"
             style={{
               boxShadow: 'inset 0 0 20px rgba(255, 255, 255, 0.08), 0 4px 15px rgba(15, 23, 42, 0.18)'
             }}>
          <div className="absolute inset-0 opacity-10 bg-gradient-to-br from-cyan-300/30 via-sky-300/20 to-transparent"></div>
          <div className="flex items-center gap-4 relative z-10">
            <div className="w-16 h-16 bg-white/15 rounded-2xl flex items-center justify-center backdrop-blur-md border border-white/15 shadow-lg">
              <img src="/logo.png" alt="Nexora Power" className="w-9 h-9 object-contain" />
            </div>
            <div className="animate-fade-in relative z-10">
              <h1 className="font-bold text-white text-2xl leading-tight tracking-tight">NEXORA</h1>
              <p className="text-xs text-slate-200">Solar Power CRM</p>
            </div>
          </div>
          <button onClick={() => setMobileMenuOpen(false)} className="p-2 hover:bg-white/20 rounded-lg transition-all duration-300">
            <X className="w-6 h-6 text-white" />
          </button>
        </div>
        <nav className="p-4 space-y-2">
          {visibleNavItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={() => setMobileMenuOpen(false)}
            >
              {({ isActive }) => (
                <div className={`flex items-center gap-4 px-4 py-3.5 rounded-xl transition-all duration-300 group ${
                  isActive
                    ? 'bg-gradient-to-r from-primary-50 to-primary-100 text-primary-700 font-semibold shadow-lg border border-primary-200'
                    : 'text-gray-600 hover:bg-gradient-to-r hover:from-gray-50 hover:to-gray-100 hover:text-gray-900 hover:shadow-md'
                }`}>
                  <div className={`p-2 rounded-lg transition-all duration-300 ${
                    isActive
                      ? 'bg-primary-100 text-primary-600'
                      : 'bg-gray-100 text-gray-500 group-hover:bg-primary-50 group-hover:text-primary-600'
                  }`}>
                    <item.icon className="w-5 h-5" />
                  </div>
                  <span className="text-sm font-medium">{item.label}</span>
                </div>
              )}
            </NavLink>
          ))}
          <button
            onClick={handleLogout}
            className="flex items-center gap-4 px-4 py-3.5 w-full rounded-xl text-gray-600 hover:bg-gradient-to-r hover:from-red-50 hover:to-red-100 hover:text-red-600 transition-all duration-300 group"
          >
            <div className="p-2 rounded-lg bg-gray-100 text-gray-500 group-hover:bg-red-100 group-hover:text-red-600 transition-all duration-300">
              <LogOut className="w-5 h-5" />
            </div>
            <span className="text-sm font-medium">Logout</span>
          </button>
        </nav>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="h-20 bg-gradient-to-r from-white via-white to-gray-50 border-b border-gray-200/50 flex items-center justify-between px-6 lg:px-8 shadow-sm backdrop-blur-sm">
          <div className="flex items-center gap-6">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="lg:hidden p-3 hover:bg-gray-100 rounded-xl transition-all duration-300 hover:scale-110 group"
            >
              <Menu className="w-6 h-6 text-gray-600 group-hover:text-primary-500 transition-colors" />
            </button>
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="hidden lg:block p-3 hover:bg-gray-100 rounded-xl transition-all duration-300 hover:scale-110 group"
            >
              <Menu className="w-6 h-6 text-gray-600 group-hover:text-primary-500 transition-colors" />
            </button>
          </div>

          <div className="flex items-center gap-4">
            <div className="relative">
              <button 
                onClick={() => setNotificationsOpen(!notificationsOpen)}
                className="relative p-3 hover:bg-gray-100 rounded-xl transition-all duration-300 hover:scale-110 group"
              >
                <Bell className="w-6 h-6 text-gray-600 group-hover:text-primary-500 transition-colors" />
                <span className="absolute top-2.5 right-2.5 w-3 h-3 bg-red-500 rounded-full animate-pulse shadow-lg"></span>
              </button>
              {notificationsOpen && (
                <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-xl border border-gray-200/50 animate-fade-in z-50">
                  <div className="p-4 border-b border-gray-200/50 bg-gradient-to-r from-primary-50 to-gray-50">
                    <h3 className="font-semibold text-gray-900">Notifications</h3>
                  </div>
                  <div className="max-h-64 overflow-auto custom-scrollbar">
                    <div className="p-4 hover:bg-primary-50 transition-colors border-b border-gray-100">
                      <p className="text-sm text-gray-600">New lead added to the system</p>
                      <p className="text-xs text-gray-400 mt-1">2 minutes ago</p>
                    </div>
                    <div className="p-4 hover:bg-primary-50 transition-colors">
                      <p className="text-sm text-gray-600">Project status updated</p>
                      <p className="text-xs text-gray-400 mt-1">1 hour ago</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
            <div className="relative">
              <button 
                onClick={() => setProfileOpen(!profileOpen)}
                className="flex items-center gap-4 hover:bg-gray-100 rounded-xl p-2 transition-all duration-300 hover:scale-105 group"
              >
                <div className="w-12 h-12 bg-gradient-to-br from-slate-900 to-sky-600 rounded-xl flex items-center justify-center shadow-lg group-hover:shadow-warm-glow transition-shadow">
                  <span className="text-sm font-bold text-white">
                    {user?.name?.charAt(0) || 'U'}
                  </span>
                </div>
                <div className="hidden md:block text-left">
                  <p className="text-sm font-bold text-gray-900">{user?.name}</p>
                  <p className="text-xs text-gray-500 capitalize bg-primary-100 text-primary-700 px-2 py-1 rounded-full">{user?.role}</p>
                </div>
              </button>
              {profileOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-xl border border-gray-200/50 animate-fade-in z-50">
                  <div className="p-2">
                    <button className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-primary-50 rounded-lg transition-colors group">
                      <span className="group-hover:text-primary-600">Settings</span>
                    </button>
                    <button 
                      onClick={handleLogout}
                      className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      Logout
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-auto p-6 lg:p-8 bg-gradient-to-br from-gray-50/50 to-white relative">
          <div className="absolute inset-0 opacity-5" style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, rgba(0,0,0,0.15) 1px, transparent 0)`,
            backgroundSize: '20px 20px'
          }}></div>
          <div className="relative max-w-7xl mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default Layout;
