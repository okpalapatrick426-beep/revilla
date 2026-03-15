import React, { useState, useEffect, useCallback } from 'react';
import api from '../../../services/api';
import { getSocket } from '../../../services/socket';

const MsgIcon = () => <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16"><path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z"/></svg>;
const AddIcon = () => <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16"><path d="M15 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm-9-2V7H4v3H1v2h3v3h2v-3h3v-2H6zm9 4c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg>;
const CheckIcon = () => <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>;

const TABS = [
  { key: 'inapp', label: '🟢 In App' },
  { key: 'online', label: '🔵 Online' },
  { key: 'offline', label: '⚫ Offline' },
  { key: 'friends', label: '👥 Friends' },
  { key: 'requests', label: '🔔 Requests' },
];

export default function GoSpace({ currentUser, onOpenChat }) {
  const [tab, setTab] = useState('inapp');
  const [allUsers, setAllUsers] = useState([]);
  const [friends, setFriends] = useState([]);
  const [requests, setRequests] = useState([]);
  const [onlineMap, setOnlineMap] = useState({}); // userId -> { inApp, lastSeen }
  const [friendMap, setFriendMap] = useState({}); // userId -> 'friends'|'pending'|'received'
  const [search, setSearch] = useState('');
  const [popup, setPopup] = useState(null);
  const [loading, setLoading] = useState(true);

  const BASE = process.env.REACT_APP_API_URL?.replace('/api', '') || '';

  const load = useCallback(async () => {
    try {
      const [usersRes, friendsRes] = await Promise.all([
        api.get('/users/all'),
        api.get('/friends').catch(() => ({ data: [] })),
      ]);
      setAllUsers(usersRes.data || []);

      const fList = friendsRes.data || [];
      const fMap = {};
      const friendsList = [];
      const reqList = [];
      fList.forEach(f => {
        if (f.status === 'accepted') {
          const otherId = f.requesterId === currentUser?.id ? f.receiverId : f.requesterId;
          fMap[otherId] = 'friends';
          friendsList.push({ ...f, otherId });
        } else if (f.status === 'pending') {
          if (f.requesterId === currentUser?.id) fMap[f.receiverId] = 'pending';
          else { fMap[f.requesterId] = 'received'; reqList.push(f); }
        }
      });
      setFriendMap(fMap);
      setFriends(friendsList);
      setRequests(reqList);
    } catch (err) {
      console.error('GoSpace load error:', err);
    } finally { setLoading(false); }
  }, [currentUser?.id]);

  useEffect(() => { load(); const t = setInterval(load, 10000); return () => clearInterval(t); }, [load]);

  // Real-time online status via socket
  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    // Get initial online list
    socket.on('onlineUsers', (list) => {
      const map = {};
      list.forEach(u => { map[u.userId] = { inApp: u.inApp, lastSeen: u.lastSeen }; });
      setOnlineMap(map);
    });

    socket.on('userOnline', ({ userId, inApp }) => {
      setOnlineMap(prev => ({ ...prev, [userId]: { inApp, lastSeen: Date.now() } }));
    });

    socket.on('userOffline', ({ userId, lastSeen }) => {
      setOnlineMap(prev => {
        const next = { ...prev };
        delete next[userId];
        return next;
      });
    });

    return () => {
      socket.off('onlineUsers');
      socket.off('userOnline');
      socket.off('userOffline');
    };
  }, []);

  const getStatus = (userId) => {
    if (!onlineMap[userId]) return 'offline';
    if (onlineMap[userId].inApp) return 'inapp';
    return 'online';
  };

  const filtered = allUsers.filter(u => {
    const q = search.toLowerCase();
    const matchSearch = !q || u.displayName?.toLowerCase().includes(q) || u.username?.toLowerCase().includes(q);
    if (!matchSearch) return false;
    const status = getStatus(u.id);
    if (tab === 'inapp') return status === 'inapp';
    if (tab === 'online') return status === 'online';
    if (tab === 'offline') return status === 'offline';
    if (tab === 'friends') return friendMap[u.id] === 'friends';
    return false;
  });

  const sendRequest = async (userId) => {
    try {
      await api.post('/friends/request', { receiverId: userId });
      setFriendMap(prev => ({ ...prev, [userId]: 'pending' }));
    } catch (err) { console.error(err); }
  };

  const acceptRequest = async (requesterId) => {
    try {
      await api.post('/friends/accept', { requesterId });
      setFriendMap(prev => ({ ...prev, [requesterId]: 'friends' }));
      setRequests(prev => prev.filter(r => r.requesterId !== requesterId));
      await load();
    } catch (err) { console.error(err); }
  };

  const avatarSrc = (u) => u.avatar ? (u.avatar.startsWith('http') ? u.avatar : `${BASE}${u.avatar}`) : null;

  const statusColor = { inapp: '#22c55e', online: '#3b82f6', offline: '#6b7280' };
  const statusLabel = { inapp: 'In App', online: 'Online', offline: 'Offline' };

  const counts = {
    inapp: allUsers.filter(u => getStatus(u.id) === 'inapp').length,
    online: allUsers.filter(u => getStatus(u.id) === 'online').length,
    offline: allUsers.filter(u => getStatus(u.id) === 'offline').length,
    friends: allUsers.filter(u => friendMap[u.id] === 'friends').length,
    requests: requests.length,
  };

  return (
    <div className="gospace">
      <div className="gospace-header">
        <h2>GoSpace</h2>
        <p>Everyone on Revilla — tap anyone to chat</p>
      </div>

      <div className="gospace-search">
        <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16" style={{ opacity: 0.4 }}><path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/></svg>
        <input placeholder="Search anyone on Revilla..." value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      {/* Tabs */}
      <div className="gospace-tabs">
        {TABS.map(t => (
          <button key={t.key} className={`gs-tab ${tab === t.key ? 'active' : ''}`} onClick={() => setTab(t.key)}>
            {t.label} {counts[t.key] > 0 && <span className="gs-count">{counts[t.key]}</span>}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="gospace-list">
        {loading && <p className="gs-empty">Loading...</p>}

        {/* Requests tab */}
        {tab === 'requests' && (
          requests.length === 0
            ? <p className="gs-empty">No pending requests</p>
            : requests.map(req => (
              <div key={req.id} className="gs-user-row">
                <div className="gs-avatar-wrap">
                  {avatarSrc(req.Requester || {})
                    ? <img src={avatarSrc(req.Requester)} alt="" className="gs-avatar" />
                    : <div className="gs-avatar-placeholder">{(req.Requester?.displayName || '?')[0].toUpperCase()}</div>
                  }
                </div>
                <div className="gs-info">
                  <strong>{req.Requester?.displayName || req.Requester?.username || 'Unknown'}</strong>
                  <span>wants to be your friend</span>
                </div>
                <button className="gs-accept-btn" onClick={() => acceptRequest(req.requesterId)}><CheckIcon /> Accept</button>
              </div>
            ))
        )}

        {/* Users list */}
        {tab !== 'requests' && !loading && filtered.length === 0 && (
          <p className="gs-empty">
            {tab === 'inapp' ? 'No one is in the app right now'
              : tab === 'online' ? 'No one is online'
              : tab === 'friends' ? 'No friends yet — add people from other tabs!'
              : 'No offline users found'}
          </p>
        )}

        {tab !== 'requests' && filtered.map(user => {
          const status = getStatus(user.id);
          const fStatus = friendMap[user.id];

          return (
            <div key={user.id} className="gs-user-row" onClick={() => setPopup(user)}>
              <div className="gs-avatar-wrap">
                {avatarSrc(user)
                  ? <img src={avatarSrc(user)} alt="" className="gs-avatar" />
                  : <div className="gs-avatar-placeholder">{(user.displayName || user.username || '?')[0].toUpperCase()}</div>
                }
                <span className="gs-status-dot" style={{ background: statusColor[status] }} />
              </div>
              <div className="gs-info">
                <strong>{user.displayName || user.username}</strong>
                <span style={{ color: statusColor[status] }}>
                  {statusLabel[status]} · @{user.username}
                </span>
              </div>
              <div className="gs-actions">
                <button className="gs-msg-btn" onClick={(e) => { e.stopPropagation(); onOpenChat && onOpenChat(user); }}>
                  <MsgIcon />
                </button>
                {!fStatus && (
                  <button className="gs-add-btn" onClick={(e) => { e.stopPropagation(); sendRequest(user.id); }}>
                    <AddIcon />
                  </button>
                )}
                {fStatus === 'pending' && <span className="gs-badge pending">Sent</span>}
                {fStatus === 'friends' && <span className="gs-badge friends">Friends</span>}
                {fStatus === 'received' && <button className="gs-accept-btn sm" onClick={(e) => { e.stopPropagation(); acceptRequest(user.id); }}><CheckIcon /></button>}
              </div>
            </div>
          );
        })}
      </div>

      {/* Popup */}
      {popup && (
        <div className="gs-popup-overlay" onClick={() => setPopup(null)}>
          <div className="gs-popup" onClick={e => e.stopPropagation()}>
            <div className="gs-popup-avatar">
              {avatarSrc(popup)
                ? <img src={avatarSrc(popup)} alt="" />
                : <div className="gs-popup-placeholder">{(popup.displayName || '?')[0].toUpperCase()}</div>
              }
              <span className="gs-status-dot lg" style={{ background: statusColor[getStatus(popup.id)] }} />
            </div>
            <h3>{popup.displayName || popup.username}</h3>
            <p>@{popup.username} · {statusLabel[getStatus(popup.id)]}</p>
            <div className="gs-popup-actions">
              <button className="gs-popup-msg" onClick={() => { setPopup(null); onOpenChat && onOpenChat(popup); }}>
                <MsgIcon /> Message
              </button>
              {!friendMap[popup.id] && (
                <button className="gs-popup-add" onClick={() => { sendRequest(popup.id); setPopup(null); }}>
                  <AddIcon /> Add Friend
                </button>
              )}
              {friendMap[popup.id] === 'friends' && <span className="gs-badge friends lg">✓ Friends</span>}
              {friendMap[popup.id] === 'pending' && <span className="gs-badge pending lg">Request Sent</span>}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
