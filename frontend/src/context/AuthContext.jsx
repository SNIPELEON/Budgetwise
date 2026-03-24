import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('bw_token');
    const savedUser = localStorage.getItem('bw_user');
    if (token && savedUser) {
      setUser(JSON.parse(savedUser));
      // Verify token is still valid
      api.get('/auth/me')
        .then(res => setUser(res.data.user))
        .catch(() => logout())
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = useCallback(async (email, password) => {
    const res = await api.post('/auth/login', { email, password });
    const { token, user } = res.data;
    localStorage.setItem('bw_token', token);
    localStorage.setItem('bw_user', JSON.stringify(user));
    setUser(user);
    return user;
  }, []);

  const register = useCallback(async (data) => {
    const res = await api.post('/auth/register', data);
    const { token, user } = res.data;
    localStorage.setItem('bw_token', token);
    localStorage.setItem('bw_user', JSON.stringify(user));
    setUser(user);
    return user;
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('bw_token');
    localStorage.removeItem('bw_user');
    setUser(null);
  }, []);

  const updateUser = useCallback((updatedUser) => {
    setUser(updatedUser);
    localStorage.setItem('bw_user', JSON.stringify(updatedUser));
  }, []);

  return (
    <AuthContext.Provider value={{ user, login, register, logout, updateUser, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
