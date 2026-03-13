import { useState, useEffect } from 'react';
import { getStatuses, createStatus, viewStatus, deleteStatus } from '../../../services/api';
import { useAuth } from '../../../context/AuthContext';
import toast from 'react-hot-toast';

export default function StatusFeed({ onUserClick }) {
  const [statuses, setStatuses] = useState([]);
  const [creating, setCreating] = useState(false);
  const [newStatus, setNewStatus] = useState({ content: '', type: 'text', backgroundColor: '#1a1a2e' });
  const [viewing, setViewing] = useState(null);
  const { user } = useAuth();

  const loadStatuses = () => {
    getStatuses().then(r => setStatuses(r.data || [])).catch(() => {});
  };

  useEffect(() => { loadStatuses(); }, []);

  // Auto-refresh every 2 seconds
  useEffect(() => {
    const interval = setInterval(loadStatuses, 2000);
    return () => clearInterval(interval);
  }, []);

  const handleCreate = async () => {
    if (!newStatus.content.trim()) return;
    try {
      const res = await createStatus(newStatus);
      setStatuses(prev => [res.data, ...prev]);
      setCreating(false);
      setNewStatus({ content: '', type: 'text', backgroundColor: '#1a1a2e' });
      toast.success('Status posted!');
    } catch { toast.error('Failed to post status'); }
  };

  const handleView = async (status) => {
    setViewing(status);
    if (status.userId !== user?.id) {
      try {
        await viewStatus(status.id);
        // Update local view count
        setStatuses(prev => prev.map(s => {
          if (s.id === status.id) {
            const views = s.views || [];
            if (!views.includes(user?.id)) {
              return { ...s, views: [...views, user?.id] };
            }
          }
          return s;
        }));
      } catch {}
    }
  };

  const handleDelete = async (id) => {
    await deleteStatus(id);
    setStatuses(prev => prev.filter(s => s.id !== id));
    setViewing(null);
    toast.success('Status deleted');
  };

  const colors = ['#1a1a2e', '#16213e', '#0f3460', '#533483', '#e94560', '#2d6a4f', '#1b4332'];

  return (
    <div className="status-feed">
      <div className="status-row">
        <div className="add-status-btn" onClick={() => setCreating(true)}>
          <div className="add-status-icon">+</div>
          <div className="add-status-label">Add Status</div>
        </div>
        {statuses.map(s => (
          <div key={s.id} className="status-item" onClick={() => handleView(s)}>
            <div className="status-preview" style={{ background: s.backgroundColor }}>
              <span>{s.content?.slice(0, 20)}{s.content?.length > 20 ? '...' : ''}</span>
            </div>
            <div className="status-user-name"
              onClick={e => { e.stopPropagation(); onUserClick && s.User && onUserClick(s.User); }}
              style={{ cursor: 'pointer' }}>
              {s.User?.displayName || s.User?.username}
            </div>
            {s.userId === user?.id && (
              <div className="status-views">👁 {(s.views || []).length}</div>
            )}
          </div>
        ))}
      </div>

      {creating && (
        <div className="status-create-modal">
          <div className="status-create-box">
            <h3>Create Status</h3>
            <textarea placeholder="What's on your mind?" value={newStatus.content}
              onChange={e => setNewStatus(p => ({ ...p, content: e.target.value }))} rows={4} />
            <div className="color-picker">
              {colors.map(c => (
                <div key={c} className={`color-swatch ${newStatus.backgroundColor === c ? 'selected' : ''}`}
                  style={{ background: c }} onClick={() => setNewStatus(p => ({ ...p, backgroundColor: c }))} />
              ))}
            </div>
            <div className="create-actions">
              <button className="cancel-btn" onClick={() => setCreating(false)}>Cancel</button>
              <button className="post-btn" onClick={handleCreate}>Post Status</button>
            </div>
          </div>
        </div>
      )}

      {viewing && (
        <div className="status-viewer" onClick={() => setViewing(null)}>
          <div className="status-full" style={{ background: viewing.backgroundColor }}
            onClick={e => e.stopPropagation()}>
            <div className="status-full-header">
              <div className="sv-avatar" style={{ cursor: 'pointer' }}
                onClick={() => { onUserClick && viewing.User && onUserClick(viewing.User); setViewing(null); }}>
                {viewing.User?.displayName?.[0]}
              </div>
              <div>
                <div className="sv-name" style={{ cursor: 'pointer' }}
                  onClick={() => { onUserClick && viewing.User && onUserClick(viewing.User); setViewing(null); }}>
                  {viewing.User?.displayName}
                </div>
                <div className="sv-time">{new Date(viewing.createdAt).toLocaleTimeString()}</div>
              </div>
              {viewing.userId === user?.id && (
                <button className="sv-delete" onClick={() => handleDelete(viewing.id)}>🗑</button>
              )}
              <button className="sv-close" onClick={() => setViewing(null)}>✕</button>
            </div>
            <div className="status-full-content">{viewing.content}</div>
            {viewing.userId === user?.id && (
              <div className="sv-viewers">
                <div className="sv-viewers-title">👁 {(viewing.views || []).length} view{(viewing.views || []).length !== 1 ? 's' : ''}</div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
