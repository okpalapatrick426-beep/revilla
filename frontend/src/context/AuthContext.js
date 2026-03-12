import { createContext, useContext, useState, useEffect } from 'react';
import { getMe } from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (token) {
      getMe().then(res => { setUser(res.data); setLoading(false); })
             .catch(() => { localStorage.removeItem('token'); setToken(null); setLoading(false); });
    } else {
      setLoading(false);
    }
  }, [token]);

  const loginUser = (tokenVal, userData) => {
    localStorage.setItem('token', tokenVal);
    setToken(tokenVal);
    setUser(userData);
  };

  const logoutUser = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, loginUser, logoutUser, setUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
