import {
  getMemorizedHizb,
  calcTotalHizbFromRecords,
  getHizbOfVerse,
  getJuzOfVerse,
  getCumulativeHizbAt,
  verifyHizbIntegrity,
  HIZB_BOUNDARIES,
  VERSE_TABLE,
} from './quranHizb.js';

// Complete Quran data: 114 Surahs with Arabic names, English names, and Ayah counts
export const SURAHS = [
  { id: 1,  nameAr: 'الفاتحة',      nameEn: 'Al-Fatiha',      ayahs: 7   },
  { id: 2,  nameAr: 'البقرة',       nameEn: 'Al-Baqarah',     ayahs: 286 },
  { id: 3,  nameAr: 'آل عمران',     nameEn: "Al-'Imran",      ayahs: 200 },
  { id: 4,  nameAr: 'النساء',       nameEn: "An-Nisa'",       ayahs: 176 },
  { id: 5,  nameAr: 'المائدة',      nameEn: "Al-Ma'idah",     ayahs: 120 },
  { id: 6,  nameAr: 'الأنعام',      nameEn: "Al-An'am",       ayahs: 165 },
  { id: 7,  nameAr: 'الأعراف',      nameEn: "Al-A'raf",       ayahs: 206 },
  { id: 8,  nameAr: 'الأنفال',      nameEn: 'Al-Anfal',       ayahs: 75  },
  { id: 9,  nameAr: 'التوبة',       nameEn: 'At-Tawbah',      ayahs: 129 },
  { id: 10, nameAr: 'يونس',         nameEn: 'Yunus',          ayahs: 109 },
  { id: 11, nameAr: 'هود',          nameEn: 'Hud',            ayahs: 123 },
  { id: 12, nameAr: 'يوسف',         nameEn: 'Yusuf',          ayahs: 111 },
  { id: 13, nameAr: 'الرعد',        nameEn: "Ar-Ra'd",        ayahs: 43  },
  { id: 14, nameAr: 'إبراهيم',      nameEn: 'Ibrahim',        ayahs: 52  },
  { id: 15, nameAr: 'الحجر',        nameEn: 'Al-Hijr',        ayahs: 99  },
  { id: 16, nameAr: 'النحل',        nameEn: 'An-Nahl',        ayahs: 128 },
  { id: 17, nameAr: 'الإسراء',      nameEn: "Al-Isra'",       ayahs: 111 },
  { id: 18, nameAr: 'الكهف',        nameEn: 'Al-Kahf',        ayahs: 110 },
  { id: 19, nameAr: 'مريم',         nameEn: 'Maryam',         ayahs: 98  },
  { id: 20, nameAr: 'طه',           nameEn: 'Ta-Ha',          ayahs: 135 },
  { id: 21, nameAr: 'الأنبياء',     nameEn: "Al-Anbiya'",     ayahs: 112 },
  { id: 22, nameAr: 'الحج',         nameEn: 'Al-Hajj',        ayahs: 78  },
  { id: 23, nameAr: 'المؤمنون',     nameEn: "Al-Mu'minun",    ayahs: 118 },
  { id: 24, nameAr: 'النور',        nameEn: 'An-Nur',         ayahs: 64  },
  { id: 25, nameAr: 'الفرقان',      nameEn: 'Al-Furqan',      ayahs: 77  },
  { id: 26, nameAr: 'الشعراء',      nameEn: "Ash-Shu'ara'",   ayahs: 227 },
  { id: 27, nameAr: 'النمل',        nameEn: 'An-Naml',        ayahs: 93  },
  { id: 28, nameAr: 'القصص',        nameEn: 'Al-Qasas',       ayahs: 88  },
  { id: 29, nameAr: 'العنكبوت',     nameEn: 'Al-Ankabut',     ayahs: 69  },
  { id: 30, nameAr: 'الروم',        nameEn: 'Ar-Rum',         ayahs: 60  },
  { id: 31, nameAr: 'لقمان',        nameEn: 'Luqman',         ayahs: 34  },
  { id: 32, nameAr: 'السجدة',       nameEn: 'As-Sajdah',      ayahs: 30  },
  { id: 33, nameAr: 'الأحزاب',      nameEn: 'Al-Ahzab',       ayahs: 73  },
  { id: 34, nameAr: 'سبأ',          nameEn: 'Saba',           ayahs: 54  },
  { id: 35, nameAr: 'فاطر',         nameEn: 'Fatir',          ayahs: 45  },
  { id: 36, nameAr: 'يس',           nameEn: 'Ya-Sin',         ayahs: 83  },
  { id: 37, nameAr: 'الصافات',      nameEn: 'As-Saffat',      ayahs: 182 },
  { id: 38, nameAr: 'ص',            nameEn: 'Sad',            ayahs: 88  },
  { id: 39, nameAr: 'الزمر',        nameEn: 'Az-Zumar',       ayahs: 75  },
  { id: 40, nameAr: 'غافر',         nameEn: 'Ghafir',         ayahs: 85  },
  { id: 41, nameAr: 'فصلت',         nameEn: 'Fussilat',       ayahs: 54  },
  { id: 42, nameAr: 'الشورى',       nameEn: 'Ash-Shura',      ayahs: 53  },
  { id: 43, nameAr: 'الزخرف',       nameEn: 'Az-Zukhruf',     ayahs: 89  },
  { id: 44, nameAr: 'الدخان',       nameEn: 'Ad-Dukhan',      ayahs: 59  },
  { id: 45, nameAr: 'الجاثية',      nameEn: 'Al-Jathiyah',    ayahs: 37  },
  { id: 46, nameAr: 'الأحقاف',      nameEn: 'Al-Ahqaf',       ayahs: 35  },
  { id: 47, nameAr: 'محمد',         nameEn: 'Muhammad',       ayahs: 38  },
  { id: 48, nameAr: 'الفتح',        nameEn: 'Al-Fath',        ayahs: 29  },
  { id: 49, nameAr: 'الحجرات',      nameEn: 'Al-Hujurat',     ayahs: 18  },
  { id: 50, nameAr: 'ق',            nameEn: 'Qaf',            ayahs: 45  },
  { id: 51, nameAr: 'الذاريات',     nameEn: 'Adh-Dhariyat',   ayahs: 60  },
  { id: 52, nameAr: 'الطور',        nameEn: 'At-Tur',         ayahs: 49  },
  { id: 53, nameAr: 'النجم',        nameEn: 'An-Najm',        ayahs: 62  },
  { id: 54, nameAr: 'القمر',        nameEn: 'Al-Qamar',       ayahs: 55  },
  { id: 55, nameAr: 'الرحمن',       nameEn: 'Ar-Rahman',      ayahs: 78  },
  { id: 56, nameAr: 'الواقعة',      nameEn: "Al-Waqi'ah",     ayahs: 96  },
  { id: 57, nameAr: 'الحديد',       nameEn: 'Al-Hadid',       ayahs: 29  },
  { id: 58, nameAr: 'المجادلة',     nameEn: 'Al-Mujadila',    ayahs: 22  },
  { id: 59, nameAr: 'الحشر',        nameEn: 'Al-Hashr',       ayahs: 24  },
  { id: 60, nameAr: 'الممتحنة',     nameEn: 'Al-Mumtahanah',  ayahs: 13  },
  { id: 61, nameAr: 'الصف',         nameEn: 'As-Saf',         ayahs: 14  },
  { id: 62, nameAr: 'الجمعة',       nameEn: "Al-Jumu'ah",     ayahs: 11  },
  { id: 63, nameAr: 'المنافقون',    nameEn: 'Al-Munafiqun',   ayahs: 11  },
  { id: 64, nameAr: 'التغابن',      nameEn: 'At-Taghabun',    ayahs: 18  },
  { id: 65, nameAr: 'الطلاق',       nameEn: 'At-Talaq',       ayahs: 12  },
  { id: 66, nameAr: 'التحريم',      nameEn: 'At-Tahrim',      ayahs: 12  },
  { id: 67, nameAr: 'الملك',        nameEn: 'Al-Mulk',        ayahs: 30  },
  { id: 68, nameAr: 'القلم',        nameEn: 'Al-Qalam',       ayahs: 52  },
  { id: 69, nameAr: 'الحاقة',       nameEn: 'Al-Haqqah',      ayahs: 52  },
  { id: 70, nameAr: 'المعارج',      nameEn: "Al-Ma'arij",     ayahs: 44  },
  { id: 71, nameAr: 'نوح',          nameEn: 'Nuh',            ayahs: 28  },
  { id: 72, nameAr: 'الجن',         nameEn: 'Al-Jinn',        ayahs: 28  },
  { id: 73, nameAr: 'المزمل',       nameEn: 'Al-Muzzammil',   ayahs: 20  },
  { id: 74, nameAr: 'المدثر',       nameEn: 'Al-Muddaththir', ayahs: 56  },
  { id: 75, nameAr: 'القيامة',      nameEn: 'Al-Qiyamah',     ayahs: 40  },
  { id: 76, nameAr: 'الإنسان',      nameEn: 'Al-Insan',       ayahs: 31  },
  { id: 77, nameAr: 'المرسلات',     nameEn: 'Al-Mursalat',    ayahs: 50  },
  { id: 78, nameAr: 'النبأ',        nameEn: "An-Naba'",       ayahs: 40  },
  { id: 79, nameAr: 'النازعات',     nameEn: "An-Nazi'at",     ayahs: 46  },
  { id: 80, nameAr: 'عبس',          nameEn: 'Abasa',          ayahs: 42  },
  { id: 81, nameAr: 'التكوير',      nameEn: 'At-Takwir',      ayahs: 29  },
  { id: 82, nameAr: 'الانفطار',     nameEn: 'Al-Infitar',     ayahs: 19  },
  { id: 83, nameAr: 'المطففين',     nameEn: 'Al-Mutaffifin',  ayahs: 36  },
  { id: 84, nameAr: 'الانشقاق',     nameEn: 'Al-Inshiqaq',    ayahs: 25  },
  { id: 85, nameAr: 'البروج',       nameEn: 'Al-Buruj',       ayahs: 22  },
  { id: 86, nameAr: 'الطارق',       nameEn: 'At-Tariq',       ayahs: 17  },
  { id: 87, nameAr: 'الأعلى',       nameEn: "Al-A'la",        ayahs: 19  },
  { id: 88, nameAr: 'الغاشية',      nameEn: 'Al-Ghashiyah',   ayahs: 26  },
  { id: 89, nameAr: 'الفجر',        nameEn: 'Al-Fajr',        ayahs: 30  },
  { id: 90, nameAr: 'البلد',        nameEn: 'Al-Balad',       ayahs: 20  },
  { id: 91, nameAr: 'الشمس',        nameEn: 'Ash-Shams',      ayahs: 15  },
  { id: 92, nameAr: 'الليل',        nameEn: 'Al-Layl',        ayahs: 21  },
  { id: 93, nameAr: 'الضحى',        nameEn: 'Ad-Duha',        ayahs: 11  },
  { id: 94, nameAr: 'الشرح',        nameEn: 'Ash-Sharh',      ayahs: 8   },
  { id: 95, nameAr: 'التين',        nameEn: 'At-Tin',         ayahs: 8   },
  { id: 96, nameAr: 'العلق',        nameEn: 'Al-Alaq',        ayahs: 19  },
  { id: 97, nameAr: 'القدر',        nameEn: 'Al-Qadr',        ayahs: 5   },
  { id: 98, nameAr: 'البينة',       nameEn: 'Al-Bayyinah',    ayahs: 8   },
  { id: 99, nameAr: 'الزلزلة',      nameEn: 'Az-Zalzalah',    ayahs: 8   },
  { id: 100, nameAr: 'العاديات',    nameEn: 'Al-Adiyat',      ayahs: 11  },
  { id: 101, nameAr: 'القارعة',     nameEn: "Al-Qari'ah",     ayahs: 11  },
  { id: 102, nameAr: 'التكاثر',     nameEn: 'At-Takathur',    ayahs: 8   },
  { id: 103, nameAr: 'العصر',       nameEn: 'Al-Asr',         ayahs: 3   },
  { id: 104, nameAr: 'الهمزة',      nameEn: 'Al-Humazah',     ayahs: 9   },
  { id: 105, nameAr: 'الفيل',       nameEn: 'Al-Fil',         ayahs: 5   },
  { id: 106, nameAr: 'قريش',        nameEn: 'Quraysh',        ayahs: 4   },
  { id: 107, nameAr: 'الماعون',     nameEn: "Al-Ma'un",       ayahs: 7   },
  { id: 108, nameAr: 'الكوثر',      nameEn: 'Al-Kawthar',     ayahs: 3   },
  { id: 109, nameAr: 'الكافرون',    nameEn: 'Al-Kafirun',     ayahs: 6   },
  { id: 110, nameAr: 'النصر',       nameEn: 'An-Nasr',        ayahs: 3   },
  { id: 111, nameAr: 'المسد',       nameEn: 'Al-Masad',       ayahs: 5   },
  { id: 112, nameAr: 'الإخلاص',     nameEn: 'Al-Ikhlas',      ayahs: 4   },
  { id: 113, nameAr: 'الفلق',       nameEn: 'Al-Falaq',       ayahs: 5   },
  { id: 114, nameAr: 'الناس',       nameEn: 'An-Nas',         ayahs: 6   },
];

export const TOTAL_AYAHS = SURAHS.reduce((sum, s) => sum + s.ayahs, 0); // 6236
export const TOTAL_HIZBS = 60;
export const AYAHS_PER_HIZB = TOTAL_AYAHS / TOTAL_HIZBS; // ~103.93 (kept for reference)

// ---------------------------------------------------------------------------
// Accurate Hizb engine (imported at top of file)
// ---------------------------------------------------------------------------
export {
  getMemorizedHizb,
  calcTotalHizbFromRecords,
  getHizbOfVerse,
  getJuzOfVerse,
  getCumulativeHizbAt,
  verifyHizbIntegrity,
  HIZB_BOUNDARIES,
  VERSE_TABLE,
};

// ---------------------------------------------------------------------------
// Backward-compatible helpers (preserve existing call signatures)
// ---------------------------------------------------------------------------

export const getCumulativeAyahsBefore = (surahId) =>
  SURAHS.slice(0, surahId - 1).reduce((sum, s) => sum + s.ayahs, 0);

/**
 * calcHizbProgress(surahId, fromAyah, toAyah)
 * Kept as a 3-arg wrapper — start and end verse are within the same surah.
 * Old formula used a global average (÷103.93); now uses accurate Hizb weights.
 */
export const calcHizbProgress = (surahId, fromAyah, toAyah) =>
  getMemorizedHizb(surahId, fromAyah, surahId, toAyah);

/**
 * calcTotalHizbProgress(records)
 * records: Array<{ surahId, fromAyah, toAyah }>
 * Drop-in replacement — deduplicates overlapping ranges, caps at 60.
 */
export const calcTotalHizbProgress = calcTotalHizbFromRecords;

export const getSurahById = (id) => SURAHS.find(s => s.id === id);
export const getSurahName = (id, lang = 'ar') =>
  lang === 'ar' ? SURAHS[id - 1]?.nameAr : SURAHS[id - 1]?.nameEn;
