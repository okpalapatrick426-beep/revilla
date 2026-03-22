import React, { useState, useEffect, useCallback } from 'react';
import api from '../../../services/api';
import { getSocket } from '../../../services/socket';

const MsgIcon  = () => <svg viewBox="0 0 24 24" fill="currentColor" width="14" height="14"><path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z"/></svg>;
const AddIcon  = () => <svg viewBox="0 0 24 24" fill="currentColor" width="14" height="14"><path d="M15 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm-9-2V7H4v3H1v2h3v3h2v-3h3v-2H6zm9 4c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg>;
const CheckIcon= () => <svg viewBox="0 0 24 24" fill="currentColor" width="14" height="14"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>;
const SearchIc = () => <svg viewBox="0 0 24 24" fill="currentColor" width="15" height="15" style={{opacity:.4}}><path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/></svg>;

// Status config
const STATUS = {
  'in-app': { color: '#22c55e', label: 'In App',  dot: '#22c55e' },
  'online':  { color: '#3b82f6', label: 'Online',  dot: '#3b82f6' },
  'offline': { color: '#44445A', label: 'Offline', dot: '#44445A' },
};

const AVATAR_COLORS = ['#BF5FFF','#3b82f6','#22c55e','#f59e0b','#ef4444','#ec4899','#06b6d4','#8b5cf6'];
const getColor = (id='') => AVATAR_COLORS[id.charCodeAt(0) % AVATAR_COLORS.length];

export default function GoSpace({ currentUser, onOpenChat, onlineUsers = {} }) {
  const [tab,       setTab]       = useState('online');
  const [allUsers,  setAllUsers]  = useState([]);
  const [friends,   setFriends]   = useState([]);   // accepted friend user ids
  const [requests,  setRequests]  = useState([]);   // incoming requests
  const [friendMap, setFriendMap] = useState({});   // userId -> 'friends'|'pending'|'received'
  const [socketMap, setSocketMap] = useState({});   // userId -> {inApp, lastSeen} — live from socket
  const [search,    setSearch]    = useState('');
  const [popup,     setPopup]     = useState(null);
  const [loading,   setLoading]   = useState(true);
  const BASE = process.env.REACT_APP_API_URL?.replace('/api','') || '';

  // ── LOAD DATA ──────────────────────────────────────────────────────────────
  const load = useCallback(async () => {
    try {
      const [usersRes, friendsRes] = await Promise.all([
        api.get('/users/all'),
        api.get('/friends').catch(() => ({ data: [] })),
      ]);
      setAllUsers(usersRes.data || []);

      const raw = friendsRes.data || [];
      const fMap = {}, fList = [], rList = [];
      raw.forEach(f => {
        if (f.status === 'accepted') {
          const oid = f.userId === currentUser?.id ? f.friendId : f.userId;
          fMap[oid] = 'friends';
          fList.push(oid);
        } else if (f.status === 'pending') {
          if (f.userId === currentUser?.id) fMap[f.friendId] = 'pending';
          else { fMap[f.userId] = 'received'; rList.push(f); }
        }
      });
      setFriendMap(fMap);
      setFriends(fList);
      setRequests(rList);
    } catch (err) {
      console.error('GoSpace load error:', err);
    } finally { setLoading(false); }
  }, [currentUser?.id]);

  useEffect(() => {
    load();
    const t = setInterval(load, 8000);
    return () => clearInterval(t);
  }, [load]);

  // ── SOCKET: accurate real-time online status ───────────────────────────────
  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    socket.on('onlineUsers', (list) => {
      const map = {};
      list.forEach(u => { map[u.userId] = { inApp: u.inApp, lastSeen: u.lastSeen }; });
      setSocketMap(map);
    });
    socket.on('userOnline', ({ userId, inApp }) => {
      setSocketMap(prev => ({ ...prev, [userId]: { inApp, lastSeen: Date.now() } }));
    });
    socket.on('userOffline', ({ userId }) => {
      setSocketMap(prev => {
        const next = { ...prev };
        delete next[userId];
        return next;
      });
    });

    return () => {
      socket.off('onlineUsers');
      socket.off('userOnline');
      socket.off('userOffline');
    };
  }, []);

  // ── STATUS LOGIC ──────────────────────────────────────────────────────────
  // Priority: socket real-time > DB isOnline field
  const getStatus = (user) => {
    if (socketMap[user.id]) return socketMap[user.id].inApp ? 'in-app' : 'online';
    if (onlineUsers[user.id]) return onlineUsers[user.id];
    if (user.isOnline) return 'online';
    return 'offline';
  };

  // ── FILTER USERS BY TAB ───────────────────────────────────────────────────
  const getTabUsers = () => {
    let list = allUsers;
    const q = search.toLowerCase();
    if (q) list = list.filter(u =>
      u.displayName?.toLowerCase().includes(q) || u.username?.toLowerCase().includes(q)
    );
    switch (tab) {
      case 'online':   return list.filter(u => getStatus(u) === 'online' || getStatus(u) === 'in-app');
      case 'offline':  return list.filter(u => getStatus(u) === 'offline');
      case 'friends':  return list.filter(u => friendMap[u.id] === 'friends');
      default:         return list;
    }
  };

  const counts = {
    online:   allUsers.filter(u => ['online','in-app'].includes(getStatus(u))).length,
    offline:  allUsers.filter(u => getStatus(u) === 'offline').length,
    friends:  allUsers.filter(u => friendMap[u.id] === 'friends').length,
    requests: requests.length,
  };

  const sendRequest = async (userId) => {
    try {
      await api.post(`/friends/request/${userId}`);
      setFriendMap(prev => ({ ...prev, [userId]: 'pending' }));
    } catch (err) { console.error(err); }
  };

  const acceptRequest = async (requesterId) => {
    try {
      await api.put(`/friends/accept/${requesterId}`);
      setFriendMap(prev => ({ ...prev, [requesterId]: 'friends' }));
      setRequests(prev => prev.filter(r => r.userId !== requesterId));
      load();
    } catch (err) { console.error(err); }
  };

  const avSrc = (u) => u?.avatar ? (u.avatar.startsWith('http') ? u.avatar : `${BASE}${u.avatar}`) : null;

  const Avatar = ({ user, size = 46 }) => {
    const src = avSrc(user);
    const status = getStatus(user);
    return (
      <div style={{ position:'relative', flexShrink:0 }}>
        {src
          ? <img src={src} alt="" style={{ width:size,height:size,borderRadius:'50%',objectFit:'cover' }}/>
          : <div style={{ width:size,height:size,borderRadius:'50%',background:getColor(user.id||''),
              color:'#fff',display:'flex',alignItems:'center',justifyContent:'center',
              fontWeight:700,fontSize:size*0.38 }}>
              {(user.displayName||user.username||'?')[0].toUpperCase()}
            </div>}
        <span style={{
          position:'absolute',bottom:1,right:1,
          width: size>40?11:9, height: size>40?11:9,
          borderRadius:'50%', background: STATUS[status]?.dot||'#44445A',
          border: `2px solid #0A0A0F`,
        }}/>
      </div>
    );
  };

  const tabList = getTabUsers();

  return (
    <div style={gs.wrap}>

      {/* Header */}
      <div style={gs.header}>
        <div style={gs.searchWrap}>
          <SearchIc/>
          <input style={gs.searchInput} placeholder="Search anyone on Revilla..."
            value={search} onChange={e => setSearch(e.target.value)}/>
        </div>
      </div>

      {/* Tabs */}
      <div style={gs.tabs}>
        {[
          { key:'online',   label:'Online',   count: counts.online   },
          { key:'offline',  label:'Offline',  count: counts.offline  },
          { key:'friends',  label:'Friends',  count: counts.friends  },
          { key:'requests', label:'Requests', count: counts.requests },
        ].map(t => (
          <button key={t.key} style={{
            ...gs.tab,
            ...(tab === t.key ? gs.tabActive : {}),
          }} onClick={() => setTab(t.key)}>
            {t.label}
            {t.count > 0 && (
              <span style={{
                ...gs.tabCount,
                background: tab===t.key ? '#BF5FFF' : 'rgba(255,255,255,0.08)',
                color: tab===t.key ? '#fff' : '#8888AA',
              }}>{t.count}</span>
            )}
          </button>
        ))}
      </div>

      {/* List */}
      <div style={gs.list}>
        {loading && <p style={gs.empty}>Loading...</p>}

        {/* Requests tab */}
        {tab === 'requests' && !loading && (
          requests.length === 0
            ? <p style={gs.empty}>No pending requests</p>
            : requests.map(req => {
                const u = req.User || req.Requester || { id: req.userId, username: 'Unknown' };
                return (
                  <div key={req.id || req.userId} style={gs.row}>
                    <Avatar user={u} size={46}/>
                    <div style={gs.info}>
                      <div style={gs.name}>{u.displayName||u.username||'Unknown'}</div>
                      <div style={{fontSize:12,color:'#8888AA'}}>wants to connect</div>
                    </div>
                    <div style={{display:'flex',gap:6}}>
                      <button style={gs.btnAccept} onClick={()=>acceptRequest(u.id||req.userId)}>
                        <CheckIcon/> Accept
                      </button>
                    </div>
                  </div>
                );
              })
        )}

        {/* Users list */}
        {tab !== 'requests' && !loading && tabList.length === 0 && (
          <div style={gs.emptyState}>
            <div style={{fontSize:32,marginBottom:8}}>
              {tab==='online'?'👀':tab==='offline'?'😴':tab==='friends'?'👥':'🔔'}
            </div>
            <p style={{color:'#F0F0F5',fontSize:14,fontWeight:500}}>
              {tab==='online'   ? 'No one is online right now'
               :tab==='offline' ? 'No offline users'
               :tab==='friends' ? 'No friends yet'
               :'No requests'}
            </p>
            <p style={{color:'#44445A',fontSize:12,marginTop:4}}>
              {tab==='friends' ? 'Find people in the Online tab' : ''}
            </p>
          </div>
        )}

        {tab !== 'requests' && tabList.map(user => {
          const status  = getStatus(user);
          const fStatus = friendMap[user.id];
          const cfg     = STATUS[status] || STATUS.offline;

          return (
            <div key={user.id} style={gs.row} onClick={() => setPopup(user)}>
              <Avatar user={user} size={46}/>
              <div style={gs.info}>
                <div style={gs.name}>{user.displayName||user.username}</div>
                <div style={{display:'flex',alignItems:'center',gap:6}}>
                  <span style={{...gs.statusDot,background:cfg.dot}}/>
                  <span style={{fontSize:12,color:cfg.color}}>{cfg.label}</span>
                  <span style={{fontSize:11,color:'#44445A'}}>· @{user.username}</span>
                </div>
              </div>
              <div style={{display:'flex',gap:6,alignItems:'center'}}>
                <button style={gs.btnMsg}
                  onClick={e=>{e.stopPropagation();onOpenChat&&onOpenChat(user);}}>
                  <MsgIcon/>
                </button>
                {!fStatus && (
                  <button style={gs.btnAdd}
                    onClick={e=>{e.stopPropagation();sendRequest(user.id);}}>
                    <AddIcon/>
                  </button>
                )}
                {fStatus==='pending'  && <span style={gs.badge}>Sent</span>}
                {fStatus==='friends'  && <span style={{...gs.badge,...gs.badgeFriend}}>✓</span>}
                {fStatus==='received' && (
                  <button style={gs.btnAccept}
                    onClick={e=>{e.stopPropagation();acceptRequest(user.id);}}>
                    <CheckIcon/>
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* ── POPUP ── */}
      {popup && (
        <div style={gs.overlay} onClick={()=>setPopup(null)}>
          <div style={gs.popup} onClick={e=>e.stopPropagation()}>
            <div style={gs.popupHandle}/>
            <Avatar user={popup} size={72}/>
            <div style={{fontSize:18,fontWeight:700,color:'#F0F0F5',marginTop:10}}>{popup.displayName||popup.username}</div>
            <div style={{fontSize:13,color:'#8888AA'}}>@{popup.username}</div>
            <div style={{display:'flex',alignItems:'center',gap:6,marginTop:4}}>
              <span style={{...gs.statusDot,background:STATUS[getStatus(popup)]?.dot||'#44445A'}}/>
              <span style={{fontSize:12,color:STATUS[getStatus(popup)]?.color||'#44445A'}}>
                {STATUS[getStatus(popup)]?.label||'Offline'}
              </span>
            </div>
            <div style={{display:'flex',gap:10,width:'100%',marginTop:16}}>
              <button style={gs.popupBtnPrimary}
                onClick={()=>{setPopup(null);onOpenChat&&onOpenChat(popup);}}>
                Message
              </button>
              {!friendMap[popup.id] && (
                <button style={gs.popupBtnSecondary}
                  onClick={()=>{sendRequest(popup.id);setPopup(null);}}>
                  Add Friend
                </button>
              )}
              {friendMap[popup.id]==='friends'  && <span style={{...gs.badge,...gs.badgeFriend,padding:'10px 16px',borderRadius:12}}>✓ Friends</span>}
              {friendMap[popup.id]==='pending'   && <span style={{...gs.badge,padding:'10px 16px',borderRadius:12}}>Request Sent</span>}
            </div>
            <button style={gs.popupClose} onClick={()=>setPopup(null)}>Cancel</button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── STYLES ────────────────────────────────────────────────────────────────────
const gs = {
  wrap:    { display:'flex',flexDirection:'column',height:'100%',background:'#0A0A0F',overflow:'hidden' },
  header:  { padding:'12px 14px 8px',borderBottom:'1px solid rgba(255,255,255,0.07)' },
  searchWrap:{ display:'flex',alignItems:'center',gap:8,background:'#13131A',border:'1px solid rgba(255,255,255,0.07)',borderRadius:12,padding:'9px 12px' },
  searchInput:{ flex:1,background:'none',border:'none',color:'#F0F0F5',fontSize:14,outline:'none',fontFamily:'inherit' },
  tabs:    { display:'flex',borderBottom:'1px solid rgba(255,255,255,0.07)',padding:'0 14px',gap:0,flexShrink:0 },
  tab:     { flex:1,padding:'10px 4px',background:'none',border:'none',color:'#44445A',fontSize:12,fontWeight:500,cursor:'pointer',fontFamily:'inherit',display:'flex',alignItems:'center',justifyContent:'center',gap:5,borderBottom:'2px solid transparent',transition:'color .15s',whiteSpace:'nowrap' },
  tabActive:{ color:'#BF5FFF',borderBottomColor:'#BF5FFF' },
  tabCount:{ borderRadius:20,padding:'1px 6px',fontSize:10,fontWeight:700 },
  list:    { flex:1,overflowY:'auto',paddingBottom:'4rem' },
  row:     { display:'flex',alignItems:'center',gap:12,padding:'10px 14px',cursor:'pointer',transition:'background .1s',borderBottom:'1px solid rgba(255,255,255,0.03)' },
  info:    { flex:1,minWidth:0 },
  name:    { fontSize:14,fontWeight:600,color:'#F0F0F5',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap' },
  statusDot:{ width:7,height:7,borderRadius:'50%',flexShrink:0,display:'inline-block' },
  btnMsg:  { background:'rgba(191,95,255,0.12)',border:'1px solid rgba(191,95,255,0.3)',color:'#BF5FFF',borderRadius:8,padding:'6px 10px',cursor:'pointer',display:'flex',alignItems:'center',gap:4,fontSize:12,fontWeight:600 },
  btnAdd:  { background:'rgba(255,255,255,0.06)',border:'1px solid rgba(255,255,255,0.1)',color:'#F0F0F5',borderRadius:8,padding:'6px 10px',cursor:'pointer',display:'flex',alignItems:'center',gap:4,fontSize:12 },
  btnAccept:{ background:'#22c55e',border:'none',color:'#fff',borderRadius:8,padding:'6px 10px',cursor:'pointer',display:'flex',alignItems:'center',gap:4,fontSize:12,fontWeight:600 },
  badge:   { fontSize:11,color:'#44445A',background:'rgba(255,255,255,0.05)',border:'1px solid rgba(255,255,255,0.08)',borderRadius:20,padding:'3px 8px' },
  badgeFriend:{ color:'#22c55e',background:'rgba(34,197,94,0.1)',borderColor:'rgba(34,197,94,0.3)' },
  empty:   { textAlign:'center',padding:'48px 16px',color:'#44445A',fontSize:13 },
  emptyState:{ textAlign:'center',padding:'48px 20px' },
  overlay: { position:'fixed',inset:0,background:'rgba(0,0,0,0.75)',zIndex:300,display:'flex',alignItems:'flex-end',justifyContent:'center' },
  popup:   { width:'100%',maxWidth:480,background:'#13131A',borderRadius:'20px 20px 0 0',border:'1px solid rgba(255,255,255,0.08)',padding:'14px 20px 36px',display:'flex',flexDirection:'column',alignItems:'center',gap:4 },
  popupHandle:{ width:36,height:4,background:'rgba(255,255,255,0.12)',borderRadius:99,marginBottom:12 },
  popupBtnPrimary:{ flex:1,padding:'12px 0',background:'#BF5FFF',color:'#fff',border:'none',borderRadius:12,fontSize:14,fontWeight:600,cursor:'pointer',fontFamily:'inherit' },
  popupBtnSecondary:{ flex:1,padding:'12px 0',background:'#1A1A26',color:'#F0F0F5',border:'1px solid rgba(255,255,255,0.08)',borderRadius:12,fontSize:14,cursor:'pointer',fontFamily:'inherit' },
  popupClose:{ marginTop:8,background:'none',border:'none',color:'#44445A',cursor:'pointer',fontSize:13,fontFamily:'inherit' },
};
