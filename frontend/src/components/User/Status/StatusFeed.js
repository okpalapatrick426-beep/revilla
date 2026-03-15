import React, { useState, useEffect, useRef, useCallback } from 'react';
import api from '../../../services/api';

const BASE = process.env.REACT_APP_API_URL?.replace('/api', '') || '';

// Icons
const AddIcon = () => <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18"><path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/></svg>;
const CloseIcon = () => <svg viewBox="0 0 24 24" fill="currentColor" width="22" height="22"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>;
const PlayIcon = () => <svg viewBox="0 0 24 24" fill="currentColor" width="32" height="32"><path d="M8 5v14l11-7z"/></svg>;
const PauseIcon = () => <svg viewBox="0 0 24 24" fill="currentColor" width="32" height="32"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>;
const EyeIcon = () => <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16"><path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"/></svg>;
const GridIcon = () => <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18"><path d="M4 4h4v4H4zm6 0h4v4h-4zm6 0h4v4h-4zM4 10h4v4H4zm6 0h4v4h-4zm6 0h4v4h-4zM4 16h4v4H4zm6 0h4v4h-4zm6 0h4v4h-4z"/></svg>;
const ListIcon = () => <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18"><path d="M3 13h2v-2H3v2zm0 4h2v-2H3v2zm0-8h2V7H3v2zm4 4h14v-2H7v2zm0 4h14v-2H7v2zM7 7v2h14V7H7z"/></svg>;
const ForwardIcon = () => <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18"><path d="M18 9.5L13 5v3H5v3h8v3l5-4.5zm-1 8H5v2h12v-2z"/></svg>;
const SaveIcon = () => <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18"><path d="M17 3H5c-1.11 0-2 .9-2 2v14c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V7l-4-4zm-5 16c-1.66 0-3-1.34-3-3s1.34-3 3-3 3 1.34 3 3-1.34 3-3 3zm3-10H5V5h10v4z"/></svg>;
const ReelIcon = () => <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18"><rect x="2" y="2" width="20" height="20" rx="2"/><path d="M10 8l6 4-6 4V8z" fill="#fff"/></svg>;
const SlowIcon = () => <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18"><path d="M9 16.2L4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4L9 16.2z"/></svg>;

const BG_COLORS = ['#0d1117','#1a1a2e','#7c3aed','#0f3460','#16213e','#dc2626','#059669','#d97706','#1d4ed8','#7c2d12'];
const STATUS_DURATION = 5000; // 5s per text status

export default function StatusFeed({ currentUser, onOpenChat }) {
  const [statuses, setStatuses] = useState([]); // grouped by user
  const [myStatuses, setMyStatuses] = useState([]);
  const [viewing, setViewing] = useState(null); // { statuses, user, isMine }
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
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [gridMode, setGridMode] = useState(false);
  const [scrubbing, setScrubbing] = useState(false);

  const videoRef = useRef(null);
  const progressInterval = useRef(null);
  const progressStart = useRef(null);
  const fileRef = useRef(null);

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
    } catch (err) { console.error(err); }
  };

  useEffect(() => { load(); const t = setInterval(load, 15000); return () => clearInterval(t); }, []);

  // Auto-advance progress
  useEffect(() => {
    if (!viewing || paused || scrubbing) { clearInterval(progressInterval.current); return; }
    const cur = viewing.statuses[viewIdx];
    if (!cur) return;
    const isVideo = cur.type === 'video';
    if (isVideo && videoRef.current) return; // video handles its own progress

    setProgress(0);
    progressStart.current = Date.now();
    clearInterval(progressInterval.current);
    progressInterval.current = setInterval(() => {
      const elapsed = (Date.now() - progressStart.current) * playbackSpeed;
      const pct = Math.min((elapsed / STATUS_DURATION) * 100, 100);
      setProgress(pct);
      if (pct >= 100) advance();
    }, 50);
    return () => clearInterval(progressInterval.current);
  }, [viewing, viewIdx, paused, playbackSpeed, scrubbing]);

  const advance = useCallback(() => {
    if (!viewing) return;
    const next = viewIdx + 1;
    if (next < viewing.statuses.length) { setViewIdx(next); setProgress(0); }
    else { setViewing(null); }
  }, [viewing, viewIdx]);

  const goBack = useCallback(() => {
    if (viewIdx > 0) { setViewIdx(viewIdx - 1); setProgress(0); }
  }, [viewIdx]);

  const openViewer = async (group) => {
    setViewing({ ...group, isMine: false });
    setViewIdx(0);
    setProgress(0);
    setPaused(false);
    try { await api.post(`/status/${group.statuses[0].id}/view`); } catch {}
  };

  const openMine = () => {
    if (!myStatuses.length) { setCreating(true); return; }
    setViewing({ statuses: myStatuses, user: currentUser, isMine: true });
    setViewIdx(0); setProgress(0); setPaused(false);
  };

  // Mark view when status changes
  useEffect(() => {
    if (!viewing || viewing.isMine) return;
    const cur = viewing.statuses[viewIdx];
    if (cur) api.post(`/status/${cur.id}/view`).catch(() => {});
  }, [viewIdx]);

  const handleScrub = (e) => {
    const bar = e.currentTarget;
    const rect = bar.getBoundingClientRect();
    const x = (e.touches?.[0]?.clientX || e.clientX) - rect.left;
    const pct = Math.max(0, Math.min(100, (x / rect.width) * 100));
    setProgress(pct);
    progressStart.current = Date.now() - (pct / 100) * STATUS_DURATION;
    if (videoRef.current) {
      const dur = videoRef.current.duration;
      if (dur) videoRef.current.currentTime = (pct / 100) * dur;
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
      } else {
        fd.append('type', 'text');
      }
      await api.post('/status', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      setCreating(false); setCreateText(''); setCreateMedia(null); setCreatePreview(null); setCreateMood('');
      await load();
    } catch (err) { console.error(err); }
    finally { setPosting(false); }
  };

  const postToReels = async (status) => {
    try {
      const fd = new FormData();
      fd.append('content', status.content || '');
      fd.append('backgroundColor', status.backgroundColor || '#0d1117');
      if (status.mediaUrl) fd.append('mediaUrl', status.mediaUrl);
      fd.append('type', status.type || 'text');
      await api.post('/posts', fd);
      alert('Posted to Reels!');
    } catch { alert('Failed to post to reels'); }
  };

  const saveStatus = (status) => {
    const url = status.mediaUrl?.startsWith('http') ? status.mediaUrl : `${BASE}${status.mediaUrl}`;
    const a = document.createElement('a');
    a.href = url; a.download = 'status'; a.target = '_blank';
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
  };

  const avatarSrc = (u) => u?.avatar ? (u.avatar.startsWith('http') ? u.avatar : `${BASE}${u.avatar}`) : null;

  const hasUnviewed = (group) => group.statuses.some(s => {
    try { return !JSON.parse(s.viewers || '[]').includes(currentUser?.id); } catch { return true; }
  });

  const currentStatus = viewing?.statuses[viewIdx];
  const isVideo = currentStatus?.type === 'video';

  return (
    <div className="status-feed">
      {/* Stories row */}
      <div className="stories-row">
        {/* My status */}
        <div className="story-item" onClick={openMine}>
          <div className={`story-ring ${myStatuses.length > 0 ? 'has-status' : 'no-status'}`}>
            <div className="story-avatar">
              {avatarSrc(currentUser)
                ? <img src={avatarSrc(currentUser)} alt="" />
                : <div className="story-avatar-placeholder">{(currentUser?.displayName || 'Y')[0].toUpperCase()}</div>}
              <div className="story-add-badge"><AddIcon /></div>
            </div>
          </div>
          <span className="story-name">My Status</span>
        </div>

        {/* Others */}
        {statuses.map(group => (
          <div key={group.user.id} className="story-item" onClick={() => openViewer(group)}>
            <div className={`story-ring ${hasUnviewed(group) ? 'unviewed' : 'viewed'}`}>
              <div className="story-avatar">
                {avatarSrc(group.user)
                  ? <img src={avatarSrc(group.user)} alt="" />
                  : <div className="story-avatar-placeholder">{(group.user.displayName || '?')[0].toUpperCase()}</div>}
              </div>
            </div>
            <span className="story-name">{group.user.displayName || group.user.username}</span>
          </div>
        ))}
      </div>

      {/* Recent updates list — with grid toggle */}
      <div className="status-list-section">
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
                  : <p className="status-grid-text">{s.content}</p>
                }
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
              {hasUnviewed(group) && <span className="status-unread-dot" />}
            </div>
          ))
        )}
      </div>

      {/* ── FULLSCREEN VIEWER ── */}
      {viewing && currentStatus && (
        <div className="status-viewer" style={{ background: isVideo ? '#000' : (currentStatus.mediaUrl ? '#000' : currentStatus.backgroundColor) }}
          onClick={() => setPaused(p => !p)}>

          {/* Progress bars */}
          <div className="status-progress-bars" onClick={e => e.stopPropagation()}>
            {viewing.statuses.map((_, i) => (
              <div key={i} className="status-progress-bg"
                onMouseDown={(e) => { setScrubbing(true); handleScrub(e); }}
                onMouseMove={(e) => { if (scrubbing && i === viewIdx) handleScrub(e); }}
                onMouseUp={() => setScrubbing(false)}
                onTouchStart={(e) => { setScrubbing(true); handleScrub(e); }}
                onTouchMove={(e) => { if (i === viewIdx) handleScrub(e); }}
                onTouchEnd={() => setScrubbing(false)}
              >
                <div className="status-progress-fill" style={{
                  width: i < viewIdx ? '100%' : i === viewIdx ? `${progress}%` : '0%',
                  transition: scrubbing ? 'none' : undefined
                }} />
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
            <div className="status-header-actions">
              {isVideo && (
                <button className="sv-action-btn" onClick={() => setPlaybackSpeed(s => s === 1 ? 0.5 : 1)} title="Speed">
                  <SlowIcon /> {playbackSpeed === 0.5 ? '0.5x' : '1x'}
                </button>
              )}
              <button className="icon-btn" onClick={() => setViewing(null)}><CloseIcon /></button>
            </div>
          </div>

          {/* Tap zones */}
          <div className="status-tap-prev" onClick={(e) => { e.stopPropagation(); goBack(); }} />
          <div className="status-tap-next" onClick={(e) => { e.stopPropagation(); advance(); }} />

          {/* Content */}
          <div className="status-viewer-content">
            {currentStatus.mediaUrl
              ? currentStatus.type === 'video'
                ? <video
                    ref={videoRef}
                    src={currentStatus.mediaUrl.startsWith('http') ? currentStatus.mediaUrl : `${BASE}${currentStatus.mediaUrl}`}
                    className="status-img"
                    autoPlay
                    playsInline
                    loop={false}
                    playbackRate={playbackSpeed}
                    style={{ maxHeight: '70vh', width: '100%', objectFit: 'contain' }}
                    onTimeUpdate={(e) => {
                      const pct = (e.target.currentTime / e.target.duration) * 100;
                      setProgress(pct);
                    }}
                    onEnded={advance}
                    onClick={e => { e.stopPropagation(); if (paused) e.target.play(); else e.target.pause(); setPaused(p => !p); }}
                  />
                : <img src={currentStatus.mediaUrl.startsWith('http') ? currentStatus.mediaUrl : `${BASE}${currentStatus.mediaUrl}`} alt="" className="status-img" />
              : <p className="status-text-content">{currentStatus.content}</p>
            }
            {currentStatus.mood && <div className="status-mood">Mood: {currentStatus.mood}</div>}
            {paused && (
              <div className="status-pause-overlay">
                <PlayIcon />
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="status-viewer-footer" onClick={e => e.stopPropagation()}>
            <div className="status-views">
              <EyeIcon />
              <span>{currentStatus.viewCount || 0} view{(currentStatus.viewCount || 0) !== 1 ? 's' : ''}</span>
            </div>
            <div className="status-footer-actions">
              {viewing.isMine ? (
                <button className="sv-footer-btn danger" onClick={() => api.delete(`/status/${currentStatus.id}`).then(() => { load(); setViewing(null); })}>
                  Delete
                </button>
              ) : (
                <>
                  <button className="sv-footer-btn" onClick={() => { setViewing(null); onOpenChat && onOpenChat(viewing.user); }}>Reply</button>
                  <button className="sv-footer-btn" onClick={() => saveStatus(currentStatus)}><SaveIcon /></button>
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

            {/* Preview */}
            <div className="status-create-preview">
              {createPreview
                ? createMedia?.type.startsWith('video')
                  ? <video src={createPreview} className="create-preview-media" controls />
                  : <img src={createPreview} alt="" className="create-preview-media" />
                : <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.9rem' }}>{createText || 'Preview your status...'}</p>
              }
            </div>

            <textarea
              className="status-text-input"
              placeholder="What's on your mind?"
              value={createText}
              onChange={e => setCreateText(e.target.value)}
              rows={2}
            />

            <input
              className="status-text-input"
              placeholder="🎭 Mood for today... (optional)"
              value={createMood}
              onChange={e => setCreateMood(e.target.value)}
              style={{ marginTop: 8 }}
            />

            {!createPreview && (
              <div className="status-bg-picker">
                {BG_COLORS.map(c => (
                  <button key={c} className={`bg-swatch ${createBg === c ? 'selected' : ''}`} style={{ background: c }} onClick={() => setCreateBg(c)} />
                ))}
              </div>
            )}

            <div className="status-create-actions">
              <button className="status-media-btn" onClick={() => fileRef.current?.click()}>
                {createPreview ? 'Change media' : '📷 Photo / Video'}
              </button>
              <input ref={fileRef} type="file" accept="image/*,video/*" style={{ display: 'none' }}
                onChange={e => {
                  const f = e.target.files[0];
                  if (!f) return;
                  setCreateMedia(f);
                  const r = new FileReader();
                  r.onload = () => setCreatePreview(r.result);
                  r.readAsDataURL(f);
                }}
              />
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
