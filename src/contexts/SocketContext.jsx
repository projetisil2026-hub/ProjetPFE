import { createContext, useContext, useEffect, useRef, useCallback, useState } from 'react';
import { io } from 'socket.io-client';
import { messagesAPI } from '../services/api';

const SocketContext = createContext(null);

export const SocketProvider = ({ children, userId }) => {
  const socketRef = useRef(null);
  const [messages, setMessages] = useState([]);

  useEffect(() => {
    if (!userId) return;

    // Load initial messages from backend
    messagesAPI.getAll()
      .then(r => setMessages(r.data))
      .catch(err => console.error('[Socket] load messages failed:', err.message));

    // Connect to real Socket.io
    const socket = io({ query: { userId }, transports: ['websocket', 'polling'] });
    socketRef.current = socket;

    socket.on('new_message', (msg) => {
      setMessages(prev => {
        if (prev.find(m => m.id === msg.id)) return prev;
        return [...prev, msg];
      });
    });

    return () => {
      socket.disconnect();
    };
  }, [userId]);

  const sendMessage = useCallback(async (toId, message, type = 'private') => {
    if (!userId) return;
    try {
      const res = await messagesAPI.send(toId, message, type);
      const msg = res.data;
      setMessages(prev => {
        if (prev.find(m => m.id === msg.id)) return prev;
        return [...prev, msg];
      });
      return msg;
    } catch (err) {
      console.error('[Socket] sendMessage failed:', err.message);
    }
  }, [userId]);

  const getChatId = useCallback((otherId, type = 'private') => {
    if (type === 'group') return `group_${otherId}`;
    return [userId, otherId].sort().join('_');
  }, [userId]);

  const getConversation = useCallback((chatId) => {
    return messages
      .filter(m => m.chatId === chatId)
      .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
  }, [messages]);

  const getChats = useCallback(() => {
    const relevantMsgs = messages.filter(m =>
      m.fromId === userId || m.toId === userId ||
      (m.type === 'group' && m.chatId?.startsWith('group_'))
    );
    const chatMap = new Map();
    relevantMsgs.forEach(m => {
      const existing = chatMap.get(m.chatId);
      if (!existing || new Date(m.timestamp) > new Date(existing.timestamp)) {
        chatMap.set(m.chatId, m);
      }
    });
    return Array.from(chatMap.values())
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  }, [messages, userId]);

  return (
    <SocketContext.Provider value={{
      socket: socketRef.current, sendMessage, getChatId,
      getConversation, getChats, messages,
    }}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => {
  const ctx = useContext(SocketContext);
  if (!ctx) throw new Error('useSocket must be used within SocketProvider');
  return ctx;
};
