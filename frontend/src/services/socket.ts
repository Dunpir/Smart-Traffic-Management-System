import { io, Socket } from 'socket.io-client';

let socket: Socket | null = null;

export const getSocket = (): Socket => {
  if (!socket) {
    socket = io('/', {
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 10,
      reconnectionDelay: 2000,
    });

    socket.on('connect', () => {
      console.log('⚡ Connected to Traffic Controller WebSocket server');
    });

    socket.on('disconnect', () => {
      console.warn('⚠️ Disconnected from Traffic Controller WebSocket server');
    });
  }

  return socket;
};
