import React, { useState, useEffect, useRef, useCallback } from 'react';
import api from '../../../services/api';
import { getSocket } from '../../../services/socket';

// ── CLOUDINARY CONFIG ─────────────────────────────────────────────────────────
// Set your values here once you have them from cloudinary.com/dashboard
const CLOUDINARY_CLOUD = process.env.REACT_APP_CLOUDINARY_CLOUD || '';
const CLOUDINARY_PRESET = process.env.REACT_APP_CLOUDINARY_PRESET || '';

const uploadToCloudinary = async (file) => {
  if (!CLOUDINARY_CLOUD || !CLOUDINARY_PRESET) {
    // fallback — send as FormData to backend
    return null;
  }
  const fd = new FormData();
  fd.append('file', file);
  fd.append('upload_preset', CLOUDINARY_PRESET);
  fd.append('resource_type', 'auto');
  const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD}/auto/upload`, {
    method: 'POST', body: fd,
  });
  const data = await res.json();
  return data.secure_url;
};

// ── ICONS ─────────────────────────────────────────────────────────────────────
const Ic = ({ d, size=20, fill='currentColor', stroke='none', sw=0, vb='0 0 24 24', children }) => (
  <svg viewBox={vb} fill={fill} stroke={stroke} strokeWidth={sw}
    strokeLinecap="round" strokeLinejoin="round"
    width={size} height={size} style={{ display:'block', flexShrink:0 }}>
    {d && <path d={d}/>}{children}
  </svg>
);
const SendIcon    = () => <Ic d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>;
const MicIcon     = () => <Ic d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm5.91-3c-.49 0-.9.36-.98.85C16.52 14.2 14.47 16 12 16s-4.52-1.8-4.93-4.15c-.08-.49-.49-.85-.98-.85-.61 0-1.09.54-1 1.14.49 3 2.89 5.35 5.91 5.78V20c0 .55.45 1 1 1s1-.45 1-1v-2.08c3.02-.43 5.42-2.78 5.91-5.78.1-.6-.39-1.14-1-1.14z"/>;
const StopIcon    = () => <Ic d="M6 6h12v12H6z"/>;
const ImageIcon   = () => <Ic d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z"/>;
const BackIcon    = () => <Ic d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/>;
const CallIcon    = () => <Ic d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z"/>;
const VideoIcon   = () => <Ic d="M17 10.5V7c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1v10c0 .55.45 1 1 1h12c.55 0 1-.45 1-1v-3.5l4 4v-11l-4 4z"/>;
const MoreIcon    = () => <Ic d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"/>;
const ReplyIcon   = () => <Ic size={15} d="M10 9V5l-7 7 7 7v-4.1c5 0 8.5 1.6 11 5.1-1-5-4-10-11-11z"/>;
const DeleteIcon  = () => <Ic size={15} d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>;
const SearchIcon  = () => <Ic fill="none" stroke="currentColor" sw={2} size={18}><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></Ic>;
const DownIcon    = () => <Ic d="M7.41 8.59L12 13.17l4.59-4.58L18 10l-6 6-6-6 1.41-1.41z"/>;
const CloseIcon   = () => <Ic d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>;
const MediaIcon   = () => <Ic d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z"/>;
const BlockIcon   = () => <Ic d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zM4 12c0-4.42 3.58-8 8-8 1.85 0 3.55.63 4.9 1.68L5.68 16.9C4.63 15.55 4 13.85 4 12zm8 8c-1.85 0-3.55-.63-4.9-1.68L18.32 7.1C19.37 8.45 20 10.15 20 12c0 4.42-3.58 8-8 8z"/>;
const MuteIcon    = () => <Ic d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z"/>;
const ClearIcon   = () => <Ic d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zm2.46-7.12l1.41-1.41L12 12.59l2.12-2.12 1.41 1.41L13.41 14l2.12 2.12-1.41 1.41L12 15.41l-2.12 2.12-1.41-1.41L10.59 14l-2.13-2.12zM15.5 4l-1-1h-5l-1 1H5v2h14V4z"/>;

const EMOJIS = ['❤️','😂','😮','😢','🙏','👍','🔥','😍'];

// ── DOUBLE TICK COMPONENT (WhatsApp style) ─────────────────────────────────────
const DoubleTick = ({ read }) => (
  <svg width="16" height="10" viewBox="0 0 16 10" fill="none" style={{ flexShrink:0 }}>
    <path d="M1 5l3 3L11 1" stroke={read ? '#53BDEB' : 'rgba(255,255,255,0.4)'}
      strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M5 5l3 3L15 1" stroke={read ? '#53BDEB' : 'rgba(255,255,255,0.4)'}
      strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

export default function ChatWindow({ conversation, currentUser, onBack, isOnline, onQueue, onQueueUpdate }) {
  const [messages,     setMessages]     = useState([]);
  const [input,        setInput]        = useState('');
  const [theirTyping,  setTheirTyping]  = useState(false);
  const [theirText,    setTheirText]    = useState('');   // live text they're typing
  const [replyTo,      setReplyTo]      = useState(null);
  const [contextMenu,  setContextMenu]  = useState(null);
  const [emojiPicker,  setEmojiPicker]  = useState(null);
  const [showMenu,     setShowMenu]     = useState(false);  // 3-dot dropdown
  const [recording,    setRecording]    = useState(false);
  const [recTime,      setRecTime]      = useState(0);
  const [showScrollBtn,setShowScrollBtn]= useState(false);
  const [sending,      setSending]      = useState(false);
  const [toast,        setToast]        = useState(null);
  const [searchMode,   setSearchMode]   = useState(false);
  const [searchQuery,  setSearchQuery]  = useState('');
  const [mediaViewer,  setMediaViewer]  = useState(null); // url to show fullscreen
  const [callActive,   setCallActive]   = useState(false);
  const [localStream,  setLocalStream]  = useState(null);
  const [peerConn,     setPeerConn]     = useState(null);

  const bottomRef    = useRef(null);
  const containerRef = useRef(null);
  const typingRef    = useRef(null);
  const recorderRef  = useRef(null);
  const chunksRef    = useRef([]);
  const recInterval  = useRef(null);
  const atBottom     = useRef(true);
  const fileRef      = useRef(null);
  const convIdRef    = useRef(null);
  const isMobile     = window.innerWidth <= 768;
  const BASE         = process.env.REACT_APP_API_URL?.replace('/api','') || '';

  const scrollToBottom = useCallback((force=false) => {
    if (force || atBottom.current) bottomRef.current?.scrollIntoView({ behavior:'smooth' });
  }, []);

  const handleScroll = () => {
    const el = containerRef.current;
    if (!el) return;
    atBottom.current = el.scrollHeight - el.scrollTop - el.clientHeight < 80;
    setShowScrollBtn(!atBottom.current);
  };

  const showToast = (name, content) => {
    setToast({ name, content });
    setTimeout(() => setToast(null), 4000);
  };

  // ── LOAD ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!conversation?.id) return;
    convIdRef.current = conversation.id;
    setMessages([]); setReplyTo(null); setTheirTyping(false);
    setTheirText(''); setContextMenu(null); setSearchMode(false);

    api.get(`/messages/conversation/${conversation.id}`)
      .then(res => {
        if (convIdRef.current === conversation.id) {
          setMessages(res.data || []);
          setTimeout(() => bottomRef.current?.scrollIntoView({ behavior:'auto' }), 80);
        }
      })
      .catch(err => console.error('Load failed:', err));
  }, [conversation?.id]);

  // ── SOCKET ────────────────────────────────────────────────────────────────
  useEffect(() => {
    const socket = getSocket();
    if (!socket || !conversation?.id || !currentUser?.id) return;

    const roomId = [currentUser.id, conversation.id].sort().join('-');
    socket.emit('joinRoom', `dm:${roomId}`);

    const onNewMsg = (msg) => {
      const relevant =
        (msg.senderId === conversation.id && msg.recipientId === currentUser.id) ||
        (msg.senderId === currentUser.id   && msg.recipientId === conversation.id);
      if (!relevant) return;
      setMessages(prev => {
        if (prev.find(m => m.id === msg.id)) return prev;
        const filtered = prev.filter(m => !(m._pending && m.senderId === currentUser.id && m.content === msg.content));
        return [...filtered, msg];
      });
      if (msg.senderId !== currentUser.id && (!document.hasFocus() || !atBottom.current)) {
        showToast(msg.sender?.displayName || conversation.displayName || 'New message',
          msg.type==='image' ? '📷 Image' : msg.type==='voice' ? '🎤 Voice note' : msg.content);
      }
      scrollToBottom();
    };

    const onMsgDeleted = ({ id, deletedForEveryone }) => {
      if (deletedForEveryone)
        setMessages(prev => prev.map(m => m.id===id ? {...m,deletedForEveryone:true,content:'This message was deleted'} : m));
      else
        setMessages(prev => prev.filter(m => m.id!==id));
    };

    // Full live typing preview — show the text as they type
    const onTyping = ({ userId, text }) => {
      if (userId !== conversation.id) return;
      setTheirTyping(true);
      setTheirText(text || '');
      clearTimeout(typingRef.current);
      typingRef.current = setTimeout(() => { setTheirTyping(false); setTheirText(''); }, 3000);
    };

    const onStopTyping = ({ userId }) => {
      if (userId !== conversation.id) return;
      setTheirTyping(false); setTheirText('');
    };

    // WebRTC signaling
    const onCallOffer  = async ({ offer, from }) => {
      const pc = createPeer();
      await pc.setRemoteDescription(new RTCSessionDescription(offer));
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      socket.emit('callAnswer', { answer, to: from });
      setPeerConn(pc); setCallActive(true);
    };
    const onCallAnswer = async ({ answer }) => {
      await peerConn?.setRemoteDescription(new RTCSessionDescription(answer));
    };
    const onCallIce    = ({ candidate }) => {
      peerConn?.addIceCandidate(new RTCIceCandidate(candidate)).catch(()=>{});
    };
    const onCallEnd    = () => endCall();

    socket.on('newMessage',   onNewMsg);
    socket.on('messageDeleted', onMsgDeleted);
    socket.on('typing',       onTyping);
    socket.on('stopTyping',   onStopTyping);
    socket.on('callOffer',    onCallOffer);
    socket.on('callAnswer',   onCallAnswer);
    socket.on('callIceCandidate', onCallIce);
    socket.on('callEnded',    onCallEnd);

    return () => {
      socket.emit('leaveRoom', `dm:${roomId}`);
      socket.off('newMessage', onNewMsg);
      socket.off('messageDeleted', onMsgDeleted);
      socket.off('typing', onTyping);
      socket.off('stopTyping', onStopTyping);
      socket.off('callOffer', onCallOffer);
      socket.off('callAnswer', onCallAnswer);
      socket.off('callIceCandidate', onCallIce);
      socket.off('callEnded', onCallEnd);
    };
  }, [conversation?.id, currentUser?.id, scrollToBottom, peerConn]);

  useEffect(() => {
    const close = (e) => {
      if (!e.target.closest('.ctx-menu') && !e.target.closest('.three-dot-menu'))
        setContextMenu(null);
      if (!e.target.closest('.three-dot-menu'))
        setShowMenu(false);
      setEmojiPicker(null);
    };
    document.addEventListener('click', close);
    return () => document.removeEventListener('click', close);
  }, []);

  // ── SEND MESSAGE ──────────────────────────────────────────────────────────
  const sendMessage = async (content, type='text', mediaFile=null) => {
    if ((!content?.trim() && !mediaFile) || sending) return;
    setSending(true);
    const socket = getSocket();

    const tempId = `temp_${Date.now()}`;
    const tempMsg = {
      id: tempId, _pending: true,
      senderId: currentUser.id, recipientId: conversation.id,
      content: content?.trim() || (type==='image'?'📷 Image':'🎤 Voice note'),
      type, createdAt: new Date().toISOString(),
    };
    setMessages(prev => [...prev, tempMsg]);
    setTimeout(() => bottomRef.current?.scrollIntoView({ behavior:'smooth' }), 30);

    if (!isOnline) {
      onQueue?.({ recipientId:conversation.id, content:content?.trim(), type });
      onQueueUpdate?.(); setSending(false); return;
    }

    try {
      let mediaUrl = null;

      // Upload to Cloudinary if configured
      if (mediaFile) {
        mediaUrl = await uploadToCloudinary(mediaFile);
      }

      let res;
      if (mediaFile && !mediaUrl) {
        // Cloudinary not set up — send as FormData to backend
        const fd = new FormData();
        fd.append('media', mediaFile);
        fd.append('recipientId', conversation.id);
        fd.append('content', type==='voice' ? 'Voice note' : 'Image');
        fd.append('type', type);
        if (replyTo) fd.append('replyToId', replyTo.id);
        res = await api.post('/messages', fd, { headers:{'Content-Type':'multipart/form-data'} });
      } else {
        res = await api.post('/messages', {
          content:     content?.trim() || (type==='image'?'Image':'Voice note'),
          recipientId: conversation.id,
          type,
          mediaUrl,
          ...(replyTo ? { replyToId: replyTo.id } : {}),
        });
      }

      const newMsg = res.data;
      setMessages(prev => {
        const without = prev.filter(m => m.id !== tempId);
        return prev.find(m => m.id === newMsg.id) ? without : [...without, newMsg];
      });
      setInput(''); setReplyTo(null);
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior:'smooth' }), 50);
      socket?.emit('stopTyping', { to: conversation.id });
      socket?.emit('sendMessage', { ...newMsg, to: conversation.id });
    } catch (err) {
      console.error('Send failed:', err?.response?.data || err.message);
      setMessages(prev => prev.filter(m => m.id !== tempId));
      alert('Failed to send. Check your connection.');
    } finally { setSending(false); }
  };

  const handleInputChange = (e) => {
    setInput(e.target.value);
    const socket = getSocket();
    if (!socket) return;
    socket.emit('typing', { to: conversation?.id, text: e.target.value });
    clearTimeout(typingRef.current);
    typingRef.current = setTimeout(() => socket.emit('stopTyping', { to: conversation?.id }), 2000);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(input); }
  };

  const deleteMessage = async (msgId, deleteFor) => {
    if (deleteFor==='everyone')
      setMessages(prev => prev.map(m => m.id===msgId ? {...m,deletedForEveryone:true,content:'This message was deleted'} : m));
    else
      setMessages(prev => prev.filter(m => m.id!==msgId));
    setContextMenu(null);
    try {
      await api.delete(`/messages/${msgId}`, { data:{ forEveryone: deleteFor==='everyone' } });
      if (deleteFor==='everyone')
        getSocket()?.emit('messageDeleted', { id:msgId, deletedForEveryone:true, to:conversation.id });
    } catch {}
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const type = file.type.startsWith('video') ? 'video' : 'image';
    await sendMessage('', type, file);
    e.target.value = '';
  };

  // ── VOICE RECORDING ────────────────────────────────────────────────────────
  const startRecording = async (e) => {
    e.preventDefault();
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      recorderRef.current = new MediaRecorder(stream);
      chunksRef.current = [];
      recorderRef.current.ondataavailable = ev => chunksRef.current.push(ev.data);
      recorderRef.current.onstop = async () => {
        const blob = new Blob(chunksRef.current, { type:'audio/webm' });
        const file = new File([blob], `voice-${Date.now()}.webm`, { type:'audio/webm' });
        await sendMessage('', 'voice', file);
        stream.getTracks().forEach(t => t.stop());
      };
      recorderRef.current.start();
      setRecording(true); setRecTime(0);
      recInterval.current = setInterval(() => setRecTime(t => t+1), 1000);
    } catch { alert('Microphone permission denied'); }
  };

  const stopRecording = () => {
    if (recorderRef.current && recording) {
      recorderRef.current.stop();
      setRecording(false);
      clearInterval(recInterval.current);
    }
  };

  // ── WEBRTC VOICE CALL ──────────────────────────────────────────────────────
  const createPeer = () => {
    const pc = new RTCPeerConnection({ iceServers: [{ urls:'stun:stun.l.google.com:19302' }] });
    pc.onicecandidate = (e) => {
      if (e.candidate) getSocket()?.emit('callIceCandidate', { candidate:e.candidate, to:conversation.id });
    };
    pc.ontrack = (e) => {
      const audio = document.getElementById('remote-audio');
      if (audio) audio.srcObject = e.streams[0];
    };
    return pc;
  };

  const startCall = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio:true });
      setLocalStream(stream);
      const pc = createPeer();
      stream.getTracks().forEach(t => pc.addTrack(t, stream));
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      getSocket()?.emit('callOffer', { offer, to:conversation.id });
      setPeerConn(pc); setCallActive(true);
    } catch { alert('Could not start call — microphone access needed'); }
  };

  const endCall = () => {
    localStream?.getTracks().forEach(t => t.stop());
    peerConn?.close();
    setLocalStream(null); setPeerConn(null); setCallActive(false);
    getSocket()?.emit('callEnded', { to: conversation.id });
  };

  const handleLongPress = (e, msg) => {
    e.preventDefault(); e.stopPropagation();
    const rect = e.currentTarget.getBoundingClientRect();
    const y = rect.top > 200 ? rect.top - 180 : rect.bottom + 8;
    setContextMenu({ msgId:msg.id, msg, x:Math.min(rect.left, window.innerWidth-210), y });
  };

  const fmt = (s) => `${Math.floor(s/60).toString().padStart(2,'0')}:${(s%60).toString().padStart(2,'0')}`;
  const mediaUrl = (url) => !url ? null : url.startsWith('http') ? url : `${BASE}${url}`;

  // Filtered messages for search
  const displayMsgs = searchMode && searchQuery
    ? messages.filter(m => m.content?.toLowerCase().includes(searchQuery.toLowerCase()))
    : messages;

  if (!conversation) return (
    <div style={s.empty}>
      <svg viewBox="0 0 24 24" fill="currentColor" width="64" height="64" opacity="0.06">
        <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z"/>
      </svg>
      <h3 style={{color:'#F0F0F5',marginTop:12}}>Your Messages</h3>
      <p style={{color:'#44445A',fontSize:13,marginTop:4}}>Select a conversation or go to Space</p>
    </div>
  );

  return (
    <div style={s.window} onClick={() => { setContextMenu(null); setShowMenu(false); }}>
      <audio id="remote-audio" autoPlay style={{ display:'none' }}/>

      {/* ── TOAST ── */}
      {toast && (
        <div style={s.toast}>
          <div style={s.toastDot}/>
          <div>
            <div style={s.toastName}>{toast.name}</div>
            <div style={s.toastMsg}>{toast.content?.substring(0,60)}</div>
          </div>
        </div>
      )}

      {/* ── ACTIVE CALL BAR ── */}
      {callActive && (
        <div style={s.callBar}>
          <div style={s.callPulse}/>
          <span style={{fontSize:13,color:'#fff',flex:1}}>
            🔊 Voice call with {conversation.displayName||conversation.username}
          </span>
          <button style={s.endCallBtn} onClick={endCall}>End</button>
        </div>
      )}

      {/* ── HEADER ── */}
      {!searchMode ? (
        <div style={s.header}>
          {isMobile && <button style={s.iconBtn} onClick={onBack}><BackIcon/></button>}
          <div style={s.headerAv}>
            {conversation.avatar?.startsWith('http') || conversation.avatar
              ? <img src={mediaUrl(conversation.avatar)} alt="" style={s.avImg}/>
              : <div style={s.avPh}>{(conversation.displayName||conversation.username||'?')[0].toUpperCase()}</div>}
            <span style={{...s.statusDot, background: conversation.isOnline?'#22c55e':'#44445A'}}/>
          </div>
          <div style={{flex:1,minWidth:0}}>
            <div style={s.hName}>{conversation.displayName||conversation.username}</div>
            <div style={s.hStatus}>
              {theirTyping
                ? <span style={{color:'#BF5FFF',fontStyle:'italic',fontSize:11}}>
                    {theirText
                      ? `typing: "${theirText.length > 40 ? theirText.substring(0,40)+'...' : theirText}"`
                      : 'typing...'}
                  </span>
                : <span style={{color:conversation.isOnline?'#22c55e':'#44445A',fontSize:11}}>
                    {conversation.isOnline ? 'online' : 'offline'}
                  </span>}
            </div>
          </div>
          <div style={{display:'flex',gap:2,alignItems:'center'}}>
            {/* Voice call */}
            <button style={s.iconBtn} onClick={callActive ? endCall : startCall}
              title={callActive ? 'End call' : 'Voice call'}>
              <CallIcon/>
            </button>
            {/* 3-dot menu */}
            <div style={{position:'relative'}} className="three-dot-menu">
              <button style={s.iconBtn} onClick={e => { e.stopPropagation(); setShowMenu(v=>!v); }}>
                <MoreIcon/>
              </button>
              {showMenu && (
                <div style={s.dropdown} className="three-dot-menu">
                  {[
                    { icon:<SearchIcon/>,  label:'Search messages',   action:()=>{ setSearchMode(true); setShowMenu(false); } },
                    { icon:<MediaIcon/>,   label:'Shared media',       action:()=>{ setShowMenu(false); /* future */ } },
                    { icon:<MuteIcon/>,    label:'Mute notifications', action:()=>{ setShowMenu(false); alert('Muted!'); } },
                    { icon:<ClearIcon/>,   label:'Clear chat',         action:()=>{ if(window.confirm('Clear all messages for you?')) { setMessages([]); setShowMenu(false); } } },
                    { icon:<BlockIcon/>,   label:'Block / Report',     action:()=>{ setShowMenu(false); alert('User reported.'); } },
                  ].map(({ icon, label, action }) => (
                    <button key={label} style={s.ddItem} onClick={action}>
                      <span style={{color:'#BF5FFF',display:'flex',alignItems:'center'}}>{icon}</span>
                      {label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        /* Search header */
        <div style={s.header}>
          <button style={s.iconBtn} onClick={() => { setSearchMode(false); setSearchQuery(''); }}>
            <BackIcon/>
          </button>
          <input
            autoFocus
            style={{ flex:1,background:'#1A1A26',border:'1px solid rgba(255,255,255,0.1)',
              borderRadius:10,padding:'8px 12px',color:'#F0F0F5',fontSize:14,fontFamily:'inherit',outline:'none' }}
            placeholder="Search messages..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
          <span style={{fontSize:12,color:'#666',marginLeft:8,whiteSpace:'nowrap'}}>
            {displayMsgs.length} found
          </span>
        </div>
      )}

      {/* ── MESSAGES ── */}
      <div style={s.msgs} ref={containerRef} onScroll={handleScroll}>
        {displayMsgs.length===0 && (
          <div style={{textAlign:'center',padding:'48px 16px',color:'#44445A',fontSize:14}}>
            {searchMode ? 'No messages match your search' : 'No messages yet. Say hello 👋'}
          </div>
        )}

        {displayMsgs.map((msg) => {
          const isMine    = msg.senderId === currentUser?.id;
          const isDeleted = msg.deletedForEveryone;
          const isPending = msg._pending;
          let reactions = {};
          try { reactions = typeof msg.reactions==='string' ? JSON.parse(msg.reactions) : (msg.reactions||{}); } catch {}
          const hasReactions = Object.values(reactions).some(a=>a.length>0);
          const isRead = msg.readBy?.includes?.(conversation.id) || false;

          return (
            <div key={msg.id}
              style={{...s.row, justifyContent: isMine?'flex-end':'flex-start',
                ...(searchMode && searchQuery && msg.content?.toLowerCase().includes(searchQuery.toLowerCase())
                  ? {background:'rgba(191,95,255,0.06)',borderRadius:8} : {})
              }}
              onContextMenu={e=>{ if(!isDeleted){e.preventDefault();handleLongPress(e,msg);} }}
              onTouchStart={e=>{ if(isDeleted)return; const t=setTimeout(()=>handleLongPress(e,msg),600); e.currentTarget._pt=t; }}
              onTouchEnd={e=>clearTimeout(e.currentTarget._pt)}
              onTouchMove={e=>clearTimeout(e.currentTarget._pt)}
            >
              <div style={{
                ...s.bubble,
                ...(isMine ? s.bMine : s.bTheirs),
                ...(isDeleted ? {opacity:0.5} : {}),
                ...(isPending ? {opacity:0.65} : {}),
              }}>
                {msg.replyToContent && (
                  <div style={s.replyPrev}>
                    <div style={s.replyLine}/>
                    <p style={{fontSize:11,color:'#888',margin:0,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>
                      {msg.replyToContent}
                    </p>
                  </div>
                )}

                {/* Image */}
                {(msg.type==='image'||msg.type==='video') && msg.mediaUrl ? (
                  <img
                    src={mediaUrl(msg.mediaUrl)}
                    alt="img"
                    style={s.msgImg}
                    onClick={() => setMediaViewer(mediaUrl(msg.mediaUrl))}
                    onError={e => { e.target.style.display='none'; }}
                  />
                ) : msg.type==='voice' && msg.mediaUrl ? (
                  /* Styled voice note player */
                  <div style={s.voicePlayer}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18" style={{flexShrink:0,color:"#BF5FFF"}}><path strokeLinecap="round" d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path strokeLinecap="round" d="M19 10v2a7 7 0 0 1-14 0v-2M12 19v4M8 23h8"/></svg>
                    <audio controls src={mediaUrl(msg.mediaUrl)}
                      style={{flex:1,height:28,filter:'invert(0.85) hue-rotate(250deg)',minWidth:0}}/>
                  </div>
                ) : (
                  <p style={{margin:0,fontSize:14,lineHeight:1.5,
                    color: isDeleted?'#44445A':'#F0F0F5',
                    fontStyle: isDeleted?'italic':'normal',
                    wordBreak:'break-word'}}>
                    {msg.content}
                  </p>
                )}

                {/* Meta row */}
                <div style={s.meta}>
                  <span style={{fontSize:10,color:'rgba(255,255,255,0.35)'}}>
                    {isPending ? '⏳' : new Date(msg.createdAt).toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'})}
                  </span>
                  {/* WhatsApp-style double tick */}
                  {isMine && !isDeleted && !isPending && <DoubleTick read={isRead}/>}
                </div>

                {hasReactions && (
                  <div style={{display:'flex',gap:4,marginTop:4,flexWrap:'wrap'}}>
                    {Object.entries(reactions).filter(([,u])=>u.length>0).map(([emoji,users])=>(
                      <span key={emoji} style={s.rxPill}>{emoji} {users.length}</span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {/* ── TYPING INDICATOR — shows in message flow ── */}
        {theirTyping && (
          <div style={{...s.row, justifyContent:'flex-start'}}>
            <div style={{...s.bubble,...s.bTheirs, padding:'10px 14px'}}>
              {theirText ? (
                /* Live text preview */
                <p style={{margin:0,fontSize:14,lineHeight:1.5,color:'rgba(240,240,245,0.7)',
                  fontStyle:'italic',wordBreak:'break-word'}}>
                  {theirText}
                </p>
              ) : (
                /* Bouncing dots */
                <div style={{display:'flex',gap:5,alignItems:'center',height:16}}>
                  {[0,0.25,0.5].map((d,i)=>(
                    <span key={i} style={{
                      width:7,height:7,borderRadius:'50%',background:'#BF5FFF',
                      animation:`typingBounce 1.2s ease-in-out infinite`,
                      animationDelay:`${d}s`, display:'block',
                    }}/>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
        <div ref={bottomRef}/>
      </div>

      {showScrollBtn && (
        <button style={s.scrollBtn} onClick={()=>{atBottom.current=true;scrollToBottom(true);}}>
          <DownIcon/>
        </button>
      )}

      {/* ── CONTEXT MENU ── */}
      {contextMenu && (
        <div style={{...s.ctxMenu,top:contextMenu.y,left:contextMenu.x}} className="ctx-menu"
          onClick={e=>e.stopPropagation()}>
          <button style={s.ctxBtn} onClick={()=>{setReplyTo(contextMenu.msg);setContextMenu(null);}}>
            <ReplyIcon/> Reply
          </button>
          <button style={s.ctxBtn} onClick={()=>{setEmojiPicker(contextMenu.msgId);setContextMenu(null);}}>
            😊 React
          </button>
          <button style={s.ctxBtn} onClick={()=>{navigator.clipboard?.writeText(contextMenu.msg.content);setContextMenu(null);}}>
            📋 Copy
          </button>
          {contextMenu.msg.senderId===currentUser?.id && !contextMenu.msg.deletedForEveryone && (
            <button style={{...s.ctxBtn,color:'#f15c6d'}} onClick={()=>deleteMessage(contextMenu.msgId,'everyone')}>
              <DeleteIcon/> Delete for everyone
            </button>
          )}
          <button style={{...s.ctxBtn,color:'#f15c6d'}} onClick={()=>deleteMessage(contextMenu.msgId,'me')}>
            <DeleteIcon/> Delete for me
          </button>
        </div>
      )}

      {/* ── EMOJI PICKER ── */}
      {emojiPicker && (
        <div style={s.emojiPicker} onClick={e=>e.stopPropagation()}>
          {EMOJIS.map(e=>(
            <button key={e} style={s.emojiBtn} onClick={async()=>{
              await api.post(`/messages/${emojiPicker}/react`,{emoji:e});
              const res = await api.get(`/messages/conversation/${conversation.id}`);
              setMessages(res.data);
              setEmojiPicker(null);
            }}>{e}</button>
          ))}
        </div>
      )}

      {/* ── REPLY BAR ── */}
      {replyTo && (
        <div style={s.replyBar}>
          <ReplyIcon/>
          <span style={{fontSize:12,color:'#888',flex:1,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>
            {replyTo.content?.substring(0,60)}
          </span>
          <button style={{background:'none',border:'none',color:'#555',cursor:'pointer',fontSize:16}}
            onClick={()=>setReplyTo(null)}>✕</button>
        </div>
      )}

      {/* ── INPUT BAR ── */}
      <div style={s.inputBar}>
        {recording ? (
          <div style={{display:'flex',alignItems:'center',gap:10,flex:1}}>
            <span style={{width:8,height:8,borderRadius:'50%',background:'#ef4444',animation:'recPulse 1s infinite'}}/>
            <span style={{fontSize:14,color:'#ef4444',fontWeight:600}}>{fmt(recTime)}</span>
            <span style={{flex:1,fontSize:12,color:'#666'}}>Recording... release to send</span>
            <button style={s.iconBtn} onClick={stopRecording}><StopIcon/></button>
          </div>
        ) : (
          <>
            <button style={s.iconBtn} onClick={e=>{e.stopPropagation();fileRef.current?.click();}}>
              <ImageIcon/>
            </button>
            <input type="file" ref={fileRef} accept="image/*,video/*"
              style={{display:'none'}} onChange={handleImageUpload}/>
            <textarea
              style={s.input}
              placeholder={isOnline===false ? '⚡ Offline — messages will queue' : 'Message...'}
              value={input}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              rows={1}
            />
            {input.trim()
              ? <button style={{...s.iconBtn,...s.sendBtn}} onClick={()=>sendMessage(input)} disabled={sending}>
                  <SendIcon/>
                </button>
              : <button style={s.iconBtn}
                  onMouseDown={startRecording} onTouchStart={startRecording}
                  onMouseUp={stopRecording}   onTouchEnd={stopRecording}>
                  <MicIcon/>
                </button>}
          </>
        )}
      </div>

      {/* ── MEDIA FULLSCREEN VIEWER ── */}
      {mediaViewer && (
        <div style={s.mediaOverlay} onClick={()=>setMediaViewer(null)}>
          <button style={{...s.iconBtn,position:'absolute',top:16,right:16,background:'rgba(0,0,0,0.5)',borderRadius:'50%'}}>
            <CloseIcon/>
          </button>
          <img src={mediaViewer} alt="media"
            style={{maxWidth:'95vw',maxHeight:'90vh',borderRadius:12,objectFit:'contain'}}
            onClick={e=>e.stopPropagation()}/>
        </div>
      )}

      <style>{`
        @keyframes typingBounce {
          0%,60%,100%{transform:translateY(0);opacity:.3}
          30%{transform:translateY(-6px);opacity:1}
        }
        @keyframes recPulse {0%,100%{opacity:1}50%{opacity:.3}}
        @keyframes toastIn {from{transform:translateY(-20px);opacity:0}to{transform:translateY(0);opacity:1}}
        @keyframes callPulse {0%,100%{transform:scale(1)}50%{transform:scale(1.3)}}
      `}</style>
    </div>
  );
}

const s = {
  window:      { display:'flex',flexDirection:'column',height:'100%',background:'#0A0A0F',position:'relative',overflow:'hidden' },
  empty:       { flex:1,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',padding:32 },
  toast:       { position:'absolute',top:12,left:'50%',transform:'translateX(-50%)',zIndex:300,
                 background:'#1A1A26',border:'1px solid rgba(191,95,255,0.3)',borderRadius:14,
                 padding:'10px 16px',display:'flex',alignItems:'center',gap:10,
                 boxShadow:'0 8px 32px rgba(0,0,0,0.5)',animation:'toastIn .3s ease',
                 minWidth:220,maxWidth:'90vw' },
  toastDot:    { width:8,height:8,borderRadius:'50%',background:'#BF5FFF',flexShrink:0 },
  toastName:   { fontSize:12,fontWeight:700,color:'#BF5FFF' },
  toastMsg:    { fontSize:12,color:'#888',marginTop:1,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',maxWidth:200 },
  callBar:     { display:'flex',alignItems:'center',gap:10,padding:'8px 16px',background:'#22c55e22',borderBottom:'1px solid #22c55e44',flexShrink:0 },
  callPulse:   { width:8,height:8,borderRadius:'50%',background:'#22c55e',animation:'callPulse 1s infinite' },
  endCallBtn:  { background:'#ef4444',border:'none',color:'#fff',borderRadius:8,padding:'4px 12px',cursor:'pointer',fontSize:12,fontWeight:600 },
  header:      { display:'flex',alignItems:'center',gap:12,padding:'10px 16px',background:'#111118',borderBottom:'1px solid rgba(255,255,255,0.07)',flexShrink:0 },
  headerAv:    { position:'relative',flexShrink:0 },
  avImg:       { width:40,height:40,borderRadius:'50%',objectFit:'cover' },
  avPh:        { width:40,height:40,borderRadius:'50%',background:'#BF5FFF',color:'#fff',display:'flex',alignItems:'center',justifyContent:'center',fontWeight:700,fontSize:16 },
  statusDot:   { position:'absolute',bottom:1,right:1,width:10,height:10,borderRadius:'50%',border:'2px solid #111118' },
  hName:       { fontSize:14,fontWeight:600,color:'#F0F0F5' },
  hStatus:     { fontSize:11,marginTop:1 },
  dropdown:    { position:'absolute',top:'100%',right:0,zIndex:400,background:'#1A1A26',border:'1px solid rgba(255,255,255,0.1)',borderRadius:14,padding:'6px 0',boxShadow:'0 8px 32px rgba(0,0,0,0.6)',minWidth:200,marginTop:4 },
  ddItem:      { display:'flex',alignItems:'center',gap:10,width:'100%',background:'none',border:'none',color:'#F0F0F5',padding:'11px 16px',cursor:'pointer',fontSize:13,fontFamily:'inherit',textAlign:'left',transition:'background .1s' },
  iconBtn:     { background:'none',border:'none',color:'#8888AA',cursor:'pointer',padding:8,borderRadius:'50%',display:'flex',alignItems:'center',justifyContent:'center' },
  msgs:        { flex:1,overflowY:'auto',padding:'12px 14px',display:'flex',flexDirection:'column',gap:3 },
  row:         { display:'flex',marginBottom:1 },
  bubble:      { maxWidth:'72%',padding:'9px 13px 7px',borderRadius:16,wordBreak:'break-word' },
  bMine:       { background:'#3D1A5C',borderRadius:'16px 16px 4px 16px' },
  bTheirs:     { background:'#13131A',border:'1px solid rgba(255,255,255,0.07)',borderRadius:'16px 16px 16px 4px' },
  replyPrev:   { display:'flex',gap:8,marginBottom:6,paddingBottom:6,borderBottom:'1px solid rgba(255,255,255,0.08)' },
  replyLine:   { width:3,borderRadius:2,background:'#BF5FFF',flexShrink:0 },
  msgImg:      { maxWidth:240,maxHeight:240,borderRadius:10,display:'block',cursor:'pointer',objectFit:'cover' },
  voicePlayer: { display:'flex',alignItems:'center',gap:8,background:'rgba(191,95,255,0.08)',border:'1px solid rgba(191,95,255,0.2)',borderRadius:14,padding:'10px 12px',minWidth:190,maxWidth:260 },
  meta:        { display:'flex',alignItems:'center',justifyContent:'flex-end',gap:4,marginTop:4 },
  rxPill:      { background:'rgba(255,255,255,0.08)',border:'1px solid rgba(255,255,255,0.1)',borderRadius:20,padding:'2px 7px',fontSize:12,cursor:'pointer' },
  scrollBtn:   { position:'absolute',bottom:80,right:14,width:36,height:36,borderRadius:'50%',background:'#1A1A26',border:'1px solid rgba(255,255,255,0.1)',color:'#F0F0F5',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center' },
  ctxMenu:     { position:'fixed',zIndex:300,background:'#1A1A26',border:'1px solid rgba(255,255,255,0.1)',borderRadius:14,padding:'6px 0',boxShadow:'0 8px 32px rgba(0,0,0,0.5)',minWidth:190 },
  ctxBtn:      { display:'flex',alignItems:'center',gap:10,width:'100%',background:'none',border:'none',color:'#F0F0F5',padding:'10px 16px',cursor:'pointer',fontSize:13,fontFamily:'inherit',textAlign:'left' },
  emojiPicker: { position:'absolute',bottom:76,right:14,zIndex:200,background:'#1A1A26',border:'1px solid rgba(255,255,255,0.1)',borderRadius:14,padding:10,display:'flex',gap:4,flexWrap:'wrap',maxWidth:200 },
  emojiBtn:    { background:'none',border:'none',fontSize:22,cursor:'pointer',padding:6,borderRadius:8 },
  replyBar:    { display:'flex',alignItems:'center',gap:8,padding:'8px 16px',background:'#111118',borderTop:'1px solid rgba(255,255,255,0.07)',borderLeft:'3px solid #BF5FFF' },
  inputBar:    { display:'flex',alignItems:'center',gap:8,padding:'10px 12px',background:'#111118',borderTop:'1px solid rgba(255,255,255,0.07)',flexShrink:0 },
  input:       { flex:1,padding:'10px 14px',background:'#1A1A26',border:'1px solid rgba(255,255,255,0.07)',borderRadius:22,color:'#F0F0F5',fontSize:14,fontFamily:'inherit',outline:'none',resize:'none',maxHeight:120,lineHeight:1.45 },
  sendBtn:     { background:'#BF5FFF',color:'#fff',borderRadius:'50%',width:38,height:38,padding:0 },
  mediaOverlay:{ position:'fixed',inset:0,background:'rgba(0,0,0,0.95)',zIndex:500,display:'flex',alignItems:'center',justifyContent:'center' },
};
