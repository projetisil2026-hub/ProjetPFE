import { createContext, useContext, useEffect, useRef, useCallback, useState } from 'react';
import { storage, KEYS } from '../utils/storage';
import { generateId } from '../utils/auth';

const SocketContext = createContext(null);

// Mock socket using BroadcastChannel + localStorage polling
class MockSocket {
  constructor(userId) {
    this.userId = userId;
    this.listeners = {};
    this.connected = true;
    this.channel = null;
    try {
      this.channel = new BroadcastChannel('tatabu_messages');
    } catch {
      // BroadcastChannel not available (e.g. older browsers)
    }
  }

  on(event, callback) {
    if (!this.listeners[event]) this.listeners[event] = [];
    this.listeners[event].push(callback);
    return this;
  }

  off(event) {
    delete this.listeners[event];
  }

  emit(event, data) {
    this.trigger(event, data);
    if (this.channel) {
      try {
        this.channel.postMessage({ event, data, from: this.userId });
      } catch {}
    }
  }

  trigger(event, data) {
    (this.listeners[event] || []).forEach(cb => cb(data));
  }

  listen() {
    if (this.channel) {
      this.channel.onmessage = (e) => {
        if (e.data?.from !== this.userId) {
          this.trigger(e.data.event, e.data.data);
        }
      };
    }
  }

  disconnect() {
    this.connected = false;
    if (this.channel) {
      try { this.channel.close(); } catch {}
    }
  }
}

export const SocketProvider = ({ children, userId }) => {
  const socketRef = useRef(null);
  const [messages, setMessages] = useState([]);

  useEffect(() => {
    if (!userId) return;
    const sock = new MockSocket(userId);
    sock.listen();
    socketRef.current = sock;

    // Load initial messages
    const allMsgs = storage.getAll(KEYS.MESSAGES);
    setMessages(allMsgs);

    // Poll for new messages every 3 seconds
    const interval = setInterval(() => {
      const fresh = storage.getAll(KEYS.MESSAGES);
      setMessages(fresh);
    }, 3000);

    // Also listen to storage events
    const handleStorage = (e) => {
      if (e.key === KEYS.MESSAGES) {
        try {
          setMessages(JSON.parse(e.newValue) || []);
        } catch {}
      }
    };
    window.addEventListener('storage', handleStorage);

    return () => {
      sock.disconnect();
      clearInterval(interval);
      window.removeEventListener('storage', handleStorage);
    };
  }, [userId]);

  const sendMessage = useCallback((toId, message, type = 'private') => {
    if (!userId) return;
    const chatId = type === 'group'
      ? `group_${toId}`
      : [userId, toId].sort().join('_');

    const msg = {
      id: generateId(),
      fromId: userId,
      toId,
      message: message.trim(),
      timestamp: new Date().toISOString(),
      type,
      chatId,
    };

    storage.add(KEYS.MESSAGES, msg);
    setMessages(prev => [...prev, msg]);

    // Notify via BroadcastChannel
    if (socketRef.current) {
      socketRef.current.emit('new_message', msg);
    }

    // Trigger storage event for cross-tab sync
    window.dispatchEvent(new StorageEvent('storage', {
      key: KEYS.MESSAGES,
      newValue: JSON.stringify(storage.getAll(KEYS.MESSAGES)),
    }));

    return msg;
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
    // Get all unique chat IDs involving this user
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
    <SocketContext.Provider value={{ socket: socketRef.current, sendMessage, getChatId, getConversation, getChats, messages }}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => {
  const ctx = useContext(SocketContext);
  if (!ctx) throw new Error('useSocket must be used within SocketProvider');
  return ctx;
};
