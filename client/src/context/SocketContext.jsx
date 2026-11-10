import { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';

const SocketContext = createContext({ socket: null, connected: false });

export function SocketProvider({ children }) {
  const { user } = useAuth();
  const userId = user?._id; // the server's user JSON uses Mongoose's default "_id"
  const [socket, setSocket] = useState(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    if (!userId) return; // logged out: no connection

    const token = localStorage.getItem('annaseva_token');
    // Connect, sending the JWT in the handshake so the server can authenticate us.
    const newSocket = io(import.meta.env.VITE_SOCKET_URL, { auth: { token } });

    newSocket.on('connect', () => setConnected(true));
    newSocket.on('disconnect', () => setConnected(false));
    newSocket.on('connect_error', (err) => console.warn('Socket connection problem:', err.message));

    setSocket(newSocket);
    // DEV ONLY: lets you inspect the socket in the browser console, e.g.
    // __annasevaSocket.listeners('listing:new').length should be 1 (more = a missing cleanup).
    // Vite removes this block from production builds.
    if (import.meta.env.DEV) window.__annasevaSocket = newSocket;

    // CLEANUP: runs on logout, on unmount, and in dev's double-run. Closes the connection.
    return () => {
      newSocket.disconnect();
      setSocket(null);
      setConnected(false);
    };
  }, [userId]);

  return <SocketContext.Provider value={{ socket, connected }}>{children}</SocketContext.Provider>;
}

export const useSocket = () => useContext(SocketContext);
