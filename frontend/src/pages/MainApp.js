import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { getAllPlatformUsers } from '../services/api';
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
  const [allUsers, setAllUsers] = useState([]);
  const [onlineUsers, setOnlineUsers] = useState(new Set());
  const [search, setSearch] = useState('');
  const [showChatMobile, setShowChatMobile] = useState(false);

  const loadUsers = useCallback(() => {
    getAllPlatformUsers().then(res => {
      setAllUsers(res.data || []);
      const onlineSet = new Set((res.data || []).filter(u => u.isOnline).map(u => u.id));
      setOnlineUsers(onlineSet);
    }).catch(() => {});
  }, []);

  useEffect(() => { loadUsers(); }, [loadUsers]);

  // Auto-refresh every 2 seconds
  useEffect(() => {
    const interval = setInterval(loadUsers, 2000);
    return () => clearInterval(interval);
  }, [loadUsers]);

  useEffect(() => {
    if (!socket) return;
    socket.on('user_online', ({ userId }) => setOnlineUsers(prev => new Set([...prev, userId])));
    socket.on('user_offline', ({ userId }) => setOnlineUsers(prev => { const s = new Set(prev); s.delete(userId); return s; }));
    return () => { socket.off('user_online'); socket.off('user_offline'); };
  }, [socket]);

  // Universal open chat — works on mobile and desktop
  const openChat = (contact) => {
    setActiveContact({ ...contact, isOnline: onlineUsers.has(contact.id) || contact.isOnline });
    setActiveTab('chats');
    setShowChatMobile(true); // on mobile, show chat panel
  };

  const filtered = allUsers.filter(c =>
    (c.displayName || c.username || '').toLowerCase().includes(search.toLowerCase())
  );

  const tabs = [
    { id: 'chats', icon: '💬', label: 'Chats' },
    { id: 'status', icon: '○', label: 'Status' },
    { id: 'gospace', icon: '⊞', label: 'Space' },
    { id: 'referrals', icon: '◈', label: 'Refer' },
    { id: 'profile', icon: '◉', label: 'Profile' },
  ];
  if (user?.role === 'admin' || user?.role === 'moderator') {
    tabs.push({ id: 'admin', icon: '◎', label: 'Admin' });
  }

  return (
    <div className="main-app">
      {/* Sidebar nav — desktop only */}
      <div className="app-sidebar-nav">
        <div className="app-logo">R</div>
        {tabs.map(tab => (
          <button key={tab.id} className={`nav-tab ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.id)} title={tab.label}>
            {tab.icon}
          </button>
        ))}
        <div className="nav-spacer" />
        <button className="nav-tab logout" onClick={logoutUser} title="Logout">⏻</button>
      </div>

      <div className="app-content">
        {activeTab === 'chats' && (
          <div className="chats-layout">
            {/* Contact list — hidden on mobile when chat is open */}
            <div className={`contacts-sidebar ${showChatMobile && activeContact ? 'mobile-hidden' : ''}`}>
              <div className="contacts-header">
                <h3>Messages</h3>
                {showChatMobile && activeContact && (
                  <button className="icon-btn" onClick={() => setShowChatMobile(false)}>←</button>
                )}
              </div>
              <div className="contacts-search">
                <input placeholder="Search people..." value={search}
                  onChange={e => setSearch(e.target.value)} />
              </div>
              <div style={{ flex: 1, overflowY: 'auto' }}>
                {filtered.length === 0 ? (
                  <div className="contact-list-placeholder">
                    <span style={{ fontSize: '2rem', opacity: .25 }}>💬</span>
                    <p>No users yet</p>
                    <p style={{ fontSize: '.75rem' }}>Go to GoSpace to find people</p>
                  </div>
                ) : filtered.map(contact => {
                  const isOnline = onlineUsers.has(contact.id) || contact.isOnline;
                  const initial = (contact.displayName || contact.username || '?')[0].toUpperCase();
                  return (
                    <div key={contact.id}
                      className={`contact-item ${activeContact?.id === contact.id ? 'active' : ''}`}
                      onClick={() => openChat(contact)}>
                      <div className={`contact-avatar ${isOnline ? 'contact-avatar-online' : ''}`}>{initial}</div>
                      <div className="contact-meta">
                        <div className="contact-name">{contact.displayName || contact.username}</div>
                        <div className="contact-preview">{isOnline ? '● Online' : '○ Offline'}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Chat window — shown on mobile only when contact selected */}
            <div className={`chat-panel ${showChatMobile && activeContact ? 'mobile-visible' : ''}`}>
              {showChatMobile && activeContact && (
                <button className="mobile-back-btn" onClick={() => setShowChatMobile(false)}>← Back</button>
              )}
              <ChatWindow contact={activeContact} />
            </div>
          </div>
        )}
        {activeTab === 'status' && <StatusFeed onUserClick={openChat} />}
        {activeTab === 'gospace' && <GoSpace onStartChat={openChat} />}
        {activeTab === 'referrals' && <ReferralDashboard />}
        {activeTab === 'profile' && <ProfilePage />}
        {activeTab === 'admin' && (
          <div style={{ padding: '2rem' }}>
            <h2 style={{ color: 'var(--text-primary)', fontSize: '1.1rem' }}>Admin Panel</h2>
            <a href="/admin" style={{ color: 'var(--accent)', fontSize: '.9rem' }}>Open full admin panel →</a>
          </div>
        )}
      </div>

      {/* Bottom nav — mobile only */}
      <div className="bottom-nav">
        {tabs.map(tab => (
          <button key={tab.id}
            className={`bottom-nav-btn ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => { setActiveTab(tab.id); setShowChatMobile(false); }}>
            <span className="bottom-nav-icon">{tab.icon}</span>
            <span className="bottom-nav-label">{tab.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
