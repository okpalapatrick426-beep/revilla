import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { getFriends } from '../services/api';
import ChatWindow from '../components/User/Chat/ChatWindow';
import StatusFeed from '../components/User/Status/StatusFeed';
import ProfilePage from '../components/User/Profile/ProfilePage';
import GoSpace from '../components/User/Friends/GoSpace';
import ReferralDashboard from '../components/User/Referral/ReferralDashboard';

export default function MainApp() {
  const { user, logoutUser } = useAuth();
  const { socket } = useSocket();
  const [activeTab, setActiveTab] = useState('chats');
  const [activeContact, setActiveContact] = useState(null);
  const [contacts, setContacts] = useState([]);
  const [onlineUsers, setOnlineUsers] = useState(new Set());
  const [search, setSearch] = useState('');

  useEffect(() => {
    getFriends().then(res => setContacts(res.data || [])).catch(() => {});
  }, []);

  useEffect(() => {
    if (!socket) return;

    // Get current online users immediately
    socket.emit('get_online_users');

    socket.on('online_users_list', (userIds) => {
      setOnlineUsers(new Set(userIds));
    });
    socket.on('user_online', ({ userId }) => setOnlineUsers(prev => new Set([...prev, userId])));
    socket.on('user_offline', ({ userId }) => setOnlineUsers(prev => { const s = new Set(prev); s.delete(userId); return s; }));

    return () => {
      socket.off('online_users_list');
      socket.off('user_online');
      socket.off('user_offline');
    };
  }, [socket]);

  const filtered = contacts.filter(c =>
    (c.displayName || c.username || '').toLowerCase().includes(search.toLowerCase())
  );

  const tabs = [
    { id: 'chats', icon: 'chats', title: 'Chats' },
    { id: 'status', icon: 'status', title: 'Status' },
    { id: 'gospace', icon: 'go', title: 'GoSpace' },
    { id: 'referrals', icon: 'ref', title: 'Referrals' },
    { id: 'profile', icon: 'prof', title: 'Profile' },
  ];
  if (user?.role === 'admin' || user?.role === 'moderator') {
    tabs.push({ id: 'admin', icon: 'adm', title: 'Admin Panel' });
  }

  return (
    <div className="main-app">
      <div className="app-sidebar-nav">
        <div className="app-logo">R</div>
        {tabs.map(tab => (
          <button
            key={tab.id}
            className={`nav-tab ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
            title={tab.title}
          >
            {tab.icon === 'chats' ? (
              <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
            ) : tab.icon === 'status' ? (
              <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="3"/></svg>
            ) : tab.icon === 'go' ? (
              <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>
            ) : tab.icon === 'ref' ? (
              <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
            ) : tab.icon === 'prof' ? (
              <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
            ) : (
              <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/></svg>
            )}
          </button>
        ))}
        <div className="nav-spacer" />
        <button className="nav-tab logout" onClick={logoutUser} title="Logout">
          <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
        </button>
      </div>

      <div className="app-content">
        {activeTab === 'chats' && (
          <div className="chats-layout">
            <div className="contacts-sidebar">
              <div className="contacts-header">
                <h3>Messages</h3>
              </div>
              <div className="contacts-search">
                <input
                  placeholder="Search conversations..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                />
              </div>
              <div style={{ flex: 1, overflowY: 'auto' }}>
                {filtered.length === 0 ? (
                  <div className="contact-list-placeholder">
                    <span style={{ fontSize: '2rem', opacity: .25 }}>??</span>
                    <p>No conversations yet</p>
                    <p style={{ fontSize: '.75rem' }}>Go to GoSpace to find people</p>
                  </div>
                ) : filtered.map(contact => {
                  const isOnline = onlineUsers.has(contact.id);
                  const initial = (contact.displayName || contact.username || '?')[0].toUpperCase();
                  return (
                    <div
                      key={contact.id}
                      className={`contact-item ${activeContact?.id === contact.id ? 'active' : ''}`}
                      onClick={() => setActiveContact({ ...contact, isOnline })}
                    >
                      <div className={`contact-avatar ${isOnline ? 'contact-avatar-online' : ''}`}>
                        {initial}
                      </div>
                      <div className="contact-meta">
                        <div className="contact-name">{contact.displayName || contact.username}</div>
                        <div className="contact-preview">{isOnline ? '? Online' : 'Tap to chat'}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
            <ChatWindow contact={activeContact} />
          </div>
        )}
        {activeTab === 'status' && <StatusFeed />}
        {activeTab === 'gospace' && <GoSpace onStartChat={contact => { setActiveContact(contact); setActiveTab('chats'); }} />}
        {activeTab === 'referrals' && <ReferralDashboard />}
        {activeTab === 'profile' && <ProfilePage />}
        {activeTab === 'admin' && (
          <div style={{ padding: '2rem' }}>
            <h2 style={{ color: 'var(--text-primary)', fontSize: '1.1rem' }}>Admin Panel</h2>
            <a href="/admin" style={{ color: 'var(--accent)', fontSize: '.9rem' }}>Open full admin panel ?</a>
          </div>
        )}
      </div>
    </div>
  );
}



