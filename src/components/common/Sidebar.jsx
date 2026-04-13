import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { useTheme } from '../../contexts/ThemeContext';
import Logo from './Logo';
import IslamicBg from './IslamicBg';

/* ─── Nav icons ─── */
const icons = {
  settings: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  ),
  dashboard: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
    </svg>
  ),
  students: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
    </svg>
  ),
  teachers: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </svg>
  ),
  classes: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
    </svg>
  ),
  attendance: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
    </svg>
  ),
  memorization: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
    </svg>
  ),
  reports: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
    </svg>
  ),
  messages: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
    </svg>
  ),
  parents: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
    </svg>
  ),
};

/* ─── Navigation config ─── */
const NAV_CONFIG = {
  admin: [
    { key: 'dashboard',    label: 'nav.dashboard',    path: '/admin/dashboard',    icon: 'dashboard'    },
    { key: 'students',     label: 'nav.students',     path: '/admin/students',     icon: 'students'     },
    { key: 'teachers',     label: 'nav.teachers',     path: '/admin/teachers',     icon: 'teachers'     },
    { key: 'classes',      label: 'nav.classes',      path: '/admin/classes',      icon: 'classes'      },
    { key: 'attendance',   label: 'nav.attendance',   path: '/admin/attendance',   icon: 'attendance'   },
    { key: 'memorization', label: 'nav.memorization', path: '/admin/memorization', icon: 'memorization' },
    { key: 'reports',      label: 'nav.reports',      path: '/admin/reports',      icon: 'reports'      },
    { key: 'messages',     label: 'nav.messages',     path: '/admin/messages',     icon: 'messages'     },
    { key: 'parents',      label: 'nav.parents',      path: '/admin/parents',      icon: 'parents'      },
    { key: 'settings',     label: 'nav.settings',     path: '/admin/settings',     icon: 'settings'     },
  ],
  teacher: [
    { key: 'dashboard',    label: 'nav.dashboard',    path: '/teacher/dashboard',    icon: 'dashboard'    },
    { key: 'students',     label: 'nav.students',     path: '/teacher/students',     icon: 'students'     },
    { key: 'attendance',   label: 'nav.attendance',   path: '/teacher/attendance',   icon: 'attendance'   },
    { key: 'memorization', label: 'nav.memorization', path: '/teacher/memorization', icon: 'memorization' },
    { key: 'reports',      label: 'nav.reports',      path: '/teacher/reports',      icon: 'reports'      },
    { key: 'messages',     label: 'nav.messages',     path: '/teacher/messages',     icon: 'messages'     },
    { key: 'settings',     label: 'nav.settings',     path: '/teacher/settings',     icon: 'settings'     },
  ],
  student: [
    { key: 'dashboard',    label: 'nav.dashboard',    path: '/student/dashboard',    icon: 'dashboard'    },
    { key: 'attendance',   label: 'nav.attendance',   path: '/student/attendance',   icon: 'attendance'   },
    { key: 'memorization', label: 'nav.memorization', path: '/student/memorization', icon: 'memorization' },
    { key: 'messages',     label: 'nav.messages',     path: '/student/messages',     icon: 'messages'     },
    { key: 'settings',     label: 'nav.settings',     path: '/student/settings',     icon: 'settings'     },
  ],
  parent: [
    { key: 'dashboard',    label: 'nav.dashboard',    path: '/parent/dashboard',    icon: 'dashboard'    },
    { key: 'attendance',   label: 'nav.attendance',   path: '/parent/attendance',   icon: 'attendance'   },
    { key: 'memorization', label: 'nav.memorization', path: '/parent/memorization', icon: 'memorization' },
    { key: 'messages',     label: 'nav.messages',     path: '/parent/messages',     icon: 'messages'     },
    { key: 'reports',      label: 'nav.reports',      path: '/parent/reports',      icon: 'reports'      },
    { key: 'settings',     label: 'nav.settings',     path: '/parent/settings',     icon: 'settings'     },
  ],
};

/* ─── Role accent colours ─── */
const roleColors = {
  admin:   'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  teacher: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  student: 'bg-brand-green-100 text-brand-green-700 dark:bg-brand-green-900/30 dark:text-brand-green-400',
  parent:  'bg-brand-gold-100 text-brand-gold-700 dark:bg-brand-gold-900/30 dark:text-brand-gold-400',
};

const roleAvatarBg = {
  admin:   'bg-purple-600',
  teacher: 'bg-blue-600',
  student: 'bg-brand-green-600',
  parent:  'bg-brand-gold-600',
};

/* ═══════════════════════════════════════════ */
const Sidebar = ({ isOpen, onClose }) => {
  const { user, logout } = useAuth();
  const { t, lang, dir } = useLanguage();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const navItems = NAV_CONFIG[user?.role] || [];
  const displayName = lang === 'ar'
    ? (user?.nameAr || user?.name)
    : (user?.nameEn || user?.name);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 lg:hidden backdrop-blur-sm"
          onClick={onClose}
        />
      )}

      {/* Sidebar panel */}
      <aside
        className={`
          fixed top-0 z-40 h-full w-64
          bg-[var(--color-surface)] border-[var(--color-border)]
          flex flex-col transition-transform duration-300
          ${dir === 'rtl' ? 'right-0 border-l' : 'left-0 border-r'}
          ${isOpen
            ? 'translate-x-0'
            : dir === 'rtl'
              ? 'translate-x-full lg:translate-x-0'
              : '-translate-x-full lg:translate-x-0'}
        `}
        style={{ boxShadow: isOpen ? '4px 0 24px rgba(0,0,0,0.12)' : 'none' }}
      >

        {/* ── Logo section with Islamic pattern ── */}
        <div className="relative overflow-hidden border-b border-[var(--color-border)] p-5 bg-gradient-to-br from-brand-green-700 to-brand-green-900">
          <IslamicBg opacity={0.13} color="white" />
          <div className="relative z-10">
            <Logo size="md" />
          </div>
        </div>

        {/* ── User info ── */}
        <div className="px-4 py-3.5 border-b border-[var(--color-border)]">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl ${roleAvatarBg[user?.role] || 'bg-brand-green-600'} flex items-center justify-center text-white font-bold text-base flex-shrink-0 shadow-sm`}>
              {(displayName || user?.name || '?').charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-[var(--color-text)] truncate">{displayName || user?.name}</p>
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${roleColors[user?.role]}`}>
                {t(`role.${user?.role}`)}
              </span>
            </div>
          </div>
        </div>

        {/* ── Navigation ── */}
        <nav className="flex-1 overflow-y-auto p-3 space-y-0.5">
          {navItems.map((item) => (
            <NavLink
              key={item.key}
              to={item.path}
              onClick={onClose}
              className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
            >
              {icons[item.icon]}
              <span>{t(item.label)}</span>
            </NavLink>
          ))}
        </nav>

        {/* ── Bottom actions ── */}
        <div className="p-3 border-t border-[var(--color-border)] space-y-0.5">
          <button onClick={toggleTheme} className="sidebar-link w-full">
            {theme === 'dark' ? (
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
              </svg>
            )}
            <span>{theme === 'dark' ? t('settings.lightMode') : t('settings.darkMode')}</span>
          </button>

          <button
            onClick={handleLogout}
            className="sidebar-link w-full text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            <span>{t('auth.logout')}</span>
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
