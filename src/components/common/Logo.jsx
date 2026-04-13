import { useLanguage } from '../../contexts/LanguageContext';

/**
 * Tatabu brand logo — open Quran book with crescent moon.
 * Flat, minimal Islamic school design. Works at sm/md/lg sizes.
 */
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
      {/* ── Logo mark ── */}
      <svg
        width={s.icon}
        height={s.icon}
        viewBox="0 0 60 60"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-label="Tatabu logo"
      >
        {/* Outer decorative ring */}
        <circle
          cx="30" cy="30" r="28"
          stroke="#16a34a" strokeWidth="1"
          strokeDasharray="3 2.5" opacity="0.35"
        />

        {/* Soft circle background */}
        <circle cx="30" cy="30" r="25" fill="#f0fdf4" />

        {/* ── Crescent moon (gold) ── */}
        {/*
          Draws the outer left/bottom arc of a circle r≈9 at (29,14),
          then arcs back along an inner circle offset right,
          producing a right-facing crescent.
        */}
        <path
          d="M29 5
             C24 5 20 8.8 20 13.5
             C20 18.2 24 22 29 22
             C31.2 22 33.2 21.2 34.7 19.8
             C32.7 20.5 30.2 20.2 28.2 18.8
             C25.2 16.8 24 13 25 9.8
             C25.8 7.2 27.8 5.6 30.2 5.2
             C29.8 5.1 29.4 5 29 5 Z"
          fill="#d97706"
        />

        {/* Small decorative star next to crescent */}
        <circle cx="40" cy="8"  r="1.6" fill="#fbbf24" />
        <circle cx="43" cy="13" r="1.0" fill="#fbbf24" opacity="0.6" />

        {/* ── Open Quran book ── */}
        {/* Left page — slightly angled outward */}
        <path
          d="M8 26 L8 50 C8 51.1 8.9 52 10 52 L28 50.5 L28 24.5 C28 23.4 27.1 22.5 26 22.5 L10 24 C8.9 24 8 24.9 8 26 Z"
          fill="#16a34a"
        />

        {/* Right page — mirror of left */}
        <path
          d="M52 26 L52 50 C52 51.1 51.1 52 50 52 L32 50.5 L32 24.5 C32 23.4 32.9 22.5 34 22.5 L50 24 C51.1 24 52 24.9 52 26 Z"
          fill="#16a34a"
        />

        {/* Book spine (slightly darker) */}
        <path
          d="M28 23.5 C28.8 22.5 31.2 22.5 32 23.5 L32 51.5 C31.2 52.5 28.8 52.5 28 51.5 Z"
          fill="#15803d"
        />

        {/* Text lines — left page */}
        <line x1="13" y1="31" x2="23" y2="30.5" stroke="white" strokeWidth="1.4" strokeLinecap="round" opacity="0.85"/>
        <line x1="13" y1="36" x2="23" y2="35.5" stroke="white" strokeWidth="1.4" strokeLinecap="round" opacity="0.85"/>
        <line x1="13" y1="41" x2="19" y2="40.5" stroke="white" strokeWidth="1.4" strokeLinecap="round" opacity="0.6"/>

        {/* Text lines — right page */}
        <line x1="37" y1="30.5" x2="47" y2="31" stroke="white" strokeWidth="1.4" strokeLinecap="round" opacity="0.85"/>
        <line x1="37" y1="35.5" x2="47" y2="36" stroke="white" strokeWidth="1.4" strokeLinecap="round" opacity="0.85"/>
        <line x1="41" y1="40.5" x2="47" y2="41" stroke="white" strokeWidth="1.4" strokeLinecap="round" opacity="0.6"/>
      </svg>

      {/* ── Wordmark ── */}
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
