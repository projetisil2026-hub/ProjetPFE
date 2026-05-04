import { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { useSocket } from '../../contexts/SocketContext';
import { useData } from '../../contexts/DataContext';

const AdminMessages = () => {
  const { user } = useAuth();
  const { t, lang, dir } = useLanguage();
  const { sendMessage, getChatId, getConversation, getChats, messages } = useSocket();
  const { users, loadAll } = useData();
  const [activeChatId, setActiveChatId] = useState(null);
  const [text, setText] = useState('');
  const [teacherSearch, setTeacherSearch] = useState('');
  const messagesEndRef = useRef(null);

  useEffect(() => { loadAll(); }, [loadAll]);

  const allUsers = users.filter(u => u.id !== user?.id && u.role !== 'admin');
  const teachers = allUsers.filter(u => u.role === 'teacher').filter(u =>
    !teacherSearch ||
    (u.nameAr || u.name || '').toLowerCase().includes(teacherSearch.toLowerCase()) ||
    (u.nameEn || '').toLowerCase().includes(teacherSearch.toLowerCase())
  );

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeChatId, messages]);

  const conversation = activeChatId ? getConversation(activeChatId) : [];

  const getOtherUser = (chatId) => {
    const ids = chatId.split('_');
    const otherId = ids.find(id => id !== user?.id);
    return allUsers.find(u => u.id === otherId) || users.find(u => u.id === otherId);
  };

  const openChat = (otherId) => {
    const chatId = getChatId(otherId);
    setActiveChatId(chatId);
  };

  const handleSend = (e) => {
    e.preventDefault();
    if (!text.trim() || !activeChatId) return;
    const ids = activeChatId.split('_');
    const toId = ids.find(id => id !== user?.id);
    if (toId) sendMessage(toId, text);
    setText('');
  };

  const chats = getChats().filter(c =>
    c.chatId.includes(user?.id) && !c.chatId.startsWith('group_')
  );

  const formatTime = (ts) => new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  return (
    <div className="h-[calc(100vh-8rem)] flex gap-4">
      {/* Contacts panel */}
      <div className="w-64 flex-shrink-0 card flex flex-col overflow-hidden">
        <div className="p-4 border-b border-[var(--color-border)]">
          <h2 className="font-semibold text-[var(--color-text)] mb-2">{t('msg.title')}</h2>
          <input
            type="text"
            value={teacherSearch}
            onChange={e => setTeacherSearch(e.target.value)}
            placeholder={t('msg.searchTeacher')}
            className="input text-sm"
          />
        </div>
        <div className="flex-1 overflow-y-auto">
          <div className="p-2">
            <p className="text-xs font-semibold text-[var(--color-text-muted)] px-2 py-1 uppercase tracking-wider">{t('role.teacher')}</p>
            {teachers.length === 0 && (
              <p className="text-xs text-center text-[var(--color-text-muted)] py-4">{t('common.noData')}</p>
            )}
            {teachers.map(u => (
              <button
                key={u.id}
                onClick={() => openChat(u.id)}
                className={`w-full flex items-center gap-3 p-3 rounded-xl transition-colors text-start ${activeChatId === getChatId(u.id) ? 'bg-brand-green-100 dark:bg-brand-green-900/30' : 'hover:bg-[var(--color-border)]'}`}
              >
                <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                  {(u.nameAr || u.name || '?').charAt(0)}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-[var(--color-text)] truncate">{u.nameAr || u.name}</p>
                  <p className="text-xs text-[var(--color-text-muted)]">{t(`role.${u.role}`)}</p>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Chat panel */}
      <div className="flex-1 card flex flex-col overflow-hidden">
        {!activeChatId ? (
          <div className="flex-1 flex items-center justify-center text-[var(--color-text-muted)]">
            <div className="text-center">
              <svg className="w-12 h-12 mx-auto mb-3 opacity-30" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              <p>{t('msg.selectChat')}</p>
            </div>
          </div>
        ) : (
          <>
            {/* Chat header */}
            <div className="px-5 py-4 border-b border-[var(--color-border)] flex items-center gap-3">
              {(() => {
                const other = getOtherUser(activeChatId);
                return (
                  <>
                    <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center text-white font-bold">
                      {(other?.nameAr || other?.name || '?').charAt(0)}
                    </div>
                    <div>
                      <p className="font-semibold text-[var(--color-text)]">{other?.nameAr || other?.name}</p>
                      <p className="text-xs text-[var(--color-text-muted)]">{t(`role.${other?.role}`)}</p>
                    </div>
                  </>
                );
              })()}
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {conversation.length === 0 && (
                <p className="text-center text-sm text-[var(--color-text-muted)]">{t('msg.noMessages')}</p>
              )}
              {conversation.map(msg => {
                const isMe = msg.fromId === user?.id;
                return (
                  <div key={msg.id} className={`flex ${isMe ? (lang === 'ar' ? 'justify-start' : 'justify-end') : (lang === 'ar' ? 'justify-end' : 'justify-start')}`}>
                    <div className="max-w-[70%]">
                      <div className={isMe ? 'chat-bubble-sent' : 'chat-bubble-received'}>
                        {msg.message}
                      </div>
                      <p className={`text-xs text-[var(--color-text-muted)] mt-1 ${isMe ? (lang === 'ar' ? 'text-start' : 'text-end') : (lang === 'ar' ? 'text-end' : 'text-start')}`}>
                        {formatTime(msg.timestamp)}
                      </p>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <form onSubmit={handleSend} className="px-4 py-3 border-t border-[var(--color-border)] flex gap-2">
              <input
                type="text"
                value={text}
                onChange={e => setText(e.target.value)}
                placeholder={t('msg.typeMessage')}
                className="input flex-1"
              />
              <button type="submit" disabled={!text.trim()} className="btn-primary px-5">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
};

export default AdminMessages;
