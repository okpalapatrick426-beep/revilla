import React, { useState, useEffect, useRef } from 'react';
import api from '../../../services/api';

const AddIcon = () => <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20"><path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/></svg>;
const CloseIcon = () => <svg viewBox="0 0 24 24" fill="currentColor" width="24" height="24"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>;
const EyeIcon = () => <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16"><path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"/></svg>;

const BG_COLORS = ['#1a1a2e', '#16213e', '#7c3aed', '#0f3460', '#1b1b2f', '#2d1b69', '#0d1117', '#1e3a5f'];

export default function StatusFeed({ currentUser, onOpenChat }) {
  const [statuses, setStatuses] = useState([]);
  const [myStatuses, setMyStatuses] = useState([]);
  const [viewing, setViewing] = useState(null);   // { statuses: [], index, ownerName }
  const [viewIndex, setViewIndex] = useState(0);
  const [creating, setCreating] = useState(false);
  const [newText, setNewText] = useState('');
  const [newBg, setNewBg] = useState(BG_COLORS[0]);
  const [posting, setPosting] = useState(false);
  const [progress, setProgress] = useState(0);
  const progressRef = useRef(null);
  const progressInterval = useRef(null);
  const STATUS_DURATION = 5000; // 5 seconds per status

  const load = async () => {
    try {
      const [allRes, myRes] = await Promise.all([
        api.get('/status'),
        api.get('/status/mine').catch(() => ({ data: [] })),
      ]);
      // Group by user
      const grouped = {};
      (allRes.data || []).forEach(s => {
        if (s.userId === currentUser?.id) return; // skip own from main feed
        if (!grouped[s.userId]) grouped[s.userId] = { user: s.User || { id: s.userId, displayName: 'Unknown', username: 'unknown' }, statuses: [] };
        grouped[s.userId].statuses.push(s);
      });
      setStatuses(Object.values(grouped));
      setMyStatuses(myRes.data || []);
    } catch (err) {
      console.error('Status load failed:', err);
    }
  };

  useEffect(() => { load(); const t = setInterval(load, 15000); return () => clearInterval(t); }, []);

  // Auto-advance status viewer
  useEffect(() => {
    if (!viewing) { clearInterval(progressInterval.current); return; }
    setProgress(0);
    clearInterval(progressInterval.current);
    const start = Date.now();
    progressInterval.current = setInterval(() => {
      const pct = Math.min(((Date.now() - start) / STATUS_DURATION) * 100, 100);
      setProgress(pct);
      if (pct >= 100) {
        clearInterval(progressInterval.current);
        const nextIndex = viewIndex + 1;
        if (nextIndex < viewing.statuses.length) {
          setViewIndex(nextIndex);
        } else {
          setViewing(null);
        }
      }
    }, 50);
    return () => clearInterval(progressInterval.current);
  }, [viewing, viewIndex]);

  const openViewer = async (group) => {
    setViewing(group);
    setViewIndex(0);
    // Mark as viewed
    try {
      await api.post(`/status/${group.statuses[0].id}/view`);
    } catch {}
  };

  const openMyViewer = () => {
    if (myStatuses.length === 0) { setCreating(true); return; }
    setViewing({ statuses: myStatuses, user: currentUser, ownerName: 'My Status', isMine: true });
    setViewIndex(0);
  };

  const nextStatus = () => {
    if (!viewing) return;
    const next = viewIndex + 1;
    if (next < viewing.statuses.length) { setViewIndex(next); setProgress(0); }
    else setViewing(null);
  };

  const prevStatus = () => {
    if (viewIndex > 0) { setViewIndex(viewIndex - 1); setProgress(0); }
  };

  const postStatus = async () => {
    if (!newText.trim()) return;
    setPosting(true);
    try {
      await api.post('/status', {
        content: newText,
        type: 'text',
        backgroundColor: newBg,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      });
      setNewText('');
      setCreating(false);
      await load();
    } catch (err) { console.error(err); }
    finally { setPosting(false); }
  };

  const deleteMyStatus = async (id) => {
    try { await api.delete(`/status/${id}`); await load(); }
    catch (err) { console.error(err); }
  };

  const currentStatus = viewing?.statuses[viewIndex];
  const BASE = process.env.REACT_APP_API_URL?.replace('/api', '') || '';

  return (
    <div className="status-feed">
      {/* ── STORIES ROW ── */}
      <div className="stories-row">
        {/* My status bubble */}
        <div className="story-item" onClick={openMyViewer}>
          <div className={`story-ring ${myStatuses.length > 0 ? 'has-status' : 'no-status'}`}>
            <div className="story-avatar">
              {currentUser?.avatar
                ? <img src={currentUser.avatar.startsWith('http') ? currentUser.avatar : `${BASE}${currentUser.avatar}`} alt="" />
                : <div className="story-avatar-placeholder">{(currentUser?.displayName || 'Y')[0].toUpperCase()}</div>
              }
              <div className="story-add-badge"><AddIcon /></div>
            </div>
          </div>
          <span className="story-name">My Status</span>
        </div>

        {/* Others' status bubbles */}
        {statuses.map((group) => {
          const user = group.user;
          const hasUnviewed = group.statuses.some(s => {
            const viewers = JSON.parse(s.viewers || '[]');
            return !viewers.includes(currentUser?.id);
          });
          return (
            <div key={user.id} className="story-item" onClick={() => openViewer(group)}>
              <div className={`story-ring ${hasUnviewed ? 'unviewed' : 'viewed'}`}>
                <div className="story-avatar">
                  {user.avatar
                    ? <img src={user.avatar.startsWith('http') ? user.avatar : `${BASE}${user.avatar}`} alt="" />
                    : <div className="story-avatar-placeholder">{(user.displayName || user.username || '?')[0].toUpperCase()}</div>
                  }
                </div>
              </div>
              <span className="story-name">{user.displayName || user.username}</span>
            </div>
          );
        })}
      </div>

      {/* ── RECENT UPDATES LIST ── */}
      <div className="status-list-section">
        <p className="status-section-title">Recent updates</p>
        {statuses.length === 0 && <p className="status-empty">No status updates yet</p>}
        {statuses.map(group => (
          <div key={group.user.id} className="status-list-item" onClick={() => openViewer(group)}>
            <div className="status-list-avatar">
              {group.user.avatar
                ? <img src={group.user.avatar.startsWith('http') ? group.user.avatar : `${BASE}${group.user.avatar}`} alt="" />
                : <div className="story-avatar-placeholder sm">{(group.user.displayName || '?')[0].toUpperCase()}</div>
              }
            </div>
            <div className="status-list-info">
              <strong>{group.user.displayName || group.user.username}</strong>
              <span>{group.statuses.length} update{group.statuses.length > 1 ? 's' : ''} · {new Date(group.statuses[0].createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
            </div>
          </div>
        ))}
      </div>

      {/* ── FULLSCREEN VIEWER ── */}
      {viewing && currentStatus && (
        <div className="status-viewer" style={{ background: currentStatus.backgroundColor || '#1a1a2e' }}>
          {/* Progress bars */}
          <div className="status-progress-bars">
            {viewing.statuses.map((_, i) => (
              <div key={i} className="status-progress-bg">
                <div
                  className="status-progress-fill"
                  style={{ width: i < viewIndex ? '100%' : i === viewIndex ? `${progress}%` : '0%' }}
                />
              </div>
            ))}
          </div>

          {/* Header */}
          <div className="status-viewer-header">
            <div className="status-viewer-user">
              <div className="story-avatar sm">
                {viewing.user?.avatar
                  ? <img src={viewing.user.avatar.startsWith('http') ? viewing.user.avatar : `${BASE}${viewing.user.avatar}`} alt="" />
                  : <div className="story-avatar-placeholder sm">{(viewing.user?.displayName || '?')[0].toUpperCase()}</div>
                }
              </div>
              <div>
                <strong>{viewing.ownerName || viewing.user?.displayName || viewing.user?.username}</strong>
                <span>{new Date(currentStatus.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
              </div>
            </div>
            <button className="icon-btn" onClick={() => setViewing(null)}><CloseIcon /></button>
          </div>

          {/* Tap zones */}
          <div className="status-tap-prev" onClick={prevStatus} />
          <div className="status-tap-next" onClick={nextStatus} />

          {/* Content */}
          <div className="status-viewer-content">
            {currentStatus.mediaUrl
              ? <img src={`${BASE}${currentStatus.mediaUrl}`} alt="status" className="status-img" />
              : <p className="status-text-content">{currentStatus.content}</p>
            }
          </div>

          {/* Footer */}
          <div className="status-viewer-footer">
            <div className="status-views">
              <EyeIcon />
              <span>{currentStatus.viewCount || 0} view{(currentStatus.viewCount || 0) !== 1 ? 's' : ''}</span>
            </div>
            {viewing.isMine ? (
              <button className="status-delete-btn" onClick={() => deleteMyStatus(currentStatus.id)}>Delete</button>
            ) : (
              <button className="status-reply-btn" onClick={() => { setViewing(null); onOpenChat && onOpenChat(viewing.user); }}>
                Reply
              </button>
            )}
          </div>
        </div>
      )}

      {/* ── CREATE STATUS ── */}
      {creating && (
        <div className="status-create-overlay">
          <div className="status-create-card" style={{ background: newBg }}>
            <div className="status-create-header">
              <h3>New Status</h3>
              <button className="icon-btn" onClick={() => setCreating(false)}><CloseIcon /></button>
            </div>
            <textarea
              className="status-text-input"
              placeholder="What's on your mind?"
              value={newText}
              onChange={e => setNewText(e.target.value)}
              rows={5}
              autoFocus
            />
            <div className="status-bg-picker">
              {BG_COLORS.map(c => (
                <button
                  key={c}
                  className={`bg-swatch ${newBg === c ? 'selected' : ''}`}
                  style={{ background: c }}
                  onClick={() => setNewBg(c)}
                />
              ))}
            </div>
            <button className="status-post-btn" onClick={postStatus} disabled={posting || !newText.trim()}>
              {posting ? 'Posting...' : 'Post Status'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
