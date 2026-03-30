// frontend/src/components/User/Chat/ChatWindow.js — WHATSAPP STYLE COMPLETE
import React, { useState, useEffect, useRef, useCallback } from 'react';
import api from '../../../services/api';
import { getSocket } from '../../../services/socket';

/* ─── SVG Icons ─────────────────────────────────────────────── */
const SendIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" width="22" height="22">
    <path d="M1.101 21.757L23.8 12.028 1.101 2.3l.011 7.912 13.623 1.816-13.623 1.817-.011 7.912z"/>
  </svg>
);
const MicIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" width="22" height="22">
    <path d="M12 1a4 4 0 0 1 4 4v6a4 4 0 0 1-8 0V5a4 4 0 0 1 4-4zm0 2a2 2 0 0 0-2 2v6a2 2 0 0 0 4 0V5a2 2 0 0 0-2-2zm6.5 7.5A6.5 6.5 0 0 1 12 17a6.5 6.5 0 0 1-6.5-6.5H4a8 8 0 0 0 7 7.938V21h2v-2.562A8 8 0 0 0 20 10.5h-1.5z"/>
  </svg>
);
const AttachIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" width="22" height="22">
    <path d="M16.5 6v11.5c0 2.21-1.79 4-4 4s-4-1.79-4-4V5a2.5 2.5 0 0 1 5 0v10.5c0 .83-.67 1.5-1.5 1.5s-1.5-.67-1.5-1.5V6H9v9.5a3 3 0 0 0 6 0V5c0-2.21-1.79-4-4-4S7 2.79 7 5v12.5c0 3.04 2.46 5.5 5.5 5.5s5.5-2.46 5.5-5.5V6h-1.5z"/>
  </svg>
);
const EmojiIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" width="22" height="22">
    <path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm3.5-9c.83 0 1.5-.67 1.5-1.5S16.33 8 15.5 8 14 8.67 14 9.5s.67 1.5 1.5 1.5zm-7 0c.83 0 1.5-.67 1.5-1.5S9.33 8 8.5 8 7 8.67 7 9.5 7.67 11 8.5 11zm3.5 6.5c2.33 0 4.31-1.46 5.11-3.5H6.89c.8 2.04 2.78 3.5 5.11 3.5z"/>
  </svg>
);
const BackIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" width="22" height="22">
    <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/>
  </svg>
);
const MoreIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" width="22" height="22">
    <path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"/>
  </svg>
);
const CallIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" width="21" height="21">
    <path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z"/>
  </svg>
);
const VideoIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" width="22" height="22">
    <path d="M17 10.5V7c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1v10c0 .55.45 1 1 1h12c.55 0 1-.45 1-1v-3.5l4 4v-11l-4 4z"/>
  </svg>
);
const ReplyIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" width="15" height="15">
    <path d="M10 9V5l-7 7 7 7v-4.1c5 0 8.5 1.6 11 5.1-1-5-4-10-11-11z"/>
  </svg>
);
const DeleteIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" width="15" height="15">
    <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>
  </svg>
);
const CopyIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" width="15" height="15">
    <path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"/>
  </svg>
);
const PlayIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18">
    <path d="M8 5v14l11-7z"/>
  </svg>
);
const PauseIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18">
    <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/>
  </svg>
);

/* ─── Tick component ─────────────────────────────────────────── */
const Ticks = ({ msg, currentUserId }) => {
  if (msg.senderId !== currentUserId || msg.deletedForEveryone) return null;
  const readBy = Array.isArray(msg.readBy) ? msg.readBy : [];
  const isRead = readBy.some(id => id !== currentUserId);
  const color = isRead ? '#53bdeb' : 'rgba(255,255,255,0.55)';
  return (
    <svg viewBox="0 0 16 11" width="16" height="11" fill="none" style={{ flexShrink: 0 }}>
      <path d="M11.071.5 4.994 7.5 1.5 4.5" stroke={color} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M14.5.5 8.423 7.5" stroke={color} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
};

/* ─── Voice Note Player ──────────────────────────────────────── */
function VoicePlayer({ src, isMine }) {
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrent] = useState(0);
  const audioRef = useRef(null);

  const toggle = () => {
    const a = audioRef.current;
    if (!a) return;
    if (playing) { a.pause(); setPlaying(false); }
    else { a.play().then(() => setPlaying(true)).catch(() => {}); }
  };

  const fmt = (s) => {
    const t = Math.floor(s || 0);
    return `${Math.floor(t / 60).toString().padStart(2, '0')}:${(t % 60).toString().padStart(2, '0')}`;
  };

  const BASE = (process.env.REACT_APP_API_URL || '').replace('/api', '');
  const fullSrc = src?.startsWith('http') ? src : `${BASE}${src}`;

  return (
    <div className={`voice-player-custom ${isMine ? 'vp-mine' : 'vp-theirs'}`}>
      <audio
        ref={audioRef}
        src={fullSrc}
        onTimeUpdate={() => {
          const a = audioRef.current;
          if (!a) return;
          setCurrent(a.currentTime);
          setProgress(a.duration ? (a.currentTime / a.duration) * 100 : 0);
        }}
        onLoadedMetadata={() => setDuration(audioRef.current?.duration || 0)}
        onEnded={() => { setPlaying(false); setProgress(0); setCurrent(0); }}
      />
      <button className="vp-play-btn" onClick={toggle}>
        {playing ? <PauseIcon /> : <PlayIcon />}
      </button>
      <div className="vp-body">
        <div className="vp-waveform" onClick={(e) => {
          const rect = e.currentTarget.getBoundingClientRect();
          const pct = (e.clientX - rect.left) / rect.width;
          if (audioRef.current) audioRef.current.currentTime = pct * audioRef.current.duration;
        }}>
          {Array.from({ length: 30 }).map((_, i) => {
            const h = 4 + Math.sin(i * 0.8) * 6 + Math.sin(i * 2.1) * 4 + Math.random() * 3;
            const filled = (i / 30) * 100 <= progress;
            return (
              <div key={i} className={`vp-bar ${filled ? 'filled' : ''}`}
                style={{ height: `${Math.max(4, h)}px` }} />
            );
          })}
        </div>
        <span className="vp-time">{playing ? fmt(currentTime) : fmt(duration)}</span>
      </div>
      <div className="vp-mic-icon">
        <MicIcon />
      </div>
    </div>
  );
}

/* ─── Emoji bar ──────────────────────────────────────────────── */
const EMOJIS = ['❤️', '😂', '😮', '😢', '🙏', '👍', '🔥', '😍'];

/* ─── Main Component ─────────────────────────────────────────── */
export default function ChatWindow({ conversation, currentUser, onBack, onStartCall }) {
  const [messages,      setMessages]      = useState([]);
  const [input,         setInput]         = useState('');
  const [typingInfo,    setTypingInfo]    = useState(null);
  const [replyTo,       setReplyTo]       = useState(null);
  const [contextMenu,   setContextMenu]   = useState(null);
  const [emojiPicker,   setEmojiPicker]   = useState(null);
  const [recording,     setRecording]     = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [showScrollBtn, setShowScrollBtn] = useState(false);
  const [sending,       setSending]       = useState(false);
  const [showEmoji,     setShowEmoji]     = useState(false);

  const messagesEndRef    = useRef(null);
  const containerRef      = useRef(null);
  const typingTimeout     = useRef(null);
  const mediaRecorder     = useRef(null);
  const audioChunks       = useRef([]);
  const recordingInterval = useRef(null);
  const isAtBottom        = useRef(true);
  const fileInputRef      = useRef(null);
  const conversationIdRef = useRef(null);
  const textareaRef       = useRef(null);
  const isMobile = window.innerWidth <= 768;
  const BASE = (process.env.REACT_APP_API_URL || '').replace('/api', '');

  const mediaFull = (url) => !url ? '' : url.startsWith('http') ? url : `${BASE}${url}`;

  /* scroll */
  const handleScroll = () => {
    const el = containerRef.current;
    if (!el) return;
    isAtBottom.current = el.scrollHeight - el.scrollTop - el.clientHeight < 100;
    setShowScrollBtn(!isAtBottom.current);
  };
  const scrollToBottom = useCallback((force = false) => {
    if (force || isAtBottom.current) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, []);

  /* load messages */
  useEffect(() => {
    if (!conversation?.id) return;
    conversationIdRef.current = conversation.id;
    setMessages([]);
    setReplyTo(null);
    setTypingInfo(null);
    setContextMenu(null);
    api.get(`/messages/${conversation.id}`)
      .then(res => {
        if (conversationIdRef.current !== conversation.id) return;
        setMessages(res.data || []);
        setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'auto' }), 80);
      })
      .catch(console.error);
  }, [conversation?.id]);

  /* mark read */
  useEffect(() => {
    if (!messages.length || !conversation?.id) return;
    const socket = getSocket();
    const unread = messages
      .filter(m => m.senderId !== currentUser?.id)
      .filter(m => !(Array.isArray(m.readBy) ? m.readBy : []).includes(currentUser?.id))
      .map(m => m.id);
    if (!unread.length) return;
    api.post('/messages/read', { messageIds: unread }).catch(() => {});
    socket?.emit('markRead', { to: conversation.id, messageIds: unread });
    setMessages(prev => prev.map(m =>
      unread.includes(m.id)
        ? { ...m, readBy: [...(Array.isArray(m.readBy) ? m.readBy : []), currentUser.id] }
        : m
    ));
  }, [messages.length, conversation?.id, currentUser?.id]); // eslint-disable-line

  /* socket */
  useEffect(() => {
    const socket = getSocket();
    if (!socket || !conversation?.id) return;

    const onNewMessage = (msg) => {
      const mine   = msg.senderId === currentUser?.id;
      const theirs = msg.senderId === conversation.id;
      const relevant = (mine && (msg.receiverId === conversation.id || msg.recipientId === conversation.id))
        || (theirs && (msg.receiverId === currentUser?.id || msg.recipientId === currentUser?.id))
        || msg.groupId === conversation.id;
      if (!relevant) return;
      setMessages(prev => prev.find(m => m.id === msg.id) ? prev : [...prev, msg]);
      scrollToBottom();
    };

    const onMsgDeleted = ({ id, deletedForEveryone }) => {
      if (deletedForEveryone) {
        setMessages(prev => prev.map(m => m.id === id
          ? { ...m, deletedForEveryone: true, content: 'This message was deleted' } : m));
      } else {
        setMessages(prev => prev.filter(m => m.id !== id));
      }
    };

    const onMessagesRead = ({ messageIds, readBy }) => {
      setMessages(prev => prev.map(m => {
        if (!messageIds.includes(m.id)) return m;
        const rb = Array.isArray(m.readBy) ? m.readBy : [];
        if (rb.includes(readBy)) return m;
        return { ...m, readBy: [...rb, readBy] };
      }));
    };

    const onTyping     = ({ userId, text }) => {
      if (userId !== conversation.id) return;
      setTypingInfo({ name: conversation.displayName || conversation.username || 'them', text: text || '' });
    };
    const onStopTyping = ({ userId }) => { if (userId === conversation.id) setTypingInfo(null); };

    socket.on('newMessage',    onNewMessage);
    socket.on('messageDeleted', onMsgDeleted);
    socket.on('messagesRead',  onMessagesRead);
    socket.on('typing',        onTyping);
    socket.on('stopTyping',    onStopTyping);

    return () => {
      socket.off('newMessage',    onNewMessage);
      socket.off('messageDeleted', onMsgDeleted);
      socket.off('messagesRead',  onMessagesRead);
      socket.off('typing',        onTyping);
      socket.off('stopTyping',    onStopTyping);
    };
  }, [conversation?.id, currentUser?.id, scrollToBottom]);

  useEffect(() => {
    const close = () => { setContextMenu(null); setEmojiPicker(null); setShowEmoji(false); };
    document.addEventListener('click', close);
    return () => document.removeEventListener('click', close);
  }, []);

  /* auto-grow textarea */
  useEffect(() => {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.style.height = 'auto';
    ta.style.height = Math.min(ta.scrollHeight, 120) + 'px';
  }, [input]);

  const handleInputChange = (e) => {
    setInput(e.target.value);
    const socket = getSocket();
    socket?.emit('typing', { to: conversation?.id, text: e.target.value });
    clearTimeout(typingTimeout.current);
    typingTimeout.current = setTimeout(() => socket?.emit('stopTyping', { to: conversation?.id }), 2000);
  };

  /* send */
  const sendMessage = async (content, type = 'text', mediaFile = null) => {
    if ((!content?.trim() && !mediaFile) || sending) return;
    setSending(true);
    const socket = getSocket();
    try {
      let res;
      if (mediaFile) {
        const fd = new FormData();
        fd.append('media', mediaFile);
        fd.append('receiverId', conversation.id);
        fd.append('content', type === 'voice' ? 'Voice message' : 'Image');
        fd.append('type', type);
        if (replyTo) { fd.append('replyToId', replyTo.id); fd.append('replyToContent', replyTo.content); }
        res = await api.post('/messages', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      } else {
        res = await api.post('/messages', {
          content: content.trim(), receiverId: conversation.id, type: 'text',
          ...(replyTo ? { replyToId: replyTo.id, replyToContent: replyTo.content } : {}),
        });
      }
      const newMsg = res.data;
      setMessages(prev => prev.find(m => m.id === newMsg.id) ? prev : [...prev, newMsg]);
      setInput('');
      setReplyTo(null);
      setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 50);
      socket?.emit('stopTyping', { to: conversation.id });
      socket?.emit('sendMessage', { ...newMsg, to: conversation.id, receiverId: conversation.id });
    } catch (err) {
      console.error('Send failed:', err?.response?.data || err);
      alert('Failed to send. Try again.');
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(input); }
  };

  /* delete */
  const deleteMessage = async (msgId, deleteFor) => {
    if (deleteFor === 'everyone') {
      setMessages(prev => prev.map(m => m.id === msgId
        ? { ...m, deletedForEveryone: true, content: 'This message was deleted' } : m));
    } else {
      setMessages(prev => prev.filter(m => m.id !== msgId));
    }
    setContextMenu(null);
    try {
      await api.delete(`/messages/${msgId}`, { data: { deleteFor } });
      if (deleteFor === 'everyone') {
        getSocket()?.emit('messageDeleted', { id: msgId, deletedForEveryone: true, to: conversation.id });
      }
    } catch (err) { console.error('Delete failed:', err); }
  };

  /* image */
  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) sendMessage('', 'image', file);
    e.target.value = '';
  };

  /* voice recording */
  const startRecording = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mime = MediaRecorder.isTypeSupported('audio/webm;codecs=opus') ? 'audio/webm;codecs=opus'
        : MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : '';
      mediaRecorder.current = mime ? new MediaRecorder(stream, { mimeType: mime }) : new MediaRecorder(stream);
      audioChunks.current = [];
      mediaRecorder.current.ondataavailable = ev => { if (ev.data.size > 0) audioChunks.current.push(ev.data); };
      mediaRecorder.current.onstop = async () => {
        const mType = mediaRecorder.current.mimeType || 'audio/webm';
        const ext = mType.includes('ogg') ? '.ogg' : '.webm';
        const blob = new Blob(audioChunks.current, { type: mType });
        if (blob.size > 100) {
          await sendMessage('', 'voice', new File([blob], `voice-${Date.now()}${ext}`, { type: mType }));
        }
        stream.getTracks().forEach(t => t.stop());
      };
      mediaRecorder.current.start(200);
      setRecording(true);
      setRecordingTime(0);
      recordingInterval.current = setInterval(() => setRecordingTime(t => t + 1), 1000);
    } catch { alert('Microphone access denied. Please allow microphone and try again.'); }
  };

  const stopRecording = (e) => {
    e?.preventDefault();
    if (mediaRecorder.current && recording) {
      mediaRecorder.current.stop();
      setRecording(false);
      clearInterval(recordingInterval.current);
    }
  };

  const cancelRecording = () => {
    if (mediaRecorder.current && recording) {
      mediaRecorder.current.onstop = null; // prevent send
      mediaRecorder.current.stop();
      setRecording(false);
      clearInterval(recordingInterval.current);
    }
  };

  /* context menu */
  const handleLongPress = (e, msg) => {
    e.preventDefault();
    e.stopPropagation();
    const rect = e.currentTarget.getBoundingClientRect();
    const menuH = 220;
    const y = rect.top > menuH + 20 ? rect.top - menuH : rect.bottom + 8;
    setContextMenu({ msgId: msg.id, msg, x: Math.min(rect.left, window.innerWidth - 210), y });
  };

  const avatarUrl = (a) => !a ? null : a.startsWith('http') ? a : `${BASE}${a}`;
  const fmtRec = (s) => `${Math.floor(s / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`;

  const convAvatar = avatarUrl(conversation?.avatar);
  const convName   = conversation?.displayName || conversation?.name || conversation?.username || '';

  if (!conversation) {
    return (
      <div className="wa-chat-empty">
        <div className="wa-empty-lock">🔒</div>
        <h3>Your messages are end-to-end encrypted</h3>
        <p>Select a conversation to start chatting</p>
      </div>
    );
  }

  return (
    <div className="wa-chat-window" onClick={() => { setContextMenu(null); setEmojiPicker(null); setShowEmoji(false); }}>

      {/* ── Header ── */}
      <div className="wa-chat-header">
        {isMobile && (
          <button className="wa-icon-btn" onClick={onBack}><BackIcon /></button>
        )}
        <div className="wa-header-avatar" onClick={() => {}}>
          {convAvatar
            ? <img src={convAvatar} alt="" />
            : <div className="wa-avatar-ph">{convName[0]?.toUpperCase() || '?'}</div>}
          {conversation.isOnline && <span className="wa-online-ring" />}
        </div>
        <div className="wa-header-info">
          <span className="wa-header-name">{convName}</span>
          <span className="wa-header-status">
            {typingInfo
              ? <span className="wa-typing-anim">typing<span>.</span><span>.</span><span>.</span></span>
              : conversation.isOnline ? 'online' : 'tap here for contact info'}
          </span>
        </div>
        <div className="wa-header-actions">
          <button className="wa-icon-btn" title="Voice call"
            onClick={() => onStartCall?.(conversation, false)}><CallIcon /></button>
          <button className="wa-icon-btn" title="Video call"
            onClick={() => onStartCall?.(conversation, true)}><VideoIcon /></button>
          <button className="wa-icon-btn"><MoreIcon /></button>
        </div>
      </div>

      {/* ── Messages ── */}
      <div className="wa-messages-bg">
        <div className="wa-messages" ref={containerRef} onScroll={handleScroll}>
          {messages.length === 0 && (
            <div className="wa-no-messages">
              <span>No messages yet — say hello 👋</span>
            </div>
          )}

          {messages.map((msg, idx) => {
            const isMine   = msg.senderId === currentUser?.id;
            const isDeleted = msg.deletedForEveryone;
            let reactions = {};
            try { reactions = typeof msg.reactions === 'string' ? JSON.parse(msg.reactions) : (msg.reactions || {}); } catch {}
            const hasReactions = Object.values(reactions).some(a => a.length > 0);
            const showAvatar = !isMine && (idx === 0 || messages[idx - 1]?.senderId !== msg.senderId);

            return (
              <div key={msg.id}
                className={`wa-msg-row ${isMine ? 'wa-mine' : 'wa-theirs'}`}
                onContextMenu={e => { if (!isDeleted) { e.preventDefault(); handleLongPress(e, msg); } }}
                onTouchStart={e => {
                  if (isDeleted) return;
                  e.currentTarget._pt = setTimeout(() => handleLongPress(e, msg), 600);
                }}
                onTouchEnd={e => clearTimeout(e.currentTarget._pt)}
                onTouchMove={e => clearTimeout(e.currentTarget._pt)}
              >
                {/* Avatar for incoming */}
                {!isMine && (
                  <div className="wa-msg-avatar">
                    {showAvatar && (
                      convAvatar
                        ? <img src={convAvatar} alt="" />
                        : <div className="wa-avatar-ph sm">{convName[0]?.toUpperCase()}</div>
                    )}
                  </div>
                )}

                <div className={`wa-bubble ${isMine ? 'wa-bubble-out' : 'wa-bubble-in'} ${isDeleted ? 'wa-bubble-deleted' : ''}`}>
                  {/* Tail */}
                  {isMine
                    ? <div className="wa-tail-out" />
                    : showAvatar && <div className="wa-tail-in" />}

                  {/* Reply preview */}
                  {msg.replyToContent && (
                    <div className="wa-reply-preview">
                      <div className="wa-reply-bar" />
                      <span>{msg.replyToContent.substring(0, 80)}</span>
                    </div>
                  )}

                  {/* Content */}
                  {isDeleted ? (
                    <p className="wa-deleted-text">
                      <svg viewBox="0 0 24 24" fill="currentColor" width="13" height="13" style={{ marginRight: 4 }}>
                        <path d="M12 2C6.47 2 2 6.47 2 12s4.47 10 10 10 10-4.47 10-10S17.53 2 12 2zm5 13.59L15.59 17 12 13.41 8.41 17 7 15.59 10.59 12 7 8.41 8.41 7 12 10.59 15.59 7 17 8.41 13.41 12 17 15.59z"/>
                      </svg>
                      This message was deleted
                    </p>
                  ) : msg.type === 'image' && msg.mediaUrl ? (
                    <img src={mediaFull(msg.mediaUrl)} alt=""
                      className="wa-msg-image"
                      onError={e => e.target.style.display = 'none'}
                      onClick={() => window.open(mediaFull(msg.mediaUrl), '_blank')} />
                  ) : msg.type === 'voice' && msg.mediaUrl ? (
                    <VoicePlayer src={msg.mediaUrl} isMine={isMine} />
                  ) : (
                    <p className="wa-msg-text">{msg.content}</p>
                  )}

                  {/* Footer: time + ticks */}
                  <div className={`wa-msg-footer ${msg.type === 'image' ? 'wa-footer-overlay' : ''}`}>
                    <span className="wa-msg-time">
                      {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    <Ticks msg={msg} currentUserId={currentUser?.id} />
                  </div>

                  {/* Reactions */}
                  {hasReactions && (
                    <div className="wa-reactions">
                      {Object.entries(reactions).filter(([, u]) => u.length > 0).map(([emoji, users]) => (
                        <span key={emoji} className="wa-reaction-pill">{emoji} {users.length}</span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {/* Typing bubble */}
          {typingInfo && (
            <div className="wa-msg-row wa-theirs">
              <div className="wa-msg-avatar" />
              <div className="wa-bubble wa-bubble-in wa-typing-bubble">
                <div className="wa-typing-dots">
                  <span /><span /><span />
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Scroll to bottom */}
      {showScrollBtn && (
        <button className="wa-scroll-btn"
          onClick={() => { isAtBottom.current = true; scrollToBottom(true); }}>
          <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18">
            <path d="M7.41 8.59L12 13.17l4.59-4.58L18 10l-6 6-6-6 1.41-1.41z"/>
          </svg>
        </button>
      )}

      {/* ── Context menu ── */}
      {contextMenu && (
        <div className="wa-context-menu"
          style={{ top: contextMenu.y, left: contextMenu.x }}
          onClick={e => e.stopPropagation()}>
          <button onClick={() => { setReplyTo(contextMenu.msg); setContextMenu(null); }}>
            <ReplyIcon /> Reply
          </button>
          <button onClick={() => { setEmojiPicker(contextMenu.msgId); setContextMenu(null); }}>
            <EmojiIcon /> React
          </button>
          <button onClick={() => { navigator.clipboard?.writeText(contextMenu.msg.content); setContextMenu(null); }}>
            <CopyIcon /> Copy
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

      {/* ── Emoji reaction picker ── */}
      {emojiPicker && (
        <div className="wa-emoji-picker" onClick={e => e.stopPropagation()}>
          {EMOJIS.map(emoji => (
            <button key={emoji} onClick={async () => {
              await api.post(`/messages/${emojiPicker}/react`, { emoji });
              const res = await api.get(`/messages/${conversation.id}`);
              setMessages(res.data);
              setEmojiPicker(null);
            }}>{emoji}</button>
          ))}
        </div>
      )}

      {/* ── Reply bar ── */}
      {replyTo && (
        <div className="wa-reply-bar-wrap">
          <div className="wa-reply-indicator" />
          <div className="wa-reply-content">
            <span className="wa-reply-label">You</span>
            <span className="wa-reply-text">{replyTo.content?.substring(0, 70)}</span>
          </div>
          <button className="wa-reply-close" onClick={() => setReplyTo(null)}>✕</button>
        </div>
      )}

      {/* ── Input bar ── */}
      <div className="wa-input-area">
        {recording ? (
          <div className="wa-recording-bar">
            <button className="wa-rec-cancel" onClick={cancelRecording}>✕</button>
            <span className="wa-rec-dot" />
            <span className="wa-rec-time">{fmtRec(recordingTime)}</span>
            <div className="wa-rec-label">Recording…</div>
            <button className="wa-rec-send-btn" onClick={stopRecording}>
              <SendIcon />
            </button>
          </div>
        ) : (
          <div className="wa-input-row">
            <div className="wa-input-box">
              <button className="wa-emoji-btn" onClick={e => { e.stopPropagation(); setShowEmoji(s => !s); }}>
                <EmojiIcon />
              </button>
              <textarea
                ref={textareaRef}
                className="wa-textarea"
                placeholder="Message"
                value={input}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                rows={1}
              />
              <button className="wa-attach-btn" onClick={e => { e.stopPropagation(); fileInputRef.current?.click(); }}>
                <AttachIcon />
              </button>
              <input type="file" ref={fileInputRef} accept="image/*" style={{ display: 'none' }} onChange={handleImageUpload} />
            </div>
            {input.trim() ? (
              <button className="wa-send-btn" onClick={() => sendMessage(input)} disabled={sending}>
                <SendIcon />
              </button>
            ) : (
              <button
                className="wa-mic-btn"
                onMouseDown={startRecording}
                onTouchStart={startRecording}
                onMouseUp={stopRecording}
                onTouchEnd={stopRecording}
              >
                <MicIcon />
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
