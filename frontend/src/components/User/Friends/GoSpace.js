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
  const [onlineIds, setOnlineIds] = useState(new Set());
  const [tab, setTab] = useState('inapp');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    try {
      const [usersRes, friendsRes, reqRes] = await Promise.all([
        getAllPlatformUsers(),
        getFriends(),
        getFriendRequests(),
      ]);
      const users = usersRes.data || [];
      setAllUsers(users);
      setFriends(friendsRes.data || []);
      setRequests(reqRes.data || []);
      // Build online set from DB
      const online = new Set(users.filter(u => u.isOnline).map(u => u.id));
      setOnlineIds(online);
    } catch { toast.error('Failed to load users'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  // Auto-refresh every 2 seconds
  useEffect(() => {
    const interval = setInterval(loadData, 2000);
    return () => clearInterval(interval);
  }, [loadData]);

  // Live socket updates
  useEffect(() => {
    if (!socket) return;
    const onOnline = ({ userId }) => setOnlineIds(prev => new Set([...prev, userId]));
    const onOffline = ({ userId }) => setOnlineIds(prev => { const s = new Set(prev); s.delete(userId); return s; });
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

  const handleAccept = async (userId, e) => {
    e?.stopPropagation();
    try { await acceptFriendRequest(userId); toast.success('Friend added!'); loadData(); }
    catch { toast.error('Failed to accept'); }
  };

  const handleRemove = async (userId, name, e) => {
    e?.stopPropagation();
    if (!window.confirm(`Remove ${name} from friends?`)) return;
    try { await removeFriend(userId); loadData(); }
    catch { toast.error('Failed to remove'); }
  };

  const filter = (list) => {
    if (!search.trim()) return list;
    const q = search.toLowerCase();
    return list.filter(u =>
      (u.displayName || '').toLowerCase().includes(q) ||
      (u.username || '').toLowerCase().includes(q)
    );
  };

  // Categories (exclude self)
  const others = allUsers.filter(u => u.id !== me?.id);
  const inApp = others.filter(u => onlineIds.has(u.id));      // online = in app (socket connected)
  const offline = others.filter(u => !onlineIds.has(u.id));   // not online
  const friendsList = friends;                                  // accepted friends

  const UserCard = ({ u, showAccept, showRemove }) => {
    const isOnline = onlineIds.has(u.id);
    const initial = (u.displayName || u.username || '?')[0].toUpperCase();
    return (
      <div className="gs-user-card" onClick={() => onStartChat && onStartChat(u)}>
        <div className="gs-avatar" style={{ background: isOnline ? 'var(--accent)' : '#2a3942' }}>
          {initial}
          <span className={`gs-dot ${isOnline ? 'gs-dot-online' : 'gs-dot-offline'}`} />
        </div>
        <div className="gs-info">
          <div className="gs-name">{u.displayName || u.username}</div>
          <div className="gs-sub">{isOnline ? '🟢 Online' : '⚫ Offline'} · @{u.username}</div>
        </div>
        <div className="gs-actions" onClick={e => e.stopPropagation()}>
          <button className="gs-msg-btn" onClick={() => onStartChat && onStartChat(u)}>💬</button>
          {showAccept ? (
            <button className="gs-accept-btn" onClick={e => handleAccept(u.id, e)}>Accept</button>
          ) : showRemove ? (
            <button className="gs-remove-btn" onClick={e => handleRemove(u.id, u.displayName || u.username, e)}>✕</button>
          ) : isFriend(u.id) ? (
            <span className="gs-friend-badge">✓</span>
          ) : hasPending(u.id) ? (
            <span className="gs-pending">Pending</span>
          ) : (
            <button className="gs-add-btn" onClick={e => handleAdd(u.id, e)}>+ Add</button>
          )}
        </div>
      </div>
    );
  };

  const tabs = [
    { id: 'inapp', label: `🟢 In App (${inApp.length})` },
    { id: 'offline', label: `⚫ Offline (${offline.length})` },
    { id: 'friends', label: `👥 Friends (${friendsList.length})` },
    { id: 'requests', label: `Requests${requests.length > 0 ? ` (${requests.length})` : ''}` },
  ];

  return (
    <div className="go-space">
      <div className="go-space-header">
        <h2>GoSpace</h2>
        <p>Everyone on Revilla — tap anyone to chat</p>
      </div>

      <input placeholder="Search anyone on Revilla..."
        value={search} onChange={e => setSearch(e.target.value)} className="people-search" />

      <div className="go-space-tabs">
        {tabs.map(t => (
          <button key={t.id} className={`gs-tab ${tab === t.id ? 'active' : ''}`}
            onClick={() => setTab(t.id)}>{t.label}</button>
        ))}
      </div>

      {loading ? (
        <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>Loading...</div>
      ) : (
        <div className="gs-list">
          {tab === 'inapp' && (
            <>
              <div className="gs-section-label">Currently online & in the app</div>
              {filter(inApp).length === 0
                ? <div className="empty-state">No one online right now</div>
                : filter(inApp).map(u => <UserCard key={u.id} u={u} />)}
            </>
          )}
          {tab === 'offline' && (
            <>
              <div className="gs-section-label">Not currently online — {offline.length} people</div>
              {filter(offline).length === 0
                ? <div className="empty-state">No offline users</div>
                : filter(offline).map(u => <UserCard key={u.id} u={u} />)}
            </>
          )}
          {tab === 'friends' && (
            <>
              <div className="gs-section-label">Your friends — {friendsList.length} total</div>
              {filter(friendsList).length === 0
                ? <div className="empty-state">No friends yet — add people from In App or Offline tabs!</div>
                : filter(friendsList).map(u => <UserCard key={u.id} u={u} showRemove />)}
            </>
          )}
          {tab === 'requests' && (
            <>
              <div className="gs-section-label">Pending friend requests</div>
              {requests.length === 0
                ? <div className="empty-state">No pending requests</div>
                : requests.map(u => <UserCard key={u.id} u={u} showAccept />)}
            </>
          )}
        </div>
      )}
    </div>
  );
}
