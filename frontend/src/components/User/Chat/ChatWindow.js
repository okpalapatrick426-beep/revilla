import { useState, useEffect, useRef } from 'react';
import { getConversation, deleteMessage } from '../../../services/api';
import { useSocket } from '../../../context/SocketContext';
import { useAuth } from '../../../context/AuthContext';
import MessageInput from './MessageInput';

export default function ChatWindow({ contact }) {
  const [messages, setMessages] = useState([]);
  const [typing, setTyping] = useState(false);
  const bottomRef = useRef(null);
  const { socket } = useSocket();
  const { user } = useAuth();

  const loadMessages = () => {
    if (!contact) return;
    getConversation(contact.id).then(res => setMessages(res.data || [])).catch(() => {});
  };

  useEffect(() => {
    if (!contact) return;
    loadMessages();
    socket?.emit('join_dm', { userId: contact.id });

    // Poll every 3 seconds as fallback
    const interval = setInterval(loadMessages, 2000);
    return () => clearInterval(interval);
  }, [contact?.id]);

  useEffect(() => {
    if (!socket || !contact) return;
    const handler = (msg) => {
      const isRelevant =
        (msg.senderId === contact?.id && msg.recipientId === user?.id) ||
        (msg.senderId === user?.id && msg.recipientId === contact?.id);
      if (isRelevant) {
        setMessages(prev => prev.find(m => m.id === msg.id) ? prev : [...prev, msg]);
      }
    };
    const typingOn = ({ userId }) => { if (userId === contact?.id) setTyping(true); };
    const typingOff = ({ userId }) => { if (userId === contact?.id) setTyping(false); };
    const delHandler = ({ id }) => {
      setMessages(prev => prev.map(m => m.id === id ? { ...m, deletedForEveryone: true } : m));
    };
    socket.on('new_message', handler);
    socket.on('typing', typingOn);
    socket.on('stop_typing', typingOff);
    socket.on('message_deleted', delHandler);
    return () => {
      socket.off('new_message', handler);
      socket.off('typing', typingOn);
      socket.off('stop_typing', typingOff);
      socket.off('message_deleted', delHandler);
    };
  }, [socket, contact?.id, user?.id]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleDelete = async (id, forEveryone) => {
    await deleteMessage(id, forEveryone);
    if (forEveryone) {
      setMessages(prev => prev.map(m => m.id === id ? { ...m, deletedForEveryone: true } : m));
    } else {
      setMessages(prev => prev.filter(m => m.id !== id));
    }
  };

  if (!contact) return (
    <div className="chat-empty">
      <div className="chat-empty-icon">??</div>
      <h3>Select a conversation</h3>
      <p>Choose someone to start chatting</p>
    </div>
  );

  return (
    <div className="chat-window">
      <div className="chat-header">
        <div className="chat-avatar">{(contact.displayName || contact.username || '?')[0]}</div>
        <div className="chat-header-info">
          <h3>{contact.displayName || contact.username}</h3>
          <span className={contact.isOnline ? 'status-online' : 'status-offline'}>
            {contact.isOnline ? '? Online' : '? Offline'}
          </span>
        </div>
      </div>
      <div className="messages-container">
        {messages.map(msg => (
          <div key={msg.id} className={`message-row ${msg.senderId === user?.id ? 'outgoing' : 'incoming'}`}>
            <div className="message-bubble-wrap">
              {msg.senderId !== user?.id && (
                <div className="msg-sender-name">{msg.sender?.displayName || msg.sender?.username}</div>
              )}
              <div className={`message-bubble ${msg.deletedForEveryone ? 'deleted' : ''}`}>
                {msg.deletedForEveryone ? <em>?? This message was deleted</em> : msg.content}
              </div>
              <div className="message-meta">
                <span className="message-time">
                  {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
                {msg.senderId === user?.id && !msg.deletedForEveryone && (
                  <span className="message-actions">
                    <button onClick={() => handleDelete(msg.id, false)}>Delete for me</button>
                    <button onClick={() => handleDelete(msg.id, true)}>Delete for everyone</button>
                  </span>
                )}
              </div>
            </div>
          </div>
        ))}
        {typing && (
          <div className="message-row incoming">
            <div className="typing-bubble"><span /><span /><span /></div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>
      <MessageInput recipientId={contact.id} onSent={msg => setMessages(prev => prev.find(m => m.id === msg.id) ? prev : [...prev, msg])} />
    </div>
  );
}


