import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { initSocket, disconnectSocket, getSocket } from '../services/socket';
import '../AppShell.css';

import ChatWindow from '../components/User/Chat/ChatWindow';
import StatusFeed from '../components/User/Status/StatusFeed';
import GoSpace from '../components/User/Friends/GoSpace';
import ProfilePage from '../components/User/Profile/ProfilePage';
import ReelsPage from '../components/User/Reels/ReelsPage';

// ── INLINE SVG ICONS ────────────────────────────────────────────────────────
const Icon = ({ d, size = 22, stroke = 'currentColor', fill = 'none', sw = 1.8, viewBox = '0 0 24 24', children }) => (
  <svg width={size} height={size} viewBox={viewBox} fill={fill} stroke={stroke} strokeWidth={sw}
    strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block', flexShrink: 0 }}>
    {d && <path d={d} />}
    {children}
  </svg>
);

const ChatsIcon    = ({ active }) => <Icon sw={active ? 2.2 : 1.7} d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z" fill={active ? 'currentColor' : 'none'} />;
const FeedIcon     = ({ active }) => (
  <Icon sw={active ? 2.2 : 1.7}>
    <rect x="3" y="3" width="7" height="7" rx="1" fill={active ? 'currentColor' : 'none'} />
    <rect x="14" y="3" width="7" height="7" rx="1" fill={active ? 'currentColor' : 'none'} />
    <rect x="3" y="14" width="7" height="7" rx="1" fill={active ? 'currentColor' : 'none'} />
    <rect x="14" y="14" width="7" height="7" rx="1" fill={active ? 'currentColor' : 'none'} />
  </Icon>
);
const PlusIcon     = ({ size = 22 }) => <Icon size={size} sw={2.2} d="M12 5v14M5 12h14" />;
const ReelsIcon    = ({ active }) => (
  <Icon sw={active ? 2.2 : 1.7}>
    <rect x="2" y="2" width="20" height="20" rx="3" fill={active ? 'currentColor' : 'none'} />
    <path d="M10 8l6 4-6 4V8z" fill={active ? '#fff' : 'currentColor'} stroke="none" />
  </Icon>
);
const ProfileIcon  = ({ active }) => (
  <Icon sw={active ? 2.2 : 1.7}>
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" fill={active ? 'currentColor' : 'none'} />
    <circle cx="12" cy="7" r="4" fill={active ? 'currentColor' : 'none'} />
  </Icon>
);
const MessagesIcon = () => <Icon sw={1.7} d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />;
const GlobeIcon    = () => <Icon sw={1.7}><circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></Icon>;
const UserPlusIcon = () => <Icon sw={1.7}><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="8.5" cy="7" r="4"/><line x1="20" y1="8" x2="20" y2="14"/><line x1="23" y1="11" x2="17" y2="11"/></Icon>;
const SearchIcon   = () => <Icon size={15} sw={2}><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></Icon>;

// ── NAV CONFIG ──────────────────────────────────────────────────────────────
const NAV = [
  { key: 'chats',   label: 'Chats',   Icon: ChatsIcon   },
  { key: 'feed',    label: 'Feed',    Icon: FeedIcon     },
  { key: 'create',  label: '',        Icon: PlusIcon     },
  { key: 'reels',   label: 'Reels',   Icon: ReelsIcon    },
  { key: 'profile', label: 'Profile', Icon: ProfileIcon  },
];

const CHAT_TABS = [
  { key: 'messages',  label: 'Messages', Icon: MessagesIcon },
  { key: 'space',     label: 'Space',    Icon: GlobeIcon    },
  { key: 'requests',  label: 'Requests', Icon: UserPlusIcon },
];

export default function MainApp() {
  const [currentUser, setCurrentUser] = useState(null);
  const [tab, setTab] = useState('chats');
  const [chatTab, setChatTab] = useState('messages');
  const conversationsRef = useRef([]);
  const [conversations, setConversations] = useState([]);
  const [activeChat, setActiveChat] = useState(null);
  const [showChat, setShowChat] = useState(false);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const navigate = useNavigate();
  const refreshRef = useRef(null);
  const isMobile = window.innerWidth <= 768;
  const BASE = process.env.REACT_APP_API_URL?.replace('/api', '') || '';

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

  useEffect(() => {
    if (!currentUser) return;
    const socket = getSocket();
    if (!socket) return;
    const onNewMsg = () => loadConversations();
    socket.on('newMessage', onNewMsg);
    return () => socket.off('newMessage', onNewMsg);
  }, [currentUser]);

  const loadConversations = useCallback(async () => {
    try {
      const res = await api.get('/messages/conversations');
      if (res.data && res.data.length >= 0) {
        conversationsRef.current = res.data;
        setConversations(res.data);
      }
    } catch {}
  }, []);

  const openChat = useCallback((user) => {
    if (!user) return;
    setActiveChat(user);
    setTab('chats');
    setChatTab('messages');
    setShowChat(true);
    setConversations(prev => {
      const exists = prev.find(c => c.id === user.id);
      if (exists) return prev;
      const newConv = { ...user, lastMessage: 'Tap to chat', lastMessageTime: new Date() };
      conversationsRef.current = [newConv, ...prev];
      return [newConv, ...prev];
    });
    setTimeout(loadConversations, 1000);
  }, [loadConversations]);

  const closeChat = useCallback(() => {
    setShowChat(false);
    loadConversations();
  }, [loadConversations]);

  const switchTab = useCallback((key) => {
    if (key === 'create') { setShowCreate(true); return; }
    setTab(key);
    if (key !== 'chats') setShowChat(false);
    if (key === 'chats') setConversations(conversationsRef.current);
  }, []);

  if (loading) return (
    <div className="app-loading">
      <div className="app-loading-spinner" />
      <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Loading Revilla...</p>
    </div>
  );

  const avatarSrc = currentUser?.avatar
    ? (currentUser.avatar.startsWith('http') ? currentUser.avatar : `${BASE}${currentUser.avatar}`)
    : null;

  const filtered = conversations.filter(c =>
    (c.displayName || c.username || '').toLowerCase().includes(search.toLowerCase())
  );

  const inChat = isMobile && tab === 'chats' && showChat;

  // ── CHAT LIST PANEL ─────────────────────────────────────────────────────
  const ChatListPanel = (
    <div className="chat-list-panel">
      <div className="chat-list-header">
        <h2>Chats</h2>
        <button className="chat-new-btn">
          <PlusIcon size={14} /> New
        </button>
      </div>

      {/* Inner tabs */}
      <div className="chat-inner-tabs">
        {CHAT_TABS.map(({ key, label }) => (
          <button key={key}
            className={`chat-inner-tab ${chatTab === key ? 'active' : ''}`}
            onClick={() => setChatTab(key)}>
            {label}
          </button>
        ))}
      </div>

      {/* Messages tab */}
      {chatTab === 'messages' && (
        <>
          <div className="chat-search-wrap">
            <SearchIcon />
            <input placeholder="Search conversations..."
              value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <div className="conversation-list">
            {filtered.length === 0 ? (
              <div className="no-chats">
                <p>No chats yet</p>
                <small>Go to Space to find people</small>
              </div>
            ) : filtered.map(conv => {
              const src = conv.avatar
                ? (conv.avatar.startsWith('http') ? conv.avatar : `${BASE}${conv.avatar}`)
                : null;
              return (
                <div key={conv.id}
                  className={`conversation-item ${activeChat?.id === conv.id ? 'active' : ''}`}
                  onClick={() => openChat(conv)}>
                  <div className="conv-avatar-wrap">
                    {src
                      ? <img src={src} alt="" className="conv-avatar" />
                      : <div className="conv-avatar-placeholder">
                          {(conv.displayName || conv.username || '?')[0].toUpperCase()}
                        </div>}
                    {conv.isOnline && <span className="conv-online-dot" />}
                  </div>
                  <div className="conv-info">
                    <div className="conv-name-row">
                      <span className="conv-name">{conv.displayName || conv.username}</span>
                      {conv.lastMessageTime && (
                        <span className="conv-time">
                          {new Date(conv.lastMessageTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      )}
                    </div>
                    <span className="conv-last-msg">{conv.lastMessage || 'Tap to chat'}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* Space tab */}
      {chatTab === 'space' && (
        <div style={{ flex: 1, overflow: 'hidden' }}>
          <GoSpace currentUser={currentUser} onOpenChat={openChat} />
        </div>
      )}

      {/* Requests tab */}
      {chatTab === 'requests' && (
        <div className="no-chats" style={{ paddingTop: 60 }}>
          <UserPlusIcon />
          <p style={{ marginTop: 12 }}>No requests yet</p>
          <small>Friend requests will appear here</small>
        </div>
      )}
    </div>
  );

  // ── CONTENT ROUTER ───────────────────────────────────────────────────────
  const renderContent = () => {
    if (tab === 'chats') {
      if (isMobile) {
        if (showChat) return (
          <div className="main-content full">
            <ChatWindow conversation={activeChat} currentUser={currentUser} onBack={closeChat} />
          </div>
        );
        return <div className="main-content full">{ChatListPanel}</div>;
      }
      return (
        <div className="main-content split">
          {ChatListPanel}
          <div className="chat-area">
            <ChatWindow conversation={activeChat} currentUser={currentUser} onBack={closeChat} />
          </div>
        </div>
      );
    }
    if (tab === 'feed') return (
      <div className="main-content full">
        <StatusFeed currentUser={currentUser} onOpenChat={openChat} />
      </div>
    );
    if (tab === 'reels') return (
      <div className="main-content full">
        <ReelsPage currentUser={currentUser} />
      </div>
    );
    if (tab === 'profile') return (
      <div className="main-content full">
        <ProfilePage currentUser={currentUser} setCurrentUser={setCurrentUser} />
      </div>
    );
  };

  return (
    <div className="app-shell">

      {/* ── DESKTOP SIDEBAR ── */}
      {!isMobile && (
        <div className="desktop-sidebar">
          <div className="sidebar-logo">R</div>

          {NAV.map(({ key, label, Icon }) => {
            if (key === 'create') return (
              <button key="create" className="sidebar-create-btn"
                onClick={() => setShowCreate(true)} title="Create">
                <Icon size={20} />
              </button>
            );
            const isActive = tab === key;
            return (
              <button key={key}
                className={`sidebar-nav-btn ${isActive ? 'active' : ''}`}
                onClick={() => switchTab(key)} title={label}>
                <Icon active={isActive} />
                <span>{label}</span>
              </button>
            );
          })}

          <div style={{ flex: 1 }} />

          <div className="sidebar-user" onClick={() => switchTab('profile')} title="Profile">
            {avatarSrc
              ? <img src={avatarSrc} alt="" className="sidebar-avatar" />
              : <div className="sidebar-avatar-placeholder">
                  {(currentUser?.displayName || 'U')[0].toUpperCase()}
                </div>}
          </div>
        </div>
      )}

      {/* ── MAIN CONTENT ── */}
      <div className={`app-main ${inChat ? 'in-chat' : ''}`}>
        {renderContent()}
      </div>

      {/* ── MOBILE BOTTOM NAV ── */}
      {isMobile && !inChat && (
        <nav className="mobile-bottom-nav">
          {NAV.map(({ key, label, Icon }) => {
            if (key === 'create') return (
              <button key="create" className="mobile-create-btn"
                onClick={() => setShowCreate(true)}>
                <div className="mobile-create-inner">
                  <Icon size={22} />
                </div>
                <span>‌</span>
              </button>
            );
            const isActive = tab === key;
            return (
              <button key={key}
                className={`mobile-nav-btn ${isActive ? 'active' : ''}`}
                onClick={() => switchTab(key)}>
                <div className="nav-icon-wrap">
                  <Icon active={isActive} />
                </div>
                <span>{label}</span>
              </button>
            );
          })}
        </nav>
      )}

      {/* ── CREATE BOTTOM SHEET ── */}
      {showCreate && (
        <div style={cs.overlay} onClick={() => setShowCreate(false)}>
          <div style={cs.sheet} onClick={e => e.stopPropagation()}>
            <div style={cs.handle} />
            <div style={cs.title}>Create</div>
            {[
              { emoji: '🖼️', label: 'Post',  sub: 'Share a photo or write something' },
              { emoji: '⚡',  label: 'INTA',  sub: 'Original short video — max 10 seconds' },
              { emoji: '🔗',  label: 'OUTA',  sub: 'Embed a TikTok / Instagram / YouTube link' },
            ].map(({ emoji, label, sub }) => (
              <button key={label} style={cs.option} onClick={() => setShowCreate(false)}>
                <div style={cs.optEmoji}>{emoji}</div>
                <div>
                  <div style={cs.optLabel}>{label}</div>
                  <div style={cs.optSub}>{sub}</div>
                </div>
              </button>
            ))}
            <button style={cs.cancel} onClick={() => setShowCreate(false)}>Cancel</button>
          </div>
        </div>
      )}
    </div>
  );
}

const cs = {
  overlay: {
    position: 'fixed', inset: 0,
    background: 'rgba(0,0,0,0.75)',
    zIndex: 200,
    display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
  },
  sheet: {
    width: '100%', maxWidth: 480,
    background: '#13131A',
    borderRadius: '20px 20px 0 0',
    border: '1px solid rgba(255,255,255,0.08)',
    padding: '12px 20px 36px',
    display: 'flex', flexDirection: 'column', gap: 8,
  },
  handle: {
    width: 36, height: 4,
    background: 'rgba(255,255,255,0.12)',
    borderRadius: 99,
    margin: '0 auto 16px',
  },
  title: { fontSize: 16, fontWeight: 700, color: '#fff', marginBottom: 6 },
  option: {
    display: 'flex', alignItems: 'center', gap: 14,
    background: '#1A1A26',
    border: '1px solid rgba(255,255,255,0.07)',
    borderRadius: 14, padding: '14px 16px',
    cursor: 'pointer', textAlign: 'left',
    width: '100%', fontFamily: 'inherit',
  },
  optEmoji: { fontSize: 22, width: 32, textAlign: 'center' },
  optLabel: { fontSize: 14, fontWeight: 600, color: '#fff' },
  optSub:   { fontSize: 12, color: '#555', marginTop: 2 },
  cancel: {
    marginTop: 4,
    background: 'none',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: 12, padding: '12px 0',
    color: '#666', fontSize: 14,
    cursor: 'pointer', fontFamily: 'inherit', width: '100%',
  },
};
