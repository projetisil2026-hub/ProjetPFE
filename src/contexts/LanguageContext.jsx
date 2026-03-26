import { createContext, useContext, useState, useEffect } from 'react';
import en from '../i18n/en';
import ar from '../i18n/ar';

const LanguageContext = createContext(null);

const translations = { en, ar };

export const LanguageProvider = ({ children }) => {
  const [lang, setLang] = useState(() => {
    return localStorage.getItem('tatabu_lang') || 'ar';
  });

  const dir = lang === 'ar' ? 'rtl' : 'ltr';

  useEffect(() => {
    document.documentElement.lang = lang;
    document.documentElement.dir = dir;
    localStorage.setItem('tatabu_lang', lang);
  }, [lang, dir]);

  const t = (key, params = {}) => {
    let text = translations[lang]?.[key] || translations['en']?.[key] || key;
    Object.entries(params).forEach(([k, v]) => {
      text = text.replace(`{${k}}`, v);
    });
    return text;
  };

  const switchLang = () => setLang(l => l === 'ar' ? 'en' : 'ar');

  return (
    <LanguageContext.Provider value={{ lang, dir, t, setLang, switchLang }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error('useLanguage must be used within LanguageProvider');
  return ctx;
};
