import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import { Toaster } from 'react-hot-toast';
import Login from './pages/Login';
import Register from './pages/Register';
import MainApp from './pages/MainApp';
import AdminPanel from './pages/AdminPanel';
import Splash from './pages/Splash';
import MagicCallback from './pages/MagicCallback';
import './App.css';

const PrivateRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <div className="app-loading"><div className="app-loading-spinner"/></div>;
  return user ? children : <Navigate to="/" />;
};

const AdminRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <div className="app-loading"><div className="app-loading-spinner"/></div>;
  if (!user) return <Navigate to="/" />;
  if (!['admin', 'moderator'].includes(user.role)) return <Navigate to="/app" />;
  return children;
};

function AppRoutes() {
  const { token, user } = useAuth();
  return (
    <SocketProvider token={token}>
      <Routes>
        <Route path="/" element={user ? <Navigate to="/app" /> : <Splash />} />
        <Route path="/login" element={user ? <Navigate to="/app" /> : <Login />} />
        <Route path="/register" element={user ? <Navigate to="/app" /> : <Register />} />
        <Route path="/auth/callback" element={<MagicCallback />} />
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
        <Toaster position="top-right" toastOptions={{
          style: { background: '#202c33', color: '#e9edef', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px' }
        }} />
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  );
}
