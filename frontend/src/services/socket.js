import { io } from 'socket.io-client';

let socket = null;
const BACKEND = process.env.REACT_APP_API_URL?.replace('/api', '') || 'http://localhost:5000';

export const initSocket = (userId) => {
  if (socket?.connected) return socket;

  socket = io(BACKEND, {
    auth: { userId },
    transports: ['websocket', 'polling'],
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionAttempts: 10,
  });

  socket.on('connect', () => {
    console.log('Socket connected:', socket.id);
    if (socket._heartbeatInterval) clearInterval(socket._heartbeatInterval);
    socket._heartbeatInterval = setInterval(() => {
      if (socket?.connected) socket.emit('heartbeat');
    }, 15000);
  });

  socket.on('disconnect', () => {
    if (socket._heartbeatInterval) clearInterval(socket._heartbeatInterval);
  });

  return socket;
};

export const getSocket = () => socket;

export const disconnectSocket = () => {
  if (socket) {
    if (socket._heartbeatInterval) clearInterval(socket._heartbeatInterval);
    socket.disconnect();
    socket = null;
  }
};
