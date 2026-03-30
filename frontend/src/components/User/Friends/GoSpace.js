// frontend/src/components/User/Friends/GoSpace.js — COMPLETE POLISHED v2
import React, { useState, useEffect, useCallback } from 'react';
import api from '../../../services/api';
import { getSocket } from '../../../services/socket';

/* ─── Icons ─────────────────────────────────────────────────── */
const SearchIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" width="17" height="17">
    <path d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/>
  </svg>
);
const MsgIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" width="17" height="17">
    <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z"/>
  </svg>
);
const AddFriendIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" width="17" height="17">
    <path d="M15 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm-9-2V7H4v3H1v2h3v3h2v-3h3v-2H6zm9 4c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
  </svg>
);
const CheckIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
    <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
  </svg>
);
const CloseIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
    <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
  </svg>
);
const FriendIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" width="14" height="14">
    <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
  </svg>
);

const STATUS_COLOR = { inapp: '#25d366', online: '#4fc3f7', offline: '#6b7280' };
const STATUS_LABEL = { inapp: 'In App', online: 'Online', offline: 'Offline' };

const TABS = [
  { key: 'inapp',    icon: '🟢', label: 'In App'   },
  { key: 'online',   icon: '🔵', label: 'Online'   },
  { key: 'offline',  icon: '⚫', label: 'Offline'  },
  { key: 'friends',  icon: '👥', label: 'Friends'  },
  { key: 'requests', icon: '🔔', label: 'Requests' },
];

export default function GoSpace({ currentUser, onOpenChat }) {
  const [tab,       setTab]       = useState('inapp');
  const [allUsers,  setAllUsers]  = useState([]);
  const [requests,  setRequests]  = useState([]);
  const [onlineMap, setOnlineMap] = useState({});
  const [friendMap, setFriendMap] = useState({});
  const [search,    setSearch]    = useState('');
  const [popup,     setPopup]     = useState(null);
  const [loading,   setLoading]   = useState(true);

  const BASE = (process.env.REACT_APP_API_URL || '').replace('/api', '');
  const avatarFull = (u) => {
    if (!u?.avatar) return null;
    return u.avatar.startsWith('http') ? u.avatar : `${BASE}${u.avatar}`;
  };

  /* ── Load ────────────────────────────────────────────────────── */
  const load = useCallback(async () => {
    try {
      const [usersRes, friendsRes] = await Promise.all([
        api.get('/users/all'),
        api.get('/friends').catch(() => ({ data: [] })),
      ]);
      const users = (usersRes.data || []).filter(u => u.id !== currentUser?.id);
      setAllUsers(users);

      const fList = friendsRes.data || [];
      const fMap  = {};
      const reqs  = [];
      fList.forEach(f => {
        if (f.status === 'accepted') {
          const oid = f.requesterId === currentUser?.id ? f.receiverId : f.requesterId;
          fMap[oid] = 'friends';
        } else if (f.status === 'pending') {
          if (f.requesterId === currentUser?.id) fMap[f.receiverId] = 'pending';
          else { fMap[f.requesterId] = 'received'; reqs.push(f); }
        }
      });
      setFriendMap(fMap);
      setRequests(reqs);
    } catch (err) { console.error('GoSpace load:', err); }
    finally { setLoading(false); }
  }, [currentUser?.id]);

  useEffect(() => { load(); const t = setInterval(load, 15000); return () => clearInterval(t); }, [load]);

  /* ── Socket presence ─────────────────────────────────────────── */
  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;
    const onList    = (list) => {
      const m = {};
      list.forEach(u => { m[u.userId] = { inApp: u.inApp, lastSeen: u.lastSeen }; });
      setOnlineMap(m);
    };
    const onOnline  = ({ userId, inApp }) => setOnlineMap(p => ({ ...p, [userId]: { inApp, lastSeen: Date.now() } }));
    const onOffline = ({ userId }) => setOnlineMap(p => { const n = { ...p }; delete n[userId]; return n; });
    socket.on('onlineUsers', onList);
    socket.on('userOnline',  onOnline);
    socket.on('userOffline', onOffline);
    return () => {
      socket.off('onlineUsers', onList);
      socket.off('userOnline',  onOnline);
      socket.off('userOffline', onOffline);
    };
  }, []);

  const getStatus = (uid) => {
    if (!onlineMap[uid]) return 'offline';
    return onlineMap[uid].inApp ? 'inapp' : 'online';
  };

  /* ── Filters ─────────────────────────────────────────────────── */
  const filtered = allUsers.filter(u => {
    const q = search.toLowerCase();
    const matchQ = !q || u.displayName?.toLowerCase().includes(q) || u.username?.toLowerCase().includes(q);
    if (!matchQ) return false;
    const s = getStatus(u.id);
    if (tab === 'inapp')   return s === 'inapp';
    if (tab === 'online')  return s === 'online';
    if (tab === 'offline') return s === 'offline';
    if (tab === 'friends') return friendMap[u.id] === 'friends';
    return false;
  });

  const counts = {
    inapp:    allUsers.filter(u => getStatus(u.id) === 'inapp').length,
    online:   allUsers.filter(u => getStatus(u.id) === 'online').length,
    offline:  allUsers.filter(u => getStatus(u.id) === 'offline').length,
    friends:  allUsers.filter(u => friendMap[u.id] === 'friends').length,
    requests: requests.length,
  };

  /* ── Actions ─────────────────────────────────────────────────── */
  const sendRequest = async (userId) => {
    try {
      await api.post('/friends/request', { receiverId: userId });
      setFriendMap(p => ({ ...p, [userId]: 'pending' }));
    } catch (e) { console.error(e?.response?.data || e); }
  };

  const acceptRequest = async (requesterId) => {
    try {
      await api.post('/friends/accept', { requesterId });
      setFriendMap(p => ({ ...p, [requesterId]: 'friends' }));
      setRequests(p => p.filter(r => r.requesterId !== requesterId));
    } catch (e) { console.error(e?.response?.data || e); }
  };

  const declineRequest = async (requesterId) => {
    try {
      await api.post('/friends/decline', { requesterId });
      setRequests(p => p.filter(r => r.requesterId !== requesterId));
      setFriendMap(p => { const n = { ...p }; delete n[requesterId]; return n; });
    } catch (e) { console.error(e?.response?.data || e); }
  };

  /* ── Avatar helper ───────────────────────────────────────────── */
  const Avatar = ({ user, size = 46 }) => {
    const src  = avatarFull(user);
    const name = user?.displayName || user?.username || '?';
    const s    = getStatus(user?.id);
    return (
      <div className="gs2-avatar-wrap" style={{ width: size, height: size }}>
        {src
          ? <img src={src} alt="" className="gs2-avatar" style={{ width: size, height: size }} />
          : <div className="gs2-avatar-ph" style={{ width: size, height: size, fontSize: size * 0.38 }}>
              {name[0].toUpperCase()}
            </div>
        }
        {user?.id && (
          <span className="gs2-status-dot"
            style={{ background: STATUS_COLOR[s], width: size * 0.26, height: size * 0.26, border: `2px solid #111827` }} />
        )}
      </div>
    );
  };

  return (
    <div className="gs2-root">

      {/* Header */}
      <div className="gs2-header">
        <h2>GoSpace</h2>
        <span className="gs2-subtitle">Everyone on Revilla</span>
      </div>

      {/* Search */}
      <div className="gs2-search-wrap">
        <span className="gs2-search-icon"><SearchIcon /></span>
        <input
          className="gs2-search"
          placeholder="Search people…"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      {/* Tabs */}
      <div className="gs2-tabs">
        {TABS.map(t => (
          <button
            key={t.key}
            className={`gs2-tab ${tab === t.key ? 'gs2-tab-active' : ''}`}
            onClick={() => setTab(t.key)}
          >
            <span className="gs2-tab-icon">{t.icon}</span>
            <span className="gs2-tab-label">{t.label}</span>
            {counts[t.key] > 0 && (
              <span className={`gs2-badge ${tab === t.key ? 'gs2-badge-active' : ''}`}>
                {counts[t.key]}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="gs2-list">
        {loading && (
          <div className="gs2-loading">
            {[1,2,3].map(i => <div key={i} className="gs2-skeleton" />)}
          </div>
        )}

        {/* Requests tab */}
        {tab === 'requests' && !loading && (
          requests.length === 0
            ? <div className="gs2-empty">
                <span className="gs2-empty-icon">🔔</span>
                <p>No pending friend requests</p>
              </div>
            : requests.map(req => {
                const r = req.Requester || {};
                return (
                  <div key={req.id} className="gs2-row">
                    <Avatar user={r} />
                    <div className="gs2-info">
                      <span className="gs2-name">{r.displayName || r.username || 'Unknown'}</span>
                      <span className="gs2-sub">wants to be your friend</span>
                    </div>
                    <div className="gs2-actions">
                      <button className="gs2-btn-accept" onClick={() => acceptRequest(req.requesterId)}>
                        <CheckIcon /> Accept
                      </button>
                      <button className="gs2-btn-decline" onClick={() => declineRequest(req.requesterId)}>
                        <CloseIcon />
                      </button>
                    </div>
                  </div>
                );
              })
        )}

        {/* User tabs */}
        {tab !== 'requests' && !loading && filtered.length === 0 && (
          <div className="gs2-empty">
            <span className="gs2-empty-icon">
              {tab === 'inapp' ? '🟢' : tab === 'online' ? '🔵' : tab === 'friends' ? '👥' : '⚫'}
            </span>
            <p>
              {tab === 'inapp'   ? 'No one is in the app right now'
              : tab === 'online' ? 'No one else is online'
              : tab === 'friends'? 'No friends yet — add someone!'
              : 'No offline users'}
            </p>
          </div>
        )}

        {tab !== 'requests' && filtered.map(user => {
          const status  = getStatus(user.id);
          const fStatus = friendMap[user.id];
          return (
            <div key={user.id} className="gs2-row" onClick={() => setPopup(user)}>
              <Avatar user={user} />
              <div className="gs2-info">
                <span className="gs2-name">{user.displayName || user.username}</span>
                <span className="gs2-sub" style={{ color: STATUS_COLOR[status] }}>
                  ● {STATUS_LABEL[status]}
                  <span style={{ color: 'rgba(255,255,255,0.3)', margin: '0 4px' }}>·</span>
                  <span style={{ color: 'rgba(255,255,255,0.4)' }}>@{user.username}</span>
                </span>
              </div>
              <div className="gs2-actions" onClick={e => e.stopPropagation()}>
                <button className="gs2-btn-msg" title="Message" onClick={() => onOpenChat?.(user)}>
                  <MsgIcon />
                </button>
                {!fStatus && (
                  <button className="gs2-btn-add" title="Add friend" onClick={() => sendRequest(user.id)}>
                    <AddFriendIcon />
                  </button>
                )}
                {fStatus === 'pending'  && <span className="gs2-pill sent">Sent</span>}
                {fStatus === 'friends'  && <span className="gs2-pill friends"><FriendIcon /> Friends</span>}
                {fStatus === 'received' && (
                  <button className="gs2-btn-accept sm" onClick={() => acceptRequest(user.id)}>
                    <CheckIcon />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Profile popup */}
      {popup && (
        <div className="gs2-overlay" onClick={() => setPopup(null)}>
          <div className="gs2-popup" onClick={e => e.stopPropagation()}>
            <div className="gs2-popup-bg" style={{ background: 'linear-gradient(160deg, #7c3aed22 0%, #12122000 60%)' }} />
            <button className="gs2-popup-close" onClick={() => setPopup(null)}><CloseIcon /></button>

            <Avatar user={popup} size={72} />
            <h3 className="gs2-popup-name">{popup.displayName || popup.username}</h3>
            <p className="gs2-popup-username">
              @{popup.username}
              <span className="gs2-popup-status-dot" style={{ background: STATUS_COLOR[getStatus(popup.id)] }} />
              {STATUS_LABEL[getStatus(popup.id)]}
            </p>

            <div className="gs2-popup-btns">
              <button className="gs2-popup-msg-btn"
                onClick={() => { setPopup(null); onOpenChat?.(popup); }}>
                <MsgIcon /> Message
              </button>
              {!friendMap[popup.id] && (
                <button className="gs2-popup-add-btn"
                  onClick={() => { sendRequest(popup.id); setPopup(null); }}>
                  <AddFriendIcon /> Add Friend
                </button>
              )}
              {friendMap[popup.id] === 'friends' && (
                <span className="gs2-pill friends lg">✓ Friends</span>
              )}
              {friendMap[popup.id] === 'pending' && (
                <span className="gs2-pill sent lg">Request Sent</span>
              )}
              {friendMap[popup.id] === 'received' && (
                <button className="gs2-popup-add-btn"
                  onClick={() => { acceptRequest(popup.id); setPopup(null); }}>
                  <CheckIcon /> Accept Request
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
