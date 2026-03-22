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

// ── INLINE SVG ICONS ─────────────────────────────────────────────────────────
const Ic = ({ d, size = 22, sw = 1.8, fill = 'none', stroke = 'currentColor', children }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={fill} stroke={stroke}
    strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round"
    style={{ display: 'block', flexShrink: 0 }}>
    {d && <path d={d} />}{children}
  </svg>
);
const ChatsIcon   = ({ active }) => <Ic sw={active?2.2:1.7} fill={active?'currentColor':'none'} d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z" />;
const FeedIcon    = ({ active }) => (
  <Ic sw={active?2.2:1.7}>
    <rect x="3" y="3" width="7" height="7" rx="1" fill={active?'currentColor':'none'}/>
    <rect x="14" y="3" width="7" height="7" rx="1" fill={active?'currentColor':'none'}/>
    <rect x="3" y="14" width="7" height="7" rx="1" fill={active?'currentColor':'none'}/>
    <rect x="14" y="14" width="7" height="7" rx="1" fill={active?'currentColor':'none'}/>
  </Ic>
);
const PlusIcon    = ({ size = 22 }) => <Ic size={size} sw={2.2} d="M12 5v14M5 12h14" />;
const ReelsIcon   = ({ active }) => (
  <Ic sw={active?2.2:1.7}>
    <rect x="2" y="2" width="20" height="20" rx="3" fill={active?'currentColor':'none'}/>
    <path d="M10 8l6 4-6 4V8z" fill={active?'#fff':'currentColor'} stroke="none"/>
  </Ic>
);
const ProfileIcon = ({ active }) => (
  <Ic sw={active?2.2:1.7}>
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" fill={active?'currentColor':'none'}/>
    <circle cx="12" cy="7" r="4" fill={active?'currentColor':'none'}/>
  </Ic>
);
const SearchIcon  = () => <Ic size={15} sw={2}><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></Ic>;

// ── ONLINE STATUS COLORS ─────────────────────────────────────────────────────
// IN APP  = green   (#22c55e)  — socket connected right now
// ONLINE  = blue    (#3b82f6)  — has internet but not in app
// OFFLINE = gray    (#44445A)  — no internet / disconnected

const STATUS_DOT = {
  'in-app': '#22c55e',
  'online':  '#3b82f6',
  'offline': '#44445A',
};

// ── OFFLINE MESSAGE QUEUE (localStorage) ─────────────────────────────────────
const QUEUE_KEY = 'revilla_offline_queue';
const getQueue  = () => { try { return JSON.parse(localStorage.getItem(QUEUE_KEY) || '[]'); } catch { return []; } };
const saveQueue = (q) => localStorage.setItem(QUEUE_KEY, JSON.stringify(q));
const addToQueue = (msg) => saveQueue([...getQueue(), { ...msg, _queuedAt: Date.now(), _id: Math.random().toString(36) }]);
const removeFromQueue = (id) => saveQueue(getQueue().filter(m => m._id !== id));

// ── CONVERSATION CACHE (localStorage) ────────────────────────────────────────
const CONV_KEY  = 'revilla_conversations';
const getCached = () => { try { return JSON.parse(localStorage.getItem(CONV_KEY) || '[]'); } catch { return []; } };
const cacheConvs = (convs) => localStorage.setItem(CONV_KEY, JSON.stringify(convs));

// ── NAV CONFIG ───────────────────────────────────────────────────────────────
const NAV = [
  { key: 'chats',   label: 'Chats',   Icon: ChatsIcon   },
  { key: 'feed',    label: 'Feed',    Icon: FeedIcon     },
  { key: 'create',  label: '',        Icon: PlusIcon     },
  { key: 'reels',   label: 'Reels',   Icon: ReelsIcon    },
  { key: 'profile', label: 'Profile', Icon: ProfileIcon  },
];

const CHAT_TABS = ['Messages', 'Space', 'Requests'];

// ── NEW CHAT MODAL OPTIONS ───────────────────────────────────────────────────
const NEW_OPTIONS = [
  { key: 'dm',        emoji: '💬', label: 'Private DM',   sub: 'One-on-one direct message' },
  { key: 'group',     emoji: '👥', label: 'Group Chat',   sub: 'Chat with multiple people' },
  { key: 'community', emoji: '🏘️', label: 'Community',    sub: 'Open space for a topic or place' },
  { key: 'channel',   emoji: '📢', label: 'Channel',      sub: 'Broadcast to followers' },
];

export default function MainApp() {
  const [currentUser,  setCurrentUser]  = useState(null);
  const [tab,          setTab]          = useState('chats');
  const [chatTab,      setChatTab]      = useState('Messages');
  const [conversations,setConversations]= useState(() => getCached()); // ← FIX #3: load from cache immediately
  const [onlineUsers,  setOnlineUsers]  = useState({});  // userId → 'in-app' | 'online' | 'offline'
  const [activeChat,   setActiveChat]   = useState(null);
  const [showChat,     setShowChat]     = useState(false);
  const [search,       setSearch]       = useState('');
  const [loading,      setLoading]      = useState(true);
  const [showCreate,   setShowCreate]   = useState(false);
  const [showNewChat,  setShowNewChat]  = useState(false);
  const [isOnline,     setIsOnline]     = useState(navigator.onLine);
  const [pendingQueue, setPendingQueue] = useState(getQueue());

  const convRef    = useRef([]);
  const refreshRef = useRef(null);
  const navigate   = useNavigate();
  const isMobile   = window.innerWidth <= 768;
  const BASE       = process.env.REACT_APP_API_URL?.replace('/api', '') || '';

  // ── FIX #2: track online/offline ─────────────────────────────────────────
  useEffect(() => {
    const goOnline  = () => setIsOnline(true);
    const goOffline = () => setIsOnline(false);
    window.addEventListener('online',  goOnline);
    window.addEventListener('offline', goOffline);
    return () => {
      window.removeEventListener('online',  goOnline);
      window.removeEventListener('offline', goOffline);
    };
  }, []);

  // ── FIX #2: flush offline queue when connection restores ─────────────────
  useEffect(() => {
    if (!isOnline) return;
    const queue = getQueue();
    if (queue.length === 0) return;
    queue.forEach(async (msg) => {
      try {
        await api.post('/messages', { recipientId: msg.recipientId, content: msg.content, type: msg.type || 'text' });
        removeFromQueue(msg._id);
        setPendingQueue(getQueue());
      } catch {}
    });
  }, [isOnline]);

  // ── INIT ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) { navigate('/login'); return; }

    api.get('/auth/me')
      .then(res => {
        setCurrentUser(res.data);
        const socket = initSocket(res.data.id);
        setLoading(false);
        loadConversations();

        // ── FIX #4: track who's in-app vs online vs offline ───────────────
        socket.on('onlineUsers', (list) => {
          const map = {};
          list.forEach(({ userId, inApp }) => { map[userId] = inApp ? 'in-app' : 'online'; });
          setOnlineUsers(map);
        });
        socket.on('userOnline', ({ userId, inApp }) => {
          setOnlineUsers(prev => ({ ...prev, [userId]: inApp ? 'in-app' : 'online' }));
        });
        socket.on('userOffline', ({ userId }) => {
          setOnlineUsers(prev => ({ ...prev, [userId]: 'offline' }));
        });
      })
      .catch(() => { localStorage.removeItem('token'); navigate('/login'); });

    // ── FIX #1: refresh every 2 seconds ───────────────────────────────────
    refreshRef.current = setInterval(loadConversations, 2000);
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

  // ── FIX #3: persist conversations to localStorage on every update ────────
  const loadConversations = useCallback(async () => {
    try {
      const res = await api.get('/messages/conversations');
      if (res.data && Array.isArray(res.data)) {
        convRef.current = res.data;
        setConversations(res.data);
        cacheConvs(res.data); // ← persist so they survive page refresh
      }
    } catch {}
  }, []);

  const openChat = useCallback((user) => {
    if (!user) return;
    setActiveChat(user);
    setTab('chats');
    setChatTab('Messages');
    setShowChat(true);
    setConversations(prev => {
      const exists = prev.find(c => c.id === user.id);
      if (exists) return prev;
      const updated = [{ ...user, lastMessage: 'Tap to chat', lastMessageTime: new Date() }, ...prev];
      cacheConvs(updated);
      convRef.current = updated;
      return updated;
    });
    setTimeout(loadConversations, 800);
  }, [loadConversations]);

  const closeChat = useCallback(() => {
    setShowChat(false);
    loadConversations();
  }, [loadConversations]);

  const switchTab = useCallback((key) => {
    if (key === 'create') { setShowCreate(true); return; }
    setTab(key);
    if (key !== 'chats') setShowChat(false);
    if (key === 'chats') setConversations(convRef.current);
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

  // ── STATUS DOT HELPER ─────────────────────────────────────────────────────
  const getStatus = (userId) => onlineUsers[userId] || (userId ? 'offline' : 'offline');

  // ── CHAT LIST PANEL ───────────────────────────────────────────────────────
  const ChatListPanel = (
    <div className="chat-list-panel">
      <div className="chat-list-header">
        <h2>Chats</h2>
        {/* FIX #5: + New opens new chat modal */}
        <button className="chat-new-btn" onClick={() => setShowNewChat(true)}>
          <PlusIcon size={14} /> New
        </button>
      </div>

      {/* Offline banner */}
      {!isOnline && (
        <div style={ms.offlineBanner}>
          <span style={{ fontSize: 12 }}>⚡</span>
          You're offline — messages will send when you reconnect
          {pendingQueue.length > 0 && <span style={ms.pendingBadge}>{pendingQueue.length} pending</span>}
        </div>
      )}

      {/* Inner tabs */}
      <div className="chat-inner-tabs">
        {CHAT_TABS.map(t => (
          <button key={t} className={`chat-inner-tab ${chatTab === t ? 'active' : ''}`}
            onClick={() => setChatTab(t)}>{t}</button>
        ))}
      </div>

      {/* Messages tab */}
      {chatTab === 'Messages' && (
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
                <small>Tap + New or go to Space</small>
              </div>
            ) : filtered.map(conv => {
              const src = conv.avatar
                ? (conv.avatar.startsWith('http') ? conv.avatar : `${BASE}${conv.avatar}`)
                : null;
              const status = getStatus(conv.id);
              const dotColor = STATUS_DOT[status];
              const hasPending = pendingQueue.some(m => m.recipientId === conv.id);
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
                    {/* FIX #4: 3-state status dot */}
                    <span style={{ ...ms.statusDot, background: dotColor }} title={status} />
                  </div>
                  <div className="conv-info">
                    <div className="conv-name-row">
                      <span className="conv-name">{conv.displayName || conv.username}</span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        {hasPending && <span style={ms.pendingIcon} title="Pending message">⏳</span>}
                        {conv.lastMessageTime && (
                          <span className="conv-time">
                            {new Date(conv.lastMessageTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        )}
                      </div>
                    </div>
                    <span className="conv-last-msg">{conv.lastMessage || 'Tap to chat'}</span>
                    {/* FIX #4: status label */}
                    <span style={{ ...ms.statusLabel, color: dotColor }}>{status}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* Space tab — FIX #4: passes online status map */}
      {chatTab === 'Space' && (
        <div style={{ flex: 1, overflow: 'hidden' }}>
          <GoSpace currentUser={currentUser} onOpenChat={openChat} onlineUsers={onlineUsers} />
        </div>
      )}

      {/* Requests tab */}
      {chatTab === 'Requests' && (
        <div className="no-chats" style={{ paddingTop: 60 }}>
          <p>No requests yet</p>
          <small>Friend requests appear here</small>
        </div>
      )}
    </div>
  );

  // ── CONTENT ROUTER ────────────────────────────────────────────────────────
  const renderContent = () => {
    if (tab === 'chats') {
      if (isMobile) {
        if (showChat) return (
          <div className="main-content full">
            <ChatWindow conversation={activeChat} currentUser={currentUser}
              onBack={closeChat} isOnline={isOnline} onQueue={addToQueue}
              onQueueUpdate={() => setPendingQueue(getQueue())} />
          </div>
        );
        return <div className="main-content full">{ChatListPanel}</div>;
      }
      return (
        <div className="main-content split">
          {ChatListPanel}
          <div className="chat-area">
            <ChatWindow conversation={activeChat} currentUser={currentUser}
              onBack={closeChat} isOnline={isOnline} onQueue={addToQueue}
              onQueueUpdate={() => setPendingQueue(getQueue())} />
          </div>
        </div>
      );
    }
    if (tab === 'feed') return <div className="main-content full"><StatusFeed currentUser={currentUser} onOpenChat={openChat} /></div>;
    if (tab === 'reels') return <div className="main-content full"><ReelsPage currentUser={currentUser} /></div>;
    if (tab === 'profile') return <div className="main-content full"><ProfilePage currentUser={currentUser} setCurrentUser={setCurrentUser} /></div>;
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
            return (
              <button key={key}
                className={`sidebar-nav-btn ${tab === key ? 'active' : ''}`}
                onClick={() => switchTab(key)} title={label}>
                <Icon active={tab === key} />
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
              <button key="create" className="mobile-create-btn" onClick={() => setShowCreate(true)}>
                <div className="mobile-create-inner"><Icon size={22} /></div>
                <span>​</span>
              </button>
            );
            return (
              <button key={key}
                className={`mobile-nav-btn ${tab === key ? 'active' : ''}`}
                onClick={() => switchTab(key)}>
                <div className="nav-icon-wrap"><Icon active={tab === key} /></div>
                <span>{label}</span>
              </button>
            );
          })}
        </nav>
      )}

      {/* ── CREATE BOTTOM SHEET ── */}
      {showCreate && (
        <div style={ms.overlay} onClick={() => setShowCreate(false)}>
          <div style={ms.sheet} onClick={e => e.stopPropagation()}>
            <div style={ms.handle} />
            <div style={ms.sheetTitle}>Create</div>
            {[
              { emoji: '🖼️', label: 'Post',  sub: 'Share a photo or write something' },
              { emoji: '⚡',  label: 'INTA',  sub: 'Original short video — max 10 seconds' },
              { emoji: '🔗',  label: 'OUTA',  sub: 'Embed a TikTok / Instagram / YouTube link' },
            ].map(({ emoji, label, sub }) => (
              <button key={label} style={ms.sheetOption} onClick={() => setShowCreate(false)}>
                <div style={ms.sheetEmoji}>{emoji}</div>
                <div>
                  <div style={ms.sheetOptLabel}>{label}</div>
                  <div style={ms.sheetOptSub}>{sub}</div>
                </div>
              </button>
            ))}
            <button style={ms.sheetCancel} onClick={() => setShowCreate(false)}>Cancel</button>
          </div>
        </div>
      )}

      {/* ── FIX #5: NEW CHAT MODAL ── */}
      {showNewChat && (
        <div style={ms.overlay} onClick={() => setShowNewChat(false)}>
          <div style={ms.sheet} onClick={e => e.stopPropagation()}>
            <div style={ms.handle} />
            <div style={ms.sheetTitle}>New Conversation</div>
            <p style={{ fontSize: 12, color: '#44445A', marginBottom: 12 }}>
              What do you want to create?
            </p>
            {NEW_OPTIONS.map(({ key, emoji, label, sub }) => (
              <button key={key} style={ms.sheetOption} onClick={() => {
                setShowNewChat(false);
                // Switch to Space tab to find people for DM
                if (key === 'dm') { setChatTab('Space'); }
                // Future: open group/community/channel create flows
              }}>
                <div style={{ ...ms.sheetEmoji, fontSize: 20 }}>{emoji}</div>
                <div>
                  <div style={ms.sheetOptLabel}>{label}</div>
                  <div style={ms.sheetOptSub}>{sub}</div>
                </div>
              </button>
            ))}
            <button style={ms.sheetCancel} onClick={() => setShowNewChat(false)}>Cancel</button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── MODAL / SHEET STYLES ─────────────────────────────────────────────────────
const ms = {
  overlay: {
    position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)',
    zIndex: 200, display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
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
    width: 36, height: 4, background: 'rgba(255,255,255,0.12)',
    borderRadius: 99, margin: '0 auto 16px',
  },
  sheetTitle: { fontSize: 16, fontWeight: 700, color: '#fff', marginBottom: 4 },
  sheetOption: {
    display: 'flex', alignItems: 'center', gap: 14,
    background: '#1A1A26', border: '1px solid rgba(255,255,255,0.07)',
    borderRadius: 14, padding: '13px 16px',
    cursor: 'pointer', textAlign: 'left', width: '100%', fontFamily: 'inherit',
    transition: 'background 0.15s',
  },
  sheetEmoji: { fontSize: 22, width: 34, textAlign: 'center' },
  sheetOptLabel: { fontSize: 14, fontWeight: 600, color: '#fff' },
  sheetOptSub:   { fontSize: 12, color: '#555', marginTop: 2 },
  sheetCancel: {
    marginTop: 4, background: 'none',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: 12, padding: '12px 0',
    color: '#666', fontSize: 14,
    cursor: 'pointer', fontFamily: 'inherit', width: '100%',
  },
  offlineBanner: {
    display: 'flex', alignItems: 'center', gap: 8,
    background: 'rgba(239,68,68,0.1)',
    border: '1px solid rgba(239,68,68,0.2)',
    borderRadius: 10, margin: '0 12px 8px',
    padding: '8px 12px', fontSize: 12, color: '#f87171',
  },
  pendingBadge: {
    background: '#ef4444', color: '#fff',
    borderRadius: 20, padding: '2px 7px',
    fontSize: 10, fontWeight: 700, marginLeft: 'auto',
  },
  pendingIcon: { fontSize: 10 },
  statusDot: {
    position: 'absolute', bottom: 1, right: 1,
    width: 10, height: 10, borderRadius: '50%',
    border: '2px solid var(--bg-primary)',
  },
  statusLabel: {
    fontSize: 10, marginTop: 1, textTransform: 'capitalize',
  },
};
