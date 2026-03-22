import React, { useState, useEffect, useRef, useCallback } from 'react';
import api from '../../../services/api';
import { getSocket } from '../../../services/socket';

// ── ICONS ─────────────────────────────────────────────────────────────────────
const Ic = ({ d, size=20, fill='currentColor' }) => (
  <svg viewBox="0 0 24 24" fill={fill} width={size} height={size} style={{display:'block',flexShrink:0}}>
    <path d={d}/>
  </svg>
);
const SendIcon    = () => <Ic d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>;
const MicIcon     = () => <Ic d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm5.91-3c-.49 0-.9.36-.98.85C16.52 14.2 14.47 16 12 16s-4.52-1.8-4.93-4.15c-.08-.49-.49-.85-.98-.85-.61 0-1.09.54-1 1.14.49 3 2.89 5.35 5.91 5.78V20c0 .55.45 1 1 1s1-.45 1-1v-2.08c3.02-.43 5.42-2.78 5.91-5.78.1-.6-.39-1.14-1-1.14z"/>;
const StopIcon    = () => <Ic d="M6 6h12v12H6z"/>;
const ImageIcon   = () => <Ic d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z"/>;
const BackIcon    = () => <Ic d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/>;
const MoreIcon    = () => <Ic d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"/>;
const ReplyIcon   = () => <Ic size={16} d="M10 9V5l-7 7 7 7v-4.1c5 0 8.5 1.6 11 5.1-1-5-4-10-11-11z"/>;
const DeleteIcon  = () => <Ic size={16} d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>;
const CallIcon    = () => <Ic d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z"/>;
const VideoIcon   = () => <Ic d="M17 10.5V7c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1v10c0 .55.45 1 1 1h12c.55 0 1-.45 1-1v-3.5l4 4v-11l-4 4z"/>;
const DownIcon    = () => <Ic d="M7.41 8.59L12 13.17l4.59-4.58L18 10l-6 6-6-6 1.41-1.41z"/>;

const EMOJIS = ['❤️','😂','😮','😢','🙏','👍','🔥','😍'];

export default function ChatWindow({ conversation, currentUser, onBack, isOnline, onQueue, onQueueUpdate }) {
  const [messages,      setMessages]      = useState([]);
  const [input,         setInput]         = useState('');
  const [typing,        setTyping]        = useState(false);   // they are typing
  const [typingText,    setTypingText]    = useState('');      // live preview of what they type
  const [replyTo,       setReplyTo]       = useState(null);
  const [contextMenu,   setContextMenu]   = useState(null);
  const [emojiPicker,   setEmojiPicker]   = useState(null);
  const [recording,     setRecording]     = useState(false);
  const [recTime,       setRecTime]       = useState(0);
  const [showScrollBtn, setShowScrollBtn] = useState(false);
  const [sending,       setSending]       = useState(false);
  const [toast,         setToast]         = useState(null);   // {name, content}
  const [pendingMsgs,   setPendingMsgs]   = useState([]);     // optimistic offline msgs

  const bottomRef      = useRef(null);
  const containerRef   = useRef(null);
  const typingRef      = useRef(null);
  const recorderRef    = useRef(null);
  const chunksRef      = useRef([]);
  const recInterval    = useRef(null);
  const atBottom       = useRef(true);
  const fileRef        = useRef(null);
  const convIdRef      = useRef(null);
  const isMobile       = window.innerWidth <= 768;
  const BASE           = process.env.REACT_APP_API_URL?.replace('/api', '') || '';

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

  // ── LOAD MESSAGES ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (!conversation?.id) return;
    convIdRef.current = conversation.id;
    setMessages([]);
    setReplyTo(null);
    setTyping(false);
    setTypingText('');
    setContextMenu(null);
    setPendingMsgs([]);

    api.get(`/messages/conversation/${conversation.id}`)
      .then(res => {
        if (convIdRef.current === conversation.id) {
          setMessages(res.data || []);
          setTimeout(() => bottomRef.current?.scrollIntoView({ behavior:'auto' }), 80);
        }
      })
      .catch(err => console.error('Load messages failed:', err));
  }, [conversation?.id]);

  // ── SOCKET: join DM room + listen for events ──────────────────────────────
  useEffect(() => {
    const socket = getSocket();
    if (!socket || !conversation?.id || !currentUser?.id) return;

    // Join the DM room so we receive events
    const roomId = [currentUser.id, conversation.id].sort().join('-');
    socket.emit('joinRoom', `dm:${roomId}`);

    const onNewMsg = (msg) => {
      const isRelevant =
        (msg.senderId === conversation.id && msg.recipientId === currentUser.id) ||
        (msg.senderId === currentUser.id   && msg.recipientId === conversation.id);
      if (!isRelevant) return;

      setMessages(prev => {
        if (prev.find(m => m.id === msg.id)) return prev;
        // Remove matching optimistic message if it was ours
        const filtered = prev.filter(m => !(m._pending && m.senderId === currentUser.id && m.content === msg.content));
        return [...filtered, msg];
      });

      // Show toast if window not focused or user scrolled up
      if (msg.senderId !== currentUser.id && (!document.hasFocus() || !atBottom.current)) {
        const senderName = msg.sender?.displayName || msg.sender?.username || conversation.displayName || 'New message';
        showToast(senderName, msg.content || (msg.type === 'image' ? '📷 Image' : '🎤 Voice note'));
      }

      scrollToBottom();
    };

    const onMsgDeleted = ({ id, deletedForEveryone }) => {
      if (deletedForEveryone)
        setMessages(prev => prev.map(m => m.id === id ? { ...m, deletedForEveryone:true, content:'This message was deleted' } : m));
      else
        setMessages(prev => prev.filter(m => m.id !== id));
    };

    // Typing: show animation + live text preview
    const onTyping = ({ userId, text }) => {
      if (userId !== conversation.id) return;
      setTyping(true);
      setTypingText(text || '');
      clearTimeout(typingRef.current);
      typingRef.current = setTimeout(() => { setTyping(false); setTypingText(''); }, 3000);
    };

    const onStopTyping = ({ userId }) => {
      if (userId !== conversation.id) return;
      setTyping(false);
      setTypingText('');
    };

    socket.on('newMessage',    onNewMsg);
    socket.on('messageDeleted',onMsgDeleted);
    socket.on('typing',        onTyping);
    socket.on('stopTyping',    onStopTyping);

    return () => {
      socket.emit('leaveRoom', `dm:${roomId}`);
      socket.off('newMessage',    onNewMsg);
      socket.off('messageDeleted',onMsgDeleted);
      socket.off('typing',        onTyping);
      socket.off('stopTyping',    onStopTyping);
    };
  }, [conversation?.id, currentUser?.id, scrollToBottom]);

  useEffect(() => {
    const close = () => { setContextMenu(null); setEmojiPicker(null); };
    document.addEventListener('click', close);
    return () => document.removeEventListener('click', close);
  }, []);

  // ── SEND MESSAGE ───────────────────────────────────────────────────────────
  const sendMessage = async (content, type='text', mediaFile=null) => {
    if ((!content?.trim() && !mediaFile) || sending) return;
    setSending(true);
    const socket = getSocket();

    // Optimistic update — show immediately
    const tempMsg = {
      id: `temp_${Date.now()}`,
      _pending: true,
      senderId: currentUser.id,
      recipientId: conversation.id,
      content: content?.trim() || (type==='image' ? '📷 Image' : '🎤 Voice note'),
      type,
      createdAt: new Date().toISOString(),
    };
    setMessages(prev => [...prev, tempMsg]);
    setTimeout(() => bottomRef.current?.scrollIntoView({ behavior:'smooth' }), 30);

    // If offline — queue it
    if (!isOnline) {
      onQueue?.({ recipientId: conversation.id, content: content?.trim(), type });
      onQueueUpdate?.();
      setSending(false);
      return;
    }

    try {
      let res;
      if (mediaFile) {
        const fd = new FormData();
        fd.append('media',       mediaFile);
        fd.append('recipientId', conversation.id);
        fd.append('content',     type==='voice' ? 'Voice note' : 'Image');
        fd.append('type',        type);
        if (replyTo) fd.append('replyToId', replyTo.id);
        res = await api.post('/messages', fd, { headers:{'Content-Type':'multipart/form-data'} });
      } else {
        res = await api.post('/messages', {
          content: content.trim(),
          recipientId: conversation.id,
          type: 'text',
          ...(replyTo ? { replyToId: replyTo.id } : {}),
        });
      }

      const newMsg = res.data;
      // Replace temp with real
      setMessages(prev => {
        const without = prev.filter(m => m.id !== tempMsg.id);
        return prev.find(m => m.id === newMsg.id) ? without : [...without, newMsg];
      });
      setInput('');
      setReplyTo(null);
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior:'smooth' }), 50);
      socket?.emit('stopTyping', { to: conversation.id });
      // Broadcast to recipient's room
      socket?.emit('sendMessage', { ...newMsg, to: conversation.id });
    } catch (err) {
      console.error('Send failed:', err?.response?.data || err.message);
      // Remove temp on failure
      setMessages(prev => prev.filter(m => m.id !== tempMsg.id));
      alert('Failed to send. Please try again.');
    } finally {
      setSending(false);
    }
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
    if (deleteFor === 'everyone')
      setMessages(prev => prev.map(m => m.id === msgId ? { ...m, deletedForEveryone:true, content:'This message was deleted' } : m));
    else
      setMessages(prev => prev.filter(m => m.id !== msgId));
    setContextMenu(null);
    try {
      await api.delete(`/messages/${msgId}`, { data:{ forEveryone: deleteFor==='everyone' } });
      if (deleteFor === 'everyone')
        getSocket()?.emit('messageDeleted', { id:msgId, deletedForEveryone:true, to:conversation.id });
    } catch {}
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) sendMessage('', 'image', file);
    e.target.value = '';
  };

  const startRecording = async (e) => {
    e.preventDefault();
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio:true });
      recorderRef.current = new MediaRecorder(stream);
      chunksRef.current = [];
      recorderRef.current.ondataavailable = ev => chunksRef.current.push(ev.data);
      recorderRef.current.onstop = async () => {
        const blob = new Blob(chunksRef.current, { type:'audio/webm' });
        await sendMessage('', 'voice', new File([blob], `voice-${Date.now()}.webm`, { type:'audio/webm' }));
        stream.getTracks().forEach(t => t.stop());
      };
      recorderRef.current.start();
      setRecording(true);
      setRecTime(0);
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

  const handleLongPress = (e, msg) => {
    e.preventDefault(); e.stopPropagation();
    const rect = e.currentTarget.getBoundingClientRect();
    const y = rect.top > 200 ? rect.top - 160 : rect.bottom + 8;
    setContextMenu({ msgId:msg.id, msg, x:Math.min(rect.left, window.innerWidth-200), y });
  };

  const fmt = (s) => `${Math.floor(s/60).toString().padStart(2,'0')}:${(s%60).toString().padStart(2,'0')}`;
  const avatarUrl = (a) => !a ? null : a.startsWith('http') ? a : `${BASE}${a}`;

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
    <div style={s.window} onClick={() => { setContextMenu(null); setEmojiPicker(null); }}>

      {/* ── TOAST NOTIFICATION ── */}
      {toast && (
        <div style={s.toast}>
          <div style={s.toastDot}/>
          <div>
            <div style={s.toastName}>{toast.name}</div>
            <div style={s.toastContent}>{toast.content?.substring(0,60)}</div>
          </div>
        </div>
      )}

      {/* ── HEADER ── */}
      <div style={s.header}>
        {isMobile && <button style={s.iconBtn} onClick={onBack}><BackIcon/></button>}
        <div style={s.headerAv}>
          {avatarUrl(conversation.avatar)
            ? <img src={avatarUrl(conversation.avatar)} alt="" style={s.avImg}/>
            : <div style={s.avPh}>{(conversation.displayName||conversation.username||'?')[0].toUpperCase()}</div>}
          <span style={{...s.statusDot, background: conversation.isOnline ? '#22c55e' : '#44445A'}}/>
        </div>
        <div style={{flex:1,minWidth:0}}>
          <div style={s.hName}>{conversation.displayName||conversation.username}</div>
          <div style={s.hStatus}>
            {typing
              ? <span style={{color:'#BF5FFF',fontStyle:'italic',fontSize:11}}>
                  {typingText ? `typing: "${typingText.substring(0,28)}${typingText.length>28?'...':''}"` : 'typing...'}
                </span>
              : <span style={{color: conversation.isOnline ? '#22c55e' : '#44445A', fontSize:11}}>
                  {conversation.isOnline ? 'online' : 'offline'}
                </span>}
          </div>
        </div>
        <div style={{display:'flex',gap:2}}>
          <button style={s.iconBtn}><CallIcon/></button>
          <button style={s.iconBtn}><VideoIcon/></button>
          <button style={s.iconBtn}><MoreIcon/></button>
        </div>
      </div>

      {/* ── MESSAGES ── */}
      <div style={s.msgs} ref={containerRef} onScroll={handleScroll}>
        {messages.length===0 && (
          <div style={{textAlign:'center',padding:'48px 16px',color:'#44445A',fontSize:14}}>
            No messages yet. Say hello 👋
          </div>
        )}
        {messages.map((msg) => {
          const isMine    = msg.senderId === currentUser?.id;
          const isDeleted = msg.deletedForEveryone;
          const isPending = msg._pending;
          let reactions = {};
          try { reactions = typeof msg.reactions==='string' ? JSON.parse(msg.reactions) : (msg.reactions||{}); } catch {}
          const hasReactions = Object.values(reactions).some(a=>a.length>0);

          return (
            <div key={msg.id}
              style={{...s.row, justifyContent: isMine?'flex-end':'flex-start'}}
              onContextMenu={e=>{ if(!isDeleted){e.preventDefault();handleLongPress(e,msg);} }}
              onTouchStart={e=>{ if(isDeleted)return; const t=setTimeout(()=>handleLongPress(e,msg),600); e.currentTarget._pt=t; }}
              onTouchEnd={e=>clearTimeout(e.currentTarget._pt)}
              onTouchMove={e=>clearTimeout(e.currentTarget._pt)}
            >
              <div style={{
                ...s.bubble,
                ...(isMine ? s.bMine : s.bTheirs),
                ...(isDeleted ? {opacity:0.5} : {}),
                ...(isPending ? {opacity:0.6} : {}),
              }}>
                {msg.replyToContent && (
                  <div style={s.replyPrev}>
                    <div style={s.replyLine}/>
                    <p style={{fontSize:11,color:'#888',margin:0,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>
                      {msg.replyToContent}
                    </p>
                  </div>
                )}
                {msg.type==='image' && msg.mediaUrl
                  ? <img src={msg.mediaUrl.startsWith('http')?msg.mediaUrl:`${BASE}${msg.mediaUrl}`}
                      alt="img" style={s.msgImg}
                      onClick={()=>window.open(msg.mediaUrl.startsWith('http')?msg.mediaUrl:`${BASE}${msg.mediaUrl}`,'_blank')}/>
                  : msg.type==='voice' && msg.mediaUrl
                    ? <audio controls src={msg.mediaUrl.startsWith('http')?msg.mediaUrl:`${BASE}${msg.mediaUrl}`}
                        style={{maxWidth:200,borderRadius:8}}/>
                    : <p style={{margin:0,fontSize:14,lineHeight:1.5,
                        color: isDeleted?'#44445A':'#F0F0F5',
                        fontStyle: isDeleted?'italic':'normal'}}>
                        {msg.content}
                      </p>}
                <div style={s.meta}>
                  <span style={{fontSize:10,color:'rgba(255,255,255,0.35)'}}>
                    {isPending ? '⏳' : new Date(msg.createdAt).toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'})}
                  </span>
                  {isMine && !isDeleted && !isPending && (
                    <svg viewBox="0 0 18 11" width="14" height="9" fill="none">
                      <path d="M1 5.5l4 4L16 1" stroke="rgba(191,95,255,0.7)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  )}
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

        {/* ── TYPING INDICATOR (WhatsApp-style) ── */}
        {typing && (
          <div style={{...s.row, justifyContent:'flex-start'}}>
            <div style={{...s.bubble,...s.bTheirs,padding:'10px 14px'}}>
              {typingText ? (
                <p style={{margin:0,fontSize:13,color:'#BF5FFF',fontStyle:'italic'}}>
                  "{typingText.substring(0,40)}{typingText.length>40?'...':''}"
                </p>
              ) : (
                <div style={{display:'flex',gap:4,alignItems:'center'}}>
                  {[0,0.2,0.4].map((d,i)=>(
                    <span key={i} style={{
                      width:7,height:7,borderRadius:'50%',background:'#BF5FFF',
                      animation:`typingBounce 1s ease-in-out infinite`,
                      animationDelay:`${d}s`,
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
        <div style={{...s.ctxMenu,top:contextMenu.y,left:contextMenu.x}} onClick={e=>e.stopPropagation()}>
          <button style={s.ctxBtn} onClick={()=>{setReplyTo(contextMenu.msg);setContextMenu(null);}}><ReplyIcon/> Reply</button>
          <button style={s.ctxBtn} onClick={()=>{setEmojiPicker(contextMenu.msgId);setContextMenu(null);}}>😊 React</button>
          <button style={s.ctxBtn} onClick={()=>{navigator.clipboard?.writeText(contextMenu.msg.content);setContextMenu(null);}}>📋 Copy</button>
          {contextMenu.msg.senderId===currentUser?.id&&!contextMenu.msg.deletedForEveryone&&(
            <button style={{...s.ctxBtn,color:'#f15c6d'}} onClick={()=>deleteMessage(contextMenu.msgId,'everyone')}><DeleteIcon/> Delete for everyone</button>
          )}
          <button style={{...s.ctxBtn,color:'#f15c6d'}} onClick={()=>deleteMessage(contextMenu.msgId,'me')}><DeleteIcon/> Delete for me</button>
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
          <div style={{display:'flex',alignItems:'center',gap:8,flex:1,minWidth:0}}>
            <ReplyIcon/>
            <span style={{fontSize:12,color:'#888',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>
              {replyTo.content?.substring(0,60)}
            </span>
          </div>
          <button style={{background:'none',border:'none',color:'#555',cursor:'pointer',fontSize:16}} onClick={()=>setReplyTo(null)}>✕</button>
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
            <input type="file" ref={fileRef} accept="image/*,video/*" style={{display:'none'}} onChange={handleImageUpload}/>
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

      <style>{`
        @keyframes typingBounce {
          0%,60%,100%{transform:translateY(0);opacity:.4}
          30%{transform:translateY(-5px);opacity:1}
        }
        @keyframes recPulse {0%,100%{opacity:1}50%{opacity:.3}}
        @keyframes toastIn  {from{transform:translateY(-20px);opacity:0}to{transform:translateY(0);opacity:1}}
      `}</style>
    </div>
  );
}

const s = {
  window:    { display:'flex',flexDirection:'column',height:'100%',background:'#0A0A0F',position:'relative',overflow:'hidden' },
  empty:     { flex:1,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',gap:0,padding:32 },
  toast:     { position:'absolute',top:12,left:'50%',transform:'translateX(-50%)',zIndex:300,
               background:'#1A1A26',border:'1px solid rgba(191,95,255,0.3)',borderRadius:14,
               padding:'10px 16px',display:'flex',alignItems:'center',gap:10,
               boxShadow:'0 8px 32px rgba(0,0,0,0.5)',animation:'toastIn .3s ease',
               minWidth:220,maxWidth:'90vw' },
  toastDot:  { width:8,height:8,borderRadius:'50%',background:'#BF5FFF',flexShrink:0 },
  toastName: { fontSize:12,fontWeight:700,color:'#BF5FFF' },
  toastContent:{ fontSize:12,color:'#888',marginTop:1,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',maxWidth:200 },
  header:    { display:'flex',alignItems:'center',gap:12,padding:'10px 16px',background:'#111118',borderBottom:'1px solid rgba(255,255,255,0.07)',flexShrink:0 },
  headerAv:  { position:'relative',flexShrink:0 },
  avImg:     { width:40,height:40,borderRadius:'50%',objectFit:'cover' },
  avPh:      { width:40,height:40,borderRadius:'50%',background:'#BF5FFF',color:'#fff',display:'flex',alignItems:'center',justifyContent:'center',fontWeight:700,fontSize:16 },
  statusDot: { position:'absolute',bottom:1,right:1,width:10,height:10,borderRadius:'50%',border:'2px solid #111118' },
  hName:     { fontSize:14,fontWeight:600,color:'#F0F0F5' },
  hStatus:   { fontSize:11,marginTop:1 },
  iconBtn:   { background:'none',border:'none',color:'#8888AA',cursor:'pointer',padding:8,borderRadius:'50%',display:'flex',alignItems:'center',justifyContent:'center' },
  msgs:      { flex:1,overflowY:'auto',padding:'12px 14px',display:'flex',flexDirection:'column',gap:3 },
  row:       { display:'flex',marginBottom:1 },
  bubble:    { maxWidth:'70%',padding:'9px 13px 7px',borderRadius:16,wordBreak:'break-word' },
  bMine:     { background:'#3D1A5C',borderRadius:'16px 16px 4px 16px' },
  bTheirs:   { background:'#13131A',border:'1px solid rgba(255,255,255,0.07)',borderRadius:'16px 16px 16px 4px' },
  replyPrev: { display:'flex',gap:8,marginBottom:6,paddingBottom:6,borderBottom:'1px solid rgba(255,255,255,0.08)' },
  replyLine: { width:3,borderRadius:2,background:'#BF5FFF',flexShrink:0 },
  msgImg:    { maxWidth:220,maxHeight:220,borderRadius:10,display:'block',cursor:'pointer' },
  meta:      { display:'flex',alignItems:'center',gap:4,justifyContent:'flex-end',marginTop:4 },
  rxPill:    { background:'rgba(255,255,255,0.08)',border:'1px solid rgba(255,255,255,0.1)',borderRadius:20,padding:'2px 7px',fontSize:12,cursor:'pointer' },
  scrollBtn: { position:'absolute',bottom:80,right:14,width:36,height:36,borderRadius:'50%',background:'#1A1A26',border:'1px solid rgba(255,255,255,0.1)',color:'#F0F0F5',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center' },
  ctxMenu:   { position:'fixed',zIndex:300,background:'#1A1A26',border:'1px solid rgba(255,255,255,0.1)',borderRadius:14,padding:'6px 0',boxShadow:'0 8px 32px rgba(0,0,0,0.5)',minWidth:180 },
  ctxBtn:    { display:'flex',alignItems:'center',gap:10,width:'100%',background:'none',border:'none',color:'#F0F0F5',padding:'10px 16px',cursor:'pointer',fontSize:13,fontFamily:'inherit',textAlign:'left' },
  emojiPicker:{ position:'absolute',bottom:76,right:14,zIndex:200,background:'#1A1A26',border:'1px solid rgba(255,255,255,0.1)',borderRadius:14,padding:10,display:'flex',gap:4,flexWrap:'wrap',maxWidth:200 },
  emojiBtn:  { background:'none',border:'none',fontSize:22,cursor:'pointer',padding:6,borderRadius:8 },
  replyBar:  { display:'flex',alignItems:'center',gap:10,padding:'8px 16px',background:'#111118',borderTop:'1px solid rgba(255,255,255,0.07)',borderLeft:'3px solid #BF5FFF' },
  inputBar:  { display:'flex',alignItems:'center',gap:8,padding:'10px 12px',background:'#111118',borderTop:'1px solid rgba(255,255,255,0.07)',flexShrink:0 },
  input:     { flex:1,padding:'10px 14px',background:'#1A1A26',border:'1px solid rgba(255,255,255,0.07)',borderRadius:22,color:'#F0F0F5',fontSize:14,fontFamily:'inherit',outline:'none',resize:'none',maxHeight:120,lineHeight:1.45 },
  sendBtn:   { background:'#BF5FFF',color:'#fff',borderRadius:'50%',width:38,height:38,padding:0 },
};
