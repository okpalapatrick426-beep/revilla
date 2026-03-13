import { useState, useEffect, useCallback } from 'react';
import { useSocket } from '../../../context/SocketContext';
import { useAuth } from '../../../context/AuthContext';
import { getFriends, getFriendRequests, sendFriendRequest, acceptFriendRequest, removeFriend, getAllPlatformUsers } from '../../../services/api';
import toast from 'react-hot-toast';

export default function GoSpace({ onStartChat }) {
  const { socket } = useSocket();
  const { user: me } = useAuth();
  const [allUsers, setAllUsers] = useState([]);
  const [friends, setFriends] = useState([]);
  const [requests, setRequests] = useState([]);
  const [onlineInApp, setOnlineInApp] = useState(new Set());
  const [tab, setTab] = useState('active');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    try {
      const [usersRes, friendsRes, reqRes] = await Promise.all([
        getAllPlatformUsers(),
        getFriends(),
        getFriendRequests(),
      ]);
      setAllUsers(usersRes.data || []);
      setFriends(friendsRes.data || []);
      setRequests(reqRes.data || []);
      // Seed onlineInApp from DB isOnline field
      const onlineSet = new Set((usersRes.data || []).filter(u => u.isOnline).map(u => u.id));
      setOnlineInApp(onlineSet);
    } catch { toast.error('Failed to load users'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  // Live socket tracking
  useEffect(() => {
    if (!socket) return;
    const onOnline = ({ userId }) => setOnlineInApp(prev => new Set([...prev, userId]));
    const onOffline = ({ userId }) => setOnlineInApp(prev => { const s = new Set(prev); s.delete(userId); return s; });
    socket.on('user_online', onOnline);
    socket.on('user_offline', onOffline);
    return () => { socket.off('user_online', onOnline); socket.off('user_offline', onOffline); };
  }, [socket]);

  const isFriend = (userId) => friends.some(f => f.id === userId);
  const hasPending = (userId) => requests.some(r => r.id === userId);

  const handleAdd = async (userId, e) => {
    e?.stopPropagation();
    try {
      await sendFriendRequest(userId);
      toast.success('Friend request sent!');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Could not send request');
    }
  };

  const handleAccept = async (userId) => {
    try { await acceptFriendRequest(userId); toast.success('Friend added!'); loadData(); }
    catch { toast.error('Failed to accept'); }
  };

  const handleMessage = (u) => {
    if (onStartChat) onStartChat({ ...u, isOnline: onlineInApp.has(u.id) });
  };

  const filterUsers = (list) => {
    if (!search.trim()) return list;
    const q = search.toLowerCase();
    return list.filter(u =>
      (u.displayName || '').toLowerCase().includes(q) ||
      (u.username || '').toLowerCase().includes(q)
    );
  };

  // Categorise: exclude self
  const others = allUsers.filter(u => u.id !== me?.id);
  // Tab 1: online AND in app (socket connected = isOnline)
  const inApp = others.filter(u => onlineInApp.has(u.id));
  // Tab 2: friends who are online but not in app right now (edge case / future push notifications)
  // For now: users NOT in socket but marked online recently (within 5 min) — simplify: just friends online
  const onlineNotInApp = friends.filter(u => !onlineInApp.has(u.id) && u.isOnline);
  // Tab 3: everyone else
  const offline = others.filter(u => !onlineInApp.has(u.id));

  const UserCard = ({ u, showAccept }) => {
    const isOnline = onlineInApp.has(u.id);
    const initial = (u.displayName || u.username || '?')[0].toUpperCase();
    return (
      <div className="gs-user-card" onClick={() => handleMessage(u)}>
        <div className="gs-avatar" style={{ background: isOnline ? 'var(--accent)' : 'var(--bg-tertiary)' }}>
          {initial}
          <span className={`gs-dot ${isOnline ? 'gs-dot-online' : 'gs-dot-offline'}`} />
        </div>
        <div className="gs-info">
          <div className="gs-name">{u.displayName || u.username}</div>
          <div className="gs-sub">@{u.username}</div>
        </div>
        <div className="gs-actions" onClick={e => e.stopPropagation()}>
          {showAccept ? (
            <button className="gs-accept-btn" onClick={() => handleAccept(u.id)}>Accept</button>
          ) : isFriend(u.id) ? (
            <button className="gs-msg-btn" onClick={() => handleMessage(u)}>💬</button>
          ) : hasPending(u.id) ? (
            <span className="gs-pending">Pending</span>
          ) : (
            <button className="gs-add-btn" onClick={e => handleAdd(u.id, e)}>+ Add</button>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="go-space">
      <div className="go-space-header">
        <h2>GoSpace</h2>
        <p>Everyone on Revilla</p>
      </div>

      <input
        placeholder="Search anyone on Revilla..."
        value={search}
        onChange={e => setSearch(e.target.value)}
        className="people-search"
      />

      {/* Tabs */}
      <div className="go-space-tabs">
        <button className={`gs-tab ${tab === 'active' ? 'active' : ''}`} onClick={() => setTab('active')}>
          🟢 In App ({inApp.length})
        </button>
        <button className={`gs-tab ${tab === 'online' ? 'active' : ''}`} onClick={() => setTab('online')}>
          🔵 Online ({onlineNotInApp.length})
        </button>
        <button className={`gs-tab ${tab === 'offline' ? 'active' : ''}`} onClick={() => setTab('offline')}>
          ⚫ Offline ({offline.length})
        </button>
        <button className={`gs-tab ${tab === 'requests' ? 'active' : ''}`} onClick={() => setTab('requests')}>
          Requests {requests.length > 0 && <span className="req-badge">{requests.length}</span>}
        </button>
      </div>

      {loading ? (
        <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>Loading...</div>
      ) : (
        <div className="gs-list">
          {tab === 'active' && (
            <>
              <div className="gs-section-label">Currently in the app right now</div>
              {filterUsers(inApp).length === 0
                ? <div className="empty-state">No one is in the app right now</div>
                : filterUsers(inApp).map(u => <UserCard key={u.id} u={u} />)
              }
            </>
          )}
          {tab === 'online' && (
            <>
              <div className="gs-section-label">Online but not currently in the app</div>
              {filterUsers(onlineNotInApp).length === 0
                ? <div className="empty-state">No one in this category</div>
                : filterUsers(onlineNotInApp).map(u => <UserCard key={u.id} u={u} />)
              }
            </>
          )}
          {tab === 'offline' && (
            <>
              <div className="gs-section-label">Not online — {offline.length} people total</div>
              {filterUsers(offline).length === 0
                ? <div className="empty-state">No offline users found</div>
                : filterUsers(offline).map(u => <UserCard key={u.id} u={u} />)
              }
            </>
          )}
          {tab === 'requests' && (
            <>
              <div className="gs-section-label">Pending friend requests</div>
              {requests.length === 0
                ? <div className="empty-state">No pending requests</div>
                : requests.map(u => <UserCard key={u.id} u={u} showAccept />)
              }
            </>
          )}
        </div>
      )}
    </div>
  );
}
