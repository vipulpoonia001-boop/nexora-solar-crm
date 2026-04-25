import { useState } from 'react';
import { useAuth } from '../context/AuthContext';

export const useAuthForm = () => {
  const { login } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (email, password) => {
    setLoading(true);
    setError('');
    try {
      await login(email, password);
      return true;
    } catch (err) {
      setError(err.message || 'Invalid credentials');
      return false;
    } finally {
      setLoading(false);
    }
  };

  return { handleLogin, loading, error };
};
