'use client';

import { io, Socket } from 'socket.io-client';

let socket: Socket | null = null;

export const getSocket = (): Socket => {
  if (typeof window === 'undefined') {
    throw new Error('Socket.io can only be used on the client side');
  }

  if (!socket) {
    // Use the same base URL logic as axios.ts
    const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:4000';
    socket = io(apiBaseUrl, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5
    });

    socket.on('connect', () => {
      console.log('✅ Socket.io connected:', socket?.id);
    });

    socket.on('disconnect', () => {
      console.log('❌ Socket.io disconnected');
    });

    socket.on('connect_error', (error) => {
      console.error('Socket.io connection error:', error);
    });
  }

  return socket;
};

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};

