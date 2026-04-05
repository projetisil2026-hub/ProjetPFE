import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { useTheme } from '../../contexts/ThemeContext';
import Logo from '../../components/common/Logo';

const roleColors = {
  admin: { bg: 'from-purple-500 to-purple-700', badge: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400' },
  teacher: { bg: 'from-blue-500 to-blue-700', badge: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' },
  student: { bg: 'from-brand-green-500 to-brand-green-700', badge: 'bg-brand-green-100 text-brand-green-700 dark:bg-brand-green-900/30 dark:text-brand-green-400' },
  parent: { bg: 'from-brand-gold-500 to-brand-gold-700', badge: 'bg-brand-gold-100 text-brand-gold-700 dark:bg-brand-gold-900/30 dark:text-brand-gold-400' },
};

const Login = () => {
  const navigate = useNavigate();
  const { login, isAuthenticated, user } = useAuth();
  const { t, lang, switchLang } = useLanguage();
  const { theme, toggleTheme } = useTheme();

  const [selectedRole, setSelectedRole] = useState('');
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const role = sessionStorage.getItem('selectedRole');
    if (role) setSelectedRole(role);
  }, []);

  useEffect(() => {
    if (isAuthenticated && user) {
      navigate(`/${user.role}/dashboard`, { replace: true });
    }
  }, [isAuthenticated, user, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedRole) {
      setError(t('auth.selectRoleFirst'));
      return;
    }
    setError('');
    setLoading(true);

    setTimeout(() => {
      // Support both email and username login
      const result = login(identifier, password, selectedRole);
      if (result.success) {
        navigate(`/${result.user.role}/dashboard`, { replace: true });
      } else {
        setError(t('auth.loginFailed'));
      }
      setLoading(false);
    }, 600);
  };

  const handleChangeRole = () => {
    sessionStorage.removeItem('selectedRole');
    navigate('/');
  };

  const rc = roleColors[selectedRole] || roleColors.admin;

  return (
    <div className="min-h-screen bg-[var(--color-bg)] flex">
      {/* Left decorative panel */}
      <div className={`hidden lg:flex flex-col items-center justify-center w-2/5 bg-gradient-to-br ${rc.bg} p-12 relative overflow-hidden`}>
        {/* Islamic geometric pattern */}
        <svg className="absolute inset-0 w-full h-full opacity-10" viewBox="0 0 400 400" fill="none">
          {[...Array(6)].map((_, i) => (
            <g key={i} transform={`rotate(${i * 60} 200 200)`}>
              <polygon points="200,50 230,140 150,90" fill="white" opacity="0.5" />
              <polygon points="200,350 230,260 150,310" fill="white" opacity="0.5" />
            </g>
          ))}
        </svg>

        <Logo size="lg" className="justify-center mb-8" />

        <div className="text-center text-white">
          <p className="text-lg opacity-90 mt-4">{t('app.tagline')}</p>
        </div>

        <div className="absolute bottom-8 text-white/60 text-sm">
          تَتَبُعْ — Track Every Recitation
        </div>
      </div>

      {/* Right login panel */}
      <div className="flex-1 flex flex-col">
        {/* Top bar */}
        <div className="flex justify-between items-center p-4">
          <button
            onClick={handleChangeRole}
            className="flex items-center gap-2 text-sm text-[var(--color-text-muted)] hover:text-brand-green-600 transition-colors"
          >
            <svg className={`w-4 h-4 ${lang === 'ar' ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            {t('auth.changeRole')}
          </button>
          <div className="flex gap-2">
            <button onClick={switchLang} className="px-3 py-1.5 rounded-xl border border-[var(--color-border)] text-sm font-medium text-[var(--color-text-muted)] hover:text-brand-green-600 transition-colors">
              {lang === 'ar' ? 'EN' : 'عر'}
            </button>
            <button onClick={toggleTheme} className="p-2 rounded-xl border border-[var(--color-border)] text-[var(--color-text-muted)] hover:text-brand-green-600 transition-colors">
              {theme === 'dark' ? '☀️' : '🌙'}
            </button>
          </div>
        </div>

        {/* Form */}
        <div className="flex-1 flex items-center justify-center px-6">
          <div className="w-full max-w-md">
            {/* Mobile logo */}
            <div className="lg:hidden mb-8 flex justify-center">
              <Logo size="md" />
            </div>

            <div className="mb-8">
              <h1 className="text-2xl font-bold text-[var(--color-text)]">{t('auth.loginTo')}</h1>
              {selectedRole && (
                <div className="mt-2 flex items-center gap-2">
                  <span className="text-[var(--color-text-muted)] text-sm">{t('common.role')}:</span>
                  <span className={`badge ${rc.badge}`}>{t(`role.${selectedRole}`)}</span>
                  <button
                    type="button"
                    onClick={handleChangeRole}
                    className="text-xs text-brand-green-600 hover:underline"
                  >
                    {t('auth.changeRole')}
                  </button>
                </div>
              )}
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Role selector (shown if no role pre-selected) */}
              {!selectedRole && (
                <div>
                  <label className="label">{t('account.role')}</label>
                  <select
                    value={selectedRole}
                    onChange={(e) => {
                      setSelectedRole(e.target.value);
                      sessionStorage.setItem('selectedRole', e.target.value);
                    }}
                    className="select"
                    required
                  >
                    <option value="">{t('common.select')}</option>
                    <option value="admin">{t('role.admin')}</option>
                    <option value="teacher">{t('role.teacher')}</option>
                    <option value="student">{t('role.student')}</option>
                    <option value="parent">{t('role.parent')}</option>
                  </select>
                </div>
              )}

              {/* Username or Email */}
              <div>
                <label className="label">{t('auth.usernameOrEmail')}</label>
                <input
                  type="text"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  className="input"
                  placeholder={t('auth.usernameOrEmail')}
                  required
                  autoComplete="username"
                />
              </div>

              {/* Password */}
              <div>
                <label className="label">{t('auth.password')}</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className={`input ${lang === 'ar' ? 'pl-12' : 'pr-12'}`}
                    placeholder="••••••••"
                    required
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className={`absolute top-1/2 -translate-y-1/2 ${lang === 'ar' ? 'left-3' : 'right-3'} text-[var(--color-text-muted)] hover:text-brand-green-600`}
                    title={showPassword ? t('auth.hidePassword') : t('auth.showPassword')}
                  >
                    {showPassword ? (
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                      </svg>
                    ) : (
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              {/* Error */}
              {error && (
                <div className="flex items-center gap-2 p-3 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 text-sm">
                  <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  {error}
                </div>
              )}

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                className={`w-full py-3 rounded-xl text-white font-semibold text-base transition-all duration-200 bg-gradient-to-r ${rc.bg} hover:shadow-lg hover:scale-[1.01] active:scale-99 disabled:opacity-60`}
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    {t('common.loading')}
                  </span>
                ) : t('auth.loginBtn')}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
