import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../../contexts/LanguageContext';
import { useTheme } from '../../contexts/ThemeContext';
import Logo from '../../components/common/Logo';
import IslamicBg from '../../components/common/IslamicBg';

const ROLES = [
  {
    key: 'admin',
    icon: (
      <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
    gradient: 'from-purple-500 to-purple-700',
    ring:   'ring-purple-400/60',
    bg:     'bg-purple-50 dark:bg-purple-900/20',
    border: 'border-purple-200 dark:border-purple-800',
    hover:  'hover:border-purple-400 hover:shadow-purple-100 dark:hover:shadow-purple-900/30',
    text:   'text-purple-700 dark:text-purple-400',
  },
  {
    key: 'teacher',
    icon: (
      <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
      </svg>
    ),
    gradient: 'from-blue-500 to-blue-700',
    ring:   'ring-blue-400/60',
    bg:     'bg-blue-50 dark:bg-blue-900/20',
    border: 'border-blue-200 dark:border-blue-800',
    hover:  'hover:border-blue-400 hover:shadow-blue-100 dark:hover:shadow-blue-900/30',
    text:   'text-blue-700 dark:text-blue-400',
  },
  {
    key: 'student',
    icon: (
      <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
      </svg>
    ),
    gradient: 'from-brand-green-500 to-brand-green-700',
    ring:   'ring-brand-green-400/60',
    bg:     'bg-brand-green-50 dark:bg-brand-green-900/20',
    border: 'border-brand-green-200 dark:border-brand-green-800',
    hover:  'hover:border-brand-green-400 hover:shadow-brand-green-100 dark:hover:shadow-brand-green-900/30',
    text:   'text-brand-green-700 dark:text-brand-green-400',
  },
  {
    key: 'parent',
    icon: (
      <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
      </svg>
    ),
    gradient: 'from-brand-gold-500 to-brand-gold-700',
    ring:   'ring-brand-gold-400/60',
    bg:     'bg-brand-gold-50 dark:bg-brand-gold-900/20',
    border: 'border-brand-gold-200 dark:border-brand-gold-800',
    hover:  'hover:border-brand-gold-400 hover:shadow-brand-gold-100 dark:hover:shadow-brand-gold-900/30',
    text:   'text-brand-gold-700 dark:text-brand-gold-400',
  },
];

const RoleSelect = () => {
  const navigate = useNavigate();
  const { t, lang, switchLang } = useLanguage();
  const { theme, toggleTheme } = useTheme();

  const handleRoleSelect = (role) => {
    sessionStorage.setItem('selectedRole', role);
    navigate('/login');
  };

  return (
    <div className="relative min-h-screen bg-[var(--color-bg)] flex flex-col overflow-hidden">
      {/* Islamic geometric pattern — full page, very subtle */}
      <IslamicBg opacity={0.055} />

      {/* ── Hero strip ── */}
      <div className="relative overflow-hidden bg-gradient-to-br from-brand-green-700 via-brand-green-800 to-brand-green-950 px-4 pt-10 pb-12 text-white text-center">
        <IslamicBg opacity={0.14} color="white" />

        {/* Top bar — controls */}
        <div className="absolute top-3 inset-x-0 flex justify-end items-center gap-2 px-4">
          <button
            onClick={switchLang}
            className="px-3 py-1.5 rounded-xl glass-colored text-white text-sm font-medium hover:bg-white/25 transition-colors"
          >
            {lang === 'ar' ? 'EN' : 'عر'}
          </button>
          <button
            onClick={toggleTheme}
            className="p-2 rounded-xl glass-colored text-white hover:bg-white/25 transition-colors"
          >
            {theme === 'dark' ? (
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            ) : (
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
              </svg>
            )}
          </button>
        </div>

        {/* Logo + tagline */}
        <div className="relative animate-fade-in-up">
          <Logo size="lg" className="justify-center mb-4" />
          <p className="text-brand-green-200 text-sm font-medium tracking-wide">
            {t('app.tagline')}
          </p>
        </div>
      </div>

      {/* ── Role cards ── */}
      <div className="relative flex-1 flex flex-col items-center justify-start px-4 py-8">
        <p className="text-xs font-semibold uppercase tracking-widest text-[var(--color-text-muted)] mb-5 animate-fade-in">
          {t('auth.selectYourRole') || 'Select your role to continue'}
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full max-w-xl">
          {ROLES.map((role, i) => (
            <button
              key={role.key}
              onClick={() => handleRoleSelect(role.key)}
              style={{ animationDelay: `${i * 70}ms` }}
              className={`
                group relative overflow-hidden rounded-2xl border-2 p-6 text-start
                transition-all duration-300 hover:scale-[1.03] hover:shadow-xl
                animate-fade-in-up
                ${role.bg} ${role.border} ${role.hover}
              `}
            >
              {/* Left accent bar */}
              <div className={`absolute top-0 ${lang === 'ar' ? 'right-0' : 'left-0'} w-1 h-full bg-gradient-to-b ${role.gradient} rounded-s-2xl`} />

              {/* Icon */}
              <div className={`mb-3 ${role.text}`}>{role.icon}</div>

              {/* Label */}
              <h3 className={`text-xl font-bold mb-1 ${role.text}`}>
                {t(`role.${role.key}`)}
              </h3>
              <p className="text-sm text-[var(--color-text-muted)] leading-snug">
                {t(`role.${role.key}.desc`)}
              </p>

              {/* Arrow — appears on hover */}
              <div className={`absolute bottom-4 ${lang === 'ar' ? 'left-4' : 'right-4'} ${role.text} opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all duration-200`}>
                <svg className={`w-5 h-5 ${lang === 'ar' ? 'rtl-flip' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </div>
            </button>
          ))}
        </div>

        {/* Footer */}
        <p className="mt-10 text-xs text-[var(--color-text-muted)] opacity-60 animate-fade-in delay-300">
          تَتَبُعْ — Track Every Recitation
        </p>
      </div>
    </div>
  );
};

export default RoleSelect;
