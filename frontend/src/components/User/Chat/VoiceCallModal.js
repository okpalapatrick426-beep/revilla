// frontend/src/components/User/Chat/VoiceCallModal.js  — NEW FILE
// Drop this next to ChatWindow.js and import it in your main chat page.
// Usage:
//   <VoiceCallModal
//     call={callState}          // { peer, isVideo, isIncoming, signal }
//     currentUser={currentUser}
//     onEnd={() => setCallState(null)}
//   />
//
// In the parent, listen for incomingCall on the socket:
//   socket.on('incomingCall', ({ from, fromName, fromAvatar, signal, isVideo }) => {
//     setCallState({ peer: { id: from, displayName: fromName, avatar: fromAvatar }, isVideo, isIncoming: true, signal });
//   });
//
// And pass onStartCall to ChatWindow:
//   onStartCall={(peer, isVideo) => setCallState({ peer, isVideo, isIncoming: false })}

import React, { useEffect, useRef, useState } from 'react';
import { getSocket } from '../../../services/socket';

const MicOffIcon = () => <svg viewBox="0 0 24 24" fill="currentColor" width="22" height="22"><path d="M19 11h-1.7c0 .74-.16 1.43-.43 2.05l1.23 1.23c.56-.98.9-2.09.9-3.28zm-4.02.17c0-.06.02-.11.02-.17V5c0-1.66-1.34-3-3-3S9 3.34 9 5v.18l5.98 5.99zM4.27 3L3 4.27l6.01 6.01V11c0 1.66 1.33 3 2.99 3 .22 0 .44-.03.65-.08l1.66 1.66c-.71.33-1.5.52-2.31.52-2.76 0-5.3-2.1-5.3-5.1H5c0 3.41 2.72 6.23 6 6.72V21h2v-3.28c.91-.13 1.77-.45 2.54-.9L19.73 21 21 19.73 4.27 3z"/></svg>;
const MicOnIcon = () => <svg viewBox="0 0 24 24" fill="currentColor" width="22" height="22"><path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm5.91-3c-.49 0-.9.36-.98.85C16.52 14.2 14.47 16 12 16s-4.52-1.8-4.93-4.15c-.08-.49-.49-.85-.98-.85-.61 0-1.09.54-1 1.14.49 3 2.89 5.35 5.91 5.78V20c0 .55.45 1 1 1s1-.45 1-1v-2.08c3.02-.43 5.42-2.78 5.91-5.78.1-.6-.39-1.14-1-1.14z"/></svg>;
const EndCallIcon = () => <svg viewBox="0 0 24 24" fill="currentColor" width="26" height="26"><path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z" transform="rotate(135 12 12)"/></svg>;
const CamOffIcon = () => <svg viewBox="0 0 24 24" fill="currentColor" width="22" height="22"><path d="M18 10.48V6c0-1.1-.9-2-2-2H6.83L18 16.17V10.48zM3.27 2L2 3.27 4.73 6H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h14c.28 0 .53-.06.77-.15L20.73 24 22 22.73 3.27 2zM4 20V8h.73L16 19.27V20H4z"/></svg>;
const CamOnIcon = () => <svg viewBox="0 0 24 24" fill="currentColor" width="22" height="22"><path d="M17 10.5V7c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1v10c0 .55.45 1 1 1h12c.55 0 1-.45 1-1v-3.5l4 4v-11l-4 4z"/></svg>;

export default function VoiceCallModal({ call, currentUser, onEnd }) {
  const [status, setStatus] = useState(call?.isIncoming ? 'incoming' : 'calling'); // calling | incoming | connected | ended
  const [muted, setMuted] = useState(false);
  const [camOff, setCamOff] = useState(false);
  const [duration, setDuration] = useState(0);

  const pcRef        = useRef(null);
  const localStream  = useRef(null);
  const localVidRef  = useRef(null);
  const remoteVidRef = useRef(null);
  const timerRef     = useRef(null);

  const BASE = (process.env.REACT_APP_API_URL || '').replace('/api', '');
  const avatarUrl = (a) => !a ? null : a.startsWith('http') ? a : `${BASE}${a}`;

  // ── Setup WebRTC ─────────────────────────────────────────────
  useEffect(() => {
    const socket = getSocket();
    if (!socket || !call) return;

    const ICE_SERVERS = [{ urls: 'stun:stun.l.google.com:19302' }];

    const start = async () => {
      try {
        const constraints = call.isVideo
          ? { audio: true, video: { facingMode: 'user' } }
          : { audio: true, video: false };

        localStream.current = await navigator.mediaDevices.getUserMedia(constraints);

        if (localVidRef.current && call.isVideo) {
          localVidRef.current.srcObject = localStream.current;
        }

        const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });
        pcRef.current = pc;

        localStream.current.getTracks().forEach(track => pc.addTrack(track, localStream.current));

        pc.ontrack = (ev) => {
          if (remoteVidRef.current) remoteVidRef.current.srcObject = ev.streams[0];
        };

        pc.onicecandidate = (ev) => {
          if (ev.candidate) socket.emit('iceCandidate', { to: call.peer.id, candidate: ev.candidate });
        };

        if (!call.isIncoming) {
          // Caller: create offer
          const offer = await pc.createOffer();
          await pc.setLocalDescription(offer);
          socket.emit('callUser', {
            to: call.peer.id,
            from: currentUser.id,
            fromName: currentUser.displayName || currentUser.username,
            fromAvatar: currentUser.avatar,
            signal: offer,
            isVideo: call.isVideo,
          });
        } else {
          // Callee: set remote description from caller's offer
          await pc.setRemoteDescription(new RTCSessionDescription(call.signal));
          const answer = await pc.createAnswer();
          await pc.setLocalDescription(answer);
          socket.emit('answerCall', { to: call.peer.id, signal: answer });
          setStatus('connected');
          startTimer();
        }
      } catch (err) {
        console.error('WebRTC start error:', err);
        setStatus('ended');
        setTimeout(onEnd, 2000);
      }
    };

    const onCallAccepted = async ({ signal }) => {
      try {
        await pcRef.current?.setRemoteDescription(new RTCSessionDescription(signal));
        setStatus('connected');
        startTimer();
      } catch (err) { console.error('callAccepted error:', err); }
    };

    const onIceCandidate = async ({ candidate }) => {
      try {
        if (candidate) await pcRef.current?.addIceCandidate(new RTCIceCandidate(candidate));
      } catch {}
    };

    const onCallRejected = () => { setStatus('ended'); setTimeout(onEnd, 1500); };
    const onCallEnded    = () => { cleanup(); setStatus('ended'); setTimeout(onEnd, 1500); };

    socket.on('callAccepted', onCallAccepted);
    socket.on('iceCandidate', onIceCandidate);
    socket.on('callRejected', onCallRejected);
    socket.on('callEnded',    onCallEnded);

    start();

    return () => {
      socket.off('callAccepted', onCallAccepted);
      socket.off('iceCandidate', onIceCandidate);
      socket.off('callRejected', onCallRejected);
      socket.off('callEnded',    onCallEnded);
      cleanup();
    };
  }, []); // eslint-disable-line

  const startTimer = () => {
    timerRef.current = setInterval(() => setDuration(d => d + 1), 1000);
  };

  const cleanup = () => {
    clearInterval(timerRef.current);
    pcRef.current?.close();
    localStream.current?.getTracks().forEach(t => t.stop());
  };

  const acceptCall = () => {
    // status was 'incoming' — we already set up the PC in useEffect
    // Just update UI; the actual WebRTC answer was sent in start()
    setStatus('connected');
    startTimer();
  };

  const endCall = () => {
    const socket = getSocket();
    socket?.emit('endCall', { to: call.peer.id });
    cleanup();
    setStatus('ended');
    setTimeout(onEnd, 800);
  };

  const rejectCall = () => {
    const socket = getSocket();
    socket?.emit('rejectCall', { to: call.peer.id });
    cleanup();
    onEnd();
  };

  const toggleMic = () => {
    localStream.current?.getAudioTracks().forEach(t => { t.enabled = muted; });
    setMuted(m => !m);
  };

  const toggleCam = () => {
    localStream.current?.getVideoTracks().forEach(t => { t.enabled = camOff; });
    setCamOff(c => !c);
  };

  const fmtDuration = (s) =>
    `${Math.floor(s / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`;

  const peer = call?.peer || {};

  return (
    <div className="call-modal-overlay">
      <div className={`call-modal ${call?.isVideo ? 'video-call' : 'voice-call'}`}>

        {/* Remote video (full background in video call) */}
        {call?.isVideo && (
          <video ref={remoteVidRef} autoPlay playsInline className="remote-video" />
        )}

        {/* Local video (PiP) */}
        {call?.isVideo && (
          <video ref={localVidRef} autoPlay playsInline muted className="local-video" />
        )}

        {/* Hidden audio output for voice calls */}
        {!call?.isVideo && (
          <audio ref={remoteVidRef} autoPlay />
        )}

        <div className="call-modal-inner">
          {/* Avatar */}
          <div className="call-avatar-wrap">
            {avatarUrl(peer.avatar)
              ? <img src={avatarUrl(peer.avatar)} alt="" className="call-avatar" />
              : <div className="call-avatar-placeholder">{(peer.displayName || peer.username || '?')[0].toUpperCase()}</div>
            }
          </div>

          <h3 className="call-name">{peer.displayName || peer.username}</h3>

          <p className="call-status-label">
            {status === 'calling'   ? (call?.isVideo ? '📹 Calling…' : '📞 Calling…')
            : status === 'incoming' ? (call?.isVideo ? '📹 Incoming video call' : '📞 Incoming call')
            : status === 'connected'? fmtDuration(duration)
            : 'Call ended'}
          </p>

          {/* Controls */}
          <div className="call-controls">
            {status === 'incoming' ? (
              <>
                <button className="call-btn reject" onClick={rejectCall}><EndCallIcon /></button>
                <button className="call-btn accept" onClick={acceptCall}><MicOnIcon /></button>
              </>
            ) : status === 'connected' ? (
              <>
                <button className={`call-btn ${muted ? 'active' : ''}`} onClick={toggleMic}>
                  {muted ? <MicOffIcon /> : <MicOnIcon />}
                </button>
                {call?.isVideo && (
                  <button className={`call-btn ${camOff ? 'active' : ''}`} onClick={toggleCam}>
                    {camOff ? <CamOffIcon /> : <CamOnIcon />}
                  </button>
                )}
                <button className="call-btn end" onClick={endCall}><EndCallIcon /></button>
              </>
            ) : (
              status !== 'ended' && (
                <button className="call-btn end" onClick={endCall}><EndCallIcon /></button>
              )
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
