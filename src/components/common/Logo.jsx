import { useLanguage } from '../../contexts/LanguageContext';

const Logo = ({ size = 'md', showText = true, className = '' }) => {
  const { lang } = useLanguage();

  const sizes = {
    sm: { icon: 32, text: 'text-lg', sub: 'text-xs' },
    md: { icon: 44, text: 'text-xl', sub: 'text-xs' },
    lg: { icon: 64, text: 'text-3xl', sub: 'text-sm' },
  };
  const s = sizes[size] || sizes.md;

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      {/* Islamic Logo SVG */}
      <svg
        width={s.icon}
        height={s.icon}
        viewBox="0 0 64 64"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Outer progress circle */}
        <circle cx="32" cy="32" r="30" stroke="#16a34a" strokeWidth="2.5" strokeDasharray="160 25" strokeLinecap="round" opacity="0.3" />
        <circle cx="32" cy="32" r="30" stroke="#f59e0b" strokeWidth="2.5" strokeDasharray="100 85" strokeLinecap="round" strokeDashoffset="-160" />

        {/* Background circle */}
        <circle cx="32" cy="32" r="26" fill="#052e16" />

        {/* Crescent moon */}
        <path
          d="M22 20 C20 26 20 36 26 42 C18 40 14 32 16 24 C17.5 20 20 18 22 20Z"
          fill="#f59e0b"
          opacity="0.9"
        />
        <path
          d="M22 20 C26 19 32 20 36 26 C38 30 38 36 36 40 C30 44 24 42 20 38 C26 42 34 40 36 34 C38 28 36 22 30 20 C27 19 24 19 22 20Z"
          fill="#f59e0b"
        />

        {/* Open Quran book */}
        <path d="M28 34 L32 30 L36 34 L32 38 Z" fill="none" stroke="#4ade80" strokeWidth="1.5" strokeLinejoin="round" />
        <line x1="32" y1="30" x2="32" y2="38" stroke="#4ade80" strokeWidth="1.5" />

        {/* Stars */}
        <circle cx="40" cy="22" r="1.5" fill="#fcd34d" />
        <circle cx="43" cy="27" r="1" fill="#fcd34d" opacity="0.7" />
        <circle cx="37" cy="19" r="1" fill="#fcd34d" opacity="0.7" />
      </svg>

      {showText && (
        <div>
          <div className={`font-bold leading-tight text-brand-green-700 dark:text-brand-green-400 ${s.text}`}
            style={{ fontFamily: lang === 'ar' ? "'Amiri', serif" : "'Inter', sans-serif" }}>
            {lang === 'ar' ? 'تَتَبُعْ' : 'Tatabu'}
          </div>
          {lang !== 'ar' && (
            <div className={`text-brand-gold-600 dark:text-brand-gold-400 font-medium leading-tight ${s.sub}`}
              style={{ fontFamily: "'Amiri', serif" }}>
              تَتَبُعْ
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Logo;
