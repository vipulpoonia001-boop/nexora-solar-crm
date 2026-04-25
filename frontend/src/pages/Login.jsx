import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { useAuthForm } from '../hooks/useAuthForm';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { handleLogin, loading, error } = useAuthForm();
  const navigate = useNavigate();

  const onSubmit = async (e) => {
    e.preventDefault();
    const success = await handleLogin(email, password);
    if (success) navigate('/');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-solar-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mx-auto mb-4">
            <img src="/logo.png" alt="Nexora Power Logo" className="h-40 w-auto object-contain" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">NEXORA Power</h1>
          <p className="text-gray-500 mt-1">CRM & Project Management</p>
        </div>

        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Sign In</h2>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
              {error}
            </div>
          )}

          <form onSubmit={onSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input-field"
                placeholder="admin@nexorapower.com"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input-field"
                placeholder="••••••••"
                required
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full btn-primary flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Sign In'}
            </button>
          </form>

          <div className="mt-4 p-3 bg-gray-50 rounded-lg text-xs text-gray-500">
            <p className="font-medium mb-1">Demo Credentials:</p>
            <p>Admin: admin@nexorapower.com / admin123</p>
            <p>Staff: staff@nexorapower.com / staff123</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
