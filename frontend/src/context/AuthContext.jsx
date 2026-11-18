import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../api/client';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('stockroom_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [token, setToken] = useState(() => localStorage.getItem('stockroom_token'));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (token) {
      api.get('/me')
        .then((res) => {
          const userData = res.data?.data?.user;
          setUser(userData);
          localStorage.setItem('stockroom_user', JSON.stringify(userData));
        })
        .catch(() => {
          setUser(null);
          setToken(null);
          localStorage.removeItem('stockroom_token');
          localStorage.removeItem('stockroom_user');
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [token]);

  const login = async (email, password) => {
    const res = await api.post('/login', { email, password });
    const { user: userData, token: userToken } = res.data.data;
    setUser(userData);
    setToken(userToken);
    localStorage.setItem('stockroom_token', userToken);
    localStorage.setItem('stockroom_user', JSON.stringify(userData));
    return userData;
  };

  const logout = async () => {
    try {
      if (token) {
        await api.post('/logout');
      }
    } catch (err) {
      console.warn('Logout request failed', err);
    } finally {
      setUser(null);
      setToken(null);
      localStorage.removeItem('stockroom_token');
      localStorage.removeItem('stockroom_user');
    }
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, logout, isAuthenticated: !!token }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
