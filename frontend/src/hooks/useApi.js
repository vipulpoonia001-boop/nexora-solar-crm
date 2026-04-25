import { useState, useCallback } from 'react';
import axios from '../utils/api';

export const useApi = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const request = useCallback(async (method, url, data = null, config = {}) => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios({ method, url, data, ...config });
      return response.data;
    } catch (err) {
      const msg = err.response?.data?.error || err.message || 'Something went wrong';
      setError(msg);
      throw new Error(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  const get = useCallback((url, config) => request('get', url, null, config), [request]);
  const post = useCallback((url, data, config) => request('post', url, data, config), [request]);
  const put = useCallback((url, data, config) => request('put', url, data, config), [request]);
  const patch = useCallback((url, data, config) => request('patch', url, data, config), [request]);
  const del = useCallback((url, config) => request('delete', url, null, config), [request]);

  return { loading, error, setError, get, post, put, patch, delete: del, del };
};
