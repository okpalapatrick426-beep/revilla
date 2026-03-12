import { useState, useEffect } from 'react';
import { getAdminStats, getReferralStats } from '../../services/api';

export default function MetricsDashboard() {
  const [stats, setStats] = useState(null);
  const [referrals, setReferrals] = useState([]);

  useEffect(() => {
    getAdminStats().then(r => setStats(r.data)).catch(() => {});
    getReferralStats().then(r => setReferrals(r.data)).catch(() => {});
  }, []);

  if (!stats) return <div className="loading">Loading metrics...</div>;

  const cards = [
    { label: 'Total Users', value: stats.totalUsers, icon: '👥', color: '#00e5ff' },
    { label: 'Online Now', value: stats.onlineUsers, icon: '🟢', color: '#26de81' },
    { label: 'Messages Today', value: stats.messagesToday?.toLocaleString(), icon: '💬', color: '#fd79a8' },
    { label: 'New Users Today', value: stats.newUsersToday, icon: '✨', color: '#fdcb6e' },
    { label: 'Total Groups', value: stats.totalGroups, icon: '👪', color: '#a29bfe' },
    { label: 'Pending Reports', value: stats.reportedMessages, icon: '🚨', color: '#ff7675' },
  ];

  return (
    <div className="metrics-dashboard">
      <div className="metrics-grid">
        {cards.map(card => (
          <div key={card.label} className="metric-card">
            <div className="metric-icon">{card.icon}</div>
            <div className="metric-value" style={{ color: card.color }}>{card.value}</div>
            <div className="metric-label">{card.label}</div>
          </div>
        ))}
      </div>
      <div className="metrics-section">
        <h3>Top Referrers</h3>
        <div className="referral-list">
          {referrals.slice(0, 10).map(r => (
            <div key={r.id} className="referral-row">
              <div className="ref-avatar">{(r.referrer?.displayName || '?')[0]}</div>
              <div className="ref-info">
                <div>{r.referrer?.displayName || r.referrer?.username}</div>
                <div className="ref-sub">Referred {r.referred?.displayName || r.referred?.username}</div>
              </div>
              <div className="ref-points">+{r.pointsAwarded} pts</div>
              <div className={`ref-status status-${r.status}`}>{r.status}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
