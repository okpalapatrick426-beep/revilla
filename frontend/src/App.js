import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import './index.css';
import './AppShell.css';
import './ChatComponents.css';
import './StatusGoSpace.css';
import './ReelsPage.css';
import './StatusAdditions.css';
import './StatusNotif.css';
import './PauseIndicator.css';

import Splash from './pages/Splash';
import Login from './pages/Login';
import Register from './pages/Register';
import MainApp from './pages/MainApp';
import MagicCallback from './pages/MagicCallback';

const PrivateRoute = ({ children }) => {
  const token = localStorage.getItem('token');
  return token ? children : <Navigate to="/login" replace />;
};

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Splash />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/magic" element={<MagicCallback />} />
        <Route path="/app" element={<PrivateRoute><MainApp /></PrivateRoute>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}
