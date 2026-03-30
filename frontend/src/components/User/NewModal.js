// frontend/src/components/User/NewModal.js  — COMPLETE
// This is the "+ New" button shown in the sidebar.
// Import and render it in your sidebar/layout component.
//
// Usage:
//   import NewModal from './NewModal';
//   const [showNew, setShowNew] = useState(false);
//   <button onClick={() => setShowNew(true)}>+ New</button>
//   {showNew && <NewModal currentUser={currentUser} onClose={() => setShowNew(false)} onOpenChat={onOpenChat} />}

import React, { useState, useEffect, useRef } from 'react';
import api from '../../services/api';

const BASE = (process.env.REACT_APP_API_URL || '').replace('/api', '');
const avatarFull = (a) => !a ? null : a.startsWith('http') ? a : `${BASE}${a}`;

const CloseIcon  = () => <svg viewBox="0 0 24 24" fill="currentColor" width="22" height="22"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>;
const ChatIcon   = () => <svg viewBox="0 0 24 24" fill="currentColor" width="24" height="24"><path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z"/></svg>;
const GroupIcon  = () => <svg viewBox="0 0 24 24" fill="currentColor" width="24" height="24"><path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"/></svg>;
const StatusIcon = () => <svg viewBox="0 0 24 24" fill="currentColor" width="24" height="24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 14.5v-9l6 4.5-6 4.5z"/></svg>;
const PostIcon   = () => <svg viewBox="0 0 24 24" fill="currentColor" width="24" height="24"><path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/></svg>;
const SearchIcon = () => <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16"><path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/></svg>;
const CheckIcon  = () => <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>;

const ACTIONS = [
  { key: 'chat',   label: 'New Chat',    desc: 'Message someone',          Icon: ChatIcon,   color: '#7c3aed' },
  { key: 'group',  label: 'New Group',   desc: 'Create a group chat',       Icon: GroupIcon,  color: '#2563eb' },
  { key: 'status', label: 'Add Status',  desc: 'Share a 24h update',        Icon: StatusIcon, color: '#16a34a' },
  { key: 'post',   label: 'New Post',    desc: 'Post something to your feed',Icon: PostIcon,   color: '#ea580c' },
];

const BG_COLORS = ['#7c3aed','#2563eb','#16a34a','#dc2626','#ea580c','#0891b2','#be185d','#1e293b'];

export default function NewModal({ currentUser, onClose, onOpenChat }) {
  const [step,        setStep]        = useState('menu');     // menu | chat | group | status | post
  const [users,       setUsers]       = useState([]);
  const [search,      setSearch]      = useState('');
  const [selected,    setSelected]    = useState([]);         // for group: array of user ids
  const [groupName,   setGroupName]   = useState('');
  const [statusText,  setStatusText]  = useState('');
  const [statusBg,    setStatusBg]    = useState('#7c3aed');
  const [statusFile,  setStatusFile]  = useState(null);
  const [statusPrev,  setStatusPrev]  = useState(null);
  const [postText,    setPostText]    = useState('');
  const [postFile,    setPostFile]    = useState(null);
  const [postPrev,    setPostPrev]    = useState(null);
  const [submitting,  setSubmitting]  = useState(false);

  const fileRef      = useRef(null);
  const postFileRef  = useRef(null);

  useEffect(() => {
    if (step === 'chat' || step === 'group') {
      api.get('/users/all').then(r => setUsers((r.data || []).filter(u => u.id !== currentUser?.id))).catch(() => {});
    }
  }, [step, currentUser?.id]);

  const filtered = users.filter(u => {
    const q = search.toLowerCase();
    return !q || u.displayName?.toLowerCase().includes(q) || u.username?.toLowerCase().includes(q);
  });

  // ── New direct chat ──────────────────────────────────────────
  const startChat = (user) => {
    onOpenChat?.(user);
    onClose();
  };

  // ── New group ────────────────────────────────────────────────
  const toggleSelect = (userId) => {
    setSelected(prev => prev.includes(userId) ? prev.filter(id => id !== userId) : [...prev, userId]);
  };

  const createGroup = async () => {
    if (!groupName.trim() || selected.length < 2) return;
    setSubmitting(true);
    try {
      const res = await api.post('/groups', { name: groupName.trim(), members: selected });
      onOpenChat?.({ ...res.data, isGroup: true });
      onClose();
    } catch (err) {
      console.error('createGroup error:', err?.response?.data || err);
      alert('Failed to create group. Make sure /api/groups route exists.');
    } finally {
      setSubmitting(false);
    }
  };

  // ── New status ───────────────────────────────────────────────
  const postStatus = async () => {
    if (submitting) return;
    if (!statusText.trim() && !statusFile) return;
    setSubmitting(true);
    try {
      if (statusFile) {
        const fd = new FormData();
        fd.append('media', statusFile);
        fd.append('type', 'image');
        if (statusText) fd.append('text', statusText);
        await api.post('/status', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      } else {
        await api.post('/status', { text: statusText, type: 'text', bgColor: statusBg });
      }
      onClose();
    } catch (err) {
      console.error('postStatus error:', err?.response?.data || err);
      alert('Failed to post status.');
    } finally {
      setSubmitting(false);
    }
  };

  // ── New post ─────────────────────────────────────────────────
  const createPost = async () => {
    if (submitting) return;
    if (!postText.trim() && !postFile) return;
    setSubmitting(true);
    try {
      if (postFile) {
        const fd = new FormData();
        fd.append('media', postFile);
        fd.append('content', postText);
        await api.post('/feed', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      } else {
        await api.post('/feed', { content: postText });
      }
      onClose();
    } catch (err) {
      console.error('createPost error:', err?.response?.data || err);
      alert('Failed to create post.');
    } finally {
      setSubmitting(false);
    }
  };

  const AvatarOrPlaceholder = ({ user, size = 40 }) => {
    const src = avatarFull(user?.avatar);
    const name = user?.displayName || user?.username || '?';
    return src
      ? <img src={src} alt="" style={{ width: size, height: size, borderRadius: '50%', objectFit: 'cover' }} />
      : <div className="new-modal-avatar-ph" style={{ width: size, height: size }}>{name[0].toUpperCase()}</div>;
  };

  return (
    <div className="new-modal-overlay" onClick={onClose}>
      <div className="new-modal" onClick={e => e.stopPropagation()}>

        {/* ── MENU ── */}
        {step === 'menu' && (
          <>
            <div className="new-modal-header">
              <h3>What would you like to do?</h3>
              <button className="new-modal-close" onClick={onClose}><CloseIcon /></button>
            </div>
            <div className="new-modal-actions">
              {ACTIONS.map(({ key, label, desc, Icon, color }) => (
                <button key={key} className="new-modal-action-btn" onClick={() => setStep(key)}>
                  <span className="new-modal-action-icon" style={{ background: color }}><Icon /></span>
                  <div>
                    <strong>{label}</strong>
                    <span>{desc}</span>
                  </div>
                </button>
              ))}
            </div>
          </>
        )}

        {/* ── NEW CHAT ── */}
        {step === 'chat' && (
          <>
            <div className="new-modal-header">
              <button className="new-modal-back" onClick={() => setStep('menu')}>←</button>
              <h3>New Chat</h3>
              <button className="new-modal-close" onClick={onClose}><CloseIcon /></button>
            </div>
            <div className="new-modal-search">
              <SearchIcon />
              <input autoFocus placeholder="Search people…" value={search} onChange={e => setSearch(e.target.value)} />
            </div>
            <div className="new-modal-list">
              {filtered.length === 0 && <p className="new-modal-empty">No users found</p>}
              {filtered.map(u => (
                <div key={u.id} className="new-modal-user-row" onClick={() => startChat(u)}>
                  <AvatarOrPlaceholder user={u} />
                  <div className="new-modal-user-info">
                    <strong>{u.displayName || u.username}</strong>
                    <span>@{u.username}</span>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* ── NEW GROUP ── */}
        {step === 'group' && (
          <>
            <div className="new-modal-header">
              <button className="new-modal-back" onClick={() => setStep('menu')}>←</button>
              <h3>New Group</h3>
              <button className="new-modal-close" onClick={onClose}><CloseIcon /></button>
            </div>
            <input
              className="new-modal-group-name"
              placeholder="Group name…"
              value={groupName}
              onChange={e => setGroupName(e.target.value)}
              maxLength={50}
            />
            {selected.length > 0 && (
              <div className="new-modal-selected-chips">
                {selected.map(id => {
                  const u = users.find(u => u.id === id);
                  return u ? (
                    <span key={id} className="new-modal-chip">
                      {u.displayName || u.username}
                      <button onClick={() => toggleSelect(id)}>✕</button>
                    </span>
                  ) : null;
                })}
              </div>
            )}
            <div className="new-modal-search">
              <SearchIcon />
              <input placeholder="Add people…" value={search} onChange={e => setSearch(e.target.value)} />
            </div>
            <div className="new-modal-list">
              {filtered.map(u => (
                <div key={u.id} className={`new-modal-user-row ${selected.includes(u.id) ? 'selected' : ''}`}
                  onClick={() => toggleSelect(u.id)}>
                  <AvatarOrPlaceholder user={u} />
                  <div className="new-modal-user-info">
                    <strong>{u.displayName || u.username}</strong>
                    <span>@{u.username}</span>
                  </div>
                  {selected.includes(u.id) && <span className="new-modal-check"><CheckIcon /></span>}
                </div>
              ))}
            </div>
            <button
              className="new-modal-submit-btn"
              disabled={submitting || !groupName.trim() || selected.length < 2}
              onClick={createGroup}
            >
              {submitting ? 'Creating…' : `Create Group (${selected.length} members)`}
            </button>
          </>
        )}

        {/* ── ADD STATUS ── */}
        {step === 'status' && (
          <>
            <div className="new-modal-header">
              <button className="new-modal-back" onClick={() => setStep('menu')}>←</button>
              <h3>Add Status</h3>
              <button className="new-modal-close" onClick={onClose}><CloseIcon /></button>
            </div>
            <div className="new-modal-status-type">
              <button className={!statusFile ? 'active' : ''} onClick={() => { setStatusFile(null); setStatusPrev(null); }}>✏️ Text</button>
              <button className={statusFile ? 'active' : ''} onClick={() => fileRef.current?.click()}>🖼 Image</button>
              <input type="file" ref={fileRef} accept="image/*" style={{ display: 'none' }}
                onChange={e => {
                  const f = e.target.files[0];
                  if (f) { setStatusFile(f); setStatusPrev(URL.createObjectURL(f)); }
                }} />
            </div>
            {statusPrev
              ? <div className="new-modal-status-img-wrap">
                  <img src={statusPrev} alt="" />
                  <button onClick={() => { setStatusFile(null); setStatusPrev(null); }}>✕ Remove</button>
                </div>
              : <div className="new-modal-status-text-preview" style={{ background: statusBg }}>
                  <textarea autoFocus placeholder="What's on your mind?" value={statusText}
                    onChange={e => setStatusText(e.target.value)} maxLength={200} />
                </div>
            }
            {!statusPrev && (
              <div className="new-modal-bg-row">
                {BG_COLORS.map(c => (
                  <button key={c} className={`new-modal-bg-swatch ${statusBg === c ? 'sel' : ''}`}
                    style={{ background: c }} onClick={() => setStatusBg(c)} />
                ))}
              </div>
            )}
            <button className="new-modal-submit-btn"
              disabled={submitting || (!statusText.trim() && !statusFile)}
              onClick={postStatus}>
              {submitting ? 'Posting…' : 'Share Status'}
            </button>
          </>
        )}

        {/* ── NEW POST ── */}
        {step === 'post' && (
          <>
            <div className="new-modal-header">
              <button className="new-modal-back" onClick={() => setStep('menu')}>←</button>
              <h3>New Post</h3>
              <button className="new-modal-close" onClick={onClose}><CloseIcon /></button>
            </div>
            <div className="new-modal-post-compose">
              <div className="new-modal-post-avatar">
                {avatarFull(currentUser?.avatar)
                  ? <img src={avatarFull(currentUser.avatar)} alt="" />
                  : <div className="new-modal-avatar-ph">{(currentUser?.displayName || 'M')[0].toUpperCase()}</div>}
              </div>
              <textarea
                autoFocus
                placeholder={`What's on your mind, ${currentUser?.displayName?.split(' ')[0] || 'there'}?`}
                value={postText}
                onChange={e => setPostText(e.target.value)}
                rows={4}
                maxLength={1000}
              />
            </div>
            {postPrev && (
              <div className="new-modal-post-img-wrap">
                <img src={postPrev} alt="" />
                <button onClick={() => { setPostFile(null); setPostPrev(null); }}>✕ Remove</button>
              </div>
            )}
            <div className="new-modal-post-toolbar">
              <button onClick={() => postFileRef.current?.click()}>🖼 Add Photo</button>
              <input type="file" ref={postFileRef} accept="image/*,video/*" style={{ display: 'none' }}
                onChange={e => {
                  const f = e.target.files[0];
                  if (f) { setPostFile(f); setPostPrev(URL.createObjectURL(f)); }
                }} />
            </div>
            <button className="new-modal-submit-btn"
              disabled={submitting || (!postText.trim() && !postFile)}
              onClick={createPost}>
              {submitting ? 'Posting…' : 'Post'}
            </button>
          </>
        )}

      </div>
    </div>
  );
}
