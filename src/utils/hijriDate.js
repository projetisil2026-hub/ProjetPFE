/**
 * Hijri (Islamic) Calendar conversion utilities
 * Using the Umm al-Qura algorithm approximation
 */

const HIJRI_MONTHS_AR = [
  'محرم', 'صفر', 'ربيع الأول', 'ربيع الثاني',
  'جمادى الأولى', 'جمادى الآخرة', 'رجب', 'شعبان',
  'رمضان', 'شوال', 'ذو القعدة', 'ذو الحجة',
];

const HIJRI_MONTHS_EN = [
  'Muharram', 'Safar', "Rabi' al-Awwal", "Rabi' al-Thani",
  'Jumada al-Ula', 'Jumada al-Akhirah', 'Rajab', "Sha'ban",
  'Ramadan', 'Shawwal', "Dhu al-Qi'dah", 'Dhu al-Hijjah',
];

/**
 * Convert Gregorian date to Hijri date
 * @param {Date|string} date - Gregorian date
 * @returns {{ day: number, month: number, year: number, monthNameAr: string, monthNameEn: string }}
 */
export const gregorianToHijri = (date) => {
  const d = date instanceof Date ? date : new Date(date);

  // Julian Day Number
  const Y = d.getFullYear();
  const M = d.getMonth() + 1;
  const D = d.getDate();

  const jd = Math.floor((1461 * (Y + 4800 + Math.floor((M - 14) / 12))) / 4)
    + Math.floor((367 * (M - 2 - 12 * Math.floor((M - 14) / 12))) / 12)
    - Math.floor((3 * Math.floor((Y + 4900 + Math.floor((M - 14) / 12)) / 100)) / 4)
    + D - 32075;

  // Convert JD to Hijri
  const l = jd - 1948440 + 10632;
  const n = Math.floor((l - 1) / 10631);
  const l1 = l - 10631 * n + 354;
  const j =
    Math.floor((10985 - l1) / 5316) * Math.floor((50 * l1) / 17719) +
    Math.floor(l1 / 5670) * Math.floor((43 * l1) / 15238);
  const l2 =
    l1 -
    Math.floor((30 - j) / 15) * Math.floor((17719 * j) / 50) -
    Math.floor(j / 16) * Math.floor((15238 * j) / 43) +
    29;
  const month = Math.floor((24 * l2) / 709);
  const day = l2 - Math.floor((709 * month) / 24);
  const year = 30 * n + j - 30;

  return {
    day,
    month,
    year,
    monthNameAr: HIJRI_MONTHS_AR[month - 1] || '',
    monthNameEn: HIJRI_MONTHS_EN[month - 1] || '',
  };
};

/**
 * Format Hijri date as string
 */
export const formatHijri = (date, lang = 'ar') => {
  const h = gregorianToHijri(date);
  if (lang === 'ar') {
    return `${h.day} ${h.monthNameAr} ${h.year} هـ`;
  }
  return `${h.day} ${h.monthNameEn} ${h.year} AH`;
};

/**
 * Format Gregorian date as string
 */
export const formatGregorian = (date, lang = 'en') => {
  const d = date instanceof Date ? date : new Date(date);
  if (lang === 'ar') {
    return d.toLocaleDateString('ar-SA', { year: 'numeric', month: 'long', day: 'numeric' });
  }
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
};

/**
 * Format both dates together
 */
export const formatBothDates = (date, lang = 'en') => {
  const gregorian = formatGregorian(date, lang);
  const hijri = formatHijri(date, lang);
  return `${gregorian} | ${hijri}`;
};

/**
 * Get today's date in YYYY-MM-DD format
 */
export const todayISO = () => new Date().toISOString().split('T')[0];

/**
 * Format time as HH:MM
 */
export const formatTime = (date) => {
  const d = date instanceof Date ? date : new Date(date);
  return d.toTimeString().slice(0, 5);
};

/**
 * Get current timestamp as HH:MM
 */
export const currentTime = () => formatTime(new Date());

export default { gregorianToHijri, formatHijri, formatGregorian, formatBothDates, todayISO, formatTime, currentTime };
