import { useState, useCallback } from 'react';
import api from '../utils/api';
import toast from 'react-hot-toast';

export const useApi = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const request = useCallback(async (method, url, data = null, config = {}) => {
    setLoading(true);
    setError(null);
    try {
      const res = await api[method](url, data, config);
      return res.data;
    } catch (err) {
      const msg = err.response?.data?.message || 'An error occurred';
      setError(msg);
      toast.error(msg);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const get = useCallback((url, params) => request('get', url, null, { params }), [request]);
  const post = useCallback((url, data) => request('post', url, data), [request]);
  const put = useCallback((url, data) => request('put', url, data), [request]);
  const patch = useCallback((url, data) => request('patch', url, data), [request]);
  const del = useCallback((url) => request('delete', url), [request]);

  return { loading, error, get, post, put, patch, del };
};
