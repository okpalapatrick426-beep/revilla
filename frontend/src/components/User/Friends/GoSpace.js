import { useState, useEffect, useCallback } from 'react';
import { useSocket } from '../../../context/SocketContext';
import { getFriends, getFriendRequests, sendFriendRequest, acceptFriendRequest, removeFriend, searchUsers } from '../../../services/api';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

export default function GoSpace({ onStartChat }) {
  const { socket, connected } = useSocket();
  const navigate = useNavigate();
  const [friends, setFriends] = useState([]);
  const [requests, setRequests] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [tab, setTab] = useState('friends');
  const [onlineUsers, setOnlineUsers] = useState(new Set());

  const loadData = useCallback(() => {
    getFriends().then(r => setFriends(r.data || [])).catch(() => {});
    getFriendRequests().then(r => setRequests(r.data || [])).catch(() => {});
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  useEffect(() => {
    const onFocus = () => loadData();
    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
  }, [loadData]);

  // Request online users whenever socket connects
  useEffect(() => {
    if (!socket || !connected) return;
    socket.emit('get_online_users');
  }, [socket, connected]);

  useEffect(() => {
    if (!socket) return;
    const onList = (ids) => setOnlineUsers(new Set(ids));
    const onOnline = ({ userId }) => setOnlineUsers(prev => new Set([...prev, userId]));
    const onOffline = ({ userId }) => setOnlineUsers(prev => { const s = new Set(prev); s.delete(userId); return s; });
    socket.on('online_users_list', onList);
    socket.on('user_online', onOnline);
    socket.on('user_offline', onOffline);
    return () => {
      socket.off('online_users_list', onList);
      socket.off('user_online', onOnline);
      socket.off('user_offline', onOffline);
    };
  }, [socket]);

  useEffect(() => {
    if (searchQuery.length < 2) { setSearchResults([]); return; }
    setSearching(true);
    const t = setTimeout(async () => {
      try {
        const res = await searchUsers(searchQuery);
        setSearchResults(res.data || []);
      } catch { setSearchResults([]); }
      finally { setSearching(false); }
    }, 400);
    return () => clearTimeout(t);
  }, [searchQuery]);

  const handleAdd = async (userId, e) => {
    e.stopPropagation();
    try {
      await sendFriendRequest(userId);
      toast.success('Friend request sent!');
      setSearchResults(prev => prev.filter(u => u.id !== userId));
    } catch (err) {
      toast.error(err.response?.data?.error || 'Could not send request');
    }
  };

  const handleAccept = async (userId) => {
    try { await acceptFriendRequest(userId); toast.success('Friend added!'); loadData(); }
    catch { toast.error('Failed to accept'); }
  };

  const handleDecline = async (userId) => {
    try { await removeFriend(userId); loadData(); }
    catch { toast.error('Failed to decline'); }
  };

  const handleRemove = async (userId, name, e) => {
    e.stopPropagation();
    if (!window.confirm(`Remove ${name} from friends?`)) return;
    try { await removeFriend(userId); setFriends(prev => prev.filter(f => f.id !== userId)); }
    catch { toast.error('Failed to remove'); }
  };

  const handleMessage = (friend) => {
    if (onStartChat) onStartChat({ ...friend, isOnline: onlineUsers.has(friend.id) });
    else navigate('/app', { state: { openChat: friend } });
  };

  const isFriend = (userId) => friends.some(f => f.id === userId);
  const hasRequest = (userId) => requests.some(r => r.id === userId);

  return (
    <div className="go-space">
      <div className="go-space-header">
        <h2>GoSpace</h2>
        <p>Search for people and connect with friends</p>
      </div>

      <input
        placeholder="Search by name or username..."
        value={searchQuery}
        onChange={e => setSearchQuery(e.target.value)}
        className="people-search"
      />

      {searchQuery.length >= 2 && (
        <div className="search-results-dropdown">
          {searching ? (
            <div style={{ padding: '.85rem 1rem', color: 'var(--text-muted)', fontSize: '.82rem' }}>Searching...</div>
          ) : searchResults.length === 0 ? (
            <div style={{ padding: '.85rem 1rem', color: 'var(--text-muted)', fontSize: '.82rem' }}>No users found for "{searchQuery}"</div>
          ) : searchResults.map(u => (
            <div key={u.id} className="search-result-item">
              <div className="sr-avatar">{(u.displayName || u.username || '?')[0].toUpperCase()}</div>
              <div>
                <div className="sr-name">{u.displayName || u.username}</div>
                <div className="sr-username">@{u.username}</div>
              </div>
              {isFriend(u.id) ? (
                <span style={{ marginLeft: 'auto', fontSize: '.75rem', color: 'var(--accent)' }}>Friends</span>
              ) : hasRequest(u.id) ? (
                <span style={{ marginLeft: 'auto', fontSize: '.75rem', color: 'var(--text-muted)' }}>Pending</span>
              ) : (
                <button className="add-btn" onClick={e => handleAdd(u.id, e)}>+ Add</button>
              )}
            </div>
          ))}
        </div>
      )}

      <div className="go-space-tabs">
        <button className={`gs-tab ${tab === 'friends' ? 'active' : ''}`} onClick={() => setTab('friends')}>
          Friends ({friends.length})
        </button>
        <button className={`gs-tab ${tab === 'requests' ? 'active' : ''}`} onClick={() => setTab('requests')}>
          Requests {requests.length > 0 && <span className="req-badge">{requests.length}</span>}
        </button>
      </div>

      {tab === 'friends' && (
        <div className="friends-grid">
          {friends.length === 0 ? (
            <div className="empty-state" style={{ gridColumn: '1/-1' }}>
              No friends yet - search for people above to connect!
            </div>
          ) : friends.map(f => {
            const isOnline = onlineUsers.has(f.id);
            const initial = (f.displayName || f.username || '?')[0].toUpperCase();
            return (
              <div key={f.id} className="friend-card" onClick={() => handleMessage(f)} style={{ cursor: 'pointer' }}>
                <div className="friend-avatar" style={{ position: 'relative' }}>
                  {initial}
                  {isOnline && (
                    <span style={{ position: 'absolute', bottom: 0, right: 0, width: 11, height: 11, borderRadius: '50%', background: '#22c55e', border: '2px solid var(--bg-secondary)' }} />
                  )}
                </div>
                <div className="friend-name">{f.displayName || f.username}</div>
                <div style={{ fontSize: '.72rem', color: isOnline ? '#22c55e' : 'var(--text-muted)', marginBottom: '.5rem' }}>
                  {isOnline ? '? Online' : '? Offline'}
                </div>
                <div className="friend-actions">
                  <button className="msg-btn" onClick={e => { e.stopPropagation(); handleMessage(f); }}>Message</button>
                  <button className="remove-btn" onClick={e => handleRemove(f.id, f.displayName || f.username, e)} style={{ background: 'var(--bg-tertiary)', border: 'none', color: 'var(--text-muted)', borderRadius: '6px', padding: '.3rem .6rem', cursor: 'pointer', fontSize: '.75rem' }}>Remove</button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {tab === 'requests' && (
        <div className="requests-list">
          {requests.length === 0 ? (
            <div className="empty-state">No pending friend requests</div>
          ) : requests.map(r => (
            <div key={r.id} className="request-item">
              <div className="req-avatar">{(r.displayName || r.username || '?')[0].toUpperCase()}</div>
              <div className="req-info">
                <div>{r.displayName || r.username}</div>
                <div className="req-sub">@{r.username} wants to connect</div>
              </div>
              <div className="req-actions">
                <button className="accept-btn" onClick={() => handleAccept(r.id)}>Accept</button>
                <button className="decline-btn" onClick={() => handleDecline(r.id)}>Decline</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
