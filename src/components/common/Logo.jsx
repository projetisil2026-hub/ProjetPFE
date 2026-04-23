import { useLanguage } from '../../contexts/LanguageContext';

const Logo = ({ size = 'md', showText = true, className = '' }) => {
  const { lang } = useLanguage();

  const sizes = {
    sm: { icon: 34, text: 'text-base',  sub: 'text-[10px]' },
    md: { icon: 44, text: 'text-xl',    sub: 'text-xs'     },
    lg: { icon: 64, text: 'text-3xl',   sub: 'text-sm'     },
  };
  const s = sizes[size] || sizes.md;

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <div
        style={{ width: s.icon, height: s.icon, borderRadius: '50%', overflow: 'hidden', flexShrink: 0, background: 'white' }}
      >
        <img
          src="/logo.jpg"
          alt="Tatabu logo"
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
        />
      </div>

      {showText && (
        <div>
          <div
            className={`font-bold leading-tight text-brand-green-700 dark:text-brand-green-400 ${s.text}`}
            style={{ fontFamily: lang === 'ar' ? "'Amiri', serif" : "'Inter', sans-serif" }}
          >
            {lang === 'ar' ? 'تَتَبُعْ' : 'Tatabu'}
          </div>
          {lang !== 'ar' && (
            <div
              className={`text-brand-gold-600 dark:text-brand-gold-400 font-medium leading-tight ${s.sub}`}
              style={{ fontFamily: "'Amiri', serif" }}
            >
              تَتَبُعْ
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Logo;
