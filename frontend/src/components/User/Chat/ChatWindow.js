import React, { useState, useEffect, useRef, useCallback } from 'react';
import api from '../../../services/api';
import { getSocket } from '../../../services/socket';

// ── ICONS ────────────────────────────────────────────────────────────────────
const I = ({ d, size = 20, fill = 'currentColor' }) => (
  <svg viewBox="0 0 24 24" fill={fill} width={size} height={size} style={{ display: 'block', flexShrink: 0 }}>
    <path d={d} />
  </svg>
);
const SendIcon     = () => <I d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />;
const MicIcon      = () => <I d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm5.91-3c-.49 0-.9.36-.98.85C16.52 14.2 14.47 16 12 16s-4.52-1.8-4.93-4.15c-.08-.49-.49-.85-.98-.85-.61 0-1.09.54-1 1.14.49 3 2.89 5.35 5.91 5.78V20c0 .55.45 1 1 1s1-.45 1-1v-2.08c3.02-.43 5.42-2.78 5.91-5.78.1-.6-.39-1.14-1-1.14z" />;
const StopIcon     = () => <I d="M6 6h12v12H6z" />;
const ImageIcon    = () => <I d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z" />;
const BackIcon     = () => <I d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z" />;
const MoreIcon     = () => <I d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z" />;
const ReplyIcon    = () => <I size={16} d="M10 9V5l-7 7 7 7v-4.1c5 0 8.5 1.6 11 5.1-1-5-4-10-11-11z" />;
const DeleteIcon   = () => <I size={16} d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z" />;
const CallIcon     = () => <I d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z" />;
const VideoIcon    = () => <I d="M17 10.5V7c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1v10c0 .55.45 1 1 1h12c.55 0 1-.45 1-1v-3.5l4 4v-11l-4 4z" />;
const DownIcon     = () => <I d="M7.41 8.59L12 13.17l4.59-4.58L18 10l-6 6-6-6 1.41-1.41z" />;

const EMOJIS = ['❤️','😂','😮','😢','🙏','👍','🔥','😍'];

export default function ChatWindow({ conversation, currentUser, onBack }) {
  const [messages,       setMessages]       = useState([]);
  const [input,          setInput]          = useState('');
  const [typingInfo,     setTypingInfo]     = useState(null);
  const [replyTo,        setReplyTo]        = useState(null);
  const [contextMenu,    setContextMenu]    = useState(null);
  const [emojiPicker,    setEmojiPicker]    = useState(null);
  const [recording,      setRecording]      = useState(false);
  const [recordingTime,  setRecordingTime]  = useState(0);
  const [showScrollBtn,  setShowScrollBtn]  = useState(false);
  const [sending,        setSending]        = useState(false);

  const messagesEndRef    = useRef(null);
  const containerRef      = useRef(null);
  const typingTimeout     = useRef(null);
  const mediaRecorder     = useRef(null);
  const audioChunks       = useRef([]);
  const recordingInterval = useRef(null);
  const isAtBottom        = useRef(true);
  const fileInputRef      = useRef(null);
  const convIdRef         = useRef(null);
  const isMobile          = window.innerWidth <= 768;
  const BASE              = process.env.REACT_APP_API_URL?.replace('/api', '') || '';

  const scrollToBottom = useCallback((force = false) => {
    if (force || isAtBottom.current)
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  const handleScroll = () => {
    const el = containerRef.current;
    if (!el) return;
    isAtBottom.current = el.scrollHeight - el.scrollTop - el.clientHeight < 80;
    setShowScrollBtn(!isAtBottom.current);
  };

  // ── LOAD MESSAGES ──────────────────────────────────────────────────────────
  // FIX: correct endpoint is /messages/conversation/:userId
  useEffect(() => {
    if (!conversation?.id) return;
    convIdRef.current = conversation.id;
    setMessages([]);
    setReplyTo(null);
    setTypingInfo(null);
    setContextMenu(null);

    api.get(`/messages/conversation/${conversation.id}`)
      .then(res => {
        if (convIdRef.current === conversation.id) {
          setMessages(res.data || []);
          setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'auto' }), 100);
        }
      })
      .catch(err => console.error('Load messages failed:', err));
  }, [conversation?.id]);

  // ── SOCKET ─────────────────────────────────────────────────────────────────
  useEffect(() => {
    const socket = getSocket();
    if (!socket || !conversation?.id) return;

    const onNewMsg = (msg) => {
      const relevant =
        (msg.senderId === conversation.id && msg.recipientId === currentUser?.id) ||
        (msg.senderId === currentUser?.id && msg.recipientId === conversation.id) ||
        msg.groupId === conversation.id;
      if (!relevant) return;
      setMessages(prev => prev.find(m => m.id === msg.id) ? prev : [...prev, msg]);
      scrollToBottom();
    };

    const onMsgDeleted = ({ id, deletedForEveryone }) => {
      if (deletedForEveryone)
        setMessages(prev => prev.map(m => m.id === id ? { ...m, deletedForEveryone: true, content: 'This message was deleted' } : m));
      else
        setMessages(prev => prev.filter(m => m.id !== id));
    };

    const onTyping = ({ userId, text }) => {
      if (userId !== conversation.id) return;
      setTypingInfo({ name: conversation.displayName || conversation.username || 'them', text: text || '' });
    };

    const onStopTyping = ({ userId }) => {
      if (userId === conversation.id) setTypingInfo(null);
    };

    socket.on('newMessage', onNewMsg);
    socket.on('messageDeleted', onMsgDeleted);
    socket.on('typing', onTyping);
    socket.on('stopTyping', onStopTyping);
    return () => {
      socket.off('newMessage', onNewMsg);
      socket.off('messageDeleted', onMsgDeleted);
      socket.off('typing', onTyping);
      socket.off('stopTyping', onStopTyping);
    };
  }, [conversation?.id, currentUser?.id, scrollToBottom]);

  useEffect(() => {
    const close = () => { setContextMenu(null); setEmojiPicker(null); };
    document.addEventListener('click', close);
    return () => document.removeEventListener('click', close);
  }, []);

  // ── SEND MESSAGE ───────────────────────────────────────────────────────────
  // FIX: backend uses recipientId not receiverId
  const sendMessage = async (content, type = 'text', mediaFile = null) => {
    if ((!content?.trim() && !mediaFile) || sending) return;
    setSending(true);
    const socket = getSocket();
    try {
      let res;
      if (mediaFile) {
        const fd = new FormData();
        fd.append('media', mediaFile);
        fd.append('recipientId', conversation.id);   // ← FIXED
        fd.append('content', type === 'voice' ? 'Voice message' : 'Image');
        fd.append('type', type);
        if (replyTo) { fd.append('replyToId', replyTo.id); }
        res = await api.post('/messages', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      } else {
        res = await api.post('/messages', {
          content: content.trim(),
          recipientId: conversation.id,              // ← FIXED
          type: 'text',
          ...(replyTo ? { replyToId: replyTo.id } : {})
        });
      }
      const newMsg = res.data;
      setMessages(prev => prev.find(m => m.id === newMsg.id) ? prev : [...prev, newMsg]);
      setInput('');
      setReplyTo(null);
      setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 50);
      socket?.emit('stopTyping', { to: conversation.id });
      socket?.emit('sendMessage', { ...newMsg, to: conversation.id });
    } catch (err) {
      console.error('Send failed:', err?.response?.data || err.message);
      alert('Failed to send message. Please try again.');
    } finally {
      setSending(false);
    }
  };

  const handleInputChange = (e) => {
    setInput(e.target.value);
    const socket = getSocket();
    if (!socket) return;
    socket.emit('typing', { to: conversation?.id, text: e.target.value });
    clearTimeout(typingTimeout.current);
    typingTimeout.current = setTimeout(() => socket.emit('stopTyping', { to: conversation?.id }), 2000);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(input); }
  };

  const deleteMessage = async (msgId, deleteFor) => {
    if (deleteFor === 'everyone')
      setMessages(prev => prev.map(m => m.id === msgId ? { ...m, deletedForEveryone: true, content: 'This message was deleted' } : m));
    else
      setMessages(prev => prev.filter(m => m.id !== msgId));
    setContextMenu(null);
    try {
      await api.delete(`/messages/${msgId}`, { data: { forEveryone: deleteFor === 'everyone' } });
      if (deleteFor === 'everyone')
        getSocket()?.emit('messageDeleted', { id: msgId, deletedForEveryone: true, to: conversation.id });
    } catch (err) { console.error('Delete failed:', err); }
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) sendMessage('', 'image', file);
    e.target.value = '';
  };

  const startRecording = async (e) => {
    e.preventDefault();
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorder.current = new MediaRecorder(stream);
      audioChunks.current = [];
      mediaRecorder.current.ondataavailable = ev => audioChunks.current.push(ev.data);
      mediaRecorder.current.onstop = async () => {
        const blob = new Blob(audioChunks.current, { type: 'audio/webm' });
        await sendMessage('', 'voice', new File([blob], `voice-${Date.now()}.webm`, { type: 'audio/webm' }));
        stream.getTracks().forEach(t => t.stop());
      };
      mediaRecorder.current.start();
      setRecording(true);
      setRecordingTime(0);
      recordingInterval.current = setInterval(() => setRecordingTime(t => t + 1), 1000);
    } catch { alert('Microphone permission denied'); }
  };

  const stopRecording = () => {
    if (mediaRecorder.current && recording) {
      mediaRecorder.current.stop();
      setRecording(false);
      clearInterval(recordingInterval.current);
    }
  };

  const handleLongPress = (e, msg) => {
    e.preventDefault(); e.stopPropagation();
    const rect = e.currentTarget.getBoundingClientRect();
    const y = rect.top > 200 ? rect.top - 160 : rect.bottom + 8;
    setContextMenu({ msgId: msg.id, msg, x: Math.min(rect.left, window.innerWidth - 200), y });
  };

  const formatTime = (s) =>
    `${Math.floor(s / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`;

  const avatarUrl = (a) => !a ? null : a.startsWith('http') ? a : `${BASE}${a}`;

  // ── EMPTY STATE ────────────────────────────────────────────────────────────
  if (!conversation) return (
    <div className="chat-empty">
      <svg viewBox="0 0 24 24" fill="currentColor" width="64" height="64" opacity="0.08">
        <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z"/>
      </svg>
      <h3>Your Messages</h3>
      <p>Select a conversation or go to Space to find people</p>
    </div>
  );

  return (
    <div style={s.window} onClick={() => { setContextMenu(null); setEmojiPicker(null); }}>

      {/* ── HEADER ── */}
      <div style={s.header}>
        {isMobile && (
          <button style={s.iconBtn} onClick={onBack}><BackIcon /></button>
        )}
        <div style={s.headerAvatar}>
          {avatarUrl(conversation.avatar)
            ? <img src={avatarUrl(conversation.avatar)} alt="" style={s.avatarImg} />
            : <div style={s.avatarPlaceholder}>{(conversation.displayName || conversation.username || '?')[0].toUpperCase()}</div>}
          {conversation.isOnline && <span style={s.onlineDot} />}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={s.headerName}>{conversation.displayName || conversation.username}</div>
          <div style={s.headerStatus}>
            {typingInfo
              ? <span style={{ color: '#BF5FFF', fontStyle: 'italic' }}>
                  {typingInfo.text ? `"${typingInfo.text.substring(0, 30)}..."` : 'typing...'}
                </span>
              : <span style={{ color: conversation.isOnline ? '#22c55e' : '#44445A' }}>
                  {conversation.isOnline ? 'online' : 'offline'}
                </span>}
          </div>
        </div>
        <div style={s.headerActions}>
          <button style={s.iconBtn}><CallIcon /></button>
          <button style={s.iconBtn}><VideoIcon /></button>
          <button style={s.iconBtn}><MoreIcon /></button>
        </div>
      </div>

      {/* ── MESSAGES ── */}
      <div style={s.messagesWrap} ref={containerRef} onScroll={handleScroll}>
        {messages.length === 0 && !sending && (
          <div style={s.noMessages}>No messages yet. Say hello 👋</div>
        )}

        {messages.map((msg) => {
          const isMine   = msg.senderId === currentUser?.id;
          const isDeleted = msg.deletedForEveryone;
          let reactions = {};
          try { reactions = JSON.parse(msg.reactions || '{}'); } catch {}
          const hasReactions = Object.values(reactions).some(a => a.length > 0);

          return (
            <div key={msg.id}
              style={{ ...s.msgRow, justifyContent: isMine ? 'flex-end' : 'flex-start' }}
              onContextMenu={(e) => { if (!isDeleted) { e.preventDefault(); handleLongPress(e, msg); } }}
              onTouchStart={(e) => { if (isDeleted) return; const t = setTimeout(() => handleLongPress(e, msg), 600); e.currentTarget._pt = t; }}
              onTouchEnd={(e) => clearTimeout(e.currentTarget._pt)}
              onTouchMove={(e) => clearTimeout(e.currentTarget._pt)}
            >
              <div style={{
                ...s.bubble,
                ...(isMine ? s.bubbleMine : s.bubbleTheirs),
                ...(isDeleted ? s.bubbleDeleted : {}),
              }}>
                {msg.replyToContent && (
                  <div style={s.replyPreview}>
                    <div style={s.replyBar} />
                    <p style={{ fontSize: 11, color: '#888', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{msg.replyToContent}</p>
                  </div>
                )}

                {msg.type === 'image' && msg.mediaUrl
                  ? <img src={`${BASE}${msg.mediaUrl}`} alt="img" style={s.msgImage}
                      onClick={() => window.open(`${BASE}${msg.mediaUrl}`, '_blank')} />
                  : msg.type === 'voice' && msg.mediaUrl
                    ? <audio controls src={`${BASE}${msg.mediaUrl}`} style={{ maxWidth: 200 }} />
                    : <p style={{ margin: 0, fontSize: 14, lineHeight: 1.5, color: isDeleted ? '#44445A' : '#F0F0F5', fontStyle: isDeleted ? 'italic' : 'normal' }}>
                        {msg.content}
                      </p>}

                <div style={s.msgMeta}>
                  <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>
                    {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                  {isMine && !isDeleted && (
                    <svg viewBox="0 0 18 11" width="14" height="9" fill="none">
                      <path d="M1 5.5l4 4L16 1" stroke="rgba(255,255,255,0.4)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  )}
                </div>

                {hasReactions && (
                  <div style={{ display: 'flex', gap: 4, marginTop: 4, flexWrap: 'wrap' }}>
                    {Object.entries(reactions).filter(([,u]) => u.length > 0).map(([emoji, users]) => (
                      <span key={emoji} style={s.reactionPill}>{emoji} {users.length}</span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {typingInfo && (
          <div style={{ ...s.msgRow, justifyContent: 'flex-start' }}>
            <div style={{ ...s.bubble, ...s.bubbleTheirs }}>
              <span style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                {[0,1,2].map(i => (
                  <span key={i} style={{ width: 6, height: 6, borderRadius: '50%', background: '#44445A', animation: `typingDot 1.2s infinite ${i * 0.2}s` }} />
                ))}
              </span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {showScrollBtn && (
        <button style={s.scrollBtn} onClick={() => { isAtBottom.current = true; scrollToBottom(true); }}>
          <DownIcon />
        </button>
      )}

      {/* ── CONTEXT MENU ── */}
      {contextMenu && (
        <div style={{ ...s.contextMenu, top: contextMenu.y, left: contextMenu.x }} onClick={e => e.stopPropagation()}>
          <button style={s.ctxBtn} onClick={() => { setReplyTo(contextMenu.msg); setContextMenu(null); }}><ReplyIcon /> Reply</button>
          <button style={s.ctxBtn} onClick={() => { setEmojiPicker(contextMenu.msgId); setContextMenu(null); }}>😊 React</button>
          <button style={s.ctxBtn} onClick={() => { navigator.clipboard?.writeText(contextMenu.msg.content); setContextMenu(null); }}>📋 Copy</button>
          {contextMenu.msg.senderId === currentUser?.id && !contextMenu.msg.deletedForEveryone && (
            <button style={{ ...s.ctxBtn, ...s.ctxDanger }} onClick={() => deleteMessage(contextMenu.msgId, 'everyone')}><DeleteIcon /> Delete for everyone</button>
          )}
          <button style={{ ...s.ctxBtn, ...s.ctxDanger }} onClick={() => deleteMessage(contextMenu.msgId, 'me')}><DeleteIcon /> Delete for me</button>
        </div>
      )}

      {/* ── EMOJI PICKER ── */}
      {emojiPicker && (
        <div style={s.emojiPicker} onClick={e => e.stopPropagation()}>
          {EMOJIS.map(emoji => (
            <button key={emoji} style={s.emojiBtn} onClick={async () => {
              await api.post(`/messages/${emojiPicker}/react`, { emoji });
              const res = await api.get(`/messages/conversation/${conversation.id}`);
              setMessages(res.data);
              setEmojiPicker(null);
            }}>{emoji}</button>
          ))}
        </div>
      )}

      {/* ── REPLY BAR ── */}
      {replyTo && (
        <div style={s.replyBar2}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1, minWidth: 0 }}>
            <ReplyIcon />
            <span style={{ fontSize: 13, color: '#888', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {replyTo.content?.substring(0, 60)}
            </span>
          </div>
          <button style={{ background: 'none', border: 'none', color: '#666', cursor: 'pointer', fontSize: 16 }} onClick={() => setReplyTo(null)}>✕</button>
        </div>
      )}

      {/* ── INPUT BAR ── */}
      <div style={s.inputBar}>
        {recording ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1 }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#ef4444', animation: 'pulse 1s infinite' }} />
            <span style={{ fontSize: 14, color: '#ef4444', fontWeight: 500 }}>{formatTime(recordingTime)}</span>
            <span style={{ flex: 1, fontSize: 12, color: '#666' }}>Release to send</span>
            <button style={s.iconBtn} onClick={stopRecording}><StopIcon /></button>
          </div>
        ) : (
          <>
            <button style={s.iconBtn} onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }}>
              <ImageIcon />
            </button>
            <input type="file" ref={fileInputRef} accept="image/*"
              style={{ display: 'none' }} onChange={handleImageUpload} />
            <textarea
              style={s.input}
              placeholder="Message..."
              value={input}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              rows={1}
            />
            {input.trim()
              ? <button style={{ ...s.iconBtn, ...s.sendActive }} onClick={() => sendMessage(input)} disabled={sending}>
                  <SendIcon />
                </button>
              : <button style={s.iconBtn}
                  onMouseDown={startRecording} onTouchStart={startRecording}
                  onMouseUp={stopRecording} onTouchEnd={stopRecording}>
                  <MicIcon />
                </button>}
          </>
        )}
      </div>

      <style>{`
        @keyframes typingDot {
          0%,80%,100%{opacity:.3;transform:scale(1)}
          40%{opacity:1;transform:scale(1.3)}
        }
        @keyframes pulse {
          0%,100%{opacity:1} 50%{opacity:.4}
        }
      `}</style>
    </div>
  );
}

// ── STYLES ────────────────────────────────────────────────────────────────────
const s = {
  window: {
    display: 'flex', flexDirection: 'column',
    height: '100%', background: '#0A0A0F',
    position: 'relative', overflow: 'hidden',
  },
  header: {
    display: 'flex', alignItems: 'center', gap: 12,
    padding: '10px 16px',
    background: '#111118',
    borderBottom: '1px solid rgba(255,255,255,0.07)',
    flexShrink: 0,
  },
  headerAvatar: { position: 'relative', flexShrink: 0 },
  avatarImg: { width: 40, height: 40, borderRadius: '50%', objectFit: 'cover' },
  avatarPlaceholder: {
    width: 40, height: 40, borderRadius: '50%',
    background: '#BF5FFF', color: '#fff',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontWeight: 700, fontSize: 16,
  },
  onlineDot: {
    position: 'absolute', bottom: 1, right: 1,
    width: 10, height: 10, borderRadius: '50%',
    background: '#22c55e', border: '2px solid #111118',
  },
  headerName: { fontSize: 14, fontWeight: 600, color: '#F0F0F5' },
  headerStatus: { fontSize: 12, marginTop: 1 },
  headerActions: { display: 'flex', gap: 2, marginLeft: 'auto' },
  iconBtn: {
    background: 'none', border: 'none',
    color: '#8888AA', cursor: 'pointer', padding: 8,
    borderRadius: '50%', display: 'flex',
    alignItems: 'center', justifyContent: 'center',
    transition: 'background 0.15s',
  },
  messagesWrap: {
    flex: 1, overflowY: 'auto', padding: '12px 16px',
    display: 'flex', flexDirection: 'column', gap: 4,
  },
  noMessages: {
    textAlign: 'center', padding: '48px 16px',
    color: '#44445A', fontSize: 14,
  },
  msgRow: { display: 'flex', marginBottom: 2 },
  bubble: {
    maxWidth: '68%', padding: '9px 13px 7px',
    borderRadius: 16, wordBreak: 'break-word',
  },
  bubbleMine: {
    background: '#3D1A5C',
    borderRadius: '16px 16px 4px 16px',
  },
  bubbleTheirs: {
    background: '#13131A',
    border: '1px solid rgba(255,255,255,0.07)',
    borderRadius: '16px 16px 16px 4px',
  },
  bubbleDeleted: { opacity: 0.5 },
  replyPreview: {
    display: 'flex', gap: 8, marginBottom: 6,
    paddingBottom: 6, borderBottom: '1px solid rgba(255,255,255,0.08)',
  },
  replyBar: { width: 3, borderRadius: 2, background: '#BF5FFF', flexShrink: 0 },
  msgMeta: {
    display: 'flex', alignItems: 'center', gap: 4,
    justifyContent: 'flex-end', marginTop: 4,
  },
  msgImage: {
    maxWidth: 220, maxHeight: 220, borderRadius: 10,
    display: 'block', cursor: 'pointer',
  },
  reactionPill: {
    background: 'rgba(255,255,255,0.08)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: 20, padding: '2px 8px',
    fontSize: 12, cursor: 'pointer',
  },
  scrollBtn: {
    position: 'absolute', bottom: 80, right: 16,
    width: 36, height: 36, borderRadius: '50%',
    background: '#1A1A26', border: '1px solid rgba(255,255,255,0.1)',
    color: '#F0F0F5', cursor: 'pointer',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
  contextMenu: {
    position: 'fixed', zIndex: 300,
    background: '#1A1A26', border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: 14, padding: '6px 0',
    boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
    minWidth: 180,
  },
  ctxBtn: {
    display: 'flex', alignItems: 'center', gap: 10,
    width: '100%', background: 'none', border: 'none',
    color: '#F0F0F5', padding: '10px 16px',
    cursor: 'pointer', fontSize: 13, fontFamily: 'inherit',
    textAlign: 'left',
  },
  ctxDanger: { color: '#f15c6d' },
  emojiPicker: {
    position: 'absolute', bottom: 76, right: 16, zIndex: 200,
    background: '#1A1A26', border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: 14, padding: 10,
    display: 'flex', gap: 4, flexWrap: 'wrap', maxWidth: 200,
  },
  emojiBtn: {
    background: 'none', border: 'none', fontSize: 22,
    cursor: 'pointer', padding: 6, borderRadius: 8,
    transition: 'background 0.1s',
  },
  replyBar2: {
    display: 'flex', alignItems: 'center', gap: 10,
    padding: '8px 16px',
    background: '#111118',
    borderTop: '1px solid rgba(255,255,255,0.07)',
    borderLeft: '3px solid #BF5FFF',
  },
  inputBar: {
    display: 'flex', alignItems: 'center', gap: 8,
    padding: '10px 12px',
    background: '#111118',
    borderTop: '1px solid rgba(255,255,255,0.07)',
    flexShrink: 0,
  },
  input: {
    flex: 1, padding: '10px 14px',
    background: '#1A1A26',
    border: '1px solid rgba(255,255,255,0.07)',
    borderRadius: 22, color: '#F0F0F5',
    fontSize: 14, fontFamily: 'inherit',
    outline: 'none', resize: 'none',
    maxHeight: 120, lineHeight: 1.45,
  },
  sendActive: {
    background: '#BF5FFF', color: '#fff',
    borderRadius: '50%', width: 38, height: 38,
    padding: 0,
  },
};
