import { useState, useRef } from 'react';
import { sendMessage } from '../../../services/api';
import { useSocket } from '../../../context/SocketContext';

export default function MessageInput({ recipientId, groupId, onSent }) {
  const [text, setText] = useState('');
  const [recording, setRecording] = useState(false);
  const { socket } = useSocket();
  const typingTimeout = useRef(null);
  const mediaRecorder = useRef(null);

  const handleChange = (e) => {
    setText(e.target.value);
    socket?.emit('typing_start', { recipientId, groupId });
    clearTimeout(typingTimeout.current);
    typingTimeout.current = setTimeout(() => socket?.emit('typing_stop', { recipientId, groupId }), 2000);
  };

  const handleSend = async () => {
    if (!text.trim()) return;
    try {
      const res = await sendMessage({ recipientId, groupId, content: text, type: 'text' });
      onSent?.(res.data);
      setText('');
      socket?.emit('typing_stop', { recipientId, groupId });
    } catch (err) { console.error('Send failed', err); }
  };

  const handleKey = (e) => { if (e.key==='Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      const chunks = [];
      recorder.ondataavailable = e => chunks.push(e.data);
      recorder.onstop = () => { stream.getTracks().forEach(t=>t.stop()); setRecording(false); };
      recorder.start();
      mediaRecorder.current = recorder;
      setRecording(true);
    } catch { alert('Microphone access denied'); }
  };

  return (
    <div className="message-input-area">
      <button className="icon-btn">😊</button>
      <button className="icon-btn">📎</button>
      <textarea className="message-input" value={text} onChange={handleChange} onKeyDown={handleKey} placeholder="Type a message..." rows={1} />
      {text
        ? <button className="send-btn" onClick={handleSend}>➤</button>
        : <button className={`voice-btn ${recording?'recording':''}`} onMouseDown={startRecording} onMouseUp={()=>mediaRecorder.current?.stop()}>{recording?'🔴':'🎤'}</button>
      }
    </div>
  );
}
