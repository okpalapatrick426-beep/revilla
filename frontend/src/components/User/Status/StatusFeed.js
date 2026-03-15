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
const PauseIcon = () => <svg viewBox="0 0 24 24" fill="currentColor" width="28" height="28"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>;
const PlayIconSm = () => <svg viewBox="0 0 24 24" fill="currentColor" width="28" height="28"><path d="M8 5v14l11-7z"/></svg>;

const BG_COLORS = ['#0d1117','#1a1a2e','#7c3aed','#0f3460','#16213e','#dc2626','#059669','#d97706','#1d4ed8'];
const STATUS_DURATION = 5000;
const STORAGE_KEY = 'revilla_viewed_statuses';

// Persist viewed IDs across sessions
const getStoredViewed = () => {
  try { return new Set(JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')); }
  catch { return new Set(); }
};
const saveViewed = (set) => {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify([...set])); } catch {}
};

export default function StatusFeed({ currentUser, onOpenChat }) {
  const [statuses, setStatuses] = useState([]);
  const [myStatuses, setMyStatuses] = useState([]);
  const [viewedIds, setViewedIds] = useState(getStoredViewed);
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
  const [showPauseIcon, setShowPauseIcon] = useState(false); // only show briefly
  const [progress, setProgress] = useState(0);
  const [gridMode, setGridMode] = useState(false);
  const [viewCounts, setViewCounts] = useState({});

  const videoRef = useRef(null);
  const progressInterval = useRef(null);
  const progressStart = useRef(null);
  const pauseIconTimer = useRef(null);
  const fileRef = useRef(null);

  // Add to viewed and persist immediately
  const addViewed = useCallback((id) => {
    if (!id) return;
    setViewedIds(prev => {
      if (prev.has(id)) return prev;
      const next = new Set([...prev, id]);
      saveViewed(next);
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

      // Sync viewed from server
      setViewedIds(prev => {
        const next = new Set(prev);
        let changed = false;
        allRes.data?.forEach(s => {
          try {
            const viewers = JSON.parse(s.viewers || '[]');
            if (viewers.includes(currentUser?.id) && !next.has(s.id)) {
              next.add(s.id); changed = true;
            }
          } catch {}
        });
        if (changed) saveViewed(next);
        return changed ? next : prev;
      });

      const counts = {};
      [...(allRes.data || []), ...(myRes.data || [])].forEach(s => { counts[s.id] = s.viewCount || 0; });
      setViewCounts(prev => ({ ...prev, ...counts }));
    } catch (err) { console.error(err); }
  };

  useEffect(() => { load(); const t = setInterval(load, 20000); return () => clearInterval(t); }, []);

  const markViewed = useCallback(async (statusId) => {
    if (!statusId) return;
    addViewed(statusId);
    try {
      const res = await api.post(`/status/${statusId}/view`);
      if (res.data?.viewCount !== undefined) {
        setViewCounts(prev => ({ ...prev, [statusId]: res.data.viewCount }));
      }
    } catch {}
  }, [addViewed]);

  // Auto-advance timer
  useEffect(() => {
    if (!viewing || paused) { clearInterval(progressInterval.current); return; }
    const cur = viewing.statuses[viewIdx];
    if (!cur) return;
    if (cur.type === 'video') return; // video handles its own via onTimeUpdate

    setProgress(0);
    progressStart.current = Date.now();
    clearInterval(progressInterval.current);
    progressInterval.current = setInterval(() => {
      const pct = Math.min(((Date.now() - progressStart.current) / STATUS_DURATION) * 100, 100);
      setProgress(pct);
      if (pct >= 100) { clearInterval(progressInterval.current); advance(); }
    }, 50);
    return () => clearInterval(progressInterval.current);
  }, [viewing?.statuses, viewIdx, paused]);

  const advance = useCallback(() => {
    setViewing(prev => {
      if (!prev) return null;
      const next = viewIdx + 1;
      if (next < prev.statuses.length) {
        setViewIdx(next);
        setProgress(0);
        setPaused(false);
        markViewed(prev.statuses[next]?.id);
        return prev;
      }
      return null; // close viewer
    });
  }, [viewIdx, markViewed]);

  const goBack = useCallback(() => {
    if (viewIdx > 0) { setViewIdx(v => v - 1); setProgress(0); setPaused(false); }
  }, [viewIdx]);

  const openViewer = (group) => {
    setViewing({ ...group, isMine: false });
    setViewIdx(0); setProgress(0); setPaused(false);
    markViewed(group.statuses[0]?.id);
  };

  const openMine = () => {
    if (myStatuses.length > 0) {
      setViewing({ statuses: myStatuses, user: currentUser, isMine: true });
      setViewIdx(0); setProgress(0); setPaused(false);
    } else {
      setCreating(true);
    }
  };

  // Toggle pause — show icon briefly then hide
  const togglePause = (e) => {
    e.stopPropagation();
    const newPaused = !paused;
    setPaused(newPaused);
    setShowPauseIcon(true);
    clearTimeout(pauseIconTimer.current);
    pauseIconTimer.current = setTimeout(() => setShowPauseIcon(false), 800);
    if (videoRef.current) {
      if (newPaused) videoRef.current.pause();
      else videoRef.current.play();
    }
  };

  const handleScrub = (e, idx) => {
    if (idx !== viewIdx) return;
    e.stopPropagation();
    const rect = e.currentTarget.getBoundingClientRect();
    const x = (e.touches?.[0]?.clientX || e.clientX) - rect.left;
    const pct = Math.max(0, Math.min(100, (x / rect.width) * 100));
    setProgress(pct);
    progressStart.current = Date.now() - (pct / 100) * STATUS_DURATION;
    if (videoRef.current?.duration) {
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
      alert('Reposted!'); await load();
    } catch { alert('Failed'); }
  };

  const shareStatus = (status) => {
    const text = status.content || 'Check this status on Revilla!';
    if (navigator.share) navigator.share({ title: 'Revilla', text, url: window.location.origin });
    else { navigator.clipboard?.writeText(`${text} — revilla.vercel.app`); alert('Copied!'); }
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

  // Reply — clean close then open chat
  const handleReply = (user) => {
    clearInterval(progressInterval.current);
    setViewing(null);
    setTimeout(() => onOpenChat && onOpenChat(user), 200);
  };

  const avatarSrc = (u) => u?.avatar ? (u.avatar.startsWith('http') ? u.avatar : `${BASE}${u.avatar}`) : null;
  const isGroupUnviewed = (group) => group.statuses.some(s => !viewedIds.has(s.id));
  const currentStatus = viewing?.statuses[viewIdx];

  return (
    <div className="status-feed">
      {/* Stories row */}
      <div className="stories-row">
        <div className="story-item" onClick={openMine}>
          <div className={`story-ring ${myStatuses.length > 0 ? 'has-status' : 'no-status'}`}>
            <div className="story-avatar">
              {avatarSrc(currentUser) ? <img src={avatarSrc(currentUser)} alt="" /> : <div className="story-avatar-placeholder">{(currentUser?.displayName || 'Y')[0].toUpperCase()}</div>}
              {myStatuses.length === 0 && <div className="story-add-badge"><AddIcon /></div>}
            </div>
          </div>
          <span className="story-name">My Status</span>
        </div>

        {statuses.map(group => (
          <div key={group.user.id} className="story-item" onClick={() => openViewer(group)}>
            <div className={`story-ring ${isGroupUnviewed(group) ? 'unviewed' : 'viewed'}`}>
              <div className="story-avatar">
                {avatarSrc(group.user) ? <img src={avatarSrc(group.user)} alt="" /> : <div className="story-avatar-placeholder">{(group.user.displayName || '?')[0].toUpperCase()}</div>}
              </div>
            </div>
            <span className="story-name">{group.user.displayName || group.user.username}</span>
          </div>
        ))}

        <div className="story-item" onClick={() => setCreating(true)}>
          <div className="story-ring no-status" style={{ border: '2px dashed #7c3aed' }}>
            <div className="story-avatar" style={{ background: 'rgba(124,58,237,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <AddIcon />
            </div>
          </div>
          <span className="story-name" style={{ color: '#7c3aed' }}>Add New</span>
        </div>
      </div>

      {/* List/Grid */}
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
              {s.mediaUrl ? (s.type === 'video'
                ? <video src={s.mediaUrl.startsWith('http') ? s.mediaUrl : `${BASE}${s.mediaUrl}`} className="status-grid-media" muted />
                : <img src={s.mediaUrl.startsWith('http') ? s.mediaUrl : `${BASE}${s.mediaUrl}`} alt="" className="status-grid-media" />)
                : <p className="status-grid-text">{s.content}</p>}
            </div>
          )))}
        </div>
      ) : statuses.map(group => (
        <div key={group.user.id} className="status-list-item" onClick={() => openViewer(group)}>
          <div className="status-list-avatar">
            {avatarSrc(group.user) ? <img src={avatarSrc(group.user)} alt="" /> : <div className="story-avatar-placeholder sm">{(group.user.displayName || '?')[0].toUpperCase()}</div>}
          </div>
          <div className="status-list-info">
            <strong>{group.user.displayName || group.user.username}</strong>
            <span>{group.statuses.length} update{group.statuses.length > 1 ? 's' : ''} · {new Date(group.statuses[0].createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
          </div>
          {isGroupUnviewed(group) && <span className="status-unread-dot" />}
        </div>
      ))}

      {/* ── FULLSCREEN VIEWER ── */}
      {viewing && currentStatus && (
        <div className="status-viewer" style={{ background: (currentStatus.type === 'video' || currentStatus.mediaUrl) ? '#000' : currentStatus.backgroundColor }}>

          {/* Progress bars — tap to scrub */}
          <div className="status-progress-bars">
            {viewing.statuses.map((_, i) => (
              <div key={i} className="status-progress-bg"
                onMouseDown={e => handleScrub(e, i)}
                onTouchStart={e => handleScrub(e, i)}
                onTouchMove={e => handleScrub(e, i)}>
                <div className="status-progress-fill" style={{ width: i < viewIdx ? '100%' : i === viewIdx ? `${progress}%` : '0%' }} />
              </div>
            ))}
          </div>

          {/* Header */}
          <div className="status-viewer-header">
            <div className="status-viewer-user">
              <div className="story-avatar sm">
                {avatarSrc(viewing.user) ? <img src={avatarSrc(viewing.user)} alt="" /> : <div className="story-avatar-placeholder sm">{(viewing.user?.displayName || '?')[0].toUpperCase()}</div>}
              </div>
              <div>
                <strong>{viewing.isMine ? 'My Status' : (viewing.user?.displayName || viewing.user?.username)}</strong>
                <span>{new Date(currentStatus.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
              </div>
            </div>
            <button className="icon-btn" style={{ color: '#fff' }} onClick={() => { clearInterval(progressInterval.current); setViewing(null); }}><CloseIcon /></button>
          </div>

          {/* TAP ZONES — left=back, middle=pause, right=next */}
          <div style={{ position: 'absolute', inset: 0, display: 'flex', zIndex: 5, top: 80, bottom: 80 }}>
            <div style={{ flex: 1 }} onClick={goBack} /> {/* left tap = go back */}
            <div style={{ flex: 1 }} onClick={togglePause} /> {/* middle tap = pause */}
            <div style={{ flex: 1 }} onClick={e => { e.stopPropagation(); advance(); }} /> {/* right tap = next */}
          </div>

          {/* Content */}
          <div className="status-viewer-content">
            {currentStatus.mediaUrl
              ? currentStatus.type === 'video'
                ? <video ref={videoRef}
                    src={currentStatus.mediaUrl.startsWith('http') ? currentStatus.mediaUrl : `${BASE}${currentStatus.mediaUrl}`}
                    autoPlay playsInline
                    style={{ maxHeight: '70vh', width: '100%', objectFit: 'contain' }}
                    onTimeUpdate={e => setProgress((e.target.currentTime / e.target.duration) * 100)}
                    onEnded={advance} />
                : <img src={currentStatus.mediaUrl.startsWith('http') ? currentStatus.mediaUrl : `${BASE}${currentStatus.mediaUrl}`} alt="" className="status-img" />
              : <p className="status-text-content">{currentStatus.content}</p>}
            {currentStatus.mood && <div className="status-mood">Mood: {currentStatus.mood}</div>}

            {/* Pause icon — shows briefly then disappears */}
            {showPauseIcon && (
              <div className="status-pause-indicator">
                {paused ? <PlayIconSm /> : <PauseIcon />}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="status-viewer-footer">
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
                  <button className="sv-footer-btn" onClick={() => shareStatus(currentStatus)}><ShareIcon /></button>
                  <button className="sv-footer-btn" onClick={() => postToReels(currentStatus)}><ReelIcon /></button>
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
                ? createMedia?.type.startsWith('video') ? <video src={createPreview} className="create-preview-media" controls /> : <img src={createPreview} alt="" className="create-preview-media" />
                : <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.9rem' }}>{createText || 'Preview...'}</p>}
            </div>
            <textarea className="status-text-input" placeholder="What's on your mind?" value={createText} onChange={e => setCreateText(e.target.value)} rows={2} />
            <input className="status-text-input" placeholder="🎭 Mood for today (optional)" value={createMood} onChange={e => setCreateMood(e.target.value)} style={{ marginTop: 8 }} />
            {!createPreview && <div className="status-bg-picker">{BG_COLORS.map(c => <button key={c} className={`bg-swatch ${createBg === c ? 'selected' : ''}`} style={{ background: c }} onClick={() => setCreateBg(c)} />)}</div>}
            <div className="status-create-actions">
              <button className="status-media-btn" onClick={() => fileRef.current?.click()}>{createPreview ? 'Change' : '📷 Photo/Video'}</button>
              <input ref={fileRef} type="file" accept="image/*,video/*" style={{ display: 'none' }}
                onChange={e => { const f = e.target.files[0]; if (!f) return; setCreateMedia(f); const r = new FileReader(); r.onload = () => setCreatePreview(r.result); r.readAsDataURL(f); }} />
              <button className="status-post-btn" onClick={postStatus} disabled={posting || (!createText.trim() && !createMedia)}>{posting ? 'Posting...' : 'Post'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
