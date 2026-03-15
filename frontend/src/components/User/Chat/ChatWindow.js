import React, { useState, useEffect, useRef, useCallback } from 'react';
import api from '../../../services/api';
import { getSocket } from '../../../services/socket';

// Icons as SVG components (clean, not emoji)
const SendIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
    <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
  </svg>
);
const MicIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
    <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm5.91-3c-.49 0-.9.36-.98.85C16.52 14.2 14.47 16 12 16s-4.52-1.8-4.93-4.15c-.08-.49-.49-.85-.98-.85-.61 0-1.09.54-1 1.14.49 3 2.89 5.35 5.91 5.78V20c0 .55.45 1 1 1s1-.45 1-1v-2.08c3.02-.43 5.42-2.78 5.91-5.78.1-.6-.39-1.14-1-1.14z"/>
  </svg>
);
const StopIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
    <path d="M6 6h12v12H6z"/>
  </svg>
);
const ImageIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
    <path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z"/>
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
const ReplyIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
    <path d="M10 9V5l-7 7 7 7v-4.1c5 0 8.5 1.6 11 5.1-1-5-4-10-11-11z"/>
  </svg>
);
const DeleteIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
    <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>
  </svg>
);
const EmojiIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
    <path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm3.5-9c.83 0 1.5-.67 1.5-1.5S16.33 8 15.5 8 14 8.67 14 9.5s.67 1.5 1.5 1.5zm-7 0c.83 0 1.5-.67 1.5-1.5S9.33 8 8.5 8 7 8.67 7 9.5 7.67 11 8.5 11zm3.5 6.5c2.33 0 4.31-1.46 5.11-3.5H6.89c.8 2.04 2.78 3.5 5.11 3.5z"/>
  </svg>
);
const CallIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" width="22" height="22">
    <path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z"/>
  </svg>
);
const VideoIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" width="22" height="22">
    <path d="M17 10.5V7c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1v10c0 .55.45 1 1 1h12c.55 0 1-.45 1-1v-3.5l4 4v-11l-4 4z"/>
  </svg>
);

const EMOJIS = ['❤️', '😂', '😮', '😢', '🙏', '👍'];

export default function ChatWindow({ conversation, currentUser, onBack }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [otherTyping, setOtherTyping] = useState(false);
  const [replyTo, setReplyTo] = useState(null);
  const [contextMenu, setContextMenu] = useState(null); // { msgId, x, y }
  const [emojiPicker, setEmojiPicker] = useState(null); // msgId
  const [recording, setRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [showScrollBtn, setShowScrollBtn] = useState(false);

  const messagesEndRef = useRef(null);
  const containerRef = useRef(null);
  const typingTimeout = useRef(null);
  const mediaRecorder = useRef(null);
  const audioChunks = useRef([]);
  const recordingInterval = useRef(null);
  const isAtBottom = useRef(true);
  const fileInputRef = useRef(null);
  const isMobile = window.innerWidth <= 768;

  // Scroll tracking
  const handleScroll = () => {
    const el = containerRef.current;
    if (!el) return;
    const atBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 80;
    isAtBottom.current = atBottom;
    setShowScrollBtn(!atBottom);
  };

  const scrollToBottom = useCallback((force = false) => {
    if (force || isAtBottom.current) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, []);

  // Load messages
  useEffect(() => {
    if (!conversation) return;
    setMessages([]);
    setReplyTo(null);
    const fetchMessages = async () => {
      try {
        const res = await api.get(`/messages/${conversation.id}`);
        setMessages(res.data);
        setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'auto' }), 100);
      } catch (err) {
        console.error('Failed to load messages', err);
      }
    };
    fetchMessages();
  }, [conversation?.id]);

  // Socket
  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    socket.on('newMessage', (msg) => {
      const isRelevant =
        (msg.senderId === conversation?.id && msg.receiverId === currentUser?.id) ||
        (msg.senderId === currentUser?.id && msg.receiverId === conversation?.id) ||
        msg.groupId === conversation?.id;
      if (isRelevant) {
        setMessages(prev => {
          const exists = prev.find(m => m.id === msg.id);
          if (exists) return prev;
          return [...prev, msg];
        });
        if (msg.senderId === currentUser?.id) {
          setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 50);
        } else {
          scrollToBottom();
        }
      }
    });

    socket.on('messageDeleted', ({ id, deletedForEveryone }) => {
      if (deletedForEveryone) {
        setMessages(prev => prev.map(m =>
          m.id === id ? { ...m, deletedForEveryone: true, content: 'This message was deleted' } : m
        ));
      } else {
        setMessages(prev => prev.filter(m => m.id !== id));
      }
    });

    socket.on('typing', ({ userId }) => {
      if (userId === conversation?.id) setOtherTyping(true);
    });
    socket.on('stopTyping', ({ userId }) => {
      if (userId === conversation?.id) setOtherTyping(false);
    });

    return () => {
      socket.off('newMessage');
      socket.off('messageDeleted');
      socket.off('typing');
      socket.off('stopTyping');
    };
  }, [conversation?.id, currentUser?.id, scrollToBottom]);

  // Close context menu on outside click
  useEffect(() => {
    const handler = () => { setContextMenu(null); setEmojiPicker(null); };
    document.addEventListener('click', handler);
    return () => document.removeEventListener('click', handler);
  }, []);

  const handleInputChange = (e) => {
    setInput(e.target.value);
    const socket = getSocket();
    if (!socket) return;
    socket.emit('typing', { to: conversation?.id });
    clearTimeout(typingTimeout.current);
    typingTimeout.current = setTimeout(() => {
      socket.emit('stopTyping', { to: conversation?.id });
    }, 1500);
  };

  const sendMessage = async (content, type = 'text', mediaFile = null) => {
    if (!content?.trim() && !mediaFile) return;
    try {
      let res;
      if (mediaFile) {
        const formData = new FormData();
        formData.append('media', mediaFile);
        formData.append('receiverId', conversation?.id);
        formData.append('content', type === 'voice' ? 'Voice message' : 'Image');
        formData.append('type', type);
        if (replyTo) {
          formData.append('replyToId', replyTo.id);
          formData.append('replyToContent', replyTo.content);
        }
        res = await api.post('/messages', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      } else {
        const payload = {
          content: content.trim(),
          receiverId: conversation?.id,
          type: 'text',
        };
        if (replyTo) {
          payload.replyToId = replyTo.id;
          payload.replyToContent = replyTo.content;
        }
        res = await api.post('/messages', payload);
      }
      setMessages(prev => {
        const exists = prev.find(m => m.id === res.data.id);
        if (exists) return prev;
        return [...prev, res.data];
      });
      setInput('');
      setReplyTo(null);
      setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 50);
      const socket = getSocket();
      socket?.emit('stopTyping', { to: conversation?.id });
      socket?.emit('sendMessage', { ...res.data, to: conversation?.id });
    } catch (err) {
      console.error('Send failed', err);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  // Delete message
  const deleteMessage = async (msgId, deleteFor) => {
    try {
      const res = await api.delete(`/messages/${msgId}`, { data: { deleteFor } });
      if (deleteFor === 'everyone') {
        setMessages(prev => prev.map(m =>
          m.id === msgId ? { ...m, deletedForEveryone: true, content: 'This message was deleted' } : m
        ));
        const socket = getSocket();
        socket?.emit('messageDeleted', { id: msgId, deletedForEveryone: true, to: conversation?.id });
      } else {
        setMessages(prev => prev.filter(m => m.id !== msgId));
      }
      setContextMenu(null);
    } catch (err) {
      console.error('Delete failed', err);
    }
  };

  // Image upload
  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) sendMessage('', 'image', file);
    e.target.value = '';
  };

  // Voice recording
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorder.current = new MediaRecorder(stream);
      audioChunks.current = [];
      mediaRecorder.current.ondataavailable = e => audioChunks.current.push(e.data);
      mediaRecorder.current.onstop = async () => {
        const blob = new Blob(audioChunks.current, { type: 'audio/webm' });
        const file = new File([blob], `voice-${Date.now()}.webm`, { type: 'audio/webm' });
        await sendMessage('', 'voice', file);
        stream.getTracks().forEach(t => t.stop());
      };
      mediaRecorder.current.start();
      setRecording(true);
      setRecordingTime(0);
      recordingInterval.current = setInterval(() => setRecordingTime(t => t + 1), 1000);
    } catch (err) {
      alert('Microphone permission denied');
    }
  };

  const stopRecording = () => {
    if (mediaRecorder.current && recording) {
      mediaRecorder.current.stop();
      setRecording(false);
      clearInterval(recordingInterval.current);
      setRecordingTime(0);
    }
  };

  const formatTime = (s) => `${Math.floor(s / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`;

  const handleLongPress = (e, msg) => {
    e.preventDefault();
    const rect = e.currentTarget.getBoundingClientRect();
    setContextMenu({ msgId: msg.id, msg, x: rect.left, y: rect.top - 120 });
  };

  if (!conversation) {
    return (
      <div className="chat-empty">
        <div className="chat-empty-icon">
          <svg viewBox="0 0 24 24" fill="currentColor" width="64" height="64" opacity="0.2">
            <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z"/>
          </svg>
        </div>
        <h3>Your Messages</h3>
        <p>Select a conversation to start chatting</p>
      </div>
    );
  }

  return (
    <div className="chat-window" onClick={() => { setContextMenu(null); setEmojiPicker(null); }}>
      {/* Header */}
      <div className="chat-header">
        {isMobile && (
          <button className="icon-btn back-btn" onClick={onBack}><BackIcon /></button>
        )}
        <div className="chat-header-avatar">
          {conversation.avatar
            ? <img src={conversation.avatar.startsWith('/') ? `${process.env.REACT_APP_API_URL?.replace('/api','')}${conversation.avatar}` : conversation.avatar} alt="" />
            : <div className="avatar-placeholder">{(conversation.displayName || conversation.name || '?')[0].toUpperCase()}</div>
          }
          {conversation.isOnline && <span className="online-dot" />}
        </div>
        <div className="chat-header-info">
          <h4>{conversation.displayName || conversation.name || conversation.username}</h4>
          <span className="chat-status">
            {otherTyping ? 'typing...' : conversation.isOnline ? 'online' : `last seen ${new Date(conversation.lastSeen).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`}
          </span>
        </div>
        <div className="chat-header-actions">
          <button className="icon-btn"><CallIcon /></button>
          <button className="icon-btn"><VideoIcon /></button>
          <button className="icon-btn"><MoreIcon /></button>
        </div>
      </div>

      {/* Messages */}
      <div className="messages-container" ref={containerRef} onScroll={handleScroll}>
        {messages.length === 0 && (
          <div className="no-messages">
            <p>No messages yet. Say hello! 👋</p>
          </div>
        )}
        {messages.map((msg) => {
          const isMine = msg.senderId === currentUser?.id;
          const isDeleted = msg.deletedForEveryone;
          const reactions = JSON.parse(msg.reactions || '{}');
          const hasReactions = Object.keys(reactions).some(k => reactions[k].length > 0);

          return (
            <div
              key={msg.id}
              className={`message-row ${isMine ? 'mine' : 'theirs'}`}
              onContextMenu={(e) => { e.preventDefault(); if (!isDeleted) handleLongPress(e, msg); }}
              onTouchStart={(e) => {
                if (isDeleted) return;
                const timer = setTimeout(() => handleLongPress(e, msg), 500);
                e.currentTarget._pressTimer = timer;
              }}
              onTouchEnd={(e) => clearTimeout(e.currentTarget._pressTimer)}
            >
              <div className={`message-bubble ${isMine ? 'bubble-mine' : 'bubble-theirs'} ${isDeleted ? 'deleted-msg' : ''}`}>
                {/* Reply preview */}
                {msg.replyToContent && (
                  <div className="reply-preview">
                    <span className="reply-bar" />
                    <p>{msg.replyToContent}</p>
                  </div>
                )}
                {/* Content */}
                {msg.type === 'image' && msg.mediaUrl ? (
                  <img
                    src={`${process.env.REACT_APP_API_URL?.replace('/api','')}${msg.mediaUrl}`}
                    alt="img"
                    className="msg-image"
                    onClick={() => window.open(`${process.env.REACT_APP_API_URL?.replace('/api','')}${msg.mediaUrl}`, '_blank')}
                  />
                ) : msg.type === 'voice' && msg.mediaUrl ? (
                  <audio controls src={`${process.env.REACT_APP_API_URL?.replace('/api','')}${msg.mediaUrl}`} className="voice-player" />
                ) : (
                  <p className={isDeleted ? 'deleted-text' : ''}>{msg.content}</p>
                )}
                {/* Time + ticks */}
                <span className="message-time">
                  {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  {isMine && !isDeleted && (
                    <svg viewBox="0 0 16 11" width="16" height="11" fill="none" className="msg-tick">
                      <path d="M11.071.653L5.243 6.53 2.764 4.05 1.35 5.464l3.893 3.893 7.293-7.293L11.07.653zm2.122 0l-7.95 7.95-1.414-1.414" stroke="var(--tick-color, #aaa)" strokeWidth="1.5"/>
                    </svg>
                  )}
                </span>
                {/* Reactions */}
                {hasReactions && (
                  <div className="message-reactions">
                    {Object.entries(reactions).filter(([, users]) => users.length > 0).map(([emoji, users]) => (
                      <span key={emoji} className="reaction-pill">{emoji} {users.length}</span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          );
        })}
        {otherTyping && (
          <div className="message-row theirs">
            <div className="message-bubble bubble-theirs typing-bubble">
              <span className="typing-dots"><span /><span /><span /></span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Scroll to bottom button */}
      {showScrollBtn && (
        <button className="scroll-to-bottom-btn" onClick={() => { isAtBottom.current = true; scrollToBottom(true); }}>
          <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
            <path d="M7.41 8.59L12 13.17l4.59-4.58L18 10l-6 6-6-6 1.41-1.41z"/>
          </svg>
        </button>
      )}

      {/* Context menu */}
      {contextMenu && (
        <div className="context-menu" style={{ top: Math.max(10, contextMenu.y), left: Math.min(contextMenu.x, window.innerWidth - 180) }} onClick={e => e.stopPropagation()}>
          <button onClick={() => { setReplyTo(contextMenu.msg); setContextMenu(null); }}><ReplyIcon /> Reply</button>
          <button onClick={() => { setEmojiPicker(contextMenu.msgId); setContextMenu(null); }}>
            <EmojiIcon /> React
          </button>
          <button onClick={() => { navigator.clipboard.writeText(contextMenu.msg.content); setContextMenu(null); }}>
            <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16"><path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"/></svg> Copy
          </button>
          {contextMenu.msg.senderId === currentUser?.id && (
            <>
              <button className="danger" onClick={() => deleteMessage(contextMenu.msgId, 'everyone')}><DeleteIcon /> Delete for everyone</button>
            </>
          )}
          <button className="danger" onClick={() => deleteMessage(contextMenu.msgId, 'me')}><DeleteIcon /> Delete for me</button>
        </div>
      )}

      {/* Emoji picker */}
      {emojiPicker && (
        <div className="emoji-picker-mini" onClick={e => e.stopPropagation()}>
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

      {/* Reply preview bar */}
      {replyTo && (
        <div className="reply-bar-preview">
          <div className="reply-bar-content">
            <ReplyIcon />
            <span>{replyTo.content?.substring(0, 60)}{replyTo.content?.length > 60 ? '...' : ''}</span>
          </div>
          <button onClick={() => setReplyTo(null)}>✕</button>
        </div>
      )}

      {/* Input */}
      <div className="chat-input-bar">
        {recording ? (
          <div className="recording-bar">
            <span className="rec-dot" />
            <span className="rec-time">{formatTime(recordingTime)}</span>
            <button className="icon-btn stop-rec-btn" onClick={stopRecording}><StopIcon /></button>
          </div>
        ) : (
          <>
            <button className="icon-btn attach-btn" onClick={() => fileInputRef.current?.click()}><ImageIcon /></button>
            <input type="file" ref={fileInputRef} accept="image/*" style={{ display: 'none' }} onChange={handleImageUpload} />
            <textarea
              className="chat-input"
              placeholder="Message..."
              value={input}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              rows={1}
            />
            {input.trim() ? (
              <button className="icon-btn send-btn active" onClick={() => sendMessage(input)}><SendIcon /></button>
            ) : (
              <button className="icon-btn mic-btn" onMouseDown={startRecording} onTouchStart={startRecording}><MicIcon /></button>
            )}
          </>
        )}
      </div>
    </div>
  );
}
