import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import { Toaster } from 'react-hot-toast';
import Login from './pages/Login';
import Register from './pages/Register';
import MainApp from './pages/MainApp';
import AdminPanel from './pages/AdminPanel';
import './App.css';

const PrivateRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <div className="app-loading">Loading...</div>;
  return user ? children : <Navigate to="/login" />;
};

const AdminRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <div className="app-loading">Loading...</div>;
  if (!user) return <Navigate to="/login" />;
  if (!['admin', 'moderator'].includes(user.role)) return <Navigate to="/app" />;
  return children;
};

function AppRoutes() {
  const { token } = useAuth();
  return (
    <SocketProvider token={token}>
      <Routes>
        <Route path="/" element={<Navigate to="/app" />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/app/*" element={<PrivateRoute><MainApp /></PrivateRoute>} />
        <Route path="/admin/*" element={<AdminRoute><AdminPanel /></AdminRoute>} />
      </Routes>
    </SocketProvider>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Toaster position="top-right" toastOptions={{ style: { background: '#1a1a2e', color: '#fff', border: '1px solid rgba(255,255,255,0.1)' } }} />
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  );
}
