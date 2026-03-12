import { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';

const SocketContext = createContext(null);

export const SocketProvider = ({ children, token }) => {
  const [socket, setSocket] = useState(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    if (!token) return;
    const s = io('/', { auth: { token }, transports: ['websocket'] });
    s.on('connect', () => { setConnected(true); setSocket(s); });
    s.on('disconnect', () => setConnected(false));
    setSocket(s);
    return () => s.disconnect();
  }, [token]);

  return (
    <SocketContext.Provider value={{ socket, connected }}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => useContext(SocketContext);
