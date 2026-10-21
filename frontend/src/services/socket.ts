import { io, Socket } from 'socket.io-client';

let socket: Socket | null = null;

const DEFAULT_PROD_API = 'https://smart-traffic-management-system-zhgn.onrender.com';

export const getSocket = (): Socket => {
  if (!socket) {
    const envApiUrl = ((import.meta as any).env?.VITE_API_URL || '').trim();
    const activeUrl = envApiUrl || ((import.meta as any).env?.PROD ? DEFAULT_PROD_API : '');
    const socketHost = activeUrl ? activeUrl.replace(/\/api\/?$/, '').replace(/\/$/, '') : undefined;

    socket = io(socketHost || '/', {
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
