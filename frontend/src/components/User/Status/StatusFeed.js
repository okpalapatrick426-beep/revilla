import React, { useState, useEffect, useRef, useCallback } from 'react';
import api from '../../../services/api';

const BASE = process.env.REACT_APP_API_URL?.replace('/api', '') || '';

const AddIcon = () => <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18"><path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/></svg>;
const CloseIcon = () => <svg viewBox="0 0 24 24" fill="currentColor" width="22" height="22"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>;
const EyeIcon = () => <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16"><path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"/></svg>;
const GridIcon = () => <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18"><path d="M4 4h4v4H4zm6 0h4v4h-4zm6 0h4v4h-4zM4 10h4v4H4zm6 0h4v4h-4zm6 0h4v4h-4zM4 16h4v4H4zm6 0h4v4h-4zm6 0h4v4h-4z"/></svg>;
const ListIcon = () => <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18"><path d="M3 13h2v-2H3v2zm0 4h2v-2H3v2zm0-8h2V7H3v2zm4 4h14v-2H7v2zm0 4h14v-2H7v2zM7 7v2h14V7H7z"/></svg>;
const ShareIcon = () => <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16"><path d="M18 16.08c-.76 0-1.44.3-1.96.77L8.91 12.7c.05-.23.09-.46.09-.7s-.04-.47-.09-.7l7.05-4.11c.54.5 1.25.81 2.04.81 1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3c0 .24.04.47.09.7L8.04 9.81C7.5 9.31 6.79 9 6 9c-1.66 0-3 1.34-3 3s1.34 3 3 3c.79 0 1.5-.31 2.04-.81l7.12 4.16c-.05.21-.08.43-.08.65 0 1.61 1.31 2.92 2.92 2.92s2.92-1.31 2.92-2.92-1.31-2.92-2.92-2.92z"/></svg>;
const ReelIcon = () => <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16"><rect x="2" y="2" width="20" height="20" rx="2"/><path d="M10 8l6 4-6 4V8z" fill="#fff"/></svg>;
const RepostIcon = () => <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16"><path d="M7 7h10v3l4-4-4-4v3H5v6h2V7zm10 10H7v-3l-4 4 4 4v-3h12v-6h-2v4z"/></svg>;
const BellIcon = () => <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16"><path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.9 2 2 2zm6-6v-5c0-3.07-1.64-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.63 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z"/></svg>;

const BG_COLORS = ['#0d1117','#1a1a2e','#7c3aed','#0f3460','#16213e','#dc2626','#059669','#d97706','#1d4ed8'];
const STATUS_DURATION = 5000;

export default function StatusFeed({ currentUser, onOpenChat }) {
  const [statuses, setStatuses] = useState([]);
  const [myStatuses, setMyStatuses] = useState([]);
  // Persist viewed IDs in localStorage so they survive page refresh
  const [viewedIds, setViewedIds] = useState(() => {
    try { return new Set(JSON.parse(localStorage.getItem('viewed_status_ids') || '[]')); }
    catch { return new Set(); }
  });
  const [viewing, setViewing] = useState(null);
  const [viewIdx, setViewIdx] = useState(0);
  const [creating, setCreating] = useState(false);
  const [createText, setCreateText] = useState('');
  const [createBg, setCreateBg] = useState(BG_COLORS[0]);
  const [createMedia, setCreateMedia] = useState(null);
  const [createPreview, setCreatePreview] = useState(null);
  const [createMood, setCreateMood] = useState('');
  const [posting, setPosting] = useState(false);
  const [paused, setPaused] = useState(false);
  const [progress, setProgress] = useState(0);
  const [gridMode, setGridMode] = useState(false);
  const [viewCounts, setViewCounts] = useState({});
  const [notifications, setNotifications] = useState([]);

  const videoRef = useRef(null);
  const progressInterval = useRef(null);
  const progressStart = useRef(null);
  const fileRef = useRef(null);

  // Persist viewed IDs to localStorage whenever they change
  const addViewedId = useCallback((id) => {
    setViewedIds(prev => {
      const next = new Set([...prev, id]);
      try { localStorage.setItem('viewed_status_ids', JSON.stringify([...next])); } catch {}
      return next;
    });
  }, []);

  const load = async () => {
    try {
      const [allRes, myRes] = await Promise.all([
        api.get('/status'),
        api.get('/status/mine').catch(() => ({ data: [] })),
      ]);
      const grouped = {};
      (allRes.data || []).forEach(s => {
        if (s.userId === currentUser?.id) return;
        if (!grouped[s.userId]) grouped[s.userId] = { user: s.User || { id: s.userId }, statuses: [] };
        grouped[s.userId].statuses.push(s);
      });
      setStatuses(Object.values(grouped));
      setMyStatuses(myRes.data || []);

      // Also mark as viewed from server data
      const serverViewed = new Set();
      allRes.data?.forEach(s => {
        try {
          const viewers = JSON.parse(s.viewers || '[]');
          if (viewers.includes(currentUser?.id)) serverViewed.add(s.id);
        } catch {}
      });
      if (serverViewed.size > 0) {
        setViewedIds(prev => {
          const next = new Set([...prev, ...serverViewed]);
          try { localStorage.setItem('viewed_status_ids', JSON.stringify([...next])); } catch {}
          return next;
        });
      }

      // View counts
      const counts = {};
      allRes.data?.forEach(s => { counts[s.id] = s.viewCount || 0; });
      myRes.data?.forEach(s => { counts[s.id] = s.viewCount || 0; });
      setViewCounts(prev => ({ ...prev, ...counts }));

      // Check for new statuses (notifications)
      const newOnes = allRes.data?.filter(s => {
        const age = Date.now() - new Date(s.createdAt).getTime();
        return age < 60000 && !viewedIds.has(s.id);
      });
      if (newOnes?.length > 0) {
        setNotifications(newOnes.map(s => ({
          id: s.id,
          text: `${s.User?.displayName || s.User?.username} posted a new status`,
          userId: s.userId,
          user: s.User,
        })));
        setTimeout(() => setNotifications([]), 5000);
      }
    } catch (err) { console.error(err); }
  };

  useEffect(() => { load(); const t = setInterval(load, 15000); return () => clearInterval(t); }, []);

  const markViewed = useCallback(async (statusId) => {
    if (!statusId) return;
    addViewedId(statusId); // always update locally immediately
    try {
      const res = await api.post(`/status/${statusId}/view`);
      if (res.data?.viewCount !== undefined) {
        setViewCounts(prev => ({ ...prev, [statusId]: res.data.viewCount }));
      }
    } catch {}
  }, [addViewedId]);

  // Auto-advance
  useEffect(() => {
    if (!viewing || paused) { clearInterval(progressInterval.current); return; }
    const cur = viewing.statuses[viewIdx];
    if (!cur || (cur.type === 'video' && videoRef.current)) return;

    setProgress(0);
    progressStart.current = Date.now();
    clearInterval(progressInterval.current);
    progressInterval.current = setInterval(() => {
      const pct = Math.min(((Date.now() - progressStart.current) / STATUS_DURATION) * 100, 100);
      setProgress(pct);
      if (pct >= 100) advance();
    }, 50);
    return () => clearInterval(progressInterval.current);
  }, [viewing, viewIdx, paused]);

  const advance = useCallback(() => {
    if (!viewing) return;
    const next = viewIdx + 1;
    if (next < viewing.statuses.length) {
      setViewIdx(next); setProgress(0);
      markViewed(viewing.statuses[next]?.id);
    } else {
      setViewing(null);
    }
  }, [viewing, viewIdx, markViewed]);

  const goBack = () => {
    if (viewIdx > 0) { setViewIdx(v => v - 1); setProgress(0); }
  };

  const openViewer = (group) => {
    setViewing({ ...group, isMine: false });
    setViewIdx(0); setProgress(0); setPaused(false);
    markViewed(group.statuses[0]?.id);
  };

  // FIX: My status — always open viewer if I have statuses, never show create
  const openMine = () => {
    if (myStatuses.length > 0) {
      setViewing({ statuses: myStatuses, user: currentUser, isMine: true });
      setViewIdx(0); setProgress(0); setPaused(false);
    } else {
      setCreating(true);
    }
  };

  const handleScrub = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = (e.touches?.[0]?.clientX || e.clientX) - rect.left;
    const pct = Math.max(0, Math.min(100, (x / rect.width) * 100));
    setProgress(pct);
    progressStart.current = Date.now() - (pct / 100) * STATUS_DURATION;
    if (videoRef.current && videoRef.current.duration) {
      videoRef.current.currentTime = (pct / 100) * videoRef.current.duration;
    }
  };

  const postStatus = async () => {
    if (!createText.trim() && !createMedia) return;
    setPosting(true);
    try {
      const fd = new FormData();
      fd.append('content', createText);
      fd.append('backgroundColor', createBg);
      fd.append('mood', createMood);
      fd.append('expiresAt', new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString());
      if (createMedia) {
        fd.append('media', createMedia);
        fd.append('type', createMedia.type.startsWith('video') ? 'video' : 'image');
      } else { fd.append('type', 'text'); }
      await api.post('/status', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      setCreating(false); setCreateText(''); setCreateMedia(null); setCreatePreview(null); setCreateMood('');
      await load();
    } catch (err) { console.error(err); }
    finally { setPosting(false); }
  };

  const repostStatus = async (status) => {
    try {
      const fd = new FormData();
      fd.append('content', status.content || '');
      fd.append('backgroundColor', status.backgroundColor || '#0d1117');
      fd.append('type', 'text');
      fd.append('expiresAt', new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString());
      await api.post('/status', fd);
      alert('Reposted to your status!');
      await load();
    } catch { alert('Failed to repost'); }
  };

  const shareStatus = (status) => {
    const text = status.content || 'Check out this status on Revilla!';
    if (navigator.share) {
      navigator.share({ title: 'Revilla Status', text, url: window.location.origin });
    } else {
      navigator.clipboard?.writeText(`${text} — revilla.vercel.app`);
      alert('Link copied!');
    }
  };

  const postToReels = async (status) => {
    try {
      const fd = new FormData();
      fd.append('content', status.content || '');
      fd.append('backgroundColor', status.backgroundColor || '#0d1117');
      fd.append('type', status.type || 'text');
      await api.post('/posts', fd);
      alert('Posted to Reels!');
    } catch { alert('Failed'); }
  };

  const handleReply = (user) => {
    setViewing(null);
    clearInterval(progressInterval.current);
    setTimeout(() => onOpenChat && onOpenChat(user), 150);
  };

  const avatarSrc = (u) => u?.avatar ? (u.avatar.startsWith('http') ? u.avatar : `${BASE}${u.avatar}`) : null;
  const isGroupUnviewed = (group) => group.statuses.some(s => !viewedIds.has(s.id));
  const currentStatus = viewing?.statuses[viewIdx];

  return (
    <div className="status-feed">
      {/* ── NOTIFICATIONS ── */}
      {notifications.length > 0 && (
        <div className="status-notifications">
          {notifications.map(n => (
            <div key={n.id} className="status-notif">
              <BellIcon /> {n.text}
            </div>
          ))}
        </div>
      )}

      {/* ── STORIES ROW ── */}
      <div className="stories-row">
        {/* My status bubble — shows viewer if has statuses, create if not */}
        <div className="story-item" onClick={openMine}>
          <div className={`story-ring ${myStatuses.length > 0 ? 'has-status' : 'no-status'}`}>
            <div className="story-avatar">
              {avatarSrc(currentUser)
                ? <img src={avatarSrc(currentUser)} alt="" />
                : <div className="story-avatar-placeholder">{(currentUser?.displayName || 'Y')[0].toUpperCase()}</div>}
              {myStatuses.length === 0 && <div className="story-add-badge"><AddIcon /></div>}
            </div>
          </div>
          <span className="story-name">My Status</span>
        </div>

        {statuses.map(group => (
          <div key={group.user.id} className="story-item" onClick={() => openViewer(group)}>
            <div className={`story-ring ${isGroupUnviewed(group) ? 'unviewed' : 'viewed'}`}>
              <div className="story-avatar">
                {avatarSrc(group.user)
                  ? <img src={avatarSrc(group.user)} alt="" />
                  : <div className="story-avatar-placeholder">{(group.user.displayName || '?')[0].toUpperCase()}</div>}
              </div>
            </div>
            <span className="story-name">{group.user.displayName || group.user.username}</span>
          </div>
        ))}

        {/* Add new status button (always visible) */}
        <div className="story-item" onClick={() => setCreating(true)}>
          <div className="story-ring no-status" style={{ border: '2px dashed #7c3aed' }}>
            <div className="story-avatar" style={{ background: 'rgba(124,58,237,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <AddIcon />
            </div>
          </div>
          <span className="story-name" style={{ color: '#7c3aed' }}>Add New</span>
        </div>
      </div>

      {/* ── LIST / GRID ── */}
      <div className="status-list-header">
        <p className="status-section-title">Recent updates</p>
        <div className="status-view-toggle">
          <button className={`stv-btn ${!gridMode ? 'active' : ''}`} onClick={() => setGridMode(false)}><ListIcon /></button>
          <button className={`stv-btn ${gridMode ? 'active' : ''}`} onClick={() => setGridMode(true)}><GridIcon /></button>
        </div>
      </div>

      {statuses.length === 0 && <p className="status-empty">No status updates yet</p>}

      {gridMode ? (
        <div className="status-grid">
          {statuses.flatMap(g => g.statuses.map(s => (
            <div key={s.id} className="status-grid-item" style={{ background: s.mediaUrl ? undefined : s.backgroundColor }} onClick={() => openViewer(g)}>
              {s.mediaUrl
                ? s.type === 'video'
                  ? <video src={s.mediaUrl.startsWith('http') ? s.mediaUrl : `${BASE}${s.mediaUrl}`} className="status-grid-media" muted />
                  : <img src={s.mediaUrl.startsWith('http') ? s.mediaUrl : `${BASE}${s.mediaUrl}`} alt="" className="status-grid-media" />
                : <p className="status-grid-text">{s.content}</p>}
            </div>
          )))}
        </div>
      ) : (
        statuses.map(group => (
          <div key={group.user.id} className="status-list-item" onClick={() => openViewer(group)}>
            <div className="status-list-avatar">
              {avatarSrc(group.user)
                ? <img src={avatarSrc(group.user)} alt="" />
                : <div className="story-avatar-placeholder sm">{(group.user.displayName || '?')[0].toUpperCase()}</div>}
            </div>
            <div className="status-list-info">
              <strong>{group.user.displayName || group.user.username}</strong>
              <span>{group.statuses.length} update{group.statuses.length > 1 ? 's' : ''} · {new Date(group.statuses[0].createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
            </div>
            {isGroupUnviewed(group) && <span className="status-unread-dot" />}
          </div>
        ))
      )}

      {/* ── FULLSCREEN VIEWER ── */}
      {viewing && currentStatus && (
        <div className="status-viewer"
          style={{ background: (currentStatus.type === 'video' || currentStatus.mediaUrl) ? '#000' : currentStatus.backgroundColor }}
          onClick={() => setPaused(p => !p)}>

          {/* Progress bars */}
          <div className="status-progress-bars" onClick={e => e.stopPropagation()}>
            {viewing.statuses.map((_, i) => (
              <div key={i} className="status-progress-bg"
                onMouseDown={handleScrub} onTouchStart={handleScrub} onTouchMove={e => { if (i === viewIdx) handleScrub(e); }}>
                <div className="status-progress-fill" style={{ width: i < viewIdx ? '100%' : i === viewIdx ? `${progress}%` : '0%' }} />
              </div>
            ))}
          </div>

          {/* Header */}
          <div className="status-viewer-header" onClick={e => e.stopPropagation()}>
            <div className="status-viewer-user">
              <div className="story-avatar sm">
                {avatarSrc(viewing.user)
                  ? <img src={avatarSrc(viewing.user)} alt="" />
                  : <div className="story-avatar-placeholder sm">{(viewing.user?.displayName || '?')[0].toUpperCase()}</div>}
              </div>
              <div>
                <strong>{viewing.isMine ? 'My Status' : (viewing.user?.displayName || viewing.user?.username)}</strong>
                <span>{new Date(currentStatus.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
              </div>
            </div>
            <button className="icon-btn" onClick={() => setViewing(null)}><CloseIcon /></button>
          </div>

          {/* Tap zones */}
          <div className="status-tap-prev" onClick={e => { e.stopPropagation(); goBack(); }} />
          <div className="status-tap-next" onClick={e => { e.stopPropagation(); advance(); }} />

          {/* Content */}
          <div className="status-viewer-content">
            {currentStatus.mediaUrl
              ? currentStatus.type === 'video'
                ? <video ref={videoRef}
                    src={currentStatus.mediaUrl.startsWith('http') ? currentStatus.mediaUrl : `${BASE}${currentStatus.mediaUrl}`}
                    autoPlay playsInline style={{ maxHeight: '70vh', width: '100%', objectFit: 'contain' }}
                    onTimeUpdate={e => setProgress((e.target.currentTime / e.target.duration) * 100)}
                    onEnded={advance} />
                : <img src={currentStatus.mediaUrl.startsWith('http') ? currentStatus.mediaUrl : `${BASE}${currentStatus.mediaUrl}`} alt="" className="status-img" />
              : <p className="status-text-content">{currentStatus.content}</p>}
            {currentStatus.mood && <div className="status-mood">Mood: {currentStatus.mood}</div>}
            {paused && <div className="status-pause-overlay">▶</div>}
          </div>

          {/* Footer */}
          <div className="status-viewer-footer" onClick={e => e.stopPropagation()}>
            <div className="status-views"><EyeIcon /><span>{viewCounts[currentStatus.id] ?? currentStatus.viewCount ?? 0} views</span></div>
            <div className="status-footer-actions">
              {viewing.isMine ? (
                <>
                  <button className="sv-footer-btn" onClick={() => shareStatus(currentStatus)}><ShareIcon /> Share</button>
                  <button className="sv-footer-btn danger" onClick={() => api.delete(`/status/${currentStatus.id}`).then(() => { load(); setViewing(null); })}>Delete</button>
                </>
              ) : (
                <>
                  <button className="sv-footer-btn" onClick={() => handleReply(viewing.user)}>Reply</button>
                  <button className="sv-footer-btn" onClick={() => repostStatus(currentStatus)}><RepostIcon /> Repost</button>
                  <button className="sv-footer-btn" onClick={() => shareStatus(currentStatus)}><ShareIcon /> Share</button>
                  <button className="sv-footer-btn" onClick={() => postToReels(currentStatus)}><ReelIcon /> Reels</button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── CREATE STATUS ── */}
      {creating && (
        <div className="status-create-overlay">
          <div className="status-create-card" style={{ background: createPreview ? '#000' : createBg }}>
            <div className="status-create-header">
              <h3>New Status</h3>
              <button className="icon-btn" onClick={() => { setCreating(false); setCreateMedia(null); setCreatePreview(null); setCreateText(''); }}><CloseIcon /></button>
            </div>
            <div className="status-create-preview">
              {createPreview
                ? createMedia?.type.startsWith('video')
                  ? <video src={createPreview} className="create-preview-media" controls />
                  : <img src={createPreview} alt="" className="create-preview-media" />
                : <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.9rem' }}>{createText || 'Preview...'}</p>}
            </div>
            <textarea className="status-text-input" placeholder="What's on your mind?" value={createText} onChange={e => setCreateText(e.target.value)} rows={2} />
            <input className="status-text-input" placeholder="🎭 Mood for today (optional)" value={createMood} onChange={e => setCreateMood(e.target.value)} style={{ marginTop: 8 }} />
            {!createPreview && (
              <div className="status-bg-picker">
                {BG_COLORS.map(c => <button key={c} className={`bg-swatch ${createBg === c ? 'selected' : ''}`} style={{ background: c }} onClick={() => setCreateBg(c)} />)}
              </div>
            )}
            <div className="status-create-actions">
              <button className="status-media-btn" onClick={() => fileRef.current?.click()}>
                {createPreview ? 'Change' : '📷 Photo/Video'}
              </button>
              <input ref={fileRef} type="file" accept="image/*,video/*" style={{ display: 'none' }}
                onChange={e => {
                  const f = e.target.files[0]; if (!f) return;
                  setCreateMedia(f);
                  const r = new FileReader(); r.onload = () => setCreatePreview(r.result); r.readAsDataURL(f);
                }} />
              <button className="status-post-btn" onClick={postStatus} disabled={posting || (!createText.trim() && !createMedia)}>
                {posting ? 'Posting...' : 'Post'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
