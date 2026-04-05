import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { useTheme } from '../../contexts/ThemeContext';
import { storage, KEYS } from '../../utils/storage';
import { hashPassword } from '../../utils/auth';
import { ConfirmModal } from '../../components/common/Modal';

const AdminSettings = () => {
  const navigate = useNavigate();
  const { user, refreshUser, logout } = useAuth();
  const { t, lang, switchLang } = useLanguage();
  const { theme, toggleTheme } = useTheme();

  const [toast, setToast] = useState(null);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [activeTab, setActiveTab] = useState('account');

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  // School info
  const savedSchool = storage.get('tatabu_school_info', {});
  const [schoolForm, setSchoolForm] = useState({
    name: savedSchool.name || '',
    country: savedSchool.country || '',
    region: savedSchool.region || '',
  });

  // Account form
  const [accountForm, setAccountForm] = useState({
    nameAr: user?.nameAr || user?.name || '',
    nameEn: user?.nameEn || '',
    email: user?.email || '',
    phone: user?.phone || '',
    currentPassword: '',
    newPassword: '',
  });
  const [showNewPassword, setShowNewPassword] = useState(false);

  const handleSaveSchool = (e) => {
    e.preventDefault();
    storage.set('tatabu_school_info', {
      name: schoolForm.name,
      country: schoolForm.country,
      region: schoolForm.region,
    });
    showToast(t('common.updated'));
  };

  const handleSaveAccount = (e) => {
    e.preventDefault();
    if (!user) return;
    const updates = {
      name: accountForm.nameAr || accountForm.nameEn,
      nameAr: accountForm.nameAr,
      nameEn: accountForm.nameEn,
      email: accountForm.email,
      phone: accountForm.phone,
    };
    if (accountForm.newPassword) {
      updates.password = hashPassword(accountForm.newPassword);
    }
    storage.update(KEYS.USERS, user.id, updates);
    refreshUser();
    showToast(t('common.updated'));
    setAccountForm(prev => ({ ...prev, currentPassword: '', newPassword: '' }));
  };

  const handleResetData = () => {
    // Clear all data except school info
    localStorage.removeItem(KEYS.USERS);
    localStorage.removeItem(KEYS.ACADEMIC_YEARS);
    localStorage.removeItem(KEYS.CLASSES);
    localStorage.removeItem(KEYS.ATTENDANCE);
    localStorage.removeItem(KEYS.MEMORIZATION);
    localStorage.removeItem(KEYS.NOTIFICATIONS);
    localStorage.removeItem(KEYS.MESSAGES);
    localStorage.removeItem(KEYS.MONTHLY_NOTES);
    localStorage.removeItem(KEYS.INITIALIZED);
    logout();
    navigate('/');
  };

  const tabs = [
    { key: 'account', label: t('settings.accountInfo') },
    { key: 'school', label: t('settings.schoolInfo') },
    { key: 'appearance', label: t('settings.theme') },
    { key: 'danger', label: t('settings.resetData') },
  ];

  return (
    <div className="space-y-6 max-w-2xl">
      {toast && (
        <div className={`fixed top-20 ${document.documentElement.dir === 'rtl' ? 'left-4' : 'right-4'} z-50 px-4 py-2.5 rounded-xl shadow-lg text-white text-sm font-medium ${toast.type === 'success' ? 'bg-brand-green-600' : 'bg-red-500'}`}>
          {toast.msg}
        </div>
      )}

      <div className="page-header">
        <h1 className="page-title">{t('settings.title')}</h1>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2">
        {tabs.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${activeTab === tab.key ? 'bg-brand-green-600 text-white' : 'bg-[var(--color-surface)] border border-[var(--color-border)] text-[var(--color-text-muted)] hover:border-brand-green-300'}`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Account Info */}
      {activeTab === 'account' && (
        <div className="card p-6">
          <h2 className="font-semibold text-[var(--color-text)] mb-4">{t('settings.accountInfo')}</h2>
          <form onSubmit={handleSaveAccount} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">{t('account.nameAr')}</label>
                <input type="text" value={accountForm.nameAr} onChange={e => setAccountForm({...accountForm, nameAr: e.target.value})} className="input" dir="rtl" />
              </div>
              <div>
                <label className="label">{t('account.nameEn')}</label>
                <input type="text" value={accountForm.nameEn} onChange={e => setAccountForm({...accountForm, nameEn: e.target.value})} className="input" />
              </div>
            </div>
            <div>
              <label className="label">{t('common.email')}</label>
              <input type="email" value={accountForm.email} onChange={e => setAccountForm({...accountForm, email: e.target.value})} className="input" />
            </div>
            <div>
              <label className="label">{t('common.phone')}</label>
              <input type="tel" value={accountForm.phone} onChange={e => setAccountForm({...accountForm, phone: e.target.value})} className="input" />
            </div>
            <div>
              <label className="label">{t('auth.password')} ({t('common.notes')})</label>
              <div className="relative">
                <input
                  type={showNewPassword ? 'text' : 'password'}
                  value={accountForm.newPassword}
                  onChange={e => setAccountForm({...accountForm, newPassword: e.target.value})}
                  className="input pr-10"
                  placeholder="••••••••"
                />
                <button type="button" onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute top-1/2 -translate-y-1/2 right-3 text-[var(--color-text-muted)] hover:text-brand-green-600">
                  {showNewPassword ? (
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" /></svg>
                  ) : (
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                  )}
                </button>
              </div>
            </div>
            <button type="submit" className="btn-primary">{t('common.save')}</button>
          </form>
        </div>
      )}

      {/* School Info */}
      {activeTab === 'school' && (
        <div className="card p-6">
          <h2 className="font-semibold text-[var(--color-text)] mb-4">{t('settings.schoolInfo')}</h2>
          <form onSubmit={handleSaveSchool} className="space-y-4">
            <div>
              <label className="label">{t('settings.schoolName')}</label>
              <input type="text" value={schoolForm.name} onChange={e => setSchoolForm({...schoolForm, name: e.target.value})} className="input" placeholder={t('settings.schoolName')} />
            </div>
            <div>
              <label className="label">{t('settings.country')}</label>
              <input type="text" value={schoolForm.country} onChange={e => setSchoolForm({...schoolForm, country: e.target.value})} className="input" />
            </div>
            <div>
              <label className="label">{t('settings.region')}</label>
              <input type="text" value={schoolForm.region} onChange={e => setSchoolForm({...schoolForm, region: e.target.value})} className="input" />
            </div>
            <button type="submit" className="btn-primary">{t('settings.saveSchool')}</button>
          </form>
        </div>
      )}

      {/* Appearance */}
      {activeTab === 'appearance' && (
        <div className="card p-6 space-y-4">
          <h2 className="font-semibold text-[var(--color-text)] mb-4">{t('settings.theme')}</h2>
          <div className="flex items-center justify-between p-3 rounded-xl border border-[var(--color-border)]">
            <span className="text-sm font-medium text-[var(--color-text)]">{t('settings.theme')}</span>
            <button onClick={toggleTheme} className={`btn-secondary text-sm`}>
              {theme === 'dark' ? t('settings.lightMode') : t('settings.darkMode')}
            </button>
          </div>
          <div className="flex items-center justify-between p-3 rounded-xl border border-[var(--color-border)]">
            <span className="text-sm font-medium text-[var(--color-text)]">{t('settings.language')}</span>
            <button onClick={switchLang} className="btn-secondary text-sm">
              {lang === 'ar' ? 'English' : 'العربية'}
            </button>
          </div>
        </div>
      )}

      {/* Danger Zone */}
      {activeTab === 'danger' && (
        <div className="card p-6 border border-red-200 dark:border-red-800">
          <h2 className="font-semibold text-red-600 mb-2">{t('settings.resetData')}</h2>
          <p className="text-sm text-[var(--color-text-muted)] mb-4">{t('settings.resetWarning')}</p>
          <button onClick={() => setShowResetConfirm(true)} className="btn-danger">
            {t('settings.resetData')}
          </button>
        </div>
      )}

      <ConfirmModal
        isOpen={showResetConfirm}
        onClose={() => setShowResetConfirm(false)}
        onConfirm={handleResetData}
        message={t('settings.confirmReset')}
      />
    </div>
  );
};

export default AdminSettings;
