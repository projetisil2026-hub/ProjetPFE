import { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { useSocket } from '../../contexts/SocketContext';
import { storage, KEYS } from '../../utils/storage';

const TeacherMessages = () => {
  const { user } = useAuth();
  const { t, lang } = useLanguage();
  const { sendMessage, getChatId, getConversation, messages } = useSocket();
  const [activeChatId, setActiveChatId] = useState(null);
  const [activeChatLabel, setActiveChatLabel] = useState('');
  const [text, setText] = useState('');
  const [chatType, setChatType] = useState('private');
  const messagesEndRef = useRef(null);

  const myClasses = storage.getAll(KEYS.CLASSES).filter(c => c.teacherId === user?.id);
  const allUsers = storage.getAll(KEYS.USERS);
  const admins = allUsers.filter(u => u.role === 'admin');
  const myStudents = allUsers.filter(u => u.role === 'student' && myClasses.some(c => c.studentIds?.includes(u.id)));
  const myParents = myStudents.map(s => {
    const parent = allUsers.find(p => p.id === s.parentId);
    return parent ? { ...parent, childName: s.name, childId: s.id } : null;
  }).filter(Boolean);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeChatId, messages]);

  const conversation = activeChatId ? getConversation(activeChatId) : [];

  const openPrivateChat = (otherId, label) => {
    setChatType('private');
    const chatId = getChatId(otherId, 'private');
    setActiveChatId(chatId);
    setActiveChatLabel(label);
  };

  const openGroupChat = (classId, label) => {
    setChatType('group');
    const chatId = `group_${classId}`;
    setActiveChatId(chatId);
    setActiveChatLabel(label);
  };

  const handleSend = (e) => {
    e.preventDefault();
    if (!text.trim() || !activeChatId) return;

    if (chatType === 'group') {
      const classId = activeChatId.replace('group_', '');
      const cls = myClasses.find(c => c.id === classId);
      // Send to each student in the group
      cls?.studentIds?.forEach(studentId => {
        sendMessage(studentId, text, 'group');
      });
      // Record one message for display
      sendMessage(classId, text, 'group');
    } else {
      const ids = activeChatId.split('_');
      const toId = ids.find(id => id !== user?.id);
      if (toId) sendMessage(toId, text, 'private');
    }
    setText('');
  };

  const formatTime = (ts) => new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  const ChatButton = ({ onClick, isActive, children }) => (
    <button onClick={onClick}
      className={`w-full flex items-center gap-3 p-2.5 rounded-xl text-start transition-colors ${isActive ? 'bg-brand-green-100 dark:bg-brand-green-900/30' : 'hover:bg-[var(--color-border)]'}`}>
      {children}
    </button>
  );

  return (
    <div className="h-[calc(100vh-8rem)] flex gap-4">
      {/* Contacts */}
      <div className="w-64 flex-shrink-0 card flex flex-col overflow-hidden">
        <div className="p-4 border-b border-[var(--color-border)]">
          <h2 className="font-semibold">{t('msg.title')}</h2>
        </div>
        <div className="flex-1 overflow-y-auto p-2 space-y-4">
          {/* Admin */}
          <div>
            <p className="text-xs font-semibold text-[var(--color-text-muted)] px-2 py-1 uppercase">{t('role.admin')}</p>
            {admins.map(a => (
              <ChatButton key={a.id} onClick={() => openPrivateChat(a.id, a.name)} isActive={activeChatId === getChatId(a.id)}>
                <div className="w-8 h-8 rounded-xl bg-purple-600 flex items-center justify-center text-white font-bold text-sm">{a.name.charAt(0)}</div>
                <span className="text-sm font-medium truncate">{a.name}</span>
              </ChatButton>
            ))}
          </div>

          {/* Group chats */}
          <div>
            <p className="text-xs font-semibold text-[var(--color-text-muted)] px-2 py-1 uppercase">{t('msg.group')}</p>
            {myClasses.map(cls => (
              <ChatButton key={cls.id} onClick={() => openGroupChat(cls.id, cls.name + ' Group')} isActive={activeChatId === `group_${cls.id}`}>
                <div className="w-8 h-8 rounded-xl bg-brand-green-600 flex items-center justify-center text-white font-bold text-sm">G</div>
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{cls.name}</p>
                  <p className="text-xs text-[var(--color-text-muted)]">{cls.studentIds?.length || 0} students</p>
                </div>
              </ChatButton>
            ))}
          </div>

          {/* Private students */}
          <div>
            <p className="text-xs font-semibold text-[var(--color-text-muted)] px-2 py-1 uppercase">{t('role.student')}</p>
            {myStudents.map(s => (
              <ChatButton key={s.id} onClick={() => openPrivateChat(s.id, s.name)} isActive={activeChatId === getChatId(s.id)}>
                <div className="w-8 h-8 rounded-xl bg-brand-green-500 flex items-center justify-center text-white font-bold text-sm">{s.name.charAt(0)}</div>
                <span className="text-sm font-medium truncate">{s.name}</span>
              </ChatButton>
            ))}
          </div>

          {/* Parents */}
          <div>
            <p className="text-xs font-semibold text-[var(--color-text-muted)] px-2 py-1 uppercase">{t('role.parent')}</p>
            {myParents.map(p => (
              <ChatButton key={`${p.id}_${p.childId}`} onClick={() => openPrivateChat(p.id, `${p.name} (${p.childName})`)} isActive={activeChatId === getChatId(p.id)}>
                <div className="w-8 h-8 rounded-xl bg-brand-gold-500 flex items-center justify-center text-white font-bold text-sm">{p.name.charAt(0)}</div>
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{p.name}</p>
                  <p className="text-xs text-[var(--color-text-muted)] truncate">Re: {p.childName}</p>
                </div>
              </ChatButton>
            ))}
          </div>
        </div>
      </div>

      {/* Chat area */}
      <div className="flex-1 card flex flex-col overflow-hidden">
        {!activeChatId ? (
          <div className="flex-1 flex items-center justify-center text-[var(--color-text-muted)]">
            <div className="text-center">
              <svg className="w-12 h-12 mx-auto mb-3 opacity-30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              <p>{t('msg.selectChat')}</p>
            </div>
          </div>
        ) : (
          <>
            <div className="px-5 py-4 border-b border-[var(--color-border)] flex items-center gap-3">
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-white font-bold ${chatType === 'group' ? 'bg-brand-green-600' : 'bg-blue-600'}`}>
                {chatType === 'group' ? 'G' : activeChatLabel.charAt(0)}
              </div>
              <div>
                <p className="font-semibold text-[var(--color-text)]">{activeChatLabel}</p>
                <p className="text-xs text-[var(--color-text-muted)]">{chatType === 'group' ? t('msg.group') : t('msg.private')}</p>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {conversation.length === 0 && <p className="text-center text-sm text-[var(--color-text-muted)]">{t('msg.noMessages')}</p>}
              {conversation.map(msg => {
                const isMe = msg.fromId === user?.id;
                return (
                  <div key={msg.id} className={`flex ${isMe ? (lang === 'ar' ? 'justify-start' : 'justify-end') : (lang === 'ar' ? 'justify-end' : 'justify-start')}`}>
                    <div>
                      <div className={isMe ? 'chat-bubble-sent' : 'chat-bubble-received'}>{msg.message}</div>
                      <p className={`text-xs text-[var(--color-text-muted)] mt-0.5 ${isMe ? (lang === 'ar' ? 'text-start' : 'text-end') : (lang === 'ar' ? 'text-end' : 'text-start')}`}>{formatTime(msg.timestamp)}</p>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>
            <form onSubmit={handleSend} className="px-4 py-3 border-t border-[var(--color-border)] flex gap-2">
              <input type="text" value={text} onChange={e => setText(e.target.value)} placeholder={t('msg.typeMessage')} className="input flex-1" />
              <button type="submit" disabled={!text.trim()} className="btn-primary px-5">
                <svg className={`w-4 h-4 ${lang === 'ar' ? 'rtl-flip' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
};

export default TeacherMessages;
