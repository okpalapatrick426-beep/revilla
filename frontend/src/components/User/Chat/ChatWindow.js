import React, { useState, useEffect, useRef, useCallback } from 'react';
import api from '../../../services/api';
import { getSocket } from '../../../services/socket';

// ─── Icons ────────────────────────────────────────────────────────────────────
const SendIcon = () => <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/></svg>;
const MicIcon = () => <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20"><path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm5.91-3c-.49 0-.9.36-.98.85C16.52 14.2 14.47 16 12 16s-4.52-1.8-4.93-4.15c-.08-.49-.49-.85-.98-.85-.61 0-1.09.54-1 1.14.49 3 2.89 5.35 5.91 5.78V20c0 .55.45 1 1 1s1-.45 1-1v-2.08c3.02-.43 5.42-2.78 5.91-5.78.1-.6-.39-1.14-1-1.14z"/></svg>;
const StopIcon = () => <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20"><path d="M6 6h12v12H6z"/></svg>;
const ImageIcon = () => <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20"><path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z"/></svg>;
const BackIcon = () => <svg viewBox="0 0 24 24" fill="currentColor" width="22" height="22"><path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/></svg>;
const MoreIcon = () => <svg viewBox="0 0 24 24" fill="currentColor" width="22" height="22"><path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"/></svg>;
const ReplyIcon = () => <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16"><path d="M10 9V5l-7 7 7 7v-4.1c5 0 8.5 1.6 11 5.1-1-5-4-10-11-11z"/></svg>;
const DeleteIcon = () => <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16"><path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/></svg>;
const CallIcon = () => <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20"><path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z"/></svg>;
const EndCallIcon = () => <svg viewBox="0 0 24 24" fill="currentColor" width="24" height="24"><path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z" transform="rotate(135 12 12)"/></svg>;

const EMOJIS = ['❤️', '😂', '😮', '😢', '🙏', '👍', '🔥', '😍'];

// ─── Read receipt tick component ──────────────────────────────────────────────
const ReadTick = ({ status }) => {
  // status: 'sent' | 'delivered' | 'read'
  if (status === 'read') {
    return (
      <svg viewBox="0 0 18 11" width="18" height="11" fill="none" style={{ display: 'inline-block' }}>
        <path d="M1 5.5l3.5 3.5L13 1" stroke="#4fc3f7" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M5 5.5l3.5 3.5L17 1" stroke="#4fc3f7" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    );
  }
  if (status === 'delivered') {
    return (
      <svg viewBox="0 0 18 11" width="18" height="11" fill="none" style={{ display: 'inline-block' }}>
        <path d="M1 5.5l3.5 3.5L13 1" stroke="rgba(255,255,255,0.5)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M5 5.5l3.5 3.5L17 1" stroke="rgba(255,255,255,0.5)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    );
  }
  // sent — single tick
  return (
    <svg viewBox="0 0 12 11" width="12" height="11" fill="none" style={{ display: 'inline-block' }}>
      <path d="M1 5.5l3.5 3.5L11 1" stroke="rgba(255,255,255,0.5)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
};

// ─── Best supported audio MIME type ──────────────────────────────────────────
const getSupportedAudioMime = () => {
  const types = ['audio/webm;codecs=opus', 'audio/webm', 'audio/ogg;codecs=opus', 'audio/mp4', 'audio/mpeg'];
  for (const t of types) {
    if (MediaRecorder.isTypeSupported(t)) return t;
  }
  return '';
};

// ─── WebRTC config ────────────────────────────────────────────────────────────
const RTC_CONFIG = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
  ],
};

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
  const [uploadProgress, setUploadProgress] = useState(null); // 0-100 or null

  // ── Call state ──────────────────────────────────────────────────────────────
  const [callState, setCallState] = useState(null); // null | 'outgoing' | 'incoming' | 'active'
  const [incomingCall, setIncomingCall] = useState(null); // { from, callType, offer }

  const messagesEndRef = useRef(null);
  const containerRef = useRef(null);
  const typingTimeout = useRef(null);
  const mediaRecorder = useRef(null);
  const audioChunks = useRef([]);
  const recordingInterval = useRef(null);
  const isAtBottom = useRef(true);
  const fileInputRef = useRef(null);
  const conversationIdRef = useRef(null);
  const isMobile = window.innerWidth <= 768;
  const BASE = process.env.REACT_APP_API_URL?.replace('/api', '') || '';

  // WebRTC refs
  const peerConnection = useRef(null);
  const localStream = useRef(null);
  const remoteAudioRef = useRef(null);
  const callTimerRef = useRef(null);
  const [callDuration, setCallDuration] = useState(0);

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

  // ── Compute read receipt status for a message ──────────────────────────────
  const getReceiptStatus = useCallback((msg) => {
    if (msg.senderId !== currentUser?.id) return null;
    const readBy = Array.isArray(msg.readBy) ? msg.readBy : [];
    const deliveredTo = Array.isArray(msg.deliveredTo) ? msg.deliveredTo : [];
    if (readBy.includes(conversation?.id)) return 'read';
    if (deliveredTo.includes(conversation?.id)) return 'delivered';
    return 'sent';
  }, [currentUser?.id, conversation?.id]);

  // ── Mark messages as read when conversation opens / new message arrives ────
  const markMessagesRead = useCallback((msgs) => {
    const socket = getSocket();
    if (!socket || !conversation?.id) return;
    const unread = msgs
      .filter(m => m.senderId === conversation.id && !(Array.isArray(m.readBy) ? m.readBy : []).includes(currentUser?.id))
      .map(m => m.id);
    if (unread.length === 0) return;
    socket.emit('markRead', { to: conversation.id, messageIds: unread });
    // Optimistically update local state
    setMessages(prev => prev.map(m =>
      unread.includes(m.id)
        ? { ...m, readBy: [...(Array.isArray(m.readBy) ? m.readBy : []), currentUser?.id] }
        : m
    ));
  }, [conversation?.id, currentUser?.id]);

  // ── Load messages ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (!conversation?.id) return;
    conversationIdRef.current = conversation.id;
    setMessages([]);
    setReplyTo(null);
    setTypingInfo(null);
    setContextMenu(null);

    api.get(`/messages/${conversation.id}`)
      .then(res => {
        if (conversationIdRef.current === conversation.id) {
          const msgs = res.data || [];
          setMessages(msgs);
          setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'auto' }), 100);
          markMessagesRead(msgs);
        }
      })
      .catch(err => console.error('Load messages failed:', err));
  }, [conversation?.id, markMessagesRead]);

  // ── Socket events ──────────────────────────────────────────────────────────
  useEffect(() => {
    const socket = getSocket();
    if (!socket || !conversation?.id) return;

    const onNewMessage = (msg) => {
      const relevant =
        (msg.senderId === conversation.id && msg.receiverId === currentUser?.id) ||
        (msg.senderId === currentUser?.id && msg.receiverId === conversation.id) ||
        msg.groupId === conversation.id;
      if (!relevant) return;
      setMessages(prev => {
        if (prev.find(m => m.id === msg.id)) return prev;
        const updated = [...prev, msg];
        // Mark as read immediately if it's from the other person
        if (msg.senderId === conversation.id) {
          setTimeout(() => markMessagesRead([msg]), 200);
        }
        return updated;
      });
      scrollToBottom();
    };

    // Someone read our messages — update ticks to blue
    const onMessagesRead = ({ messageIds, readBy }) => {
      if (readBy !== conversation.id) return;
      setMessages(prev => prev.map(m =>
        messageIds.includes(m.id)
          ? { ...m, readBy: [...(Array.isArray(m.readBy) ? m.readBy : []), readBy] }
          : m
      ));
    };

    // Message delivered
    const onMessageDelivered = ({ messageId, to }) => {
      if (to !== conversation.id) return;
      setMessages(prev => prev.map(m =>
        m.id === messageId
          ? { ...m, deliveredTo: [...(Array.isArray(m.deliveredTo) ? m.deliveredTo : []), to] }
          : m
      ));
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
      if (userId !== conversation.id) return;
      setTypingInfo({ name: conversation.displayName || conversation.username || 'them', text: text || '' });
    };

    const onStopTyping = ({ userId }) => {
      if (userId === conversation.id) setTypingInfo(null);
    };

    // ── Call events ─────────────────────────────────────────────────────────
    const onCallOffer = ({ from, offer, callType, callerInfo }) => {
      if (from !== conversation.id) return; // only handle calls from current chat
      setIncomingCall({ from, offer, callType, callerInfo });
      setCallState('incoming');
    };

    const onCallAnswer = async ({ answer }) => {
      try {
        if (peerConnection.current) {
          await peerConnection.current.setRemoteDescription(new RTCSessionDescription(answer));
        }
      } catch (err) { console.error('setRemoteDescription error:', err); }
    };

    const onIceCandidate = async ({ candidate }) => {
      try {
        if (peerConnection.current && candidate) {
          await peerConnection.current.addIceCandidate(new RTCIceCandidate(candidate));
        }
      } catch (err) { console.error('addIceCandidate error:', err); }
    };

    const onCallEnd = () => endCall(false);
    const onCallReject = () => { endCall(false); };

    socket.on('newMessage', onNewMessage);
    socket.on('messagesRead', onMessagesRead);
    socket.on('messageDelivered', onMessageDelivered);
    socket.on('messageDeleted', onMsgDeleted);
    socket.on('typing', onTyping);
    socket.on('stopTyping', onStopTyping);
    socket.on('callOffer', onCallOffer);
    socket.on('callAnswer', onCallAnswer);
    socket.on('iceCandidate', onIceCandidate);
    socket.on('callEnd', onCallEnd);
    socket.on('callReject', onCallReject);

    return () => {
      socket.off('newMessage', onNewMessage);
      socket.off('messagesRead', onMessagesRead);
      socket.off('messageDelivered', onMessageDelivered);
      socket.off('messageDeleted', onMsgDeleted);
      socket.off('typing', onTyping);
      socket.off('stopTyping', onStopTyping);
      socket.off('callOffer', onCallOffer);
      socket.off('callAnswer', onCallAnswer);
      socket.off('iceCandidate', onIceCandidate);
      socket.off('callEnd', onCallEnd);
      socket.off('callReject', onCallReject);
    };
  }, [conversation?.id, currentUser?.id, scrollToBottom, markMessagesRead]);

  useEffect(() => {
    const close = () => { setContextMenu(null); setEmojiPicker(null); };
    document.addEventListener('click', close);
    return () => document.removeEventListener('click', close);
  }, []);

  const handleInputChange = (e) => {
    setInput(e.target.value);
    const socket = getSocket();
    if (!socket) return;
    socket.emit('typing', { to: conversation?.id, text: e.target.value });
    clearTimeout(typingTimeout.current);
    typingTimeout.current = setTimeout(() => socket.emit('stopTyping', { to: conversation?.id }), 2000);
  };

  // ── Send message ───────────────────────────────────────────────────────────
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
        if (replyTo) {
          fd.append('replyToId', replyTo.id);
          fd.append('replyToContent', replyTo.content);
        }
        res = await api.post('/messages', fd, {
          headers: { 'Content-Type': 'multipart/form-data' },
          onUploadProgress: (e) => {
            if (e.total) setUploadProgress(Math.round((e.loaded * 100) / e.total));
          },
        });
        setUploadProgress(null);
      } else {
        res = await api.post('/messages', {
          content: content.trim(),
          receiverId: conversation.id,
          type: 'text',
          ...(replyTo ? { replyToId: replyTo.id, replyToContent: replyTo.content } : {}),
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
      console.error('Send failed:', err);
      setUploadProgress(null);
      alert('Failed to send. Please try again.');
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
        getSocket()?.emit('messageDeleted', { id: msgId, deletedForEveryone: true, to: conversation.id });
      }
    } catch (err) { console.error('Delete failed:', err); }
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    // Validate on client
    if (!file.type.startsWith('image/')) { alert('Please select an image file'); return; }
    if (file.size > 10 * 1024 * 1024) { alert('Image too large (max 10MB)'); return; }
    sendMessage('', 'image', file);
    e.target.value = '';
  };

  // ── Voice recording ────────────────────────────────────────────────────────
  const startRecording = async (e) => {
    e.preventDefault();
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mimeType = getSupportedAudioMime();
      const options = mimeType ? { mimeType } : {};
      mediaRecorder.current = new MediaRecorder(stream, options);
      audioChunks.current = [];
      mediaRecorder.current.ondataavailable = e => { if (e.data.size > 0) audioChunks.current.push(e.data); };
      mediaRecorder.current.onstop = async () => {
        const actualMime = mediaRecorder.current.mimeType || 'audio/webm';
        const ext = actualMime.includes('ogg') ? '.ogg' : actualMime.includes('mp4') ? '.m4a' : '.webm';
        const blob = new Blob(audioChunks.current, { type: actualMime });
        const file = new File([blob], `voice-${Date.now()}${ext}`, { type: actualMime });
        await sendMessage('', 'voice', file);
        stream.getTracks().forEach(t => t.stop());
      };
      mediaRecorder.current.start(100); // collect in 100ms chunks
      setRecording(true);
      setRecordingTime(0);
      recordingInterval.current = setInterval(() => setRecordingTime(t => t + 1), 1000);
    } catch {
      alert('Microphone permission denied');
    }
  };

  const stopRecording = () => {
    if (mediaRecorder.current && recording) {
      mediaRecorder.current.stop();
      setRecording(false);
      clearInterval(recordingInterval.current);
    }
  };

  const cancelRecording = () => {
    if (mediaRecorder.current && recording) {
      mediaRecorder.current.ondataavailable = null;
      mediaRecorder.current.onstop = null;
      try { mediaRecorder.current.stop(); } catch {}
      setRecording(false);
      clearInterval(recordingInterval.current);
      setRecordingTime(0);
    }
  };

  // ── WebRTC voice call ──────────────────────────────────────────────────────
  const createPeer = () => {
    const pc = new RTCPeerConnection(RTC_CONFIG);
    pc.onicecandidate = ({ candidate }) => {
      if (candidate) {
        getSocket()?.emit('iceCandidate', { to: conversation.id, candidate });
      }
    };
    pc.ontrack = (e) => {
      if (remoteAudioRef.current) remoteAudioRef.current.srcObject = e.streams[0];
    };
    return pc;
  };

  const startCall = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
      localStream.current = stream;
      peerConnection.current = createPeer();
      stream.getTracks().forEach(t => peerConnection.current.addTrack(t, stream));
      const offer = await peerConnection.current.createOffer();
      await peerConnection.current.setLocalDescription(offer);
      getSocket()?.emit('callOffer', {
        to: conversation.id,
        offer,
        callType: 'voice',
        callerInfo: { id: currentUser?.id, displayName: currentUser?.displayName, avatar: currentUser?.avatar },
      });
      setCallState('outgoing');
      setCallDuration(0);
    } catch (err) {
      console.error('Call start error:', err);
      alert('Could not start call. Check microphone permissions.');
    }
  };

  const answerCall = async () => {
    if (!incomingCall) return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
      localStream.current = stream;
      peerConnection.current = createPeer();
      stream.getTracks().forEach(t => peerConnection.current.addTrack(t, stream));
      await peerConnection.current.setRemoteDescription(new RTCSessionDescription(incomingCall.offer));
      const answer = await peerConnection.current.createAnswer();
      await peerConnection.current.setLocalDescription(answer);
      getSocket()?.emit('callAnswer', { to: incomingCall.from, answer });
      setCallState('active');
      setIncomingCall(null);
      callTimerRef.current = setInterval(() => setCallDuration(d => d + 1), 1000);
    } catch (err) {
      console.error('Answer call error:', err);
    }
  };

  const rejectCall = () => {
    getSocket()?.emit('callReject', { to: incomingCall?.from || conversation.id });
    setCallState(null);
    setIncomingCall(null);
  };

  const endCall = useCallback((notify = true) => {
    if (notify) getSocket()?.emit('callEnd', { to: conversation.id });
    if (peerConnection.current) { peerConnection.current.close(); peerConnection.current = null; }
    if (localStream.current) { localStream.current.getTracks().forEach(t => t.stop()); localStream.current = null; }
    if (remoteAudioRef.current) remoteAudioRef.current.srcObject = null;
    clearInterval(callTimerRef.current);
    setCallState(null);
    setIncomingCall(null);
    setCallDuration(0);
  }, [conversation?.id]);

  // Set call as active once peer connects
  useEffect(() => {
    if (!peerConnection.current) return;
    peerConnection.current.onconnectionstatechange = () => {
      if (peerConnection.current?.connectionState === 'connected') {
        setCallState('active');
        callTimerRef.current = setInterval(() => setCallDuration(d => d + 1), 1000);
      }
      if (['disconnected', 'failed', 'closed'].includes(peerConnection.current?.connectionState)) {
        endCall(false);
      }
    };
  }, [callState, endCall]);

  const handleLongPress = (e, msg) => {
    e.preventDefault();
    e.stopPropagation();
    const rect = e.currentTarget.getBoundingClientRect();
    const y = rect.top > 200 ? rect.top - 160 : rect.bottom + 8;
    setContextMenu({ msgId: msg.id, msg, x: Math.min(rect.left, window.innerWidth - 200), y });
  };

  const avatarUrl = (a) => !a ? null : a.startsWith('http') ? a : `${BASE}${a}`;
  const formatTime = (s) => `${Math.floor(s / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`;

  if (!conversation) {
    return (
      <div className="chat-empty">
        <svg viewBox="0 0 24 24" fill="currentColor" width="64" height="64" opacity="0.1"><path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z"/></svg>
        <h3>Your Messages</h3>
        <p>Select a conversation or go to Space to find people</p>
      </div>
    );
  }

  return (
    <div className="chat-window" onClick={() => { setContextMenu(null); setEmojiPicker(null); }}>
      {/* Hidden audio element for receiving call audio */}
      <audio ref={remoteAudioRef} autoPlay playsInline style={{ display: 'none' }} />

      {/* ── Incoming call overlay ─────────────────────────────────────────── */}
      {callState === 'incoming' && (
        <div className="call-overlay incoming">
          <div className="call-card">
            <div className="call-avatar">
              {avatarUrl(conversation.avatar)
                ? <img src={avatarUrl(conversation.avatar)} alt="" />
                : <div className="call-avatar-ph">{(conversation.displayName || '?')[0].toUpperCase()}</div>}
            </div>
            <p className="call-label">Incoming voice call...</p>
            <h3>{conversation.displayName || conversation.username}</h3>
            <div className="call-buttons">
              <button className="call-btn reject" onClick={rejectCall}><EndCallIcon /></button>
              <button className="call-btn answer" onClick={answerCall}><CallIcon /></button>
            </div>
          </div>
        </div>
      )}

      {/* ── Outgoing / active call bar ────────────────────────────────────── */}
      {(callState === 'outgoing' || callState === 'active') && (
        <div className="call-bar">
          <span className="call-bar-dot" />
          <span className="call-bar-info">
            {callState === 'outgoing' ? 'Calling...' : `🔊 ${formatTime(callDuration)}`}
          </span>
          <button className="call-bar-end" onClick={() => endCall(true)}><EndCallIcon /></button>
        </div>
      )}

      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div className="chat-header">
        {isMobile && <button className="icon-btn" onClick={onBack}><BackIcon /></button>}
        <div className="chat-header-avatar">
          {avatarUrl(conversation.avatar)
            ? <img src={avatarUrl(conversation.avatar)} alt="" />
            : <div className="avatar-placeholder">{(conversation.displayName || conversation.name || '?')[0].toUpperCase()}</div>}
          {conversation.isOnline && <span className="online-dot" />}
        </div>
        <div className="chat-header-info">
          <h4>{conversation.displayName || conversation.name || conversation.username}</h4>
          <span className="chat-status">
            {typingInfo
              ? <span className="typing-status-text">
                  {typingInfo.text
                    ? <><span className="typing-name">{typingInfo.name}</span>: <em className="typing-preview">"{typingInfo.text.substring(0, 25)}{typingInfo.text.length > 25 ? '...' : ''}"</em></>
                    : <><span className="typing-name">{typingInfo.name}</span> is typing...</>}
                </span>
              : conversation.isOnline ? 'online' : 'offline'}
          </span>
        </div>
        <div className="chat-header-actions">
          <button className="icon-btn" onClick={startCall} title="Voice call"><CallIcon /></button>
          <button className="icon-btn"><MoreIcon /></button>
        </div>
      </div>

      {/* ── Messages ─────────────────────────────────────────────────────── */}
      <div className="messages-container" ref={containerRef} onScroll={handleScroll}>
        {messages.length === 0 && !sending && (
          <div className="no-messages"><p>No messages yet. Say hello 👋</p></div>
        )}
        {messages.map((msg) => {
          const isMine = msg.senderId === currentUser?.id;
          const isDeleted = msg.deletedForEveryone;
          const receiptStatus = getReceiptStatus(msg);
          const reactions = (() => { try { return typeof msg.reactions === 'string' ? JSON.parse(msg.reactions) : (msg.reactions || {}); } catch { return {}; } })();
          const hasReactions = Object.values(reactions).some(a => a.length > 0);
          const mediaBase = msg.mediaUrl?.startsWith('http') ? '' : BASE;

          return (
            <div
              key={msg.id}
              className={`message-row ${isMine ? 'mine' : 'theirs'}`}
              onContextMenu={(e) => { if (!isDeleted) { e.preventDefault(); handleLongPress(e, msg); } }}
              onTouchStart={(e) => { if (isDeleted) return; const t = setTimeout(() => handleLongPress(e, msg), 600); e.currentTarget._pt = t; }}
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
                {msg.type === 'image' && msg.mediaUrl ? (
                  <img
                    src={`${mediaBase}${msg.mediaUrl}`}
                    alt="img"
                    className="msg-image"
                    onClick={() => window.open(`${mediaBase}${msg.mediaUrl}`, '_blank')}
                  />
                ) : msg.type === 'voice' && msg.mediaUrl ? (
                  <audio
                    controls
                    preload="metadata"
                    src={`${mediaBase}${msg.mediaUrl}`}
                    className="voice-player"
                  />
                ) : (
                  <p className={isDeleted ? 'deleted-text' : ''}>{msg.content}</p>
                )}
                <div className="message-time">
                  <span>{new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  {isMine && !isDeleted && <ReadTick status={receiptStatus} />}
                </div>
                {hasReactions && (
                  <div className="message-reactions">
                    {Object.entries(reactions).filter(([, u]) => u.length > 0).map(([emoji, users]) => (
                      <span key={emoji} className="reaction-pill">{emoji} {users.length}</span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          );
        })}

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
          <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18"><path d="M7.41 8.59L12 13.17l4.59-4.58L18 10l-6 6-6-6 1.41-1.41z"/></svg>
        </button>
      )}

      {/* Context menu */}
      {contextMenu && (
        <div className="context-menu" style={{ top: contextMenu.y, left: contextMenu.x }} onClick={e => e.stopPropagation()}>
          <button onClick={() => { setReplyTo(contextMenu.msg); setContextMenu(null); }}><ReplyIcon /> Reply</button>
          <button onClick={() => { setEmojiPicker(contextMenu.msgId); setContextMenu(null); }}>😊 React</button>
          <button onClick={() => { navigator.clipboard?.writeText(contextMenu.msg.content); setContextMenu(null); }}>📋 Copy</button>
          {contextMenu.msg.senderId === currentUser?.id && !contextMenu.msg.deletedForEveryone && (
            <button className="danger" onClick={() => deleteMessage(contextMenu.msgId, 'everyone')}><DeleteIcon /> Delete for everyone</button>
          )}
          <button className="danger" onClick={() => deleteMessage(contextMenu.msgId, 'me')}><DeleteIcon /> Delete for me</button>
        </div>
      )}

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

      {replyTo && (
        <div className="reply-bar-preview">
          <div className="reply-bar-content"><ReplyIcon /><span>{replyTo.content?.substring(0, 60)}</span></div>
          <button onClick={() => setReplyTo(null)}>✕</button>
        </div>
      )}

      {/* Upload progress */}
      {uploadProgress !== null && (
        <div className="upload-progress-bar">
          <div className="upload-progress-fill" style={{ width: `${uploadProgress}%` }} />
          <span>{uploadProgress}%</span>
        </div>
      )}

      {/* ── Input bar ────────────────────────────────────────────────────── */}
      <div className="chat-input-bar">
        {recording ? (
          <div className="recording-bar">
            <button className="icon-btn rec-cancel" onClick={cancelRecording} title="Cancel">✕</button>
            <span className="rec-dot" />
            <span className="rec-time">{formatTime(recordingTime)}</span>
            <span style={{ flex: 1, color: '#ef4444', fontSize: '0.8rem' }}>Release to send</span>
            <button className="icon-btn" onClick={stopRecording}><StopIcon /></button>
          </div>
        ) : (
          <>
            <button
              className="icon-btn attach-btn"
              onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }}
              title="Send image"
            >
              <ImageIcon />
            </button>
            <input
              type="file"
              ref={fileInputRef}
              accept="image/jpeg,image/png,image/gif,image/webp"
              style={{ display: 'none' }}
              onChange={handleImageUpload}
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
              ? (
                <button className="icon-btn send-btn-active" onClick={() => sendMessage(input)} disabled={sending}>
                  <SendIcon />
                </button>
              ) : (
                <button
                  className="icon-btn mic-btn"
                  onMouseDown={startRecording}
                  onTouchStart={startRecording}
                  onMouseUp={stopRecording}
                  onTouchEnd={stopRecording}
                  title="Hold to record"
                >
                  <MicIcon />
                </button>
              )}
          </>
        )}
      </div>
    </div>
  );
}
