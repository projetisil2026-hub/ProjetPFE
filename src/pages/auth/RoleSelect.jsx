import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../../contexts/LanguageContext';
import { useTheme } from '../../contexts/ThemeContext';
import Logo from '../../components/common/Logo';

const ROLES = [
  {
    key: 'admin',
    icon: (
      <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
    color: 'from-purple-500 to-purple-700',
    bg: 'bg-purple-50 dark:bg-purple-900/20',
    border: 'border-purple-200 dark:border-purple-800 hover:border-purple-500',
    text: 'text-purple-700 dark:text-purple-400',
  },
  {
    key: 'teacher',
    icon: (
      <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
      </svg>
    ),
    color: 'from-blue-500 to-blue-700',
    bg: 'bg-blue-50 dark:bg-blue-900/20',
    border: 'border-blue-200 dark:border-blue-800 hover:border-blue-500',
    text: 'text-blue-700 dark:text-blue-400',
  },
  {
    key: 'student',
    icon: (
      <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
      </svg>
    ),
    color: 'from-brand-green-500 to-brand-green-700',
    bg: 'bg-brand-green-50 dark:bg-brand-green-900/20',
    border: 'border-brand-green-200 dark:border-brand-green-800 hover:border-brand-green-500',
    text: 'text-brand-green-700 dark:text-brand-green-400',
  },
  {
    key: 'parent',
    icon: (
      <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
      </svg>
    ),
    color: 'from-brand-gold-500 to-brand-gold-700',
    bg: 'bg-brand-gold-50 dark:bg-brand-gold-900/20',
    border: 'border-brand-gold-200 dark:border-brand-gold-800 hover:border-brand-gold-500',
    text: 'text-brand-gold-700 dark:text-brand-gold-400',
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
    <div className="min-h-screen bg-[var(--color-bg)] flex flex-col">
      {/* Top bar */}
      <div className="flex justify-end items-center gap-2 p-4">
        <button onClick={switchLang} className="px-3 py-1.5 rounded-xl border border-[var(--color-border)] text-sm font-medium text-[var(--color-text-muted)] hover:text-brand-green-600 transition-colors">
          {lang === 'ar' ? 'EN' : 'عر'}
        </button>
        <button onClick={toggleTheme} className="p-2 rounded-xl border border-[var(--color-border)] text-[var(--color-text-muted)] hover:text-brand-green-600 transition-colors">
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

      {/* Main content */}
      <div className="flex-1 flex flex-col items-center justify-center px-4 py-8">
        {/* Header */}
        <div className="text-center mb-10">
          <Logo size="lg" className="justify-center mb-6" />
          <h1 className="text-3xl font-bold text-[var(--color-text)] mb-2">
            {t('auth.selectRole')}
          </h1>
          <p className="text-[var(--color-text-muted)] text-lg">{t('auth.selectRoleDesc')}</p>

          {/* Decorative divider */}
          <div className="flex items-center justify-center gap-3 mt-4">
            <div className="h-px w-16 bg-brand-gold-400" />
            <span className="text-brand-gold-500 text-xl" style={{ fontFamily: "'Amiri', serif" }}>بسم الله</span>
            <div className="h-px w-16 bg-brand-gold-400" />
          </div>
        </div>

        {/* Role cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full max-w-lg">
          {ROLES.map((role) => (
            <button
              key={role.key}
              onClick={() => handleRoleSelect(role.key)}
              className={`
                group relative overflow-hidden rounded-2xl border-2 p-6 text-start
                transition-all duration-300 hover:scale-105 hover:shadow-lg
                ${role.bg} ${role.border}
              `}
            >
              {/* Gradient accent */}
              <div className={`absolute top-0 ${lang === 'ar' ? 'right-0' : 'left-0'} w-1 h-full bg-gradient-to-b ${role.color} rounded-l-2xl`} />

              <div className={`${role.text} mb-3`}>{role.icon}</div>
              <h3 className={`text-xl font-bold mb-1 ${role.text}`}>
                {t(`role.${role.key}`)}
              </h3>
              <p className="text-sm text-[var(--color-text-muted)]">
                {t(`role.${role.key}.desc`)}
              </p>

              {/* Arrow */}
              <div className={`absolute bottom-4 ${lang === 'ar' ? 'left-4' : 'right-4'} ${role.text} opacity-0 group-hover:opacity-100 transition-opacity`}>
                <svg className={`w-5 h-5 ${lang === 'ar' ? 'rtl-flip' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </div>
            </button>
          ))}
        </div>

        {/* Demo credentials */}
        <div className="mt-8 card p-4 w-full max-w-lg">
          <p className="text-xs font-semibold text-brand-gold-600 mb-2 uppercase tracking-wider">Demo Credentials</p>
          <div className="grid grid-cols-2 gap-2 text-xs text-[var(--color-text-muted)]">
            <div><span className="font-medium">Admin:</span> admin@tatabu.com</div>
            <div><span className="font-medium">Teacher:</span> teacher1@tatabu.com</div>
            <div><span className="font-medium">Student:</span> student1@tatabu.com</div>
            <div><span className="font-medium">Parent:</span> parent1@tatabu.com</div>
            <div className="col-span-2 mt-1"><span className="font-medium">Password for all:</span> [Role]123! (e.g. Admin123!)</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RoleSelect;
