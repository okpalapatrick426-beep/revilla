import { useState } from 'react';
import MetricsDashboard from '../components/Admin/MetricsDashboard';
import UserTable from '../components/Admin/UserTable';
import LiveMap from '../components/Admin/LiveMap';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function AdminPanel() {
  const [tab, setTab] = useState('metrics');
  const { user } = useAuth();
  const navigate = useNavigate();

  const tabs = [
    { id: 'metrics', label: '📊 Metrics' },
    { id: 'users', label: '👥 Users' },
    { id: 'map', label: '📍 Live Map' },
  ];

  return (
    <div className="admin-panel-page">
      <div className="admin-nav">
        <div className="admin-logo">🛡️ Admin Panel</div>
        <div className="admin-tabs">
          {tabs.map(t => (
            <button key={t.id} className={`admin-tab ${tab === t.id ? 'active' : ''}`} onClick={() => setTab(t.id)}>
              {t.label}
            </button>
          ))}
        </div>
        <div className="admin-user">
          <span>{user?.displayName}</span>
          <span className="admin-role-badge">{user?.role}</span>
          <button onClick={() => navigate('/app')}>← App</button>
        </div>
      </div>
      <div className="admin-body">
        {tab === 'metrics' && <MetricsDashboard />}
        {tab === 'users' && <UserTable />}
        {tab === 'map' && <LiveMap />}
      </div>
    </div>
  );
}
