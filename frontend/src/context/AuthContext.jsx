import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../utils/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchMe = useCallback(async () => {
    try {
      const token = localStorage.getItem('accessToken');
      if (!token) { setLoading(false); return; }
      const { data } = await api.get('/auth/me');
      setUser(data.data);
    } catch {
      localStorage.removeItem('accessToken');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchMe(); }, [fetchMe]);

  const login = async (email, password) => {
    const { data } = await api.post('/auth/login', { email, password });
    localStorage.setItem('accessToken', data.data.accessToken);
    setUser(data.data.user);
    return data.data.user;
  };

  const logout = async () => {
    try { await api.post('/auth/logout'); } catch {}
    localStorage.removeItem('accessToken');
    setUser(null);
  };

  const hasRole = (...roles) => roles.includes(user?.role);
  const isSuperAdmin = () => user?.role === 'SUPER_ADMIN';
  const isAdmin = () => ['SUPER_ADMIN', 'ADMIN'].includes(user?.role);
  const isPharmacist = () => user?.role === 'PHARMACIST';
  const isCustomer = () => user?.role === 'CUSTOMER';
  const canSell = () => ['SUPER_ADMIN', 'ADMIN', 'PHARMACIST', 'CASHIER'].includes(user?.role);
  const canManageMedicines = () => ['SUPER_ADMIN', 'ADMIN'].includes(user?.role);

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, hasRole, isSuperAdmin, isAdmin, isPharmacist, isCustomer, canSell, canManageMedicines, fetchMe }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be inside AuthProvider');
  return ctx;
};
