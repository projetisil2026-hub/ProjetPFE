import { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { useSocket } from '../../contexts/SocketContext';
import { storage, KEYS } from '../../utils/storage';

const StudentMessages = () => {
  const { user } = useAuth();
  const { t, lang } = useLanguage();
  const { sendMessage, getChatId, getConversation, messages } = useSocket();
  const [activeChatId, setActiveChatId] = useState(null);
  const [activeChatLabel, setActiveChatLabel] = useState('');
  const [chatType, setChatType] = useState('private');
  const [text, setText] = useState('');
  const messagesEndRef = useRef(null);

  const myClass = storage.findOne(KEYS.CLASSES, c => c.studentIds?.includes(user?.id));
  const allUsers = storage.getAll(KEYS.USERS);
  const myTeacher = myClass ? allUsers.find(u => u.id === myClass.teacherId) : null;
  const classmates = myClass ? allUsers.filter(u => u.role === 'student' && myClass.studentIds?.includes(u.id) && u.id !== user?.id) : [];

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeChatId, messages]);

  const conversation = activeChatId ? getConversation(activeChatId) : [];

  const openChat = (id, label, type = 'private') => {
    setChatType(type);
    const chatId = type === 'group' ? `group_${id}` : getChatId(id, 'private');
    setActiveChatId(chatId);
    setActiveChatLabel(label);
  };

  const handleSend = (e) => {
    e.preventDefault();
    if (!text.trim() || !activeChatId) return;
    if (chatType === 'group' && myClass) {
      sendMessage(myClass.id, text, 'group');
    } else {
      const ids = activeChatId.split('_');
      const toId = ids.find(id => id !== user?.id);
      if (toId) sendMessage(toId, text, 'private');
    }
    setText('');
  };

  const formatTime = (ts) => new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  const ChatBtn = ({ onClick, isActive, avatar, label, sub }) => (
    <button onClick={onClick} className={`w-full flex items-center gap-3 p-2.5 rounded-xl text-start transition-colors ${isActive ? 'bg-brand-green-100 dark:bg-brand-green-900/30' : 'hover:bg-[var(--color-border)]'}`}>
      <div className="w-9 h-9 rounded-xl flex items-center justify-center text-white font-bold text-sm flex-shrink-0" style={{ background: avatar.color }}>{avatar.letter}</div>
      <div className="min-w-0">
        <p className="text-sm font-medium text-[var(--color-text)] truncate">{label}</p>
        {sub && <p className="text-xs text-[var(--color-text-muted)]">{sub}</p>}
      </div>
    </button>
  );

  return (
    <div className="h-[calc(100vh-8rem)] flex gap-4">
      {/* Sidebar */}
      <div className="w-56 flex-shrink-0 card flex flex-col overflow-hidden">
        <div className="p-4 border-b border-[var(--color-border)]"><h2 className="font-semibold">{t('msg.title')}</h2></div>
        <div className="flex-1 overflow-y-auto p-2 space-y-3">
          {myTeacher && (
            <div>
              <p className="text-xs font-semibold text-[var(--color-text-muted)] px-2 py-1 uppercase">{t('role.teacher')}</p>
              <ChatBtn
                onClick={() => openChat(myTeacher.id, myTeacher.name)}
                isActive={activeChatId === getChatId(myTeacher.id)}
                avatar={{ color: '#2563eb', letter: myTeacher.name.charAt(0) }}
                label={myTeacher.name}
                sub={t('role.teacher')}
              />
            </div>
          )}
          {myClass && (
            <div>
              <p className="text-xs font-semibold text-[var(--color-text-muted)] px-2 py-1 uppercase">{t('msg.group')}</p>
              <ChatBtn
                onClick={() => openChat(myClass.id, myClass.name + ' Group', 'group')}
                isActive={activeChatId === `group_${myClass.id}`}
                avatar={{ color: '#16a34a', letter: 'G' }}
                label={myClass.name}
                sub={`${classmates.length + 1} ${t('nav.students').toLowerCase()}`}
              />
            </div>
          )}
        </div>
      </div>

      {/* Chat */}
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
            <div className="px-5 py-4 border-b border-[var(--color-border)]">
              <p className="font-semibold">{activeChatLabel}</p>
              <p className="text-xs text-[var(--color-text-muted)]">{chatType === 'group' ? t('msg.group') : t('msg.private')}</p>
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
                <svg className={`w-4 h-4 ${lang === 'ar' ? 'rtl-flip' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
};

export default StudentMessages;
