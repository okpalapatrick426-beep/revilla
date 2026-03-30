// frontend/src/components/User/Status/StatusPage.js  — COMPLETE
import React, { useState, useEffect, useRef, useCallback } from 'react';
import api from '../../../services/api';

const BASE = (process.env.REACT_APP_API_URL || '').replace('/api', '');
const mediaFull = (url) => !url ? '' : url.startsWith('http') ? url : `${BASE}${url}`;
const avatarFull = (a) => !a ? null : a.startsWith('http') ? a : `${BASE}${a}`;

const AddIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" width="22" height="22">
    <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
  </svg>
);
const CloseIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" width="24" height="24">
    <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
  </svg>
);

const BG_COLORS = ['#7c3aed', '#2563eb', '#16a34a', '#dc2626', '#ea580c', '#0891b2', '#be185d', '#1e293b'];

export default function StatusPage({ currentUser }) {
  const [statuses, setStatuses]       = useState([]);   // raw list from API
  const [grouped, setGrouped]         = useState([]);   // grouped by user
  const [viewing, setViewing]         = useState(null); // { stories: [], index, userIndex }
  const [creating, setCreating]       = useState(false);
  const [newType, setNewType]         = useState('text'); // 'text' | 'image'
  const [newText, setNewText]         = useState('');
  const [newBg, setNewBg]             = useState('#7c3aed');
  const [newFile, setNewFile]         = useState(null);
  const [newPreview, setNewPreview]   = useState(null);
  const [posting, setPosting]         = useState(false);
  const fileRef  = useRef(null);
  const timerRef = useRef(null);

  const load = useCallback(async () => {
    try {
      const res = await api.get('/status');
      const list = res.data || [];
      setStatuses(list);

      // Group by userId, current user first
      const map = {};
      list.forEach(s => {
        if (!map[s.userId]) map[s.userId] = { user: s.Author, stories: [] };
        map[s.userId].stories.push(s);
      });
      // Sort: mine first, then by most recent
      const arr = Object.values(map).sort((a, b) => {
        if (a.user.id === currentUser?.id) return -1;
        if (b.user.id === currentUser?.id) return 1;
        return new Date(b.stories[0].createdAt) - new Date(a.stories[0].createdAt);
      });
      setGrouped(arr);
    } catch (err) {
      console.error('load statuses:', err);
    }
  }, [currentUser?.id]);

  useEffect(() => { load(); }, [load]);

  // ── Auto-advance stories ─────────────────────────────────────
  useEffect(() => {
    if (!viewing) { clearTimeout(timerRef.current); return; }
    const story = viewing.stories[viewing.index];
    const delay = story?.type === 'image' ? 5000 : story?.type === 'video' ? 10000 : 4000;
    timerRef.current = setTimeout(() => advanceStory(1), delay);
    return () => clearTimeout(timerRef.current);
  }, [viewing]); // eslint-disable-line

  const advanceStory = (dir) => {
    setViewing(prev => {
      if (!prev) return null;
      const nextIdx = prev.index + dir;
      if (nextIdx >= 0 && nextIdx < prev.stories.length) {
        return { ...prev, index: nextIdx };
      }
      // Move to next user
      const nextUser = prev.userIndex + dir;
      if (nextUser >= 0 && nextUser < grouped.length) {
        return { stories: grouped[nextUser].stories, index: dir > 0 ? 0 : grouped[nextUser].stories.length - 1, userIndex: nextUser };
      }
      return null; // end
    });
  };

  const openStories = (groupIdx) => {
    const g = grouped[groupIdx];
    setViewing({ stories: g.stories, index: 0, userIndex: groupIdx });
    // Mark viewed
    g.stories.forEach(s => api.post(`/status/${s.id}/view`).catch(() => {}));
  };

  const handleFileChange = (e) => {
    const f = e.target.files[0];
    if (!f) return;
    setNewFile(f);
    setNewType('image');
    setNewPreview(URL.createObjectURL(f));
  };

  const submitStatus = async () => {
    if (posting) return;
    if (newType === 'text' && !newText.trim()) return;
    if (newType === 'image' && !newFile) return;
    setPosting(true);
    try {
      if (newType === 'image') {
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
    } catch (err) {
      console.error('post status:', err);
      alert('Failed to post status. Try again.');
    } finally {
      setPosting(false);
    }
  };

  const deleteStatus = async (id) => {
    await api.delete(`/status/${id}`).catch(() => {});
    load();
    setViewing(null);
  };

  const myGroup  = grouped.find(g => g.user?.id === currentUser?.id);
  const hasMyStatus = !!myGroup;

  return (
    <div className="status-page">
      <div className="status-header">
        <h2>Status</h2>
        <button className="status-add-btn" onClick={() => setCreating(true)}><AddIcon /> Add Status</button>
      </div>

      {/* My status row */}
      <div className="status-my-row" onClick={() => hasMyStatus ? openStories(grouped.findIndex(g => g.user?.id === currentUser?.id)) : setCreating(true)}>
        <div className={`status-avatar-ring ${hasMyStatus ? 'has-status' : 'no-status'}`}>
          {avatarFull(currentUser?.avatar)
            ? <img src={avatarFull(currentUser.avatar)} alt="" className="status-avatar" />
            : <div className="status-avatar-placeholder">{(currentUser?.displayName || currentUser?.username || 'M')[0].toUpperCase()}</div>
          }
          <span className="status-add-dot"><AddIcon /></span>
        </div>
        <div className="status-my-info">
          <strong>My Status</strong>
          <span>{hasMyStatus ? `${myGroup.stories.length} update${myGroup.stories.length > 1 ? 's' : ''}` : 'Tap to add status update'}</span>
        </div>
      </div>

      <div className="status-divider">Recent updates</div>

      {/* Others' statuses */}
      <div className="status-list">
        {grouped
          .filter(g => g.user?.id !== currentUser?.id)
          .map((g, i) => {
            const realIdx = grouped.indexOf(g);
            const latest = g.stories[0];
            const viewed = Array.isArray(latest?.views) && latest.views.includes(currentUser?.id);
            return (
              <div key={g.user?.id} className="status-user-row" onClick={() => openStories(realIdx)}>
                <div className={`status-avatar-ring ${viewed ? 'viewed' : 'unviewed'}`}>
                  {avatarFull(g.user?.avatar)
                    ? <img src={avatarFull(g.user.avatar)} alt="" className="status-avatar" />
                    : <div className="status-avatar-placeholder">{(g.user?.displayName || '?')[0].toUpperCase()}</div>
                  }
                </div>
                <div className="status-user-info">
                  <strong>{g.user?.displayName || g.user?.username}</strong>
                  <span>{new Date(latest?.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
              </div>
            );
          })}
        {grouped.filter(g => g.user?.id !== currentUser?.id).length === 0 && (
          <p className="status-empty">No status updates from friends yet.</p>
        )}
      </div>

      {/* ── Story viewer ── */}
      {viewing && (() => {
        const story = viewing.stories[viewing.index];
        const isOwn = story?.userId === currentUser?.id;
        const progress = ((viewing.index + 1) / viewing.stories.length) * 100;
        return (
          <div className="story-viewer-overlay" onClick={() => setViewing(null)}>
            <div className="story-viewer" onClick={e => e.stopPropagation()}>
              {/* Progress bars */}
              <div className="story-progress-bars">
                {viewing.stories.map((_, i) => (
                  <div key={i} className="story-progress-bar">
                    <div className="story-progress-fill"
                      style={{ width: i < viewing.index ? '100%' : i === viewing.index ? `${progress}%` : '0%' }}
                    />
                  </div>
                ))}
              </div>

              {/* Header */}
              <div className="story-header">
                <div className="story-user">
                  {avatarFull(story?.Author?.avatar)
                    ? <img src={avatarFull(story.Author.avatar)} alt="" className="story-avatar" />
                    : <div className="story-avatar-placeholder">{(story?.Author?.displayName || '?')[0].toUpperCase()}</div>
                  }
                  <div>
                    <strong>{story?.Author?.displayName || story?.Author?.username}</strong>
                    <span>{new Date(story?.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                </div>
                <div className="story-header-actions">
                  {isOwn && (
                    <button className="story-delete-btn" onClick={() => deleteStatus(story.id)}>🗑</button>
                  )}
                  <button className="story-close-btn" onClick={() => setViewing(null)}><CloseIcon /></button>
                </div>
              </div>

              {/* Story content */}
              <div className="story-content"
                style={story?.type === 'text' ? { background: story.bgColor } : {}}>
                {story?.type === 'image' && story?.mediaUrl && (
                  <img src={mediaFull(story.mediaUrl)} alt="" className="story-image" />
                )}
                {story?.text && (
                  <p className="story-text" style={story?.type === 'text' ? { color: '#fff' } : {}}>{story.text}</p>
                )}
              </div>

              {/* Tap zones: left = prev, right = next */}
              <div className="story-tap-prev" onClick={() => advanceStory(-1)} />
              <div className="story-tap-next" onClick={() => advanceStory(1)} />

              {/* View count for own stories */}
              {isOwn && (
                <div className="story-views">👁 {Array.isArray(story?.views) ? story.views.length : 0} views</div>
              )}
            </div>
          </div>
        );
      })()}

      {/* ── Create status modal ── */}
      {creating && (
        <div className="status-create-overlay" onClick={() => setCreating(false)}>
          <div className="status-create-modal" onClick={e => e.stopPropagation()}>
            <div className="status-create-header">
              <h3>Add Status</h3>
              <button onClick={() => setCreating(false)}><CloseIcon /></button>
            </div>

            <div className="status-type-tabs">
              <button className={newType === 'text' ? 'active' : ''} onClick={() => setNewType('text')}>✏️ Text</button>
              <button className={newType === 'image' ? 'active' : ''} onClick={() => { setNewType('image'); fileRef.current?.click(); }}>🖼 Image</button>
            </div>

            {newType === 'text' ? (
              <>
                <div className="status-text-preview" style={{ background: newBg }}>
                  <textarea
                    placeholder="What's on your mind?"
                    value={newText}
                    onChange={e => setNewText(e.target.value)}
                    maxLength={200}
                    autoFocus
                  />
                </div>
                <div className="status-bg-picker">
                  {BG_COLORS.map(c => (
                    <button key={c} className={`status-bg-swatch ${newBg === c ? 'selected' : ''}`}
                      style={{ background: c }} onClick={() => setNewBg(c)} />
                  ))}
                </div>
              </>
            ) : (
              <div className="status-image-preview">
                {newPreview
                  ? <img src={newPreview} alt="" />
                  : <button className="status-pick-image" onClick={() => fileRef.current?.click()}>Tap to pick image</button>
                }
                <textarea placeholder="Caption (optional)" value={newText} onChange={e => setNewText(e.target.value)} maxLength={150} />
              </div>
            )}

            <input type="file" ref={fileRef} accept="image/*,video/*" style={{ display: 'none' }} onChange={handleFileChange} />

            <button className="status-submit-btn" onClick={submitStatus} disabled={posting}>
              {posting ? 'Posting…' : 'Share Status'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
