import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { useNotifications } from '../../contexts/NotificationContext';
import { storage } from '../../utils/storage';
import Logo from './Logo';

const Navbar = ({ onMenuClick }) => {
  const { user } = useAuth();
  const { t, lang, switchLang, dir } = useLanguage();
  const { unreadCount, notifications, markAllRead } = useNotifications();
  const [showNotifs, setShowNotifs] = useState(false);
  const navigate = useNavigate();

  const schoolInfo = storage.get('tatabu_school_info', {});
  const schoolName = schoolInfo?.name || '';

  const notifPath = `/${user?.role}/dashboard`;

  return (
    <header className="sticky top-0 z-20 h-16 bg-[var(--color-surface)]/95 backdrop-blur border-b border-[var(--color-border)] flex items-center px-4 gap-3">
      {/* Hamburger */}
      <button
        onClick={onMenuClick}
        className="p-2 rounded-xl hover:bg-brand-green-50 dark:hover:bg-brand-green-900/20 text-[var(--color-text-muted)] lg:hidden"
      >
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>

      {/* Logo (mobile) */}
      <div className="lg:hidden">
        <Logo size="sm" />
      </div>

      {/* School name (desktop) */}
      {schoolName && (
        <div className="hidden lg:flex items-center gap-2 ms-2">
          <span className="text-sm font-semibold text-brand-green-700 dark:text-brand-green-400 bg-brand-green-50 dark:bg-brand-green-900/20 px-3 py-1 rounded-xl border border-brand-green-200 dark:border-brand-green-800">
            {schoolName}
          </span>
        </div>
      )}

      {/* Spacer */}
      <div className="flex-1" />

      {/* Right actions */}
      <div className="flex items-center gap-2">
        {/* Language switcher */}
        <button
          onClick={switchLang}
          className="px-3 py-1.5 rounded-xl border border-[var(--color-border)] text-sm font-medium text-[var(--color-text-muted)] hover:text-brand-green-600 hover:border-brand-green-300 transition-colors"
          title="Switch language"
        >
          {lang === 'ar' ? 'EN' : 'عر'}
        </button>

        {/* Notifications */}
        <div className="relative">
          <button
            onClick={() => setShowNotifs(!showNotifs)}
            className="relative p-2 rounded-xl hover:bg-brand-green-50 dark:hover:bg-brand-green-900/20 text-[var(--color-text-muted)] hover:text-brand-green-600 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
            {unreadCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-[var(--color-surface)]">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {/* Notifications dropdown */}
          {showNotifs && (
            <div
              className={`absolute top-full mt-2 w-80 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl shadow-xl overflow-hidden z-50 ${dir === 'rtl' ? 'left-0' : 'right-0'}`}
            >
              <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--color-border)]">
                <span className="font-semibold text-[var(--color-text)]">{t('notif.title')}</span>
                {unreadCount > 0 && (
                  <button onClick={markAllRead} className="text-xs text-brand-green-600 hover:underline">
                    {t('notif.markAllRead')}
                  </button>
                )}
              </div>
              <div className="max-h-80 overflow-y-auto">
                {notifications.length === 0 ? (
                  <p className="text-center text-sm text-[var(--color-text-muted)] py-8">{t('notif.noNotifs')}</p>
                ) : (
                  notifications.slice(0, 10).map(n => {
                    const isUnread = user && !n.readBy.includes(user.id);
                    return (
                      <div
                        key={n.id}
                        className={`px-4 py-3 border-b border-[var(--color-border)] last:border-0 cursor-pointer hover:bg-brand-green-50 dark:hover:bg-brand-green-900/10 transition-colors ${isUnread ? 'bg-brand-green-50/50 dark:bg-brand-green-900/10' : ''}`}
                        onClick={() => { markAllRead(); setShowNotifs(false); }}
                      >
                        <div className="flex items-start gap-2">
                          {isUnread && <div className="w-2 h-2 rounded-full bg-brand-green-500 mt-1.5 flex-shrink-0" />}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm text-[var(--color-text)] leading-relaxed">{n.message}</p>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-xs text-brand-green-600 font-medium">{n.senderName}</span>
                              <span className="text-xs text-[var(--color-text-muted)]">
                                {n.time || new Date(n.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}
        </div>

        {/* User avatar */}
        <div className="flex items-center gap-2 px-2">
          <div className="w-8 h-8 rounded-xl bg-brand-green-600 flex items-center justify-center text-white font-bold text-sm">
            {user?.name?.charAt(0)?.toUpperCase()}
          </div>
          <span className="hidden sm:block text-sm font-medium text-[var(--color-text)] max-w-32 truncate">
            {user?.name}
          </span>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
