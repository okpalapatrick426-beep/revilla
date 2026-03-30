// frontend/src/components/User/Status/StatusPage.js — WHATSAPP STYLE COMPLETE
import React, { useState, useEffect, useRef, useCallback } from 'react';
import api from '../../../services/api';

const BASE = (process.env.REACT_APP_API_URL || '').replace('/api', '');
const mFull = (url) => !url ? '' : url.startsWith('http') ? url : `${BASE}${url}`;
const aFull = (a)   => !a   ? null : a.startsWith('http') ? a   : `${BASE}${a}`;

/* ─── Icons ─────────────────────────────────────────────────── */
const CameraIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" width="22" height="22">
    <path d="M12 15.2A3.2 3.2 0 0 1 8.8 12 3.2 3.2 0 0 1 12 8.8 3.2 3.2 0 0 1 15.2 12 3.2 3.2 0 0 1 12 15.2M12 7A5 5 0 0 0 7 12a5 5 0 0 0 5 5 5 5 0 0 0 5-5 5 5 0 0 0-5-5m0-5.5c-.5 0-1 .04-1.5.11V3h3v-1.39A10.94 10.94 0 0 0 12 1.5M4.28 3L3 4.28l1 1C2.8 6.9 2 8.85 2 11a10 10 0 0 0 10 10 10 10 0 0 0 10-10c0-4.1-2.47-7.63-6-9.26V3h-.5c-.81 0-1.61.08-2.38.24L12 2l-1.16 1.16A10 10 0 0 0 5.28 4l-1-1zm7.72 1a8 8 0 0 1 8 8 8 8 0 0 1-8 8 8 8 0 0 1-8-8 8 8 0 0 1 8-8z"/>
  </svg>
);
const PencilIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
    <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04a1 1 0 0 0 0-1.41l-2.34-2.34a1 1 0 0 0-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/>
  </svg>
);
const CloseIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" width="22" height="22">
    <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
  </svg>
);
const ChevronRight = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18">
    <path d="M8.59 16.59L13.17 12 8.59 7.41 10 6l6 6-6 6-1.41-1.41z"/>
  </svg>
);
const EyeIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" width="14" height="14">
    <path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8a3 3 0 0 0-3 3 3 3 0 0 0 3 3 3 3 0 0 0 3-3 3 3 0 0 0-3-3z"/>
  </svg>
);
const TrashIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18">
    <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>
  </svg>
);

const BG_COLORS = [
  '#7c3aed','#2563eb','#0891b2','#16a34a',
  '#ca8a04','#ea580c','#dc2626','#be185d',
  '#1e293b','#064e3b','#1e1b4b','#312e81',
];

export default function StatusPage({ currentUser }) {
  const [statuses,    setStatuses]    = useState([]);
  const [grouped,     setGrouped]     = useState([]);
  const [viewing,     setViewing]     = useState(null);
  const [creating,    setCreating]    = useState(false);
  const [newType,     setNewType]     = useState('text');
  const [newText,     setNewText]     = useState('');
  const [newBg,       setNewBg]       = useState('#7c3aed');
  const [newFile,     setNewFile]     = useState(null);
  const [newPreview,  setNewPreview]  = useState(null);
  const [posting,     setPosting]     = useState(false);
  const [storyPaused, setStoryPaused] = useState(false);
  const fileRef  = useRef(null);
  const timerRef = useRef(null);

  /* ── Load ──────────────────────────────────────────────────── */
  const load = useCallback(async () => {
    try {
      const res  = await api.get('/status');
      const list = res.data || [];
      setStatuses(list);

      const map = {};
      list.forEach(s => {
        if (!map[s.userId]) map[s.userId] = { user: s.Author, stories: [] };
        map[s.userId].stories.push(s);
      });
      const arr = Object.values(map).sort((a, b) => {
        if (a.user?.id === currentUser?.id) return -1;
        if (b.user?.id === currentUser?.id) return 1;
        return new Date(b.stories[0]?.createdAt) - new Date(a.stories[0]?.createdAt);
      });
      setGrouped(arr);
    } catch (e) { console.error('status load:', e); }
  }, [currentUser?.id]);

  useEffect(() => { load(); }, [load]);

  /* ── Auto-advance ──────────────────────────────────────────── */
  useEffect(() => {
    if (!viewing || storyPaused) { clearTimeout(timerRef.current); return; }
    const story = viewing.stories[viewing.index];
    const delay = story?.type === 'image' ? 5000 : story?.type === 'video' ? 10000 : 4000;
    timerRef.current = setTimeout(() => advance(1), delay);
    return () => clearTimeout(timerRef.current);
  }, [viewing, storyPaused]); // eslint-disable-line

  const advance = (dir) => {
    setViewing(prev => {
      if (!prev) return null;
      const ni = prev.index + dir;
      if (ni >= 0 && ni < prev.stories.length) return { ...prev, index: ni };
      const nu = prev.userIndex + dir;
      if (nu >= 0 && nu < grouped.length) {
        grouped[nu].stories.forEach(s => api.post(`/status/${s.id}/view`).catch(() => {}));
        return { stories: grouped[nu].stories, index: dir > 0 ? 0 : grouped[nu].stories.length - 1, userIndex: nu };
      }
      return null;
    });
  };

  const openStories = (gIdx) => {
    const g = grouped[gIdx];
    g.stories.forEach(s => api.post(`/status/${s.id}/view`).catch(() => {}));
    setViewing({ stories: g.stories, index: 0, userIndex: gIdx });
  };

  /* ── Post status ───────────────────────────────────────────── */
  const postStatus = async () => {
    if (posting) return;
    if (newType === 'text' && !newText.trim()) return;
    if (newType === 'image' && !newFile) return;
    setPosting(true);
    try {
      if (newFile) {
        const fd = new FormData();
        fd.append('media', newFile);
        fd.append('type', 'image');
        if (newText) fd.append('text', newText);
        await api.post('/status', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      } else {
        await api.post('/status', { text: newText, type: 'text', bgColor: newBg });
      }
      setCreating(false);
      setNewText(''); setNewFile(null); setNewPreview(null); setNewType('text');
      load();
    } catch (e) {
      console.error('post status:', e);
      alert('Failed to post status. Try again.');
    } finally { setPosting(false); }
  };

  const deleteStatus = async (id) => {
    await api.delete(`/status/${id}`).catch(() => {});
    load();
    setViewing(null);
  };

  const myGroup   = grouped.find(g => g.user?.id === currentUser?.id);
  const others    = grouped.filter(g => g.user?.id !== currentUser?.id);
  const myAvatar  = aFull(currentUser?.avatar);
  const myName    = currentUser?.displayName || currentUser?.username || 'Me';

  return (
    <div className="wa-status-root">

      {/* ── My Status ── */}
      <div className="wa-status-section-label">My status</div>
      <div className="wa-status-my-row" onClick={() => myGroup
        ? openStories(grouped.findIndex(g => g.user?.id === currentUser?.id))
        : setCreating(true)}>
        <div className="wa-status-my-ring">
          <div className={`wa-story-ring ${myGroup ? 'wa-ring-active' : 'wa-ring-none'}`}>
            {myAvatar
              ? <img src={myAvatar} alt="" className="wa-status-avatar" />
              : <div className="wa-status-avatar-ph">{myName[0].toUpperCase()}</div>}
          </div>
          <div className="wa-status-add-btn">+</div>
        </div>
        <div className="wa-status-my-info">
          <span className="wa-status-name">My Status</span>
          <span className="wa-status-sub">
            {myGroup
              ? `${myGroup.stories.length} update${myGroup.stories.length > 1 ? 's' : ''} · Tap to view`
              : 'Tap to add status update'}
          </span>
        </div>
        <div className="wa-status-row-actions">
          <button className="wa-status-cam-btn" onClick={e => { e.stopPropagation(); setCreating(true); }}>
            <CameraIcon />
          </button>
          <button className="wa-status-pen-btn" onClick={e => { e.stopPropagation(); setNewType('text'); setCreating(true); }}>
            <PencilIcon />
          </button>
        </div>
      </div>

      {/* ── Recent Updates ── */}
      {others.length > 0 && (
        <>
          <div className="wa-status-section-label">Recent updates</div>
          {others.map((g, localIdx) => {
            const realIdx = grouped.indexOf(g);
            const latest  = g.stories[0];
            const viewed  = Array.isArray(latest?.views) && latest.views.includes(currentUser?.id);
            const src     = aFull(g.user);
            const name    = g.user?.displayName || g.user?.username || '?';
            const timeStr = new Date(latest?.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            return (
              <div key={g.user?.id} className="wa-status-other-row" onClick={() => openStories(realIdx)}>
                <div className={`wa-story-ring ${viewed ? 'wa-ring-viewed' : 'wa-ring-active'}`}>
                  {src
                    ? <img src={src} alt="" className="wa-status-avatar" />
                    : <div className="wa-status-avatar-ph">{name[0].toUpperCase()}</div>}
                </div>
                <div className="wa-status-my-info">
                  <span className="wa-status-name">{name}</span>
                  <span className="wa-status-sub">{timeStr}</span>
                </div>
                <ChevronRight />
              </div>
            );
          })}
        </>
      )}

      {others.length === 0 && !myGroup && (
        <div className="wa-status-empty">
          <div className="wa-status-empty-icon">📸</div>
          <p>No status updates from friends yet</p>
          <span>Add yours to get started</span>
        </div>
      )}

      {/* ── Story Viewer ── */}
      {viewing && (() => {
        const story  = viewing.stories[viewing.index];
        const author = story?.Author || {};
        const isOwn  = story?.userId === currentUser?.id;
        const src    = aFull(author);
        const name   = author.displayName || author.username || 'User';
        const views  = Array.isArray(story?.views) ? story.views.length : 0;

        return (
          <div className="wa-viewer-overlay">
            <div className="wa-viewer"
              onMouseDown={() => setStoryPaused(true)}
              onMouseUp={() => setStoryPaused(false)}
              onTouchStart={() => setStoryPaused(true)}
              onTouchEnd={() => setStoryPaused(false)}>

              {/* Progress bars */}
              <div className="wa-viewer-bars">
                {viewing.stories.map((_, i) => (
                  <div key={i} className="wa-viewer-bar-bg">
                    <div className={`wa-viewer-bar-fill ${i < viewing.index ? 'done' : i === viewing.index ? 'active' : ''}`}
                      style={i === viewing.index && !storyPaused ? { animationDuration: story?.type === 'image' ? '5s' : '4s' } : {}} />
                  </div>
                ))}
              </div>

              {/* Header */}
              <div className="wa-viewer-header">
                <div className="wa-viewer-user">
                  {src
                    ? <img src={src} alt="" className="wa-viewer-avatar" />
                    : <div className="wa-viewer-avatar-ph">{name[0].toUpperCase()}</div>}
                  <div>
                    <div className="wa-viewer-name">{name}</div>
                    <div className="wa-viewer-time">
                      {new Date(story?.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                </div>
                <div className="wa-viewer-hdr-actions">
                  {isOwn && (
                    <button className="wa-viewer-btn" onClick={() => deleteStatus(story.id)}>
                      <TrashIcon />
                    </button>
                  )}
                  <button className="wa-viewer-btn" onClick={() => setViewing(null)}>
                    <CloseIcon />
                  </button>
                </div>
              </div>

              {/* Content */}
              <div className="wa-viewer-content"
                style={story?.type === 'text' ? { background: story.bgColor || '#7c3aed' } : {}}>
                {story?.type === 'image' && story?.mediaUrl && (
                  <img src={mFull(story.mediaUrl)} alt="" className="wa-viewer-image" />
                )}
                {story?.text && (
                  <div className="wa-viewer-text"
                    style={story?.type === 'text' ? { color: '#fff', fontSize: '1.6rem', fontWeight: 600 } : {}}>
                    {story.text}
                  </div>
                )}
              </div>

              {/* Tap zones */}
              <div className="wa-viewer-tap-left"  onClick={() => advance(-1)} />
              <div className="wa-viewer-tap-right" onClick={() => advance(1)}  />

              {/* Footer */}
              {isOwn && (
                <div className="wa-viewer-footer">
                  <EyeIcon /> <span>{views} view{views !== 1 ? 's' : ''}</span>
                </div>
              )}
            </div>
          </div>
        );
      })()}

      {/* ── Create Status Sheet ── */}
      {creating && (
        <div className="wa-create-overlay" onClick={() => setCreating(false)}>
          <div className="wa-create-sheet" onClick={e => e.stopPropagation()}>
            <div className="wa-create-handle" />

            <div className="wa-create-header">
              <h3>Add to Status</h3>
              <button className="wa-create-close" onClick={() => setCreating(false)}><CloseIcon /></button>
            </div>

            {/* Type selector */}
            <div className="wa-create-types">
              <button className={`wa-create-type-btn ${newType === 'text' ? 'active' : ''}`}
                onClick={() => setNewType('text')}>
                <PencilIcon /> Text
              </button>
              <button className={`wa-create-type-btn ${newType === 'image' ? 'active' : ''}`}
                onClick={() => { setNewType('image'); fileRef.current?.click(); }}>
                <CameraIcon /> Photo
              </button>
              <input type="file" ref={fileRef} accept="image/*" style={{ display: 'none' }}
                onChange={e => {
                  const f = e.target.files[0];
                  if (f) { setNewFile(f); setNewPreview(URL.createObjectURL(f)); }
                }} />
            </div>

            {/* Preview */}
            {newType === 'text' ? (
              <div className="wa-create-text-preview" style={{ background: newBg }}>
                <textarea
                  autoFocus
                  placeholder="Type a status…"
                  value={newText}
                  onChange={e => setNewText(e.target.value)}
                  maxLength={700}
                />
                <div className="wa-create-charcount">{newText.length}/700</div>
              </div>
            ) : newPreview ? (
              <div className="wa-create-img-preview">
                <img src={newPreview} alt="" />
                <button className="wa-create-img-remove" onClick={() => { setNewFile(null); setNewPreview(null); }}>
                  ✕
                </button>
                <input className="wa-create-caption" placeholder="Add a caption…"
                  value={newText} onChange={e => setNewText(e.target.value)} maxLength={200} />
              </div>
            ) : (
              <button className="wa-create-pick-img" onClick={() => fileRef.current?.click()}>
                <CameraIcon /> Tap to pick a photo
              </button>
            )}

            {/* Background colors (text only) */}
            {newType === 'text' && (
              <div className="wa-create-colors">
                {BG_COLORS.map(c => (
                  <button key={c} className={`wa-create-color ${newBg === c ? 'sel' : ''}`}
                    style={{ background: c }} onClick={() => setNewBg(c)} />
                ))}
              </div>
            )}

            <button className="wa-create-submit"
              disabled={posting || (newType === 'text' ? !newText.trim() : !newFile)}
              onClick={postStatus}>
              {posting ? 'Sharing…' : 'Share to Status'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
