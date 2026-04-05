import { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { useSocket } from '../../contexts/SocketContext';
import { storage, KEYS } from '../../utils/storage';

const ParentMessages = () => {
  const { user } = useAuth();
  const { t, lang } = useLanguage();
  const { sendMessage, getChatId, getConversation, messages } = useSocket();
  const [activeChatId, setActiveChatId] = useState(null);
  const [activeChatLabel, setActiveChatLabel] = useState('');
  const [text, setText] = useState('');
  const messagesEndRef = useRef(null);

  const allUsers = storage.getAll(KEYS.USERS);
  const children = allUsers.filter(u => user?.childrenIds?.includes(u.id));

  // One chat per unique teacher — collect all children for that teacher
  const teacherMap = new Map();
  children.forEach(child => {
    const cls = storage.findOne(KEYS.CLASSES, c => c.studentIds?.includes(child.id));
    const teacher = cls ? allUsers.find(u => u.id === cls.teacherId) : null;
    if (!teacher) return;
    if (teacherMap.has(teacher.id)) {
      teacherMap.get(teacher.id).childNames.push(child.nameAr || child.name);
    } else {
      teacherMap.set(teacher.id, { teacher, childNames: [child.nameAr || child.name] });
    }
  });
  const teacherChats = Array.from(teacherMap.values());

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeChatId, messages]);

  const conversation = activeChatId ? getConversation(activeChatId) : [];

  const openChat = (teacherId, label) => {
    const chatId = getChatId(teacherId, 'private');
    setActiveChatId(chatId);
    setActiveChatLabel(label);
  };

  const handleSend = (e) => {
    e.preventDefault();
    if (!text.trim() || !activeChatId) return;
    const ids = activeChatId.split('_');
    const toId = ids.find(id => id !== user?.id);
    if (toId) sendMessage(toId, text, 'private');
    setText('');
  };

  const formatTime = (ts) => new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  return (
    <div className="h-[calc(100vh-8rem)] flex gap-4">
      {/* Contacts */}
      <div className="w-64 flex-shrink-0 card flex flex-col overflow-hidden">
        <div className="p-4 border-b border-[var(--color-border)]">
          <h2 className="font-semibold">{t('msg.title')}</h2>
          <p className="text-xs text-[var(--color-text-muted)] mt-0.5">{t('msg.withTeacher')}</p>
        </div>
        <div className="flex-1 overflow-y-auto p-2">
          {teacherChats.length === 0 ? (
            <p className="text-sm text-[var(--color-text-muted)] p-3">{t('common.noData')}</p>
          ) : teacherChats.map(({ teacher, childNames }) => {
            const chatId = getChatId(teacher.id, 'private');
            const isActive = activeChatId === chatId;
            return (
              <button
                key={teacher.id}
                onClick={() => openChat(teacher.id, teacher.nameAr || teacher.name)}
                className={`w-full flex items-center gap-3 p-2.5 rounded-xl text-start transition-colors mb-1 ${isActive ? 'bg-brand-green-100 dark:bg-brand-green-900/30 border border-brand-green-300 dark:border-brand-green-700' : 'hover:bg-[var(--color-border)] border border-transparent'}`}
              >
                <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                  {(teacher.nameAr || teacher.name || '?').charAt(0)}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{teacher.nameAr || teacher.name}</p>
                  <p className="text-xs text-[var(--color-text-muted)] truncate">{childNames.join(', ')}</p>
                </div>
              </button>
            );
          })}
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
            <div className="px-5 py-4 border-b border-[var(--color-border)] flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center text-white font-bold">
                {activeChatLabel.charAt(0)}
              </div>
              <div>
                <p className="font-semibold text-[var(--color-text)]">{activeChatLabel}</p>
                <p className="text-xs text-[var(--color-text-muted)]">{t('msg.private')}</p>
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
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
};

export default ParentMessages;
