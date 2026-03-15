import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { initSocket, disconnectSocket } from '../services/socket';

import ChatWindow from '../components/User/Chat/ChatWindow';
import StatusFeed from '../components/User/Status/StatusFeed';
import GoSpace from '../components/User/Friends/GoSpace';
import ProfilePage from '../components/User/Profile/ProfilePage';

// Icons
const ChatsIcon = ({ active }) => (
  <svg viewBox="0 0 24 24" fill={active ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" width="22" height="22">
    <path strokeLinecap="round" strokeLinejoin="round" d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z"/>
  </svg>
);
const StatusIcon = ({ active }) => (
  <svg viewBox="0 0 24 24" fill={active ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" width="22" height="22">
    <circle cx="12" cy="12" r="10"/>
    <circle cx="12" cy="12" r="4" fill="currentColor"/>
  </svg>
);
const SpaceIcon = ({ active }) => (
  <svg viewBox="0 0 24 24" fill={active ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" width="22" height="22">
    <path strokeLinecap="round" strokeLinejoin="round" d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
    <circle cx="9" cy="7" r="4"/>
    <path strokeLinecap="round" strokeLinejoin="round" d="M23 21v-2a4 4 0 0 0-3-3.87"/>
    <path strokeLinecap="round" strokeLinejoin="round" d="M16 3.13a4 4 0 0 1 0 7.75"/>
  </svg>
);
const ReferIcon = ({ active }) => (
  <svg viewBox="0 0 24 24" fill={active ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" width="22" height="22">
    <path strokeLinecap="round" strokeLinejoin="round" d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
    <path strokeLinecap="round" strokeLinejoin="round" d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
  </svg>
);
const ProfileIcon = ({ active }) => (
  <svg viewBox="0 0 24 24" fill={active ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" width="22" height="22">
    <path strokeLinecap="round" strokeLinejoin="round" d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
    <circle cx="12" cy="7" r="4"/>
  </svg>
);

export default function MainApp() {
  const [currentUser, setCurrentUser] = useState(null);
  const [tab, setTab] = useState('chats');
  const [conversations, setConversations] = useState([]);
  const [activeChat, setActiveChat] = useState(null);
  const [showChat, setShowChat] = useState(false); // mobile: show chat panel
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const isMobile = window.innerWidth <= 768;
  const refreshRef = useRef(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) { navigate('/login'); return; }

    api.get('/auth/me').then(res => {
      setCurrentUser(res.data);
      initSocket(res.data.id);
      setLoading(false);
    }).catch(() => {
      localStorage.removeItem('token');
      navigate('/login');
    });

    // Auto-refresh conversations every 2 seconds
    refreshRef.current = setInterval(() => {
      loadConversations();
    }, 2000);

    return () => {
      clearInterval(refreshRef.current);
      disconnectSocket();
    };
  }, []);

  const loadConversations = async () => {
    try {
      const res = await api.get('/messages/conversations').catch(() => ({ data: [] }));
      if (res.data?.length) setConversations(res.data);
    } catch {}
  };

  useEffect(() => { if (currentUser) loadConversations(); }, [currentUser]);

  // ── OPEN CHAT FROM ANYWHERE ──────────────────────────────
  const openChat = (user) => {
    if (!user) return;
    setActiveChat(user);
    setTab('chats');
    setShowChat(true);
  };

  const closeChat = () => {
    setShowChat(false);
    if (!isMobile) setActiveChat(null);
  };

  const logout = () => {
    localStorage.removeItem('token');
    disconnectSocket();
    navigate('/login');
  };

  const filtered = conversations.filter(c => {
    const name = c.displayName || c.name || c.username || '';
    return name.toLowerCase().includes(search.toLowerCase());
  });

  if (loading) {
    return (
      <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0d1117', color: '#fff', flexDirection: 'column', gap: 16 }}>
        <div style={{ width: 40, height: 40, border: '3px solid #7c3aed', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
        <p style={{ color: '#666', fontSize: '0.9rem' }}>Loading Revilla...</p>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  const BASE = process.env.REACT_APP_API_URL?.replace('/api', '') || '';
  const avatarSrc = currentUser?.avatar
    ? (currentUser.avatar.startsWith('http') ? currentUser.avatar : `${BASE}${currentUser.avatar}`)
    : null;

  // ── CHAT LIST SIDEBAR ────────────────────────────────────
  const ChatList = (
    <div className="chat-list-panel">
      <div className="chat-list-header">
        <h2>Chats</h2>
        <button className="icon-btn logout-btn" onClick={logout} title="Logout">
          <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20"><path d="M17 7l-1.41 1.41L18.17 11H8v2h10.17l-2.58 2.58L17 17l5-5zM4 5h8V3H4c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h8v-2H4V5z"/></svg>
        </button>
      </div>
      <div className="chat-search-wrap">
        <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16" opacity="0.4"><path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/></svg>
        <input placeholder="Search chats..." value={search} onChange={e => setSearch(e.target.value)} />
      </div>
      <div className="conversation-list">
        {filtered.length === 0 && (
          <div className="no-chats">
            <p>No chats yet</p>
            <small>Go to Space to find people</small>
          </div>
        )}
        {filtered.map(conv => {
          const convAvatar = conv.avatar ? (conv.avatar.startsWith('http') ? conv.avatar : `${BASE}${conv.avatar}`) : null;
          return (
            <div
              key={conv.id}
              className={`conversation-item ${activeChat?.id === conv.id ? 'active' : ''}`}
              onClick={() => openChat(conv)}
            >
              <div className="conv-avatar-wrap">
                {convAvatar
                  ? <img src={convAvatar} alt="" className="conv-avatar" />
                  : <div className="conv-avatar-placeholder">{(conv.displayName || conv.name || conv.username || '?')[0].toUpperCase()}</div>
                }
                {conv.isOnline && <span className="conv-online-dot" />}
              </div>
              <div className="conv-info">
                <div className="conv-name-row">
                  <span className="conv-name">{conv.displayName || conv.name || conv.username}</span>
                  {conv.lastMessageTime && (
                    <span className="conv-time">{new Date(conv.lastMessageTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  )}
                </div>
                <span className="conv-last-msg">{conv.lastMessage || 'Tap to chat'}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );

  // ── RENDER MAIN CONTENT ──────────────────────────────────
  const renderContent = () => {
    if (tab === 'chats') {
      if (isMobile) {
        if (showChat && activeChat) {
          return (
            <div className="main-content full">
              <ChatWindow conversation={activeChat} currentUser={currentUser} onBack={closeChat} />
            </div>
          );
        }
        return <div className="main-content full">{ChatList}</div>;
      }
      // Desktop: split view
      return (
        <div className="main-content split">
          {ChatList}
          <div className="chat-area">
            <ChatWindow conversation={activeChat} currentUser={currentUser} onBack={closeChat} />
          </div>
        </div>
      );
    }

    if (tab === 'status') return (
      <div className="main-content full">
        <StatusFeed currentUser={currentUser} onOpenChat={openChat} />
      </div>
    );

    if (tab === 'space') return (
      <div className="main-content full">
        <GoSpace currentUser={currentUser} onOpenChat={openChat} />
      </div>
    );

    if (tab === 'refer') return (
      <div className="main-content full refer-page">
        <div className="refer-header">
          <h2>Refer & Earn</h2>
          <p>Invite friends to Revilla and grow your reach</p>
        </div>
        <div className="refer-card">
          <p className="refer-label">Your invite code</p>
          <div className="refer-code-big">{currentUser?.referralCode || '------'}</div>
          <button className="refer-copy-btn" onClick={() => {
            navigator.clipboard.writeText(`Join me on Revilla! Use my code: ${currentUser?.referralCode} — revilla.vercel.app`);
            alert('Link copied!');
          }}>Copy Invite Link</button>
        </div>
      </div>
    );

    if (tab === 'profile') return (
      <div className="main-content full">
        <ProfilePage currentUser={currentUser} setCurrentUser={setCurrentUser} />
      </div>
    );
  };

  const NAV = [
    { key: 'chats', label: 'Chats', Icon: ChatsIcon },
    { key: 'status', label: 'Status', Icon: StatusIcon },
    { key: 'space', label: 'Space', Icon: SpaceIcon },
    { key: 'refer', label: 'Refer', Icon: ReferIcon },
    { key: 'profile', label: 'Profile', Icon: ProfileIcon },
  ];

  return (
    <div className="app-shell">
      {/* Desktop sidebar */}
      {!isMobile && (
        <div className="desktop-sidebar">
          <div className="sidebar-logo">R</div>
          {NAV.map(({ key, label, Icon }) => (
            <button
              key={key}
              className={`sidebar-nav-btn ${tab === key ? 'active' : ''}`}
              onClick={() => setTab(key)}
              title={label}
            >
              <Icon active={tab === key} />
              <span>{label}</span>
            </button>
          ))}
          <div style={{ flex: 1 }} />
          <div className="sidebar-user" onClick={() => setTab('profile')}>
            {avatarSrc
              ? <img src={avatarSrc} alt="" className="sidebar-avatar" />
              : <div className="sidebar-avatar-placeholder">{(currentUser?.displayName || currentUser?.username || 'U')[0].toUpperCase()}</div>
            }
          </div>
        </div>
      )}

      {/* Main area */}
      <div className="app-main">
        {renderContent()}
      </div>

      {/* Mobile bottom nav */}
      {isMobile && !(tab === 'chats' && showChat) && (
        <nav className="mobile-bottom-nav">
          {NAV.map(({ key, label, Icon }) => (
            <button
              key={key}
              className={`mobile-nav-btn ${tab === key ? 'active' : ''}`}
              onClick={() => { setTab(key); if (key !== 'chats') setShowChat(false); }}
            >
              <Icon active={tab === key} />
              <span>{label}</span>
            </button>
          ))}
        </nav>
      )}
    </div>
  );
}
