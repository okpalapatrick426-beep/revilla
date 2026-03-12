import { useState, useEffect } from 'react';
import { getMyReferrals } from '../../../services/api';
import { useAuth } from '../../../context/AuthContext';
import toast from 'react-hot-toast';

export default function ReferralDashboard() {
  const [data, setData] = useState(null);
  const { user } = useAuth();

  useEffect(() => {
    getMyReferrals().then(r => setData(r.data));
  }, []);

  const copyCode = () => {
    navigator.clipboard.writeText(data?.code || '');
    toast.success('Referral code copied!');
  };

  const copyLink = () => {
    const link = `${window.location.origin}/register?ref=${data?.code}`;
    navigator.clipboard.writeText(link);
    toast.success('Referral link copied!');
  };

  if (!data) return <div className="loading">Loading...</div>;

  return (
    <div className="referral-dashboard">
      <div className="referral-hero">
        <h2>Invite Friends, Earn Points</h2>
        <p>Get 50 points for every friend who joins using your code</p>
        <div className="points-display">
          <div className="points-number">{data.points}</div>
          <div className="points-label">Points Earned</div>
        </div>
      </div>

      <div className="referral-code-section">
        <div className="code-box">
          <span className="code-label">Your Code</span>
          <span className="code-value">{data.code}</span>
          <button className="copy-btn" onClick={copyCode}>Copy Code</button>
        </div>
        <button className="link-btn" onClick={copyLink}>📋 Copy Invite Link</button>
      </div>

      <div className="referral-stats">
        <div className="stat-item"><div className="stat-num">{data.referrals.length}</div><div>Total Referrals</div></div>
        <div className="stat-item"><div className="stat-num">{data.referrals.filter(r => r.status === 'completed').length}</div><div>Completed</div></div>
        <div className="stat-item"><div className="stat-num">{data.points}</div><div>Points</div></div>
      </div>

      <div className="referral-list-section">
        <h3>Your Referrals</h3>
        {data.referrals.length === 0 ? (
          <div className="empty-state">No referrals yet. Share your code to get started!</div>
        ) : (
          data.referrals.map(r => (
            <div key={r.id} className="referral-item">
              <div className="ref-avatar">{r.referred?.displayName?.[0]}</div>
              <div className="ref-details">
                <div className="ref-name">{r.referred?.displayName || r.referred?.username}</div>
                <div className="ref-date">Joined {new Date(r.referred?.createdAt).toLocaleDateString()}</div>
              </div>
              <div className={`ref-badge status-${r.status}`}>{r.status}</div>
              <div className="ref-points">+{r.pointsAwarded} pts</div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
