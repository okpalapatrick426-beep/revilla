import React, { useState, useEffect, useRef, useCallback } from 'react';
import api from '../../../services/api';
import { getSocket } from '../../../services/socket';

// ─── ICONS ───────────────────────────────────────────────────────────────────
const SendIcon = () => <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/></svg>;
const MicIcon = () => <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20"><path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm5.91-3c-.49 0-.9.36-.98.85C16.52 14.2 14.47 16 12 16s-4.52-1.8-4.93-4.15c-.08-.49-.49-.85-.98-.85-.61 0-1.09.54-1 1.14.49 3 2.89 5.35 5.91 5.78V20c0 .55.45 1 1 1s1-.45 1-1v-2.08c3.02-.43 5.42-2.78 5.91-5.78.1-.6-.39-1.14-1-1.14z"/></svg>;
const StopIcon = () => <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20"><path d="M6 6h12v12H6z"/></svg>;
const ImageIcon = () => <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20"><path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z"/></svg>;
const BackIcon = () => <svg viewBox="0 0 24 24" fill="currentColor" width="22" height="22"><path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/></svg>;
const MoreIcon = () => <svg viewBox="0 0 24 24" fill="currentColor" width="22" height="22"><path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"/></svg>;
const ReplyIcon = () => <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16"><path d="M10 9V5l-7 7 7 7v-4.1c5 0 8.5 1.6 11 5.1-1-5-4-10-11-11z"/></svg>;
const DeleteIcon = () => <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16"><path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/></svg>;
const CallIcon = () => <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20"><path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z"/></svg>;
const VideoCallIcon = () => <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20"><path d="M17 10.5V7c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1v10c0 .55.45 1 1 1h12c.55 0 1-.45 1-1v-3.5l4 4v-11l-4 4z"/></svg>;
const SearchIcon = () => <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18"><path d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/></svg>;

// ─── TICK COMPONENTS ─────────────────────────────────────────────────────────
// Single grey tick = pending/sending
// Double grey tick = delivered (sent to server)
// Double blue tick = read by recipient (WhatsApp style)
const SingleTick = () => (
  <svg viewBox="0 0 16 11" width="14" height="9" fill="none" style={{ marginLeft: 3, opacity: 0.6 }}>
    <path d="M1 5.5l4 4L14 1" stroke="rgba(255,255,255,0.7)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const DoubleTick = ({ isRead }) => {
  const color = isRead ? '#53BDEB' : 'rgba(255,255,255,0.6)';
  return (
    <svg viewBox="0 0 18 11" width="16" height="10" fill="none" style={{ marginLeft: 3 }}>
      <path d="M1 5.5l4 4L14 1" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M5 5.5l4 4L18 1" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
};

// ─── TICK LOGIC ──────────────────────────────────────────────────────────────
// readBy is stored as a JSON string array of user IDs in the DB
function isMessageRead(msg, currentUserId, recipientId) {
  if (!msg.readBy) return false;
  let readBy = [];
  try {
    readBy = typeof msg.readBy === 'string' ? JSON.parse(msg.readBy) : msg.readBy;
  } catch { return false; }
  if (!Array.isArray(readBy)) return false;
  // Message is "read" if the recipient's ID is in the readBy array
  return readBy.includes(recipientId) || readBy.includes(String(recipientId));
}

const EMOJIS = ['❤️', '😂', '😮', '😢', '🙏', '👍', '🔥', '😍'];

export default function ChatWindow({ conversation, currentUser, onBack }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [typingInfo, setTypingInfo] = useState(null);
  const [replyTo, setReplyTo] = useState(null);
  const [contextMenu, setContextMenu] = useState(null);
  const [emojiPicker, setEmojiPicker] = useState(null);
  const [recording, setRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [showScrollBtn, setShowScrollBtn] = useState(false);
  const [sending, setSending] = useState(false);
  const [fullscreenImg, setFullscreenImg] = useState(null);
  const [showMenu, setShowMenu] = useState(false);

  const messagesEndRef = useRef(null);
  const containerRef = useRef(null);
  const typingTimeout = useRef(null);
  const mediaRecorder = useRef(null);
  const audioChunks = useRef([]);
  const recordingInterval = useRef(null);
  const isAtBottom = useRef(true);
  const fileInputRef = useRef(null);
  const conversationIdRef = useRef(null);
  const currentRoomRef = useRef(null);
  const isMobile = window.innerWidth <= 768;

  const handleScroll = () => {
    const el = containerRef.current;
    if (!el) return;
    isAtBottom.current = el.scrollHeight - el.scrollTop - el.clientHeight < 80;
    setShowScrollBtn(!isAtBottom.current);
  };

  const scrollToBottom = useCallback((force = false) => {
    if (force || isAtBottom.current) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, []);

  // ─── LOAD MESSAGES + JOIN ROOM ─────────────────────────────────────────────
  useEffect(() => {
    if (!conversation?.id) return;
    const prevRoom = currentRoomRef.current;
    const socket = getSocket();

    // Leave previous room
    if (prevRoom && socket) {
      socket.emit('leaveRoom', prevRoom);
    }

    conversationIdRef.current = conversation.id;
    const newRoom = `dm:${[String(currentUser?.id), String(conversation.id)].sort().join('-')}`;
    currentRoomRef.current = newRoom;

    // Join the new DM room
    if (socket) {
      socket.emit('joinRoom', newRoom);
    }

    setMessages([]);
    setReplyTo(null);
    setTypingInfo(null);
    setContextMenu(null);

    // Load messages from API
    api.get(`/messages/${conversation.id}`)
      .then(res => {
        if (conversationIdRef.current === conversation.id) {
          setMessages(res.data || []);
          setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'auto' }), 100);

          // Fire markRead via socket to update ticks on sender's end
          if (socket && res.data && res.data.length > 0) {
            const unreadIds = res.data
              .filter(m => m.senderId !== currentUser?.id)
              .map(m => m.id);
            if (unreadIds.length > 0) {
              socket.emit('markRead', {
                to: String(conversation.id),
                messageIds: unreadIds,
              });
            }
          }
        }
      })
      .catch(err => console.error('Load messages failed:', err));

    return () => {
      // Leave room on unmount or conversation change
      if (socket && newRoom) {
        socket.emit('leaveRoom', newRoom);
      }
    };
  }, [conversation?.id, currentUser?.id]);

  // ─── SOCKET EVENTS ─────────────────────────────────────────────────────────
  useEffect(() => {
    const socket = getSocket();
    if (!socket || !conversation?.id) return;

    // New message received
    const onNewMessage = (msg) => {
      const relevant =
        (msg.senderId === conversation.id && (msg.recipientId === currentUser?.id || msg.receiverId === currentUser?.id)) ||
        (msg.senderId === currentUser?.id && (msg.recipientId === conversation.id || msg.receiverId === conversation.id)) ||
        msg.groupId === conversation.id;

      if (!relevant) return;

      setMessages(prev => {
        if (prev.find(m => m.id === msg.id)) return prev;
        return [...prev, msg];
      });

      // If message is from other person, auto-mark as read and notify them
      if (msg.senderId !== currentUser?.id) {
        socket.emit('markRead', {
          to: String(msg.senderId),
          messageIds: [msg.id],
        });
        scrollToBottom();
      } else {
        setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 50);
      }
    };

    // Read receipts — update ticks to blue
    const onMessagesRead = ({ messageIds, readBy, conversationWith }) => {
      // If the recipient of our messages has read them
      if (String(conversationWith) === String(conversation.id) || String(readBy) === String(conversation.id)) {
        setMessages(prev => prev.map(m => {
          if (!messageIds.includes(m.id)) return m;
          // Update readBy to include the conversation partner's ID
          let rb = [];
          try { rb = JSON.parse(m.readBy || '[]'); } catch { rb = []; }
          if (!rb.includes(conversation.id)) rb.push(String(conversation.id));
          return { ...m, readBy: JSON.stringify(rb) };
        }));
      }
    };

    const onMsgDeleted = ({ id, deletedForEveryone }) => {
      if (deletedForEveryone) {
        setMessages(prev => prev.map(m =>
          m.id === id ? { ...m, deletedForEveryone: true, content: 'This message was deleted' } : m
        ));
      } else {
        setMessages(prev => prev.filter(m => m.id !== id));
      }
    };

    const onTyping = ({ userId, text }) => {
      if (String(userId) !== String(conversation.id)) return;
      const name = conversation.displayName || conversation.username || 'them';
      setTypingInfo({ name, text: text || '' });
    };

    const onStopTyping = ({ userId }) => {
      if (String(userId) === String(conversation.id)) setTypingInfo(null);
    };

    const onReacted = ({ id, reactions }) => {
      setMessages(prev => prev.map(m =>
        m.id === id ? { ...m, reactions: JSON.stringify(reactions) } : m
      ));
    };

    socket.on('newMessage', onNewMessage);
    socket.on('messagesRead', onMessagesRead);
    socket.on('messageDeleted', onMsgDeleted);
    socket.on('typing', onTyping);
    socket.on('stopTyping', onStopTyping);
    socket.on('messageReacted', onReacted);

    return () => {
      socket.off('newMessage', onNewMessage);
      socket.off('messagesRead', onMessagesRead);
      socket.off('messageDeleted', onMsgDeleted);
      socket.off('typing', onTyping);
      socket.off('stopTyping', onStopTyping);
      socket.off('messageReacted', onReacted);
    };
  }, [conversation?.id, currentUser?.id, scrollToBottom]);

  useEffect(() => {
    const close = () => { setContextMenu(null); setEmojiPicker(null); setShowMenu(false); };
    document.addEventListener('click', close);
    return () => document.removeEventListener('click', close);
  }, []);

  const handleInputChange = (e) => {
    setInput(e.target.value);
    const socket = getSocket();
    if (!socket) return;
    socket.emit('typing', { to: String(conversation?.id), text: e.target.value });
    clearTimeout(typingTimeout.current);
    typingTimeout.current = setTimeout(() => {
      socket.emit('stopTyping', { to: String(conversation?.id) });
    }, 2000);
  };

  const sendMessage = async (content, type = 'text', mediaFile = null) => {
    if ((!content?.trim() && !mediaFile) || sending) return;
    setSending(true);
    const socket = getSocket();

    try {
      let res;
      if (mediaFile) {
        const fd = new FormData();
        fd.append('media', mediaFile);
        fd.append('recipientId', conversation.id);
        fd.append('content', type === 'voice' ? 'Voice message' : type === 'video' ? 'Video' : 'Image');
        fd.append('type', type);
        if (replyTo) {
          fd.append('replyToId', replyTo.id);
          fd.append('replyToContent', replyTo.content);
        }
        res = await api.post('/messages', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      } else {
        res = await api.post('/messages', {
          content: content.trim(),
          recipientId: conversation.id,
          type: 'text',
          ...(replyTo ? { replyToId: replyTo.id, replyToContent: replyTo.content } : {})
        });
      }

      const newMsg = res.data;
      setMessages(prev => prev.find(m => m.id === newMsg.id) ? prev : [...prev, newMsg]);
      setInput('');
      setReplyTo(null);
      setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 50);
      socket?.emit('stopTyping', { to: String(conversation.id) });

    } catch (err) {
      console.error('Send failed:', err);
      alert('Failed to send message. Please try again.');
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(input); }
  };

  const deleteMessage = async (msgId, deleteFor) => {
    if (deleteFor === 'everyone') {
      setMessages(prev => prev.map(m =>
        m.id === msgId ? { ...m, deletedForEveryone: true, content: 'This message was deleted' } : m
      ));
    } else {
      setMessages(prev => prev.filter(m => m.id !== msgId));
    }
    setContextMenu(null);
    try {
      await api.delete(`/messages/${msgId}`, { data: { deleteFor } });
      if (deleteFor === 'everyone') {
        getSocket()?.emit('messageDeleted', {
          id: msgId, deletedForEveryone: true, to: String(conversation.id)
        });
      }
    } catch (err) { console.error('Delete failed:', err); }
  };

  const handleMediaUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const isVideo = file.type.startsWith('video/');
    const isAudio = file.type.startsWith('audio/');
    sendMessage('', isVideo ? 'video' : isAudio ? 'voice' : 'image', file);
    e.target.value = '';
  };

  const startRecording = async (e) => {
    e.preventDefault();
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorder.current = new MediaRecorder(stream);
      audioChunks.current = [];
      mediaRecorder.current.ondataavailable = e => audioChunks.current.push(e.data);
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
    e.preventDefault();
    e.stopPropagation();
    const rect = e.currentTarget.getBoundingClientRect();
    const y = rect.top > 200 ? rect.top - 160 : rect.bottom + 8;
    setContextMenu({
      msgId: msg.id, msg,
      x: Math.min(rect.left, window.innerWidth - 200), y
    });
  };

  const formatTime = (s) =>
    `${Math.floor(s / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`;

  if (!conversation) {
    return (
      <div className="chat-empty">
        <svg viewBox="0 0 24 24" fill="currentColor" width="64" height="64" opacity="0.1">
          <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z"/>
        </svg>
        <h3>Your Messages</h3>
        <p>Select a conversation or go to Space to find people</p>
      </div>
    );
  }

  return (
    <div className="chat-window" onClick={() => { setContextMenu(null); setEmojiPicker(null); }}>

      {/* ─── HEADER ─────────────────────────────────────────────────────────── */}
      <div className="chat-header">
        {isMobile && (
          <button className="icon-btn" onClick={onBack}><BackIcon /></button>
        )}
        <div className="chat-header-avatar">
          {conversation.avatar
            ? <img src={conversation.avatar} alt="" />
            : <div className="avatar-placeholder">
                {(conversation.displayName || conversation.name || '?')[0].toUpperCase()}
              </div>}
          {conversation.isOnline && <span className="online-dot" />}
        </div>
        <div className="chat-header-info">
          <h4>{conversation.displayName || conversation.name || conversation.username}</h4>
          <span className="chat-status">
            {typingInfo ? (
              <span className="typing-status-text">
                {typingInfo.text
                  ? <em className="typing-preview">
                      "{typingInfo.text.substring(0, 30)}{typingInfo.text.length > 30 ? '...' : ''}"
                    </em>
                  : `${typingInfo.name} is typing...`}
              </span>
            ) : conversation.isOnline ? 'online' : 'offline'}
          </span>
        </div>
        <div className="chat-header-actions">
          <button className="icon-btn" title="Voice Call"
            onClick={() => {
              const socket = getSocket();
              socket?.emit('callUser', { to: String(conversation.id), isVideo: false });
            }}>
            <CallIcon />
          </button>
          <button className="icon-btn" title="Video Call"
            onClick={() => {
              const socket = getSocket();
              socket?.emit('callUser', { to: String(conversation.id), isVideo: true });
            }}>
            <VideoCallIcon />
          </button>
          <div style={{ position: 'relative' }}>
            <button className="icon-btn" onClick={(e) => { e.stopPropagation(); setShowMenu(v => !v); }}>
              <MoreIcon />
            </button>
            {showMenu && (
              <div className="context-menu" style={{ top: '40px', right: 0 }} onClick={e => e.stopPropagation()}>
                <button onClick={() => { setShowMenu(false); }}><SearchIcon /> Search messages</button>
                <button onClick={() => { setShowMenu(false); }}>🖼️ Shared media</button>
                <button onClick={() => { setShowMenu(false); }}>🔕 Mute notifications</button>
                <button onClick={() => { setMessages([]); setShowMenu(false); }}>🗑️ Clear chat</button>
                <button className="danger" onClick={() => { setShowMenu(false); }}>🚫 Block user</button>
                <button className="danger" onClick={() => { setShowMenu(false); }}>⚠️ Report</button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ─── MESSAGES ───────────────────────────────────────────────────────── */}
      <div className="messages-container" ref={containerRef} onScroll={handleScroll}>
        {messages.length === 0 && !sending && (
          <div className="no-messages"><p>No messages yet. Say hello 👋</p></div>
        )}

        {messages.map((msg) => {
          const isMine = msg.senderId === currentUser?.id;
          const isDeleted = msg.deletedForEveryone;
          const isRead = isMine && isMessageRead(msg, currentUser?.id, conversation.id);

          let reactions = {};
          try { reactions = JSON.parse(msg.reactions || '{}'); } catch { reactions = {}; }
          const hasReactions = Object.values(reactions).some(a => Array.isArray(a) && a.length > 0);

          return (
            <div key={msg.id} className={`message-row ${isMine ? 'mine' : 'theirs'}`}
              onContextMenu={(e) => { if (!isDeleted) { e.preventDefault(); handleLongPress(e, msg); } }}
              onTouchStart={(e) => {
                if (isDeleted) return;
                const t = setTimeout(() => handleLongPress(e, msg), 600);
                e.currentTarget._pt = t;
              }}
              onTouchEnd={(e) => clearTimeout(e.currentTarget._pt)}
              onTouchMove={(e) => clearTimeout(e.currentTarget._pt)}
            >
              <div className={`message-bubble ${isMine ? 'bubble-mine' : 'bubble-theirs'} ${isDeleted ? 'deleted-msg' : ''}`}>
                {msg.replyToContent && (
                  <div className="reply-preview">
                    <span className="reply-bar-line" />
                    <p>{msg.replyToContent}</p>
                  </div>
                )}

                {/* Image */}
                {msg.type === 'image' && msg.mediaUrl ? (
                  <img
                    src={msg.mediaUrl}
                    alt="img"
                    className="msg-image"
                    onClick={() => setFullscreenImg(msg.mediaUrl)}
                  />
                ) : msg.type === 'video' && msg.mediaUrl ? (
                  /* Video */
                  <video
                    src={msg.mediaUrl}
                    controls
                    className="msg-video"
                    style={{ maxWidth: '100%', borderRadius: 8, maxHeight: 200 }}
                  />
                ) : msg.type === 'voice' && msg.mediaUrl ? (
                  /* Voice note */
                  <div className="voice-note-bubble">
                    <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18" style={{ color: '#BF5FFF', flexShrink: 0 }}>
                      <path d="M12 15c1.66 0 3-1.34 3-3V6c0-1.66-1.34-3-3-3S9 4.34 9 6v6c0 1.66 1.34 3 3 3zm-1-9c0-.55.45-1 1-1s1 .45 1 1v6c0 .55-.45 1-1 1s-1-.45-1-1V6zm6 6c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-2.08c3.39-.49 6-3.39 6-6.92h-2z"/>
                    </svg>
                    <audio controls src={msg.mediaUrl} className="voice-player" />
                  </div>
                ) : (
                  /* Text */
                  <p className={isDeleted ? 'deleted-text' : ''}>{msg.content}</p>
                )}

                {/* Time + Ticks */}
                <div className="message-time">
                  <span>{new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  {isMine && !isDeleted && (
                    msg.id?.toString().startsWith('temp')
                      ? <SingleTick /> // Pending / optimistic
                      : <DoubleTick isRead={isRead} />
                  )}
                </div>

                {hasReactions && (
                  <div className="message-reactions">
                    {Object.entries(reactions)
                      .filter(([, u]) => Array.isArray(u) && u.length > 0)
                      .map(([emoji, users]) => (
                        <span key={emoji} className="reaction-pill">{emoji} {users.length}</span>
                      ))}
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {/* Live typing bubble */}
        {typingInfo && (
          <div className="message-row theirs">
            <div className="message-bubble bubble-theirs typing-bubble">
              {typingInfo.text
                ? <p className="live-typing-text">"{typingInfo.text}"</p>
                : <span className="typing-dots"><span /><span /><span /></span>}
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {showScrollBtn && (
        <button className="scroll-to-bottom-btn" onClick={() => { isAtBottom.current = true; scrollToBottom(true); }}>
          <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18">
            <path d="M7.41 8.59L12 13.17l4.59-4.58L18 10l-6 6-6-6 1.41-1.41z"/>
          </svg>
        </button>
      )}

      {/* ─── CONTEXT MENU ───────────────────────────────────────────────────── */}
      {contextMenu && (
        <div className="context-menu" style={{ top: contextMenu.y, left: contextMenu.x }}
          onClick={e => e.stopPropagation()}>
          <button onClick={() => { setReplyTo(contextMenu.msg); setContextMenu(null); }}>
            <ReplyIcon /> Reply
          </button>
          <button onClick={() => { setEmojiPicker(contextMenu.msgId); setContextMenu(null); }}>
            😊 React
          </button>
          <button onClick={() => { navigator.clipboard?.writeText(contextMenu.msg.content); setContextMenu(null); }}>
            📋 Copy
          </button>
          {contextMenu.msg.senderId === currentUser?.id && !contextMenu.msg.deletedForEveryone && (
            <button className="danger" onClick={() => deleteMessage(contextMenu.msgId, 'everyone')}>
              <DeleteIcon /> Delete for everyone
            </button>
          )}
          <button className="danger" onClick={() => deleteMessage(contextMenu.msgId, 'me')}>
            <DeleteIcon /> Delete for me
          </button>
        </div>
      )}

      {/* ─── EMOJI PICKER ───────────────────────────────────────────────────── */}
      {emojiPicker && (
        <div className="emoji-picker-mini" onClick={e => e.stopPropagation()}>
          {EMOJIS.map(emoji => (
            <button key={emoji} onClick={async () => {
              await api.post(`/messages/${emojiPicker}/react`, { emoji });
              // Reload messages to get updated reactions
              const res = await api.get(`/messages/${conversation.id}`);
              setMessages(res.data);
              setEmojiPicker(null);
            }}>{emoji}</button>
          ))}
        </div>
      )}

      {/* ─── REPLY PREVIEW ──────────────────────────────────────────────────── */}
      {replyTo && (
        <div className="reply-bar-preview">
          <div className="reply-bar-content">
            <ReplyIcon />
            <span>{replyTo.content?.substring(0, 60)}</span>
          </div>
          <button onClick={() => setReplyTo(null)}>✕</button>
        </div>
      )}

      {/* ─── FULLSCREEN IMAGE ───────────────────────────────────────────────── */}
      {fullscreenImg && (
        <div className="fullscreen-overlay" onClick={() => setFullscreenImg(null)}
          style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.95)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 9999, cursor: 'zoom-out'
          }}>
          <img src={fullscreenImg} alt="full"
            style={{ maxWidth: '95vw', maxHeight: '95vh', objectFit: 'contain', borderRadius: 8 }} />
        </div>
      )}

      {/* ─── INPUT BAR ──────────────────────────────────────────────────────── */}
      <div className="chat-input-bar">
        {recording ? (
          <div className="recording-bar">
            <span className="rec-dot" />
            <span className="rec-time">{formatTime(recordingTime)}</span>
            <span style={{ flex: 1, color: '#ef4444', fontSize: '0.8rem' }}>Release to send</span>
            <button className="icon-btn" onClick={stopRecording}><StopIcon /></button>
          </div>
        ) : (
          <>
            <button className="icon-btn attach-btn"
              onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }}>
              <ImageIcon />
            </button>
            <input
              type="file"
              ref={fileInputRef}
              accept="image/*,video/*,audio/*"
              style={{ display: 'none' }}
              onChange={handleMediaUpload}
            />
            <textarea
              className="chat-input"
              placeholder="Message..."
              value={input}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              rows={1}
            />
            {input.trim()
              ? <button className="icon-btn send-btn-active" onClick={() => sendMessage(input)} disabled={sending}>
                  <SendIcon />
                </button>
              : <button className="icon-btn mic-btn"
                  onMouseDown={startRecording} onTouchStart={startRecording}
                  onMouseUp={stopRecording} onTouchEnd={stopRecording}>
                  <MicIcon />
                </button>
            }
          </>
        )}
      </div>
    </div>
  );
}
