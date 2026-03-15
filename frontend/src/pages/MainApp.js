import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { initSocket, disconnectSocket } from '../services/socket';

import ChatWindow from '../components/User/Chat/ChatWindow';
import StatusFeed from '../components/User/Status/StatusFeed';
import GoSpace from '../components/User/Friends/GoSpace';
import ProfilePage from '../components/User/Profile/ProfilePage';
import ReelsPage from '../components/User/Reels/ReelsPage';

const ChatsIcon = ({ active }) => <svg viewBox="0 0 24 24" fill={active?'currentColor':'none'} stroke="currentColor" strokeWidth="2" width="22" height="22"><path strokeLinecap="round" strokeLinejoin="round" d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z"/></svg>;
const StatusIcon = ({ active }) => <svg viewBox="0 0 24 24" fill={active?'currentColor':'none'} stroke="currentColor" strokeWidth="2" width="22" height="22"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="3" fill="currentColor"/></svg>;
const SpaceIcon = ({ active }) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="22" height="22"><path strokeLinecap="round" strokeLinejoin="round" d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4" fill={active?'currentColor':'none'}/><path strokeLinecap="round" strokeLinejoin="round" d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/></svg>;
const ReelsIcon = ({ active }) => <svg viewBox="0 0 24 24" fill={active?'currentColor':'none'} stroke="currentColor" strokeWidth="2" width="22" height="22"><rect x="2" y="2" width="20" height="20" rx="2"/><path strokeLinecap="round" d="M10 8l6 4-6 4V8z" fill={active?'#fff':'none'}/></svg>;
const ProfileIcon = ({ active }) => <svg viewBox="0 0 24 24" fill={active?'currentColor':'none'} stroke="currentColor" strokeWidth="2" width="22" height="22"><path strokeLinecap="round" strokeLinejoin="round" d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>;

const NAV = [
  { key: 'chats', label: 'Chats', Icon: ChatsIcon },
  { key: 'status', label: 'Status', Icon: StatusIcon },
  { key: 'space', label: 'Space', Icon: SpaceIcon },
  { key: 'reels', label: 'Reels', Icon: ReelsIcon },
  { key: 'profile', label: 'Profile', Icon: ProfileIcon },
];

export default function MainApp() {
  const [currentUser, setCurrentUser] = useState(null);
  const [tab, setTab] = useState('chats');
  const [conversations, setConversations] = useState([]);
  const [activeChat, setActiveChat] = useState(null);
  const [showChat, setShowChat] = useState(false);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const refreshRef = useRef(null);
  const isMobile = window.innerWidth <= 768;

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) { navigate('/login'); return; }
    api.get('/auth/me')
      .then(res => {
        setCurrentUser(res.data);
        initSocket(res.data.id);
        setLoading(false);
        loadConversations();
      })
      .catch(() => { localStorage.removeItem('token'); navigate('/login'); });

    refreshRef.current = setInterval(loadConversations, 3000);
    return () => { clearInterval(refreshRef.current); disconnectSocket(); };
  }, []);

  const loadConversations = async () => {
    try {
      const res = await api.get('/messages/conversations');
      if (res.data) setConversations(res.data);
    } catch {}
  };

  // Open chat — works from anywhere, preserves conversation list
  const openChat = (user) => {
    if (!user) return;
    setActiveChat(user);
    setTab('chats');
    setShowChat(true);
    // Refresh conversations to include this chat
    setTimeout(loadConversations, 500);
  };

  const closeChat = () => {
    setShowChat(false);
    // Don't clear activeChat on desktop
    if (isMobile) loadConversations();
  };

  if (loading) return (
    <div className="app-loading">
      <div className="app-loading-spinner" />
      <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Loading Revilla...</p>
    </div>
  );

  const BASE = process.env.REACT_APP_API_URL?.replace('/api', '') || '';
  const avatarSrc = currentUser?.avatar ? (currentUser.avatar.startsWith('http') ? currentUser.avatar : `${BASE}${currentUser.avatar}`) : null;
  const filtered = conversations.filter(c => (c.displayName || c.username || '').toLowerCase().includes(search.toLowerCase()));
  const inChat = isMobile && tab === 'chats' && showChat;

  const ChatList = (
    <div className="chat-list-panel">
      <div className="chat-list-header"><h2>Chats</h2></div>
      <div className="chat-search-wrap">
        <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16" opacity="0.4"><path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/></svg>
        <input placeholder="Search chats..." value={search} onChange={e => setSearch(e.target.value)} />
      </div>
      <div className="conversation-list">
        {filtered.length === 0 ? (
          <div className="no-chats"><p>No chats yet</p><small>Go to Space to find people</small></div>
        ) : filtered.map(conv => {
          const src = conv.avatar ? (conv.avatar.startsWith('http') ? conv.avatar : `${BASE}${conv.avatar}`) : null;
          return (
            <div key={conv.id} className={`conversation-item ${activeChat?.id === conv.id ? 'active' : ''}`} onClick={() => openChat(conv)}>
              <div className="conv-avatar-wrap">
                {src ? <img src={src} alt="" className="conv-avatar" /> : <div className="conv-avatar-placeholder">{(conv.displayName || conv.username || '?')[0].toUpperCase()}</div>}
                {conv.isOnline && <span className="conv-online-dot" />}
              </div>
              <div className="conv-info">
                <div className="conv-name-row">
                  <span className="conv-name">{conv.displayName || conv.username}</span>
                  {conv.lastMessageTime && <span className="conv-time">{new Date(conv.lastMessageTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>}
                </div>
                <span className="conv-last-msg">{conv.lastMessage || 'Tap to chat'}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );

  const renderContent = () => {
    if (tab === 'chats') {
      if (isMobile) {
        if (showChat) return <div className="main-content full"><ChatWindow conversation={activeChat} currentUser={currentUser} onBack={closeChat} /></div>;
        return <div className="main-content full">{ChatList}</div>;
      }
      return (
        <div className="main-content split">
          {ChatList}
          <div className="chat-area"><ChatWindow conversation={activeChat} currentUser={currentUser} onBack={closeChat} /></div>
        </div>
      );
    }
    if (tab === 'status') return <div className="main-content full"><StatusFeed currentUser={currentUser} onOpenChat={openChat} /></div>;
    if (tab === 'space') return <div className="main-content full"><GoSpace currentUser={currentUser} onOpenChat={openChat} /></div>;
    if (tab === 'reels') return <div className="main-content full"><ReelsPage currentUser={currentUser} /></div>;
    if (tab === 'profile') return <div className="main-content full"><ProfilePage currentUser={currentUser} setCurrentUser={setCurrentUser} /></div>;
  };

  return (
    <div className="app-shell">
      {!isMobile && (
        <div className="desktop-sidebar">
          <div className="sidebar-logo">R</div>
          {NAV.map(({ key, label, Icon }) => (
            <button key={key} className={`sidebar-nav-btn ${tab === key ? 'active' : ''}`} onClick={() => setTab(key)} title={label}>
              <Icon active={tab === key} /><span>{label}</span>
            </button>
          ))}
          <div style={{ flex: 1 }} />
          <div className="sidebar-user" onClick={() => setTab('profile')} title="Profile">
            {avatarSrc ? <img src={avatarSrc} alt="" className="sidebar-avatar" /> : <div className="sidebar-avatar-placeholder">{(currentUser?.displayName || 'U')[0].toUpperCase()}</div>}
          </div>
        </div>
      )}
      <div className={`app-main ${inChat ? 'in-chat' : ''}`}>{renderContent()}</div>
      {isMobile && !inChat && (
        <nav className="mobile-bottom-nav">
          {NAV.map(({ key, label, Icon }) => (
            <button key={key} className={`mobile-nav-btn ${tab === key ? 'active' : ''}`}
              onClick={() => { setTab(key); if (key !== 'chats') setShowChat(false); }}>
              <Icon active={tab === key} /><span>{label}</span>
            </button>
          ))}
        </nav>
      )}
    </div>
  );
}
